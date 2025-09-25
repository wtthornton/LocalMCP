/**
 * Performance Optimizer Service
 * 
 * This service optimizes the performance of AI enhancement operations by:
 * - Implementing intelligent caching strategies
 * - Optimizing token usage and costs
 * - Managing resource allocation
 * - Providing performance monitoring and recommendations
 */

import { Logger } from '../logger/logger.js';
import { PromptCacheService } from '../cache/prompt-cache.service.js';
import { OpenAIService } from '../ai/openai.service.js';
import type { 
  PromptEnhancementRequest, 
  PromptEnhancementResponse,
  EnhancementOptions,
  EnhancementStrategy
} from '../../types/prompt-enhancement.types.js';

export interface PerformanceMetrics {
  responseTime: number;
  tokenUsage: number;
  cost: number;
  cacheHit: boolean;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

export interface OptimizationConfig {
  enableCaching: boolean;
  cacheTTL: number;
  maxCacheSize: number;
  enableTokenOptimization: boolean;
  maxTokensPerRequest: number;
  enableCostOptimization: boolean;
  maxCostPerRequest: number;
  enableMemoryOptimization: boolean;
  maxMemoryUsage: number;
  enableConcurrentProcessing: boolean;
  maxConcurrentRequests: number;
  enableAdaptiveOptimization: boolean;
  optimizationThreshold: number;
}

export interface OptimizationRecommendations {
  type: 'performance' | 'cost' | 'memory' | 'caching' | 'tokens';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: string;
}

export class PerformanceOptimizerService {
  private metrics: PerformanceMetrics[] = [];
  private optimizationConfig: OptimizationConfig;
  private adaptiveThresholds: Map<string, number> = new Map();
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();

  constructor(
    private logger: Logger,
    private promptCache: PromptCacheService,
    private openaiService: OpenAIService,
    config: Partial<OptimizationConfig> = {}
  ) {
    this.optimizationConfig = {
      enableCaching: true,
      cacheTTL: 3600000, // 1 hour
      maxCacheSize: 1000,
      enableTokenOptimization: true,
      maxTokensPerRequest: 4000,
      enableCostOptimization: true,
      maxCostPerRequest: 0.10,
      enableMemoryOptimization: true,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      enableConcurrentProcessing: true,
      maxConcurrentRequests: 5,
      enableAdaptiveOptimization: true,
      optimizationThreshold: 0.8,
      ...config
    };

    this.initializeAdaptiveThresholds();
  }

  /**
   * Optimize a prompt enhancement request
   */
  async optimizeEnhancementRequest(
    request: PromptEnhancementRequest
  ): Promise<PromptEnhancementRequest> {
    const startTime = Date.now();
    
    try {
      // Apply token optimization
      if (this.optimizationConfig.enableTokenOptimization) {
        request = await this.optimizeTokenUsage(request);
      }

      // Apply cost optimization
      if (this.optimizationConfig.enableCostOptimization) {
        request = await this.optimizeCost(request);
      }

      // Apply memory optimization
      if (this.optimizationConfig.enableMemoryOptimization) {
        request = await this.optimizeMemoryUsage(request);
      }

      // Apply adaptive optimization
      if (this.optimizationConfig.enableAdaptiveOptimization) {
        request = await this.applyAdaptiveOptimization(request);
      }

      const endTime = Date.now();
      this.recordMetrics({
        responseTime: endTime - startTime,
        tokenUsage: this.estimateTokenUsage(request),
        cost: this.estimateCost(request),
        cacheHit: false,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: process.cpuUsage().user,
        timestamp: new Date()
      });

      return request;
    } catch (error) {
      this.logger.error('Failed to optimize enhancement request', { error, request });
      throw error;
    }
  }

