/**
 * Cache Types for AI Summarization System
 * 
 * Defines interfaces for raw context cache, summarized context cache,
 * and related data structures for the dual-tier caching system.
 */

export interface RawContextCacheEntry {
  id: string;
  projectSignature: string;
  frameworks: string[];
  repoFacts: string[];
  context7Docs: string[];
  codeSnippets: string[];
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface SummarizedContextCacheEntry {
  id: string;
  projectSignature: string;
  frameworks: string[];
  summarizationVersion: string;
  summarizedRepoFacts: string[];
  summarizedContext7Docs: string[];
  summarizedCodeSnippets: string[];
  originalTokenCount: number;
  summarizedTokenCount: number;
  qualityScore: number;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheStatistics {
  id?: number;
  cacheType: 'raw' | 'summarized';
  hitCount: number;
  missCount: number;
  totalRequests: number;
  averageResponseTime: number;
  tokenSavings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CachePerformanceMetrics {
  hitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  tokenSavings: number;
  memoryUsage: number;
  evictionCount: number;
  lastCleanup: Date;
}

export interface DualCacheStats {
  rawCache: CachePerformanceMetrics;
  summarizedCache: CachePerformanceMetrics;
  overallHitRate: number;
  overallTokenSavings: number;
  overallMemoryUsage: number;
}

export interface CachedContextResult {
  type: 'raw' | 'summarized';
  data: RawContextCacheEntry | SummarizedContextCacheEntry;
  responseTime: number;
  tokenCount: number;
}

export interface ProjectSignature {
  repoFacts: string[];
  codeSnippets: string[];
  projectType: string;
  timestamp: number;
}

export interface ChangeAnalysis {
  dependencies: boolean;
  frameworks: boolean;
  structure: boolean;
  significant: boolean;
}

export interface InvalidationDecision {
  shouldInvalidate: boolean;
  reason: string;
  affectedEntries: number;
}

export interface CacheConfig {
  rawCache: {
    enabled: boolean;
    ttl: number;
    maxEntries: number;
    memoryCacheSize: number;
  };
  summarizedCache: {
    enabled: boolean;
    ttl: number;
    maxEntries: number;
    memoryCacheSize: number;
  };
  summarization: {
    model: string;
    maxTokens: number;
    temperature: number;
    qualityThreshold: number;
    retryAttempts: number;
    timeout: number;
  };
}

export interface CacheKey {
  projectSignature: string;
  frameworks: string[];
  summarizationVersion?: string;
}

export interface CacheEntryMetadata {
  size: number;
  compressionRatio: number;
  accessPattern: 'frequent' | 'moderate' | 'rare';
  lastAccessTime: Date;
  creationTime: Date;
}
