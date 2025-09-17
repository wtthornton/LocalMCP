/**
 * Context7 MCP Client Service - Real Context7 MCP communication
 * 
 * This service provides real communication with Context7 MCP server
 * using the actual API endpoints and authentication.
 * 
 * Benefits for vibe coders:
 * - Real-time access to up-to-date documentation
 * - Version-specific code examples and snippets
 * - Automatic library resolution and discovery
 * - Seamless integration with LocalMCP tools
 * - Cached responses for improved performance
 */

import { EventEmitter } from 'events';

// Context7 MCP request/response types
export interface Context7Request {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface Context7Response<T = any> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Library resolution result
export interface LibraryResolutionResult {
  libraryId: string;
  name: string;
  description: string;
  codeSnippets: number;
  trustScore: number;
  versions?: string[];
}

// Library documentation result
export interface LibraryDocumentationResult {
  content: string;
  libraryId: string;
  topic?: string;
  tokens: number;
}

// Context7 MCP Client Service Implementation
export class Context7MCPClientService extends EventEmitter {
  private mcpUrl: string;
  private apiKey: string;
  private requestId: number = 0;
  private cache: Map<string, any> = new Map();
  private isConnected: boolean = false;
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    averageResponseTime: 0,
    totalResponseTime: 0
  };

  constructor(mcpUrl?: string, apiKey?: string) {
    super();
    
    this.mcpUrl = mcpUrl || 'https://mcp.context7.com/mcp';
    this.apiKey = apiKey || process.env.CONTEXT7_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('Context7 API key is required');
    }
    
    this.initializeService();
  }

  /**
   * Resolve library ID from library name
   */
  async resolveLibraryId(libraryName: string): Promise<LibraryResolutionResult[]> {
    const cacheKey = `resolve:${libraryName}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      this.emit('cacheHit', { operation: 'resolveLibraryId', libraryName });
      return this.cache.get(cacheKey);
    }

    try {
      const result = await this.makeMCPRequest('resolve-library-id', { libraryName });
      
      if (result.result) {
        // Cache successful results
        this.cache.set(cacheKey, result.result);
        this.stats.successfulRequests++;
        this.emit('libraryResolved', { libraryName, results: result.result.length });
        
        return result.result;
      } else {
        throw new Error(result.error?.message || 'Failed to resolve library');
      }
    } catch (error) {
      this.stats.failedRequests++;
      this.emit('libraryResolutionFailed', { 
        libraryName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get library documentation
   */
  async getLibraryDocs(
    libraryId: string, 
    options?: { topic?: string; tokens?: number }
  ): Promise<LibraryDocumentationResult> {
    const cacheKey = `docs:${libraryId}:${options?.topic || 'default'}:${options?.tokens || 5000}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      this.emit('cacheHit', { operation: 'getLibraryDocs', libraryId, topic: options?.topic });
      return this.cache.get(cacheKey);
    }

    try {
      const params: any = { context7CompatibleLibraryID: libraryId };
      if (options?.topic) params.topic = options.topic;
      if (options?.tokens) params.tokens = options.tokens;

      const result = await this.makeMCPRequest('get-library-docs', params);
      
      if (result.result) {
        // Cache successful results
        this.cache.set(cacheKey, result.result);
        this.stats.successfulRequests++;
        this.emit('documentationRetrieved', { 
          libraryId, 
          topic: options?.topic,
          tokens: options?.tokens 
        });
        
        return result.result;
      } else {
        throw new Error(result.error?.message || 'Failed to get library documentation');
      }
    } catch (error) {
      this.stats.failedRequests++;
      this.emit('documentationFailed', { 
        libraryId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Get documentation for a specific topic
   */
  async getDocumentation(
    libraryName: string, 
    topic?: string, 
    tokens: number = 5000
  ): Promise<string> {
    try {
      // First resolve the library ID
      const libraries = await this.resolveLibraryId(libraryName);
      
      if (libraries.length === 0) {
        throw new Error(`No libraries found for: ${libraryName}`);
      }

      // Use the first (most relevant) library
      const library = libraries[0];
      
      // Get documentation
      const docs = await this.getLibraryDocs(library.libraryId, { topic, tokens });
      
      return docs.content;
    } catch (error) {
      this.emit('documentationError', { 
        libraryName, 
        topic, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Check if Context7 MCP is available and working
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Try to resolve a common library to test connection
      await this.resolveLibraryId('react');
      this.isConnected = true;
      this.emit('connectionEstablished');
      return true;
    } catch (error) {
      this.isConnected = false;
      this.emit('connectionFailed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      cacheSize: this.cache.size,
      mcpUrl: this.mcpUrl,
      hasApiKey: !!this.apiKey
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cacheCleared', { size });
  }

  /**
   * Update API key
   */
  updateApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
    this.clearCache(); // Clear cache when API key changes
    this.emit('apiKeyUpdated');
  }

  /**
   * Update MCP URL
   */
  updateMCPUrl(newUrl: string): void {
    this.mcpUrl = newUrl;
    this.clearCache(); // Clear cache when URL changes
    this.emit('mcpUrlUpdated', { newUrl });
  }

  // Private helper methods

  private async initializeService(): Promise<void> {
    // Test connection on startup
    await this.checkConnection();
    this.emit('serviceInitialized', { mcpUrl: this.mcpUrl, hasApiKey: !!this.apiKey });
  }

  private async makeMCPRequest(method: string, params?: any): Promise<Context7Response> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const request: Context7Request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };

    try {
      const response = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CONTEXT7_API_KEY': this.apiKey,
          'User-Agent': 'LocalMCP/1.0.0'
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: Context7Response = await response.json();
      
      const responseTime = Date.now() - startTime;
      this.stats.totalResponseTime += responseTime;
      this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalRequests;

      this.emit('mcpRequestCompleted', { 
        method, 
        responseTime, 
        success: !result.error 
      });

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.stats.failedRequests++;
      
      this.emit('mcpRequestFailed', { 
        method, 
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime 
      });

      throw error;
    }
  }

  /**
   * Get cached data if available
   */
  private getCachedData<T>(key: string): T | null {
    return this.cache.get(key) || null;
  }

  /**
   * Set cached data
   */
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, data);
  }

  /**
   * Generate cache key for requests
   */
  private generateCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearCache();
    this.emit('serviceDestroyed');
  }
}

export default Context7MCPClientService;