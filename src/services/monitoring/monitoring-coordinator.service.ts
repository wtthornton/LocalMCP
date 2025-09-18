/**
 * Monitoring Coordinator Service - Unified monitoring and alerting system
 * 
 * This service coordinates all monitoring capabilities for LocalMCP,
 * providing a unified interface for performance monitoring, alerting, and analytics.
 * 
 * Benefits for vibe coders:
 * - Unified monitoring dashboard and interface
 * - Real-time performance insights and alerts
 * - Simple configuration and setup
 * - Comprehensive analytics and reporting
 * - Proactive issue detection and notification
 * - Easy integration with existing services
 * 
 * Based on industry best practices from:
 * - Grafana (monitoring and visualization)
 * - Prometheus (metrics collection)
 * - New Relic (APM and monitoring)
 * - DataDog (infrastructure monitoring)
 */

import { EventEmitter } from 'events';
import PerformanceMonitorService, { PerformanceStats, PerformanceAlert, AlertSeverity } from './performance-monitor.service';
import AlertingService, { AlertAnalytics, NotificationChannel } from './alerting.service';

// Monitoring configuration
export interface MonitoringConfig {
  enabled: boolean;
  performanceMonitoring: boolean;
  alerting: boolean;
  dashboard: boolean;
  analytics: boolean;
  updateInterval: number; // milliseconds
  retentionPeriod: number; // milliseconds
}

// Monitoring dashboard data
export interface DashboardData {
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'critical' | 'unknown';
      responseTime: number;
      lastCheck: Date;
    }>;
  };
  performanceMetrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      rate: number; // per second
    };
    responseTime: {
      average: number;
      p95: number;
      p99: number;
    };
    resources: {
      memory: number; // percentage
      cpu: number; // percentage
      disk: number; // percentage
    };
  };
  alerts: {
    active: number;
    resolved: number;
    critical: number;
    recent: PerformanceAlert[];
  };
  trends: {
    responseTime: 'increasing' | 'decreasing' | 'stable';
    throughput: 'increasing' | 'decreasing' | 'stable';
    errorRate: 'increasing' | 'decreasing' | 'stable';
  };
}

// Monitoring Coordinator Service Implementation
export class MonitoringCoordinatorService extends EventEmitter {
  private performanceMonitor: PerformanceMonitorService;
  private alertingService: AlertingService;
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private updateTimer?: NodeJS.Timeout;
  private services: Map<string, any> = new Map();

  constructor(config?: Partial<MonitoringConfig>) {
    super();
    
    // Initialize services
    this.performanceMonitor = new PerformanceMonitorService();
    this.alertingService = new AlertingService();
    
    // Set default configuration
    this.config = {
      enabled: true,
      performanceMonitoring: true,
      alerting: true,
      dashboard: true,
      analytics: true,
      updateInterval: 5000, // 5 seconds
      retentionPeriod: 24 * 60 * 60 * 1000 // 24 hours
    };

    // Merge with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Set up event forwarding
    this.setupEventForwarding();
  }

  /**
   * Start the monitoring coordinator service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    try {
      // Start performance monitoring
      if (this.config.performanceMonitoring) {
        await this.performanceMonitor.start();
      }

      // Start alerting service
      if (this.config.alerting) {
        await this.alertingService.start();
      }

      // Start update timer
      this.startUpdateTimer();

      this.emit('monitoringStarted');
    } catch (error) {
      this.isRunning = false;
      this.emit('startupError', { error });
      throw error;
    }
  }

  /**
   * Stop the monitoring coordinator service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Stop update timer
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    // Stop services
    this.performanceMonitor.stop();
    this.alertingService.stop();

    this.emit('monitoringStopped');
  }

  /**
   * Register a service for monitoring
   */
  registerService(serviceName: string, service: any): void {
    this.services.set(serviceName, service);
    this.emit('serviceRegistered', { serviceName });
  }

  /**
   * Unregister a service from monitoring
   */
  unregisterService(serviceName: string): void {
    this.services.delete(serviceName);
    this.emit('serviceUnregistered', { serviceName });
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Parameters<PerformanceMonitorService['recordMetric']>[0]): void {
    if (this.config.performanceMonitoring) {
      this.performanceMonitor.recordMetric(metric);
    }
  }

  /**
   * Record a request with timing
   */
  recordRequest(success: boolean, responseTime: number, tags?: Record<string, string>): void {
    if (this.config.performanceMonitoring) {
      this.performanceMonitor.recordRequest(success, responseTime, tags);
    }
  }

  /**
   * Record system resource usage
   */
  recordSystemMetrics(memoryUsage: number, cpuUsage: number, diskUsage: number): void {
    if (this.config.performanceMonitoring) {
      this.performanceMonitor.recordSystemMetrics(memoryUsage, cpuUsage, diskUsage);
    }
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return this.performanceMonitor.getStats();
  }

  /**
   * Get performance metrics
   */
  getMetrics(metricName: string, limit?: number) {
    return this.performanceMonitor.getMetrics(metricName, limit);
  }

  /**
   * Get performance trends
   */
  getTrends(metricName: string, duration?: number) {
    return this.performanceMonitor.getTrends(metricName, duration);
  }

  /**
   * Get active alerts
   */
  getAlerts(): PerformanceAlert[] {
    return this.performanceMonitor.getAlerts();
  }

