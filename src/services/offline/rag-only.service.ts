/**
 * RAG-Only Service - Offline operation using local RAG data
 * 
 * This service provides offline functionality for LocalMCP by using
 * locally stored RAG data when external services are unavailable.
 * 
 * Benefits for vibe coders:
 * - Works completely offline with local knowledge
 * - Fast responses from pre-indexed project data
 * - No internet dependency for basic operations
 * - Seamless fallback when online services fail
 * - Local project context and lessons learned
 */

import { EventEmitter } from 'events';

// RAG query result
export interface RAGResult<T = any> {
  success: boolean;
  data?: T;
  sources: RAGSource[];
  confidence: number;
  responseTime: number;
  query: string;
  error?: string;
}

// RAG source information
export interface RAGSource {
  id: string;
  type: 'documentation' | 'lesson' | 'pattern' | 'code' | 'config';
  title: string;
  content: string;
  relevance: number;
  metadata: Record<string, any>;
}

// RAG query options
export interface RAGQueryOptions {
  maxResults?: number;
  minRelevance?: number;
  includeTypes?: string[];
  excludeTypes?: string[];
  projectScope?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

// Offline mode configuration
export interface OfflineConfig {
  enableRAGOnly: boolean;
  ragDataPath: string;
  maxCacheSize: number;
  defaultMinRelevance: number;
  enableLocalLessons: boolean;
  enableLocalPatterns: boolean;
  enableLocalDocs: boolean;
}

// RAG-Only Service Implementation
export class RAGOnlyService extends EventEmitter {
  private config: OfflineConfig;
  private ragIndex: Map<string, RAGSource[]> = new Map();
  private queryCache: Map<string, RAGResult> = new Map();
  private stats = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    cacheHits: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  };

  constructor(config?: Partial<OfflineConfig>) {
    super();
    
    this.config = {
      enableRAGOnly: true,
      ragDataPath: './data/rag',
      maxCacheSize: 500,
      defaultMinRelevance: 0.3,
      enableLocalLessons: true,
      enableLocalPatterns: true,
      enableLocalDocs: true,
      ...config
    };

    this.initializeService();
  }

