/**
 * Performance Dashboard Service
 * 
 * This service provides real-time performance monitoring and visualization for AI enhancement features.
 * It collects metrics, generates reports, and provides insights for optimization.
 */

import { Logger } from '../logger/logger.js';
import type { PerformanceMetrics } from '../optimization/performance-optimizer.service.js';
import { PerformanceOptimizerService } from '../optimization/performance-optimizer.service.js';

export interface DashboardConfig {
  refreshInterval: number;
  historyRetention: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    cost: number;
  };
  enableAlerts: boolean;
  enableReporting: boolean;
  reportInterval: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'error_rate' | 'memory_usage' | 'cpu_usage' | 'cost';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
}

export interface PerformanceReport {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    totalCost: number;
    memoryPeak: number;
  };
  trends: {
    responseTime: number[];
    tokenUsage: number[];
    errorRate: number[];
    throughput: number[];
    memoryUsage: number[];
    cost: number[];
  };
  insights: string[];
  recommendations: string[];
}

export class PerformanceDashboardService {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private reports: PerformanceReport[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;
  private reportTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private logger: Logger,
    private performanceOptimizer: PerformanceOptimizerService,
    private config: Partial<DashboardConfig> = {}
  ) {
    this.config = {
      refreshInterval: 5000, // 5 seconds
      historyRetention: 24 * 60 * 60 * 1000, // 24 hours
      alertThresholds: {
        responseTime: 2000,
        errorRate: 0.05,
        memoryUsage: 100 * 1024 * 1024, // 100MB
        cpuUsage: 80,
        cost: 0.10
      },
      enableAlerts: true,
      enableReporting: true,
      reportInterval: 60 * 60 * 1000, // 1 hour
      ...config
    };
  }

  /**
   * Start the performance dashboard
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Performance dashboard is already running');
      return;
    }

    this.logger.info('Starting performance dashboard');
    this.isRunning = true;

    // Start metrics collection
    this.startMetricsCollection();

    // Start reporting
    if (this.config.enableReporting) {
      this.startReporting();
    }

    this.logger.info('Performance dashboard started successfully');
  }

  /**
   * Stop the performance dashboard
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Performance dashboard is not running');
      return;
    }

    this.logger.info('Stopping performance dashboard');
    this.isRunning = false;

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }

    this.logger.info('Performance dashboard stopped');
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    current: PerformanceMetrics | null;
    average: {
      responseTime: number;
      tokenUsage: number;
      cost: number;
      memoryUsage: number;
    };
    trends: {
      responseTime: number[];
      tokenUsage: number[];
      errorRate: number[];
      throughput: number[];
      memoryUsage: number[];
      cost: number[];
    };
    alerts: PerformanceAlert[];
  } {
    const current = this.metrics[this.metrics.length - 1] || null;
    
    const recentMetrics = this.getRecentMetrics(60 * 60 * 1000); // Last hour
    const average = this.calculateAverage(recentMetrics);
    const trends = this.calculateTrends(recentMetrics);
    
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    
    return {
      current,
      average,
      trends,
      alerts: activeAlerts
    };
  }

  /**
   * Get performance report for a specific period
   */
  getPerformanceReport(startTime: Date, endTime: Date): PerformanceReport {
    const periodMetrics = this.metrics.filter(m => 
      m.timestamp >= startTime && m.timestamp <= endTime
    );

    const summary = this.calculateSummary(periodMetrics);
    const trends = this.calculateTrends(periodMetrics);
    const insights = this.generateInsights(periodMetrics);
    const recommendations = this.generateRecommendations(periodMetrics);

    return {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      period: { start: startTime, end: endTime },
      summary,
      trends,
      insights,
      recommendations
    };
  }

