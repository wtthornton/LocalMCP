/**
 * Prompt Cache Service
 * 
 * Implements intelligent caching for enhanced prompts to reduce processing time
 * and improve response consistency for similar requests.
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
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
  // New performance metrics
  totalRequests: number;
  averageHitTime: number;
  averageMissTime: number;
  memoryUsage: number;
  evictionCount: number;
  lastCleanup: Date;
  performanceGain: number; // Percentage improvement from cache hits
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
  protected logger: Logger;
  private config: ConfigService;
  private memoryCache: Map<string, PromptCacheEntry> = new Map();
  private sqliteCache!: Database.Database;
  private cacheConfig: PromptCacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    // New performance metrics
    averageHitTime: 0,
    averageMissTime: 0,
    memoryUsage: 0,
    evictionCount: 0,
    lastCleanup: new Date(),
    performanceGain: 0,
    hitTimes: [] as number[],
    missTimes: [] as number[]
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
      
      // Enable WAL mode for better performance
      this.sqliteCache.pragma('journal_mode = WAL');
      
      // Create cache table with expires_at for TTL
      this.sqliteCache.exec(`
        CREATE TABLE IF NOT EXISTS prompt_cache (
          key TEXT PRIMARY KEY,
          original_prompt TEXT NOT NULL,
          enhanced_prompt TEXT NOT NULL,
          context TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          ttl INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
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
        CREATE INDEX IF NOT EXISTS idx_prompt_cache_key ON prompt_cache(key);
        CREATE INDEX IF NOT EXISTS idx_prompt_cache_expires_at ON prompt_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_prompt_cache_timestamp ON prompt_cache(timestamp);
      `);

      // Clean up expired entries on startup
      this.cleanupExpiredEntries();

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

    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const cacheKey = this.generatePromptCacheKey(originalPrompt, context, frameworkDetection);
      
      // Check memory cache first
      let entry = this.memoryCache.get(cacheKey);
      if (entry && !this.isExpired(entry)) {
        const hitTime = Date.now() - startTime;
        entry.hits++;
        this.stats.hits++;
        this.stats.hitTimes.push(hitTime);
        this.updateStats(entry);
        this.updatePerformanceMetrics();
        this.logger.debug('Prompt cache hit (memory)', { cacheKey, hits: entry.hits, hitTime });
        return entry;
      }

      // Check SQLite cache
      entry = await this.getFromSQLite(cacheKey) || undefined;
      if (entry && !this.isExpired(entry)) {
        const hitTime = Date.now() - startTime;
        entry.hits++;
        this.stats.hits++;
        this.stats.hitTimes.push(hitTime);
        this.updateStats(entry);
        this.updatePerformanceMetrics();
        
        // Move to memory cache for faster access
        this.memoryCache.set(cacheKey, entry);
        
        this.logger.debug('Prompt cache hit (SQLite)', { cacheKey, hits: entry.hits, hitTime });
        return entry;
      }

      const missTime = Date.now() - startTime;
      this.stats.misses++;
      this.stats.missTimes.push(missTime);
      this.updatePerformanceMetrics();
      this.logger.debug('Prompt cache miss', { cacheKey, missTime });
      return null;

    } catch (error) {
      // Graceful fallback - cache failure shouldn't break the app
      this.logger.warn('Prompt cache retrieval failed, continuing without cache', { error: error.message });
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
    // Normalize context by removing non-deterministic fields and sorting keys
    const normalizedContext = this.normalizeContextForCache(context);
    const normalizedFramework = this.normalizeFrameworkForCache(frameworkDetection);
    
    // Create deterministic hash using crypto
    const keyComponents = [
      originalPrompt.toLowerCase().trim(),
      normalizedContext,
      normalizedFramework
    ];
    
    return crypto.createHash('sha256')
      .update(keyComponents.join('|'))
      .digest('hex');
  }

  /**
   * Normalize context for consistent cache keys
   */
  private normalizeContextForCache(context: any): string {
    if (!context || typeof context !== 'object') {
      return '';
    }
    
    // Remove non-deterministic fields
    const normalized = { ...context };
    delete normalized.timestamp;
    delete normalized.requestId;
    delete normalized.sessionId;
    delete normalized.cacheKey;
    
    // Sort keys for consistency
    const sortedKeys = Object.keys(normalized).sort();
    const result = {};
    sortedKeys.forEach(key => {
      result[key] = normalized[key];
    });
    
    return JSON.stringify(result);
  }

  /**
   * Normalize framework detection for consistent cache keys
   */
  private normalizeFrameworkForCache(frameworkDetection: any): string {
    if (!frameworkDetection) {
      return '';
    }
    
    // Extract only the essential framework information
    const normalized = {
      detectedFrameworks: frameworkDetection.detectedFrameworks || [],
      confidence: frameworkDetection.confidence || 0
    };
    
    return JSON.stringify(normalized);
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
      const now = Date.now();
      const stmt = this.sqliteCache.prepare(`
        SELECT * FROM prompt_cache WHERE key = ? AND expires_at > ?
      `);
      const row = stmt.get(key, now) as any;
      
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
      const expiresAt = entry.timestamp + entry.ttl;
      const stmt = this.sqliteCache.prepare(`
        INSERT OR REPLACE INTO prompt_cache (
          key, original_prompt, enhanced_prompt, context, timestamp, ttl, expires_at,
          hits, quality_score, token_count, framework_detection, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        entry.key,
        entry.originalPrompt,
        entry.enhancedPrompt,
        JSON.stringify(entry.context),
        entry.timestamp,
        entry.ttl,
        expiresAt,
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
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    try {
      const now = Date.now();
      const stmt = this.sqliteCache.prepare(`
        DELETE FROM prompt_cache WHERE expires_at <= ?
      `);
      const result = stmt.run(now);
      
      if (result.changes > 0) {
        this.logger.debug(`Cleaned up ${result.changes} expired cache entries`);
      }
    } catch (error) {
      this.logger.warn('Failed to cleanup expired entries', { error });
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
      topFrameworks,
      // New performance metrics
      totalRequests: this.stats.totalRequests,
      averageHitTime: this.stats.averageHitTime,
      averageMissTime: this.stats.averageMissTime,
      memoryUsage: this.stats.memoryUsage,
      evictionCount: this.stats.evictionCount,
      lastCleanup: this.stats.lastCleanup,
      performanceGain: this.stats.performanceGain
    };
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Calculate average hit time
    if (this.stats.hitTimes.length > 0) {
      this.stats.averageHitTime = this.stats.hitTimes.reduce((a, b) => a + b, 0) / this.stats.hitTimes.length;
    }

    // Calculate average miss time
    if (this.stats.missTimes.length > 0) {
      this.stats.averageMissTime = this.stats.missTimes.reduce((a, b) => a + b, 0) / this.stats.missTimes.length;
    }

    // Calculate performance gain (time saved by cache hits)
    if (this.stats.averageMissTime > 0 && this.stats.averageHitTime > 0) {
      this.stats.performanceGain = ((this.stats.averageMissTime - this.stats.averageHitTime) / this.stats.averageMissTime) * 100;
    }

    // Update memory usage (rough estimation)
    this.stats.memoryUsage = this.memoryCache.size * 1024; // Rough estimate: 1KB per entry

    // Keep only last 100 timing samples to prevent memory growth
    if (this.stats.hitTimes.length > 100) {
      this.stats.hitTimes = this.stats.hitTimes.slice(-100);
    }
    if (this.stats.missTimes.length > 100) {
      this.stats.missTimes = this.stats.missTimes.slice(-100);
    }
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
