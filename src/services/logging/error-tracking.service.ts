/**
 * Error Tracking Service - Advanced error tracking and debugging information
 * 
 * This service provides comprehensive error tracking, debugging information,
 * and error analysis capabilities for LocalMCP.
 * 
 * Benefits for vibe coders:
 * - Detailed error tracking with stack traces and context
 * - Error pattern analysis and trend identification
 * - Debugging information with correlation IDs and execution context
 * - Error categorization and severity assessment
 * - Integration with structured logging for comprehensive error handling
 */

import { EventEmitter } from 'events';
import { StructuredLoggingService } from './structured-logging.service';
import * as crypto from 'crypto';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical' | 'fatal';

// Error categories
export type ErrorCategory = 
  | 'validation' 
  | 'authentication' 
  | 'authorization' 
  | 'network' 
  | 'database' 
  | 'file-system' 
  | 'configuration' 
  | 'timeout' 
  | 'rate-limit' 
  | 'dependency' 
  | 'business-logic' 
  | 'unknown';

// Error context
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  tool?: string;
  stage?: string;
  pipeline?: string;
  service?: string;
  operation?: string;
  input?: any;
  environment?: string;
  version?: string;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  additionalContext?: Record<string, any>;
}

// Error entry
export interface ErrorEntry {
  id: string;
  error: {
    name: string;
    message: string;
    stack: string;
    code?: string;
    cause?: Error;
  };
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  metadata: {
    tags: string[];
    fingerprint: string;
    count: number;
    firstOccurrence: Date;
    lastOccurrence: Date;
    relatedErrors: string[];
    affectedUsers: string[];
    affectedServices: string[];
    debuggingInfo: {
      stackTrace: string[];
      variableStates: Record<string, any>;
      executionPath: string[];
      memorySnapshot?: any;
      performanceMetrics?: any;
    };
  };
  resolution?: {
    status: 'open' | 'investigating' | 'resolved' | 'ignored';
    assignedTo?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    resolution?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
  };
}

// Error pattern analysis
export interface ErrorPattern {
  id: string;
  fingerprint: string;
  pattern: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  severity: ErrorSeverity;
  category: ErrorCategory;
  firstSeen: Date;
  lastSeen: Date;
  affectedServices: string[];
  affectedUsers: string[];
  commonContext: Record<string, any>;
  suggestions: string[];
}

// Error tracking configuration
export interface ErrorTrackingConfig {
  enableErrorTracking: boolean;
  enablePatternAnalysis: boolean;
  enableDebuggingInfo: boolean;
  enableErrorGrouping: boolean;
  maxErrorEntries: number;
  errorRetentionDays: number;
  severityThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    fatal: number;
  };
  enableAutomaticResolution: boolean;
  enableErrorNotifications: boolean;
  notificationThresholds: {
    frequency: number; // errors per minute
    severity: ErrorSeverity;
    services: string[];
  };
}

// Error analytics
export interface ErrorAnalytics {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsByService: Record<string, number>;
  errorTrends: Array<{
    date: Date;
    count: number;
    severity: ErrorSeverity;
  }>;
  topErrorPatterns: ErrorPattern[];
  resolutionMetrics: {
    averageResolutionTime: number;
    resolutionRate: number;
    escalationRate: number;
  };
  affectedUsers: number;
  affectedServices: number;
}

// Error Tracking Service Implementation
export class ErrorTrackingService extends EventEmitter {
  private config: ErrorTrackingConfig;
  private logger: StructuredLoggingService;
  private errorEntries: Map<string, ErrorEntry> = new Map();
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private errorFingerprints: Map<string, string[]> = new Map(); // fingerprint -> error IDs

  constructor(
    logger: StructuredLoggingService,
    config?: Partial<ErrorTrackingConfig>
  ) {
    super();
    
    this.logger = logger;
    this.config = {
      enableErrorTracking: true,
      enablePatternAnalysis: true,
      enableDebuggingInfo: true,
      enableErrorGrouping: true,
      maxErrorEntries: 10000,
      errorRetentionDays: 30,
      severityThresholds: {
        low: 1,
        medium: 5,
        high: 10,
        critical: 20,
        fatal: 1
      },
      enableAutomaticResolution: false,
      enableErrorNotifications: true,
      notificationThresholds: {
        frequency: 10,
        severity: 'high',
        services: ['localmcp']
      },
      ...config
    };

    this.initializeService();
  }

  /**
   * Track an error with full context and debugging information
   */
  trackError(
    error: Error,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, any> = {}
  ): string {
    const errorId = crypto.randomUUID();
    const fingerprint = this.generateErrorFingerprint(error);
    
    // Create error context
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      ...context
    };

