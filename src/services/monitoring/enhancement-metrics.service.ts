/**
 * Enhancement Metrics Service
 * 
 * Collects, stores, and analyzes metrics for prompt enhancement
 * Provides insights into enhancement quality, performance, and costs
 * 
 * Benefits for vibe coders:
 * - Real-time monitoring of enhancement quality
 * - Cost tracking and optimization insights
 * - Performance monitoring and alerts
 * - Quality improvement recommendations
 */

import { Logger } from '../logger/logger.js';
import type { EnhancementMetrics, EnhancementStrategyMetrics } from '../../types/prompt-enhancement.types.js';

export interface MetricsDataPoint {
  timestamp: Date;
  enhancementId: string;
  strategy: string;
  qualityScore: number;
  confidenceScore: number;
  processingTime: number;
  cost: number;
  tokenUsage: number;
  success: boolean;
  error?: string;
}

export interface QualityDistribution {
  excellent: number; // 0.9-1.0
  good: number; // 0.7-0.9
  fair: number; // 0.5-0.7
  poor: number; // 0.0-0.5
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // enhancements per minute
  errorRate: number;
  successRate: number;
}

export interface CostMetrics {
  totalCost: number;
  averageCostPerEnhancement: number;
  costByStrategy: Record<string, number>;
  costByTimeframe: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
  budgetUtilization: number;
  projectedMonthlyCost: number;
}

export interface EnhancementAnalytics {
  totalEnhancements: number;
  qualityDistribution: QualityDistribution;
  performanceMetrics: PerformanceMetrics;
  costMetrics: CostMetrics;
  strategyPerformance: Record<string, EnhancementStrategyMetrics>;
  trends: {
    qualityTrend: number[]; // Last 30 days
    costTrend: number[]; // Last 30 days
    performanceTrend: number[]; // Last 30 days
  };
  recommendations: string[];
}

export class EnhancementMetricsService {
  private logger: Logger;
  private metrics: EnhancementMetrics;
  private dataPoints: MetricsDataPoint[] = [];
  private maxDataPoints: number = 10000; // Keep last 10k data points

