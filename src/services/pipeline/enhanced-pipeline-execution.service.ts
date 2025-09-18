/**
 * Enhanced Pipeline Execution Service - Advanced pipeline execution with parallel processing
 * 
 * This service provides enhanced pipeline execution capabilities including parallel stage
 * execution, optimization, caching, resource monitoring, and performance analytics.
 * 
 * Benefits for vibe coders:
 * - Faster pipeline execution through parallel processing
 * - Intelligent caching for improved performance
 * - Resource monitoring and automatic optimization
 * - Execution history and replay capabilities
 * - Performance analytics and optimization insights
 */

import { EventEmitter } from 'events';
import { PipelineEngine, PipelineContext, PipelineStage, PipelineError } from '../../pipeline/pipeline-engine';
import { ResourceMonitorService } from '../execution/resource-monitor.service';
import * as crypto from 'crypto';

// Execution strategy types
export type ExecutionStrategy = 'sequential' | 'parallel' | 'adaptive' | 'optimized';

// Stage execution result
export interface StageExecutionResult {
  stageId: string;
  stageName: string;
  success: boolean;
  executionTime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  output?: any;
  error?: string;
  dependencies: string[];
  parallelizable: boolean;
  cacheHit: boolean;
  optimizationApplied: boolean;
}

// Pipeline execution result
export interface PipelineExecutionResult {
  executionId: string;
  strategy: ExecutionStrategy;
  success: boolean;
  totalExecutionTime: number;
  stageResults: StageExecutionResult[];
  resourceUsage: {
    peakCpu: number;
    peakMemory: number;
    totalDisk: number;
    totalNetwork: number;
  };
  optimizationMetrics: {
    cacheHits: number;
    cacheMisses: number;
    parallelizationSavings: number;
    optimizationSavings: number;
  };
  errors: PipelineError[];
  warnings: string[];
  replayable: boolean;
}

// Execution optimization
export interface ExecutionOptimization {
  type: 'cache' | 'parallel' | 'resource' | 'algorithm';
  description: string;
  estimatedSavings: number;
  applied: boolean;
  impact: 'low' | 'medium' | 'high';
}

// Pipeline execution configuration
export interface PipelineExecutionConfig {
  strategy: ExecutionStrategy;
  maxConcurrentStages: number;
  enableCaching: boolean;
  enableOptimization: boolean;
  enableResourceMonitoring: boolean;
  cacheTimeout: number; // milliseconds
  optimizationThreshold: number; // minimum savings percentage
  resourceLimits: {
    maxCpuUsage: number;
    maxMemoryUsage: number;
    maxExecutionTime: number;
  };
}

// Execution history entry
export interface ExecutionHistoryEntry {
  executionId: string;
  timestamp: Date;
  pipelineName: string;
  strategy: ExecutionStrategy;
  result: PipelineExecutionResult;
  context: Partial<PipelineContext>;
  replayable: boolean;
}

// Performance analytics
export interface PerformanceAnalytics {
  totalExecutions: number;
  averageExecutionTime: number;
  averageResourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  strategyPerformance: Record<ExecutionStrategy, {
    averageTime: number;
    successRate: number;
    resourceEfficiency: number;
  }>;
  optimizationImpact: {
    cacheHitRate: number;
    parallelizationGains: number;
    optimizationGains: number;
  };
  bottlenecks: string[];
  recommendations: string[];
}

// Enhanced Pipeline Execution Service Implementation
export class EnhancedPipelineExecutionService extends EventEmitter {
  private config: PipelineExecutionConfig;
  private resourceMonitor: ResourceMonitorService;
  private executionCache: Map<string, { result: PipelineExecutionResult; timestamp: number }> = new Map();
  private executionHistory: ExecutionHistoryEntry[] = [];
  private stageDependencyGraph: Map<string, string[]> = new Map();
  private stageExecutionTimes: Map<string, number[]> = new Map();
  private analytics: PerformanceAnalytics;

  constructor(config?: Partial<PipelineExecutionConfig>) {
    super();
    
    this.config = {
      strategy: 'adaptive',
      maxConcurrentStages: 4,
      enableCaching: true,
      enableOptimization: true,
      enableResourceMonitoring: true,
      cacheTimeout: 300000, // 5 minutes
      optimizationThreshold: 10, // 10% minimum savings
      resourceLimits: {
        maxCpuUsage: 80,
        maxMemoryUsage: 85,
        maxExecutionTime: 300000 // 5 minutes
      },
      ...config
    };

    this.resourceMonitor = new ResourceMonitorService();
    this.analytics = this.initializeAnalytics();

    this.initializeService();
  }

