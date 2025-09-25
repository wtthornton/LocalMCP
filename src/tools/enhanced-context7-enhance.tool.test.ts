/**
 * Enhanced Context7 Enhance Tool Tests
 * 
 * Tests for the enhanced tool with AI enhancement integration
 * Tests both standard and AI-enhanced prompt enhancement flows
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { EnhancedContext7EnhanceTool } from './enhanced-context7-enhance.tool.js';
import { Logger } from '../services/logger/logger.js';
import { SimpleContext7Client } from '../services/context7/simple-context7-client.js';
import { FrameworkDetectorService } from '../services/framework-detector/framework-detector.service.js';
import { PromptCacheService } from '../services/cache/prompt-cache.service.js';
import { ProjectAnalyzerService } from '../services/analysis/project-analyzer.service.js';
import { CacheAnalyticsService } from '../services/cache/cache-analytics.service.js';
import { TodoService } from '../services/todo/todo.service.js';
import { TaskBreakdownService } from '../services/task-breakdown/task-breakdown.service.js';
import { Context7CurationService } from '../services/ai/context7-curation.service.js';
import { OpenAIService } from '../services/ai/openai.service.js';

// Mock dependencies
vi.mock('../services/logger/logger.js');
vi.mock('../services/context7/simple-context7-client.js');
vi.mock('../services/framework-detector/framework-detector.service.js');
vi.mock('../services/cache/prompt-cache.service.js');
vi.mock('../services/analysis/project-analyzer.service.js');
vi.mock('../services/cache/cache-analytics.service.js');
vi.mock('../services/todo/todo.service.js');
vi.mock('../services/task-breakdown/task-breakdown.service.js');
vi.mock('../services/ai/context7-curation.service.js');
vi.mock('../services/ai/openai.service.js');
vi.mock('./enhance/prompt-analyzer.service.js');
vi.mock('./enhance/context7-documentation.service.js');
vi.mock('./enhance/framework-integration.service.js');
vi.mock('./enhance/response-builder.service.js');
vi.mock('./enhance/task-context.service.js');
vi.mock('./enhance/health-checker.service.js');
vi.mock('../services/ai/prompt-enhancement-agent.service.js');
vi.mock('../services/ai/enhancement-config.service.js');

describe('EnhancedContext7EnhanceTool', () => {
  let tool: EnhancedContext7EnhanceTool;
  let mockLogger: any;
  let mockContext7Client: any;
  let mockFrameworkDetector: any;
  let mockPromptCache: any;
  let mockProjectAnalyzer: any;
  let mockMonitoring: any;
  let mockCacheAnalytics: any;
  let mockTodoService: any;
  let mockOpenAIService: any;
  let mockTaskBreakdownService: any;
  let mockCurationService: any;

  const mockConfig = {
    context7: { enabled: true },
    openai: { enabled: true }
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };

    // Mock Context7 client
    mockContext7Client = {
      getDocumentation: vi.fn().mockResolvedValue({ docs: 'Context7 docs' })
    };

    // Mock framework detector
    mockFrameworkDetector = {
      detectFrameworks: vi.fn().mockResolvedValue({
        detectedFrameworks: ['react'],
        confidence: 0.9,
        detectionMethod: 'pattern',
        suggestions: []
      })
    };

    // Mock prompt cache
    mockPromptCache = {
      getCachedPrompt: vi.fn().mockResolvedValue(null),
      cachePrompt: vi.fn().mockResolvedValue(undefined)
    };

    // Mock project analyzer
    mockProjectAnalyzer = {
      analyzeProject: vi.fn().mockResolvedValue([
        { fact: 'This is a React project' },
        { fact: 'Uses TypeScript' }
      ]),
      findRelevantCodeSnippets: vi.fn().mockResolvedValue([
        {
          file: 'src/App.tsx',
          description: 'Main App component',
          content: 'import React from "react";'
        }
      ])
    };

    // Mock monitoring
    mockMonitoring = {
      trackEvent: vi.fn(),
      trackMetric: vi.fn()
    };

    // Mock cache analytics
    mockCacheAnalytics = {
      trackCacheHit: vi.fn(),
      trackCacheMiss: vi.fn()
    };

    // Mock todo service
    mockTodoService = {
      createTodo: vi.fn().mockResolvedValue({ id: '1', title: 'Test todo' })
    };

    // Mock OpenAI service
    mockOpenAIService = {
      enhancePromptWithContext: vi.fn().mockResolvedValue({
        enhancedPrompt: 'AI-enhanced prompt with React best practices...',
        metadata: {
          originalLength: 20,
          enhancedLength: 100,
          tokenUsage: { cost: 0.05, totalTokens: 150 },
          processingTime: 1000,
          strategy: { type: 'framework-specific' },
          framework: 'react',
          projectType: 'frontend',
          timestamp: new Date()
        },
        quality: {
          clarity: 0.9,
          specificity: 0.85,
          actionability: 0.9,
          completeness: 0.8,
          relevance: 0.9,
          overall: 0.87
        },
        confidence: {
          overall: 0.9,
          contextRelevance: 0.9,
          frameworkAccuracy: 0.85,
          qualityAlignment: 0.9,
          projectFit: 0.9
        },
        improvements: [
          {
            type: 'clarity',
            description: 'Made the request more specific',
            impact: 'high',
            before: 'Create a component',
            after: 'Create a React component with TypeScript'
          }
        ],
        recommendations: [
          'Use React Testing Library for testing',
          'Implement proper accessibility attributes'
        ]
      })
    };

    // Mock task breakdown service
    mockTaskBreakdownService = {
      breakdownPrompt: vi.fn().mockResolvedValue({
        mainTasks: [],
        subtasks: [],
        dependencies: []
      })
    };

    // Mock curation service
    mockCurationService = {
      curateContent: vi.fn().mockResolvedValue({
        curatedContent: 'Curated content',
        metrics: { qualityScore: 0.9 }
      })
    };

    // Create tool instance
    tool = new EnhancedContext7EnhanceTool(
      mockLogger,
      mockConfig,
      mockContext7Client,
      mockFrameworkDetector,
      mockPromptCache,
      mockProjectAnalyzer,
      mockMonitoring,
      mockCacheAnalytics,
      mockTodoService,
      mockOpenAIService,
      mockTaskBreakdownService,
      mockCurationService
    );
  });

  describe('Standard Enhancement Flow', () => {
    it('should enhance prompt without AI enhancement', async () => {
      const request = {
        prompt: 'Create a button component',
        context: {
          framework: 'react'
        },
        options: {
          useCache: false,
          useAIEnhancement: false
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
      expect(result.frameworks_detected).toContain('react');
      expect(result.ai_enhancement?.enabled).toBe(false);
    });

    it('should use cached result when available', async () => {
      const cachedPrompt = {
        key: 'test-key',
        enhancedPrompt: 'Cached enhanced prompt',
        context: {
          repoFacts: ['Test fact'],
          codeSnippets: ['Test snippet']
        },
        hits: 1,
        qualityScore: 0.8
      };

      mockPromptCache.getCachedPrompt.mockResolvedValue(cachedPrompt);

      const request = {
        prompt: 'Create a button component',
        options: {
          useCache: true,
          useAIEnhancement: false
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBe('Cached enhanced prompt');
      expect(mockPromptCache.getCachedPrompt).toHaveBeenCalled();
    });
  });

  describe('AI Enhancement Flow', () => {
    it('should enhance prompt with AI when enabled', async () => {
      const request = {
        prompt: 'Create a button component',
        context: {
          framework: 'react'
        },
        options: {
          useCache: false,
          useAIEnhancement: true,
          enhancementStrategy: 'framework-specific'
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toContain('AI-enhanced');
      expect(result.ai_enhancement?.enabled).toBe(true);
      expect(result.ai_enhancement?.strategy).toBe('framework-specific');
      expect(result.ai_enhancement?.quality_score).toBeGreaterThan(0.8);
      expect(result.ai_enhancement?.improvements.length).toBeGreaterThan(0);
    });

    it('should enhance with quality-focused strategy', async () => {
      const request = {
        prompt: 'Make it accessible',
        options: {
          useAIEnhancement: true,
          enhancementStrategy: 'quality-focused',
          qualityFocus: ['accessibility', 'performance']
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.ai_enhancement?.enabled).toBe(true);
      expect(result.ai_enhancement?.strategy).toBe('quality-focused');
    });

    it('should enhance with project-aware strategy', async () => {
      const request = {
        prompt: 'Add error handling',
        options: {
          useAIEnhancement: true,
          enhancementStrategy: 'project-aware',
          projectType: 'frontend'
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.ai_enhancement?.enabled).toBe(true);
      expect(result.ai_enhancement?.strategy).toBe('project-aware');
    });

    it('should fallback to standard enhancement when AI fails', async () => {
      mockOpenAIService.enhancePromptWithContext.mockRejectedValue(new Error('OpenAI API error'));

      const request = {
        prompt: 'Create a button component',
        options: {
          useAIEnhancement: true
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
      expect(result.ai_enhancement?.enabled).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'AI enhancement failed, using standard enhancement',
        expect.any(Object)
      );
    });
  });

  describe('Context Integration', () => {
    it('should gather project context before enhancement', async () => {
      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      await tool.enhance(request);

      expect(mockProjectAnalyzer.analyzeProject).toHaveBeenCalled();
      expect(mockProjectAnalyzer.findRelevantCodeSnippets).toHaveBeenCalledWith(
        'Create a component',
        undefined
      );
    });

    it('should detect frameworks with project context', async () => {
      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      await tool.enhance(request);

      expect(mockFrameworkDetector.detectFrameworks).toHaveBeenCalledWith(
        'Create a component',
        expect.objectContaining({
          repoFacts: expect.any(Array),
          codeSnippets: expect.any(Array)
        }),
        undefined
      );
    });

    it('should integrate Context7 documentation', async () => {
      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      await tool.enhance(request);

      expect(mockContext7Client.getDocumentation).toHaveBeenCalled();
    });
  });

  describe('Response Building', () => {
    it('should include AI enhancement metadata in response', async () => {
      const request = {
        prompt: 'Create a button component',
        options: {
          useAIEnhancement: true
        }
      };

      const result = await tool.enhance(request);

      expect(result.ai_enhancement).toBeDefined();
      expect(result.ai_enhancement?.enabled).toBe(true);
      expect(result.ai_enhancement?.strategy).toBe('framework-specific');
      expect(result.ai_enhancement?.quality_score).toBeGreaterThan(0);
      expect(result.ai_enhancement?.confidence_score).toBeGreaterThan(0);
      expect(result.ai_enhancement?.improvements).toBeInstanceOf(Array);
      expect(result.ai_enhancement?.recommendations).toBeInstanceOf(Array);
      expect(result.ai_enhancement?.processing_time).toBeGreaterThan(0);
      expect(result.ai_enhancement?.cost).toBeGreaterThan(0);
    });

    it('should include context used in response', async () => {
      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      const result = await tool.enhance(request);

      expect(result.context_used).toBeDefined();
      expect(result.context_used.repo_facts).toBeInstanceOf(Array);
      expect(result.context_used.code_snippets).toBeInstanceOf(Array);
      expect(result.context_used.context7_docs).toBeInstanceOf(Array);
    });

    it('should include framework detection results', async () => {
      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      const result = await tool.enhance(request);

      expect(result.frameworks_detected).toBeDefined();
      expect(result.frameworks_detected).toContain('react');
    });
  });

  describe('Error Handling', () => {
    it('should handle project analysis errors gracefully', async () => {
      mockProjectAnalyzer.analyzeProject.mockRejectedValue(new Error('Analysis failed'));

      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
    });

    it('should handle framework detection errors gracefully', async () => {
      mockFrameworkDetector.detectFrameworks.mockRejectedValue(new Error('Detection failed'));

      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
    });

    it('should handle Context7 client errors gracefully', async () => {
      mockContext7Client.getDocumentation.mockRejectedValue(new Error('Context7 failed'));

      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: false
        }
      };

      const result = await tool.enhance(request);

      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
    });
  });

  describe('Tool Schema', () => {
    it('should return correct tool schema', () => {
      const schema = tool.getToolSchema();

      expect(schema.name).toBe('promptmcp.enhance');
      expect(schema.description).toContain('Enhance prompts');
      expect(schema.inputSchema.type).toBe('object');
      expect(schema.inputSchema.properties.prompt).toBeDefined();
      expect(schema.inputSchema.properties.options).toBeDefined();
      expect(schema.inputSchema.properties.options.properties.useAIEnhancement).toBeDefined();
      expect(schema.inputSchema.properties.options.properties.enhancementStrategy).toBeDefined();
      expect(schema.inputSchema.properties.options.properties.qualityFocus).toBeDefined();
      expect(schema.inputSchema.properties.options.properties.projectType).toBeDefined();
    });
  });

  describe('Health Status', () => {
    it('should return health status', async () => {
      const healthStatus = await tool.getHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.components).toBeDefined();
      expect(healthStatus.metrics).toBeDefined();
    });
  });

  describe('Configuration Integration', () => {
    it('should use configuration for AI enhancement', async () => {
      const request = {
        prompt: 'Create a component',
        options: {
          useAIEnhancement: true
        }
      };

      await tool.enhance(request);

      // Verify that the enhancement agent was called with proper configuration
      expect(mockOpenAIService.enhancePromptWithContext).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should complete enhancement within reasonable time', async () => {
      const startTime = Date.now();
      
      const request = {
        prompt: 'Create a complex component with state management',
        options: {
          useAIEnhancement: true
        }
      };

      const result = await tool.enhance(request);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(3).fill(null).map((_, i) => ({
        prompt: `Create component ${i}`,
        options: {
          useAIEnhancement: true
        }
      }));

      const results = await Promise.all(requests.map(req => tool.enhance(req)));

      expect(results).toHaveLength(3);
      expect(results.every(result => result.success)).toBe(true);
    });
  });
});