import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';

export interface Context7MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  cached?: boolean;
  responseTime?: number;
}

export interface LibraryInfo {
  id: string;
  name: string;
  description: string;
  version?: string;
  url?: string;
}

/**
 * Context7MCPClientService - MCP client for Context7 server
 * 
 * Provides MCP protocol communication with the official Context7 MCP server
 * for enhanced documentation retrieval and library resolution.
 * 
 * This service acts as a bridge to the Context7 MCP server running
 * as a sidecar process, providing better integration than direct API calls.
 */
export class Context7MCPClientService {
  private mcpServerUrl: string;
  private enabled: boolean;
  private timeout: number;

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {
    const mcpConfig = this.config.getNested('context7', 'mcp');
    this.enabled = mcpConfig.enabled;
    this.mcpServerUrl = mcpConfig.serverUrl;
    this.timeout = mcpConfig.timeout || 30000;

    if (this.enabled) {
      this.logger.info('Context7 MCP client initialized', {
        serverUrl: this.mcpServerUrl,
        timeout: this.timeout
      });
    } else {
      this.logger.info('Context7 MCP client disabled');
    }
  }

  async resolveLibraryId(libraryName: string): Promise<Context7MCPResponse> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Context7 MCP client is disabled'
      };
    }

    try {
      this.logger.info(`Resolving library ID for: ${libraryName}`);

      const response = await this.makeMCPRequest('resolve-library-id', {
        libraryName
      });

      return {
        success: true,
        data: response,
        cached: false,
        responseTime: 0 // MCP responses are typically fast
      };
    } catch (error) {
      this.logger.error('Failed to resolve library ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getLibraryDocs(
    libraryId: string,
    topic?: string,
    tokens: number = 5000
  ): Promise<Context7MCPResponse> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Context7 MCP client is disabled'
      };
    }

    try {
      this.logger.info(`Getting library docs for: ${libraryId}`, { topic, tokens });

      const response = await this.makeMCPRequest('get-library-docs', {
        context7CompatibleLibraryID: libraryId,
        topic,
        tokens
      });

      return {
        success: true,
        data: response,
        cached: false,
        responseTime: 0
      };
    } catch (error) {
      this.logger.error('Failed to get library docs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async searchLibraries(query: string): Promise<Context7MCPResponse> {
    if (!this.enabled) {
      return {
        success: false,
        error: 'Context7 MCP client is disabled'
      };
    }

    try {
      this.logger.info(`Searching libraries for: ${query}`);

      const response = await this.makeMCPRequest('search-libraries', {
        query
      });

      return {
        success: true,
        data: response,
        cached: false,
        responseTime: 0
      };
    } catch (error) {
      this.logger.error('Failed to search libraries:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async makeMCPRequest(method: string, params: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.mcpServerUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: method,
          params: params
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MCP server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`MCP error: ${result.error.message || result.error}`);
      }

      return result.result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.mcpServerUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      this.logger.warn('Context7 MCP health check failed:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async getServerInfo(): Promise<{ name: string; version: string; capabilities: string[] } | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await this.makeMCPRequest('get-server-info', {});
      return response;
    } catch (error) {
      this.logger.error('Failed to get server info:', error);
      return null;
    }
  }
}
