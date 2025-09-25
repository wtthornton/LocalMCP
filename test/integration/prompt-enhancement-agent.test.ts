/**
 * Prompt Enhancement Agent Integration Tests
 * 
 * End-to-end integration tests for the prompt enhancement functionality
 * Tests the complete enhancement pipeline with real OpenAI API calls
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PromptEnhancementAgentService } from '../../src/services/ai/prompt-enhancement-agent.service.js';
import { OpenAIService } from '../../src/services/ai/openai.service.js';
import { ResponseBuilderService } from '../../src/tools/enhance/response-builder.service.js';
import { Logger } from '../../src/services/logger/logger.js';
import { EnhancementContext } from '../../src/types/prompt-enhancement.types.js';

describe('Prompt Enhancement Agent Integration Tests', () => {
  let service: PromptEnhancementAgentService;
  let openAIService: OpenAIService;
  let responseBuilder: ResponseBuilderService;
  let logger: Logger;

  const testConfig = {
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

  const testContext: EnhancementContext = {
    projectContext: {
      projectType: 'frontend',
      framework: 'react',
      language: 'typescript',
      architecture: 'spa',
      patterns: ['hooks', 'functional components'],
      conventions: ['camelCase', 'PascalCase'],
      dependencies: ['react', 'typescript', '@types/react'],
      environment: 'development'
    },
    frameworkContext: {
      framework: 'react',
      version: '18.0.0',
      bestPractices: [
        'Use functional components with hooks',
        'Implement proper error boundaries',
        'Follow React naming conventions'
      ],
      commonPatterns: [
        'Custom hooks for reusable logic',
        'Context for global state',
        'Higher-order components'
      ],
      antiPatterns: [
        'Mutating state directly',
        'Using class components for new code',
        'Missing key props in lists'
      ],
      performanceTips: [
        'Use React.memo for expensive components',
        'Implement useMemo for expensive calculations',
        'Use useCallback for event handlers'
      ],
      securityConsiderations: [
        'Sanitize user input',
        'Use proper HTML escaping',
        'Implement CSRF protection'
      ],
      testingApproaches: [
        'React Testing Library for component testing',
        'Jest for unit testing',
        'Cypress for E2E testing'
      ]
    },
    qualityRequirements: {
      accessibility: true,
      performance: true,
      security: true,
      testing: true,
      documentation: false,
      maintainability: true,
      scalability: false,
      userExperience: true
    },
    codeSnippets: [
      {
        content: `import React, { useState, useEffect } from 'react';

interface CounterProps {
  initialValue?: number;
  onCountChange?: (count: number) => void;
}

const Counter: React.FC<CounterProps> = ({ initialValue = 0, onCountChange }) => {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);

  return (
    <div>
      <button onClick={decrement} aria-label="Decrement">-</button>
      <span>{count}</span>
      <button onClick={increment} aria-label="Increment">+</button>
    </div>
  );
};

export default Counter;`,
        language: 'typescript',
        purpose: 'example',
        relevance: 0.9,
        location: 'components/Counter.tsx'
      }
    ],
    documentation: {
      apiDocs: ['useState', 'useEffect', 'React.FC'],
      guides: ['Getting Started with React', 'Hooks Guide'],
      examples: ['Counter Component', 'Todo App'],
      tutorials: ['React TypeScript Tutorial'],
      troubleshooting: ['Common React Issues', 'Performance Problems']
    },
    userPreferences: {
      codingStyle: 'functional',
      verbosity: 'detailed',
      focus: 'quality',
      experience: 'intermediate'
    }
  };

  beforeAll(async () => {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not found, skipping integration tests');
      return;
    }

    logger = new Logger('IntegrationTest');
    openAIService = new OpenAIService(logger, {
      apiKey: process.env.OPENAI_API_KEY,
      projectId: process.env.OPENAI_PROJECT_ID,
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.3
    });
    responseBuilder = new ResponseBuilderService(logger, openAIService);
    service = new PromptEnhancementAgentService(logger, openAIService, responseBuilder, testConfig);
  });

  beforeEach(() => {
    // Reset metrics before each test
    service.resetMetrics();
  });

  describe('End-to-End Enhancement Flow', () => {
    it('should enhance a simple prompt with React context', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Create a button component';
      const result = await service.enhancePrompt(originalPrompt, testContext);

      expect(result).toBeDefined();
      expect(result.enhancedPrompt).toBeDefined();
      expect(result.enhancedPrompt.length).toBeGreaterThan(originalPrompt.length);
      expect(result.quality.overall).toBeGreaterThan(0.7);
      expect(result.confidence.overall).toBeGreaterThan(0.7);
      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should enhance with framework-specific strategy', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Add state management';
      const result = await service.enhancePromptForFramework(
        originalPrompt,
        testContext,
        'react',
        '18.0.0'
      );

      expect(result).toBeDefined();
      expect(result.enhancedPrompt).toContain('React');
      expect(result.enhancedPrompt).toContain('useState');
      expect(result.metadata.strategy.type).toBe('framework-specific');
    });

    it('should enhance with quality-focused strategy', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Make it accessible';
      const result = await service.enhancePromptForQuality(
        originalPrompt,
        testContext,
        ['accessibility', 'performance']
      );

      expect(result).toBeDefined();
      expect(result.enhancedPrompt).toContain('accessibility');
      expect(result.enhancedPrompt).toContain('ARIA');
      expect(result.metadata.strategy.type).toBe('quality-focused');
    });

    it('should enhance with project-aware strategy', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Add error handling';
      const result = await service.enhancePromptForProject(
        originalPrompt,
        testContext,
        'frontend'
      );

      expect(result).toBeDefined();
      expect(result.enhancedPrompt).toContain('error');
      expect(result.metadata.strategy.type).toBe('project-aware');
    });
  });

  describe('Quality Validation', () => {
    it('should validate enhancement quality', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Create a form';
      const result = await service.enhancePrompt(originalPrompt, testContext);

      expect(result.quality.overall).toBeGreaterThan(0.5);
      expect(result.quality.clarity).toBeGreaterThan(0.5);
      expect(result.quality.actionability).toBeGreaterThan(0.5);
      expect(result.quality.specificity).toBeGreaterThan(0.5);
    });

    it('should provide detailed improvements', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Add validation';
      const result = await service.enhancePrompt(originalPrompt, testContext);

      expect(result.improvements.length).toBeGreaterThan(0);
      expect(result.improvements[0]).toHaveProperty('type');
      expect(result.improvements[0]).toHaveProperty('description');
      expect(result.improvements[0]).toHaveProperty('impact');
    });

    it('should provide actionable recommendations', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Optimize performance';
      const result = await service.enhancePrompt(originalPrompt, testContext);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('React');
    });
  });

  describe('Cost and Performance', () => {
    it('should track token usage and cost', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const originalPrompt = 'Create a dashboard';
      const result = await service.enhancePrompt(originalPrompt, testContext);

      expect(result.metadata.tokenUsage.totalTokens).toBeGreaterThan(0);
      expect(result.metadata.tokenUsage.cost).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should complete within reasonable time', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const startTime = Date.now();
      const originalPrompt = 'Add authentication';
      await service.enhancePrompt(originalPrompt, testContext);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const prompts = [
        'Create a header component',
        'Add form validation',
        'Implement dark mode',
        'Add loading states',
        'Create error boundaries'
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        prompts.map(prompt => service.enhancePrompt(prompt, testContext))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(results.every(result => result.enhancedPrompt)).toBe(true);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid prompts gracefully', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      await expect(service.enhancePrompt('', testContext)).rejects.toThrow();
    });

    it('should provide fallback enhancement when OpenAI fails', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      // Create a service with fallback enabled
      const fallbackService = new PromptEnhancementAgentService(
        logger,
        openAIService,
        responseBuilder,
        { ...testConfig, fallbackEnabled: true }
      );

      // Mock OpenAI to fail
      const originalMethod = openAIService.enhancePromptWithContext;
      openAIService.enhancePromptWithContext = async () => {
        throw new Error('OpenAI API error');
      };

      const result = await fallbackService.enhancePrompt('Create a component', testContext);

      expect(result).toBeDefined();
      expect(result.enhancedPrompt).toContain('Create a component');
      expect(result.metadata.strategy.type).toBe('general');

      // Restore original method
      openAIService.enhancePromptWithContext = originalMethod;
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track enhancement metrics', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const initialMetrics = service.getMetrics();
      expect(initialMetrics.totalEnhancements).toBe(0);

      await service.enhancePrompt('Create a component', testContext);

      const updatedMetrics = service.getMetrics();
      expect(updatedMetrics.totalEnhancements).toBe(1);
      expect(updatedMetrics.successfulEnhancements).toBe(1);
      expect(updatedMetrics.averageQualityScore).toBeGreaterThan(0);
      expect(updatedMetrics.totalCost).toBeGreaterThan(0);
    });

    it('should reset metrics correctly', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      await service.enhancePrompt('Create a component', testContext);
      expect(service.getMetrics().totalEnhancements).toBe(1);

      service.resetMetrics();
      expect(service.getMetrics().totalEnhancements).toBe(0);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration dynamically', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const newConfig = { qualityThreshold: 0.9 };
      service.updateConfig(newConfig);

      // Configuration should be updated (we can't easily test the internal state)
      // but we can verify the method doesn't throw
      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should enhance a complex React component request', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const complexPrompt = `Create a data table component that:
        - Displays user data with pagination
        - Has sorting and filtering capabilities
        - Is accessible and responsive
        - Uses TypeScript and follows React best practices`;

      const result = await service.enhancePrompt(complexPrompt, testContext);

      expect(result.enhancedPrompt).toContain('data table');
      expect(result.enhancedPrompt).toContain('pagination');
      expect(result.enhancedPrompt).toContain('TypeScript');
      expect(result.enhancedPrompt).toContain('accessibility');
      expect(result.quality.overall).toBeGreaterThan(0.8);
    });

    it('should enhance a performance optimization request', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const performancePrompt = 'Optimize this component for better performance';
      const result = await service.enhancePromptForQuality(
        performancePrompt,
        testContext,
        ['performance']
      );

      expect(result.enhancedPrompt).toContain('performance');
      expect(result.enhancedPrompt).toContain('memo');
      expect(result.enhancedPrompt).toContain('useMemo');
      expect(result.enhancedPrompt).toContain('useCallback');
    });

    it('should enhance a testing request', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OpenAI API key not available');
        return;
      }

      const testingPrompt = 'Add comprehensive tests for this component';
      const result = await service.enhancePromptForQuality(
        testingPrompt,
        testContext,
        ['testing']
      );

      expect(result.enhancedPrompt).toContain('test');
      expect(result.enhancedPrompt).toContain('Testing Library');
      expect(result.enhancedPrompt).toContain('Jest');
      expect(result.enhancedPrompt).toContain('accessibility');
    });
  });
});
