/**
 * Enhanced Context7 Enhance Tool - Refactored
 * 
 * Main orchestrator for prompt enhancement with Context7 integration
 * Refactored from 3,637 lines to ~500 lines using extracted services
 * 
 * Benefits for vibe coders:
 * - Clean, maintainable code structure
 * - Single responsibility principle
 * - Easy to understand and modify
 * - Better testability and debugging
 */

import { Logger } from '../services/logger/logger.js';
// import { ConfigService } from '../services/config/config.service.js';
import { Context7RealIntegrationService } from '../services/context7/context7-real-integration.service.js';
import { FrameworkDetectorService } from '../services/framework-detector/framework-detector.service.js';
import { PromptCacheService } from '../services/cache/prompt-cache.service.js';
import { ProjectAnalyzerService } from '../services/analysis/project-analyzer.service.js';
// import { MonitoringService } from '../services/monitoring/monitoring.service.js';
import { CacheAnalyticsService } from '../services/cache/cache-analytics.service.js';
import { TodoService } from '../services/todo/todo.service.js';
// import { OpenAIService } from '../services/openai/openai.service.js';
import { TaskBreakdownService } from '../services/task-breakdown/task-breakdown.service.js';

// Import extracted services
import { PromptAnalyzerService } from './enhance/prompt-analyzer.service.js';
import { Context7DocumentationService } from './enhance/context7-documentation.service.js';
import { FrameworkIntegrationService } from './enhance/framework-integration.service.js';
import { ResponseBuilderService } from './enhance/response-builder.service.js';
import { TaskContextService } from './enhance/task-context.service.js';
import { HealthCheckerService } from './enhance/health-checker.service.js';

export interface EnhancedContext7Request {
  prompt: string;
  context?: {
    file?: string;
    framework?: string;
    style?: string;
    projectContext?: any;
  };
  options?: {
    useCache?: boolean;
    maxTokens?: number;
    includeMetadata?: boolean;
    includeBreakdown?: boolean;
    maxTasks?: number;
  };
}

export interface EnhancedContext7Response {
  enhanced_prompt: string;
  context_used: {
    repo_facts: string[];
    code_snippets: string[];
    context7_docs: string[];
  };
  success: boolean;
  error?: string;
  breakdown?: {
    tasks: any[];
    mainTasks: number;
    subtasks: number;
    dependencies: number;
    estimatedTotalTime: string;
  };
  todos?: any[];
}

export class EnhancedContext7EnhanceTool {
  private logger: Logger;
  private config: any;
  private realContext7: Context7RealIntegrationService;
  private frameworkDetector: FrameworkDetectorService;
  private promptCache: PromptCacheService;
  private projectAnalyzer: ProjectAnalyzerService;
  private monitoring: any;
  private cacheAnalytics: CacheAnalyticsService;
  private todoService: TodoService;
  private openaiService?: any;
  private taskBreakdownService: TaskBreakdownService | undefined;

  // Extracted services
  private promptAnalyzer: PromptAnalyzerService;
  private context7Documentation: Context7DocumentationService;
  private frameworkIntegration: FrameworkIntegrationService;
  private responseBuilder: ResponseBuilderService;
  private taskContext: TaskContextService;
  private healthChecker: HealthCheckerService;

