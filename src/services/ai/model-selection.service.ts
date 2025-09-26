/**
 * Model Selection Service
 * 
 * Manages OpenAI model selection based on operation type and complexity
 * Optimizes cost and performance for different use cases
 * 
 * Benefits for vibe coders:
 * - Automatic model selection for optimal cost/performance
 * - Consistent model usage across operations
 * - Easy configuration and updates
 * - Cost optimization without sacrificing quality
 */

export interface ModelConfig {
  primary: string;    // gpt-4o - best overall performance
  fallback: string;   // gpt-4o-mini - cost-effective fallback
  complex: string;    // gpt-4o - for complex reasoning tasks
  simple: string;     // gpt-4o-mini - for simple operations
  test: string;       // gpt-4o-mini - for connection tests
}

export interface ModelSelectionOptions {
  operation: string;
  complexity?: 'simple' | 'medium' | 'complex';
  costSensitive?: boolean;
  maxTokens?: number;
}

export class ModelSelectionService {
  private config: ModelConfig = {
    primary: 'gpt-4o',
    fallback: 'gpt-4o-mini', 
    complex: 'gpt-4o',
    simple: 'gpt-4o-mini',
    test: 'gpt-4o-mini'
  };

  constructor(customConfig?: Partial<ModelConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  /**
   * Select the best model for an operation
   */
  selectModel(options: ModelSelectionOptions): string {
    const { operation, complexity, costSensitive, maxTokens } = options;

    // Connection tests always use the cheapest model
    if (operation === 'connectionTest') {
      return this.config.test;
    }

    // Cost-sensitive operations use mini model
    if (costSensitive) {
      return this.config.simple;
    }

    // High token count operations might benefit from better model
    if (maxTokens && maxTokens > 3000) {
      return this.config.complex;
    }

    // Complexity-based selection
    if (complexity === 'simple') {
      return this.config.simple;
    }
    
    if (complexity === 'complex') {
      return this.config.complex;
    }

    // Default to primary model
    return this.config.primary;
  }

  /**
   * Get model configuration
   */
  getConfig(): ModelConfig {
    return { ...this.config };
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get model info for debugging
   */
  getModelInfo(model: string): {
    name: string;
    type: 'primary' | 'fallback' | 'complex' | 'simple' | 'test';
    costPer1K: { input: number; output: number };
    maxTokens: number;
    description: string;
  } {
    const modelInfo = {
      'gpt-4o': {
        costPer1K: { input: 0.005, output: 0.015 },
        maxTokens: 128000,
        description: 'Most capable model, best for complex tasks'
      },
      'gpt-4o-mini': {
        costPer1K: { input: 0.00015, output: 0.0006 },
        maxTokens: 128000,
        description: 'Fast and cost-effective, good for most tasks'
      },
      'gpt-4': {
        costPer1K: { input: 0.03, output: 0.06 },
        maxTokens: 8192,
        description: 'Previous generation, high cost'
      },
      'gpt-3.5-turbo': {
        costPer1K: { input: 0.0015, output: 0.002 },
        maxTokens: 16384,
        description: 'Legacy model, very cheap but limited'
      }
    };

    const info = modelInfo[model as keyof typeof modelInfo] || modelInfo['gpt-4o'];
    const type = this.getModelType(model);

    return {
      name: model,
      type,
      ...info
    };
  }

  /**
   * Determine model type based on configuration
   */
  private getModelType(model: string): 'primary' | 'fallback' | 'complex' | 'simple' | 'test' {
    if (model === this.config.primary) return 'primary';
    if (model === this.config.fallback) return 'fallback';
    if (model === this.config.complex) return 'complex';
    if (model === this.config.simple) return 'simple';
    if (model === this.config.test) return 'test';
    return 'primary';
  }

  /**
   * Estimate cost for a model and token usage
   */
  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const info = this.getModelInfo(model);
    const inputCost = (inputTokens / 1000) * info.costPer1K.input;
    const outputCost = (outputTokens / 1000) * info.costPer1K.output;
    return inputCost + outputCost;
  }

  /**
   * Get recommended model for specific operations
   */
  getRecommendedModel(operation: string): string {
    const recommendations: Record<string, string> = {
      'taskBreakdown': this.config.complex,      // Needs reasoning
      'promptEnhancement': this.config.complex,  // Needs creativity
      'complexityAnalysis': this.config.simple,  // Simple classification
      'summarization': this.config.simple,       // Straightforward task
      'connectionTest': this.config.test,        // Minimal cost
      'codeGeneration': this.config.complex,     // Needs accuracy
      'debugging': this.config.complex,          // Needs reasoning
      'documentation': this.config.simple        // Straightforward task
    };

    return recommendations[operation] || this.config.primary;
  }

  /**
   * Check if model supports required token count
   */
  supportsTokenCount(model: string, tokenCount: number): boolean {
    const info = this.getModelInfo(model);
    return tokenCount <= info.maxTokens;
  }

  /**
   * Get fallback model if primary doesn't support token count
   */
  getFallbackForTokens(primaryModel: string, tokenCount: number): string {
    if (this.supportsTokenCount(primaryModel, tokenCount)) {
      return primaryModel;
    }

    // Try complex model first, then simple
    if (this.supportsTokenCount(this.config.complex, tokenCount)) {
      return this.config.complex;
    }
    
    if (this.supportsTokenCount(this.config.simple, tokenCount)) {
      return this.config.simple;
    }

    // Last resort - use primary and let OpenAI handle truncation
    return this.config.primary;
  }
}