  /**
   * Get alert analytics
   */
  getAlertAnalytics(): AlertAnalytics {
    return this.alertingService.getAnalytics();
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const resolved = this.performanceMonitor.resolveAlert(alertId);
    if (resolved) {
      this.emit('alertResolved', { alertId });
    }
    return resolved;
  }

  /**
   * Get dashboard data
   */
  getDashboardData(): DashboardData {
    const stats = this.getPerformanceStats();
    const alerts = this.getAlerts();
    const alertAnalytics = this.getAlertAnalytics();

    // Calculate system health status
    const systemHealth = this.calculateSystemHealth(stats, alerts);

    // Calculate performance metrics
    const performanceMetrics = {
      requests: {
        total: stats.totalRequests,
        successful: stats.successfulRequests,
        failed: stats.failedRequests,
        rate: stats.throughput
      },
      responseTime: {
        average: stats.averageResponseTime,
        p95: stats.p95ResponseTime,
        p99: stats.p99ResponseTime
      },
      resources: {
        memory: stats.memoryUsage,
        cpu: stats.cpuUsage,
        disk: stats.diskUsage
      }
    };

    // Calculate alerts summary
    const alertsSummary = {
      active: alerts.length,
      resolved: alertAnalytics.resolvedAlerts,
      critical: alerts.filter(alert => alert.severity === 'critical').length,
      recent: alerts.slice(-10) // Last 10 alerts
    };

    // Calculate trends
    const trends = {
      responseTime: this.performanceMonitor.getTrends('request_response_time').trend,
      throughput: this.performanceMonitor.getTrends('request_throughput').trend,
      errorRate: (stats.errorRate > 5 ? 'increasing' : stats.errorRate < 1 ? 'decreasing' : 'stable') as 'increasing' | 'decreasing' | 'stable'
    };

    return {
      systemHealth,
      performanceMetrics,
      alerts: alertsSummary,
      trends
    };
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Set up event forwarding between services
   */
  private setupEventForwarding(): void {
    // Forward performance monitor events
    this.performanceMonitor.on('alertCreated', (data) => {
      if (this.config.alerting) {
        this.alertingService.processAlert(data.alert);
      }
      this.emit('alertCreated', data);
    });

    this.performanceMonitor.on('metricRecorded', (data) => {
      this.emit('metricRecorded', data);
    });

    this.performanceMonitor.on('requestRecorded', (data) => {
      this.emit('requestRecorded', data);
    });

    // Forward alerting service events
    this.alertingService.on('notificationSent', (data) => {
      this.emit('notificationSent', data);
    });

    this.alertingService.on('notificationError', (data) => {
      this.emit('notificationError', data);
    });
  }

  /**
   * Start update timer
   */
  private startUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      await this.performUpdate();
    }, this.config.updateInterval);
  }

  /**
   * Perform periodic update
   */
  private async performUpdate(): Promise<void> {
    try {
      // Update system metrics
      await this.updateSystemMetrics();
      
      // Clean up old data
      this.cleanupOldData();
      
      this.emit('updateCompleted');
    } catch (error) {
      this.emit('updateError', { error });
    }
  }

  /**
   * Update system metrics
   */
  private async updateSystemMetrics(): Promise<void> {
    try {
      // Get memory usage
      const memUsage = process.memoryUsage();
      const memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      // Get CPU usage (simplified)
      const cpuUsage = await this.getCpuUsage();

      // Get disk usage (simplified)
      const diskUsage = await this.getDiskUsage();

      this.recordSystemMetrics(memoryUsage, cpuUsage, diskUsage);
    } catch (error) {
      this.emit('systemMetricsError', { error });
    }
  }

  /**
   * Get CPU usage (simplified implementation)
   */
  private async getCpuUsage(): Promise<number> {
    // Simplified CPU usage calculation
    return Math.random() * 100; // Placeholder
  }

  /**
   * Get disk usage (simplified implementation)
   */
  private async getDiskUsage(): Promise<number> {
    // Simplified disk usage calculation
    return Math.random() * 100; // Placeholder
  }

  /**
   * Calculate system health status
   */
  private calculateSystemHealth(stats: PerformanceStats, alerts: PerformanceAlert[]): DashboardData['systemHealth'] {
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
    const errorAlerts = alerts.filter(alert => alert.severity === 'error').length;
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (criticalAlerts > 0 || stats.errorRate > 10 || stats.memoryUsage > 90 || stats.cpuUsage > 90) {
      status = 'critical';
    } else if (errorAlerts > 0 || stats.errorRate > 5 || stats.memoryUsage > 80 || stats.cpuUsage > 80) {
      status = 'degraded';
    }

    // Get service statuses
    const services = Array.from(this.services.entries()).map(([name, service]) => ({
      name,
      status: this.getServiceStatus(service),
      responseTime: 0, // Simplified
      lastCheck: new Date()
    }));

    return {
      status,
      uptime: stats.uptime,
      services
    };
  }

  /**
   * Get service status (simplified)
   */
  private getServiceStatus(service: any): 'healthy' | 'degraded' | 'critical' | 'unknown' {
    // Simplified service status check
    if (service && typeof service.getStatus === 'function') {
      return service.getStatus();
    }
    return 'unknown';
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    // Clean up old metrics (this would be implemented in the performance monitor)
    // For now, we'll just emit an event
    this.emit('dataCleanup', { cutoff: new Date(cutoff) });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.performanceMonitor.destroy();
    this.alertingService.destroy();
    this.removeAllListeners();
    this.emit('serviceDestroyed');
  }
}

export default MonitoringCoordinatorService;