  constructor(
    logger: Logger,
    config: any,
    realContext7: Context7RealIntegrationService,
    frameworkDetector: FrameworkDetectorService,
    promptCache: PromptCacheService,
    projectAnalyzer: ProjectAnalyzerService,
    monitoring: any,
    cacheAnalytics: CacheAnalyticsService,
    todoService: TodoService,
    openaiService?: any,
    taskBreakdownService?: TaskBreakdownService
  ) {
    this.logger = logger;
    this.config = config;
    this.realContext7 = realContext7;
    this.frameworkDetector = frameworkDetector;
    this.promptCache = promptCache;
    this.projectAnalyzer = projectAnalyzer;
    this.monitoring = monitoring;
    this.cacheAnalytics = cacheAnalytics;
    this.todoService = todoService;
    this.openaiService = openaiService;
    this.taskBreakdownService = taskBreakdownService;

    // Initialize extracted services
    this.promptAnalyzer = new PromptAnalyzerService(logger);
    this.context7Documentation = new Context7DocumentationService(logger, realContext7);
    this.frameworkIntegration = new FrameworkIntegrationService(logger, frameworkDetector);
    this.responseBuilder = new ResponseBuilderService(logger);
    this.taskContext = new TaskContextService(logger, todoService, taskBreakdownService);
    this.healthChecker = new HealthCheckerService(
      logger,
      monitoring,
      realContext7,
      cacheAnalytics,
      taskBreakdownService,
      todoService
    );

    this.logger.info('Enhanced Context7 Enhance Tool initialized with extracted services');
  }

