/**
 * Context7 MCP Protocol Compliance Service
 * Implements comprehensive MCP protocol compliance with Context7 best practices
 * Based on Context7 documentation and TypeScript error handling patterns
 */

import { Logger } from '../logger/logger';
import { ConfigService } from '../../config/config.service';

export interface Context7MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface Context7MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tool: string;
    timestamp: Date;
    duration: number;
  };
}

export interface Context7LibraryInfo {
  id: string;
  name: string;
  description: string;
  codeSnippets: number;
  trustScore: number;
  versions?: string[];
}

export class Context7MCPComplianceService {
  private logger: Logger;
  private config: ConfigService;
  private readonly supportedTools: Context7MCPTool[] = [
    {
      name: 'resolve-library-id',
      description: 'Resolves a package/product name to a Context7-compatible library ID',
      inputSchema: {
        type: 'object',
        properties: {
          libraryName: { type: 'string', description: 'Library name to search for' }
        },
        required: ['libraryName']
      }
    },
    {
      name: 'get-library-docs',
      description: 'Fetches up-to-date documentation for a library',
      inputSchema: {
        type: 'object',
        properties: {
          context7CompatibleLibraryID: { type: 'string', description: 'Context7-compatible library ID' },
          topic: { type: 'string', description: 'Topic to focus documentation on' },
          tokens: { type: 'number', description: 'Maximum number of tokens to retrieve' }
        },
        required: ['context7CompatibleLibraryID']
      }
    }
  ];

  constructor(logger: Logger, config: ConfigService) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Validates MCP tool call parameters according to Context7 best practices
   * Based on TypeScript error handling patterns from Context7 documentation
   */
  validateToolCall(toolName: string, parameters: any): { valid: boolean; error?: string } {
    try {
      const tool = this.supportedTools.find(t => t.name === toolName);
      if (!tool) {
        return {
          valid: false,
          error: `Unsupported tool: ${toolName}. Supported tools: ${this.supportedTools.map(t => t.name).join(', ')}`
        };
      }

      // Validate required parameters
      const requiredParams = tool.inputSchema.required || [];
      for (const param of requiredParams) {
        if (!(param in parameters)) {
          return {
            valid: false,
            error: `Missing required parameter: ${param}`
          };
        }
      }

      // Type validation based on schema
      for (const [paramName, paramValue] of Object.entries(parameters)) {
        const paramSchema = tool.inputSchema.properties[paramName];
        if (paramSchema) {
          const validation = this.validateParameterType(paramName, paramValue, paramSchema);
          if (!validation.valid) {
            return validation;
          }
        }
      }

      return { valid: true };
    } catch (error) {
      // TypeScript error handling pattern: catch unknown, narrow type
      if (error instanceof Error) {
        this.logger.error('Tool validation error', { 
          toolName, 
          error: error.message,
          stack: error.stack 
        });
        return {
          valid: false,
          error: `Validation error: ${error.message}`
        };
      }
      
      // Handle non-Error objects
      this.logger.error('Unknown validation error', { toolName, error });
      return {
        valid: false,
        error: 'Unknown validation error occurred'
      };
    }
  }

  /**
   * Validates parameter types according to JSON schema
   * Implements TypeScript type narrowing patterns
   */
  private validateParameterType(
    paramName: string, 
    value: any, 
    schema: any
  ): { valid: boolean; error?: string } {
    const expectedType = schema.type;
    
    // TypeScript type narrowing for validation
    if (expectedType === 'string') {
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `Parameter '${paramName}' must be a string, got ${typeof value}`
        };
      }
      
      // Additional string validations
      if (schema.minLength && value.length < schema.minLength) {
        return {
          valid: false,
          error: `Parameter '${paramName}' must be at least ${schema.minLength} characters`
        };
      }
      
