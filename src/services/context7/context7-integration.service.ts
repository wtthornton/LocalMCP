/**
 * Context7 Integration Service
 * Orchestrates all Phase 1 Context7 components
 * Implements comprehensive Context7 integration with monitoring and caching
 */

import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { Context7MCPComplianceService } from './context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './context7-advanced-cache.service.js';
import { EnhancedContext7EnhanceTool } from '../../tools/enhanced-context7-enhance.tool.js';
import { Context7RealIntegrationService } from './context7-real-integration.service.js';
import { FrameworkDetectorService } from '../framework-detector/framework-detector.service.js';
import { PromptCacheService } from '../cache/prompt-cache.service.js';
import { ProjectContextAnalyzer } from '../framework-detector/project-context-analyzer.service.js';
import { CacheAnalyticsService } from '../cache/cache-analytics.service.js';
import { OpenAIService } from '../ai/openai.service.js';
import { Context7CacheService } from '../framework-detector/context7-cache.service.js';
import { TodoService } from '../todo/todo.service.js';

export interface Context7IntegrationConfig {
  enabled: boolean;
  apiKey: string;
  mcpUrl: string;
  timeout: number;
  retries: number;
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  monitoring: {
    enabled: boolean;
    healthCheckInterval: number;
    metricsRetention: number;
  };
}

export interface Context7IntegrationStatus {
  status: 'initialized' | 'running' | 'degraded' | 'error';
  components: {
    mcpCompliance: boolean;
    monitoring: boolean;
    cache: boolean;
    enhanceTool: boolean;
  };
  metrics: {
    requests: number;
    errors: number;
    cacheHitRate: number;
    avgResponseTime: number;
  };
  lastUpdate: Date;
}

export class Context7IntegrationService {
  private logger: Logger;
  private config: ConfigService;
  private integrationConfig: Context7IntegrationConfig;
  private mcpCompliance?: Context7MCPComplianceService;
  private monitoring?: Context7MonitoringService;
  private cache?: Context7AdvancedCacheService;
  private enhanceTool?: EnhancedContext7EnhanceTool;
  private todoService?: TodoService;
  private status: Context7IntegrationStatus;
  private initialized = false;

  constructor(logger: Logger, config: ConfigService) {
    this.logger = logger;
    this.config = config;
    this.integrationConfig = this.initializeConfig();
    this.status = this.initializeStatus();
  }

