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
import { BreakdownTool } from '../tools/breakdown.tool.js';
import { HealthTool } from '../tools/health.tool.js';
import { DatabaseMigrationsService } from '../services/database/database-migrations.service.js';
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
  private breakdownTool?: BreakdownTool;
  private healthTool?: HealthTool;
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
    
    // Initialize breakdown tool
    await this.initializeBreakdownTool();
    
    // Initialize health tool
    if (this.healthTool) {
      await this.healthTool.initialize();
    }
    
    // Register tools
    this.registerTools();
    
    console.log('✅ MCP server initialized');
  }

  /**
   * Initialize breakdown tool
   */
  private async initializeBreakdownTool(): Promise<void> {
    console.log('🔧 Initializing breakdown tool...');
    
    const logger = this.services.get('logger');
    const config = this.services.get('config');
    const context7Service = this.services.get('context7Integration')?.context7Service;
    
    console.log('🔧 Breakdown tool services check:', {
      hasLogger: !!logger,
      hasConfig: !!config,
      hasContext7Service: !!context7Service,
      openaiApiKey: process.env.OPENAI_API_KEY ? 'SET' : 'NOT_SET',
      openaiProjectId: process.env.OPENAI_PROJECT_ID ? 'SET' : 'NOT_SET'
    });
    
    if (logger && config && context7Service) {
      try {
        // Create TaskBreakdownService for the breakdown tool
        const { TaskBreakdownService } = await import('../services/task-breakdown/task-breakdown.service.js');
        
        // Configure task breakdown service
        const taskBreakdownConfig = {
          openai: {
            apiKey: process.env.OPENAI_API_KEY || '',
            projectId: process.env.OPENAI_PROJECT_ID || '',
            model: process.env.OPENAI_MODEL || 'gpt-4',
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3')
          },
          context7: {
            maxTokensPerLibrary: parseInt(process.env.CONTEXT7_MAX_TOKENS_PER_LIBRARY || '1000'),
            maxLibraries: parseInt(process.env.CONTEXT7_MAX_LIBRARIES || '3')
          }
        };
        
        const taskBreakdownService = new TaskBreakdownService(logger, context7Service, taskBreakdownConfig);
        this.breakdownTool = new BreakdownTool(logger, taskBreakdownService, context7Service, config);
        
        console.log('✅ Breakdown tool initialized with OpenAI integration');
      } catch (error) {
        console.warn('⚠️ Breakdown tool initialization failed:', (error as Error).message);
        console.error('Full error:', error);
      }
    } else {
      console.warn('⚠️ Breakdown tool not initialized - missing required services');
    }
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

    // promptmcp.todo tool
    this.tools.set('promptmcp.todo', {
      name: 'promptmcp.todo',
      description: TodoToolSchema.description,
      inputSchema: TodoToolSchema.inputSchema
    });

    // promptmcp.breakdown tool
    if (this.breakdownTool) {
      const breakdownSchema = this.breakdownTool.getToolSchema();
      this.tools.set('promptmcp.breakdown', {
        name: breakdownSchema.name,
        description: breakdownSchema.description || 'Break down a user prompt into structured tasks using AI and Context7 documentation',
        inputSchema: {
          type: 'object',
          properties: breakdownSchema.inputSchema?.properties || {},
          required: (breakdownSchema.inputSchema?.required as string[]) || ['prompt']
        }
      });
    }

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
      case 'promptmcp.breakdown':
        return await this.executeBreakdown(args);
      case 'promptmcp.health':
        return await this.executeHealth(args);
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
      const result = await context7Integration.enhancePrompt(
        prompt,
        context || {},
        {
          maxTokens: 4000
        }
      );
      
      return JSON.stringify(result, null, 2);
      
    } catch (error) {
      throw new Error(`Enhance tool execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute breakdown tool
   */
  private async executeBreakdown(args: any): Promise<string> {
    if (!this.breakdownTool) {
      throw new Error('Breakdown tool not available');
    }
    
    try {
      const result = await this.breakdownTool.handleBreakdown(args);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new Error(`Breakdown tool execution failed: ${(error as Error).message}`);
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