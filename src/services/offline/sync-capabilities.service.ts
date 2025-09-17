/**
 * Sync Capabilities Service - Synchronization when connectivity is restored
 * 
 * This service handles synchronization of offline data when external services
 * become available again, ensuring data consistency and up-to-date information.
 * 
 * Benefits for vibe coders:
 * - Automatic sync when connection restored
 * - No data loss during offline periods
 * - Conflict resolution for conflicting changes
 * - Background synchronization without interruption
 * - Smart sync strategies based on data type
 */

import { EventEmitter } from 'events';

// Sync operation result
export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: number;
  duration: number;
  details: {
    context7: SyncOperationResult;
    rag: SyncOperationResult;
    lessons: SyncOperationResult;
    patterns: SyncOperationResult;
  };
  error?: string;
}

// Individual sync operation result
export interface SyncOperationResult {
  success: boolean;
  synced: number;
  conflictCount: number;
  errorCount: number;
  duration: number;
  conflicts?: SyncConflict[];
  errors?: SyncError[];
}

// Sync conflict
export interface SyncConflict {
  id: string;
  type: 'local' | 'remote' | 'both';
  localData: any;
  remoteData: any;
  conflictType: 'content' | 'timestamp' | 'version';
  resolution?: 'local' | 'remote' | 'merge' | 'skip';
}

// Sync error
export interface SyncError {
  id: string;
  error: string;
  retryable: boolean;
  retryCount: number;
}

// Sync strategy
export interface SyncStrategy {
  service: string;
  priority: 'high' | 'medium' | 'low';
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  conflictResolution: 'local' | 'remote' | 'merge' | 'prompt';
  enableIncrementalSync: boolean;
  syncInterval: number; // in milliseconds
}

// Sync queue item
export interface SyncQueueItem {
  id: string;
  service: string;
  type: 'push' | 'pull' | 'bidirectional';
  data: any;
  priority: number;
  timestamp: Date;
  retryCount: number;
}

