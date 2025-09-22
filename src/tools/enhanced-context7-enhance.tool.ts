/**
 * Enhanced Context7 Integration Tool
 * Implements Phase 1 high-scoring areas with comprehensive Context7 integration
 * Based on Context7 best practices and TypeScript error handling patterns
 */

import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { Context7MCPComplianceService } from '../services/context7/context7-mcp-compliance.service.js';
import { Context7RealIntegrationService } from '../services/context7/context7-real-integration.service.js';
import { Context7MonitoringService } from '../services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from '../services/context7/context7-advanced-cache.service.js';
import { QualityRequirementsDetector } from '../services/quality/quality-requirements-detector.service.js';
import { QualityRequirementsFormatter } from '../services/quality/quality-requirements-formatter.service.js';
import { FrameworkDetectorService, Context7CacheService } from '../services/framework-detector/index.js';
import { Context7ContentExtractor } from '../services/context7/context7-content-extractor.service.js';
import { PromptCacheService } from '../services/cache/prompt-cache.service.js';
import { CacheAnalyticsService } from '../services/cache/cache-analytics.service.js';

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
  };
}

export interface EnhancedContext7Response {
  enhanced_prompt: string;
  context_used: {
    repo_facts: string[];
    code_snippets: string[];
    context7_docs: string[];
    metadata?: {
      cache_hit: boolean;
      response_time: number;
      libraries_resolved: string[];
      monitoring_metrics: any;
    };
  };
  success: boolean;
  error?: string;
}

export class EnhancedContext7EnhanceTool {
  private logger: Logger;
  private config: ConfigService;
  private mcpCompliance: Context7MCPComplianceService;
  private realContext7: Context7RealIntegrationService;
  private monitoring: Context7MonitoringService;
  private cache: Context7AdvancedCacheService;
  private qualityDetector: QualityRequirementsDetector;
  private qualityFormatter: QualityRequirementsFormatter;
  private frameworkDetector?: FrameworkDetectorService;
  private frameworkCache: Context7CacheService;
  private contentExtractor: Context7ContentExtractor;
  private promptCache: PromptCacheService;
  private cacheAnalytics: CacheAnalyticsService;

  constructor(
    logger: Logger,
    config: ConfigService,
    mcpCompliance: Context7MCPComplianceService,
    monitoring: Context7MonitoringService,
    cache: Context7AdvancedCacheService
  ) {
    this.logger = logger;
    this.config = config;
    this.mcpCompliance = mcpCompliance;
    this.realContext7 = new Context7RealIntegrationService(logger, config);
    this.monitoring = monitoring;
    this.cache = cache;
    this.qualityDetector = new QualityRequirementsDetector(logger);
    this.qualityFormatter = new QualityRequirementsFormatter(logger);
    this.contentExtractor = new Context7ContentExtractor(logger);
    
    // Initialize Context7-based framework detection
    this.frameworkCache = new Context7CacheService();
    this.frameworkDetector = new FrameworkDetectorService(
      this.realContext7,
      this.frameworkCache
    );
    
    // Initialize prompt cache
    this.promptCache = new PromptCacheService(logger, config);
    
    // Initialize cache analytics
    this.cacheAnalytics = new CacheAnalyticsService(logger, cache, this.promptCache);
    
    // Validate configuration
    this.validateConfiguration();
  }

