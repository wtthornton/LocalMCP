/**
 * Simplified Health Check Endpoint
 * 
 * Uses MCP protocol health tool for accurate testing
 * Provides simple HTTP endpoint for Docker health checks
 * 
 * Benefits for vibe coders:
 * - Tests actual MCP protocol functionality
 * - Simple HTTP endpoint for monitoring
 * - Real service connectivity validation
 */

import { createServer } from 'http';
import { Logger } from './services/logger/logger.js';
import { ConfigService } from './config/config.service.js';
import { HealthTool } from './tools/health.tool.js';

interface SimpleHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  mcp: {
    status: 'healthy' | 'unhealthy';
    tools: string[];
  };
  services: {
    context7: 'healthy' | 'unhealthy' | 'not_configured';
    openai: 'healthy' | 'unhealthy' | 'not_configured';
    database: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'unhealthy';
  };
  version: string;
}

class HealthCheckServer {
  private server: any;
  private startTime: Date;
  private logger: Logger;
  private config: ConfigService;
  private healthTool: HealthTool;

  constructor(port: number = 3000) {
    this.startTime = new Date();
    this.logger = new Logger('HealthCheck');
    this.config = new ConfigService();
    this.healthTool = new HealthTool(this.logger, this.config);
    this.server = createServer(this.handleRequest.bind(this));
    this.server.listen(port, () => {
      console.log(`🏥 Health check server listening on port ${port}`);
    });
    
    this.initializeHealthTool();
  }

  private async initializeHealthTool() {
    try {
      await this.healthTool.initialize();
      this.logger.info('Health tool initialized for MCP protocol testing');
    } catch (error) {
      this.logger.error('Failed to initialize health tool', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleRequest(req: any, res: any): Promise<void> {
    if (req.url === '/health' && req.method === 'GET') {
      try {
        const healthStatus = await this.getHealthStatus();
        
        const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(healthStatus, null, 2));
      } catch (error) {
        const errorStatus: SimpleHealthStatus = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: Date.now() - this.startTime.getTime(),
          mcp: { status: 'unhealthy', tools: [] },
          services: {
            context7: 'unhealthy',
            openai: 'unhealthy',
            database: 'unhealthy',
            cache: 'unhealthy'
          },
          version: '1.0.0'
        };
        
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorStatus, null, 2));
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  private async getHealthStatus(): Promise<SimpleHealthStatus> {
    try {
      // Use the MCP health tool to get comprehensive health status
      const healthResult = await this.healthTool.performHealthCheck();
      
      // Convert to simplified format for HTTP endpoint
      const simpleStatus: SimpleHealthStatus = {
        status: healthResult.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: healthResult.timestamp,
        uptime: healthResult.uptime,
        mcp: {
          status: healthResult.services.mcp.status === 'healthy' ? 'healthy' : 'unhealthy',
          tools: ['promptmcp.enhance', 'promptmcp.todo', 'promptmcp.health']
        },
        services: {
          context7: healthResult.services.context7.status === 'healthy' ? 'healthy' : 
                   healthResult.services.context7.status === 'not_configured' ? 'not_configured' : 'unhealthy',
          openai: healthResult.services.openai.status === 'healthy' ? 'healthy' : 
                  healthResult.services.openai.status === 'not_configured' ? 'not_configured' : 'unhealthy',
          database: healthResult.services.database.status === 'healthy' ? 'healthy' : 'unhealthy',
          cache: healthResult.services.cache.status === 'healthy' ? 'healthy' : 'unhealthy'
        },
        version: healthResult.version
      };

      return simpleStatus;
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        mcp: { status: 'unhealthy', tools: [] },
        services: {
          context7: 'unhealthy',
          openai: 'unhealthy',
          database: 'unhealthy',
          cache: 'unhealthy'
        },
        version: '1.0.0'
      };
    }
  }

  destroy(): void {
    if (this.server) {
      this.server.close();
    }
    
    // Clean up health tool
    if (this.healthTool) {
      this.healthTool.destroy();
    }
  }
}

// Start health check server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3000');
  const healthServer = new HealthCheckServer(port);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down health server...');
    healthServer.destroy();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down health server...');
    healthServer.destroy();
    process.exit(0);
  });
}

export default HealthCheckServer;
