/**
 * Raw Context Cache Service
 * 
 * Manages caching of original, unprocessed context with short TTL (1-2 hours).
 * Used as source for AI summarization and fallback when summarized cache misses.
 */

import Database from 'better-sqlite3';
import { Logger } from '../logger/logger.js';
import type { RawContextCacheEntry, CacheStatistics, CachePerformanceMetrics } from './types/cache.types.js';
import { createHash } from 'crypto';

export class RawContextCacheService {
  private db: Database.Database;
  private memoryCache: Map<string, RawContextCacheEntry> = new Map();
  private readonly MEMORY_CACHE_SIZE = 1000;
  private readonly DEFAULT_TTL = 2 * 60 * 60 * 1000; // 2 hours
  private logger: Logger;
  private stats: CachePerformanceMetrics;

  constructor(dbPath: string, logger?: Logger) {
    this.logger = logger || new Logger('RawContextCacheService');
    this.db = new Database(dbPath);
    this.stats = {
      hitRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      tokenSavings: 0,
      memoryUsage: 0,
      evictionCount: 0,
      lastCleanup: new Date()
    };
    
    this.initializeDatabase();
  }

  /**
   * Initialize database tables and indexes
   */
  private initializeDatabase(): void {
    try {
      // Read and execute schema
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, 'schemas', 'raw-context-cache.schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      this.db.exec(schema);
      this.logger.info('Raw context cache database initialized');
    } catch (error) {
      this.logger.error('Failed to initialize raw context cache database', { error });
      throw error;
    }
  }

  /**
   * Get cached raw context entry
   */
  async get(key: string): Promise<RawContextCacheEntry | null> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Check memory cache first
      let entry = this.memoryCache.get(key);
      if (entry && !this.isExpired(entry)) {
        entry.accessCount++;
        entry.lastAccessed = new Date();
        this.updateStats(true, Date.now() - startTime);
        this.logger.debug('Raw context cache hit (memory)', { key, accessCount: entry.accessCount });
        return entry;
      }

      // Check database cache
      const stmt = this.db.prepare(`
        SELECT * FROM raw_context_cache 
        WHERE id = ? AND expires_at > datetime('now')
      `);
      
      const row = stmt.get(key) as any;
      if (row) {
        entry = this.mapRowToEntry(row);
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        // Update database
        const updateStmt = this.db.prepare(`
          UPDATE raw_context_cache 
          SET access_count = ?, last_accessed = CURRENT_TIMESTAMP 
          WHERE id = ?
        `);
        updateStmt.run(entry.accessCount, key);
        
        // Promote to memory cache
        this.promoteToMemory(key, entry);
        this.updateStats(true, Date.now() - startTime);
        this.logger.debug('Raw context cache hit (database)', { key, accessCount: entry.accessCount });
        return entry;
      }

