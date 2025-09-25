/**
 * OpenAI Summarization Service
 * 
 * Implements AI-powered context summarization using OpenAI's GPT models
 * to reduce token usage while maintaining quality and technical accuracy.
 */

import OpenAI from 'openai';
import { Logger } from '../../logger/logger.js';
import type { 
  SummarizationRequest, 
  SummarizationResponse, 
  SummarizationConfig,
  SummarizationError,
  SummarizationMetrics
} from '../types/summarization.types.js';
import { 
  SUMMARIZATION_PROMPTS, 
  DEFAULT_SUMMARIZATION_CONFIG,
  formatPrompt 
} from './prompts/summarization-prompts.js';

export class OpenAISummarizationService {
  private client: OpenAI;
  private config: SummarizationConfig;
  private logger: Logger;
  private metrics: SummarizationMetrics;

  constructor(apiKey: string, config?: Partial<SummarizationConfig>, logger?: Logger) {
    this.logger = logger || new Logger('OpenAISummarizationService');
    this.config = { ...DEFAULT_SUMMARIZATION_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageQualityScore: 0,
      averageTokenReduction: 0,
      averageProcessingTime: 0,
      totalCost: 0,
      lastUpdated: new Date()
    };

    try {
      this.client = new OpenAI({
        apiKey,
        timeout: this.config.timeout,
        maxRetries: this.config.retryAttempts
      });
      this.logger.info('OpenAI summarization service initialized', { model: this.config.model });
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI summarization service', { error });
      throw error;
    }
  }

  /**
   * Summarize context using AI
   */
  async summarizeContext(request: SummarizationRequest): Promise<SummarizationResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      this.logger.debug('Starting context summarization', {
        frameworks: request.frameworks,
        projectType: request.projectType,
        originalTokenCount: this.calculateTokenCount([
          ...request.repoFacts,
          ...request.context7Docs,
          ...request.codeSnippets
        ])
      });

      // Summarize each context type in parallel
      const [summarizedRepoFacts, summarizedContext7Docs, summarizedCodeSnippets] = await Promise.all([
        this.summarizeRepoFacts(request.repoFacts),
        this.summarizeContext7Docs(request.context7Docs),
        this.summarizeCodeSnippets(request.codeSnippets)
      ]);

      const processingTime = Date.now() - startTime;
      const originalTokenCount = this.calculateTokenCount([
        ...request.repoFacts,
        ...request.context7Docs,
        ...request.codeSnippets
      ]);
      const summarizedTokenCount = this.calculateTokenCount([
        ...summarizedRepoFacts,
        ...summarizedContext7Docs,
        ...summarizedCodeSnippets
      ]);

      // Calculate quality score
      const qualityScore = await this.calculateQualityScore(
        [request.repoFacts, request.context7Docs, request.codeSnippets],
        [summarizedRepoFacts, summarizedContext7Docs, summarizedCodeSnippets]
      );

      // Calculate cost (rough estimate)
      const cost = this.estimateCost(originalTokenCount, summarizedTokenCount);

      const response: SummarizationResponse = {
        summarizedRepoFacts,
        summarizedContext7Docs,
        summarizedCodeSnippets,
        originalTokenCount,
        summarizedTokenCount,
        qualityScore,
        processingTime,
        cost
      };

      this.updateMetrics(true, qualityScore, originalTokenCount, summarizedTokenCount, processingTime, cost);
      
      this.logger.info('Context summarization completed', {
        originalTokenCount,
        summarizedTokenCount,
        tokenReduction: ((originalTokenCount - summarizedTokenCount) / originalTokenCount * 100).toFixed(1) + '%',
        qualityScore: qualityScore.toFixed(2),
        processingTime: processingTime + 'ms'
      });

