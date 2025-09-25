/**
 * Prompt Enhancement Agent Service
 * 
 * Main orchestration service for AI-powered prompt enhancement
 * Coordinates context gathering, AI enhancement, and quality validation
 * 
 * Benefits for vibe coders:
 * - Intelligent prompt enhancement using OpenAI
 * - Context-aware enhancement strategies
 * - Quality validation and confidence scoring
 * - Framework-specific and project-aware enhancement
 * - Cost optimization and performance monitoring
 */

import { Logger } from '../logger/logger.js';
import { OpenAIService } from './openai.service.js';
import { ResponseBuilderService } from '../../tools/enhance/response-builder.service.js';
import type { 
  PromptEnhancementRequest, 
  PromptEnhancementResponse,
  EnhancementContext,
  EnhancementOptions,
  EnhancementGoals,
  EnhancementStrategy,
  ProjectContext,
  FrameworkContext,
  QualityRequirements,
  EnhancementValidationResult,
  EnhancementMetrics,
  PromptEnhancementConfig
} from '../../types/prompt-enhancement.types.js';
import { PromptEnhancementPrompts } from './prompt-enhancement-prompts.js';

export interface EnhancementAgentConfig {
  enabled: boolean;
  defaultStrategy: EnhancementStrategy;
  qualityThreshold: number;
  maxTokens: number;
  temperature: number;
  costLimit: number;
  rateLimit: number;
  fallbackEnabled: boolean;
}

export class PromptEnhancementAgentService {
  private logger: Logger;
  private openAIService: OpenAIService;
  private responseBuilderService: ResponseBuilderService;
  private config: EnhancementAgentConfig;
  private metrics: EnhancementMetrics;

