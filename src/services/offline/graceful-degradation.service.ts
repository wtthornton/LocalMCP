/**
 * Graceful Degradation Service - Intelligent fallback and error handling
 * 
 * This service provides intelligent fallback mechanisms and graceful degradation
 * when external services become unavailable, ensuring LocalMCP remains functional.
 * 
 * Benefits for vibe coders:
 * - System remains usable even when services fail
 * - Intelligent fallback to available alternatives
 * - Clear communication about degraded functionality
 * - Automatic recovery when services come back online
 * - No unexpected crashes or errors
 */

import { EventEmitter } from 'events';

// Service status
export interface ServiceStatus {
  name: string;
  available: boolean;
  health: 'healthy' | 'degraded' | 'unavailable' | 'unknown';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  fallbackAvailable: boolean;
  retryAfter?: Date;
}

// Degradation strategy
export interface DegradationStrategy {
  service: string;
  fallbackServices: string[];
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  timeoutMs: number;
  enableGracefulDegradation: boolean;
}

// System health status
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ServiceStatus[];
  capabilities: {
    context7: boolean;
    rag: boolean;
    lessons: boolean;
    patterns: boolean;
    offline: boolean;
  };
  degradedFeatures: string[];
  availableFeatures: string[];
  lastUpdated: Date;
}