    // Determine severity and category
    const severity = this.determineErrorSeverity(error, context);
    const category = this.categorizeError(error, context);

    // Check if this is a duplicate error
    const existingErrorIds = this.errorFingerprints.get(fingerprint) || [];
    const isDuplicate = existingErrorIds.length > 0;

    let errorEntry: ErrorEntry;

    if (isDuplicate) {
      // Update existing error entry
      const existingErrorId = existingErrorIds[0];
      errorEntry = this.errorEntries.get(existingErrorId)!;
      
      errorEntry.metadata.count++;
      errorEntry.metadata.lastOccurrence = new Date();
      errorEntry.metadata.affectedUsers = this.addToSet(
        errorEntry.metadata.affectedUsers,
        context.userId || 'anonymous'
      );
      errorEntry.metadata.affectedServices = this.addToSet(
        errorEntry.metadata.affectedServices,
        context.service || 'unknown'
      );
    } else {
      // Create new error entry
      errorEntry = {
        id: errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack || '',
          code: (error as any).code,
          cause: (error as any).cause
        },
        severity,
        category,
        context: fullContext,
        metadata: {
          tags: this.generateErrorTags(error, context, severity),
          fingerprint,
          count: 1,
          firstOccurrence: new Date(),
          lastOccurrence: new Date(),
          relatedErrors: [],
          affectedUsers: context.userId ? [context.userId] : [],
          affectedServices: context.service ? [context.service] : [],
          debuggingInfo: this.collectDebuggingInfo(error, context, metadata)
        }
      };