      if (schema.maxLength && value.length > schema.maxLength) {
        return {
          valid: false,
          error: `Parameter '${paramName}' must be no more than ${schema.maxLength} characters`
        };
      }
    }
    
    if (expectedType === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          valid: false,
          error: `Parameter '${paramName}' must be a number, got ${typeof value}`
        };
      }
      
      if (schema.minimum && value < schema.minimum) {
        return {
          valid: false,
          error: `Parameter '${paramName}' must be at least ${schema.minimum}`
        };
      }
      
      if (schema.maximum && value > schema.maximum) {
        return {
          valid: false,
          error: `Parameter '${paramName}' must be no more than ${schema.maximum}`
        };
      }
    }
    
    if (expectedType === 'object') {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return {
          valid: false,
          error: `Parameter '${paramName}' must be an object, got ${typeof value}`
        };
      }
    }
    
    return { valid: true };
  }

  /**
   * Executes MCP tool call with comprehensive error handling
   * Implements Node.js async patterns and EventEmitter error handling
   */
  async executeToolCall(
    toolName: string, 
    parameters: any
  ): Promise<Context7MCPResponse> {
    const startTime = Date.now();
    
    try {
      // Validate tool call first
      const validation = this.validateToolCall(toolName, parameters);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Validation failed',
          metadata: {
            tool: toolName,
            timestamp: new Date(),
            duration: Date.now() - startTime
          }
        };
      }

      // Execute the tool call
      let result: any;
      
      switch (toolName) {
        case 'resolve-library-id':
          result = await this.resolveLibraryId(parameters.libraryName);
          break;
        case 'get-library-docs':
          result = await this.getLibraryDocumentation(
            parameters.context7CompatibleLibraryID,
            parameters.topic,
            parameters.tokens
          );
          break;
        default:
          throw new Error(`Tool execution not implemented: ${toolName}`);
      }

      const duration = Date.now() - startTime;
      
      this.logger.info('MCP tool call successful', {
        tool: toolName,
        duration,
        parameters: this.sanitizeParameters(parameters)
      });

      return {
        success: true,
        data: result,
        metadata: {
          tool: toolName,
          timestamp: new Date(),
          duration
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // TypeScript error handling: catch unknown, narrow type
      if (error instanceof Error) {
        this.logger.error('MCP tool call failed', {
          tool: toolName,
          error: error.message,
          stack: error.stack,
          duration
        });
        
        return {
          success: false,
          error: error.message,
          metadata: {
            tool: toolName,
            timestamp: new Date(),
            duration
          }
        };
      }
      
      // Handle non-Error objects
      this.logger.error('Unknown MCP tool call error', {
        tool: toolName,
        error,
        duration
      });
      
      return {
        success: false,
        error: 'Unknown error occurred during tool execution',
        metadata: {
          tool: toolName,
          timestamp: new Date(),
          duration
        }
      };
    }
  }

  /**
   * Resolves library name to Context7-compatible library ID
   * Implements Context7 MCP protocol best practices
   */
  private async resolveLibraryId(libraryName: string): Promise<Context7LibraryInfo[]> {
    try {
      // Make real Context7 MCP request
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

      this.logger.debug('Making real Context7 resolve-library-id request', {
        libraryName,
        request: mcpRequest
      });

      const response = await fetch('https://mcp.context7.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.getNested('context7', 'apiKey')}`,
          'User-Agent': 'PromptMCP-Context7Client/1.0.0'
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`Context7 MCP error: ${response.status} ${response.statusText}`);
      }

      // Handle both JSON and SSE responses
      const contentType = response.headers.get('content-type') || '';
      let mcpResponse: any;
      
      if (contentType.includes('text/event-stream')) {
        // Parse SSE response
        const text = await response.text();
        const lines = text.split('\n');
        let jsonData = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            jsonData = line.substring(6);
            break;
          }
        }
        
        if (jsonData) {
          mcpResponse = JSON.parse(jsonData);
        } else {
          throw new Error('No JSON data found in SSE response');
        }
      } else {
        // Parse regular JSON response
        mcpResponse = await response.json();
      }
      
      if (mcpResponse.error) {
        throw new Error(`Context7 MCP error: ${mcpResponse.error.message}`);
      }

      // Parse the response to extract library information
      const content = mcpResponse.result?.content?.[0];
      if (content?.type === 'text') {
        const text = content.text;
        const libraries: Context7LibraryInfo[] = [];
        
        // Parse the text response to extract library information
        const lines = text.split('\n');
        let currentLibrary: Partial<Context7LibraryInfo> = {};
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (line.includes('Context7-compatible library ID:')) {
            // Save previous library if exists
            if (currentLibrary.id) {
              libraries.push(currentLibrary as Context7LibraryInfo);
            }
            
            // Start new library
            currentLibrary = {
              id: line.split('Context7-compatible library ID:')[1]?.trim() || '',
              name: libraryName,
              description: '',
              codeSnippets: 0,
              trustScore: 0,
              versions: ['latest']
            };
          } else if (line.includes('Description:') && currentLibrary.id) {
            currentLibrary.description = line.split('Description:')[1]?.trim() || '';
          } else if (line.includes('Code Snippets:') && currentLibrary.id) {
            currentLibrary.codeSnippets = parseInt(line.split('Code Snippets:')[1]?.trim() || '0');
          } else if (line.includes('Trust Score:') && currentLibrary.id) {
            currentLibrary.trustScore = parseFloat(line.split('Trust Score:')[1]?.trim() || '0');
          }
        }
        
        // Add the last library
        if (currentLibrary.id) {
          libraries.push(currentLibrary as Context7LibraryInfo);
        }

        this.logger.debug('Library resolution completed', {
          libraryName,
          results: libraries.length,
          libraries: libraries.map(lib => ({ id: lib.id, name: lib.name, trustScore: lib.trustScore }))
        });

        return libraries;
      }

      // Fallback if no content
      this.logger.warn('No content in Context7 response', { libraryName });
      return [];

    } catch (error) {
      this.logger.error('Library resolution failed', {
        libraryName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Fetches library documentation from Context7
   * Implements Context7 MCP protocol best practices
   */
  private async getLibraryDocumentation(
    libraryId: string,
    topic?: string,
    tokens?: number
  ): Promise<{ content: string; metadata: any }> {
    try {
      // Make real Context7 MCP request
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'get-library-docs',
          arguments: {
            context7CompatibleLibraryID: libraryId,
            topic: topic || undefined,
            tokens: tokens || 4000
          }
        }
      };

      this.logger.debug('Making real Context7 get-library-docs request', {
        libraryId,
        topic,
        tokens,
        request: mcpRequest
      });

      const response = await fetch('https://mcp.context7.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.getNested('context7', 'apiKey')}`,
          'User-Agent': 'PromptMCP-Context7Client/1.0.0'
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`Context7 MCP error: ${response.status} ${response.statusText}`);
      }

      // Handle both JSON and SSE responses
      const contentType = response.headers.get('content-type') || '';
      let mcpResponse: any;
      
      if (contentType.includes('text/event-stream')) {
        // Parse SSE response
        const text = await response.text();
        const lines = text.split('\n');
        let jsonData = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            jsonData = line.substring(6);
            break;
          }
        }
        
        if (jsonData) {
          mcpResponse = JSON.parse(jsonData);
        } else {
          throw new Error('No JSON data found in SSE response');
        }
      } else {
        // Parse regular JSON response
        mcpResponse = await response.json();
      }
      
      if (mcpResponse.error) {
        throw new Error(`Context7 MCP error: ${mcpResponse.error.message}`);
      }

      // Extract documentation content
      const content = mcpResponse.result?.content?.[0];
      if (content?.type === 'text') {
        const documentationContent = content.text;
        
        this.logger.debug('Documentation retrieval completed', {
          libraryId,
          topic,
          tokens,
          contentLength: documentationContent.length
        });

        return {
          content: documentationContent,
          metadata: {
            libraryId,
            topic,
            tokens: tokens || 4000,
            retrievedAt: new Date(),
            source: 'Context7 MCP'
          }
        };
      }

      // Fallback if no content
      this.logger.warn('No content in Context7 documentation response', { 
        libraryId, 
        topic 
      });
      
      return {
        content: `# ${libraryId} Documentation\n\nNo documentation available from Context7.`,
        metadata: {
          libraryId,
          topic,
          tokens: tokens || 4000,
          retrievedAt: new Date(),
          source: 'Context7 MCP (fallback)'
        }
      };

    } catch (error) {
      this.logger.error('Documentation retrieval failed', {
        libraryId,
        topic,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Sanitizes parameters for logging (removes sensitive data)
   * Implements security best practices
   */
  private sanitizeParameters(parameters: any): any {
    const sanitized = { ...parameters };
    
    // Remove or mask sensitive parameters
    if (sanitized.apiKey) {
      sanitized.apiKey = '***masked***';
    }
    
    if (sanitized.password) {
      sanitized.password = '***masked***';
    }
    
    return sanitized;
  }

  /**
   * Gets supported MCP tools
   * Implements MCP protocol compliance
   */
  getSupportedTools(): Context7MCPTool[] {
    return [...this.supportedTools];
  }

  /**
   * Health check for MCP compliance
   * Implements monitoring best practices
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    tools: number;
    lastCheck: Date;
  }> {
    try {
      const startTime = Date.now();
      
      // Test basic functionality
      const testResult = await this.executeToolCall('resolve-library-id', {
        libraryName: 'test'
      });
      
      const duration = Date.now() - startTime;
      
      return {
        status: testResult.success ? 'healthy' : 'degraded',
        tools: this.supportedTools.length,
        lastCheck: new Date()
      };
    } catch (error) {
      this.logger.error('MCP health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        status: 'unhealthy',
        tools: this.supportedTools.length,
        lastCheck: new Date()
      };
    }
  }
}
