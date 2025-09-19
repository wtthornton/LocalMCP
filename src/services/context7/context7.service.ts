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
 * Context7Service - Simple external documentation retrieval
 * 
 * Integrates with Context7 API to provide documentation
 * for faster AI assistance.
 */
export class Context7Service {
  private apiKey: string | undefined;
  private baseUrl: string;
  private enabled: boolean;

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {
    this.apiKey = config.getNested('context7', 'apiKey');
    this.baseUrl = config.getNested('context7', 'baseUrl') || 'https://mcp.context7.com/mcp';
    this.enabled = config.getNested('context7', 'enabled') || false;
    
    this.logger.info('Context7 service configured', { 
      baseUrl: this.baseUrl, 
      enabled: this.enabled,
      hasApiKey: !!this.apiKey
    });
    
    if (!this.apiKey) {
      this.logger.warn('Context7 API key not provided. Context7 features will be disabled.');
    } else {
      this.logger.info('Context7 service initialized with direct API integration');
    }
  }

  /**
   * Get cached documentation for a framework
   */
  async getCachedDocumentation(framework: string): Promise<string | null> {
    if (!this.enabled || !this.apiKey) {
      this.logger.debug('Context7 disabled or no API key');
      return null;
    }

    try {
      const query: Context7Query = {
        query: `best practices for ${framework}`,
        library: framework,
        maxTokens: 1000
      };

      const response = await this.queryContext7(query);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      this.logger.warn('Failed to get Context7 documentation', { 
        framework, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  /**
   * Query Context7 MCP server using the search endpoint
   */
  private async queryContext7(query: Context7Query): Promise<Context7Response> {
    const startTime = Date.now();
    
    try {
      // Context7 is an MCP server, use the MCP endpoint
      const searchUrl = `${this.baseUrl}/search?query=${encodeURIComponent(query.query)}`;
      this.logger.info('Making Context7 MCP request', { url: searchUrl });
      
      const searchQueryResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'LocalMCP-Context7Client/1.0.0',
          'Content-Type': 'application/json'
        }
      });

      if (!searchQueryResponse.ok) {
        throw new Error(`Context7 MCP search error: ${searchQueryResponse.status} ${searchQueryResponse.statusText}`);
      }

      const searchData = await searchQueryResponse.json();
      const responseTime = Date.now() - startTime;

      this.logger.info('Context7 MCP search query successful', { 
        query: query.query,
        responseTime,
        resultsCount: searchData.results?.length || 0
      });

      // Format the response for our use case
      const formattedData = this.formatContext7Response(searchData, query.query);

      return {
        success: true,
        data: formattedData,
        responseTime,
        cached: false
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.error('Context7 MCP API query failed', { 
        error: (error as Error).message,
        query: query.query,
        responseTime
      });
      
      return {
        success: false,
        error: (error as Error).message,
        responseTime
      };
    }
  }

  /**
   * Format Context7 search response into useful documentation
   */
  private formatContext7Response(searchData: any, query: string): string {
    if (!searchData.results || !Array.isArray(searchData.results)) {
      return `No Context7 documentation found for "${query}"`;
    }

    const results = searchData.results.slice(0, 3); // Take top 3 results
    let formatted = `Context7 Documentation for "${query}":\n\n`;

    results.forEach((result: any, index: number) => {
      formatted += `${index + 1}. **${result.title}**\n`;
      if (result.description) {
        formatted += `   ${result.description}\n`;
      }
      if (result.url) {
        formatted += `   URL: ${result.url}\n`;
      }
      formatted += `\n`;
    });

    return formatted;
  }
}