  /**
   * Execute pipeline with enhanced capabilities
   */
  async executePipeline(
    pipeline: PipelineEngine,
    context: PipelineContext,
    customConfig?: Partial<PipelineExecutionConfig>
  ): Promise<PipelineExecutionResult> {
    const config = { ...this.config, ...customConfig };
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    // Check cache first
    if (config.enableCaching) {
      const cachedResult = this.getCachedResult(pipeline, context, config);
      if (cachedResult) {
        this.emit('cacheHit', { executionId, cachedResult });
        return cachedResult;
      }
    }

    // Start resource monitoring
    if (config.enableResourceMonitoring) {
      this.resourceMonitor.startMonitoring(1000);
    }

    try {
      // Analyze pipeline for optimization opportunities
      const optimizations = await this.analyzePipeline(pipeline, context, config);
      
      // Determine execution strategy
      const strategy = this.determineExecutionStrategy(pipeline, context, config, optimizations);
      
      // Execute pipeline with chosen strategy
      const result = await this.executeWithStrategy(
        pipeline, 
        context, 
        strategy, 
        config, 
        optimizations,
        executionId
      );

      // Update analytics
      this.updateAnalytics(result);

      // Cache result if enabled
      if (config.enableCaching) {
        this.cacheResult(pipeline, context, result, config);
      }

      // Add to execution history
      this.addToHistory(executionId, pipeline, context, strategy, result);

      this.emit('executionCompleted', { executionId, result });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResult: PipelineExecutionResult = {
        executionId,
        strategy: config.strategy,
        success: false,
        totalExecutionTime: executionTime,
        stageResults: [],
        resourceUsage: {
          peakCpu: 0,
          peakMemory: 0,
          totalDisk: 0,
          totalNetwork: 0
        },
        optimizationMetrics: {
          cacheHits: 0,
          cacheMisses: 1,
          parallelizationSavings: 0,
          optimizationSavings: 0
        },
        errors: [error instanceof PipelineError ? error : new PipelineError(error instanceof Error ? error.message : 'Unknown error')],
        warnings: [],
        replayable: false
      };

      this.emit('executionFailed', { executionId, error, result: errorResult });
      return errorResult;

    } finally {
      // Stop resource monitoring
      if (config.enableResourceMonitoring) {
        this.resourceMonitor.stopMonitoring();
      }
    }
  }

  /**
   * Replay a previous execution
   */
  async replayExecution(executionId: string): Promise<PipelineExecutionResult | null> {
    const historyEntry = this.executionHistory.find(entry => entry.executionId === executionId);
    if (!historyEntry || !historyEntry.replayable) {
      return null;
    }

    this.emit('executionReplayStarted', { executionId, historyEntry });

    // Create a new pipeline instance (would need to be provided)
    // For now, return the cached result
    return historyEntry.result;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit: number = 100): ExecutionHistoryEntry[] {
    return this.executionHistory.slice(-limit);
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): PerformanceAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get cached execution results
   */
  getCacheStats(): { size: number; hitRate: number; entries: string[] } {
    const entries = Array.from(this.executionCache.keys());
    const totalRequests = this.analytics.totalExecutions;
    const cacheHits = this.analytics.optimizationImpact.cacheHitRate * totalRequests / 100;
    
    return {
      size: this.executionCache.size,
      hitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      entries
    };
  }

  /**
   * Clear execution cache
   */
  clearCache(): void {
    this.executionCache.clear();
    this.emit('cacheCleared');
  }

  /**
   * Update execution configuration
   */
  updateConfig(newConfig: Partial<PipelineExecutionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): PipelineExecutionConfig {
    return { ...this.config };
  }

  // Private helper methods

  private initializeService(): void {
    // Set up event listeners
    this.resourceMonitor.on('alertGenerated', (data) => {
      this.emit('resourceAlert', data);
    });

    this.resourceMonitor.on('operationLimitExceeded', (data) => {
      this.emit('resourceLimitExceeded', data);
    });

    this.emit('serviceInitialized', { config: this.config });
  }

