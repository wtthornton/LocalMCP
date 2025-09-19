#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { EnhanceTool } from './tools/enhance.js';
import { Logger } from './services/logger/logger.js';
import { ConfigService } from './config/config.service.js';

/**
 * PromptMCP Server - Prompt Engineering Improvement
 * 
 * Takes any user prompt and returns an enhanced prompt with perfect project context.
 * Uses Context7 cache, RAG, and repo facts to provide the best possible context.
 */
export class PromptMCPServer {
  private server: Server;
  private logger: Logger;
  private config: ConfigService;
  private enhanceTool: EnhanceTool;

  constructor() {
    this.logger = new Logger('PromptMCP');
    this.config = new ConfigService();
    this.enhanceTool = new EnhanceTool();
    
    this.server = new Server(
      {
        name: 'promptmcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.logger.info('PromptMCP Server initialized');
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'promptmcp.enhance',
            description: 'Enhance any prompt with perfect project context using Context7 cache, RAG, and repo facts',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The original prompt to enhance'
                },
                context: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      description: 'Optional file path for code context'
                    },
                    framework: {
                      type: 'string',
                      description: 'Optional framework (react, vue, angular, etc.)'
                    },
                    style: {
                      type: 'string',
                      description: 'Optional style preference (tailwind, css, etc.)'
                    }
                  },
                  description: 'Optional context for enhancement'
                }
              },
              required: ['prompt']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'promptmcp.enhance':
            const result = await this.enhanceTool.enhance(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error('Tool execution failed', { 
          tool: name, 
          error: (error as Error).message 
        });
        throw error;
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('PromptMCP Server started - Ready to enhance prompts!');
  }
}

// Start the server
const server = new PromptMCPServer();
server.start().catch((error) => {
  console.error('Failed to start PromptMCP server:', error);
  process.exit(1);
});