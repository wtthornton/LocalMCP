/**
 * Context7 OpenAI Interceptor Service
 * 
 * Intercepts Context7 results immediately and enhances them with OpenAI
 * before they go into the JSON response. Provides real-time AI enhancement
 * of Context7 documentation at the service level.
 * 
 * Benefits for vibe coders:
 * - Real-time enhancement of Context7 documentation
 * - Framework-specific and quality-focused enhancements
 * - Caching and cost optimization
 * - Seamless integration with existing Context7 flow
 */

import { Logger } from '../logger/logger.js';
import { OpenAIService } from './openai.service.js';
import { Context7EnhancementPrompts } from './context7-enhancement-prompts.js';

export interface Context7EnhancementOptions {
  useAIEnhancement?: boolean;
  enhancementStrategy?: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware';
  qualityFocus?: string[];
  projectType?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Context7EnhancementResult {
  enhancedDocs: string;
  originalDocs: string;
  enhancementMetadata: {
    strategy: string;
    framework?: string;
    qualityFocus?: string[];
    tokensUsed: number;
    cost: number;
    processingTime: number;
  };
}

export class Context7OpenAIInterceptor {
  private logger: Logger;
  private openAIService: OpenAIService;
  private enhancementPrompts: Context7EnhancementPrompts;
  private cache: Map<string, Context7EnhancementResult> = new Map();

  constructor(
    logger: Logger,
    openAIService: OpenAIService,
    enhancementPrompts: Context7EnhancementPrompts
  ) {
    this.logger = logger;
    this.openAIService = openAIService;
    this.enhancementPrompts = enhancementPrompts;
  }

  /**
   * Enhance Context7 documentation with OpenAI
   */
  async enhanceContext7Result(
    originalDocs: string,
    framework?: string,
    options: Context7EnhancementOptions = {}
  ): Promise<Context7EnhancementResult> {
    const startTime = Date.now();
    
    try {
      // Check if enhancement is disabled
      if (!options.useAIEnhancement) {
        return this.createFallbackResult(originalDocs, options);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(originalDocs, framework, options);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('Context7 enhancement cache hit', { cacheKey });
        return cached;
      }

      // Select enhancement strategy
      const strategy = options.enhancementStrategy || 'general';
      const prompt = this.enhancementPrompts.selectContext7EnhancementPrompt(
        strategy,
        framework,
        options.qualityFocus,
        options.projectType
      );

      // Prepare context for OpenAI
      const context = this.prepareEnhancementContext(originalDocs, framework, options);

      // Call OpenAI for enhancement
      const enhancedDocs = await this.openAIService.enhancePromptWithContext({
        originalPrompt: originalDocs,
        context: context,
        options: {
          strategy: strategy as any,
          maxTokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
          qualityThreshold: 0.7,
          includeExamples: true,
          includeBestPractices: true,
          includeAntiPatterns: true,
          includePerformanceTips: true,
          includeSecurityConsiderations: true,
          includeTestingApproaches: true
        },
        goals: {
          primary: 'Enhance Context7 documentation for better developer experience',
          secondary: ['Improve clarity', 'Add practical examples', 'Focus on best practices'],
          constraints: ['Maintain accuracy', 'Keep concise', 'Preserve technical details'],
          successCriteria: ['Clearer documentation', 'Better developer understanding', 'Actionable insights'],
          expectedOutcome: 'Enhanced documentation that helps developers implement solutions faster'
        }
      });

      // Calculate metrics
      const processingTime = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(originalDocs, enhancedDocs.enhancedPrompt);
      const cost = this.calculateCost(tokensUsed);

      // Create result
      const result: Context7EnhancementResult = {
        enhancedDocs: enhancedDocs.enhancedPrompt,
        originalDocs,
        enhancementMetadata: {
          strategy,
          framework,
          qualityFocus: options.qualityFocus,
          tokensUsed,
          cost,
          processingTime
        }
      };

      // Cache result
      this.cache.set(cacheKey, result);

      this.logger.info('Context7 documentation enhanced successfully', {
        originalLength: originalDocs.length,
        enhancedLength: result.enhancedDocs.length,
        strategy,
        framework,
        tokensUsed,
        cost,
        processingTime
      });

      return result;

    } catch (error) {
      this.logger.warn('Context7 enhancement failed, using original docs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        framework,
        strategy: options.enhancementStrategy
      });

      return this.createFallbackResult(originalDocs, options);
    }
  }

  /**
   * Enhance multiple Context7 documentation results
   */
  async enhanceMultipleContext7Results(
    docsArray: string[],
    framework?: string,
    options: Context7EnhancementOptions = {}
  ): Promise<Context7EnhancementResult[]> {
    const results: Context7EnhancementResult[] = [];

    for (const docs of docsArray) {
      const result = await this.enhanceContext7Result(docs, framework, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Prepare enhancement context for OpenAI
   */
  private prepareEnhancementContext(
    originalDocs: string,
    framework?: string,
    options: Context7EnhancementOptions = {}
  ): any {
    return {
      projectContext: {
        projectType: options.projectType || 'frontend',
        framework: framework || 'unknown',
        language: 'javascript',
        architecture: 'component-based'
      },
      frameworkContext: {
        framework: framework || 'unknown',
        bestPractices: [],
        commonPatterns: [],
        performanceTips: []
      },
      qualityRequirements: {
        accessibility: options.qualityFocus?.includes('accessibility') || false,
        performance: options.qualityFocus?.includes('performance') || false,
        security: options.qualityFocus?.includes('security') || false,
        testing: options.qualityFocus?.includes('testing') || false
      },
      codeSnippets: [],
      documentation: {
        context7Docs: [originalDocs],
        projectDocs: [],
        frameworkDocs: []
      },
      userPreferences: {
        style: 'professional',
        verbosity: 'detailed',
        examples: true
      }
    };
  }

  /**
   * Generate cache key for Context7 enhancement
   */
  private generateCacheKey(
    originalDocs: string,
    framework?: string,
    options: Context7EnhancementOptions = {}
  ): string {
    const key = `${originalDocs.substring(0, 100)}_${framework || 'unknown'}_${options.enhancementStrategy || 'general'}_${options.qualityFocus?.join(',') || 'none'}`;
    return Buffer.from(key).toString('base64').substring(0, 50);
  }

  /**
   * Create fallback result when enhancement fails
   */
  private createFallbackResult(
    originalDocs: string,
    options: Context7EnhancementOptions = {}
  ): Context7EnhancementResult {
    return {
      enhancedDocs: originalDocs,
      originalDocs,
      enhancementMetadata: {
        strategy: options.enhancementStrategy || 'general',
        framework: undefined,
        qualityFocus: options.qualityFocus,
        tokensUsed: 0,
        cost: 0,
        processingTime: 0
      }
    };
  }

  /**
   * Estimate token usage
   */
  private estimateTokens(original: string, enhanced: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil((original.length + enhanced.length) / 4);
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: number): number {
    // Using GPT-4 pricing: $0.03 per 1K input tokens, $0.06 per 1K output tokens
    const inputTokens = Math.ceil(tokens * 0.3); // Assume 30% input, 70% output
    const outputTokens = Math.ceil(tokens * 0.7);
    
    const inputCost = (inputTokens / 1000) * 0.03;
    const outputCost = (outputTokens / 1000) * 0.06;
    
    return inputCost + outputCost;
  }

  /**
   * Clear enhancement cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.info('Context7 enhancement cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
