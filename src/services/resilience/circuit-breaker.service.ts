/**
 * Circuit Breaker Service - Circuit breaker patterns for external services
 * 
 * This service implements circuit breaker patterns to prevent cascading failures
 * and provide fast-fail behavior when external services are unavailable.
 * 
 * Benefits for vibe coders:
 * - Prevents cascading failures across services
 * - Fast-fail behavior when services are down
 * - Automatic recovery detection and testing
 * - Configurable failure thresholds and timeouts
 * - Service health monitoring and reporting
 */

import { EventEmitter } from 'events';

// Circuit breaker states
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time in milliseconds to wait before trying half-open
  volumeThreshold: number; // Minimum number of requests before considering failure rate
  errorThreshold: number; // Error rate threshold (0.0 to 1.0)
  resetTimeout: number; // Time to wait before attempting reset
}

// Circuit breaker statistics
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  failureRate: number;
  averageResponseTime: number;
  totalResponseTime: number;
  isHealthy: boolean;
}

// Circuit breaker result
export interface CircuitBreakerResult<T = any> {
  success: boolean;
  data?: T;
  error?: any;
  fromCache: boolean;
  state: CircuitBreakerState;
  executionTime: number;
}

// Service-specific circuit breaker configurations
export interface ServiceCircuitBreakerConfigs {
  context7: CircuitBreakerConfig;
  rag: CircuitBreakerConfig;
  lessons: CircuitBreakerConfig;
  patterns: CircuitBreakerConfig;
  general: CircuitBreakerConfig;
}

// Circuit Breaker Service Implementation
export class CircuitBreakerService extends EventEmitter {
  private configs: ServiceCircuitBreakerConfigs;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private stats = {
    totalRequests: 0,
    totalFailures: 0,
    totalSuccesses: 0,
    circuitBreakerTrips: 0,
    circuitBreakerRecoveries: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  };

  constructor(configs?: Partial<ServiceCircuitBreakerConfigs>) {
    super();
    
    this.configs = {
      context7: {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000, // 30 seconds
        volumeThreshold: 10,
        errorThreshold: 0.5, // 50% error rate
        resetTimeout: 60000 // 1 minute
      },
      rag: {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 20000, // 20 seconds
        volumeThreshold: 5,
        errorThreshold: 0.4, // 40% error rate
        resetTimeout: 30000 // 30 seconds
      },
      lessons: {
        failureThreshold: 4,
        successThreshold: 2,
        timeout: 25000, // 25 seconds
        volumeThreshold: 8,
        errorThreshold: 0.45, // 45% error rate
        resetTimeout: 45000 // 45 seconds
      },
      patterns: {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 15000, // 15 seconds
        volumeThreshold: 6,
        errorThreshold: 0.4, // 40% error rate
        resetTimeout: 25000 // 25 seconds
      },
      general: {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000, // 30 seconds
        volumeThreshold: 10,
        errorThreshold: 0.5, // 50% error rate
        resetTimeout: 60000 // 1 minute
      },
      ...configs
    };

    this.initializeService();
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    service: keyof ServiceCircuitBreakerConfigs = 'general',
    customConfig?: Partial<CircuitBreakerConfig>
  ): Promise<CircuitBreakerResult<T>> {
    const config = { ...this.configs[service], ...customConfig };
    const circuitBreaker = this.getCircuitBreaker(service, config);
    const startTime = Date.now();

    this.stats.totalRequests++;

    try {
      // Check if circuit breaker allows execution
      if (!circuitBreaker.canExecute()) {
        const executionTime = Date.now() - startTime;
        
        this.emit('circuitBreakerOpen', { 
          service, 
          state: circuitBreaker.getState(),
          executionTime 
        });

        return {
          success: false,
          error: new Error(`Circuit breaker is open for service: ${service}`),
          fromCache: false,
          state: circuitBreaker.getState(),
          executionTime
        };
      }

      // Execute the operation
      const result = await operation();
      const executionTime = Date.now() - startTime;

      // Record success
      circuitBreaker.recordSuccess();
      this.stats.totalSuccesses++;
      this.updateResponseTime(executionTime);

      this.emit('circuitBreakerSuccess', { 
        service, 
        executionTime, 
        state: circuitBreaker.getState() 
      });

      return {
        success: true,
        data: result,
        fromCache: false,
        state: circuitBreaker.getState(),
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Record failure
      const wasOpen = circuitBreaker.getState() === 'open';
      circuitBreaker.recordFailure();
      this.stats.totalFailures++;
      this.updateResponseTime(executionTime);

      // Check if circuit breaker just opened
      if (!wasOpen && circuitBreaker.getState() === 'open') {
        this.stats.circuitBreakerTrips++;
        this.emit('circuitBreakerOpened', { 
          service, 
          failureCount: circuitBreaker.getFailureCount(),
          executionTime 
        });
      }

      this.emit('circuitBreakerFailure', { 
        service, 
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime, 
        state: circuitBreaker.getState() 
      });

      return {
        success: false,
        error,
        fromCache: false,
        state: circuitBreaker.getState(),
        executionTime
      };
    }
  }

  /**
   * Get circuit breaker state for a service
   */
  getState(service: keyof ServiceCircuitBreakerConfigs): CircuitBreakerState {
    const circuitBreaker = this.circuitBreakers.get(service);
    return circuitBreaker ? circuitBreaker.getState() : 'closed';
  }

  /**
   * Get circuit breaker statistics for a service
   */
  getStats(service: keyof ServiceCircuitBreakerConfigs): CircuitBreakerStats {
    const circuitBreaker = this.circuitBreakers.get(service);
    
    if (!circuitBreaker) {
      return {
        state: 'closed',
        failures: 0,
        successes: 0,
        requests: 0,
        failureRate: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
        isHealthy: true
      };
    }

    return circuitBreaker.getStats();
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats() {
    const serviceStats: Record<string, CircuitBreakerStats> = {};
    
    for (const [service] of Array.from(this.circuitBreakers.entries())) {
      serviceStats[service] = this.getStats(service as keyof ServiceCircuitBreakerConfigs);
    }

    return {
      ...this.stats,
      serviceStats,
      circuitBreakerStates: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([service, cb]) => [service, cb.getState()])
      )
    };
  }

