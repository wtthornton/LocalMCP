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
import { SimpleContext7Client } from '../services/context7/simple-context7-client.js';
import { FrameworkDetectorService } from '../services/framework-detector/framework-detector.service.js';
import { PromptCacheService } from '../services/cache/prompt-cache.service.js';
import { ProjectAnalyzerService } from '../services/analysis/project-analyzer.service.js';
// import { MonitoringService } from '../services/monitoring/monitoring.service.js';
import { CacheAnalyticsService } from '../services/cache/cache-analytics.service.js';
import { TodoService } from '../services/todo/todo.service.js';
// import { OpenAIService } from '../services/openai/openai.service.js';
import { TaskBreakdownService } from '../services/task-breakdown/task-breakdown.service.js';
import type { TodoItem } from '../types/todo.js';

// Import extracted services
import { PromptAnalyzerService } from './enhance/prompt-analyzer.service.js';
import { Context7DocumentationService } from './enhance/context7-documentation.service.js';
import { FrameworkIntegrationService } from './enhance/framework-integration.service.js';
import { ResponseBuilderService } from './enhance/response-builder.service.js';
import { TaskContextService } from './enhance/task-context.service.js';
import { HealthCheckerService } from './enhance/health-checker.service.js';
import { Context7CurationService } from '../services/ai/context7-curation.service.js';
import { PromptEnhancementAgentService } from '../services/ai/prompt-enhancement-agent.service.js';
import { EnhancementConfigService } from '../services/ai/enhancement-config.service.js';
import { Context7OpenAIInterceptor } from '../services/ai/context7-openai-interceptor.service.js';
import { Context7EnhancementPrompts } from '../services/ai/context7-enhancement-prompts.js';
import { OpenAIService } from '../services/ai/openai.service.js';
import { TemperatureConfigService } from '../services/ai/temperature-config.service.js';
import { PromptTemplateService } from '../services/ai/prompt-templates.service.js';
import { FewShotExamplesService } from '../services/ai/few-shot-examples.service.js';
import { ModelSelectionService } from '../services/ai/model-selection.service.js';
import { CostMonitoringService } from '../services/ai/cost-monitoring.service.js';

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
    enhancementStrategy?: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware';
    qualityFocus?: string[];
    projectType?: 'frontend' | 'backend' | 'fullstack' | 'library' | 'mobile' | 'desktop' | 'cli' | 'other';
    useContext7Enhancement?: boolean;
    context7EnhancementStrategy?: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware';
    context7QualityFocus?: string[];
  };
}

export interface EnhancedContext7Response {
  enhanced_prompt: string;
  context_used: {
    framework?: string;
    style?: string;
    file?: string;
    repo_facts: any[];
    code_snippets: any[];
    context7_docs: any[];
  };
  breakdown?: {
    tasks: any[];
    mainTasks: number;
    subtasks: number;
    dependencies: number;
    estimatedTotalTime: string;
  };
  todos?: TodoItem[];
  metrics: {
    response_time_ms: number;
    quality_score: number;
    confidence_score: number;
    token_ratio: number;
    frameworks_detected: string[];
    ai_enhancement_enabled: boolean;
    cost: number;
  };
}

export class EnhancedContext7EnhanceTool {
  private logger: Logger;
  private config: any;
  private context7Client: SimpleContext7Client;
  private frameworkDetector: FrameworkDetectorService;
  private promptCache: PromptCacheService;
  private projectAnalyzer: ProjectAnalyzerService;
  private monitoring: any;
  private cacheAnalytics: CacheAnalyticsService;
  private todoService: TodoService;
  private openaiService?: any;
  private taskBreakdownService: TaskBreakdownService | undefined;
  private curationService?: Context7CurationService | undefined;

  // Extracted services
  private promptAnalyzer: PromptAnalyzerService;
  private context7Documentation: Context7DocumentationService;
  private frameworkIntegration: FrameworkIntegrationService;
  private responseBuilder: ResponseBuilderService;
  private taskContext: TaskContextService;
  private healthChecker: HealthCheckerService;
  private enhancementAgent?: PromptEnhancementAgentService;
  private enhancementConfig?: EnhancementConfigService;
  private context7OpenAIInterceptor?: Context7OpenAIInterceptor;
  private context7EnhancementPrompts?: Context7EnhancementPrompts;
  
  // New temperature optimization and prompt enhancement services
  private temperatureConfig?: TemperatureConfigService;
  private promptTemplateService?: PromptTemplateService;
  private fewShotExamplesService?: FewShotExamplesService;
  private modelSelectionService?: ModelSelectionService;
  private costMonitoringService?: CostMonitoringService;

