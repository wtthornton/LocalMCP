import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { Context7Service } from '../../services/context7/context7.service.js';
import type { PipelineStage, PipelineContext, PipelineError } from '../pipeline-engine.js';

export interface Context7Data {
  query: string;
  library?: string | undefined;
  topic?: string | undefined;
  results: Array<{
    title: string;
    content: string;
    url?: string;
    relevance: number;
    source: 'context7' | 'fallback';
  }>;
  cached: boolean;
  responseTime: number;
  error?: string | undefined;
}

/**
 * Retrieve.Context7 Stage
 * 
 * Retrieves relevant documentation and best practices from Context7
 * based on the current request context and repository facts
 */
export class RetrieveContext7Stage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService,
    private context7: Context7Service
  ) {}

  get name(): string {
    return 'Retrieve.Context7';
  }

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Retrieve.Context7 stage executing', {
      requestId: context.requestId,
      toolName: context.toolName
    });

    try {
      const context7Data = await this.retrieveContext7Data(context);

      this.logger.debug('Retrieve.Context7 stage completed', {
        requestId: context.requestId,
        resultsCount: context7Data.results.length,
        cached: context7Data.cached,
        responseTime: context7Data.responseTime
      });

      return {
        data: {
          context7: context7Data
        },
        metadata: {
          tokensUsed: this.estimateTokens(context7Data),
          chunksUsed: context7Data.results.length,
          context7Cached: context7Data.cached
        }
      };

    } catch (error) {
      this.logger.error('Retrieve.Context7 stage failed', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return fallback data instead of failing completely
      return {
        data: {
          context7: {
            query: this.generateFallbackQuery(context),
            results: this.generateFallbackResults(context),
            cached: false,
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        metadata: {
          tokensUsed: 100,
          chunksUsed: 1,
          context7Cached: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    // Retry on network errors, but not on authentication errors
    return error.error.includes('network') || 
           error.error.includes('timeout') || 
           error.error.includes('ECONNREFUSED');
  }

  getBudgetCost(): Partial<PipelineContext['budget']> {
    return {
      tokens: 500, // Estimated tokens for Context7 results
      chunks: 3
    };
  }

  private async retrieveContext7Data(context: PipelineContext): Promise<Context7Data> {
    const query = this.generateQuery(context);
    const library = this.detectLibrary(context);
    const topic = this.detectTopic(context);

    this.logger.debug('Retrieving Context7 data', {
      requestId: context.requestId,
      query,
      library,
      topic
    });

    const startTime = Date.now();
    
    try {
      const response = await this.context7.query({
        query,
        library,
        topic,
        maxTokens: 5000
      });

      const responseTime = Date.now() - startTime;

      if (response.success && response.data) {
        return {
          query,
          library,
          topic,
          results: this.parseContext7Results(response.data),
          cached: response.cached || false,
          responseTime
        };
      } else {
        // Use fallback if Context7 fails
        return {
          query,
          library,
          topic,
          results: this.generateFallbackResults(context),
          cached: false,
          responseTime,
          error: response.error
        };
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        query,
        library,
        topic,
        results: this.generateFallbackResults(context),
        cached: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateQuery(context: PipelineContext): string {
    const toolName = context.toolName;
    const requestData = context.data;
    const repoFacts = context.data.repoFacts;

    let query = '';

    switch (toolName) {
      case 'localmcp.create':
        query = this.generateCreateQuery(requestData, repoFacts);
        break;
      case 'localmcp.analyze':
        query = this.generateAnalyzeQuery(requestData, repoFacts);
        break;
      case 'localmcp.fix':
        query = this.generateFixQuery(requestData, repoFacts);
        break;
      case 'localmcp.learn':
        query = this.generateLearnQuery(requestData, repoFacts);
        break;
      default:
        query = this.generateGenericQuery(requestData, repoFacts);
    }

    return query;
  }

  private generateCreateQuery(requestData: any, repoFacts: any): string {
    const description = requestData.description || '';
    const framework = repoFacts?.framework || 'unknown';
    const language = repoFacts?.language || 'javascript';

    return `${description} ${framework} ${language} best practices examples`;
  }

  private generateAnalyzeQuery(requestData: any, repoFacts: any): string {
    const query = requestData.query || '';
    const framework = repoFacts?.framework || 'unknown';
    const projectType = repoFacts?.projectType || 'unknown';

    return `${query} ${framework} ${projectType} analysis patterns`;
  }

  private generateFixQuery(requestData: any, repoFacts: any): string {
    const errorDetails = requestData.errorDetails || '';
    const framework = repoFacts?.framework || 'unknown';
    const language = repoFacts?.language || 'javascript';

    return `${errorDetails} ${framework} ${language} error fix solutions`;
  }

  private generateLearnQuery(requestData: any, repoFacts: any): string {
    const feedback = requestData.feedback || '';
    const context = requestData.context || '';
    const framework = repoFacts?.framework || 'unknown';

    return `${feedback} ${context} ${framework} patterns lessons learned`;
  }

  private generateGenericQuery(requestData: any, repoFacts: any): string {
    const framework = repoFacts?.framework || 'unknown';
    const language = repoFacts?.language || 'javascript';
    const projectType = repoFacts?.projectType || 'unknown';

    return `${framework} ${language} ${projectType} development guide`;
  }

  private detectLibrary(context: PipelineContext): string | undefined {
    const repoFacts = context.data.repoFacts;
    const framework = repoFacts?.framework;

    if (!framework || framework === 'unknown') return undefined;

    // Map framework names to Context7 library names
    const libraryMap: Record<string, string> = {
      'React': 'react',
      'Next.js': 'nextjs',
      'Vue.js': 'vue',
      'Nuxt.js': 'nuxt',
      'Angular': 'angular',
      'Svelte': 'svelte',
      'Express': 'express',
      'Koa': 'koa',
      'Fastify': 'fastify'
    };

    return libraryMap[framework];
  }

  private detectTopic(context: PipelineContext): string | undefined {
    const toolName = context.toolName;
    const requestData = context.data;

    switch (toolName) {
      case 'localmcp.create':
        return 'components';
      case 'localmcp.analyze':
        return 'analysis';
      case 'localmcp.fix':
        return 'debugging';
      case 'localmcp.learn':
        return 'patterns';
      default:
        return undefined;
    }
  }

  private parseContext7Results(data: any): Array<{
    title: string;
    content: string;
    url?: string;
    relevance: number;
    source: 'context7' | 'fallback';
  }> {
    if (!data || !data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: any, index: number) => ({
      title: result.title || result.name || `Result ${index + 1}`,
      content: result.content || result.description || result.text || '',
      url: result.url || result.link,
      relevance: result.relevance || result.score || (1 - index * 0.1),
      source: 'context7' as const
    }));
  }

  private generateFallbackQuery(context: PipelineContext): string {
    return this.generateQuery(context);
  }

  private generateFallbackResults(context: PipelineContext): Array<{
    title: string;
    content: string;
    url?: string;
    relevance: number;
    source: 'context7' | 'fallback';
  }> {
    const toolName = context.toolName;
    const repoFacts = context.data.repoFacts;
    const framework = repoFacts?.framework || 'unknown';

    const fallbackResults = [];

    switch (toolName) {
      case 'localmcp.create':
        fallbackResults.push({
          title: `${framework} Component Creation`,
          content: `Best practices for creating ${framework} components. Focus on component composition, props validation, and state management.`,
          relevance: 0.9,
          source: 'fallback' as const
        });
        break;

      case 'localmcp.analyze':
        fallbackResults.push({
          title: `${framework} Project Analysis`,
          content: `Guidelines for analyzing ${framework} projects. Look for code quality, architecture patterns, and potential improvements.`,
          relevance: 0.9,
          source: 'fallback' as const
        });
        break;

      case 'localmcp.fix':
        fallbackResults.push({
          title: `${framework} Error Debugging`,
          content: `Common debugging techniques for ${framework} applications. Check console errors, network requests, and component state.`,
          relevance: 0.9,
          source: 'fallback' as const
        });
        break;

      case 'localmcp.learn':
        fallbackResults.push({
          title: `${framework} Pattern Learning`,
          content: `Effective patterns for ${framework} development. Focus on reusable components, custom hooks, and state management.`,
          relevance: 0.9,
          source: 'fallback' as const
        });
        break;

      default:
        fallbackResults.push({
          title: `${framework} Development Guide`,
          content: `General development guidelines for ${framework} applications.`,
          relevance: 0.8,
          source: 'fallback' as const
        });
    }

    return fallbackResults;
  }

  private estimateTokens(context7Data: Context7Data): number {
    const content = context7Data.results.map(r => r.content).join(' ');
    return Math.ceil(content.length / 4); // Rough estimation: 1 token ≈ 4 characters
  }
}
