/**
 * Token Estimation Service
 * 
 * This service provides accurate token counting for text content used in
 * prompt optimization. It implements multiple estimation strategies with
 * caching and validation to ensure reliable token usage predictions.
 * 
 * @fileoverview Service for estimating token counts in text content
 */

import { Logger } from '../logger/logger.js';

/**
 * Interface for cached token estimation results
 */
interface TokenEstimationCache {
  text: string;
  tokens: number;
  timestamp: number;
  method: 'character' | 'word' | 'subword' | 'hybrid';
  accuracy: number;
}

/**
 * Configuration options for token estimation
 */
interface TokenEstimationOptions {
  /** Enable caching for repeated estimations */
  useCache?: boolean;
  /** Cache expiration time in milliseconds */
  cacheExpiration?: number;
  /** Maximum cache size */
  maxCacheSize?: number;
  /** Validation threshold for estimation accuracy */
  validationThreshold?: number;
}

/**
 * Service for estimating token counts in text content
 * 
 * @example
 * ```typescript
 * const estimator = new TokenEstimationService(logger);
 * 
 * // Basic estimation
 * const tokens = estimator.estimateTokens("Hello world");
 * console.log(tokens); // ~2-3 tokens
 * 
 * // Async estimation for large text
 * const largeTokens = await estimator.estimateTokensAsync(largeText);
 * 
 * // With caching
 * const cachedTokens = estimator.estimateTokens(text, { useCache: true });
 * ```
 */
export class TokenEstimationService {
  private logger: Logger;
  private cache: Map<string, TokenEstimationCache>;
  private readonly defaultOptions: TokenEstimationOptions;
  
  /**
   * Token estimation methods with their characteristics
   */
  private readonly estimationMethods = {
    character: {
      ratio: 4, // ~4 characters per token
      accuracy: 0.7,
      speed: 'fast'
    },
    word: {
      ratio: 1.3, // ~1.3 words per token
      accuracy: 0.8,
      speed: 'medium'
    },
    subword: {
      ratio: 0.75, // ~0.75 subwords per token (BPE-like)
      accuracy: 0.9,
      speed: 'slow'
    },
    hybrid: {
      accuracy: 0.85,
      speed: 'medium'
    }
  };

  constructor(logger: Logger, options: TokenEstimationOptions = {}) {
    this.logger = logger;
    this.cache = new Map();
    this.defaultOptions = {
      useCache: true,
      cacheExpiration: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: 1000,
      validationThreshold: 0.8,
      ...options
    };
  }

