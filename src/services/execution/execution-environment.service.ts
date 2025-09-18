/**
 * Execution Environment Service - Advanced execution environment with sandboxing
 * 
 * This service provides a comprehensive execution environment that combines
 * Docker sandboxing, resource monitoring, and security controls for safe
 * execution of untrusted code and operations.
 * 
 * Benefits for vibe coders:
 * - Secure execution environment with automatic sandboxing
 * - Resource monitoring and automatic limits enforcement
 * - Support for multiple programming languages and environments
 * - Performance profiling and optimization insights
 * - Easy integration with LocalMCP tools and workflows
 */

import { EventEmitter } from 'events';
import DockerSandboxService, { ExecutionResult, SandboxConfig } from './docker-sandbox.service';
import ResourceMonitorService, { ResourceLimits, OperationResourceTracking } from './resource-monitor.service';

// Execution environment configuration
export interface ExecutionEnvironmentConfig {
  sandbox: {
    enabled: boolean;
    defaultImage: string;
    timeout: number;
    memoryLimit: string;
    cpuLimit: string;
  };
  resourceMonitoring: {
    enabled: boolean;
    monitoringInterval: number;
    limits: Partial<ResourceLimits>;
  };
  security: {
    enabled: boolean;
    allowedLanguages: string[];
    maxCodeSize: number;
    maxExecutionTime: number;
  };
  performance: {
    profiling: boolean;
    optimization: boolean;
    caching: boolean;
  };
}

// Execution context
export interface ExecutionContext {
  id: string;
  language: string;
  code: string;
  config?: Partial<SandboxConfig>;
  resourceLimits?: Partial<ResourceLimits>;
  metadata?: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  result?: ExecutionResult;
  tracking?: OperationResourceTracking;
}

// Performance metrics
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkUsage: number;
  peakMemoryUsage: number;
  peakCpuUsage: number;
  optimizationSuggestions: string[];
  cacheHits: number;
  cacheMisses: number;
}

// Execution environment statistics
export interface ExecutionEnvironmentStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  timeoutExecutions: number;
  securityViolations: number;
  resourceLimitViolations: number;
  averageExecutionTime: number;
  averageMemoryUsage: number;
  averageCpuUsage: number;
  activeExecutions: number;
  performanceImprovements: number;
  cacheHitRate: number;
}

// Execution Environment Service Implementation
export class ExecutionEnvironmentService extends EventEmitter {
  private config: ExecutionEnvironmentConfig;
  private sandboxService: DockerSandboxService;
  private resourceMonitor: ResourceMonitorService;
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private executionHistory: ExecutionContext[] = [];
  private performanceCache: Map<string, PerformanceMetrics> = new Map();
  private stats: ExecutionEnvironmentStats;

  constructor(config?: Partial<ExecutionEnvironmentConfig>) {
    super();
    
    this.config = {
      sandbox: {
        enabled: true,
        defaultImage: 'node:18-alpine',
        timeout: 30000,
        memoryLimit: '256m',
        cpuLimit: '0.5'
      },
      resourceMonitoring: {
        enabled: true,
        monitoringInterval: 5000,
        limits: {
          cpu: { maxUsage: 80, maxLoadAverage: 4.0, maxCores: 4 },
          memory: { maxUsage: 85, maxMemoryMB: 2048, maxHeapSizeMB: 1024 },
          disk: { maxUsage: 90, maxDiskSpaceMB: 10240, maxTempFilesMB: 512 },
          processes: { maxProcesses: 500, maxLocalmcpProcesses: 50, maxConcurrentOperations: 10 }
        }
      },
      security: {
        enabled: true,
        allowedLanguages: ['nodejs', 'python', 'bash', 'typescript', 'javascript'],
        maxCodeSize: 1024 * 1024, // 1MB
        maxExecutionTime: 60000 // 60 seconds
      },
      performance: {
        profiling: true,
        optimization: true,
        caching: true
      },
      ...config
    };

    // Initialize services
    this.sandboxService = new DockerSandboxService();
    this.resourceMonitor = new ResourceMonitorService(this.config.resourceMonitoring.limits);

    // Initialize statistics
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      timeoutExecutions: 0,
      securityViolations: 0,
      resourceLimitViolations: 0,
      averageExecutionTime: 0,
      averageMemoryUsage: 0,
      averageCpuUsage: 0,
      activeExecutions: 0,
      performanceImprovements: 0,
      cacheHitRate: 0
    };

