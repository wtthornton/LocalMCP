/**
 * PromptMCP Main Entry Point
 * 
 * Simple entry point for the PromptMCP server.
 * Provides the MCP server interface for prompt enhancement.
 */

import { createServer } from 'http';
import { PromptMCPServer } from './server.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const server = new PromptMCPServer();
    await server.start();
    
    console.log(`🚀 PromptMCP Server running on port ${PORT}`);
    console.log('📝 Ready to enhance prompts with perfect context!');
  } catch (error) {
    console.error('❌ Failed to start PromptMCP server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();