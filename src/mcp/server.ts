/**
 * MCP Server Implementation
 * 
 * This implements the Model Context Protocol (MCP) server for PromptMCP,
 * providing the enhance tool for prompt enhancement with project context.
 * 
 * Benefits for vibe coders:
 * - Simple MCP protocol implementation
 * - Single enhance tool for prompt enhancement
 * - Easy integration with MCP clients
 * - Type-safe tool definitions
 * - Comprehensive error handling
 */

import { EventEmitter } from 'events';

// MCP Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// MCP Server Implementation
export class MCPServer extends EventEmitter {
  private tools: Map<string, MCPTool> = new Map();
  private services: Map<string, any> = new Map();

  constructor(services: Record<string, any>) {
    super();
    
    // Store services
    Object.entries(services).forEach(([name, service]) => {
      this.services.set(name, service);
    });
    
    // Initialize tools
    this.initializeTools();
  }

  /**
   * Initialize the MCP server
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing MCP server...');
    
    // Register tools
    this.registerTools();
    
    console.log('✅ MCP server initialized');
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    console.log('▶️ Starting MCP server...');
    
    // Set up message handling
    process.stdin.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        this.sendError('parse_error', 'Invalid JSON', null);
      }
    });
    
    console.log('✅ MCP server started');
  }

  /**
   * Initialize MCP tools
   */
  private initializeTools(): void {
    // promptmcp.enhance tool
    this.tools.set('promptmcp.enhance', {
      name: 'promptmcp.enhance',
      description: 'Enhance prompts with project context and best practices',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt to enhance'
          },
          context: {
            type: 'object',
            properties: {
              file: { type: 'string', description: 'Optional file path for context' },
              framework: { type: 'string', description: 'Optional framework for context' },
              style: { type: 'string', description: 'Optional style preference' }
            },
            description: 'Additional context for enhancement'
          }
        },
        required: ['prompt']
      }
    });
  }

  /**
   * Register tools with MCP
   */
  private registerTools(): void {
    console.log('📝 Registering MCP tools...');
    
    this.tools.forEach((tool, name) => {
      console.log(`   - ${name}: ${tool.description}`);
    });
    
    console.log('✅ MCP tools registered');
  }

  /**
   * Handle incoming MCP messages
   */
  private async handleMessage(message: MCPRequest): Promise<void> {
    try {
      switch (message.method) {
        case 'initialize':
          await this.handleInitialize(message);
          break;
        case 'tools/list':
          await this.handleToolsList(message);
          break;
        case 'tools/call':
          await this.handleToolCall(message);
          break;
        case 'ping':
          await this.handlePing(message);
          break;
        default:
          this.sendError('method_not_found', `Unknown method: ${message.method}`, message.id);
      }
    } catch (error) {
      this.sendError('internal_error', (error as Error).message, message.id);
    }
  }

  /**
   * Handle initialize request
   */
  private async handleInitialize(message: MCPRequest): Promise<void> {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'PromptMCP',
          version: '1.0.0',
          description: 'Prompt enhancement tool for vibe coders'
        }
      }
    };
    
    this.sendResponse(response);
  }

  /**
   * Handle tools/list request
   */
  private async handleToolsList(message: MCPRequest): Promise<void> {
    const tools = Array.from(this.tools.values());
    
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: tools
      }
    };
    
    this.sendResponse(response);
  }

  /**
   * Handle tool call request
   */
  private async handleToolCall(message: MCPRequest): Promise<void> {
    const { name, arguments: args } = message.params;
    
    if (!this.tools.has(name)) {
      this.sendError('tool_not_found', `Tool not found: ${name}`, message.id);
      return;
    }
    
    try {
      const result = await this.executeTool(name, args);
      
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: result
            }
          ]
        }
      };
      
      this.sendResponse(response);
    } catch (error) {
      this.sendError('tool_execution_error', (error as Error).message, message.id);
    }
  }

  /**
   * Handle ping request
   */
  private async handlePing(message: MCPRequest): Promise<void> {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        pong: true,
        timestamp: new Date().toISOString()
      }
    };
    
    this.sendResponse(response);
  }

  /**
   * Execute a tool
   */
  private async executeTool(name: string, args: any): Promise<string> {
    switch (name) {
      case 'promptmcp.enhance':
        return await this.executeEnhance(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Execute enhance tool
   */
  private async executeEnhance(args: any): Promise<string> {
    const { prompt, context } = args;
    
    try {
      // Get the Context7 integration service
      const context7Integration = this.services.get('context7Integration');
      
      if (!context7Integration) {
        throw new Error('Context7 integration service not available');
      }
      
      // Call the Context7 integration service with the provided arguments
      const result = await context7Integration.enhancePrompt({
        prompt,
        context: context || {},
        options: {
          maxTokens: 4000
        }
      });
      
      return JSON.stringify(result, null, 2);
      
    } catch (error) {
      throw new Error(`Enhance tool execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Send response
   */
  private sendResponse(response: MCPResponse): void {
    console.log(JSON.stringify(response));
  }

  /**
   * Send error response
   */
  private sendError(code: string, message: string, id: string | number | null): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: id || 'unknown',
      error: {
        code: -1,
        message: message,
        data: { code }
      }
    };
    
    this.sendResponse(response);
  }

  /**
   * Destroy the MCP server
   */
  destroy(): void {
    this.removeAllListeners();
    console.log('🔌 MCP server destroyed');
  }
}

export default MCPServer;
