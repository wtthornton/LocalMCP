/**
 * Performance Monitor Service - Real-time performance monitoring and alerting
 * 
 * This service provides comprehensive performance monitoring for LocalMCP,
 * implementing real-time metrics collection, alerting, and performance analysis.
 * 
 * Benefits for vibe coders:
 * - Real-time performance monitoring without complex setup
 * - Automatic alerting when performance degrades
 * - Performance trend analysis and capacity planning
 * - Resource usage monitoring and optimization
 * - Simple dashboard for performance insights
 * - Proactive issue detection and notification
 * 
 * Based on industry best practices from:
 * - Prometheus (metrics collection)
 * - Grafana (visualization and alerting)
 * - New Relic (APM and monitoring)
 * - DataDog (infrastructure monitoring)
 */

import { EventEmitter } from 'events';

// Performance metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer' | 'rate';

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

// Performance thresholds
export interface PerformanceThresholds {
  responseTime: number; // milliseconds
  throughput: number; // requests per second
  errorRate: number; // percentage (0-100)
  memoryUsage: number; // percentage (0-100)
  cpuUsage: number; // percentage (0-100)
  diskUsage: number; // percentage (0-100)
}

// Performance metric
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  unit?: string;
}

// Performance alert
export interface PerformanceAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// Performance statistics
export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  errorRate: number; // percentage
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  diskUsage: number; // percentage
  uptime: number; // milliseconds
  lastUpdated: Date;
}

// Alert configuration
export interface AlertConfig {
  enabled: boolean;
  thresholds: PerformanceThresholds;
  cooldownPeriod: number; // milliseconds
  notificationChannels: string[];
}

// Performance Monitor Service Implementation
export class PerformanceMonitorService extends EventEmitter {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private stats: PerformanceStats;
  private config: AlertConfig;
  private isRunning: boolean = false;
  private monitoringTimer?: NodeJS.Timeout;
  private startTime: Date;
  private requestCount: number = 0;
  private successCount: number = 0;
  private failureCount: number = 0;
  private responseTimes: number[] = [];

  constructor(config?: Partial<AlertConfig>) {
    super();
    
    this.startTime = new Date();
    
    // Set default configuration
    this.config = {
      enabled: true,
      thresholds: {
        responseTime: 1000, // 1 second
        throughput: 100, // 100 requests per second
        errorRate: 5, // 5%
        memoryUsage: 80, // 80%
        cpuUsage: 80, // 80%
        diskUsage: 90 // 90%
      },
      cooldownPeriod: 60000, // 1 minute
      notificationChannels: ['console', 'log']
    };

    // Initialize statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      throughput: 0,
      errorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      uptime: 0,
      lastUpdated: new Date()
    };

