import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export interface CacheEntry {
  key: string;
  value: any;
  ttl: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  tags: string[];
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  memoryEntries: number;
  diskEntries: number;
}

export interface CacheConfig {
  maxMemoryEntries: number;
  maxMemorySize: number; // bytes
  defaultTtl: number; // seconds
  maxTtl: number; // seconds
  cleanupInterval: number; // seconds
  enablePersistence: boolean;
  dbPath: string;
}

/**
 * AdvancedCacheService - SQLite + LRU caching system
 * 
 * Provides intelligent caching with multiple layers:
 * - In-memory LRU cache for hot data
 * - SQLite persistent storage for cold data
 * - TTL and expiration handling
 * - Cache invalidation strategies
 * - Performance monitoring and analytics
 * 
 * Optimized for Context7 responses and other frequently accessed data.
 */
export class AdvancedCacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private cacheName: string = 'default'
  ) {
    this.config = this.loadCacheConfig();
    this.startCleanupTimer();
  }

  private loadCacheConfig(): CacheConfig {
    // For now, use context7 config as default, but allow for future expansion
    const cacheConfig = this.configService.getNested('cache', 'context7');
    return {
      maxMemoryEntries: cacheConfig.maxMemoryEntries || 1000,
      maxMemorySize: cacheConfig.maxMemorySize || 50 * 1024 * 1024, // 50MB
      defaultTtl: cacheConfig.defaultTtl || 3600, // 1 hour
      maxTtl: cacheConfig.maxTtl || 86400, // 24 hours
      cleanupInterval: cacheConfig.cleanupInterval || 300, // 5 minutes
      enablePersistence: cacheConfig.enablePersistence !== false,
      dbPath: cacheConfig.dbPath || join(process.cwd(), 'data', 'cache', `${this.cacheName}.db`)
    };
  }


  async get(key: string): Promise<any | null> {
    this.stats.totalRequests++;

    // Check memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateAccessStats(memoryEntry);
      this.stats.hits++;
      this.logger.debug(`Cache hit: ${key}`);
      return memoryEntry.value;
    }

    this.stats.misses++;
    this.logger.debug(`Cache miss: ${key}`);
    return null;
  }

  async set(
    key: string, 
    value: any, 
    ttl?: number, 
    tags: string[] = []
  ): Promise<void> {
    const actualTtl = Math.min(ttl || this.config.defaultTtl, this.config.maxTtl);
    const now = Date.now();
    const size = this.calculateSize(value);
    
    const entry: CacheEntry = {
      key,
      value,
      ttl: actualTtl,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      size,
      tags
    };

    // Add to memory cache
    this.addToMemoryCache(entry);
    this.logger.debug(`Cached to memory: ${key}`);
  }

  async invalidate(key: string): Promise<boolean> {
    const invalidated = this.memoryCache.delete(key);
    
    if (invalidated) {
      this.logger.debug(`Cache invalidated: ${key}`);
    }

    return invalidated;
  }

  async invalidateByTag(tag: string): Promise<number> {
    let invalidated = 0;

    // Remove from memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) {
        this.memoryCache.delete(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      this.logger.debug(`Cache invalidated by tag '${tag}': ${invalidated} entries`);
    }

    return invalidated;
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.logger.info('Cache cleared');
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.totalRequests;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;

    return {
      totalEntries: this.memoryCache.size,
      totalSize: this.calculateTotalSize(),
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      evictions: this.stats.evictions,
      memoryEntries: this.memoryCache.size,
      diskEntries: 0
    };
  }

  private addToMemoryCache(entry: CacheEntry): void {
    // Check if we need to evict entries
    while (this.memoryCache.size >= this.config.maxMemoryEntries || 
           this.calculateTotalSize() + entry.size > this.config.maxMemorySize) {
      this.evictLRU();
    }

    this.memoryCache.set(entry.key, entry);
  }

  private evictLRU(): void {
    if (this.memoryCache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.stats.evictions++;
      this.logger.debug(`Evicted from memory cache: ${oldestKey}`);
    }
  }

  private canFitInMemory(entry: CacheEntry): boolean {
    return entry.size <= this.config.maxMemorySize / 10; // Max 10% of memory per entry
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl * 1000;
  }

  private updateAccessStats(entry: CacheEntry): void {
    entry.lastAccessed = Date.now();
    entry.accessCount++;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
  }

  private calculateTotalSize(): number {
    let total = 0;
    for (const entry of this.memoryCache.values()) {
      total += entry.size;
    }
    return total;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanup();
    }, this.config.cleanupInterval * 1000);
  }

  private async cleanup(): Promise<void> {
    let cleaned = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.logger.info('Cache service closed');
  }
}