  /**
   * Optimize the response from AI enhancement
   */
  async optimizeEnhancementResponse(
    response: PromptEnhancementResponse,
    originalRequest: PromptEnhancementRequest
  ): Promise<PromptEnhancementResponse> {
    try {
      // Optimize response content
      if (response.enhancedPrompt && response.enhancedPrompt.length > 10000) {
        response.enhancedPrompt = await this.truncateResponse(response.enhancedPrompt);
      }

      // Optimize metadata
      if (response.metadata) {
        response.metadata = await this.optimizeMetadata(response.metadata);
      }

      // Apply caching if beneficial
      if (this.shouldCacheResponse(response, originalRequest)) {
        await this.cacheResponse(response, originalRequest);
      }

      return response;
    } catch (error) {
      this.logger.error('Failed to optimize enhancement response', { error, response });
      return response; // Return original response if optimization fails
    }
  }

  /**
   * Get performance recommendations
   */
  async getOptimizationRecommendations(): Promise<OptimizationRecommendations[]> {
    const recommendations: OptimizationRecommendations[] = [];
    
    // Analyze performance metrics
    const recentMetrics = this.getRecentMetrics(24 * 60 * 60 * 1000); // Last 24 hours
    
    if (recentMetrics.length === 0) {
      return recommendations;
    }

    // Performance recommendations
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    if (avgResponseTime > 2000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        description: 'High response time detected',
        impact: 'User experience degradation',
        implementation: 'Implement response caching and optimize AI model calls',
        estimatedImprovement: '50-70% reduction in response time'
      });
    }

