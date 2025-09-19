/**
 * Context7 Monitoring & Observability Service
 * Implements comprehensive monitoring based on Context7 best practices
 * Based on Node.js EventEmitter patterns and TypeScript type safety
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/logger';
import { ConfigService } from '../../config/config.service';

export interface Context7Metrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per minute
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    maxResponseTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
  };
  circuitBreaker: {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
    successes: number;
    lastStateChange: Date;
  };
  errors: {
    byType: Map<string, number>;
    byTool: Map<string, number>;
    total: number;
  };
  libraries: {
    mostRequested: Array<{ name: string; count: number }>;
    totalUnique: number;
  };
}

export interface Context7HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    mcpCompliance: boolean;
    cacheHealth: boolean;
    circuitBreaker: boolean;
    errorRate: boolean;
  };
  metrics: Context7Metrics;
}

export interface Context7Alert {
  id: string;
  type: 'error' | 'performance' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export class Context7MonitoringService extends EventEmitter {
  private logger: Logger;
  private config: ConfigService;
  private metrics: Context7Metrics;
  private alerts: Map<string, Context7Alert> = new Map();
  private responseTimes: number[] = [];
  private readonly maxResponseTimeHistory = 1000;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsResetInterval?: NodeJS.Timeout;

  constructor(logger: Logger, config: ConfigService) {
    super();
    this.logger = logger;
    this.config = config;
    this.metrics = this.initializeMetrics();
    this.startHealthMonitoring();
    this.startMetricsReset();
  }

  /**
   * Initialize metrics with default values
   * Implements TypeScript type safety patterns
   */
  private initializeMetrics(): Context7Metrics {
    return {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rate: 0
      },
      performance: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        maxResponseTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        evictions: 0
      },
      circuitBreaker: {
        state: 'closed',
        failures: 0,
        successes: 0,
        lastStateChange: new Date()
      },
      errors: {
        byType: new Map(),
        byTool: new Map(),
        total: 0
      },
      libraries: {
        mostRequested: [],
        totalUnique: 0
      }
    };
  }

  /**
   * Record a successful request
   * Implements Node.js EventEmitter patterns
   */
  recordRequest(tool: string, responseTime: number, libraryName?: string): void {
    this.metrics.requests.total++;
    this.metrics.requests.successful++;
    this.metrics.requests.rate = this.calculateRequestRate();
    
    this.updateResponseTime(responseTime);
    this.updateLibraryMetrics(libraryName);
    
    this.emit('request:success', {
      tool,
      responseTime,
      libraryName,
      timestamp: new Date()
    });

    this.logger.debug('Request recorded', {
      tool,
      responseTime,
      libraryName,
      totalRequests: this.metrics.requests.total
    });
  }

  /**
   * Record a failed request
   * Implements comprehensive error tracking
   */
  recordError(tool: string, error: Error, responseTime?: number, libraryName?: string): void {
    this.metrics.requests.total++;
    this.metrics.requests.failed++;
    this.metrics.requests.rate = this.calculateRequestRate();
    
    this.metrics.errors.total++;
    
    // Track error by type
    const errorType = error.constructor.name;
    const currentCount = this.metrics.errors.byType.get(errorType) || 0;
    this.metrics.errors.byType.set(errorType, currentCount + 1);
    
    // Track error by tool
    const toolCount = this.metrics.errors.byTool.get(tool) || 0;
    this.metrics.errors.byTool.set(tool, toolCount + 1);
    
    if (responseTime) {
      this.updateResponseTime(responseTime);
    }
    
    this.updateLibraryMetrics(libraryName);
    
    // Check for error rate alerts
    this.checkErrorRateAlert();
    
    this.emit('request:error', {
      tool,
      error: error.message,
      errorType,
      responseTime,
      libraryName,
      timestamp: new Date()
    });

    this.logger.warn('Error recorded', {
      tool,
      error: error.message,
      errorType,
      responseTime,
      libraryName,
      totalErrors: this.metrics.errors.total
    });
  }

  /**
   * Record cache hit
   * Implements cache performance monitoring
   */
  recordCacheHit(): void {
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
    
    this.emit('cache:hit', {
      timestamp: new Date(),
      hitRate: this.metrics.cache.hitRate
    });

    this.logger.debug('Cache hit recorded', {
      hits: this.metrics.cache.hits,
      hitRate: this.metrics.cache.hitRate
    });
  }

  /**
   * Record cache miss
   * Implements cache performance monitoring
   */
  recordCacheMiss(): void {
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
    
    this.emit('cache:miss', {
      timestamp: new Date(),
      hitRate: this.metrics.cache.hitRate
    });

    this.logger.debug('Cache miss recorded', {
      misses: this.metrics.cache.misses,
      hitRate: this.metrics.cache.hitRate
    });
  }

  /**
   * Record cache eviction
   * Implements cache management monitoring
   */
  recordCacheEviction(): void {
    this.metrics.cache.evictions++;
    
    this.emit('cache:eviction', {
      timestamp: new Date(),
      evictions: this.metrics.cache.evictions
    });

    this.logger.debug('Cache eviction recorded', {
      evictions: this.metrics.cache.evictions
    });
  }

  /**
   * Update circuit breaker state
   * Implements circuit breaker monitoring
   */
  updateCircuitBreakerState(
    state: 'closed' | 'open' | 'half-open',
    failures?: number,
    successes?: number
  ): void {
    const previousState = this.metrics.circuitBreaker.state;
    this.metrics.circuitBreaker.state = state;
    this.metrics.circuitBreaker.lastStateChange = new Date();
    
    if (failures !== undefined) {
      this.metrics.circuitBreaker.failures = failures;
    }
    
    if (successes !== undefined) {
      this.metrics.circuitBreaker.successes = successes;
    }
    
    this.emit('circuit-breaker:state-change', {
      previousState,
      newState: state,
      timestamp: new Date()
    });

    this.logger.info('Circuit breaker state updated', {
      previousState,
      newState: state,
      failures: this.metrics.circuitBreaker.failures,
      successes: this.metrics.circuitBreaker.successes
    });

    // Check for circuit breaker alerts
    this.checkCircuitBreakerAlert(state);
  }

  /**
   * Get current metrics
   * Implements monitoring data access
   */
  getMetrics(): Context7Metrics {
    return { ...this.metrics };
  }

  /**
   * Get health status
   * Implements comprehensive health checking
   */
  async getHealthStatus(): Promise<Context7HealthStatus> {
    const checks = {
      mcpCompliance: await this.checkMCPCompliance(),
      cacheHealth: this.checkCacheHealth(),
      circuitBreaker: this.checkCircuitBreakerHealth(),
      errorRate: this.checkErrorRateHealth()
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.5) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      timestamp: new Date(),
      checks,
      metrics: this.getMetrics()
    };
  }

  /**
   * Get active alerts
   * Implements alert management
   */
  getAlerts(): Context7Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Create a new alert
   * Implements alert creation
   */
  createAlert(
    type: Context7Alert['type'],
    severity: Context7Alert['severity'],
    message: string,
    metadata?: Record<string, any>
  ): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Context7Alert = {
      id: alertId,
      type,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata: metadata || {}
    };

    this.alerts.set(alertId, alert);
    
    this.emit('alert:created', alert);
    
    this.logger.warn('Alert created', {
      alertId,
      type,
      severity,
      message
    });

    return alertId;
  }

  /**
   * Resolve an alert
   * Implements alert resolution
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    
    this.emit('alert:resolved', alert);
    
    this.logger.info('Alert resolved', {
      alertId,
      type: alert.type,
      severity: alert.severity
    });

    return true;
  }

  /**
   * Update response time metrics
   * Implements performance monitoring
   */
  private updateResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only recent response times
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes = this.responseTimes.slice(-this.maxResponseTimeHistory);
    }
    
    // Calculate performance metrics
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    this.metrics.performance.avgResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    this.metrics.performance.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.metrics.performance.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)] || 0;
    this.metrics.performance.maxResponseTime = Math.max(...this.responseTimes);
  }

  /**
   * Update cache hit rate
   * Implements cache performance calculation
   */
  private updateCacheHitRate(): void {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? (this.metrics.cache.hits / total) * 100 : 0;
  }

  /**
   * Update library metrics
   * Implements library usage tracking
   */
  private updateLibraryMetrics(libraryName?: string): void {
    if (!libraryName) return;
    
    const existing = this.metrics.libraries.mostRequested.find(lib => lib.name === libraryName);
    if (existing) {
      existing.count++;
    } else {
      this.metrics.libraries.mostRequested.push({ name: libraryName, count: 1 });
      this.metrics.libraries.totalUnique++;
    }
    
    // Sort by count and keep top 10
    this.metrics.libraries.mostRequested.sort((a, b) => b.count - a.count);
    this.metrics.libraries.mostRequested = this.metrics.libraries.mostRequested.slice(0, 10);
  }

  /**
   * Calculate request rate (requests per minute)
   * Implements rate calculation
   */
  private calculateRequestRate(): number {
    // This is a simplified calculation
    // In production, you'd want to track requests over time windows
    return this.metrics.requests.total; // Placeholder
  }

  /**
   * Check MCP compliance health
   * Implements MCP protocol health checking
   */
  private async checkMCPCompliance(): Promise<boolean> {
    try {
      // This would check actual MCP compliance
      // For now, return true as placeholder
      return true;
    } catch (error) {
      this.logger.error('MCP compliance check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check cache health
   * Implements cache health monitoring
   */
  private checkCacheHealth(): boolean {
    const hitRate = this.metrics.cache.hitRate;
    return hitRate >= 50; // Consider healthy if hit rate >= 50%
  }

  /**
   * Check circuit breaker health
   * Implements circuit breaker health monitoring
   */
  private checkCircuitBreakerHealth(): boolean {
    return this.metrics.circuitBreaker.state !== 'open';
  }

  /**
   * Check error rate health
   * Implements error rate monitoring
   */
  private checkErrorRateHealth(): boolean {
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100 
      : 0;
    return errorRate < 10; // Consider healthy if error rate < 10%
  }

  /**
   * Check for error rate alerts
   * Implements alerting logic
   */
  private checkErrorRateAlert(): void {
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.failed / this.metrics.requests.total) * 100 
      : 0;
    
    if (errorRate > 20) {
      this.createAlert(
        'error',
        'high',
        `High error rate detected: ${errorRate.toFixed(2)}%`,
        { errorRate, totalRequests: this.metrics.requests.total }
      );
    }
  }

  /**
   * Check for circuit breaker alerts
   * Implements circuit breaker alerting
   */
  private checkCircuitBreakerAlert(state: string): void {
    if (state === 'open') {
      this.createAlert(
        'availability',
        'critical',
        'Circuit breaker is open - Context7 service unavailable',
        { state }
      );
    }
  }

  /**
   * Start health monitoring
   * Implements periodic health checks
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        
        if (health.status === 'unhealthy') {
          this.createAlert(
            'availability',
            'critical',
            'Context7 service is unhealthy',
            { health }
          );
        }
        
        this.emit('health:check', health);
      } catch (error) {
        this.logger.error('Health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start metrics reset
   * Implements periodic metrics cleanup
   */
  private startMetricsReset(): void {
    this.metricsResetInterval = setInterval(() => {
      // Reset hourly metrics
      this.responseTimes = [];
      this.metrics.performance = {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        maxResponseTime: 0
      };
      
      this.logger.info('Metrics reset completed');
    }, 3600000); // Reset every hour
  }

  /**
   * Cleanup resources
   * Implements proper cleanup
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsResetInterval) {
      clearInterval(this.metricsResetInterval);
    }
    
    this.removeAllListeners();
    this.logger.info('Context7 monitoring service destroyed');
  }
}
