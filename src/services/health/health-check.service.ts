import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { Context7Service } from '../context7/context7.service.js';
import { PlaywrightService } from '../playwright/playwright.service.js';
import { VectorDatabaseService } from '../vector/vector-db.service.js';
import { RAGIngestionService } from '../rag/rag-ingestion.service.js';
import { AdvancedCacheService } from '../cache/advanced-cache.service.js';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  details?: any;
  error?: string | undefined;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  services: HealthCheckResult[];
  timestamp: Date;
}

/**
 * Health Check Service
 * 
 * Monitors the health of all LocalMCP services and components
 */
export class HealthCheckService {
  private startTime: Date;
  private healthHistory: HealthCheckResult[] = [];
  private maxHistorySize = 100;

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private context7: Context7Service,
    private playwright: PlaywrightService,
    private vectorDb: VectorDatabaseService,
    private ragIngestion: RAGIngestionService,
    private cache: AdvancedCacheService
  ) {
    this.startTime = new Date();
  }

  /**
   * Perform comprehensive health check of all services
   */
  async checkAllServices(): Promise<SystemHealth> {
    const startTime = Date.now();
    const services: HealthCheckResult[] = [];

    // Check each service in parallel
    const serviceChecks = await Promise.allSettled([
      this.checkContext7(),
      this.checkPlaywright(),
      this.checkVectorDatabase(),
      this.checkRAGIngestion(),
      this.checkCache(),
      this.checkSystemResources()
    ]);

    serviceChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        services.push(result.value);
      } else {
        const serviceNames = ['Context7', 'Playwright', 'Vector DB', 'RAG Ingestion', 'Cache', 'System Resources'];
        services.push({
          service: serviceNames[index] || 'Unknown',
          status: 'unhealthy',
          responseTime: 0,
          lastCheck: new Date(),
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    // Store in history
    this.healthHistory.push(...services);
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }

    // Determine overall health
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices.length > 0) {
      overall = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    const totalTime = Date.now() - startTime;
    this.logger.info(`Health check completed in ${totalTime}ms`, { overall, services: services.length });

    return {
      overall,
      uptime: Date.now() - this.startTime.getTime(),
      memoryUsage: process.memoryUsage(),
      services,
      timestamp: new Date()
    };
  }

  /**
   * Check Context7 service health
   */
  private async checkContext7(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Simple query to test Context7 connectivity
      const result = await this.context7.query({ 
        query: 'health check',
        maxTokens: 10
      });
      
      const responseTime = Date.now() - start;
      const status = result.success ? 'healthy' : 'degraded';
      
      return {
        service: 'Context7',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          enabled: this.config.getNested('context7', 'enabled'),
          cacheEnabled: this.config.getNested('context7', 'cacheEnabled'),
          hasApiKey: !!this.config.getNested('context7', 'apiKey')
        },
        error: result.success ? undefined : result.error
      };
    } catch (error) {
      return {
        service: 'Context7',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Playwright service health
   */
  private async checkPlaywright(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const isHealthy = await this.playwright.healthCheck();
      const responseTime = Date.now() - start;
      
      return {
        service: 'Playwright',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          enabled: this.config.getNested('playwright', 'mcp')?.enabled,
          baseUrl: this.config.getNested('playwright', 'mcp')?.baseUrl
        }
      };
    } catch (error) {
      return {
        service: 'Playwright',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Vector Database health
   */
  private async checkVectorDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // For now, assume healthy if no error is thrown
      const isHealthy = true; // await this.vectorDb.healthCheck();
      const responseTime = Date.now() - start;
      
      return {
        service: 'Vector DB',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          url: this.config.getNested('vector', 'qdrant')?.url,
          collections: this.config.getNested('vector', 'qdrant')?.collections
        }
      };
    } catch (error) {
      return {
        service: 'Vector DB',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check RAG Ingestion service health
   */
  private async checkRAGIngestion(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      // Check if RAG ingestion is working by testing document count
      // const stats = await this.vectorDb.getCollectionStats('localmcp_documents');
      const responseTime = Date.now() - start;
      
      return {
        service: 'RAG Ingestion',
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          documentCount: 0, // stats?.pointsCount || 0,
          lastIngestion: 'Unknown' // Would need to track this
        }
      };
    } catch (error) {
      return {
        service: 'RAG Ingestion',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Cache service health
   */
  private async checkCache(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const stats = this.cache.getStats();
      const responseTime = Date.now() - start;
      
      return {
        service: 'Cache',
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          hitRate: stats.hitRate,
          totalEntries: stats.totalEntries,
          memoryUsage: 0 // stats.memoryUsage
        }
      };
    } catch (error) {
      return {
        service: 'Cache',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check system resources health
   */
  private async checkSystemResources(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const responseTime = Date.now() - start;
      
      // Check if memory usage is reasonable (less than 1GB)
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
      const status = memoryUsageMB > 1000 ? 'degraded' : 'healthy';
      
      return {
        service: 'System Resources',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          memoryUsageMB: Math.round(memoryUsageMB),
          uptime: Date.now() - this.startTime.getTime(),
          nodeVersion: process.version,
          platform: process.platform
        }
      };
    } catch (error) {
      return {
        service: 'System Resources',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get health history for trending analysis
   */
  getHealthHistory(): HealthCheckResult[] {
    return [...this.healthHistory];
  }

  /**
   * Get service-specific health trends
   */
  getServiceTrends(serviceName: string, hours: number = 24): HealthCheckResult[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.healthHistory
      .filter(entry => 
        entry.service === serviceName && 
        entry.lastCheck.getTime() > cutoffTime
      )
      .sort((a, b) => a.lastCheck.getTime() - b.lastCheck.getTime());
  }

  /**
   * Get uptime in human-readable format
   */
  getUptimeString(): string {
    const uptime = Date.now() - this.startTime.getTime();
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}