      this.updateStats(false, Date.now() - startTime);
      this.logger.debug('Raw context cache miss', { key });
      return null;
    } catch (error) {
      this.logger.error('Failed to get raw context cache entry', { error, key });
      this.updateStats(false, Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set cached raw context entry
   */
  async set(key: string, entry: RawContextCacheEntry): Promise<void> {
    try {
      // Set memory cache
      this.memoryCache.set(key, entry);
      
      // Set database cache
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO raw_context_cache (
          id, project_signature, frameworks, repo_facts, context7_docs, 
          code_snippets, created_at, expires_at, access_count, last_accessed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        entry.id,
        entry.projectSignature,
        JSON.stringify(entry.frameworks),
        JSON.stringify(entry.repoFacts),
        JSON.stringify(entry.context7Docs),
        JSON.stringify(entry.codeSnippets),
        entry.createdAt.toISOString(),
        entry.expiresAt.toISOString(),
        entry.accessCount,
        entry.lastAccessed.toISOString()
      );

      this.logger.debug('Raw context cache entry set', { key, expiresAt: entry.expiresAt });
    } catch (error) {
      this.logger.error('Failed to set raw context cache entry', { error, key });
      throw error;
    }
  }

  /**
   * Invalidate cache entries by project signature
   */
  async invalidateByProjectSignature(projectSignature: string): Promise<void> {
    try {
      // Remove from memory cache
      const keysToRemove: string[] = [];
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.projectSignature === projectSignature) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => this.memoryCache.delete(key));

      // Remove from database
      const stmt = this.db.prepare(`
        DELETE FROM raw_context_cache 
        WHERE project_signature = ?
      `);
      const result = stmt.run(projectSignature);

      this.logger.info('Raw context cache invalidated by project signature', {
        projectSignature,
        memoryEntriesRemoved: keysToRemove.length,
        databaseEntriesRemoved: result.changes
      });
    } catch (error) {
      this.logger.error('Failed to invalidate raw context cache by project signature', { error, projectSignature });
      throw error;
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    try {
      const now = new Date();
      let memoryCleaned = 0;
      let databaseCleaned = 0;

      // Clean memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          memoryCleaned++;
        }
      }

      // Clean database cache
      const stmt = this.db.prepare(`
        DELETE FROM raw_context_cache 
        WHERE expires_at <= datetime('now')
      `);
      const result = stmt.run();
      databaseCleaned = result.changes;

      this.stats.evictionCount += memoryCleaned + databaseCleaned;
      this.stats.lastCleanup = now;

      this.logger.info('Raw context cache cleanup completed', {
        memoryCleaned,
        databaseCleaned,
        totalEvictions: this.stats.evictionCount
      });
    } catch (error) {
      this.logger.error('Failed to cleanup raw context cache', { error });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStatistics> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM cache_statistics 
        WHERE cache_type = 'raw' 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      const row = stmt.get() as any;
      if (row) {
        return {
          id: row.id,
          cacheType: 'raw',
          hitCount: row.hit_count,
          missCount: row.miss_count,
          totalRequests: row.total_requests,
          averageResponseTime: row.average_response_time,
          tokenSavings: row.token_savings,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };
      }

      // Return current stats if no database entry
      return {
        cacheType: 'raw',
        hitCount: Math.floor(this.stats.hitRate * this.stats.totalRequests),
        missCount: Math.floor((1 - this.stats.hitRate) * this.stats.totalRequests),
        totalRequests: this.stats.totalRequests,
        averageResponseTime: this.stats.averageResponseTime,
        tokenSavings: this.stats.tokenSavings,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      this.logger.error('Failed to get raw context cache statistics', { error });
      throw error;
    }
  }

  /**
   * Generate cache key from project signature and frameworks
   */
  generateKey(projectSignature: string, frameworks: string[]): string {
    const keyData = {
      projectSignature,
      frameworks: frameworks.sort()
    };
    return createHash('sha256').update(JSON.stringify(keyData)).digest('hex');
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: RawContextCacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * Map database row to cache entry
   */
  private mapRowToEntry(row: any): RawContextCacheEntry {
    return {
      id: row.id,
      projectSignature: row.project_signature,
      frameworks: JSON.parse(row.frameworks),
      repoFacts: JSON.parse(row.repo_facts),
      context7Docs: JSON.parse(row.context7_docs),
      codeSnippets: JSON.parse(row.code_snippets),
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      accessCount: row.access_count,
      lastAccessed: new Date(row.last_accessed)
    };
  }

  /**
   * Promote entry to memory cache
   */
  private promoteToMemory(key: string, entry: RawContextCacheEntry): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.MEMORY_CACHE_SIZE) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
    
    this.memoryCache.set(key, entry);
  }

  /**
   * Update performance statistics
   */
  private updateStats(hit: boolean, responseTime: number): void {
    if (hit) {
      this.stats.hitRate = (this.stats.hitRate * (this.stats.totalRequests - 1) + 1) / this.stats.totalRequests;
    } else {
      this.stats.hitRate = (this.stats.hitRate * (this.stats.totalRequests - 1)) / this.stats.totalRequests;
    }
    
    this.stats.averageResponseTime = (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;
    this.stats.memoryUsage = this.memoryCache.size * 1024; // Rough estimate
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    this.memoryCache.clear();
  }
}
