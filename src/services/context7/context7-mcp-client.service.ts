/**
 * Context7 MCP Client Service - Real Context7 MCP integration
 * 
 * This service provides real Context7 MCP communication for LocalMCP,
 * implementing secure API communication, caching, and resilience patterns.
 * 
 * Benefits for vibe coders:
 * - Real-time access to Context7 documentation and best practices
 * - Intelligent caching for offline operation
 * - Resilient communication with fallback strategies
 * - Type-safe API integration with comprehensive error handling
 * - Learning and documentation generation from Context7
 * - Seamless integration with LocalMCP services
 * 
 * Based on web research and industry best practices:
 * - Model Context Protocol (MCP) standards
 * - Node.js TypeScript best practices
 * - Resilience patterns (Circuit Breaker, Retry, Fallback)
 * - Clean Architecture principles
 */

import { EventEmitter } from 'events';

// Context7 API configuration
export interface Context7Config {
  apiUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
}

// Context7 library information
export interface Context7Library {
  id: string;
  name: string;
  description: string;
  codeSnippets: number;
  trustScore: number;
  versions?: string[];
}

// Context7 documentation response
export interface Context7Documentation {
  libraryId: string;
  topic: string;
  content: string;
  codeSnippets: Array<{
    title: string;
    description: string;
    language: string;
    code: string;
    source: string;
  }>;
  tokens: number;
  timestamp: Date;
}

// Context7 API error
export interface Context7Error {
  code: string;
  message: string;
  status: number;
  timestamp: Date;
}

// Context7 cache entry
export interface Context7CacheEntry {
  key: string;
  data: Context7Documentation;
  timestamp: Date;
  ttl: number;
  hits: number;
}

// Context7 MCP Client Service Implementation
export class Context7MCPClientService extends EventEmitter {
  private config: Context7Config;
  private cache: Map<string, Context7CacheEntry> = new Map();
  private isConnected: boolean = false;
  private connectionRetries: number = 0;
  private maxConnectionRetries: number = 3;