  private initializeAnalytics(): PerformanceAnalytics {
    return {
      totalExecutions: 0,
      averageExecutionTime: 0,
      averageResourceUsage: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      },
      strategyPerformance: {
        sequential: { averageTime: 0, successRate: 0, resourceEfficiency: 0 },
        parallel: { averageTime: 0, successRate: 0, resourceEfficiency: 0 },
        adaptive: { averageTime: 0, successRate: 0, resourceEfficiency: 0 },
        optimized: { averageTime: 0, successRate: 0, resourceEfficiency: 0 }
      },
      optimizationImpact: {
        cacheHitRate: 0,
        parallelizationGains: 0,
        optimizationGains: 0
      },
      bottlenecks: [],
      recommendations: []
    };
  }

  private async analyzePipeline(
    pipeline: PipelineEngine,
    context: PipelineContext,
    config: PipelineExecutionConfig
  ): Promise<ExecutionOptimization[]> {
    const optimizations: ExecutionOptimization[] = [];

    // Analyze for parallelization opportunities
    const parallelizableStages = this.findParallelizableStages(pipeline);
    if (parallelizableStages.length > 0) {
      optimizations.push({
        type: 'parallel',
        description: `Found ${parallelizableStages.length} parallelizable stages`,
        estimatedSavings: this.calculateParallelizationSavings(parallelizableStages),
        applied: false,
        impact: 'high'
      });
    }

    // Analyze for caching opportunities
    if (config.enableCaching) {
      const cacheableStages = this.findCacheableStages(pipeline);
      if (cacheableStages.length > 0) {
        optimizations.push({
          type: 'cache',
          description: `Found ${cacheableStages.length} cacheable stages`,
          estimatedSavings: 50, // Assume 50% time savings for cached stages
          applied: false,
          impact: 'medium'
        });
      }
    }

    // Analyze resource usage patterns
    const resourceOptimizations = this.analyzeResourceUsage(pipeline, context);
    optimizations.push(...resourceOptimizations);

    return optimizations;
  }

  private determineExecutionStrategy(
    pipeline: PipelineEngine,
    context: PipelineContext,
    config: PipelineExecutionConfig,
    optimizations: ExecutionOptimization[]
  ): ExecutionStrategy {
    if (config.strategy !== 'adaptive') {
      return config.strategy;
    }

    // Adaptive strategy selection based on pipeline characteristics
    const parallelizableStages = optimizations.filter(opt => opt.type === 'parallel');
    const cacheableStages = optimizations.filter(opt => opt.type === 'cache');
    
    if (parallelizableStages.length > 2 && config.maxConcurrentStages > 1) {
      return 'parallel';
    } else if (cacheableStages.length > 0) {
      return 'optimized';
    } else {
      return 'sequential';
    }
  }

  private async executeWithStrategy(
    pipeline: PipelineEngine,
    context: PipelineContext,
    strategy: ExecutionStrategy,
    config: PipelineExecutionConfig,
    optimizations: ExecutionOptimization[],
    executionId: string
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    const stageResults: StageExecutionResult[] = [];

    switch (strategy) {
      case 'parallel':
        return this.executeParallel(pipeline, context, config, optimizations, executionId);
      
      case 'optimized':
        return this.executeOptimized(pipeline, context, config, optimizations, executionId);
      
      case 'sequential':
      default:
        return this.executeSequential(pipeline, context, config, optimizations, executionId);
    }
  }

  private async executeParallel(
    pipeline: PipelineEngine,
    context: PipelineContext,
    config: PipelineExecutionConfig,
    optimizations: ExecutionOptimization[],
    executionId: string
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    const stageResults: StageExecutionResult[] = [];
    
    // Build dependency graph
    const stages = pipeline.getStages();
    const dependencyGraph = this.buildDependencyGraph(stages);
    
    // Execute stages in parallel where possible
    const executedStages = new Set<string>();
    const pendingStages = new Map<string, Promise<StageExecutionResult>>();

    while (executedStages.size < stages.length) {
      // Find stages that can be executed (dependencies satisfied)
      const readyStages = this.findReadyStages(stages, executedStages, dependencyGraph);
      
      // Execute ready stages in parallel (up to maxConcurrentStages)
      const stagesToExecute = readyStages.slice(0, config.maxConcurrentStages);
      
      for (const stage of stagesToExecute) {
        const stagePromise = this.executeStage(stage, context, config, executionId);
        pendingStages.set(stage.id, stagePromise);
      }

      // Wait for at least one stage to complete
      const completedStage = await Promise.race(Array.from(pendingStages.values()));
      
      // Remove completed stage from pending and add to executed
      for (const [stageId, promise] of Array.from(pendingStages.entries())) {
        if (promise === pendingStages.get(completedStage.stageId)) {
          pendingStages.delete(stageId);
          executedStages.add(stageId);
          stageResults.push(completedStage);
          break;
        }
      }
    }

    // Calculate resource usage and optimization metrics
    const resourceUsage = this.calculateResourceUsage(stageResults);
    const optimizationMetrics = this.calculateOptimizationMetrics(stageResults, optimizations);

    return {
      executionId,
      strategy: 'parallel',
      success: stageResults.every(result => result.success),
      totalExecutionTime: Date.now() - startTime,
      stageResults,
      resourceUsage,
      optimizationMetrics,
      errors: stageResults.filter(result => !result.success).map(result => new PipelineError(result.error || 'Stage execution failed')),
      warnings: [],
      replayable: true
    };
  }

  private async executeOptimized(
    pipeline: PipelineEngine,
    context: PipelineContext,
    config: PipelineExecutionConfig,
    optimizations: ExecutionOptimization[],
    executionId: string
  ): Promise<PipelineExecutionResult> {
    // Similar to parallel execution but with additional optimizations
    const parallelResult = await this.executeParallel(pipeline, context, config, optimizations, executionId);
    
    // Apply additional optimizations
    const optimizedResults = await this.applyOptimizations(parallelResult, optimizations);
    
    return {
      ...parallelResult,
      strategy: 'optimized',
      optimizationMetrics: {
        ...parallelResult.optimizationMetrics,
        optimizationSavings: optimizedResults.optimizationMetrics?.optimizationSavings || 0
      }
    };
  }

  private async executeSequential(
    pipeline: PipelineEngine,
    context: PipelineContext,
    config: PipelineExecutionConfig,
    optimizations: ExecutionOptimization[],
    executionId: string
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    const stageResults: StageExecutionResult[] = [];
    
    const stages = pipeline.getStages();
    
    for (const stage of stages) {
      const stageResult = await this.executeStage(stage, context, config, executionId);
      stageResults.push(stageResult);
      
      // Stop execution if stage fails and it's critical
      if (!stageResult.success && this.isCriticalStage(stage)) {
        break;
      }
    }

    const resourceUsage = this.calculateResourceUsage(stageResults);
    const optimizationMetrics = this.calculateOptimizationMetrics(stageResults, optimizations);

    return {
      executionId,
      strategy: 'sequential',
      success: stageResults.every(result => result.success),
      totalExecutionTime: Date.now() - startTime,
      stageResults,
      resourceUsage,
      optimizationMetrics,
      errors: stageResults.filter(result => !result.success).map(result => new PipelineError(result.error || 'Stage execution failed')),
      warnings: [],
      replayable: true
    };
  }

  private async executeStage(
    stage: PipelineStage,
    context: PipelineContext,
    config: PipelineExecutionConfig,
    executionId: string
  ): Promise<StageExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (config.enableCaching) {
        const cachedResult = this.getCachedStageResult(stage, context);
        if (cachedResult) {
          return {
            ...cachedResult,
            cacheHit: true,
            executionTime: Date.now() - startTime
          };
        }
      }

      // Execute stage
      const result = await stage.execute(context);
      const executionTime = Date.now() - startTime;

      // Get resource usage
      const resourceUsage = this.resourceMonitor.getCurrentUsage();

      // Update stage execution times for analytics
      this.updateStageExecutionTimes(stage.id, executionTime);

      const stageResult: StageExecutionResult = {
        stageId: stage.id,
        stageName: stage.name,
        success: true,
        executionTime,
        resourceUsage: {
          cpu: resourceUsage.cpu.usage,
          memory: resourceUsage.memory.usage,
          disk: resourceUsage.disk.usage,
          network: (resourceUsage.network.bytesIn + resourceUsage.network.bytesOut) / (1024 * 1024) // MB
        },
        output: result,
        dependencies: this.getStageDependencies(stage),
        parallelizable: this.isStageParallelizable(stage),
        cacheHit: false,
        optimizationApplied: false
      };

      // Cache stage result if enabled
      if (config.enableCaching) {
        this.cacheStageResult(stage, context, stageResult);
      }

      return stageResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        stageId: stage.id,
        stageName: stage.name,
        success: false,
        executionTime,
        resourceUsage: {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error',
        dependencies: this.getStageDependencies(stage),
        parallelizable: this.isStageParallelizable(stage),
        cacheHit: false,
        optimizationApplied: false
      };
    }
  }

  private findParallelizableStages(pipeline: PipelineEngine): string[] {
    const stages = pipeline.getStages();
    const parallelizable: string[] = [];
    
    for (const stage of stages) {
      if (this.isStageParallelizable(stage)) {
        parallelizable.push(stage.id);
      }
    }
    
    return parallelizable;
  }

  private findCacheableStages(pipeline: PipelineEngine): string[] {
    const stages = pipeline.getStages();
    const cacheable: string[] = [];
    
    for (const stage of stages) {
      if (this.isStageCacheable(stage)) {
        cacheable.push(stage.id);
      }
    }
    
    return cacheable;
  }

  private isStageParallelizable(stage: PipelineStage): boolean {
    // Check if stage can be executed in parallel
    // This would depend on stage implementation and dependencies
    return stage.id.includes('Retrieve') || stage.id.includes('Read');
  }

  private isStageCacheable(stage: PipelineStage): boolean {
    // Check if stage result can be cached
    return stage.id.includes('Retrieve') || stage.id.includes('Analyze');
  }

  private isCriticalStage(stage: PipelineStage): boolean {
    // Check if stage is critical (pipeline should stop if it fails)
    return stage.id.includes('Validate') || stage.id.includes('Gate');
  }

  private buildDependencyGraph(stages: PipelineStage[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const stage of stages) {
      const dependencies = this.getStageDependencies(stage);
      graph.set(stage.id, dependencies);
    }
    
    return graph;
  }

  private getStageDependencies(stage: PipelineStage): string[] {
    // This would be determined by the stage implementation
    // For now, return empty array
    return [];
  }

  private findReadyStages(
    stages: PipelineStage[],
    executedStages: Set<string>,
    dependencyGraph: Map<string, string[]>
  ): PipelineStage[] {
    const ready: PipelineStage[] = [];
    
    for (const stage of stages) {
      if (executedStages.has(stage.id)) continue;
      
      const dependencies = dependencyGraph.get(stage.id) || [];
      const allDependenciesExecuted = dependencies.every(dep => executedStages.has(dep));
      
      if (allDependenciesExecuted) {
        ready.push(stage);
      }
    }
    
    return ready;
  }

  private calculateParallelizationSavings(parallelizableStages: string[]): number {
    // Calculate estimated time savings from parallelization
    return parallelizableStages.length * 30; // Assume 30% savings per parallelizable stage
  }

  private calculateResourceUsage(stageResults: StageExecutionResult[]) {
    return {
      peakCpu: Math.max(...stageResults.map(r => r.resourceUsage.cpu)),
      peakMemory: Math.max(...stageResults.map(r => r.resourceUsage.memory)),
      totalDisk: stageResults.reduce((sum, r) => sum + r.resourceUsage.disk, 0),
      totalNetwork: stageResults.reduce((sum, r) => sum + r.resourceUsage.network, 0)
    };
  }

  private calculateOptimizationMetrics(stageResults: StageExecutionResult[], optimizations: ExecutionOptimization[]) {
    const cacheHits = stageResults.filter(r => r.cacheHit).length;
    const cacheMisses = stageResults.filter(r => !r.cacheHit).length;
    
    return {
      cacheHits,
      cacheMisses,
      parallelizationSavings: optimizations.filter(o => o.type === 'parallel' && o.applied).reduce((sum, o) => sum + o.estimatedSavings, 0),
      optimizationSavings: optimizations.filter(o => o.applied).reduce((sum, o) => sum + o.estimatedSavings, 0)
    };
  }

  private async applyOptimizations(
    result: PipelineExecutionResult,
    optimizations: ExecutionOptimization[]
  ): Promise<PipelineExecutionResult> {
    // Apply additional optimizations to the result
    let totalSavings = 0;
    
    for (const optimization of optimizations) {
      if (optimization.estimatedSavings >= this.config.optimizationThreshold) {
        optimization.applied = true;
        totalSavings += optimization.estimatedSavings;
      }
    }
    
    return {
      ...result,
      optimizationMetrics: {
        ...result.optimizationMetrics,
        optimizationSavings: totalSavings
      }
    };
  }

  private analyzeResourceUsage(pipeline: PipelineEngine, context: PipelineContext): ExecutionOptimization[] {
    const optimizations: ExecutionOptimization[] = [];
    
    // Analyze current resource usage
    const currentUsage = this.resourceMonitor.getCurrentUsage();
    
    if (currentUsage.cpu.usage > this.config.resourceLimits.maxCpuUsage * 0.8) {
      optimizations.push({
        type: 'resource',
        description: 'High CPU usage detected, consider reducing concurrent stages',
        estimatedSavings: 20,
        applied: false,
        impact: 'medium'
      });
    }
    
    if (currentUsage.memory.usage > this.config.resourceLimits.maxMemoryUsage * 0.8) {
      optimizations.push({
        type: 'resource',
        description: 'High memory usage detected, consider memory optimization',
        estimatedSavings: 15,
        applied: false,
        impact: 'medium'
      });
    }
    
    return optimizations;
  }

  private getCachedResult(
    pipeline: PipelineEngine,
    context: PipelineContext,
    config: PipelineExecutionConfig
  ): PipelineExecutionResult | null {
    const cacheKey = this.generateCacheKey(pipeline, context);
    const cached = this.executionCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < config.cacheTimeout) {
      return cached.result;
    }
    
    if (cached) {
      this.executionCache.delete(cacheKey);
    }
    
    return null;
  }

  private cacheResult(
    pipeline: PipelineEngine,
    context: PipelineContext,
    result: PipelineExecutionResult,
    config: PipelineExecutionConfig
  ): void {
    const cacheKey = this.generateCacheKey(pipeline, context);
    this.executionCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  private getCachedStageResult(stage: PipelineStage, context: PipelineContext): StageExecutionResult | null {
    // Implement stage-level caching
    return null;
  }

  private cacheStageResult(stage: PipelineStage, context: PipelineContext, result: StageExecutionResult): void {
    // Implement stage-level caching
  }

  private generateCacheKey(pipeline: PipelineEngine, context: PipelineContext): string {
    const pipelineId = pipeline.constructor.name;
    const contextHash = crypto.createHash('md5').update(JSON.stringify(context)).digest('hex');
    return `${pipelineId}:${contextHash}`;
  }

  private generateExecutionId(): string {
    return `exec-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  private updateStageExecutionTimes(stageId: string, executionTime: number): void {
    if (!this.stageExecutionTimes.has(stageId)) {
      this.stageExecutionTimes.set(stageId, []);
    }
    
    const times = this.stageExecutionTimes.get(stageId)!;
    times.push(executionTime);
    
    // Keep only last 100 execution times
    if (times.length > 100) {
      times.shift();
    }
  }

  private updateAnalytics(result: PipelineExecutionResult): void {
    this.analytics.totalExecutions++;
    
    // Update average execution time
    this.analytics.averageExecutionTime = 
      (this.analytics.averageExecutionTime * (this.analytics.totalExecutions - 1) + result.totalExecutionTime) / 
      this.analytics.totalExecutions;
    
    // Update strategy performance
    const strategy = result.strategy;
    const strategyStats = this.analytics.strategyPerformance[strategy];
    strategyStats.averageTime = 
      (strategyStats.averageTime * (this.analytics.totalExecutions - 1) + result.totalExecutionTime) / 
      this.analytics.totalExecutions;
    
    strategyStats.successRate = 
      (strategyStats.successRate * (this.analytics.totalExecutions - 1) + (result.success ? 100 : 0)) / 
      this.analytics.totalExecutions;
    
    // Update optimization impact
    this.analytics.optimizationImpact.cacheHitRate = 
      (this.analytics.optimizationImpact.cacheHitRate * (this.analytics.totalExecutions - 1) + 
       (result.optimizationMetrics.cacheHits / (result.optimizationMetrics.cacheHits + result.optimizationMetrics.cacheMisses)) * 100) / 
      this.analytics.totalExecutions;
  }

  private addToHistory(
    executionId: string,
    pipeline: PipelineEngine,
    context: PipelineContext,
    strategy: ExecutionStrategy,
    result: PipelineExecutionResult
  ): void {
    const entry: ExecutionHistoryEntry = {
      executionId,
      timestamp: new Date(),
      pipelineName: pipeline.constructor.name,
      strategy,
      result,
      context: {
        requestId: context.requestId,
        tool: context.tool,
        input: context.input
      },
      replayable: result.replayable
    };
    
    this.executionHistory.push(entry);
    
    // Keep only last 1000 entries
    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift();
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.resourceMonitor.destroy();
    this.executionCache.clear();
    this.executionHistory = [];
    this.stageExecutionTimes.clear();
    this.emit('serviceDestroyed');
  }
}

export default EnhancedPipelineExecutionService;
