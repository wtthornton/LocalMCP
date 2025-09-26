/**
 * Context7 Cache Service
 * 
 * Provides intelligent caching for Context7 library documentation,
 * pattern matches, and ML predictions to reduce token costs and improve performance.
 */

import type { Context7CacheEntry, DetectionMetrics } from './framework-detector.types';

export interface PatternCacheEntry {
  key: string;
  patterns: any[];
  timestamp: number;
  ttl: number;
  hits: number;
  successRate: number;
}

export interface MLCacheEntry {
  key: string;
  predictions: any[];
  confidence: number;
  timestamp: number;
  ttl: number;
  hits: number;
}

export class Context7CacheService {
  private cache = new Map<string, Context7CacheEntry>();
  private patternCache = new Map<string, PatternCacheEntry>();
  private mlCache = new Map<string, MLCacheEntry>();
  private TTL: number;
  private patternTTL: number;
  private mlTTL: number;
  private hitCount = 0;
  private missCount = 0;
  private patternHitCount = 0;
  private patternMissCount = 0;
  private mlHitCount = 0;
  private mlMissCount = 0;

  constructor(
    ttl: number = 24 * 60 * 60 * 1000, // 24 hours default
    patternTTL: number = 60 * 60 * 1000, // 1 hour for patterns
    mlTTL: number = 2 * 60 * 60 * 1000 // 2 hours for ML predictions
  ) {
    this.TTL = ttl;
    this.patternTTL = patternTTL;
    this.mlTTL = mlTTL;
  }

  /**
   * Get cached documentation for a library
   */
  async getCachedDocs(libraryName: string): Promise<Context7CacheEntry | null> {
    const cached = this.cache.get(libraryName);
    
    if (cached && this.isCacheValid(cached)) {
      this.hitCount++;
      return cached;
    }
    
    this.missCount++;
    return null;
  }

  /**
   * Cache documentation for a library
   */
  async cacheDocs(libraryName: string, libraryId: string, docs: any): Promise<void> {
    const entry: Context7CacheEntry = {
      libraryId,
      docs,
      timestamp: Date.now()
    };
    
    this.cache.set(libraryName, entry);
  }

  /**
   * Get cached pattern matches
   */
  async getCachedPatterns(key: string): Promise<PatternCacheEntry | null> {
    const cached = this.patternCache.get(key);
    
    if (cached && this.isPatternCacheValid(cached)) {
      cached.hits++;
      this.patternHitCount++;
      return cached;
    }
    
    this.patternMissCount++;
    return null;
  }

  /**
   * Cache pattern matches
   */
  async cachePatterns(key: string, patterns: any[], successRate: number = 0): Promise<void> {
    const entry: PatternCacheEntry = {
      key,
      patterns,
      timestamp: Date.now(),
      ttl: this.patternTTL,
      hits: 0,
      successRate
    };
    
    this.patternCache.set(key, entry);
  }

  /**
   * Get cached ML predictions
   */
  async getCachedMLPredictions(key: string): Promise<MLCacheEntry | null> {
    const cached = this.mlCache.get(key);
    
    if (cached && this.isMLCacheValid(cached)) {
      cached.hits++;
      this.mlHitCount++;
      return cached;
    }
    
    this.mlMissCount++;
    return null;
  }

  /**
   * Cache ML predictions
   */
  async cacheMLPredictions(key: string, predictions: any[], confidence: number): Promise<void> {
    const entry: MLCacheEntry = {
      key,
      predictions,
      confidence,
      timestamp: Date.now(),
      ttl: this.mlTTL,
      hits: 0
    };
    
    this.mlCache.set(key, entry);
  }

  /**
   * Check if pattern cache entry is still valid
   */
  private isPatternCacheValid(entry: PatternCacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Check if ML cache entry is still valid
   */
  private isMLCacheValid(entry: MLCacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: Context7CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.TTL;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
    this.patternCache.clear();
    this.mlCache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.patternHitCount = 0;
    this.patternMissCount = 0;
    this.mlHitCount = 0;
    this.mlMissCount = 0;
  }

  /**
   * Clear expired cache entries for all cache types
   */
  clearAllExpiredEntries(): void {
    this.clearExpiredEntries();
    
    const now = Date.now();
    
    // Clear expired pattern cache entries
    for (const [key, entry] of this.patternCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.patternCache.delete(key);
      }
    }
    
    // Clear expired ML cache entries
    for (const [key, entry] of this.mlCache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.mlCache.delete(key);
      }
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStats(): { 
    size: number; 
    hitRate: number; 
    hitCount: number; 
    missCount: number;
    patternCache: {
      size: number;
      hitRate: number;
      hitCount: number;
      missCount: number;
    };
    mlCache: {
      size: number;
      hitRate: number;
      hitCount: number;
      missCount: number;
    };
  } {
    const totalRequests = this.hitCount + this.missCount;
    const patternTotalRequests = this.patternHitCount + this.patternMissCount;
    const mlTotalRequests = this.mlHitCount + this.mlMissCount;
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
      patternCache: {
        size: this.patternCache.size,
        hitRate: patternTotalRequests > 0 ? this.patternHitCount / patternTotalRequests : 0,
        hitCount: this.patternHitCount,
        missCount: this.patternMissCount
      },
      mlCache: {
        size: this.mlCache.size,
        hitRate: mlTotalRequests > 0 ? this.mlHitCount / mlTotalRequests : 0,
        hitCount: this.mlHitCount,
        missCount: this.mlMissCount
      }
    };
  }

  /**
   * Get detection metrics including all cache types
   */
  getDetectionMetrics(): Partial<DetectionMetrics> {
    const stats = this.getCacheStats();
    return {
      cacheHitRate: (stats.hitRate + stats.patternCache.hitRate + stats.mlCache.hitRate) / 3
    };
  }
}
