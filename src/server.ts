#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ProjectAnalyzer } from './tools/analyze.js';
import { CodeGenerator } from './tools/create.js';
import { ErrorFixer } from './tools/fix.js';
import { LessonLearner } from './tools/learn.js';
import { Logger } from './services/logger/logger.js';
import { ConfigService } from './config/config.service.js';
import { VectorDatabaseService } from './services/vector/vector-db.service.js';
import { RAGIngestionService } from './services/rag/rag-ingestion.service.js';
import { Context7Service } from './services/context7/context7.service.js';
import { PlaywrightService } from './services/playwright/playwright.service.js';
import { AdminConsole } from './admin/admin-console.js';
import { HealthCheckService } from './services/health/health-check.service.js';
import { AdvancedCacheService } from './services/cache/advanced-cache.service.js';

/**
 * LocalMCP Server - 4 Simple Tools for Vibe Coders
 * 
 * Provides AI assistance through 4 core tools:
 * - localmcp.analyze: "Look at my project"
 * - localmcp.create: "Make me something new" 
 * - localmcp.fix: "Fix this problem"
 * - localmcp.learn: "Remember this solution"
 */
class LocalMCPServer {
  private server: Server;
  private logger: Logger;
  private config: ConfigService;
  private analyzer: ProjectAnalyzer;
  private generator: CodeGenerator;
  private fixer: ErrorFixer;
  private learner: LessonLearner;
  private vectorDb: VectorDatabaseService;
  private ragIngestion: RAGIngestionService;
  private context7: Context7Service;
  private playwright: PlaywrightService;
  private cache: AdvancedCacheService;
  private adminConsole: AdminConsole;
  private healthCheck: HealthCheckService;

  constructor() {
    this.logger = new Logger('LocalMCP');
    this.config = new ConfigService();
    
    // Initialize services
    this.vectorDb = new VectorDatabaseService(this.logger, this.config);
    this.context7 = new Context7Service(this.logger, this.config);
    this.playwright = new PlaywrightService(this.logger, this.config);
    this.cache = new AdvancedCacheService(this.logger, this.config, 'context7');
    this.ragIngestion = new RAGIngestionService(this.logger, this.config, this.vectorDb);
    
    // Initialize admin and health check services
    this.healthCheck = new HealthCheckService(
      this.logger, 
      this.config, 
      this.context7, 
      this.playwright, 
      this.vectorDb, 
      this.ragIngestion, 
      this.cache
    );
    
    this.adminConsole = new AdminConsole(
      this.logger,
      this.config,
      this.context7,
      this.playwright,
      this.vectorDb,
      this.ragIngestion,
      this.cache
    );
    
    // Initialize tools with enhanced services
    this.analyzer = new ProjectAnalyzer(this.logger, this.config, this.context7, this.vectorDb, this.playwright);
    this.generator = new CodeGenerator(this.logger, this.config, this.context7, this.vectorDb, this.playwright);
    this.fixer = new ErrorFixer(this.logger, this.config, this.context7, this.vectorDb, this.playwright);
    this.learner = new LessonLearner(this.logger, this.config, this.vectorDb, this.playwright);

    this.server = new Server(
      {
        name: 'localmcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'localmcp.analyze',
            description: 'Analyze your project structure, dependencies, and identify patterns',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to analyze (defaults to current directory)',
                  default: '.'
                },
                query: {
                  type: 'string',
                  description: 'Specific analysis query (optional)',
                }
              }
            }
          },
          {
            name: 'localmcp.create',
            description: 'Generate new code, files, or components based on natural language description',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'What to create (e.g., "dark theme Hello World component")',
                },
                targetPath: {
                  type: 'string',
                  description: 'Where to create the files (optional)',
                  default: '.'
                },
                options: {
                  type: 'object',
                  description: 'Additional options like colorScheme, framework, etc.',
                  properties: {
                    colorScheme: { type: 'string' },
                    framework: { type: 'string' },
                    language: { type: 'string' }
                  }
                }
              },
              required: ['description']
            }
          },
          {
            name: 'localmcp.fix',
            description: 'Diagnose and automatically resolve coding issues, build errors, or runtime problems',
            inputSchema: {
              type: 'object',
              properties: {
                errorDetails: {
                  type: 'string',
                  description: 'Error message, stack trace, or problem description',
                },
                filePath: {
                  type: 'string',
                  description: 'Path to the file where the error occurred (optional)',
                },
                context: {
                  type: 'string',
                  description: 'Additional context like code snippets, logs (optional)',
                }
              },
              required: ['errorDetails']
            }
          },
          {
            name: 'localmcp.learn',
            description: 'Capture successful coding patterns and solutions for future use',
            inputSchema: {
              type: 'object',
              properties: {
                feedback: {
                  type: 'string',
                  description: 'User confirmation of successful solution or valuable pattern',
                },
                context: {
                  type: 'string',
                  description: 'Relevant code snippets, problem description, and solution details',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Keywords for categorization (optional)',
                }
              },
              required: ['feedback', 'context']
            }
          }
        ] as Tool[]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      try {
        this.logger.info(`Tool called: ${name}`, { args });

        let result;
        switch (name) {
          case 'localmcp.analyze':
            result = await this.analyzer.analyze(
              (args as any)?.path || '.', 
              (args as any)?.query
            );
            break;
          
          case 'localmcp.create':
            result = await this.generator.create(
              (args as any)?.description || '',
              (args as any)?.targetPath || '.',
              (args as any)?.options || {}
            );
            break;
          
          case 'localmcp.fix':
            result = await this.fixer.fix(
              (args as any)?.errorDetails || '',
              (args as any)?.filePath,
              (args as any)?.context
            );
            break;
          
          case 'localmcp.learn':
            result = await this.learner.learn(
              (args as any)?.feedback || '',
              (args as any)?.context || '',
              (args as any)?.tags || []
            );
            break;
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        const executionTime = Date.now() - startTime;
        this.logger.info(`Tool ${name} completed in ${executionTime}ms`);

        // Record tool call for admin console
        this.adminConsole.recordToolCall(name, true, executionTime);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                executionTime,
                tool: name
              }, null, 2)
            }
          ]
        };

      } catch (error) {
        const executionTime = Date.now() - startTime;
        this.logger.error(`Tool ${name} failed:`, error);
        
        // Record failed tool call for admin console
        this.adminConsole.recordToolCall(name, false, executionTime);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime,
                tool: name
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      this.logger.info('LocalMCP Server running on stdio');
    } catch (error) {
      this.logger.error('Failed to start LocalMCP Server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new LocalMCPServer();
server.start().catch(console.error);