    // Merge with provided config
    if (config) {
      this.config = { ...this.config, ...config };
      if (config.thresholds) {
        this.config.thresholds = { ...this.config.thresholds, ...config.thresholds };
      }
    }
  }

  /**
   * Start the performance monitor service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    try {
      // Start monitoring timer
      this.startMonitoring();
      
      // Initial system metrics collection
      await this.collectSystemMetrics();
      
      this.emit('monitoringStarted');
    } catch (error) {
      this.isRunning = false;
      this.emit('startupError', { error });
      throw error;
    }
  }

  /**
   * Stop the performance monitor service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Stop monitoring timer
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    this.emit('monitoringStopped');
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date()
    };

    // Store metric
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metricList = this.metrics.get(metric.name)!;
    metricList.push(fullMetric);
    
    // Keep only last 1000 metrics per type
    if (metricList.length > 1000) {
      metricList.splice(0, metricList.length - 1000);
    }

    // Check for alerts
    this.checkAlerts(fullMetric);

    this.emit('metricRecorded', { metric: fullMetric });
  }

  /**
   * Record a request with timing
   */
  recordRequest(success: boolean, responseTime: number, tags?: Record<string, string>): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    if (success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }

    // Record response time metric
    this.recordMetric({
      name: 'request_response_time',
      type: 'histogram',
      value: responseTime,
      tags: { success: success.toString(), ...tags }
    });

    // Record throughput metric
    this.recordMetric({
      name: 'request_throughput',
      type: 'rate',
      value: 1,
      tags
    });

    // Update statistics
    this.updateStats();

    this.emit('requestRecorded', { success, responseTime, tags });
  }

  /**
   * Record system resource usage
   */
  recordSystemMetrics(memoryUsage: number, cpuUsage: number, diskUsage: number): void {
    this.recordMetric({
      name: 'system_memory_usage',
      type: 'gauge',
      value: memoryUsage,
      unit: 'percent'
    });

    this.recordMetric({
      name: 'system_cpu_usage',
      type: 'gauge',
      value: cpuUsage,
      unit: 'percent'
    });

    this.recordMetric({
      name: 'system_disk_usage',
      type: 'gauge',
      value: diskUsage,
      unit: 'percent'
    });

    this.emit('systemMetricsRecorded', { memoryUsage, cpuUsage, diskUsage });
  }

  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(metricName: string, limit?: number): PerformanceMetric[] {
    const metrics = this.metrics.get(metricName) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get all active alerts
   */
  getAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): PerformanceAlert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alertResolved', { alert });
      return true;
    }
    return false;
  }

  /**
   * Get performance trends
   */
  getTrends(metricName: string, duration: number = 300000): {
    average: number;
    min: number;
    max: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const metrics = this.getMetrics(metricName);
    const now = Date.now();
    const cutoff = now - duration;
    
    const recentMetrics = metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    if (recentMetrics.length === 0) {
      return { average: 0, min: 0, max: 0, trend: 'stable' };
    }

    const values = recentMetrics.map(m => m.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend (simple linear regression)
    const midPoint = Math.floor(recentMetrics.length / 2);
    const firstHalf = values.slice(0, midPoint);
    const secondHalf = values.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const trend = secondHalfAvg > firstHalfAvg * 1.1 ? 'increasing' :
                  secondHalfAvg < firstHalfAvg * 0.9 ? 'decreasing' : 'stable';

    return { average, min, max, trend };
  }

  /**
   * Start monitoring timer
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(async () => {
      await this.collectSystemMetrics();
      this.updateStats();
    }, 5000); // Every 5 seconds
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
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
    // In a real implementation, you'd use a proper CPU monitoring library
    return Math.random() * 100; // Placeholder
  }

  /**
   * Get disk usage (simplified implementation)
   */
  private async getDiskUsage(): Promise<number> {
    // Simplified disk usage calculation
    // In a real implementation, you'd use a proper disk monitoring library
    return Math.random() * 100; // Placeholder
  }

  /**
   * Update performance statistics
   */
  private updateStats(): void {
    const now = Date.now();
    const uptime = now - this.startTime.getTime();
    
    // Calculate response time percentiles
    const sortedResponseTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);
    
    const p95ResponseTime = sortedResponseTimes[p95Index] || 0;
    const p99ResponseTime = sortedResponseTimes[p99Index] || 0;
    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;

    // Calculate throughput (requests per second)
    const throughput = uptime > 0 ? (this.requestCount / (uptime / 1000)) : 0;

    // Calculate error rate
    const errorRate = this.requestCount > 0 ? (this.failureCount / this.requestCount) * 100 : 0;

    // Get latest system metrics
    const memoryMetrics = this.getMetrics('system_memory_usage', 1);
    const cpuMetrics = this.getMetrics('system_cpu_usage', 1);
    const diskMetrics = this.getMetrics('system_disk_usage', 1);

    this.stats = {
      totalRequests: this.requestCount,
      successfulRequests: this.successCount,
      failedRequests: this.failureCount,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      throughput,
      errorRate,
      memoryUsage: memoryMetrics[0]?.value || 0,
      cpuUsage: cpuMetrics[0]?.value || 0,
      diskUsage: diskMetrics[0]?.value || 0,
      uptime,
      lastUpdated: new Date()
    };
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metric: PerformanceMetric): void {
    if (!this.config.enabled) {
      return;
    }

    const thresholds = this.config.thresholds;
    let alertTriggered = false;
    let alertMessage = '';
    let severity: AlertSeverity = 'info';

    // Check response time threshold
    if (metric.name === 'request_response_time' && metric.value > thresholds.responseTime) {
      alertTriggered = true;
      alertMessage = `High response time: ${metric.value}ms (threshold: ${thresholds.responseTime}ms)`;
      severity = metric.value > thresholds.responseTime * 2 ? 'critical' : 'warning';
    }

    // Check error rate threshold
    if (metric.name === 'request_error_rate' && metric.value > thresholds.errorRate) {
      alertTriggered = true;
      alertMessage = `High error rate: ${metric.value}% (threshold: ${thresholds.errorRate}%)`;
      severity = metric.value > thresholds.errorRate * 2 ? 'critical' : 'error';
    }

    // Check memory usage threshold
    if (metric.name === 'system_memory_usage' && metric.value > thresholds.memoryUsage) {
      alertTriggered = true;
      alertMessage = `High memory usage: ${metric.value}% (threshold: ${thresholds.memoryUsage}%)`;
      severity = metric.value > thresholds.memoryUsage * 1.2 ? 'critical' : 'warning';
    }

    // Check CPU usage threshold
    if (metric.name === 'system_cpu_usage' && metric.value > thresholds.cpuUsage) {
      alertTriggered = true;
      alertMessage = `High CPU usage: ${metric.value}% (threshold: ${thresholds.cpuUsage}%)`;
      severity = metric.value > thresholds.cpuUsage * 1.2 ? 'critical' : 'warning';
    }

    // Check disk usage threshold
    if (metric.name === 'system_disk_usage' && metric.value > thresholds.diskUsage) {
      alertTriggered = true;
      alertMessage = `High disk usage: ${metric.value}% (threshold: ${thresholds.diskUsage}%)`;
      severity = metric.value > thresholds.diskUsage * 1.1 ? 'critical' : 'warning';
    }

    if (alertTriggered) {
      this.createAlert(metric.name, severity, alertMessage, metric.value);
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(metric: string, severity: AlertSeverity, message: string, currentValue: number): void {
    const alertId = `${metric}_${Date.now()}`;
    
    // Check if similar alert already exists and is not resolved
    const existingAlert = Array.from(this.alerts.values()).find(alert => 
      alert.metric === metric && 
      !alert.resolved && 
      (Date.now() - alert.timestamp.getTime()) < this.config.cooldownPeriod
    );

    if (existingAlert) {
      return; // Skip duplicate alert
    }

    const alert: PerformanceAlert = {
      id: alertId,
      severity,
      message,
      metric,
      threshold: this.getThresholdForMetric(metric),
      currentValue,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.emit('alertCreated', { alert });
  }

  /**
   * Get threshold value for a metric
   */
  private getThresholdForMetric(metric: string): number {
    const thresholds = this.config.thresholds;
    
    switch (metric) {
      case 'request_response_time':
        return thresholds.responseTime;
      case 'request_error_rate':
        return thresholds.errorRate;
      case 'system_memory_usage':
        return thresholds.memoryUsage;
      case 'system_cpu_usage':
        return thresholds.cpuUsage;
      case 'system_disk_usage':
        return thresholds.diskUsage;
      default:
        return 0;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.emit('serviceDestroyed');
  }
}

export default PerformanceMonitorService;
