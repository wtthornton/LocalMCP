/**
 * Performance Metrics Service - Advanced performance metrics and bottleneck detection
 * 
 * This service provides comprehensive performance monitoring, metrics collection,
 * and bottleneck detection capabilities for LocalMCP.
 * 
 * Benefits for vibe coders:
 * - Real-time performance monitoring and metrics collection
 * - Automatic bottleneck detection and optimization recommendations
 * - Performance trend analysis and capacity planning
 * - Resource usage optimization and efficiency insights
 * - Integration with structured logging for comprehensive performance tracking
 */

import { EventEmitter } from 'events';
import { StructuredLoggingService } from './structured-logging.service';
import * as crypto from 'crypto';
import * as os from 'os';

// Performance metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer' | 'rate';

// Performance metric categories
export type MetricCategory = 
  | 'system' 
  | 'application' 
  | 'database' 
  | 'network' 
  | 'cache' 
  | 'pipeline' 
  | 'service' 
  | 'operation' 
  | 'user';

// Performance metric
export interface PerformanceMetric {
  id: string;
  name: string;
  type: MetricType;
  category: MetricCategory;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  metadata: {
    correlationId?: string;
    service?: string;
    operation?: string;
    stage?: string;
    userId?: string;
    sessionId?: string;
    additionalContext?: Record<string, any>;
  };
}

