/**
 * Simple Summarization Monitor
 * 
 * Lightweight monitoring for AI summarization performance
 * and cache effectiveness.
 */

import { Logger } from '../logger/logger.js';

export interface SummarizationMetrics {
  totalRequests: number;
  summarizationAttempts: number;
  summarizationSuccesses: number;
  averageTokenReduction: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  totalTokensSaved: number;
  lastUpdated: Date;
}

export class SimpleSummarizationMonitor {
  private logger: Logger;
  private metrics: SummarizationMetrics;
  private startTime: Date;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('SimpleSummarizationMonitor');
    this.startTime = new Date();
    this.metrics = {
      totalRequests: 0,
      summarizationAttempts: 0,
      summarizationSuccesses: 0,
      averageTokenReduction: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      totalTokensSaved: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Track a request
   */
  trackRequest(): void {
    this.metrics.totalRequests++;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Track summarization attempt
   */
  trackSummarizationAttempt(): void {
    this.metrics.summarizationAttempts++;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Track successful summarization
   */
  trackSummarizationSuccess(tokenReduction: number, processingTime: number): void {
    this.metrics.summarizationSuccesses++;
    
    // Update average token reduction
    this.metrics.averageTokenReduction = 
      (this.metrics.averageTokenReduction * (this.metrics.summarizationSuccesses - 1) + tokenReduction) / 
      this.metrics.summarizationSuccesses;
    
    // Update average processing time
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.summarizationSuccesses - 1) + processingTime) / 
      this.metrics.summarizationSuccesses;
    
    // Update total tokens saved
    this.metrics.totalTokensSaved += Math.round(tokenReduction);
    
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Track cache hit
   */
  trackCacheHit(): void {
    // Simple cache hit rate calculation
    const totalCacheRequests = this.metrics.totalRequests;
    if (totalCacheRequests > 0) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (totalCacheRequests - 1) + 1) / totalCacheRequests;
    }
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Track cache miss
   */
  trackCacheMiss(): void {
    // Simple cache hit rate calculation
    const totalCacheRequests = this.metrics.totalRequests;
    if (totalCacheRequests > 0) {
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate * (totalCacheRequests - 1)) / totalCacheRequests;
    }
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Get current metrics
   */
  getMetrics(): SummarizationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): string {
    const uptime = Date.now() - this.startTime.getTime();
    const uptimeHours = Math.round(uptime / (1000 * 60 * 60) * 100) / 100;
    
    const successRate = this.metrics.summarizationAttempts > 0 
      ? Math.round((this.metrics.summarizationSuccesses / this.metrics.summarizationAttempts) * 100)
      : 0;

    return `
📊 Summarization Performance Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Uptime: ${uptimeHours} hours
📈 Total Requests: ${this.metrics.totalRequests}
🎯 Summarization Attempts: ${this.metrics.summarizationAttempts}
✅ Success Rate: ${successRate}%
📉 Avg Token Reduction: ${Math.round(this.metrics.averageTokenReduction)}%
⚡ Avg Processing Time: ${Math.round(this.metrics.averageProcessingTime)}ms
💾 Cache Hit Rate: ${Math.round(this.metrics.cacheHitRate * 100)}%
💾 Total Tokens Saved: ${this.metrics.totalTokensSaved.toLocaleString()}
🕒 Last Updated: ${this.metrics.lastUpdated.toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  /**
   * Log performance summary
   */
  logPerformanceSummary(): void {
    this.logger.info('Summarization Performance Summary', {
      totalRequests: this.metrics.totalRequests,
      summarizationAttempts: this.metrics.summarizationAttempts,
      successRate: this.metrics.summarizationAttempts > 0 
        ? Math.round((this.metrics.summarizationSuccesses / this.metrics.summarizationAttempts) * 100) + '%'
        : 'N/A',
      averageTokenReduction: Math.round(this.metrics.averageTokenReduction) + '%',
      averageProcessingTime: Math.round(this.metrics.averageProcessingTime) + 'ms',
      cacheHitRate: Math.round(this.metrics.cacheHitRate * 100) + '%',
      totalTokensSaved: this.metrics.totalTokensSaved.toLocaleString()
    });
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      summarizationAttempts: 0,
      summarizationSuccesses: 0,
      averageTokenReduction: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      totalTokensSaved: 0,
      lastUpdated: new Date()
    };
    this.startTime = new Date();
    this.logger.info('Summarization metrics reset');
  }

  /**
   * Check if summarization is effective
   */
  isSummarizationEffective(): boolean {
    return this.metrics.summarizationSuccesses > 0 && 
           this.metrics.averageTokenReduction > 30 && // At least 30% reduction
           this.metrics.averageProcessingTime < 5000; // Less than 5 seconds
  }

  /**
   * Get recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.summarizationAttempts === 0) {
      recommendations.push('No summarization attempts yet. Consider enabling summarization for large contexts.');
    } else if (this.metrics.summarizationSuccesses / this.metrics.summarizationAttempts < 0.8) {
      recommendations.push('Summarization success rate is low. Check OpenAI API key and configuration.');
    }

    if (this.metrics.averageTokenReduction < 30) {
      recommendations.push('Token reduction is low. Consider adjusting summarization prompts.');
    }

    if (this.metrics.averageProcessingTime > 5000) {
      recommendations.push('Processing time is high. Consider using a faster model or reducing context size.');
    }

    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low. Consider increasing cache TTL or improving cache keys.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Summarization is performing well! No recommendations at this time.');
    }

    return recommendations;
  }
}
