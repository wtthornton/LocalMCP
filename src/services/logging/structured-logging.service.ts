/**
 * Structured Logging Service - Advanced structured logging with correlation IDs
 * 
 * This service provides comprehensive structured logging capabilities including
 * correlation IDs, log levels, contextual information, and performance tracking.
 * 
 * Benefits for vibe coders:
 * - Easy debugging with correlation IDs that track requests across services
 * - Structured logs that are easy to search and analyze
 * - Performance tracking and bottleneck identification
 * - Security audit trails for compliance
 * - Integration with monitoring and alerting systems
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Log entry structure
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  correlationId: string;
  service: string;
  operation: string;
  duration?: number;
  metadata: Record<string, any>;
  tags: string[];
  source: {
    file: string;
    line: number;
    function: string;
  };
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    tool?: string;
    stage?: string;
    pipeline?: string;
  };
  performance?: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  error?: {
    name: string;
    message: string;
    stack: string;
    code?: string;
  };
}

// Logging configuration
export interface LoggingConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  logDirectory: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  rotationInterval: number; // hours
  enablePerformanceTracking: boolean;
  enableCorrelationIds: boolean;
  enableAuditLogs: boolean;
  remoteEndpoint?: string;
  bufferSize: number;
  flushInterval: number; // milliseconds
}

// Performance metrics
export interface PerformanceMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  averageLogSize: number;
  maxLogSize: number;
  totalLogSize: number;
  errors: number;
  warnings: number;
  correlationIds: number;
  services: string[];
  operations: string[];
  performanceEntries: number;
}

// Audit log entry
export interface AuditLogEntry extends LogEntry {
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'denied';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceTags: string[];
}

// Structured Logging Service Implementation
export class StructuredLoggingService extends EventEmitter {
  private config: LoggingConfig;
  private logBuffer: LogEntry[] = [];
  private correlationIds: Map<string, { startTime: Date; context: any }> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private flushTimer?: NodeJS.Timeout;
  private rotationTimer?: NodeJS.Timeout;

  constructor(config?: Partial<LoggingConfig>) {
    super();
    
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: true,
      enableRemote: false,
      logDirectory: path.join(process.cwd(), 'logs'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      rotationInterval: 24, // 24 hours
      enablePerformanceTracking: true,
      enableCorrelationIds: true,
      enableAuditLogs: true,
      bufferSize: 1000,
      flushInterval: 5000, // 5 seconds
      ...config
    };

    this.performanceMetrics = this.initializePerformanceMetrics();
    this.initializeService();
  }

  /**
   * Create a correlation ID for tracking requests across services
   */
  createCorrelationId(context?: any): string {
    const correlationId = crypto.randomUUID();
    
    if (this.config.enableCorrelationIds) {
      this.correlationIds.set(correlationId, {
        startTime: new Date(),
        context: context || {}
      });
    }
    
    return correlationId;
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, any>, correlationId?: string): void {
    this.log('debug', message, metadata, correlationId);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, any>, correlationId?: string): void {
    this.log('info', message, metadata, correlationId);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>, correlationId?: string): void {
    this.log('warn', message, metadata, correlationId);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>, correlationId?: string): void {
    this.log('error', message, { ...metadata, error: this.serializeError(error) }, correlationId);
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error, metadata?: Record<string, any>, correlationId?: string): void {
    this.log('fatal', message, { ...metadata, error: this.serializeError(error) }, correlationId);
  }

  /**
   * Log performance metrics
   */
  performance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    this.log('info', `Performance: ${operation}`, {
      ...metadata,
      duration,
      type: 'performance'
    }, correlationId);
  }

  /**
   * Log audit trail entry
   */
  audit(
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'denied',
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    if (!this.config.enableAuditLogs) return;

    const auditEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level: riskLevel === 'critical' ? 'fatal' : riskLevel === 'high' ? 'error' : 'warn',
      message: `Audit: ${action} on ${resource}`,
      correlationId: correlationId || this.createCorrelationId(),
      service: 'localmcp',
      operation: 'audit',
      metadata: {
        ...metadata,
        action,
        resource,
        result,
        riskLevel,
        type: 'audit'
      },
      tags: ['audit', `risk-${riskLevel}`, result],
      source: this.getSourceInfo(),
      context: this.getCurrentContext(),
      action,
      resource,
      result,
      riskLevel,
      complianceTags: this.getComplianceTags(action, resource, result)
    };

    this.processLogEntry(auditEntry);
  }

  /**
   * Log pipeline execution
   */
  pipeline(
    stage: string,
    operation: string,
    status: 'started' | 'completed' | 'failed' | 'cancelled',
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    const level = status === 'failed' ? 'error' : status === 'completed' ? 'info' : 'debug';
    const message = `Pipeline ${stage}: ${operation} ${status}`;
    
    this.log(level, message, {
      ...metadata,
      stage,
      operation,
      status,
      type: 'pipeline'
    }, correlationId);
  }

  /**
   * Log service operation
   */
  service(
    service: string,
    operation: string,
    status: 'started' | 'completed' | 'failed' | 'cancelled',
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    const level = status === 'failed' ? 'error' : status === 'completed' ? 'info' : 'debug';
    const message = `Service ${service}: ${operation} ${status}`;
    
    this.log(level, message, {
      ...metadata,
      service,
      operation,
      status,
      type: 'service'
    }, correlationId);
  }

  /**
   * Get logs by correlation ID
   */
  async getLogsByCorrelationId(correlationId: string): Promise<LogEntry[]> {
    // In a real implementation, this would query the log storage
    // For now, return logs from buffer that match the correlation ID
    return this.logBuffer.filter(log => log.correlationId === correlationId);
  }

  /**
   * Search logs with filters
   */
  async searchLogs(filters: {
    level?: LogLevel;
    service?: string;
    operation?: string;
    tags?: string[];
    startTime?: Date;
    endTime?: Date;
    correlationId?: string;
    limit?: number;
  }): Promise<LogEntry[]> {
    // In a real implementation, this would query the log storage
    // For now, filter logs from buffer
    let filteredLogs = this.logBuffer;

    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.service) {
      filteredLogs = filteredLogs.filter(log => log.service === filters.service);
    }

    if (filters.operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === filters.operation);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        filters.tags!.some(tag => log.tags.includes(tag))
      );
    }

    if (filters.startTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
    }

    if (filters.endTime) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
    }

    if (filters.correlationId) {
      filteredLogs = filteredLogs.filter(log => log.correlationId === filters.correlationId);
    }

    if (filters.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get correlation ID statistics
   */
  getCorrelationStats(): { active: number; total: number; averageDuration: number } {
    const active = this.correlationIds.size;
    const total = this.performanceMetrics.correlationIds;
    const averageDuration = this.calculateAverageCorrelationDuration();
    
    return { active, total, averageDuration };
  }

  /**
   * Update logging configuration
   */
  updateConfig(newConfig: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timers if needed
    if (newConfig.flushInterval) {
      this.restartFlushTimer();
    }
    
    if (newConfig.rotationInterval) {
      this.restartRotationTimer();
    }
    
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Flush log buffer
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Write to file if enabled
      if (this.config.enableFile) {
        await this.writeToFile(logsToFlush);
      }

      // Send to remote if enabled
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.sendToRemote(logsToFlush);
      }

      this.emit('logsFlushed', { count: logsToFlush.length });

    } catch (error) {
      this.emit('flushError', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Put logs back in buffer if flush failed
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  // Private helper methods

  private initializeService(): void {
    // Ensure log directory exists
    if (this.config.enableFile) {
      this.ensureLogDirectory();
    }

    // Start flush timer
    this.restartFlushTimer();

    // Start rotation timer
    this.restartRotationTimer();

    this.emit('serviceInitialized', { config: this.config });
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      totalLogs: 0,
      logsByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0
      },
      averageLogSize: 0,
      maxLogSize: 0,
      totalLogSize: 0,
      errors: 0,
      warnings: 0,
      correlationIds: 0,
      services: [],
      operations: [],
      performanceEntries: 0
    };
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    correlationId?: string
  ): void {
    // Check if we should log at this level
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      correlationId: correlationId || this.createCorrelationId(),
      service: this.getCurrentService(),
      operation: this.getCurrentOperation(),
      metadata: metadata || {},
      tags: this.extractTags(level, message, metadata),
      source: this.getSourceInfo(),
      context: this.getCurrentContext()
    };

    // Add performance metrics if enabled
    if (this.config.enablePerformanceTracking) {
      logEntry.performance = this.getCurrentPerformanceMetrics();
    }

    this.processLogEntry(logEntry);
  }

  private processLogEntry(logEntry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(logEntry);

    // Output to console if enabled
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // Update performance metrics
    this.updatePerformanceMetrics(logEntry);

    // Emit event for listeners
    this.emit('logEntry', logEntry);

    // Flush buffer if it's full
    if (this.logBuffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  private outputToConsole(logEntry: LogEntry): void {
    const timestamp = logEntry.timestamp.toISOString();
    const level = logEntry.level.toUpperCase().padEnd(5);
    const service = logEntry.service.padEnd(12);
    const correlationId = logEntry.correlationId.substring(0, 8);
    
    const message = `[${timestamp}] ${level} [${service}] [${correlationId}] ${logEntry.message}`;
    
    switch (logEntry.level) {
      case 'debug':
        console.debug(message);
        break;
      case 'info':
        console.info(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
      case 'fatal':
        console.error(message);
        if (logEntry.error) {
          console.error(logEntry.error.stack);
        }
        break;
    }
  }

  private async writeToFile(logs: LogEntry[]): Promise<void> {
    const logFile = path.join(this.config.logDirectory, `localmcp-${new Date().toISOString().split('T')[0]}.log`);
    const logLines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
    
    await fs.appendFile(logFile, logLines);
  }

  private async sendToRemote(logs: LogEntry[]): Promise<void> {
    // In a real implementation, this would send logs to a remote service
    // For now, just emit an event
    this.emit('remoteLogs', { logs, endpoint: this.config.remoteEndpoint });
  }

  private ensureLogDirectory(): void {
    try {
      fsSync.mkdirSync(this.config.logDirectory, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private restartFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private restartRotationTimer(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    
    this.rotationTimer = setInterval(() => {
      this.rotateLogFiles();
    }, this.config.rotationInterval * 60 * 60 * 1000);
  }

  private async rotateLogFiles(): Promise<void> {
    // Implement log file rotation logic
    this.emit('logRotation', { timestamp: new Date() });
  }

  private getSourceInfo(): { file: string; line: number; function: string } {
    // In a real implementation, this would use Error.stack to get source info
    return {
      file: 'unknown',
      line: 0,
      function: 'unknown'
    };
  }

  private getCurrentContext(): any {
    // In a real implementation, this would get current execution context
    return {
      userId: process.env.USER_ID,
      sessionId: process.env.SESSION_ID,
      requestId: process.env.REQUEST_ID,
      tool: process.env.CURRENT_TOOL,
      stage: process.env.CURRENT_STAGE,
      pipeline: process.env.CURRENT_PIPELINE
    };
  }

  private getCurrentService(): string {
    return process.env.SERVICE_NAME || 'localmcp';
  }

  private getCurrentOperation(): string {
    return process.env.CURRENT_OPERATION || 'unknown';
  }

  private getCurrentPerformanceMetrics(): any {
    const usage = process.memoryUsage();
    return {
      memoryUsage: usage.heapUsed,
      cpuUsage: process.cpuUsage().user,
      diskUsage: 0, // Would need to implement
      networkUsage: 0 // Would need to implement
    };
  }

  private extractTags(level: LogLevel, message: string, metadata?: Record<string, any>): string[] {
    const tags: string[] = [level];
    
    if (metadata?.type) {
      tags.push(metadata.type);
    }
    
    if (metadata?.service) {
      tags.push(`service:${metadata.service}`);
    }
    
    if (metadata?.operation) {
      tags.push(`operation:${metadata.operation}`);
    }
    
    if (metadata?.stage) {
      tags.push(`stage:${metadata.stage}`);
    }
    
    return tags;
  }

  private getComplianceTags(action: string, resource: string, result: string): string[] {
    const tags: string[] = [];
    
    // Add compliance tags based on action and resource
    if (action.includes('create') || action.includes('delete')) {
      tags.push('data-modification');
    }
    
    if (action.includes('read') || action.includes('query')) {
      tags.push('data-access');
    }
    
    if (resource.includes('user') || resource.includes('auth')) {
      tags.push('user-data');
    }
    
    if (resource.includes('config') || resource.includes('secret')) {
      tags.push('configuration');
    }
    
    return tags;
  }

  private serializeError(error?: Error): any {
    if (!error) return undefined;
    
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    };
  }

  private updatePerformanceMetrics(logEntry: LogEntry): void {
    this.performanceMetrics.totalLogs++;
    this.performanceMetrics.logsByLevel[logEntry.level]++;
    
    const logSize = JSON.stringify(logEntry).length;
    this.performanceMetrics.totalLogSize += logSize;
    this.performanceMetrics.averageLogSize = this.performanceMetrics.totalLogSize / this.performanceMetrics.totalLogs;
    this.performanceMetrics.maxLogSize = Math.max(this.performanceMetrics.maxLogSize, logSize);
    
    if (logEntry.level === 'error' || logEntry.level === 'fatal') {
      this.performanceMetrics.errors++;
    }
    
    if (logEntry.level === 'warn') {
      this.performanceMetrics.warnings++;
    }
    
    if (logEntry.correlationId && !this.correlationIds.has(logEntry.correlationId)) {
      this.performanceMetrics.correlationIds++;
    }
    
    if (!this.performanceMetrics.services.includes(logEntry.service)) {
      this.performanceMetrics.services.push(logEntry.service);
    }
    
    if (!this.performanceMetrics.operations.includes(logEntry.operation)) {
      this.performanceMetrics.operations.push(logEntry.operation);
    }
    
    if (logEntry.metadata?.type === 'performance') {
      this.performanceMetrics.performanceEntries++;
    }
  }

  private calculateAverageCorrelationDuration(): number {
    const now = Date.now();
    let totalDuration = 0;
    let count = 0;
    
    for (const [correlationId, data] of Array.from(this.correlationIds.entries())) {
      totalDuration += now - data.startTime.getTime();
      count++;
    }
    
    return count > 0 ? totalDuration / count : 0;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    
    // Flush remaining logs
    this.flush();
    
    this.logBuffer = [];
    this.correlationIds.clear();
    
    this.emit('serviceDestroyed');
  }
}

export default StructuredLoggingService;
