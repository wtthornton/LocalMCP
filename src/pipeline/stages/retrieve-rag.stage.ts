import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { VectorDatabaseService } from '../../services/vector/vector-db.service.js';
import { RAGIngestionService } from '../../services/rag/rag-ingestion.service.js';
import type { PipelineStage, PipelineContext, PipelineError } from '../pipeline-engine.js';

export interface RAGData {
  query: string;
  results: Array<{
    content: string;
    metadata: {
      source: string;
      title?: string;
      type: 'document' | 'adr' | 'design' | 'lesson' | 'pattern';
      relevance: number;
      tags: string[];
    };
    similarity: number;
  }>;
  totalResults: number;
  searchTime: number;
  error?: string;
}

/**
 * Retrieve.RAG Stage
 * 
 * Retrieves relevant project-specific context from the vector database
 * using semantic search based on the current request
 */
export class RetrieveRAGStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService,
    private vectorDb: VectorDatabaseService,
    private ragIngestion: RAGIngestionService
  ) {}

  get name(): string {
    return 'Retrieve.RAG';
  }

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Retrieve.RAG stage executing', {
      requestId: context.requestId,
      toolName: context.toolName
    });

    try {
      const ragData = await this.retrieveRAGData(context);

      this.logger.debug('Retrieve.RAG stage completed', {
        requestId: context.requestId,
        resultsCount: ragData.results.length,
        searchTime: ragData.searchTime
      });

      return {
        data: {
          rag: ragData
        },
        metadata: {
          tokensUsed: this.estimateTokens(ragData),
          chunksUsed: ragData.results.length,
          ragSearchTime: ragData.searchTime
        }
      };

    } catch (error) {
      this.logger.error('Retrieve.RAG stage failed', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty results instead of failing completely
      return {
        data: {
          rag: {
            query: this.generateFallbackQuery(context),
            results: [],
            totalResults: 0,
            searchTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        metadata: {
          tokensUsed: 50,
          chunksUsed: 0,
          ragSearchTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    // Retry on vector database connection errors
    return error.error.includes('connection') || 
           error.error.includes('timeout') || 
           error.error.includes('ECONNREFUSED');
  }

  getBudgetCost(): Partial<PipelineContext['budget']> {
    return {
      tokens: 300, // Estimated tokens for RAG results
      chunks: 5
    };
  }

  private async retrieveRAGData(context: PipelineContext): Promise<RAGData> {
    const query = this.generateQuery(context);
    const startTime = Date.now();

    this.logger.debug('Retrieving RAG data', {
      requestId: context.requestId,
      query
    });

    try {
      // Search documents collection
      const documentResults = await this.vectorDb.searchDocuments(
        query,
        { limit: 3, scoreThreshold: 0.7 }
      );

      // Search lessons collection
      const lessonResults = await this.vectorDb.searchLessons(
        query,
        { limit: 2, scoreThreshold: 0.6 }
      );

      // Search patterns collection
      const patternResults = await this.vectorDb.searchPatterns(
        query,
        { limit: 2, scoreThreshold: 0.6 }
      );

      const searchTime = Date.now() - startTime;

      // Combine and process results
      const allResults = [
        ...this.processVectorResults(documentResults, 'document'),
        ...this.processVectorResults(lessonResults, 'lesson'),
        ...this.processVectorResults(patternResults, 'pattern')
      ];

      // Sort by similarity score
      allResults.sort((a, b) => b.similarity - a.similarity);

      // Limit results based on budget
      const maxResults = Math.min(allResults.length, context.budget.chunks);
      const limitedResults = allResults.slice(0, maxResults);

      return {
        query,
        results: limitedResults,
        totalResults: allResults.length,
        searchTime
      };

    } catch (error) {
      const searchTime = Date.now() - startTime;
      
      this.logger.warn('RAG search failed, using fallback', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        query,
        results: this.generateFallbackResults(context),
        totalResults: 0,
        searchTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateQuery(context: PipelineContext): string {
    const toolName = context.toolName;
    const requestData = context.data;
    const repoFacts = context.data.repoFacts;
    const agentsMD = context.data.agentsMD;

    let query = '';

    switch (toolName) {
      case 'localmcp.create':
        query = this.generateCreateQuery(requestData, repoFacts, agentsMD);
        break;
      case 'localmcp.analyze':
        query = this.generateAnalyzeQuery(requestData, repoFacts, agentsMD);
        break;
      case 'localmcp.fix':
        query = this.generateFixQuery(requestData, repoFacts, agentsMD);
        break;
      case 'localmcp.learn':
        query = this.generateLearnQuery(requestData, repoFacts, agentsMD);
        break;
      default:
        query = this.generateGenericQuery(requestData, repoFacts, agentsMD);
    }

    return query;
  }

  private generateCreateQuery(requestData: any, repoFacts: any, agentsMD: any): string {
    const description = requestData.description || '';
    const framework = repoFacts?.framework || 'unknown';
    const projectType = repoFacts?.projectType || 'unknown';
    const guidelines = agentsMD?.guidelines || [];

    let query = `${description} ${framework} ${projectType}`;
    
    // Add relevant guidelines
    const relevantGuidelines = guidelines
      .filter((g: any) => g.type === 'guideline' || g.type === 'pattern')
      .slice(0, 3)
      .map((g: any) => g.text)
      .join(' ');

    if (relevantGuidelines) {
      query += ` ${relevantGuidelines}`;
    }

    return query;
  }

  private generateAnalyzeQuery(requestData: any, repoFacts: any, agentsMD: any): string {
    const query = requestData.query || '';
    const path = requestData.path || '';
    const framework = repoFacts?.framework || 'unknown';
    const projectType = repoFacts?.projectType || 'unknown';

    return `${query} ${path} ${framework} ${projectType} analysis patterns`;
  }

  private generateFixQuery(requestData: any, repoFacts: any, agentsMD: any): string {
    const errorDetails = requestData.errorDetails || '';
    const filePath = requestData.filePath || '';
    const framework = repoFacts?.framework || 'unknown';
    const language = repoFacts?.language || 'javascript';

    return `${errorDetails} ${filePath} ${framework} ${language} error fix solutions`;
  }

  private generateLearnQuery(requestData: any, repoFacts: any, agentsMD: any): string {
    const feedback = requestData.feedback || '';
    const context = requestData.context || '';
    const tags = requestData.tags || [];
    const framework = repoFacts?.framework || 'unknown';

    return `${feedback} ${context} ${tags.join(' ')} ${framework} patterns lessons`;
  }

  private generateGenericQuery(requestData: any, repoFacts: any, agentsMD: any): string {
    const framework = repoFacts?.framework || 'unknown';
    const language = repoFacts?.language || 'javascript';
    const projectType = repoFacts?.projectType || 'unknown';

    return `${framework} ${language} ${projectType} development patterns`;
  }

  private processVectorResults(results: any[], type: 'document' | 'lesson' | 'pattern'): Array<{
    content: string;
    metadata: {
      source: string;
      title?: string;
      type: 'document' | 'adr' | 'design' | 'lesson' | 'pattern';
      relevance: number;
      tags: string[];
    };
    similarity: number;
  }> {
    return results.map(result => ({
      content: result.content || '',
      metadata: {
        source: result.metadata?.source || 'unknown',
        title: result.metadata?.title,
        type: this.mapResultType(type, result.metadata?.type),
        relevance: result.metadata?.relevance || 0.5,
        tags: result.metadata?.tags || []
      },
      similarity: result.score || 0
    }));
  }

  private mapResultType(collectionType: 'document' | 'lesson' | 'pattern', payloadType?: string): 'document' | 'adr' | 'design' | 'lesson' | 'pattern' {
    if (collectionType === 'lesson') return 'lesson';
    if (collectionType === 'pattern') return 'pattern';
    
    // For documents, try to determine the specific type
    if (payloadType) {
      if (payloadType.includes('adr')) return 'adr';
      if (payloadType.includes('design')) return 'design';
    }
    
    return 'document';
  }

  private generateFallbackQuery(context: PipelineContext): string {
    return this.generateQuery(context);
  }

  private generateFallbackResults(context: PipelineContext): Array<{
    content: string;
    metadata: {
      source: string;
      title?: string;
      type: 'document' | 'adr' | 'design' | 'lesson' | 'pattern';
      relevance: number;
      tags: string[];
    };
    similarity: number;
  }> {
    const toolName = context.toolName;
    const repoFacts = context.data.repoFacts;
    const framework = repoFacts?.framework || 'unknown';

    const fallbackResults = [];

    switch (toolName) {
      case 'localmcp.create':
        fallbackResults.push({
          content: `Best practices for creating ${framework} components. Focus on component composition, props validation, and state management.`,
          metadata: {
            source: 'fallback',
            title: `${framework} Component Creation`,
            type: 'pattern' as const,
            relevance: 0.8,
            tags: ['component', 'creation', framework]
          },
          similarity: 0.8
        });
        break;

      case 'localmcp.analyze':
        fallbackResults.push({
          content: `Guidelines for analyzing ${framework} projects. Look for code quality, architecture patterns, and potential improvements.`,
          metadata: {
            source: 'fallback',
            title: `${framework} Project Analysis`,
            type: 'pattern' as const,
            relevance: 0.8,
            tags: ['analysis', 'patterns', framework]
          },
          similarity: 0.8
        });
        break;

      case 'localmcp.fix':
        fallbackResults.push({
          content: `Common debugging techniques for ${framework} applications. Check console errors, network requests, and component state.`,
          metadata: {
            source: 'fallback',
            title: `${framework} Error Debugging`,
            type: 'pattern' as const,
            relevance: 0.8,
            tags: ['debugging', 'errors', framework]
          },
          similarity: 0.8
        });
        break;

      case 'localmcp.learn':
        fallbackResults.push({
          content: `Effective patterns for ${framework} development. Focus on reusable components, custom hooks, and state management.`,
          metadata: {
            source: 'fallback',
            title: `${framework} Pattern Learning`,
            type: 'lesson' as const,
            relevance: 0.8,
            tags: ['patterns', 'learning', framework]
          },
          similarity: 0.8
        });
        break;

      default:
        fallbackResults.push({
          content: `General development guidelines for ${framework} applications.`,
          metadata: {
            source: 'fallback',
            title: `${framework} Development Guide`,
            type: 'document' as const,
            relevance: 0.7,
            tags: ['development', 'guidelines', framework]
          },
          similarity: 0.7
        });
    }

    return fallbackResults;
  }

  private estimateTokens(ragData: RAGData): number {
    const content = ragData.results.map(r => r.content).join(' ');
    return Math.ceil(content.length / 4); // Rough estimation: 1 token ≈ 4 characters
  }
}
