// src/services/monitoring/system-monitor.service.ts
import { Logger } from '../logger/logger.js';
import { performance } from 'perf_hooks';

export interface SystemResourceMetrics {
  cpu: {
    usage: number; // Percentage
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number; // Bytes
    total: number; // Bytes
    free: number; // Bytes
    usagePercentage: number;
  };
  disk: {
    used: number; // Bytes
    total: number; // Bytes
    free: number; // Bytes
    usagePercentage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    connections: number;
  };
  timestamp: Date;
}

export interface PerformanceMetrics {
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  availability: {
    uptime: number; // Seconds
    uptimePercentage: number;
    lastRestart: Date;
    healthChecks: {
      total: number;
      passed: number;
      failed: number;
      successRate: number;
    };
  };
  errors: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    lastError: Date | null;
  };
  timestamp: Date;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  lastChecked: Date;
}

export class SystemMonitorService {
  private logger: Logger;
  private startTime: Date;
  private requestCount: number = 0;
  private responseTimes: number[] = [];
  private errorCount: number = 0;
  private errorsByType: Record<string, number> = {};
  private lastError: Date | null = null;
  private healthCheckCount: number = 0;
  private healthCheckPassed: number = 0;

  constructor(logger: Logger) {
    this.logger = logger;
    this.startTime = new Date();
    this.logger.debug('SystemMonitorService initialized');
  }

  /**
   * Get current system resource metrics
   */
  async getResourceMetrics(): Promise<SystemResourceMetrics> {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryUsage = await this.getMemoryUsage();
      const diskUsage = await this.getDiskUsage();
      const networkUsage = await this.getNetworkUsage();

      return {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        network: networkUsage,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get resource metrics', { error });
      throw error;
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();
    const uptime = Math.floor((now - this.startTime.getTime()) / 1000);
    const uptimePercentage = this.calculateUptimePercentage();

    // Calculate response time percentiles
    const sortedResponseTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);

    return {
      throughput: {
        requestsPerSecond: this.calculateRequestsPerSecond(),
        requestsPerMinute: this.calculateRequestsPerMinute(),
        averageResponseTime: this.calculateAverageResponseTime(),
        p95ResponseTime: sortedResponseTimes[p95Index] || 0,
        p99ResponseTime: sortedResponseTimes[p99Index] || 0
      },
      availability: {
        uptime,
        uptimePercentage,
        lastRestart: this.startTime,
        healthChecks: {
          total: this.healthCheckCount,
          passed: this.healthCheckPassed,
          failed: this.healthCheckCount - this.healthCheckPassed,
          successRate: this.healthCheckCount > 0 ? (this.healthCheckPassed / this.healthCheckCount) * 100 : 100
        }
      },
      errors: {
        totalErrors: this.errorCount,
        errorRate: this.calculateErrorRate(),
        errorsByType: { ...this.errorsByType },
        lastError: this.lastError
      },
      timestamp: new Date()
    };
  }

  /**
   * Record a request for performance tracking
   */
  recordRequest(responseTime: number): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times for memory efficiency
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Record an error for tracking
   */
  recordError(errorType: string, error: Error): void {
    this.errorCount++;
    this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1;
    this.lastError = new Date();
    
    this.logger.warn('Error recorded', { 
      errorType, 
      message: error.message,
      totalErrors: this.errorCount 
    });
  }

  /**
   * Record a health check result
   */
  recordHealthCheck(passed: boolean): void {
    this.healthCheckCount++;
    if (passed) {
      this.healthCheckPassed++;
    }
  }

  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const resourceMetrics = await this.getResourceMetrics();
      const performanceMetrics = this.getPerformanceMetrics();
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check CPU usage
      if (resourceMetrics.cpu.usage > 90) {
        issues.push('High CPU usage detected');
        recommendations.push('Consider scaling up or optimizing CPU-intensive operations');
        score -= 20;
      } else if (resourceMetrics.cpu.usage > 80) {
        issues.push('Elevated CPU usage');
        recommendations.push('Monitor CPU usage and consider optimization');
        score -= 10;
      }

      // Check memory usage
      if (resourceMetrics.memory.usagePercentage > 95) {
        issues.push('Critical memory usage');
        recommendations.push('Immediate memory cleanup or scaling required');
        score -= 25;
      } else if (resourceMetrics.memory.usagePercentage > 85) {
        issues.push('High memory usage');
        recommendations.push('Consider memory optimization or scaling');
        score -= 15;
      }

