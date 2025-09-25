/**
 * Enhancement Optimizer Service
 * 
 * Optimizes prompt enhancement for cost, performance, and quality
 * Implements intelligent optimization strategies and recommendations
 * 
 * Benefits for vibe coders:
 * - Automatic cost optimization
 * - Performance improvements
 * - Quality enhancement
 * - Smart resource allocation
 */

import { Logger } from '../logger/logger.js';
import { EnhancementMetricsService } from '../monitoring/enhancement-metrics.service.js';
import type { MetricsDataPoint } from '../monitoring/enhancement-metrics.service.js';
import type { 
  EnhancementOptions,
  EnhancementStrategy,
  EnhancementOptimization,
  PromptEnhancementConfig
} from '../../types/prompt-enhancement.types.js';

export interface OptimizationRecommendation {
  type: 'cost' | 'performance' | 'quality' | 'strategy';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  expectedImprovement: number; // Percentage improvement
}

export interface OptimizationResult {
  optimizedOptions: EnhancementOptions;
  recommendations: OptimizationRecommendation[];
  expectedSavings: {
    cost: number;
    time: number;
    quality: number;
  };
  confidence: number; // 0-1
}

export interface OptimizationContext {
  currentMetrics: any;
  historicalData: MetricsDataPoint[];
  constraints: {
    maxCost?: number;
    maxTime?: number;
    minQuality?: number;
  };
  preferences: {
    prioritizeCost: boolean;
    prioritizeQuality: boolean;
    prioritizeSpeed: boolean;
  };
}

export class EnhancementOptimizerService {
  private logger: Logger;
  private metricsService: EnhancementMetricsService;
  private optimizationHistory: OptimizationResult[] = [];

  constructor(logger: Logger, metricsService: EnhancementMetricsService) {
    this.logger = logger;
    this.metricsService = metricsService;
  }

  /**
   * Optimize enhancement options based on current performance
   */
  optimizeEnhancement(
    currentOptions: EnhancementOptions,
    context: OptimizationContext
  ): OptimizationResult {
    this.logger.debug('Starting enhancement optimization', {
      currentStrategy: currentOptions.strategy.type,
      constraints: context.constraints,
      preferences: context.preferences
    });

    const recommendations: OptimizationRecommendation[] = [];
    let optimizedOptions = { ...currentOptions };

    // Cost optimization
    if (context.preferences.prioritizeCost || context.constraints.maxCost) {
      const costOptimizations = this.optimizeForCost(optimizedOptions, context);
      optimizedOptions = costOptimizations.options;
      recommendations.push(...costOptimizations.recommendations);
    }

    // Performance optimization
    if (context.preferences.prioritizeSpeed || context.constraints.maxTime) {
      const performanceOptimizations = this.optimizeForPerformance(optimizedOptions, context);
      optimizedOptions = performanceOptimizations.options;
      recommendations.push(...performanceOptimizations.recommendations);
    }

    // Quality optimization
    if (context.preferences.prioritizeQuality || context.constraints.minQuality) {
      const qualityOptimizations = this.optimizeForQuality(optimizedOptions, context);
      optimizedOptions = qualityOptimizations.options;
      recommendations.push(...qualityOptimizations.recommendations);
    }

    // Strategy optimization
    const strategyOptimizations = this.optimizeStrategy(optimizedOptions, context);
    optimizedOptions = strategyOptimizations.options;
    recommendations.push(...strategyOptimizations.recommendations);

    const expectedSavings = this.calculateExpectedSavings(optimizedOptions, currentOptions, context);
    const confidence = this.calculateOptimizationConfidence(optimizedOptions, context);

    const result: OptimizationResult = {
      optimizedOptions,
      recommendations,
      expectedSavings,
      confidence
    };

    this.optimizationHistory.push(result);
    this.logger.info('Enhancement optimization completed', {
      recommendationsCount: recommendations.length,
      expectedCostSavings: expectedSavings.cost,
      confidence
    });

    return result;
  }

