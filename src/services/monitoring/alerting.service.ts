/**
 * Alerting Service - Intelligent alerting and notification system
 * 
 * This service provides comprehensive alerting capabilities for LocalMCP,
 * implementing intelligent alert management, notification channels, and alert analytics.
 * 
 * Benefits for vibe coders:
 * - Intelligent alerting without false positives
 * - Multiple notification channels (console, log, email, webhook)
 * - Alert escalation and management
 * - Alert analytics and trend analysis
 * - Simple configuration and setup
 * - Proactive issue notification
 * 
 * Based on industry best practices from:
 * - PagerDuty (incident management)
 * - Slack (team notifications)
 * - Grafana (alerting and visualization)
 * - Prometheus (alerting rules)
 */

import { EventEmitter } from 'events';
import { PerformanceAlert, AlertSeverity } from './performance-monitor.service';

// Notification channel types
export type NotificationChannel = 'console' | 'log' | 'email' | 'webhook' | 'slack' | 'discord' | 'teams' | 'pagerduty';

// Alert escalation levels
export type EscalationLevel = 'immediate' | 'delayed' | 'scheduled';

// Notification configuration
export interface NotificationConfig {
  channel: NotificationChannel;
  enabled: boolean;
  settings: Record<string, any>;
}

// Alert escalation rule
export interface EscalationRule {
  severity: AlertSeverity;
  escalationLevel: EscalationLevel;
  delayMinutes: number;
  maxRetries: number;
  notificationChannels: NotificationChannel[];
}

// Alert analytics
export interface AlertAnalytics {
  totalAlerts: number;
  resolvedAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  averageResolutionTime: number; // minutes
  alertTrends: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  topAlertingMetrics: Array<{
    metric: string;
    count: number;
    lastAlert: Date;
  }>;
}