  constructor(logger: Logger) {
    this.logger = logger;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Record a new enhancement metric
   */
  recordEnhancement(data: Omit<MetricsDataPoint, 'timestamp' | 'enhancementId'>): void {
    const dataPoint: MetricsDataPoint = {
      ...data,
      timestamp: new Date(),
      enhancementId: this.generateEnhancementId()
    };

    this.dataPoints.push(dataPoint);
    this.updateMetrics(dataPoint);

    // Keep only the most recent data points
    if (this.dataPoints.length > this.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.maxDataPoints);
    }

    this.logger.debug('Enhancement metric recorded', {
      enhancementId: dataPoint.enhancementId,
      strategy: dataPoint.strategy,
      qualityScore: dataPoint.qualityScore,
      processingTime: dataPoint.processingTime,
      cost: dataPoint.cost
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): EnhancementMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed analytics
   */
  getAnalytics(): EnhancementAnalytics {
    const qualityDistribution = this.calculateQualityDistribution();
    const performanceMetrics = this.calculatePerformanceMetrics();
    const costMetrics = this.calculateCostMetrics();
    const strategyPerformance = this.calculateStrategyPerformance();
    const trends = this.calculateTrends();
    const recommendations = this.generateRecommendations();

    return {
      totalEnhancements: this.metrics.totalEnhancements,
      qualityDistribution,
      performanceMetrics,
      costMetrics,
      strategyPerformance,
      trends,
      recommendations
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsForTimeRange(startDate: Date, endDate: Date): EnhancementMetrics {
    const filteredData = this.dataPoints.filter(
      dp => dp.timestamp >= startDate && dp.timestamp <= endDate
    );

    return this.calculateMetricsFromData(filteredData);
  }

  /**
   * Get strategy performance comparison
   */
  getStrategyComparison(): Record<string, EnhancementStrategyMetrics> {
    return this.calculateStrategyPerformance();
  }

  /**
   * Get quality trends over time
   */
  getQualityTrends(days: number = 30): number[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentData = this.dataPoints.filter(dp => dp.timestamp >= cutoffDate);
    const dailyAverages: number[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(cutoffDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayData = recentData.filter(
        dp => dp.timestamp >= dayStart && dp.timestamp < dayEnd
      );

      if (dayData.length > 0) {
        const averageQuality = dayData.reduce((sum, dp) => sum + dp.qualityScore, 0) / dayData.length;
        dailyAverages.push(averageQuality);
      } else {
        dailyAverages.push(0);
      }
    }

    return dailyAverages;
  }

  /**
   * Get cost trends over time
   */
  getCostTrends(days: number = 30): number[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentData = this.dataPoints.filter(dp => dp.timestamp >= cutoffDate);
    const dailyCosts: number[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(cutoffDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayData = recentData.filter(
        dp => dp.timestamp >= dayStart && dp.timestamp < dayEnd
      );

      const dailyCost = dayData.reduce((sum, dp) => sum + dp.cost, 0);
      dailyCosts.push(dailyCost);
    }

    return dailyCosts;
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(): string[] {
    const alerts: string[] = [];
    const analytics = this.getAnalytics();

    // Quality alerts
    if (analytics.qualityDistribution.poor > 0.1) {
      alerts.push(`High percentage of poor quality enhancements: ${(analytics.qualityDistribution.poor * 100).toFixed(1)}%`);
    }

    // Performance alerts
    if (analytics.performanceMetrics.averageResponseTime > 5000) {
      alerts.push(`Slow average response time: ${analytics.performanceMetrics.averageResponseTime.toFixed(0)}ms`);
    }

    if (analytics.performanceMetrics.errorRate > 0.05) {
      alerts.push(`High error rate: ${(analytics.performanceMetrics.errorRate * 100).toFixed(1)}%`);
    }

    // Cost alerts
    if (analytics.costMetrics.budgetUtilization > 0.8) {
      alerts.push(`High budget utilization: ${(analytics.costMetrics.budgetUtilization * 100).toFixed(1)}%`);
    }

    return alerts;
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.dataPoints = [];
    this.logger.info('Enhancement metrics reset');
  }

  /**
   * Export metrics data
   */
  exportMetrics(): {
    metrics: EnhancementMetrics;
    dataPoints: MetricsDataPoint[];
    analytics: EnhancementAnalytics;
  } {
    return {
      metrics: this.getMetrics(),
      dataPoints: [...this.dataPoints],
      analytics: this.getAnalytics()
    };
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): EnhancementMetrics {
    return {
      totalEnhancements: 0,
      successfulEnhancements: 0,
      failedEnhancements: 0,
      averageQualityScore: 0,
      averageConfidenceScore: 0,
      averageProcessingTime: 0,
      totalCost: 0,
      averageCostPerEnhancement: 0,
      qualityDistribution: {},
      strategyPerformance: {}
    };
  }

  /**
   * Update metrics with new data point
   */
  private updateMetrics(dataPoint: MetricsDataPoint): void {
    this.metrics.totalEnhancements++;

    if (dataPoint.success) {
      this.metrics.successfulEnhancements++;
      this.metrics.averageQualityScore = 
        (this.metrics.averageQualityScore * (this.metrics.successfulEnhancements - 1) + dataPoint.qualityScore) / 
        this.metrics.successfulEnhancements;
      this.metrics.averageConfidenceScore = 
        (this.metrics.averageConfidenceScore * (this.metrics.successfulEnhancements - 1) + dataPoint.confidenceScore) / 
        this.metrics.successfulEnhancements;
      this.metrics.totalCost += dataPoint.cost;
    } else {
      this.metrics.failedEnhancements++;
    }

    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalEnhancements - 1) + dataPoint.processingTime) / 
      this.metrics.totalEnhancements;

    this.metrics.averageCostPerEnhancement = 
      this.metrics.totalCost / this.metrics.successfulEnhancements;

    // Update quality distribution
    this.updateQualityDistribution(dataPoint.qualityScore);

    // Update strategy performance
    this.updateStrategyPerformance(dataPoint);
  }

  /**
   * Update quality distribution
   */
  private updateQualityDistribution(qualityScore: number): void {
    const distribution = this.metrics.qualityDistribution;
    
    if (qualityScore >= 0.9) {
      distribution.excellent = (distribution.excellent || 0) + 1;
    } else if (qualityScore >= 0.7) {
      distribution.good = (distribution.good || 0) + 1;
    } else if (qualityScore >= 0.5) {
      distribution.fair = (distribution.fair || 0) + 1;
    } else {
      distribution.poor = (distribution.poor || 0) + 1;
    }
  }

  /**
   * Update strategy performance
   */
  private updateStrategyPerformance(dataPoint: MetricsDataPoint): void {
    const strategy = dataPoint.strategy;
    if (!this.metrics.strategyPerformance[strategy]) {
      this.metrics.strategyPerformance[strategy] = {
        usage: 0,
        successRate: 0,
        averageQuality: 0,
        averageConfidence: 0,
        averageCost: 0,
        averageTime: 0
      };
    }

    const strategyMetrics = this.metrics.strategyPerformance[strategy];
    strategyMetrics.usage++;
    strategyMetrics.successRate = 
      (strategyMetrics.successRate * (strategyMetrics.usage - 1) + (dataPoint.success ? 1 : 0)) / 
      strategyMetrics.usage;
    strategyMetrics.averageQuality = 
      (strategyMetrics.averageQuality * (strategyMetrics.usage - 1) + dataPoint.qualityScore) / 
      strategyMetrics.usage;
    strategyMetrics.averageConfidence = 
      (strategyMetrics.averageConfidence * (strategyMetrics.usage - 1) + dataPoint.confidenceScore) / 
      strategyMetrics.usage;
    strategyMetrics.averageCost = 
      (strategyMetrics.averageCost * (strategyMetrics.usage - 1) + dataPoint.cost) / 
      strategyMetrics.usage;
    strategyMetrics.averageTime = 
      (strategyMetrics.averageTime * (strategyMetrics.usage - 1) + dataPoint.processingTime) / 
      strategyMetrics.usage;
  }

  /**
   * Calculate quality distribution
   */
  private calculateQualityDistribution(): QualityDistribution {
    const total = this.dataPoints.length;
    if (total === 0) {
      return { excellent: 0, good: 0, fair: 0, poor: 0 };
    }

    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    this.dataPoints.forEach(dp => {
      if (dp.qualityScore >= 0.9) {
        distribution.excellent++;
      } else if (dp.qualityScore >= 0.7) {
        distribution.good++;
      } else if (dp.qualityScore >= 0.5) {
        distribution.fair++;
      } else {
        distribution.poor++;
      }
    });

    return {
      excellent: distribution.excellent / total,
      good: distribution.good / total,
      fair: distribution.fair / total,
      poor: distribution.poor / total
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(): PerformanceMetrics {
    if (this.dataPoints.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        successRate: 0
      };
    }

    const processingTimes = this.dataPoints.map(dp => dp.processingTime).sort((a, b) => a - b);
    const successful = this.dataPoints.filter(dp => dp.success).length;
    const failed = this.dataPoints.length - successful;

    return {
      averageResponseTime: processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length,
      p95ResponseTime: processingTimes[Math.floor(processingTimes.length * 0.95)],
      p99ResponseTime: processingTimes[Math.floor(processingTimes.length * 0.99)],
      throughput: this.calculateThroughput(),
      errorRate: failed / this.dataPoints.length,
      successRate: successful / this.dataPoints.length
    };
  }

  /**
   * Calculate cost metrics
   */
  private calculateCostMetrics(): CostMetrics {
    const totalCost = this.dataPoints.reduce((sum, dp) => sum + dp.cost, 0);
    const costByStrategy: Record<string, number> = {};
    
    this.dataPoints.forEach(dp => {
      costByStrategy[dp.strategy] = (costByStrategy[dp.strategy] || 0) + dp.cost;
    });

    return {
      totalCost,
      averageCostPerEnhancement: totalCost / this.dataPoints.length,
      costByStrategy,
      costByTimeframe: {
        hourly: this.calculateHourlyCosts(),
        daily: this.calculateDailyCosts(),
        weekly: this.calculateWeeklyCosts()
      },
      budgetUtilization: 0, // Would need budget configuration
      projectedMonthlyCost: this.calculateProjectedMonthlyCost()
    };
  }

  /**
   * Calculate strategy performance
   */
  private calculateStrategyPerformance(): Record<string, EnhancementStrategyMetrics> {
    const strategies: Record<string, EnhancementStrategyMetrics> = {};
    
    Object.keys(this.metrics.strategyPerformance).forEach(strategy => {
      strategies[strategy] = { ...this.metrics.strategyPerformance[strategy] };
    });

    return strategies;
  }

  /**
   * Calculate trends
   */
  private calculateTrends(): {
    qualityTrend: number[];
    costTrend: number[];
    performanceTrend: number[];
  } {
    return {
      qualityTrend: this.getQualityTrends(30),
      costTrend: this.getCostTrends(30),
      performanceTrend: this.getPerformanceTrends(30)
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const analytics = this.getAnalytics();

    // Quality recommendations
    if (analytics.qualityDistribution.poor > 0.1) {
      recommendations.push('Consider improving prompt templates or increasing context quality');
    }

    // Performance recommendations
    if (analytics.performanceMetrics.averageResponseTime > 3000) {
      recommendations.push('Consider optimizing token usage or using faster models');
    }

    // Cost recommendations
    if (analytics.costMetrics.averageCostPerEnhancement > 0.1) {
      recommendations.push('Consider using more efficient models or reducing token usage');
    }

    // Strategy recommendations
    const strategies = Object.keys(analytics.strategyPerformance);
    if (strategies.length > 1) {
      const bestStrategy = strategies.reduce((best, current) => 
        analytics.strategyPerformance[current].averageQuality > analytics.strategyPerformance[best].averageQuality 
          ? current : best
      );
      recommendations.push(`Consider using ${bestStrategy} strategy more frequently`);
    }

    return recommendations;
  }

  /**
   * Calculate throughput (enhancements per minute)
   */
  private calculateThroughput(): number {
    if (this.dataPoints.length === 0) return 0;

    const timeSpan = this.dataPoints[this.dataPoints.length - 1].timestamp.getTime() - 
                     this.dataPoints[0].timestamp.getTime();
    const minutes = timeSpan / (1000 * 60);
    
    return minutes > 0 ? this.dataPoints.length / minutes : 0;
  }

  /**
   * Calculate hourly costs
   */
  private calculateHourlyCosts(): number[] {
    const hourlyCosts: number[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(hourStart.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const hourData = this.dataPoints.filter(
        dp => dp.timestamp >= hourStart && dp.timestamp < hourEnd
      );

      const hourCost = hourData.reduce((sum, dp) => sum + dp.cost, 0);
      hourlyCosts.push(hourCost);
    }

    return hourlyCosts;
  }

  /**
   * Calculate daily costs
   */
  private calculateDailyCosts(): number[] {
    const dailyCosts: number[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayData = this.dataPoints.filter(
        dp => dp.timestamp >= dayStart && dp.timestamp < dayEnd
      );

      const dayCost = dayData.reduce((sum, dp) => sum + dp.cost, 0);
      dailyCosts.push(dayCost);
    }

    return dailyCosts;
  }

  /**
   * Calculate weekly costs
   */
  private calculateWeeklyCosts(): number[] {
    const weeklyCosts: number[] = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekData = this.dataPoints.filter(
        dp => dp.timestamp >= weekStart && dp.timestamp < weekEnd
      );

      const weekCost = weekData.reduce((sum, dp) => sum + dp.cost, 0);
      weeklyCosts.push(weekCost);
    }

    return weeklyCosts;
  }

  /**
   * Calculate projected monthly cost
   */
  private calculateProjectedMonthlyCost(): number {
    if (this.dataPoints.length === 0) return 0;

    const now = new Date();
    const firstDataPoint = this.dataPoints[0].timestamp;
    const daysElapsed = (now.getTime() - firstDataPoint.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysElapsed === 0) return 0;

    const totalCost = this.dataPoints.reduce((sum, dp) => sum + dp.cost, 0);
    const dailyAverageCost = totalCost / daysElapsed;
    
    return dailyAverageCost * 30; // Project to 30 days
  }

  /**
   * Get performance trends
   */
  private getPerformanceTrends(days: number = 30): number[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentData = this.dataPoints.filter(dp => dp.timestamp >= cutoffDate);
    const dailyAverages: number[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(cutoffDate);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayData = recentData.filter(
        dp => dp.timestamp >= dayStart && dp.timestamp < dayEnd
      );

      if (dayData.length > 0) {
        const averageTime = dayData.reduce((sum, dp) => sum + dp.processingTime, 0) / dayData.length;
        dailyAverages.push(averageTime);
      } else {
        dailyAverages.push(0);
      }
    }

    return dailyAverages;
  }

  /**
   * Calculate metrics from data points
   */
  private calculateMetricsFromData(dataPoints: MetricsDataPoint[]): EnhancementMetrics {
    if (dataPoints.length === 0) {
      return this.initializeMetrics();
    }

    const successful = dataPoints.filter(dp => dp.success);
    const totalCost = dataPoints.reduce((sum, dp) => sum + dp.cost, 0);
    const totalTime = dataPoints.reduce((sum, dp) => sum + dp.processingTime, 0);

    return {
      totalEnhancements: dataPoints.length,
      successfulEnhancements: successful.length,
      failedEnhancements: dataPoints.length - successful.length,
      averageQualityScore: successful.reduce((sum, dp) => sum + dp.qualityScore, 0) / successful.length,
      averageConfidenceScore: successful.reduce((sum, dp) => sum + dp.confidenceScore, 0) / successful.length,
      averageProcessingTime: totalTime / dataPoints.length,
      totalCost,
      averageCostPerEnhancement: totalCost / dataPoints.length,
      qualityDistribution: {},
      strategyPerformance: {}
    };
  }

  /**
   * Generate unique enhancement ID
   */
  private generateEnhancementId(): string {
    return `enh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
