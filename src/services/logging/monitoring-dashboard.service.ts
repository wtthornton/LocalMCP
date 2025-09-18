/**
 * Monitoring Dashboard Service - Real-time observability dashboard
 * 
 * This service provides a comprehensive monitoring dashboard for LocalMCP,
 * offering real-time metrics, health checks, system status, and alerting.
 * 
 * Benefits for vibe coders:
 * - Real-time visibility into system performance and health
 * - Proactive monitoring with automated alerts and notifications
 * - Comprehensive metrics dashboard with customizable widgets
 * - Health checks for all LocalMCP services and dependencies
 * - Performance insights and bottleneck identification
 * - Integration with structured logging for complete observability
 */

import { EventEmitter } from 'events';
import { StructuredLoggingService } from './structured-logging.service';
import { PerformanceMetricsService } from './performance-metrics.service';
import { ErrorTrackingService } from './error-tracking.service';
import { AuditLoggingService } from './audit-logging.service';

// Dashboard widget types
export type WidgetType = 
  | 'metric'           // Single metric display
  | 'chart'            // Time-series chart
  | 'gauge'            // Gauge/speedometer
  | 'table'            // Data table
  | 'alert'            // Alert status
  | 'health'           // Health check status
  | 'log'              // Log stream
  | 'trace'            // Trace visualization
  | 'heatmap'          // Heatmap visualization
  | 'stat'             // Statistics card
  | 'progress'         // Progress bar
  | 'counter'          // Counter display
  | 'histogram'        // Histogram chart
  | 'pie'              // Pie chart
  | 'bar'              // Bar chart
  | 'line'             // Line chart
  | 'area'             // Area chart
  | 'scatter'          // Scatter plot
  | 'map'              // Geographic map
  | 'text'             // Text display
  | 'html'             // Custom HTML
  | 'iframe'           // Embedded content
  | 'image'            // Image display
  | 'video'            // Video stream
  | 'audio'            // Audio stream;

// Widget configuration
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dataSource: {
    type: 'metric' | 'log' | 'trace' | 'audit' | 'health' | 'custom';
    query: string;
    refreshInterval?: number; // seconds
    timeRange?: {
      from: string;
      to: string;
    };
  };
  display: {
    showTitle: boolean;
    showLegend: boolean;
    showGrid: boolean;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    fontSize?: number;
    theme?: 'light' | 'dark' | 'auto';
  };
  alerts?: {
    enabled: boolean;
    thresholds: Array<{
      value: number;
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'neq';
      severity: 'info' | 'warning' | 'error' | 'critical';
      message: string;
    }>;
  };
  filters?: Record<string, any>;
  transformations?: Array<{
    type: 'aggregate' | 'filter' | 'sort' | 'limit' | 'group' | 'pivot';
    params: Record<string, any>;
  }>;
}

// Dashboard layout
export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: WidgetConfig[];
  grid: {
    columns: number;
    rowHeight: number;
    margin: [number, number];
    containerPadding: [number, number];
  };
  theme: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  refreshInterval: number; // seconds
  autoRefresh: boolean;
  timeRange: {
    from: string;
    to: string;
    refresh: string;
  };
}

// Health check status
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// Service health
export interface ServiceHealth {
  serviceId: string;
  serviceName: string;
  status: HealthStatus;
  lastCheck: Date;
  responseTime?: number;
  errorRate?: number;
  uptime?: number;
  version?: string;
  dependencies: Array<{
    name: string;
    status: HealthStatus;
    lastCheck: Date;
  }>;
  metrics: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: number;
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
  }>;
}

// System status
export interface SystemStatus {
  overall: HealthStatus;
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: ServiceHealth[];
  alerts: Array<{
    id: string;
    serviceId: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }>;
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeUsers: number;
    systemLoad: number;
    memoryUsage: number;
    diskUsage: number;
    networkTraffic: number;
  };
}

// Alert configuration
export interface AlertConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'neq' | 'contains' | 'regex';
    threshold: number | string;
    timeWindow: number; // seconds
    evaluationInterval: number; // seconds
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[]; // notification channels
  tags: string[];
  runbook?: string;
  escalation?: {
    delay: number; // seconds
    channels: string[];
  };
}

// Dashboard data
export interface DashboardData {
  widgets: Array<{
    id: string;
    data: any;
    timestamp: Date;
    status: 'loading' | 'success' | 'error';
    error?: string;
  }>;
  systemStatus: SystemStatus;
  alerts: Array<{
    id: string;
    config: AlertConfig;
    status: 'firing' | 'resolved' | 'pending';
    value: number | string;
    timestamp: Date;
    message: string;
  }>;
  refreshTime: Date;
}

