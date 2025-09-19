#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Context7IntegrationService } from './services/context7/context7-integration.service.js';
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
  private context7Integration: Context7IntegrationService;

  constructor() {
    this.logger = new Logger('PromptMCP');
    this.config = new ConfigService();
    this.context7Integration = new Context7IntegrationService(this.logger, this.config);
    
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

  async initialize() {
    try {
      this.logger.info('Initializing Context7 integration...');
      await this.context7Integration.initialize();
      this.logger.info('Context7 integration initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Context7 integration', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Continue without Context7 - graceful degradation
    }
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
            if (!args || typeof args.prompt !== 'string') {
              throw new Error('Invalid arguments: prompt is required and must be a string');
            }
            
            const result = await this.context7Integration.enhancePrompt(
              args.prompt,
              args.context || {},
              {
                maxTokens: 4000
              }
            );
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
    // Initialize Context7 integration first
    await this.initialize();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('PromptMCP Server started - Ready to enhance prompts with Context7!');
  }
}

// Start the server
const server = new PromptMCPServer();
server.start().catch((error) => {
  console.error('Failed to start PromptMCP server:', error);
  process.exit(1);
});