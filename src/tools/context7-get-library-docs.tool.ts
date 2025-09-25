/**
 * Context7 Get Library Docs Tool
 * 
 * Real Context7 MCP tool that calls the actual Context7 MCP server
 * No mocked data - uses real Context7 API
 */

import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';

export interface Context7GetLibraryDocsRequest {
  context7CompatibleLibraryID: string;
  topic?: string;
  tokens?: number;
}

export interface Context7GetLibraryDocsResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export class Context7GetLibraryDocsTool {
  private logger: Logger;
  private config: ConfigService;
  private context7McpUrl: string;

  constructor(logger: Logger, config: ConfigService) {
    this.logger = logger;
    this.config = config;
    const context7Config = config.getNested('context7', 'mcp');
    this.context7McpUrl = (typeof context7Config === 'object' && context7Config?.serverUrl) || 'https://mcp.context7.com/mcp';
  }

  /**
   * Gets library documentation from Context7 using real Context7 MCP
   */
  async getLibraryDocs(request: Context7GetLibraryDocsRequest): Promise<Context7GetLibraryDocsResponse> {
    const { context7CompatibleLibraryID, topic, tokens = 4000 } = request;
    
    this.logger.debug('Calling real Context7 MCP to get library docs', { 
      context7CompatibleLibraryID, 
      topic, 
      tokens 
    });

    try {
      // Call the real Context7 MCP server
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'get-library-docs',
          arguments: {
            context7CompatibleLibraryID,
            topic: topic || undefined,
            tokens
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
        this.logger.info('🔍 [Context7-SSE-Debug] Raw SSE response', { 
          textLength: text.length,
          textPreview: text.substring(0, 200) + '...'
        });
        
        const lines = text.split('\n').filter(line => line.trim());
        const dataLines = lines.filter(line => line.startsWith('data: '));
        
        this.logger.info('🔍 [Context7-SSE-Debug] Parsed SSE lines', { 
          totalLines: lines.length,
          dataLines: dataLines.length
        });
        
        if (dataLines.length > 0) {
          // Find the last complete JSON object
          let lastValidJson = null;
          for (let i = dataLines.length - 1; i >= 0; i--) {
            const dataLine = dataLines[i];
            if (!dataLine) continue;
            const jsonText = dataLine.substring(6); // Remove 'data: ' prefix
            try {
              const parsed = JSON.parse(jsonText);
              this.logger.info('🔍 [Context7-SSE-Debug] Parsed JSON', { 
                hasJsonrpc: !!parsed.jsonrpc,
                hasResult: !!parsed.result,
                hasId: !!parsed.id
              });
              
              if (parsed.jsonrpc === '2.0' && parsed.result) {
                lastValidJson = parsed;
                break; // Found valid JSON-RPC response
              }
            } catch (parseError) {
              this.logger.warn('🔍 [Context7-SSE-Debug] Failed to parse JSON line', { 
                jsonText: jsonText.substring(0, 100),
                error: parseError instanceof Error ? parseError.message : 'Unknown error'
              });
              continue;
            }
          }
          
          if (lastValidJson) {
            result = lastValidJson;
            this.logger.info('🔍 [Context7-SSE-Debug] Successfully parsed SSE response', { 
              hasResult: !!result.result,
              hasContent: !!(result.result && result.result.content)
            });
          } else {
            throw new Error('No valid JSON-RPC response found in SSE stream');
          }
        } else {
          throw new Error('No data lines found in SSE response');
        }
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
      
      if (result.error) {
        throw new Error(`Context7 MCP error: ${result.error.message}`);
      }

      this.logger.debug('Context7 library docs retrieval successful', { 
        context7CompatibleLibraryID, 
        topic,
        contentLength: result.result?.content?.[0]?.text?.length || 0
      });

      return {
        content: [{
          type: 'text',
          text: result.result?.content?.[0]?.text || 'No documentation found'
        }]
      };

    } catch (error) {
      this.logger.error('Context7 library docs retrieval failed', {
        context7CompatibleLibraryID,
        topic,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty result on error
      return {
        content: [{
          type: 'text',
          text: 'Documentation not available'
        }]
      };
    }
  }
}
