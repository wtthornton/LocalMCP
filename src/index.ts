/**
 * LocalMCP Main Entry Point
 * 
 * This is the main entry point for the LocalMCP Docker container,
 * orchestrating all services and providing the MCP server interface.
 * 
 * Benefits for vibe coders:
 * - Single command startup: docker run localmcp
 * - All services pre-configured and connected
 * - Built-in health checks and monitoring
 * - Easy local testing and validation
 * - Production-ready configuration
 */

import { EventEmitter } from 'events';
import { createServer } from 'http';
import { createWriteStream } from 'fs';
import { join } from 'path';

// Import all LocalMCP services
import { Context7MCPClientService } from './services/context7';
import { VectorDatabaseService } from './services/vector-database';
import { RAGIngestionService } from './services/rag-ingestion';
import { PlaywrightService } from './services/playwright';
import { AdvancedCacheService } from './services/advanced-cache';
import { AdminConsoleService } from './services/admin-console';
import { HealthCheckService } from './services/health-check';
import { ResilienceCoordinatorService } from './services/resilience';
import { OfflineModeService } from './services/offline';
import { PerformanceMonitorService, AlertingService, MonitoringCoordinatorService } from './services/monitoring';

// MCP Server implementation
import { MCPServer } from './mcp/server';

// Configuration
interface LocalMCPConfig {
  port: number;
  adminPort: number;
  monitoringPort: number;
  context7ApiUrl: string;
  context7ApiKey: string;
  vectorDbPath: string;
  cachePath: string;
  logsPath: string;
  backupsPath: string;
  nodeEnv: string;
}

// Main LocalMCP Application
class LocalMCPApplication extends EventEmitter {
  private config: LocalMCPConfig;
  private services: Map<string, any> = new Map();
  private servers: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    super();
    
    // Load configuration from environment
    this.config = {
      port: parseInt(process.env.PORT || '3000'),
      adminPort: parseInt(process.env.ADMIN_PORT || '3001'),
      monitoringPort: parseInt(process.env.MONITORING_PORT || '3002'),
      context7ApiUrl: process.env.CONTEXT7_API_URL || 'https://context7.com/api/v1',
      context7ApiKey: process.env.CONTEXT7_API_KEY || '',
      vectorDbPath: process.env.VECTOR_DB_PATH || './data/vector-db',
      cachePath: process.env.CACHE_PATH || './data/cache',
      logsPath: process.env.LOGS_PATH || './data/logs',
      backupsPath: process.env.BACKUPS_PATH || './data/backups',
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    // Set up logging
    this.setupLogging();
  }

  /**
   * Initialize all LocalMCP services
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing LocalMCP...');
      
      // Initialize core services
      await this.initializeCoreServices();
      
      // Initialize MCP server
      await this.initializeMCPServer();
      
      // Initialize web servers
      await this.initializeWebServers();
      
      // Start all services
      await this.startServices();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('✅ LocalMCP initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize LocalMCP:', error);
      this.emit('initializationError', error);
      throw error;
    }
  }

  /**
   * Initialize core services
   */
  private async initializeCoreServices(): Promise<void> {
    console.log('📦 Initializing core services...');

    // Context7 MCP Client
    const context7Client = new Context7MCPClientService({
      apiUrl: this.config.context7ApiUrl,
      apiKey: this.config.context7ApiKey,
      timeout: 10000,
      retryAttempts: 3,
      cacheEnabled: true,
      cacheTTL: 24 * 60 * 60 * 1000
    });
    await context7Client.initialize();
    this.services.set('context7', context7Client);

    // Vector Database
    const vectorDb = new VectorDatabaseService({
      host: 'qdrant',
      port: 6333,
      collectionName: 'localmcp'
    });
    await vectorDb.initialize();
    this.services.set('vectorDb', vectorDb);

    // RAG Ingestion
    const ragIngestion = new RAGIngestionService(vectorDb);
    await ragIngestion.initialize();
    this.services.set('ragIngestion', ragIngestion);

    // Advanced Cache
    const cache = new AdvancedCacheService({
      maxSize: 1000,
      ttl: 3600000,
      enableCompression: true
    });
    await cache.initialize();
    this.services.set('cache', cache);

    // Playwright Service
    const playwright = new PlaywrightService();
    await playwright.initialize();
    this.services.set('playwright', playwright);

    // Health Check Service
    const healthCheck = new HealthCheckService();
    await healthCheck.initialize();
    this.services.set('healthCheck', healthCheck);

    // Resilience Coordinator
    const resilience = new ResilienceCoordinatorService();
    await resilience.initialize();
    this.services.set('resilience', resilience);

    // Offline Mode Service
    const offlineMode = new OfflineModeService();
    await offlineMode.initialize();
    this.services.set('offlineMode', offlineMode);

    // Performance Monitor
    const performanceMonitor = new PerformanceMonitorService();
    await performanceMonitor.initialize();
    this.services.set('performanceMonitor', performanceMonitor);

    // Alerting Service
    const alerting = new AlertingService();
    await alerting.initialize();
    this.services.set('alerting', alerting);

    // Monitoring Coordinator
    const monitoring = new MonitoringCoordinatorService(performanceMonitor, alerting);
    await monitoring.initialize();
    this.services.set('monitoring', monitoring);

    // Admin Console
    const adminConsole = new AdminConsoleService({
      port: this.config.adminPort,
      services: this.services
    });
    await adminConsole.initialize();
    this.services.set('adminConsole', adminConsole);

    console.log('✅ Core services initialized');
  }

