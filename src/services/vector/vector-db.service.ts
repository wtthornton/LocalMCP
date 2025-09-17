import { QdrantClient } from '@qdrant/js-client-rest';
import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    type: 'document' | 'lesson' | 'pattern';
    source: string;
    title?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    confidence?: number;
    category?: string;
    framework?: string;
  };
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: VectorDocument['metadata'];
}

export interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
  filter?: Record<string, any>;
}

/**
 * VectorDatabaseService - Manages vector embeddings and semantic search
 * 
 * Provides RAG capabilities for LocalMCP by storing and retrieving:
 * - Project documentation (docs/, adr/, design/)
 * - Lessons learned from past fixes
 * - Coding patterns and best practices
 * 
 * Uses Qdrant for vector storage and similarity search.
 */
export class VectorDatabaseService {
  private client: QdrantClient;
  private collections: {
    documents: string;
    lessons: string;
    patterns: string;
  };
  private isConnected: boolean = false;

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {
    const vectorConfig = this.config.getNested('vector', 'qdrant');
    this.client = new QdrantClient({
      url: vectorConfig.url,
      ...(vectorConfig.apiKey && { apiKey: vectorConfig.apiKey })
    });

    this.collections = {
      documents: vectorConfig.collections.documents,
      lessons: vectorConfig.collections.lessons,
      patterns: vectorConfig.collections.patterns
    };
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing vector database service...');
      
      // Test connection
      await this.client.getCollections();
      this.isConnected = true;
      
      // Ensure collections exist
      await this.ensureCollections();
      
      this.logger.info('Vector database service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize vector database:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async ensureCollections(): Promise<void> {
    const collections = await this.client.getCollections();
    const existingCollections = collections.collections.map(c => c.name);

    // Create documents collection
    if (!existingCollections.includes(this.collections.documents)) {
      await this.client.createCollection(this.collections.documents, {
        vectors: { size: 384, distance: 'Cosine' } // Using sentence-transformers/all-MiniLM-L6-v2
      });
      this.logger.info(`Created collection: ${this.collections.documents}`);
    }

    // Create lessons collection
    if (!existingCollections.includes(this.collections.lessons)) {
      await this.client.createCollection(this.collections.lessons, {
        vectors: { size: 384, distance: 'Cosine' }
      });
      this.logger.info(`Created collection: ${this.collections.lessons}`);
    }

    // Create patterns collection
    if (!existingCollections.includes(this.collections.patterns)) {
      await this.client.createCollection(this.collections.patterns, {
        vectors: { size: 384, distance: 'Cosine' }
      });
      this.logger.info(`Created collection: ${this.collections.patterns}`);
    }
  }

  async storeDocument(document: VectorDocument): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Vector database not connected');
    }

    try {
      const collection = this.getCollectionForType(document.metadata.type);
      
      await this.client.upsert(collection, {
        points: [{
          id: document.id,
          vector: document.embedding || [],
          payload: {
            content: document.content,
            ...document.metadata
          }
        }]
      });

      this.logger.debug(`Stored document: ${document.id} in ${collection}`);
    } catch (error) {
      this.logger.error('Failed to store document:', error);
      throw error;
    }
  }

  async searchDocuments(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.searchCollection(this.collections.documents, query, options);
  }

  async searchLessons(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.searchCollection(this.collections.lessons, query, options);
  }

  async searchPatterns(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.searchCollection(this.collections.patterns, query, options);
  }

  private async searchCollection(
    collection: string,
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Vector database not connected');
    }

    try {
      // For now, we'll use a simple text search until we implement embeddings
      // TODO: Implement proper embedding generation
      const results = await this.client.scroll(collection, {
        limit: options.limit || 10,
        with_payload: true,
        with_vector: false
      });

      return results.points.map(point => ({
        id: point.id as string,
        score: 0.8, // Placeholder score
        content: point.payload?.content as string || '',
        metadata: {
          type: (point.payload?.type as 'document' | 'lesson' | 'pattern') || 'document',
          source: point.payload?.source as string || '',
          title: point.payload?.title as string,
          tags: point.payload?.tags as string[] || [],
          createdAt: point.payload?.createdAt as string || '',
          updatedAt: point.payload?.updatedAt as string || ''
        }
      }));
    } catch (error) {
      this.logger.error(`Failed to search collection ${collection}:`, error);
      throw error;
    }
  }

  private getCollectionForType(type: VectorDocument['metadata']['type']): string {
    switch (type) {
      case 'document':
        return this.collections.documents;
      case 'lesson':
        return this.collections.lessons;
      case 'pattern':
        return this.collections.patterns;
      default:
        return this.collections.documents;
    }
  }

  async deleteDocument(id: string, type: VectorDocument['metadata']['type']): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Vector database not connected');
    }

    try {
      const collection = this.getCollectionForType(type);
      await this.client.delete(collection, {
        points: [id]
      });

      this.logger.debug(`Deleted document: ${id} from ${collection}`);
    } catch (error) {
      this.logger.error('Failed to delete document:', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<Record<string, number>> {
    if (!this.isConnected) {
      throw new Error('Vector database not connected');
    }

    try {
      const stats: Record<string, number> = {};
      
      for (const [name, collection] of Object.entries(this.collections)) {
        const info = await this.client.getCollection(collection);
        stats[name] = info.points_count || 0;
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get collection stats:', error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
