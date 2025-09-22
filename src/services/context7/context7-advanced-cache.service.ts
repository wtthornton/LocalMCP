/**
 * Context7 Advanced Caching Service
 * Implements multi-level caching with SQLite performance optimizations
 * Based on SQLite best practices and TypeScript type safety
 */

import Database from 'better-sqlite3';
import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { Context7MonitoringService } from './context7-monitoring.service.js';

export interface Context7CacheEntry {
  key: string;
  data: string;
  timestamp: number;
  ttl: number;
  hits: number;
  libraryId: string;
  topic: string;
  tokens: number;
  compressed: boolean;
  metadata: {
    size: number;
    contentType: string;
    version: string;
  };
}

export interface Context7CacheStats {
  memory: {
    size: number;
    maxSize: number;
    hitRate: number;
    evictions: number;
  };
  sqlite: {
    size: number;
    hitRate: number;
    totalEntries: number;
    avgEntrySize: number;
  };
  performance: {
    avgGetTime: number;
    avgSetTime: number;
    compressionRatio: number;
  };
}

export interface Context7CacheConfig {
  memory: {
    maxEntries: number;
    maxSizeBytes: number;
    cleanupInterval: number;
  };
  sqlite: {
    path: string;
    pageSize: number;
    cacheSize: number;
    journalMode: 'WAL' | 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'OFF';
    synchronous: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
  };
  compression: {
    enabled: boolean;
    threshold: number; // bytes
    algorithm: 'gzip' | 'brotli';
  };
  ttl: {
    default: number;
    byTopic: Record<string, number>;
    maxAge: number;
  };
}

export class Context7AdvancedCacheService {
  private logger: Logger;
  private config: ConfigService;
  private monitoring: Context7MonitoringService;
  private memoryCache: Map<string, Context7CacheEntry> = new Map();
  private sqliteCache!: Database.Database;
  private cacheConfig: Context7CacheConfig;
  private cleanupInterval?: NodeJS.Timeout;
  private stats = {
    memoryHits: 0,
    sqliteHits: 0,
    misses: 0,
    evictions: 0,
    getTimes: [] as number[],
    setTimes: [] as number[],
    compressedSize: 0,
    originalSize: 0
  };

  constructor(
    logger: Logger, 
    config: ConfigService, 
    monitoring: Context7MonitoringService
  ) {
    this.logger = logger;
    this.config = config;
    this.monitoring = monitoring;
    this.cacheConfig = this.initializeCacheConfig();
    this.initializeSQLiteCache();
    this.startCleanupProcess();
  }

  /**
   * Initialize cache configuration
   * Implements SQLite performance best practices
   */
  private initializeCacheConfig(): Context7CacheConfig {
    return {
      memory: {
        maxEntries: 1000,
        maxSizeBytes: 50 * 1024 * 1024, // 50MB
        cleanupInterval: 5 * 60 * 1000 // 5 minutes
      },
      sqlite: {
        path: 'context7-cache.db',
        pageSize: 4096,
        cacheSize: -2000, // 2MB cache
        journalMode: 'WAL', // Write-Ahead Logging for better concurrency
        synchronous: 'NORMAL' // Balance between safety and performance
      },
      compression: {
        enabled: true,
        threshold: 1024, // Compress entries > 1KB
        algorithm: 'gzip'
      },
      ttl: {
        default: 4 * 60 * 60 * 1000, // 4 hours
        byTopic: {
          'best practices': 24 * 60 * 60 * 1000, // 24 hours
          'api': 12 * 60 * 60 * 1000, // 12 hours
          'components': 6 * 60 * 60 * 1000, // 6 hours
          'troubleshooting': 2 * 60 * 60 * 1000, // 2 hours
          'examples': 3 * 60 * 60 * 1000 // 3 hours
        },
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days max
      }
    };
  }

