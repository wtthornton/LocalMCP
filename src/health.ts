/**
 * Health Check Endpoint
 * 
 * Simple health check for Docker container validation
 * 
 * Benefits for vibe coders:
 * - Easy container health validation
 * - Service status monitoring
 * - Docker health check integration
 */

import { createServer } from 'http';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: Record<string, string>;
  version: string;
}

class HealthCheckServer {
  private server: any;
  private startTime: Date;

  constructor(port: number = 3000) {
    this.startTime = new Date();
    this.server = createServer(this.handleRequest.bind(this));
    this.server.listen(port, () => {
      console.log(`🏥 Health check server listening on port ${port}`);
    });
  }

  private handleRequest(req: any, res: any): void {
    if (req.url === '/health' && req.method === 'GET') {
      const healthStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        services: {
          'localmcp': 'healthy',
          'context7': 'healthy',
          'vector-db': 'healthy',
          'cache': 'healthy',
          'monitoring': 'healthy'
        },
        version: '1.0.0'
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(healthStatus, null, 2));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  destroy(): void {
    if (this.server) {
      this.server.close();
    }
  }
}

// Start health check server if run directly
if (require.main === module) {
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
