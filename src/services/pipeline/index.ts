/**
 * Pipeline Services Index - Enhanced pipeline execution services for LocalMCP
 * 
 * This module provides a clean interface for importing all enhanced pipeline services
 * that provide advanced execution capabilities, optimization, and performance monitoring.
 */

export { default as EnhancedPipelineExecutionService } from './enhanced-pipeline-execution.service';
export { default as PipelineOptimizationService } from './pipeline-optimization.service';

export type {
  ExecutionStrategy,
  StageExecutionResult,
  PipelineExecutionResult,
  ExecutionOptimization,
  PipelineExecutionConfig,
  ExecutionHistoryEntry,
  PerformanceAnalytics
} from './enhanced-pipeline-execution.service';

export type {
  OptimizationStrategy,
  CacheEntry,
  OptimizationRule,
  OptimizationResult,
  PipelineOptimizationConfig,
  PerformanceMetrics,
  CacheStatistics
} from './pipeline-optimization.service';
