import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { Context7Service } from '../services/context7/context7.service.js';
import { PlaywrightService } from '../services/playwright/playwright.service.js';
import { VectorDatabaseService } from '../services/vector/vector-db.service.js';
import { RAGIngestionService } from '../services/rag/rag-ingestion.service.js';
import { AdvancedCacheService } from '../services/cache/advanced-cache.service.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface AdminConsoleConfig {
  port: number;
  enabled: boolean;
  auth?: {
    username: string;
    password: string;
  } | undefined;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime?: number;
  error?: string | undefined;
  details?: any;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  toolCalls: {
    total: number;
    byTool: Record<string, number>;
    successRate: number;
    averageResponseTime: number;
  };
  cache: {
    hitRate: number;
    totalEntries: number;
    memoryUsage: number;
  };
  services: ServiceHealth[];
}

/**
 * Admin Console - Debugging and Monitoring Interface
 * 
 * Provides a web-based admin console for monitoring and debugging LocalMCP
 */
export class AdminConsole {
  private server: any;
  private config: AdminConsoleConfig;
  private metrics: SystemMetrics;
  private startTime: Date;

  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private context7: Context7Service,
    private playwright: PlaywrightService,
    private vectorDb: VectorDatabaseService,
    private ragIngestion: RAGIngestionService,
    private cache: AdvancedCacheService
  ) {
    this.startTime = new Date();
    this.config = {
      port: configService.getNested('admin', 'port') || 3001,
      enabled: configService.getNested('admin', 'enabled') || false,
      auth: configService.getNested('admin', 'auth') || undefined
    };
    
    this.metrics = {
      uptime: 0,
      memoryUsage: process.memoryUsage(),
      toolCalls: {
        total: 0,
        byTool: {},
        successRate: 0,
        averageResponseTime: 0
      },
      cache: {
        hitRate: 0,
        totalEntries: 0,
        memoryUsage: 0
      },
      services: []
    };

    if (this.config.enabled) {
      this.start();
    }
  }

  private async start(): Promise<void> {
    this.server = createServer(this.handleRequest.bind(this));
    
    this.server.listen(this.config.port, () => {
      this.logger.info(`Admin console started on port ${this.config.port}`);
    });

    // Update metrics every 30 seconds
    setInterval(() => {
      this.updateMetrics();
    }, 30000);

    // Initial metrics update
    this.updateMetrics();
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const path = url.pathname;

      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Basic authentication check
      if (this.config.auth && !this.checkAuth(req)) {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Console"' });
        res.end('Unauthorized');
        return;
      }

      switch (path) {
        case '/':
          await this.serveDashboard(res);
          break;
        case '/api/health':
          await this.serveHealth(res);
          break;
        case '/api/metrics':
          await this.serveMetrics(res);
          break;
        case '/api/services':
          await this.serveServices(res);
          break;
        case '/api/cache':
          await this.serveCacheStats(res);
          break;
        case '/api/logs':
          await this.serveLogs(res);
          break;
        case '/api/tools':
          await this.serveToolStats(res);
          break;
        default:
          res.writeHead(404);
          res.end('Not Found');
      }
    } catch (error) {
      this.logger.error('Admin console error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  private checkAuth(req: IncomingMessage): boolean {
    if (!this.config.auth) return true;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    return username === this.config.auth.username && password === this.config.auth.password;
  }

  private async serveDashboard(res: ServerResponse): Promise<void> {
    const html = await this.getDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  private async getDashboardHTML(): Promise<string> {
    try {
      const templatePath = join(process.cwd(), 'src', 'admin', 'dashboard.html');
      const template = await readFile(templatePath, 'utf-8');
      return template;
    } catch (error) {
      // Fallback to inline HTML if template file doesn't exist
      return this.getInlineDashboardHTML();
    }
  }

  private getInlineDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalMCP Admin Console</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.healthy { background: #d4edda; color: #155724; }
        .status.degraded { background: #fff3cd; color: #856404; }
        .status.unhealthy { background: #f8d7da; color: #721c24; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; color: #007bff; }
        .refresh-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #0056b3; }
        .log-entry { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎛️ LocalMCP Admin Console</h1>
            <p>Real-time monitoring and debugging for LocalMCP</p>
            <button class="refresh-btn" onclick="refreshData()">🔄 Refresh</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 System Health</h3>
                <div id="system-health">Loading...</div>
            </div>
            
            <div class="card">
                <h3>🔧 Services</h3>
                <div id="services">Loading...</div>
            </div>
            
            <div class="card">
                <h3>📈 Tool Performance</h3>
                <div id="tool-performance">Loading...</div>
            </div>
            
            <div class="card">
                <h3>💾 Cache Statistics</h3>
                <div id="cache-stats">Loading...</div>
            </div>
            
            <div class="card">
                <h3>📝 Recent Logs</h3>
                <div id="recent-logs">Loading...</div>
            </div>
            
            <div class="card">
                <h3>🎯 Quick Actions</h3>
                <div>
                    <button class="refresh-btn" onclick="clearCache()">🗑️ Clear Cache</button>
                    <button class="refresh-btn" onclick="restartServices()">🔄 Restart Services</button>
                    <button class="refresh-btn" onclick="exportLogs()">📥 Export Logs</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function refreshData() {
            await Promise.all([
                loadSystemHealth(),
                loadServices(),
                loadToolPerformance(),
                loadCacheStats(),
                loadRecentLogs()
            ]);
        }

        async function loadSystemHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('system-health').innerHTML = \`
                    <div class="metric">
                        <span>Uptime:</span>
                        <span class="metric-value">\${Math.floor(data.uptime / 1000)}s</span>
                    </div>
                    <div class="metric">
                        <span>Memory Usage:</span>
                        <span class="metric-value">\${Math.round(data.memoryUsage.used / 1024 / 1024)}MB</span>
                    </div>
                    <div class="metric">
                        <span>Status:</span>
                        <span class="status \${data.overallStatus}">\${data.overallStatus.toUpperCase()}</span>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('system-health').innerHTML = '<div class="error">Failed to load system health</div>';
            }
        }

        async function loadServices() {
            try {
                const response = await fetch('/api/services');
                const services = await response.json();
                const html = services.map(service => \`
                    <div class="metric">
                        <span>\${service.name}:</span>
                        <span class="status \${service.status}">\${service.status.toUpperCase()}</span>
                    </div>
                \`).join('');
                document.getElementById('services').innerHTML = html;
            } catch (error) {
                document.getElementById('services').innerHTML = '<div class="error">Failed to load services</div>';
            }
        }

        async function loadToolPerformance() {
            try {
                const response = await fetch('/api/tools');
                const data = await response.json();
                document.getElementById('tool-performance').innerHTML = \`
                    <div class="metric">
                        <span>Total Calls:</span>
                        <span class="metric-value">\${data.totalCalls}</span>
                    </div>
                    <div class="metric">
                        <span>Success Rate:</span>
                        <span class="metric-value">\${data.successRate}%</span>
                    </div>
                    <div class="metric">
                        <span>Avg Response Time:</span>
                        <span class="metric-value">\${data.averageResponseTime}ms</span>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('tool-performance').innerHTML = '<div class="error">Failed to load tool performance</div>';
            }
        }

        async function loadCacheStats() {
            try {
                const response = await fetch('/api/cache');
                const data = await response.json();
                document.getElementById('cache-stats').innerHTML = \`
                    <div class="metric">
                        <span>Hit Rate:</span>
                        <span class="metric-value">\${data.hitRate}%</span>
                    </div>
                    <div class="metric">
                        <span>Total Entries:</span>
                        <span class="metric-value">\${data.totalEntries}</span>
                    </div>
                    <div class="metric">
                        <span>Memory Usage:</span>
                        <span class="metric-value">\${Math.round(data.memoryUsage / 1024)}KB</span>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('cache-stats').innerHTML = '<div class="error">Failed to load cache stats</div>';
            }
        }

        async function loadRecentLogs() {
            try {
                const response = await fetch('/api/logs');
                const logs = await response.json();
                const html = logs.slice(0, 10).map(log => \`
                    <div class="log-entry \${log.level}">
                        [\${log.timestamp}] \${log.message}
                    </div>
                \`).join('');
                document.getElementById('recent-logs').innerHTML = html;
            } catch (error) {
                document.getElementById('recent-logs').innerHTML = '<div class="error">Failed to load logs</div>';
            }
        }

        async function clearCache() {
            if (confirm('Are you sure you want to clear the cache?')) {
                try {
                    await fetch('/api/cache', { method: 'DELETE' });
                    alert('Cache cleared successfully');
                    refreshData();
                } catch (error) {
                    alert('Failed to clear cache');
                }
            }
        }

        async function restartServices() {
            if (confirm('Are you sure you want to restart all services?')) {
                try {
                    await fetch('/api/services', { method: 'POST' });
                    alert('Services restart initiated');
                    refreshData();
                } catch (error) {
                    alert('Failed to restart services');
                }
            }
        }

        async function exportLogs() {
            try {
                const response = await fetch('/api/logs');
                const logs = await response.json();
                const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'localmcp-logs.json';
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                alert('Failed to export logs');
            }
        }

        // Auto-refresh every 30 seconds
        setInterval(refreshData, 30000);
        
        // Initial load
        refreshData();
    </script>
</body>
</html>`;
  }

  private async serveHealth(res: ServerResponse): Promise<void> {
    const health = await this.getSystemHealth();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  }

  private async serveMetrics(res: ServerResponse): Promise<void> {
    this.updateMetrics();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics, null, 2));
  }

  private async serveServices(res: ServerResponse): Promise<void> {
    const services = await this.checkServiceHealth();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(services, null, 2));
  }

  private async serveCacheStats(res: ServerResponse): Promise<void> {
    const stats = this.cache.getStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
  }

  private async serveLogs(res: ServerResponse): Promise<void> {
    // In a real implementation, this would read from log files
    const logs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'Admin console accessed' },
      { timestamp: new Date().toISOString(), level: 'info', message: 'System health check completed' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(logs, null, 2));
  }

  private async serveToolStats(res: ServerResponse): Promise<void> {
    const stats = {
      totalCalls: this.metrics.toolCalls.total,
      successRate: this.metrics.toolCalls.successRate,
      averageResponseTime: this.metrics.toolCalls.averageResponseTime,
      byTool: this.metrics.toolCalls.byTool
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
  }

  private async getSystemHealth(): Promise<any> {
    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = process.memoryUsage();
    const services = await this.checkServiceHealth();
    
    const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' : 
                         services.some(s => s.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    return {
      uptime,
      memoryUsage,
      overallStatus,
      services: services.length,
      healthyServices: services.filter(s => s.status === 'healthy').length
    };
  }

  private async checkServiceHealth(): Promise<ServiceHealth[]> {
    const services: ServiceHealth[] = [];

    // Check Context7 service
    try {
      const start = Date.now();
      const context7Health = await this.context7.query({ query: 'health check' });
      services.push({
        name: 'Context7',
        status: context7Health.success ? 'healthy' : 'degraded',
        lastCheck: new Date(),
        responseTime: Date.now() - start,
        error: context7Health.success ? undefined : context7Health.error
      });
    } catch (error) {
      services.push({
        name: 'Context7',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check Playwright service
    try {
      const start = Date.now();
      const playwrightHealth = await this.playwright.healthCheck();
      services.push({
        name: 'Playwright',
        status: playwrightHealth ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - start
      });
    } catch (error) {
      services.push({
        name: 'Playwright',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

      // Check Vector Database
    try {
      const start = Date.now();
      // For now, assume healthy if no error is thrown
      const vectorHealth = true; // await this.vectorDb.healthCheck();
      services.push({
        name: 'Vector DB',
        status: vectorHealth ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - start
      });
    } catch (error) {
      services.push({
        name: 'Vector DB',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return services;
  }

  private updateMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime.getTime();
    this.metrics.memoryUsage = process.memoryUsage();
    
    // Update cache metrics
    const cacheStats = this.cache.getStats();
    this.metrics.cache = {
      hitRate: cacheStats.hitRate || 0,
      totalEntries: cacheStats.totalEntries || 0,
      memoryUsage: 0 // cacheStats.memoryUsage || 0
    };
  }

  public recordToolCall(toolName: string, success: boolean, responseTime: number): void {
    this.metrics.toolCalls.total++;
    this.metrics.toolCalls.byTool[toolName] = (this.metrics.toolCalls.byTool[toolName] || 0) + 1;
    
    // Update success rate (simplified calculation)
    const totalCalls = this.metrics.toolCalls.total;
    const currentSuccessRate = this.metrics.toolCalls.successRate;
    this.metrics.toolCalls.successRate = ((currentSuccessRate * (totalCalls - 1)) + (success ? 100 : 0)) / totalCalls;
    
    // Update average response time
    const currentAvg = this.metrics.toolCalls.averageResponseTime;
    this.metrics.toolCalls.averageResponseTime = ((currentAvg * (totalCalls - 1)) + responseTime) / totalCalls;
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.logger.info('Admin console stopped');
    }
  }
}
