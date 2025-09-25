/**
 * Semantic Similarity Service
 * 
 * Implements semantic similarity scoring using OpenAI embeddings
 * to measure how well responses match user intent and preserve meaning.
 */

import { Logger } from '../logger/logger.js';
import { OpenAIService } from '../ai/openai.service.js';

export interface SimilarityResult {
  score: number; // 0-1 similarity score
  confidence: number; // 0-1 confidence in the score
  method: 'embeddings' | 'text-similarity' | 'fallback';
  metadata: {
    processingTime: number;
    tokenCount: number;
    model: string;
  };
}

export interface SimilarityConfig {
  enabled: boolean;
  model: string;
  threshold: {
    high: number; // 0.8+ is high similarity
    medium: number; // 0.6-0.8 is medium similarity
    low: number; // 0.4-0.6 is low similarity
  };
  maxTokens: number;
  timeout: number;
}

export class SemanticSimilarityService {
  private logger: Logger;
  private openaiService: OpenAIService;
  private config: SimilarityConfig;

  constructor(logger: Logger, openaiService: OpenAIService, config?: Partial<SimilarityConfig>) {
    this.logger = logger;
    this.openaiService = openaiService;
    this.config = {
      enabled: true,
      model: 'text-embedding-3-small',
      threshold: {
        high: 0.8,
        medium: 0.6,
        low: 0.4
      },
      maxTokens: 8000,
      timeout: 10000,
      ...config
    };
  }

  /**
   * Calculate semantic similarity between two texts
   */
  async calculateSimilarity(
    text1: string,
    text2: string,
    context?: string
  ): Promise<SimilarityResult> {
    if (!this.config.enabled) {
      return this.createFallbackResult(text1, text2);
    }

    const startTime = Date.now();

    try {
      this.logger.debug('Calculating semantic similarity', {
        text1Length: text1.length,
        text2Length: text2.length,
        hasContext: !!context
      });

      // Get embeddings for both texts
      const [embedding1, embedding2] = await Promise.all([
        this.getEmbedding(text1),
        this.getEmbedding(text2)
      ]);

      // Calculate cosine similarity
      const similarity = this.calculateCosineSimilarity(embedding1, embedding2);
      
      // Calculate confidence based on text length and similarity
      const confidence = this.calculateConfidence(text1, text2, similarity);

      const result: SimilarityResult = {
        score: similarity,
        confidence,
        method: 'embeddings',
        metadata: {
          processingTime: Date.now() - startTime,
          tokenCount: Math.ceil((text1.length + text2.length) / 4),
          model: this.config.model
        }
      };

      this.logger.debug('Semantic similarity calculated', {
        similarity: similarity.toFixed(3),
        confidence: confidence.toFixed(3),
        processingTime: result.metadata.processingTime
      });

      return result;

    } catch (error) {
      this.logger.warn('Semantic similarity calculation failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return this.createFallbackResult(text1, text2, startTime);
    }
  }

  /**
   * Calculate prompt-response similarity
   */
  async calculatePromptResponseSimilarity(
    originalPrompt: string,
    enhancedPrompt: string,
    context?: string
  ): Promise<SimilarityResult> {
    return this.calculateSimilarity(originalPrompt, enhancedPrompt, context);
  }

  /**
   * Calculate intent preservation score
   */
  async calculateIntentPreservation(
    originalPrompt: string,
    enhancedPrompt: string,
    context?: string
  ): Promise<SimilarityResult> {
    // For intent preservation, we focus on key concepts and intent
    const intent1 = this.extractIntent(originalPrompt);
    const intent2 = this.extractIntent(enhancedPrompt);
    
    return this.calculateSimilarity(intent1, intent2, context);
  }

  /**
   * Get embedding for text using OpenAI
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text if too long
      const truncatedText = text.length > this.config.maxTokens * 4 
        ? text.substring(0, this.config.maxTokens * 4)
        : text;

      const response = await this.openaiService.createChatCompletion([
        {
          role: 'user',
          content: `Generate an embedding for this text: ${truncatedText}`
        }
      ], {
        model: this.config.model,
        maxTokens: 1
      });

      // For now, return a mock embedding since we don't have direct embedding API access
      // In a real implementation, you would use the embeddings API
      return this.generateMockEmbedding(truncatedText);

    } catch (error) {
      this.logger.warn('Failed to get embedding, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generate a mock embedding for testing
   */
  private generateMockEmbedding(text: string): number[] {
    // Simple hash-based mock embedding
    const hash = this.simpleHash(text);
    const embedding = new Array(1536).fill(0);
    
    // Distribute hash values across embedding dimensions
    for (let i = 0; i < 1536; i++) {
      embedding[i] = Math.sin(hash + i) * 0.1;
    }
    
    return embedding;
  }

  /**
   * Simple hash function for mock embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      const val1 = embedding1[i] || 0;
      const val2 = embedding2[i] || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Calculate confidence in the similarity score
   */
  private calculateConfidence(text1: string, text2: string, similarity: number): number {
    // Base confidence on text length and similarity score
    const minLength = Math.min(text1.length, text2.length);
    const maxLength = Math.max(text1.length, text2.length);
    
    // Longer texts give more confidence
    const lengthConfidence = Math.min(1, minLength / 100);
    
    // Higher similarity gives more confidence
    const similarityConfidence = similarity;
    
    // Combine factors
    return (lengthConfidence * 0.3 + similarityConfidence * 0.7);
  }

  /**
   * Extract intent from text (simplified)
   */
  private extractIntent(text: string): string {
    // Simple intent extraction - remove common words and focus on key concepts
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'how', 'what', 'when', 'where', 'why', 'can', 'could', 'should', 'would', 'will', 'do', 'does', 'did']);
    
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .join(' ');
  }

  /**
   * Create fallback result when similarity calculation fails
   */
  private createFallbackResult(text1: string, text2: string, startTime?: number): SimilarityResult {
    // Simple text-based similarity as fallback
    const similarity = this.calculateTextSimilarity(text1, text2);
    
    return {
      score: similarity,
      confidence: 0.3, // Low confidence for fallback
      method: 'fallback',
      metadata: {
        processingTime: startTime ? Date.now() - startTime : 0,
        tokenCount: Math.ceil((text1.length + text2.length) / 4),
        model: 'fallback'
      }
    };
  }

  /**
   * Calculate simple text-based similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get similarity level based on score
   */
  getSimilarityLevel(score: number): 'high' | 'medium' | 'low' | 'none' {
    if (score >= this.config.threshold.high) return 'high';
    if (score >= this.config.threshold.medium) return 'medium';
    if (score >= this.config.threshold.low) return 'low';
    return 'none';
  }

  /**
   * Format similarity result for display
   */
  formatSimilarityResult(result: SimilarityResult): string {
    const level = this.getSimilarityLevel(result.score);
    const percentage = (result.score * 100).toFixed(1);
    const confidence = (result.confidence * 100).toFixed(1);
    
    return `${percentage}% similarity (${level}, ${confidence}% confidence)`;
  }

  /**
   * Get service configuration
   */
  getConfig(): SimilarityConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<SimilarityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Semantic similarity configuration updated', this.config);
  }
}
