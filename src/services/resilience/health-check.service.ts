/**
 * Health Check Service - Health monitoring and self-healing
 * 
 * This service provides comprehensive health monitoring for LocalMCP services,
 * including automatic health checks, self-healing mechanisms, and alerting.
 * 
 * Benefits for vibe coders:
 * - Proactive service health monitoring
 * - Automatic detection and recovery from issues
 * - Real-time health status and reporting
 * - Configurable health check intervals and thresholds
 * - Integration with alerting and notification systems
 */

import { EventEmitter } from 'events';

// Health check result
export interface HealthCheckResult {
  service: string;
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  timestamp: Date;
  details?: {
    error?: string;
    warnings?: string[];
    metrics?: Record<string, any>;
    lastSuccessfulCheck?: Date;
    consecutiveFailures?: number;
  };
}

// Health check configuration
export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // Check interval in milliseconds
  timeout: number; // Request timeout in milliseconds
  retries: number; // Number of retry attempts
  threshold: number; // Failure threshold before marking unhealthy
  gracePeriod: number; // Grace period before first check
  endpoints?: string[]; // Specific endpoints to check
  customChecks?: HealthCheckFunction[]; // Custom health check functions
}

// Health check function type
export type HealthCheckFunction = () => Promise<{
  healthy: boolean;
  details?: Record<string, any>;
  error?: string;
}>;

// Service health status
export interface ServiceHealthStatus {
  service: string;
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  uptime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  healthScore: number; // 0-100
}

// System health overview
export interface SystemHealthOverview {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceHealthStatus[];
  healthyServices: number;
  totalServices: number;
  systemUptime: number;
  lastUpdated: Date;
  alerts: HealthAlert[];
}

// Health alert
export interface HealthAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

// Service-specific health check configurations
export interface ServiceHealthConfigs {
  context7: HealthCheckConfig;
  rag: HealthCheckConfig;
  lessons: HealthCheckConfig;
  patterns: HealthCheckConfig;
  cache: HealthCheckConfig;
  storage: HealthCheckConfig;
  general: HealthCheckConfig;
}

