/**
 * Cache Analytics Service
 * 
 * Provides comprehensive analytics and monitoring for all cache systems
 * including Context7 cache, prompt cache, and framework cache.
 */

import { Logger } from '../logger/logger.js';
import { Context7AdvancedCacheService, type Context7CacheStats } from '../context7/context7-advanced-cache.service.js';
import { PromptCacheService, type PromptCacheStats } from './prompt-cache.service.js';

export interface CacheAnalyticsData {
  timestamp: number;
  context7Cache: Context7CacheStats;
  promptCache: PromptCacheStats;
  frameworkCache: {
    totalEntries: number;
    hitRate: number;
    averageResponseTime: number;
  };
  overall: {
    totalCacheSize: number;
    overallHitRate: number;
    averageResponseTime: number;
    cacheEfficiency: number;
    costSavings: number;
  };
}

export interface CachePerformanceMetrics {
  period: 'hour' | 'day' | 'week';
  dataPoints: CacheAnalyticsData[];
  trends: {
    hitRateTrend: 'improving' | 'stable' | 'declining';
    responseTimeTrend: 'improving' | 'stable' | 'declining';
    cacheSizeTrend: 'growing' | 'stable' | 'shrinking';
  };
  recommendations: string[];
}

export interface CacheOptimizationReport {
  currentPerformance: CacheAnalyticsData;
  issues: Array<{
    type: 'low_hit_rate' | 'high_response_time' | 'cache_size' | 'memory_usage';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  optimizations: Array<{
    type: 'ttl_adjustment' | 'cache_size' | 'key_optimization' | 'cleanup_frequency';
    impact: 'low' | 'medium' | 'high';
    description: string;
    estimatedImprovement: string;
  }>;
}

export class CacheAnalyticsService {
  private logger: Logger;
  private context7Cache: Context7AdvancedCacheService;
  private promptCache: PromptCacheService;
  private analyticsHistory: CacheAnalyticsData[] = [];
  private maxHistorySize = 1000;

  constructor(
    logger: Logger,
    context7Cache: Context7AdvancedCacheService,
    promptCache: PromptCacheService
  ) {
    this.logger = logger;
    this.context7Cache = context7Cache;
    this.promptCache = promptCache;
  }

  /**
   * Collect comprehensive cache analytics
   */
  async collectAnalytics(): Promise<CacheAnalyticsData> {
    try {
      const context7Stats = this.context7Cache.getCacheStats();
      const promptStats = this.promptCache.getCacheStats();
      
      // Mock framework cache stats (would be real in production)
      const frameworkCacheStats = {
        totalEntries: 0,
        hitRate: 0,
        averageResponseTime: 0
      };

      const analytics: CacheAnalyticsData = {
        timestamp: Date.now(),
        context7Cache: context7Stats,
        promptCache: promptStats,
        frameworkCache: frameworkCacheStats,
        overall: {
          totalCacheSize: context7Stats.memory.size + promptStats.cacheSize,
          overallHitRate: this.calculateOverallHitRate(context7Stats, promptStats),
          averageResponseTime: this.calculateAverageResponseTime(context7Stats, promptStats),
          cacheEfficiency: this.calculateCacheEfficiency(context7Stats, promptStats),
          costSavings: this.calculateCostSavings(context7Stats, promptStats)
        }
      };

      // Store in history
      this.analyticsHistory.push(analytics);
      if (this.analyticsHistory.length > this.maxHistorySize) {
        this.analyticsHistory = this.analyticsHistory.slice(-this.maxHistorySize);
      }

      this.logger.debug('Cache analytics collected', {
        totalCacheSize: analytics.overall.totalCacheSize,
        overallHitRate: analytics.overall.overallHitRate,
        cacheEfficiency: analytics.overall.cacheEfficiency
      });

      return analytics;

    } catch (error) {
      this.logger.error('Failed to collect cache analytics', { error });
      throw error;
    }
  }

