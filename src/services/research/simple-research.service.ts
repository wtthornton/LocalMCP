/**
 * Simple Research Service
 * 
 * Provides simple framework research using Context7 integration.
 * Reuses existing Context7 client for maximum code reuse.
 * 
 * Benefits for vibe coders:
 * - Simple, one-question-per-framework approach
 * - Reuses existing Context7 integration
 * - Clean error handling
 * - Easy to understand and maintain
 */

import { Logger } from '../logger/logger.js';
import { SimpleContext7Client } from '../context7/simple-context7-client.js';

export interface ResearchResult {
  framework: string;
  bestPractices: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface ResearchOptions {
  maxTokens?: number;
  useCache?: boolean;
}

export class SimpleResearchService {
  private logger: Logger;
  private context7Client: SimpleContext7Client;

  constructor(logger: Logger, context7Client: SimpleContext7Client) {
    this.logger = logger;
    this.context7Client = context7Client;
  }

  /**
   * Research best practices for a specific framework
   * Simple one-question approach: "What are the latest best practices for [framework]?"
   */
  async researchFrameworkBestPractices(
    framework: string,
    options: ResearchOptions = {}
  ): Promise<ResearchResult> {
    const { maxTokens = 2000, useCache = true } = options;
    
    this.logger.debug('Starting framework research', {
      framework,
      maxTokens,
      useCache
    });

    try {
      // Simple question: What are the latest best practices for [framework]?
      const question = `What are the latest best practices for ${framework}?`;
      
      // Use existing Context7 client to get documentation
      const docs = await this.context7Client.getLibraryDocs(
        this.getFrameworkLibraryId(framework),
        question,
        maxTokens
      );

      if (!docs || !docs.content) {
        throw new Error(`No documentation found for framework: ${framework}`);
      }

      this.logger.info('Framework research completed successfully', {
        framework,
        contentLength: docs.content.length
      });

      return {
        framework,
        bestPractices: docs.content,
        success: true,
        timestamp: new Date()
      };

    } catch (error) {
      this.logger.error('Framework research failed', {
        framework,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        framework,
        bestPractices: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Research multiple frameworks in parallel
   */
  async researchMultipleFrameworks(
    frameworks: string[],
    options: ResearchOptions = {}
  ): Promise<ResearchResult[]> {
    this.logger.debug('Starting multi-framework research', {
      frameworks,
      count: frameworks.length
    });

    const promises = frameworks.map(framework => 
      this.researchFrameworkBestPractices(framework, options)
    );

    const results = await Promise.all(promises);
    
    this.logger.info('Multi-framework research completed', {
      totalFrameworks: frameworks.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Get Context7 library ID for a framework
   * Maps common framework names to Context7 library IDs
   */
  private getFrameworkLibraryId(framework: string): string {
    const frameworkMap: Record<string, string> = {
      'react': '/websites/react_dev',
      'vue': '/vuejs/vue',
      'angular': '/angular/angular',
      'nextjs': '/vercel/next.js',
      'html': '/websites/mdn_web_docs',
      'css': '/websites/mdn_web_docs',
      'javascript': '/websites/mdn_web_docs',
      'typescript': '/microsoft/TypeScript',
      'node': '/nodejs/node',
      'express': '/expressjs/express',
      'python': '/python/cpython',
      'django': '/django/django',
      'flask': '/pallets/flask',
      'java': '/openjdk/jdk',
      'spring': '/spring-projects/spring-framework'
    };

    const libraryId = frameworkMap[framework.toLowerCase()];
    if (!libraryId) {
      // Fallback to generic web development documentation
      return '/websites/mdn_web_docs';
    }

    return libraryId;
  }

  /**
   * Check if research service is available
   */
  isAvailable(): boolean {
    return !!this.context7Client;
  }
}
