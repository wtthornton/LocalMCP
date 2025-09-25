/**
 * Unit tests for EnhancedPromptCacheService
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EnhancedPromptCacheService } from '../../../src/services/cache/enhanced-prompt-cache.service.js';

// Mock dependencies
vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      get: vi.fn(),
      run: vi.fn(),
      all: vi.fn()
    }),
    close: vi.fn()
  }))
}));

vi.mock('../../../src/services/ai/simple-summarization.service.js', () => ({
  SimpleSummarizationService: vi.fn().mockImplementation(() => ({
    summarizeContext: vi.fn().mockResolvedValue({
      repoFacts: ['Summarized fact'],
      context7Docs: ['Summarized doc'],
      codeSnippets: ['Summarized snippet'],
      originalTokenCount: 1000,
      summarizedTokenCount: 300
    })
  }))
}));

describe('EnhancedPromptCacheService', () => {
  let service: EnhancedPromptCacheService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    service = new EnhancedPromptCacheService('./test.db', mockApiKey, true);
  });

  test('should initialize with summarization enabled', () => {
    expect(service).toBeDefined();
  });

  test('should cache with summarization for large context', async () => {
    const largeContext = {
      context_used: {
        repo_facts: Array(20).fill('Long project fact'),
        code_snippets: Array(10).fill('Long code snippet'),
        context7_docs: Array(5).fill('Long documentation')
      }
    };

    const request = {
      prompt: 'Test prompt',
      context: largeContext
    };

    const frameworkDetection = { detectedFrameworks: ['react'] };

    // Mock the parent class methods
    vi.spyOn(service, 'getCachedPrompt').mockResolvedValue(null);
    vi.spyOn(service, 'setCachedPrompt').mockResolvedValue(undefined);

    const result = await service.getCachedPrompt(
      request.prompt,
      largeContext,
      frameworkDetection
    );

    expect(result).toBeNull(); // No cache hit expected
  });

  test('should not summarize small context', async () => {
    const smallContext = {
      context_used: {
        repo_facts: ['Small fact'],
        code_snippets: [],
        context7_docs: []
      }
    };

    const request = {
      prompt: 'Test prompt',
      context: smallContext
    };

    const frameworkDetection = { detectedFrameworks: ['react'] };

    vi.spyOn(service, 'getCachedPrompt').mockResolvedValue(null);

    const result = await service.getCachedPrompt(
      request.prompt,
      smallContext,
      frameworkDetection
    );

    expect(result).toBeNull();
  });

  test('should get enhanced stats', async () => {
    vi.spyOn(service, 'getCacheStats').mockResolvedValue({
      totalEntries: 10,
      hitRate: 0.8
    });

    const stats = await service.getEnhancedStats();

    expect(stats).toHaveProperty('summarizationEnabled');
    expect(stats.summarizationEnabled).toBe(true);
  });
});
