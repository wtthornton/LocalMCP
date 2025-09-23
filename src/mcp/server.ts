/**
 * MCP Server Implementation
 * 
 * This implements the Model Context Protocol (MCP) server for PromptMCP,
 * providing 2 core tools: enhance and todo for vibe coders.
 * 
 * Benefits for vibe coders:
 * - Simple MCP protocol implementation
 * - Only 2 tools to remember: promptmcp.enhance and promptmcp.todo
 * - Easy integration with MCP clients
 * - Type-safe tool definitions
 * - Comprehensive error handling
 */

import { EventEmitter } from 'events';
import { TodoTool, TodoToolSchema } from '../tools/todo.tool.js';
import { TodoService } from '../services/todo/todo.service.js';
import { HealthTool } from '../tools/health.tool.js';
import { DatabaseMigrationsService } from '../services/database/database-migrations.service.js';
import { Context7ResolveLibraryIdTool } from '../tools/context7-resolve-library-id.tool.js';
import { Context7GetLibraryDocsTool } from '../tools/context7-get-library-docs.tool.js';
import Database from 'better-sqlite3';

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
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// MCP Server Implementation
export class MCPServer extends EventEmitter {
  private tools: Map<string, MCPTool> = new Map();
  private services: Map<string, any> = new Map();
  private todoTool: TodoTool;
  private healthTool?: HealthTool;
  private context7ResolveTool?: Context7ResolveLibraryIdTool;
  private context7DocsTool?: Context7GetLibraryDocsTool;
  private dbPath: string;

  constructor(services: Record<string, any>) {
    super();
    
    // Store services
    Object.entries(services).forEach(([name, service]) => {
      this.services.set(name, service);
    });
    
    // Initialize database path for later migration
    this.dbPath = process.env.TODO_DB_PATH || 'todos.db';
    
    // Initialize todo service and tool with configurable database path
    const todoService = new TodoService(this.dbPath);
    this.todoTool = new TodoTool(todoService);
    
    // Initialize health tool
    const logger = services.logger;
    const config = services.config;
    
    if (logger && config) {
      this.healthTool = new HealthTool(logger, config);
      this.context7ResolveTool = new Context7ResolveLibraryIdTool(logger, config);
      this.context7DocsTool = new Context7GetLibraryDocsTool(logger, config);
    } else {
      console.warn('⚠️ Health tool not initialized - missing required services');
    }
    
    // Initialize tools
    this.initializeTools();
  }

