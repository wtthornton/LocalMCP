/**
 * Integration tests for AI summarization system
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EnhancedContext7EnhanceToolWithSummarization } from '../../src/tools/enhanced-context7-enhance-with-summarization.tool.js';

// Mock all dependencies
vi.mock('../../src/services/context7/simple-context7-client.js');
vi.mock('../../src/services/framework-detector/framework-detector.service.js');
vi.mock('../../src/services/analysis/project-analyzer.service.js');
vi.mock('../../src/services/cache/cache-analytics.service.js');
vi.mock('../../src/services/todo/todo.service.js');
vi.mock('../../src/services/task-breakdown/task-breakdown.service.js');
vi.mock('../../src/tools/enhance/prompt-analyzer.service.js');
vi.mock('../../src/tools/enhance/context7-documentation.service.js');
vi.mock('../../src/tools/enhance/framework-integration.service.js');
vi.mock('../../src/tools/enhance/response-builder.service.js');
vi.mock('../../src/tools/enhance/task-context.service.js');
vi.mock('../../src/tools/enhance/health-checker.service.js');
vi.mock('../../src/services/ai/context7-curation.service.js');
vi.mock('../../src/services/ai/prompt-enhancement-agent.service.js');
vi.mock('../../src/services/ai/enhancement-config.service.js');

describe('Summarization Integration', () => {
  let enhanceTool: EnhancedContext7EnhanceToolWithSummarization;
  const mockConfig = {
    context7: { apiKey: 'test' },
    frameworkDetection: { enabled: true },
    cache: { dbPath: './test.db' },
    summarization: { enabled: true }
  };

  beforeEach(() => {
    enhanceTool = new EnhancedContext7EnhanceToolWithSummarization(
      mockConfig,
      'test-openai-key'
    );
  });

  test('should enhance prompt with summarization enabled', async () => {
    const request = {
      prompt: 'Create a React component',
      context: {
        projectContext: {
          repoFacts: Array(20).fill('Long project fact with detailed information'),
          codeSnippets: Array(10).fill('Long code snippet with implementation details'),
          context7Docs: Array(5).fill('Long documentation with best practices')
        }
      },
      options: {
        useSummarization: true,
        useCache: true
      }
    };

    // Mock all service responses
    vi.spyOn(enhanceTool as any, 'gatherProjectContext').mockResolvedValue(request.context.projectContext);
    vi.spyOn(enhanceTool as any, 'detectFrameworks').mockResolvedValue({ detectedFrameworks: ['react'] });
    vi.spyOn(enhanceTool as any, 'analyzeComplexity').mockResolvedValue({ level: 'medium', score: 0.5 });
    vi.spyOn(enhanceTool as any, 'analyzeQualityRequirements').mockResolvedValue({ requirements: [], score: 0.5 });
    vi.spyOn(enhanceTool as any, 'retrieveContext7Documentation').mockResolvedValue([]);
    vi.spyOn(enhanceTool as any, 'extractRelevantCodeSnippets').mockResolvedValue([]);
    vi.spyOn(enhanceTool as any, 'generateTaskBreakdown').mockResolvedValue(null);
    vi.spyOn(enhanceTool as any, 'performAIEnhancement').mockResolvedValue(null);
    vi.spyOn(enhanceTool as any, 'buildEnhancedPrompt').mockResolvedValue('Enhanced: Create a React component');
    vi.spyOn(enhanceTool as any, 'cacheResult').mockResolvedValue(undefined);

    const response = await enhanceTool.enhance(request);

    expect(response.success).toBe(true);
    expect(response.enhanced_prompt).toBe('Enhanced: Create a React component');
    expect(response.frameworks_detected).toEqual(['react']);
    expect(response.summarization).toBeDefined();
  });

  test('should handle summarization disabled', async () => {
    const request = {
      prompt: 'Create a button',
      options: {
        useSummarization: false,
        useCache: true
      }
    };

    vi.spyOn(enhanceTool as any, 'gatherProjectContext').mockResolvedValue({});
    vi.spyOn(enhanceTool as any, 'detectFrameworks').mockResolvedValue({ detectedFrameworks: [] });
    vi.spyOn(enhanceTool as any, 'analyzeComplexity').mockResolvedValue({ level: 'simple', score: 0.3 });
    vi.spyOn(enhanceTool as any, 'analyzeQualityRequirements').mockResolvedValue({ requirements: [], score: 0.5 });
    vi.spyOn(enhanceTool as any, 'retrieveContext7Documentation').mockResolvedValue([]);
    vi.spyOn(enhanceTool as any, 'extractRelevantCodeSnippets').mockResolvedValue([]);
    vi.spyOn(enhanceTool as any, 'generateTaskBreakdown').mockResolvedValue(null);
    vi.spyOn(enhanceTool as any, 'performAIEnhancement').mockResolvedValue(null);
    vi.spyOn(enhanceTool as any, 'buildEnhancedPrompt').mockResolvedValue('Enhanced: Create a button');
    vi.spyOn(enhanceTool as any, 'cacheResult').mockResolvedValue(undefined);

    const response = await enhanceTool.enhance(request);

    expect(response.success).toBe(true);
    expect(response.summarization?.enabled).toBe(false);
  });

  test('should handle errors gracefully', async () => {
    const request = {
      prompt: 'Test prompt',
      options: {
        useSummarization: true,
        useCache: true
      }
    };

    vi.spyOn(enhanceTool as any, 'gatherProjectContext').mockRejectedValue(new Error('Test error'));

    const response = await enhanceTool.enhance(request);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Test error');
  });
});