      return response;
    } catch (error) {
      this.updateMetrics(false, 0, 0, 0, Date.now() - startTime, 0);
      this.logger.error('Context summarization failed', { error, request });
      throw this.createSummarizationError(error);
    }
  }

  /**
   * Summarize repository facts
   */
  async summarizeRepoFacts(facts: string[]): Promise<string[]> {
    if (facts.length === 0) return [];

    const prompt = formatPrompt(SUMMARIZATION_PROMPTS.repoFacts, {
      content: facts.join('\n')
    });

    const response = await this.callOpenAI(prompt);
    return this.parseSummarizedContent(response, 'repoFacts');
  }

  /**
   * Summarize Context7 documentation
   */
  async summarizeContext7Docs(docs: string[]): Promise<string[]> {
    if (docs.length === 0) return [];

    const prompt = formatPrompt(SUMMARIZATION_PROMPTS.context7Docs, {
      content: docs.join('\n')
    });

    const response = await this.callOpenAI(prompt);
    return this.parseSummarizedContent(response, 'context7Docs');
  }

  /**
   * Summarize code snippets
   */
  async summarizeCodeSnippets(snippets: string[]): Promise<string[]> {
    if (snippets.length === 0) return [];

    const prompt = formatPrompt(SUMMARIZATION_PROMPTS.codeSnippets, {
      content: snippets.join('\n')
    });

    const response = await this.callOpenAI(prompt);
    return this.parseSummarizedContent(response, 'codeSnippets');
  }

  /**
   * Call OpenAI API with retry logic
   */
  private async callOpenAI(prompt: string): Promise<string> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert software architect and developer with deep knowledge of modern web development frameworks and best practices.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        return content.trim();
      } catch (error) {
        lastError = error;
        this.logger.warn(`OpenAI API call failed (attempt ${attempt}/${this.config.retryAttempts})`, { error });
        
        if (attempt < this.config.retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse summarized content based on type
   */
  private parseSummarizedContent(content: string, type: 'repoFacts' | 'context7Docs' | 'codeSnippets'): string[] {
    // Split by common delimiters and clean up
    const lines = content
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // For repo facts, look for category patterns
    if (type === 'repoFacts') {
      return lines.filter(line => 
        line.startsWith('PROJECT:') || 
        line.startsWith('TECH_STACK:') || 
        line.startsWith('ARCHITECTURE:') || 
        line.startsWith('QUALITY:')
      );
    }

    // For other types, return all non-empty lines
    return lines;
  }

  /**
   * Calculate quality score for summarization
   */
  private async calculateQualityScore(
    original: string[][],
    summarized: string[][]
  ): Promise<number> {
    try {
      // Simple quality metrics
      const originalTokens = original.flat().reduce((sum, arr) => sum + this.calculateTokenCount(arr), 0);
      const summarizedTokens = summarized.flat().reduce((sum, arr) => sum + this.calculateTokenCount(arr), 0);
      
      // Token reduction score (0-40 points)
      const tokenReduction = Math.max(0, (originalTokens - summarizedTokens) / originalTokens);
      const reductionScore = Math.min(40, tokenReduction * 100);
      
      // Content preservation score (0-40 points)
      const preservationScore = this.calculateContentPreservation(original.flat(), summarized.flat());
      
      // Technical accuracy score (0-20 points)
      const accuracyScore = this.calculateTechnicalAccuracy(summarized.flat());
      
      return Math.min(100, reductionScore + preservationScore + accuracyScore);
    } catch (error) {
      this.logger.warn('Failed to calculate quality score', { error });
      return 50; // Default moderate score
    }
  }

  /**
   * Calculate content preservation score
   */
  private calculateContentPreservation(original: string[], summarized: string[]): number {
    const originalText = original.join(' ').toLowerCase();
    const summarizedText = summarized.join(' ').toLowerCase();
    
    // Simple keyword matching
    const originalWords = new Set(originalText.split(/\s+/));
    const summarizedWords = new Set(summarizedText.split(/\s+/));
    
    const commonWords = new Set([...originalWords].filter(word => summarizedWords.has(word)));
    const preservationRatio = commonWords.size / originalWords.size;
    
    return Math.min(40, preservationRatio * 100);
  }

  /**
   * Calculate technical accuracy score
   */
  private calculateTechnicalAccuracy(summarized: string[]): number {
    const technicalTerms = [
      'typescript', 'react', 'node', 'express', 'api', 'database', 'sqlite',
      'framework', 'library', 'component', 'hook', 'state', 'props', 'interface',
      'async', 'await', 'promise', 'error', 'validation', 'authentication',
      'middleware', 'routing', 'controller', 'service', 'model', 'schema'
    ];
    
    const text = summarized.join(' ').toLowerCase();
    const foundTerms = technicalTerms.filter(term => text.includes(term));
    
    return Math.min(20, (foundTerms.length / technicalTerms.length) * 100);
  }

  /**
   * Calculate token count (rough estimate)
   */
  private calculateTokenCount(text: string | string[]): number {
    const content = Array.isArray(text) ? text.join(' ') : text;
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }

  /**
   * Estimate API cost
   */
  private estimateCost(inputTokens: number, outputTokens: number): number {
    // GPT-4o-mini pricing (as of 2024)
    const inputCostPer1K = 0.00015;
    const outputCostPer1K = 0.0006;
    
    return (inputTokens / 1000 * inputCostPer1K) + (outputTokens / 1000 * outputCostPer1K);
  }

  /**
   * Update metrics
   */
  private updateMetrics(
    success: boolean,
    qualityScore: number,
    originalTokens: number,
    summarizedTokens: number,
    processingTime: number,
    cost: number
  ): void {
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.averageQualityScore = 
        (this.metrics.averageQualityScore * (this.metrics.successfulRequests - 1) + qualityScore) / 
        this.metrics.successfulRequests;
      
      const tokenReduction = originalTokens > 0 ? (originalTokens - summarizedTokens) / originalTokens : 0;
      this.metrics.averageTokenReduction = 
        (this.metrics.averageTokenReduction * (this.metrics.successfulRequests - 1) + tokenReduction) / 
        this.metrics.successfulRequests;
    } else {
      this.metrics.failedRequests++;
    }
    
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (this.metrics.totalRequests - 1) + processingTime) / 
      this.metrics.totalRequests;
    
    this.metrics.totalCost += cost;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Create summarization error
   */
  private createSummarizationError(error: any): SummarizationError {
    return {
      code: error.code || 'SUMMARIZATION_ERROR',
      message: error.message || 'Unknown summarization error',
      details: error,
      retryable: this.isRetryableError(error),
      timestamp: new Date()
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = ['rate_limit_exceeded', 'server_error', 'timeout'];
    return retryableCodes.includes(error.code) || error.status >= 500;
  }

  /**
   * Get current metrics
   */
  getMetrics(): SummarizationMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageQualityScore: 0,
      averageTokenReduction: 0,
      averageProcessingTime: 0,
      totalCost: 0,
      lastUpdated: new Date()
    };
  }
}
