#!/usr/bin/env node

/**
 * Personal MCP Gateway - Main Entry Point
 * 
 * This is the main entry point for the Personal MCP Gateway.
 * It initializes all services and starts the MCP server.
 * 
 * Designed for vibe coders - simple setup, smart defaults, instant feedback.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLogger } from './services/logger/logger.js';
import { ConfigService } from './config/config.service.js';
import { ToolRegistry } from './tools/tool-registry.js';
import { CacheService } from './services/cache/cache.service.js';
import { VectorService } from './services/vector/vector.service.js';
import { PlaywrightService } from './services/playwright/playwright.service.js';

// Initialize logger
const logger = createLogger('main');

/**
 * Main application class
 * Orchestrates all services and provides the MCP server interface
 */
class MCPGateway {
  private server: Server;
  private config: ConfigService;
  private cache: CacheService;
  private vector: VectorService;
  private playwright: PlaywrightService;
  private tools: ToolRegistry;

  constructor() {
    this.config = new ConfigService();
    this.cache = new CacheService(this.config);
    this.vector = new VectorService(this.config);
    this.playwright = new PlaywrightService(this.config);
    this.tools = new ToolRegistry(this.cache, this.vector, this.playwright);
    
    this.server = new Server(
      {
        name: 'personal-mcp-gateway',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * Initialize all services and register tools
   * This is where the magic happens for vibe coders
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Starting Personal MCP Gateway...');
      
      // Initialize services
      await this.cache.initialize();
      await this.vector.initialize();
      await this.playwright.initialize();
      
      // Register all MCP tools
      await this.tools.registerAll(this.server);
      
      logger.info('✅ All services initialized successfully');
      logger.info('🎯 Ready to help vibe coders build faster!');
      
    } catch (error) {
      logger.error('❌ Failed to initialize MCP Gateway:', error);
      process.exit(1);
    }
  }

  /**
   * Start the MCP server
   * This is where we connect to the AI assistant
   */
  async start(): Promise<void> {
    try {
      // Create transport (stdio for Cursor integration)
      const transport = new StdioServerTransport();
      
      // Connect the server to the transport
      await this.server.connect(transport);
      
      logger.info('🔗 MCP Gateway connected and ready');
      logger.info('💡 Connect Cursor to this gateway to start coding smarter');
      
    } catch (error) {
      logger.error('❌ Failed to start MCP Gateway:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   * Clean up resources when the server stops
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('🛑 Shutting down MCP Gateway...');
      
      await this.cache.shutdown();
      await this.vector.shutdown();
      await this.playwright.shutdown();
      
      logger.info('✅ MCP Gateway shutdown complete');
      
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('📡 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('📡 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
async function main() {
  const gateway = new MCPGateway();
  
  try {
    await gateway.initialize();
    await gateway.start();
  } catch (error) {
    logger.error('💥 Failed to start application:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { MCPGateway };
