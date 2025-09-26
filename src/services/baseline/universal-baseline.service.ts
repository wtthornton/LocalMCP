/**
 * Universal Baseline Service
 * 
 * Provides universal baseline keywords that are always included in prompts.
 * Reuses existing UniversalQualityKeywordsService for maximum code reuse.
 * 
 * Benefits for vibe coders:
 * - Always includes essential quality keywords
 * - Reuses existing quality keywords service
 * - Simple, reliable baseline
 * - No fallback complexity needed
 */

import { Logger } from '../logger/logger.js';
import { UniversalQualityKeywordsService } from '../quality/universal-quality-keywords.service.js';
import type { KeywordInjectionOptions, EnhancedPromptResult } from '../../types/quality-keywords.types.js';

export interface BaselineResult {
  enhancedPrompt: string;
  baselineKeywords: string[];
  success: boolean;
  error?: string;
}

export interface BaselineOptions {
  framework?: string;
  maxTokens?: number;
  includeExamples?: boolean;
}

export class UniversalBaselineService {
  private logger: Logger;
  private universalKeywords: UniversalQualityKeywordsService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.universalKeywords = new UniversalQualityKeywordsService(logger);
  }

  /**
   * Apply universal baseline to a prompt
   * Always includes the 6 approved universal keywords
   */
  applyBaseline(
    originalPrompt: string,
    options: BaselineOptions = {}
  ): BaselineResult {
    const { framework = 'generic', maxTokens = 2000, includeExamples = true } = options;

    this.logger.debug('Applying universal baseline', {
      originalPromptLength: originalPrompt.length,
      framework,
      maxTokens
    });

    try {
      // Use existing universal keywords service
      const injectionOptions: KeywordInjectionOptions = {
        includeFrameworkSpecific: true,
        targetFramework: framework,
        maxTokens,
        minEnforcementLevel: 'medium',
        includeExamples
      };

      const result: EnhancedPromptResult = this.universalKeywords.injectKeywords(
        originalPrompt,
        framework,
        injectionOptions
      );

      // Extract the 6 approved universal keywords
      const baselineKeywords = this.getApprovedUniversalKeywords();

      this.logger.info('Universal baseline applied successfully', {
        originalLength: originalPrompt.length,
        enhancedLength: result.enhancedPrompt.length,
        keywordsInjected: result.injectedKeywords.length,
        estimatedQualityScore: result.estimatedQualityScore
      });

      return {
        enhancedPrompt: result.enhancedPrompt,
        baselineKeywords,
        success: true
      };

    } catch (error) {
      this.logger.error('Universal baseline application failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        enhancedPrompt: originalPrompt,
        baselineKeywords: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the 6 approved universal keywords
   * These are the small, essential keywords that are always included
   */
  getApprovedUniversalKeywords(): string[] {
    return [
      'secure coding practices',
      'input validation',
      'step-by-step',
      'accessibility compliant',
      'performance optimized',
      'unit tests'
    ];
  }

  /**
   * Check if baseline service is available
   */
  isAvailable(): boolean {
    return !!this.universalKeywords;
  }

  /**
   * Get baseline keywords for a specific framework
   */
  getFrameworkBaselineKeywords(framework: string): string[] {
    const baseKeywords = this.getApprovedUniversalKeywords();
    
    // Add framework-specific keywords if needed
    const frameworkSpecific: Record<string, string[]> = {
      'react': ['useState', 'useEffect', 'component lifecycle'],
      'vue': ['computed', 'watch', 'reactive'],
      'angular': ['dependency injection', 'services', 'components'],
      'html': ['semantic HTML', 'ARIA attributes'],
      'css': ['responsive design', 'CSS Grid', 'Flexbox'],
      'javascript': ['ES6+ features', 'async/await', 'modules'],
      'typescript': ['type safety', 'interfaces', 'generics']
    };

    const additional = frameworkSpecific[framework.toLowerCase()] || [];
    return [...baseKeywords, ...additional];
  }

  /**
   * Validate that baseline was applied correctly
   */
  validateBaseline(enhancedPrompt: string, framework: string = 'generic'): boolean {
    const requiredKeywords = this.getApprovedUniversalKeywords();
    
    const promptLower = enhancedPrompt.toLowerCase();
    const hasAllKeywords = requiredKeywords.every(keyword => 
      promptLower.includes(keyword.toLowerCase())
    );

    this.logger.debug('Baseline validation', {
      hasAllKeywords,
      requiredKeywords,
      promptLength: enhancedPrompt.length
    });

    return hasAllKeywords;
  }
}