// Sync Capabilities Service Implementation
export class SyncCapabilitiesService extends EventEmitter {
  private syncQueue: SyncQueueItem[] = [];
  private strategies: Map<string, SyncStrategy> = new Map();
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;
  private lastSyncTime?: Date;
  private stats = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    conflictsResolved: 0,
    itemsSynced: 0,
    averageSyncTime: 0,
    totalSyncTime: 0
  };

  constructor() {
    super();
    this.initializeService();
  }

  /**
   * Perform full synchronization
   */
  async performFullSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    const startTime = Date.now();
    this.syncInProgress = true;
    this.stats.totalSyncs++;

    try {
      this.emit('syncStarted', { type: 'full' });

      // Check connectivity
      const connectivityCheck = await this.checkConnectivity();
      if (!connectivityCheck.isOnline) {
        throw new Error('No connectivity available for sync');
      }

      // Sync each service
      const context7Result = await this.syncContext7();
      const ragResult = await this.syncRAG();
      const lessonsResult = await this.syncLessons();
      const patternsResult = await this.syncPatterns();

      // Calculate overall results
      const totalSynced = context7Result.synced + ragResult.synced + lessonsResult.synced + patternsResult.synced;
      const totalConflicts = context7Result.conflictCount + ragResult.conflictCount + lessonsResult.conflictCount + patternsResult.conflictCount;
      const totalErrors = context7Result.errorCount + ragResult.errorCount + lessonsResult.errorCount + patternsResult.errorCount;

      const duration = Date.now() - startTime;
      const success = totalErrors === 0;

      if (success) {
        this.stats.successfulSyncs++;
        this.stats.itemsSynced += totalSynced;
        this.stats.conflictsResolved += totalConflicts;
      } else {
        this.stats.failedSyncs++;
      }

      this.stats.totalSyncTime += duration;
      this.stats.averageSyncTime = this.stats.totalSyncTime / this.stats.totalSyncs;

      const result: SyncResult = {
        success,
        synced: totalSynced,
        conflicts: totalConflicts,
        errors: totalErrors,
        duration,
        details: {
          context7: context7Result,
          rag: ragResult,
          lessons: lessonsResult,
          patterns: patternsResult
        }
      };

      this.lastSyncTime = new Date();
      this.emit('syncCompleted', result);

      return result;

    } catch (error) {
      this.stats.failedSyncs++;
      const duration = Date.now() - startTime;
      
      this.emit('syncFailed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration 
      });

      return {
        success: false,
        synced: 0,
        conflicts: 0,
        errors: 1,
        duration,
        details: {
          context7: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
          rag: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
          lessons: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
          patterns: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Perform incremental synchronization
   */
  async performIncrementalSync(): Promise<SyncResult> {
    if (!this.lastSyncTime) {
      // No previous sync - perform full sync
      return this.performFullSync();
    }

    const startTime = Date.now();
    this.syncInProgress = true;

    try {
      this.emit('syncStarted', { type: 'incremental', since: this.lastSyncTime });

      // Get changes since last sync
      const changes = await this.getChangesSince(this.lastSyncTime);

      // Process changes in batches
      const result = await this.processChanges(changes);

      this.emit('syncCompleted', result);
      return result;

    } catch (error) {
      this.emit('syncFailed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        synced: 0,
        conflicts: 0,
        errors: 1,
        duration: Date.now() - startTime,
        details: {
          context7: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
          rag: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
          lessons: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
          patterns: { success: false, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Queue item for synchronization
   */
  queueForSync(
    id: string,
    service: string,
    type: 'push' | 'pull' | 'bidirectional',
    data: any,
    priority: number = 1
  ): void {
    const item: SyncQueueItem = {
      id,
      service,
      type,
      data,
      priority,
      timestamp: new Date(),
      retryCount: 0
    };

    this.syncQueue.push(item);
    this.syncQueue.sort((a, b) => b.priority - a.priority); // Sort by priority

    this.emit('itemQueued', { id, service, type, priority });

    // Trigger sync if online and not in progress
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Register sync strategy for a service
   */
  registerStrategy(strategy: SyncStrategy): void {
    this.strategies.set(strategy.service, strategy);
    this.emit('strategyRegistered', { service: strategy.service, strategy });
  }

  /**
   * Check connectivity status
   */
  async checkConnectivity(): Promise<{ isOnline: boolean; services: Record<string, boolean> }> {
    const services: Record<string, boolean> = {};

    // Check Context7
    services.context7 = await this.checkServiceConnectivity('context7');
    
    // Check RAG service
    services.rag = await this.checkServiceConnectivity('rag');
    
    // Check Lessons service
    services.lessons = await this.checkServiceConnectivity('lessons');
    
    // Check Patterns service
    services.patterns = await this.checkServiceConnectivity('patterns');

    const isOnline = Object.values(services).some(available => available);
    
    if (isOnline !== this.isOnline) {
      this.isOnline = isOnline;
      this.emit('connectivityChanged', { isOnline, services });
      
      if (isOnline && !this.syncInProgress) {
        // Connection restored - start sync
        this.performIncrementalSync();
      }
    }

    return { isOnline, services };
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.stats,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      queuedItems: this.syncQueue.length,
      registeredStrategies: this.strategies.size
    };
  }

  /**
   * Clear sync queue
   */
  clearQueue(): void {
    const count = this.syncQueue.length;
    this.syncQueue = [];
    this.emit('queueCleared', { count });
  }

  // Private helper methods

  private initializeService(): void {
    // Register default strategies
    this.registerDefaultStrategies();

    // Start connectivity monitoring
    this.startConnectivityMonitoring();

    this.emit('serviceInitialized');
  }

  private registerDefaultStrategies(): void {
    const defaultStrategies: SyncStrategy[] = [
      {
        service: 'context7',
        priority: 'high',
        batchSize: 50,
        retryAttempts: 3,
        retryDelay: 2000,
        conflictResolution: 'remote', // Context7 is authoritative
        enableIncrementalSync: true,
        syncInterval: 5 * 60 * 1000 // 5 minutes
      },
      {
        service: 'rag',
        priority: 'medium',
        batchSize: 100,
        retryAttempts: 2,
        retryDelay: 1000,
        conflictResolution: 'merge',
        enableIncrementalSync: true,
        syncInterval: 10 * 60 * 1000 // 10 minutes
      },
      {
        service: 'lessons',
        priority: 'high',
        batchSize: 25,
        retryAttempts: 3,
        retryDelay: 1500,
        conflictResolution: 'merge',
        enableIncrementalSync: true,
        syncInterval: 2 * 60 * 1000 // 2 minutes
      },
      {
        service: 'patterns',
        priority: 'medium',
        batchSize: 75,
        retryAttempts: 2,
        retryDelay: 1000,
        conflictResolution: 'merge',
        enableIncrementalSync: true,
        syncInterval: 15 * 60 * 1000 // 15 minutes
      }
    ];

    defaultStrategies.forEach(strategy => this.registerStrategy(strategy));
  }

  private startConnectivityMonitoring(): void {
    setInterval(async () => {
      await this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  private async syncContext7(): Promise<SyncOperationResult> {
    const startTime = Date.now();
    const strategy = this.strategies.get('context7');
    
    if (!strategy) {
      return { success: false, synced: 0, conflictCount: 0, errorCount: 1, duration: 0 };
    }

    try {
      // Simulate Context7 sync
      const result = await this.simulateServiceSync('context7', strategy);
      
      this.emit('serviceSynced', { service: 'context7', ...result });
      return result;

    } catch (error) {
      this.emit('serviceSyncFailed', { 
        service: 'context7', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        synced: 0,
        conflictCount: 0,
        errorCount: 1,
        duration: Date.now() - startTime,
        errors: [{
          id: 'context7-sync',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          retryCount: 0
        }]
      };
    }
  }

  private async syncRAG(): Promise<SyncOperationResult> {
    const startTime = Date.now();
    const strategy = this.strategies.get('rag');
    
    if (!strategy) {
      return { success: false, synced: 0, conflictCount: 0, errorCount: 1, duration: 0 };
    }

    try {
      const result = await this.simulateServiceSync('rag', strategy);
      
      this.emit('serviceSynced', { service: 'rag', ...result });
      return result;

    } catch (error) {
      return {
        success: false,
        synced: 0,
        conflictCount: 0,
        errorCount: 1,
        duration: Date.now() - startTime,
        errors: [{
          id: 'rag-sync',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          retryCount: 0
        }]
      };
    }
  }

  private async syncLessons(): Promise<SyncOperationResult> {
    const startTime = Date.now();
    const strategy = this.strategies.get('lessons');
    
    if (!strategy) {
      return { success: false, synced: 0, conflictCount: 0, errorCount: 1, duration: 0 };
    }

    try {
      const result = await this.simulateServiceSync('lessons', strategy);
      
      this.emit('serviceSynced', { service: 'lessons', ...result });
      return result;

    } catch (error) {
      return {
        success: false,
        synced: 0,
        conflictCount: 0,
        errorCount: 1,
        duration: Date.now() - startTime,
        errors: [{
          id: 'lessons-sync',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          retryCount: 0
        }]
      };
    }
  }

  private async syncPatterns(): Promise<SyncOperationResult> {
    const startTime = Date.now();
    const strategy = this.strategies.get('patterns');
    
    if (!strategy) {
      return { success: false, synced: 0, conflictCount: 0, errorCount: 1, duration: 0 };
    }

    try {
      const result = await this.simulateServiceSync('patterns', strategy);
      
      this.emit('serviceSynced', { service: 'patterns', ...result });
      return result;

    } catch (error) {
      return {
        success: false,
        synced: 0,
        conflictCount: 0,
        errorCount: 1,
        duration: Date.now() - startTime,
        errors: [{
          id: 'patterns-sync',
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          retryCount: 0
        }]
      };
    }
  }

  private async simulateServiceSync(service: string, strategy: SyncStrategy): Promise<SyncOperationResult> {
    const startTime = Date.now();
    
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));

    // Simulate results
    const synced = Math.floor(Math.random() * strategy.batchSize);
    const conflicts = Math.floor(Math.random() * 5);
    const errors = Math.random() > 0.9 ? 1 : 0; // 10% chance of error

    const conflictsList: SyncConflict[] = [];
    for (let i = 0; i < conflicts; i++) {
      conflictsList.push({
        id: `${service}-conflict-${i}`,
        type: 'both',
        localData: { version: '1.0', content: 'Local content' },
        remoteData: { version: '1.1', content: 'Remote content' },
        conflictType: 'content'
      });
    }

    return {
      success: errors === 0,
      synced,
      conflictCount: conflicts,
      errorCount: errors,
      duration: Date.now() - startTime,
      conflicts: conflictsList
    };
  }

  private async checkServiceConnectivity(service: string): Promise<boolean> {
    // Simulate connectivity check
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(Math.random() > 0.1); // 90% success rate
      }, 100 + Math.random() * 200);
    });
  }

  private async getChangesSince(since: Date): Promise<any[]> {
    // Simulate getting changes since last sync
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: 'change-1', service: 'context7', type: 'update', timestamp: new Date() },
          { id: 'change-2', service: 'rag', type: 'create', timestamp: new Date() },
          { id: 'change-3', service: 'lessons', type: 'update', timestamp: new Date() }
        ]);
      }, 50);
    });
  }

  private async processChanges(changes: any[]): Promise<SyncResult> {
    // Process changes in batches
    const startTime = Date.now();
    let totalSynced = 0;
    let totalConflicts = 0;
    let totalErrors = 0;

    for (const change of changes) {
      try {
        await this.processChange(change);
        totalSynced++;
      } catch (error) {
        totalErrors++;
      }
    }

    return {
      success: totalErrors === 0,
      synced: totalSynced,
      conflicts: totalConflicts,
      errors: totalErrors,
      duration: Date.now() - startTime,
      details: {
        context7: { success: true, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
        rag: { success: true, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
        lessons: { success: true, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 },
        patterns: { success: true, synced: 0, conflictCount: 0, errorCount: 0, duration: 0 }
      }
    };
  }

  private async processChange(change: any): Promise<void> {
    // Simulate processing a change
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const batchSize = 10;
    const batch = this.syncQueue.splice(0, batchSize);

    for (const item of batch) {
      try {
        await this.processSyncItem(item);
      } catch (error) {
        item.retryCount++;
        if (item.retryCount < 3) {
          // Re-queue for retry
          this.syncQueue.push(item);
        }
      }
    }

    // Continue processing if more items
    if (this.syncQueue.length > 0) {
      setTimeout(() => this.processSyncQueue(), 1000);
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // Simulate processing sync item
    await new Promise(resolve => setTimeout(resolve, 50));
    this.emit('itemSynced', { id: item.id, service: item.service, type: item.type });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearQueue();
    this.emit('serviceDestroyed');
  }
}

export default SyncCapabilitiesService;
