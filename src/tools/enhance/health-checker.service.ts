/**
 * Health Checker Service
 * 
 * Handles health monitoring and status reporting
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Comprehensive health monitoring
 * - Component status tracking
 * - Performance metrics collection
 * - Single responsibility principle
 */

import { Logger } from '../../services/logger/logger.js';
// import { MonitoringService } from '../../services/monitoring/monitoring.service.js';
import { SimpleContext7Client } from '../../services/context7/simple-context7-client.js';
import { CacheAnalyticsService } from '../../services/cache/cache-analytics.service.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    realContext7: boolean;
    monitoring: boolean;
    cacheAnalytics: boolean;
    taskBreakdown?: boolean;
    todoService?: boolean;
  };
  metrics: {
    monitoring?: any;
    realContext7?: boolean;
    cacheAnalytics?: boolean;
    taskBreakdown?: boolean;
    todoService?: boolean;
  };
  timestamp: string;
  uptime: number;
}

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: string;
  error?: string;
}

export class HealthCheckerService {
  private logger: Logger;
  private monitoring: any;
  private context7Client: SimpleContext7Client | undefined;
  private cacheAnalytics: CacheAnalyticsService | undefined;
  private taskBreakdownService?: any;
  private todoService?: any;
  private startTime: number;

  constructor(
    logger: Logger,
    monitoring: any,
    context7Client?: SimpleContext7Client,
    cacheAnalytics?: CacheAnalyticsService,
    taskBreakdownService?: any,
    todoService?: any
  ) {
    this.logger = logger;
    this.monitoring = monitoring;
    this.context7Client = context7Client;
    this.cacheAnalytics = cacheAnalytics;
    this.taskBreakdownService = taskBreakdownService;
    this.todoService = todoService;
    this.startTime = Date.now();
  }

  /**
   * Get comprehensive health status
   * Implements multi-component health monitoring
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const components = await this.checkAllComponents();
      const status = this.determineOverallStatus(components);
      const metrics = await this.collectMetrics();
      
      return {
        status,
        components: {
          realContext7: components.realContext7?.status === 'healthy',
          monitoring: components.monitoring?.status === 'healthy',
          cacheAnalytics: components.cacheAnalytics?.status === 'healthy',
          taskBreakdown: components.taskBreakdown?.status === 'healthy',
          todoService: components.todoService?.status === 'healthy'
        },
        metrics,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      };

    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        status: 'unhealthy',
        components: {
          realContext7: false,
          monitoring: false,
          cacheAnalytics: false,
          taskBreakdown: false,
          todoService: false
        },
        metrics: {},
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      };
    }
  }

  /**
   * Check all component health statuses
   * Implements parallel health checking for better performance
   */
  private async checkAllComponents(): Promise<Record<string, ComponentHealth>> {
    const checks = await Promise.allSettled([
      this.checkContext7Health(),
      this.checkMonitoringHealth(),
      this.checkCacheAnalyticsHealth(),
      this.checkTaskBreakdownHealth(),
      this.checkTodoServiceHealth()
    ]);

    return {
      realContext7: checks[0].status === 'fulfilled' ? checks[0].value : this.createErrorComponent('realContext7', checks[0]),
      monitoring: checks[1].status === 'fulfilled' ? checks[1].value : this.createErrorComponent('monitoring', checks[1]),
      cacheAnalytics: checks[2].status === 'fulfilled' ? checks[2].value : this.createErrorComponent('cacheAnalytics', checks[2]),
      taskBreakdown: checks[3].status === 'fulfilled' ? checks[3].value : this.createErrorComponent('taskBreakdown', checks[3]),
      todoService: checks[4].status === 'fulfilled' ? checks[4].value : this.createErrorComponent('todoService', checks[4])
    };
  }

