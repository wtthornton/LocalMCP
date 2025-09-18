/**
 * Retry Mechanisms Service - Automatic retry with exponential backoff
 * 
 * This service provides intelligent retry mechanisms for LocalMCP operations,
 * ensuring resilience against transient failures and network issues.
 * 
 * Benefits for vibe coders:
 * - Automatic recovery from temporary failures
 * - Intelligent backoff to avoid overwhelming services
 * - Configurable retry strategies for different scenarios
 * - Detailed retry statistics and monitoring
 * - Seamless integration with existing services
 */

import { EventEmitter } from 'events';

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // Initial delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Exponential backoff multiplier
  jitter: boolean; // Add random jitter to prevent thundering herd
  retryCondition?: (error: any) => boolean; // Custom retry condition
  onRetry?: (attempt: number, error: any) => void; // Retry callback
}

// Retry result
export interface RetryResult<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
  lastAttemptTime: number;
  retryHistory: RetryAttempt[];
}

// Individual retry attempt
export interface RetryAttempt {
  attempt: number;
  timestamp: number;
  duration: number;
  success: boolean;
  error?: any;
  delay?: number;
}

// Retry strategy types
export type RetryStrategy = 'exponential' | 'linear' | 'fixed' | 'custom';

// Service-specific retry configurations
export interface ServiceRetryConfigs {
  context7: RetryConfig;
  rag: RetryConfig;
  lessons: RetryConfig;
  patterns: RetryConfig;
  general: RetryConfig;
}

// Retry Mechanisms Service Implementation
export class RetryMechanismsService extends EventEmitter {
  private configs: ServiceRetryConfigs;
  private stats = {
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageAttempts: 0,
    averageRetryTime: 0,
    totalRetryTime: 0,
    serviceStats: new Map<string, {
      totalRetries: number;
      successfulRetries: number;
      failedRetries: number;
      averageAttempts: number;
      averageTime: number;
    }>()
  };

  constructor(configs?: Partial<ServiceRetryConfigs>) {
    super();
    
    this.configs = {
      context7: {
        maxAttempts: 5,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryCondition: (error) => this.isRetryableError(error, 'context7'),
        onRetry: (attempt, error) => this.emit('context7Retry', { attempt, error: error.message })
      },
      rag: {
        maxAttempts: 3,
        baseDelay: 500,
        maxDelay: 10000,
        backoffMultiplier: 1.5,
        jitter: true,
        retryCondition: (error) => this.isRetryableError(error, 'rag'),
        onRetry: (attempt, error) => this.emit('ragRetry', { attempt, error: error.message })
      },
      lessons: {
        maxAttempts: 4,
        baseDelay: 750,
        maxDelay: 15000,
        backoffMultiplier: 2,
        jitter: true,
        retryCondition: (error) => this.isRetryableError(error, 'lessons'),
        onRetry: (attempt, error) => this.emit('lessonsRetry', { attempt, error: error.message })
      },
      patterns: {
        maxAttempts: 3,
        baseDelay: 600,
        maxDelay: 12000,
        backoffMultiplier: 1.8,
        jitter: true,
        retryCondition: (error) => this.isRetryableError(error, 'patterns'),
        onRetry: (attempt, error) => this.emit('patternsRetry', { attempt, error: error.message })
      },
      general: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 20000,
        backoffMultiplier: 2,
        jitter: true,
        retryCondition: (error) => this.isRetryableError(error, 'general'),
        onRetry: (attempt, error) => this.emit('generalRetry', { attempt, error: error.message })
      },
      ...configs
    };