  constructor(
    logger: Logger,
    config: any,
    context7Client: SimpleContext7Client,
    frameworkDetector: FrameworkDetectorService,
    promptCache: PromptCacheService,
    projectAnalyzer: ProjectAnalyzerService,
    monitoring: any,
    cacheAnalytics: CacheAnalyticsService,
    todoService: TodoService,
    openaiService?: any,
    taskBreakdownService?: TaskBreakdownService,
    curationService?: Context7CurationService
  ) {
    this.logger = logger;
    this.config = config;
    this.context7Client = context7Client;
    this.frameworkDetector = frameworkDetector;
    this.promptCache = promptCache;
    this.projectAnalyzer = projectAnalyzer;
    this.monitoring = monitoring;
    this.cacheAnalytics = cacheAnalytics;
    this.todoService = todoService;
    this.openaiService = openaiService;
    this.taskBreakdownService = taskBreakdownService;
    this.curationService = curationService;

    // Initialize extracted services
    this.promptAnalyzer = new PromptAnalyzerService(logger, openaiService);
    this.context7Documentation = new Context7DocumentationService(logger, context7Client, curationService);
    this.frameworkIntegration = new FrameworkIntegrationService(logger, frameworkDetector);
    this.responseBuilder = new ResponseBuilderService(logger, openaiService);
    this.taskContext = new TaskContextService(logger, todoService, taskBreakdownService);
    this.healthChecker = new HealthCheckerService(
      logger,
      monitoring,
      context7Client,
      cacheAnalytics,
      taskBreakdownService,
      todoService
    );

    // Initialize AI enhancement services if OpenAI is available
    if (openaiService) {
      this.enhancementConfig = new EnhancementConfigService(logger);
      this.enhancementAgent = new PromptEnhancementAgentService(
        logger,
        openaiService,
        this.responseBuilder,
        this.enhancementConfig.getConfig()
      );

      // Initialize Context7 OpenAI interceptor
      this.context7EnhancementPrompts = new Context7EnhancementPrompts();
      this.context7OpenAIInterceptor = new Context7OpenAIInterceptor(
        logger,
        openaiService,
        this.context7EnhancementPrompts
      );

      // Update Context7DocumentationService with interceptor
      this.context7Documentation = new Context7DocumentationService(
        logger, 
        context7Client, 
        curationService,
        this.context7OpenAIInterceptor
      );

      // Initialize new temperature optimization and prompt enhancement services
      this.temperatureConfig = new TemperatureConfigService();
      this.promptTemplateService = new PromptTemplateService(logger);
      this.fewShotExamplesService = new FewShotExamplesService();
      this.modelSelectionService = new ModelSelectionService();
      this.costMonitoringService = new CostMonitoringService(undefined, logger);

      // Update existing services with new dependencies
      this.promptAnalyzer = new PromptAnalyzerService(logger, openaiService);
      this.responseBuilder = new ResponseBuilderService(logger, openaiService);
    }

    this.logger.info('Enhanced Context7 Enhance Tool initialized with extracted services');
  }

  /**
   * Main enhance method - orchestrates all services
   * Implements comprehensive prompt enhancement with intelligent breakdown
   * 
   * REDESIGNED FLOW - Context must inform analysis, not follow it
   * Phase 1: Context Gathering (Steps 1-2)
   * Phase 2: Context-Aware Analysis (Steps 3-4)
   * Phase 3: Context-Informed Processing (Steps 5-8)
   * Phase 4: Response Generation (Steps 9-10)
   */
  async enhance(request: EnhancedContext7Request): Promise<EnhancedContext7Response> {
    const startTime = Date.now();
    
    try {
      const enhanceDebugMode = process.env.ENHANCE_DEBUG === 'true';
      
      if (enhanceDebugMode) {
        console.log('🚀🚀🚀 ENHANCE TOOL CALLED 🚀🚀🚀');
        console.log('🚀 [EnhanceTool] Starting enhance method with request:', {
          prompt: request.prompt.substring(0, 100) + '...',
          context: request.context,
          options: request.options
        });
      }
      
      this.logger.info('Starting enhanced Context7 prompt enhancement', {
        prompt: request.prompt.substring(0, 100) + '...',
        context: request.context,
        options: request.options,
        enhanceDebugMode
      });

      // ===== PHASE 1: CONTEXT GATHERING =====
      
      if (enhanceDebugMode) {
        console.log('🔄 PHASE 1: CONTEXT GATHERING');
      }
      
      // 1. Gather project context FIRST (moved from step 6)
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting project context gathering');
        console.log('🔍 [EnhanceTool] About to call gatherProjectContext...');
      }
      const projectContext = await this.gatherProjectContext(request);
      if (enhanceDebugMode) {
        console.log('🔍 [EnhanceTool] gatherProjectContext returned:', {
          repoFactsCount: projectContext.repoFacts.length,
          codeSnippetsCount: projectContext.codeSnippets.length
        });
        console.log('📝 Log: Project context gathered successfully');
      }

      // 2. Detect frameworks with complete project context
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting framework detection');
      }
      const frameworkDetection = await this.frameworkIntegration.detectFrameworks(
        request.prompt,
        projectContext, // Now using complete project context
        request.context?.framework
      );
      if (enhanceDebugMode) {
        console.log('📝 Log: Framework detection completed:', {
          detectedFrameworks: frameworkDetection.detectedFrameworks,
          confidence: frameworkDetection.confidence,
          method: frameworkDetection.detectionMethod
        });
      }

      // ===== PHASE 2: CONTEXT-AWARE ANALYSIS =====
      
      if (enhanceDebugMode) {
        console.log('🔄 PHASE 2: CONTEXT-AWARE ANALYSIS');
      }
      