  /**
   * Calculate overall hit rate across all caches
   */
  private calculateOverallHitRate(context7Stats: Context7CacheStats, promptStats: PromptCacheStats): number {
    const context7Total = context7Stats.memory.size + context7Stats.sqlite.totalEntries;
    const promptTotal = promptStats.totalHits + promptStats.totalMisses;
    
    if (context7Total === 0 && promptTotal === 0) return 0;
    
    const totalHits = context7Stats.memory.size + context7Stats.sqlite.totalEntries + promptStats.totalHits;
    const totalRequests = context7Total + promptTotal;
    
    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  /**
   * Calculate average response time across all caches
   */
  private calculateAverageResponseTime(context7Stats: Context7CacheStats, promptStats: PromptCacheStats): number {
    const context7Avg = context7Stats.performance.avgGetTime;
    const promptAvg = promptStats.averageResponseTime;
    
    // Weight by cache size
    const context7Weight = context7Stats.memory.size;
    const promptWeight = promptStats.cacheSize;
    const totalWeight = context7Weight + promptWeight;
    
    if (totalWeight === 0) return 0;
    
    return ((context7Avg * context7Weight) + (promptAvg * promptWeight)) / totalWeight;
  }

  /**
   * Calculate cache efficiency score (0-100)
   */
  private calculateCacheEfficiency(context7Stats: Context7CacheStats, promptStats: PromptCacheStats): number {
    const hitRate = this.calculateOverallHitRate(context7Stats, promptStats);
    const responseTime = this.calculateAverageResponseTime(context7Stats, promptStats);
    
    // Efficiency based on hit rate and response time
    const hitRateScore = Math.min(hitRate, 100);
    const responseTimeScore = Math.max(0, 100 - (responseTime / 10)); // Penalize slow responses
    
    return Math.round((hitRateScore + responseTimeScore) / 2);
  }

  /**
   * Calculate estimated cost savings from caching
   */
  private calculateCostSavings(context7Stats: Context7CacheStats, promptStats: PromptCacheStats): number {
    // Estimate cost savings based on cache hits
    const context7Savings = (context7Stats.memory.size + context7Stats.sqlite.totalEntries) * 0.001; // $0.001 per entry
    const promptSavings = promptStats.totalHits * 0.0005; // $0.0005 per hit
    
    return Math.round((context7Savings + promptSavings) * 100) / 100;
  }

  /**
   * Get performance metrics for a specific period
   */
  getPerformanceMetrics(period: 'hour' | 'day' | 'week'): CachePerformanceMetrics {
    const now = Date.now();
    const periodMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    }[period];

    const cutoffTime = now - periodMs;
    const dataPoints = this.analyticsHistory.filter(data => data.timestamp >= cutoffTime);

    const trends = this.analyzeTrends(dataPoints);
    const recommendations = this.generateRecommendations(dataPoints);

    return {
      period,
      dataPoints,
      trends,
      recommendations
    };
  }

  /**
   * Analyze trends in cache performance
   */
  private analyzeTrends(dataPoints: CacheAnalyticsData[]): CachePerformanceMetrics['trends'] {
    if (dataPoints.length < 2) {
      return {
        hitRateTrend: 'stable',
        responseTimeTrend: 'stable',
        cacheSizeTrend: 'stable'
      };
    }

    const first = dataPoints[0];
    const last = dataPoints[dataPoints.length - 1];

    const hitRateChange = (last?.overall.overallHitRate || 0) - (first?.overall.overallHitRate || 0);
    const responseTimeChange = (last?.overall.averageResponseTime || 0) - (first?.overall.averageResponseTime || 0);
    const cacheSizeChange = (last?.overall.totalCacheSize || 0) - (first?.overall.totalCacheSize || 0);

    return {
      hitRateTrend: this.categorizeTrend(hitRateChange, 5), // 5% threshold
      responseTimeTrend: this.categorizeTrend(-responseTimeChange, 10), // Negative because lower is better
      cacheSizeTrend: this.categorizeSizeTrend(cacheSizeChange, 100) // 100 entries threshold
    };
  }

  /**
   * Categorize trend based on change value
   */
  private categorizeTrend(change: number, threshold: number): 'improving' | 'stable' | 'declining' {
    if (change > threshold) return 'improving';
    if (change < -threshold) return 'declining';
    return 'stable';
  }

