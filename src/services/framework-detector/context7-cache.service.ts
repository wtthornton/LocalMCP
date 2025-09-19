/**
 * Context7 Cache Service
 * 
 * Provides intelligent caching for Context7 library documentation
 * to reduce token costs and improve performance.
 */

import { Context7CacheEntry, DetectionMetrics } from './framework-detector.types';

export class Context7CacheService {
  private cache = new Map<string, Context7CacheEntry>();
  private TTL: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(ttl: number = 24 * 60 * 60 * 1000) { // 24 hours default
    this.TTL = ttl;
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
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; hitCount: number; missCount: number } {
    const totalRequests = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      hitCount: this.hitCount,
      missCount: this.missCount
    };
  }

  /**
   * Get detection metrics
   */
  getDetectionMetrics(): Partial<DetectionMetrics> {
    const stats = this.getCacheStats();
    return {
      cacheHitRate: stats.hitRate
    };
  }
}
