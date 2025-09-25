/**
 * A/B Testing Service
 * 
 * Implements A/B testing framework to compare original vs summarized context
 * performance and validate the effectiveness of AI summarization.
 */

import { Logger } from '../../logger/logger.js';
import type { 
  ABTestResult,
  SummarizationRequest,
  SummarizationResponse
} from '../types/summarization.types.js';
import { 
  AB_TESTING_PROMPTS,
  formatPrompt 
} from './prompts/summarization-prompts.js';

export interface ABTestConfig {
  enabled: boolean;
  sampleRate: number; // Percentage of requests to include in A/B testing
  minQualityThreshold: number; // Minimum quality score to include in test
  maxTestDuration: number; // Maximum test duration in milliseconds
}

export interface ABTestMetrics {
  totalTests: number;
  originalWins: number;
  summarizedWins: number;
  ties: number;
  averageQualityDifference: number;
  averageResponseTimeImprovement: number;
  averageTokenReduction: number;
  averageUserSatisfaction: number;
}

export class ABTestingService {
  private logger: Logger;
  private config: ABTestConfig;
  private metrics: ABTestMetrics;
  private activeTests: Map<string, ABTestResult> = new Map();

  constructor(config: ABTestConfig, logger?: Logger) {
    this.logger = logger || new Logger('ABTestingService');
    this.config = config;
    this.metrics = {
      totalTests: 0,
      originalWins: 0,
      summarizedWins: 0,
      ties: 0,
      averageQualityDifference: 0,
      averageResponseTimeImprovement: 0,
      averageTokenReduction: 0,
      averageUserSatisfaction: 0
    };
  }

  /**
   * Run A/B test comparing original vs summarized context
   */
  async runABTest(
    originalPrompt: string,
    originalContext: any,
    summarizedContext: any,
    testId?: string
  ): Promise<ABTestResult> {
    if (!this.config.enabled) {
      return this.createDefaultResult('ab_testing_disabled');
    }

    const testIdFinal = testId || this.generateTestId();
    
    try {
      this.logger.debug('Starting A/B test', { testId: testIdFinal });

      // Generate enhanced prompts for both contexts
      const [originalEnhanced, summarizedEnhanced] = await Promise.all([
        this.generateEnhancedPrompt(originalPrompt, originalContext),
        this.generateEnhancedPrompt(originalPrompt, summarizedContext)
      ]);

      // Compare response quality
      const qualityComparison = await this.compareResponseQuality(
        originalEnhanced,
        summarizedEnhanced
      );

      // Measure response time improvement
      const responseTimeImprovement = await this.measureResponseTimeImprovement(
        originalContext,
        summarizedContext
      );

      // Calculate token reduction
      const tokenReduction = this.calculateTokenReduction(originalContext, summarizedContext);

      // Measure user satisfaction
      const userSatisfaction = await this.measureUserSatisfaction(
        originalEnhanced,
        summarizedEnhanced
      );

      // Determine recommendation
      const recommendation = this.determineRecommendation(
        qualityComparison,
        responseTimeImprovement,
        tokenReduction,
        userSatisfaction
      );

      const result: ABTestResult = {
        testId: testIdFinal,
        originalQuality: qualityComparison.originalScore,
        summarizedQuality: qualityComparison.summarizedScore,
        qualityDifference: qualityComparison.summarizedScore - qualityComparison.originalScore,
        responseTimeImprovement,
        tokenReduction,
        userSatisfaction,
        recommendation
      };

      // Store result and update metrics
      this.activeTests.set(testIdFinal, result);
      this.updateMetrics(result);

      this.logger.info('A/B test completed', {
        testId: testIdFinal,
        recommendation: result.recommendation,
        qualityDifference: result.qualityDifference,
        tokenReduction: result.tokenReduction + '%'
      });

      return result;
    } catch (error) {
      this.logger.error('A/B test failed', { error, testId: testIdFinal });
      return this.createDefaultResult('test_failed');
    }
  }