  /**
   * Initialize the MCP server
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing MCP server...');
    
    // Run database migrations
    await this.runDatabaseMigrations();
    
    // Initialize health tool
    if (this.healthTool) {
      await this.healthTool.initialize();
    }
    
    // Register tools
    this.registerTools();
    
    console.log('✅ MCP server initialized');
  }


  /**
   * Run database migrations
   */
  private async runDatabaseMigrations(): Promise<void> {
    try {
      const db = new Database(this.dbPath);
      const logger = this.services.get('logger');
      
      if (logger) {
        const migrations = new DatabaseMigrationsService(logger, db);
        await migrations.runMigrations();
        console.log('✅ Database migrations completed');
      }
    } catch (error) {
      console.warn('⚠️ Database migrations failed:', (error as Error).message);
    }
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
    // Get enhance tool schema from the service
    const context7Integration = this.services.get('context7Integration');
    const enhanceTool = context7Integration?.enhanceTool;
    
    if (enhanceTool && enhanceTool.getToolSchema) {
      const enhanceSchema = enhanceTool.getToolSchema();
      this.tools.set('promptmcp.enhance', {
        name: enhanceSchema.name,
        description: enhanceSchema.description,
        inputSchema: enhanceSchema.inputSchema
      });
    } else {
      // Fallback schema if enhance tool is not available
      this.tools.set('promptmcp.enhance', {
        name: 'promptmcp.enhance',
        description: 'Enhance prompts with project context, best practices, and optionally break down complex requests into structured tasks',
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
                style: { type: 'string', description: 'Optional style preference' },
                projectContext: { type: 'object', description: 'Project-specific context' }
              },
              description: 'Additional context for enhancement'
            },
            options: {
              type: 'object',
              properties: {
                useCache: { type: 'boolean', description: 'Whether to use cached results', default: true },
                maxTokens: { type: 'number', description: 'Maximum tokens for Context7 documentation', default: 2000 },
                includeMetadata: { type: 'boolean', description: 'Whether to include metadata in response', default: false },
                includeBreakdown: { type: 'boolean', description: 'Whether to automatically break down complex prompts into tasks', default: false },
                maxTasks: { type: 'number', description: 'Maximum number of tasks to create from breakdown', default: 10 }
              },
              description: 'Enhancement options'
            }
          },
          required: ['prompt']
        }
      });
    }

    // promptmcp.todo tool
    this.tools.set('promptmcp.todo', {
      name: 'promptmcp.todo',
      description: TodoToolSchema.description,
      inputSchema: TodoToolSchema.inputSchema
    });

    // Note: breakdown functionality is now integrated into promptmcp.enhance

    // promptmcp.health tool
    this.tools.set('promptmcp.health', {
      name: 'promptmcp.health',
      description: 'Check the health status of the MCP server and all services',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    });

    // Context7 tools
    if (this.context7ResolveTool) {
      this.tools.set('resolve-library-id', {
        name: 'resolve-library-id',
        description: 'Resolves library names to Context7-compatible library IDs',
        inputSchema: {
          type: 'object',
          properties: {
            libraryName: {
              type: 'string',
              description: 'The library name to resolve'
            }
          },
          required: ['libraryName']
        }
      });
    }

    if (this.context7DocsTool) {
      this.tools.set('get-library-docs', {
        name: 'get-library-docs',
        description: 'Fetches library documentation from Context7',
        inputSchema: {
          type: 'object',
          properties: {
            context7CompatibleLibraryID: {
              type: 'string',
              description: 'The Context7-compatible library ID'
            },
            topic: {
              type: 'string',
              description: 'Optional topic to focus documentation on'
            },
            tokens: {
              type: 'number',
              description: 'Maximum number of tokens of documentation to retrieve',
              default: 4000
            }
          },
          required: ['context7CompatibleLibraryID']
        }
      });
    }
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
      case 'promptmcp.todo':
        return await this.executeTodo(args);
      case 'promptmcp.health':
        return await this.executeHealth(args);
      case 'resolve-library-id':
        return await this.executeResolveLibraryId(args);
      case 'get-library-docs':
        return await this.executeGetLibraryDocs(args);
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
      console.log('🔍 [MCPServer] executeEnhance called with:', { prompt: prompt.substring(0, 100) + '...', context });
      
      // Get the Context7 integration service
      const context7Integration = this.services.get('context7Integration');
      
      if (!context7Integration) {
        throw new Error('Context7 integration service not available');
      }
      
      console.log('🔍 [MCPServer] Calling context7Integration.enhancePrompt...');
      
      // Call the Context7 integration service with the provided arguments
      const result = await context7Integration.enhancePrompt(
        prompt,
        context || {},
        {
          maxTokens: 4000
        }
      );
      
      console.log('🔍 [MCPServer] context7Integration.enhancePrompt returned:', {
        success: result.success,
        repoFactsCount: result.context_used?.repo_facts?.length || 0,
        codeSnippetsCount: result.context_used?.code_snippets?.length || 0,
        context7DocsCount: result.context_used?.context7_docs?.length || 0
      });
      
      return JSON.stringify(result, null, 2);
      
    } catch (error) {
      throw new Error(`Enhance tool execution failed: ${(error as Error).message}`);
    }
  }


  /**
   * Execute todo tool
   */
  private async executeTodo(args: any): Promise<string> {
    try {
      // Execute todo tool
      const result = await this.todoTool.execute(args);
      
      // Format response based on action
      if (result.success) {
        if (args.action === 'list' && Array.isArray(result.data)) {
          // Format todo list as markdown for better display
          const projectId = args.projectId || 'default-project';
          return await this.todoTool.formatTodosAsMarkdown(projectId, args.filters);
        } else if (args.action === 'create' && result.data) {
          // Return success message for created todo
          const todo = result.data as any;
          return `✅ Created todo: **${todo.title}**\n\nPriority: ${todo.priority}\nCategory: ${todo.category || 'none'}\nStatus: ${todo.status}`;
        } else {
          // Return JSON for other operations
          return JSON.stringify(result.data, null, 2);
        }
      } else {
        throw new Error(result.error || 'Todo operation failed');
      }
      
    } catch (error) {
      throw new Error(`Todo tool execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute health tool
   */
  private async executeHealth(args: any): Promise<string> {
    if (!this.healthTool) {
      throw new Error('Health tool not available');
    }
    
    try {
      const healthResult = await this.healthTool.performHealthCheck();
      return JSON.stringify(healthResult, null, 2);
    } catch (error) {
      throw new Error(`Health tool execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute resolve-library-id tool
   */
  private async executeResolveLibraryId(args: any): Promise<string> {
    if (!this.context7ResolveTool) {
      throw new Error('Context7 resolve library tool not available');
    }
    
    try {
      const result = await this.context7ResolveTool.resolveLibraryId(args);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new Error(`Context7 resolve library tool execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute get-library-docs tool
   */
  private async executeGetLibraryDocs(args: any): Promise<string> {
    if (!this.context7DocsTool) {
      throw new Error('Context7 get library docs tool not available');
    }
    
    try {
      const result = await this.context7DocsTool.getLibraryDocs(args);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new Error(`Context7 get library docs tool execution failed: ${(error as Error).message}`);
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
   * Handle HTTP MCP request
   */
  async handleRequest(mcpRequest: MCPRequest): Promise<MCPResponse> {
    try {
      // Handle the message directly and return the response
      return await this.handleMessageDirect(mcpRequest);
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Handle MCP message directly and return response
   */
  private async handleMessageDirect(message: MCPRequest): Promise<MCPResponse> {
    const { method, params, id } = message;

    switch (method) {
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: Array.from(this.tools.values())
          }
        };

      case 'tools/call':
        try {
          const { name, arguments: args } = params;
          const result = await this.executeTool(name, args);
          return {
            jsonrpc: '2.0',
            id,
            result: result
          };
        } catch (error) {
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : 'Tool execution failed',
              data: { tool: params?.name }
            }
          };
        }

      case 'ping':
        return {
          jsonrpc: '2.0',
          id,
          result: { status: 'pong' }
        };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
            data: { method }
          }
        };
    }
  }

  /**
   * Get available tools
   */
  getTools(): Map<string, MCPTool> {
    return this.tools;
  }

  /**
   * Destroy the MCP server
   */
  destroy(): void {
    // Close todo service
    if (this.todoTool) {
      // Access the todo service through the tool
      (this.todoTool as any).todoService?.close();
    }
    
    // Clean up health tool
    if (this.healthTool) {
      this.healthTool.destroy();
    }
    
    this.removeAllListeners();
    console.log('🔌 MCP server destroyed');
  }
}

export default MCPServer;

// Startup code for MCP server
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Context7IntegrationService } from '../services/context7/context7-integration.service.js';
import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Handle both Windows and Linux file URLs
const expectedUrl = `file://${process.argv[1]?.replace(/\\/g, '/')}`;
const expectedUrlWithExtraSlash = `file:///${process.argv[1]?.replace(/\\/g, '/')}`;
if (import.meta.url === expectedUrl || import.meta.url === expectedUrlWithExtraSlash) {
  // Wrap startup in async function
  (async () => {
    console.log('🚀 Starting PromptMCP MCP Server...');
    
    // Initialize proper services for MCP
    const logger = new Logger('PromptMCP-MCP');
    const config = new ConfigService();
    const context7Integration = new Context7IntegrationService(logger, config);
    
    // Initialize Context7 integration and wait for completion
    try {
      await context7Integration.initialize();
      console.log('✅ Context7 integration initialized');
    } catch (error) {
      console.warn('⚠️ Context7 integration failed, continuing without it:', (error as Error).message);
      console.error('Full error:', error);
    }
    
    const services = {
      logger,
      config,
      context7Integration
    };
    
    // Create and start MCP server
    const mcpServer = new MCPServer(services);
    
    // Initialize and start
    try {
      await mcpServer.initialize();
      console.log('✅ MCP server initialized, starting...');
      mcpServer.start();
    } catch (error) {
      console.error('❌ Failed to initialize MCP server:', error);
      console.error('Full error:', error);
      process.exit(1);
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down MCP server...');
      mcpServer.destroy();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down MCP server...');
      mcpServer.destroy();
      process.exit(0);
    });
  })().catch((error) => {
    console.error('❌ Failed to start PromptMCP MCP Server:', error);
    process.exit(1);
  });
}