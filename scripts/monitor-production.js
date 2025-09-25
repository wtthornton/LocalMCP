#!/usr/bin/env node

/**
 * Production Monitoring Script for AI Enhancement Features
 * 
 * This script provides comprehensive monitoring of the production AI enhancement features including:
 * - Real-time health monitoring
 * - Performance metrics collection
 * - Alert management
 * - Log analysis
 * - Resource monitoring
 * - Automated recovery
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Monitoring configuration
const MONITORING_CONFIG = {
  // Monitoring intervals
  intervals: {
    healthCheck: 30000, // 30 seconds
    performanceCheck: 60000, // 1 minute
    resourceCheck: 300000, // 5 minutes
    logAnalysis: 600000, // 10 minutes
    alertCheck: 15000 // 15 seconds
  },
  
  // Service endpoints
  endpoints: {
    health: '/health',
    aiEnhancement: '/health/ai-enhancement',
    context7: '/health/context7',
    qdrant: '/health/qdrant',
    cache: '/health/cache',
    metrics: '/metrics',
    logs: '/logs'
  },
  
  // Alert thresholds
  thresholds: {
    responseTime: {
      warning: 1000,
      critical: 2000
    },
    errorRate: {
      warning: 0.01, // 1%
      critical: 0.05 // 5%
    },
    memoryUsage: {
      warning: 100 * 1024 * 1024, // 100MB
      critical: 200 * 1024 * 1024 // 200MB
    },
    cpuUsage: {
      warning: 70,
      critical: 90
    },
    diskUsage: {
      warning: 80, // 80%
      critical: 90 // 90%
    }
  },
  
  // Alert channels
  alertChannels: {
    console: true,
    file: true,
    email: false,
    slack: false
  },
  
  // Recovery actions
  recoveryActions: {
    restartService: true,
    clearCache: true,
    scaleUp: false,
    failover: false
  }
};

// Monitoring metrics collector
class MonitoringMetrics {
  constructor() {
    this.metrics = {
      health: [],
      performance: [],
      resources: [],
      errors: [],
      alerts: []
    };
    this.startTime = Date.now();
  }

  recordHealth(endpoint, status, responseTime, timestamp = Date.now()) {
    this.metrics.health.push({
      endpoint,
      status,
      responseTime,
      timestamp
    });
  }

  recordPerformance(metric, value, timestamp = Date.now()) {
    this.metrics.performance.push({
      metric,
      value,
      timestamp
    });
  }

  recordResource(type, usage, timestamp = Date.now()) {
    this.metrics.resources.push({
      type,
      usage,
      timestamp
    });
  }

  recordError(error, context, timestamp = Date.now()) {
    this.metrics.errors.push({
      error: error.message,
      stack: error.stack,
      context,
      timestamp
    });
  }

  recordAlert(alert, timestamp = Date.now()) {
    this.metrics.alerts.push({
      ...alert,
      timestamp
    });
  }

  getRecentMetrics(timeWindow = 300000) { // 5 minutes
    const cutoff = Date.now() - timeWindow;
    
    return {
      health: this.metrics.health.filter(m => m.timestamp > cutoff),
      performance: this.metrics.performance.filter(m => m.timestamp > cutoff),
      resources: this.metrics.resources.filter(m => m.timestamp > cutoff),
      errors: this.metrics.errors.filter(m => m.timestamp > cutoff),
      alerts: this.metrics.alerts.filter(m => m.timestamp > cutoff)
    };
  }

  getSummary() {
    const recent = this.getRecentMetrics();
    
    return {
      uptime: Date.now() - this.startTime,
      healthChecks: recent.health.length,
      performanceMetrics: recent.performance.length,
      resourceChecks: recent.resources.length,
      errors: recent.errors.length,
      alerts: recent.alerts.length,
      avgResponseTime: this.calculateAverage(recent.health.map(h => h.responseTime)),
      errorRate: this.calculateErrorRate(recent.health),
      memoryUsage: this.getLatestResourceUsage('memory'),
      cpuUsage: this.getLatestResourceUsage('cpu')
    };
  }

  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateErrorRate(healthChecks) {
    if (healthChecks.length === 0) return 0;
    const errors = healthChecks.filter(h => h.status !== 'healthy').length;
    return errors / healthChecks.length;
  }

  getLatestResourceUsage(type) {
    const resources = this.metrics.resources.filter(r => r.type === type);
    if (resources.length === 0) return 0;
    return resources[resources.length - 1].usage;
  }
}

// Production monitor
class ProductionMonitor {
  constructor(config = {}) {
    this.config = { ...MONITORING_CONFIG, ...config };
    this.metrics = new MonitoringMetrics();
    this.isRunning = false;
    this.timers = {};
    this.alerts = new Map();
  }

  async start() {
    console.log('🔍 Starting production monitoring...');
    this.isRunning = true;

    try {
      // Start monitoring loops
      this.startHealthMonitoring();
      this.startPerformanceMonitoring();
      this.startResourceMonitoring();
      this.startLogAnalysis();
      this.startAlertMonitoring();

      console.log('✅ Production monitoring started');
      console.log('Press Ctrl+C to stop monitoring\n');

      // Keep the process running
      process.on('SIGINT', () => this.stop());
      process.on('SIGTERM', () => this.stop());

    } catch (error) {
      console.error('❌ Failed to start monitoring:', error.message);
      throw error;
    }
  }

  stop() {
    console.log('\n🛑 Stopping production monitoring...');
    this.isRunning = false;

    // Clear all timers
    Object.values(this.timers).forEach(timer => clearInterval(timer));

    // Generate final report
    this.generateFinalReport();

    console.log('✅ Production monitoring stopped');
    process.exit(0);
  }

  startHealthMonitoring() {
    this.timers.health = setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        this.metrics.recordError(error, 'health_check');
      }
    }, this.config.intervals.healthCheck);
  }

  startPerformanceMonitoring() {
    this.timers.performance = setInterval(async () => {
      try {
        await this.checkPerformance();
      } catch (error) {
        this.metrics.recordError(error, 'performance_check');
      }
    }, this.config.intervals.performanceCheck);
  }

  startResourceMonitoring() {
    this.timers.resources = setInterval(async () => {
      try {
        await this.checkResources();
      } catch (error) {
        this.metrics.recordError(error, 'resource_check');
      }
    }, this.config.intervals.resourceCheck);
  }

  startLogAnalysis() {
    this.timers.logs = setInterval(async () => {
      try {
        await this.analyzeLogs();
      } catch (error) {
        this.metrics.recordError(error, 'log_analysis');
      }
    }, this.config.intervals.logAnalysis);
  }

  startAlertMonitoring() {
    this.timers.alerts = setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        this.metrics.recordError(error, 'alert_check');
      }
    }, this.config.intervals.alertCheck);
  }

  async checkHealth() {
    const endpoints = Object.entries(this.config.endpoints);
    
    for (const [name, endpoint] of endpoints) {
      try {
        const startTime = performance.now();
        const response = await this.makeRequest(`http://localhost:3000${endpoint}`);
        const endTime = performance.now();
        
        const responseTime = endTime - startTime;
        const status = response.status === 'healthy' ? 'healthy' : 'unhealthy';
        
        this.metrics.recordHealth(name, status, responseTime);
        
        if (status !== 'healthy') {
          await this.handleHealthIssue(name, status, response);
        }
        
      } catch (error) {
        this.metrics.recordHealth(name, 'error', 0);
        await this.handleHealthIssue(name, 'error', error);
      }
    }
  }

  async checkPerformance() {
    try {
      // Test AI enhancement performance
      const testPrompts = [
        'Create a React component',
        'Build a REST API',
        'Add authentication'
      ];
      
      const results = [];
      for (const prompt of testPrompts) {
        const startTime = performance.now();
        const response = await this.makeRequest('http://localhost:3000/api/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const endTime = performance.now();
        
        results.push({
          prompt,
          responseTime: endTime - startTime,
          success: response.success
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const successRate = results.filter(r => r.success).length / results.length;
      
      this.metrics.recordPerformance('response_time', avgResponseTime);
      this.metrics.recordPerformance('success_rate', successRate);
      
      // Check thresholds
      if (avgResponseTime > this.config.thresholds.responseTime.warning) {
        await this.triggerAlert('performance', 'warning', 
          `High response time: ${avgResponseTime.toFixed(0)}ms`, avgResponseTime);
      }
      
      if (successRate < 0.99) {
        await this.triggerAlert('performance', 'critical', 
          `Low success rate: ${(successRate * 100).toFixed(1)}%`, successRate);
      }
      
    } catch (error) {
      this.metrics.recordError(error, 'performance_check');
    }
  }

  async checkResources() {
    try {
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      this.metrics.recordResource('memory', memoryUsage.heapUsed);
      
      if (memoryUsage.heapUsed > this.config.thresholds.memoryUsage.warning) {
        await this.triggerAlert('resource', 'warning', 
          `High memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(0)}MB`, memoryUsage.heapUsed);
      }
      
      // Check CPU usage
      const cpuUsage = await this.getCpuUsage();
      this.metrics.recordResource('cpu', cpuUsage);
      
      if (cpuUsage > this.config.thresholds.cpuUsage.warning) {
        await this.triggerAlert('resource', 'warning', 
          `High CPU usage: ${cpuUsage.toFixed(1)}%`, cpuUsage);
      }
      
      // Check disk usage
      const diskUsage = await this.getDiskUsage();
      this.metrics.recordResource('disk', diskUsage);
      
      if (diskUsage > this.config.thresholds.diskUsage.warning) {
        await this.triggerAlert('resource', 'warning', 
          `High disk usage: ${diskUsage.toFixed(1)}%`, diskUsage);
      }
      
    } catch (error) {
      this.metrics.recordError(error, 'resource_check');
    }
  }

  async analyzeLogs() {
    try {
      // Read recent log files
      const logFiles = [
        'logs/server-error.log',
        'logs/server-output.log'
      ];
      
      for (const logFile of logFiles) {
        try {
          const logPath = path.join(__dirname, '..', logFile);
          const content = await fs.readFile(logPath, 'utf8');
          const lines = content.split('\n').slice(-100); // Last 100 lines
          
          // Analyze for errors
          const errorLines = lines.filter(line => 
            line.includes('ERROR') || line.includes('FATAL') || line.includes('Exception')
          );
          
          if (errorLines.length > 0) {
            await this.triggerAlert('logs', 'warning', 
              `${errorLines.length} errors found in ${logFile}`, errorLines.length);
          }
          
        } catch (error) {
          // Log file might not exist yet
        }
      }
      
    } catch (error) {
      this.metrics.recordError(error, 'log_analysis');
    }
  }

  async checkAlerts() {
    const recent = this.metrics.getRecentMetrics(300000); // Last 5 minutes
    
    // Check for repeated errors
    const errorCount = recent.errors.length;
    if (errorCount > 10) {
      await this.triggerAlert('system', 'critical', 
        `High error count: ${errorCount} errors in last 5 minutes`, errorCount);
    }
    
    // Check for service degradation
    const healthChecks = recent.health;
    const unhealthyChecks = healthChecks.filter(h => h.status !== 'healthy');
    if (unhealthyChecks.length > healthChecks.length * 0.1) { // More than 10% unhealthy
      await this.triggerAlert('system', 'warning', 
        `Service degradation: ${unhealthyChecks.length}/${healthChecks.length} health checks failed`, 
        unhealthyChecks.length);
    }
  }

  async handleHealthIssue(endpoint, status, response) {
    const alertKey = `health_${endpoint}`;
    
    if (status === 'error' || status === 'unhealthy') {
      if (!this.alerts.has(alertKey)) {
        await this.triggerAlert('health', 'critical', 
          `${endpoint} is ${status}`, response);
        this.alerts.set(alertKey, true);
      }
    } else {
      this.alerts.delete(alertKey);
    }
  }

  async triggerAlert(type, severity, message, value) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      value,
      timestamp: Date.now()
    };
    
    this.metrics.recordAlert(alert);
    
    // Send alert to configured channels
    await this.sendAlert(alert);
    
    // Attempt recovery if configured
    if (this.config.recoveryActions.restartService && severity === 'critical') {
      await this.attemptRecovery(alert);
    }
  }

  async sendAlert(alert) {
    const message = `[${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`;
    
    if (this.config.alertChannels.console) {
      console.log(`🚨 ${message}`);
    }
    
    if (this.config.alertChannels.file) {
      await this.logAlert(alert);
    }
    
    if (this.config.alertChannels.email) {
      await this.sendEmailAlert(alert);
    }
    
    if (this.config.alertChannels.slack) {
      await this.sendSlackAlert(alert);
    }
  }

  async logAlert(alert) {
    try {
      const logPath = path.join(__dirname, '..', 'logs', 'alerts.log');
      const logEntry = `${new Date().toISOString()} [${alert.severity}] ${alert.type}: ${alert.message}\n`;
      await fs.appendFile(logPath, logEntry);
    } catch (error) {
      console.error('Failed to log alert:', error.message);
    }
  }

  async sendEmailAlert(alert) {
    // Implementation would depend on your email service
    console.log(`📧 Email alert: ${alert.message}`);
  }

  async sendSlackAlert(alert) {
    // Implementation would depend on your Slack integration
    console.log(`💬 Slack alert: ${alert.message}`);
  }

  async attemptRecovery(alert) {
    console.log(`🔧 Attempting recovery for: ${alert.message}`);
    
    try {
      if (alert.type === 'health') {
        await this.restartService();
      } else if (alert.type === 'resource' && alert.message.includes('memory')) {
        await this.clearCache();
      }
      
      console.log('✅ Recovery attempt completed');
    } catch (error) {
      console.error('❌ Recovery attempt failed:', error.message);
    }
  }

  async restartService() {
    console.log('🔄 Restarting service...');
    
    try {
      execSync('npm restart', { stdio: 'pipe' });
      console.log('✅ Service restarted');
    } catch (error) {
      console.error('❌ Failed to restart service:', error.message);
    }
  }

  async clearCache() {
    console.log('🧹 Clearing cache...');
    
    try {
      // Clear prompt cache
      const cachePath = path.join(__dirname, '..', 'prompt-cache.db');
      await fs.unlink(cachePath).catch(() => {}); // Ignore if file doesn't exist
      
      console.log('✅ Cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error.message);
    }
  }

  async getCpuUsage() {
    try {
      const { stdout } = execSync('ps -p $$ -o %cpu', { encoding: 'utf8' });
      const lines = stdout.split('\n');
      const cpuLine = lines[1]; // Second line contains the value
      return parseFloat(cpuLine.trim());
    } catch (error) {
      return 0;
    }
  }

  async getDiskUsage() {
    try {
      const { stdout } = execSync('df -h .', { encoding: 'utf8' });
      const lines = stdout.split('\n');
      const rootLine = lines.find(line => line.includes('/'));
      
      if (rootLine) {
        const parts = rootLine.split(/\s+/);
        const usage = parts[4]; // Usage percentage
        return parseFloat(usage.replace('%', ''));
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  async makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(url, {
      timeout: 10000,
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  generateFinalReport() {
    const summary = this.metrics.getSummary();
    
    console.log('\n📊 Monitoring Summary:');
    console.log(`Uptime: ${(summary.uptime / 1000 / 60).toFixed(1)} minutes`);
    console.log(`Health Checks: ${summary.healthChecks}`);
    console.log(`Performance Metrics: ${summary.performanceMetrics}`);
    console.log(`Resource Checks: ${summary.resourceChecks}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Alerts: ${summary.alerts}`);
    console.log(`Avg Response Time: ${summary.avgResponseTime.toFixed(0)}ms`);
    console.log(`Error Rate: ${(summary.errorRate * 100).toFixed(2)}%`);
    console.log(`Memory Usage: ${(summary.memoryUsage / 1024 / 1024).toFixed(0)}MB`);
    console.log(`CPU Usage: ${summary.cpuUsage.toFixed(1)}%`);
  }
}

// Main execution
async function main() {
  const monitor = new ProductionMonitor();
  
  try {
    await monitor.start();
  } catch (error) {
    console.error('❌ Failed to start monitoring:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductionMonitor, MonitoringMetrics };