  /**
   * Initialize SQLite cache with performance optimizations
   * Implements SQLite best practices from Context7 documentation
   */
  private initializeSQLiteCache(): void {
    try {
      this.sqliteCache = new Database(this.cacheConfig.sqlite.path);
      
      // Configure SQLite for optimal performance
      this.sqliteCache.pragma('page_size = ' + this.cacheConfig.sqlite.pageSize);
      this.sqliteCache.pragma('cache_size = ' + this.cacheConfig.sqlite.cacheSize);
      this.sqliteCache.pragma('journal_mode = ' + this.cacheConfig.sqlite.journalMode);
      this.sqliteCache.pragma('synchronous = ' + this.cacheConfig.sqlite.synchronous);
      this.sqliteCache.pragma('temp_store = memory');
      this.sqliteCache.pragma('mmap_size = 268435456'); // 256MB
      
      // Create optimized table with indexes
      this.sqliteCache.exec(`
        CREATE TABLE IF NOT EXISTS context7_cache (
          key TEXT PRIMARY KEY,
          data BLOB NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL,
          hits INTEGER DEFAULT 0,
          library_id TEXT NOT NULL,
          topic TEXT NOT NULL,
          tokens INTEGER NOT NULL,
          compressed BOOLEAN DEFAULT 0,
          metadata TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        -- Performance indexes based on SQLite best practices
        CREATE INDEX IF NOT EXISTS idx_timestamp ON context7_cache(timestamp);
        CREATE INDEX IF NOT EXISTS idx_library_topic ON context7_cache(library_id, topic);
        CREATE INDEX IF NOT EXISTS idx_hits ON context7_cache(hits);
        CREATE INDEX IF NOT EXISTS idx_ttl ON context7_cache(ttl);
        CREATE INDEX IF NOT EXISTS idx_compressed ON context7_cache(compressed);
        
        -- Partial index for active entries (not expired)
        CREATE INDEX IF NOT EXISTS idx_active ON context7_cache(key) 
        WHERE timestamp + ttl > strftime('%s', 'now') * 1000;
        
        -- Analyze table for query optimization
        ANALYZE context7_cache;
      `);
      
      this.logger.info('SQLite cache initialized with performance optimizations', {
        path: this.cacheConfig.sqlite.path,
        pageSize: this.cacheConfig.sqlite.pageSize,
        cacheSize: this.cacheConfig.sqlite.cacheSize,
        journalMode: this.cacheConfig.sqlite.journalMode
      });
    } catch (error) {
      this.logger.error('Failed to initialize SQLite cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: this.cacheConfig.sqlite.path
      });
      throw error;
    }
  }

  /**
   * Get cached documentation with multi-level lookup
   * Implements optimized cache retrieval
   */
  async getCachedDocumentation(
    libraryId: string,
    topic: string,
    tokens: number
  ): Promise<string | null> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(libraryId, topic, tokens);
    
    try {
      // Level 1: Memory cache (fastest)
      const memoryEntry = this.memoryCache.get(cacheKey);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        memoryEntry.hits++;
        this.stats.memoryHits++;
        this.monitoring.recordCacheHit();
        
        const duration = Date.now() - startTime;
        this.recordGetTime(duration);
        
        this.logger.debug('Cache hit (memory)', {
          cacheKey,
          hits: memoryEntry.hits,
          age: Date.now() - memoryEntry.timestamp,
          size: memoryEntry.metadata.size
        });
        
        return this.decompressData(memoryEntry.data, memoryEntry.compressed);
      }
      
      // Level 2: SQLite cache (persistent)
      const sqliteEntry = await this.getFromSQLite(cacheKey);
      if (sqliteEntry && !this.isExpired(sqliteEntry)) {
        // Promote to memory cache
        this.memoryCache.set(cacheKey, sqliteEntry);
        this.stats.sqliteHits++;
        this.monitoring.recordCacheHit();
        
        const duration = Date.now() - startTime;
        this.recordGetTime(duration);
        
        this.logger.debug('Cache hit (SQLite)', {
          cacheKey,
          hits: sqliteEntry.hits,
          age: Date.now() - sqliteEntry.timestamp,
          size: sqliteEntry.metadata.size
        });
        
        return this.decompressData(sqliteEntry.data, sqliteEntry.compressed);
      }
      
      // Cache miss
      this.stats.misses++;
      this.monitoring.recordCacheMiss();
      
      const duration = Date.now() - startTime;
      this.recordGetTime(duration);
      
      this.logger.debug('Cache miss', {
        cacheKey,
        libraryId,
        topic,
        tokens
      });
      
      return null;
    } catch (error) {
      this.logger.error('Cache retrieval failed', {
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Set cached documentation with compression and optimization
   * Implements intelligent caching strategy
   */
  async setCachedDocumentation(
    libraryId: string,
    topic: string,
    tokens: number,
    data: string
  ): Promise<void> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(libraryId, topic, tokens);
    
    try {
      const shouldCompress = this.shouldCompress(data);
      const compressedData = shouldCompress ? await this.compressData(data) : data;
      const ttl = this.calculateTTL(topic);
      
      const entry: Context7CacheEntry = {
        key: cacheKey,
        data: compressedData,
        timestamp: Date.now(),
        ttl,
        hits: 0,
        libraryId,
        topic,
        tokens,
        compressed: shouldCompress,
        metadata: {
          size: data.length,
          contentType: 'application/json',
          version: '1.0'
        }
      };
      
      // Store in memory cache
      this.memoryCache.set(cacheKey, entry);
      
      // Store in SQLite cache
      await this.storeInSQLite(entry);
      
      // Update compression stats
      if (shouldCompress) {
        this.stats.compressedSize += compressedData.length;
        this.stats.originalSize += data.length;
      }
      
      const duration = Date.now() - startTime;
      this.recordSetTime(duration);
      
      this.logger.debug('Documentation cached', {
        cacheKey,
        ttl,
        compressed: shouldCompress,
        originalSize: data.length,
        compressedSize: compressedData.length,
        compressionRatio: shouldCompress ? 
          (1 - compressedData.length / data.length) * 100 : 0
      });
      
    } catch (error) {
      this.logger.error('Cache storage failed', {
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Set cache entry (alias for setCachedDocumentation)
   */
  set(key: string, value: string, ttl?: number, metadata?: any): void {
    this.setCachedDocumentation(key, 'general', 1000, value);
  }

  /**
   * Get cache entry (alias for getCachedDocumentation)
   */
  get(key: string): Context7CacheEntry | null {
    // This is a simplified implementation - in practice, you'd need to store the full entry
    return null; // Simplified for now
  }

  /**
   * Get cache statistics (alias for getCacheStats)
   */
  getStats(): Context7CacheStats {
    return this.getCacheStats();
  }

  /**
   * Get cache statistics
   * Implements comprehensive cache monitoring
   */
  getCacheStats(): Context7CacheStats {
    const memoryEntries = Array.from(this.memoryCache.values());
    const memorySize = memoryEntries.reduce((sum, entry) => sum + entry.metadata.size, 0);
    const memoryHitRate = (this.stats.memoryHits + this.stats.sqliteHits) > 0 
      ? (this.stats.memoryHits / (this.stats.memoryHits + this.stats.sqliteHits)) * 100 
      : 0;
    
    const sqliteHitRate = (this.stats.memoryHits + this.stats.sqliteHits + this.stats.misses) > 0
      ? ((this.stats.memoryHits + this.stats.sqliteHits) / (this.stats.memoryHits + this.stats.sqliteHits + this.stats.misses)) * 100
      : 0;
    
    const avgGetTime = this.stats.getTimes.length > 0
      ? this.stats.getTimes.reduce((sum, time) => sum + time, 0) / this.stats.getTimes.length
      : 0;
    
    const avgSetTime = this.stats.setTimes.length > 0
      ? this.stats.setTimes.reduce((sum, time) => sum + time, 0) / this.stats.setTimes.length
      : 0;
    
    const compressionRatio = this.stats.originalSize > 0
      ? (1 - this.stats.compressedSize / this.stats.originalSize) * 100
      : 0;
    
    return {
      memory: {
        size: memorySize,
        maxSize: this.cacheConfig.memory.maxSizeBytes,
        hitRate: memoryHitRate,
        evictions: this.stats.evictions
      },
      sqlite: {
        size: 0, // Would need to query actual SQLite size
        hitRate: sqliteHitRate,
        totalEntries: memoryEntries.length,
        avgEntrySize: memoryEntries.length > 0 ? memorySize / memoryEntries.length : 0
      },
      performance: {
        avgGetTime,
        avgSetTime,
        compressionRatio
      }
    };
  }

  /**
   * Generate enhanced cache key with versioning and context
   * Implements intelligent key generation for better cache efficiency
   */
  private generateCacheKey(libraryId: string, topic: string, tokens: number, context?: any): string {
    // Create a more sophisticated cache key that includes:
    // 1. Library ID (normalized)
    // 2. Topic (normalized and hashed for long topics)
    // 3. Token count (rounded to nearest 100 for better hit rates)
    // 4. Context hash (if provided)
    // 5. Version identifier
    
    const normalizedLibraryId = libraryId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const normalizedTopic = this.normalizeTopic(topic);
    const roundedTokens = Math.round(tokens / 100) * 100; // Round to nearest 100
    const contextHash = context ? this.generateContextHash(context) : '';
    const version = this.getCacheVersion();
    
    const keyParts = [
      'ctx7',
      version,
      normalizedLibraryId,
      normalizedTopic,
      roundedTokens.toString()
    ];
    
    if (contextHash) {
      keyParts.push(contextHash);
    }
    
    return keyParts.join(':');
  }

  /**
   * Normalize topic for consistent cache keys
   */
  private normalizeTopic(topic: string): string {
    if (!topic || topic === 'default') return 'default';
    
    // For long topics, create a hash
    if (topic.length > 50) {
      return this.hashString(topic).substring(0, 8);
    }
    
    // Normalize short topics
    return topic.toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 20);
  }

  /**
   * Generate context hash for cache key
   */
  private generateContextHash(context: any): string {
    if (!context) return '';
    
    // Create a stable hash from context object
    const contextStr = JSON.stringify(context, Object.keys(context).sort());
    return this.hashString(contextStr).substring(0, 8);
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cache version for invalidation
   */
  private getCacheVersion(): string {
    return 'v1'; // Increment this when cache structure changes
  }

  /**
   * Smart cache invalidation based on patterns and dependencies
   * Implements intelligent cache management
   */
  async invalidateCache(pattern?: string, libraryId?: string): Promise<number> {
    let invalidatedCount = 0;
    
    try {
      if (pattern) {
        // Invalidate by pattern (e.g., all React-related docs)
        invalidatedCount += await this.invalidateByPattern(pattern);
      } else if (libraryId) {
        // Invalidate specific library
        invalidatedCount += await this.invalidateByLibrary(libraryId);
      } else {
        // Invalidate expired entries
        invalidatedCount += await this.invalidateExpired();
      }
      
      this.logger.debug('Cache invalidation completed', {
        pattern,
        libraryId,
        invalidatedCount
      });
      
      return invalidatedCount;
    } catch (error) {
      this.logger.error('Cache invalidation failed', {
        pattern,
        libraryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  private async invalidateByPattern(pattern: string): Promise<number> {
    let count = 0;
    
    // Invalidate memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (key.includes(pattern) || entry.libraryId.includes(pattern)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    
    // Invalidate SQLite cache
    try {
      const stmt = this.sqliteCache.prepare(`
        DELETE FROM context7_cache 
        WHERE key LIKE ? OR library_id LIKE ?
      `);
      const result = stmt.run(`%${pattern}%`, `%${pattern}%`);
      count += result.changes;
    } catch (error) {
      this.logger.warn('SQLite pattern invalidation failed', { pattern, error });
    }
    
    return count;
  }

  /**
   * Invalidate cache entries by library ID
   */
  private async invalidateByLibrary(libraryId: string): Promise<number> {
    let count = 0;
    
    // Invalidate memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.libraryId === libraryId) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    
    // Invalidate SQLite cache
    try {
      const stmt = this.sqliteCache.prepare(`
        DELETE FROM context7_cache WHERE library_id = ?
      `);
      const result = stmt.run(libraryId);
      count += result.changes;
    } catch (error) {
      this.logger.warn('SQLite library invalidation failed', { libraryId, error });
    }
    
    return count;
  }

  /**
   * Invalidate expired cache entries
   */
  private async invalidateExpired(): Promise<number> {
    let count = 0;
    const now = Date.now();
    
    // Invalidate memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    
    // Invalidate SQLite cache
    try {
      const stmt = this.sqliteCache.prepare(`
        DELETE FROM context7_cache 
        WHERE timestamp + ttl < ?
      `);
      const result = stmt.run(now);
      count += result.changes;
    } catch (error) {
      this.logger.warn('SQLite expired invalidation failed', { error });
    }
    
    return count;
  }

  /**
   * Warm cache with frequently accessed data
   * Implements cache warming strategy
   */
  async warmCache(libraryIds: string[], topics: string[] = ['default']): Promise<void> {
    this.logger.info('Starting cache warming', { libraryIds, topics });
    
    for (const libraryId of libraryIds) {
      for (const topic of topics) {
        try {
          // Pre-fetch common token amounts
          const tokenAmounts = [1000, 2000, 4000];
          
          for (const tokens of tokenAmounts) {
            const key = this.generateCacheKey(libraryId, topic, tokens);
            
            // Check if already cached
            if (this.memoryCache.has(key) || await this.getFromSQLite(key)) {
              continue;
            }
            
            // This would trigger a fetch - for now just log
            this.logger.debug('Cache warming entry', { libraryId, topic, tokens });
          }
        } catch (error) {
          this.logger.warn('Cache warming failed for entry', {
            libraryId,
            topic,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    this.logger.info('Cache warming completed', { libraryIds, topics });
  }

  /**
   * Check if cache entry is expired
   * Implements TTL checking
   */
  private isExpired(entry: Context7CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > entry.ttl;
  }

  /**
   * Calculate TTL based on topic
   * Implements intelligent TTL strategy
   */
  private calculateTTL(topic: string): number {
    const topicLower = topic.toLowerCase();
    const topicTTL = this.cacheConfig.ttl.byTopic[topicLower];
    
    if (topicTTL) {
      return Math.min(topicTTL, this.cacheConfig.ttl.maxAge);
    }
    
    return Math.min(this.cacheConfig.ttl.default, this.cacheConfig.ttl.maxAge);
  }

  /**
   * Determine if data should be compressed
   * Implements compression strategy
   */
  private shouldCompress(data: string): boolean {
    return this.cacheConfig.compression.enabled && 
           data.length > this.cacheConfig.compression.threshold;
  }

  /**
   * Compress data using configured algorithm
   * Implements data compression
   */
  private async compressData(data: string): Promise<string> {
    // This would implement actual compression
    // For now, return data as-is (placeholder)
    return data;
  }

  /**
   * Decompress data if needed
   * Implements data decompression
   */
  private async decompressData(data: string, compressed: boolean): Promise<string> {
    if (!compressed) {
      return data;
    }
    
    // This would implement actual decompression
    // For now, return data as-is (placeholder)
    return data;
  }

  /**
   * Get entry from SQLite cache
   * Implements optimized SQLite retrieval
   */
  private async getFromSQLite(cacheKey: string): Promise<Context7CacheEntry | null> {
    try {
      const stmt = this.sqliteCache.prepare(`
        SELECT key, data, timestamp, ttl, hits, library_id, topic, tokens, compressed, metadata
        FROM context7_cache 
        WHERE key = ? AND timestamp + ttl > ?
      `);
      
      const row = stmt.get(cacheKey, Date.now()) as any;
      if (!row) return null;
      
      // Update hit count
      const updateStmt = this.sqliteCache.prepare(`
        UPDATE context7_cache 
        SET hits = hits + 1, updated_at = strftime('%s', 'now')
        WHERE key = ?
      `);
      updateStmt.run(cacheKey);
      
      return {
        key: row.key,
        data: row.data,
        timestamp: row.timestamp,
        ttl: row.ttl,
        hits: row.hits + 1,
        libraryId: row.library_id,
        topic: row.topic,
        tokens: row.tokens,
        compressed: Boolean(row.compressed),
        metadata: JSON.parse(row.metadata)
      };
    } catch (error) {
      this.logger.error('SQLite cache retrieval failed', {
        cacheKey,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Store entry in SQLite cache
   * Implements optimized SQLite storage
   */
  private async storeInSQLite(entry: Context7CacheEntry): Promise<void> {
    try {
      const stmt = this.sqliteCache.prepare(`
        INSERT OR REPLACE INTO context7_cache 
        (key, data, timestamp, ttl, hits, library_id, topic, tokens, compressed, metadata, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);
      
      stmt.run(
        entry.key,
        entry.data,
        entry.timestamp,
        entry.ttl,
        entry.hits,
        entry.libraryId,
        entry.topic,
        entry.tokens,
        entry.compressed ? 1 : 0,
        JSON.stringify(entry.metadata)
      );
    } catch (error) {
      this.logger.error('SQLite cache storage failed', {
        cacheKey: entry.key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Record get operation timing
   * Implements performance monitoring
   */
  private recordGetTime(time: number): void {
    this.stats.getTimes.push(time);
    if (this.stats.getTimes.length > 100) {
      this.stats.getTimes = this.stats.getTimes.slice(-100);
    }
  }

  /**
   * Record set operation timing
   * Implements performance monitoring
   */
  private recordSetTime(time: number): void {
    this.stats.setTimes.push(time);
    if (this.stats.setTimes.length > 100) {
      this.stats.setTimes = this.stats.setTimes.slice(-100);
    }
  }

  /**
   * Start cleanup process
   * Implements automatic cache maintenance
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.cacheConfig.memory.cleanupInterval);
  }

  /**
   * Perform cache cleanup
   * Implements LRU eviction and expired entry removal
   */
  private performCleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    const entries = Array.from(this.memoryCache.entries());
    
    // Remove expired entries
    for (const [key, entry] of entries) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.memoryCache.delete(key));
    
    // LRU eviction if over limit
    if (this.memoryCache.size > this.cacheConfig.memory.maxEntries) {
      const sortedEntries = entries
        .filter(([key]) => !expiredKeys.includes(key))
        .sort((a, b) => a[1].hits - b[1].hits);
      
      const toEvict = sortedEntries.slice(0, this.memoryCache.size - this.cacheConfig.memory.maxEntries);
      toEvict.forEach(([key]) => {
        this.memoryCache.delete(key);
        this.stats.evictions++;
        this.monitoring.recordCacheEviction();
      });
    }
    
    // Clean up SQLite expired entries
    this.cleanupSQLiteExpired();
    
    if (expiredKeys.length > 0 || this.stats.evictions > 0) {
      this.logger.debug('Cache cleanup completed', {
        expiredRemoved: expiredKeys.length,
        evicted: this.stats.evictions,
        remaining: this.memoryCache.size
      });
    }
  }

  /**
   * Clean up expired SQLite entries
   * Implements SQLite maintenance
   */
  private cleanupSQLiteExpired(): void {
    try {
      const stmt = this.sqliteCache.prepare(`
        DELETE FROM context7_cache 
        WHERE timestamp + ttl <= ?
      `);
      
      const result = stmt.run(Date.now());
      
      if (result.changes > 0) {
        this.logger.debug('SQLite expired entries cleaned up', {
          removed: result.changes
        });
      }
    } catch (error) {
      this.logger.error('SQLite cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Destroy cache service
   * Implements proper cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.sqliteCache) {
      this.sqliteCache.close();
    }
    
    this.memoryCache.clear();
    this.logger.info('Context7 advanced cache service destroyed');
  }

  /**
   * Cache Context7 library resolution results
   */
  cacheLibraryResolution(libraryName: string, libraryInfo: any[]): void {
    const key = `context7:resolve:${libraryName}`;
    const ttl = 24 * 60 * 60 * 1000; // 24 hours
    
    this.set(key, JSON.stringify(libraryInfo), ttl, {
      libraryId: libraryName,
      topic: 'resolution',
      tokens: 0,
      compressed: false,
      metadata: {
        size: JSON.stringify(libraryInfo).length,
        contentType: 'application/json',
        version: '1.0'
      }
    });
    
    this.logger.debug('Library resolution cached', { libraryName, resultsCount: libraryInfo.length });
  }

  /**
   * Cache Context7 content extraction results
   */
  cacheContentExtraction(libraryId: string, framework: string, extractionType: string, content: any[]): void {
    const key = `context7:extract:${libraryId}:${framework}:${extractionType}`;
    const ttl = 6 * 60 * 60 * 1000; // 6 hours
    
    this.set(key, JSON.stringify(content), ttl, {
      libraryId,
      topic: `extraction:${extractionType}`,
      tokens: 0,
      compressed: false,
      metadata: {
        size: JSON.stringify(content).length,
        contentType: 'application/json',
        version: '1.0'
      }
    });
    
    this.logger.debug('Content extraction cached', { 
      libraryId, 
      framework, 
      extractionType, 
      contentCount: content.length 
    });
  }

  /**
   * Cache Context7 metadata
   */
  cacheMetadata(libraryId: string, metadata: any): void {
    const key = `context7:metadata:${libraryId}`;
    const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    this.set(key, JSON.stringify(metadata), ttl, {
      libraryId,
      topic: 'metadata',
      tokens: 0,
      compressed: false,
      metadata: {
        size: JSON.stringify(metadata).length,
        contentType: 'application/json',
        version: '1.0'
      }
    });
    
    this.logger.debug('Metadata cached', { libraryId, metadataKeys: Object.keys(metadata) });
  }

  /**
   * Get cached library resolution
   */
  getCachedLibraryResolution(libraryName: string): any[] | null {
    const key = `context7:resolve:${libraryName}`;
    const cached = this.get(key);
    
    if (cached) {
      try {
        return JSON.parse(cached.data);
      } catch (error) {
        this.logger.warn('Failed to parse cached library resolution', { libraryName, error });
        return null;
      }
    }
    
    return null;
  }

  /**
   * Get cached content extraction
   */
  getCachedContentExtraction(libraryId: string, framework: string, extractionType: string): any[] | null {
    const key = `context7:extract:${libraryId}:${framework}:${extractionType}`;
    const cached = this.get(key);
    
    if (cached) {
      try {
        return JSON.parse(cached.data);
      } catch (error) {
        this.logger.warn('Failed to parse cached content extraction', { 
          libraryId, 
          framework, 
          extractionType, 
          error 
        });
        return null;
      }
    }
    
    return null;
  }

  /**
   * Get cached metadata
   */
  getCachedMetadata(libraryId: string): any | null {
    const key = `context7:metadata:${libraryId}`;
    const cached = this.get(key);
    
    if (cached) {
      try {
        return JSON.parse(cached.data);
      } catch (error) {
        this.logger.warn('Failed to parse cached metadata', { libraryId, error });
        return null;
      }
    }
    
    return null;
  }

  /**
   * Get Context7-specific cache statistics
   */
  getContext7CacheStats(): {
    libraryResolutions: number;
    contentExtractions: number;
    metadataEntries: number;
    totalHits: number;
    hitRate: number;
  } {
    const stats = this.getStats();
    const context7Keys = Array.from(this.memoryCache.keys()).filter(key => key.startsWith('context7:'));
    
    let libraryResolutions = 0;
    let contentExtractions = 0;
    let metadataEntries = 0;
    let totalHits = 0;
    
    for (const key of context7Keys) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        totalHits += entry.hits;
        
        if (key.includes(':resolve:')) {
          libraryResolutions++;
        } else if (key.includes(':extract:')) {
          contentExtractions++;
        } else if (key.includes(':metadata:')) {
          metadataEntries++;
        }
      }
    }
    
    const hitRate = (stats.memory.hitRate + stats.sqlite.hitRate) / 2;
    
    return {
      libraryResolutions,
      contentExtractions,
      metadataEntries,
      totalHits,
      hitRate
    };
  }
}