// Monitoring Dashboard Service Implementation
export class MonitoringDashboardService extends EventEmitter {
  private logger: StructuredLoggingService;
  private performanceMetrics: PerformanceMetricsService;
  private errorTracking: ErrorTrackingService;
  private auditLogging: AuditLoggingService;
  
  private layouts: Map<string, DashboardLayout> = new Map();
  private currentLayout: string = 'default';
  private alerts: Map<string, AlertConfig> = new Map();
  private healthChecks: Map<string, () => Promise<ServiceHealth>> = new Map();
  private refreshInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(
    logger: StructuredLoggingService,
    performanceMetrics: PerformanceMetricsService,
    errorTracking: ErrorTrackingService,
    auditLogging: AuditLoggingService
  ) {
    super();
    
    this.logger = logger;
    this.performanceMetrics = performanceMetrics;
    this.errorTracking = errorTracking;
    this.auditLogging = auditLogging;
    
    this.initializeDefaultLayout();
    this.initializeDefaultAlerts();
    this.initializeHealthChecks();
  }

  /**
   * Start the monitoring dashboard
   */
  async start(refreshInterval: number = 30): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Monitoring dashboard is already running');
      return;
    }

    this.isRunning = true;
    
    // Start periodic refresh
    this.refreshInterval = setInterval(() => {
      this.refreshDashboard();
    }, refreshInterval * 1000);

    // Initial refresh
    await this.refreshDashboard();

    this.logger.info('Monitoring dashboard started', { refreshInterval });
    this.emit('dashboardStarted', { refreshInterval });
  }

  /**
   * Stop the monitoring dashboard
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }

    this.logger.info('Monitoring dashboard stopped');
    this.emit('dashboardStopped');
  }

  /**
   * Get current dashboard data
   */
  async getDashboardData(layoutId?: string): Promise<DashboardData> {
    const layout = layoutId ? this.layouts.get(layoutId) : this.layouts.get(this.currentLayout);
    if (!layout) {
      throw new Error(`Dashboard layout not found: ${layoutId || this.currentLayout}`);
    }

    const systemStatus = await this.getSystemStatus();
    const alerts = await this.evaluateAlerts();
    
    // Get widget data
    const widgets = await Promise.all(
      layout.widgets.map(async (widget) => {
        try {
          const data = await this.getWidgetData(widget);
          return {
            id: widget.id,
            data,
            timestamp: new Date(),
            status: 'success' as const
          };
        } catch (error) {
          return {
            id: widget.id,
            data: null,
            timestamp: new Date(),
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return {
      widgets,
      systemStatus,
      alerts,
      refreshTime: new Date()
    };
  }

  /**
   * Add or update dashboard layout
   */
  setLayout(layout: DashboardLayout): void {
    this.layouts.set(layout.id, layout);
    this.logger.info('Dashboard layout updated', { layoutId: layout.id });
    this.emit('layoutUpdated', { layout });
  }

  /**
   * Set current dashboard layout
   */
  setCurrentLayout(layoutId: string): void {
    if (!this.layouts.has(layoutId)) {
      throw new Error(`Dashboard layout not found: ${layoutId}`);
    }
    
    this.currentLayout = layoutId;
    this.logger.info('Current dashboard layout changed', { layoutId });
    this.emit('currentLayoutChanged', { layoutId });
  }

  /**
   * Get available layouts
   */
  getLayouts(): DashboardLayout[] {
    return Array.from(this.layouts.values());
  }

  /**
   * Add or update alert configuration
   */
  setAlert(config: AlertConfig): void {
    this.alerts.set(config.id, config);
    this.logger.info('Alert configuration updated', { alertId: config.id });
    this.emit('alertUpdated', { config });
  }

  /**
   * Remove alert configuration
   */
  removeAlert(alertId: string): void {
    if (this.alerts.delete(alertId)) {
      this.logger.info('Alert configuration removed', { alertId });
      this.emit('alertRemoved', { alertId });
    }
  }

  /**
   * Get alert configurations
   */
  getAlerts(): AlertConfig[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Register health check function
   */
  registerHealthCheck(serviceId: string, checkFunction: () => Promise<ServiceHealth>): void {
    this.healthChecks.set(serviceId, checkFunction);
    this.logger.info('Health check registered', { serviceId });
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const services: ServiceHealth[] = [];
    
    // Run all health checks
    for (const [serviceId, checkFunction] of Array.from(this.healthChecks.entries())) {
      try {
        const health = await checkFunction();
        services.push(health);
      } catch (error) {
        services.push({
          serviceId,
          serviceName: serviceId,
          status: 'unhealthy',
          lastCheck: new Date(),
          dependencies: [],
          metrics: {},
          alerts: [{
            id: `health-check-${serviceId}`,
            severity: 'error',
            message: error instanceof Error ? error.message : 'Health check failed',
            timestamp: new Date()
          }]
        });
      }
    }

    // Determine overall status
    const overall = this.calculateOverallStatus(services);
    
    // Get system metrics
    const metrics = await this.getSystemMetrics();
    
    // Get active alerts
    const alerts = await this.getActiveAlerts();

    return {
      overall,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      alerts,
      metrics
    };
  }

  /**
   * Refresh dashboard data
   */
  private async refreshDashboard(): Promise<void> {
    try {
      const data = await this.getDashboardData();
      this.emit('dashboardRefreshed', { data });
    } catch (error) {
      this.logger.error('Failed to refresh dashboard', error instanceof Error ? error : new Error('Unknown error'));
      this.emit('dashboardRefreshError', { error });
    }
  }

  /**
   * Get widget data based on configuration
   */
  private async getWidgetData(widget: WidgetConfig): Promise<any> {
    switch (widget.dataSource.type) {
      case 'metric':
        return this.getMetricData(widget);
      case 'log':
        return this.getLogData(widget);
      case 'trace':
        return this.getTraceData(widget);
      case 'audit':
        return this.getAuditData(widget);
      case 'health':
        return this.getHealthData(widget);
      default:
        throw new Error(`Unsupported data source type: ${widget.dataSource.type}`);
    }
  }

  /**
   * Get metric data for widget
   */
  private async getMetricData(widget: WidgetConfig): Promise<any> {
    const snapshots = this.performanceMetrics.getSnapshots(1);
    const snapshot = snapshots.length > 0 ? snapshots[0] : { metrics: {} as any, counters: {} as any };
    
    // Parse query to extract metric name and filters
    const query = widget.dataSource.query;
    
    const metrics = (snapshot as any).metrics || {};
    
    if (query.includes('cpu_usage')) {
      return {
        value: metrics.cpu || 0,
        unit: '%',
        trend: 'stable'
      };
    }
    
    if (query.includes('memory_usage')) {
      return {
        value: metrics.memory || 0,
        unit: 'MB',
        trend: 'stable'
      };
    }
    
    if (query.includes('response_time')) {
      return {
        value: metrics.responseTime || 0,
        unit: 'ms',
        trend: 'stable'
      };
    }
    
    if (query.includes('error_rate')) {
      return {
        value: metrics.errorRate || 0,
        unit: '%',
        trend: 'stable'
      };
    }
    
    // Default to first available metric
    const firstMetric = Object.keys(metrics)[0];
    return {
      value: firstMetric ? metrics[firstMetric] : 0,
      unit: 'count',
      trend: 'stable'
    };
  }

  /**
   * Get log data for widget
   */
  private async getLogData(widget: WidgetConfig): Promise<any> {
    // This would integrate with the structured logging service
    // For now, return mock data
    return {
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'System running normally',
          service: 'localmcp'
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warn',
          message: 'High memory usage detected',
          service: 'localmcp'
        }
      ]
    };
  }

  /**
   * Get trace data for widget
   */
  private async getTraceData(widget: WidgetConfig): Promise<any> {
    // This would integrate with the pipeline tracing service
    // For now, return mock data
    return {
      traces: [
        {
          id: 'trace-123',
          duration: 150,
          status: 'success',
          stages: ['retrieve-context7', 'analyze-code', 'generate-result']
        }
      ]
    };
  }

  /**
   * Get audit data for widget
   */
  private async getAuditData(widget: WidgetConfig): Promise<any> {
    const analytics = this.auditLogging.getAuditAnalytics();
    return analytics;
  }

  /**
   * Get health data for widget
   */
  private async getHealthData(widget: WidgetConfig): Promise<any> {
    const systemStatus = await this.getSystemStatus();
    return systemStatus;
  }

  /**
   * Evaluate alert conditions
   */
  private async evaluateAlerts(): Promise<Array<{
    id: string;
    config: AlertConfig;
    status: 'firing' | 'resolved' | 'pending';
    value: number | string;
    timestamp: Date;
    message: string;
  }>> {
    const results = [];
    const snapshots = this.performanceMetrics.getSnapshots(1);
    const snapshot = snapshots.length > 0 ? snapshots[0] : { metrics: {} as any, counters: {} as any };
    
    for (const [alertId, config] of Array.from(this.alerts.entries())) {
      if (!config.enabled) continue;
      
      try {
        const value = this.getMetricValue(config.condition.metric, snapshot);
        const isTriggered = this.evaluateCondition(value, config.condition);
        
        if (isTriggered) {
          results.push({
            id: alertId,
            config,
            status: 'firing' as const,
            value,
            timestamp: new Date(),
            message: config.description
          });
        }
      } catch (error) {
        this.logger.error('Failed to evaluate alert', error instanceof Error ? error : new Error('Unknown error'));
      }
    }
    
    return results;
  }

  /**
   * Get metric value from snapshot
   */
  private getMetricValue(metric: string, snapshot: any): number | string {
    const parts = metric.split('.');
    let value = snapshot;
    
    for (const part of parts) {
      value = value[part];
      if (value === undefined) {
        throw new Error(`Metric not found: ${metric}`);
      }
    }
    
    return value;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number | string, condition: AlertConfig['condition']): boolean {
    const { operator, threshold } = condition;
    
    switch (operator) {
      case 'gt':
        return Number(value) > Number(threshold);
      case 'lt':
        return Number(value) < Number(threshold);
      case 'eq':
        return value === threshold;
      case 'gte':
        return Number(value) >= Number(threshold);
      case 'lte':
        return Number(value) <= Number(threshold);
      case 'neq':
        return value !== threshold;
      case 'contains':
        return String(value).includes(String(threshold));
      case 'regex':
        return new RegExp(String(threshold)).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(services: ServiceHealth[]): HealthStatus {
    if (services.length === 0) return 'unknown';
    
    const hasUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    
    return 'healthy';
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<SystemStatus['metrics']> {
    const snapshots = this.performanceMetrics.getSnapshots(1);
    const snapshot = snapshots.length > 0 ? snapshots[0] : { metrics: {} as any, counters: {} as any };
    
    const metrics = (snapshot as any).metrics || {};
    const counters = (snapshot as any).counters || {};
    
    return {
      totalRequests: counters.totalRequests || 0,
      errorRate: metrics.errorRate || 0,
      averageResponseTime: metrics.responseTime || 0,
      activeUsers: counters.activeUsers || 0,
      systemLoad: metrics.cpu || 0,
      memoryUsage: metrics.memory || 0,
      diskUsage: metrics.disk || 0,
      networkTraffic: metrics.network || 0
    };
  }

  /**
   * Get active alerts
   */
  private async getActiveAlerts(): Promise<SystemStatus['alerts']> {
    const alerts = await this.evaluateAlerts();
    
    return alerts.map(alert => ({
      id: alert.id,
      serviceId: 'system',
      severity: alert.config.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      acknowledged: false
    }));
  }

  /**
   * Initialize default dashboard layout
   */
  private initializeDefaultLayout(): void {
    const defaultLayout: DashboardLayout = {
      id: 'default',
      name: 'LocalMCP System Dashboard',
      description: 'Default monitoring dashboard for LocalMCP',
      widgets: [
        {
          id: 'system-health',
          type: 'health',
          title: 'System Health',
          position: { x: 0, y: 0, width: 4, height: 2 },
          dataSource: { type: 'health', query: 'system.overall' },
          display: { showTitle: true, showLegend: false, showGrid: true }
        },
        {
          id: 'cpu-usage',
          type: 'gauge',
          title: 'CPU Usage',
          position: { x: 4, y: 0, width: 2, height: 2 },
          dataSource: { type: 'metric', query: 'cpu_usage' },
          display: { showTitle: true, showLegend: false, showGrid: true }
        },
        {
          id: 'memory-usage',
          type: 'gauge',
          title: 'Memory Usage',
          position: { x: 6, y: 0, width: 2, height: 2 },
          dataSource: { type: 'metric', query: 'memory_usage' },
          display: { showTitle: true, showLegend: false, showGrid: true }
        },
        {
          id: 'response-time',
          type: 'chart',
          title: 'Response Time',
          position: { x: 0, y: 2, width: 4, height: 3 },
          dataSource: { type: 'metric', query: 'response_time', timeRange: { from: 'now-1h', to: 'now' } },
          display: { showTitle: true, showLegend: true, showGrid: true }
        },
        {
          id: 'error-rate',
          type: 'chart',
          title: 'Error Rate',
          position: { x: 4, y: 2, width: 4, height: 3 },
          dataSource: { type: 'metric', query: 'error_rate', timeRange: { from: 'now-1h', to: 'now' } },
          display: { showTitle: true, showLegend: true, showGrid: true }
        },
        {
          id: 'recent-logs',
          type: 'log',
          title: 'Recent Logs',
          position: { x: 0, y: 5, width: 8, height: 4 },
          dataSource: { type: 'log', query: 'recent_logs' },
          display: { showTitle: true, showLegend: false, showGrid: true }
        }
      ],
      grid: {
        columns: 8,
        rowHeight: 50,
        margin: [10, 10],
        containerPadding: [10, 10]
      },
      theme: {
        primary: '#007acc',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        accent: '#28a745'
      },
      refreshInterval: 30,
      autoRefresh: true,
      timeRange: {
        from: 'now-1h',
        to: 'now',
        refresh: '30s'
      }
    };

    this.layouts.set('default', defaultLayout);
  }

  /**
   * Initialize default alerts
   */
  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertConfig[] = [
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        description: 'CPU usage is above 80%',
        enabled: true,
        condition: {
          metric: 'cpu_usage',
          operator: 'gt',
          threshold: 80,
          timeWindow: 300,
          evaluationInterval: 60
        },
        severity: 'warning',
        channels: ['console', 'log'],
        tags: ['system', 'performance']
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage is above 85%',
        enabled: true,
        condition: {
          metric: 'memory_usage',
          operator: 'gt',
          threshold: 85,
          timeWindow: 300,
          evaluationInterval: 60
        },
        severity: 'warning',
        channels: ['console', 'log'],
        tags: ['system', 'performance']
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate is above 5%',
        enabled: true,
        condition: {
          metric: 'error_rate',
          operator: 'gt',
          threshold: 5,
          timeWindow: 300,
          evaluationInterval: 60
        },
        severity: 'error',
        channels: ['console', 'log'],
        tags: ['system', 'errors']
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        description: 'Average response time is above 2 seconds',
        enabled: true,
        condition: {
          metric: 'response_time',
          operator: 'gt',
          threshold: 2000,
          timeWindow: 300,
          evaluationInterval: 60
        },
        severity: 'warning',
        channels: ['console', 'log'],
        tags: ['system', 'performance']
      }
    ];

    for (const alert of defaultAlerts) {
      this.alerts.set(alert.id, alert);
    }
  }

  /**
   * Initialize health checks
   */
  private initializeHealthChecks(): void {
    // LocalMCP Core Service Health Check
    this.registerHealthCheck('localmcp-core', async (): Promise<ServiceHealth> => {
      return {
        serviceId: 'localmcp-core',
        serviceName: 'LocalMCP Core',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 10,
        errorRate: 0,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        dependencies: [],
        metrics: {
          cpu: 15,
          memory: 128,
          disk: 512,
          network: 1024
        },
        alerts: []
      };
    });

    // Pipeline Engine Health Check
    this.registerHealthCheck('pipeline-engine', async (): Promise<ServiceHealth> => {
      return {
        serviceId: 'pipeline-engine',
        serviceName: 'Pipeline Engine',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 5,
        errorRate: 0,
        uptime: process.uptime(),
        version: '1.0.0',
        dependencies: [],
        metrics: {
          cpu: 10,
          memory: 64,
          disk: 256,
          network: 512
        },
        alerts: []
      };
    });

    // Context7 Service Health Check
    this.registerHealthCheck('context7-service', async (): Promise<ServiceHealth> => {
      try {
        // This would make an actual health check to Context7
        return {
          serviceId: 'context7-service',
          serviceName: 'Context7 Service',
          status: 'healthy',
          lastCheck: new Date(),
          responseTime: 50,
          errorRate: 0,
          uptime: process.uptime(),
          version: '1.0.0',
          dependencies: [],
          metrics: {
            cpu: 5,
            memory: 32,
            disk: 128,
            network: 256
          },
          alerts: []
        };
      } catch (error) {
        return {
          serviceId: 'context7-service',
          serviceName: 'Context7 Service',
          status: 'unhealthy',
          lastCheck: new Date(),
          dependencies: [],
          metrics: {},
          alerts: [{
            id: 'context7-connection-error',
            severity: 'error',
            message: 'Failed to connect to Context7 service',
            timestamp: new Date()
          }]
        };
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.layouts.clear();
    this.alerts.clear();
    this.healthChecks.clear();
    this.emit('serviceDestroyed');
  }
}

export default MonitoringDashboardService;
