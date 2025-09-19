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
 * Context7Service - External documentation retrieval via MCP protocol
 * 
 * Integrates with Context7 MCP server to provide real-time documentation
 * and best practices for faster AI assistance.
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
      this.logger.info('Context7 service initialized with MCP protocol integration');
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
   * Query Context7 MCP server using proper MCP protocol
   */
  private async queryContext7(query: Context7Query): Promise<Context7Response> {
    const startTime = Date.now();
    
    try {
      // Use proper MCP protocol for Context7
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: {
            libraryName: query.query
          }
        }
      };

      this.logger.info('Making Context7 MCP request', { 
        method: 'resolve-library-id',
        libraryName: query.query 
      });
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'PromptMCP-Context7Client/1.0.0'
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`Context7 MCP error: ${response.status} ${response.statusText}`);
      }

      const mcpResponse = await response.json();
      const responseTime = Date.now() - startTime;

      if (mcpResponse.error) {
        throw new Error(`Context7 MCP error: ${mcpResponse.error.message}`);
      }

      this.logger.info('Context7 MCP request successful', { 
        query: query.query,
        responseTime,
        hasContent: !!mcpResponse.content
      });

      // Format the response for our use case
      const formattedData = this.formatContext7Response(mcpResponse, query.query);

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
   * Format Context7 MCP response into useful documentation
   */
  private formatContext7Response(mcpResponse: any, query: string): string {
    // Extract content from MCP response
    const content = mcpResponse.content?.[0];
    if (!content || content.type !== 'text') {
      return `No Context7 documentation found for "${query}".`;
    }

    const text = content.text;
    
    // Parse the library resolution response
    const lines = text.split('\n');
    let formattedResults = '';
    
    // Look for library information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('Context7-compatible library ID:')) {
        const libraryId = line.split('Context7-compatible library ID:')[1]?.trim();
        if (libraryId) {
          formattedResults += `## Library ID: ${libraryId}\n\n`;
        }
      }
      
      if (line.includes('Description:')) {
        const description = line.split('Description:')[1]?.trim();
        if (description) {
          formattedResults += `**Description:** ${description}\n\n`;
        }
      }
      
      if (line.includes('Code Snippets:')) {
        const snippets = line.split('Code Snippets:')[1]?.trim();
        if (snippets) {
          formattedResults += `**Code Snippets:** ${snippets}\n\n`;
        }
      }
      
      if (line.includes('Trust Score:')) {
        const trustScore = line.split('Trust Score:')[1]?.trim();
        if (trustScore) {
          formattedResults += `**Trust Score:** ${trustScore}\n\n`;
        }
      }
    }

    if (!formattedResults) {
      // Fallback: return the raw text if we can't parse it
      formattedResults = text;
    }

    return `# Context7 Documentation for "${query}"\n\n${formattedResults}`;
  }
}