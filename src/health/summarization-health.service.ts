/**
 * Health Check Service for AI Summarization
 */

import { Logger } from '../services/logger/logger.js';
import { SimpleSummarizationService } from '../services/ai/simple-summarization.service.js';
import { EnhancedPromptCacheService } from '../services/cache/enhanced-prompt-cache.service.js';
import { SimpleSummarizationMonitor } from '../services/monitoring/simple-summarization-monitor.service.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    summarization: CheckResult;
    cache: CheckResult;
    openai: CheckResult;
    overall: CheckResult;
  };
  metrics: {
    uptime: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
  };
}

export interface CheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: any;
}

export class SummarizationHealthService {
  private logger: Logger;
  private summarizationService: SimpleSummarizationService;
  private cacheService: EnhancedPromptCacheService;
  private monitor: SimpleSummarizationMonitor;
  private startTime: Date;

  constructor(
    summarizationService: SimpleSummarizationService,
    cacheService: EnhancedPromptCacheService,
    monitor: SimpleSummarizationMonitor,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('SummarizationHealthService');
    this.summarizationService = summarizationService;
    this.cacheService = cacheService;
    this.monitor = monitor;
    this.startTime = new Date();
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkSummarization(),
      this.checkCache(),
      this.checkOpenAI()
    ]);

    const [summarization, cache, openai] = checks;
    const overall = this.determineOverallStatus([summarization, cache, openai]);

    const metrics = this.monitor.getMetrics();
    const uptime = Date.now() - this.startTime.getTime();

    return {
      status: overall.status,
      timestamp: new Date(),
      checks: {
        summarization,
        cache,
        openai,
        overall
      },
      metrics: {
        uptime,
        totalRequests: metrics.totalRequests,
        successRate: metrics.summarizationAttempts > 0 
          ? metrics.summarizationSuccesses / metrics.summarizationAttempts 
          : 0,
        averageResponseTime: metrics.averageProcessingTime
      }
    };
  }

  /**
   * Check summarization service health
   */
  private async checkSummarization(): Promise<CheckResult> {
    try {
      const testContext = {
        repo_facts: ['Test fact'],
        code_snippets: ['Test snippet'],
        context7_docs: ['Test doc']
      };

      const startTime = Date.now();
      const result = await this.summarizationService.summarizeContext(testContext);
      const responseTime = Date.now() - startTime;

      if (responseTime > 10000) {
        return {
          status: 'degraded',
          message: 'Summarization service responding slowly',
          details: { responseTime }
        };
      }

      return {
        status: 'healthy',
        message: 'Summarization service healthy',
        details: { responseTime, tokenReduction: result.originalTokenCount - result.summarizedTokenCount }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Summarization service failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Check cache service health
   */
  private async checkCache(): Promise<CheckResult> {
    try {
      const stats = await this.cacheService.getEnhancedStats();
      
      if (stats.hitRate < 0.3) {
        return {
          status: 'degraded',
          message: 'Cache hit rate is low',
          details: { hitRate: stats.hitRate }
        };
      }

      return {
        status: 'healthy',
        message: 'Cache service healthy',
        details: { hitRate: stats.hitRate, totalEntries: stats.totalEntries }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Cache service failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Check OpenAI API health
   */
  private async checkOpenAI(): Promise<CheckResult> {
    try {
      // Simple test request
      const testContext = {
        repo_facts: ['Test fact for OpenAI health check'],
        code_snippets: [],
        context7_docs: []
      };

      const startTime = Date.now();
      await this.summarizationService.summarizeContext(testContext);
      const responseTime = Date.now() - startTime;

      if (responseTime > 15000) {
        return {
          status: 'degraded',
          message: 'OpenAI API responding slowly',
          details: { responseTime }
        };
      }

      return {
        status: 'healthy',
        message: 'OpenAI API healthy',
        details: { responseTime }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'OpenAI API failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(checks: CheckResult[]): CheckResult {
    const failedChecks = checks.filter(c => c.status === 'unhealthy');
    const warningChecks = checks.filter(c => c.status === 'degraded');

    if (failedChecks.length > 0) {
      return {
        status: 'unhealthy',
        message: `${failedChecks.length} critical checks failed`,
        details: { failedChecks: failedChecks.map(c => c.message) }
      };
    }

    if (warningChecks.length > 0) {
      return {
        status: 'degraded',
        message: `${warningChecks.length} checks have warnings`,
        details: { warningChecks: warningChecks.map(c => c.message) }
      };
    }

    return {
      status: 'healthy',
      message: 'All systems healthy',
      details: { totalChecks: checks.length }
    };
  }

  /**
   * Get health status as JSON
   */
  async getHealthJSON(): Promise<string> {
    const health = await this.checkHealth();
    return JSON.stringify(health, null, 2);
  }

  /**
   * Get health status as human-readable text
   */
  async getHealthText(): Promise<string> {
    const health = await this.checkHealth();
    
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌'
    };

    return `
🏥 Summarization Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${statusEmoji[health.status]} Overall Status: ${health.status.toUpperCase()}
🕒 Timestamp: ${health.timestamp.toISOString()}

📊 Checks:
  ${health.checks.summarization.status === 'healthy' ? '✅' : '❌'} Summarization: ${health.checks.summarization.message}
  ${health.checks.cache.status === 'healthy' ? '✅' : '❌'} Cache: ${health.checks.cache.message}
  ${health.checks.openai.status === 'healthy' ? '✅' : '❌'} OpenAI: ${health.checks.openai.message}

📈 Metrics:
  ⏱️  Uptime: ${Math.round(health.metrics.uptime / 1000 / 60)} minutes
  📊 Total Requests: ${health.metrics.totalRequests}
  ✅ Success Rate: ${Math.round(health.metrics.successRate * 100)}%
  ⚡ Avg Response Time: ${Math.round(health.metrics.averageResponseTime)}ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
}