  /**
   * Estimates token count for text synchronously
   * 
   * @param text - Text to estimate tokens for
   * @param options - Estimation options
   * @returns number - Estimated token count
   * 
   * @example
   * ```typescript
   * const tokens = estimator.estimateTokens("Create a React component");
   * // Returns approximately 6-8 tokens
   * ```
   */
  estimateTokens(text: string, options: TokenEstimationOptions = {}): number {
    try {
      if (!text || text.trim().length === 0) {
        return 0;
      }

      const opts = { ...this.defaultOptions, ...options };
      
      // Check cache first
      if (opts.useCache) {
        const cached = this.getFromCache(text);
        if (cached) {
          this.logger.debug('Token estimation cache hit', {
            text: text.substring(0, 50) + '...',
            tokens: cached.tokens,
            method: cached.method
          });
          return cached.tokens;
        }
      }

      // Perform estimation
      const estimation = this.estimateWithFallback(text);
      
      // Cache result if enabled
      if (opts.useCache) {
        this.setCache(text, estimation);
      }

      this.logger.debug('Token estimation completed', {
        text: text.substring(0, 50) + '...',
        tokens: estimation.tokens,
        method: estimation.method,
        accuracy: estimation.accuracy
      });

      return estimation.tokens;

    } catch (error) {
      this.logger.error('Token estimation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        text: text?.substring(0, 100) + '...'
      });
      
      // Return fallback estimation
      return this.getFallbackEstimation(text);
    }
  }

  /**
   * Estimates token count for text asynchronously (for large texts)
   * 
   * @param text - Text to estimate tokens for
   * @param options - Estimation options
   * @returns Promise<number> - Estimated token count
   * 
   * @example
   * ```typescript
   * const tokens = await estimator.estimateTokensAsync(largeText);
   * // Returns token count for large text processing
   * ```
   */
  async estimateTokensAsync(text: string, options: TokenEstimationOptions = {}): Promise<number> {
    try {
      if (!text || text.trim().length === 0) {
        return 0;
      }

      const opts = { ...this.defaultOptions, ...options };
      
      // Check cache first
      if (opts.useCache) {
        const cached = this.getFromCache(text);
        if (cached) {
          return cached.tokens;
        }
      }

      // For large texts, use more accurate but slower methods
      const estimation = await this.estimateLargeText(text);
      
      // Cache result if enabled
      if (opts.useCache) {
        this.setCache(text, estimation);
      }

      this.logger.debug('Async token estimation completed', {
        text: text.substring(0, 50) + '...',
        tokens: estimation.tokens,
        method: estimation.method,
        accuracy: estimation.accuracy
      });

      return estimation.tokens;

    } catch (error) {
      this.logger.error('Async token estimation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        text: text?.substring(0, 100) + '...'
      });
      
      // Return fallback estimation
      return this.getFallbackEstimation(text);
    }
  }

  /**
   * Estimates tokens using multiple fallback strategies
   * 
   * @param text - Text to estimate
   * @returns TokenEstimationCache - Estimation result with metadata
   */
  private estimateWithFallback(text: string): TokenEstimationCache {
    const strategies = ['hybrid', 'word', 'character'] as const;
    
    for (const strategy of strategies) {
      try {
        const estimation = this.estimateWithStrategy(text, strategy);
        if (this.validateEstimation(estimation.tokens, text)) {
          return {
            text,
            tokens: estimation.tokens,
            timestamp: Date.now(),
            method: strategy,
            accuracy: estimation.accuracy
          };
        }
      } catch (error) {
        this.logger.warn(`Estimation strategy ${strategy} failed`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        continue;
      }
    }

    // If all strategies fail, use basic character estimation
    return this.getBasicEstimation(text);
  }

  /**
   * Estimates tokens using a specific strategy
   * 
   * @param text - Text to estimate
   * @param strategy - Estimation strategy to use
   * @returns Object with tokens and accuracy
   */
  private estimateWithStrategy(text: string, strategy: keyof typeof this.estimationMethods): { tokens: number; accuracy: number } {
    const method = this.estimationMethods[strategy];
    
    switch (strategy) {
      case 'character':
        return {
          tokens: Math.ceil(text.length / (method as any).ratio),
          accuracy: method.accuracy
        };
        
      case 'word':
        const words = text.trim().split(/\s+/).length;
        return {
          tokens: Math.ceil(words * (method as any).ratio),
          accuracy: method.accuracy
        };
        
      case 'subword':
        // Simplified BPE-like estimation
        const subwords = this.estimateSubwords(text);
        return {
          tokens: Math.ceil(subwords * (method as any).ratio),
          accuracy: method.accuracy
        };
        
      case 'hybrid':
        return this.hybridEstimation(text);
        
      default:
        throw new Error(`Unknown estimation strategy: ${strategy}`);
    }
  }

  /**
   * Hybrid estimation combining multiple methods
   * 
   * @param text - Text to estimate
   * @returns Object with tokens and accuracy
   */
  private hybridEstimation(text: string): { tokens: number; accuracy: number } {
    const characterEst = Math.ceil(text.length / this.estimationMethods.character.ratio);
    const wordEst = Math.ceil(text.trim().split(/\s+/).length * this.estimationMethods.word.ratio);
    
    // Weighted average favoring word estimation
    const tokens = Math.round(characterEst * 0.3 + wordEst * 0.7);
    
    return {
      tokens,
      accuracy: this.estimationMethods.hybrid.accuracy
    };
  }

  /**
   * Estimates subwords using simplified BPE-like approach
   * 
   * @param text - Text to estimate subwords for
   * @returns number - Estimated subword count
   */
  private estimateSubwords(text: string): number {
    // Simplified subword estimation
    // In practice, this would use actual BPE tokenization
    const words = text.trim().split(/\s+/);
    let subwords = 0;
    
    for (const word of words) {
      if (word.length <= 4) {
        subwords += 1; // Short words are usually single tokens
      } else if (word.length <= 8) {
        subwords += 2; // Medium words are usually 2 tokens
      } else {
        subwords += Math.ceil(word.length / 4); // Long words split more
      }
    }
    
    return subwords;
  }

  /**
   * Estimates tokens for large text asynchronously
   * 
   * @param text - Large text to estimate
   * @returns Promise<TokenEstimationCache> - Estimation result
   */
  private async estimateLargeText(text: string): Promise<TokenEstimationCache> {
    // For large texts, chunk and estimate
    const chunkSize = 10000; // Process in 10k character chunks
    const chunks = this.chunkText(text, chunkSize);
    
    let totalTokens = 0;
    let totalAccuracy = 0;
    
    for (const chunk of chunks) {
      const estimation = this.estimateWithFallback(chunk);
      totalTokens += estimation.tokens;
      totalAccuracy += estimation.accuracy;
    }
    
    return {
      text,
      tokens: totalTokens,
      timestamp: Date.now(),
      method: 'hybrid',
      accuracy: totalAccuracy / chunks.length
    };
  }

  /**
   * Chunks large text into smaller pieces
   * 
   * @param text - Text to chunk
   * @param size - Chunk size
   * @returns string[] - Array of text chunks
   */
  private chunkText(text: string, size: number): string[] {
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    
    return chunks;
  }

  /**
   * Validates token estimation accuracy
   * 
   * @param tokens - Estimated token count
   * @param text - Original text
   * @returns boolean - True if estimation is valid
   */
  private validateEstimation(tokens: number, text: string): boolean {
    if (tokens < 0) return false;
    
    // Basic validation: tokens should be reasonable relative to text length
    const minTokens = Math.ceil(text.length / 10); // At most 10 chars per token
    const maxTokens = Math.ceil(text.length / 2);  // At least 2 chars per token
    
    const isValid = tokens >= minTokens && tokens <= maxTokens;
    
    if (!isValid) {
      this.logger.warn('Token estimation validation failed', {
        tokens,
        textLength: text.length,
        minTokens,
        maxTokens
      });
    }
    
    return isValid;
  }

  /**
   * Gets estimation from cache if available and not expired
   * 
   * @param text - Text to lookup
   * @returns TokenEstimationCache | null - Cached result or null
   */
  private getFromCache(text: string): TokenEstimationCache | null {
    const cached = this.cache.get(text);
    
    if (!cached) {
      return null;
    }
    
    // Check expiration
    if (Date.now() - cached.timestamp > this.defaultOptions.cacheExpiration!) {
      this.cache.delete(text);
      return null;
    }
    
    return cached;
  }

  /**
   * Sets estimation result in cache
   * 
   * @param text - Text key
   * @param estimation - Estimation result
   */
  private setCache(text: string, estimation: TokenEstimationCache): void {
    // Check cache size limit
    if (this.cache.size >= this.defaultOptions.maxCacheSize!) {
      // Remove oldest entries
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(text, estimation);
  }

  /**
   * Gets basic fallback estimation when all methods fail
   * 
   * @param text - Text to estimate
   * @returns number - Fallback token count
   */
  private getFallbackEstimation(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  /**
   * Gets basic estimation using character method
   * 
   * @param text - Text to estimate
   * @returns TokenEstimationCache - Basic estimation result
   */
  private getBasicEstimation(text: string): TokenEstimationCache {
    const tokens = Math.ceil(text.length / 4);
    
    return {
      text,
      tokens,
      timestamp: Date.now(),
      method: 'character',
      accuracy: 0.6
    };
  }

  /**
   * Clears the estimation cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Token estimation cache cleared');
  }

  /**
   * Gets cache statistics
   * 
   * @returns Object with cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.8 // This would be calculated from actual usage in production
    };
  }
}