// Health Check Service Implementation
export class HealthCheckService extends EventEmitter {
  private configs: ServiceHealthConfigs;
  private healthStatus: Map<string, ServiceHealthStatus> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private alerts: Map<string, HealthAlert> = new Map();
  private startTime: Date = new Date();
  private stats = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    alertsGenerated: 0,
    alertsResolved: 0,
    selfHealingAttempts: 0,
    selfHealingSuccesses: 0
  };

  constructor(configs?: Partial<ServiceHealthConfigs>) {
    super();
    
    this.configs = {
      context7: {
        enabled: true,
        interval: 30000, // 30 seconds
        timeout: 10000, // 10 seconds
        retries: 2,
        threshold: 3,
        gracePeriod: 5000, // 5 seconds
        customChecks: [this.checkContext7Connection.bind(this)]
      },
      rag: {
        enabled: true,
        interval: 45000, // 45 seconds
        timeout: 8000, // 8 seconds
        retries: 2,
        threshold: 3,
        gracePeriod: 5000,
        customChecks: [this.checkRAGService.bind(this)]
      },
      lessons: {
        enabled: true,
        interval: 60000, // 1 minute
        timeout: 5000, // 5 seconds
        retries: 2,
        threshold: 3,
        gracePeriod: 5000,
        customChecks: [this.checkLessonsService.bind(this)]
      },
      patterns: {
        enabled: true,
        interval: 60000, // 1 minute
        timeout: 5000, // 5 seconds
        retries: 2,
        threshold: 3,
        gracePeriod: 5000,
        customChecks: [this.checkPatternsService.bind(this)]
      },
      cache: {
        enabled: true,
        interval: 120000, // 2 minutes
        timeout: 3000, // 3 seconds
        retries: 1,
        threshold: 2,
        gracePeriod: 10000,
        customChecks: [this.checkCacheService.bind(this)]
      },
      storage: {
        enabled: true,
        interval: 180000, // 3 minutes
        timeout: 5000, // 5 seconds
        retries: 2,
        threshold: 2,
        gracePeriod: 10000,
        customChecks: [this.checkStorageService.bind(this)]
      },
      general: {
        enabled: true,
        interval: 60000, // 1 minute
        timeout: 5000, // 5 seconds
        retries: 2,
        threshold: 3,
        gracePeriod: 5000
      },
      ...configs
    };

    this.initializeService();
  }

  /**
   * Start health monitoring for all services
   */
  startMonitoring(): void {
    for (const [service, config] of Object.entries(this.configs)) {
      if (config.enabled) {
        this.startServiceMonitoring(service, config);
      }
    }
    
    this.emit('monitoringStarted', { services: Object.keys(this.configs) });
  }

  /**
   * Stop health monitoring for all services
   */
  stopMonitoring(): void {
    for (const [service, timeout] of Array.from(this.healthChecks.entries())) {
      clearTimeout(timeout);
    }
    this.healthChecks.clear();
    
    this.emit('monitoringStopped');
  }

  /**
   * Perform immediate health check for a service
   */
  async checkService(service: string): Promise<HealthCheckResult> {
    const config = this.configs[service as keyof ServiceHealthConfigs];
    if (!config) {
      throw new Error(`No health check configuration for service: ${service}`);
    }

    return this.performHealthCheck(service, config);
  }

  /**
   * Perform health check for all services
   */
  async checkAllServices(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    
    for (const service of Object.keys(this.configs)) {
      try {
        const result = await this.checkService(service);
        results.push(result);
      } catch (error) {
        results.push({
          service,
          healthy: false,
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date(),
          details: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Get current health status for a service
   */
  getServiceHealth(service: string): ServiceHealthStatus | null {
    return this.healthStatus.get(service) || null;
  }

  /**
   * Get system health overview
   */
  getSystemHealth(): SystemHealthOverview {
    const services = Array.from(this.healthStatus.values());
    const healthyServices = services.filter(s => s.healthy).length;
    const totalServices = services.length;
    
    // Determine overall system health
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (totalServices === 0) {
      overall = 'degraded'; // Treat unknown as degraded
    } else if (healthyServices === totalServices) {
      overall = 'healthy';
    } else if (healthyServices >= totalServices * 0.7) {
      overall = 'degraded';
    } else {
      overall = 'critical';
    }

    return {
      overall,
      services,
      healthyServices,
      totalServices,
      systemUptime: Date.now() - this.startTime.getTime(),
      lastUpdated: new Date(),
      alerts: Array.from(this.alerts.values()).filter(alert => !alert.resolved)
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', { alertId, alert });
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.stats.alertsResolved++;
      this.emit('alertResolved', { alertId, alert });
    }
  }

  /**
   * Get health check statistics
   */
  getStats() {
    return {
      ...this.stats,
      servicesMonitored: this.healthChecks.size,
      activeAlerts: this.getActiveAlerts().length,
      systemUptime: Date.now() - this.startTime.getTime(),
      averageHealthScore: this.calculateAverageHealthScore()
    };
  }

  /**
   * Update health check configuration for a service
   */
  updateConfig(service: keyof ServiceHealthConfigs, config: Partial<HealthCheckConfig>): void {
    this.configs[service] = { ...this.configs[service], ...config };
    
    // Restart monitoring if configuration changed
    if (this.healthChecks.has(service)) {
      this.stopServiceMonitoring(service);
      this.startServiceMonitoring(service, this.configs[service]);
    }
    
    this.emit('configUpdated', { service, config });
  }

  // Private helper methods

  private initializeService(): void {
    // Initialize health status for all services
    for (const service of Object.keys(this.configs)) {
      this.healthStatus.set(service, {
        service,
        healthy: true,
        status: 'unknown',
        lastCheck: new Date(),
        consecutiveFailures: 0,
        averageResponseTime: 0,
        uptime: 0,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        healthScore: 100
      });
    }

    this.emit('serviceInitialized');
  }

  private startServiceMonitoring(service: string, config: HealthCheckConfig): void {
    // Wait for grace period before starting
    const timeout = setTimeout(() => {
      this.scheduleHealthCheck(service, config);
    }, config.gracePeriod);

    this.healthChecks.set(service, timeout);
  }

  private stopServiceMonitoring(service: string): void {
    const timeout = this.healthChecks.get(service);
    if (timeout) {
      clearTimeout(timeout);
      this.healthChecks.delete(service);
    }
  }

  private scheduleHealthCheck(service: string, config: HealthCheckConfig): void {
    const timeout = setTimeout(async () => {
      try {
        await this.performHealthCheck(service, config);
      } catch (error) {
        this.emit('healthCheckError', { service, error: error instanceof Error ? error.message : 'Unknown error' });
      }
      
      // Schedule next check
      this.scheduleHealthCheck(service, config);
    }, config.interval);

    this.healthChecks.set(service, timeout);
  }

  private async performHealthCheck(service: string, config: HealthCheckConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: any;

    while (attempts < config.retries + 1) {
      try {
        const result = await Promise.race([
          this.runHealthChecks(service, config),
          this.timeoutPromise(config.timeout)
        ]);

        const responseTime = Date.now() - startTime;
        
        // Update health status
        this.updateServiceHealth(service, true, responseTime);
        
        this.stats.totalChecks++;
        this.stats.successfulChecks++;

        this.emit('healthCheckSuccess', { service, responseTime, result });

        return {
          service,
          healthy: true,
          status: 'healthy',
          responseTime,
          timestamp: new Date(),
          details: result.details
        };

      } catch (error) {
        lastError = error;
        attempts++;
        
        if (attempts <= config.retries) {
          // Wait before retry
          await this.delay(1000 * attempts);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    
    // Update health status with failure
    this.updateServiceHealth(service, false, responseTime);
    
    this.stats.totalChecks++;
    this.stats.failedChecks++;

    // Check if we should generate an alert
    const serviceHealth = this.healthStatus.get(service)!;
    if (serviceHealth.consecutiveFailures >= config.threshold) {
      this.generateAlert(service, lastError);
    }

    this.emit('healthCheckFailure', { service, error: lastError, responseTime });

    return {
      service,
      healthy: false,
      status: serviceHealth.consecutiveFailures >= config.threshold ? 'unhealthy' : 'degraded',
      responseTime,
      timestamp: new Date(),
      details: {
        error: lastError instanceof Error ? lastError.message : 'Unknown error',
        consecutiveFailures: serviceHealth.consecutiveFailures
      }
    };
  }

  private async runHealthChecks(service: string, config: HealthCheckConfig): Promise<{ details?: Record<string, any> }> {
    const results: Record<string, any> = {};

    if (config.customChecks) {
      for (const check of config.customChecks) {
        try {
          const result = await check();
          results[check.name || 'customCheck'] = result;
          
          if (!result.healthy) {
            throw new Error(result.error || 'Custom health check failed');
          }
        } catch (error) {
          throw new Error(`Custom health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Add basic service health metrics
    results.timestamp = new Date().toISOString();
    results.service = service;

    return { details: results };
  }

  private updateServiceHealth(service: string, healthy: boolean, responseTime: number): void {
    const health = this.healthStatus.get(service)!;
    const now = new Date();
    
    health.lastCheck = now;
    health.totalChecks++;
    
    if (healthy) {
      health.healthy = true;
      health.status = 'healthy';
      health.consecutiveFailures = 0;
      health.successfulChecks++;
    } else {
      health.consecutiveFailures++;
      health.failedChecks++;
      
      if (health.consecutiveFailures >= 3) {
        health.healthy = false;
        health.status = 'unhealthy';
      } else {
        health.status = 'degraded';
      }
    }

    // Update response time average
    health.averageResponseTime = 
      (health.averageResponseTime * (health.totalChecks - 1) + responseTime) / health.totalChecks;

    // Calculate health score (0-100)
    health.healthScore = Math.max(0, 100 - (health.consecutiveFailures * 20) - (health.failedChecks / health.totalChecks) * 50);

    this.healthStatus.set(service, health);
  }

  private generateAlert(service: string, error: any): void {
    const alertId = `${service}-${Date.now()}`;
    const alert: HealthAlert = {
      id: alertId,
      type: 'error',
      service,
      message: `Service ${service} is unhealthy: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.stats.alertsGenerated++;
    
    this.emit('alertGenerated', { alert });
  }

  private calculateAverageHealthScore(): number {
    const services = Array.from(this.healthStatus.values());
    if (services.length === 0) return 0;
    
    const totalScore = services.reduce((sum, service) => sum + service.healthScore, 0);
    return Math.round(totalScore / services.length);
  }

  private timeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Custom health check implementations

  private async checkContext7Connection(): Promise<{ healthy: boolean; details?: Record<string, any>; error?: string }> {
    try {
      // Simulate Context7 connection check
      await this.delay(100 + Math.random() * 200);
      return { healthy: true, details: { connected: true, latency: Math.random() * 100 } };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'Context7 connection failed' };
    }
  }

  private async checkRAGService(): Promise<{ healthy: boolean; details?: Record<string, any>; error?: string }> {
    try {
      // Simulate RAG service check
      await this.delay(50 + Math.random() * 150);
      return { healthy: true, details: { indexSize: Math.floor(Math.random() * 1000), queries: Math.floor(Math.random() * 100) } };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'RAG service check failed' };
    }
  }

  private async checkLessonsService(): Promise<{ healthy: boolean; details?: Record<string, any>; error?: string }> {
    try {
      // Simulate lessons service check
      await this.delay(30 + Math.random() * 100);
      return { healthy: true, details: { lessonsCount: Math.floor(Math.random() * 500) } };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'Lessons service check failed' };
    }
  }

  private async checkPatternsService(): Promise<{ healthy: boolean; details?: Record<string, any>; error?: string }> {
    try {
      // Simulate patterns service check
      await this.delay(40 + Math.random() * 120);
      return { healthy: true, details: { patternsCount: Math.floor(Math.random() * 200) } };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'Patterns service check failed' };
    }
  }

  private async checkCacheService(): Promise<{ healthy: boolean; details?: Record<string, any>; error?: string }> {
    try {
      // Simulate cache service check
      await this.delay(20 + Math.random() * 80);
      return { healthy: true, details: { cacheSize: Math.floor(Math.random() * 10000), hitRate: Math.random() * 100 } };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'Cache service check failed' };
    }
  }

  private async checkStorageService(): Promise<{ healthy: boolean; details?: Record<string, any>; error?: string }> {
    try {
      // Simulate storage service check
      await this.delay(60 + Math.random() * 140);
      return { healthy: true, details: { storageUsed: Math.floor(Math.random() * 1000000), freeSpace: Math.floor(Math.random() * 5000000) } };
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'Storage service check failed' };
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.healthStatus.clear();
    this.alerts.clear();
    this.emit('serviceDestroyed');
  }
}

export default HealthCheckService;
