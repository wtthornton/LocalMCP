/**
 * Cache-First Service - Intelligent caching with Context7 fallback
 * 
 * This service implements a cache-first strategy for LocalMCP operations,
 * ensuring vibe coders can work even when external services are unavailable.
 * 
 * Benefits for vibe coders:
 * - Works offline with cached data
 * - Fast responses from local cache
 * - Automatic fallback to Context7 when available
 * - Intelligent cache invalidation and updates
 * - Seamless online/offline transitions
 */

import { EventEmitter } from 'events';

// Cache entry with metadata
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  source: 'cache' | 'context7' | 'rag' | 'local';
  version: string;
  tags: string[];
  lastAccessed: number;
  accessCount: number;
}

// Cache operation result
export interface CacheResult<T = any> {
  success: boolean;
  data?: T;
  source: 'cache' | 'context7' | 'rag' | 'local' | 'none';
  cached: boolean;
  error?: string;
  metadata?: {
    cacheHit: boolean;
    context7Available: boolean;
    ragAvailable: boolean;
    fallbackUsed: boolean;
    responseTime: number;
  };
}

// Context7 fallback configuration
export interface Context7Config {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Cache configuration
export interface CacheConfig {
  maxSize: number; // Maximum number of entries
  defaultTtl: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enablePersistence: boolean; // Save cache to disk
  persistencePath: string;
}

// Cache-First Service Implementation
export class CacheFirstService extends EventEmitter {
  private cache: Map<string, CacheEntry> = new Map();
  private context7Config: Context7Config;
  private cacheConfig: CacheConfig;
  private context7Available: boolean = true;
  private ragAvailable: boolean = true;
  private cleanupTimer?: NodeJS.Timeout;
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    context7Requests: 0,
    context7Failures: 0,
    ragRequests: 0,
    ragFailures: 0,
    fallbacksUsed: 0
  };

  constructor(context7Config?: Partial<Context7Config>, cacheConfig?: Partial<CacheConfig>) {
    super();
    
    this.context7Config = {
      enabled: true,
      apiUrl: 'https://context7.com/api/v1',
      apiKey: process.env.CONTEXT7_API_KEY || '',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...context7Config
    };

    this.cacheConfig = {
      maxSize: 1000,
      defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      enablePersistence: true,
      persistencePath: './cache/localmcp-cache.json',
      ...cacheConfig
    };

    this.initializeService();
  }

