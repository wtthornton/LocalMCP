/**
 * Resource Monitor Service - Resource usage monitoring and limits
 * 
 * This service monitors and enforces resource limits for LocalMCP operations,
 * ensuring system stability and preventing resource exhaustion.
 * 
 * Benefits for vibe coders:
 * - Automatic resource usage monitoring and limits
 * - Prevention of system resource exhaustion
 * - Performance optimization through resource tracking
 * - Configurable limits for different operation types
 * - Real-time resource usage statistics and alerts
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';

// Resource usage statistics
export interface ResourceUsage {
  cpu: {
    usage: number; // CPU usage percentage
    cores: number; // Number of CPU cores
    loadAverage: number[]; // Load average over 1, 5, 15 minutes
  };
  memory: {
    total: number; // Total memory in bytes
    used: number; // Used memory in bytes
    free: number; // Free memory in bytes
    usage: number; // Memory usage percentage
  };
  disk: {
    total: number; // Total disk space in bytes
    used: number; // Used disk space in bytes
    free: number; // Free disk space in bytes
    usage: number; // Disk usage percentage
  };
  network: {
    bytesIn: number; // Network bytes received
    bytesOut: number; // Network bytes sent
    packetsIn: number; // Network packets received
    packetsOut: number; // Network packets sent
  };
  processes: {
    count: number; // Total process count
    localmcpProcesses: number; // LocalMCP related processes
    zombieProcesses: number; // Zombie processes
  };
}

// Resource limits
export interface ResourceLimits {
  cpu: {
    maxUsage: number; // Maximum CPU usage percentage
    maxLoadAverage: number; // Maximum load average
    maxCores: number; // Maximum CPU cores to use
  };
  memory: {
    maxUsage: number; // Maximum memory usage percentage
    maxMemoryMB: number; // Maximum memory in MB
    maxHeapSizeMB: number; // Maximum heap size in MB
  };
  disk: {
    maxUsage: number; // Maximum disk usage percentage
    maxDiskSpaceMB: number; // Maximum disk space in MB
    maxTempFilesMB: number; // Maximum temporary files in MB
  };
  network: {
    maxBandwidthMBps: number; // Maximum bandwidth in MB/s
    maxConnections: number; // Maximum concurrent connections
  };
  processes: {
    maxProcesses: number; // Maximum total processes
    maxLocalmcpProcesses: number; // Maximum LocalMCP processes
    maxConcurrentOperations: number; // Maximum concurrent operations
  };
}

// Resource alert
export interface ResourceAlert {
  id: string;
  type: 'warning' | 'critical' | 'error';
  resource: 'cpu' | 'memory' | 'disk' | 'network' | 'processes';
  message: string;
  currentValue: number;
  limitValue: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

// Operation resource tracking
export interface OperationResourceTracking {
  operationId: string;
  startTime: Date;
  endTime?: Date;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  peakUsage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  limits: Partial<ResourceLimits>;
  exceeded: boolean;
}

// Resource Monitor Service Implementation
export class ResourceMonitorService extends EventEmitter {
  private limits: ResourceLimits;
  private currentUsage: ResourceUsage;
  private operationTracking: Map<string, OperationResourceTracking> = new Map();
  private alerts: Map<string, ResourceAlert> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private stats = {
    totalOperations: 0,
    operationsExceedingLimits: 0,
    alertsGenerated: 0,
    alertsResolved: 0,
    averageResourceUsage: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0
    },
    peakResourceUsage: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0
    }
  };

  constructor(limits?: Partial<ResourceLimits>) {
    super();
    
    this.limits = {
      cpu: {
        maxUsage: 80, // 80% CPU usage
        maxLoadAverage: 4.0, // Load average of 4.0
        maxCores: Math.min(os.cpus().length, 4) // Use at most 4 cores
      },
      memory: {
        maxUsage: 85, // 85% memory usage
        maxMemoryMB: 2048, // 2GB memory limit
        maxHeapSizeMB: 1024 // 1GB heap size limit
      },
      disk: {
        maxUsage: 90, // 90% disk usage
        maxDiskSpaceMB: 10240, // 10GB disk space limit
        maxTempFilesMB: 512 // 512MB temp files limit
      },
      network: {
        maxBandwidthMBps: 100, // 100MB/s bandwidth limit
        maxConnections: 100 // 100 concurrent connections
      },
      processes: {
        maxProcesses: 500, // 500 total processes
        maxLocalmcpProcesses: 50, // 50 LocalMCP processes
        maxConcurrentOperations: 10 // 10 concurrent operations
      },
      ...limits
    };

    this.currentUsage = this.getInitialResourceUsage();
    this.initializeService();
  }

  /**
   * Start resource monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.updateResourceUsage();
        this.checkResourceLimits();
        this.cleanupCompletedOperations();
      } catch (error) {
        this.emit('monitoringError', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }, intervalMs);

    this.emit('monitoringStarted', { interval: intervalMs });
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emit('monitoringStopped');
  }

  /**
   * Get current resource usage
   */
  getCurrentUsage(): ResourceUsage {
    return { ...this.currentUsage };
  }

  /**
   * Get resource limits
   */
  getLimits(): ResourceLimits {
    return { ...this.limits };
  }

  /**
   * Update resource limits
   */
  updateLimits(newLimits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
    this.emit('limitsUpdated', { limits: this.limits });
  }

  /**
   * Start tracking an operation
   */
  startOperationTracking(
    operationId: string,
    customLimits?: Partial<ResourceLimits>
  ): OperationResourceTracking {
    const tracking: OperationResourceTracking = {
      operationId,
      startTime: new Date(),
      resourceUsage: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      },
      peakUsage: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      },
      limits: { ...this.limits, ...customLimits },
      exceeded: false
    };

    this.operationTracking.set(operationId, tracking);
    this.stats.totalOperations++;

    this.emit('operationTrackingStarted', { operationId, tracking });

    return tracking;
  }

  /**
   * End tracking an operation
   */
  endOperationTracking(operationId: string): OperationResourceTracking | null {
    const tracking = this.operationTracking.get(operationId);
    if (!tracking) {
      return null;
    }

    tracking.endTime = new Date();
    this.operationTracking.delete(operationId);

    // Check if operation exceeded limits
    if (tracking.exceeded) {
      this.stats.operationsExceedingLimits++;
    }

    this.emit('operationTrackingEnded', { operationId, tracking });

    return tracking;
  }

  /**
   * Check if an operation can proceed based on resource limits
   */
  canProceedWithOperation(customLimits?: Partial<ResourceLimits>): {
    canProceed: boolean;
    reason?: string;
    currentUsage: ResourceUsage;
  } {
    const limits = { ...this.limits, ...customLimits };

    // Check concurrent operations limit
    if (this.operationTracking.size >= limits.processes.maxConcurrentOperations) {
      return {
        canProceed: false,
        reason: `Maximum concurrent operations limit reached: ${limits.processes.maxConcurrentOperations}`,
        currentUsage: this.currentUsage
      };
    }

    // Check CPU usage
    if (this.currentUsage.cpu.usage > limits.cpu.maxUsage) {
      return {
        canProceed: false,
        reason: `CPU usage limit exceeded: ${this.currentUsage.cpu.usage}% > ${limits.cpu.maxUsage}%`,
        currentUsage: this.currentUsage
      };
    }

    // Check memory usage
    if (this.currentUsage.memory.usage > limits.memory.maxUsage) {
      return {
        canProceed: false,
        reason: `Memory usage limit exceeded: ${this.currentUsage.memory.usage}% > ${limits.memory.maxUsage}%`,
        currentUsage: this.currentUsage
      };
    }

    // Check disk usage
    if (this.currentUsage.disk.usage > limits.disk.maxUsage) {
      return {
        canProceed: false,
        reason: `Disk usage limit exceeded: ${this.currentUsage.disk.usage}% > ${limits.disk.maxUsage}%`,
        currentUsage: this.currentUsage
      };
    }

    return {
      canProceed: true,
      currentUsage: this.currentUsage
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): ResourceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', { alertId, alert });
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.stats.alertsResolved++;
      this.emit('alertResolved', { alertId, alert });
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeOperations: this.operationTracking.size,
      activeAlerts: this.getActiveAlerts().length,
      currentUsage: this.currentUsage,
      limits: this.limits
    };
  }

  // Private helper methods

  private initializeService(): void {
    this.emit('serviceInitialized', { limits: this.limits });
  }

  private getInitialResourceUsage(): ResourceUsage {
    return {
      cpu: {
        usage: 0,
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        used: os.totalmem() - os.freemem(),
        free: os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      },
      disk: {
        total: 0,
        used: 0,
        free: 0,
        usage: 0
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0
      },
      processes: {
        count: 0,
        localmcpProcesses: 0,
        zombieProcesses: 0
      }
    };
  }

  private async updateResourceUsage(): Promise<void> {
    try {
      // Update CPU and memory usage
      this.currentUsage.cpu.loadAverage = os.loadavg();
      this.currentUsage.memory.total = os.totalmem();
      this.currentUsage.memory.free = os.freemem();
      this.currentUsage.memory.used = os.totalmem() - os.freemem();
      this.currentUsage.memory.usage = (this.currentUsage.memory.used / this.currentUsage.memory.total) * 100;

      // Update CPU usage (simplified calculation)
      this.currentUsage.cpu.usage = this.calculateCpuUsage();

      // Update disk usage
      await this.updateDiskUsage();

      // Update network usage
      await this.updateNetworkUsage();

      // Update process information
      await this.updateProcessInfo();

      // Update operation tracking
      this.updateOperationTracking();

      this.emit('resourceUsageUpdated', { usage: this.currentUsage });

    } catch (error) {
      this.emit('resourceUpdateError', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private calculateCpuUsage(): number {
    // Simplified CPU usage calculation
    // In a real implementation, you would track CPU time over intervals
    const loadAverage = os.loadavg()[0];
    const cores = os.cpus().length;
    return Math.min((loadAverage / cores) * 100, 100);
  }

  private async updateDiskUsage(): Promise<void> {
    try {
      // Use df command to get disk usage
      const result = await this.executeCommand('df', ['-h', '/']);
      const lines = result.trim().split('\n');
      
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        if (parts.length >= 5) {
          // Parse disk usage from df output
          const total = this.parseSize(parts[1]);
          const used = this.parseSize(parts[2]);
          const free = this.parseSize(parts[3]);
          
          this.currentUsage.disk.total = total;
          this.currentUsage.disk.used = used;
          this.currentUsage.disk.free = free;
          this.currentUsage.disk.usage = (used / total) * 100;
        }
      }
    } catch (error) {
      // Fallback to default values if df command fails
      this.currentUsage.disk = {
        total: 100 * 1024 * 1024 * 1024, // 100GB default
        used: 50 * 1024 * 1024 * 1024,   // 50GB default
        free: 50 * 1024 * 1024 * 1024,   // 50GB default
        usage: 50 // 50% default
      };
    }
  }

  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
      'T': 1024 * 1024 * 1024 * 1024
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)([KMGTP]?)$/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2] || '';
      return value * (units[unit] || 1);
    }

    return 0;
  }

  private async updateNetworkUsage(): Promise<void> {
    try {
      // Use netstat to get network statistics
      const result = await this.executeCommand('netstat', ['-i']);
      const lines = result.trim().split('\n');
      
      let bytesIn = 0;
      let bytesOut = 0;
      let packetsIn = 0;
      let packetsOut = 0;

      for (const line of lines) {
        if (line.includes('RX') && line.includes('TX')) {
          const parts = line.split(/\s+/);
          if (parts.length >= 10) {
            packetsIn += parseInt(parts[3]) || 0;
            bytesIn += parseInt(parts[4]) || 0;
            packetsOut += parseInt(parts[7]) || 0;
            bytesOut += parseInt(parts[8]) || 0;
          }
        }
      }

      this.currentUsage.network = {
        bytesIn,
        bytesOut,
        packetsIn,
        packetsOut
      };
    } catch (error) {
      // Fallback to default values if netstat command fails
      this.currentUsage.network = {
        bytesIn: 0,
        bytesOut: 0,
        packetsIn: 0,
        packetsOut: 0
      };
    }
  }

  private async updateProcessInfo(): Promise<void> {
    try {
      // Use ps command to get process information
      const result = await this.executeCommand('ps', ['-A']);
      const lines = result.trim().split('\n');
      
      let totalProcesses = 0;
      let localmcpProcesses = 0;
      let zombieProcesses = 0;

      for (const line of lines) {
        if (line.includes('<defunct>')) {
          zombieProcesses++;
        } else if (line.includes('localmcp')) {
          localmcpProcesses++;
        }
        totalProcesses++;
      }

      this.currentUsage.processes = {
        count: totalProcesses,
        localmcpProcesses,
        zombieProcesses
      };
    } catch (error) {
      // Fallback to default values if ps command fails
      this.currentUsage.processes = {
        count: 100, // Default process count
        localmcpProcesses: 1,
        zombieProcesses: 0
      };
    }
  }

  private updateOperationTracking(): void {
    for (const [operationId, tracking] of Array.from(this.operationTracking.entries())) {
      // Update current resource usage for the operation
      tracking.resourceUsage.cpu = this.currentUsage.cpu.usage;
      tracking.resourceUsage.memory = this.currentUsage.memory.usage;
      tracking.resourceUsage.disk = this.currentUsage.disk.usage;
      tracking.resourceUsage.network = (this.currentUsage.network.bytesIn + this.currentUsage.network.bytesOut) / (1024 * 1024); // MB

      // Update peak usage
      tracking.peakUsage.cpu = Math.max(tracking.peakUsage.cpu, tracking.resourceUsage.cpu);
      tracking.peakUsage.memory = Math.max(tracking.peakUsage.memory, tracking.resourceUsage.memory);
      tracking.peakUsage.disk = Math.max(tracking.peakUsage.disk, tracking.resourceUsage.disk);
      tracking.peakUsage.network = Math.max(tracking.peakUsage.network, tracking.resourceUsage.network);

      // Check if operation exceeded limits
      const limits = tracking.limits;
      if (!tracking.exceeded) {
        if (tracking.resourceUsage.cpu > limits.cpu.maxUsage ||
            tracking.resourceUsage.memory > limits.memory.maxUsage ||
            tracking.resourceUsage.disk > limits.disk.maxUsage) {
          tracking.exceeded = true;
          this.emit('operationLimitExceeded', { operationId, tracking });
        }
      }
    }
  }

  private checkResourceLimits(): void {
    // Check CPU limits
    if (this.currentUsage.cpu.usage > this.limits.cpu.maxUsage) {
      this.generateAlert('cpu', 'warning', 
        `High CPU usage: ${this.currentUsage.cpu.usage.toFixed(1)}%`, 
        this.currentUsage.cpu.usage, this.limits.cpu.maxUsage);
    }

    if (this.currentUsage.cpu.loadAverage[0] > this.limits.cpu.maxLoadAverage) {
      this.generateAlert('cpu', 'critical',
        `High load average: ${this.currentUsage.cpu.loadAverage[0].toFixed(2)}`,
        this.currentUsage.cpu.loadAverage[0], this.limits.cpu.maxLoadAverage);
    }

    // Check memory limits
    if (this.currentUsage.memory.usage > this.limits.memory.maxUsage) {
      this.generateAlert('memory', 'critical',
        `High memory usage: ${this.currentUsage.memory.usage.toFixed(1)}%`,
        this.currentUsage.memory.usage, this.limits.memory.maxUsage);
    }

    // Check disk limits
    if (this.currentUsage.disk.usage > this.limits.disk.maxUsage) {
      this.generateAlert('disk', 'warning',
        `High disk usage: ${this.currentUsage.disk.usage.toFixed(1)}%`,
        this.currentUsage.disk.usage, this.limits.disk.maxUsage);
    }

    // Check process limits
    if (this.currentUsage.processes.count > this.limits.processes.maxProcesses) {
      this.generateAlert('processes', 'warning',
        `High process count: ${this.currentUsage.processes.count}`,
        this.currentUsage.processes.count, this.limits.processes.maxProcesses);
    }

    if (this.currentUsage.processes.localmcpProcesses > this.limits.processes.maxLocalmcpProcesses) {
      this.generateAlert('processes', 'critical',
        `High LocalMCP process count: ${this.currentUsage.processes.localmcpProcesses}`,
        this.currentUsage.processes.localmcpProcesses, this.limits.processes.maxLocalmcpProcesses);
    }
  }

  private generateAlert(
    resource: 'cpu' | 'memory' | 'disk' | 'network' | 'processes',
    type: 'warning' | 'critical' | 'error',
    message: string,
    currentValue: number,
    limitValue: number
  ): void {
    const alertId = `${resource}-${Date.now()}`;
    const alert: ResourceAlert = {
      id: alertId,
      type,
      resource,
      message,
      currentValue,
      limitValue,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.stats.alertsGenerated++;

    this.emit('alertGenerated', { alert });
  }

  private cleanupCompletedOperations(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [operationId, tracking] of Array.from(this.operationTracking.entries())) {
      if (tracking.endTime && (now - tracking.endTime.getTime()) > maxAge) {
        this.operationTracking.delete(operationId);
      }
    }
  }

  private executeCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args);
      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed: ${error}`));
        }
      });

      process.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.operationTracking.clear();
    this.alerts.clear();
    this.emit('serviceDestroyed');
  }
}

export default ResourceMonitorService;