// Graceful Degradation Service Implementation
export class GracefulDegradationService extends EventEmitter {
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private strategies: Map<string, DegradationStrategy> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryQueues: Map<string, RetryQueue> = new Map();
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    fallbacksUsed: 0,
    circuitBreakerTrips: 0,
    servicesRecovered: 0
  };

  constructor() {
    super();
    this.initializeService();
  }

  /**
   * Execute request with graceful degradation
   */
  async executeWithFallback<T>(
    service: string,
    operation: () => Promise<T>,
    options?: {
      timeout?: number;
      fallbackOperation?: () => Promise<T>;
      enableCircuitBreaker?: boolean;
    }
  ): Promise<{
    success: boolean;
    data?: T;
    source: 'primary' | 'fallback' | 'cache' | 'none';
    degraded: boolean;
    error?: string;
    metadata: {
      service: string;
      responseTime: number;
      attempts: number;
      fallbacksUsed: number;
    };
  }> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Check if service is available
      const serviceStatus = this.getServiceStatus(service);
      if (!serviceStatus.available && !options?.fallbackOperation) {
        return {
          success: false,
          source: 'none',
          degraded: true,
          error: `Service ${service} is unavailable and no fallback provided`,
          metadata: {
            service,
            responseTime: Date.now() - startTime,
            attempts: 0,
            fallbacksUsed: 0
          }
        };
      }

      // Check circuit breaker
      if (options?.enableCircuitBreaker !== false) {
        const circuitBreaker = this.getCircuitBreaker(service);
        if (!circuitBreaker.canExecute()) {
          this.stats.circuitBreakerTrips++;
          this.emit('circuitBreakerTripped', { service, circuitBreaker: circuitBreaker.getState() });
          
          if (options?.fallbackOperation) {
            return this.executeFallback(service, options.fallbackOperation, startTime);
          }
          
          return {
            success: false,
            source: 'none',
            degraded: true,
            error: `Circuit breaker is open for service ${service}`,
            metadata: {
              service,
              responseTime: Date.now() - startTime,
              attempts: 0,
              fallbacksUsed: 0
            }
          };
        }
      }

      // Execute primary operation with timeout
      const timeout = options?.timeout || 10000;
      const result = await this.executeWithTimeout(operation, timeout);
      
      // Success - record metrics
      this.stats.successfulRequests++;
      this.updateServiceStatus(service, true, Date.now() - startTime);
      
      if (options?.enableCircuitBreaker !== false) {
        const circuitBreaker = this.getCircuitBreaker(service);
        circuitBreaker.recordSuccess();
      }

      this.emit('requestSuccess', { 
        service, 
        responseTime: Date.now() - startTime,
        source: 'primary'
      });

      return {
        success: true,
        data: result,
        source: 'primary',
        degraded: false,
        metadata: {
          service,
          responseTime: Date.now() - startTime,
          attempts: 1,
          fallbacksUsed: 0
        }
      };

    } catch (error) {
      this.stats.failedRequests++;
      this.updateServiceStatus(service, false, undefined, error instanceof Error ? error.message : 'Unknown error');
      
      if (options?.enableCircuitBreaker !== false) {
        const circuitBreaker = this.getCircuitBreaker(service);
        circuitBreaker.recordFailure();
      }

      // Try fallback if available
      if (options?.fallbackOperation) {
        return this.executeFallback(service, options.fallbackOperation, startTime);
      }

      this.emit('requestFailed', { 
        service, 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });

      return {
        success: false,
        source: 'none',
        degraded: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          service,
          responseTime: Date.now() - startTime,
          attempts: 1,
          fallbacksUsed: 0
        }
      };
    }
  }

  /**
   * Register degradation strategy for a service
   */
  registerStrategy(strategy: DegradationStrategy): void {
    this.strategies.set(strategy.service, strategy);
    this.circuitBreakers.set(strategy.service, new CircuitBreaker(strategy));
    this.retryQueues.set(strategy.service, new RetryQueue(strategy));
    
    this.emit('strategyRegistered', { service: strategy.service, strategy });
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const services = Array.from(this.serviceStatuses.values());
    const capabilities = this.calculateCapabilities(services);
    const degradedFeatures = this.getDegradedFeatures(capabilities);
    const availableFeatures = this.getAvailableFeatures(capabilities);

    const overall = this.calculateOverallHealth(services);

    return {
      overall,
      services,
      capabilities,
      degradedFeatures,
      availableFeatures,
      lastUpdated: new Date()
    };
  }

  /**
   * Get service status
   */
  getServiceStatus(service: string): ServiceStatus {
    return this.serviceStatuses.get(service) || {
      name: service,
      available: true,
      health: 'unknown',
      lastChecked: new Date(),
      fallbackAvailable: false
    };
  }

  /**
   * Force service recovery check
   */
  async forceRecoveryCheck(service: string): Promise<boolean> {
    const strategy = this.strategies.get(service);
    if (!strategy) return false;

    try {
      // Perform health check
      const isHealthy = await this.performHealthCheck(service);
      
      if (isHealthy) {
        this.updateServiceStatus(service, true);
        this.stats.servicesRecovered++;
        this.emit('serviceRecovered', { service });
        
        // Reset circuit breaker
        const circuitBreaker = this.circuitBreakers.get(service);
        if (circuitBreaker) {
          circuitBreaker.reset();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      this.emit('recoveryCheckFailed', { 
        service, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get degradation statistics
   */
  getStats() {
    return {
      ...this.stats,
      registeredStrategies: this.strategies.size,
      activeCircuitBreakers: Array.from(this.circuitBreakers.values())
        .filter(cb => cb.getState() === 'open').length,
      pendingRetries: Array.from(this.retryQueues.values())
        .reduce((sum, queue) => sum + queue.size(), 0)
    };
  }

  // Private helper methods

  private initializeService(): void {
    // Register default strategies for LocalMCP services
    this.registerDefaultStrategies();
    
    // Start health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performPeriodicHealthCheck();
    }, 30000); // Check every 30 seconds

    this.emit('serviceInitialized');
  }

  private registerDefaultStrategies(): void {
    const defaultStrategies: DegradationStrategy[] = [
      {
        service: 'context7',
        fallbackServices: ['rag', 'local'],
        maxRetries: 3,
        retryDelay: 2000,
        circuitBreakerThreshold: 5,
        timeoutMs: 10000,
        enableGracefulDegradation: true
      },
      {
        service: 'rag',
        fallbackServices: ['local', 'cache'],
        maxRetries: 2,
        retryDelay: 1000,
        circuitBreakerThreshold: 3,
        timeoutMs: 5000,
        enableGracefulDegradation: true
      },
      {
        service: 'lessons',
        fallbackServices: ['cache', 'local'],
        maxRetries: 2,
        retryDelay: 1000,
        circuitBreakerThreshold: 3,
        timeoutMs: 3000,
        enableGracefulDegradation: true
      }
    ];

    defaultStrategies.forEach(strategy => this.registerStrategy(strategy));
  }

  private async executeFallback<T>(
    service: string,
    fallbackOperation: () => Promise<T>,
    startTime: number
  ): Promise<{
    success: boolean;
    data?: T;
    source: 'fallback';
    degraded: boolean;
    error?: string;
    metadata: {
      service: string;
      responseTime: number;
      attempts: number;
      fallbacksUsed: number;
    };
  }> {
    try {
      const result = await fallbackOperation();
      this.stats.fallbacksUsed++;
      
      this.emit('fallbackSuccess', { 
        service, 
        responseTime: Date.now() - startTime 
      });

      return {
        success: true,
        data: result,
        source: 'fallback',
        degraded: true,
        metadata: {
          service,
          responseTime: Date.now() - startTime,
          attempts: 1,
          fallbacksUsed: 1
        }
      };
    } catch (error) {
      this.emit('fallbackFailed', { 
        service, 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime 
      });

      return {
        success: false,
        source: 'fallback',
        degraded: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          service,
          responseTime: Date.now() - startTime,
          attempts: 1,
          fallbacksUsed: 1
        }
      };
    }
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }

  private updateServiceStatus(
    service: string, 
    available: boolean, 
    responseTime?: number, 
    error?: string
  ): void {
    const currentStatus = this.serviceStatuses.get(service);
    const health: 'healthy' | 'degraded' | 'unavailable' = available 
      ? 'healthy' 
      : currentStatus?.health === 'healthy' 
        ? 'degraded' 
        : 'unavailable';

    const status: ServiceStatus = {
      name: service,
      available,
      health,
      lastChecked: new Date(),
      responseTime,
      error,
      fallbackAvailable: this.strategies.has(service)
    };

    this.serviceStatuses.set(service, status);
  }

  private calculateCapabilities(services: ServiceStatus[]): SystemHealth['capabilities'] {
    const context7 = services.find(s => s.name === 'context7')?.available || false;
    const rag = services.find(s => s.name === 'rag')?.available || false;
    const lessons = services.find(s => s.name === 'lessons')?.available || false;

    return {
      context7,
      rag,
      lessons,
      patterns: lessons, // Patterns depend on lessons
      offline: rag || lessons // Offline capability if RAG or lessons available
    };
  }

  private getDegradedFeatures(capabilities: SystemHealth['capabilities']): string[] {
    const degraded: string[] = [];
    
    if (!capabilities.context7) degraded.push('External Documentation');
    if (!capabilities.rag) degraded.push('Project Context Search');
    if (!capabilities.lessons) degraded.push('Lessons Learned');
    if (!capabilities.patterns) degraded.push('Pattern Recognition');
    if (!capabilities.offline) degraded.push('Offline Mode');

    return degraded;
  }

  private getAvailableFeatures(capabilities: SystemHealth['capabilities']): string[] {
    const available: string[] = [];
    
    if (capabilities.context7) available.push('External Documentation');
    if (capabilities.rag) available.push('Project Context Search');
    if (capabilities.lessons) available.push('Lessons Learned');
    if (capabilities.patterns) available.push('Pattern Recognition');
    if (capabilities.offline) available.push('Offline Mode');

    return available;
  }

  private calculateOverallHealth(services: ServiceStatus[]): 'healthy' | 'degraded' | 'critical' {
    const unavailableCount = services.filter(s => s.health === 'unavailable').length;
    const degradedCount = services.filter(s => s.health === 'degraded').length;
    
    if (unavailableCount >= services.length * 0.5) return 'critical';
    if (unavailableCount > 0 || degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private async performHealthCheck(service: string): Promise<boolean> {
    // Simulate health check
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.2); // 80% success rate
      }, 100 + Math.random() * 200);
    });
  }

  private async performPeriodicHealthCheck(): Promise<void> {
    for (const [service, strategy] of Array.from(this.strategies.entries())) {
      try {
        const isHealthy = await this.performHealthCheck(service);
        this.updateServiceStatus(service, isHealthy);
        
        if (isHealthy) {
          const circuitBreaker = this.circuitBreakers.get(service);
          if (circuitBreaker && circuitBreaker.getState() === 'open') {
            circuitBreaker.reset();
            this.emit('serviceRecovered', { service });
          }
        }
      } catch (error) {
        this.updateServiceStatus(service, false, undefined, error instanceof Error ? error.message : 'Health check failed');
      }
    }
  }

  private getCircuitBreaker(service: string): CircuitBreaker {
    return this.circuitBreakers.get(service) || new CircuitBreaker({
      service,
      fallbackServices: [],
      maxRetries: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      timeoutMs: 5000,
      enableGracefulDegradation: true
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.circuitBreakers.clear();
    this.retryQueues.clear();
    this.emit('serviceDestroyed');
  }
}

// Circuit Breaker implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private strategy: DegradationStrategy) {}

  canExecute(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime?.getTime() || 0);
      if (timeSinceLastFailure >= this.strategy.retryDelay) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true; // half-open
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.strategy.circuitBreakerThreshold) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }
}

// Retry Queue implementation
class RetryQueue {
  private queue: Array<{ operation: () => Promise<any>; retries: number }> = [];

  constructor(private strategy: DegradationStrategy) {}

  add(operation: () => Promise<any>): void {
    this.queue.push({ operation, retries: 0 });
  }

  size(): number {
    return this.queue.length;
  }

  async process(): Promise<void> {
    const toProcess = this.queue.splice(0, 10); // Process up to 10 items
    
    for (const item of toProcess) {
      try {
        await item.operation();
        // Success - remove from queue
      } catch (error) {
        item.retries++;
        if (item.retries < this.strategy.maxRetries) {
          // Re-queue for retry
          this.queue.push(item);
        }
        // Max retries exceeded - discard
      }
    }
  }
}

export default GracefulDegradationService;
