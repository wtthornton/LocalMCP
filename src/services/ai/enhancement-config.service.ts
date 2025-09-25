/**
 * Enhancement Configuration Service
 * 
 * Manages configuration for prompt enhancement features
 * Handles environment variables, validation, and default values
 * 
 * Benefits for vibe coders:
 * - Simple configuration management
 * - Environment-based settings
 * - Validation and error handling
 * - Sensible defaults
 */

import { Logger } from '../logger/logger.js';
import type { 
  PromptEnhancementConfig,
  EnhancementStrategy,
  EnhancementOptimization
} from '../../types/prompt-enhancement.types.js';

export interface EnhancementConfigServiceConfig {
  enabled: boolean;
  defaultStrategy: EnhancementStrategy;
  qualityThreshold: number;
  maxTokens: number;
  temperature: number;
  costLimit: number;
  rateLimit: number;
  fallbackEnabled: boolean;
  optimization: EnhancementOptimization;
}

export class EnhancementConfigService {
  private logger: Logger;
  private config: EnhancementConfigServiceConfig;

  constructor(logger: Logger) {
    this.logger = logger;
    this.config = this.loadConfiguration();
  }

  /**
   * Get current configuration
   */
  getConfig(): EnhancementConfigServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<EnhancementConfigServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info('Enhancement configuration updated', { updates });
  }

  /**
   * Validate configuration
   */
  validateConfig(config: EnhancementConfigServiceConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate quality threshold
    if (config.qualityThreshold < 0 || config.qualityThreshold > 1) {
      errors.push('Quality threshold must be between 0 and 1');
    }

    // Validate max tokens
    if (config.maxTokens < 100 || config.maxTokens > 8000) {
      errors.push('Max tokens must be between 100 and 8000');
    }

    // Validate temperature
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }

    // Validate cost limit
    if (config.costLimit < 0) {
      errors.push('Cost limit must be non-negative');
    }

    // Validate rate limit
    if (config.rateLimit < 0) {
      errors.push('Rate limit must be non-negative');
    }

    // Validate strategy
    if (!config.defaultStrategy || !config.defaultStrategy.type) {
      errors.push('Default strategy is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): EnhancementConfigServiceConfig {
    const config: EnhancementConfigServiceConfig = {
      enabled: this.getBooleanEnv('PROMPT_ENHANCEMENT_ENABLED', true),
      defaultStrategy: this.getDefaultStrategy(),
      qualityThreshold: this.getNumberEnv('PROMPT_ENHANCEMENT_QUALITY_THRESHOLD', 0.8),
      maxTokens: this.getNumberEnv('PROMPT_ENHANCEMENT_MAX_TOKENS', 2000),
      temperature: this.getNumberEnv('PROMPT_ENHANCEMENT_TEMPERATURE', 0.3),
      costLimit: this.getNumberEnv('PROMPT_ENHANCEMENT_COST_LIMIT', 10.0),
      rateLimit: this.getNumberEnv('PROMPT_ENHANCEMENT_RATE_LIMIT', 100),
      fallbackEnabled: this.getBooleanEnv('PROMPT_ENHANCEMENT_FALLBACK_ENABLED', true),
      optimization: this.getOptimizationConfig()
    };

    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      this.logger.error('Invalid enhancement configuration', { errors: validation.errors });
      throw new Error(`Invalid enhancement configuration: ${validation.errors.join(', ')}`);
    }

    this.logger.info('Enhancement configuration loaded', { config });
    return config;
  }

  /**
   * Get default enhancement strategy
   */
  private getDefaultStrategy(): EnhancementStrategy {
    const strategyType = process.env.PROMPT_ENHANCEMENT_STRATEGY_TYPE || 'general';
    const focus = process.env.PROMPT_ENHANCEMENT_STRATEGY_FOCUS?.split(',') || ['clarity', 'actionability'];
    const approach = process.env.PROMPT_ENHANCEMENT_STRATEGY_APPROACH || 'comprehensive';
    const priority = process.env.PROMPT_ENHANCEMENT_STRATEGY_PRIORITY || 'quality';

    return {
      type: strategyType as 'general' | 'framework-specific' | 'quality-focused' | 'project-aware',
      focus: focus.map(f => f.trim()),
      approach,
      priority: priority as 'speed' | 'quality' | 'completeness' | 'clarity'
    };
  }

  /**
   * Get optimization configuration
   */
  private getOptimizationConfig(): EnhancementOptimization {
    return {
      tokenOptimization: {
        contextTruncation: this.getBooleanEnv('PROMPT_ENHANCEMENT_TOKEN_CONTEXT_TRUNCATION', true),
        smartSummarization: this.getBooleanEnv('PROMPT_ENHANCEMENT_TOKEN_SMART_SUMMARIZATION', true),
        relevanceFiltering: this.getBooleanEnv('PROMPT_ENHANCEMENT_TOKEN_RELEVANCE_FILTERING', true),
        priorityBasedSelection: this.getBooleanEnv('PROMPT_ENHANCEMENT_TOKEN_PRIORITY_SELECTION', true)
      },
      qualityOptimization: {
        qualityScoring: this.getBooleanEnv('PROMPT_ENHANCEMENT_QUALITY_SCORING', true),
        confidenceThresholds: this.getBooleanEnv('PROMPT_ENHANCEMENT_QUALITY_CONFIDENCE_THRESHOLDS', true),
        validationChecks: this.getBooleanEnv('PROMPT_ENHANCEMENT_QUALITY_VALIDATION_CHECKS', true),
        feedbackLoop: this.getBooleanEnv('PROMPT_ENHANCEMENT_QUALITY_FEEDBACK_LOOP', false)
      },
      costOptimization: {
        modelSelection: this.getBooleanEnv('PROMPT_ENHANCEMENT_COST_MODEL_SELECTION', true),
        tokenBudgeting: this.getBooleanEnv('PROMPT_ENHANCEMENT_COST_TOKEN_BUDGETING', true),
        cacheUtilization: this.getBooleanEnv('PROMPT_ENHANCEMENT_COST_CACHE_UTILIZATION', true),
        batchProcessing: this.getBooleanEnv('PROMPT_ENHANCEMENT_COST_BATCH_PROCESSING', false)
      },
      performanceOptimization: {
        parallelProcessing: this.getBooleanEnv('PROMPT_ENHANCEMENT_PERF_PARALLEL_PROCESSING', true),
        caching: this.getBooleanEnv('PROMPT_ENHANCEMENT_PERF_CACHING', true),
        responseStreaming: this.getBooleanEnv('PROMPT_ENHANCEMENT_PERF_RESPONSE_STREAMING', false),
        loadBalancing: this.getBooleanEnv('PROMPT_ENHANCEMENT_PERF_LOAD_BALANCING', false)
      }
    };
  }

  /**
   * Get boolean environment variable
   */
  private getBooleanEnv(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Get number environment variable
   */
  private getNumberEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get string environment variable
   */
  private getStringEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  /**
   * Get array environment variable
   */
  private getArrayEnv(key: string, defaultValue: string[]): string[] {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.split(',').map(item => item.trim());
  }

  /**
   * Export configuration for debugging
   */
  exportConfig(): Record<string, any> {
    return {
      ...this.config,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PROMPT_ENHANCEMENT_ENABLED: process.env.PROMPT_ENHANCEMENT_ENABLED,
        PROMPT_ENHANCEMENT_QUALITY_THRESHOLD: process.env.PROMPT_ENHANCEMENT_QUALITY_THRESHOLD,
        PROMPT_ENHANCEMENT_MAX_TOKENS: process.env.PROMPT_ENHANCEMENT_MAX_TOKENS,
        PROMPT_ENHANCEMENT_TEMPERATURE: process.env.PROMPT_ENHANCEMENT_TEMPERATURE,
        PROMPT_ENHANCEMENT_COST_LIMIT: process.env.PROMPT_ENHANCEMENT_COST_LIMIT,
        PROMPT_ENHANCEMENT_RATE_LIMIT: process.env.PROMPT_ENHANCEMENT_RATE_LIMIT,
        PROMPT_ENHANCEMENT_FALLBACK_ENABLED: process.env.PROMPT_ENHANCEMENT_FALLBACK_ENABLED,
        PROMPT_ENHANCEMENT_STRATEGY_TYPE: process.env.PROMPT_ENHANCEMENT_STRATEGY_TYPE,
        PROMPT_ENHANCEMENT_STRATEGY_FOCUS: process.env.PROMPT_ENHANCEMENT_STRATEGY_FOCUS,
        PROMPT_ENHANCEMENT_STRATEGY_APPROACH: process.env.PROMPT_ENHANCEMENT_STRATEGY_APPROACH,
        PROMPT_ENHANCEMENT_STRATEGY_PRIORITY: process.env.PROMPT_ENHANCEMENT_STRATEGY_PRIORITY
      }
    };
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = this.loadConfiguration();
    this.logger.info('Enhancement configuration reset to defaults');
  }

  /**
   * Check if enhancement is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if fallback is enabled
   */
  isFallbackEnabled(): boolean {
    return this.config.fallbackEnabled;
  }

  /**
   * Get quality threshold
   */
  getQualityThreshold(): number {
    return this.config.qualityThreshold;
  }

  /**
   * Get max tokens
   */
  getMaxTokens(): number {
    return this.config.maxTokens;
  }

  /**
   * Get temperature
   */
  getTemperature(): number {
    return this.config.temperature;
  }

  /**
   * Get cost limit
   */
  getCostLimit(): number {
    return this.config.costLimit;
  }

  /**
   * Get rate limit
   */
  getRateLimit(): number {
    return this.config.rateLimit;
  }

}