  /**
   * Categorize size trend based on change value
   */
  private categorizeSizeTrend(change: number, threshold: number): 'growing' | 'stable' | 'shrinking' {
    if (change > threshold) return 'growing';
    if (change < -threshold) return 'shrinking';
    return 'stable';
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(dataPoints: CacheAnalyticsData[]): string[] {
    const recommendations: string[] = [];
    
    if (dataPoints.length === 0) return recommendations;

    const latest = dataPoints[dataPoints.length - 1];
    const avgHitRate = dataPoints.reduce((sum, dp) => sum + dp.overall.overallHitRate, 0) / dataPoints.length;
    const avgResponseTime = dataPoints.reduce((sum, dp) => sum + dp.overall.averageResponseTime, 0) / dataPoints.length;

    // Hit rate recommendations
    if (avgHitRate < 70) {
      recommendations.push('Consider increasing cache TTL or improving cache key generation for better hit rates');
    }

    // Response time recommendations
    if (avgResponseTime > 100) {
      recommendations.push('Response times are high - consider optimizing cache lookup or increasing memory cache size');
    }

    // Cache size recommendations
    if (latest?.overall.totalCacheSize && latest.overall.totalCacheSize > 10000) {
      recommendations.push('Cache size is large - consider implementing more aggressive cleanup policies');
    }

    // Memory usage recommendations
    if (latest?.context7Cache?.memory && latest.context7Cache.memory.size / latest.context7Cache.memory.maxSize > 0.8) {
      recommendations.push('Memory cache usage is high - consider increasing memory limits or optimizing data storage');
    }

    // Cost optimization
    if (latest?.overall?.costSavings && latest.overall.costSavings < 1) {
      recommendations.push('Low cost savings detected - review cache configuration and hit rate optimization');
    }

    return recommendations;
  }

  /**
   * Generate comprehensive optimization report
   */
  async generateOptimizationReport(): Promise<CacheOptimizationReport> {
    const currentPerformance = await this.collectAnalytics();
    const issues = this.identifyIssues(currentPerformance);
    const optimizations = this.suggestOptimizations(currentPerformance);

    return {
      currentPerformance,
      issues,
      optimizations
    };
  }

  /**
   * Identify performance issues
   */
  private identifyIssues(performance: CacheAnalyticsData): CacheOptimizationReport['issues'] {
    const issues: CacheOptimizationReport['issues'] = [];

    // Low hit rate issue
    if (performance.overall.overallHitRate < 70) {
      issues.push({
        type: 'low_hit_rate',
        severity: performance.overall.overallHitRate < 50 ? 'high' : 'medium',
        description: `Overall hit rate is ${performance.overall.overallHitRate.toFixed(1)}%, below recommended 70%`,
        recommendation: 'Review cache key generation and TTL settings'
      });
    }

    // High response time issue
    if (performance.overall.averageResponseTime > 100) {
      issues.push({
        type: 'high_response_time',
        severity: performance.overall.averageResponseTime > 200 ? 'high' : 'medium',
        description: `Average response time is ${performance.overall.averageResponseTime}ms, above recommended 100ms`,
        recommendation: 'Optimize cache lookup algorithms and consider increasing memory cache size'
      });
    }

    // Cache size issue
    if (performance.overall.totalCacheSize > 10000) {
      issues.push({
        type: 'cache_size',
        severity: performance.overall.totalCacheSize > 50000 ? 'high' : 'medium',
        description: `Total cache size is ${performance.overall.totalCacheSize} entries, above recommended 10,000`,
        recommendation: 'Implement more aggressive cleanup policies and cache size limits'
      });
    }

    // Memory usage issue
    if (performance.context7Cache.memory.size / performance.context7Cache.memory.maxSize > 0.8) {
      issues.push({
        type: 'memory_usage',
        severity: (performance.context7Cache.memory.size / performance.context7Cache.memory.maxSize) > 0.9 ? 'high' : 'medium',
        description: `Memory cache usage is ${((performance.context7Cache.memory.size / performance.context7Cache.memory.maxSize) * 100).toFixed(1)}%, above recommended 80%`,
        recommendation: 'Increase memory limits or optimize data storage format'
      });
    }

    return issues;
  }

  /**
   * Suggest optimizations
   */
  private suggestOptimizations(performance: CacheAnalyticsData): CacheOptimizationReport['optimizations'] {
    const optimizations: CacheOptimizationReport['optimizations'] = [];

    // TTL adjustments
    if (performance.overall.overallHitRate < 70) {
      optimizations.push({
        type: 'ttl_adjustment',
        impact: 'medium',
        description: 'Increase TTL for frequently accessed data',
        estimatedImprovement: '10-20% hit rate improvement'
      });
    }

    // Cache size optimization
    if (performance.overall.totalCacheSize > 5000) {
      optimizations.push({
        type: 'cache_size',
        impact: 'high',
        description: 'Implement LRU eviction and size limits',
        estimatedImprovement: '30-50% memory usage reduction'
      });
    }

    // Key optimization
    if (performance.overall.overallHitRate < 80) {
      optimizations.push({
        type: 'key_optimization',
        impact: 'medium',
        description: 'Improve cache key generation for better hit rates',
        estimatedImprovement: '15-25% hit rate improvement'
      });
    }

    // Cleanup frequency
    if (performance.overall.totalCacheSize > 1000) {
      optimizations.push({
        type: 'cleanup_frequency',
        impact: 'low',
        description: 'Increase cleanup frequency for expired entries',
        estimatedImprovement: '5-10% performance improvement'
      });
    }

    return optimizations;
  }

  /**
   * Get cache health score (0-100)
   */
  getCacheHealthScore(): number {
    if (this.analyticsHistory.length === 0) return 0;

    const latest = this.analyticsHistory[this.analyticsHistory.length - 1];
    return latest?.overall?.cacheEfficiency || 0;
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      analytics: this.analyticsHistory,
      healthScore: this.getCacheHealthScore()
    }, null, 2);
  }

  /**
   * Clear analytics history
   */
  clearHistory(): void {
    this.analyticsHistory = [];
    this.logger.info('Cache analytics history cleared');
  }
}
