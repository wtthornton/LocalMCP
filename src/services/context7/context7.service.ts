import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';

export interface Context7Response {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
  responseTime?: number;
}

export interface Context7Query {
  query: string;
  library?: string | undefined;
  topic?: string | undefined;
  maxTokens?: number | undefined;
}

/**
 * Context7Service - External documentation caching and retrieval
 * 
 * Integrates with Context7 API to provide cached documentation
 * and best practices for faster AI assistance.
 */
export class Context7Service {
  private apiKey: string | undefined;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {
    this.apiKey = config.getNested('context7', 'apiKey');
    this.baseUrl = config.getNested('context7', 'baseUrl');
    
    if (!this.apiKey) {
      this.logger.warn('Context7 API key not provided. Context7 features will be disabled.');
    }
  }

  async query(query: Context7Query): Promise<Context7Response> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Context7 API key not configured'
      };
    }

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query);

    try {
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.logger.debug('Context7 cache hit', { query: query.query });
        return {
          success: true,
          data: cached.data,
          cached: true,
          responseTime: Date.now() - startTime
        };
      }

      // Make API request
      const response = await this.makeApiRequest(query);
      const responseTime = Date.now() - startTime;

      if (response.success) {
        // Cache the response
        this.setCache(cacheKey, response.data);
        
        this.logger.info('Context7 query successful', {
          query: query.query,
          responseTime,
          cached: false
        });

        return {
          success: true,
          data: response.data,
          cached: false,
          responseTime
        };
      } else {
        // Fallback mode: Return a helpful response instead of failing
        this.logger.warn(`Context7 API failed: ${response.error}. Using fallback mode.`);
        return this.getFallbackResponse(query, responseTime);
      }

    } catch (error) {
      this.logger.error('Context7 query failed:', error);
      // Use fallback mode instead of failing
      return this.getFallbackResponse(query, Date.now() - startTime);
    }
  }

  async getLibraryDocs(libraryId: string, topic?: string, maxTokens?: number): Promise<Context7Response> {
    return this.query({
      query: `Get documentation for ${libraryId}`,
      library: libraryId,
      topic: topic || undefined,
      maxTokens: maxTokens || 5000
    });
  }

  async searchBestPractices(technology: string, topic: string): Promise<Context7Response> {
    return this.query({
      query: `Best practices for ${technology} ${topic}`,
      topic: `${technology}-${topic}`,
      maxTokens: 3000
    });
  }

  async getCodeExamples(technology: string, pattern: string): Promise<Context7Response> {
    return this.query({
      query: `Code examples for ${technology} ${pattern}`,
      topic: `${technology}-examples`,
      maxTokens: 2000
    });
  }

  private async makeApiRequest(query: Context7Query): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Try different endpoints based on the query type
      let url = `${this.baseUrl}/search`;
      let method = 'GET';
      let body: any = undefined;
      
      if (query.library) {
        // If we have a specific library, try to get its documentation
        url = `${this.baseUrl}/v1/${query.library}`;
        method = 'GET';
      } else {
        // For general queries, use search endpoint
        url = `${this.baseUrl}/search`;
        method = 'GET';
      }
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'LocalMCP/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (method === 'POST') {
        body = JSON.stringify({
          query: query.query,
          topic: query.topic,
          max_tokens: query.maxTokens || 5000
        });
      } else {
        // For GET requests, add query parameters
        const params = new URLSearchParams();
        params.append('q', query.query);
        if (query.topic) params.append('topic', query.topic);
        if (query.maxTokens) params.append('tokens', query.maxTokens.toString());
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body
      });

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if we got empty results (authentication issue)
      if (data && typeof data === 'object' && data.results && Array.isArray(data.results) && data.results.length === 0) {
        this.logger.warn('Context7 API returned empty results - this may indicate an authentication issue');
        return {
          success: false,
          error: 'Context7 API returned empty results. This may indicate an authentication issue or the API key format is incorrect.',
          data: null
        };
      }
      
      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown API error'
      };
    }
  }

  private generateCacheKey(query: Context7Query): string {
    return `${query.library || 'general'}:${query.topic || 'default'}:${query.query}:${query.maxTokens || 5000}`;
  }

  private getFallbackResponse(query: Context7Query, responseTime: number): Context7Response {
    // Provide helpful fallback responses based on the query
    const fallbackData = {
      source: 'LocalMCP Fallback',
      query: query.query,
      topic: query.topic,
      library: query.library,
      message: 'Context7 API is currently unavailable. Using LocalMCP fallback knowledge.',
      suggestions: this.getFallbackSuggestions(query),
      note: 'This is a fallback response. Context7 integration will be fixed in a future update.'
    };

    return {
      success: true,
      data: fallbackData,
      cached: false,
      responseTime
    };
  }

  private getFallbackSuggestions(query: Context7Query): string[] {
    const suggestions: string[] = [];
    
    if (query.query.toLowerCase().includes('react')) {
      suggestions.push('Check React documentation at react.dev');
      suggestions.push('Use React DevTools for debugging');
      suggestions.push('Consider using TypeScript for better type safety');
    }
    
    if (query.query.toLowerCase().includes('typescript')) {
      suggestions.push('Check TypeScript handbook at typescriptlang.org');
      suggestions.push('Use strict mode for better type checking');
      suggestions.push('Consider using interfaces for object shapes');
    }
    
    if (query.query.toLowerCase().includes('node')) {
      suggestions.push('Check Node.js documentation at nodejs.org');
      suggestions.push('Use npm for package management');
      suggestions.push('Consider using TypeScript with Node.js');
    }
    
    if (query.query.toLowerCase().includes('css') || query.query.toLowerCase().includes('style')) {
      suggestions.push('Check MDN CSS documentation');
      suggestions.push('Consider using CSS modules or styled-components');
      suggestions.push('Use CSS Grid and Flexbox for layouts');
    }
    
    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Check official documentation for the technology');
      suggestions.push('Use TypeScript for better development experience');
      suggestions.push('Consider using modern development tools');
    }
    
    return suggestions;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    const ttl = this.config.getNested('context7', 'cacheTtl');
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clean up old cache entries
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = Date.now();
    const ttl = this.config.getNested('context7', 'cacheTtl') * 1000;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats(): { size: number; hitRate: number; keys: string[] } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for real calculation
      keys: Array.from(this.cache.keys())
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.info('Context7 cache cleared');
  }
}