// Performance snapshot
export interface PerformanceSnapshot {
  id: string;
  timestamp: Date;
  systemMetrics: {
    cpu: {
      usage: number;
      loadAverage: number[];
      cores: number;
    };
    memory: {
      total: number;
      free: number;
      used: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    disk: {
      total: number;
      free: number;
      used: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      connections: number;
    };
  };
  applicationMetrics: {
    uptime: number;
    requests: number;
    errors: number;
    responseTime: {
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: number;
  };
  customMetrics: PerformanceMetric[];
}

// Bottleneck detection result
export interface BottleneckDetection {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: MetricCategory;
  metric: string;
  currentValue: number;
  threshold: number;
  impact: string;
  recommendation: string;
  affectedServices: string[];
  estimatedResolutionTime: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Performance trend analysis
export interface PerformanceTrend {
  metric: string;
  period: 'hour' | 'day' | 'week' | 'month';
  trend: 'improving' | 'stable' | 'degrading' | 'volatile';
  changeRate: number; // percentage change
  confidence: number; // 0-1
  prediction: {
    nextHour?: number;
    nextDay?: number;
    nextWeek?: number;
  };
  seasonality: {
    detected: boolean;
    pattern: string;
    strength: number;
  };
}

// Performance analytics
export interface PerformanceAnalytics {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  performanceScore: number; // 0-100
  bottlenecks: BottleneckDetection[];
  trends: PerformanceTrend[];
  capacityPlanning: {
    currentUtilization: number;
    projectedGrowth: number;
    recommendedScaling: 'none' | 'horizontal' | 'vertical' | 'both';
    estimatedCost: number;
  };
  optimizationOpportunities: Array<{
    area: string;
    currentPerformance: number;
    potentialImprovement: number;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  alerts: Array<{
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: Date;
  }>;
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enableMonitoring: boolean;
  enableBottleneckDetection: boolean;
  enableTrendAnalysis: boolean;
  enableCapacityPlanning: boolean;
  enableAlerts: boolean;
  collectionInterval: number; // milliseconds
  retentionPeriod: number; // days
  maxMetrics: number;
  thresholds: {
    cpu: {
      warning: number;
      critical: number;
    };
    memory: {
      warning: number;
      critical: number;
    };
    disk: {
      warning: number;
      critical: number;
    };
    responseTime: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      critical: number;
    };
  };
  alertChannels: string[];
}

// Performance Metrics Service Implementation
export class PerformanceMetricsService extends EventEmitter {
  private config: PerformanceConfig;
  private logger: StructuredLoggingService;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private snapshots: PerformanceSnapshot[] = [];
  private bottlenecks: BottleneckDetection[] = [];
  private trends: Map<string, PerformanceTrend> = new Map();
  private collectionTimer?: NodeJS.Timeout;
  private lastSnapshot?: PerformanceSnapshot;

  constructor(
    logger: StructuredLoggingService,
    config?: Partial<PerformanceConfig>
  ) {
    super();
    
    this.logger = logger;
    this.config = {
      enableMonitoring: true,
      enableBottleneckDetection: true,
      enableTrendAnalysis: true,
      enableCapacityPlanning: true,
      enableAlerts: true,
      collectionInterval: 30000, // 30 seconds
      retentionPeriod: 7, // 7 days
      maxMetrics: 10000,
      thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        responseTime: { warning: 1000, critical: 5000 },
        errorRate: { warning: 5, critical: 10 }
      },
      alertChannels: ['console', 'log'],
      ...config
    };

    this.initializeService();
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    type: MetricType,
    category: MetricCategory,
    value: number,
    unit: string,
    tags: Record<string, string> = {},
    metadata: PerformanceMetric['metadata'] = {}
  ): void {
    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      name,
      type,
      category,
      value,
      unit,
      timestamp: new Date(),
      tags,
      metadata
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Maintain metric history size
    if (metricHistory.length > this.config.maxMetrics) {
      metricHistory.splice(0, metricHistory.length - this.config.maxMetrics);
    }

    // Log the metric
    this.logger.performance(
      `Metric recorded: ${name}`,
      this.calculateMetricDuration(metricHistory),
      {
        metric,
        type,
        category,
        value,
        unit,
        tags
      },
      metadata.correlationId
    );

    // Check for bottlenecks
    if (this.config.enableBottleneckDetection) {
      this.detectBottlenecks(metric);
    }

    // Update trends
    if (this.config.enableTrendAnalysis) {
      this.updateTrends(name, metricHistory);
    }

    // Emit event
    this.emit('metricRecorded', { metric });

    // Check alerts
    if (this.config.enableAlerts) {
      this.checkAlerts(metric);
    }
  }

  /**
   * Record a counter metric (incremental)
   */
  recordCounter(
    name: string,
    category: MetricCategory,
    increment: number = 1,
    tags: Record<string, string> = {},
    metadata: PerformanceMetric['metadata'] = {}
  ): void {
    this.recordMetric(name, 'counter', category, increment, 'count', tags, metadata);
  }

  /**
   * Record a gauge metric (absolute value)
   */
  recordGauge(
    name: string,
    category: MetricCategory,
    value: number,
    unit: string = 'unit',
    tags: Record<string, string> = {},
    metadata: PerformanceMetric['metadata'] = {}
  ): void {
    this.recordMetric(name, 'gauge', category, value, unit, tags, metadata);
  }

  /**
   * Record a timer metric (duration)
   */
  recordTimer(
    name: string,
    category: MetricCategory,
    duration: number,
    unit: string = 'ms',
    tags: Record<string, string> = {},
    metadata: PerformanceMetric['metadata'] = {}
  ): void {
    this.recordMetric(name, 'timer', category, duration, unit, tags, metadata);
  }

  /**
   * Record a rate metric (events per time unit)
   */
  recordRate(
    name: string,
    category: MetricCategory,
    rate: number,
    unit: string = 'events/sec',
    tags: Record<string, string> = {},
    metadata: PerformanceMetric['metadata'] = {}
  ): void {
    this.recordMetric(name, 'rate', category, rate, unit, tags, metadata);
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string, limit: number = 100): PerformanceMetric[] {
    const metricHistory = this.metrics.get(name) || [];
    return metricHistory.slice(-limit);
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: MetricCategory, limit: number = 100): PerformanceMetric[] {
    const allMetrics: PerformanceMetric[] = [];
    
    for (const metricHistory of Array.from(this.metrics.values())) {
      allMetrics.push(...metricHistory.filter(metric => metric.category === category));
    }
    
    return allMetrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get current performance snapshot
   */
  getCurrentSnapshot(): PerformanceSnapshot | null {
    return this.lastSnapshot || null;
  }

  /**
   * Get performance snapshots
   */
  getSnapshots(limit: number = 100): PerformanceSnapshot[] {
    return this.snapshots.slice(-limit);
  }

  /**
   * Get detected bottlenecks
   */
  getBottlenecks(severity?: BottleneckDetection['severity']): BottleneckDetection[] {
    if (severity) {
      return this.bottlenecks.filter(bottleneck => bottleneck.severity === severity);
    }
    return [...this.bottlenecks];
  }

  /**
   * Get performance trends
   */
  getTrends(): PerformanceTrend[] {
    return Array.from(this.trends.values());
  }

  /**
   * Get performance analytics
   */
  getAnalytics(): PerformanceAnalytics {
    const currentSnapshot = this.getCurrentSnapshot();
    const recentBottlenecks = this.getBottlenecks();
    const trends = this.getTrends();
    
    // Calculate overall health
    const overallHealth = this.calculateOverallHealth(currentSnapshot, recentBottlenecks);
    
    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore(currentSnapshot, recentBottlenecks);
    
    // Capacity planning
    const capacityPlanning = this.calculateCapacityPlanning(currentSnapshot, trends);
    
    // Optimization opportunities
    const optimizationOpportunities = this.identifyOptimizationOpportunities(currentSnapshot, trends);
    
    // Generate alerts
    const alerts = this.generateAlerts(currentSnapshot, recentBottlenecks);
    
    return {
      overallHealth,
      performanceScore,
      bottlenecks: recentBottlenecks,
      trends,
      capacityPlanning,
      optimizationOpportunities,
      alerts
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (!this.config.enableMonitoring) return;
    
    this.collectionTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.collectionInterval);
    
    this.logger.info('Performance monitoring started', {
      interval: this.config.collectionInterval,
      thresholds: this.config.thresholds
    });
    
    this.emit('monitoringStarted');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }
    
    this.logger.info('Performance monitoring stopped');
    this.emit('monitoringStopped');
  }

  /**
   * Update performance configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if interval changed
    if (newConfig.collectionInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
    
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Private helper methods

  private initializeService(): void {
    // Collect initial system metrics
    this.collectSystemMetrics();
    
    // Start monitoring if enabled
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
    
    this.emit('serviceInitialized', { config: this.config });
  }

  private collectSystemMetrics(): void {
    const snapshot: PerformanceSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      systemMetrics: {
        cpu: {
          usage: this.getCpuUsage(),
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        },
        memory: {
          ...process.memoryUsage(),
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        disk: this.getDiskUsage(),
        network: this.getNetworkUsage()
      },
      applicationMetrics: {
        uptime: process.uptime(),
        requests: this.getRequestCount(),
        errors: this.getErrorCount(),
        responseTime: this.getResponseTimeStats(),
        throughput: this.getThroughput()
      },
      customMetrics: []
    };

    // Add custom metrics
    for (const [name, metricHistory] of Array.from(this.metrics.entries())) {
      const latestMetric = metricHistory[metricHistory.length - 1];
      if (latestMetric) {
        snapshot.customMetrics.push(latestMetric);
      }
    }

    this.snapshots.push(snapshot);
    this.lastSnapshot = snapshot;

    // Maintain snapshot history
    if (this.snapshots.length > 1000) {
      this.snapshots = this.snapshots.slice(-1000);
    }

    // Log system metrics
    this.logger.performance(
      'System metrics collected',
      this.config.collectionInterval,
      {
        snapshot: {
          id: snapshot.id,
          timestamp: snapshot.timestamp,
          systemMetrics: snapshot.systemMetrics,
          applicationMetrics: snapshot.applicationMetrics
        }
      }
    );

    this.emit('snapshotCollected', { snapshot });
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    return 100 - (100 * totalIdle / totalTick);
  }

  private getDiskUsage(): { total: number; free: number; used: number } {
    // Simplified disk usage - in a real implementation, use a library like 'node-disk-info'
    return {
      total: 1000000000, // 1GB placeholder
      free: 500000000,   // 500MB placeholder
      used: 500000000    // 500MB placeholder
    };
  }

  private getNetworkUsage(): { bytesIn: number; bytesOut: number; connections: number } {
    // Simplified network usage - in a real implementation, use system APIs
    return {
      bytesIn: 0,
      bytesOut: 0,
      connections: 0
    };
  }

  private getRequestCount(): number {
    // Simplified request count - in a real implementation, track actual requests
    return Math.floor(Math.random() * 1000);
  }

  private getErrorCount(): number {
    // Simplified error count - in a real implementation, track actual errors
    return Math.floor(Math.random() * 10);
  }

  private getResponseTimeStats(): PerformanceSnapshot['applicationMetrics']['responseTime'] {
    // Simplified response time stats - in a real implementation, track actual response times
    const avg = Math.random() * 1000;
    return {
      min: avg * 0.5,
      max: avg * 2,
      avg,
      p50: avg,
      p95: avg * 1.5,
      p99: avg * 1.8
    };
  }

  private getThroughput(): number {
    // Simplified throughput - in a real implementation, calculate actual throughput
    return Math.random() * 100;
  }

  private detectBottlenecks(metric: PerformanceMetric): void {
    const thresholds = this.config.thresholds;
    let severity: BottleneckDetection['severity'] | null = null;
    let threshold = 0;
    let impact = '';
    let recommendation = '';

    // Check CPU bottlenecks
    if (metric.name.includes('cpu') || metric.category === 'system') {
      if (metric.value >= thresholds.cpu.critical) {
        severity = 'critical';
        threshold = thresholds.cpu.critical;
        impact = 'System performance severely degraded';
        recommendation = 'Scale up CPU resources or optimize CPU-intensive operations';
      } else if (metric.value >= thresholds.cpu.warning) {
        severity = 'high';
        threshold = thresholds.cpu.warning;
        impact = 'System performance may be affected';
        recommendation = 'Monitor CPU usage and consider optimization';
      }
    }

    // Check memory bottlenecks
    if (metric.name.includes('memory') || metric.category === 'system') {
      if (metric.value >= thresholds.memory.critical) {
        severity = 'critical';
        threshold = thresholds.memory.critical;
        impact = 'Memory exhaustion may cause system crashes';
        recommendation = 'Scale up memory resources or optimize memory usage';
      } else if (metric.value >= thresholds.memory.warning) {
        severity = 'high';
        threshold = thresholds.memory.warning;
        impact = 'Memory usage is high, performance may be affected';
        recommendation = 'Monitor memory usage and consider optimization';
      }
    }

    // Check response time bottlenecks
    if (metric.name.includes('response') || metric.name.includes('duration')) {
      if (metric.value >= thresholds.responseTime.critical) {
        severity = 'critical';
        threshold = thresholds.responseTime.critical;
        impact = 'Response times are critically slow';
        recommendation = 'Optimize slow operations or scale resources';
      } else if (metric.value >= thresholds.responseTime.warning) {
        severity = 'medium';
        threshold = thresholds.responseTime.warning;
        impact = 'Response times are slower than expected';
        recommendation = 'Monitor and optimize slow operations';
      }
    }

    if (severity) {
      const bottleneck: BottleneckDetection = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        severity,
        category: metric.category,
        metric: metric.name,
        currentValue: metric.value,
        threshold,
        impact,
        recommendation,
        affectedServices: [metric.metadata.service || 'unknown'],
        estimatedResolutionTime: this.estimateResolutionTime(severity),
        priority: this.mapSeverityToPriority(severity)
      };

      this.bottlenecks.push(bottleneck);

      // Maintain bottleneck history
      if (this.bottlenecks.length > 1000) {
        this.bottlenecks = this.bottlenecks.slice(-1000);
      }

      this.logger.warn(
        `Performance bottleneck detected: ${metric.name}`,
        {
          bottleneck,
          metric,
          severity,
          impact,
          recommendation
        },
        metric.metadata.correlationId
      );

      this.emit('bottleneckDetected', { bottleneck, metric });
    }
  }

  private updateTrends(name: string, metricHistory: PerformanceMetric[]): void {
    if (metricHistory.length < 10) return; // Need enough data for trend analysis

    const recent = metricHistory.slice(-10);
    const values = recent.map(m => m.value);
    
    // Simple trend calculation
    const firstHalf = values.slice(0, 5);
    const secondHalf = values.slice(5);
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changeRate = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend: PerformanceTrend['trend'] = 'stable';
    if (changeRate > 10) trend = 'degrading';
    else if (changeRate < -10) trend = 'improving';
    else if (Math.abs(changeRate) > 5) trend = 'volatile';

    const trendData: PerformanceTrend = {
      metric: name,
      period: 'hour',
      trend,
      changeRate,
      confidence: Math.min(Math.abs(changeRate) / 10, 1),
      prediction: {
        nextHour: secondAvg + (changeRate / 100) * secondAvg
      },
      seasonality: {
        detected: false,
        pattern: 'none',
        strength: 0
      }
    };

    this.trends.set(name, trendData);
    this.emit('trendUpdated', { metric: name, trend: trendData });
  }

  private calculateMetricDuration(metricHistory: PerformanceMetric[]): number {
    if (metricHistory.length < 2) return 0;
    
    const latest = metricHistory[metricHistory.length - 1];
    const previous = metricHistory[metricHistory.length - 2];
    
    return latest.timestamp.getTime() - previous.timestamp.getTime();
  }

  private calculateOverallHealth(
    snapshot: PerformanceSnapshot | null,
    bottlenecks: BottleneckDetection[]
  ): PerformanceAnalytics['overallHealth'] {
    if (!snapshot) return 'fair';
    
    const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
    const highBottlenecks = bottlenecks.filter(b => b.severity === 'high').length;
    
    if (criticalBottlenecks > 0) return 'critical';
    if (highBottlenecks > 2) return 'poor';
    if (highBottlenecks > 0 || snapshot.systemMetrics.cpu.usage > 80) return 'fair';
    if (snapshot.systemMetrics.cpu.usage < 50 && snapshot.systemMetrics.memory.used < snapshot.systemMetrics.memory.total * 0.7) {
      return 'excellent';
    }
    
    return 'good';
  }

  private calculatePerformanceScore(
    snapshot: PerformanceSnapshot | null,
    bottlenecks: BottleneckDetection[]
  ): number {
    if (!snapshot) return 50;
    
    let score = 100;
    
    // Deduct points for bottlenecks
    score -= bottlenecks.filter(b => b.severity === 'critical').length * 20;
    score -= bottlenecks.filter(b => b.severity === 'high').length * 10;
    score -= bottlenecks.filter(b => b.severity === 'medium').length * 5;
    
    // Deduct points for high resource usage
    if (snapshot.systemMetrics.cpu.usage > 90) score -= 15;
    else if (snapshot.systemMetrics.cpu.usage > 70) score -= 10;
    
    if (snapshot.systemMetrics.memory.used > snapshot.systemMetrics.memory.total * 0.9) score -= 15;
    else if (snapshot.systemMetrics.memory.used > snapshot.systemMetrics.memory.total * 0.8) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateCapacityPlanning(
    snapshot: PerformanceSnapshot | null,
    trends: PerformanceTrend[]
  ): PerformanceAnalytics['capacityPlanning'] {
    if (!snapshot) {
      return {
        currentUtilization: 0,
        projectedGrowth: 0,
        recommendedScaling: 'none',
        estimatedCost: 0
      };
    }
    
    const cpuUtilization = snapshot.systemMetrics.cpu.usage;
    const memoryUtilization = (snapshot.systemMetrics.memory.used / snapshot.systemMetrics.memory.total) * 100;
    const currentUtilization = Math.max(cpuUtilization, memoryUtilization);
    
    // Simple growth projection based on trends
    const cpuTrend = trends.find(t => t.metric.includes('cpu'));
    const projectedGrowth = cpuTrend ? Math.abs(cpuTrend.changeRate) : 0;
    
    let recommendedScaling: PerformanceAnalytics['capacityPlanning']['recommendedScaling'] = 'none';
    if (currentUtilization > 90 || projectedGrowth > 20) {
      recommendedScaling = 'both';
    } else if (currentUtilization > 80 || projectedGrowth > 10) {
      recommendedScaling = 'horizontal';
    } else if (currentUtilization > 70) {
      recommendedScaling = 'vertical';
    }
    
    // Simple cost estimation
    const estimatedCost = recommendedScaling === 'both' ? 1000 :
                         recommendedScaling === 'horizontal' ? 500 :
                         recommendedScaling === 'vertical' ? 300 : 0;
    
    return {
      currentUtilization,
      projectedGrowth,
      recommendedScaling,
      estimatedCost
    };
  }

  private identifyOptimizationOpportunities(
    snapshot: PerformanceSnapshot | null,
    trends: PerformanceTrend[]
  ): PerformanceAnalytics['optimizationOpportunities'] {
    const opportunities: PerformanceAnalytics['optimizationOpportunities'] = [];
    
    if (!snapshot) return opportunities;
    
    // CPU optimization
    if (snapshot.systemMetrics.cpu.usage > 70) {
      opportunities.push({
        area: 'CPU Usage',
        currentPerformance: snapshot.systemMetrics.cpu.usage,
        potentialImprovement: 20,
        effort: 'medium',
        impact: 'high',
        recommendation: 'Optimize CPU-intensive operations and consider caching'
      });
    }
    
    // Memory optimization
    const memoryUsage = (snapshot.systemMetrics.memory.used / snapshot.systemMetrics.memory.total) * 100;
    if (memoryUsage > 80) {
      opportunities.push({
        area: 'Memory Usage',
        currentPerformance: memoryUsage,
        potentialImprovement: 25,
        effort: 'high',
        impact: 'high',
        recommendation: 'Optimize memory usage and implement memory pooling'
      });
    }
    
    // Response time optimization
    if (snapshot.applicationMetrics.responseTime.avg > 1000) {
      opportunities.push({
        area: 'Response Time',
        currentPerformance: snapshot.applicationMetrics.responseTime.avg,
        potentialImprovement: 40,
        effort: 'medium',
        impact: 'high',
        recommendation: 'Optimize slow operations and implement caching'
      });
    }
    
    return opportunities;
  }

  private generateAlerts(
    snapshot: PerformanceSnapshot | null,
    bottlenecks: BottleneckDetection[]
  ): PerformanceAnalytics['alerts'] {
    const alerts: PerformanceAnalytics['alerts'] = [];
    
    if (!snapshot) return alerts;
    
    // CPU alerts
    if (snapshot.systemMetrics.cpu.usage >= this.config.thresholds.cpu.critical) {
      alerts.push({
        severity: 'critical',
        message: `CPU usage critically high: ${snapshot.systemMetrics.cpu.usage.toFixed(1)}%`,
        metric: 'cpu.usage',
        value: snapshot.systemMetrics.cpu.usage,
        threshold: this.config.thresholds.cpu.critical,
        timestamp: new Date()
      });
    }
    
    // Memory alerts
    const memoryUsage = (snapshot.systemMetrics.memory.used / snapshot.systemMetrics.memory.total) * 100;
    if (memoryUsage >= this.config.thresholds.memory.critical) {
      alerts.push({
        severity: 'critical',
        message: `Memory usage critically high: ${memoryUsage.toFixed(1)}%`,
        metric: 'memory.usage',
        value: memoryUsage,
        threshold: this.config.thresholds.memory.critical,
        timestamp: new Date()
      });
    }
    
    // Bottleneck alerts
    for (const bottleneck of bottlenecks.filter(b => b.severity === 'critical')) {
      alerts.push({
        severity: 'critical',
        message: `Critical bottleneck detected: ${bottleneck.metric}`,
        metric: bottleneck.metric,
        value: bottleneck.currentValue,
        threshold: bottleneck.threshold,
        timestamp: bottleneck.timestamp
      });
    }
    
    return alerts;
  }

  private estimateResolutionTime(severity: BottleneckDetection['severity']): number {
    switch (severity) {
      case 'critical': return 60; // 1 hour
      case 'high': return 240; // 4 hours
      case 'medium': return 480; // 8 hours
      case 'low': return 1440; // 24 hours
      default: return 480;
    }
  }

  private mapSeverityToPriority(severity: BottleneckDetection['severity']): BottleneckDetection['priority'] {
    switch (severity) {
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private checkAlerts(metric: PerformanceMetric): void {
    // This would integrate with alerting systems in a real implementation
    this.emit('alertCheck', { metric });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.metrics.clear();
    this.snapshots = [];
    this.bottlenecks = [];
    this.trends.clear();
    this.lastSnapshot = undefined;
    this.emit('serviceDestroyed');
  }
}

export default PerformanceMetricsService;
