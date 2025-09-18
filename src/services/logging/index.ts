/**
 * Logging Services Index - Structured logging and observability services for LocalMCP
 * 
 * This module provides a clean interface for importing all logging services
 * that provide comprehensive logging, tracing, and observability capabilities.
 */

export { default as StructuredLoggingService } from './structured-logging.service';
export { default as PipelineTracingService } from './pipeline-tracing.service';
export { default as ErrorTrackingService } from './error-tracking.service';
export { default as PerformanceMetricsService } from './performance-metrics.service';
export { default as AuditLoggingService } from './audit-logging.service';

export type {
  LogLevel,
  LogEntry,
  LoggingConfig,
  PerformanceMetrics,
  AuditLogEntry
} from './structured-logging.service';

export type {
  TraceEntryType,
  TraceEntry,
  PipelineTrace,
  TraceConfig,
  PerformanceAnalysis
} from './pipeline-tracing.service';

export type {
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ErrorEntry,
  ErrorPattern,
  ErrorTrackingConfig,
  ErrorAnalytics
} from './error-tracking.service';

export type {
  MetricType,
  MetricCategory,
  PerformanceMetric,
  PerformanceSnapshot,
  BottleneckDetection,
  PerformanceTrend,
  PerformanceAnalytics,
  PerformanceConfig
} from './performance-metrics.service';

export type {
  AuditEventType,
  AuditSeverity,
  ComplianceFramework,
  AuditEvent,
  AuditEvidence,
  AuditQueryFilters,
  AuditAnalytics,
  AuditLoggingConfig
} from './audit-logging.service';