    this.initializeService();
  }

  /**
   * Execute code in a secure environment
   */
  async executeCode(
    code: string,
    language: string = 'nodejs',
    options?: {
      config?: Partial<SandboxConfig>;
      resourceLimits?: Partial<ResourceLimits>;
      metadata?: Record<string, any>;
    }
  ): Promise<ExecutionResult & { metrics: PerformanceMetrics; contextId: string }> {
    const contextId = this.generateContextId();
    const startTime = new Date();

    // Create execution context
    const context: ExecutionContext = {
      id: contextId,
      language,
      code,
      config: options?.config,
      resourceLimits: options?.resourceLimits,
      metadata: options?.metadata,
      startTime
    };

    this.activeExecutions.set(contextId, context);
    this.stats.totalExecutions++;
    this.stats.activeExecutions++;

    try {
      // Validate execution request
      await this.validateExecutionRequest(code, language);

      // Check resource availability
      const resourceCheck = this.resourceMonitor.canProceedWithOperation(options?.resourceLimits);
      if (!resourceCheck.canProceed) {
        throw new Error(`Resource limits exceeded: ${resourceCheck.reason}`);
      }

      // Start resource tracking
      const tracking = this.resourceMonitor.startOperationTracking(contextId, options?.resourceLimits);
      context.tracking = tracking;

      // Check performance cache
      const cacheKey = this.generateCacheKey(code, language);
      let metrics: PerformanceMetrics;

      if (this.config.performance.caching && this.performanceCache.has(cacheKey)) {
        metrics = this.performanceCache.get(cacheKey)!;
        this.stats.cacheHitRate = (this.stats.cacheHitRate + 1) / 2; // Simple moving average
        this.emit('cacheHit', { contextId, cacheKey });
      } else {
        metrics = await this.executeWithProfiling(code, language, context);
        if (this.config.performance.caching) {
          this.performanceCache.set(cacheKey, metrics);
        }
        this.stats.cacheHitRate = (this.stats.cacheHitRate * 0.99); // Decay for cache miss
      }

      // End resource tracking
      this.resourceMonitor.endOperationTracking(contextId);

      // Update context
      context.endTime = new Date();
      context.result = {
        success: true,
        output: metrics ? 'Cached execution' : 'Execution completed',
        exitCode: 0,
        executionTime: Date.now() - startTime.getTime(),
        containerId: contextId
      };

      // Update statistics
      this.stats.successfulExecutions++;
      this.updateAverageStats(metrics);

      // Move to history
      this.executionHistory.push(context);
      this.activeExecutions.delete(contextId);
      this.stats.activeExecutions--;

      this.emit('executionSuccess', { contextId, context, metrics });

      return {
        success: true,
        output: context.result.output,
        exitCode: context.result.exitCode,
        executionTime: context.result.executionTime,
        containerId: contextId,
        metrics,
        contextId
      };

    } catch (error) {
      // Handle execution failure
      context.endTime = new Date();
      context.result = {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        executionTime: Date.now() - startTime.getTime(),
        containerId: contextId
      };

      // Update statistics
      this.stats.failedExecutions++;
      if (error instanceof Error && error.message.includes('timeout')) {
        this.stats.timeoutExecutions++;
      }
      if (error instanceof Error && error.message.includes('Security')) {
        this.stats.securityViolations++;
      }
      if (error instanceof Error && error.message.includes('Resource limits')) {
        this.stats.resourceLimitViolations++;
      }

      // End resource tracking
      this.resourceMonitor.endOperationTracking(contextId);

      // Move to history
      this.executionHistory.push(context);
      this.activeExecutions.delete(contextId);
      this.stats.activeExecutions--;

      this.emit('executionFailure', { contextId, context, error: error instanceof Error ? error.message : 'Unknown error' });

      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        executionTime: Date.now() - startTime.getTime(),
        containerId: contextId,
        metrics: this.createEmptyMetrics(),
        contextId
      };
    }
  }

  /**
   * Execute a file in the secure environment
   */
  async executeFile(
    filePath: string,
    language: string = 'nodejs',
    options?: {
      config?: Partial<SandboxConfig>;
      resourceLimits?: Partial<ResourceLimits>;
      metadata?: Record<string, any>;
    }
  ): Promise<ExecutionResult & { metrics: PerformanceMetrics; contextId: string }> {
    // Read file content
    const fs = await import('fs/promises');
    const code = await fs.readFile(filePath, 'utf-8');
    
    return this.executeCode(code, language, {
      ...options,
      metadata: { ...options?.metadata, filePath }
    });
  }

  /**
   * Get execution context by ID
   */
  getExecutionContext(contextId: string): ExecutionContext | null {
    return this.activeExecutions.get(contextId) || 
           this.executionHistory.find(ctx => ctx.id === contextId) || 
           null;
  }

  /**
   * Get all active executions
   */
  getActiveExecutions(): ExecutionContext[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 100): ExecutionContext[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get performance metrics for a specific execution
   */
  getPerformanceMetrics(contextId: string): PerformanceMetrics | null {
    const context = this.getExecutionContext(contextId);
    if (!context) return null;

    const cacheKey = this.generateCacheKey(context.code, context.language);
    return this.performanceCache.get(cacheKey) || null;
  }

  /**
   * Get service statistics
   */
  getStats(): ExecutionEnvironmentStats {
    return { ...this.stats };
  }

  /**
   * Get configuration
   */
  getConfig(): ExecutionEnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ExecutionEnvironmentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sub-services if needed
    if (newConfig.resourceMonitoring?.limits) {
      this.resourceMonitor.updateLimits(newConfig.resourceMonitoring.limits);
    }
    
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Start the execution environment
   */
  start(): void {
    if (this.config.resourceMonitoring.enabled) {
      this.resourceMonitor.startMonitoring(this.config.resourceMonitoring.monitoringInterval);
    }
    
    this.emit('serviceStarted');
  }

  /**
   * Stop the execution environment
   */
  stop(): void {
    if (this.config.resourceMonitoring.enabled) {
      this.resourceMonitor.stopMonitoring();
    }
    
    this.emit('serviceStopped');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Stop all active executions
    for (const contextId of Array.from(this.activeExecutions.keys())) {
      await this.cancelExecution(contextId);
    }
    
    // Cleanup sub-services
    await this.sandboxService.cleanupAllContainers();
    this.resourceMonitor.destroy();
    
    // Clear caches and history
    this.performanceCache.clear();
    this.executionHistory = [];
    
    this.emit('serviceCleanedUp');
  }

  // Private helper methods

  private initializeService(): void {
    // Set up event listeners
    this.sandboxService.on('executionSuccess', (data) => {
      this.emit('sandboxExecutionSuccess', data);
    });

    this.sandboxService.on('executionFailure', (data) => {
      this.emit('sandboxExecutionFailure', data);
    });

    this.resourceMonitor.on('alertGenerated', (data) => {
      this.emit('resourceAlert', data);
    });

    this.resourceMonitor.on('operationLimitExceeded', (data) => {
      this.emit('operationLimitExceeded', data);
    });

    this.emit('serviceInitialized', { config: this.config });
  }

  private async validateExecutionRequest(code: string, language: string): Promise<void> {
    // Check security settings
    if (this.config.security.enabled) {
      if (!this.config.security.allowedLanguages.includes(language)) {
        throw new Error(`Language not allowed: ${language}`);
      }
      
      if (code.length > this.config.security.maxCodeSize) {
        throw new Error(`Code size exceeds limit: ${this.config.security.maxCodeSize} bytes`);
      }
    }

    // Additional validation can be added here
  }

  private async executeWithProfiling(
    code: string, 
    language: string, 
    context: ExecutionContext
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Execute code in sandbox
    const result = await this.sandboxService.executeCode(
      code, 
      language as any, 
      context.config
    );

    const executionTime = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;

    // Generate optimization suggestions
    const optimizationSuggestions = this.generateOptimizationSuggestions(result, executionTime, memoryUsage);

    const metrics: PerformanceMetrics = {
      executionTime,
      memoryUsage,
      cpuUsage: result.cpuUsage || 0,
      diskUsage: 0, // Would be calculated from actual disk usage
      networkUsage: 0, // Would be calculated from actual network usage
      peakMemoryUsage: endMemory.heapUsed,
      peakCpuUsage: result.cpuUsage || 0,
      optimizationSuggestions,
      cacheHits: 0,
      cacheMisses: 1
    };

    // Apply performance improvements if enabled
    if (this.config.performance.optimization && optimizationSuggestions.length > 0) {
      this.stats.performanceImprovements++;
    }

    return metrics;
  }

  private generateOptimizationSuggestions(
    result: ExecutionResult, 
    executionTime: number, 
    memoryUsage: number
  ): string[] {
    const suggestions: string[] = [];

    if (executionTime > 10000) {
      suggestions.push('Consider optimizing code for better performance');
    }

    if (memoryUsage > 100 * 1024 * 1024) { // 100MB
      suggestions.push('Consider reducing memory usage');
    }

    if (result.output.length > 1024 * 1024) { // 1MB output
      suggestions.push('Consider reducing output size');
    }

    if (result.exitCode !== 0) {
      suggestions.push('Fix code errors before optimization');
    }

    return suggestions;
  }

  private generateContextId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(code: string, language: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(`${language}:${code}`).digest('hex');
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      executionTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      networkUsage: 0,
      peakMemoryUsage: 0,
      peakCpuUsage: 0,
      optimizationSuggestions: [],
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  private updateAverageStats(metrics: PerformanceMetrics): void {
    const total = this.stats.totalExecutions;
    this.stats.averageExecutionTime = 
      (this.stats.averageExecutionTime * (total - 1) + metrics.executionTime) / total;
    this.stats.averageMemoryUsage = 
      (this.stats.averageMemoryUsage * (total - 1) + metrics.memoryUsage) / total;
    this.stats.averageCpuUsage = 
      (this.stats.averageCpuUsage * (total - 1) + metrics.cpuUsage) / total;
  }

  private async cancelExecution(contextId: string): Promise<void> {
    const context = this.activeExecutions.get(contextId);
    if (context) {
      // Cancel resource tracking
      this.resourceMonitor.endOperationTracking(contextId);
      
      // Remove from active executions
      this.activeExecutions.delete(contextId);
      this.stats.activeExecutions--;
      
      this.emit('executionCancelled', { contextId, context });
    }
  }
}

export default ExecutionEnvironmentService;