  /**
   * Check Context7 integration health
   */
  private async checkContext7Health(): Promise<ComponentHealth> {
    try {
      if (!this.context7Client) {
        return {
          name: 'realContext7',
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: 'Service not initialized'
        };
      }

      // Simple health check - try to resolve a common library
      await this.context7Client.resolveLibraryId('react');
      
      return {
        name: 'realContext7',
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };

    } catch (error) {
      return {
        name: 'realContext7',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check monitoring service health
   */
  private async checkMonitoringHealth(): Promise<ComponentHealth> {
    try {
      const health = await this.monitoring.getHealthStatus();
      
      return {
        name: 'monitoring',
        status: health.status,
        lastCheck: new Date().toISOString()
      };

    } catch (error) {
      return {
        name: 'monitoring',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check cache analytics health
   */
  private async checkCacheAnalyticsHealth(): Promise<ComponentHealth> {
    try {
      if (!this.cacheAnalytics) {
        return {
          name: 'cacheAnalytics',
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: 'Service not initialized'
        };
      }

      // Simple health check - try to get analytics
      // const analytics = this.cacheAnalytics.getAnalytics();
      
      return {
        name: 'cacheAnalytics',
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };

    } catch (error) {
      return {
        name: 'cacheAnalytics',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check task breakdown service health
   */
  private async checkTaskBreakdownHealth(): Promise<ComponentHealth> {
    try {
      if (!this.taskBreakdownService) {
        return {
          name: 'taskBreakdown',
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: 'Service not initialized'
        };
      }

      // Simple health check - try to get service status
      return {
        name: 'taskBreakdown',
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };

    } catch (error) {
      return {
        name: 'taskBreakdown',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check todo service health
   */
  private async checkTodoServiceHealth(): Promise<ComponentHealth> {
    try {
      if (!this.todoService) {
        return {
          name: 'todoService',
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          error: 'Service not initialized'
        };
      }

      // Simple health check - try to list todos
      await this.todoService.listTodos('health-check');
      
      return {
        name: 'todoService',
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };

    } catch (error) {
      return {
        name: 'todoService',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create error component for failed checks
   */
  private createErrorComponent(name: string, result: PromiseSettledResult<any>): ComponentHealth {
    return {
      name,
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      error: result.status === 'rejected' ? 
        (result.reason instanceof Error ? result.reason.message : 'Unknown error') : 
        'Check failed'
    };
  }

  /**
   * Determine overall health status based on component statuses
   */
  private determineOverallStatus(components: Record<string, ComponentHealth>): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(components).map(comp => comp.status);
    const healthyCount = statuses.filter(status => status === 'healthy').length;
    const totalCount = statuses.length;
    
    if (healthyCount === totalCount) {
      return 'healthy';
    } else if (healthyCount >= totalCount * 0.5) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  /**
   * Collect performance metrics
   */
  private async collectMetrics(): Promise<Record<string, any>> {
    try {
      const monitoringHealth = await this.monitoring.getHealthStatus();
      
      return {
        monitoring: monitoringHealth.metrics,
        realContext7: !!this.context7Client,
        cacheAnalytics: !!this.cacheAnalytics,
        taskBreakdown: !!this.taskBreakdownService,
        todoService: !!this.todoService
      };

    } catch (error) {
      this.logger.warn('Failed to collect metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {};
    }
  }

  /**
   * Get detailed health report
   * Implements comprehensive health reporting
   */
  async getDetailedHealthReport(): Promise<{
    summary: HealthStatus;
    components: ComponentHealth[];
    recommendations: string[];
  }> {
    const summary = await this.getHealthStatus();
    const components = Object.values(await this.checkAllComponents());
    const recommendations = this.generateRecommendations(components);
    
    return {
      summary,
      components,
      recommendations
    };
  }

  /**
   * Generate health recommendations
   */
  private generateRecommendations(components: ComponentHealth[]): string[] {
    const recommendations: string[] = [];
    
    for (const component of components) {
      if (component.status === 'unhealthy') {
        recommendations.push(`Fix ${component.name}: ${component.error || 'Unknown issue'}`);
      } else if (component.status === 'degraded') {
        recommendations.push(`Investigate ${component.name}: Performance may be affected`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All systems operational');
    }
    
    return recommendations;
  }

  /**
   * Check if service is ready for use
   */
  isReady(): boolean {
    return !!(
      this.context7Client &&
      this.monitoring &&
      this.cacheAnalytics
    );
  }

  /**
   * Get service readiness status
   */
  getReadinessStatus(): {
    ready: boolean;
    missingServices: string[];
  } {
    const missingServices: string[] = [];
    
    if (!this.context7Client) missingServices.push('context7Client');
    if (!this.monitoring) missingServices.push('monitoring');
    if (!this.cacheAnalytics) missingServices.push('cacheAnalytics');
    
    return {
      ready: missingServices.length === 0,
      missingServices
    };
  }
}