      this.errorEntries.set(errorId, errorEntry);
      this.errorFingerprints.set(fingerprint, [errorId]);
    }

    // Update fingerprint mapping
    if (!isDuplicate) {
      this.errorFingerprints.set(fingerprint, [...existingErrorIds, errorId]);
    }

    // Analyze patterns if enabled
    if (this.config.enablePatternAnalysis) {
      this.analyzeErrorPatterns(errorEntry);
    }

    // Log the error
    this.logger.error(
      `Error tracked: ${error.message}`,
      error,
      {
        errorId,
        fingerprint,
        severity,
        category,
        context: fullContext,
        metadata: errorEntry.metadata,
        ...metadata
      },
      context.correlationId
    );

    // Emit events
    this.emit('errorTracked', { errorEntry, isDuplicate });

    // Check for notifications
    if (this.config.enableErrorNotifications) {
      this.checkNotificationThresholds(errorEntry);
    }

    // Cleanup old errors
    this.cleanupOldErrors();

    return errorEntry.id;
  }

  /**
   * Get error by ID
   */
  getError(errorId: string): ErrorEntry | null {
    return this.errorEntries.get(errorId) || null;
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorEntry[] {
    return Array.from(this.errorEntries.values())
      .filter(error => error.severity === severity);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorEntry[] {
    return Array.from(this.errorEntries.values())
      .filter(error => error.category === category);
  }

  /**
   * Get errors by service
   */
  getErrorsByService(service: string): ErrorEntry[] {
    return Array.from(this.errorEntries.values())
      .filter(error => error.context.service === service);
  }

  /**
   * Search errors with filters
   */
  searchErrors(filters: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    service?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
    limit?: number;
  }): ErrorEntry[] {
    let filteredErrors = Array.from(this.errorEntries.values());

    if (filters.severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === filters.severity);
    }

    if (filters.category) {
      filteredErrors = filteredErrors.filter(error => error.category === filters.category);
    }

    if (filters.service) {
      filteredErrors = filteredErrors.filter(error => error.context.service === filters.service);
    }

    if (filters.userId) {
      filteredErrors = filteredErrors.filter(error => 
        error.metadata.affectedUsers.includes(filters.userId!)
      );
    }

    if (filters.startDate) {
      filteredErrors = filteredErrors.filter(error => 
        error.context.timestamp >= filters.startDate!
      );
    }

    if (filters.endDate) {
      filteredErrors = filteredErrors.filter(error => 
        error.context.timestamp <= filters.endDate!
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredErrors = filteredErrors.filter(error => 
        filters.tags!.some(tag => error.metadata.tags.includes(tag))
      );
    }

    if (filters.limit) {
      filteredErrors = filteredErrors.slice(-filters.limit);
    }

    return filteredErrors;
  }

  /**
   * Get error patterns
   */
  getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  /**
   * Get error analytics
   */
  getErrorAnalytics(): ErrorAnalytics {
    const errors = Array.from(this.errorEntries.values());
    const patterns = Array.from(this.errorPatterns.values());

    const errorsBySeverity = this.groupBy(errors, 'severity');
    const errorsByCategory = this.groupBy(errors, 'category');
    const errorsByService = this.groupBy(errors, 'context.service' as keyof ErrorEntry);

    // Calculate trends (last 7 days)
    const trends = this.calculateErrorTrends(errors);

    // Calculate resolution metrics
    const resolutionMetrics = this.calculateResolutionMetrics(errors);

    return {
      totalErrors: errors.length,
      errorsBySeverity: this.countBy(errorsBySeverity),
      errorsByCategory: this.countBy(errorsByCategory),
      errorsByService: this.countBy(errorsByService),
      errorTrends: trends,
      topErrorPatterns: patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10),
      resolutionMetrics,
      affectedUsers: new Set(errors.flatMap(e => e.metadata.affectedUsers)).size,
      affectedServices: new Set(errors.flatMap(e => e.metadata.affectedServices)).size
    };
  }

  /**
   * Resolve an error
   */
  resolveError(
    errorId: string,
    resolution: string,
    resolvedBy: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): boolean {
    const errorEntry = this.errorEntries.get(errorId);
    if (!errorEntry) return false;

    errorEntry.resolution = {
      status: 'resolved',
      priority,
      resolution,
      resolvedAt: new Date(),
      resolvedBy
    };

    this.logger.info(
      `Error resolved: ${errorEntry.error.message}`,
      {
        errorId,
        resolution,
        resolvedBy,
        priority
      },
      errorEntry.context.correlationId
    );

    this.emit('errorResolved', { errorEntry });

    return true;
  }

  /**
   * Get debugging information for an error
   */
  getDebuggingInfo(errorId: string): any {
    const errorEntry = this.errorEntries.get(errorId);
    if (!errorEntry) return null;

    return {
      error: errorEntry.error,
      context: errorEntry.context,
      metadata: errorEntry.metadata,
      debuggingInfo: errorEntry.metadata.debuggingInfo,
      relatedErrors: errorEntry.metadata.relatedErrors.map(id => 
        this.errorEntries.get(id)
      ).filter(Boolean)
    };
  }

  /**
   * Update error tracking configuration
   */
  updateConfig(newConfig: Partial<ErrorTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorTrackingConfig {
    return { ...this.config };
  }

  // Private helper methods

  private initializeService(): void {
    this.emit('serviceInitialized', { config: this.config });
  }

  private generateErrorFingerprint(error: Error): string {
    // Create a fingerprint based on error name, message, and stack trace
    const stackLines = error.stack?.split('\n') || [];
    const relevantStack = stackLines.slice(0, 5).join('\n'); // First 5 lines
    
    const fingerprintData = `${error.name}:${error.message}:${relevantStack}`;
    return crypto.createHash('sha256').update(fingerprintData).digest('hex').substring(0, 16);
  }

  private determineErrorSeverity(error: Error, context: Partial<ErrorContext>): ErrorSeverity {
    // Determine severity based on error type, context, and frequency
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();

    // Critical errors
    if (errorName.includes('fatal') || errorName.includes('critical')) {
      return 'critical';
    }

    // High severity errors
    if (errorName.includes('timeout') || errorName.includes('memory') || 
        errorName.includes('connection') || errorName.includes('permission')) {
      return 'high';
    }

    // Medium severity errors
    if (errorName.includes('validation') || errorName.includes('format') ||
        errorName.includes('not found') || errorName.includes('unauthorized')) {
      return 'medium';
    }

    // Default to low severity
    return 'low';
  }

  private categorizeError(error: Error, context: Partial<ErrorContext>): ErrorCategory {
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return 'validation';
    }

    if (errorMessage.includes('auth') || errorMessage.includes('login') || 
        errorMessage.includes('token') || errorMessage.includes('credential')) {
      return 'authentication';
    }

    if (errorMessage.includes('permission') || errorMessage.includes('forbidden') ||
        errorMessage.includes('unauthorized') || errorMessage.includes('access')) {
      return 'authorization';
    }

    if (errorMessage.includes('network') || errorMessage.includes('connection') ||
        errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
      return 'network';
    }

    if (errorMessage.includes('database') || errorMessage.includes('sql') ||
        errorMessage.includes('query') || errorMessage.includes('table')) {
      return 'database';
    }

    if (errorMessage.includes('file') || errorMessage.includes('path') ||
        errorMessage.includes('directory') || errorMessage.includes('permission')) {
      return 'file-system';
    }

    if (errorMessage.includes('config') || errorMessage.includes('setting') ||
        errorMessage.includes('environment') || errorMessage.includes('variable')) {
      return 'configuration';
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('throttle') ||
        errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return 'rate-limit';
    }

    if (errorMessage.includes('dependency') || errorMessage.includes('service') ||
        errorMessage.includes('external') || errorMessage.includes('api')) {
      return 'dependency';
    }

    return 'unknown';
  }

  private generateErrorTags(error: Error, context: Partial<ErrorContext>, severity: ErrorSeverity): string[] {
    const tags = [severity, error.name.toLowerCase()];

    if (context.service) {
      tags.push(`service:${context.service}`);
    }

    if (context.tool) {
      tags.push(`tool:${context.tool}`);
    }

    if (context.stage) {
      tags.push(`stage:${context.stage}`);
    }

    if (context.environment) {
      tags.push(`env:${context.environment}`);
    }

    return tags;
  }

  private collectDebuggingInfo(
    error: Error,
    context: Partial<ErrorContext>,
    metadata: Record<string, any>
  ): ErrorEntry['metadata']['debuggingInfo'] {
    const debuggingInfo: ErrorEntry['metadata']['debuggingInfo'] = {
      stackTrace: error.stack?.split('\n') || [],
      variableStates: {},
      executionPath: [],
      performanceMetrics: this.getCurrentPerformanceMetrics()
    };

    // Add variable states from metadata
    debuggingInfo.variableStates = {
      ...metadata,
      context,
      timestamp: new Date(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    // Add execution path from context
    if (context.pipeline) {
      debuggingInfo.executionPath.push(`pipeline:${context.pipeline}`);
    }
    if (context.stage) {
      debuggingInfo.executionPath.push(`stage:${context.stage}`);
    }
    if (context.service) {
      debuggingInfo.executionPath.push(`service:${context.service}`);
    }
    if (context.operation) {
      debuggingInfo.executionPath.push(`operation:${context.operation}`);
    }

    return debuggingInfo;
  }

  private getCurrentPerformanceMetrics(): any {
    const usage = process.memoryUsage();
    return {
      memoryUsage: usage.heapUsed,
      cpuUsage: process.cpuUsage().user,
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  private analyzeErrorPatterns(errorEntry: ErrorEntry): void {
    const fingerprint = errorEntry.metadata.fingerprint;
    const pattern = this.errorPatterns.get(fingerprint);

    if (pattern) {
      // Update existing pattern
      pattern.frequency = errorEntry.metadata.count;
      pattern.lastSeen = new Date();
      pattern.affectedServices = this.addToSet(
        pattern.affectedServices,
        errorEntry.context.service || 'unknown'
      );
      pattern.affectedUsers = this.addToSet(
        pattern.affectedUsers,
        ...errorEntry.metadata.affectedUsers
      );
    } else {
      // Create new pattern
      const newPattern: ErrorPattern = {
        id: fingerprint,
        fingerprint,
        pattern: `${errorEntry.error.name}: ${errorEntry.error.message}`,
        frequency: 1,
        trend: 'stable',
        severity: errorEntry.severity,
        category: errorEntry.category,
        firstSeen: new Date(),
        lastSeen: new Date(),
        affectedServices: errorEntry.context.service ? [errorEntry.context.service] : [],
        affectedUsers: errorEntry.metadata.affectedUsers,
        commonContext: {
          service: errorEntry.context.service,
          tool: errorEntry.context.tool,
          stage: errorEntry.context.stage
        },
        suggestions: this.generateErrorSuggestions(errorEntry)
      };

      this.errorPatterns.set(fingerprint, newPattern);
    }

    // Update trend analysis
    this.updatePatternTrends();
  }

  private generateErrorSuggestions(errorEntry: ErrorEntry): string[] {
    const suggestions: string[] = [];

    switch (errorEntry.category) {
      case 'validation':
        suggestions.push('Review input validation logic');
        suggestions.push('Add proper error handling for invalid inputs');
        break;
      case 'authentication':
        suggestions.push('Check authentication token validity');
        suggestions.push('Verify user credentials');
        break;
      case 'network':
        suggestions.push('Check network connectivity');
        suggestions.push('Verify external service availability');
        break;
      case 'database':
        suggestions.push('Check database connection');
        suggestions.push('Review SQL queries for syntax errors');
        break;
      case 'file-system':
        suggestions.push('Check file permissions');
        suggestions.push('Verify file path exists');
        break;
      case 'configuration':
        suggestions.push('Review configuration settings');
        suggestions.push('Check environment variables');
        break;
      default:
        suggestions.push('Review error logs for patterns');
        suggestions.push('Consider adding more specific error handling');
    }

    return suggestions;
  }

  private updatePatternTrends(): void {
    for (const pattern of Array.from(this.errorPatterns.values())) {
      // Simple trend analysis based on recent frequency
      // In a real implementation, this would analyze historical data
      pattern.trend = 'stable';
    }
  }

  private checkNotificationThresholds(errorEntry: ErrorEntry): void {
    const service = errorEntry.context.service || 'unknown';
    const severity = errorEntry.severity;
    const frequency = errorEntry.metadata.count;

    if (severity === this.config.notificationThresholds.severity &&
        frequency >= this.config.notificationThresholds.frequency &&
        this.config.notificationThresholds.services.includes(service)) {
      
      this.emit('errorNotification', {
        errorEntry,
        reason: 'threshold_exceeded',
        threshold: this.config.notificationThresholds
      });
    }
  }

  private cleanupOldErrors(): void {
    const cutoffDate = new Date(Date.now() - this.config.errorRetentionDays * 24 * 60 * 60 * 1000);
    
    for (const [errorId, errorEntry] of Array.from(this.errorEntries.entries())) {
      if (errorEntry.context.timestamp < cutoffDate) {
        this.errorEntries.delete(errorId);
        
        // Update fingerprint mapping
        const fingerprint = errorEntry.metadata.fingerprint;
        const errorIds = this.errorFingerprints.get(fingerprint) || [];
        const updatedIds = errorIds.filter(id => id !== errorId);
        
        if (updatedIds.length === 0) {
          this.errorFingerprints.delete(fingerprint);
          this.errorPatterns.delete(fingerprint);
        } else {
          this.errorFingerprints.set(fingerprint, updatedIds);
        }
      }
    }

    // Limit total errors
    if (this.errorEntries.size > this.config.maxErrorEntries) {
      const sortedErrors = Array.from(this.errorEntries.entries())
        .sort(([, a], [, b]) => a.context.timestamp.getTime() - b.context.timestamp.getTime());
      
      const toRemove = sortedErrors.slice(0, this.errorEntries.size - this.config.maxErrorEntries);
      
      for (const [errorId] of toRemove) {
        this.errorEntries.delete(errorId);
      }
    }
  }

  private addToSet<T>(array: T[], ...items: T[]): T[] {
    const set = new Set([...array, ...items]);
    return Array.from(set);
  }

  private groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private countBy<T>(groups: Record<string, T[]>): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [key, items] of Object.entries(groups)) {
      counts[key] = items.length;
    }
    return counts;
  }

  private calculateErrorTrends(errors: ErrorEntry[]): Array<{ date: Date; count: number; severity: ErrorSeverity }> {
    // Simple trend calculation for the last 7 days
    const trends: Array<{ date: Date; count: number; severity: ErrorSeverity }> = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayErrors = errors.filter(error => 
        error.context.timestamp.toDateString() === date.toDateString()
      );
      
      trends.push({
        date,
        count: dayErrors.length,
        severity: this.getMostCommonSeverity(dayErrors)
      });
    }
    
    return trends;
  }

  private getMostCommonSeverity(errors: ErrorEntry[]): ErrorSeverity {
    if (errors.length === 0) return 'low';
    
    const severityCounts = this.countBy(this.groupBy(errors, 'severity'));
    const mostCommon = Object.entries(severityCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    return mostCommon[0] as ErrorSeverity;
  }

  private calculateResolutionMetrics(errors: ErrorEntry[]): ErrorAnalytics['resolutionMetrics'] {
    const resolvedErrors = errors.filter(error => 
      error.resolution?.status === 'resolved'
    );
    
    if (resolvedErrors.length === 0) {
      return {
        averageResolutionTime: 0,
        resolutionRate: 0,
        escalationRate: 0
      };
    }
    
    const totalResolutionTime = resolvedErrors.reduce((sum, error) => {
      if (error.resolution?.resolvedAt) {
        const resolutionTime = error.resolution.resolvedAt.getTime() - 
                              error.context.timestamp.getTime();
        return sum + resolutionTime;
      }
      return sum;
    }, 0);
    
    const averageResolutionTime = totalResolutionTime / resolvedErrors.length;
    const resolutionRate = resolvedErrors.length / errors.length;
    
    // Simple escalation rate calculation
    const escalatedErrors = errors.filter(error => 
      error.resolution?.priority === 'urgent' || error.resolution?.priority === 'high'
    );
    const escalationRate = escalatedErrors.length / errors.length;
    
    return {
      averageResolutionTime,
      resolutionRate,
      escalationRate
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.errorEntries.clear();
    this.errorPatterns.clear();
    this.errorFingerprints.clear();
    this.emit('serviceDestroyed');
  }
}

export default ErrorTrackingService;
