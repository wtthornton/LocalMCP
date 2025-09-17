import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { VectorDatabaseService, type VectorDocument } from '../vector/vector-db.service.js';

export interface DocumentMetadata {
  title: string;
  source: string;
  type: 'document' | 'adr' | 'design' | 'readme';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * RAGIngestionService - Ingests project documentation for RAG
 * 
 * Scans project directories for documentation files and ingests them into
 * the vector database for semantic search and context retrieval.
 * 
 * Supported file types:
 * - .md (Markdown)
 * - .txt (Text)
 * - .json (JSON documentation)
 * - .yaml/.yml (YAML documentation)
 */
export class RAGIngestionService {
  private supportedExtensions = ['.md', '.txt', '.json', '.yaml', '.yml'];
  private targetDirectories = ['docs', 'adr', 'design', 'imp'];

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private vectorDb: VectorDatabaseService
  ) {}

  async ingestProjectDocumentation(projectPath: string): Promise<{
    processed: number;
    errors: number;
    documents: VectorDocument[];
  }> {
    this.logger.info(`Starting RAG ingestion for project: ${projectPath}`);
    
    const results = {
      processed: 0,
      errors: 0,
      documents: [] as VectorDocument[]
    };

    try {
      for (const dir of this.targetDirectories) {
        const dirPath = join(projectPath, dir);
        const dirResults = await this.ingestDirectory(dirPath, dir);
        
        results.processed += dirResults.processed;
        results.errors += dirResults.errors;
        results.documents.push(...dirResults.documents);
      }

      // Store all documents in vector database
      for (const doc of results.documents) {
        try {
          await this.vectorDb.storeDocument(doc);
        } catch (error) {
          this.logger.error(`Failed to store document ${doc.id}:`, error);
          results.errors++;
        }
      }

      this.logger.info(`RAG ingestion completed: ${results.processed} processed, ${results.errors} errors`);
      return results;
    } catch (error) {
      this.logger.error('RAG ingestion failed:', error);
      throw error;
    }
  }

  private async ingestDirectory(
    dirPath: string,
    dirType: string
  ): Promise<{
    processed: number;
    errors: number;
    documents: VectorDocument[];
  }> {
    const results = {
      processed: 0,
      errors: 0,
      documents: [] as VectorDocument[]
    };

    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively process subdirectories
          const subResults = await this.ingestDirectory(fullPath, dirType);
          results.processed += subResults.processed;
          results.errors += subResults.errors;
          results.documents.push(...subResults.documents);
        } else if (entry.isFile() && this.isSupportedFile(entry.name)) {
          try {
            const document = await this.processFile(fullPath, dirType);
            if (document) {
              results.documents.push(document);
              results.processed++;
            }
          } catch (error) {
            this.logger.error(`Failed to process file ${fullPath}:`, error);
            results.errors++;
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read - this is okay
      this.logger.debug(`Directory ${dirPath} not found or not readable`);
    }

    return results;
  }

  private isSupportedFile(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  private async processFile(
    filePath: string,
    dirType: string
  ): Promise<VectorDocument | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const stats = await stat(filePath);
      
      const metadata = this.extractMetadata(filePath, dirType, stats);
      const processedContent = this.preprocessContent(content, filePath);
      
      if (!processedContent.trim()) {
        this.logger.debug(`Skipping empty file: ${filePath}`);
        return null;
      }

      return {
        id: this.generateDocumentId(filePath),
        content: processedContent,
        metadata: {
          type: 'document',
          source: filePath,
          title: metadata.title,
          tags: metadata.tags,
          createdAt: metadata.createdAt,
          updatedAt: metadata.updatedAt
        }
      };
    } catch (error) {
      this.logger.error(`Failed to process file ${filePath}:`, error);
      return null;
    }
  }

  private extractMetadata(
    filePath: string,
    dirType: string,
    stats: any
  ): DocumentMetadata {
    const filename = basename(filePath, extname(filePath));
    const title = this.extractTitleFromFilename(filename);
    
    const tags = this.generateTags(filePath, dirType);
    
    return {
      title,
      source: filePath,
      type: this.getDocumentType(dirType),
      tags,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString()
    };
  }

  private extractTitleFromFilename(filename: string): string {
    // Convert kebab-case, snake_case to Title Case
    return filename
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private getDocumentType(dirType: string): DocumentMetadata['type'] {
    switch (dirType) {
      case 'adr':
        return 'adr';
      case 'design':
        return 'design';
      case 'docs':
        return 'document';
      default:
        return 'document';
    }
  }

  private generateTags(filePath: string, dirType: string): string[] {
    const tags = [dirType];
    
    // Add tags based on file path
    if (filePath.includes('architecture')) tags.push('architecture');
    if (filePath.includes('api')) tags.push('api');
    if (filePath.includes('design')) tags.push('design');
    if (filePath.includes('adr')) tags.push('adr');
    if (filePath.includes('roadmap')) tags.push('roadmap');
    if (filePath.includes('progress')) tags.push('progress');
    
    // Add tags based on file extension
    const ext = extname(filePath).toLowerCase();
    if (ext === '.md') tags.push('markdown');
    if (ext === '.json') tags.push('json');
    if (ext === '.yaml' || ext === '.yml') tags.push('yaml');
    
    return tags;
  }

  private preprocessContent(content: string, filePath: string): string {
    // Remove frontmatter from Markdown files
    if (extname(filePath).toLowerCase() === '.md') {
      content = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    }
    
    // Remove excessive whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Remove code block markers for better text processing
    content = content.replace(/```[\s\S]*?```/g, '[CODE_BLOCK]');
    
    return content.trim();
  }

  private generateDocumentId(filePath: string): string {
    // Create a unique ID based on file path
    return `doc_${Buffer.from(filePath).toString('base64').replace(/[+/=]/g, '')}`;
  }

  async searchDocumentation(
    query: string,
    options: { limit?: number; tags?: string[] } = {}
  ): Promise<any[]> {
    try {
      const results = await this.vectorDb.searchDocuments(query, {
        limit: options.limit || 10,
        filter: options.tags ? { tags: { $in: options.tags } } : undefined
      } as any);

      return results.map(result => ({
        title: result.metadata.title,
        source: result.metadata.source,
        content: result.content.substring(0, 500) + '...',
        score: result.score,
        tags: result.metadata.tags
      }));
    } catch (error) {
      this.logger.error('Failed to search documentation:', error);
      throw error;
    }
  }
}
