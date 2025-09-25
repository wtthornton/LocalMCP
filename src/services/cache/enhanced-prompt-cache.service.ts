/**
 * Enhanced Prompt Cache Service
 * 
 * Extends the existing PromptCacheService to include AI summarization
 * for reducing token usage while maintaining cache effectiveness.
 */

import { Logger } from '../logger/logger.js';
import { PromptCacheService } from './prompt-cache.service.js';
import { SimpleSummarizationService } from '../ai/simple-summarization.service.js';
import type { SummarizedContext } from '../ai/simple-summarization.service.js';
import { ConfigService } from '../../config/config.service.js';

export class EnhancedPromptCacheService extends PromptCacheService {
  private summarizationService: SimpleSummarizationService;
  private summarizationEnabled: boolean;

  constructor(
    dbPath: string,
    openaiApiKey: string,
    summarizationEnabled: boolean = true,
    logger?: Logger
  ) {
    const configService = new ConfigService();
    super(logger || new Logger('EnhancedPromptCacheService'), configService);
    this.summarizationEnabled = summarizationEnabled;
    
    if (summarizationEnabled && openaiApiKey) {
      this.summarizationService = new SimpleSummarizationService(openaiApiKey, logger);
    }
  }

  /**
   * Enhanced cache entry with summarization support
   */
  async getCachedPrompt(
    originalPrompt: string,
    context: any,
    frameworkDetection: any
  ): Promise<any> {
    // First try the normal cache
    const cached = await super.getCachedPrompt(originalPrompt, context, frameworkDetection);
    if (cached) {
      return cached;
    }

    // If no cache hit and summarization is enabled, try to summarize context
    if (this.summarizationEnabled && this.summarizationService && context.context_used) {
      try {
        const summarizedContext = await this.summarizationService.summarizeContext(context.context_used);
        
        // Create a new context with summarized data
        const enhancedContext = {
          ...context,
          context_used: {
            repo_facts: summarizedContext.repoFacts,
            code_snippets: summarizedContext.codeSnippets,
            context7_docs: summarizedContext.context7Docs
          },
          _summarized: true,
          _tokenReduction: Math.round((1 - summarizedContext.summarizedTokenCount / summarizedContext.originalTokenCount) * 100)
        };

        // Try cache again with summarized context
        const summarizedCached = await super.getCachedPrompt(originalPrompt, enhancedContext, frameworkDetection);
        if (summarizedCached) {
          this.logger.debug('Cache hit with summarized context', {
            tokenReduction: enhancedContext._tokenReduction + '%'
          });
          return summarizedCached;
        }
      } catch (error) {
        this.logger.warn('Summarization failed, using original context', { error });
      }
    }

    return null;
  }

  /**
   * Enhanced cache storage with summarization
   */
  async setCachedPrompt(
    key: string,
    originalPrompt: string,
    enhancedPrompt: string,
    context: any,
    frameworkDetection: any,
    qualityScore: number,
    tokenCount: number
  ): Promise<void> {
    // If context is large and summarization is enabled, summarize before caching
    if (this.summarizationEnabled && this.summarizationService && context.context_used) {
      const contextTokens = this.estimateContextTokens(context.context_used);
      
      if (contextTokens > 500) { // Only summarize if context is substantial
        try {
          const summarizedContext = await this.summarizationService.summarizeContext(context.context_used);
          
          // Create enhanced context with summarization metadata
          const enhancedContext = {
            ...context,
            context_used: {
              repo_facts: summarizedContext.repoFacts,
              code_snippets: summarizedContext.codeSnippets,
              context7_docs: summarizedContext.context7Docs
            },
            _summarized: true,
            _originalTokenCount: summarizedContext.originalTokenCount,
            _summarizedTokenCount: summarizedContext.summarizedTokenCount,
            _tokenReduction: Math.round((1 - summarizedContext.summarizedTokenCount / summarizedContext.originalTokenCount) * 100)
          };

          // Cache with summarized context
          await super.cachePrompt(
            originalPrompt,
            enhancedPrompt,
            enhancedContext,
            frameworkDetection,
            qualityScore,
            0, // responseTime not available in this context
            'medium'
          );

          this.logger.debug('Cached with summarized context', {
            originalTokens: summarizedContext.originalTokenCount,
            summarizedTokens: summarizedContext.summarizedTokenCount,
            reduction: enhancedContext._tokenReduction + '%'
          });

          return;
        } catch (error) {
          this.logger.warn('Summarization failed during caching, using original context', { error });
        }
      }
    }

    // Cache with original context
    await super.cachePrompt(
      originalPrompt,
      enhancedPrompt,
      context,
      frameworkDetection,
      qualityScore,
      tokenCount,
      'medium'
    );
  }

  /**
   * Estimate token count for context
   */
  private estimateContextTokens(context: any): number {
    const text = JSON.stringify(context);
    return Math.ceil(text.length / 4); // Rough estimate
  }

  /**
   * Get cache statistics including summarization metrics
   */
  async getEnhancedStats(): Promise<any> {
    const baseStats = await super.getCacheStats();
    
    // Add summarization metrics if available
    if (this.summarizationEnabled) {
      return {
        ...baseStats,
        summarizationEnabled: true,
        summarizationMetrics: {
          // These would be tracked in a real implementation
          totalSummarizations: 0,
          averageTokenReduction: 0,
          summarizationSuccessRate: 0
        }
      };
    }

    return baseStats;
  }
}
