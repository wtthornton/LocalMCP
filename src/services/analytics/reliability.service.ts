// src/services/analytics/reliability.service.ts
import { Logger } from '../logger/logger.js';

export interface ErrorRecord {
  id: string;
  timestamp: Date;
  type: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

export interface ReliabilityMetrics {
  uptime: {
    totalUptime: number; // Seconds
    uptimePercentage: number;
    lastRestart: Date;
    currentUptime: number; // Seconds since last restart
  };
  errors: {
    totalErrors: number;
    errorRate: number; // Errors per hour
    errorsByType: Record<string, number>;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    averageResolutionTime: number; // Minutes
    resolutionRate: number; // Percentage of resolved errors
  };
  performance: {
    meanTimeBetweenFailures: number; // Hours
    meanTimeToRecovery: number; // Minutes
    availability: number; // Percentage
    reliabilityScore: number; // 0-100
  };
  trends: {
    errorTrend: 'improving' | 'stable' | 'degrading';
    uptimeTrend: 'improving' | 'stable' | 'degrading';
    resolutionTrend: 'improving' | 'stable' | 'degrading';
  };
  timestamp: Date;
}

export interface ReliabilityHealthStatus {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  alerts: string[];
  lastChecked: Date;
}

export class ReliabilityService {
  private logger: Logger;
  private startTime: Date;
  private errors: ErrorRecord[] = [];
  private restarts: Date[] = [];
  private lastError: Date | null = null;
  private lastResolution: Date | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.startTime = new Date();
    this.logger.debug('ReliabilityService initialized');
  }

  /**
   * Record an error with full context
   */
  recordError(
    type: string,
    message: string,
    severity: ErrorRecord['severity'] = 'medium',
    context?: Record<string, any>,
    stack?: string
  ): string {
    const errorId = this.generateErrorId();
    const category = this.categorizeError(type, message);
    
    const error: ErrorRecord = {
      id: errorId,
      timestamp: new Date(),
      type,
      category,
      severity,
      message,
      stack,
      context,
      resolved: false
    };

    this.errors.push(error);
    this.lastError = new Date();

    this.logger.warn('Error recorded', {
      errorId,
      type,
      category,
      severity,
      message: message.substring(0, 100)
    });

    return errorId;
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string, resolution?: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) {
      this.logger.warn('Attempted to resolve non-existent error', { errorId });
      return false;
    }

    error.resolved = true;
    error.resolvedAt = new Date();
    error.resolution = resolution;
    this.lastResolution = new Date();

    this.logger.info('Error resolved', {
      errorId,
      type: error.type,
      resolutionTime: this.calculateResolutionTime(error)
    });