  /**
   * Get optimization recommendations for current configuration
   */
  getOptimizationRecommendations(config: PromptEnhancementConfig): OptimizationRecommendation[] {
    const analytics = this.metricsService.getAnalytics();
    const recommendations: OptimizationRecommendation[] = [];

    // Cost-based recommendations
    if (analytics.costMetrics.averageCostPerEnhancement > 0.05) {
      recommendations.push({
        type: 'cost',
        priority: 'high',
        title: 'Reduce Token Usage',
        description: 'Current average cost per enhancement is high. Consider reducing max tokens or using more efficient models.',
        impact: 'Could reduce costs by 20-30%',
        implementation: 'Lower maxTokens to 1500 or use gpt-3.5-turbo for simple tasks',
        expectedImprovement: 25
      });
    }

    // Performance-based recommendations
    if (analytics.performanceMetrics.averageResponseTime > 3000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Optimize Context Processing',
        description: 'Response times are slower than optimal. Consider improving context truncation and processing.',
        impact: 'Could reduce response time by 15-25%',
        implementation: 'Enable smart summarization and relevance filtering',
        expectedImprovement: 20
      });
    }

    // Quality-based recommendations
    if (analytics.qualityDistribution.poor > 0.1) {
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Improve Prompt Templates',
        description: 'Quality scores are below optimal. Consider enhancing prompt templates and context quality.',
        impact: 'Could improve quality scores by 15-20%',
        implementation: 'Update prompt templates and increase context relevance',
        expectedImprovement: 18
      });
    }

    // Strategy-based recommendations
    const strategies = Object.keys(analytics.strategyPerformance);
    if (strategies.length > 1) {
      const bestStrategy = strategies.reduce((best, current) => 
        analytics.strategyPerformance[current].averageQuality > analytics.strategyPerformance[best].averageQuality 
          ? current : best
      );
      
      recommendations.push({
        type: 'strategy',
        priority: 'medium',
        title: 'Optimize Strategy Selection',
        description: `Strategy '${bestStrategy}' performs better than others. Consider using it more frequently.`,
        impact: 'Could improve overall quality by 10-15%',
        implementation: 'Adjust strategy selection logic to favor high-performing strategies',
        expectedImprovement: 12
      });
    }

    return recommendations;
  }

  /**
   * Optimize for cost reduction
   */
  private optimizeForCost(
    options: EnhancementOptions,
    context: OptimizationContext
  ): { options: EnhancementOptions; recommendations: OptimizationRecommendation[] } {
    const recommendations: OptimizationRecommendation[] = [];
    let optimizedOptions = { ...options };

    // Reduce max tokens if cost is high
    if (options.maxTokens > 1500) {
      optimizedOptions.maxTokens = Math.min(1500, options.maxTokens);
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        title: 'Reduce Max Tokens',
        description: 'Reduced max tokens to optimize cost while maintaining quality',
        impact: 'Could reduce costs by 15-25%',
        implementation: 'Lower maxTokens parameter',
        expectedImprovement: 20
      });
    }

    // Use more efficient temperature
    if (options.temperature > 0.5) {
      optimizedOptions.temperature = Math.min(0.5, options.temperature);
      recommendations.push({
        type: 'cost',
        priority: 'low',
        title: 'Optimize Temperature',
        description: 'Reduced temperature for more focused responses and lower costs',
        impact: 'Could reduce costs by 5-10%',
        implementation: 'Lower temperature parameter',
        expectedImprovement: 7
      });
    }

    // Disable expensive features if not critical
    if (options.includeAntiPatterns && !context.preferences.prioritizeQuality) {
      optimizedOptions.includeAntiPatterns = false;
      recommendations.push({
        type: 'cost',
        priority: 'low',
        title: 'Disable Anti-Patterns',
        description: 'Disabled anti-patterns inclusion to reduce token usage',
        impact: 'Could reduce costs by 5-8%',
        implementation: 'Set includeAntiPatterns to false',
        expectedImprovement: 6
      });
    }

    return { options: optimizedOptions, recommendations };
  }

  /**
   * Optimize for performance improvement
   */
  private optimizeForPerformance(
    options: EnhancementOptions,
    context: OptimizationContext
  ): { options: EnhancementOptions; recommendations: OptimizationRecommendation[] } {
    const recommendations: OptimizationRecommendation[] = [];
    let optimizedOptions = { ...options };

    // Reduce max tokens for faster processing
    if (options.maxTokens > 2000) {
      optimizedOptions.maxTokens = Math.min(2000, options.maxTokens);
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        title: 'Optimize Token Usage',
        description: 'Reduced max tokens for faster processing while maintaining quality',
        impact: 'Could reduce processing time by 20-30%',
        implementation: 'Lower maxTokens parameter',
        expectedImprovement: 25
      });
    }

    // Use lower temperature for faster, more focused responses
    if (options.temperature > 0.3) {
      optimizedOptions.temperature = Math.min(0.3, options.temperature);
      recommendations.push({
        type: 'performance',
        priority: 'low',
        title: 'Optimize Temperature',
        description: 'Lowered temperature for faster, more focused responses',
        impact: 'Could reduce processing time by 10-15%',
        implementation: 'Lower temperature parameter',
        expectedImprovement: 12
      });
    }

    return { options: optimizedOptions, recommendations };
  }

  /**
   * Optimize for quality improvement
   */
  private optimizeForQuality(
    options: EnhancementOptions,
    context: OptimizationContext
  ): { options: EnhancementOptions; recommendations: OptimizationRecommendation[] } {
    const recommendations: OptimizationRecommendation[] = [];
    let optimizedOptions = { ...options };

    // Increase max tokens for better quality
    if (options.maxTokens < 2000 && context.constraints.maxCost && options.maxTokens * 1.2 <= context.constraints.maxCost) {
      optimizedOptions.maxTokens = Math.min(2000, Math.floor(options.maxTokens * 1.2));
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        title: 'Increase Context Length',
        description: 'Increased max tokens to provide more context for better quality',
        impact: 'Could improve quality by 10-15%',
        implementation: 'Increase maxTokens parameter',
        expectedImprovement: 12
      });
    }

    // Enable quality-focused features
    if (!options.includeBestPractices) {
      optimizedOptions.includeBestPractices = true;
      recommendations.push({
        type: 'quality',
        priority: 'high',
        title: 'Enable Best Practices',
        description: 'Enabled best practices inclusion for better quality enhancements',
        impact: 'Could improve quality by 15-20%',
        implementation: 'Set includeBestPractices to true',
        expectedImprovement: 17
      });
    }

    // Enable performance tips for better guidance
    if (!options.includePerformanceTips) {
      optimizedOptions.includePerformanceTips = true;
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        title: 'Enable Performance Tips',
        description: 'Enabled performance tips for more comprehensive guidance',
        impact: 'Could improve quality by 8-12%',
        implementation: 'Set includePerformanceTips to true',
        expectedImprovement: 10
      });
    }

    return { options: optimizedOptions, recommendations };
  }

  /**
   * Optimize strategy selection
   */
  private optimizeStrategy(
    options: EnhancementOptions,
    context: OptimizationContext
  ): { options: EnhancementOptions; recommendations: OptimizationRecommendation[] } {
    const recommendations: OptimizationRecommendation[] = [];
    let optimizedOptions = { ...options };

    const analytics = this.metricsService.getAnalytics();
    const strategies = Object.keys(analytics.strategyPerformance);

    if (strategies.length > 0) {
      // Find the best performing strategy
      const bestStrategy = strategies.reduce((best, current) => {
        const bestMetrics = analytics.strategyPerformance[best];
        const currentMetrics = analytics.strategyPerformance[current];
        
        // Score based on quality, success rate, and cost efficiency
        const bestScore = bestMetrics.averageQuality * bestMetrics.successRate / (bestMetrics.averageCost + 0.01);
        const currentScore = currentMetrics.averageQuality * currentMetrics.successRate / (currentMetrics.averageCost + 0.01);
        
        return currentScore > bestScore ? current : best;
      });

      if (bestStrategy !== options.strategy.type) {
        optimizedOptions.strategy = {
          ...options.strategy,
          type: bestStrategy as any
        };

        recommendations.push({
          type: 'strategy',
          priority: 'medium',
          title: 'Optimize Strategy Selection',
          description: `Switched to '${bestStrategy}' strategy based on historical performance`,
          impact: 'Could improve overall performance by 10-15%',
          implementation: `Use ${bestStrategy} strategy for similar requests`,
          expectedImprovement: 12
        });
      }
    }

    return { options: optimizedOptions, recommendations };
  }

  /**
   * Calculate expected savings from optimization
   */
  private calculateExpectedSavings(
    optimizedOptions: EnhancementOptions,
    currentOptions: EnhancementOptions,
    context: OptimizationContext
  ): { cost: number; time: number; quality: number } {
    const analytics = this.metricsService.getAnalytics();
    
    // Cost savings (rough estimation)
    const tokenReduction = (currentOptions.maxTokens - optimizedOptions.maxTokens) / currentOptions.maxTokens;
    const costSavings = analytics.costMetrics.averageCostPerEnhancement * tokenReduction * 0.8; // 80% of token reduction translates to cost savings

    // Time savings (rough estimation)
    const timeReduction = tokenReduction * 0.6; // 60% of token reduction translates to time savings
    const timeSavings = analytics.performanceMetrics.averageResponseTime * timeReduction;

    // Quality improvement (based on enabled features)
    let qualityImprovement = 0;
    if (optimizedOptions.includeBestPractices && !currentOptions.includeBestPractices) {
      qualityImprovement += 0.15;
    }
    if (optimizedOptions.includePerformanceTips && !currentOptions.includePerformanceTips) {
      qualityImprovement += 0.10;
    }

    return {
      cost: Math.max(0, costSavings),
      time: Math.max(0, timeSavings),
      quality: Math.max(0, qualityImprovement)
    };
  }

  /**
   * Calculate optimization confidence
   */
  private calculateOptimizationConfidence(
    optimizedOptions: EnhancementOptions,
    context: OptimizationContext
  ): number {
    const analytics = this.metricsService.getAnalytics();
    let confidence = 0.5; // Base confidence

    // Increase confidence based on historical data
    if (analytics.totalEnhancements > 100) {
      confidence += 0.2;
    }
    if (analytics.totalEnhancements > 500) {
      confidence += 0.1;
    }

    // Increase confidence based on strategy performance
    const strategy = optimizedOptions.strategy.type;
    if (analytics.strategyPerformance[strategy]) {
      const strategyMetrics = analytics.strategyPerformance[strategy];
      if (strategyMetrics.usage > 10) {
        confidence += 0.1;
      }
      if (strategyMetrics.successRate > 0.9) {
        confidence += 0.1;
      }
    }

    // Decrease confidence if constraints are tight
    if (context.constraints.maxCost && context.constraints.maxCost < 0.01) {
      confidence -= 0.2;
    }
    if (context.constraints.maxTime && context.constraints.maxTime < 1000) {
      confidence -= 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  /**
   * Clear optimization history
   */
  clearOptimizationHistory(): void {
    this.optimizationHistory = [];
    this.logger.info('Optimization history cleared');
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    totalOptimizations: number;
    averageRecommendations: number;
    averageConfidence: number;
    mostCommonRecommendation: string;
  } {
    if (this.optimizationHistory.length === 0) {
      return {
        totalOptimizations: 0,
        averageRecommendations: 0,
        averageConfidence: 0,
        mostCommonRecommendation: 'None'
      };
    }

    const totalRecommendations = this.optimizationHistory.reduce(
      (sum, result) => sum + result.recommendations.length, 0
    );
    const averageRecommendations = totalRecommendations / this.optimizationHistory.length;
    const averageConfidence = this.optimizationHistory.reduce(
      (sum, result) => sum + result.confidence, 0
    ) / this.optimizationHistory.length;

    // Find most common recommendation type
    const recommendationTypes: Record<string, number> = {};
    this.optimizationHistory.forEach(result => {
      result.recommendations.forEach(rec => {
        recommendationTypes[rec.type] = (recommendationTypes[rec.type] || 0) + 1;
      });
    });

    const mostCommonRecommendation = Object.keys(recommendationTypes).reduce(
      (most, current) => recommendationTypes[current] > recommendationTypes[most] ? current : most,
      'None'
    );

    return {
      totalOptimizations: this.optimizationHistory.length,
      averageRecommendations,
      averageConfidence,
      mostCommonRecommendation
    };
  }
}