  /**
   * Get all performance alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.info('Alert resolved', { alertId, type: alert.type });
      return true;
    }
    return false;
  }

  /**
   * Clear old metrics and alerts
   */
  cleanup(): void {
    const cutoff = Date.now() - this.config.historyRetention;
    
    // Clean up old metrics
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    // Clean up old alerts
    this.alerts = this.alerts.filter(a => a.timestamp.getTime() > cutoff);
    
    // Clean up old reports
    this.reports = this.reports.filter(r => r.timestamp.getTime() > cutoff);
    
    this.logger.info('Performance dashboard cleanup completed', {
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.length,
      reportsCount: this.reports.length
    });
  }

  private startMetricsCollection(): void {
    this.refreshTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.refreshInterval);
  }

  private startReporting(): void {
    this.reportTimer = setInterval(() => {
      this.generatePeriodicReport();
    }, this.config.reportInterval);
  }

  private collectMetrics(): void {
    try {
      const currentMetrics = this.performanceOptimizer.getPerformanceMetrics();
      this.metrics.push(...currentMetrics);
      
      // Check for alerts
      if (this.config.enableAlerts) {
        this.checkAlerts();
      }
      
      // Cleanup old data
      this.cleanup();
      
    } catch (error) {
      this.logger.error('Failed to collect metrics', { error });
    }
  }

  private checkAlerts(): void {
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
    if (recentMetrics.length === 0) return;

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const avgCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0) / recentMetrics.length;
    const errorCount = recentMetrics.filter(m => m.responseTime > 10000).length; // Assume >10s is error
    const errorRate = errorCount / recentMetrics.length;

    // Check response time threshold
    if (avgResponseTime > this.config.alertThresholds.responseTime) {
      this.createAlert('response_time', 'high', 
        `High response time: ${avgResponseTime.toFixed(0)}ms`, 
        avgResponseTime, this.config.alertThresholds.responseTime);
    }

    // Check error rate threshold
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('error_rate', 'high',
        `High error rate: ${(errorRate * 100).toFixed(1)}%`,
        errorRate, this.config.alertThresholds.errorRate);
    }

    // Check memory usage threshold
    if (avgMemoryUsage > this.config.alertThresholds.memoryUsage) {
      this.createAlert('memory_usage', 'medium',
        `High memory usage: ${(avgMemoryUsage / 1024 / 1024).toFixed(0)}MB`,
        avgMemoryUsage, this.config.alertThresholds.memoryUsage);
    }

    // Check cost threshold
    if (avgCost > this.config.alertThresholds.cost) {
      this.createAlert('cost', 'medium',
        `High cost per request: $${avgCost.toFixed(4)}`,
        avgCost, this.config.alertThresholds.cost);
    }
  }

  private createAlert(type: string, severity: string, message: string, value: number, threshold: number): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      severity: severity as any,
      message,
      value,
      threshold,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);
    this.logger.warn('Performance alert created', { alert });
  }

  private generatePeriodicReport(): void {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - this.config.reportInterval);
      
      const report = this.getPerformanceReport(startTime, endTime);
      this.reports.push(report);
      
      this.logger.info('Periodic performance report generated', {
        reportId: report.id,
        period: report.period,
        summary: report.summary
      });
      
    } catch (error) {
      this.logger.error('Failed to generate periodic report', { error });
    }
  }

  private getRecentMetrics(timeWindow: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  private calculateAverage(metrics: PerformanceMetrics[]): {
    responseTime: number;
    tokenUsage: number;
    cost: number;
    memoryUsage: number;
  } {
    if (metrics.length === 0) {
      return { responseTime: 0, tokenUsage: 0, cost: 0, memoryUsage: 0 };
    }

    return {
      responseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
      tokenUsage: metrics.reduce((sum, m) => sum + m.tokenUsage, 0) / metrics.length,
      cost: metrics.reduce((sum, m) => sum + m.cost, 0) / metrics.length,
      memoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length
    };
  }

  private calculateTrends(metrics: PerformanceMetrics[]): {
    responseTime: number[];
    tokenUsage: number[];
    errorRate: number[];
    throughput: number[];
    memoryUsage: number[];
    cost: number[];
  } {
    // Group metrics by time windows (e.g., every 5 minutes)
    const windowSize = 5 * 60 * 1000; // 5 minutes
    const windows: { [key: number]: PerformanceMetrics[] } = {};
    
    metrics.forEach(m => {
      const window = Math.floor(m.timestamp.getTime() / windowSize) * windowSize;
      if (!windows[window]) windows[window] = [];
      windows[window].push(m);
    });

    const sortedWindows = Object.keys(windows).map(Number).sort();
    
    return {
      responseTime: sortedWindows.map(w => 
        windows[w].reduce((sum, m) => sum + m.responseTime, 0) / windows[w].length
      ),
      tokenUsage: sortedWindows.map(w => 
        windows[w].reduce((sum, m) => sum + m.tokenUsage, 0) / windows[w].length
      ),
      errorRate: sortedWindows.map(w => 0), // Placeholder - would need error tracking
      throughput: sortedWindows.map(w => 
        windows[w].reduce((sum, m) => sum + m.tokenUsage, 0) / windows[w].length
      ),
      memoryUsage: sortedWindows.map(w => 
        windows[w].reduce((sum, m) => sum + m.memoryUsage, 0) / windows[w].length
      ),
      cost: sortedWindows.map(w => 
        windows[w].reduce((sum, m) => sum + m.cost, 0) / windows[w].length
      )
    };
  }

  private calculateSummary(metrics: PerformanceMetrics[]): {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    totalCost: number;
    memoryPeak: number;
  } {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        totalCost: 0,
        memoryPeak: 0
      };
    }

    const totalRequests = metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = metrics.filter(m => m.responseTime > 10000).length;
    const errorRate = errorCount / totalRequests;
    const timeSpan = metrics[metrics.length - 1].timestamp.getTime() - metrics[0].timestamp.getTime();
    const throughput = totalRequests / (timeSpan / 1000);
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const memoryPeak = Math.max(...metrics.map(m => m.memoryUsage));

    return {
      totalRequests,
      avgResponseTime,
      errorRate,
      throughput,
      totalCost,
      memoryPeak
    };
  }

  private generateInsights(metrics: PerformanceMetrics[]): string[] {
    const insights: string[] = [];
    
    if (metrics.length === 0) return insights;

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const avgCost = metrics.reduce((sum, m) => sum + m.cost, 0) / metrics.length;
    const memoryPeak = Math.max(...metrics.map(m => m.memoryUsage));

    if (avgResponseTime > 2000) {
      insights.push('Response times are above optimal levels, consider implementing caching');
    }

    if (avgCost > 0.05) {
      insights.push('Cost per request is high, consider optimizing token usage');
    }

    if (memoryPeak > 100 * 1024 * 1024) {
      insights.push('Memory usage is high, consider implementing memory cleanup');
    }

    const responseTimeVariance = this.calculateVariance(metrics.map(m => m.responseTime));
    if (responseTimeVariance > 1000000) { // High variance
      insights.push('Response times are inconsistent, consider load balancing');
    }

    return insights;
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.length === 0) return recommendations;

    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const avgCost = metrics.reduce((sum, m) => sum + m.cost, 0) / metrics.length;
    const memoryPeak = Math.max(...metrics.map(m => m.memoryUsage));

    if (avgResponseTime > 2000) {
      recommendations.push('Implement response caching to reduce response times');
      recommendations.push('Consider using faster AI models for simple requests');
    }

    if (avgCost > 0.05) {
      recommendations.push('Implement token optimization to reduce costs');
      recommendations.push('Consider using cheaper models for non-critical requests');
    }

    if (memoryPeak > 100 * 1024 * 1024) {
      recommendations.push('Implement memory cleanup and garbage collection optimization');
      recommendations.push('Consider reducing context size for large requests');
    }

    return recommendations;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