  constructor(
    logger: Logger,
    openAIService: OpenAIService,
    responseBuilderService: ResponseBuilderService,
    config: EnhancementAgentConfig
  ) {
    this.logger = logger;
    this.openAIService = openAIService;
    this.responseBuilderService = responseBuilderService;
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  /**
   * Main enhancement method - orchestrates the entire enhancement pipeline
   */
  async enhancePrompt(
    originalPrompt: string,
    context: EnhancementContext,
    options?: Partial<EnhancementOptions>
  ): Promise<PromptEnhancementResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('Starting prompt enhancement', {
        originalPrompt: originalPrompt.substring(0, 100) + '...',
        contextSize: JSON.stringify(context).length,
        options: options || 'default'
      });

      // Validate input
      const validation = this.validateEnhancementRequest(originalPrompt, context, options);
      if (!validation.isValid) {
        throw new Error(`Enhancement validation failed: ${validation.errors.join(', ')}`);
      }

      // Create enhancement request
      const request = this.createEnhancementRequest(originalPrompt, context, options);
      
      // Apply enhancement strategy
      const strategy = this.selectEnhancementStrategy(context, options);
      request.options.strategy = strategy;

      // Enhance prompt using OpenAI
      const enhancement = await this.openAIService.enhancePromptWithContext(request);
      
      // Validate enhancement quality
      const qualityValidation = this.validateEnhancementQuality(enhancement);
      if (!qualityValidation.isValid) {
        this.logger.warn('Enhancement quality below threshold', {
          qualityScore: enhancement.quality.overall,
          threshold: this.config.qualityThreshold,
          warnings: qualityValidation.warnings
        });
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(enhancement, processingTime, true);

      this.logger.info('Prompt enhancement completed successfully', {
        originalLength: originalPrompt.length,
        enhancedLength: enhancement.enhancedPrompt.length,
        qualityScore: enhancement.quality.overall,
        confidenceScore: enhancement.confidence.overall,
        processingTime
      });

      return enhancement;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(null, processingTime, false);
      
      this.logger.error('Prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalPrompt: originalPrompt.substring(0, 100) + '...',
        processingTime
      });

      // Return fallback if enabled
      if (this.config.fallbackEnabled) {
        return this.createFallbackEnhancement(originalPrompt, context);
      }

      throw error;
    }
  }

  /**
   * Enhance prompt with context-aware strategy selection
   */
  async enhancePromptWithStrategy(
    originalPrompt: string,
    context: EnhancementContext,
    strategyType: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware',
    strategyOptions?: Partial<EnhancementStrategy>
  ): Promise<PromptEnhancementResponse> {
    const strategy: EnhancementStrategy = {
      type: strategyType,
      focus: strategyOptions?.focus || ['clarity', 'actionability'],
      approach: strategyOptions?.approach || 'comprehensive',
      priority: strategyOptions?.priority || 'quality'
    };

    const options: Partial<EnhancementOptions> = {
      strategy,
      ...strategyOptions
    };

    return this.enhancePrompt(originalPrompt, context, options);
  }

  /**
   * Enhance prompt with framework-specific strategy
   */
  async enhancePromptForFramework(
    originalPrompt: string,
    context: EnhancementContext,
    framework: string,
    version?: string
  ): Promise<PromptEnhancementResponse> {
    const frameworkContext: FrameworkContext = {
      ...context.frameworkContext,
      framework,
      version: version || 'Unknown'
    };

    const enhancedContext: EnhancementContext = {
      ...context,
      frameworkContext
    };

    return this.enhancePromptWithStrategy(
      originalPrompt,
      enhancedContext,
      'framework-specific'
    );
  }

  /**
   * Enhance prompt with quality-focused strategy
   */
  async enhancePromptForQuality(
    originalPrompt: string,
    context: EnhancementContext,
    qualityFocus: string[]
  ): Promise<PromptEnhancementResponse> {
    const qualityRequirements: QualityRequirements = {
      accessibility: qualityFocus.includes('accessibility'),
      performance: qualityFocus.includes('performance'),
      security: qualityFocus.includes('security'),
      testing: qualityFocus.includes('testing'),
      documentation: qualityFocus.includes('documentation'),
      maintainability: qualityFocus.includes('maintainability'),
      scalability: qualityFocus.includes('scalability'),
      userExperience: qualityFocus.includes('userExperience')
    };

    const enhancedContext: EnhancementContext = {
      ...context,
      qualityRequirements
    };

    return this.enhancePromptWithStrategy(
      originalPrompt,
      enhancedContext,
      'quality-focused'
    );
  }

  /**
   * Enhance prompt with project-aware strategy
   */
  async enhancePromptForProject(
    originalPrompt: string,
    context: EnhancementContext,
    projectType: 'frontend' | 'backend' | 'fullstack' | 'library' | 'mobile' | 'desktop' | 'cli' | 'other'
  ): Promise<PromptEnhancementResponse> {
    const projectContext: ProjectContext = {
      ...context.projectContext,
      projectType
    };

    const enhancedContext: EnhancementContext = {
      ...context,
      projectContext
    };

    return this.enhancePromptWithStrategy(
      originalPrompt,
      enhancedContext,
      'project-aware'
    );
  }

  /**
   * Get enhancement metrics
   */
  getMetrics(): EnhancementMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset enhancement metrics
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Update enhancement configuration
   */
  updateConfig(config: Partial<EnhancementAgentConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Enhancement configuration updated', { config });
  }

  /**
   * Validate enhancement request
   */
  private validateEnhancementRequest(
    originalPrompt: string,
    context: EnhancementContext,
    options?: Partial<EnhancementOptions>
  ): EnhancementValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate original prompt
    if (!originalPrompt || originalPrompt.trim().length === 0) {
      errors.push('Original prompt is required and cannot be empty');
    }

    if (originalPrompt.length > 10000) {
      warnings.push('Original prompt is very long, consider shortening for better results');
    }

    // Validate context
    if (!context.projectContext) {
      warnings.push('Project context is missing, enhancement may be less accurate');
    }

    if (!context.frameworkContext) {
      warnings.push('Framework context is missing, enhancement may be less accurate');
    }

    // Validate options
    if (options?.maxTokens && options.maxTokens > 4000) {
      warnings.push('Max tokens is very high, consider reducing for cost optimization');
    }

    if (options?.temperature && (options.temperature < 0 || options.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    // Check cost limits
    if (this.config.costLimit > 0) {
      const estimatedCost = this.estimateEnhancementCost(originalPrompt, context, options);
      if (estimatedCost > this.config.costLimit) {
        warnings.push(`Estimated cost ($${estimatedCost.toFixed(4)}) exceeds limit ($${this.config.costLimit})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Create enhancement request from parameters
   */
  private createEnhancementRequest(
    originalPrompt: string,
    context: EnhancementContext,
    options?: Partial<EnhancementOptions>
  ): PromptEnhancementRequest {
    const defaultOptions: EnhancementOptions = {
      strategy: this.config.defaultStrategy,
      qualityThreshold: this.config.qualityThreshold,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      includeExamples: true,
      includeBestPractices: true,
      includeAntiPatterns: false,
      includePerformanceTips: true,
      includeSecurityConsiderations: true,
      includeTestingApproaches: true
    };

    const enhancementOptions = { ...defaultOptions, ...options };

    const goals: EnhancementGoals = {
      primary: 'Enhance prompt clarity and actionability',
      secondary: [
        'Integrate framework-specific best practices',
        'Apply quality requirements',
        'Provide specific implementation guidance'
      ],
      constraints: [
        'Maintain original intent',
        'Use appropriate technical terminology',
        'Ensure implementable solutions'
      ],
      successCriteria: [
        'Enhanced prompt is more specific than original',
        'Includes relevant technical context',
        'Provides clear implementation steps'
      ],
      expectedOutcome: 'A more actionable and context-aware prompt that leads to better implementation results'
    };

    return {
      originalPrompt,
      context,
      options: enhancementOptions,
      goals
    };
  }

  /**
   * Select enhancement strategy based on context
   */
  private selectEnhancementStrategy(
    context: EnhancementContext,
    options?: Partial<EnhancementOptions>
  ): EnhancementStrategy {
    if (options?.strategy) {
      return options.strategy;
    }

    // Framework-specific strategy
    if (context.frameworkContext?.framework && context.frameworkContext.framework !== 'Unknown') {
      return {
        type: 'framework-specific',
        focus: ['clarity', 'actionability', 'best-practices'],
        approach: 'framework-optimized',
        priority: 'quality'
      };
    }

    // Quality-focused strategy
    const qualityRequirements = context.qualityRequirements;
    if (qualityRequirements && Object.values(qualityRequirements).some(req => req)) {
      return {
        type: 'quality-focused',
        focus: ['quality', 'best-practices', 'standards'],
        approach: 'quality-optimized',
        priority: 'quality'
      };
    }

    // Project-aware strategy
    if (context.projectContext?.projectType && context.projectContext.projectType !== 'other') {
      return {
        type: 'project-aware',
        focus: ['clarity', 'actionability', 'project-context'],
        approach: 'project-optimized',
        priority: 'quality'
      };
    }

    // Default general strategy
    return this.config.defaultStrategy;
  }

  /**
   * Validate enhancement quality
   */
  private validateEnhancementQuality(enhancement: PromptEnhancementResponse): EnhancementValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check quality score
    if (enhancement.quality.overall < this.config.qualityThreshold) {
      warnings.push(`Quality score (${enhancement.quality.overall}) is below threshold (${this.config.qualityThreshold})`);
    }

    // Check confidence score
    if (enhancement.confidence.overall < 0.7) {
      warnings.push(`Confidence score (${enhancement.confidence.overall}) is low`);
    }

    // Check if enhancement is actually better
    if (enhancement.metadata.enhancedLength < enhancement.metadata.originalLength * 0.5) {
      warnings.push('Enhanced prompt is significantly shorter than original');
    }

    // Check for improvements
    if (enhancement.improvements.length === 0) {
      warnings.push('No improvements were identified in the enhancement');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Create fallback enhancement when AI enhancement fails
   */
  private createFallbackEnhancement(
    originalPrompt: string,
    context: EnhancementContext
  ): PromptEnhancementResponse {
    this.logger.warn('Creating fallback enhancement', {
      originalPrompt: originalPrompt.substring(0, 100) + '...'
    });

    // Simple fallback - just add basic context
    let enhancedPrompt = originalPrompt;
    
    if (context.frameworkContext?.framework) {
      enhancedPrompt += `\n\nFramework: ${context.frameworkContext.framework}`;
    }
    
    if (context.projectContext?.projectType) {
      enhancedPrompt += `\nProject Type: ${context.projectContext.projectType}`;
    }

    return {
      enhancedPrompt,
      metadata: {
        originalLength: originalPrompt.length,
        enhancedLength: enhancedPrompt.length,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
          model: 'fallback'
        },
        processingTime: 0,
        strategy: { type: 'general', focus: [], approach: 'fallback', priority: 'speed' },
        framework: context.frameworkContext?.framework || 'Unknown',
        projectType: context.projectContext?.projectType || 'Unknown',
        timestamp: new Date()
      },
      quality: {
        clarity: 0.6,
        specificity: 0.6,
        actionability: 0.6,
        completeness: 0.6,
        relevance: 0.6,
        overall: 0.6
      },
      confidence: {
        overall: 0.5,
        contextRelevance: 0.5,
        frameworkAccuracy: 0.5,
        qualityAlignment: 0.5,
        projectFit: 0.5
      },
      improvements: [],
      recommendations: ['Consider using AI enhancement for better results']
    };
  }

  /**
   * Estimate enhancement cost
   */
  private estimateEnhancementCost(
    originalPrompt: string,
    context: EnhancementContext,
    options?: Partial<EnhancementOptions>
  ): number {
    const maxTokens = options?.maxTokens || this.config.maxTokens;
    const model = 'gpt-4'; // Default model
    
    // Rough cost estimation (this should be more sophisticated in production)
    const estimatedTokens = Math.min(maxTokens, 2000);
    const costPerToken = 0.03 / 1000; // GPT-4 input cost
    
    return estimatedTokens * costPerToken;
  }

  /**
   * Update enhancement metrics
   */
  private updateMetrics(
    enhancement: PromptEnhancementResponse | null,
    processingTime: number,
    success: boolean
  ): void {
    this.metrics.totalEnhancements++;
    
    if (success && enhancement) {
      this.metrics.successfulEnhancements++;
      this.metrics.averageQualityScore = 
        (this.metrics.averageQualityScore * (this.metrics.successfulEnhancements - 1) + enhancement.quality.overall) / 
        this.metrics.successfulEnhancements;
      this.metrics.averageConfidenceScore = 
        (this.metrics.averageConfidenceScore * (this.metrics.successfulEnhancements - 1) + enhancement.confidence.overall) / 
        this.metrics.successfulEnhancements;
      this.metrics.totalCost += enhancement.metadata.tokenUsage.cost;
    } else {
      this.metrics.failedEnhancements++;
    }
    
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalEnhancements - 1) + processingTime) / 
      this.metrics.totalEnhancements;
    
    this.metrics.averageCostPerEnhancement = 
      this.metrics.totalCost / this.metrics.successfulEnhancements;
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): EnhancementMetrics {
    return {
      totalEnhancements: 0,
      successfulEnhancements: 0,
      failedEnhancements: 0,
      averageQualityScore: 0,
      averageConfidenceScore: 0,
      averageProcessingTime: 0,
      totalCost: 0,
      averageCostPerEnhancement: 0,
      qualityDistribution: {},
      strategyPerformance: {}
    };
  }
}
