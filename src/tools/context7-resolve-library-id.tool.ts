/**
 * Context7 Resolve Library ID Tool
 * 
 * Real Context7 MCP tool that calls the actual Context7 MCP server
 * No mocked data - uses real Context7 API
 */

import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';

export interface Context7ResolveLibraryIdRequest {
  libraryName: string;
}

export interface Context7ResolveLibraryIdResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export class Context7ResolveLibraryIdTool {
  private logger: Logger;
  private config: ConfigService;
  private context7McpUrl: string;

  constructor(logger: Logger, config: ConfigService) {
    this.logger = logger;
    this.config = config;
    this.context7McpUrl = 'https://mcp.context7.com/mcp';
  }

  /**
   * Resolves a library name to Context7 library information using real Context7 MCP
   */
  async resolveLibraryId(request: Context7ResolveLibraryIdRequest): Promise<Context7ResolveLibraryIdResponse> {
    const { libraryName } = request;
    
    this.logger.debug('Calling real Context7 MCP to resolve library ID', { libraryName });

    try {
      // Call the real Context7 MCP server
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: {
            libraryName: libraryName
          }
        }
      };

      const response = await fetch(this.context7McpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${this.config.getNested('context7', 'apiKey') || ''}`
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`Context7 MCP request failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let result: any;
      
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else if (contentType.includes('text/event-stream')) {
        // Handle SSE response
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        const dataLines = lines.filter(line => line.startsWith('data: '));
        
        if (dataLines.length > 0) {
          // Find the last complete JSON object
          let lastValidJson = null;
          for (let i = dataLines.length - 1; i >= 0; i--) {
            const dataLine = dataLines[i];
            if (!dataLine) continue;
            const jsonText = dataLine.substring(6); // Remove 'data: ' prefix
            try {
              lastValidJson = JSON.parse(jsonText);
              break; // Found valid JSON, use it
            } catch (parseError) {
              // Continue to previous line
              continue;
            }
          }
          
          if (lastValidJson) {
            result = lastValidJson;
          } else {
            throw new Error('No valid JSON data in SSE response');
          }
        } else {
          throw new Error('No data lines in SSE response');
        }
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
      
      if (result.error) {
        throw new Error(`Context7 MCP error: ${result.error.message}`);
      }

      this.logger.debug('Context7 library resolution successful', { 
        libraryName, 
        result: result.result 
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.result)
        }]
      };

    } catch (error) {
      this.logger.error('Context7 library resolution failed', {
        libraryName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty result on error
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ libraries: [] })
        }]
      };
    }
  }
}
