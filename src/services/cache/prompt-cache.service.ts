/**
 * Prompt Cache Service
 * 
 * Implements intelligent caching for enhanced prompts to reduce processing time
 * and improve response consistency for similar requests.
 */

import Database from 'better-sqlite3';
import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';

export interface PromptCacheEntry {
  key: string;
  originalPrompt: string;
  enhancedPrompt: string;
  context: any;
  timestamp: number;
  ttl: number;
  hits: number;
  qualityScore: number;
  tokenCount: number;
  frameworkDetection: any;
  metadata: {
    responseTime: number;
    complexity: string;
    librariesUsed: string[];
    curationMetrics?: {
      totalTokenReduction: number;
      averageQualityScore: number;
      curationEnabled: boolean;
    } | null;
  };
}

export interface PromptCacheStats {
  totalEntries: number;
  hitRate: number;
  averageResponseTime: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  topFrameworks: Array<{ framework: string; count: number }>;
}

export interface PromptCacheConfig {
  enabled: boolean;
  maxEntries: number;
  ttl: {
    default: number;
    byComplexity: {
      simple: number;
      medium: number;
      complex: number;
    };
    maxAge: number;
  };
  similarityThreshold: number;
  warming: {
    enabled: boolean;
    commonPrompts: string[];
    frameworks: string[];
  };
}

