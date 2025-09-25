/**
 * Performance tests for AI summarization
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SimpleSummarizationService } from '../../src/services/ai/simple-summarization.service.js';

// Mock OpenAI with realistic response times
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockImplementation(async () => {
            // Simulate API response time
            await new Promise(resolve => setTimeout(resolve, 100));
            return {
              choices: [{ message: { content: 'Summarized content' } }]
            };
          })
        }
      }
    }))
  };
});

describe('Summarization Performance', () => {
  let service: SimpleSummarizationService;

  beforeEach(() => {
    service = new SimpleSummarizationService('test-api-key');
  });

  test('should achieve target token reduction', async () => {
    const largeContext = {
      repo_facts: Array(50).fill('This is a very long project fact that contains detailed information about the project structure, configuration, dependencies, and various technical aspects that would normally consume many tokens in the cache'),
      code_snippets: Array(30).fill('const example = "This is a very long code snippet with detailed implementation, multiple functions, complex logic, and extensive comments that would normally consume many tokens"'),
      context7_docs: Array(20).fill('This is very detailed documentation about framework usage, best practices, implementation patterns, and comprehensive guidance that would normally consume many tokens')
    };

    const startTime = Date.now();
    const result = await service.summarizeContext(largeContext);
    const processingTime = Date.now() - startTime;

    // Should achieve at least 60% token reduction
    const tokenReduction = (result.originalTokenCount - result.summarizedTokenCount) / result.originalTokenCount;
    expect(tokenReduction).toBeGreaterThan(0.6);

    // Should process within reasonable time (5 seconds)
    expect(processingTime).toBeLessThan(5000);

    // Should have fewer items in summarized arrays
    expect(result.repoFacts.length).toBeLessThan(largeContext.repo_facts.length);
    expect(result.codeSnippets.length).toBeLessThan(largeContext.code_snippets.length);
    expect(result.context7Docs.length).toBeLessThan(largeContext.context7_docs.length);
  });

  test('should handle concurrent requests', async () => {
    const contexts = Array(5).fill(null).map(() => ({
      repo_facts: Array(20).fill('Long project fact'),
      code_snippets: Array(10).fill('Long code snippet'),
      context7_docs: Array(5).fill('Long documentation')
    }));

    const startTime = Date.now();
    const promises = contexts.map(context => service.summarizeContext(context));
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    // All requests should complete
    expect(results).toHaveLength(5);
    expect(results.every(r => r.success !== false)).toBe(true);

    // Should complete within reasonable time (10 seconds for 5 concurrent)
    expect(totalTime).toBeLessThan(10000);
  });

  test('should not process small contexts', async () => {
    const smallContext = {
      repo_facts: ['Small fact'],
      code_snippets: ['Small snippet'],
      context7_docs: ['Small doc']
    };

    const result = await service.summarizeContext(smallContext);

    // Should not summarize small contexts
    expect(result.originalTokenCount).toBeLessThan(500);
    expect(result.summarizedTokenCount).toBe(result.originalTokenCount);
    expect(result.repoFacts).toEqual(smallContext.repo_facts);
  });

  test('should maintain quality with token reduction', async () => {
    const context = {
      repo_facts: [
        'Project uses React framework',
        'Project uses TypeScript for type safety',
        'Project uses Next.js for SSR',
        'Project uses Tailwind CSS for styling'
      ],
      code_snippets: [
        'const Component = () => { return <div>Hello</div>; };',
        'interface Props { title: string; }'
      ],
      context7_docs: [
        'React documentation: Use functional components with hooks',
        'TypeScript documentation: Define interfaces for type safety'
      ]
    };

    const result = await service.summarizeContext(context);

    // Should preserve key technical terms
    const summarizedText = [
      ...result.repoFacts,
      ...result.codeSnippets,
      ...result.context7Docs
    ].join(' ').toLowerCase();

    expect(summarizedText).toContain('react');
    expect(summarizedText).toContain('typescript');
    expect(summarizedText).toContain('component');
  });
});