    return true;
  }

  /**
   * Record a system restart
   */
  recordRestart(): void {
    this.restarts.push(new Date());
    this.logger.info('System restart recorded');
  }

  /**
   * Get comprehensive reliability metrics
   */
  getReliabilityMetrics(): ReliabilityMetrics {
    const now = new Date();
    const totalUptime = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);
    const currentUptime = this.calculateCurrentUptime();
    const uptimePercentage = this.calculateUptimePercentage();

    const errorMetrics = this.calculateErrorMetrics();
    const performanceMetrics = this.calculatePerformanceMetrics();
    const trends = this.calculateTrends();

    return {
      uptime: {
        totalUptime,
        uptimePercentage,
        lastRestart: this.restarts[this.restarts.length - 1] || this.startTime,
        currentUptime
      },
      errors: errorMetrics,
      performance: performanceMetrics,
      trends,
      timestamp: now
    };
  }

  /**
   * Get reliability health status
   */
  getReliabilityHealth(): ReliabilityHealthStatus {
    const metrics = this.getReliabilityMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];
    let score = 100;

    // Check uptime
    if (metrics.uptime.uptimePercentage < 95) {
      issues.push('Low uptime percentage');
      recommendations.push('Investigate downtime causes and improve monitoring');
      score -= 20;
    } else if (metrics.uptime.uptimePercentage < 99) {
      issues.push('Moderate uptime issues');
      recommendations.push('Monitor uptime trends and address recurring issues');
      score -= 10;
    }

    // Check error rate
    if (metrics.errors.errorRate > 10) {
      issues.push('High error rate');
      recommendations.push('Implement better error handling and monitoring');
      score -= 25;
    } else if (metrics.errors.errorRate > 5) {
      issues.push('Elevated error rate');
      recommendations.push('Review error patterns and improve error handling');
      score -= 15;
    }

    // Check resolution time
    if (metrics.errors.averageResolutionTime > 60) {
      issues.push('Slow error resolution');
      recommendations.push('Improve error response and resolution processes');
      score -= 15;
    } else if (metrics.errors.averageResolutionTime > 30) {
      issues.push('Moderate resolution time');
      recommendations.push('Optimize error resolution workflows');
      score -= 8;
    }

    // Check MTBF
    if (metrics.performance.meanTimeBetweenFailures < 24) {
      issues.push('Frequent failures');
      recommendations.push('Improve system stability and error prevention');
      score -= 20;
    } else if (metrics.performance.meanTimeBetweenFailures < 168) { // 1 week
      issues.push('Moderate failure frequency');
      recommendations.push('Monitor failure patterns and improve reliability');
      score -= 10;
    }

    // Check resolution rate
    if (metrics.errors.resolutionRate < 80) {
      issues.push('Low error resolution rate');
      recommendations.push('Improve error tracking and resolution processes');
      score -= 15;
    } else if (metrics.errors.resolutionRate < 90) {
      issues.push('Moderate resolution rate');
      recommendations.push('Enhance error resolution tracking');
      score -= 8;
    }

    // Check critical errors
    const criticalErrors = this.errors.filter(e => e.severity === 'critical' && !e.resolved);
    if (criticalErrors.length > 0) {
      alerts.push(`${criticalErrors.length} critical errors unresolved`);
      score -= 30;
    }

    // Check recent error trends
    if (metrics.trends.errorTrend === 'degrading') {
      alerts.push('Error rate is increasing');
      score -= 10;
    }

    const overall = score >= 90 ? 'excellent' : 
                   score >= 80 ? 'good' : 
                   score >= 70 ? 'fair' : 
                   score >= 50 ? 'poor' : 'critical';

    return {
      overall,
      score: Math.max(0, score),
      issues,
      recommendations,
      alerts,
      lastChecked: new Date()
    };
  }

  /**
   * Get error statistics for a specific time period
   */
  getErrorStatistics(startDate?: Date, endDate?: Date): {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    unresolved: number;
  } {
    const filteredErrors = this.filterErrorsByDateRange(startDate, endDate);
    
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    let resolved = 0;
    let unresolved = 0;

    filteredErrors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      if (error.resolved) {
        resolved++;
      } else {
        unresolved++;
      }
    });

    return {
      total: filteredErrors.length,
      byType,
      byCategory,
      bySeverity,
      resolved,
      unresolved
    };
  }

  /**
   * Get recent errors (last N hours)
   */
  getRecentErrors(hours: number = 24): ErrorRecord[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.errors.filter(error => error.timestamp >= cutoff);
  }

  /**
   * Reset all reliability data (useful for testing)
   */
  resetReliabilityData(): void {
    this.errors = [];
    this.restarts = [];
    this.lastError = null;
    this.lastResolution = null;
    this.startTime = new Date();
    this.logger.debug('Reliability data reset');
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeError(type: string, message: string): string {
    const lowerType = type.toLowerCase();
    const lowerMessage = message.toLowerCase();

    if (lowerType.includes('timeout') || lowerMessage.includes('timeout')) {
      return 'timeout';
    }
    if (lowerType.includes('network') || lowerMessage.includes('network')) {
      return 'network';
    }
    if (lowerType.includes('validation') || lowerMessage.includes('validation')) {
      return 'validation';
    }
    if (lowerType.includes('database') || lowerMessage.includes('database')) {
      return 'database';
    }
    if (lowerType.includes('auth') || lowerMessage.includes('auth')) {
      return 'authentication';
    }
    if (lowerType.includes('permission') || lowerMessage.includes('permission')) {
      return 'authorization';
    }
    if (lowerType.includes('memory') || lowerMessage.includes('memory')) {
      return 'resource';
    }
    if (lowerType.includes('disk') || lowerMessage.includes('disk')) {
      return 'resource';
    }
    if (lowerType.includes('cpu') || lowerMessage.includes('cpu')) {
      return 'resource';
    }

    return 'unknown';
  }

  private calculateCurrentUptime(): number {
    const lastRestart = this.restarts[this.restarts.length - 1] || this.startTime;
    return Math.floor((Date.now() - lastRestart.getTime()) / 1000);
  }

  private calculateUptimePercentage(): number {
    if (this.restarts.length === 0) {
      return 100; // No restarts, 100% uptime
    }

    const totalTime = Date.now() - this.startTime.getTime();
    const downtime = this.calculateTotalDowntime();
    const uptime = totalTime - downtime;
    
    return Math.max(0, (uptime / totalTime) * 100);
  }

  private calculateTotalDowntime(): number {
    // Simplified calculation - in reality, you'd track actual downtime periods
    return this.restarts.length * 60000; // Assume 1 minute downtime per restart
  }

  private calculateErrorMetrics() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = this.errors.filter(e => e.timestamp >= oneHourAgo);
    
    const errorsByType: Record<string, number> = {};
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    this.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      if (error.resolved && error.resolvedAt) {
        const resolutionTime = this.calculateResolutionTime(error);
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    return {
      totalErrors: this.errors.length,
      errorRate: recentErrors.length,
      errorsByType,
      errorsByCategory,
      errorsBySeverity,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
      resolutionRate: this.errors.length > 0 ? (resolvedCount / this.errors.length) * 100 : 100
    };
  }

  private calculatePerformanceMetrics() {
    const mtbf = this.calculateMTBF();
    const mttr = this.calculateMTTR();
    const availability = this.calculateAvailability();
    
    // Calculate reliability score based on multiple factors
    let reliabilityScore = 100;
    
    if (mtbf < 24) reliabilityScore -= 30;
    else if (mtbf < 168) reliabilityScore -= 15;
    
    if (mttr > 60) reliabilityScore -= 25;
    else if (mttr > 30) reliabilityScore -= 10;
    
    if (availability < 95) reliabilityScore -= 20;
    else if (availability < 99) reliabilityScore -= 10;

    return {
      meanTimeBetweenFailures: mtbf,
      meanTimeToRecovery: mttr,
      availability,
      reliabilityScore: Math.max(0, reliabilityScore)
    };
  }

  private calculateMTBF(): number {
    if (this.restarts.length < 2) {
      return 168; // Default to 1 week if not enough data
    }
    
    const totalUptime = this.restarts.reduce((total, restart, index) => {
      const previousRestart = index === 0 ? this.startTime : this.restarts[index - 1];
      return total + (restart.getTime() - previousRestart.getTime());
    }, 0);
    
    const averageUptime = totalUptime / this.restarts.length;
    return averageUptime / (1000 * 60 * 60); // Convert to hours
  }

  private calculateMTTR(): number {
    const resolvedErrors = this.errors.filter(e => e.resolved && e.resolvedAt);
    if (resolvedErrors.length === 0) {
      return 0;
    }
    
    const totalResolutionTime = resolvedErrors.reduce((total, error) => {
      return total + this.calculateResolutionTime(error);
    }, 0);
    
    return totalResolutionTime / resolvedErrors.length; // Average in minutes
  }

  private calculateAvailability(): number {
    return this.calculateUptimePercentage();
  }

  private calculateTrends() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(e => e.timestamp >= oneWeekAgo);
    const olderErrors = this.errors.filter(e => e.timestamp >= twoWeeksAgo && e.timestamp < oneWeekAgo);
    
    const recentErrorRate = recentErrors.length / 7; // Per day
    const olderErrorRate = olderErrors.length / 7; // Per day
    
    let errorTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (recentErrorRate > olderErrorRate * 1.2) {
      errorTrend = 'degrading';
    } else if (recentErrorRate < olderErrorRate * 0.8) {
      errorTrend = 'improving';
    }
    
    // Simplified trends - in reality, you'd calculate more sophisticated trends
    return {
      errorTrend,
      uptimeTrend: 'stable' as const,
      resolutionTrend: 'stable' as const
    };
  }

  private calculateResolutionTime(error: ErrorRecord): number {
    if (!error.resolvedAt) return 0;
    return (error.resolvedAt.getTime() - error.timestamp.getTime()) / (1000 * 60); // Minutes
  }

  private filterErrorsByDateRange(startDate?: Date, endDate?: Date): ErrorRecord[] {
    return this.errors.filter(error => {
      if (startDate && error.timestamp < startDate) return false;
      if (endDate && error.timestamp > endDate) return false;
      return true;
    });
  }
}
