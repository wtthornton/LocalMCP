/**
 * Context7 Integration Service
 * 
 * Simple wrapper around the SimpleContext7Client for the MCP server
 * This replaces the complex Context7IntegrationService with a simple implementation
 * 
 * Benefits for vibe coders:
 * - Simple, clean integration
 * - Easy to understand and maintain
 * - Follows Context7 best practices
 */

import { Logger } from '../logger/logger.js';
import { SimpleContext7Client } from './simple-context7-client.js';
import { EnhancedContext7EnhanceTool } from '../../tools/enhanced-context7-enhance.tool.js';
import { FrameworkDetectorService } from '../framework-detector/framework-detector.service.js';
import { PromptCacheService } from '../cache/prompt-cache.service.js';
import { ProjectAnalyzerService } from '../analysis/project-analyzer.service.js';
import { CacheAnalyticsService } from '../cache/cache-analytics.service.js';
import { TodoService } from '../todo/todo.service.js';
import { TaskBreakdownService } from '../task-breakdown/task-breakdown.service.js';
import { Context7CurationService } from '../ai/context7-curation.service.js';

export interface Context7Config {
  apiKey: string;
  enabled: boolean;
}

export class Context7IntegrationService {
  private logger: Logger;
  private config: Context7Config;
  private context7Client: SimpleContext7Client;
  private enhanceTool: EnhancedContext7EnhanceTool | undefined;

  constructor(logger: Logger, config: any) {
    this.logger = logger;
    this.config = {
      apiKey: config.CONTEXT7_API_KEY || '',
      enabled: config.CONTEXT7_ENABLED !== false
    };
    
    // Initialize simple Context7 client
    this.context7Client = new SimpleContext7Client(
      { apiKey: this.config.apiKey },
      this.logger
    );
  }

  /**
   * Initialize the Context7 integration
   */
  async initialize(): Promise<void> {
    try {
      if (!this.config.enabled || !this.config.apiKey) {
        this.logger.warn('Context7 integration disabled or API key missing');
        return;
      }

      // Initialize framework detector (simplified - no dependencies)
      const frameworkDetector = new FrameworkDetectorService(this.context7Client, null as any, null);
      
      // Initialize prompt cache (simplified - no config)
      const promptCache = new PromptCacheService(this.logger, { CONTEXT7_CACHE_TTL: 3600 } as any);
      
      // Initialize project analyzer
      const projectAnalyzer = new ProjectAnalyzerService(this.logger);
      
      // Initialize cache analytics (simplified - no context7Cache)
      const cacheAnalytics = new CacheAnalyticsService(this.logger, promptCache);
      
      // Initialize todo service (simplified - just database path)
      const todoService = new TodoService('./todos.db');
      
      // Initialize task breakdown service (simplified - no context7Service)
      const taskBreakdownService = new TaskBreakdownService(this.logger, this.context7Client, { 
        openai: { apiKey: '', model: 'gpt-4' },
        context7: { maxTokensPerLibrary: 1000, maxLibraries: 3 }
      });
      
      // Initialize curation service (simplified - no openaiService)
      const curationService = new Context7CurationService(this.logger, null as any, { 
        enabled: false,
        targetTokenReduction: 0,
        minQualityScore: 0,
        maxProcessingTime: 0,
        learningEnabled: false,
        adaptiveThresholds: false
      });

      // Initialize the enhance tool with simple client
      this.enhanceTool = new EnhancedContext7EnhanceTool(
        this.logger,
        this.config,
        this.context7Client,
        frameworkDetector,
        promptCache,
        projectAnalyzer,
        undefined, // monitoring
        cacheAnalytics,
        todoService,
        undefined, // openaiService
        taskBreakdownService,
        curationService
      );

      this.logger.info('Context7 integration initialized with simple client');
    } catch (error) {
      this.logger.error('Failed to initialize Context7 integration', { error });
      throw error;
    }
  }

  /**
   * Enhance a prompt using Context7
   */
  async enhancePrompt(
    prompt: string,
    context?: {
      file?: string;
      framework?: string;
      style?: string;
      projectContext?: any;
    },
    options?: {
      useCache?: boolean;
      maxTokens?: number;
      includeMetadata?: boolean;
      includeBreakdown?: boolean;
      maxTasks?: number;
    }
  ): Promise<any> {
    if (!this.enhanceTool) {
      throw new Error('Context7 integration not initialized');
    }

    return await this.enhanceTool.enhance({
      prompt,
      context: context || {},
      options: options || {}
    });
  }

  /**
   * Get the enhance tool for schema access
   */
  getEnhanceTool(): EnhancedContext7EnhanceTool | undefined {
    return this.enhanceTool;
  }

  /**
   * Check if Context7 is available
   */
  isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey && !!this.enhanceTool;
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<any> {
    return {
      enabled: this.config.enabled,
      hasApiKey: !!this.config.apiKey,
      hasEnhanceTool: !!this.enhanceTool,
      available: this.isAvailable()
    };
  }
}
