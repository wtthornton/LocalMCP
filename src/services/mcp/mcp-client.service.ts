/**
 * MCP Client Service
 * 
 * This service provides a TypeScript client for communicating with MCP servers
 * via direct JSON-RPC communication. It handles connection management,
 * tool discovery, and tool invocation with proper error handling and retry logic.
 * 
 * Benefits for vibe coders:
 * - Simple MCP client interface
 * - Direct JSON-RPC communication
 * - Built-in error handling and retry logic
 * - Type-safe tool interactions
 * - Comprehensive logging and debugging
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { EventEmitter } from 'events';
import { Logger } from '../logger/logger.js';

export interface MCPClientConfig {
  serverCommand: string;
  serverArgs?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
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

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

export class MCPClientService extends EventEmitter {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private logger: Logger;
  private config: MCPClientConfig;
  private isConnected = false;
  private retryCount = 0;

  constructor(logger: Logger, config: MCPClientConfig) {
    super();
    this.logger = logger;
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Initialize the MCP client and establish connection
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing MCP client', { config: this.config });
      
      // Create stdio transport
      this.transport = new StdioClientTransport({
        command: this.config.serverCommand,
        args: this.config.serverArgs || [],
        cwd: this.config.cwd || process.cwd(),
        env: this.config.env || {}
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'promptmcp-client',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      // Connect to the server
      await this.connect();

      this.logger.info('MCP client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP client', { error: (error as Error).message });
      throw error;
    }
  }


  /**
   * Connect to the MCP server
   */
  private async connect(): Promise<void> {
    if (!this.client || !this.transport) {
      throw new Error('Client or transport not initialized');
    }

    try {
      await this.client.connect(this.transport);
      this.isConnected = true;
      this.retryCount = 0;
      this.logger.info('Connected to MCP server');
      this.emit('connected');
    } catch (error) {
      this.logger.error('Failed to connect to MCP server', { error: (error as Error).message });
      throw error;
    }
  }


  /**
   * Get list of available tools
   */
  async listTools(): Promise<MCPTool[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const response = await this.client.listTools();
      this.logger.info('Retrieved tools list', { toolCount: response.tools.length });
      
      // Convert response to our MCPTool format
      return response.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: {
          type: tool.inputSchema.type,
          properties: tool.inputSchema.properties || {},
          required: tool.inputSchema.required || []
        }
      }));
    } catch (error) {
      this.logger.error('Failed to list tools', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Call a tool with the given arguments
   */
  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    if (!this.client || !this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      this.logger.info('Calling tool', { toolName: toolCall.name, arguments: toolCall.arguments });
      
      const response = await this.client.callTool({
        name: toolCall.name,
        arguments: toolCall.arguments
      });

      this.logger.info('Tool call completed', { 
        toolName: toolCall.name,
        contentCount: Array.isArray(response.content) ? response.content.length : 0
      });

      return {
        content: Array.isArray(response.content) ? response.content.map((item: any) => ({
          type: item.type || 'text',
          text: item.text,
          data: item.data
        })) : [],
        isError: false
      };
    } catch (error) {
      this.logger.error('Tool call failed', { 
        toolName: toolCall.name, 
        error: (error as Error).message 
      });
      
      return {
        content: [{
          type: 'text',
          text: `Error calling tool ${toolCall.name}: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }

  /**
   * Check if the client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Reconnect to the MCP server with retry logic
   */
  async reconnect(): Promise<void> {
    if (this.retryCount >= this.config.retryAttempts!) {
      throw new Error(`Max retry attempts (${this.config.retryAttempts}) exceeded`);
    }

    this.retryCount++;
    this.logger.info('Attempting to reconnect', { attempt: this.retryCount });

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay! * this.retryCount));

    try {
      await this.initialize();
    } catch (error) {
      this.logger.error('Reconnection failed', { 
        attempt: this.retryCount, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Close the MCP client connection
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.transport) {
        this.transport.close();
        this.transport = null;
      }

      this.isConnected = false;
      this.logger.info('MCP client closed');
      this.emit('closed');
    } catch (error) {
      this.logger.error('Error closing MCP client', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Destroy the MCP client and clean up resources
   */
  destroy(): void {
    this.close().catch(error => {
      this.logger.error('Error during MCP client destruction', { error: (error as Error).message });
    });
    
    this.removeAllListeners();
    this.logger.info('MCP client destroyed');
  }
}