    // Cost recommendations
    const avgCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0) / recentMetrics.length;
    if (avgCost > this.optimizationConfig.maxCostPerRequest) {
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        description: 'High cost per request detected',
        impact: 'Increased operational costs',
        implementation: 'Implement token optimization and response caching',
        estimatedImprovement: '30-50% reduction in costs'
      });
    }

    // Memory recommendations
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    if (avgMemory > this.optimizationConfig.maxMemoryUsage) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        description: 'High memory usage detected',
        impact: 'Potential memory leaks and performance issues',
        implementation: 'Implement memory cleanup and garbage collection optimization',
        estimatedImprovement: '40-60% reduction in memory usage'
      });
    }

    // Caching recommendations
    const cacheHitRate = recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length;
    if (cacheHitRate < 0.3) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        description: 'Low cache hit rate detected',
        impact: 'Increased response times and costs',
        implementation: 'Review cache key strategy and increase cache TTL',
        estimatedImprovement: '60-80% improvement in cache hit rate'
      });
    }

    // Token recommendations
    const avgTokens = recentMetrics.reduce((sum, m) => sum + m.tokenUsage, 0) / recentMetrics.length;
    if (avgTokens > this.optimizationConfig.maxTokensPerRequest) {
      recommendations.push({
        type: 'tokens',
        priority: 'medium',
        description: 'High token usage detected',
        impact: 'Increased costs and slower responses',
        implementation: 'Implement prompt compression and token optimization',
        estimatedImprovement: '25-40% reduction in token usage'
      });
    }

    return recommendations;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalRequests: number;
    avgResponseTime: number;
    avgTokenUsage: number;
    avgCost: number;
    cacheHitRate: number;
    errorRate: number;
    memoryUsage: number;
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        avgTokenUsage: 0,
        avgCost: 0,
        cacheHitRate: 0,
        errorRate: 0,
        memoryUsage: 0
      };
    }

    const totalRequests = this.metrics.length;
    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const avgTokenUsage = this.metrics.reduce((sum, m) => sum + m.tokenUsage, 0) / totalRequests;
    const avgCost = this.metrics.reduce((sum, m) => sum + m.cost, 0) / totalRequests;
    const cacheHitRate = this.metrics.filter(m => m.cacheHit).length / totalRequests;
    const errorRate = 0; // TODO: Track errors separately
    const memoryUsage = this.metrics[this.metrics.length - 1]?.memoryUsage || 0;

    return {
      totalRequests,
      avgResponseTime,
      avgTokenUsage,
      avgCost,
      cacheHitRate,
      errorRate,
      memoryUsage
    };
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.performanceHistory.clear();
  }

  private async optimizeTokenUsage(request: PromptEnhancementRequest): Promise<PromptEnhancementRequest> {
    // Truncate context if too large
    if (request.context.codeSnippets && request.context.codeSnippets.length > 10) {
      request.context.codeSnippets = request.context.codeSnippets.slice(0, 10);
    }

    if (request.context.documentation && request.context.documentation.apiDocs && request.context.documentation.apiDocs.length > 5) {
      request.context.documentation.apiDocs = request.context.documentation.apiDocs.slice(0, 5);
    }

    // Optimize prompt length
    if (request.originalPrompt.length > 1000) {
      request.originalPrompt = request.originalPrompt.substring(0, 1000) + '...';
    }

    return request;
  }

  private async optimizeCost(request: PromptEnhancementRequest): Promise<PromptEnhancementRequest> {
    // Use cheaper strategy for simple requests
    if (request.originalPrompt.length < 100 && !request.options?.qualityThreshold) {
      request.options = {
        ...request.options,
        strategy: { type: 'general', focus: ['clarity'], approach: 'comprehensive', priority: 'quality' }
      };
    }

    // Reduce quality for cost optimization
    if (request.options?.qualityThreshold && request.options.qualityThreshold > 0.9) {
      const estimatedCost = this.estimateCost(request);
      if (estimatedCost > this.optimizationConfig.maxCostPerRequest) {
        request.options.qualityThreshold = 0.8;
      }
    }

    return request;
  }

  private async optimizeMemoryUsage(request: PromptEnhancementRequest): Promise<PromptEnhancementRequest> {
    // Clear large arrays if memory usage is high
    const currentMemory = process.memoryUsage().heapUsed;
    if (currentMemory > this.optimizationConfig.maxMemoryUsage) {
      if (request.context.codeSnippets) {
        request.context.codeSnippets = request.context.codeSnippets.slice(0, 5);
      }
      if (request.context.documentation && request.context.documentation.apiDocs) {
        request.context.documentation.apiDocs = request.context.documentation.apiDocs.slice(0, 3);
      }
    }

    return request;
  }

  private async applyAdaptiveOptimization(request: PromptEnhancementRequest): Promise<PromptEnhancementRequest> {
    const promptKey = this.generatePromptKey(request);
    const history = this.performanceHistory.get(promptKey) || [];
    
    if (history.length > 0) {
      const avgResponseTime = history.reduce((sum, m) => sum + m.responseTime, 0) / history.length;
      const threshold = this.adaptiveThresholds.get('responseTime') || 1000;
      
      if (avgResponseTime > threshold) {
        // Apply more aggressive optimization
        request = await this.optimizeTokenUsage(request);
        request = await this.optimizeCost(request);
      }
    }

    return request;
  }

  private shouldCacheResponse(response: PromptEnhancementResponse, request: PromptEnhancementRequest): boolean {
    // Cache if response is successful and not too large
    return response.enhancedPrompt.length < 5000 &&
           response.metadata && response.metadata.enhancedLength > response.metadata.originalLength;
  }

  private async cacheResponse(response: PromptEnhancementResponse, request: PromptEnhancementRequest): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(request);
      await this.promptCache.cachePrompt(
        request.originalPrompt, 
        response.enhancedPrompt, 
        request.context, 
        {}, 
        0.8, 
        response.metadata?.processingTime || 0, 
        'medium'
      );
    } catch (error) {
      this.logger.warn('Failed to cache response', { error, request });
    }
  }

  private async truncateResponse(content: string): Promise<string> {
    if (content.length <= 10000) {
      return content;
    }

    // Truncate but keep important parts
    const lines = content.split('\n');
    const importantLines = lines.filter(line => 
      line.includes('##') || 
      line.includes('**') || 
      line.includes('```') ||
      line.length > 50
    );

    const truncated = importantLines.slice(0, 50).join('\n');
    return truncated + '\n\n... [Response truncated for performance]';
  }

  private async optimizeMetadata(metadata: any): Promise<any> {
    // Remove unnecessary metadata to reduce size
    const optimized = { ...metadata };
    
    if (optimized.improvements && optimized.improvements.length > 10) {
      optimized.improvements = optimized.improvements.slice(0, 10);
    }

    if (optimized.recommendations && optimized.recommendations.length > 5) {
      optimized.recommendations = optimized.recommendations.slice(0, 5);
    }

    return optimized;
  }

  private estimateTokenUsage(request: PromptEnhancementRequest): number {
    const promptLength = request.originalPrompt.length;
    const contextLength = JSON.stringify(request.context).length;
    return Math.ceil((promptLength + contextLength) / 4); // Rough estimate
  }

  private estimateCost(request: PromptEnhancementRequest): number {
    const tokens = this.estimateTokenUsage(request);
    const strategy = request.options?.strategy || { type: 'general', focus: ['clarity'], approach: 'comprehensive', priority: 'quality' };
    
    // Different strategies have different costs
    const costMultiplier = {
      'general': 1.0,
      'framework-specific': 1.2,
      'quality-focused': 1.5,
      'project-aware': 1.3
    }[strategy.type] || 1.0;

    return tokens * 0.00003 * costMultiplier; // Rough estimate using GPT-4 pricing
  }

  private generatePromptKey(request: PromptEnhancementRequest): string {
    return `${request.originalPrompt}-${request.options?.strategy?.type}-${request.options?.qualityThreshold}`;
  }

  private generateCacheKey(request: PromptEnhancementRequest): string {
    return `enhancement-${Buffer.from(this.generatePromptKey(request)).toString('base64')}`;
  }

  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Update performance history
    const promptKey = this.generatePromptKey({
      originalPrompt: 'unknown', // We don't have the original request here
      context: { 
        projectContext: { 
          projectType: 'other', 
          framework: 'unknown', 
          language: 'unknown', 
          architecture: 'unknown', 
          patterns: [], 
          conventions: [], 
          dependencies: [], 
          environment: 'development' 
        },
        frameworkContext: { 
          framework: 'unknown', 
          version: 'unknown', 
          bestPractices: [], 
          commonPatterns: [], 
          antiPatterns: [], 
          performanceTips: [], 
          securityConsiderations: [], 
          testingApproaches: [] 
        },
        qualityRequirements: { 
          accessibility: false, 
          performance: true, 
          security: false, 
          testing: false, 
          documentation: false, 
          maintainability: true, 
          scalability: false, 
          userExperience: false 
        },
        codeSnippets: [],
        documentation: { 
          apiDocs: [], 
          guides: [], 
          examples: [], 
          tutorials: [], 
          troubleshooting: [] 
        },
        userPreferences: { 
          codingStyle: 'mixed', 
          verbosity: 'detailed', 
          focus: 'quality', 
          experience: 'intermediate' 
        }
      },
      options: {
        strategy: { type: 'general', focus: ['clarity'], approach: 'comprehensive', priority: 'quality' },
        qualityThreshold: 0.8,
        maxTokens: 2000,
        temperature: 0.3,
        includeExamples: true,
        includeBestPractices: true,
        includeAntiPatterns: false,
        includePerformanceTips: false,
        includeSecurityConsiderations: false,
        includeTestingApproaches: false
      },
      goals: {
        primary: 'enhance prompt quality',
        secondary: ['improve clarity', 'add context'],
        constraints: ['maintain brevity'],
        successCriteria: ['clear output', 'actionable steps'],
        expectedOutcome: 'better prompt'
      }
    });
    
    const history = this.performanceHistory.get(promptKey) || [];
    history.push(metrics);
    this.performanceHistory.set(promptKey, history.slice(-100)); // Keep last 100 per prompt
  }

  private getRecentMetrics(timeWindow: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  private initializeAdaptiveThresholds(): void {
    this.adaptiveThresholds.set('responseTime', 1000);
    this.adaptiveThresholds.set('tokenUsage', 2000);
    this.adaptiveThresholds.set('cost', 0.05);
    this.adaptiveThresholds.set('memoryUsage', 50 * 1024 * 1024); // 50MB
  }
}
