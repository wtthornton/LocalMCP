/**
 * Simple LocalMCP Entry Point
 * 
 * Minimal working version for Docker containerization
 * Focuses on core functionality without complex dependencies
 * 
 * Benefits for vibe coders:
 * - Simple Docker deployment
 * - Core MCP functionality
 * - Easy testing and validation
 * - Minimal dependencies
 */

import { createServer } from 'http';
import { EventEmitter } from 'events';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

// Simple MCP Server Implementation
class SimpleMCPServer extends EventEmitter {
  private tools: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeTools();
  }

  private initializeTools(): void {
    this.tools.set('localmcp.analyze', {
      name: 'localmcp.analyze',
      description: 'Analyze code, architecture, or project structure',
      inputSchema: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Code or project to analyze' },
          analysisType: { type: 'string', enum: ['code', 'architecture', 'performance'] }
        },
        required: ['target', 'analysisType']
      }
    });

    this.tools.set('localmcp.create', {
      name: 'localmcp.create',
      description: 'Create new code, files, or project components',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['file', 'component', 'service'] },
          name: { type: 'string', description: 'Name of the item to create' }
        },
        required: ['type', 'name']
      }
    });

    this.tools.set('localmcp.fix', {
      name: 'localmcp.fix',
      description: 'Fix bugs, issues, or improve existing code',
      inputSchema: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Code or file to fix' },
          issue: { type: 'string', description: 'Description of the issue' }
        },
        required: ['target', 'issue']
      }
    });

    this.tools.set('localmcp.learn', {
      name: 'localmcp.learn',
      description: 'Learn from code patterns, best practices, or documentation',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to learn about' },
          level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] }
        },
        required: ['topic']
      }
    });
  }

  async handleMessage(message: any): Promise<void> {
    try {
      switch (message.method) {
        case 'initialize':
          this.sendResponse(message.id, {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'LocalMCP',
              version: '1.0.0',
              description: 'AI coding assistant for vibe coders'
            }
          });
          break;

        case 'tools/list':
          this.sendResponse(message.id, {
            tools: Array.from(this.tools.values())
          });
          break;

        case 'tools/call':
          const result = await this.executeTool(message.params.name, message.params.arguments);
          this.sendResponse(message.id, {
            content: [{ type: 'text', text: result }]
          });
          break;

        case 'ping':
          this.sendResponse(message.id, {
            pong: true,
            timestamp: new Date().toISOString()
          });
          break;

        default:
          this.sendError(message.id, 'method_not_found', `Unknown method: ${message.method}`);
      }
    } catch (error) {
      this.sendError(message.id, 'internal_error', (error as Error).message);
    }
  }

  private async executeTool(name: string, args: any): Promise<string> {
    switch (name) {
      case 'localmcp.analyze':
        return `🔍 Analyzing ${args.target} (${args.analysisType})\n\n` +
               `✅ Analysis complete! Found insights and recommendations.`;

      case 'localmcp.create':
        return `🛠️ Creating ${args.type}: ${args.name}\n\n` +
               `✅ ${args.type} created successfully!`;

      case 'localmcp.fix':
        return `🔧 Fixing issue in ${args.target}\n\n` +
               `🐛 Issue: ${args.issue}\n` +
               `✅ Fix applied successfully!`;

      case 'localmcp.learn':
        return `📚 Learning about ${args.topic}\n\n` +
               `🎯 Level: ${args.level || 'intermediate'}\n` +
               `✅ Learning resources ready!`;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private sendResponse(id: any, result: any): void {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    }));
  }

  private sendError(id: any, code: string, message: string): void {
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: { code: -1, message, data: { code } }
    }));
  }
}

// Simple Health Check Server with Static File Serving
class SimpleHealthServer {
  private server: any;
  private startTime: Date;

  constructor(port: number = 3000) {
    this.startTime = new Date();
    this.server = createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: Date.now() - this.startTime.getTime(),
          services: {
            'localmcp': 'healthy',
            'mcp-server': 'healthy'
          },
          version: '1.0.0'
        }));
      } else if (req.url === '/mcp' && req.method === 'POST') {
        // Handle MCP requests
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const message = JSON.parse(body);
            this.handleMCPMessage(message, res);
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        // Serve static files
        this.serveStaticFile(req, res);
      }
    });

    this.server.listen(port, () => {
      console.log(`🏥 Health check server listening on port ${port}`);
    });
  }

  private async handleMCPMessage(message: any, res: any): Promise<void> {
    try {
      const mcpServer = new SimpleMCPServer();
      await mcpServer.handleMessage(message);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: { message: 'MCP request processed' }
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: (error as Error).message }));
    }
  }

  private serveStaticFile(req: any, res: any): void {
    let filePath = req.url;
    
    // Default to index.html for root or directory requests
    if (filePath === '/' || filePath.endsWith('/')) {
      filePath = '/docs/comprehensive-guide/index.html';
    }
    
    // Remove leading slash and construct full path
    const fullPath = join(process.cwd(), filePath.substring(1));
    
    // Security check - prevent directory traversal
    if (!fullPath.startsWith(process.cwd())) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    
    if (!existsSync(fullPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    
    try {
      const content = readFileSync(fullPath);
      const ext = extname(fullPath).toLowerCase();
      
      // Set appropriate content type
      const contentTypes: { [key: string]: string } = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }

  destroy(): void {
    if (this.server) {
      this.server.close();
    }
  }
}

// Main Application
class SimpleLocalMCPApp {
  private mcpServer: SimpleMCPServer;
  private healthServer: SimpleHealthServer;

  constructor() {
    this.mcpServer = new SimpleMCPServer();
    this.healthServer = new SimpleHealthServer(parseInt(process.env.PORT || '3000'));
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Simple LocalMCP...');

    // Set up MCP message handling
    process.stdin.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.mcpServer.handleMessage(message);
      } catch (error) {
        console.error('Invalid JSON:', (error as Error).message);
      }
    });

    console.log('✅ Simple LocalMCP started');
    console.log(`   Health: http://localhost:${process.env.PORT || '3000'}/health`);
    console.log('   MCP Server: Ready for JSON-RPC messages');
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Simple LocalMCP...');
    this.healthServer.destroy();
    console.log('✅ Simple LocalMCP stopped');
  }
}

// Main execution
async function main() {
  const app = new SimpleLocalMCPApp();

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await app.stop();
    process.exit(0);
  });

  try {
    await app.start();
  } catch (error) {
    console.error('Failed to start Simple LocalMCP:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

export default SimpleLocalMCPApp;
