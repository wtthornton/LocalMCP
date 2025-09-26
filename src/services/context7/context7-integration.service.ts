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

export interface Context7Config {
  apiKey: string;
  enabled: boolean;
}

export class Context7IntegrationService {
  private logger: Logger;
  private config: Context7Config;
  private originalConfig: any;
  private context7Client: SimpleContext7Client;
  private enhanceTool: EnhancedContext7EnhanceTool | undefined;

  constructor(logger: Logger, config: any, mcpServer?: any) {
    this.logger = logger;
    // Store the original config for passing to other services
    this.originalConfig = config;
    // Handle both direct config properties and ConfigService structured config
    const context7Config = config.getContext7Config ? config.getContext7Config() : config;
    
    // DEBUG: Print environment variables and config
    console.log('🔑 [Context7Integration] Environment Debug:');
    console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT SET');
    console.log('  OPENAI_PROJECT_ID:', process.env.OPENAI_PROJECT_ID || 'NOT SET');
    console.log('  CONTEXT7_API_KEY:', process.env.CONTEXT7_API_KEY ? `${process.env.CONTEXT7_API_KEY.substring(0, 20)}...` : 'NOT SET');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('  Config object keys:', Object.keys(config));
    console.log('  Context7Config:', context7Config);
    
    this.logger.info('Context7IntegrationService constructor', { 
      hasGetContext7Config: !!config.getContext7Config,
      context7Config: context7Config,
      apiKey: context7Config.apiKey || context7Config.CONTEXT7_API_KEY || '',
      enabled: context7Config.enabled !== false && context7Config.CONTEXT7_ENABLED !== false
    });
    this.config = {
      apiKey: context7Config.apiKey || context7Config.CONTEXT7_API_KEY || '',
      enabled: context7Config.enabled !== false && context7Config.CONTEXT7_ENABLED !== false
    };
    
    // Initialize simple Context7 client with MCP server reference
    this.context7Client = new SimpleContext7Client(
      { apiKey: this.config.apiKey },
      this.logger,
      mcpServer
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
      
      // Initialize prompt cache with proper config
      const promptCache = new PromptCacheService(this.logger, this.originalConfig);
      
      // Initialize project analyzer
      const projectAnalyzer = new ProjectAnalyzerService(this.logger);
      
      // Initialize cache analytics (simplified - no context7Cache)
      const cacheAnalytics = new CacheAnalyticsService(this.logger, promptCache);
      
      // Initialize todo service (simplified - just database path)
      const todoService = new TodoService('./todos.db');
      
      // Initialize task breakdown service with proper config
      const taskBreakdownService = new TaskBreakdownService(this.logger, this.context7Client, { 
        openai: { 
          apiKey: this.originalConfig.getEnv('OPENAI_API_KEY') || '',
          projectId: this.originalConfig.getEnv('OPENAI_PROJECT_ID') || '',
          model: this.originalConfig.getEnv('OPENAI_MODEL', 'gpt-4o'),
          maxTokens: parseInt(this.originalConfig.getEnv('OPENAI_MAX_TOKENS', '4000')),
          temperature: parseFloat(this.originalConfig.getEnv('OPENAI_TEMPERATURE', '0.3')),
          timeout: parseInt(this.originalConfig.getEnv('OPENAI_TIMEOUT', '60000')),
          retries: parseInt(this.originalConfig.getEnv('OPENAI_RETRIES', '3'))
        },
        context7: { maxTokensPerLibrary: 1000, maxLibraries: 3 }
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
        taskBreakdownService
        // curationService removed - not needed for simple setup
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
    const debugMode = process.env.CONTEXT7_DEBUG === 'true';
    
    // DEBUG: Print environment variables and config in enhancePrompt
    console.log('🔑 [Context7Integration.enhancePrompt] Environment Debug:');
    console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT SET');
    console.log('  OPENAI_PROJECT_ID:', process.env.OPENAI_PROJECT_ID || 'NOT SET');
    console.log('  CONTEXT7_API_KEY:', process.env.CONTEXT7_API_KEY ? `${process.env.CONTEXT7_API_KEY.substring(0, 20)}...` : 'NOT SET');
    console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
    console.log('  Config:', this.config);
    console.log('  Context7Client config:', this.context7Client ? 'EXISTS' : 'NOT EXISTS');
    
    if (debugMode) {
      this.logger.info('🔧 [Context7-Debug] Starting prompt enhancement', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        context: context || {},
        options: options || {},
        timestamp: new Date().toISOString(),
        hasEnhanceTool: !!this.enhanceTool
      });
    }

    if (!this.enhanceTool) {
      if (debugMode) {
        this.logger.error('🔧 [Context7-Debug] Enhance tool not initialized', {
          prompt: prompt.substring(0, 100),
          hasEnhanceTool: false
        });
      }
      throw new Error('Context7 integration not initialized');
    }

    try {
      const result = await this.enhanceTool.enhance({
        prompt,
        context: context || {},
        options: options || {}
      });
      
      if (debugMode) {
        const resultAny = result as any;
        this.logger.info('🔧 [Context7-Debug] Prompt enhancement completed', {
          promptLength: prompt.length,
          success: resultAny.success,
          hasEnhancedPrompt: !!(resultAny.enhanced_prompt),
          enhancedPromptLength: resultAny.enhanced_prompt ? resultAny.enhanced_prompt.length : 0,
          hasContext7Docs: !!(resultAny.context_used?.context7_docs && resultAny.context_used.context7_docs.length > 0),
          context7DocsCount: resultAny.context_used?.context7_docs ? resultAny.context_used.context7_docs.length : 0,
          hasCodeSnippets: !!(resultAny.context_used?.code_snippets && resultAny.context_used.code_snippets.length > 0),
          codeSnippetsCount: resultAny.context_used?.code_snippets ? resultAny.context_used.code_snippets.length : 0,
          hasTasks: !!(resultAny.tasks && resultAny.tasks.length > 0),
          tasksCount: resultAny.tasks ? resultAny.tasks.length : 0,
          error: resultAny.error
        });
        
        if (resultAny.context_used?.context7_docs && resultAny.context_used.context7_docs.length > 0) {
          this.logger.info('🔧 [Context7-Debug] Context7 docs found', {
            count: resultAny.context_used.context7_docs.length,
            docs: resultAny.context_used.context7_docs.map((doc: any) => ({
              libraryId: doc.libraryId,
              contentLength: doc.content ? doc.content.length : 0,
              hasContent: !!(doc.content && doc.content.length > 0),
              source: doc.source
            }))
          });
        } else {
          this.logger.warn('🔧 [Context7-Debug] No Context7 docs found', {
            prompt: prompt.substring(0, 100),
            hasContext7Docs: false,
            context7DocsCount: 0
          });
        }
      }
      
      return result;
    } catch (error) {
      if (debugMode) {
        this.logger.error('🔧 [Context7-Debug] Prompt enhancement failed', {
          prompt: prompt.substring(0, 100),
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          errorType: typeof error
        });
      }
      throw error;
    }
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
