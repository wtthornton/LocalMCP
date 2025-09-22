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
    
    // Initialize framework detection (now handled internally)
    this.frameworkCache = new Context7CacheService();
    // Framework detection is now handled by detectFrameworks method
    
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
    
    // Debug logging for complexity detection
    console.log('🔍 DEBUG: Complexity analysis', {
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

      // 1. Detect frameworks dynamically using pattern matching and project context
      const frameworkDetection = await this.detectFrameworks(
        request.prompt, 
        request.context?.projectContext
      );
      
      // 2. Detect quality requirements from prompt and detected frameworks
      const qualityRequirements = await this.detectQualityRequirements(
        request.prompt, 
        frameworkDetection.detectedFrameworks[0] // Use first detected framework
      );
      
      // 3. Get Context7 documentation for all detected frameworks (with optimized limits)
      let context7Docs = '';
      let librariesResolved: string[] = [];
      
      // Skip Context7 documentation for simple prompts, except for HTML questions
      const isSimpleHtmlQuestion = promptComplexity.level === 'simple' && 
        frameworkDetection.detectedFrameworks.includes('html');
      
              if ((promptComplexity.level !== 'simple' || isSimpleHtmlQuestion) && frameworkDetection.context7Libraries.length > 0) {
                // Apply intelligent token optimization for Context7 docs
                let maxTokens = this.calculateOptimalTokenLimit(
                  promptComplexity.level,
                  frameworkDetection.detectedFrameworks[0] || 'generic',
                  request.prompt
                );
                
                // Limit number of libraries based on complexity
                if (promptComplexity.level === 'complex') {
                  frameworkDetection.context7Libraries = frameworkDetection.context7Libraries.slice(0, 1);
                } else if (promptComplexity.level === 'medium') {
                  frameworkDetection.context7Libraries = frameworkDetection.context7Libraries.slice(0, 2);
                } else if (promptComplexity.level === 'simple') {
                  frameworkDetection.context7Libraries = frameworkDetection.context7Libraries.slice(0, 1);
                }
        console.log('🔍 DEBUG: Starting Context7 documentation retrieval', {
          context7Libraries: frameworkDetection.context7Libraries,
          librariesCount: frameworkDetection.context7Libraries.length,
          optimizedMaxTokens: optimizedOptions.maxTokens
        });
        
        this.logger.debug('Starting Context7 documentation retrieval', {
          context7Libraries: frameworkDetection.context7Libraries,
          librariesCount: frameworkDetection.context7Libraries.length,
          optimizedMaxTokens: optimizedOptions.maxTokens
        });
        
        try {
          // Use parallel processing for Context7 documentation retrieval
          const context7Start = Date.now();
          const context7Result = await this.getContext7DocumentationForFrameworks(
            frameworkDetection.context7Libraries,
            request.prompt, 
            optimizedOptions.maxTokens || 4000
          );
          const context7Time = Date.now() - context7Start;
          
          // Pre-process Context7 content for better quality
          const preprocessedContent = this.realContext7.preprocessContext7Content(
            context7Result.docs,
            frameworkDetection.context7Libraries[0] || 'generic'
          );
          
          // Apply content filtering based on complexity and relevance
          context7Docs = this.filterContext7Content(
            preprocessedContent.content, 
            request.prompt, 
            promptComplexity.level,
            frameworkDetection.detectedFrameworks[0] || 'generic'
          );
          librariesResolved = context7Result.libraries;
          
          console.log('✅ DEBUG: Context7 documentation retrieved successfully', {
            docsLength: context7Docs.length,
            librariesResolved: librariesResolved.length,
            docsPreview: context7Docs.substring(0, 200) + '...',
            context7Time: context7Time
          });
          
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
          console.log('🔍 DEBUG: Simple prompt detected, skipping Context7 documentation');
          this.logger.debug('Simple prompt detected, skipping Context7 documentation');
        } else {
          this.logger.debug('No Context7 libraries detected, skipping documentation retrieval');
        }
      }

      // 4. Gather additional context with error handling
      // 4. Gather context based on complexity - skip heavy analysis for simple prompts
      let repoFacts: string[] = [];
      let codeSnippets: string[] = [];
      let frameworkDocs: string[] = [];
      let projectDocs: string[] = [];
      
      if (promptComplexity.level === 'simple') {
        // For simple prompts, use minimal real data only
        console.log('🔍 DEBUG: Simple prompt detected, using minimal context');
        repoFacts = await this.getMinimalRepoFacts();
        
        // Use template-based code snippets for simple prompts too
        codeSnippets = await this.gatherCodeSnippets(request);
        frameworkDocs = [];
        projectDocs = [];
      } else {
        // For medium/complex prompts, do full analysis with complexity-based limits
        console.log('🔍 DEBUG: Complex prompt detected, doing full analysis');
        // Gather context in parallel for better performance
        const contextGatheringStart = Date.now();
        const results = await Promise.allSettled([
          this.gatherRepoFacts(request),
          this.gatherCodeSnippets(request)
        ]);
        
        [repoFacts, codeSnippets] = results.map(result => 
          result.status === 'fulfilled' ? result.value : []
        ) as [string[], string[]];
        
        const contextGatheringTime = Date.now() - contextGatheringStart;
        this.logger.debug('Context gathering completed', { 
          time: contextGatheringTime,
          repoFactsCount: repoFacts.length,
          codeSnippetsCount: codeSnippets.length
        });
        
        // Set empty arrays for removed methods
        frameworkDocs = [];
        projectDocs = [];
        
                // Apply aggressive complexity-based limits to reduce token bloat
                if (promptComplexity.level === 'complex') {
                  // Very aggressive limits for complex prompts to reduce token bloat
                  repoFacts = repoFacts.slice(0, 3); // Limit to 3 most relevant facts
                  codeSnippets = codeSnippets.slice(0, 2); // Limit to 2 most relevant snippets
                  projectDocs = projectDocs.slice(0, 1); // Limit to 1 most relevant doc
                  frameworkDocs = frameworkDocs.slice(0, 1); // Limit to 1 most relevant framework doc
                } else if (promptComplexity.level === 'medium') {
                  // Moderate limits for medium complexity
                  repoFacts = repoFacts.slice(0, 5); // Limit to 5 facts
                  codeSnippets = codeSnippets.slice(0, 3); // Limit to 3 snippets
                  projectDocs = projectDocs.slice(0, 1); // Limit to 1 doc
                  frameworkDocs = frameworkDocs.slice(0, 1); // Limit to 1 framework doc
                } else if (promptComplexity.level === 'simple') {
                  // Minimal context for simple prompts
                  repoFacts = repoFacts.slice(0, 2); // Limit to 2 facts
                  codeSnippets = codeSnippets.slice(0, 1); // Limit to 1 snippet
                  projectDocs = projectDocs.slice(0, 1); // Limit to 1 doc
                  frameworkDocs = frameworkDocs.slice(0, 0); // No framework docs for simple
                }
      }

      // 5. Build enhanced prompt with dynamic framework detection results and complexity optimization
      const enhancedPrompt = this.buildEnhancedPrompt(
        request.prompt,
        {
          repoFacts,
          codeSnippets,
          context7Docs,
          qualityRequirements,
          frameworkDetection
        },
        promptComplexity
      );

      const responseTime = Date.now() - startTime;
      
      // Record successful request
      this.monitoring.recordRequest(
        'enhance',
        responseTime,
        frameworkDetection.detectedFrameworks[0] || 'unknown'
      );

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

  // Framework priority scoring system
  private readonly FRAMEWORK_PRIORITIES: Record<string, number> = {
    // Full-stack frameworks (highest priority)
    'nextjs': 10,
    'nuxt': 10,
    'sveltekit': 10,
    
    // Frontend frameworks
    'react': 8,
    'vue': 8,
    'angular': 8,
    'svelte': 8,
    
    // CSS frameworks
    'tailwind': 7,
    'bootstrap': 7,
    'bulma': 7,
    
    // Backend frameworks
    'express': 6,
    'fastapi': 6,
    'django': 6,
    
    // Languages (lowest priority)
    'typescript': 5,
    'javascript': 4,
    'html': 3,
    'css': 2
  };

  private readonly TASK_PRIORITIES: Record<string, string[]> = {
    'full-stack': ['nextjs', 'nuxt', 'sveltekit'],
    'frontend': ['react', 'vue', 'angular', 'svelte'],
    'backend': ['express', 'fastapi', 'django'],
    'styling': ['tailwind', 'bootstrap', 'bulma'],
    'debugging': ['typescript', 'javascript'],
    'simple': ['html', 'css']
  };

  /**
   * Analyze prompt type to determine task-specific priorities
   */
  private analyzePromptType(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    
    // Full-stack patterns
    if (promptLower.includes('full-stack') || promptLower.includes('fullstack') ||
        promptLower.includes('authentication') || promptLower.includes('api') ||
        promptLower.includes('database') || promptLower.includes('backend')) {
      return 'full-stack';
    }
    
    // Frontend patterns
    if (promptLower.includes('component') || promptLower.includes('ui') ||
        promptLower.includes('interface') || promptLower.includes('frontend')) {
      return 'frontend';
    }
    
    // Backend patterns
    if (promptLower.includes('server') || promptLower.includes('api') ||
        promptLower.includes('endpoint') || promptLower.includes('backend')) {
      return 'backend';
    }
    
    // Styling patterns
    if (promptLower.includes('css') || promptLower.includes('style') ||
        promptLower.includes('design') || promptLower.includes('layout')) {
      return 'styling';
    }
    
    // Debugging patterns
    if (promptLower.includes('error') || promptLower.includes('debug') ||
        promptLower.includes('fix') || promptLower.includes('bug')) {
      return 'debugging';
    }
    
    // Simple patterns
    if (promptLower.includes('button') || promptLower.includes('div') ||
        promptLower.includes('html') || promptLower.includes('create')) {
      return 'simple';
    }
    
    return 'general';
  }

  /**
   * Calculate framework score based on priority and task type
   */
  private calculateFrameworkScore(framework: string, promptType: string, taskPriorities: string[]): number {
    let score = this.FRAMEWORK_PRIORITIES[framework] || 0;
    
    // Boost score for task-specific frameworks
    if (taskPriorities.includes(framework)) {
      score += 5;
    }
    
    // Boost score for full-stack frameworks in complex tasks
    if (promptType === 'full-stack' && ['nextjs', 'nuxt', 'sveltekit'].includes(framework)) {
      score += 3;
    }
    
    // Boost score for frontend frameworks in UI tasks
    if (promptType === 'frontend' && ['react', 'vue', 'angular', 'svelte'].includes(framework)) {
      score += 3;
    }
    
    return score;
  }

  /**
   * Select primary framework from detected frameworks
   */
  private selectPrimaryFramework(detectedFrameworks: string[], prompt: string): string {
    if (detectedFrameworks.length === 0) return '';
    if (detectedFrameworks.length === 1) return detectedFrameworks[0]!;
    
    const promptType = this.analyzePromptType(prompt);
    const taskPriorities = this.TASK_PRIORITIES[promptType] || [];
    
    // Score each detected framework
    const scoredFrameworks = detectedFrameworks.map(framework => ({
      framework,
      score: this.calculateFrameworkScore(framework, promptType, taskPriorities)
    }));
    
    // Return highest scoring framework
    const sortedFrameworks = scoredFrameworks.sort((a, b) => b.score - a.score);
    return sortedFrameworks[0]?.framework || '';
  }

  /**
   * Select Context7 libraries with smart prioritization and validation
   */
  private async selectContext7Libraries(primaryFramework: string, detectedFrameworks: string[]): Promise<string[]> {
    const libraries: string[] = [];
    
    // Framework to Context7 library mapping
    const FRAMEWORK_LIBRARY_MAP: Record<string, string> = {
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
    
    try {
      // Always add the primary framework library first
      const primaryLibrary = FRAMEWORK_LIBRARY_MAP[primaryFramework];
      if (primaryLibrary) {
        libraries.push(primaryLibrary);
      }
      
      // Add complementary libraries (max 2 total)
      const complementaryFrameworks = detectedFrameworks
        .filter(f => f !== primaryFramework)
        .slice(0, 1); // Only add 1 complementary library
      
      for (const framework of complementaryFrameworks) {
        const library = FRAMEWORK_LIBRARY_MAP[framework];
        if (library && !libraries.includes(library)) {
          libraries.push(library);
        }
      }
      
      // If no libraries found, use fallback
      if (libraries.length === 0) {
        libraries.push('/microsoft/typescript');
      }
      
      this.logger.debug('Context7 libraries selected', {
        primaryFramework,
        detectedFrameworks,
        selectedLibraries: libraries
      });
      
      return libraries;
    } catch (error) {
      this.logger.warn('Error selecting Context7 libraries, using fallback', { error });
      // Fallback to primary framework or TypeScript
      const fallbackLibrary = FRAMEWORK_LIBRARY_MAP[primaryFramework] || '/microsoft/typescript';
      return [fallbackLibrary];
    }
  }

  /**
   * Get validated library with fallback mechanism
   */
  private async getValidatedLibrary(framework: string, defaultLibrary: string | undefined): Promise<string | null> {
    if (!defaultLibrary) return null;
    
    try {
      // Try to validate the default library first
      if (this.realContext7.validateContext7Library) {
        const isValid = await this.realContext7.validateContext7Library(defaultLibrary);
        if (isValid) {
          return defaultLibrary;
        }
      }
      
      // Try fallback libraries
      if (this.realContext7.selectValidatedLibrary) {
        const fallbackLibrary = await this.realContext7.selectValidatedLibrary(framework);
        if (fallbackLibrary) {
          return fallbackLibrary;
        }
      }
      
      // Return default library as last resort
      return defaultLibrary;
    } catch (error) {
      this.logger.warn(`Library validation failed for ${framework}, using default`, { error });
      return defaultLibrary;
    }
  }

  /**
   * Detect frameworks from prompt and project context
   * Implements keyword-based detection with Context7 library mapping
   */
  private async detectFrameworks(
    prompt: string, 
    projectContext?: any
  ): Promise<{
    detectedFrameworks: string[];
    context7Libraries: string[];
    confidence: number;
    detectionMethod: string;
    suggestions: string[];
  }> {
    try {
      const detectedFrameworks: string[] = [];
      const suggestions: string[] = [];
      const promptLower = prompt.toLowerCase();
      
      // Extended keyword-based detection patterns
      const FRAMEWORK_PATTERNS = {
        'nextjs': [
          /next\.?js/gi,
          /nextjs/gi,
          /vercel/gi,
          /app router/gi,
          /pages router/gi,
          /full-stack/gi,
          /authentication/gi,
          /real-time/gi
        ],
        'react': [
          /react/gi,
          /jsx/gi,
          /hooks/gi,
          /component/gi,
          /useState/gi,
          /useEffect/gi
        ],
        'typescript': [
          /typescript/gi,
          /tsx/gi,
          /\.ts/gi,
          /interface/gi,
          /type\s+\w+/gi
        ],
        'html': [
          /html/gi,
          /button/gi,
          /div/gi,
          /span/gi,
          /form/gi,
          /input/gi,
          /select/gi
        ],
        'css': [
          /css/gi,
          /style/gi,
          /tailwind/gi,
          /bootstrap/gi,
          /flexbox/gi,
          /grid/gi
        ],
        'vue': [
          /vue\.?js/gi,
          /vuejs/gi,
          /vue/gi,
          /composition api/gi,
          /options api/gi
        ],
        'angular': [
          /angular/gi,
          /ng-/gi,
          /@angular/gi
        ],
        'express': [
          /express/gi,
          /express\.js/gi,
          /middleware/gi,
          /router/gi
        ],
        'nodejs': [
          /node/gi,
          /nodejs/gi,
          /node\.js/gi
        ]
      };
      
      // Detect frameworks using patterns
      for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
        const isDetected = patterns.some(pattern => pattern.test(prompt));
        if (isDetected && !detectedFrameworks.includes(framework)) {
          detectedFrameworks.push(framework);
          suggestions.push(`Detected ${framework} (pattern match)`);
        }
      }
      
      // Special handling for full-stack tasks - prioritize Next.js
      if (promptLower.includes('full-stack') || promptLower.includes('authentication') || 
          promptLower.includes('real-time') || promptLower.includes('file upload')) {
        if (!detectedFrameworks.includes('nextjs')) {
          detectedFrameworks.push('nextjs');
          suggestions.push('Detected nextjs (full-stack task pattern)');
        }
        // Also ensure TypeScript is detected for full-stack tasks
        if (!detectedFrameworks.includes('typescript')) {
          detectedFrameworks.push('typescript');
          suggestions.push('Detected typescript (full-stack task pattern)');
        }
      }
      
      // Project context analysis
      if (projectContext) {
        if (projectContext.packageJson?.dependencies?.react && !detectedFrameworks.includes('react')) {
          detectedFrameworks.push('react');
          suggestions.push('Detected react (project context)');
        }
        
        if (projectContext.packageJson?.devDependencies?.typescript && !detectedFrameworks.includes('typescript')) {
          detectedFrameworks.push('typescript');
          suggestions.push('Detected typescript (project context)');
        }
      }
      
      // Smart default based on prompt content
      if (detectedFrameworks.length === 0) {
        // Check for HTML/CSS patterns first
        if (promptLower.includes('button') || promptLower.includes('div') || 
            promptLower.includes('span') || promptLower.includes('form') ||
            promptLower.includes('input') || promptLower.includes('select')) {
          detectedFrameworks.push('html');
          suggestions.push('Default to html (detected HTML elements)');
        } else {
          // Default to TypeScript for development tasks
          detectedFrameworks.push('typescript');
          suggestions.push('Default to typescript (no frameworks detected)');
        }
      }
      
      // Smart framework selection and Context7 library mapping
      const primaryFramework = this.selectPrimaryFramework(detectedFrameworks, prompt);
      const context7Libraries = await this.selectContext7Libraries(primaryFramework, detectedFrameworks);
      
      // Add selection reasoning to suggestions
      if (detectedFrameworks.length > 1) {
        suggestions.push(`Selected ${primaryFramework} as primary framework (highest priority)`);
      }
      
      const confidence = detectedFrameworks.length > 0 ? 0.8 : 0.5;
      
      this.logger.debug('Framework detection completed', {
        detectedFrameworks,
        context7Libraries,
        confidence,
        suggestions
      });
      
      return {
        detectedFrameworks,
        context7Libraries,
        confidence,
        detectionMethod: 'keyword+project',
        suggestions
      };
      
    } catch (error) {
      this.logger.error('Framework detection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Fallback to TypeScript
      return {
        detectedFrameworks: ['typescript'],
        context7Libraries: ['/microsoft/typescript'],
        confidence: 0.3,
        detectionMethod: 'fallback',
        suggestions: ['Fallback to typescript due to detection error']
      };
    }
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
   * Gather repository facts from actual project analysis
   * Implements file system analysis with proper error handling
   */
  private async gatherRepoFacts(request: EnhancedContext7Request): Promise<string[]> {
    try {
      const facts: string[] = [];
      const prompt = request.prompt.toLowerCase();
      
      // Check for package.json
      const packageJson = await this.readJsonFile('package.json');
      if (packageJson) {
        facts.push(`Project name: ${packageJson.name || 'Unknown'}`);
        facts.push(`Node.js version: ${packageJson.engines?.node || 'Not specified'}`);
        
        // Only include relevant dependencies based on prompt
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // TypeScript - always include if present
        if (deps.typescript) facts.push('Uses TypeScript for type safety');
        
        // React - only if prompt mentions React
        if (deps.react && (prompt.includes('react') || prompt.includes('component'))) {
          facts.push('React-based application');
        }
        
        // Testing - only if prompt mentions testing
        if ((deps.jest || deps.vitest) && (prompt.includes('test') || prompt.includes('testing'))) {
          if (deps.jest) facts.push('Uses Jest for testing');
          if (deps.vitest) facts.push('Uses Vitest for testing');
        }
        
        // Build tools - only if prompt mentions building/deployment
        if ((deps.vite || deps.webpack) && (prompt.includes('build') || prompt.includes('deploy') || prompt.includes('production'))) {
          if (deps.vite) facts.push('Uses Vite for build tooling');
          if (deps.webpack) facts.push('Uses Webpack for bundling');
        }
        
        // Linting - only if prompt mentions code quality
        if ((deps.eslint || deps.prettier) && (prompt.includes('lint') || prompt.includes('format') || prompt.includes('quality'))) {
          if (deps.eslint) facts.push('Uses ESLint for code linting');
          if (deps.prettier) facts.push('Uses Prettier for code formatting');
        }
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
    const baseTokens = {
      'simple': 300,
      'medium': 800,
      'complex': 2000
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
    
    // Cap at reasonable limits
    const maxLimit = complexity === 'simple' ? 500 : complexity === 'medium' ? 1500 : 3000;
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
   * Returns fallback project documentation when scanning fails
   */
  private getFallbackProjectDocs(): string[] {
    return [
      'Project: promptmcp',
      'Node.js version: >=18.0.0',
      'Uses TypeScript for type safety',
      'Uses Vitest for testing',
      'Uses ESLint for code linting'
    ];
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
        // Minimal context for simple prompts like "yes or no"
        options.maxTokens = Math.min(options.maxTokens || 4000, 500);
        options.includeMetadata = false;
        options.useCache = true;
        options.simpleMode = true;
        break;
        
      case 'medium':
        // Moderate context for medium complexity prompts
        options.maxTokens = Math.min(options.maxTokens || 4000, 1500);
        options.includeMetadata = true;
        options.useCache = true;
        break;
        
      case 'complex':
        // Full context for complex development tasks
        options.maxTokens = options.maxTokens || 4000;
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
    
    // Add Context7 documentation if available (limit for medium complexity)
    if (context.context7Docs) {
      if (complexity?.level === 'medium') {
        // Truncate Context7 docs for medium complexity
        const maxLength = 1000;
        const truncatedDocs = context.context7Docs.length > maxLength 
          ? context.context7Docs.substring(0, maxLength) + '...'
          : context.context7Docs;
        enhanced += `\n\n## Framework Best Practices (from Context7):\n${truncatedDocs}`;
      } else {
        enhanced += `\n\n## Framework Best Practices (from Context7):\n${context.context7Docs}`;
      }
    }
    
    
    // Add repository context
    if (context.repoFacts.length > 0) {
      enhanced += `\n\n## Repository Context:\n${context.repoFacts.join('\n')}`;
    }
    
    // Add existing code patterns if available (limit for medium complexity)
    if (context.codeSnippets.length > 0) {
      if (complexity?.level === 'medium') {
        enhanced += `\n\n## Existing Code Patterns:\n\`\`\`typescript\n${context.codeSnippets.slice(0, 2).join('\n\n')}\n\`\`\``;
      } else {
        enhanced += `\n\n## Existing Code Patterns:\n\`\`\`typescript\n${context.codeSnippets.join('\n\n')}\n\`\`\``;
      }
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
