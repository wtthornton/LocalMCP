/**
 * Simple Cache Manager
 * 
 * Implements a 3-layer cache system: Memory → SQLite → Context7
 * for optimal performance and persistence in single-user Docker environment.
 */

import { Context7CacheService, type PatternCacheEntry, type MLCacheEntry } from './context7-cache.service.js';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { Logger } from '../logger/logger.js';

export interface CacheLayer {
  name: string;
  priority: number;
  ttl: number;
  maxEntries: number;
}

export interface CacheResult {
  data: any;
  layer: string;
  hit: boolean;
  timestamp: number;
}

export class SimpleCacheManagerService {
  private logger: Logger;
  private context7Cache: Context7CacheService;
  private sqlite: Database.Database;
  private memoryCache = new Map<string, any>();
  private cacheLayers: CacheLayer[];

  constructor(
    logger: Logger,
    context7Cache: Context7CacheService,
    sqliteDb: Database.Database
  ) {
    this.logger = logger;
    this.context7Cache = context7Cache;
    this.sqlite = sqliteDb;
    
    // Initialize cache layers with priorities (lower number = higher priority)
    this.cacheLayers = [
      { name: 'memory', priority: 1, ttl: 300000, maxEntries: 1000 }, // 5 minutes, 1000 entries
      { name: 'sqlite', priority: 2, ttl: 3600000, maxEntries: 10000 }, // 1 hour, 10k entries
      { name: 'context7', priority: 3, ttl: 86400000, maxEntries: 50000 } // 24 hours, 50k entries
    ];

    this.initializeSQLiteCache();
  }

  /**
   * Initialize SQLite cache tables
   */
  private initializeSQLiteCache(): void {
    try {
      // Create cache tables if they don't exist
      this.sqlite.exec(`
        CREATE TABLE IF NOT EXISTS cache_entries (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          type TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL,
          hits INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_cache_type ON cache_entries(type);
        CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON cache_entries(timestamp);
      `);
      
      this.logger.info('SQLite cache tables initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SQLite cache tables', { error });
      throw error;
    }
  }

  /**
   * Generate cache key from input parameters
   */
  private generateInternalCacheKey(type: string, ...params: any[]): string {
    const keyString = `${type}:${JSON.stringify(params)}`;
    return crypto.createHash('sha256').update(keyString).digest('hex').substring(0, 32);
  }

  /**
   * Get data from cache using 3-layer strategy
   */
  async get(type: string, ...params: any[]): Promise<CacheResult | null> {
    const key = this.generateInternalCacheKey(type, ...params);
    
    // Try each cache layer in priority order
    for (const layer of this.cacheLayers) {
      const result = await this.getFromLayer(layer.name, key, type);
      if (result) {
        this.logger.debug(`Cache hit on ${layer.name} layer`, { key, type });
        return {
          data: result,
          layer: layer.name,
          hit: true,
          timestamp: Date.now()
        };
      }
    }

    this.logger.debug('Cache miss on all layers', { key, type });
    return null;
  }

  /**
   * Get data from specific cache layer
   */
  private async getFromLayer(layerName: string, key: string, type: string): Promise<any | null> {
    switch (layerName) {
      case 'memory':
        return this.getFromMemory(key);
      
      case 'sqlite':
        return this.getFromSQLite(key, type);
      
      case 'context7':
        return await this.getFromContext7(key, type);
      
      default:
        return null;
    }
  }

  /**
   * Get data from memory cache
   */
  private getFromMemory(key: string): any | null {
    const entry = this.memoryCache.get(key);
    if (entry && this.isValidEntry(entry)) {
      entry.hits++;
      return entry.data;
    }
    
    if (entry && !this.isValidEntry(entry)) {
      this.memoryCache.delete(key);
    }
    
    return null;
  }

  /**
   * Get data from SQLite cache
   */
  private getFromSQLite(key: string, type: string): any | null {
    try {
      const stmt = this.sqlite.prepare(`
        SELECT data, timestamp, ttl, hits 
        FROM cache_entries 
        WHERE key = ? AND type = ?
      `);
      
      const row = stmt.get(key, type) as any;
      if (!row) return null;

      // Check if entry is still valid
      if (Date.now() - row.timestamp > row.ttl) {
        // Delete expired entry
        const deleteStmt = this.sqlite.prepare('DELETE FROM cache_entries WHERE key = ?');
        deleteStmt.run(key);
        return null;
      }

      // Update hit count
      const updateStmt = this.sqlite.prepare('UPDATE cache_entries SET hits = hits + 1 WHERE key = ?');
      updateStmt.run(key);

      return JSON.parse(row.data);
    } catch (error) {
      this.logger.error('Failed to get from SQLite cache', { error, key, type });
      return null;
    }
  }

  /**
   * Get data from Context7 cache
   */
  private async getFromContext7(key: string, type: string): Promise<any | null> {
    try {
      switch (type) {
        case 'patterns':
          return await this.context7Cache.getCachedPatterns(key);
        case 'ml':
          return await this.context7Cache.getCachedMLPredictions(key);
        case 'docs':
          return await this.context7Cache.getCachedDocs(key);
        default:
          return null;
      }
    } catch (error) {
      this.logger.error('Failed to get from Context7 cache', { error, key, type });
      return null;
    }
  }

