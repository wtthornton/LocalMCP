#!/usr/bin/env node

import { createServer } from 'http';
import { EnhanceTool } from './tools/enhance.js';
import { Logger } from './services/logger/logger.js';

const PORT = process.env.PORT || 3000;
const logger = new Logger('PromptMCP-HTTP');

async function startHttpServer() {
  const enhanceTool = new EnhanceTool();
  
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
        timestamp: new Date().toISOString()
      }));
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
            const result = await enhanceTool.enhance(request);
            
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