  /**
   * Compare response quality between original and summarized
   */
  private async compareResponseQuality(
    originalPrompt: string,
    summarizedPrompt: string
  ): Promise<{ originalScore: number; summarizedScore: number }> {
    try {
      // Simple quality metrics based on content analysis
      const originalScore = this.analyzePromptQuality(originalPrompt);
      const summarizedScore = this.analyzePromptQuality(summarizedPrompt);

      return {
        originalScore,
        summarizedScore
      };
    } catch (error) {
      this.logger.warn('Response quality comparison failed', { error });
      return { originalScore: 50, summarizedScore: 50 };
    }
  }

  /**
   * Analyze prompt quality based on content characteristics
   */
  private analyzePromptQuality(prompt: string): number {
    const text = prompt.toLowerCase();
    let score = 0;

    // Technical accuracy indicators
    const technicalTerms = [
      'typescript', 'javascript', 'react', 'vue', 'angular', 'node',
      'api', 'database', 'component', 'interface', 'function', 'async'
    ];
    
    const technicalScore = technicalTerms.filter(term => text.includes(term)).length;
    score += Math.min(30, technicalScore * 3);

    // Actionability indicators
    const actionWords = [
      'create', 'implement', 'build', 'develop', 'configure', 'setup',
      'install', 'import', 'export', 'define', 'declare', 'extend'
    ];
    
    const actionScore = actionWords.filter(word => text.includes(word)).length;
    score += Math.min(25, actionScore * 2.5);

    // Clarity indicators
    const clarityWords = [
      'use', 'follow', 'ensure', 'make sure', 'consider', 'note',
      'important', 'recommended', 'best practice', 'pattern'
    ];
    
    const clarityScore = clarityWords.filter(phrase => text.includes(phrase)).length;
    score += Math.min(20, clarityScore * 2);

    // Completeness indicators
    const completenessWords = [
      'include', 'add', 'implement', 'configure', 'setup', 'install',
      'import', 'export', 'define', 'declare', 'extend', 'override'
    ];
    
    const completenessScore = completenessWords.filter(word => text.includes(word)).length;
    score += Math.min(25, completenessScore * 2.5);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Measure response time improvement
   */
  private async measureResponseTimeImprovement(
    originalContext: any,
    summarizedContext: any
  ): Promise<number> {
    try {
      // Simulate response time based on context size
      const originalSize = this.calculateContextSize(originalContext);
      const summarizedSize = this.calculateContextSize(summarizedContext);
      
      // Estimate response time (rough calculation)
      const originalTime = originalSize * 0.1; // 0.1ms per token
      const summarizedTime = summarizedSize * 0.1;
      
      if (originalTime === 0) return 0;
      
      return ((originalTime - summarizedTime) / originalTime) * 100;
    } catch (error) {
      this.logger.warn('Response time measurement failed', { error });
      return 0;
    }
  }

  /**
   * Calculate context size in tokens
   */
  private calculateContextSize(context: any): number {
    const contextStr = JSON.stringify(context);
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(contextStr.length / 4);
  }

  /**
   * Calculate token reduction percentage
   */
  private calculateTokenReduction(originalContext: any, summarizedContext: any): number {
    const originalSize = this.calculateContextSize(originalContext);
    const summarizedSize = this.calculateContextSize(summarizedContext);
    
    if (originalSize === 0) return 0;
    
    return ((originalSize - summarizedSize) / originalSize) * 100;
  }

  /**
   * Measure user satisfaction
   */
  private async measureUserSatisfaction(
    originalPrompt: string,
    summarizedPrompt: string
  ): Promise<number> {
    try {
      // Simple satisfaction metrics based on prompt characteristics
      const originalSatisfaction = this.calculateSatisfactionScore(originalPrompt);
      const summarizedSatisfaction = this.calculateSatisfactionScore(summarizedPrompt);
      
      return Math.max(0, Math.min(100, summarizedSatisfaction - originalSatisfaction));
    } catch (error) {
      this.logger.warn('User satisfaction measurement failed', { error });
      return 0;
    }
  }

  /**
   * Calculate satisfaction score based on prompt characteristics
   */
  private calculateSatisfactionScore(prompt: string): number {
    const text = prompt.toLowerCase();
    let score = 0;

    // Clarity and actionability
    if (text.includes('create') || text.includes('implement')) score += 20;
    if (text.includes('use') || text.includes('follow')) score += 15;
    if (text.includes('ensure') || text.includes('make sure')) score += 10;

    // Technical depth
    if (text.includes('typescript') || text.includes('javascript')) score += 15;
    if (text.includes('react') || text.includes('vue') || text.includes('angular')) score += 15;
    if (text.includes('api') || text.includes('database')) score += 10;

    // Completeness
    if (text.includes('include') || text.includes('add')) score += 10;
    if (text.includes('configure') || text.includes('setup')) score += 10;
    if (text.includes('import') || text.includes('export')) score += 5;

    return Math.min(100, score);
  }

  /**
   * Determine recommendation based on test results
   */
  private determineRecommendation(
    qualityComparison: { originalScore: number; summarizedScore: number },
    responseTimeImprovement: number,
    tokenReduction: number,
    userSatisfaction: number
  ): 'use_summarized' | 'use_original' | 'needs_improvement' {
    const qualityDifference = qualityComparison.summarizedScore - qualityComparison.originalScore;
    
    // Weighted scoring system
    const qualityWeight = 0.4;
    const performanceWeight = 0.3;
    const efficiencyWeight = 0.2;
    const satisfactionWeight = 0.1;
    
    const weightedScore = 
      (qualityDifference * qualityWeight) +
      (responseTimeImprovement * performanceWeight) +
      (tokenReduction * efficiencyWeight) +
      (userSatisfaction * satisfactionWeight);
    
    if (weightedScore > 10) {
      return 'use_summarized';
    } else if (weightedScore < -10) {
      return 'use_original';
    } else {
      return 'needs_improvement';
    }
  }

  /**
   * Update metrics with test result
   */
  private updateMetrics(result: ABTestResult): void {
    this.metrics.totalTests++;
    
    if (result.recommendation === 'use_original') {
      this.metrics.originalWins++;
    } else if (result.recommendation === 'use_summarized') {
      this.metrics.summarizedWins++;
    } else {
      this.metrics.ties++;
    }
    
    // Update averages
    this.metrics.averageQualityDifference = 
      (this.metrics.averageQualityDifference * (this.metrics.totalTests - 1) + result.qualityDifference) / 
      this.metrics.totalTests;
    
    this.metrics.averageResponseTimeImprovement = 
      (this.metrics.averageResponseTimeImprovement * (this.metrics.totalTests - 1) + result.responseTimeImprovement) / 
      this.metrics.totalTests;
    
    this.metrics.averageTokenReduction = 
      (this.metrics.averageTokenReduction * (this.metrics.totalTests - 1) + result.tokenReduction) / 
      this.metrics.totalTests;
    
    this.metrics.averageUserSatisfaction = 
      (this.metrics.averageUserSatisfaction * (this.metrics.totalTests - 1) + result.userSatisfaction) / 
      this.metrics.totalTests;
  }

  /**
   * Generate enhanced prompt (simplified version)
   */
  private async generateEnhancedPrompt(originalPrompt: string, context: any): Promise<string> {
    // This is a simplified version - in practice, this would call the actual enhancement service
    const contextStr = JSON.stringify(context);
    return `${originalPrompt}\n\nContext: ${contextStr.substring(0, 500)}...`;
  }

  /**
   * Generate test ID
   */
  private generateTestId(): string {
    return `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create default result for error cases
   */
  private createDefaultResult(reason: string): ABTestResult {
    return {
      testId: this.generateTestId(),
      originalQuality: 50,
      summarizedQuality: 50,
      qualityDifference: 0,
      responseTimeImprovement: 0,
      tokenReduction: 0,
      userSatisfaction: 0,
      recommendation: 'needs_improvement'
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): ABTestMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active tests
   */
  getActiveTests(): Map<string, ABTestResult> {
    return new Map(this.activeTests);
  }

  /**
   * Clear completed tests
   */
  clearCompletedTests(): void {
    this.activeTests.clear();
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalTests: 0,
      originalWins: 0,
      summarizedWins: 0,
      ties: 0,
      averageQualityDifference: 0,
      averageResponseTimeImprovement: 0,
      averageTokenReduction: 0,
      averageUserSatisfaction: 0
    };
  }
}
