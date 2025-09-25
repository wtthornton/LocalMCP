/**
 * Unit Tests for Performance Optimizer Service
 * 
 * Tests the performance optimization functionality including:
 * - Request optimization
 * - Response optimization
 * - Metrics collection
 * - Recommendations generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceOptimizerService, OptimizationConfig } from './performance-optimizer.service';
import { Logger } from '../logging/logger.service';
import { PromptCacheService } from '../caching/prompt-cache.service';
import { OpenAIService } from '../ai/openai.service';
import { 
  PromptEnhancementRequest, 
  PromptEnhancementResponse,
  EnhancementStrategy
} from '../../types/prompt-enhancement.types';

// Mock dependencies
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
} as unknown as Logger;

const mockPromptCache = {
  set: vi.fn(),
  get: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn()
} as unknown as PromptCacheService;

const mockOpenAIService = {
  enhancePromptWithContext: vi.fn()
} as unknown as OpenAIService;

describe('PerformanceOptimizerService', () => {
  let service: PerformanceOptimizerService;
  let config: OptimizationConfig;

  beforeEach(() => {
    config = {
      enableCaching: true,
      cacheTTL: 3600000,
      maxCacheSize: 1000,
      enableTokenOptimization: true,
      maxTokensPerRequest: 4000,
      enableCostOptimization: true,
      maxCostPerRequest: 0.10,
      enableMemoryOptimization: true,
      maxMemoryUsage: 100 * 1024 * 1024,
      enableConcurrentProcessing: true,
      maxConcurrentRequests: 5,
      enableAdaptiveOptimization: true,
      optimizationThreshold: 0.8
    };

    service = new PerformanceOptimizerService(
      mockLogger,
      mockPromptCache,
      mockOpenAIService,
      config
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    service.clearMetrics();
  });

  describe('optimizeEnhancementRequest', () => {
    it('should optimize token usage when enabled', async () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: [],
          code_snippets: Array(15).fill('// Code snippet'),
          framework_docs: Array(8).fill('Framework documentation'),
          project_docs: [],
          context7_docs: []
        },
        options: {
          strategy: 'framework-specific' as EnhancementStrategy,
          quality_focus: 'premium'
        }
      };

      const result = await service.optimizeEnhancementRequest(request);

      expect(result.context.code_snippets).toHaveLength(10);
      expect(result.context.framework_docs).toHaveLength(5);
    });

    it('should optimize cost when enabled', async () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Simple request',
        context: {
          repo_facts: [],
          code_snippets: [],
          framework_docs: [],
          project_docs: [],
          context7_docs: []
        },
        options: {
          strategy: 'quality-focused' as EnhancementStrategy,
          quality_focus: 'premium'
        }
      };

      const result = await service.optimizeEnhancementRequest(request);

      expect(result.options?.strategy).toBe('general');
    });

    it('should optimize memory usage when enabled', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockReturnValue({
        rss: 200 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        heapUsed: 150 * 1024 * 1024,
        external: 0,
        arrayBuffers: 0
      });

      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: [],
          code_snippets: Array(20).fill('// Code snippet'),
          framework_docs: Array(10).fill('Framework documentation'),
          project_docs: [],
          context7_docs: []
        },
        options: {}
      };

      const result = await service.optimizeEnhancementRequest(request);

      expect(result.context.code_snippets).toHaveLength(5);
      expect(result.context.framework_docs).toHaveLength(3);

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should apply adaptive optimization when enabled', async () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: [],
          code_snippets: [],
          framework_docs: [],
          project_docs: [],
          context7_docs: []
        },
        options: {}
      };

      const result = await service.optimizeEnhancementRequest(request);

      expect(result).toBeDefined();
      expect(result.original_prompt).toBe(request.original_prompt);
    });

    it('should handle optimization errors gracefully', async () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: [],
          code_snippets: [],
          framework_docs: [],
          project_docs: [],
          context7_docs: []
        },
        options: {}
      };

      // Mock an error in optimization
      const originalOptimizeTokenUsage = service['optimizeTokenUsage'];
      service['optimizeTokenUsage'] = vi.fn().mockRejectedValue(new Error('Optimization failed'));

      await expect(service.optimizeEnhancementRequest(request)).rejects.toThrow('Optimization failed');

      // Restore original method
      service['optimizeTokenUsage'] = originalOptimizeTokenUsage;
    });
  });

  describe('optimizeEnhancementResponse', () => {
    it('should truncate large responses', async () => {
      const response: PromptEnhancementResponse = {
        success: true,
        enhanced_prompt: 'A'.repeat(15000),
        metadata: {
          quality_score: 0.8,
          confidence_score: 0.9,
          processing_time: 1000,
          cost: 0.05,
          tokens: { input: 100, output: 200, total: 300 }
        }
      };

      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: { repo_facts: [], code_snippets: [], framework_docs: [], project_docs: [], context7_docs: [] },
        options: {}
      };

      const result = await service.optimizeEnhancementResponse(response, request);

      expect(result.enhanced_prompt.length).toBeLessThan(15000);
      expect(result.enhanced_prompt).toContain('... [Response truncated for performance]');
    });

    it('should optimize metadata', async () => {
      const response: PromptEnhancementResponse = {
        success: true,
        enhanced_prompt: 'Enhanced prompt',
        metadata: {
          quality_score: 0.8,
          confidence_score: 0.9,
          processing_time: 1000,
          cost: 0.05,
          tokens: { input: 100, output: 200, total: 300 },
          improvements: Array(15).fill({ type: 'clarity', description: 'Improvement' }),
          recommendations: Array(8).fill('Recommendation')
        }
      };

      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: { repo_facts: [], code_snippets: [], framework_docs: [], project_docs: [], context7_docs: [] },
        options: {}
      };

      const result = await service.optimizeEnhancementResponse(response, request);

      expect(result.metadata?.improvements).toHaveLength(10);
      expect(result.metadata?.recommendations).toHaveLength(5);
    });

    it('should cache response when beneficial', async () => {
      const response: PromptEnhancementResponse = {
        success: true,
        enhanced_prompt: 'Enhanced prompt',
        metadata: {
          quality_score: 0.8,
          confidence_score: 0.9,
          processing_time: 1000,
          cost: 0.05,
          tokens: { input: 100, output: 200, total: 300 }
        }
      };

      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: { repo_facts: [], code_snippets: [], framework_docs: [], project_docs: [], context7_docs: [] },
        options: {}
      };

      await service.optimizeEnhancementResponse(response, request);

      expect(mockPromptCache.set).toHaveBeenCalled();
    });

    it('should handle optimization errors gracefully', async () => {
      const response: PromptEnhancementResponse = {
        success: true,
        enhanced_prompt: 'Enhanced prompt',
        metadata: {
          quality_score: 0.8,
          confidence_score: 0.9,
          processing_time: 1000,
          cost: 0.05,
          tokens: { input: 100, output: 200, total: 300 }
        }
      };

      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: { repo_facts: [], code_snippets: [], framework_docs: [], project_docs: [], context7_docs: [] },
        options: {}
      };

      // Mock an error in optimization
      const originalTruncateResponse = service['truncateResponse'];
      service['truncateResponse'] = vi.fn().mockRejectedValue(new Error('Truncation failed'));

      const result = await service.optimizeEnhancementResponse(response, request);

      expect(result).toEqual(response); // Should return original response
      expect(mockLogger.error).toHaveBeenCalled();

      // Restore original method
      service['truncateResponse'] = originalTruncateResponse;
    });
  });

  describe('getOptimizationRecommendations', () => {
    it('should generate performance recommendations', async () => {
      // Add some high response time metrics
      for (let i = 0; i < 10; i++) {
        service['recordMetrics']({
          responseTime: 3000,
          tokenUsage: 1000,
          cost: 0.05,
          cacheHit: false,
          memoryUsage: 50 * 1024 * 1024,
          cpuUsage: 50,
          timestamp: new Date()
        });
      }

      const recommendations = await service.getOptimizationRecommendations();

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('performance');
      expect(recommendations[0].priority).toBe('high');
    });

    it('should generate cost recommendations', async () => {
      // Add some high cost metrics
      for (let i = 0; i < 10; i++) {
        service['recordMetrics']({
          responseTime: 1000,
          tokenUsage: 1000,
          cost: 0.15,
          cacheHit: false,
          memoryUsage: 50 * 1024 * 1024,
          cpuUsage: 50,
          timestamp: new Date()
        });
      }

      const recommendations = await service.getOptimizationRecommendations();

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('cost');
      expect(recommendations[0].priority).toBe('medium');
    });

    it('should generate memory recommendations', async () => {
      // Add some high memory usage metrics
      for (let i = 0; i < 10; i++) {
        service['recordMetrics']({
          responseTime: 1000,
          tokenUsage: 1000,
          cost: 0.05,
          cacheHit: false,
          memoryUsage: 150 * 1024 * 1024,
          cpuUsage: 50,
          timestamp: new Date()
        });
      }

      const recommendations = await service.getOptimizationRecommendations();

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('memory');
      expect(recommendations[0].priority).toBe('high');
    });

    it('should generate caching recommendations', async () => {
      // Add some low cache hit rate metrics
      for (let i = 0; i < 10; i++) {
        service['recordMetrics']({
          responseTime: 1000,
          tokenUsage: 1000,
          cost: 0.05,
          cacheHit: i < 2, // 20% cache hit rate
          memoryUsage: 50 * 1024 * 1024,
          cpuUsage: 50,
          timestamp: new Date()
        });
      }

      const recommendations = await service.getOptimizationRecommendations();

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('caching');
      expect(recommendations[0].priority).toBe('medium');
    });

    it('should generate token recommendations', async () => {
      // Add some high token usage metrics
      for (let i = 0; i < 10; i++) {
        service['recordMetrics']({
          responseTime: 1000,
          tokenUsage: 5000,
          cost: 0.05,
          cacheHit: false,
          memoryUsage: 50 * 1024 * 1024,
          cpuUsage: 50,
          timestamp: new Date()
        });
      }

      const recommendations = await service.getOptimizationRecommendations();

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('tokens');
      expect(recommendations[0].priority).toBe('medium');
    });

    it('should return empty recommendations when no metrics', async () => {
      const recommendations = await service.getOptimizationRecommendations();

      expect(recommendations).toHaveLength(0);
    });
  });

  describe('getPerformanceStats', () => {
    it('should return correct statistics', () => {
      // Add some test metrics
      service['recordMetrics']({
        responseTime: 1000,
        tokenUsage: 1000,
        cost: 0.05,
        cacheHit: true,
        memoryUsage: 50 * 1024 * 1024,
        cpuUsage: 50,
        timestamp: new Date()
      });

      service['recordMetrics']({
        responseTime: 2000,
        tokenUsage: 2000,
        cost: 0.10,
        cacheHit: false,
        memoryUsage: 100 * 1024 * 1024,
        cpuUsage: 60,
        timestamp: new Date()
      });

      const stats = service.getPerformanceStats();

      expect(stats.totalRequests).toBe(2);
      expect(stats.avgResponseTime).toBe(1500);
      expect(stats.avgTokenUsage).toBe(1500);
      expect(stats.avgCost).toBe(0.075);
      expect(stats.cacheHitRate).toBe(0.5);
      expect(stats.memoryUsage).toBe(100 * 1024 * 1024);
    });

    it('should return zero stats when no metrics', () => {
      const stats = service.getPerformanceStats();

      expect(stats.totalRequests).toBe(0);
      expect(stats.avgResponseTime).toBe(0);
      expect(stats.avgTokenUsage).toBe(0);
      expect(stats.avgCost).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.memoryUsage).toBe(0);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      // Add some test metrics
      service['recordMetrics']({
        responseTime: 1000,
        tokenUsage: 1000,
        cost: 0.05,
        cacheHit: true,
        memoryUsage: 50 * 1024 * 1024,
        cpuUsage: 50,
        timestamp: new Date()
      });

      expect(service.getPerformanceStats().totalRequests).toBe(1);

      service.clearMetrics();

      expect(service.getPerformanceStats().totalRequests).toBe(0);
    });
  });

  describe('private methods', () => {
    it('should estimate token usage correctly', () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: ['Fact 1', 'Fact 2'],
          code_snippets: ['Code 1', 'Code 2'],
          framework_docs: ['Doc 1'],
          project_docs: [],
          context7_docs: []
        },
        options: {}
      };

      const tokens = service['estimateTokenUsage'](request);

      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });

    it('should estimate cost correctly', () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: [],
          code_snippets: [],
          framework_docs: [],
          project_docs: [],
          context7_docs: []
        },
        options: {
          strategy: 'framework-specific' as EnhancementStrategy
        }
      };

      const cost = service['estimateCost'](request);

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should generate prompt key correctly', () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: [],
          code_snippets: [],
          framework_docs: [],
          project_docs: [],
          context7_docs: []
        },
        options: {
          strategy: 'framework-specific' as EnhancementStrategy,
          quality_focus: 'premium'
        }
      };

      const key = service['generatePromptKey'](request);

      expect(key).toContain('Create a React component');
      expect(key).toContain('framework-specific');
      expect(key).toContain('premium');
    });

    it('should generate cache key correctly', () => {
      const request: PromptEnhancementRequest = {
        original_prompt: 'Create a React component',
        context: {
          repo_facts: [],
          code_snippets: [],
          framework_docs: [],
          project_docs: [],
          context7_docs: []
        },
        options: {
          strategy: 'framework-specific' as EnhancementStrategy
        }
      };

      const key = service['generateCacheKey'](request);

      expect(key).toContain('enhancement-');
      expect(typeof key).toBe('string');
    });
  });
});