      // Check disk usage
      if (resourceMetrics.disk.usagePercentage > 95) {
        issues.push('Critical disk usage');
        recommendations.push('Immediate disk cleanup required');
        score -= 20;
      } else if (resourceMetrics.disk.usagePercentage > 85) {
        issues.push('High disk usage');
        recommendations.push('Consider disk cleanup or expansion');
        score -= 10;
      }

      // Check error rate
      if (performanceMetrics.errors.errorRate > 10) {
        issues.push('High error rate detected');
        recommendations.push('Investigate and fix error sources');
        score -= 20;
      } else if (performanceMetrics.errors.errorRate > 5) {
        issues.push('Elevated error rate');
        recommendations.push('Monitor error patterns and address issues');
        score -= 10;
      }

      // Check response times
      if (performanceMetrics.throughput.p95ResponseTime > 5000) {
        issues.push('Slow response times');
        recommendations.push('Optimize performance bottlenecks');
        score -= 15;
      } else if (performanceMetrics.throughput.p95ResponseTime > 2000) {
        issues.push('Moderate response time issues');
        recommendations.push('Monitor and optimize performance');
        score -= 8;
      }

      // Check availability
      if (performanceMetrics.availability.uptimePercentage < 95) {
        issues.push('Low availability');
        recommendations.push('Improve system reliability and monitoring');
        score -= 20;
      } else if (performanceMetrics.availability.uptimePercentage < 99) {
        issues.push('Moderate availability issues');
        recommendations.push('Enhance monitoring and error handling');
        score -= 10;
      }

      const overall = score >= 90 ? 'healthy' : score >= 70 ? 'degraded' : 'unhealthy';

      return {
        overall,
        score: Math.max(0, score),
        issues,
        recommendations,
        lastChecked: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get system health', { error });
      return {
        overall: 'unhealthy',
        score: 0,
        issues: ['Failed to check system health'],
        recommendations: ['Fix system monitoring'],
        lastChecked: new Date()
      };
    }
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    this.requestCount = 0;
    this.responseTimes = [];
    this.errorCount = 0;
    this.errorsByType = {};
    this.lastError = null;
    this.healthCheckCount = 0;
    this.healthCheckPassed = 0;
    this.startTime = new Date();
    this.logger.debug('System metrics reset');
  }

  private async getCPUUsage(): Promise<SystemResourceMetrics['cpu']> {
    // Simplified CPU usage calculation
    // In a real implementation, you'd use os.cpus() and calculate actual usage
    const cpus = require('os').cpus();
    const loadAvg = require('os').loadavg();
    
    return {
      usage: Math.random() * 100, // Placeholder - would calculate actual usage
      loadAverage: loadAvg,
      cores: cpus.length
    };
  }

  private async getMemoryUsage(): Promise<SystemResourceMetrics['memory']> {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      used: memUsage.heapUsed,
      total: totalMem,
      free: freeMem,
      usagePercentage: (usedMem / totalMem) * 100
    };
  }

  private async getDiskUsage(): Promise<SystemResourceMetrics['disk']> {
    // Simplified disk usage - in real implementation, use fs.stat or similar
    const totalDisk = 100 * 1024 * 1024 * 1024; // 100GB placeholder
    const usedDisk = Math.random() * totalDisk * 0.7; // 70% usage placeholder
    const freeDisk = totalDisk - usedDisk;
    
    return {
      used: usedDisk,
      total: totalDisk,
      free: freeDisk,
      usagePercentage: (usedDisk / totalDisk) * 100
    };
  }

  private async getNetworkUsage(): Promise<SystemResourceMetrics['network']> {
    // Simplified network usage - in real implementation, use netstat or similar
    return {
      bytesReceived: Math.random() * 1000000,
      bytesSent: Math.random() * 1000000,
      connections: Math.floor(Math.random() * 100)
    };
  }

  private calculateRequestsPerSecond(): number {
    const now = Date.now();
    const timeDiff = (now - this.startTime.getTime()) / 1000;
    return timeDiff > 0 ? this.requestCount / timeDiff : 0;
  }

  private calculateRequestsPerMinute(): number {
    return this.calculateRequestsPerSecond() * 60;
  }

  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    return this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  private calculateErrorRate(): number {
    if (this.requestCount === 0) return 0;
    return (this.errorCount / this.requestCount) * 100;
  }

  private calculateUptimePercentage(): number {
    const now = Date.now();
    const uptime = (now - this.startTime.getTime()) / 1000;
    const totalUptime = uptime; // In a real system, you'd track planned downtime
    
    // For now, assume 100% uptime since start
    return 100;
  }
}