  /**
   * Set data in cache using 3-layer strategy
   */
  async set(type: string, data: any, ttl?: number, ...params: any[]): Promise<void> {
    const key = this.generateInternalCacheKey(type, ...params);
    const layer = this.cacheLayers.find(l => l.name === 'memory')!;
    const cacheTTL = ttl || layer.ttl;

    // Store in all layers (memory, sqlite, context7)
    await Promise.all([
      this.setInMemory(key, data, cacheTTL),
      this.setInSQLite(key, type, data, cacheTTL),
      this.setInContext7(key, type, data, cacheTTL)
    ]);

    this.logger.debug(`Data cached in all layers`, { key, type });
  }

  /**
   * Set data in memory cache
   */
  private setInMemory(key: string, data: any, ttl: number): void {
    // Implement LRU eviction if needed
    if (this.memoryCache.size >= 1000) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  /**
   * Set data in SQLite cache
   */
  private setInSQLite(key: string, type: string, data: any, ttl: number): void {
    try {
      const stmt = this.sqlite.prepare(`
        INSERT OR REPLACE INTO cache_entries (key, data, type, timestamp, ttl, hits)
        VALUES (?, ?, ?, ?, ?, 0)
      `);
      
      stmt.run(key, JSON.stringify(data), type, Date.now(), ttl);
    } catch (error) {
      this.logger.error('Failed to set in SQLite cache', { error, key, type });
    }
  }

  /**
   * Set data in Context7 cache
   */
  private async setInContext7(key: string, type: string, data: any, ttl: number): Promise<void> {
    try {
      switch (type) {
        case 'patterns':
          await this.context7Cache.cachePatterns(key, data.patterns || data, data.successRate || 0);
          break;
        case 'ml':
          await this.context7Cache.cacheMLPredictions(key, data.predictions || data, data.confidence || 0);
          break;
        case 'docs':
          // For docs, we need libraryId and docs content
          if (data.libraryId && data.docs) {
            await this.context7Cache.cacheDocs(key, data.libraryId, data.docs);
          }
          break;
      }
    } catch (error) {
      this.logger.error('Failed to set in Context7 cache', { error, key, type });
    }
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry(entry: any): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clear expired entries from all layers
   */
  async clearExpiredEntries(): Promise<void> {
    // Clear memory cache expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValidEntry(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear SQLite expired entries
    try {
      const stmt = this.sqlite.prepare('DELETE FROM cache_entries WHERE timestamp + ttl < ?');
      stmt.run(Date.now());
    } catch (error) {
      this.logger.error('Failed to clear expired SQLite entries', { error });
    }

    // Clear Context7 expired entries
    this.context7Cache.clearAllExpiredEntries();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memory: { size: number };
    sqlite: { size: number };
    context7: any;
  } {
    return {
      memory: { size: this.memoryCache.size },
      sqlite: { 
        size: this.sqlite.prepare('SELECT COUNT(*) as count FROM cache_entries').get() as any
      },
      context7: this.context7Cache.getCacheStats()
    };
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      this.sqlite.exec('DELETE FROM cache_entries');
    } catch (error) {
      this.logger.error('Failed to clear SQLite cache', { error });
    }
    
    this.context7Cache.clearCache();
    
    this.logger.info('All caches cleared');
  }

  /**
   * Generate cache key (public method)
   */
  generateCacheKey(prompt: string, context?: any): string {
    const combinedString = `${prompt}-${JSON.stringify(context || {})}`;
    return crypto.createHash('sha256').update(combinedString).digest('hex');
  }

  /**
   * Get cached result (public method)
   */
  async getCachedResult(key: string): Promise<any | null> {
    // 1. Check in-memory Context7 cache (includes pattern and ML caches)
    const context7Result = await this.context7Cache.getCachedDocs(key);
    if (context7Result) return context7Result;

    const patternResult = await this.context7Cache.getCachedPatterns(key);
    if (patternResult) return patternResult;

    const mlResult = await this.context7Cache.getCachedMLPredictions(key);
    if (mlResult) return mlResult;

    // 2. Check SQLite cache (for more persistent results, e.g., full enhanced prompts)
    try {
      const stmt = this.sqlite.prepare('SELECT enhanced_prompt FROM prompt_cache WHERE key = ? AND expires_at > ?');
      const row = stmt.get(key, Date.now()) as any;
      if (row) return JSON.parse(row.enhanced_prompt);
    } catch (error) {
      // SQLite might not have the expected schema
    }

    return null;
  }

  /**
   * Cache result (public method)
   */
  async cacheResult(key: string, result: any, type: 'context7' | 'pattern' | 'ml' | 'prompt'): Promise<void> {
    switch (type) {
      case 'context7':
        await this.context7Cache.cacheDocs(key, result.libraryId || key, result.docs || result);
        break;
      case 'pattern':
        await this.context7Cache.cachePatterns(key, result.patterns || result, result.successRate || 0.8);
        break;
      case 'ml':
        await this.context7Cache.cacheMLPredictions(key, result.predictions || result, result.confidence || 0.8);
        break;
      case 'prompt':
        try {
          const stmt = this.sqlite.prepare(`
            INSERT OR REPLACE INTO prompt_cache (key, original_prompt, enhanced_prompt, context, timestamp, ttl, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            key,
            result.originalPrompt || '',
            JSON.stringify(result),
            JSON.stringify(result.context || {}),
            Date.now(),
            3600000, // 1 hour TTL
            Date.now() + 3600000
          );
        } catch (error) {
          // SQLite might not have the expected schema
        }
        break;
      default:
        console.warn(`Unknown cache type: ${type}`);
    }
  }
}