    this.initializeService();
  }

  /**
   * Execute operation with retry mechanism
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    service: keyof ServiceRetryConfigs = 'general',
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = { ...this.configs[service], ...customConfig };
    const startTime = Date.now();
    const retryHistory: RetryAttempt[] = [];
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      
      try {
        const result = await operation();
        const attemptDuration = Date.now() - attemptStartTime;
        
        // Success - record attempt and return
        retryHistory.push({
          attempt,
          timestamp: attemptStartTime,
          duration: attemptDuration,
          success: true
        });

        this.stats.totalRetries++;
        this.stats.successfulRetries++;
        this.updateServiceStats(service, true, attempt, attemptDuration);

        const totalTime = Date.now() - startTime;
        
        this.emit('retrySuccess', { 
          service, 
          attempt, 
          totalTime, 
          attempts: attempt 
        });

        return {
          success: true,
          data: result,
          attempts: attempt,
          totalTime,
          lastAttemptTime: attemptStartTime,
          retryHistory
        };

      } catch (error) {
        lastError = error;
        const attemptDuration = Date.now() - attemptStartTime;
        
        // Record failed attempt
        retryHistory.push({
          attempt,
          timestamp: attemptStartTime,
          duration: attemptDuration,
          success: false,
          error
        });

        // Check if we should retry
        if (attempt === config.maxAttempts || !this.shouldRetry(error, config)) {
          // Final attempt failed or non-retryable error
          this.stats.totalRetries++;
          this.stats.failedRetries++;
          this.updateServiceStats(service, false, attempt, attemptDuration);

          const totalTime = Date.now() - startTime;
          
          this.emit('retryFailed', { 
            service, 
            attempts: attempt, 
            totalTime, 
            error: error.message 
          });

          return {
            success: false,
            error,
            attempts: attempt,
            totalTime,
            lastAttemptTime: attemptStartTime,
            retryHistory
          };
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, config);
        
        // Record delay in history
        retryHistory[retryHistory.length - 1].delay = delay;

        // Emit retry event
        if (config.onRetry) {
          config.onRetry(attempt, error);
        }

        this.emit('retryAttempt', { 
          service, 
          attempt, 
          error: error.message, 
          nextDelay: delay 
        });

        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // This should never be reached, but just in case
    const totalTime = Date.now() - startTime;
    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalTime,
      lastAttemptTime: Date.now(),
      retryHistory
    };
  }

  /**
   * Execute operation with custom retry strategy
   */
  async executeWithStrategy<T>(
    operation: () => Promise<T>,
    strategy: RetryStrategy,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 20000,
      backoffMultiplier: 2,
      jitter: true,
      ...customConfig
    };

    switch (strategy) {
      case 'exponential':
        return this.executeWithRetry(operation, 'general', config);
      
      case 'linear':
        return this.executeWithRetry(operation, 'general', {
          ...config,
          backoffMultiplier: 1
        });
      
      case 'fixed':
        return this.executeWithRetry(operation, 'general', {
          ...config,
          backoffMultiplier: 1,
          maxDelay: config.baseDelay
        });
      
      case 'custom':
        return this.executeWithRetry(operation, 'general', config);
      
      default:
        throw new Error(`Unknown retry strategy: ${strategy}`);
    }
  }

  /**
   * Get retry statistics
   */
  getStats() {
    const totalRetries = this.stats.totalRetries;
    const successRate = totalRetries > 0 ? (this.stats.successfulRetries / totalRetries) * 100 : 0;
    
    return {
      ...this.stats,
      successRate: Math.round(successRate * 100) / 100,
      serviceStats: Object.fromEntries(this.stats.serviceStats.entries())
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0,
      averageRetryTime: 0,
      totalRetryTime: 0,
      serviceStats: new Map()
    };
    this.emit('statsReset');
  }

  /**
   * Update retry configuration for a service
   */
  updateConfig(service: keyof ServiceRetryConfigs, config: Partial<RetryConfig>): void {
    this.configs[service] = { ...this.configs[service], ...config };
    this.emit('configUpdated', { service, config });
  }

  /**
   * Get retry configuration for a service
   */
  getConfig(service: keyof ServiceRetryConfigs): RetryConfig {
    return { ...this.configs[service] };
  }

  // Private helper methods

  private initializeService(): void {
    this.emit('serviceInitialized', { configs: this.configs });
  }

  private shouldRetry(error: any, config: RetryConfig): boolean {
    // Check custom retry condition
    if (config.retryCondition) {
      return config.retryCondition(error);
    }

    // Default retry conditions
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' ||
        error.status >= 500 ||
        error.status === 429) {
      return true;
    }

    return false;
  }

  private isRetryableError(error: any, service: string): boolean {
    // Service-specific retry conditions
    switch (service) {
      case 'context7':
        // Context7 specific retry conditions
        return error.status >= 500 || 
               error.status === 429 || 
               error.code === 'ECONNRESET' ||
               error.message?.includes('timeout');
      
      case 'rag':
        // RAG specific retry conditions
        return error.status >= 500 || 
               error.message?.includes('vector') ||
               error.message?.includes('index');
      
      case 'lessons':
      case 'patterns':
        // Lessons/Patterns specific retry conditions
        return error.status >= 500 || 
               error.message?.includes('database') ||
               error.message?.includes('connection');
      
      default:
        return error.status >= 500 || 
               error.code === 'ECONNRESET' ||
               error.code === 'ETIMEDOUT';
    }
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      delay += (Math.random() * jitterRange * 2) - jitterRange;
    }
    
    return Math.round(delay);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateServiceStats(service: string, success: boolean, attempts: number, duration: number): void {
    if (!this.stats.serviceStats.has(service)) {
      this.stats.serviceStats.set(service, {
        totalRetries: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageAttempts: 0,
        averageTime: 0
      });
    }

    const serviceStats = this.stats.serviceStats.get(service)!;
    serviceStats.totalRetries++;
    
    if (success) {
      serviceStats.successfulRetries++;
    } else {
      serviceStats.failedRetries++;
    }

    // Update averages
    serviceStats.averageAttempts = 
      (serviceStats.averageAttempts * (serviceStats.totalRetries - 1) + attempts) / serviceStats.totalRetries;
    
    serviceStats.averageTime = 
      (serviceStats.averageTime * (serviceStats.totalRetries - 1) + duration) / serviceStats.totalRetries;

    // Update global averages
    this.stats.averageAttempts = 
      (this.stats.averageAttempts * (this.stats.totalRetries - 1) + attempts) / this.stats.totalRetries;
    
    this.stats.totalRetryTime += duration;
    this.stats.averageRetryTime = this.stats.totalRetryTime / this.stats.totalRetries;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.emit('serviceDestroyed');
  }
}

export default RetryMechanismsService;
