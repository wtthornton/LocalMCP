#!/usr/bin/env node

import { createServer } from 'http';
import { Context7IntegrationService } from './services/context7/context7-integration.service.js';
import { Logger } from './services/logger/logger.js';
import { ConfigService } from './config/config.service.js';
import { MCPServer } from './mcp/server.js';

const PORT = process.env.HTTP_PORT || 3001;
const logger = new Logger('PromptMCP-HTTP');

async function startHttpServer() {
  const config = new ConfigService();
  const context7Integration = new Context7IntegrationService(logger, config);
  
  // Initialize Context7 integration
  try {
    logger.info('Initializing Context7 integration...');
    await context7Integration.initialize();
    logger.info('Context7 integration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Context7 integration', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Continue without Context7 - graceful degradation
  }
  
  // Initialize MCP server
  let mcpServer: MCPServer | null = null;
  try {
    logger.info('Initializing MCP server...');
    mcpServer = new MCPServer({
      logger,
      config,
      context7Integration
    });
    await mcpServer.initialize();
    logger.info('MCP server initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize MCP server', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Continue without MCP - graceful degradation
  }
  
  const server = createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy', 
        service: 'PromptMCP',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        mcp: {
          status: mcpServer ? 'healthy' : 'unavailable',
          tools: mcpServer ? Array.from(mcpServer.getTools().values()).map(t => t.name) : []
        }
      }));
      return;
    }
    
    if (req.method === 'POST' && req.url === '/mcp') {
      if (!mcpServer) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'MCP server not available',
          message: 'MCP server failed to initialize'
        }));
        return;
      }
      
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const mcpRequest = JSON.parse(body);
            const result = await mcpServer.handleRequest(mcpRequest);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (error) {
            logger.error('MCP request failed', { error: (error as Error).message });
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              jsonrpc: '2.0',
              id: JSON.parse(body).id || null,
              error: {
                code: -32600,
                message: 'Invalid Request',
                data: (error as Error).message
              }
            }));
          }
        });
      } catch (error) {
        logger.error('MCP request processing failed', { error: (error as Error).message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: (error as Error).message
          }
        }));
      }
      return;
    }
    
    if (req.method === 'POST' && req.url === '/enhance') {
      try {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const request = JSON.parse(body);
            const result = await context7Integration.enhancePrompt(
              request.prompt,
              request.context || {},
              {
                maxTokens: 4000,
                includeMetadata: true,
                includeBreakdown: true,
                maxTasks: 5
              }
            );
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (error) {
            logger.error('Enhancement failed', { error: (error as Error).message });
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Enhancement failed', 
              message: (error as Error).message 
            }));
          }
        });
      } catch (error) {
        logger.error('Request processing failed', { error: (error as Error).message });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Internal server error', 
          message: (error as Error).message 
        }));
      }
      return;
    }
    
    // Default response
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Not found',
      message: 'Use POST /enhance to enhance prompts or GET /health for status'
    }));
  });
  
  server.listen(PORT, () => {
    logger.info(`🚀 PromptMCP HTTP Server running on port ${PORT}`);
    logger.info('📝 Ready to enhance prompts with perfect context!');
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔗 Enhance endpoint: POST http://localhost:${PORT}/enhance`);
  });
  
  server.on('error', (error) => {
    logger.error('Server error', { error: error.message });
    process.exit(1);
  });
}

startHttpServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
