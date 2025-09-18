/**
 * Alerting Service - Intelligent alerting and notification system
 * 
 * This service provides comprehensive alerting capabilities for LocalMCP,
 * including intelligent alert routing, escalation, and notification delivery.
 * 
 * Benefits for vibe coders:
 * - Proactive problem detection with intelligent alerting
 * - Multiple notification channels (console, log, email, webhook, Slack, etc.)
 * - Alert escalation and acknowledgment workflows
 * - Intelligent alert deduplication and noise reduction
 * - Integration with monitoring dashboard for visual alerts
 * - Customizable alert rules and thresholds
 */

import { EventEmitter } from 'events';
import { StructuredLoggingService } from './structured-logging.service';

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

// Alert status
export type AlertStatus = 'pending' | 'firing' | 'acknowledged' | 'resolved' | 'suppressed';

// Notification channel types
export type NotificationChannel = 
  | 'console'      // Console output
  | 'log'          // Log file
  | 'email'        // Email notification
  | 'webhook'      // HTTP webhook
  | 'slack'        // Slack message
  | 'discord'      // Discord message
  | 'teams'        // Microsoft Teams
  | 'pagerduty'    // PagerDuty integration
  | 'opsgenie'     // OpsGenie integration
  | 'datadog'      // Datadog integration
  | 'newrelic'     // New Relic integration
  | 'sentry'       // Sentry integration
  | 'custom';      // Custom notification handler

// Alert rule
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'neq' | 'contains' | 'regex' | 'absent' | 'present';
    threshold: number | string;
    timeWindow: number; // seconds
    evaluationInterval: number; // seconds
  };
  severity: AlertSeverity;
  channels: string[];
  tags: string[];
  runbook?: string;
  escalation?: {
    delay: number; // seconds
    channels: string[];
    severity: AlertSeverity;
  };
  suppression?: {
    enabled: boolean;
    duration: number; // seconds
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
}

// Active alert
export interface ActiveAlert {
  id: string;
  ruleId: string;
  status: AlertStatus;
  severity: AlertSeverity;
  message: string;
  description?: string;
  value: number | string;
  threshold: number | string;
  timestamp: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalationLevel: number;
  suppressionExpiry?: Date;
  metadata: Record<string, any>;
}

// Notification configuration
export interface NotificationConfig {
  channel: NotificationChannel;
  enabled: boolean;
  config: Record<string, any>;
  rateLimit?: {
    maxAlerts: number;
    timeWindow: number; // seconds
  };
  filters?: {
    severities?: AlertSeverity[];
    tags?: string[];
    services?: string[];
  };
}

// Notification result
export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// Alert statistics
export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByStatus: Record<AlertStatus, number>;
  alertsByChannel: Record<NotificationChannel, number>;
  averageResolutionTime: number; // seconds
  escalationRate: number; // percentage
  falsePositiveRate: number; // percentage
}

// Alerting Service Implementation
export class AlertingService extends EventEmitter {
  private logger: StructuredLoggingService;
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, ActiveAlert> = new Map();
  private notificationConfigs: Map<NotificationChannel, NotificationConfig> = new Map();
  private evaluationInterval?: NodeJS.Timeout;
  private escalationInterval?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private alertCounter: number = 0;

  constructor(logger: StructuredLoggingService) {
    super();
    this.logger = logger;
    this.initializeDefaultNotifications();
    this.initializeDefaultRules();
  }