  /**
   * Reset circuit breaker for a service
   */
  reset(service: keyof ServiceCircuitBreakerConfigs): void {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker) {
      circuitBreaker.reset();
      this.emit('circuitBreakerReset', { service });
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const [service, circuitBreaker] of Array.from(this.circuitBreakers.entries())) {
      circuitBreaker.reset();
    }
    this.emit('circuitBreakersReset');
  }

  /**
   * Update circuit breaker configuration
   */
  updateConfig(service: keyof ServiceCircuitBreakerConfigs, config: Partial<CircuitBreakerConfig>): void {
    this.configs[service] = { ...this.configs[service], ...config };
    
    // Update existing circuit breaker if it exists
    const existing = this.circuitBreakers.get(service);
    if (existing) {
      existing.updateConfig(this.configs[service]);
    }
    
    this.emit('configUpdated', { service, config });
  }

  /**
   * Check if service is healthy
   */
  isHealthy(service: keyof ServiceCircuitBreakerConfigs): boolean {
    const stats = this.getStats(service);
    return stats.isHealthy && stats.state !== 'open';
  }

  /**
   * Get healthy services
   */
  getHealthyServices(): string[] {
    const healthy: string[] = [];
    
    for (const service of Object.keys(this.configs)) {
      if (this.isHealthy(service as keyof ServiceCircuitBreakerConfigs)) {
        healthy.push(service);
      }
    }
    
    return healthy;
  }

  // Private helper methods

  private initializeService(): void {
    // Start periodic health checks
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds

    this.emit('serviceInitialized', { configs: this.configs });
  }

  private getCircuitBreaker(service: string, config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.circuitBreakers.has(service)) {
      const circuitBreaker = new CircuitBreaker(config);
      this.circuitBreakers.set(service, circuitBreaker);
    }
    return this.circuitBreakers.get(service)!;
  }

  private updateResponseTime(responseTime: number): void {
    this.stats.totalResponseTime += responseTime;
    this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalRequests;
  }

  private performHealthChecks(): void {
    for (const [service, circuitBreaker] of Array.from(this.circuitBreakers.entries())) {
      const stats = circuitBreaker.getStats();
      
      if (stats.state === 'half-open' && stats.successes >= circuitBreaker.getConfig().successThreshold) {
        circuitBreaker.close();
        this.stats.circuitBreakerRecoveries++;
        this.emit('circuitBreakerRecovered', { service });
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.circuitBreakers.clear();
    this.emit('serviceDestroyed');
  }
}

// Individual Circuit Breaker Implementation
class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private failures = 0;
  private successes = 0;
  private requests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private totalResponseTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = { ...config };
  }

  canExecute(): boolean {
    switch (this.state) {
      case 'closed':
        return true;
      
      case 'open':
        if (this.shouldAttemptReset()) {
          this.state = 'half-open';
          return true;
        }
        return false;
      
      case 'half-open':
        return true;
      
      default:
        return false;
    }
  }

  recordSuccess(): void {
    this.successes++;
    this.requests++;
    this.lastSuccessTime = new Date();

    if (this.state === 'half-open') {
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
      }
    }
  }

  recordFailure(): void {
    this.failures++;
    this.requests++;
    this.lastFailureTime = new Date();

    if (this.state === 'half-open') {
      this.state = 'open';
      return;
    }

    if (this.state === 'closed') {
      const failureRate = this.failures / this.requests;
      
      if (this.requests >= this.config.volumeThreshold && 
          (this.failures >= this.config.failureThreshold || failureRate >= this.config.errorThreshold)) {
        this.state = 'open';
      }
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }

  getStats(): CircuitBreakerStats {
    const failureRate = this.requests > 0 ? this.failures / this.requests : 0;
    const averageResponseTime = this.requests > 0 ? this.totalResponseTime / this.requests : 0;
    
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      failureRate,
      averageResponseTime,
      totalResponseTime: this.totalResponseTime,
      isHealthy: this.state !== 'open' && failureRate < this.config.errorThreshold
    };
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: CircuitBreakerConfig): void {
    this.config = { ...newConfig };
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.requests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.totalResponseTime = 0;
  }

  close(): void {
    this.state = 'closed';
    this.failures = 0;
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;
    
    const timeSinceFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceFailure >= this.config.resetTimeout;
  }
}

export default CircuitBreakerService;