  /**
   * Get data with cache-first strategy
   */
  async get<T = any>(
    key: string, 
    options?: {
      tags?: string[];
      ttl?: number;
      forceRefresh?: boolean;
      fallbackSources?: ('context7' | 'rag' | 'local')[];
    }
  ): Promise<CacheResult<T>> {
    const startTime = Date.now();
    const tags = options?.tags || [];
    const ttl = options?.ttl || this.cacheConfig.defaultTtl;
    const forceRefresh = options?.forceRefresh || false;
    const fallbackSources = options?.fallbackSources || ['context7', 'rag', 'local'];

    try {
      // Step 1: Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedResult = this.getFromCache<T>(key);
        if (cachedResult.success) {
          this.stats.cacheHits++;
          this.emit('cacheHit', { key, source: cachedResult.source });
          
          return {
            success: true,
            data: cachedResult.data,
            source: cachedResult.source,
            cached: true,
            metadata: {
              cacheHit: true,
              context7Available: this.context7Available,
              ragAvailable: this.ragAvailable,
              fallbackUsed: false,
              responseTime: Date.now() - startTime
            }
          };
        }
      }

      this.stats.cacheMisses++;

      // Step 2: Try Context7 (if available and enabled)
      if (this.context7Config.enabled && this.context7Available && fallbackSources.includes('context7')) {
        const context7Result = await this.getFromContext7<T>(key);
        if (context7Result.success && context7Result.data) {
          // Cache the result
          this.setCache(key, context7Result.data, { tags, ttl, source: 'context7' });
          
          this.emit('context7Success', { key, responseTime: Date.now() - startTime });
          
          return {
            success: true,
            data: context7Result.data,
            source: 'context7',
            cached: false,
            metadata: {
              cacheHit: false,
              context7Available: this.context7Available,
              ragAvailable: this.ragAvailable,
              fallbackUsed: false,
              responseTime: Date.now() - startTime
            }
          };
        }
      }

      // Step 3: Try RAG (if available)
      if (this.ragAvailable && fallbackSources.includes('rag')) {
        const ragResult = await this.getFromRAG<T>(key);
        if (ragResult.success && ragResult.data) {
          // Cache the result
          this.setCache(key, ragResult.data, { tags, ttl, source: 'rag' });
          
          this.emit('ragSuccess', { key, responseTime: Date.now() - startTime });
          
          return {
            success: true,
            data: ragResult.data,
            source: 'rag',
            cached: false,
            metadata: {
              cacheHit: false,
              context7Available: this.context7Available,
              ragAvailable: this.ragAvailable,
              fallbackUsed: true,
              responseTime: Date.now() - startTime
            }
          };
        }
      }

      // Step 4: Try local sources
      if (fallbackSources.includes('local')) {
        const localResult = await this.getFromLocal<T>(key);
        if (localResult.success && localResult.data) {
          // Cache the result
          this.setCache(key, localResult.data, { tags, ttl, source: 'local' });
          
          this.emit('localSuccess', { key, responseTime: Date.now() - startTime });
          
          return {
            success: true,
            data: localResult.data,
            source: 'local',
            cached: false,
            metadata: {
              cacheHit: false,
              context7Available: this.context7Available,
              ragAvailable: this.ragAvailable,
              fallbackUsed: true,
              responseTime: Date.now() - startTime
            }
          };
        }
      }

      // All sources failed
      this.emit('allSourcesFailed', { key, responseTime: Date.now() - startTime });
      
      return {
        success: false,
        source: 'none',
        cached: false,
        error: 'All data sources unavailable',
        metadata: {
          cacheHit: false,
          context7Available: this.context7Available,
          ragAvailable: this.ragAvailable,
          fallbackUsed: false,
          responseTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.emit('error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
      
      return {
        success: false,
        source: 'none',
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          cacheHit: false,
          context7Available: this.context7Available,
          ragAvailable: this.ragAvailable,
          fallbackUsed: false,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Set data in cache
   */
  set<T = any>(
    key: string, 
    data: T, 
    options?: {
      tags?: string[];
      ttl?: number;
      source?: 'cache' | 'context7' | 'rag' | 'local';
    }
  ): void {
    const tags = options?.tags || [];
    const ttl = options?.ttl || this.cacheConfig.defaultTtl;
    const source = options?.source || 'cache';

    this.setCache(key, data, { tags, ttl, source });
    this.emit('cacheSet', { key, source, tags });
  }

  /**
   * Invalidate cache entries by key or tags
   */
  invalidate(keyOrTags: string | string[]): number {
    let invalidated = 0;

    if (typeof keyOrTags === 'string') {
      // Invalidate by exact key
      if (this.cache.delete(keyOrTags)) {
        invalidated = 1;
      }
    } else {
      // Invalidate by tags
      for (const [cacheKey, entry] of Array.from(this.cache.entries())) {
        if (keyOrTags.some(tag => entry.tags.includes(tag))) {
          this.cache.delete(cacheKey);
          invalidated++;
        }
      }
    }

    this.emit('cacheInvalidated', { keyOrTags, count: invalidated });
    return invalidated;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.stats.cacheHits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      context7Available: this.context7Available,
      ragAvailable: this.ragAvailable,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cacheCleared', { size });
  }

  /**
   * Update service availability status
   */
  updateServiceStatus(service: 'context7' | 'rag', available: boolean): void {
    if (service === 'context7') {
      this.context7Available = available;
    } else if (service === 'rag') {
      this.ragAvailable = available;
    }
    
    this.emit('serviceStatusChanged', { service, available });
  }

  // Private helper methods

  private initializeService(): void {
    // Load persistent cache if enabled
    if (this.cacheConfig.enablePersistence) {
      this.loadPersistentCache();
    }

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.cacheConfig.cleanupInterval);

    // Health check for external services
    this.performHealthCheck();

    this.emit('serviceInitialized');
  }

  private getFromCache<T>(key: string): CacheResult<T> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { success: false, source: 'none', cached: false };
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return { success: false, source: 'none', cached: false };
    }

    // Update access metadata
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    return {
      success: true,
      data: entry.data as T,
      source: entry.source,
      cached: true
    };
  }

  private setCache<T>(key: string, data: T, options: {
    tags: string[];
    ttl: number;
    source: 'cache' | 'context7' | 'rag' | 'local';
  }): void {
    // Check cache size limit
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictOldestEntries();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl,
      source: options.source,
      version: '1.0',
      tags: options.tags,
      lastAccessed: Date.now(),
      accessCount: 1
    };

    this.cache.set(key, entry);
  }

  private async getFromContext7<T>(key: string): Promise<CacheResult<T>> {
    try {
      this.stats.context7Requests++;
      
      // Simulate Context7 API call
      // In real implementation, this would make HTTP request to Context7
      const response = await this.makeContext7Request(key);
      
      return {
        success: true,
        data: response as T,
        source: 'context7',
        cached: false
      };
    } catch (error) {
      this.stats.context7Failures++;
      this.context7Available = false;
      
      return {
        success: false,
        source: 'none',
        cached: false,
        error: error instanceof Error ? error.message : 'Context7 request failed'
      };
    }
  }

  private async getFromRAG<T>(key: string): Promise<CacheResult<T>> {
    try {
      this.stats.ragRequests++;
      
      // Simulate RAG query
      // In real implementation, this would query the vector database
      const response = await this.makeRAGRequest(key);
      
      return {
        success: true,
        data: response as T,
        source: 'rag',
        cached: false
      };
    } catch (error) {
      this.stats.ragFailures++;
      this.ragAvailable = false;
      
      return {
        success: false,
        source: 'none',
        cached: false,
        error: error instanceof Error ? error.message : 'RAG request failed'
      };
    }
  }

  private async getFromLocal<T>(key: string): Promise<CacheResult<T>> {
    try {
      // Try to find local data sources
      // This could include local documentation, lessons learned, etc.
      const response = await this.makeLocalRequest(key);
      
      return {
        success: true,
        data: response as T,
        source: 'local',
        cached: false
      };
    } catch (error) {
      return {
        success: false,
        source: 'none',
        cached: false,
        error: error instanceof Error ? error.message : 'Local request failed'
      };
    }
  }

  private async makeContext7Request(key: string): Promise<any> {
    // Simulate Context7 API request
    // In real implementation, this would make HTTP request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve({ 
            key, 
            data: `Context7 data for ${key}`,
            source: 'context7',
            timestamp: Date.now()
          });
        } else {
          reject(new Error('Context7 service unavailable'));
        }
      }, 100 + Math.random() * 200); // 100-300ms delay
    });
  }

  private async makeRAGRequest(key: string): Promise<any> {
    // Simulate RAG query
    // In real implementation, this would query vector database
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.05) { // 95% success rate
          resolve({ 
            key, 
            data: `RAG data for ${key}`,
            source: 'rag',
            timestamp: Date.now()
          });
        } else {
          reject(new Error('RAG service unavailable'));
        }
      }, 50 + Math.random() * 100); // 50-150ms delay
    });
  }

  private async makeLocalRequest(key: string): Promise<any> {
    // Simulate local data retrieval
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.02) { // 98% success rate
          resolve({ 
            key, 
            data: `Local data for ${key}`,
            source: 'local',
            timestamp: Date.now()
          });
        } else {
          reject(new Error('Local data unavailable'));
        }
      }, 10 + Math.random() * 50); // 10-60ms delay
    });
  }

  private evictOldestEntries(): void {
    // Remove oldest entries (least recently accessed)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    const toRemove = Math.floor(this.cacheConfig.maxSize * 0.1); // Remove 10%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.emit('cacheCleanup', { cleaned, remaining: this.cache.size });
    }
  }

  private getMemoryUsage(): number {
    // Rough estimate of memory usage
    let totalSize = 0;
    for (const [, entry] of Array.from(this.cache.entries())) {
      totalSize += JSON.stringify(entry).length;
    }
    return totalSize;
  }

  private async loadPersistentCache(): Promise<void> {
    // In real implementation, load cache from disk
    // For now, just emit event
    this.emit('cacheLoaded', { from: 'persistent' });
  }

  private async performHealthCheck(): Promise<void> {
    // Check Context7 availability
    try {
      await this.makeContext7Request('health-check');
      this.context7Available = true;
    } catch (error) {
      this.context7Available = false;
    }

    // Check RAG availability
    try {
      await this.makeRAGRequest('health-check');
      this.ragAvailable = true;
    } catch (error) {
      this.ragAvailable = false;
    }

    this.emit('healthCheckCompleted', {
      context7Available: this.context7Available,
      ragAvailable: this.ragAvailable
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.cacheConfig.enablePersistence) {
      this.savePersistentCache();
    }
    
    this.emit('serviceDestroyed');
  }

  private async savePersistentCache(): Promise<void> {
    // In real implementation, save cache to disk
    // For now, just emit event
    this.emit('cacheSaved', { to: 'persistent', size: this.cache.size });
  }
}

export default CacheFirstService;
