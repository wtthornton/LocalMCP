/**
 * Simple AI Summarization Service
 * 
 * A lightweight service that uses OpenAI to summarize high-token sections
 * of the context to reduce cache storage and improve performance.
 */

import OpenAI from 'openai';
import { Logger } from '../logger/logger.js';
import { TemperatureConfigService } from './temperature-config.service.js';

export interface SummarizedContext {
  repoFacts: string[];
  context7Docs: string[];
  codeSnippets: string[];
  originalTokenCount: number;
  summarizedTokenCount: number;
}

export class SimpleSummarizationService {
  private client: OpenAI;
  private logger: Logger;
  private temperatureConfig: TemperatureConfigService;

  constructor(apiKey: string, logger?: Logger) {
    this.logger = logger || new Logger('SimpleSummarizationService');
    this.temperatureConfig = new TemperatureConfigService();
    
    try {
      this.client = new OpenAI({ apiKey });
      this.logger.info('Simple summarization service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize summarization service', { error });
      throw error;
    }
  }

  /**
   * Summarize context sections to reduce token usage
   */
  async summarizeContext(context: {
    repo_facts: string[];
    code_snippets: string[];
    context7_docs: string[];
  }): Promise<SummarizedContext> {
    try {
      const originalTokenCount = this.estimateTokens(context);
      
      // Only summarize if we have enough content to make it worthwhile
      if (originalTokenCount < 500) {
        return {
          repoFacts: context.repo_facts,
          context7Docs: context.context7_docs,
          codeSnippets: context.code_snippets,
          originalTokenCount,
          summarizedTokenCount: originalTokenCount
        };
      }

      const [summarizedRepoFacts, summarizedContext7Docs, summarizedCodeSnippets] = await Promise.all([
        this.summarizeRepoFacts(context.repo_facts),
        this.summarizeContext7Docs(context.context7_docs),
        this.summarizeCodeSnippets(context.code_snippets)
      ]);

      const summarizedTokenCount = this.estimateTokens({
        repo_facts: summarizedRepoFacts,
        context7_docs: summarizedContext7Docs,
        code_snippets: summarizedCodeSnippets
      });

      this.logger.info('Context summarized', {
        originalTokens: originalTokenCount,
        summarizedTokens: summarizedTokenCount,
        reduction: `${Math.round((1 - summarizedTokenCount / originalTokenCount) * 100)}%`
      });

      return {
        repoFacts: summarizedRepoFacts,
        context7Docs: summarizedContext7Docs,
        codeSnippets: summarizedCodeSnippets,
        originalTokenCount,
        summarizedTokenCount
      };
    } catch (error) {
      this.logger.error('Summarization failed, using original context', { error });
      return {
        repoFacts: context.repo_facts,
        context7Docs: context.context7_docs,
        codeSnippets: context.code_snippets,
        originalTokenCount: this.estimateTokens(context),
        summarizedTokenCount: this.estimateTokens(context)
      };
    }
  }

  /**
   * Summarize repository facts into categories
   */
  private async summarizeRepoFacts(facts: string[]): Promise<string[]> {
    if (facts.length === 0) return [];

    const prompt = `Summarize these project facts into 3-4 concise categories:
- PROJECT: name and description
- TECH_STACK: frameworks and tools
- ARCHITECTURE: patterns and structure
- QUALITY: testing and best practices

Facts: ${facts.join('\n')}

Return only the categorized summaries, one per line.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: this.temperatureConfig.getTemperature('summarization')
      });

      return response.choices[0]?.message?.content?.split('\n').filter(line => line.trim()) || facts;
    } catch (error) {
      this.logger.warn('Repo facts summarization failed', { error });
      return facts;
    }
  }

  /**
   * Consolidate Context7 documentation
   */
  private async summarizeContext7Docs(docs: string[]): Promise<string[]> {
    if (docs.length === 0) return [];

    const prompt = `Consolidate these framework docs into a single guidance paragraph:
Focus on integration patterns and key best practices.

Docs: ${docs.join('\n')}

Return only the consolidated guidance.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: this.temperatureConfig.getTemperature('summarization')
      });

      return [response.choices[0]?.message?.content?.trim() || docs.join(' ')];
    } catch (error) {
      this.logger.warn('Context7 docs summarization failed', { error });
      return docs;
    }
  }

  /**
   * Extract patterns from code snippets
   */
  private async summarizeCodeSnippets(snippets: string[]): Promise<string[]> {
    if (snippets.length === 0) return [];

    const prompt = `Extract key patterns from these code snippets:
Focus on architectural patterns and reusable concepts.

Code: ${snippets.join('\n')}

Return only the pattern summary.`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: this.temperatureConfig.getTemperature('summarization')
      });

      return [response.choices[0]?.message?.content?.trim() || snippets.join(' ')];
    } catch (error) {
      this.logger.warn('Code snippets summarization failed', { error });
      return snippets;
    }
  }

  /**
   * Estimate token count (rough)
   */
  private estimateTokens(context: any): number {
    const text = JSON.stringify(context);
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 chars
  }
}
