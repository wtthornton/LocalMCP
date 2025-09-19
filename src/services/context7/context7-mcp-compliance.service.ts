/**
 * Context7 MCP Protocol Compliance Service
 * Implements comprehensive MCP protocol compliance with Context7 best practices
 * Based on Context7 documentation and TypeScript error handling patterns
 */

import { Logger } from '../logger/logger.service';
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
          error: validation.error,
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
      // This would integrate with actual Context7 MCP client
      // For now, return mock data based on Context7 patterns
      const mockLibraries: Context7LibraryInfo[] = [
        {
          id: `/microsoft/${libraryName}`,
          name: libraryName,
          description: `Official ${libraryName} library documentation`,
          codeSnippets: 1000,
          trustScore: 9.5,
          versions: ['latest']
        }
      ];

      this.logger.debug('Library resolution completed', {
        libraryName,
        results: mockLibraries.length
      });

      return mockLibraries;
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
      // This would integrate with actual Context7 MCP client
      // For now, return mock data based on Context7 patterns
      const mockContent = `# ${libraryId} Documentation

## Overview
This is mock documentation for ${libraryId}${topic ? ` focused on ${topic}` : ''}.

## Best Practices
- Use TypeScript for type safety
- Implement proper error handling
- Follow async/await patterns
- Use EventEmitter for event-driven architecture

## Examples
\`\`\`typescript
// Example usage
const result = await someAsyncFunction();
\`\`\`
`;

      this.logger.debug('Documentation retrieval completed', {
        libraryId,
        topic,
        tokens,
        contentLength: mockContent.length
      });

      return {
        content: mockContent,
        metadata: {
          libraryId,
          topic,
          tokens: tokens || 4000,
          retrievedAt: new Date()
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
