/**
 * Real Context7 MCP Client - Direct MCP implementation
 * 
 * This service provides real Context7 MCP communication using the MCP SDK,
 * implementing direct HTTP communication with Context7 MCP server.
 * 
 * Benefits for vibe coders:
 * - Real-time access to Context7 documentation and best practices
 * - Proper MCP protocol communication
 * - Reliable stdio transport connection
 * - Type-safe API integration with comprehensive error handling
 */

// Direct HTTP implementation for Context7 MCP server

export interface Context7MCPConfig {
  apiKey: string;
  mcpUrl: string;
  timeout: number;
}

export interface Context7LibraryDoc {
  id: string;
  title: string;
  content: string;
  url?: string;
  version: string;
  lastUpdated: Date;
  relevanceScore: number;
}

export class Context7MCPClientReal {
  private config: Context7MCPConfig;
  private isConnected: boolean = false;
  private baseUrl: string;

  constructor(config: Context7MCPConfig) {
    this.config = config;
    this.baseUrl = 'https://mcp.context7.com/mcp';
    
    if (!this.config.apiKey) {
      throw new Error('Context7 API key is required');
    }
  }

  /**
   * Connect to Context7 MCP server (HTTP-based)
   */
  async connect(): Promise<void> {
    try {
      // Test connection with a simple ping
      await this.ping();
      this.isConnected = true;
    } catch (error) {
      console.error('❌ Failed to connect to Context7 MCP server:', error);
      throw new Error(
        `Context7 MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect from Context7 MCP server
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Make HTTP request to Context7 MCP server using proper MCP protocol
   */
  private async makeMCPRequest(method: string, params: any): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'User-Agent': 'PromptMCP-Context7Client/1.0.0'
    };

    const mcpRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: method,
      params: params
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(mcpRequest)
    });

    if (!response.ok) {
      throw new Error(`Context7 MCP HTTP error: ${response.status} ${response.statusText}`);
    }

    // Handle Server-Sent Events response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      return await this.parseSSEResponse(response);
    } else {
      // Handle JSON response
      const result = await response.json();
      if (result.error) {
        throw new Error(`Context7 MCP error: ${result.error.message}`);
      }
      return result;
    }
  }

  /**
   * Parse Server-Sent Events response
   */
  private async parseSSEResponse(response: Response): Promise<any> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let result = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        result += chunk;
      }
    } finally {
      reader.releaseLock();
    }

    // Parse the complete SSE response
    const lines = result.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for data lines
      if (line?.startsWith('data: ')) {
        const jsonData = line.substring(6);
        if (jsonData.trim() && jsonData !== '[DONE]') {
          try {
            return JSON.parse(jsonData);
          } catch (e) {
            // Continue to next data line
          }
        }
      }
      
      // Look for event: message followed by data
      if (line?.startsWith('event: message') && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (nextLine?.startsWith('data: ')) {
          const jsonData = nextLine.substring(6);
          if (jsonData.trim() && jsonData !== '[DONE]') {
            try {
              return JSON.parse(jsonData);
            } catch (e) {
              // Continue to next data line
            }
          }
        }
      }
    }

    // If we couldn't parse SSE, try to parse the entire result as JSON
    try {
      return JSON.parse(result);
    } catch (e) {
      throw new Error(`Failed to parse Context7 MCP response: ${result.substring(0, 200)}...`);
    }
  }


  /**
   * Resolve library ID using Context7 MCP
   */
  async resolveLibraryId(libraryName: string): Promise<string | null> {
    if (!this.isConnected) {
      throw new Error('Context7 MCP client not connected');
    }

    try {
      const result = await this.makeMCPRequest('tools/call', {
        name: 'resolve-library-id',
        arguments: {
          libraryName,
        },
      });

      // Extract library ID from result
      const content = result?.result?.content?.[0];
      if (content?.type === 'text') {
        // Parse the text response to extract the best library ID
        const text = content.text;
        
        // Look for the highest trust score library
        const lines = text.split('\n');
        let bestLibraryId = null;
        let highestTrustScore = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('Context7-compatible library ID:')) {
            const libraryId = line.split('Context7-compatible library ID:')[1]?.trim();
            if (libraryId) {
              // Look for trust score in the next few lines
              for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                if (lines[j].includes('Trust Score:')) {
                  const trustScore = parseFloat(lines[j].split('Trust Score:')[1]?.trim() || '0');
                  if (trustScore > highestTrustScore) {
                    highestTrustScore = trustScore;
                    bestLibraryId = libraryId;
                  }
                  break;
                }
              }
            }
          }
        }
        
        return bestLibraryId;
      }

      return null;
    } catch (error) {
      console.error(`Error resolving library ID for ${libraryName}:`, error);
      return null;
    }
  }

  /**
   * Get library documentation using Context7 MCP
   */
  async getLibraryDocs(
    libraryId: string,
    topic: string,
    version: string = 'latest'
  ): Promise<Context7LibraryDoc[]> {
    if (!this.isConnected) {
      throw new Error('Context7 MCP client not connected');
    }

    try {
      const result = await this.makeMCPRequest('tools/call', {
        name: 'get-library-docs',
        arguments: {
          context7CompatibleLibraryID: libraryId,
          topic: topic,
          tokens: 4000,
        },
      });

      // Extract documentation from result
      const content = result?.result?.content?.[0];
      
      if (content?.type === 'text') {
        // Create documentation from the text response
        return [{
          id: `doc-${libraryId}-${Date.now()}`,
          title: `${topic} Documentation for ${libraryId}`,
          content: content.text,
          version,
          lastUpdated: new Date(),
          relevanceScore: 0.9,
        }];
      }

      return [];
    } catch (error) {
      console.error(`Error getting library docs for ${libraryId}:`, error);
      return [];
    }
  }

  /**
   * Transform raw docs to Context7LibraryDoc format
   */
  private transformDocs(docs: any[]): Context7LibraryDoc[] {
    return docs.map((doc: any, index: number) => ({
      id: doc.id || `doc-${Date.now()}-${index}`,
      title: doc.title || 'Documentation',
      content: doc.content || doc.text || doc.description || '',
      url: doc.url || doc.link,
      version: doc.version || 'latest',
      lastUpdated: doc.lastUpdated ? new Date(doc.lastUpdated) : new Date(),
      relevanceScore: doc.relevanceScore || doc.score || 0.8,
    }));
  }

  /**
   * Ping the Context7 MCP server
   */
  private async ping(): Promise<void> {
    try {
      // Test the MCP connection with a simple tool call
      await this.makeMCPRequest('tools/call', {
        name: 'resolve-library-id',
        arguments: {
          libraryName: 'test'
        }
      });
    } catch (error) {
      throw new Error(`Ping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check for MCP connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.ping();
      return true;
    } catch (error) {
      console.error('Context7 MCP health check failed:', error);
      return false;
    }
  }

  /**
   * List available tools from Context7 MCP
   */
  async listTools(): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('Context7 MCP client not connected');
    }

    try {
      const result = await this.makeMCPRequest('tools/list', {});
      return result.tools || [];
    } catch (error) {
      console.error('Error listing Context7 MCP tools:', error);
      return [];
    }
  }
}
