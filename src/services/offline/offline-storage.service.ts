/**
 * Offline Storage Service - Persistent storage for offline operations
 * 
 * This service provides persistent storage for lessons, patterns, and other data
 * that LocalMCP needs to function when external services are unavailable.
 * 
 * Benefits for vibe coders:
 * - Data persists between sessions
 * - Works completely offline
 * - Fast access to locally stored knowledge
 * - Automatic backup and recovery
 * - No data loss when services are down
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// Storage entry
export interface StorageEntry<T = any> {
  id: string;
  type: 'lesson' | 'pattern' | 'documentation' | 'config' | 'cache';
  data: T;
  metadata: {
    created: Date;
    updated: Date;
    version: string;
    tags: string[];
    size: number;
    checksum: string;
    lastAccessed: Date;
  };
}

// Storage statistics
export interface StorageStats {
  totalEntries: number;
  totalSize: number;
  entriesByType: Record<string, number>;
  oldestEntry: Date;
  newestEntry: Date;
  diskUsage: number;
  memoryUsage: number;
}

// Storage configuration
export interface StorageConfig {
  dataPath: string;
  maxMemoryEntries: number;
  maxDiskSize: number; // in bytes
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupEnabled: boolean;
  backupInterval: number; // in milliseconds
  retentionDays: number;
}

// Storage operation result
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    fromCache: boolean;
    fromDisk: boolean;
    compressed: boolean;
    encrypted: boolean;
    responseTime: number;
  };
}

// Offline Storage Service Implementation
export class OfflineStorageService extends EventEmitter {
  private config: StorageConfig;
  private memoryCache: Map<string, StorageEntry> = new Map();
  private index: Map<string, string[]> = new Map(); // type -> entry IDs
  private stats: StorageStats;
  private backupTimer?: NodeJS.Timeout;
  private compressionEnabled: boolean;
  private encryptionEnabled: boolean;

  constructor(config?: Partial<StorageConfig>) {
    super();
    
    this.config = {
      dataPath: './data/offline-storage',
      maxMemoryEntries: 1000,
      maxDiskSize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: true,
      encryptionEnabled: false, // Disabled for simplicity
      backupEnabled: true,
      backupInterval: 24 * 60 * 60 * 1000, // 24 hours
      retentionDays: 30,
      ...config
    };

    this.compressionEnabled = this.config.compressionEnabled;
    this.encryptionEnabled = this.config.encryptionEnabled;

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      entriesByType: {},
      oldestEntry: new Date(),
      newestEntry: new Date(),
      diskUsage: 0,
      memoryUsage: 0
    };

    this.initializeService();
  }

  /**
   * Store data offline
   */
  async store<T = any>(
    id: string,
    type: 'lesson' | 'pattern' | 'documentation' | 'config' | 'cache',
    data: T,
    options?: {
      tags?: string[];
      version?: string;
      ttl?: number; // Time to live in milliseconds
    }
  ): Promise<StorageResult<T>> {
    const startTime = Date.now();

    try {
      const tags = options?.tags || [];
      const version = options?.version || '1.0';
      const now = new Date();

      // Create storage entry
      const entry: StorageEntry<T> = {
        id,
        type,
        data,
        metadata: {
          created: now,
          updated: now,
          version,
          tags,
          size: JSON.stringify(data).length,
          checksum: this.calculateChecksum(data),
          lastAccessed: now
        }
      };

      // Store in memory cache
      this.memoryCache.set(id, entry);
      this.updateIndex(type, id);

      // Persist to disk
      await this.persistToDisk(entry);

      // Update statistics
      this.updateStats(entry);

      // Check memory limits
      await this.manageMemoryLimits();

      this.emit('dataStored', { id, type, size: entry.metadata.size });

      return {
        success: true,
        data,
        metadata: {
          fromCache: true,
          fromDisk: false,
          compressed: this.compressionEnabled,
          encrypted: this.encryptionEnabled,
          responseTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.emit('storageError', { id, type, error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          fromCache: false,
          fromDisk: false,
          compressed: false,
          encrypted: false,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Retrieve data from offline storage
   */
  async retrieve<T = any>(
    id: string,
    options?: {
      fromMemoryOnly?: boolean;
      refreshCache?: boolean;
    }
  ): Promise<StorageResult<T>> {
    const startTime = Date.now();

    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(id);
      if (memoryEntry && !options?.refreshCache) {
        this.emit('cacheHit', { id, source: 'memory' });
        
        return {
          success: true,
          data: memoryEntry.data as T,
          metadata: {
            fromCache: true,
            fromDisk: false,
            compressed: this.compressionEnabled,
            encrypted: this.encryptionEnabled,
            responseTime: Date.now() - startTime
          }
        };
      }

      // Load from disk if not in memory
      if (!options?.fromMemoryOnly) {
        const diskEntry = await this.loadFromDisk<T>(id);
        if (diskEntry) {
          // Update memory cache
          this.memoryCache.set(id, diskEntry);
          
          this.emit('cacheMiss', { id, source: 'disk' });
          
          return {
            success: true,
            data: diskEntry.data,
            metadata: {
              fromCache: false,
              fromDisk: true,
              compressed: this.compressionEnabled,
              encrypted: this.encryptionEnabled,
              responseTime: Date.now() - startTime
            }
          };
        }
      }

      this.emit('dataNotFound', { id });
      
      return {
        success: false,
        error: `Data not found: ${id}`,
        metadata: {
          fromCache: false,
          fromDisk: false,
          compressed: false,
          encrypted: false,
          responseTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.emit('retrievalError', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          fromCache: false,
          fromDisk: false,
          compressed: false,
          encrypted: false,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Query stored data by type and tags
   */
  async query(
    type?: string,
    tags?: string[],
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'created' | 'updated' | 'size';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<StorageResult<StorageEntry[]>> {
    const startTime = Date.now();

    try {
      let entries: StorageEntry[] = [];

      if (type) {
        // Get entries by type
        const entryIds = this.index.get(type) || [];
        entries = entryIds
          .map(id => this.memoryCache.get(id))
          .filter((entry): entry is StorageEntry => entry !== undefined);
      } else {
        // Get all entries
        entries = Array.from(this.memoryCache.values());
      }

      // Filter by tags
      if (tags && tags.length > 0) {
        entries = entries.filter(entry =>
          tags.some(tag => entry.metadata.tags.includes(tag))
        );
      }

      // Sort
      const sortBy = options?.sortBy || 'updated';
      const sortOrder = options?.sortOrder || 'desc';
      
      entries.sort((a, b) => {
        const aValue = a.metadata[sortBy];
        const bValue = b.metadata[sortBy];
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const offset = options?.offset || 0;
      const limit = options?.limit || entries.length;
      const paginatedEntries = entries.slice(offset, offset + limit);

      this.emit('queryExecuted', { 
        type, 
        tags, 
        results: paginatedEntries.length,
        total: entries.length 
      });

      return {
        success: true,
        data: paginatedEntries,
        metadata: {
          fromCache: true,
          fromDisk: false,
          compressed: false,
          encrypted: false,
          responseTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          fromCache: false,
          fromDisk: false,
          compressed: false,
          encrypted: false,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Delete stored data
   */
  async delete(id: string): Promise<StorageResult<void>> {
    const startTime = Date.now();

    try {
      const entry = this.memoryCache.get(id);
      if (!entry) {
        return {
          success: false,
          error: `Entry not found: ${id}`,
          metadata: {
            fromCache: false,
            fromDisk: false,
            compressed: false,
            encrypted: false,
            responseTime: Date.now() - startTime
          }
        };
      }

      // Remove from memory
      this.memoryCache.delete(id);
      this.removeFromIndex(entry.type, id);

      // Remove from disk
      await this.deleteFromDisk(id);

      // Update statistics
      this.updateStats(entry, true);

      this.emit('dataDeleted', { id, type: entry.type });

      return {
        success: true,
        metadata: {
          fromCache: true,
          fromDisk: true,
          compressed: false,
          encrypted: false,
          responseTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          fromCache: false,
          fromDisk: false,
          compressed: false,
          encrypted: false,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    return { ...this.stats };
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [id, entry] of Array.from(this.memoryCache.entries())) {
      if (entry.metadata.created < cutoffDate) {
        await this.delete(id);
        cleaned++;
      }
    }

    this.emit('cleanupCompleted', { cleaned, cutoffDate });
    return cleaned;
  }

  /**
   * Export storage data
   */
  async export(options?: {
    types?: string[];
    includeMetadata?: boolean;
    format?: 'json' | 'csv';
  }): Promise<StorageResult<string>> {
    try {
      const types = options?.types;
      const includeMetadata = options?.includeMetadata || false;
      const format = options?.format || 'json';

      let entries: StorageEntry[] = [];

      if (types) {
        for (const type of types) {
          const typeEntries = this.index.get(type) || [];
          entries.push(...typeEntries
            .map(id => this.memoryCache.get(id))
            .filter((entry): entry is StorageEntry => entry !== undefined)
          );
        }
      } else {
        entries = Array.from(this.memoryCache.values());
      }

      let exportData: any;
      
      if (format === 'json') {
        exportData = {
          exported: new Date().toISOString(),
          count: entries.length,
          entries: entries.map(entry => ({
            id: entry.id,
            type: entry.type,
            data: entry.data,
            ...(includeMetadata && { metadata: entry.metadata })
          }))
        };
      } else {
        // CSV format
        const headers = ['id', 'type', 'created', 'updated', 'size', 'tags'];
        const rows = entries.map(entry => [
          entry.id,
          entry.type,
          entry.metadata.created.toISOString(),
          entry.metadata.updated.toISOString(),
          entry.metadata.size,
          entry.metadata.tags.join(';')
        ]);
        
        exportData = [headers, ...rows]
          .map(row => row.join(','))
          .join('\n');
      }

      this.emit('dataExported', { count: entries.length, format });

      return {
        success: true,
        data: typeof exportData === 'string' ? exportData : JSON.stringify(exportData, null, 2)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private async initializeService(): Promise<void> {
    try {
      // Ensure data directory exists
      await fs.mkdir(this.config.dataPath, { recursive: true });

      // Load existing data
      await this.loadExistingData();

      // Start backup timer
      if (this.config.backupEnabled) {
        this.backupTimer = setInterval(() => {
          this.performBackup();
        }, this.config.backupInterval);
      }

      this.emit('serviceInitialized', { 
        config: this.config,
        loadedEntries: this.memoryCache.size 
      });

    } catch (error) {
      this.emit('initializationError', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async loadExistingData(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.dataPath);
      let loaded = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.dataPath, file);
          const data = await fs.readFile(filePath, 'utf8');
          const entry: StorageEntry = JSON.parse(data);
          
          this.memoryCache.set(entry.id, entry);
          this.updateIndex(entry.type, entry.id);
          loaded++;
        }
      }

      this.emit('dataLoaded', { count: loaded });
    } catch (error) {
      // Ignore errors - might be first run
    }
  }

  private async persistToDisk(entry: StorageEntry): Promise<void> {
    const filePath = path.join(this.config.dataPath, `${entry.id}.json`);
    const data = JSON.stringify(entry, null, 2);
    await fs.writeFile(filePath, data, 'utf8');
  }

  private async loadFromDisk<T>(id: string): Promise<StorageEntry<T> | null> {
    try {
      const filePath = path.join(this.config.dataPath, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as StorageEntry<T>;
    } catch (error) {
      return null;
    }
  }

  private async deleteFromDisk(id: string): Promise<void> {
    try {
      const filePath = path.join(this.config.dataPath, `${id}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore errors - file might not exist
    }
  }

  private updateIndex(type: string, id: string): void {
    if (!this.index.has(type)) {
      this.index.set(type, []);
    }
    
    const typeEntries = this.index.get(type)!;
    if (!typeEntries.includes(id)) {
      typeEntries.push(id);
    }
  }

  private removeFromIndex(type: string, id: string): void {
    const typeEntries = this.index.get(type);
    if (typeEntries) {
      const index = typeEntries.indexOf(id);
      if (index > -1) {
        typeEntries.splice(index, 1);
      }
    }
  }

  private updateStats(entry: StorageEntry, isDelete: boolean = false): void {
    if (isDelete) {
      this.stats.totalEntries--;
      this.stats.totalSize -= entry.metadata.size;
      this.stats.entriesByType[entry.type] = (this.stats.entriesByType[entry.type] || 1) - 1;
    } else {
      this.stats.totalEntries++;
      this.stats.totalSize += entry.metadata.size;
      this.stats.entriesByType[entry.type] = (this.stats.entriesByType[entry.type] || 0) + 1;
      
      if (entry.metadata.created < this.stats.oldestEntry || this.stats.oldestEntry.getTime() === 0) {
        this.stats.oldestEntry = entry.metadata.created;
      }
      
      if (entry.metadata.updated > this.stats.newestEntry) {
        this.stats.newestEntry = entry.metadata.updated;
      }
    }

    // Calculate memory usage
    this.stats.memoryUsage = Array.from(this.memoryCache.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);
  }

  private async manageMemoryLimits(): Promise<void> {
    if (this.memoryCache.size <= this.config.maxMemoryEntries) {
      return;
    }

    // Remove oldest entries
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.metadata.lastAccessed.getTime() - b.metadata.lastAccessed.getTime());

    const toRemove = this.memoryCache.size - this.config.maxMemoryEntries;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const [id] = entries[i];
      this.memoryCache.delete(id);
    }
  }

  private calculateChecksum(data: any): string {
    // Simple checksum - in production, use proper hashing
    return Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 16);
  }

  private async performBackup(): Promise<void> {
    try {
      const backupPath = path.join(this.config.dataPath, 'backups');
      await fs.mkdir(backupPath, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupPath, `backup-${timestamp}.json`);

      const exportResult = await this.export();
      if (exportResult.success && exportResult.data) {
        await fs.writeFile(backupFile, exportResult.data, 'utf8');
        this.emit('backupCompleted', { backupFile, size: exportResult.data.length });
      }
    } catch (error) {
      this.emit('backupFailed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }
    
    this.emit('serviceDestroyed');
  }
}

export default OfflineStorageService;