export class PromptCacheService {
  private logger: Logger;
  private config: ConfigService;
  private memoryCache: Map<string, PromptCacheEntry> = new Map();
  private sqliteCache!: Database.Database;
  private cacheConfig: PromptCacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    averageResponseTime: 0
  };

  constructor(logger: Logger, config: ConfigService) {
    this.logger = logger;
    this.config = config;
    this.cacheConfig = this.initializeCacheConfig();
    this.initializeSQLiteCache();
  }

  /**
   * Initialize cache configuration
   */
  private initializeCacheConfig(): PromptCacheConfig {
    return {
      enabled: this.config.get('cache')?.context7?.enablePersistence ?? true,
      maxEntries: this.config.get('cache')?.context7?.maxMemoryEntries ?? 1000,
      ttl: {
        default: (this.config.get('cache')?.context7?.defaultTtl ?? 3600) * 1000, // Convert to milliseconds
        byComplexity: {
          simple: (this.config.get('cache')?.context7?.defaultTtl ?? 3600) * 1000 * 0.5, // 50% of default
          medium: (this.config.get('cache')?.context7?.defaultTtl ?? 3600) * 1000, // Default TTL
          complex: (this.config.get('cache')?.context7?.defaultTtl ?? 3600) * 1000 * 2 // 200% of default
        },
        maxAge: (this.config.get('cache')?.context7?.maxTtl ?? 86400) * 1000 // Convert to milliseconds
      },
      similarityThreshold: 0.8,
      warming: {
        enabled: false, // Disable hardcoded warming prompts
        commonPrompts: [], // No hardcoded user data
        frameworks: [] // No hardcoded user data
      }
    };
  }

  /**
   * Initialize SQLite cache database
   */
  private initializeSQLiteCache(): void {
    try {
      this.sqliteCache = new Database('prompt-cache.db');
      
      // Create cache table
      this.sqliteCache.exec(`
        CREATE TABLE IF NOT EXISTS prompt_cache (
          key TEXT PRIMARY KEY,
          original_prompt TEXT NOT NULL,
          enhanced_prompt TEXT NOT NULL,
          context TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL,
          hits INTEGER DEFAULT 0,
          quality_score REAL DEFAULT 0,
          token_count INTEGER DEFAULT 0,
          framework_detection TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      this.sqliteCache.exec(`
        CREATE INDEX IF NOT EXISTS idx_prompt_cache_timestamp ON prompt_cache(timestamp);
        CREATE INDEX IF NOT EXISTS idx_prompt_cache_hits ON prompt_cache(hits);
        CREATE INDEX IF NOT EXISTS idx_prompt_cache_quality ON prompt_cache(quality_score);
      `);

      this.logger.info('Prompt cache SQLite database initialized');
    } catch (error) {
      this.logger.error('Failed to initialize prompt cache database', { error });
      throw error;
    }
  }

  /**
   * Get cached enhanced prompt
   */
  async getCachedPrompt(
    originalPrompt: string,
    context: any,
    frameworkDetection: any
  ): Promise<PromptCacheEntry | null> {
    if (!this.cacheConfig.enabled) return null;

    try {
      const cacheKey = this.generatePromptCacheKey(originalPrompt, context, frameworkDetection);
      
      // Check memory cache first
      let entry = this.memoryCache.get(cacheKey);
      if (entry && !this.isExpired(entry)) {
        entry.hits++;
        this.stats.hits++;
        this.updateStats(entry);
        this.logger.debug('Prompt cache hit (memory)', { cacheKey, hits: entry.hits });
        return entry;
      }

      // Check SQLite cache
      entry = await this.getFromSQLite(cacheKey) || undefined;
      if (entry && !this.isExpired(entry)) {
        entry.hits++;
        this.stats.hits++;
        this.updateStats(entry);
        
        // Move to memory cache for faster access
        this.memoryCache.set(cacheKey, entry);
        
        this.logger.debug('Prompt cache hit (SQLite)', { cacheKey, hits: entry.hits });
        return entry;
      }

      this.stats.misses++;
      this.logger.debug('Prompt cache miss', { cacheKey });
      return null;

    } catch (error) {
      this.logger.warn('Prompt cache retrieval failed', { error });
      return null;
    }
  }

  /**
   * Cache enhanced prompt
   */
  async cachePrompt(
    originalPrompt: string,
    enhancedPrompt: string,
    context: any,
    frameworkDetection: any,
    qualityScore: number,
    responseTime: number,
    complexity: string,
    curationMetrics?: {
      totalTokenReduction: number;
      averageQualityScore: number;
      curationEnabled: boolean;
    }
  ): Promise<void> {
    if (!this.cacheConfig.enabled) return;

    try {
      const cacheKey = this.generatePromptCacheKey(originalPrompt, context, frameworkDetection);
      const tokenCount = Math.ceil(enhancedPrompt.length / 4);
      const ttl = this.calculateTTL(complexity);

      const entry: PromptCacheEntry = {
        key: cacheKey,
        originalPrompt,
        enhancedPrompt,
        context,
        timestamp: Date.now(),
        ttl,
        hits: 0,
        qualityScore,
        tokenCount,
        frameworkDetection,
        metadata: {
          responseTime,
          complexity,
          librariesUsed: frameworkDetection?.context7Libraries || [],
          curationMetrics: curationMetrics || null
        }
      };

      // Store in memory cache
      this.memoryCache.set(cacheKey, entry);

      // Store in SQLite cache
      await this.storeInSQLite(entry);

      // Cleanup if cache is too large
      await this.cleanupCache();

      this.logger.debug('Prompt cached successfully', {
        cacheKey,
        tokenCount,
        qualityScore,
        complexity
      });

    } catch (error) {
      this.logger.warn('Prompt caching failed', { error });
    }
  }

  /**
   * Generate cache key for prompt
   */
  private generatePromptCacheKey(
    originalPrompt: string,
    context: any,
    frameworkDetection: any
  ): string {
    // Create a hash of the prompt and context for consistent keys
    const promptHash = this.hashString(originalPrompt.toLowerCase().trim());
    const contextHash = this.hashString(JSON.stringify(context, Object.keys(context).sort()));
    const frameworkHash = this.hashString(
      JSON.stringify(frameworkDetection?.detectedFrameworks || [], Object.keys(frameworkDetection || {}).sort())
    );
    
    return `prompt:${promptHash}:${contextHash}:${frameworkHash}`;
  }

  /**
   * Hash string for consistent keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Calculate TTL based on complexity
   */
  private calculateTTL(complexity: string): number {
    const complexityTTL = this.cacheConfig.ttl.byComplexity[complexity as keyof typeof this.cacheConfig.ttl.byComplexity];
    return Math.min(complexityTTL || this.cacheConfig.ttl.default, this.cacheConfig.ttl.maxAge);
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: PromptCacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > entry.ttl;
  }

  /**
   * Get entry from SQLite cache
   */
  private async getFromSQLite(key: string): Promise<PromptCacheEntry | null> {
    try {
      const stmt = this.sqliteCache.prepare(`
        SELECT * FROM prompt_cache WHERE key = ?
      `);
      const row = stmt.get(key) as any;
      
      if (!row) return null;

      return {
        key: row.key,
        originalPrompt: row.original_prompt,
        enhancedPrompt: row.enhanced_prompt,
        context: JSON.parse(row.context),
        timestamp: row.timestamp,
        ttl: row.ttl,
        hits: row.hits,
        qualityScore: row.quality_score,
        tokenCount: row.token_count,
        frameworkDetection: JSON.parse(row.framework_detection || '{}'),
        metadata: JSON.parse(row.metadata || '{}')
      };
    } catch (error) {
      this.logger.warn('SQLite prompt cache retrieval failed', { key, error });
      return null;
    }
  }

  /**
   * Store entry in SQLite cache
   */
  private async storeInSQLite(entry: PromptCacheEntry): Promise<void> {
    try {
      const stmt = this.sqliteCache.prepare(`
        INSERT OR REPLACE INTO prompt_cache (
          key, original_prompt, enhanced_prompt, context, timestamp, ttl,
          hits, quality_score, token_count, framework_detection, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        entry.key,
        entry.originalPrompt,
        entry.enhancedPrompt,
        JSON.stringify(entry.context),
        entry.timestamp,
        entry.ttl,
        entry.hits,
        entry.qualityScore,
        entry.tokenCount,
        JSON.stringify(entry.frameworkDetection),
        JSON.stringify(entry.metadata)
      );
    } catch (error) {
      this.logger.warn('SQLite prompt cache storage failed', { error });
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(entry: PromptCacheEntry): void {
    this.stats.totalRequests++;
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + entry.metadata.responseTime) / 
      this.stats.totalRequests;
  }

  /**
   * Cleanup cache when it gets too large
   */
  private async cleanupCache(): Promise<void> {
    if (this.memoryCache.size <= this.cacheConfig.maxEntries) return;

    // Remove least recently used entries from memory
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.hits - b.hits)
      .slice(0, Math.floor(this.cacheConfig.maxEntries * 0.8));

    this.memoryCache.clear();
    entries.forEach(([key, entry]) => this.memoryCache.set(key, entry));

    // Cleanup SQLite cache
    try {
      const stmt = this.sqliteCache.prepare(`
        DELETE FROM prompt_cache 
        WHERE timestamp + ttl < ? OR key NOT IN (
          SELECT key FROM prompt_cache 
          ORDER BY hits DESC, timestamp DESC 
          LIMIT ?
        )
      `);
      stmt.run(Date.now(), this.cacheConfig.maxEntries);
    } catch (error) {
      this.logger.warn('SQLite cache cleanup failed', { error });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): PromptCacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;

    // Get top frameworks from SQLite
    let topFrameworks: Array<{ framework: string; count: number }> = [];
    try {
      const stmt = this.sqliteCache.prepare(`
        SELECT framework_detection, COUNT(*) as count
        FROM prompt_cache
        WHERE framework_detection IS NOT NULL
        GROUP BY framework_detection
        ORDER BY count DESC
        LIMIT 5
      `);
      const rows = stmt.all() as any[];
      topFrameworks = rows.map(row => ({
        framework: JSON.parse(row.framework_detection).detectedFrameworks?.[0] || 'unknown',
        count: row.count
      }));
    } catch (error) {
      this.logger.warn('Failed to get top frameworks', { error });
    }

    return {
      totalEntries: this.memoryCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      averageResponseTime: Math.round(this.stats.averageResponseTime),
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      cacheSize: this.memoryCache.size,
      topFrameworks
    };
  }

  /**
   * Warm cache with common prompts
   */
  async warmCache(): Promise<void> {
    if (!this.cacheConfig.warming.enabled) return;

    this.logger.info('Starting prompt cache warming', {
      commonPrompts: this.cacheConfig.warming.commonPrompts.length,
      frameworks: this.cacheConfig.warming.frameworks.length
    });

    // This would trigger cache warming by pre-processing common prompts
    // For now, just log the warming process
    for (const prompt of this.cacheConfig.warming.commonPrompts) {
      this.logger.debug('Cache warming prompt', { prompt });
    }

    this.logger.info('Prompt cache warming completed');
  }

  /**
   * Invalidate cache entries
   */
  async invalidateCache(pattern?: string): Promise<number> {
    let invalidatedCount = 0;

    try {
      if (pattern) {
        // Invalidate by pattern
        for (const [key, entry] of this.memoryCache.entries()) {
          if (key.includes(pattern) || entry.originalPrompt.includes(pattern)) {
            this.memoryCache.delete(key);
            invalidatedCount++;
          }
        }

        // Invalidate SQLite cache
        const stmt = this.sqliteCache.prepare(`
          DELETE FROM prompt_cache 
          WHERE key LIKE ? OR original_prompt LIKE ?
        `);
        const result = stmt.run(`%${pattern}%`, `%${pattern}%`);
        invalidatedCount += result.changes;
      } else {
        // Invalidate expired entries
        const now = Date.now();
        for (const [key, entry] of this.memoryCache.entries()) {
          if (this.isExpired(entry)) {
            this.memoryCache.delete(key);
            invalidatedCount++;
          }
        }

        const stmt = this.sqliteCache.prepare(`
          DELETE FROM prompt_cache WHERE timestamp + ttl < ?
        `);
        const result = stmt.run(now);
        invalidatedCount += result.changes;
      }

      this.logger.debug('Prompt cache invalidation completed', {
        pattern,
        invalidatedCount
      });

      return invalidatedCount;
    } catch (error) {
      this.logger.error('Prompt cache invalidation failed', { pattern, error });
      return 0;
    }
  }

  /**
   * Close cache service
   */
  close(): void {
    if (this.sqliteCache) {
      this.sqliteCache.close();
    }
  }
}