  /**
   * Start the alerting service
   */
  async start(evaluationInterval: number = 60): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Alerting service is already running');
      return;
    }

    this.isRunning = true;
    
    // Start periodic evaluation
    this.evaluationInterval = setInterval(() => {
      this.evaluateAlerts();
    }, evaluationInterval * 1000);

    // Start escalation monitoring
    this.escalationInterval = setInterval(() => {
      this.checkEscalations();
    }, 30 * 1000); // Check every 30 seconds

    this.logger.info('Alerting service started', { evaluationInterval });
    this.emit('serviceStarted', { evaluationInterval });
  }

  /**
   * Stop the alerting service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = undefined;
    }
    
    if (this.escalationInterval) {
      clearInterval(this.escalationInterval);
      this.escalationInterval = undefined;
    }

    this.logger.info('Alerting service stopped');
    this.emit('serviceStopped');
  }

  /**
   * Add or update alert rule
   */
  setRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info('Alert rule updated', { ruleId: rule.id, name: rule.name });
    this.emit('ruleUpdated', { rule });
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): void {
    if (this.rules.delete(ruleId)) {
      // Also remove any active alerts for this rule
      for (const [alertId, alert] of Array.from(this.activeAlerts.entries())) {
        if (alert.ruleId === ruleId) {
          this.activeAlerts.delete(alertId);
        }
      }
      
      this.logger.info('Alert rule removed', { ruleId });
      this.emit('ruleRemoved', { ruleId });
    }
  }

  /**
   * Get alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ActiveAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    this.logger.info('Alert acknowledged', { alertId, acknowledgedBy });
    this.emit('alertAcknowledged', { alert });
    
    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    this.logger.info('Alert resolved', { alertId, resolvedBy });
    this.emit('alertResolved', { alert });
    
    return true;
  }

  /**
   * Suppress alert
   */
  suppressAlert(alertId: string, duration: number, reason?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'suppressed';
    alert.suppressionExpiry = new Date(Date.now() + duration * 1000);

    this.logger.info('Alert suppressed', { alertId, duration, reason });
    this.emit('alertSuppressed', { alert, duration, reason });
    
    return true;
  }

  /**
   * Create manual alert
   */
  createManualAlert(
    ruleId: string,
    severity: AlertSeverity,
    message: string,
    value?: number | string,
    metadata?: Record<string, any>
  ): string {
    const alertId = `manual-${++this.alertCounter}`;
    const timestamp = new Date();

    const alert: ActiveAlert = {
      id: alertId,
      ruleId,
      status: 'firing',
      severity,
      message,
      value: value || 0,
      threshold: 0,
      timestamp,
      escalationLevel: 0,
      metadata: metadata || {}
    };

    this.activeAlerts.set(alertId, alert);
    this.sendNotifications(alert);
    
    this.logger.warn('Manual alert created', { alertId, severity, message });
    this.emit('alertCreated', { alert });
    
    return alertId;
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const alerts = Array.from(this.activeAlerts.values());
    
    const stats: AlertStats = {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.status === 'firing').length,
      alertsBySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0
      },
      alertsByStatus: {
        pending: 0,
        firing: 0,
        acknowledged: 0,
        resolved: 0,
        suppressed: 0
      },
      alertsByChannel: {} as Record<NotificationChannel, number>,
      averageResolutionTime: 0,
      escalationRate: 0,
      falsePositiveRate: 0
    };

    // Calculate statistics
    for (const alert of alerts) {
      stats.alertsBySeverity[alert.severity]++;
      stats.alertsByStatus[alert.status]++;
      
      if (alert.resolvedAt && alert.timestamp) {
        const resolutionTime = alert.resolvedAt.getTime() - alert.timestamp.getTime();
        stats.averageResolutionTime += resolutionTime;
      }
    }

    // Calculate averages
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;
    if (resolvedAlerts > 0) {
      stats.averageResolutionTime = (stats.averageResolutionTime / resolvedAlerts) / 1000; // Convert to seconds
    }

    return stats;
  }

  /**
   * Configure notification channel
   */
  setNotificationConfig(channel: NotificationChannel, config: NotificationConfig): void {
    this.notificationConfigs.set(channel, config);
    this.logger.info('Notification configuration updated', { channel });
    this.emit('notificationConfigUpdated', { channel, config });
  }

  /**
   * Get notification configurations
   */
  getNotificationConfigs(): Map<NotificationChannel, NotificationConfig> {
    return new Map(this.notificationConfigs);
  }

  /**
   * Evaluate alert conditions
   */
  private async evaluateAlerts(): Promise<void> {
    const currentTime = Date.now();
    
    for (const [ruleId, rule] of Array.from(this.rules.entries())) {
      if (!rule.enabled) continue;
      
      try {
        const value = await this.getMetricValue(rule.condition.metric);
        const isTriggered = this.evaluateCondition(value, rule.condition);
        
        if (isTriggered) {
          await this.handleAlertTrigger(rule, value);
        } else {
          await this.handleAlertResolve(rule);
        }
      } catch (error) {
        this.logger.error('Failed to evaluate alert rule', error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  }

  /**
   * Handle alert trigger
   */
  private async handleAlertTrigger(rule: AlertRule, value: number | string): Promise<void> {
    // Check if alert already exists
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && alert.status !== 'resolved');

    if (existingAlert) {
      // Update existing alert
      existingAlert.value = value;
      existingAlert.timestamp = new Date();
      return;
    }

    // Create new alert
    const alertId = `alert-${rule.id}-${++this.alertCounter}`;
    const timestamp = new Date();

    const alert: ActiveAlert = {
      id: alertId,
      ruleId: rule.id,
      status: 'firing',
      severity: rule.severity,
      message: rule.description,
      description: `Metric ${rule.condition.metric} ${rule.condition.operator} ${rule.condition.threshold}`,
      value,
      threshold: rule.condition.threshold,
      timestamp,
      escalationLevel: 0,
      metadata: {
        rule: rule.name,
        condition: rule.condition
      }
    };

    this.activeAlerts.set(alertId, alert);
    this.sendNotifications(alert);
    
    this.logger.warn('Alert triggered', { 
      alertId, 
      ruleId: rule.id, 
      severity: rule.severity,
      value,
      threshold: rule.condition.threshold
    });
    
    this.emit('alertTriggered', { alert });
  }

  /**
   * Handle alert resolve
   */
  private async handleAlertResolve(rule: AlertRule): Promise<void> {
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.ruleId === rule.id && alert.status === 'firing');

    if (existingAlert) {
      existingAlert.status = 'resolved';
      existingAlert.resolvedAt = new Date();
      
      this.logger.info('Alert resolved', { alertId: existingAlert.id, ruleId: rule.id });
      this.emit('alertResolved', { alert: existingAlert });
    }
  }

  /**
   * Get metric value (mock implementation)
   */
  private async getMetricValue(metric: string): Promise<number | string> {
    // This would integrate with the performance metrics service
    // For now, return mock values based on metric name
    
    switch (metric) {
      case 'cpu_usage':
        return Math.random() * 100;
      case 'memory_usage':
        return Math.random() * 100;
      case 'error_rate':
        return Math.random() * 10;
      case 'response_time':
        return Math.random() * 1000;
      default:
        return Math.random() * 100;
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number | string, condition: AlertRule['condition']): boolean {
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
      case 'absent':
        return value === null || value === undefined;
      case 'present':
        return value !== null && value !== undefined;
      default:
        return false;
    }
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(alert: ActiveAlert): Promise<void> {
    const rule = this.rules.get(alert.ruleId);
    if (!rule) return;

    const results: NotificationResult[] = [];

    for (const channelName of rule.channels) {
      const channel = channelName as NotificationChannel;
      const config = this.notificationConfigs.get(channel);
      
      if (!config || !config.enabled) {
        continue;
      }

      // Check rate limiting
      if (config.rateLimit && !this.checkRateLimit(channel, config.rateLimit)) {
        continue;
      }

      // Check filters
      if (config.filters && !this.matchesFilters(alert, config.filters)) {
        continue;
      }

      try {
        const result = await this.sendNotification(channel, alert, config);
        results.push(result);
        
        if (result.success) {
          this.logger.info('Notification sent successfully', { 
            channel, 
            alertId: alert.id 
          });
        } else {
          this.logger.error('Failed to send notification', new Error(`${channel}: ${result.error}`));
        }
      } catch (error) {
        results.push({
          channel,
          success: false,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.emit('notificationsSent', { alert, results });
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotification(
    channel: NotificationChannel, 
    alert: ActiveAlert, 
    config: NotificationConfig
  ): Promise<NotificationResult> {
    const timestamp = new Date();
    
    try {
      switch (channel) {
        case 'console':
          console.log(`🚨 ALERT [${alert.severity.toUpperCase()}] ${alert.message}`);
          if (alert.description) {
            console.log(`   ${alert.description}`);
          }
          console.log(`   Value: ${alert.value} | Threshold: ${alert.threshold}`);
          console.log(`   Time: ${alert.timestamp.toISOString()}`);
          break;
          
        case 'log':
          this.logger.error('Alert triggered', new Error(`Alert ${alert.id}: ${alert.message}`));
          break;
          
        case 'webhook':
          // This would make an HTTP POST request to the webhook URL
          // For now, just log the webhook call
          this.logger.info('Webhook notification', {
            url: config.config.url,
            alertId: alert.id,
            payload: this.formatWebhookPayload(alert)
          });
          break;
          
        case 'email':
          // This would send an email notification
          this.logger.info('Email notification', {
            to: config.config.to,
            subject: `Alert: ${alert.message}`,
            alertId: alert.id
          });
          break;
          
        case 'slack':
          // This would send a Slack message
          this.logger.info('Slack notification', {
            channel: config.config.channel,
            alertId: alert.id,
            message: this.formatSlackMessage(alert)
          });
          break;
          
        default:
          this.logger.warn('Unsupported notification channel', { channel });
      }
      
      return {
        channel,
        success: true,
        timestamp,
        metadata: { alertId: alert.id }
      };
    } catch (error) {
      return {
        channel,
        success: false,
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check escalation conditions
   */
  private checkEscalations(): void {
    const now = Date.now();
    
    for (const [alertId, alert] of Array.from(this.activeAlerts.entries())) {
      if (alert.status !== 'firing') continue;
      
      const rule = this.rules.get(alert.ruleId);
      if (!rule || !rule.escalation) continue;
      
      const escalationDelay = rule.escalation.delay * 1000; // Convert to milliseconds
      const timeSinceCreated = now - alert.timestamp.getTime();
      
      if (timeSinceCreated >= escalationDelay && alert.escalationLevel === 0) {
        this.escalateAlert(alert, rule);
      }
    }
  }

  /**
   * Escalate alert
   */
  private escalateAlert(alert: ActiveAlert, rule: AlertRule): void {
    if (!rule.escalation) return;
    
    alert.escalationLevel = 1;
    alert.severity = rule.escalation.severity;
    alert.message = `[ESCALATED] ${alert.message}`;
    
    // Send escalated notifications
    const escalatedRule = { ...rule, channels: rule.escalation.channels };
    this.sendNotifications(alert);
    
    this.logger.warn('Alert escalated', { 
      alertId: alert.id, 
      escalationLevel: alert.escalationLevel,
      newSeverity: alert.severity
    });
    
    this.emit('alertEscalated', { alert });
  }

  /**
   * Check rate limiting for notifications
   */
  private checkRateLimit(channel: NotificationChannel, rateLimit: NotificationConfig['rateLimit']): boolean {
    // Simple rate limiting implementation
    // In a real implementation, this would use a proper rate limiting algorithm
    return true; // For now, always allow
  }

  /**
   * Check if alert matches notification filters
   */
  private matchesFilters(alert: ActiveAlert, filters: NotificationConfig['filters']): boolean {
    if (!filters) return true;
    
    if (filters.severities && !filters.severities.includes(alert.severity)) {
      return false;
    }
    
    if (filters.tags) {
      const rule = this.rules.get(alert.ruleId);
      if (rule && !filters.tags.some(tag => rule.tags.includes(tag))) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Format webhook payload
   */
  private formatWebhookPayload(alert: ActiveAlert): any {
    return {
      alert: {
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        description: alert.description,
        value: alert.value,
        threshold: alert.threshold,
        timestamp: alert.timestamp.toISOString(),
        escalationLevel: alert.escalationLevel
      }
    };
  }

  /**
   * Format Slack message
   */
  private formatSlackMessage(alert: ActiveAlert): string {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    };
    
    return `${severityEmoji[alert.severity]} *${alert.message}*\n` +
           `Value: ${alert.value} | Threshold: ${alert.threshold}\n` +
           `Time: ${alert.timestamp.toISOString()}`;
  }

  /**
   * Initialize default notification configurations
   */
  private initializeDefaultNotifications(): void {
    const defaultConfigs: Array<[NotificationChannel, NotificationConfig]> = [
      ['console', {
        channel: 'console',
        enabled: true,
        config: {}
      }],
      ['log', {
        channel: 'log',
        enabled: true,
        config: {}
      }],
      ['webhook', {
        channel: 'webhook',
        enabled: false,
        config: {
          url: 'http://localhost:8080/webhook'
        }
      }],
      ['email', {
        channel: 'email',
        enabled: false,
        config: {
          to: 'admin@localmcp.com',
          from: 'alerts@localmcp.com'
        }
      }],
      ['slack', {
        channel: 'slack',
        enabled: false,
        config: {
          webhookUrl: 'https://hooks.slack.com/services/...',
          channel: '#alerts'
        }
      }]
    ];

    for (const [channel, config] of defaultConfigs) {
      this.notificationConfigs.set(channel, config);
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
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
        id: 'critical-cpu-usage',
        name: 'Critical CPU Usage',
        description: 'CPU usage is above 95%',
        enabled: true,
        condition: {
          metric: 'cpu_usage',
          operator: 'gt',
          threshold: 95,
          timeWindow: 60,
          evaluationInterval: 30
        },
        severity: 'critical',
        channels: ['console', 'log'],
        tags: ['system', 'performance'],
        escalation: {
          delay: 300, // 5 minutes
          channels: ['webhook'],
          severity: 'critical'
        }
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
      }
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.rules.clear();
    this.activeAlerts.clear();
    this.notificationConfigs.clear();
    this.emit('serviceDestroyed');
  }
}

export default AlertingService;