      // 3. Analyze prompt complexity with context using AI
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting prompt complexity analysis');
      }
      const promptComplexity = await this.promptAnalyzer.analyzePromptComplexityWithContext(
        request.prompt,
        {
          repoFacts: projectContext.repoFacts,
          codeSnippets: projectContext.codeSnippets,
          frameworks: frameworkDetection.detectedFrameworks,
          projectType: this.inferProjectType(projectContext)
        }
      );
      if (enhanceDebugMode) {
        console.log('📝 Log: Complexity score calculated:', {
          level: promptComplexity.level,
          score: promptComplexity.score,
          indicators: promptComplexity.indicators
        });
      }
      const optimizedOptions = this.promptAnalyzer.getOptimizedOptions(request.options || {}, promptComplexity);
      if (enhanceDebugMode) {
        console.log('📝 Log: Options optimized:', {
          originalOptions: request.options,
          optimizedOptions: optimizedOptions
        });
      }

      // 4. Detect quality requirements with context
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting quality requirements detection');
      }
      const qualityRequirements = await this.frameworkIntegration.detectQualityRequirementsWithContext(
        request.prompt,
        frameworkDetection.detectedFrameworks[0],
        projectContext
      );
      if (enhanceDebugMode) {
        console.log('📝 Log: Quality requirements detected:', {
          requirements: qualityRequirements.map(req => ({ type: req.type, priority: req.priority }))
        });
      }

      // ===== PHASE 3: CONTEXT-INFORMED PROCESSING =====
      
      if (enhanceDebugMode) {
        console.log('🔄 PHASE 3: CONTEXT-INFORMED PROCESSING');
      }
      
      // 5. Check cache with full context
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting context-aware cache check');
      }
      const cachedResult = await this.checkCacheWithContext(request, promptComplexity, projectContext, frameworkDetection);
      if (cachedResult) {
        if (enhanceDebugMode) {
          console.log('📝 Log: Cache result: cache hit');
        }
        return cachedResult;
      }
      if (enhanceDebugMode) {
        console.log('📝 Log: Cache result: cache miss');
      }

      // 6. Get Context7 documentation for contextually detected frameworks
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting Context7 documentation retrieval');
      }
      
      // Prepare Context7 enhancement options
      const context7EnhancementOptions = {
        useAIEnhancement: true, // Always enable AI enhancement
        enhancementStrategy: request.options?.context7EnhancementStrategy || 'general',
        qualityFocus: request.options?.context7QualityFocus || [],
        projectType: request.options?.projectType || 'frontend',
        maxTokens: optimizedOptions.maxTokens,
        temperature: 0.7
      };
      
      const context7Result = await this.getContext7Documentation(
        request.prompt,
        frameworkDetection,
        promptComplexity,
        optimizedOptions.maxTokens,
        context7EnhancementOptions
      );
      if (enhanceDebugMode) {
        console.log('📝 Log: Context7 docs integrated:', {
          docsLength: context7Result.docs.length,
          librariesUsed: context7Result.libraries
        });
      }

      // 7. Task breakdown with context
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting task breakdown generation');
      }
      
      const debugMode = process.env.ENHANCE_DEBUG === 'true';
      if (debugMode) {
        console.log('🔍 [EnhancedTool] About to call handleTaskBreakdown...');
      }
      
      const breakdownResult = await this.handleTaskBreakdown(request, projectContext);
      
      if (debugMode) {
        console.log('🔍 [EnhancedTool] handleTaskBreakdown completed:', {
          hasBreakdown: !!breakdownResult.breakdown,
          hasTodos: !!(breakdownResult.todos && breakdownResult.todos.length > 0),
          todosCount: breakdownResult.todos?.length || 0
        });
      }

      // 8. Build enhanced prompt with context separation
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting enhanced prompt building with context separation');
      }
      const enhancedResult = await this.responseBuilder.buildEnhancedOnlyPrompt(
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
        promptComplexity,
        true // Always enable AI enhancement
      );
      
      let enhancedPrompt = enhancedResult.enhancedPrompt;
      const contextUsed = enhancedResult.contextUsed;
      if (enhanceDebugMode) {
        console.log('📝 Log: Enhanced prompt created:', {
          originalLength: request.prompt.length,
          enhancedLength: enhancedPrompt.length,
          tokenRatio: Math.ceil(enhancedPrompt.length / 4) / Math.ceil(request.prompt.length / 4)
        });
        
        // Log all context data separately (not included in response)
        console.log('📝 Log: Context used for enhancement (not in response):', {
          frameworkDetection: contextUsed.frameworkDetection,
          qualityRequirements: contextUsed.qualityRequirements,
          context7Docs: contextUsed.context7Docs ? contextUsed.context7Docs.substring(0, 200) + '...' : null,
          frameworkDocs: contextUsed.frameworkDocs,
          projectDocs: contextUsed.projectDocs,
          repoFacts: contextUsed.repoFacts,
          codeSnippets: contextUsed.codeSnippets
        });
      }

      // 8.5. AI Enhancement Phase (if enabled)
      let aiEnhancementResult: any = null;
      if (this.enhancementAgent) {
        if (enhanceDebugMode) {
          console.log('📝 Log: Starting AI enhancement phase');
        }
        try {
          aiEnhancementResult = await this.performAIEnhancement(
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
            request.options
          );
          
          if (aiEnhancementResult) {
            enhancedPrompt = aiEnhancementResult.enhancedPrompt;
            if (enhanceDebugMode) {
              console.log('📝 Log: AI enhancement completed:', {
                qualityScore: aiEnhancementResult.quality.overall,
                confidenceScore: aiEnhancementResult.confidence.overall,
                improvements: aiEnhancementResult.improvements.length
              });
            }
          }
        } catch (error) {
          this.logger.warn('AI enhancement failed, using standard enhancement', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          if (enhanceDebugMode) {
            console.log('📝 Log: AI enhancement failed, falling back to standard enhancement');
          }
        }
      }

      // ===== PHASE 4: RESPONSE GENERATION =====
      
      if (enhanceDebugMode) {
        console.log('🔄 PHASE 4: RESPONSE GENERATION');
      }
      
      // 9. Cache result with complete context
      if (enhanceDebugMode) {
        console.log('📝 Log: Starting result caching with context');
      }
      await this.cacheResultWithContext(request, enhancedPrompt, projectContext, frameworkDetection, (context7Result as any).curationMetrics);

      // 10. Build response with simplified format
      if (enhanceDebugMode) {
        console.log('📝 Log: Building final enhanced response');
      }
      
      const responseTime = Date.now() - startTime;
      
      const response: EnhancedContext7Response = {
        enhanced_prompt: enhancedPrompt,
        context_used: {
          framework: request.context?.framework,
          style: request.context?.style,
          file: request.context?.file,
          repo_facts: projectContext.repoFacts || [],
          code_snippets: projectContext.codeSnippets || [],
          context7_docs: context7Result.docs ? [context7Result.docs] : []
        },
        breakdown: breakdownResult.breakdown,
        todos: breakdownResult.todos || [],
        metrics: {
          response_time_ms: responseTime,
          quality_score: aiEnhancementResult?.quality?.overall || 0,
          confidence_score: aiEnhancementResult?.confidence?.overall || 0,
          token_ratio: 0, // Will be calculated right before return
          frameworks_detected: frameworkDetection.detectedFrameworks || [],
          ai_enhancement_enabled: true, // Always enabled
          cost: aiEnhancementResult?.metadata?.tokenUsage?.cost || 0
        }
      };

      if (enhanceDebugMode) {
        console.log('📝 Log: Context metrics compiled:', {
          repoFactsCount: projectContext.repoFacts.length,
          codeSnippetsCount: projectContext.codeSnippets.length,
          context7DocsCount: context7Result.docs ? 1 : 0
        });
        console.log('📝 Log: Response assembled:', {
          breakdownIncluded: !!breakdownResult.breakdown,
          todosCount: breakdownResult.todos?.length || 0,
          todos: breakdownResult.todos?.map(t => ({ id: t.id, title: t.title, priority: t.priority, status: t.status })) || [],
          enhancedPromptLength: enhancedPrompt.length,
          inputPromptLength: request.prompt.length
        });
        
        // Log all the detailed data that's not in the simplified response
        console.log('📝 Log: Detailed context data (not in response):', {
          context_used: {
            repo_facts: projectContext.repoFacts,
            code_snippets: projectContext.codeSnippets,
            context7_docs: context7Result.docs ? [context7Result.docs] : []
          },
          breakdown: breakdownResult.breakdown,
          todos: breakdownResult.todos || [],
          frameworks_detected: frameworkDetection.detectedFrameworks,
          ai_enhancement: aiEnhancementResult ? {
            enabled: true,
            strategy: aiEnhancementResult.metadata.strategy.type,
            quality_score: aiEnhancementResult.quality.overall,
            confidence_score: aiEnhancementResult.confidence.overall,
            improvements: aiEnhancementResult.improvements,
            recommendations: aiEnhancementResult.recommendations,
            processing_time: aiEnhancementResult.metadata.processingTime,
            cost: aiEnhancementResult.metadata.tokenUsage.cost
          } : {
            enabled: false,
            strategy: 'none',
            quality_score: 0,
            confidence_score: 0,
            improvements: [],
            recommendations: [],
            processing_time: 0,
            cost: 0
          }
        });
      }

      this.logger.info('Enhanced Context7 prompt enhancement completed successfully', {
        promptLength: request.prompt.length,
        enhancedLength: enhancedPrompt.length,
        responseTime: responseTime,
        enhanceDebugMode
      });

      // Calculate token metrics right before return
      const enhancedTokenCount = Math.ceil(enhancedPrompt.length / 4); // Rough token estimation
      const inputTokenCount = Math.ceil(request.prompt.length / 4);
      const tokenRatio = enhancedTokenCount / inputTokenCount;
      
      // Update response with final token metrics
      response.metrics.token_ratio = Math.round(tokenRatio * 100) / 100;

      return response;

    } catch (error) {
      this.logger.error('Enhanced Context7 prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt.substring(0, 100) + '...',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Re-throw the error instead of returning a fallback response
      // This ensures tests fail when there are API issues
      throw error;
    }
  }

  /**
   * Check cache for existing enhanced prompt with complete context
   * REDESIGNED: Uses complete project context for accurate cache hits
   */
  private async checkCacheWithContext(
    request: EnhancedContext7Request,
    promptComplexity: any,
    projectContext: any,
    frameworkDetection: any
  ): Promise<EnhancedContext7Response | null> {
    try {
      if (!request.options?.useCache) {
        return null;
      }

      // Generate cache key with complete context
      const cacheKey = this.generateContextAwareCacheKey(
        request.prompt,
        projectContext,
        frameworkDetection,
        request.context
      );

      const cachedPrompt = await this.promptCache.getCachedPrompt(
        request.prompt,
        {
          ...request.context,
          projectContext: projectContext
        },
        frameworkDetection
      );

      if (cachedPrompt) {
        this.logger.debug('Using cached enhanced prompt with context', {
          cacheKey: cachedPrompt.key,
          hits: cachedPrompt.hits,
          qualityScore: cachedPrompt.qualityScore,
          contextMatch: true
        });

        const response: EnhancedContext7Response = {
          enhanced_prompt: cachedPrompt.enhancedPrompt,
          context_used: {
            framework: request.context?.framework,
            style: request.context?.style,
            file: request.context?.file,
            repo_facts: projectContext.repoFacts || [],
            code_snippets: projectContext.codeSnippets || [],
            context7_docs: []
          },
          breakdown: undefined,
          todos: [],
          metrics: {
            response_time_ms: 0, // Cache hit - instant response
            quality_score: cachedPrompt.qualityScore || 0,
            confidence_score: 0,
            token_ratio: 0, // Will be calculated right before return
            frameworks_detected: cachedPrompt.frameworkDetection?.detectedFrameworks || [],
            ai_enhancement_enabled: true, // Always enabled
            cost: 0
          }
        };

        // Calculate token metrics right before return
        const enhancedTokenCount = Math.ceil(cachedPrompt.enhancedPrompt.length / 4);
        const inputTokenCount = Math.ceil(request.prompt.length / 4);
        const tokenRatio = enhancedTokenCount / inputTokenCount;
        
        // Update response with final token metrics
        response.metrics.token_ratio = Math.round(tokenRatio * 100) / 100;

        return response;
      }

      return null;

    } catch (error) {
      this.logger.warn('Context-aware cache check failed, continuing without cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Generate context-aware cache key for accurate cache hits
   * REDESIGNED: Enhanced with complete context for better cache accuracy
   */
  private generateContextAwareCacheKey(
    prompt: string,
    projectContext: any,
    frameworkDetection: any,
    context?: any
  ): string {
    // Create comprehensive context hash including all relevant factors
    const contextHash = JSON.stringify({
      // Project context details
      repoFacts: projectContext.repoFacts?.slice(0, 5) || [], // First 5 facts for context
      codeSnippets: projectContext.codeSnippets?.slice(0, 3) || [], // First 3 snippets
      projectType: this.inferProjectType(projectContext),
      
      // Framework detection details
      frameworks: frameworkDetection.detectedFrameworks || [],
      frameworkConfidence: frameworkDetection.confidence || 0,
      detectionMethod: frameworkDetection.detectionMethod || 'unknown',
      
      // Request context
      file: context?.file || '',
      framework: context?.framework || '',
      style: context?.style || '',
      
      // Prompt characteristics
      promptLength: prompt.length,
      promptComplexity: this.promptAnalyzer.analyzePromptComplexity(prompt).level,
      
      // Quality requirements (if available)
      qualityRequirements: context?.qualityRequirements || []
    });
    
    // Create a more robust hash that includes content, not just counts
    const contentHash = this.createContentHash(contextHash);
    const promptHash = this.createPromptHash(prompt);
    
    return `enhance_${promptHash}_${contentHash}`;
  }

  /**
   * Create content hash for cache key
   * REDESIGNED: More robust hashing for better cache accuracy
   */
  private createContentHash(content: string): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Create prompt hash for cache key
   * REDESIGNED: Normalized prompt hashing for better cache hits
   */
  private createPromptHash(prompt: string): string {
    // Normalize prompt for better cache hits
    const normalized = prompt
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim();
    
    // Create hash of normalized prompt
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get Context7 documentation using extracted service
   */
  private async getContext7Documentation(
    prompt: string,
    frameworkDetection: any,
    promptComplexity: any,
    maxTokens: number,
    enhancementOptions?: any
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
        maxTokens,
        enhancementOptions
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
      const enhanceDebugMode = process.env.ENHANCE_DEBUG === 'true';
      
      if (enhanceDebugMode) {
        console.log('🔍 [EnhanceTool] Starting project context gathering...');
      }
      this.logger.info('Starting project context gathering');

      // Get repo facts from the project analyzer
      if (enhanceDebugMode) {
        console.log('🔍 [EnhanceTool] Calling projectAnalyzer.analyzeProject()...');
      }
      const repoFacts = await this.projectAnalyzer.analyzeProject();
      if (enhanceDebugMode) {
        console.log('🔍 [EnhanceTool] Project analyzer returned', repoFacts.length, 'facts');
      }
      const repoFactsStrings = repoFacts.map(fact => fact.fact);

      // Get code snippets from the project analyzer
      if (enhanceDebugMode) {
        console.log('🔍 [EnhanceTool] Calling projectAnalyzer.findRelevantCodeSnippets()...');
      }
      const codeSnippets = await this.projectAnalyzer.findRelevantCodeSnippets(
        request.prompt,
        request.context?.file
      );
      if (enhanceDebugMode) {
        console.log('🔍 [EnhanceTool] Project analyzer returned', codeSnippets.length, 'snippets');
      }
      const codeSnippetsStrings = codeSnippets.map(snippet => 
        `File: ${snippet.file}\nDescription: ${snippet.description}\nCode:\n${snippet.content}`
      );

      if (enhanceDebugMode) {
        console.log('✅ [EnhanceTool] Project context gathered successfully', {
          repoFactsCount: repoFactsStrings.length,
          codeSnippetsCount: codeSnippetsStrings.length
        });
      }

      this.logger.info('Project context gathered successfully', {
        repoFactsCount: repoFactsStrings.length,
        codeSnippetsCount: codeSnippetsStrings.length
      });

      return {
        repoFacts: repoFactsStrings,
        codeSnippets: codeSnippetsStrings
      };

    } catch (error) {
      const enhanceDebugMode = process.env.ENHANCE_DEBUG === 'true';
      
      if (enhanceDebugMode) {
        console.error('❌ [EnhanceTool] Project context gathering failed', error);
        console.error('❌ [EnhanceTool] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          name: error instanceof Error ? error.name : 'Unknown'
        });
      }
      this.logger.warn('Project context gathering failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { repoFacts: [], codeSnippets: [] };
    }
  }


  /**
   * Handle task breakdown if needed (legacy method for backward compatibility)
   */
  private async handleTaskBreakdown(
    request: EnhancedContext7Request,
    projectContext: any
  ): Promise<{ breakdown?: any; todos?: any[] }> {
    try {
      const debugMode = process.env.ENHANCE_DEBUG === 'true';
      
      if (debugMode) {
        console.log('🔍 [EnhancedTool] handleTaskBreakdown called with:', {
          prompt: request.prompt.substring(0, 100) + '...',
          options: request.options,
          hasTaskContext: !!this.taskContext
        });
      }
      
      if (this.taskContext.shouldBreakdown(request.prompt, request.options)) {
        if (debugMode) {
          console.log('🔍 [EnhancedTool] shouldBreakdown returned true, performing breakdown...');
        }
        
        const projectId = request.context?.projectContext?.projectId || 'default';
        const result = await this.taskContext.performTaskBreakdown(
          request.prompt,
          projectId,
          request.options
        );
        
        if (debugMode) {
          console.log('🔍 [EnhancedTool] performTaskBreakdown returned:', {
            hasBreakdown: !!result.breakdown,
            hasTodos: !!(result.todos && result.todos.length > 0),
            todosCount: result.todos?.length || 0
          });
        }
        
        return result;
      } else {
        if (debugMode) {
          console.log('🔍 [EnhancedTool] shouldBreakdown returned false, skipping breakdown');
        }
        return {};
      }

    } catch (error) {
      if (process.env.ENHANCE_DEBUG === 'true') {
        console.log('❌ [EnhancedTool] Task breakdown failed:', error);
      }
      this.logger.warn('Task breakdown failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  /**
   * Cache the enhanced result with complete context
   * REDESIGNED: Uses complete context for better cache accuracy
   */
  private async cacheResultWithContext(
    request: EnhancedContext7Request,
    enhancedPrompt: string,
    projectContext: any,
    frameworkDetection: any,
    curationMetrics?: {
      totalTokenReduction: number;
      averageQualityScore: number;
      curationEnabled: boolean;
    }
  ): Promise<void> {
    try {
      if (!request.options?.useCache) {
        return;
      }

      // Generate context-aware cache key
      const cacheKey = this.generateContextAwareCacheKey(
        request.prompt,
        projectContext,
        frameworkDetection,
        request.context
      );

      // Check for context changes that should invalidate related cache entries
      await this.invalidateRelatedCacheEntries(request.prompt, projectContext, frameworkDetection);

      await this.promptCache.cachePrompt(
        request.prompt,
        enhancedPrompt,
        {
          repoFacts: projectContext.repoFacts,
          codeSnippets: projectContext.codeSnippets,
          context7Docs: '',
          frameworkDetection,
          projectContext: projectContext
        },
        frameworkDetection,
        0.8, // qualityScore
        Date.now() - Date.now(), // responseTime
        'medium', // complexity
        curationMetrics
      );

      this.logger.debug('Cached result with complete context', {
        cacheKey: cacheKey.substring(0, 50),
        contextSize: JSON.stringify(projectContext).length
      });

    } catch (error) {
      this.logger.warn('Failed to cache result with context', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Cache the enhanced result (legacy method for backward compatibility)
   */
  private async cacheResult(
    request: EnhancedContext7Request,
    enhancedPrompt: string,
    projectContext: any,
    frameworkDetection: any,
    curationMetrics?: {
      totalTokenReduction: number;
      averageQualityScore: number;
      curationEnabled: boolean;
    }
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
        'medium', // complexity
        curationMetrics
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
   * Infer project type from project context
   * REDESIGNED: Uses project context to determine project type for better AI analysis
   */
  private inferProjectType(projectContext: any): string {
    try {
      const repoFacts = projectContext.repoFacts || [];
      const codeSnippets = projectContext.codeSnippets || [];
      
      // Check for web application patterns
      if (repoFacts.some((fact: string) => 
        fact.toLowerCase().includes('react') || 
        fact.toLowerCase().includes('vue') || 
        fact.toLowerCase().includes('angular') ||
        fact.toLowerCase().includes('next') ||
        fact.toLowerCase().includes('nuxt')
      )) {
        return 'web-application';
      }
      
      // Check for API/backend patterns
      if (repoFacts.some((fact: string) => 
        fact.toLowerCase().includes('express') || 
        fact.toLowerCase().includes('fastify') || 
        fact.toLowerCase().includes('api') ||
        fact.toLowerCase().includes('server')
      )) {
        return 'api-backend';
      }
      
      // Check for mobile application patterns
      if (repoFacts.some((fact: string) => 
        fact.toLowerCase().includes('react-native') || 
        fact.toLowerCase().includes('flutter') || 
        fact.toLowerCase().includes('mobile') ||
        fact.toLowerCase().includes('app')
      )) {
        return 'mobile-application';
      }
      
      // Check for desktop application patterns
      if (repoFacts.some((fact: string) => 
        fact.toLowerCase().includes('electron') || 
        fact.toLowerCase().includes('tauri') || 
        fact.toLowerCase().includes('desktop')
      )) {
        return 'desktop-application';
      }
      
      // Check for library/package patterns
      if (repoFacts.some((fact: string) => 
        fact.toLowerCase().includes('package') || 
        fact.toLowerCase().includes('library') || 
        fact.toLowerCase().includes('npm') ||
        fact.toLowerCase().includes('module')
      )) {
        return 'library-package';
      }
      
      // Check for CLI tool patterns
      if (repoFacts.some((fact: string) => 
        fact.toLowerCase().includes('cli') || 
        fact.toLowerCase().includes('command') || 
        fact.toLowerCase().includes('tool') ||
        fact.toLowerCase().includes('script')
      )) {
        return 'cli-tool';
      }
      
      // Default to web application if no specific patterns found
      return 'web-application';
      
    } catch (error) {
      this.logger.warn('Failed to infer project type', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 'web-application';
    }
  }

  /**
   * Invalidate related cache entries when context changes
   * REDESIGNED: Context-aware cache invalidation for better cache management
   */
  private async invalidateRelatedCacheEntries(
    prompt: string,
    projectContext: any,
    frameworkDetection: any
  ): Promise<void> {
    try {
      // Get current project signature for comparison
      const currentProjectSignature = this.generateProjectSignature(projectContext);
      
      // Check if project context has changed significantly
      const hasSignificantChanges = await this.hasProjectContextChanged(currentProjectSignature);
      
      if (hasSignificantChanges) {
        this.logger.info('Project context changed significantly, invalidating related cache entries', {
          projectSignature: currentProjectSignature,
          frameworks: frameworkDetection.detectedFrameworks
        });

        // Invalidate cache entries for similar prompts with old context
        await this.invalidateSimilarPrompts(prompt, frameworkDetection.detectedFrameworks);
        
        // Update project signature
        await this.updateProjectSignature(currentProjectSignature);
      }

    } catch (error) {
      this.logger.warn('Cache invalidation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate project signature for change detection
   * REDESIGNED: Creates unique signature for project state
   */
  private generateProjectSignature(projectContext: any): string {
    const signature = {
      repoFacts: projectContext.repoFacts?.slice(0, 10) || [], // First 10 facts
      codeSnippets: projectContext.codeSnippets?.slice(0, 5) || [], // First 5 snippets
      projectType: this.inferProjectType(projectContext),
      timestamp: Math.floor(Date.now() / (1000 * 60 * 60)) // Hourly granularity
    };
    
    return this.createContentHash(JSON.stringify(signature));
  }

  /**
   * Check if project context has changed significantly
   * REDESIGNED: Determines if cache invalidation is needed
   */
  private async hasProjectContextChanged(currentSignature: string): Promise<boolean> {
    try {
      // In a real implementation, this would check against stored project signatures
      // For now, we'll use a simple approach based on time and context
      const lastCheck = this.getLastProjectCheck();
      const timeSinceLastCheck = Date.now() - lastCheck;
      
      // Check every hour or if signature is different
      return timeSinceLastCheck > (60 * 60 * 1000) || currentSignature !== this.getLastProjectSignature();
    } catch (error) {
      this.logger.warn('Failed to check project context changes', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Invalidate cache entries for similar prompts
   * REDESIGNED: Smart invalidation based on prompt similarity and frameworks
   */
  private async invalidateSimilarPrompts(prompt: string, frameworks: string[]): Promise<void> {
    try {
      // Get normalized prompt for similarity matching
      const normalizedPrompt = this.normalizePromptForSimilarity(prompt);
      
      // In a real implementation, this would query the cache for similar entries
      // and invalidate them. For now, we'll log the intention.
      this.logger.debug('Would invalidate similar prompts', {
        normalizedPrompt: normalizedPrompt.substring(0, 50) + '...',
        frameworks: frameworks,
        reason: 'Project context changed'
      });
      
      // TODO: Implement actual cache invalidation logic
      // This would involve:
      // 1. Querying cache for entries with similar prompts
      // 2. Checking if they use the same frameworks
      // 3. Invalidating those entries
      
    } catch (error) {
      this.logger.warn('Failed to invalidate similar prompts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Normalize prompt for similarity matching
   * REDESIGNED: Creates normalized version for similarity detection
   */
  private normalizePromptForSimilarity(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  /**
   * Get last project check timestamp
   * REDESIGNED: Simple in-memory tracking (would be persistent in production)
   */
  private getLastProjectCheck(): number {
    return (this as any).lastProjectCheck || 0;
  }

  /**
   * Get last project signature
   * REDESIGNED: Simple in-memory tracking (would be persistent in production)
   */
  private getLastProjectSignature(): string {
    return (this as any).lastProjectSignature || '';
  }

  /**
   * Update project signature
   * REDESIGNED: Simple in-memory tracking (would be persistent in production)
   */
  private async updateProjectSignature(signature: string): Promise<void> {
    (this as any).lastProjectCheck = Date.now();
    (this as any).lastProjectSignature = signature;
  }

  /**
   * Perform AI enhancement using the enhancement agent
   */
  private async performAIEnhancement(
    originalPrompt: string,
    context: any,
    options: any
  ): Promise<any> {
    if (!this.enhancementAgent) {
      throw new Error('AI enhancement agent not available');
    }

    // Convert context to enhancement context format
    const enhancementContext = {
      projectContext: {
        projectType: options.projectType || this.inferProjectType(context),
        framework: context.frameworkDetection?.detectedFrameworks?.[0] || 'Unknown',
        language: 'typescript',
        architecture: 'Unknown',
        patterns: [],
        conventions: [],
        dependencies: context.frameworkDetection?.detectedFrameworks || [],
        environment: 'development' as 'development' | 'production' | 'staging' | 'test'
      },
      frameworkContext: {
        framework: context.frameworkDetection?.detectedFrameworks?.[0] || 'Unknown',
        version: 'Unknown',
        bestPractices: [],
        commonPatterns: [],
        antiPatterns: [],
        performanceTips: [],
        securityConsiderations: [],
        testingApproaches: []
      },
      qualityRequirements: {
        accessibility: context.qualityRequirements?.some((req: any) => req.type?.includes('accessibility')) || false,
        performance: context.qualityRequirements?.some((req: any) => req.type?.includes('performance')) || false,
        security: context.qualityRequirements?.some((req: any) => req.type?.includes('security')) || false,
        testing: context.qualityRequirements?.some((req: any) => req.type?.includes('testing')) || false,
        documentation: context.qualityRequirements?.some((req: any) => req.type?.includes('documentation')) || false,
        maintainability: context.qualityRequirements?.some((req: any) => req.type?.includes('maintainability')) || false,
        scalability: context.qualityRequirements?.some((req: any) => req.type?.includes('scalability')) || false,
        userExperience: context.qualityRequirements?.some((req: any) => req.type?.includes('userExperience')) || false
      },
      codeSnippets: context.codeSnippets?.map((snippet: string, index: number) => ({
        content: snippet,
        language: 'typescript',
        purpose: 'example',
        relevance: 0.8,
        location: `snippet_${index}`
      })) || [],
      documentation: {
        apiDocs: [],
        guides: [],
        examples: [],
        tutorials: [],
        troubleshooting: []
      },
      userPreferences: {
        codingStyle: 'functional' as 'functional' | 'object-oriented' | 'procedural' | 'mixed',
        verbosity: 'detailed' as 'concise' | 'detailed' | 'comprehensive',
        focus: 'quality' as 'speed' | 'quality' | 'maintainability' | 'performance',
        experience: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'expert'
      }
    };

    // Determine enhancement strategy
    let strategy: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware' = 'general';
    
    if (options.enhancementStrategy) {
      strategy = options.enhancementStrategy;
    } else if (context.frameworkDetection?.detectedFrameworks?.length > 0) {
      strategy = 'framework-specific';
    } else if (options.qualityFocus?.length > 0) {
      strategy = 'quality-focused';
    } else if (options.projectType) {
      strategy = 'project-aware';
    }

    // Perform enhancement based on strategy
    switch (strategy) {
      case 'framework-specific':
        return await this.enhancementAgent.enhancePromptForFramework(
          originalPrompt,
          enhancementContext,
          context.frameworkDetection?.detectedFrameworks?.[0] || 'Unknown'
        );
      
      case 'quality-focused':
        return await this.enhancementAgent.enhancePromptForQuality(
          originalPrompt,
          enhancementContext,
          options.qualityFocus || ['quality']
        );
      
      case 'project-aware':
        return await this.enhancementAgent.enhancePromptForProject(
          originalPrompt,
          enhancementContext,
          options.projectType || 'frontend'
        );
      
      default:
        return await this.enhancementAgent.enhancePrompt(originalPrompt, enhancementContext);
    }
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
              },
              enhancementStrategy: {
                type: 'string',
                description: 'AI enhancement strategy to use',
                enum: ['general', 'framework-specific', 'quality-focused', 'project-aware'],
                default: 'general'
              },
              qualityFocus: {
                type: 'array',
                description: 'Quality aspects to focus on for enhancement',
                items: {
                  type: 'string',
                  enum: ['accessibility', 'performance', 'security', 'testing', 'documentation', 'maintainability', 'scalability', 'userExperience']
                },
                default: []
              },
              projectType: {
                type: 'string',
                description: 'Project type for project-aware enhancement',
                enum: ['frontend', 'backend', 'fullstack', 'library', 'mobile', 'desktop', 'cli', 'other'],
                default: 'frontend'
              }
            }
          }
        },
        required: ['prompt']
      }
    };
  }
}
