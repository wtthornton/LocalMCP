/**
 * Monitoring Services Module
 * 
 * This module provides comprehensive monitoring and alerting capabilities for LocalMCP,
 * including performance monitoring, alerting, and analytics.
 * 
 * Benefits for vibe coders:
 * - Real-time performance monitoring and alerting
 * - Comprehensive analytics and reporting
 * - Simple configuration and setup
 * - Proactive issue detection and notification
 * - Unified monitoring dashboard
 */

export { default as PerformanceMonitorService } from './performance-monitor.service';
export { default as AlertingService } from './alerting.service';
export { default as MonitoringCoordinatorService } from './monitoring-coordinator.service';

export type {
  MetricType,
  AlertSeverity,
  PerformanceThresholds,
  PerformanceMetric,
  PerformanceAlert,
  PerformanceStats
} from './performance-monitor.service';

export type {
  NotificationChannel,
  EscalationLevel,
  NotificationConfig,
  EscalationRule,
  AlertAnalytics
} from './alerting.service';

export type {
  MonitoringConfig,
  DashboardData
} from './monitoring-coordinator.service';