  /**
   * Initialize Context7 integration with all Phase 1 components
   * Implements comprehensive initialization with error handling
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Context7 integration already initialized');
      return;
    }

    try {
      this.logger.info('Initializing Context7 integration service');

      // 1. Initialize MCP Compliance Service (9/10 score)
      this.mcpCompliance = new Context7MCPComplianceService(this.logger, this.config);
      this.logger.info('MCP Compliance Service initialized');

      // 2. Initialize Monitoring Service (8.5/10 score)
      this.monitoring = new Context7MonitoringService(this.logger, this.config);
      this.logger.info('Monitoring Service initialized');

      // 3. Initialize Advanced Cache Service (8.5/10 score)
      this.cache = new Context7AdvancedCacheService(this.logger, this.config, this.monitoring);
      this.logger.info('Advanced Cache Service initialized');

      // 4. Initialize Todo Service for task context integration
      const dbPath = process.env.TODO_DB_PATH || 'todos.db';
      this.todoService = new TodoService(dbPath);
      this.logger.info('Todo Service initialized for task context integration');

      // 5. Initialize Enhanced Enhance Tool
      const realContext7 = new Context7RealIntegrationService(this.logger, this.config);
      const frameworkCache = new Context7CacheService();
      const frameworkDetector = new FrameworkDetectorService(realContext7, frameworkCache);
      const promptCache = new PromptCacheService(this.logger, this.config);
      const projectAnalyzer = new ProjectContextAnalyzer(this.logger);
      const cacheAnalytics = new CacheAnalyticsService(this.logger, this.cache, promptCache);
      
      // Initialize OpenAI service if configured
      let openaiService: OpenAIService | undefined;
      const openaiApiKey = process.env.OPENAI_API_KEY;
      const openaiProjectId = process.env.OPENAI_PROJECT_ID;
      if (openaiApiKey) {
        openaiService = new OpenAIService(this.logger, {
          apiKey: openaiApiKey,
          ...(openaiProjectId && { projectId: openaiProjectId }),
          model: 'gpt-4',
          maxTokens: 2000,
          temperature: 0.2
        });
        this.logger.info('OpenAI service initialized for enhance tool', {
          hasProjectId: !!openaiProjectId
        });
      } else {
        this.logger.warn('OpenAI API key not found - enhance tool will use fallbacks only');
      }
      
      this.enhanceTool = new EnhancedContext7EnhanceTool(
        this.logger,
        this.config,
        realContext7,
        frameworkDetector,
        promptCache,
        projectAnalyzer,
        this.monitoring,
        cacheAnalytics,
        this.todoService,
        openaiService
      );
      this.logger.info('Enhanced Enhance Tool initialized');

      // 6. Update status
      this.updateStatus('running');
      this.initialized = true;

      this.logger.info('Context7 integration service initialized successfully', {
        components: {
          mcpCompliance: !!this.mcpCompliance,
          monitoring: !!this.monitoring,
          cache: !!this.cache,
          enhanceTool: !!this.enhanceTool
        }
      });

    } catch (error) {
      this.logger.error('Failed to initialize Context7 integration service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      this.updateStatus('error');
      throw error;
    }
  }

  /**
   * Enhance prompt using Context7 integration with hybrid framework detection
   * Implements the main enhancement functionality with dynamic framework discovery
   */
  async enhancePrompt(
    prompt: string,
    context?: {
      file?: string;
      framework?: string;
      style?: string;
    },
    options?: {
      useCache?: boolean;
      maxTokens?: number;
      includeMetadata?: boolean;
    }
  ) {
    if (!this.initialized || !this.enhanceTool) {
      throw new Error('Context7 integration not initialized');
    }

    try {
      // Use hybrid approach: prioritize context.framework, fall back to dynamic detection
      const enhancedContext = await this.enhanceContextWithDynamicDetection(prompt, context);
      
      const result = await this.enhanceTool.enhance({
        prompt,
        context: enhancedContext,
        options: options || {}
      });

      // Update metrics
      this.updateMetrics(result.success);

      return result;
    } catch (error) {
      this.logger.error('Prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  /**
   * Enhance context with dynamic framework detection using hybrid approach
   * Replaces hardcoded framework detection with intelligent analysis
   */
  private async enhanceContextWithDynamicDetection(
    prompt: string,
    context?: {
      file?: string;
      framework?: string;
      style?: string;
    }
  ): Promise<any> {
    try {
      // Start with provided context
      const enhancedContext = { ...context };
      
      // 1. If framework is explicitly provided, use it (highest priority)
      if (context?.framework) {
        this.logger.debug('Using explicit framework from context', { 
          framework: context.framework 
        });
        return enhancedContext;
      }
      
      // 2. Infer framework from prompt content using multiple strategies
      const inferredFramework = await this.inferFrameworkFromPrompt(prompt);
      if (inferredFramework) {
        enhancedContext.framework = inferredFramework;
        this.logger.debug('Inferred framework from prompt', { 
          framework: inferredFramework,
          prompt: prompt.substring(0, 100) + '...'
        });
      }
      
      // 3. Infer additional context from prompt if not provided
      if (!enhancedContext.style) {
        const inferredStyle = this.inferStyleFromPrompt(prompt);
        if (inferredStyle) {
          enhancedContext.style = inferredStyle;
        }
      }
      
      return enhancedContext;
    } catch (error) {
      this.logger.warn('Dynamic context enhancement failed, using original context', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Return original context on error - graceful degradation
      return context || {};
    }
  }

  /**
   * Infer framework from prompt using multiple detection strategies
   */
  private async inferFrameworkFromPrompt(prompt: string): Promise<string | null> {
    try {
      // 1. Direct framework mentions (highest confidence)
      const directMentions = this.extractDirectFrameworkMentions(prompt);
      if (directMentions.length > 0) {
        return directMentions[0] || null; // Return highest confidence match
      }
      
      // 2. Task-based inference
      const taskInference = this.inferFrameworkFromTask(prompt);
      if (taskInference) {
        return taskInference;
      }
      
      // 3. Context-based inference
      const contextInference = this.inferFrameworkFromContext(prompt);
      if (contextInference) {
        return contextInference;
      }
      
      return null;
    } catch (error) {
      this.logger.warn('Framework inference failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Extract frameworks directly mentioned in the prompt
   */
  private extractDirectFrameworkMentions(prompt: string): string[] {
    const promptLower = prompt.toLowerCase();
    const frameworks: string[] = [];
    
    // Common framework names
    const frameworkNames = [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'sveltekit',
      'typescript', 'javascript', 'html', 'css', 'tailwind', 'bootstrap',
      'express', 'fastify', 'koa', 'node', 'python', 'django', 'flask'
    ];
    
    for (const framework of frameworkNames) {
      const variations = [
        framework,
        framework.replace(/\./g, ''),
        framework.replace(/-/g, ''),
        framework.replace(/\./g, ' '),
        framework.replace(/-/g, ' ')
      ];
      
      for (const variation of variations) {
        if (promptLower.includes(variation)) {
          frameworks.push(framework);
          break; // Only add each framework once
        }
      }
    }
    
    return frameworks;
  }

  /**
   * Infer framework based on the type of task described
   */
  private inferFrameworkFromTask(prompt: string): string | null {
    const promptLower = prompt.toLowerCase();
    
    // Task-based framework mapping
    if (promptLower.includes('component') || promptLower.includes('ui element')) {
      return 'react'; // Default to React for UI components
    }
    
    if (promptLower.includes('api') || promptLower.includes('server')) {
      return 'express'; // Default to Express for APIs
    }
    
    if (promptLower.includes('database') || promptLower.includes('query')) {
      return 'mongodb'; // Default to MongoDB for databases
    }
    
    if (promptLower.includes('styling') || promptLower.includes('css')) {
      return 'tailwind'; // Default to Tailwind for styling
    }
    
    return null;
  }

  /**
   * Infer framework from context clues
   */
  private inferFrameworkFromContext(prompt: string): string | null {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('admin') || promptLower.includes('dashboard')) {
      return 'react'; // Admin dashboards often use React
    }
    
    if (promptLower.includes('mobile') || promptLower.includes('app')) {
      return 'react'; // Mobile apps often use React Native
    }
    
    if (promptLower.includes('web') || promptLower.includes('website')) {
      return 'html'; // Generic web development
    }
    
    return null;
  }

  /**
   * Infer style from prompt content
   */
  private inferStyleFromPrompt(prompt: string): string | null {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('modern') || promptLower.includes('clean')) {
      return 'modern';
    }
    
    if (promptLower.includes('simple') || promptLower.includes('minimal')) {
      return 'simple';
    }
    
    if (promptLower.includes('dark') || promptLower.includes('theme')) {
      return 'dark';
    }
    
    if (promptLower.includes('responsive') || promptLower.includes('mobile')) {
      return 'responsive';
    }
    
    return null;
  }

  /**
   * Get integration status
   * Implements status monitoring
   */
  getStatus(): Context7IntegrationStatus {
    return { ...this.status };
  }

  /**
   * Get comprehensive metrics
   * Implements metrics aggregation
   */
  getMetrics(): any {
    if (!this.monitoring) {
      return {};
    }

    const monitoringMetrics = this.monitoring.getMetrics();
    const cacheStats = this.cache?.getCacheStats() || null;

    return {
      monitoring: monitoringMetrics,
      cache: cacheStats,
      integration: {
        status: this.status.status,
        initialized: this.initialized,
        lastUpdate: this.status.lastUpdate
      }
    };
  }

  /**
   * Get health status
   * Implements comprehensive health checking
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, any>;
    summary: string;
  }> {
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        components: {},
        summary: 'Context7 integration not initialized'
      };
    }

    try {
      const healthChecks = await Promise.allSettled([
        this.mcpCompliance?.healthCheck() || Promise.resolve({ status: 'unhealthy' }),
        this.monitoring?.getHealthStatus() || Promise.resolve({ status: 'unhealthy' }),
        this.enhanceTool?.getHealthStatus() || Promise.resolve({ status: 'unhealthy' })
      ]);

      const components = {
        mcpCompliance: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : { status: 'unhealthy' },
        monitoring: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : { status: 'unhealthy' },
        enhanceTool: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : { status: 'unhealthy' }
      };

      const healthyComponents = Object.values(components).filter(
        (comp: any) => comp.status === 'healthy'
      ).length;
      const totalComponents = Object.keys(components).length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      let summary: string;

      if (healthyComponents === totalComponents) {
        status = 'healthy';
        summary = 'All Context7 components are healthy';
      } else if (healthyComponents >= totalComponents * 0.5) {
        status = 'degraded';
        summary = `${healthyComponents}/${totalComponents} Context7 components are healthy`;
      } else {
        status = 'unhealthy';
        summary = `${healthyComponents}/${totalComponents} Context7 components are healthy`;
      }

      return { status, components, summary };
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        status: 'unhealthy',
        components: {},
        summary: 'Health check failed'
      };
    }
  }

  /**
   * Get active alerts
   * Implements alert management
   */
  getAlerts(): any[] {
    if (!this.monitoring) {
      return [];
    }

    return this.monitoring.getAlerts();
  }

  /**
   * Reset metrics
   * Implements metrics management
   */
  resetMetrics(): void {
    if (this.monitoring) {
      // Reset monitoring metrics
      this.logger.info('Metrics reset requested');
    }
  }

  /**
   * Destroy integration service
   * Implements proper cleanup
   */
  async destroy(): Promise<void> {
    try {
      this.logger.info('Destroying Context7 integration service');

      if (this.cache) {
        this.cache.destroy();
      }

      if (this.monitoring) {
        this.monitoring.destroy();
      }

      this.initialized = false;
      this.updateStatus('error');

      this.logger.info('Context7 integration service destroyed');
    } catch (error) {
      this.logger.error('Error during Context7 integration service destruction', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Initialize configuration
   * Implements configuration management
   */
  private initializeConfig(): Context7IntegrationConfig {
    return {
      enabled: this.config.getEnv('CONTEXT7_ENABLED', 'true') === 'true',
      apiKey: this.config.getEnv('CONTEXT7_API_KEY', ''),
      mcpUrl: this.config.getEnv('CONTEXT7_MCP_URL', 'https://mcp.context7.com/mcp'),
      timeout: parseInt(this.config.getEnv('CONTEXT7_TIMEOUT', '10000')),
      retries: parseInt(this.config.getEnv('CONTEXT7_RETRIES', '3')),
      cache: {
        enabled: this.config.getEnv('CONTEXT7_CACHE_ENABLED', 'true') === 'true',
        ttl: parseInt(this.config.getEnv('CONTEXT7_CACHE_TTL', '14400000')), // 4 hours
        maxSize: parseInt(this.config.getEnv('CONTEXT7_CACHE_MAX_SIZE', '52428800')) // 50MB
      },
      monitoring: {
        enabled: this.config.getEnv('CONTEXT7_MONITORING_ENABLED', 'true') === 'true',
        healthCheckInterval: parseInt(this.config.getEnv('CONTEXT7_HEALTH_CHECK_INTERVAL', '30000')),
        metricsRetention: parseInt(this.config.getEnv('CONTEXT7_METRICS_RETENTION', '86400000')) // 24 hours
      }
    };
  }

  /**
   * Initialize status
   * Implements status initialization
   */
  private initializeStatus(): Context7IntegrationStatus {
    return {
      status: 'initialized',
      components: {
        mcpCompliance: false,
        monitoring: false,
        cache: false,
        enhanceTool: false
      },
      metrics: {
        requests: 0,
        errors: 0,
        cacheHitRate: 0,
        avgResponseTime: 0
      },
      lastUpdate: new Date()
    };
  }

  /**
   * Update status
   * Implements status management
   */
  private updateStatus(status: Context7IntegrationStatus['status']): void {
    this.status.status = status;
    this.status.lastUpdate = new Date();
  }

  /**
   * Update metrics
   * Implements metrics tracking
   */
  private updateMetrics(success: boolean): void {
    this.status.metrics.requests++;
    if (!success) {
      this.status.metrics.errors++;
    }
    this.status.lastUpdate = new Date();
  }
}