  /**
   * Validates configuration on startup
   * Implements comprehensive configuration validation
   */
  private validateConfiguration(): void {
    try {
      // Validate logger
      if (!this.logger) {
        throw new Error('Logger is required but not provided');
      }
      
      // Validate config service
      if (!this.config) {
        throw new Error('ConfigService is required but not provided');
      }
      
      // Validate MCP compliance service
      if (!this.mcpCompliance) {
        throw new Error('Context7MCPComplianceService is required but not provided');
      }
      
      // Validate monitoring service
      if (!this.monitoring) {
        throw new Error('Context7MonitoringService is required but not provided');
      }
      
      // Validate cache service
      if (!this.cache) {
        throw new Error('Context7AdvancedCacheService is required but not provided');
      }
      
      // Validate Context7 integration
      if (!this.realContext7) {
        throw new Error('Context7RealIntegrationService failed to initialize');
      }
      
      this.logger.info('Configuration validation passed', {
        services: {
          logger: !!this.logger,
          config: !!this.config,
          mcpCompliance: !!this.mcpCompliance,
          monitoring: !!this.monitoring,
          cache: !!this.cache,
          realContext7: !!this.realContext7,
          qualityDetector: !!this.qualityDetector,
          qualityFormatter: !!this.qualityFormatter
        }
      });
      
    } catch (error) {
      this.logger.error('Configuration validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Enhance prompt with comprehensive Context7 integration
   * Implements Phase 1 high-scoring areas with comprehensive error handling
   */
  async enhance(request: EnhancedContext7Request): Promise<EnhancedContext7Response> {
    const startTime = Date.now();
    
    // Validate input request
    if (!request.prompt || typeof request.prompt !== 'string') {
      return {
        enhanced_prompt: request.prompt || '',
        context_used: {
          repo_facts: [],
          code_snippets: [],
          context7_docs: []
        },
        success: false,
        error: 'Invalid prompt: prompt must be a non-empty string'
      };
    }
    
    // 1. Detect prompt complexity and optimize response accordingly
    const promptComplexity = this.analyzePromptComplexity(request.prompt);
    const optimizedOptions = this.getOptimizedOptions(request.options, promptComplexity);
    
    // 1.5. Check prompt cache first
    const frameworkDetection = await this.frameworkDetector!.detectFrameworks(
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
        success: true,
        // cache_hit: true, // Removed - not in interface
        // quality_score: cachedPrompt.qualityScore, // Removed - not in interface
        // response_time: Date.now() - startTime // Removed - not in interface
      };
    }
    
    // Debug logging for complexity detection
    this.logger.debug('Complexity analysis', {
      prompt: request.prompt,
      complexity: promptComplexity,
      optimizedOptions: optimizedOptions
    });
    
    try {
      this.logger.info('Starting enhanced Context7 prompt enhancement', {
        prompt: request.prompt.substring(0, 100) + '...',
        context: request.context,
        options: optimizedOptions,
        complexity: promptComplexity
      });

      // 1. Detect frameworks dynamically using Context7-based detection
      // If explicit framework is provided in context, use it as primary detection
      let frameworkDetection: any;
      if (request.context?.framework) {
        // Use explicit framework from context
        frameworkDetection = {
          detectedFrameworks: [request.context.framework],
          confidence: 1.0,
          suggestions: [],
          context7Libraries: [],
          detectionMethod: 'context' as const
        };
        this.logger.debug('Using explicit framework from context', { 
          framework: request.context.framework 
        });
      } else {
        // Use dynamic detection
        frameworkDetection = await this.frameworkDetector!.detectFrameworks(
          request.prompt, 
          request.context?.projectContext
        );
      }
      
      // 2. Detect quality requirements from prompt and detected frameworks
      const qualityRequirements = await this.detectQualityRequirements(
        request.prompt, 
        frameworkDetection.detectedFrameworks[0] // Use first detected framework
      );
      
      // 3. Get Context7 documentation with enhanced library selection
      let context7Docs = '';
      let librariesResolved: string[] = [];
      
      // Use enhanced library selection for better relevance
      const optimalLibraries = await this.selectOptimalContext7Libraries(
        request.prompt,
        frameworkDetection.detectedFrameworks,
        promptComplexity
      );
      
      // Skip Context7 documentation for simple prompts, except for HTML questions
      const isSimpleHtmlQuestion = promptComplexity.level === 'simple' && 
        frameworkDetection.detectedFrameworks.includes('html');
      
      if ((promptComplexity.level !== 'simple' || isSimpleHtmlQuestion) && optimalLibraries.length > 0) {
        // Apply intelligent token optimization for Context7 docs
        let maxTokens = this.calculateOptimalTokenLimit(
          promptComplexity.level,
          frameworkDetection.detectedFrameworks[0] || 'generic',
          request.prompt
        );
        this.logger.debug('Starting enhanced Context7 documentation retrieval', {
          optimalLibraries,
          librariesCount: optimalLibraries.length,
          optimizedMaxTokens: maxTokens
        });
        
        try {
          // Use parallel processing for Context7 documentation retrieval
          const context7Start = Date.now();
          const context7Result = await this.getContext7DocumentationForFrameworks(
            optimalLibraries,
            request.prompt, 
            maxTokens
          );
          const context7Time = Date.now() - context7Start;
          
          // Enhanced Context7 content processing for better relevance
          const promptKeywords = this.extractKeywords(request.prompt);
          const processedDocs = this.processContext7Documentation(
            context7Result.docs,
            optimalLibraries[0] || 'generic',
            request.prompt,
            promptKeywords
          );
          
          // Apply smart truncation for final optimization
          context7Docs = this.smartTruncateContent(
            processedDocs,
            maxTokens,
            request.prompt
          );
          librariesResolved = context7Result.libraries;
          
          this.logger.debug('Context7 documentation retrieved successfully', {
            docsLength: context7Docs.length,
            librariesResolved: librariesResolved.length,
            docsPreview: context7Docs.substring(0, 200) + '...',
            context7Time: context7Time
          });
        } catch (error) {
          this.logger.warn('Context7 documentation failed, continuing without it', {
            detectedFrameworks: frameworkDetection.detectedFrameworks,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue without Context7 docs - graceful degradation
        }
      } else {
        if (promptComplexity.level === 'simple') {
          this.logger.debug('Simple prompt detected, skipping Context7 documentation');
        } else {
          this.logger.debug('No Context7 libraries detected, skipping documentation retrieval');
        }
      }

      // 4. Use smart context selection and prioritization
      this.logger.debug('Using smart context selection based on prompt relevance');
      const smartContext = await this.selectRelevantContext(
        request,
        frameworkDetection,
        promptComplexity
      );
      
      const { repoFacts, codeSnippets, frameworkDocs, projectDocs } = smartContext;

      // 5. Build enhanced prompt with dynamic framework detection results and complexity optimization
      const enhancedPrompt = this.buildEnhancedPrompt(
        request.prompt,
        {
          repoFacts,
          codeSnippets,
          context7Docs,
          qualityRequirements,
          frameworkDetection,
          frameworkDocs,
          projectDocs
        },
        promptComplexity
      );

      // 6. Validate enhanced prompt quality
      const qualityValidation = this.validateEnhancedPromptQuality(
        request.prompt,
        enhancedPrompt,
        {
          repoFacts,
          codeSnippets,
          context7Docs,
          qualityRequirements,
          frameworkDetection,
          frameworkDocs,
          projectDocs
        }
      );
      
      // Log quality validation results
      this.logQualityValidation(qualityValidation, request.prompt, enhancedPrompt);

      // Cache the enhanced prompt
      await this.promptCache.cachePrompt(
        request.prompt,
        enhancedPrompt,
        request.context,
        frameworkDetection,
        qualityValidation.qualityScore,
        Date.now() - startTime,
        promptComplexity.level
      );

      const responseTime = Date.now() - startTime;
      
      // Record successful request
      this.monitoring.recordRequest(
        'enhance',
        responseTime,
        frameworkDetection.detectedFrameworks[0] || 'unknown'
      );

      // Collect cache analytics
      await this.cacheAnalytics.collectAnalytics();

      const response: EnhancedContext7Response = {
        enhanced_prompt: enhancedPrompt,
        context_used: {
          repo_facts: Array.isArray(repoFacts) ? repoFacts : [],
          code_snippets: Array.isArray(codeSnippets) ? codeSnippets : [],
          context7_docs: context7Docs ? [context7Docs] : [],
          ...(optimizedOptions.includeMetadata && {
            metadata: {
              cache_hit: false, // Would be determined by cache service
              response_time: responseTime,
              libraries_resolved: librariesResolved,
              monitoring_metrics: this.monitoring.getMetrics(),
              complexity: promptComplexity
            }
          })
        },
        success: true
      };

      this.logger.info('Enhanced Context7 prompt completed successfully', {
        responseTime,
        context7DocsLength: context7Docs.length,
        librariesResolved: librariesResolved.length,
        enhancedPromptLength: enhancedPrompt.length,
        repoFactsCount: repoFacts.length,
        codeSnippetsCount: codeSnippets.length
      });
      
      // Debug logging for troubleshooting
      this.logger.debug('Enhanced prompt details', {
        originalPromptLength: request.prompt.length,
        enhancedPromptLength: enhancedPrompt.length,
        contextUsed: {
          repo_facts: repoFacts.length,
          code_snippets: codeSnippets.length,
          context7_docs: context7Docs ? 1 : 0
        },
        frameworkDetection: {
          detectedFrameworks: frameworkDetection.detectedFrameworks,
          confidence: frameworkDetection.confidence,
          detectionMethod: frameworkDetection.detectionMethod
        }
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed request
      this.monitoring.recordError(
        'enhance',
        error instanceof Error ? error : new Error('Unknown error'),
        responseTime
      );

      this.logger.error('Enhanced Context7 prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        prompt: request.prompt.substring(0, 100) + '...'
      });

      return {
        enhanced_prompt: request.prompt, // Fallback to original prompt
        context_used: {
          repo_facts: [],
          code_snippets: [],
          context7_docs: []
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Note: All framework detection methods and constants removed - now using Context7-based FrameworkDetectorService

  /**
   * Smart context selection and prioritization
   * Implements intelligent context selection based on prompt relevance and complexity
   */
  private async selectRelevantContext(
    request: EnhancedContext7Request,
    frameworkDetection: any,
    promptComplexity: { level: string; score: number; indicators: string[] }
  ): Promise<{
    repoFacts: string[];
    codeSnippets: string[];
    frameworkDocs: string[];
    projectDocs: string[];
    context7Docs: string;
  }> {
    const prompt = request.prompt.toLowerCase();
    const context: any = {
      repoFacts: [],
      codeSnippets: [],
      frameworkDocs: [],
      projectDocs: [],
      context7Docs: ''
    };

    // 1. Smart repository facts selection based on prompt relevance
    context.repoFacts = await this.selectRelevantRepoFacts(request, prompt);
    
    // 2. Smart code snippets selection based on framework and prompt type
    context.codeSnippets = await this.selectRelevantCodeSnippets(request, frameworkDetection, prompt);
    
    // 3. Smart framework docs selection based on detected frameworks and prompt context
    context.frameworkDocs = await this.selectRelevantFrameworkDocs(request, frameworkDetection, prompt);
    
    // 4. Smart project docs selection based on prompt relevance
    context.projectDocs = await this.selectRelevantProjectDocs(request, prompt);
    
    // 5. Context7 docs are handled separately in the main flow
    
    return context;
  }

  /**
   * Select relevant repository facts based on prompt analysis
   */
  private async selectRelevantRepoFacts(request: EnhancedContext7Request, prompt: string): Promise<string[]> {
    try {
      const allFacts = await this.gatherRepoFacts(request);
      const relevantFacts: string[] = [];
      
      // Prioritize facts based on prompt keywords
      const promptKeywords = this.extractKeywords(request.prompt);
      
      for (const fact of allFacts) {
        let relevanceScore = 0;
        
        // Score based on keyword matches
        for (const keyword of promptKeywords) {
          if (fact.toLowerCase().includes(keyword)) {
            relevanceScore += 2;
          }
        }
        
        // Boost score for specific prompt types
        if (prompt.includes('package') || prompt.includes('dependency')) {
          if (fact.includes('package.json') || fact.includes('dependencies')) {
            relevanceScore += 5;
          }
        }
        
        if (prompt.includes('typescript') || prompt.includes('tsconfig')) {
          if (fact.includes('TypeScript') || fact.includes('tsconfig')) {
            relevanceScore += 5;
          }
        }
        
        if (prompt.includes('react') || prompt.includes('component')) {
          if (fact.includes('React') || fact.includes('component')) {
            relevanceScore += 5;
          }
        }
        
        if (prompt.includes('next') || prompt.includes('full-stack')) {
          if (fact.includes('Next.js') || fact.includes('full-stack')) {
            relevanceScore += 5;
          }
        }
        
        // Only include facts with positive relevance score
        if (relevanceScore > 0) {
          relevantFacts.push(fact);
        }
      }
      
      // Sort by relevance and limit to top 5
      return relevantFacts
        .sort((a, b) => {
          const scoreA = this.calculateFactRelevanceScore(a, promptKeywords);
          const scoreB = this.calculateFactRelevanceScore(b, promptKeywords);
          return scoreB - scoreA;
        })
        .slice(0, 5);
        
    } catch (error) {
      this.logger.warn('Relevant repo facts selection failed', { error });
      return [];
    }
  }

  /**
   * Select relevant code snippets based on framework and prompt type
   */
  private async selectRelevantCodeSnippets(
    request: EnhancedContext7Request, 
    frameworkDetection: any, 
    prompt: string
  ): Promise<string[]> {
    try {
      const allSnippets = await this.gatherCodeSnippets(request);
      const relevantSnippets: string[] = [];
      
      const promptKeywords = this.extractKeywords(request.prompt);
      const detectedFrameworks = frameworkDetection.detectedFrameworks || [];
      
      for (const snippet of allSnippets) {
        let relevanceScore = 0;
        
        // Score based on framework relevance
        for (const framework of detectedFrameworks) {
          if (snippet.toLowerCase().includes(framework.toLowerCase())) {
            relevanceScore += 3;
          }
        }
        
        // Score based on prompt keywords
        for (const keyword of promptKeywords) {
          if (snippet.toLowerCase().includes(keyword)) {
            relevanceScore += 2;
          }
        }
        
        // Boost score for specific patterns
        if (prompt.includes('component') && snippet.includes('function') && snippet.includes('return')) {
          relevanceScore += 4;
        }
        
        if (prompt.includes('api') && snippet.includes('fetch') || snippet.includes('axios')) {
          relevanceScore += 4;
        }
        
        if (prompt.includes('style') && snippet.includes('className') || snippet.includes('css')) {
          relevanceScore += 4;
        }
        
        if (relevanceScore > 0) {
          relevantSnippets.push(snippet);
        }
      }
      
      // Sort by relevance and limit to top 3
      return relevantSnippets
        .sort((a, b) => {
          const scoreA = this.calculateSnippetRelevanceScore(a, promptKeywords, detectedFrameworks);
          const scoreB = this.calculateSnippetRelevanceScore(b, promptKeywords, detectedFrameworks);
          return scoreB - scoreA;
        })
        .slice(0, 3);
        
    } catch (error) {
      this.logger.warn('Relevant code snippets selection failed', { error });
      return [];
    }
  }

  /**
   * Select relevant framework documentation based on detected frameworks
   */
  private async selectRelevantFrameworkDocs(
    request: EnhancedContext7Request, 
    frameworkDetection: any, 
    prompt: string
  ): Promise<string[]> {
    try {
      const allFrameworkDocs = await this.gatherFrameworkDocs(request);
      const relevantDocs: string[] = [];
      
      const promptKeywords = this.extractKeywords(request.prompt);
      const detectedFrameworks = frameworkDetection.detectedFrameworks || [];
      
      for (const doc of allFrameworkDocs) {
        let relevanceScore = 0;
        
        // Score based on framework relevance
        for (const framework of detectedFrameworks) {
          if (doc.toLowerCase().includes(framework.toLowerCase())) {
            relevanceScore += 3;
          }
        }
        
        // Score based on prompt keywords
        for (const keyword of promptKeywords) {
          if (doc.toLowerCase().includes(keyword)) {
            relevanceScore += 2;
          }
        }
        
        // Boost score for practical content
        if (doc.includes('example') || doc.includes('usage') || doc.includes('```')) {
          relevanceScore += 2;
        }
        
        if (relevanceScore > 0) {
          relevantDocs.push(doc);
        }
      }
      
      // Sort by relevance and limit to top 3
      return relevantDocs
        .sort((a, b) => {
          const scoreA = this.calculateDocRelevanceScore(a, promptKeywords, detectedFrameworks);
          const scoreB = this.calculateDocRelevanceScore(b, promptKeywords, detectedFrameworks);
          return scoreB - scoreA;
        })
        .slice(0, 3);
        
    } catch (error) {
      this.logger.warn('Relevant framework docs selection failed', { error });
      return [];
    }
  }

  /**
   * Select relevant project documentation based on prompt analysis
   */
  private async selectRelevantProjectDocs(request: EnhancedContext7Request, prompt: string): Promise<string[]> {
    try {
      const allProjectDocs = await this.gatherProjectDocs(request);
      const relevantDocs: string[] = [];
      
      const promptKeywords = this.extractKeywords(request.prompt);
      
      for (const doc of allProjectDocs) {
        let relevanceScore = 0;
        
        // Score based on prompt keywords
        for (const keyword of promptKeywords) {
          if (doc.toLowerCase().includes(keyword)) {
            relevanceScore += 2;
          }
        }
        
        // Boost score for specific sections
        if (prompt.includes('setup') && doc.includes('installation')) {
          relevanceScore += 3;
        }
        
        if (prompt.includes('api') && doc.includes('API')) {
          relevanceScore += 3;
        }
        
        if (prompt.includes('config') && doc.includes('configuration')) {
          relevanceScore += 3;
        }
        
        if (relevanceScore > 0) {
          relevantDocs.push(doc);
        }
      }
      
      // Sort by relevance and limit to top 2
      return relevantDocs
        .sort((a, b) => {
          const scoreA = this.calculateDocRelevanceScore(a, promptKeywords, []);
          const scoreB = this.calculateDocRelevanceScore(b, promptKeywords, []);
          return scoreB - scoreA;
        })
        .slice(0, 2);
        
    } catch (error) {
      this.logger.warn('Relevant project docs selection failed', { error });
      return [];
    }
  }

  /**
   * Calculate relevance score for repository facts
   */
  private calculateFactRelevanceScore(fact: string, keywords: string[]): number {
    let score = 0;
    const factLower = fact.toLowerCase();
    
    for (const keyword of keywords) {
      if (factLower.includes(keyword)) {
        score += 2;
      }
    }
    
    return score;
  }

  /**
   * Calculate relevance score for code snippets
   */
  private calculateSnippetRelevanceScore(snippet: string, keywords: string[], frameworks: string[]): number {
    let score = 0;
    const snippetLower = snippet.toLowerCase();
    
    for (const keyword of keywords) {
      if (snippetLower.includes(keyword)) {
        score += 2;
      }
    }
    
    for (const framework of frameworks) {
      if (snippetLower.includes(framework.toLowerCase())) {
        score += 3;
      }
    }
    
    return score;
  }

  /**
   * Calculate relevance score for documentation
   */
  private calculateDocRelevanceScore(doc: string, keywords: string[], frameworks: string[]): number {
    let score = 0;
    const docLower = doc.toLowerCase();
    
    for (const keyword of keywords) {
      if (docLower.includes(keyword)) {
        score += 2;
      }
    }
    
    for (const framework of frameworks) {
      if (docLower.includes(framework.toLowerCase())) {
        score += 3;
      }
    }
    
    return score;
  }

  /**
   * Enhanced Context7 library selection based on prompt context
   * Implements intelligent library prioritization for better relevance
   */
  private async selectOptimalContext7Libraries(
    prompt: string,
    detectedFrameworks: string[],
    promptComplexity: { level: string; score: number; indicators: string[] }
  ): Promise<string[]> {
    const promptLower = prompt.toLowerCase();
    const promptKeywords = this.extractKeywords(prompt);
    
    // Get actual library IDs from Context7 API for each detected framework
    const actualLibraries: { id: string; name: string; score: number; topics: string[] }[] = [];
    
    for (const framework of detectedFrameworks) {
      try {
        const libraries = await this.realContext7.resolveLibraryId(framework);
        if (libraries && libraries.length > 0) {
          // Take the first (highest trust score) library for each framework
          const library = libraries[0];
          if (library) {
            actualLibraries.push({
              id: library.id,
              name: library.name,
              score: 0,
              topics: this.getTopicsForFramework(framework)
            });
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to resolve library for ${framework}`, { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    // If no frameworks detected, try common ones
    if (actualLibraries.length === 0) {
      const commonFrameworks = ['react', 'html', 'css', 'javascript'];
      for (const framework of commonFrameworks) {
        try {
          const libraries = await this.realContext7.resolveLibraryId(framework);
          if (libraries && libraries.length > 0) {
            const library = libraries[0];
            if (library) {
              actualLibraries.push({
                id: library.id,
                name: library.name,
                score: 0,
                topics: this.getTopicsForFramework(framework)
              });
              break; // Only take one fallback library
            }
          }
        } catch (error) {
          // Continue to next framework
        }
      }
    }
    
    // Calculate relevance scores for each actual library
    for (const library of actualLibraries) {
      let score = 0;
      
      // Base score for detected frameworks
      if (detectedFrameworks.some(fw => library.name.toLowerCase().includes(fw))) {
        score += 10;
      }
      
      // Score based on prompt keywords
      for (const keyword of promptKeywords) {
        if (library.topics.some(topic => topic.includes(keyword))) {
          score += 3;
        }
        if (promptLower.includes(keyword) && library.topics.some(topic => topic.includes(keyword))) {
          score += 5;
        }
      }
      
      // Score based on specific prompt patterns
      if (promptLower.includes('component') && library.name.toLowerCase().includes('react')) {
        score += 8;
      }
      
      if (promptLower.includes('api') && library.name.toLowerCase().includes('next')) {
        score += 8;
      }
      
      if (promptLower.includes('style') && (library.name.toLowerCase().includes('css') || library.name.toLowerCase().includes('html'))) {
        score += 8;
      }
      
      if (promptLower.includes('type') && library.name.toLowerCase().includes('typescript')) {
        score += 8;
      }
      
      library.score = score;
    }
    
    // Sort libraries by score and select top ones based on complexity
    const sortedLibraries = actualLibraries
      .filter(library => library.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Select libraries based on complexity
    let maxLibraries = 1;
    if (promptComplexity.level === 'medium') {
      maxLibraries = 2;
    } else if (promptComplexity.level === 'complex') {
      maxLibraries = 3;
    }
    
    const selectedLibraries = sortedLibraries
      .slice(0, maxLibraries)
      .map(library => library.id);
    
    this.logger.debug('Context7 library selection completed', {
      prompt: prompt.substring(0, 100),
      detectedFrameworks,
      selectedLibraries,
      libraryScores: sortedLibraries.map(lib => ({ name: lib.name, score: lib.score }))
    });
    
    return selectedLibraries;
  }

  /**
   * Get topics for a framework to help with scoring
   */
  private getTopicsForFramework(framework: string): string[] {
    const topicMap: Record<string, string[]> = {
      'html': ['elements', 'attributes', 'semantic', 'accessibility'],
      'css': ['styling', 'layout', 'flexbox', 'grid', 'animations'],
      'javascript': ['functions', 'objects', 'arrays', 'async', 'dom'],
      'react': ['components', 'hooks', 'state', 'props', 'jsx'],
      'nextjs': ['routing', 'api', 'ssr', 'ssg', 'middleware'],
      'typescript': ['types', 'interfaces', 'generics', 'enums'],
      'vue': ['components', 'directives', 'composition', 'reactivity'],
      'angular': ['components', 'services', 'dependency', 'injection'],
      'express': ['middleware', 'routing', 'api', 'sessions'],
      'nodejs': ['modules', 'fs', 'http', 'streams', 'events']
    };
    
    return topicMap[framework.toLowerCase()] || [];
  }

  /**
   * Enhanced Context7 documentation processing for better relevance
   * Implements intelligent content filtering and prioritization
   */
  private processContext7Documentation(
    docs: string,
    libraryId: string,
    prompt: string,
    promptKeywords: string[]
  ): string {
    if (!docs || docs.length === 0) return docs;
    
    // Split documentation into sections
    const sections = this.splitIntoSections(docs);
    const scoredSections = this.scoreSections(sections, promptKeywords);
    
    // Boost scores for specific content types based on library
    const enhancedSections = scoredSections.map(section => {
      let enhancedScore = section.score;
      
      // Boost scores for practical content
      if (section.content.includes('```') || section.content.includes('example')) {
        enhancedScore += 5;
      }
      
      // Boost scores for API references
      if (section.content.includes('function') || section.content.includes('method')) {
        enhancedScore += 3;
      }
      
      // Library-specific boosts
      if (libraryId.includes('react') && section.content.includes('component')) {
        enhancedScore += 4;
      }
      
      if (libraryId.includes('next') && section.content.includes('api')) {
        enhancedScore += 4;
      }
      
      if (libraryId.includes('html') && section.content.includes('element')) {
        enhancedScore += 4;
      }
      
      if (libraryId.includes('css') && section.content.includes('property')) {
        enhancedScore += 4;
      }
      
      return { ...section, score: enhancedScore };
    });
    
    // Select top sections and join them
    const topSections = enhancedSections
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Limit to top 5 sections
      .map(section => section.content);
    
    return topSections.join('\n\n');
  }

  /**
   * Analyze dependencies with intelligent relevance scoring
   */
  private async analyzeDependencies(
    deps: Record<string, string>, 
    prompt: string, 
    promptKeywords: string[]
  ): Promise<string[]> {
    const facts: string[] = [];
    
    // Define dependency categories with relevance patterns
    const depCategories = {
      'typescript': {
        deps: ['typescript', '@types/node', '@types/react'],
        patterns: ['type', 'typescript', 'ts', 'interface', 'enum'],
        fact: 'Uses TypeScript for type safety'
      },
      'react': {
        deps: ['react', 'react-dom', '@types/react'],
        patterns: ['react', 'component', 'jsx', 'hook', 'state'],
        fact: 'React-based application'
      },
      'nextjs': {
        deps: ['next', 'next-auth', 'next-seo'],
        patterns: ['next', 'nextjs', 'full-stack', 'ssr', 'ssg', 'api'],
        fact: 'Next.js full-stack framework'
      },
      'testing': {
        deps: ['jest', 'vitest', '@testing-library/react', 'cypress'],
        patterns: ['test', 'testing', 'spec', 'coverage'],
        fact: 'Comprehensive testing setup'
      },
      'styling': {
        deps: ['tailwindcss', 'styled-components', 'emotion', 'sass'],
        patterns: ['style', 'css', 'styling', 'design', 'ui', 'theme'],
        fact: 'Modern CSS framework'
      },
      'state': {
        deps: ['redux', 'zustand', 'jotai', 'recoil'],
        patterns: ['state', 'store', 'redux', 'context'],
        fact: 'State management solution'
      },
      'api': {
        deps: ['axios', 'fetch', 'graphql', 'apollo'],
        patterns: ['api', 'fetch', 'request', 'http', 'graphql'],
        fact: 'API integration tools'
      },
      'build': {
        deps: ['vite', 'webpack', 'rollup', 'esbuild'],
        patterns: ['build', 'bundle', 'deploy', 'production'],
        fact: 'Modern build tooling'
      },
      'quality': {
        deps: ['eslint', 'prettier', 'husky', 'lint-staged'],
        patterns: ['lint', 'format', 'quality', 'prettier', 'eslint'],
        fact: 'Code quality tools'
      }
    };
    
    // Analyze each category
    for (const [category, config] of Object.entries(depCategories)) {
      const hasDeps = config.deps.some(dep => deps[dep]);
      const hasPatterns = config.patterns.some(pattern => prompt.includes(pattern));
      const hasKeywords = config.patterns.some(pattern => 
        promptKeywords.some(keyword => keyword.includes(pattern))
      );
      
      if (hasDeps && (hasPatterns || hasKeywords)) {
        facts.push(config.fact);
        
        // Add specific version info for key dependencies
        const keyDep = config.deps.find(dep => deps[dep]);
        if (keyDep) {
          facts.push(`${keyDep}: ${deps[keyDep]}`);
        }
      }
    }
    
    return facts;
  }

  /**
   * Detect project type and architecture
   */
  private detectProjectType(deps: Record<string, string>, prompt: string): string | null {
    // Full-stack applications
    if (deps.next && (prompt.includes('full-stack') || prompt.includes('api'))) {
      return 'Full-stack Next.js application';
    }
    
    // Frontend applications
    if (deps.react && !deps.next) {
      if (prompt.includes('spa') || prompt.includes('single-page')) {
        return 'Single-page React application';
      }
      return 'React frontend application';
    }
    
    // Backend applications
    if (deps.express && !deps.react) {
      return 'Node.js backend application';
    }
    
    // Library/package
    if (prompt.includes('library') || prompt.includes('package') || prompt.includes('npm')) {
      return 'NPM package/library';
    }
    
    // Static site
    if (deps.vite && !deps.react && !deps.next) {
      return 'Static site generator';
    }
    
    return null;
  }

  /**
   * Analyze development workflow and tooling
   */
  private analyzeDevelopmentWorkflow(deps: Record<string, string>, prompt: string): string[] {
    const facts: string[] = [];
    
    // Development environment
    if (deps.nodemon && prompt.includes('development')) {
      facts.push('Uses nodemon for development auto-reload');
    }
    
    // Code quality workflow
    if (deps.husky && deps['lint-staged']) {
      facts.push('Pre-commit hooks with lint-staged');
    }
    
    // Testing workflow
    if (deps.jest && deps['@testing-library/react']) {
      facts.push('React Testing Library for component testing');
    }
    
    // Build and deployment
    if (deps.vite && deps.typescript) {
      facts.push('Vite + TypeScript development setup');
    }
    
    // Package management
    if (deps.npm && prompt.includes('package')) {
      facts.push('NPM package management');
    }
    
    return facts;
  }

  /**
   * Validate enhanced prompt quality and relevance
   * Implements comprehensive quality checks for enhanced prompts
   */
  private validateEnhancedPromptQuality(
    originalPrompt: string,
    enhancedPrompt: string,
    context: any
  ): {
    isValid: boolean;
    qualityScore: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let qualityScore = 100;
    
    // 1. Check if enhanced prompt contains original prompt
    if (!enhancedPrompt.includes(originalPrompt)) {
      issues.push('Enhanced prompt does not contain original prompt');
      qualityScore -= 20;
    }
    
    // 2. Check for relevant context sections
    const hasFrameworkDetection = enhancedPrompt.includes('Detected Framework') || 
                                 enhancedPrompt.includes('Frameworks/Libraries');
    if (!hasFrameworkDetection && context.frameworkDetection?.detectedFrameworks?.length > 0) {
      issues.push('Missing framework detection information');
      qualityScore -= 15;
    }
    
    // 3. Check for Context7 documentation
    const hasContext7Docs = enhancedPrompt.includes('Framework Best Practices (from Context7)');
    if (!hasContext7Docs && context.context7Docs) {
      issues.push('Missing Context7 documentation');
      qualityScore -= 10;
    }
    
    // 4. Check for repository context
    const hasRepoContext = enhancedPrompt.includes('Repository Context') || 
                          enhancedPrompt.includes('Project:');
    if (!hasRepoContext && context.repoFacts?.length > 0) {
      issues.push('Missing repository context');
      qualityScore -= 10;
    }
    
    // 5. Check for code examples
    const hasCodeExamples = enhancedPrompt.includes('```') || 
                           enhancedPrompt.includes('Existing Code Patterns');
    if (!hasCodeExamples && context.codeSnippets?.length > 0) {
      issues.push('Missing code examples');
      qualityScore -= 10;
    }
    
    // 6. Check for quality requirements
    const hasQualityRequirements = enhancedPrompt.includes('Quality Requirements') ||
                                  enhancedPrompt.includes('Best Practices');
    if (!hasQualityRequirements && context.qualityRequirements?.length > 0) {
      issues.push('Missing quality requirements');
      qualityScore -= 10;
    }
    
    // 7. Check for proper structure
    const sectionCount = (enhancedPrompt.match(/## /g) || []).length;
    if (sectionCount < 2) {
      issues.push('Enhanced prompt lacks proper structure');
      qualityScore -= 15;
    }
    
    // 8. Check for token efficiency
    const tokenCount = Math.ceil(enhancedPrompt.length / 4);
    const originalTokenCount = Math.ceil(originalPrompt.length / 4);
    const expansionRatio = tokenCount / originalTokenCount;
    
    if (expansionRatio < 1.5) {
      suggestions.push('Consider adding more context for better enhancement');
    } else if (expansionRatio > 5) {
      issues.push('Enhanced prompt is too verbose');
      qualityScore -= 10;
    }
    
    // 9. Check for relevance
    const originalKeywords = this.extractKeywords(originalPrompt);
    const enhancedKeywords = this.extractKeywords(enhancedPrompt);
    const keywordOverlap = originalKeywords.filter(keyword => 
      enhancedKeywords.some(enhanced => enhanced.includes(keyword))
    ).length;
    
    if (keywordOverlap < originalKeywords.length * 0.3) {
      issues.push('Enhanced prompt lacks relevance to original prompt');
      qualityScore -= 20;
    }
    
    // 10. Check for completeness
    if (enhancedPrompt.length < originalPrompt.length * 1.2) {
      issues.push('Enhanced prompt is not sufficiently enhanced');
      qualityScore -= 15;
    }
    
    // Generate suggestions based on issues
    if (issues.length > 0) {
      suggestions.push('Review and fix the identified quality issues');
    }
    
    if (qualityScore < 70) {
      suggestions.push('Consider regenerating the enhanced prompt');
    }
    
    if (tokenCount > 2000) {
      suggestions.push('Consider reducing token usage for better efficiency');
    }
    
    return {
      isValid: issues.length === 0 && qualityScore >= 70,
      qualityScore: Math.max(0, qualityScore),
      issues,
      suggestions
    };
  }

  /**
   * Log quality validation results for monitoring
   */
  private logQualityValidation(
    validation: { isValid: boolean; qualityScore: number; issues: string[]; suggestions: string[] },
    originalPrompt: string,
    enhancedPrompt: string
  ): void {
    this.logger.debug('Enhanced prompt quality validation', {
      isValid: validation.isValid,
      qualityScore: validation.qualityScore,
      issuesCount: validation.issues.length,
      suggestionsCount: validation.suggestions.length,
      originalLength: originalPrompt.length,
      enhancedLength: enhancedPrompt.length,
      expansionRatio: (enhancedPrompt.length / originalPrompt.length).toFixed(2),
      issues: validation.issues,
      suggestions: validation.suggestions
    });
    
    if (!validation.isValid) {
      this.logger.warn('Enhanced prompt quality validation failed', {
        qualityScore: validation.qualityScore,
        issues: validation.issues
      });
    }
  }

  /**
   * Smart content truncation based on relevance and token limits
   * Implements intelligent content prioritization for token efficiency
   */
  private smartTruncateContent(content: string, maxTokens: number, prompt: string): string {
    if (!content || content.length === 0) return content;
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = this.countTokens(content);
    
    if (estimatedTokens <= maxTokens) {
      this.logTokenUsage('smart_truncate', content, maxTokens, prompt);
      return content;
    }
    
    // Extract key sections based on prompt relevance
    const promptKeywords = this.extractKeywords(prompt);
    const sections = this.splitIntoSections(content);
    const scoredSections = this.scoreSections(sections, promptKeywords);
    
    // Select highest scoring sections within token limit
    const selectedSections = this.selectSectionsWithinLimit(scoredSections, maxTokens);
    const result = selectedSections.join('\n\n');
    
    // Log token usage for monitoring
    this.logTokenUsage('smart_truncate', result, maxTokens, prompt);
    
    return result;
  }

  /**
   * Extract keywords from prompt for relevance scoring
   */
  private extractKeywords(prompt: string): string[] {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'or', 'but', 'for', 'with', 'from', 'this', 'that', 'these', 'those'].includes(word));
    
    // Remove duplicates and return
    return [...new Set(words)];
  }

  /**
   * Split content into logical sections
   */
  private splitIntoSections(content: string): string[] {
    // Split by common section markers
    const sectionMarkers = [
      /\n## /g,
      /\n### /g,
      /\n#### /g,
      /\n- /g,
      /\n\* /g,
      /\n\d+\. /g
    ];
    
    let sections = [content];
    
    for (const marker of sectionMarkers) {
      const newSections: string[] = [];
      for (const section of sections) {
        const parts = section.split(marker);
        if (parts.length > 1) {
          newSections.push(...parts.filter(part => part.trim().length > 0));
        } else {
          newSections.push(section);
        }
      }
      sections = newSections;
    }
    
    return sections.filter(section => section.trim().length > 0);
  }

  /**
   * Score sections based on keyword relevance
   */
  private scoreSections(sections: string[], keywords: string[]): Array<{ content: string; score: number; tokens: number }> {
    return sections.map(section => {
      const sectionLower = section.toLowerCase();
      let score = 0;
      
      // Score based on keyword matches
      for (const keyword of keywords) {
        const matches = (sectionLower.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 2; // Weight keyword matches
      }
      
      // Boost score for code examples and practical content
      if (section.includes('```') || section.includes('example') || section.includes('usage')) {
        score += 5;
      }
      
      // Boost score for API references and methods
      if (section.includes('function') || section.includes('method') || section.includes('API')) {
        score += 3;
      }
      
      // Boost score for configuration and setup
      if (section.includes('config') || section.includes('setup') || section.includes('install')) {
        score += 2;
      }
      
      const tokens = Math.ceil(section.length / 4);
      
      return { content: section, score, tokens };
    });
  }

  /**
   * Select sections within token limit, prioritizing highest scores
   */
  private selectSectionsWithinLimit(scoredSections: Array<{ content: string; score: number; tokens: number }>, maxTokens: number): string[] {
    // Sort by score (descending)
    const sorted = scoredSections.sort((a, b) => b.score - a.score);
    
    const selected: string[] = [];
    let usedTokens = 0;
    
    for (const section of sorted) {
      if (usedTokens + section.tokens <= maxTokens) {
        selected.push(section.content);
        usedTokens += section.tokens;
      } else {
        // Try to fit partial content if it's the first section
        if (selected.length === 0 && section.tokens > 0) {
          const remainingTokens = maxTokens - usedTokens;
          const partialContent = this.truncateToTokens(section.content, remainingTokens);
          if (partialContent.length > 0) {
            selected.push(partialContent + '...');
          }
        }
        break;
      }
    }
    
    return selected;
  }

  /**
   * Truncate content to specific token count
   */
  private truncateToTokens(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 4; // Rough approximation
    if (content.length <= maxChars) return content;
    
    // Try to truncate at sentence boundaries
    const truncated = content.substring(0, maxChars);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > maxChars * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    }
    
    return truncated;
  }

  /**
   * Count tokens in content (rough approximation)
   */
  private countTokens(content: string): number {
    if (!content) return 0;
    return Math.ceil(content.length / 4); // Rough approximation: 1 token ≈ 4 characters
  }

  /**
   * Log token usage for monitoring and optimization
   */
  private logTokenUsage(
    section: string, 
    content: string, 
    limit: number, 
    prompt: string
  ): void {
    const actualTokens = this.countTokens(content);
    const efficiency = limit > 0 ? (actualTokens / limit) * 100 : 0;
    
    this.logger.debug('Token usage analysis', {
      section,
      actualTokens,
      limit,
      efficiency: efficiency.toFixed(1) + '%',
      promptLength: prompt.length,
      contentLength: content.length,
      isOverLimit: actualTokens > limit
    });
  }

  /**
   * Get Context7 documentation for multiple frameworks
   * Implements dynamic framework documentation retrieval
   */
  private async getContext7DocumentationForFrameworks(
    context7Libraries: string[],
    prompt: string,
    maxTokens: number
  ): Promise<{ docs: string; libraries: string[] }> {
    try {
      const allDocs: string[] = [];
      const successfulLibraries: string[] = [];
      
      // Process libraries in parallel for better performance
      const docPromises = context7Libraries.map(async (libraryId) => {
        try {
          const docsResult = await this.realContext7.getLibraryDocumentation(
            libraryId,
            this.extractTopicFromPrompt(prompt),
            Math.floor(maxTokens / context7Libraries.length) // Distribute tokens evenly
          );

          if (docsResult && docsResult.content) {
            return {
              libraryId,
              docs: docsResult.content
            };
          }
          return null;
        } catch (error) {
          this.logger.warn(`Failed to get docs for ${libraryId}`, { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          return null;
        }
      });
      
      const results = await Promise.all(docPromises);
      
      for (const result of results) {
        if (result && result.docs) {
          allDocs.push(`## ${result.libraryId} Documentation:\n${result.docs}`);
          successfulLibraries.push(result.libraryId);
        }
      }
      
      this.logger.info('Context7 documentation retrieved successfully', {
        requestedLibraries: context7Libraries.length,
        successfulLibraries: successfulLibraries.length,
        totalDocsLength: allDocs.join('\n\n').length
      });
      
      return {
        docs: allDocs.join('\n\n'),
        libraries: successfulLibraries
      };

    } catch (error) {
      this.logger.error('Context7 documentation retrieval failed', {
        libraries: context7Libraries,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get Context7 documentation with caching and MCP compliance
   * Implements comprehensive Context7 integration
   */
  private async getContext7Documentation(
    framework: string,
    prompt: string,
    maxTokens: number
  ): Promise<{ docs: string; libraries: string[] }> {
    try {
      // 1. Resolve library ID using MCP compliance
      const resolveResult = await this.mcpCompliance.executeToolCall('resolve-library-id', {
        libraryName: framework
      });

      if (!resolveResult.success || !resolveResult.data || resolveResult.data.length === 0) {
        throw new Error(`Failed to resolve library ID for ${framework}`);
      }

      const libraries = resolveResult.data;
      const bestLibrary = libraries[0]; // Use first (highest trust score)
      
      // 2. Extract topic from prompt
      const topic = this.extractTopicFromPrompt(prompt);
      
      // 3. Check cache first
      let docs = '';
      let cacheHit = false;
      
      if (this.cache) {
        const cachedDocs = await this.cache.getCachedDocumentation(
          bestLibrary.id,
          topic,
          maxTokens
        );
        
        if (cachedDocs) {
          docs = cachedDocs;
          cacheHit = true;
          this.logger.debug('Context7 docs retrieved from cache', {
            framework,
            topic,
            libraryId: bestLibrary.id
          });
        }
      }
      
      // 4. Get fresh documentation if not cached
      if (!docs) {
        const docsResult = await this.mcpCompliance.executeToolCall('get-library-docs', {
          context7CompatibleLibraryID: bestLibrary.id,
          topic,
          tokens: maxTokens
        });

        if (!docsResult.success || !docsResult.data) {
          throw new Error(`Failed to get documentation for ${framework}`);
        }

        docs = docsResult.data.content || '';
        
        // Cache the result
        if (this.cache && docs) {
          await this.cache.setCachedDocumentation(
            bestLibrary.id,
            topic,
            maxTokens,
            docs
          );
        }
      }

      return {
        docs,
        libraries: libraries.map((lib: any) => lib.id)
      };

    } catch (error) {
      this.logger.error('Context7 documentation retrieval failed', {
        framework,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Extract topic from prompt for Context7 queries
   * Implements intelligent topic extraction
   */
  private extractTopicFromPrompt(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    
    // Topic mapping based on common patterns
    const topicMap = {
      'component': 'components',
      'routing': 'routing',
      'route': 'routing',
      'auth': 'authentication',
      'login': 'authentication',
      'api': 'api',
      'endpoint': 'api',
      'styling': 'styling',
      'css': 'styling',
      'test': 'testing',
      'testing': 'testing',
      'error': 'error handling',
      'exception': 'error handling',
      'performance': 'performance',
      'optimization': 'performance',
      'security': 'security',
      'deployment': 'deployment',
      'docker': 'deployment',
      'database': 'database',
      'db': 'database',
      'migration': 'database',
      'hook': 'hooks',
      'lifecycle': 'lifecycle',
      'state': 'state management',
      'redux': 'state management',
      'context': 'state management'
    };
    
    for (const [keyword, topic] of Object.entries(topicMap)) {
      if (promptLower.includes(keyword)) {
        return topic;
      }
    }
    
    return 'best practices';
  }

  /**
   * Enhanced repository facts gathering with intelligent dependency analysis
   * Implements advanced project analysis with better relevance filtering
   */
  private async gatherRepoFacts(request: EnhancedContext7Request): Promise<string[]> {
    try {
      const facts: string[] = [];
      const prompt = request.prompt.toLowerCase();
      const promptKeywords = this.extractKeywords(request.prompt);
      
      // Check for package.json
      const packageJson = await this.readJsonFile('package.json');
      if (packageJson) {
        facts.push(`Project name: ${packageJson.name || 'Unknown'}`);
        facts.push(`Node.js version: ${packageJson.engines?.node || 'Not specified'}`);
        
        // Enhanced dependency analysis with relevance scoring
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const depFacts = await this.analyzeDependencies(deps, prompt, promptKeywords);
        facts.push(...depFacts);
        
        // Analyze project type and architecture
        const projectType = this.detectProjectType(deps, prompt);
        if (projectType) {
          facts.push(projectType);
        }
        
        // Analyze development workflow
        const workflowFacts = this.analyzeDevelopmentWorkflow(deps, prompt);
        facts.push(...workflowFacts);
      }
      
      // Check for TypeScript configuration - only if prompt mentions TypeScript
      if (prompt.includes('typescript') || prompt.includes('ts') || prompt.includes('type')) {
        const tsConfig = await this.readJsonFile('tsconfig.json');
        if (tsConfig) {
          facts.push(`TypeScript target: ${tsConfig.compilerOptions?.target || 'ES5'}`);
          if (tsConfig.compilerOptions?.strict) facts.push('Uses strict TypeScript mode');
        }
      }
      
      // Check for framework-specific config files - only if relevant to prompt
      if (prompt.includes('next') || prompt.includes('full-stack')) {
        if (await this.fileExists('next.config.js') || await this.fileExists('next.config.ts')) {
          facts.push('Uses Next.js framework');
        }
      }
      
      if (prompt.includes('build') || prompt.includes('deploy') || prompt.includes('production')) {
        if (await this.fileExists('vite.config.js') || await this.fileExists('vite.config.ts')) {
          facts.push('Uses Vite build tool');
        }
        if (await this.fileExists('webpack.config.js') || await this.fileExists('webpack.config.ts')) {
          facts.push('Uses Webpack bundler');
        }
      }
      
      if (prompt.includes('test') || prompt.includes('testing')) {
        if (await this.fileExists('jest.config.js') || await this.fileExists('jest.config.ts')) {
          facts.push('Uses Jest testing framework');
        }
        if (await this.fileExists('vitest.config.ts')) {
          facts.push('Uses Vitest testing framework');
        }
      }
      
      if (prompt.includes('lint') || prompt.includes('format') || prompt.includes('quality')) {
        if (await this.fileExists('.eslintrc.js') || await this.fileExists('.eslintrc.json')) {
          facts.push('Uses ESLint for code quality');
        }
        if (await this.fileExists('.prettierrc') || await this.fileExists('.prettierrc.json')) {
          facts.push('Uses Prettier for code formatting');
        }
      }
      
      if (prompt.includes('docker') || prompt.includes('container') || prompt.includes('deploy')) {
        if (await this.fileExists('Dockerfile')) {
          facts.push('Uses Docker for containerization');
        }
        if (await this.fileExists('docker-compose.yml')) {
          facts.push('Uses Docker Compose for orchestration');
        }
      }
      
      // If no facts found, return fallback
      if (facts.length === 0) {
        facts.push('Project structure analysis not available');
        facts.push('Using default TypeScript patterns');
      }
      
      this.logger.debug('Repository facts gathered successfully', {
        factsCount: facts.length,
        facts: facts.slice(0, 3) // Log first 3 facts for debugging
      });
      
      return facts;
      
    } catch (error) {
      this.logger.warn('Repository facts gathering failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return this.getFallbackRepoFacts();
    }
  }

  /**
   * Reads and parses a JSON file safely
   * Implements proper error handling for file operations
   */
  private async readJsonFile(filePath: string): Promise<any> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      this.logger.warn(`Failed to read JSON file: ${filePath}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Checks if a file exists
   * Implements proper error handling for file system operations
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.access(filePath);
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return false; // File doesn't exist
      }
      this.logger.warn(`Failed to check file existence: ${filePath}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Returns minimal repository facts for simple prompts
   * Uses real project data without heavy analysis
   */
  private async getMinimalRepoFacts(): Promise<string[]> {
    try {
      const facts: string[] = [];
      
      // Get basic project info from package.json if available
      try {
        const packageJsonPath = 'package.json';
        if (await this.fileExists(packageJsonPath)) {
          const packageContent = await import('fs/promises').then(fs => 
            fs.readFile(packageJsonPath, 'utf-8')
          );
          const packageData = JSON.parse(packageContent);
          
          if (packageData.name) {
            facts.push(`Project name: ${packageData.name}`);
          }
          if (packageData.engines?.node) {
            facts.push(`Node.js version: ${packageData.engines.node}`);
          }
          if (packageData.devDependencies?.typescript || packageData.dependencies?.typescript) {
            facts.push('Uses TypeScript for type safety');
          }
        }
      } catch (error) {
        this.logger.debug('Could not read package.json for minimal facts', { error: (error as Error).message });
      }
      
      // If no facts found, use minimal fallback
      if (facts.length === 0) {
        facts.push('TypeScript project');
      }
      
      return facts;
      
    } catch (error) {
      this.logger.warn('Minimal repo facts gathering failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return ['TypeScript project'];
    }
  }

  /**
   * Returns fallback repository facts when analysis fails
   */
  private getFallbackRepoFacts(): string[] {
    return [
      'Project uses TypeScript for type safety',
      'Follows modern JavaScript/TypeScript patterns',
      'Implements proper error handling'
    ];
  }

  /**
   * Gather code snippets from actual project analysis
   * Implements AST parsing and pattern extraction
   */
  private async gatherCodeSnippets(request: EnhancedContext7Request): Promise<string[]> {
    try {
      // Use Context7-only approach for code snippets
      this.logger.debug('Using Context7-only code snippets for better quality');
      return await this.getContext7CodeSnippets(request);
      
    } catch (error) {
      this.logger.warn('Context7 code snippets extraction failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return this.getFallbackCodeSnippets();
    }
  }

  /**
   * Finds source files matching the given patterns
   * Implements glob pattern matching with proper error handling
   */
  private async findSourceFiles(patterns: string[]): Promise<string[]> {
    try {
      const { glob } = await import('glob');
      const allFiles: string[] = [];
      
      for (const pattern of patterns) {
        const files = await glob(pattern, { cwd: process.cwd() });
        allFiles.push(...files);
      }
      
      return allFiles;
    } catch (error) {
      this.logger.warn('Failed to find source files', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patterns
      });
      return [];
    }
  }

  /**
   * Reads a file safely
   * Implements proper error handling for file operations
   */
  private async readFile(filePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Extracts patterns from code content
   * Implements simple pattern matching without AST parsing for now
   */
  private extractPatternsFromCode(content: string, filePath: string): string[] {
    const patterns: string[] = [];
    const lines = content.split('\n');
    
    // Extract try-catch patterns
    const tryCatchPatterns = this.extractTryCatchPatterns(lines);
    patterns.push(...tryCatchPatterns);
    
    // Extract async/await patterns
    const asyncPatterns = this.extractAsyncPatterns(lines);
    patterns.push(...asyncPatterns);
    
    // Extract React patterns if it's a React file
    if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
      const reactPatterns = this.extractReactPatterns(lines);
      patterns.push(...reactPatterns);
    }
    
    // Extract function patterns
    const functionPatterns = this.extractFunctionPatterns(lines);
    patterns.push(...functionPatterns);
    
    return patterns;
  }

  /**
   * Extracts try-catch patterns from code lines
   */
  private extractTryCatchPatterns(lines: string[]): string[] {
    const patterns: string[] = [];
    let inTryBlock = false;
    let tryLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      if (line.startsWith('try') && line.includes('{')) {
        inTryBlock = true;
        tryLines = [line];
      } else if (inTryBlock) {
        tryLines.push(line);
        
        if (line.includes('} catch') || line.includes('catch (')) {
          // Found catch block, continue until closing brace
          let braceCount = 1;
          for (let j = i + 1; j < lines.length && braceCount > 0; j++) {
            tryLines.push(lines[j] || '');
            braceCount += (lines[j]?.match(/\{/g) || []).length;
            braceCount -= (lines[j]?.match(/\}/g) || []).length;
            i = j;
          }
          
          if (tryLines.length > 2) {
            patterns.push(tryLines.join('\n'));
          }
          inTryBlock = false;
          tryLines = [];
        }
      }
    }
    
    return patterns;
  }

  /**
   * Extracts async/await patterns from code lines
   */
  private extractAsyncPatterns(lines: string[]): string[] {
    const patterns: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      if (line.includes('async') && line.includes('await')) {
        // Found async function with await, collect the function
        const functionLines: string[] = [];
        let braceCount = 0;
        let foundOpeningBrace = false;
        
        for (let j = i; j < lines.length && (braceCount > 0 || !foundOpeningBrace); j++) {
          functionLines.push(lines[j] || '');
          
          if (lines[j]?.includes('{')) {
            foundOpeningBrace = true;
            braceCount++;
          } else if (foundOpeningBrace) {
            braceCount += (lines[j]?.match(/\{/g) || []).length;
            braceCount -= (lines[j]?.match(/\}/g) || []).length;
          }
          
          if (foundOpeningBrace && braceCount === 0) {
            break;
          }
        }
        
        if (functionLines.length > 1) {
          patterns.push(functionLines.join('\n'));
        }
      }
    }
    
    return patterns;
  }

  /**
   * Extracts React patterns from code lines
   */
  private extractReactPatterns(lines: string[]): string[] {
    const patterns: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      // Look for React hooks
      if (line.includes('useState') || line.includes('useEffect') || line.includes('useCallback')) {
        const hookLines: string[] = [];
        let braceCount = 0;
        let foundOpeningBrace = false;
        
        for (let j = i; j < lines.length && (braceCount > 0 || !foundOpeningBrace); j++) {
          hookLines.push(lines[j] || '');
          
          if (lines[j]?.includes('{')) {
            foundOpeningBrace = true;
            braceCount++;
          } else if (foundOpeningBrace) {
            braceCount += (lines[j]?.match(/\{/g) || []).length;
            braceCount -= (lines[j]?.match(/\}/g) || []).length;
          }
          
          if (foundOpeningBrace && braceCount === 0) {
            break;
          }
        }
        
        if (hookLines.length > 1) {
          patterns.push(hookLines.join('\n'));
        }
      }
    }
    
    return patterns;
  }

  /**
   * Extracts function patterns from code lines
   */
  private extractFunctionPatterns(lines: string[]): string[] {
    const patterns: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      if (line.startsWith('function ') || line.startsWith('const ') && line.includes('=') && line.includes('(')) {
        const functionLines: string[] = [];
        let braceCount = 0;
        let foundOpeningBrace = false;
        
        for (let j = i; j < lines.length && (braceCount > 0 || !foundOpeningBrace); j++) {
          functionLines.push(lines[j] || '');
          
          if (lines[j]?.includes('{')) {
            foundOpeningBrace = true;
            braceCount++;
          } else if (foundOpeningBrace) {
            braceCount += (lines[j]?.match(/\{/g) || []).length;
            braceCount -= (lines[j]?.match(/\}/g) || []).length;
          }
          
          if (foundOpeningBrace && braceCount === 0) {
            break;
          }
        }
        
        if (functionLines.length > 2) {
          patterns.push(functionLines.join('\n'));
        }
      }
    }
    
    return patterns;
  }

  /**
   * Ranks patterns by relevance to the prompt
   */
  private rankPatternsByRelevance(patterns: string[], prompt: string): string[] {
    const promptLower = prompt.toLowerCase();
    
    return patterns.sort((a, b) => {
      const aRelevance = this.calculateRelevance(a, promptLower);
      const bRelevance = this.calculateRelevance(b, promptLower);
      return bRelevance - aRelevance;
    });
  }

  /**
   * Calculates relevance score for a pattern
   */
  private calculateRelevance(pattern: string, promptLower: string): number {
    let score = 0;
    const patternLower = pattern.toLowerCase();
    
    // Check for keyword matches
    if (promptLower.includes('error') && patternLower.includes('try')) score += 10;
    if (promptLower.includes('async') && patternLower.includes('await')) score += 10;
    if (promptLower.includes('react') && patternLower.includes('use')) score += 10;
    if (promptLower.includes('function') && patternLower.includes('function')) score += 5;
    
    // Check for common patterns
    if (patternLower.includes('error')) score += 5;
    if (patternLower.includes('async')) score += 5;
    if (patternLower.includes('await')) score += 5;
    
    return score;
  }

  /**
   * Get Context7-based code snippets from documentation
   */
  private async getContext7CodeSnippets(request: EnhancedContext7Request): Promise<string[]> {
    try {
      // Detect primary framework from prompt
      const framework = this.detectPrimaryFramework(request.prompt);
      const complexity = this.analyzePromptComplexity(request.prompt).level;
      
      this.logger.debug('Using Context7 code snippets', { framework, complexity, prompt: request.prompt.substring(0, 50) });
      
      // Get Context7 documentation for the framework
      const libraryId = await this.resolveContext7LibraryId(framework);
      const context7Doc = await this.realContext7.getLibraryDocumentation(libraryId, request.prompt, 1000);
      
      // Extract code examples from Context7 documentation
      const snippets = this.realContext7.extractCodeExamples(context7Doc.content, libraryId);
      
      this.logger.debug('Context7 snippets generated', { snippetsCount: snippets.length, snippets: snippets.slice(0, 2) });
      
      return snippets;
    } catch (error) {
      this.logger.warn('Context7 snippets failed, using fallback', { error });
      return this.getFallbackCodeSnippets();
    }
  }

  /**
   * Detect primary framework from prompt for template selection
   */
  private detectPrimaryFramework(prompt: string): string {
    const lower = prompt.toLowerCase();
    
    if (lower.includes('html') || lower.includes('button') || lower.includes('element')) {
      return 'html';
    }
    if (lower.includes('react') || lower.includes('component') || lower.includes('jsx')) {
      return 'react';
    }
    if (lower.includes('next') || lower.includes('nextjs') || lower.includes('full-stack')) {
      return 'nextjs';
    }
    if (lower.includes('typescript') || lower.includes('ts ') || lower.includes('type ')) {
      return 'typescript';
    }
    
    return 'generic';
  }

  /**
   * Calculate optimal token limit based on complexity, framework, and prompt
   */
  private calculateOptimalTokenLimit(complexity: string, framework: string, prompt: string): number {
    // Reduced base tokens by 20% for better efficiency
    const baseTokens = {
      'simple': 240,    // was 300, now 240 (20% reduction)
      'medium': 640,    // was 800, now 640 (20% reduction)
      'complex': 1600   // was 2000, now 1600 (20% reduction)
    };
    
    // Adjust based on framework type
    const frameworkMultipliers: Record<string, number> = {
      'html': 0.8,      // HTML is simpler, needs fewer tokens
      'css': 0.8,       // CSS is simpler, needs fewer tokens
      'javascript': 1.0, // JavaScript is standard
      'react': 1.2,     // React needs more context
      'nextjs': 1.5,    // Next.js is complex, needs more context
      'typescript': 1.1, // TypeScript needs slightly more context
      'vue': 1.2,       // Vue needs more context
      'angular': 1.3,   // Angular is complex
      'express': 1.1,   // Express needs some context
      'nodejs': 1.0,    // Node.js is standard
      'generic': 1.0    // Generic multiplier
    };
    
    // Adjust based on prompt length and complexity
    const promptLength = prompt.length;
    let promptMultiplier = 1.0;
    
    if (promptLength < 50) {
      promptMultiplier = 0.8; // Short prompts need less context
    } else if (promptLength > 200) {
      promptMultiplier = 1.2; // Long prompts might need more context
    }
    
    // Calculate final token limit
        const baseLimit = baseTokens[complexity as keyof typeof baseTokens] || 800;
    const frameworkMultiplier = frameworkMultipliers[framework] || 1.0;
    const adjustedLimit = Math.floor(baseLimit * frameworkMultiplier * promptMultiplier);
    
    // Cap at reasonable limits (reduced by 20%)
    const maxLimit = complexity === 'simple' ? 400 : complexity === 'medium' ? 1200 : 2400;
    const finalLimit = Math.min(adjustedLimit, maxLimit);
    
    this.logger.debug('Token limit calculated', {
      complexity,
      framework,
      promptLength,
      baseLimit,
      frameworkMultiplier,
      promptMultiplier,
      finalLimit
    });
    
    return finalLimit;
  }

  /**
   * Filter Context7 content based on complexity and relevance
   */
  private filterContext7Content(content: string, prompt: string, complexity: string, framework: string): string {
    try {
      // Apply relevance filtering first
      let filteredContent = this.realContext7.filterByRelevance(content, prompt);
      
      // Apply complexity-based filtering
      const lines = filteredContent.split('\n');
      let maxLines: number;
      
      switch (complexity) {
        case 'simple':
          maxLines = 20; // Very minimal for simple prompts
          break;
        case 'medium':
          maxLines = 50; // Moderate for medium prompts
          break;
        case 'complex':
          maxLines = 100; // More content for complex prompts
          break;
        default:
          maxLines = 50;
      }
      
      // Truncate to max lines
      const truncatedLines = lines.slice(0, maxLines);
      filteredContent = truncatedLines.join('\n');
      
      // Apply framework-specific filtering
      if (framework !== 'generic') {
        const frameworkInfo = this.realContext7.extractFrameworkSpecificInfo(filteredContent, framework);
        if (frameworkInfo.length > 0) {
          // Add framework-specific information as a summary
          filteredContent += `\n\n## Framework-Specific Information:\n${frameworkInfo.slice(0, 5).join('\n')}`;
        }
      }
      
      this.logger.debug('Context7 content filtered', {
        originalLength: content.length,
        filteredLength: filteredContent.length,
        complexity,
        framework
      });
      
      return filteredContent;
    } catch (error) {
      this.logger.warn('Context7 content filtering failed, using original content', { error });
      return content;
    }
  }

  /**
   * Resolve framework to Context7 library ID
   */
  private async resolveContext7LibraryId(framework: string): Promise<string> {
    const libraryMap: Record<string, string> = {
      'html': '/mdn/html',
      'css': '/mdn/css',
      'javascript': '/mdn/javascript',
      'react': '/facebook/react',
      'nextjs': '/vercel/next.js',
      'typescript': '/microsoft/typescript',
      'vue': '/vuejs/vue',
      'angular': '/angular/angular',
      'express': '/expressjs/express',
      'nodejs': '/nodejs/node'
    };
    
    return libraryMap[framework] || '/microsoft/typescript';
  }


  /**
   * Returns fallback code snippets when extraction fails
   */
  private getFallbackCodeSnippets(): string[] {
    return [
      '// Example: Proper error handling pattern',
      'try {',
      '  const result = await someAsyncOperation();',
      '  return result;',
      '} catch (error) {',
      '  logger.error("Operation failed", { error });',
      '  throw error;',
      '}'
    ];
  }


  /**
   * Generates framework-specific documentation based on detected framework
   * Implements comprehensive framework documentation patterns
   */
  private generateFrameworkDocumentation(framework: string): string[] {
    const docs: string[] = [];
    
    switch (framework.toLowerCase()) {
      case 'react':
        docs.push(
          'React Best Practices:',
          '- Use functional components with hooks',
          '- Implement proper error boundaries',
          '- Use React.memo for performance optimization',
          '- Follow the rules of hooks',
          '- Use TypeScript for type safety',
          '- Implement proper state management',
          '- Use proper key props for lists'
        );
        break;
        
      case 'typescript':
        docs.push(
          'TypeScript Best Practices:',
          '- Use strict mode configuration',
          '- Define proper interfaces and types',
          '- Avoid any type when possible',
          '- Use proper error handling patterns',
          '- Implement proper async/await patterns',
          '- Use generic types for reusable code',
          '- Follow naming conventions'
        );
        break;
        
      case 'nodejs':
      case 'node':
        docs.push(
          'Node.js Best Practices:',
          '- Use proper error handling with try-catch',
          '- Implement proper logging',
          '- Use environment variables for configuration',
          '- Implement proper async/await patterns',
          '- Use proper file system operations',
          '- Implement proper event handling',
          '- Follow security best practices'
        );
        break;
        
      case 'html':
        docs.push(
          'HTML Best Practices:',
          '- Use semantic HTML elements',
          '- Implement proper accessibility (ARIA)',
          '- Use proper form validation',
          '- Follow responsive design principles',
          '- Use proper meta tags',
          '- Implement proper SEO practices',
          '- Use proper document structure'
        );
        break;
        
      default:
        docs.push(
          'General Best Practices:',
          '- Follow coding standards and conventions',
          '- Implement proper error handling',
          '- Use proper logging and debugging',
          '- Follow security best practices',
          '- Implement proper testing',
          '- Use proper documentation',
          '- Follow performance optimization guidelines'
        );
    }
    
    // Add common patterns for all frameworks
    docs.push(
      'Common Patterns:',
      '- Implement proper error handling',
      '- Use proper logging and debugging',
      '- Follow security best practices',
      '- Implement proper testing',
      '- Use proper documentation',
      '- Follow performance optimization guidelines'
    );
    
    return docs;
  }

  /**
   * Returns fallback framework documentation when generation fails
   */
  private getFallbackFrameworkDocs(): string[] {
    return [
      'Framework-specific best practices and patterns',
      'Common pitfalls and how to avoid them',
      'Performance optimization techniques'
    ];
  }

  /**
   * Gather framework-specific documentation based on detected frameworks
   * Implements real framework documentation generation
   */
  private async gatherFrameworkDocs(request: EnhancedContext7Request): Promise<string[]> {
    try {
      this.logger.debug('Starting framework documentation gathering');
      
      // Detect frameworks from the prompt using Context7-based detection
      const frameworkDetection = await this.frameworkDetector!.detectFrameworks(
        request.prompt, 
        request.context?.projectContext
      );
      
      this.logger.debug('Framework detection result', {
        detectedFrameworks: frameworkDetection.detectedFrameworks,
        confidence: frameworkDetection.confidence,
        detectionMethod: frameworkDetection.detectionMethod
      });
      
      const frameworkDocs: string[] = [];
      
      // Generate documentation for each detected framework
      for (const framework of frameworkDetection.detectedFrameworks) {
        this.logger.debug(`Generating documentation for framework: ${framework}`);
        const docs = this.generateFrameworkDocumentation(framework);
        frameworkDocs.push(...docs);
      }
      
      // If no frameworks detected, use fallback
      if (frameworkDocs.length === 0) {
        this.logger.debug('No frameworks detected, using fallback documentation');
        return this.getFallbackFrameworkDocs();
      }
      
      this.logger.debug('Framework documentation generated', {
        frameworkCount: frameworkDetection.detectedFrameworks.length,
        docCount: frameworkDocs.length
      });
      
      return frameworkDocs;
      
    } catch (error) {
      this.logger.error('Framework documentation gathering failed', { error });
      this.logger.warn('Framework documentation gathering failed, using fallback', { error });
      return this.getFallbackFrameworkDocs();
    }
  }

  /**
   * Gather project-specific documentation from actual project files
   * Implements real project documentation extraction
   */
  private async gatherProjectDocs(request: EnhancedContext7Request): Promise<string[]> {
    try {
      this.logger.debug('Starting project documentation gathering');
      
      // Find documentation files
      const docPatterns = [
        '**/*.md',
        '**/README.md',
        '**/CHANGELOG.md',
        '**/CONTRIBUTING.md',
        '**/docs/**/*.md',
        '**/documentation/**/*.md'
      ];
      
      const docFiles = await this.findDocumentationFiles(docPatterns);
      this.logger.debug('Found documentation files', { docFiles });
      
      const projectDocs: string[] = [];
      
      // Process each documentation file
      for (const file of docFiles.slice(0, 3)) { // Limit to 3 files to avoid token bloat
        try {
          this.logger.debug(`Processing documentation file: ${file}`);
          const content = await this.readFileSafe(file);
          const info = this.extractProjectInfo(content, file);
          projectDocs.push(...info);
        } catch (error) {
          this.logger.warn(`Failed to process documentation file ${file}`, { error });
        }
      }
      
      // If no documentation found, use fallback
      if (projectDocs.length === 0) {
        this.logger.debug('No project documentation found, using fallback');
        return this.getFallbackProjectDocs();
      }
      
      this.logger.debug('Project documentation gathered', {
        fileCount: docFiles.length,
        docCount: projectDocs.length
      });
      
      return projectDocs;
      
    } catch (error) {
      this.logger.error('Project documentation gathering failed', { error });
      this.logger.warn('Project documentation gathering failed, using fallback', { error });
      return this.getFallbackProjectDocs();
    }
  }

  /**
   * Returns fallback project documentation when extraction fails
   */
  private getFallbackProjectDocs(): string[] {
    return [
      'Project-specific documentation and guidelines',
      'Architecture decisions and patterns',
      'Development workflow and best practices'
    ];
  }

  /**
   * Safely read a file with proper error handling
   * Implements file reading with comprehensive error handling
   */
  private async readFileSafe(filePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(filePath, 'utf8');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`File read failed for ${filePath}`, { error: error.message });
        throw error;
      }
      throw new Error('Unknown file read error');
    }
  }


  /**
   * Finds documentation files matching the given patterns
   * Implements glob pattern matching with proper error handling
   */
  private async findDocumentationFiles(patterns: string[]): Promise<string[]> {
    try {
      const { glob } = await import('glob');
      const allFiles: string[] = [];
      
      for (const pattern of patterns) {
        const files = await glob(pattern, { cwd: process.cwd() });
        allFiles.push(...files);
      }
      
      return allFiles;
    } catch (error) {
      this.logger.warn('Failed to find documentation files', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patterns
      });
      return [];
    }
  }

  /**
   * Extracts project information from documentation content
   * Implements pattern matching for common documentation sections
   */
  private extractProjectInfo(content: string, filePath: string): string[] {
    const info: string[] = [];
    const lines = content.split('\n');
    const seenInfo = new Set<string>(); // Track seen information to prevent duplicates
    
    // Extract project name and description (only from first few lines)
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i]?.trim() || '';
      
      // Project title/name (only first occurrence)
      if (line.startsWith('# ') && i < 3 && !seenInfo.has('project_name')) {
        const projectName = line.substring(2).trim();
        if (projectName && projectName.length > 0) {
          info.push(`Project: ${projectName}`);
          seenInfo.add('project_name');
        }
      }
      
      // Project description (look for actual content, not just keywords)
      if (line.toLowerCase().includes('description') && !seenInfo.has('project_description')) {
        const nextLine = lines[i + 1]?.trim() || '';
        if (nextLine && !nextLine.startsWith('#') && nextLine.length > 10) {
          info.push(`Description: ${nextLine.substring(0, 100)}${nextLine.length > 100 ? '...' : ''}`);
          seenInfo.add('project_description');
        }
      }
    }
    
    // Extract specific technical details (avoid generic statements)
    const technicalDetails = this.extractTechnicalDetails(content, filePath);
    for (const detail of technicalDetails) {
      if (!seenInfo.has(detail)) {
        info.push(detail);
        seenInfo.add(detail);
      }
    }
    
    // Add file-specific meaningful information
    const fileSpecificInfo = this.getFileSpecificInfo(filePath, content);
    for (const item of fileSpecificInfo) {
      if (!seenInfo.has(item)) {
        info.push(item);
        seenInfo.add(item);
      }
    }
    
    return info;
  }

  /**
   * Extract technical details from content with quality filtering
   */
  private extractTechnicalDetails(content: string, filePath: string): string[] {
    const details: string[] = [];
    const lines = content.split('\n');
    
    // Look for specific technical patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      // Node.js version requirements
      if (line.includes('node') && line.includes('version') && line.includes('>=')) {
        const versionMatch = line.match(/node.*?version.*?(\d+\.\d+\.\d+)/i);
        if (versionMatch) {
          details.push(`Node.js version: >=${versionMatch[1]}`);
        }
      }
      
      // TypeScript configuration
      if (line.includes('typescript') && (line.includes('target') || line.includes('strict'))) {
        if (line.includes('ES2022')) details.push('TypeScript target: ES2022');
        if (line.includes('strict')) details.push('Uses strict TypeScript mode');
        if (line.includes('ESNext')) details.push('Module system: ESNext');
      }
      
      // Testing framework
      if (line.includes('vitest') || line.includes('jest')) {
        if (line.includes('vitest')) details.push('Uses Vitest for testing');
        if (line.includes('jest')) details.push('Uses Jest for testing');
      }
      
      // Linting and code quality
      if (line.includes('eslint')) details.push('Uses ESLint for code linting');
      if (line.includes('prettier')) details.push('Uses Prettier for code formatting');
      
      // Build tools
      if (line.includes('webpack')) details.push('Uses Webpack for bundling');
      if (line.includes('vite')) details.push('Uses Vite for building');
      if (line.includes('rollup')) details.push('Uses Rollup for bundling');
    }
    
    return details;
  }

  /**
   * Get file-specific meaningful information
   */
  private getFileSpecificInfo(filePath: string, content: string): string[] {
    const info: string[] = [];
    
    if (filePath.includes('README')) {
      // Extract key features or technologies from README
      const lines = content.split('\n');
      for (const line of lines.slice(0, 20)) { // Only first 20 lines
        if (line.includes('##') && line.toLowerCase().includes('features')) {
          info.push('Key features documented in README');
          break;
        }
      }
    } else if (filePath.includes('ARCHITECTURE')) {
      info.push('Architecture patterns and design decisions documented');
    } else if (filePath.includes('API')) {
      info.push('API endpoints and usage patterns documented');
    } else if (filePath.includes('CONTRIBUTING')) {
      info.push('Development workflow and contribution guidelines documented');
    } else if (filePath.includes('CHANGELOG')) {
      info.push('Version history and breaking changes documented');
    }
    
    return info;
  }


  /**
   * Analyze prompt complexity to determine appropriate response size
   * Implements smart response optimization for vibe coders
   */
  private analyzePromptComplexity(prompt: string): {
    level: 'simple' | 'medium' | 'complex';
    score: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    let score = 0;
    
    // Length-based scoring
    if (prompt.length < 20) {
      score += 3;
      indicators.push('very-short');
    } else if (prompt.length < 50) {
      score += 2;
      indicators.push('short');
    } else if (prompt.length > 200) {
      score += 1;
      indicators.push('long');
    }
    
    // Simple question patterns
    const simplePatterns = [
      /^(yes|no|ok|sure|maybe)\s*$/i,
      /^(yes|no)\s+or\s+(yes|no)/i,
      /^(what|how|when|where|why)\s+\w+\?$/i,
      /^(is|are|was|were|do|does|did|can|could|will|would)\s+\w+/i,
      /^what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+\??$/i,  // Math questions like "What is 2+2?"
      /^\d+\s*[\+\-\*\/]\s*\d+\??$/i,  // Direct math like "2+2?"
      /^what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+\s*\??$/i,  // "What is 2+2" without question mark
      /^how\s+do\s+i\s+create\s+a\s+(button|div|span|form|input|select)\??$/i,  // Simple HTML element questions
      /^how\s+to\s+create\s+a\s+(button|div|span|form|input|select)\??$/i,  // Simple HTML element questions
      /^how\s+do\s+i\s+make\s+a\s+(button|div|span|form|input|select)\??$/i  // Simple HTML element questions
    ];
    
    if (simplePatterns.some(pattern => pattern.test(prompt.trim()))) {
      score += 2;
      indicators.push('simple-question');
    }
    
    // Complex development patterns
    const complexPatterns = [
      /create|build|implement|develop/i,
      /component|function|class|service/i,
      /api|endpoint|database|schema/i,
      /test|testing|debug|fix/i,
      /deploy|production|staging/i
    ];
    
    const complexMatches = complexPatterns.filter(pattern => pattern.test(prompt));
    if (complexMatches.length > 0) {
      score -= complexMatches.length;
      indicators.push(...complexMatches.map(() => 'development-task'));
    }
    
    // Framework-specific complexity
    const frameworkKeywords = [
      'react', 'vue', 'angular', 'typescript', 'javascript',
      'node', 'express', 'next', 'nuxt', 'svelte'
    ];
    
    const frameworkMatches = frameworkKeywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    if (frameworkMatches.length > 0) {
      score -= frameworkMatches.length * 0.5;
      indicators.push(...frameworkMatches.map(() => 'framework-specific'));
    }
    
    // Determine complexity level
    let level: 'simple' | 'medium' | 'complex';
    if (score >= 2) {
      level = 'simple';
    } else if (score >= 0) {
      level = 'medium';
    } else {
      level = 'complex';
    }
    
    return { level, score, indicators };
  }

  /**
   * Get optimized options based on prompt complexity
   * Implements adaptive response sizing for better user experience
   */
  private getOptimizedOptions(
    originalOptions: any,
    complexity: { level: string; score: number; indicators: string[] }
  ): any {
    const options = { ...originalOptions };
    
    switch (complexity.level) {
      case 'simple':
        // Minimal context for simple prompts like "yes or no" (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 400);
        options.includeMetadata = false;
        options.useCache = true;
        options.simpleMode = true;
        break;
        
      case 'medium':
        // Moderate context for medium complexity prompts (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 1200);
        options.includeMetadata = true;
        options.useCache = true;
        break;
        
      case 'complex':
        // Full context for complex development tasks (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 3200);
        options.includeMetadata = true;
        options.useCache = true;
        break;
    }
    
    return options;
  }

  /**
   * Build enhanced prompt with all context
   * Implements comprehensive prompt enhancement
   */
  private buildEnhancedPrompt(
    originalPrompt: string,
    context: {
      repoFacts: string[];
      codeSnippets: string[];
      context7Docs: string;
      qualityRequirements: any[];
      frameworkDetection: any;
      frameworkDocs: string[];
      projectDocs: string[];
    },
    complexity?: { level: string; score: number; indicators: string[] }
  ): string {
    let enhanced = originalPrompt;
    
    // For simple prompts, provide minimal context
    if (complexity?.level === 'simple') {
      // Only add essential framework detection if relevant
      if (context.frameworkDetection && context.frameworkDetection.detectedFrameworks.length > 0) {
        enhanced += `\n\n## Detected Framework: ${context.frameworkDetection.detectedFrameworks[0]}`;
      }
      
      // Add minimal project context
      if (context.repoFacts.length > 0) {
        enhanced += `\n\n## Project: ${context.repoFacts[0]}`;
      }
      
      // Add Context7 docs for simple HTML questions
      if (context.context7Docs && context.frameworkDetection?.detectedFrameworks.includes('html')) {
        enhanced += `\n\n${context.context7Docs}`;
      }
      
      return enhanced;
    }
    
    // For medium/complex prompts, add comprehensive context
    if (context.frameworkDetection && context.frameworkDetection.detectedFrameworks.length > 0) {
      enhanced += `\n\n## Detected Frameworks/Libraries:\n`;
      enhanced += `- **Frameworks**: ${context.frameworkDetection.detectedFrameworks.join(', ')}\n`;
      enhanced += `- **Detection Method**: ${context.frameworkDetection.detectionMethod}\n`;
      enhanced += `- **Confidence**: ${(context.frameworkDetection.confidence * 100).toFixed(1)}%\n`;
      if (context.frameworkDetection.suggestions.length > 0) {
        enhanced += `- **Suggestions**: ${context.frameworkDetection.suggestions.join(', ')}\n`;
      }
    }
    
    // Add quality requirements if detected (skip for simple prompts)
    if (complexity?.level !== 'simple' && context.qualityRequirements && context.qualityRequirements.length > 0) {
      const qualityFormatted = this.formatQualityRequirements(context.qualityRequirements);
      if (qualityFormatted) {
        enhanced += `\n\n${qualityFormatted}`;
      }
    }
    
    // Add Context7 documentation if available (with smart truncation)
    if (context.context7Docs) {
      const maxTokens = complexity?.level === 'simple' ? 200 : 
                       complexity?.level === 'medium' ? 800 : 1500;
      const smartTruncatedDocs = this.smartTruncateContent(
        context.context7Docs, 
        maxTokens, 
        originalPrompt
      );
      enhanced += `\n\n## Framework Best Practices (from Context7):\n${smartTruncatedDocs}`;
    }
    
    // Add framework-specific documentation if available
    if (context.frameworkDocs && context.frameworkDocs.length > 0) {
      enhanced += `\n\n## Framework-Specific Best Practices:\n${context.frameworkDocs.join('\n')}`;
    }
    
    // Add project documentation if available
    if (context.projectDocs && context.projectDocs.length > 0) {
      enhanced += `\n\n## Project Documentation:\n${context.projectDocs.join('\n')}`;
    }
    
    // Add repository context
    if (context.repoFacts.length > 0) {
      enhanced += `\n\n## Repository Context:\n${context.repoFacts.join('\n')}`;
    }
    
    // Add existing code patterns if available (with smart truncation)
    if (context.codeSnippets.length > 0) {
      const codeContent = context.codeSnippets.join('\n\n');
      const maxTokens = complexity?.level === 'simple' ? 300 : 
                       complexity?.level === 'medium' ? 600 : 1200;
      const smartTruncatedCode = this.smartTruncateContent(
        codeContent, 
        maxTokens, 
        originalPrompt
      );
      enhanced += `\n\n## Existing Code Patterns:\n\`\`\`typescript\n${smartTruncatedCode}\n\`\`\``;
    }
    
    // Add final instructions
    enhanced += `\n\n## Instructions:\nMake your response consistent with the project's existing patterns, best practices, and coding standards. Use the provided context to ensure your solution fits well with the existing codebase.`;
    
    return enhanced;
  }

  /**
   * Detects quality requirements from prompt and framework
   * 
   * @param prompt - The input prompt
   * @param framework - Detected framework
   * @returns Promise<any[]> - Detected quality requirements
   */
  private async detectQualityRequirements(prompt: string, framework?: string): Promise<any[]> {
    try {
      const detectionResult = await this.qualityDetector.detectRequirements(prompt, framework);
      
      this.logger.debug('Quality requirements detected', {
        requirementsCount: detectionResult.requirements.length,
        detectedTechnologies: detectionResult.detectedTechnologies,
        confidence: detectionResult.confidence
      });

      return detectionResult.requirements;
    } catch (error) {
      this.logger.warn('Quality requirements detection failed, continuing without them', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Return empty array on failure - graceful degradation
      return [];
    }
  }

  /**
   * Formats quality requirements using the formatter service
   * 
   * @param requirements - Quality requirements to format
   * @returns string - Formatted quality requirements
   */
  private formatQualityRequirements(requirements: any[]): string {
    try {
      return this.qualityFormatter.formatRequirements(requirements, {
        includePriority: true,
        includeCategoryHeaders: true,
        maxTokens: 1000 // Reserve reasonable token budget for quality requirements
      });
    } catch (error) {
      this.logger.warn('Quality requirements formatting failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requirementsCount: requirements?.length || 0
      });
      
      // Return fallback formatting
      return '';
    }
  }

  /**
   * Get tool health status
   * Implements health monitoring
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      mcpCompliance: boolean;
      monitoring: boolean;
      cache: boolean;
    };
    metrics: any;
  }> {
    try {
      const mcpHealth = await this.mcpCompliance.healthCheck();
      const monitoringHealth = await this.monitoring.getHealthStatus();
      const cacheStats = this.cache.getCacheStats();
      
      const components = {
        mcpCompliance: mcpHealth.status === 'healthy',
        monitoring: monitoringHealth.status === 'healthy',
        cache: cacheStats.memory.hitRate > 0 || cacheStats.sqlite.hitRate > 0
      };
      
      const healthyComponents = Object.values(components).filter(Boolean).length;
      const totalComponents = Object.keys(components).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyComponents === totalComponents) {
        status = 'healthy';
      } else if (healthyComponents >= totalComponents * 0.5) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return {
        status,
        components,
        metrics: {
          mcp: mcpHealth,
          monitoring: monitoringHealth.metrics,
          cache: cacheStats
        }
      };
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        status: 'unhealthy',
        components: {
          mcpCompliance: false,
          monitoring: false,
          cache: false
        },
        metrics: {}
      };
    }
  }
}