  /**
   * Initialize MCP server
   */
  private async initializeMCPServer(): Promise<void> {
    console.log('🔌 Initializing MCP server...');

    const mcpServer = new MCPServer({
      context7Client: this.services.get('context7'),
      vectorDb: this.services.get('vectorDb'),
      ragIngestion: this.services.get('ragIngestion'),
      cache: this.services.get('cache'),
      playwright: this.services.get('playwright'),
      healthCheck: this.services.get('healthCheck'),
      resilience: this.services.get('resilience'),
      offlineMode: this.services.get('offlineMode'),
      monitoring: this.services.get('monitoring')
    });

    await mcpServer.initialize();
    this.services.set('mcpServer', mcpServer);

    console.log('✅ MCP server initialized');
  }

  /**
   * Initialize web servers
   */
  private async initializeWebServers(): Promise<void> {
    console.log('🌐 Initializing web servers...');

    // Main API server
    const apiServer = createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.servers.set('api', apiServer);

    console.log('✅ Web servers initialized');
  }

  /**
   * Start all services
   */
  private async startServices(): Promise<void> {
    console.log('▶️ Starting services...');

    // Start MCP server
    const mcpServer = this.services.get('mcpServer');
    if (mcpServer) {
      await mcpServer.start();
    }

    // Start web servers
    const apiServer = this.servers.get('api');
    if (apiServer) {
      apiServer.listen(this.config.port, () => {
        console.log(`🌐 API server listening on port ${this.config.port}`);
      });
    }

    // Start admin console
    const adminConsole = this.services.get('adminConsole');
    if (adminConsole) {
      await adminConsole.start();
    }

    // Start monitoring
    const monitoring = this.services.get('monitoring');
    if (monitoring) {
      await monitoring.start();
    }

    console.log('✅ All services started');
  }

  /**
   * Set up logging
   */
  private setupLogging(): void {
    const logStream = createWriteStream(join(this.config.logsPath, 'localmcp.log'), { flags: 'a' });
    
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      const message = `[${new Date().toISOString()}] [INFO] ${args.join(' ')}\n`;
      logStream.write(message);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = `[${new Date().toISOString()}] [ERROR] ${args.join(' ')}\n`;
      logStream.write(message);
      originalError(...args);
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down LocalMCP...');

    // Stop web servers
    for (const [name, server] of this.servers) {
      console.log(`   Stopping ${name} server...`);
      server.close();
    }

    // Stop services
    for (const [name, service] of this.services) {
      if (service && typeof service.destroy === 'function') {
        console.log(`   Stopping ${name} service...`);
        await service.destroy();
      }
    }

    this.emit('shutdown');
    console.log('✅ LocalMCP shutdown complete');
  }

  /**
   * Get service status
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      services: Array.from(this.services.keys()),
      servers: Array.from(this.servers.keys()),
      config: {
        port: this.config.port,
        adminPort: this.config.adminPort,
        monitoringPort: this.config.monitoringPort,
        nodeEnv: this.config.nodeEnv
      }
    };
  }
}

// Main execution
async function main() {
  const app = new LocalMCPApplication();

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await app.shutdown();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await app.shutdown();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    await app.shutdown();
    process.exit(1);
  });

  try {
    await app.initialize();
    console.log('🎉 LocalMCP is ready!');
    console.log(`   API: http://localhost:${app.getStatus().config.port}`);
    console.log(`   Admin: http://localhost:${app.getStatus().config.adminPort}`);
    console.log(`   Monitoring: http://localhost:${app.getStatus().config.monitoringPort}`);
  } catch (error) {
    console.error('Failed to start LocalMCP:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

export default LocalMCPApplication;
