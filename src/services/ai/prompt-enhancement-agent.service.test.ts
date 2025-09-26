/**
 * Prompt Enhancement Agent Service Tests
 * 
 * Comprehensive unit tests for the Prompt Enhancement Agent Service
 * Tests all enhancement strategies, validation, and error handling
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PromptEnhancementAgentService } from './prompt-enhancement-agent.service.js';
import { OpenAIService } from './openai.service.js';
import { ResponseBuilderService } from '../../tools/enhance/response-builder.service.js';
import { Logger } from '../logger/logger.js';
import { 
  EnhancementContext,
  PromptEnhancementResponse,
  EnhancementStrategy
} from '../../types/prompt-enhancement.types.js';

// Mock dependencies
vi.mock('./openai.service.js');
vi.mock('../../tools/enhance/response-builder.service.js');
vi.mock('../logger/logger.js');

describe('PromptEnhancementAgentService', () => {
  let service: PromptEnhancementAgentService;
  let mockOpenAI: any;
  let mockResponseBuilder: any;
  let mockLogger: any;

  const mockConfig = {
    enabled: true,
    defaultStrategy: {
      type: 'general' as const,
      focus: ['clarity', 'actionability'],
      approach: 'comprehensive',
      priority: 'quality' as const
    },
    qualityThreshold: 0.8,
    maxTokens: 2000,
    temperature: 0.3,
    costLimit: 10.0,
    rateLimit: 100,
    fallbackEnabled: true,
    optimization: {
      tokenOptimization: {
        contextTruncation: true,
        smartSummarization: true,
        relevanceFiltering: true,
        priorityBasedSelection: true
      },
      qualityOptimization: {
        qualityScoring: true,
        confidenceThresholds: true,
        validationChecks: true,
        feedbackLoop: false
      },
      costOptimization: {
        modelSelection: true,
        tokenBudgeting: true,
        cacheUtilization: true,
        batchProcessing: false
      },
      performanceOptimization: {
        parallelProcessing: true,
        caching: true,
        responseStreaming: false,
        loadBalancing: false
      }
    }
  };

  const mockContext: EnhancementContext = {
    projectContext: {
      projectType: 'frontend',
      framework: 'react',
      language: 'typescript',
      architecture: 'spa',
      patterns: ['hooks', 'components'],
      conventions: ['camelCase', 'PascalCase'],
      dependencies: ['react', 'typescript'],
      environment: 'development'
    },
    frameworkContext: {
      framework: 'react',
      version: '18.0.0',
      bestPractices: ['use hooks', 'functional components'],
      commonPatterns: ['custom hooks', 'context'],
      antiPatterns: ['class components', 'mutation'],
      performanceTips: ['memo', 'useMemo'],
      securityConsiderations: ['xss protection'],
      testingApproaches: ['testing library', 'jest']
    },
    qualityRequirements: {
      accessibility: true,
      performance: true,
      security: false,
      testing: true,
      documentation: false,
      maintainability: true,
      scalability: false,
      userExperience: true
    },
    codeSnippets: [
      {
        content: 'const [state, setState] = useState(0);',
        language: 'typescript',
        purpose: 'example',
        relevance: 0.9,
        location: 'component.tsx'
      }
    ],
    documentation: {
      apiDocs: ['useState', 'useEffect'],
      guides: ['getting started'],
      examples: ['counter example'],
      tutorials: ['react tutorial'],
      troubleshooting: ['common issues']
    },
    userPreferences: {
      codingStyle: 'functional',
      verbosity: 'detailed',
      focus: 'quality',
      experience: 'intermediate'
    }
  };

  const mockEnhancementResponse: PromptEnhancementResponse = {
    enhancedPrompt: 'Create a React component with TypeScript that uses hooks and follows accessibility best practices...',
    metadata: {
      originalLength: 50,
      enhancedLength: 150,
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        cost: 0.05,
        model: 'gpt-4o'
      },
      processingTime: 1000,
      strategy: mockConfig.defaultStrategy,
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
      'Consider using React Testing Library for testing',
      'Implement proper accessibility attributes'
    ]
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

    // Mock OpenAI service
    mockOpenAI = {
      enhancePromptWithContext: vi.fn().mockResolvedValue(mockEnhancementResponse)
    };

    // Mock ResponseBuilder service
    mockResponseBuilder = {
      buildEnhancedPrompt: vi.fn().mockReturnValue('enhanced prompt')
    };

    // Create service instance
    service = new PromptEnhancementAgentService(
      mockLogger,
      mockOpenAI,
      mockResponseBuilder,
      mockConfig
    );
  });

  describe('enhancePrompt', () => {
    it('should enhance prompt successfully', async () => {
      const result = await service.enhancePrompt('Create a component', mockContext);

      expect(result).toEqual(mockEnhancementResponse);
      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          originalPrompt: 'Create a component',
          context: mockContext,
          options: expect.any(Object),
          goals: expect.any(Object)
        })
      );
    });

    it('should validate input parameters', async () => {
      await expect(service.enhancePrompt('', mockContext)).rejects.toThrow('Enhancement validation failed');
    });

    it('should handle OpenAI service errors', async () => {
      mockOpenAI.enhancePromptWithContext.mockRejectedValue(new Error('OpenAI API error'));

      await expect(service.enhancePrompt('Create a component', mockContext)).rejects.toThrow('OpenAI API error');
    });

    it('should return fallback enhancement when enabled', async () => {
      mockOpenAI.enhancePromptWithContext.mockRejectedValue(new Error('OpenAI API error'));

      const result = await service.enhancePrompt('Create a component', mockContext);

      expect(result.enhancedPrompt).toContain('Create a component');
      expect(result.metadata.strategy.type).toBe('general');
      expect(result.quality.overall).toBe(0.6);
    });

    it('should update metrics after successful enhancement', async () => {
      const metrics = service.getMetrics();
      expect(metrics.totalEnhancements).toBe(0);

      await service.enhancePrompt('Create a component', mockContext);

      const updatedMetrics = service.getMetrics();
      expect(updatedMetrics.totalEnhancements).toBe(1);
      expect(updatedMetrics.successfulEnhancements).toBe(1);
    });
  });

  describe('enhancePromptWithStrategy', () => {
    it('should enhance with framework-specific strategy', async () => {
      await service.enhancePromptWithStrategy(
        'Create a component',
        mockContext,
        'framework-specific'
      );

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            strategy: expect.objectContaining({
              type: 'framework-specific'
            })
          })
        })
      );
    });

    it('should enhance with quality-focused strategy', async () => {
      await service.enhancePromptWithStrategy(
        'Create a component',
        mockContext,
        'quality-focused',
        { focus: ['accessibility', 'performance'] }
      );

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            strategy: expect.objectContaining({
              type: 'quality-focused'
            })
          })
        })
      );
    });
  });

  describe('enhancePromptForFramework', () => {
    it('should enhance prompt for specific framework', async () => {
      await service.enhancePromptForFramework(
        'Create a component',
        mockContext,
        'vue',
        '3.0.0'
      );

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            frameworkContext: expect.objectContaining({
              framework: 'vue',
              version: '3.0.0'
            })
          })
        })
      );
    });
  });

  describe('enhancePromptForQuality', () => {
    it('should enhance prompt with quality focus', async () => {
      await service.enhancePromptForQuality(
        'Create a component',
        mockContext,
        ['accessibility', 'performance']
      );

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            qualityRequirements: expect.objectContaining({
              accessibility: true,
              performance: true
            })
          })
        })
      );
    });
  });

  describe('enhancePromptForProject', () => {
    it('should enhance prompt for specific project type', async () => {
      await service.enhancePromptForProject(
        'Create a component',
        mockContext,
        'backend'
      );

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            projectContext: expect.objectContaining({
              projectType: 'backend'
            })
          })
        })
      );
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      const metrics = service.getMetrics();

      expect(metrics).toEqual({
        totalEnhancements: 0,
        successfulEnhancements: 0,
        failedEnhancements: 0,
        averageQualityScore: 0,
        averageConfidenceScore: 0,
        averageProcessingTime: 0,
        totalCost: 0,
        averageCostPerEnhancement: 0,
        qualityDistribution: {},
        strategyPerformance: {}
      });
    });
  });

  describe('resetMetrics', () => {
    it('should reset metrics to initial state', async () => {
      await service.enhancePrompt('Create a component', mockContext);
      
      expect(service.getMetrics().totalEnhancements).toBe(1);
      
      service.resetMetrics();
      
      expect(service.getMetrics().totalEnhancements).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = { qualityThreshold: 0.9 };
      
      service.updateConfig(newConfig);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Enhancement configuration updated',
        { config: newConfig }
      );
    });
  });

  describe('validation', () => {
    it('should validate enhancement request', async () => {
      // Test empty prompt
      await expect(service.enhancePrompt('', mockContext)).rejects.toThrow('Enhancement validation failed');
      
      // Test very long prompt
      const longPrompt = 'a'.repeat(10001);
      await expect(service.enhancePrompt(longPrompt, mockContext)).rejects.toThrow('Enhancement validation failed');
    });

    it('should validate quality threshold', async () => {
      const invalidContext = {
        ...mockContext,
        qualityRequirements: {
          ...mockContext.qualityRequirements,
          accessibility: true
        }
      };

      // This should not throw as it's valid
      await expect(service.enhancePrompt('Create a component', invalidContext)).resolves.toBeDefined();
    });
  });

  describe('strategy selection', () => {
    it('should select framework-specific strategy when framework is detected', async () => {
      const contextWithFramework = {
        ...mockContext,
        frameworkContext: {
          ...mockContext.frameworkContext,
          framework: 'react'
        }
      };

      await service.enhancePrompt('Create a component', contextWithFramework);

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            strategy: expect.objectContaining({
              type: 'framework-specific'
            })
          })
        })
      );
    });

    it('should select quality-focused strategy when quality requirements are present', async () => {
      const contextWithQuality = {
        ...mockContext,
        frameworkContext: {
          ...mockContext.frameworkContext,
          framework: 'Unknown'
        },
        qualityRequirements: {
          ...mockContext.qualityRequirements,
          accessibility: true,
          performance: true
        }
      };

      await service.enhancePrompt('Create a component', contextWithQuality);

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            strategy: expect.objectContaining({
              type: 'quality-focused'
            })
          })
        })
      );
    });

    it('should select project-aware strategy when project type is specified', async () => {
      const contextWithProject = {
        ...mockContext,
        frameworkContext: {
          ...mockContext.frameworkContext,
          framework: 'Unknown'
        },
        qualityRequirements: {
          ...mockContext.qualityRequirements,
          accessibility: false,
          performance: false
        },
        projectContext: {
          ...mockContext.projectContext,
          projectType: 'backend'
        }
      };

      await service.enhancePrompt('Create a component', contextWithProject);

      expect(mockOpenAI.enhancePromptWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            strategy: expect.objectContaining({
              type: 'project-aware'
            })
          })
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAI.enhancePromptWithContext.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(service.enhancePrompt('Create a component', mockContext)).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle invalid enhancement response', async () => {
      const invalidResponse = {
        ...mockEnhancementResponse,
        enhancedPrompt: '' // Invalid empty prompt
      };
      mockOpenAI.enhancePromptWithContext.mockResolvedValue(invalidResponse);

      await expect(service.enhancePrompt('Create a component', mockContext)).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      mockOpenAI.enhancePromptWithContext.mockRejectedValue(new Error('Request timeout'));

      await expect(service.enhancePrompt('Create a component', mockContext)).rejects.toThrow('Request timeout');
    });
  });

  describe('cost optimization', () => {
    it('should estimate enhancement cost', async () => {
      const result = await service.enhancePrompt('Create a component', mockContext);

      expect(result.metadata.tokenUsage.cost).toBeGreaterThan(0);
      expect(result.metadata.tokenUsage.totalTokens).toBeGreaterThan(0);
    });

    it('should respect cost limits', async () => {
      const expensiveConfig = {
        ...mockConfig,
        costLimit: 0.01 // Very low limit
      };

      const expensiveService = new PromptEnhancementAgentService(
        mockLogger,
        mockOpenAI,
        mockResponseBuilder,
        expensiveConfig
      );

      // This should not throw as the mock response has low cost
      await expect(expensiveService.enhancePrompt('Create a component', mockContext)).resolves.toBeDefined();
    });
  });

  describe('performance', () => {
    it('should track processing time', async () => {
      const startTime = Date.now();
      await service.enhancePrompt('Create a component', mockContext);
      const endTime = Date.now();

      const metrics = service.getMetrics();
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.averageProcessingTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() => 
        service.enhancePrompt('Create a component', mockContext)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every(result => result.enhancedPrompt)).toBe(true);
    });
  });
});