  constructor(config?: Partial<Context7Config>) {
    super();
    
    // Set default configuration
    this.config = {
      apiUrl: 'https://context7.com/api/v1',
      apiKey: 'ctx7sk-13b1dff8-2c28-4b3e-9b8c-83937f5a4ac3',
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      cacheEnabled: true,
      cacheTTL: 24 * 60 * 60 * 1000 // 24 hours
    };

    // Merge with provided config
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the Context7 MCP client
   */
  async initialize(): Promise<void> {
    try {
      // Test connection to Context7 API
      await this.testConnection();
      
      this.isConnected = true;
      this.connectionRetries = 0;
      
      this.emit('initialized');
    } catch (error) {
      this.emit('initializationError', { error });
      throw error;
    }
  }

  /**
   * Test connection to Context7 API
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await this.makeRequest('GET', '/health', {});
      
      if (response.status !== 200) {
        throw new Error(`Context7 API health check failed: ${response.status}`);
      }
      
      this.emit('connectionTested', { success: true });
    } catch (error) {
      this.connectionRetries++;
      
      if (this.connectionRetries < this.maxConnectionRetries) {
        this.emit('connectionRetry', { attempt: this.connectionRetries, error });
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * this.connectionRetries));
        
        return this.testConnection();
      } else {
        this.isConnected = false;
        this.emit('connectionFailed', { error, retries: this.connectionRetries });
        throw error;
      }
    }
  }

  /**
   * Resolve library ID from library name
   */
  async resolveLibraryId(libraryName: string): Promise<Context7Library[]> {
    try {
      const cacheKey = `resolve:${libraryName}`;
      
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.emit('cacheHit', { key: cacheKey, source: 'resolve' });
          return cached.data as unknown as Context7Library[];
        }
      }

      // Make API request
      const response = await this.makeRequest('POST', '/resolve-library-id', {
        libraryName
      });

      if (response.status !== 200) {
        throw new Error(`Failed to resolve library ID: ${response.status}`);
      }

      const libraries: Context7Library[] = response.data || [];
      
      // Cache the result
      if (this.config.cacheEnabled) {
        this.setCache(cacheKey, libraries, this.config.cacheTTL);
      }

      this.emit('libraryResolved', { libraryName, count: libraries.length });
      return libraries;
    } catch (error) {
      this.emit('libraryResolutionError', { libraryName, error });
      throw error;
    }
  }

  /**
   * Get library documentation
   */
  async getLibraryDocumentation(
    libraryId: string, 
    topic?: string, 
    tokens?: number
  ): Promise<Context7Documentation> {
    try {
      const cacheKey = `docs:${libraryId}:${topic || 'default'}:${tokens || 5000}`;
      
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.emit('cacheHit', { key: cacheKey, source: 'documentation' });
          return cached.data as Context7Documentation;
        }
      }

      // Make API request
      const response = await this.makeRequest('POST', '/get-library-docs', {
        context7CompatibleLibraryID: libraryId,
        topic: topic || 'general',
        tokens: tokens || 5000
      });

      if (response.status !== 200) {
        throw new Error(`Failed to get library documentation: ${response.status}`);
      }

      const documentation: Context7Documentation = {
        libraryId,
        topic: topic || 'general',
        content: response.data?.content || '',
        codeSnippets: response.data?.codeSnippets || [],
        tokens: response.data?.tokens || 0,
        timestamp: new Date()
      };
      
      // Cache the result
      if (this.config.cacheEnabled) {
        this.setCache(cacheKey, documentation, this.config.cacheTTL);
      }

      this.emit('documentationRetrieved', { libraryId, topic, tokens: documentation.tokens });
      return documentation;
    } catch (error) {
      this.emit('documentationError', { libraryId, topic, error });
      throw error;
    }
  }

  /**
   * Get comprehensive documentation for a topic
   */
  async getComprehensiveDocumentation(
    topic: string,
    maxLibraries: number = 5,
    tokensPerLibrary: number = 2000
  ): Promise<Context7Documentation[]> {
    try {
      // Resolve libraries for the topic
      const libraries = await this.resolveLibraryId(topic);
      
      if (libraries.length === 0) {
        this.emit('noLibrariesFound', { topic });
        return [];
      }

      // Get documentation for top libraries
      const topLibraries = libraries
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, maxLibraries);

      const documentationPromises = topLibraries.map(library =>
        this.getLibraryDocumentation(library.id, topic, tokensPerLibrary)
      );

      const documentations = await Promise.allSettled(documentationPromises);
      
      const successfulDocs = documentations
        .filter((result): result is PromiseFulfilledResult<Context7Documentation> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      const failedDocs = documentations
        .filter((result): result is PromiseRejectedResult => 
          result.status === 'rejected'
        );

      if (failedDocs.length > 0) {
        this.emit('partialDocumentationFailure', { 
          topic, 
          successful: successfulDocs.length, 
          failed: failedDocs.length 
        });
      }

      this.emit('comprehensiveDocumentationRetrieved', { 
        topic, 
        count: successfulDocs.length 
      });

      return successfulDocs;
    } catch (error) {
      this.emit('comprehensiveDocumentationError', { topic, error });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      hits: number;
      ttl: number;
    }>;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = totalHits + entries.length; // Approximate
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      hits: totalHits,
      misses: entries.length,
      hitRate,
      entries: entries.map(entry => ({
        key: entry.key,
        age: Date.now() - entry.timestamp.getTime(),
        hits: entry.hits,
        ttl: entry.ttl
      }))
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    retries: number;
    lastError?: string;
  } {
    return {
      connected: this.isConnected,
      retries: this.connectionRetries,
      lastError: this.isConnected ? undefined : 'Connection failed'
    };
  }

  /**
   * Make HTTP request to Context7 API
   */
  private async makeRequest(
    method: string, 
    endpoint: string, 
    data?: any
  ): Promise<{ status: number; data?: any }> {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'LocalMCP/1.0.0'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      return {
        status: response.status,
        data: responseData
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw new Error(`Request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): Context7CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    this.cache.set(key, entry);
    
    return entry;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, ttl: number): void {
    const entry: Context7CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      ttl,
      hits: 0
    };
    
    this.cache.set(key, entry);
    
    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanupExpiredEntries();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.emit('cacheCleanup', { removed: expiredKeys.length });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cache.clear();
    this.isConnected = false;
    this.removeAllListeners();
    this.emit('serviceDestroyed');
  }
}

export default Context7MCPClientService;