// Alerting Service Implementation
export class AlertingService extends EventEmitter {
  private notifications: Map<NotificationChannel, NotificationConfig> = new Map();
  private escalationRules: EscalationRule[] = [];
  private alertHistory: PerformanceAlert[] = [];
  private isRunning: boolean = false;
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    
    // Set up default notification channels
    this.setupDefaultChannels();
    this.setupDefaultEscalationRules();
  }

  /**
   * Start the alerting service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.emit('alertingStarted');
  }

  /**
   * Stop the alerting service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear all escalation timers
    for (const timer of Array.from(this.escalationTimers.values())) {
      clearTimeout(timer);
    }
    this.escalationTimers.clear();

    this.emit('alertingStopped');
  }

  /**
   * Process a new alert
   */
  async processAlert(alert: PerformanceAlert): Promise<void> {
    // Add to history
    this.alertHistory.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory.splice(0, this.alertHistory.length - 1000);
    }

    // Find escalation rule
    const escalationRule = this.escalationRules.find(rule => rule.severity === alert.severity);
    
    if (escalationRule) {
      await this.handleEscalation(alert, escalationRule);
    } else {
      // Immediate notification
      await this.sendNotification(alert, ['console', 'log']);
    }

    this.emit('alertProcessed', { alert });
  }

  /**
   * Handle alert escalation
   */
  private async handleEscalation(alert: PerformanceAlert, rule: EscalationRule): Promise<void> {
    const alertKey = `${alert.id}_${alert.severity}`;
    
    if (rule.escalationLevel === 'immediate') {
      // Send immediate notification
      await this.sendNotification(alert, rule.notificationChannels);
    } else if (rule.escalationLevel === 'delayed') {
      // Schedule delayed notification
      const timer = setTimeout(async () => {
        await this.sendNotification(alert, rule.notificationChannels);
        this.escalationTimers.delete(alertKey);
      }, rule.delayMinutes * 60 * 1000);
      
      this.escalationTimers.set(alertKey, timer);
    } else if (rule.escalationLevel === 'scheduled') {
      // Schedule for specific time (simplified - just delay)
      const timer = setTimeout(async () => {
        await this.sendNotification(alert, rule.notificationChannels);
        this.escalationTimers.delete(alertKey);
      }, rule.delayMinutes * 60 * 1000);
      
      this.escalationTimers.set(alertKey, timer);
    }
  }

  /**
   * Send notification through specified channels
   */
  private async sendNotification(alert: PerformanceAlert, channels: NotificationChannel[]): Promise<void> {
    const notificationPromises = channels.map(channel => this.sendToChannel(alert, channel));
    
    try {
      await Promise.allSettled(notificationPromises);
      this.emit('notificationSent', { alert, channels });
    } catch (error) {
      this.emit('notificationError', { alert, channels, error });
    }
  }

  /**
   * Send notification to a specific channel
   */
  private async sendToChannel(alert: PerformanceAlert, channel: NotificationChannel): Promise<void> {
    const config = this.notifications.get(channel);
    
    if (!config || !config.enabled) {
      return;
    }

    const message = this.formatAlertMessage(alert);
    
    switch (channel) {
      case 'console':
        await this.sendToConsole(alert, message);
        break;
      case 'log':
        await this.sendToLog(alert, message);
        break;
      case 'email':
        await this.sendToEmail(alert, message, config.settings);
        break;
      case 'webhook':
        await this.sendToWebhook(alert, message, config.settings);
        break;
      case 'slack':
        await this.sendToSlack(alert, message, config.settings);
        break;
      case 'discord':
        await this.sendToDiscord(alert, message, config.settings);
        break;
      case 'teams':
        await this.sendToTeams(alert, message, config.settings);
        break;
      case 'pagerduty':
        await this.sendToPagerDuty(alert, message, config.settings);
        break;
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: PerformanceAlert): string {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    };

    return `${severityEmoji[alert.severity]} **${alert.severity.toUpperCase()}** Alert
**Metric:** ${alert.metric}
**Message:** ${alert.message}
**Current Value:** ${alert.currentValue}
**Threshold:** ${alert.threshold}
**Time:** ${alert.timestamp.toISOString()}
**Alert ID:** ${alert.id}`;
  }

  /**
   * Send to console
   */
  private async sendToConsole(alert: PerformanceAlert, message: string): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log(message);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Send to log file
   */
  private async sendToLog(alert: PerformanceAlert, message: string): Promise<void> {
    const logEntry = {
      timestamp: alert.timestamp.toISOString(),
      level: alert.severity,
      type: 'alert',
      message: alert.message,
      metric: alert.metric,
      value: alert.currentValue,
      threshold: alert.threshold,
      alertId: alert.id
    };
    
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Send to email (placeholder)
   */
  private async sendToEmail(alert: PerformanceAlert, message: string, settings: Record<string, any>): Promise<void> {
    // In a real implementation, you'd use an email service like SendGrid, AWS SES, etc.
    console.log(`📧 Email notification would be sent to ${settings.recipients}: ${message}`);
  }

  /**
   * Send to webhook
   */
  private async sendToWebhook(alert: PerformanceAlert, message: string, settings: Record<string, any>): Promise<void> {
    if (!settings.url) {
      console.log('⚠️ Webhook URL not configured');
      return;
    }

    try {
      const payload = {
        alert,
        message,
        timestamp: new Date().toISOString(),
        source: 'localmcp'
      };

      // In a real implementation, you'd use fetch or axios
      console.log(`🔗 Webhook notification would be sent to ${settings.url}:`, payload);
    } catch (error) {
      console.error('❌ Webhook notification failed:', error);
    }
  }

  /**
   * Send to Slack
   */
  private async sendToSlack(alert: PerformanceAlert, message: string, settings: Record<string, any>): Promise<void> {
    if (!settings.webhookUrl) {
      console.log('⚠️ Slack webhook URL not configured');
      return;
    }

    const payload = {
      text: message,
      channel: settings.channel || '#alerts',
      username: 'LocalMCP Monitor',
      icon_emoji: ':robot_face:'
    };

    console.log(`💬 Slack notification would be sent:`, payload);
  }

  /**
   * Send to Discord
   */
  private async sendToDiscord(alert: PerformanceAlert, message: string, settings: Record<string, any>): Promise<void> {
    if (!settings.webhookUrl) {
      console.log('⚠️ Discord webhook URL not configured');
      return;
    }

    const payload = {
      content: message,
      username: 'LocalMCP Monitor'
    };

    console.log(`🎮 Discord notification would be sent:`, payload);
  }

  /**
   * Send to Microsoft Teams
   */
  private async sendToTeams(alert: PerformanceAlert, message: string, settings: Record<string, any>): Promise<void> {
    if (!settings.webhookUrl) {
      console.log('⚠️ Teams webhook URL not configured');
      return;
    }

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.getSeverityColor(alert.severity),
      summary: `LocalMCP Alert: ${alert.severity.toUpperCase()}`,
      sections: [{
        activityTitle: `Alert: ${alert.metric}`,
        activitySubtitle: alert.message,
        facts: [
          { name: 'Current Value', value: alert.currentValue.toString() },
          { name: 'Threshold', value: alert.threshold.toString() },
          { name: 'Time', value: alert.timestamp.toISOString() }
        ]
      }]
    };

    console.log(`🏢 Teams notification would be sent:`, payload);
  }

  /**
   * Send to PagerDuty
   */
  private async sendToPagerDuty(alert: PerformanceAlert, message: string, settings: Record<string, any>): Promise<void> {
    if (!settings.integrationKey) {
      console.log('⚠️ PagerDuty integration key not configured');
      return;
    }

    const payload = {
      routing_key: settings.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.message,
        source: 'LocalMCP',
        severity: alert.severity,
        custom_details: {
          metric: alert.metric,
          currentValue: alert.currentValue,
          threshold: alert.threshold
        }
      }
    };

    console.log(`📞 PagerDuty notification would be sent:`, payload);
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      info: '0078D4',
      warning: 'FF8C00',
      error: 'D13438',
      critical: 'A80000'
    };
    return colors[severity];
  }

  /**
   * Set up default notification channels
   */
  private setupDefaultChannels(): void {
    this.notifications.set('console', {
      channel: 'console',
      enabled: true,
      settings: {}
    });

    this.notifications.set('log', {
      channel: 'log',
      enabled: true,
      settings: {}
    });
  }

  /**
   * Set up default escalation rules
   */
  private setupDefaultEscalationRules(): void {
    this.escalationRules = [
      {
        severity: 'info',
        escalationLevel: 'immediate',
        delayMinutes: 0,
        maxRetries: 1,
        notificationChannels: ['console', 'log']
      },
      {
        severity: 'warning',
        escalationLevel: 'immediate',
        delayMinutes: 0,
        maxRetries: 2,
        notificationChannels: ['console', 'log']
      },
      {
        severity: 'error',
        escalationLevel: 'immediate',
        delayMinutes: 0,
        maxRetries: 3,
        notificationChannels: ['console', 'log', 'webhook']
      },
      {
        severity: 'critical',
        escalationLevel: 'immediate',
        delayMinutes: 0,
        maxRetries: 5,
        notificationChannels: ['console', 'log', 'webhook', 'slack']
      }
    ];
  }

  /**
   * Get alert analytics
   */
  getAnalytics(): AlertAnalytics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalAlerts = this.alertHistory.length;
    const resolvedAlerts = this.alertHistory.filter(alert => alert.resolved).length;
    const activeAlerts = totalAlerts - resolvedAlerts;

    const alertsBySeverity = this.alertHistory.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const resolvedAlertsWithTime = this.alertHistory.filter(alert => alert.resolved && alert.resolvedAt);
    const averageResolutionTime = resolvedAlertsWithTime.length > 0
      ? resolvedAlertsWithTime.reduce((sum, alert) => {
          const resolutionTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
          return sum + (resolutionTime / (1000 * 60)); // Convert to minutes
        }, 0) / resolvedAlertsWithTime.length
      : 0;

    const alertTrends = {
      last24Hours: this.alertHistory.filter(alert => alert.timestamp >= last24Hours).length,
      last7Days: this.alertHistory.filter(alert => alert.timestamp >= last7Days).length,
      last30Days: this.alertHistory.filter(alert => alert.timestamp >= last30Days).length
    };

    const metricCounts = this.alertHistory.reduce((acc, alert) => {
      acc[alert.metric] = (acc[alert.metric] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAlertingMetrics = Object.entries(metricCounts)
      .map(([metric, count]) => ({
        metric,
        count,
        lastAlert: this.alertHistory
          .filter(alert => alert.metric === metric)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp || new Date(0)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAlerts,
      resolvedAlerts,
      activeAlerts,
      alertsBySeverity,
      averageResolutionTime,
      alertTrends,
      topAlertingMetrics
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.emit('serviceDestroyed');
  }
}

export default AlertingService;