  /**
   * Main enhance method - orchestrates all services
   * Implements comprehensive prompt enhancement with intelligent breakdown
   */
  async enhance(request: EnhancedContext7Request): Promise<EnhancedContext7Response> {
    try {
      console.log('🚀🚀🚀 ENHANCE TOOL CALLED 🚀🚀🚀');
      console.log('🚀 [EnhanceTool] Starting enhance method with request:', {
        prompt: request.prompt.substring(0, 100) + '...',
        context: request.context,
        options: request.options
      });
      this.logger.info('Starting enhanced Context7 prompt enhancement', {
        prompt: request.prompt.substring(0, 100) + '...',
        context: request.context,
        options: request.options
      });

      // 1. Analyze prompt complexity
      const promptComplexity = this.promptAnalyzer.analyzePromptComplexity(request.prompt);
      const optimizedOptions = this.promptAnalyzer.getOptimizedOptions(request.options || {}, promptComplexity);

      // 2. Check cache first
      const cachedResult = await this.checkCache(request, promptComplexity);
      if (cachedResult) {
        return cachedResult;
      }

      // 3. Detect frameworks
      const frameworkDetection = await this.frameworkIntegration.detectFrameworks(
        request.prompt,
        request.context?.projectContext,
        request.context?.framework
      );

      // 4. Detect quality requirements
      const qualityRequirements = await this.frameworkIntegration.detectQualityRequirements(
        request.prompt,
        frameworkDetection.detectedFrameworks[0]
      );

      // 5. Get Context7 documentation
      const context7Result = await this.getContext7Documentation(
        request.prompt,
        frameworkDetection,
        promptComplexity,
        optimizedOptions.maxTokens
      );

      // 6. Gather project context
      console.log('🔍 [EnhanceTool] About to call gatherProjectContext...');
      const projectContext = await this.gatherProjectContext(request);
      console.log('🔍 [EnhanceTool] gatherProjectContext returned:', {
        repoFactsCount: projectContext.repoFacts.length,
        codeSnippetsCount: projectContext.codeSnippets.length
      });

      // 7. Check for task breakdown
      const breakdownResult = await this.handleTaskBreakdown(request, projectContext);

      // 8. Build enhanced prompt
      const enhancedPrompt = this.responseBuilder.buildEnhancedPrompt(
        request.prompt,
        {
          repoFacts: projectContext.repoFacts,
          codeSnippets: projectContext.codeSnippets,
          context7Docs: context7Result.docs,
          qualityRequirements,
          frameworkDetection,
          frameworkDocs: [],
          projectDocs: []
        },
        promptComplexity
      );

      // 9. Cache the result
      await this.cacheResult(request, enhancedPrompt, projectContext, frameworkDetection);

      // 10. Build response
      const response: EnhancedContext7Response = {
        enhanced_prompt: enhancedPrompt,
        context_used: {
          repo_facts: projectContext.repoFacts,
          code_snippets: projectContext.codeSnippets,
          context7_docs: context7Result.docs ? [context7Result.docs] : []
        },
        success: true,
        breakdown: breakdownResult.breakdown,
        todos: breakdownResult.todos || []
      };

      this.logger.info('Enhanced Context7 prompt enhancement completed successfully', {
        promptLength: request.prompt.length,
        enhancedLength: enhancedPrompt.length,
        contextUsed: response.context_used
      });

      return response;

    } catch (error) {
      this.logger.error('Enhanced Context7 prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt.substring(0, 100) + '...'
      });

      return {
        enhanced_prompt: request.prompt,
        context_used: {
          repo_facts: [],
          code_snippets: [],
          context7_docs: []
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check cache for existing enhanced prompt
   */
  private async checkCache(
    request: EnhancedContext7Request,
    promptComplexity: any
  ): Promise<EnhancedContext7Response | null> {
    try {
      if (!request.options?.useCache) {
        return null;
      }

      const frameworkDetection = await this.frameworkIntegration.detectFrameworks(
        request.prompt,
        request.context?.projectContext
      );

      const cachedPrompt = await this.promptCache.getCachedPrompt(
        request.prompt,
        request.context,
        frameworkDetection
      );

      if (cachedPrompt) {
        this.logger.debug('Using cached enhanced prompt', {
          cacheKey: cachedPrompt.key,
          hits: cachedPrompt.hits,
          qualityScore: cachedPrompt.qualityScore
        });

        return {
          enhanced_prompt: cachedPrompt.enhancedPrompt,
          context_used: {
            repo_facts: cachedPrompt.context.repoFacts || [],
            code_snippets: cachedPrompt.context.codeSnippets || [],
            context7_docs: cachedPrompt.context.context7Docs ? [cachedPrompt.context.context7Docs] : []
          },
          success: true
        };
      }

      return null;

    } catch (error) {
      this.logger.warn('Cache check failed, continuing without cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get Context7 documentation using extracted service
   */
  private async getContext7Documentation(
    prompt: string,
    frameworkDetection: any,
    promptComplexity: any,
    maxTokens: number
  ): Promise<{ docs: string; libraries: string[] }> {
    try {
      // Select optimal libraries
      const optimalLibraries = await this.context7Documentation.selectOptimalContext7Libraries(
        prompt,
        frameworkDetection.detectedFrameworks,
        promptComplexity
      );

      if (optimalLibraries.length === 0) {
        return { docs: '', libraries: [] };
      }

      // Get documentation
      const result = await this.context7Documentation.getContext7DocumentationForFrameworks(
        optimalLibraries,
        prompt,
        maxTokens
      );

      // Process documentation for better relevance
      const processedDocs = this.context7Documentation.processContext7Documentation(
        result.docs,
        optimalLibraries[0] || '',
        prompt,
        this.promptAnalyzer.extractKeywords(prompt)
      );

      return {
        docs: processedDocs,
        libraries: result.libraries
      };

    } catch (error) {
      this.logger.warn('Context7 documentation retrieval failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { docs: '', libraries: [] };
    }
  }

  /**
   * Gather project context using project analyzer
   */
  private async gatherProjectContext(request: EnhancedContext7Request): Promise<{
    repoFacts: string[];
    codeSnippets: string[];
  }> {
    try {
      console.log('🔍 [EnhanceTool] Starting project context gathering...');
      this.logger.info('Starting project context gathering');

      // Get repo facts from the project analyzer
      console.log('🔍 [EnhanceTool] Calling projectAnalyzer.analyzeProject()...');
      const repoFacts = await this.projectAnalyzer.analyzeProject();
      console.log('🔍 [EnhanceTool] Project analyzer returned', repoFacts.length, 'facts');
      const repoFactsStrings = repoFacts.map(fact => fact.fact);

      // Get code snippets from the project analyzer
      console.log('🔍 [EnhanceTool] Calling projectAnalyzer.findRelevantCodeSnippets()...');
      const codeSnippets = await this.projectAnalyzer.findRelevantCodeSnippets(
        request.prompt,
        request.context?.file
      );
      console.log('🔍 [EnhanceTool] Project analyzer returned', codeSnippets.length, 'snippets');
      const codeSnippetsStrings = codeSnippets.map(snippet => 
        `File: ${snippet.file}\nDescription: ${snippet.description}\nCode:\n${snippet.content}`
      );

      console.log('✅ [EnhanceTool] Project context gathered successfully', {
        repoFactsCount: repoFactsStrings.length,
        codeSnippetsCount: codeSnippetsStrings.length
      });

      this.logger.info('Project context gathered successfully', {
        repoFactsCount: repoFactsStrings.length,
        codeSnippetsCount: codeSnippetsStrings.length
      });

      return {
        repoFacts: repoFactsStrings,
        codeSnippets: codeSnippetsStrings
      };

    } catch (error) {
      console.error('❌ [EnhanceTool] Project context gathering failed', error);
      console.error('❌ [EnhanceTool] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown'
      });
      this.logger.warn('Project context gathering failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { repoFacts: [], codeSnippets: [] };
    }
  }

  /**
   * Handle task breakdown if needed
   */
  private async handleTaskBreakdown(
    request: EnhancedContext7Request,
    projectContext: any
  ): Promise<{ breakdown?: any; todos?: any[] }> {
    try {
      if (this.taskContext.shouldBreakdown(request.prompt, request.options)) {
        const projectId = request.context?.projectContext?.projectId || 'default';
        return await this.taskContext.performTaskBreakdown(
          request.prompt,
          projectId,
          request.options
        );
      }
      return {};

    } catch (error) {
      this.logger.warn('Task breakdown failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  /**
   * Cache the enhanced result
   */
  private async cacheResult(
    request: EnhancedContext7Request,
    enhancedPrompt: string,
    projectContext: any,
    frameworkDetection: any
  ): Promise<void> {
    try {
      if (!request.options?.useCache) {
        return;
      }

      await this.promptCache.cachePrompt(
        request.prompt,
        enhancedPrompt,
        {
          repoFacts: projectContext.repoFacts,
          codeSnippets: projectContext.codeSnippets,
          context7Docs: '',
          frameworkDetection
        },
        frameworkDetection,
        0.8, // qualityScore
        Date.now() - Date.now(), // responseTime
        'medium' // complexity
      );

    } catch (error) {
      this.logger.warn('Failed to cache result', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get tool health status using extracted service
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: any;
    metrics: any;
  }> {
    return await this.healthChecker.getHealthStatus();
  }

  /**
   * Get the MCP tool schema for the enhance tool
   */
  getToolSchema() {
    return {
      name: 'promptmcp.enhance',
      description: 'Enhance prompts with project context, best practices, and optionally break down complex requests into structured tasks',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt to enhance with project context and best practices'
          },
          context: {
            type: 'object',
            description: 'Optional context for enhancement',
            properties: {
              file: {
                type: 'string',
                description: 'File path for file-specific context'
              },
              framework: {
                type: 'string',
                description: 'Specific framework to focus on (e.g., react, vue, angular)'
              },
              style: {
                type: 'string',
                description: 'Style preference (e.g., modern, minimal, professional)'
              },
              projectContext: {
                type: 'object',
                description: 'Project-specific context including projectId'
              }
            }
          },
          options: {
            type: 'object',
            description: 'Enhancement options',
            properties: {
              useCache: {
                type: 'boolean',
                description: 'Whether to use cached results',
                default: true
              },
              maxTokens: {
                type: 'number',
                description: 'Maximum tokens for Context7 documentation',
                default: 2000
              },
              includeMetadata: {
                type: 'boolean',
                description: 'Whether to include metadata in response',
                default: false
              },
              includeBreakdown: {
                type: 'boolean',
                description: 'Whether to automatically break down complex prompts into tasks',
                default: false
              },
              maxTasks: {
                type: 'number',
                description: 'Maximum number of tasks to create from breakdown',
                default: 10
              }
            }
          }
        },
        required: ['prompt']
      }
    };
  }
}