  /**
   * Query RAG data offline
   */
  async query<T = any>(
    query: string, 
    options?: RAGQueryOptions
  ): Promise<RAGResult<T>> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query, options);
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult) {
        this.stats.cacheHits++;
        this.emit('cacheHit', { query, responseTime: Date.now() - startTime });
        
        return {
          ...cachedResult,
          responseTime: Date.now() - startTime
        } as RAGResult<T>;
      }

      // Perform RAG query
      const result = await this.performRAGQuery<T>(query, options);
      
      const responseTime = Date.now() - startTime;
      this.stats.totalResponseTime += responseTime;
      this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalQueries;

      if (result.success) {
        this.stats.successfulQueries++;
        
        // Cache successful results
        if (this.queryCache.size < this.config.maxCacheSize) {
          this.queryCache.set(cacheKey, {
            ...result,
            responseTime
          });
        }
        
        this.emit('querySuccess', { query, responseTime, sources: result.sources.length });
      } else {
        this.stats.failedQueries++;
        this.emit('queryFailed', { query, error: result.error, responseTime });
      }

      return {
        ...result,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.stats.failedQueries++;
      
      this.emit('queryError', { 
        query, 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime 
      });

      return {
        success: false,
        sources: [],
        confidence: 0,
        responseTime,
        query,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Index local RAG data
   */
  async indexRAGData(sources: RAGSource[]): Promise<void> {
    try {
      for (const source of sources) {
        const keywords = this.extractKeywords(source.content);
        
        // Add to index for each keyword
        for (const keyword of keywords) {
          if (!this.ragIndex.has(keyword)) {
            this.ragIndex.set(keyword, []);
          }
          this.ragIndex.get(keyword)!.push(source);
        }
      }

      this.emit('ragDataIndexed', { sources: sources.length, keywords: this.ragIndex.size });
    } catch (error) {
      this.emit('indexingError', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get available RAG sources by type
   */
  getSourcesByType(type: string): RAGSource[] {
    const sources: RAGSource[] = [];
    
    for (const sourceList of Array.from(this.ragIndex.values())) {
      sources.push(...sourceList.filter(source => source.type === type));
    }
    
    return sources;
  }

  /**
   * Get RAG statistics
   */
  getStats() {
    const totalSources = Array.from(this.ragIndex.values()).reduce((sum, sources) => sum + sources.length, 0);
    const uniqueSources = new Set(
      Array.from(this.ragIndex.values()).flat().map(source => source.id)
    ).size;

    return {
      ...this.stats,
      totalSources,
      uniqueSources,
      indexedKeywords: this.ragIndex.size,
      cachedQueries: this.queryCache.size,
      config: this.config
    };
  }

  /**
   * Clear RAG cache
   */
  clearCache(): void {
    const size = this.queryCache.size;
    this.queryCache.clear();
    this.emit('cacheCleared', { size });
  }

  /**
   * Clear RAG index
   */
  clearIndex(): void {
    const keywords = this.ragIndex.size;
    this.ragIndex.clear();
    this.emit('indexCleared', { keywords });
  }

  /**
   * Check if offline mode is available
   */
  isOfflineAvailable(): boolean {
    return this.config.enableRAGOnly && this.ragIndex.size > 0;
  }

  /**
   * Get offline capabilities
   */
  getOfflineCapabilities(): {
    available: boolean;
    sources: {
      documentation: number;
      lessons: number;
      patterns: number;
      code: number;
      config: number;
    };
    keywords: number;
  } {
    const sources = {
      documentation: this.getSourcesByType('documentation').length,
      lessons: this.getSourcesByType('lesson').length,
      patterns: this.getSourcesByType('pattern').length,
      code: this.getSourcesByType('code').length,
      config: this.getSourcesByType('config').length
    };

    return {
      available: this.isOfflineAvailable(),
      sources,
      keywords: this.ragIndex.size
    };
  }

  // Private helper methods

  private initializeService(): void {
    // Load existing RAG data if available
    this.loadExistingRAGData();
    
    this.emit('serviceInitialized', { 
      config: this.config,
      indexedKeywords: this.ragIndex.size 
    });
  }

  private async performRAGQuery<T>(
    query: string, 
    options?: RAGQueryOptions
  ): Promise<RAGResult<T>> {
    const keywords = this.extractKeywords(query);
    const maxResults = options?.maxResults || 10;
    const minRelevance = options?.minRelevance || this.config.defaultMinRelevance;
    const includeTypes = options?.includeTypes;
    const excludeTypes = options?.excludeTypes;

    const relevantSources: RAGSource[] = [];
    const sourceRelevance = new Map<string, number>();

    // Find relevant sources for each keyword
    for (const keyword of keywords) {
      const sources = this.ragIndex.get(keyword.toLowerCase()) || [];
      
      for (const source of sources) {
        // Filter by type if specified
        if (includeTypes && !includeTypes.includes(source.type)) {
          continue;
        }
        if (excludeTypes && excludeTypes.includes(source.type)) {
          continue;
        }

        // Calculate relevance score
        const relevance = this.calculateRelevance(query, source, keyword);
        
        if (relevance >= minRelevance) {
          const existingRelevance = sourceRelevance.get(source.id) || 0;
          sourceRelevance.set(source.id, Math.max(existingRelevance, relevance));
        }
      }
    }

    // Sort by relevance and take top results
    const sortedSources = Array.from(sourceRelevance.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxResults)
      .map(([sourceId, relevance]) => {
        const source = this.findSourceById(sourceId);
        return source ? { ...source, relevance } : null;
      })
      .filter((source): source is RAGSource => source !== null);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(sortedSources, query);

    return {
      success: sortedSources.length > 0,
      data: this.synthesizeResponse<T>(sortedSources, query),
      sources: sortedSources,
      confidence,
      responseTime: 0, // Will be set by caller
      query
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word))
      .slice(0, 10); // Limit to 10 keywords
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
      'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'must', 'can', 'shall'
    ]);
    return stopWords.has(word);
  }

  private calculateRelevance(query: string, source: RAGSource, keyword: string): number {
    let relevance = 0;

    // Keyword match in title (higher weight)
    if (source.title.toLowerCase().includes(keyword)) {
      relevance += 0.4;
    }

    // Keyword match in content
    const contentMatches = (source.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    relevance += Math.min(contentMatches * 0.1, 0.3);

    // Exact phrase match
    if (source.content.toLowerCase().includes(query.toLowerCase())) {
      relevance += 0.3;
    }

    // Type-based relevance
    const typeWeights: Record<string, number> = {
      'lesson': 1.0,
      'pattern': 0.9,
      'documentation': 0.8,
      'code': 0.7,
      'config': 0.6
    };
    relevance *= typeWeights[source.type] || 0.5;

    return Math.min(relevance, 1.0);
  }

  private calculateConfidence(sources: RAGSource[], query: string): number {
    if (sources.length === 0) return 0;

    const avgRelevance = sources.reduce((sum, source) => sum + (source as any).relevance, 0) / sources.length;
    const sourceCountBonus = Math.min(sources.length * 0.1, 0.3);
    
    return Math.min(avgRelevance + sourceCountBonus, 1.0);
  }

  private synthesizeResponse<T>(sources: RAGSource[], query: string): T {
    // Simple synthesis - combine relevant information
    const combinedContent = sources
      .map(source => `${source.title}: ${source.content.substring(0, 200)}...`)
      .join('\n\n');

    return {
      answer: `Based on ${sources.length} relevant sources: ${combinedContent}`,
      sources: sources.map(source => ({
        id: source.id,
        type: source.type,
        title: source.title,
        relevance: (source as any).relevance
      })),
      query,
      timestamp: new Date().toISOString()
    } as T;
  }

  private generateCacheKey(query: string, options?: RAGQueryOptions): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${query.toLowerCase()}:${optionsStr}`;
  }

  private findSourceById(id: string): RAGSource | null {
    for (const sources of Array.from(this.ragIndex.values())) {
      const source = sources.find(s => s.id === id);
      if (source) return source;
    }
    return null;
  }

  private async loadExistingRAGData(): Promise<void> {
    // In real implementation, load from persistent storage
    // For now, create some sample data
    const sampleSources: RAGSource[] = [
      {
        id: 'sample-doc-1',
        type: 'documentation',
        title: 'LocalMCP Architecture',
        content: 'LocalMCP is a local MCP server for vibe coders who want AI assistance without deep framework expertise.',
        relevance: 0,
        metadata: { version: '1.0', author: 'LocalMCP Team' }
      },
      {
        id: 'sample-lesson-1',
        type: 'lesson',
        title: 'React Component Best Practices',
        content: 'When creating React components, use functional components with hooks, maintain single responsibility, and use TypeScript for better developer experience.',
        relevance: 0,
        metadata: { project: 'frontend', confidence: 0.9 }
      },
      {
        id: 'sample-pattern-1',
        type: 'pattern',
        title: 'Error Handling Pattern',
        content: 'Always wrap async operations in try-catch blocks, provide meaningful error messages, and log errors for debugging.',
        relevance: 0,
        metadata: { language: 'typescript', category: 'error-handling' }
      }
    ];

    await this.indexRAGData(sampleSources);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearCache();
    this.clearIndex();
    this.emit('serviceDestroyed');
  }
}

export default RAGOnlyService;
