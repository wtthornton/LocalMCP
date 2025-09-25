/**
 * Unit tests for SimpleSummarizationService
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SimpleSummarizationService } from '../../../src/services/ai/simple-summarization.service.js';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked summary' } }]
          })
        }
      }
    }))
  };
});

describe('SimpleSummarizationService', () => {
  let service: SimpleSummarizationService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    service = new SimpleSummarizationService(mockApiKey);
  });

  test('should initialize with API key', () => {
    expect(service).toBeDefined();
  });

  test('should not summarize small context', async () => {
    const smallContext = {
      repo_facts: ['Small fact'],
      code_snippets: ['Small snippet'],
      context7_docs: ['Small doc']
    };

    const result = await service.summarizeContext(smallContext);
    
    expect(result.originalTokenCount).toBeLessThan(500);
    expect(result.summarizedTokenCount).toBe(result.originalTokenCount);
    expect(result.repoFacts).toEqual(smallContext.repo_facts);
  });

  test('should summarize large context', async () => {
    const largeContext = {
      repo_facts: Array(20).fill('This is a long project fact that contains detailed information about the project structure and configuration'),
      code_snippets: Array(10).fill('const example = "This is a long code snippet with detailed implementation"'),
      context7_docs: Array(5).fill('This is detailed documentation about framework usage and best practices')
    };

    const result = await service.summarizeContext(largeContext);
    
    expect(result.originalTokenCount).toBeGreaterThan(500);
    expect(result.summarizedTokenCount).toBeLessThan(result.originalTokenCount);
    expect(result.repoFacts.length).toBeLessThan(largeContext.repo_facts.length);
  });

  test('should handle empty context', async () => {
    const emptyContext = {
      repo_facts: [],
      code_snippets: [],
      context7_docs: []
    };

    const result = await service.summarizeContext(emptyContext);
    
    expect(result.repoFacts).toEqual([]);
    expect(result.context7Docs).toEqual([]);
    expect(result.codeSnippets).toEqual([]);
  });

  test('should handle API errors gracefully', async () => {
    // Mock API error
    const mockOpenAI = await import('openai');
    const mockClient = new mockOpenAI.default({ apiKey: 'test' });
    mockClient.chat.completions.create = vi.fn().mockRejectedValue(new Error('API Error'));

    const largeContext = {
      repo_facts: Array(20).fill('Long fact'),
      code_snippets: [],
      context7_docs: []
    };

    const result = await service.summarizeContext(largeContext);
    
    // Should return original context on error
    expect(result.repoFacts).toEqual(largeContext.repo_facts);
  });
});
