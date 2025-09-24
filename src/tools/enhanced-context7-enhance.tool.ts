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

// Import extracted services
import { PromptAnalyzerService } from './enhance/prompt-analyzer.service.js';
import { Context7DocumentationService } from './enhance/context7-documentation.service.js';
import { FrameworkIntegrationService } from './enhance/framework-integration.service.js';
import { ResponseBuilderService } from './enhance/response-builder.service.js';
import { TaskContextService } from './enhance/task-context.service.js';
import { HealthCheckerService } from './enhance/health-checker.service.js';
import { Context7CurationService } from '../services/ai/context7-curation.service.js';

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
    this.responseBuilder = new ResponseBuilderService(logger);
    this.taskContext = new TaskContextService(logger, todoService, taskBreakdownService);
    this.healthChecker = new HealthCheckerService(
      logger,
      monitoring,
      context7Client,
      cacheAnalytics,
      taskBreakdownService,
      todoService
    );

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

      // ===== PHASE 1: CONTEXT GATHERING =====
      
      // 1. Gather project context FIRST (moved from step 6)
      console.log('🔍 [EnhanceTool] About to call gatherProjectContext...');
      const projectContext = await this.gatherProjectContext(request);
      console.log('🔍 [EnhanceTool] gatherProjectContext returned:', {
        repoFactsCount: projectContext.repoFacts.length,
        codeSnippetsCount: projectContext.codeSnippets.length
      });

      // 2. Detect frameworks with complete project context
      const frameworkDetection = await this.frameworkIntegration.detectFrameworks(
        request.prompt,
        projectContext, // Now using complete project context
        request.context?.framework
      );

      // ===== PHASE 2: CONTEXT-AWARE ANALYSIS =====
      
      // 3. Analyze prompt complexity with context using AI
      const promptComplexity = await this.promptAnalyzer.analyzePromptComplexityWithContext(
        request.prompt,
        {
          repoFacts: projectContext.repoFacts,
          codeSnippets: projectContext.codeSnippets,
          frameworks: frameworkDetection.detectedFrameworks,
          projectType: this.inferProjectType(projectContext)
        }
      );
      const optimizedOptions = this.promptAnalyzer.getOptimizedOptions(request.options || {}, promptComplexity);

      // 4. Detect quality requirements with context
      const qualityRequirements = await this.frameworkIntegration.detectQualityRequirementsWithContext(
        request.prompt,
        frameworkDetection.detectedFrameworks[0],
        projectContext
      );

      // ===== PHASE 3: CONTEXT-INFORMED PROCESSING =====
      
      // 5. Check cache with full context
      const cachedResult = await this.checkCacheWithContext(request, promptComplexity, projectContext, frameworkDetection);
      if (cachedResult) {
        return cachedResult;
      }

      // 6. Get Context7 documentation for contextually detected frameworks
      const context7Result = await this.getContext7Documentation(
        request.prompt,
        frameworkDetection,
        promptComplexity,
        optimizedOptions.maxTokens
      );

      // 7. Task breakdown with context
      const breakdownResult = await this.handleTaskBreakdown(request, projectContext);

      // 8. Build enhanced prompt with context
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

      // ===== PHASE 4: RESPONSE GENERATION =====
      
      // 9. Cache result with complete context
      await this.cacheResultWithContext(request, enhancedPrompt, projectContext, frameworkDetection, (context7Result as any).curationMetrics);

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
   * Handle task breakdown if needed (legacy method for backward compatibility)
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
