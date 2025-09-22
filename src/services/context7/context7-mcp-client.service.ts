/**
 * Context7 MCP Client Service
 * 
 * Handles real Context7 MCP API communication
 * Implements proper error handling and retry logic
 */

import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { IContext7Service, Context7ServiceConfig, Context7Error } from './context7-service.interface.js';
import type { Context7LibraryInfo, Context7Documentation } from './context7-real-integration.service.js';

export class Context7MCPClientService implements IContext7Service {
  private logger: Logger;
  private config: ConfigService;
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private retryAttempts: number;

  constructor(logger: Logger, config: ConfigService) {
    this.logger = logger;
    this.config = config;
    this.baseUrl = config.getNested('context7', 'baseUrl') || 'https://mcp.context7.com/mcp';
    this.apiKey = config.getNested('context7', 'apiKey') || '';
    this.timeout = (config.getNested('context7', 'mcp') as any)?.timeout || 30000;
    this.retryAttempts = 3; // Fixed retry attempts
  }

  /**
   * Resolves a library name to Context7 library information
   */
  async resolveLibraryId(libraryName: string): Promise<Context7LibraryInfo[]> {
    try {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: {
            libraryName: libraryName
          }
        }
      };

      this.logger.debug('Making Context7 resolve-library-id request', {
        libraryName,
        request: mcpRequest
      });

      const response = await this.makeMCPRequest(mcpRequest);
      
      if (response.result && response.result.content && response.result.content[0]) {
        // Parse the text content to extract library information
        const content = response.result.content[0].text;
        const libraries = this.parseLibraryContent(content);
        return libraries;
      }

      return [];
    } catch (error) {
      this.logger.error('Context7 resolveLibraryId failed', {
        libraryName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.createContext7Error('RESOLVE_LIBRARY_FAILED', error, { libraryName });
    }
  }

  /**
   * Fetches library documentation from Context7
   */
  async getLibraryDocumentation(
    libraryId: string,
    topic?: string,
    tokens?: number
  ): Promise<Context7Documentation> {
    try {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'get-library-docs',
          arguments: {
            context7CompatibleLibraryID: libraryId,
            topic: topic || undefined,
            tokens: tokens || 4000
          }
        }
      };

      this.logger.debug('Making Context7 get-library-docs request', {
        libraryId,
        topic,
        tokens,
        request: mcpRequest
      });

      const response = await this.makeMCPRequest(mcpRequest);
      
      const content = response.result?.content?.[0];
      if (content?.type === 'text') {
        return {
          content: content.text,
          metadata: {
            libraryId,
            ...(topic && { topic }),
            tokens: tokens || 4000,
            retrievedAt: new Date(),
            source: 'context7-mcp'
          }
        };
      }

      // Fallback if no content
      this.logger.warn('No content in Context7 documentation response', { 
        libraryId, 
        topic 
      });

      return {
        content: `# ${libraryId} Documentation\n\nNo documentation available from Context7.`,
        metadata: {
          libraryId,
          ...(topic && { topic }),
          tokens: tokens || 4000,
          retrievedAt: new Date(),
          source: 'context7-mcp (fallback)'
        }
      };
    } catch (error) {
      this.logger.error('Context7 getLibraryDocumentation failed', {
        libraryId,
        topic,
        tokens,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.createContext7Error('GET_DOCS_FAILED', error, { libraryId, topic });
    }
  }

  /**
   * Validates that a Context7 library exists and returns meaningful content
   */
  async validateContext7Library(libraryId: string): Promise<boolean> {
    try {
      const testDoc = await this.getLibraryDocumentation(libraryId, 'validation', 100);
      return testDoc && 
        testDoc.content.length > 50 && 
        !testDoc.content.includes('Library not found') &&
        !testDoc.content.includes('Error') &&
        !testDoc.content.includes('Failed');
    } catch (error) {
      this.logger.warn(`Context7 library ${libraryId} validation failed:`, error);
      return false;
    }
  }

  /**
   * Selects a validated library from fallback hierarchy
   */
  async selectValidatedLibrary(framework: string): Promise<string | null> {
    const fallbacks = this.getLibraryFallbacks(framework);
    
    for (const libraryId of fallbacks) {
      if (await this.validateContext7Library(libraryId)) {
        this.logger.debug('Selected validated library', { framework, libraryId });
        return libraryId;
      }
    }
    
    return null;
  }

  /**
   * Selects a high-quality library for a framework
   */
  async selectHighQualityLibrary(framework: string): Promise<string | null> {
    const fallbacks = this.getLibraryFallbacks(framework);
    
    for (const libraryId of fallbacks) {
      try {
        const libraryInfo = await this.resolveLibraryId(libraryId);
        if (libraryInfo.length > 0 && libraryInfo[0] && libraryInfo[0].trustScore >= 8.0) {
          this.logger.debug('Selected high-quality library', { 
            framework, 
            libraryId, 
            trustScore: libraryInfo[0].trustScore 
          });
          return libraryId;
        }
      } catch (error) {
        this.logger.warn(`Failed to check quality for library ${libraryId}:`, error);
      }
    }
    
    return null;
  }

  /**
   * Makes a Context7 MCP request with retry logic
   */
  private async makeMCPRequest(request: any): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream, application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'User-Agent': 'PromptMCP-Context7Client/1.0.0'
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`Context7 MCP error: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        let mcpResponse: any;
        
        if (contentType.includes('application/json')) {
          mcpResponse = await response.json();
        } else if (contentType.includes('text/event-stream')) {
          // Handle SSE response
          const text = await response.text();
          const lines = text.split('\n').filter(line => line.trim());
          const dataLines = lines.filter(line => line.startsWith('data: '));
          
          if (dataLines.length > 0) {
            const lastDataLine = dataLines[dataLines.length - 1];
            if (lastDataLine) {
              mcpResponse = JSON.parse(lastDataLine.substring(6)); // Remove 'data: ' prefix
            } else {
              throw new Error('No data in SSE response');
            }
          } else {
            throw new Error('No data in SSE response');
          }
        } else {
          throw new Error(`Unsupported content type: ${contentType}`);
        }

        if (mcpResponse.error) {
          throw new Error(`Context7 MCP error: ${mcpResponse.error.message || 'Unknown error'}`);
        }

        return mcpResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.warn(`Context7 MCP request failed, retrying in ${delay}ms`, {
            attempt,
            error: lastError.message
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Context7 MCP request failed after all retries');
  }

  /**
   * Gets library fallback hierarchy
   */
  private getLibraryFallbacks(framework: string): string[] {
    const fallbacks: Record<string, string[]> = {
      'html': ['/mdn/html', '/mdn/web-apis', '/mdn/dom'],
      'css': ['/mdn/css', '/mdn/css3', '/tailwindcss/tailwindcss'],
      'javascript': ['/mdn/javascript', '/mdn/web-apis', '/nodejs/node'],
      'react': ['/facebook/react', '/vercel/next.js', '/mdn/javascript'],
      'nextjs': ['/vercel/next.js', '/facebook/react', '/microsoft/typescript'],
      'typescript': ['/microsoft/typescript', '/mdn/javascript', '/nodejs/node'],
      'vue': ['/vuejs/vue', '/mdn/javascript', '/mdn/css'],
      'angular': ['/angular/angular', '/microsoft/typescript', '/mdn/javascript'],
      'express': ['/expressjs/express', '/nodejs/node', '/mdn/javascript']
    };
    
    return fallbacks[framework] || [];
  }

  /**
   * Parses library content from Context7 response text
   */
  private parseLibraryContent(content: string): Context7LibraryInfo[] {
    const libraries: Context7LibraryInfo[] = [];
    
    // Split by library separator
    const librarySections = content.split('----------');
    
    for (const section of librarySections) {
      if (!section.trim()) continue;
      
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      
      let library: Partial<Context7LibraryInfo> = {};
      
      for (const line of lines) {
        if (line.startsWith('- Title:')) {
          library.name = line.replace('- Title:', '').trim();
        } else if (line.startsWith('- Context7-compatible library ID:')) {
          library.id = line.replace('- Context7-compatible library ID:', '').trim();
        } else if (line.startsWith('- Description:')) {
          library.description = line.replace('- Description:', '').trim();
        } else if (line.startsWith('- Code Snippets:')) {
          library.codeSnippets = parseInt(line.replace('- Code Snippets:', '').trim()) || 0;
        } else if (line.startsWith('- Trust Score:')) {
          library.trustScore = parseFloat(line.replace('- Trust Score:', '').trim()) || 7.0;
        } else if (line.startsWith('- Versions:')) {
          const versionsText = line.replace('- Versions:', '').trim();
          library.versions = versionsText ? versionsText.split(',').map(v => v.trim()) : [];
        }
      }
      
      if (library.id && library.name) {
        libraries.push({
          id: library.id,
          name: library.name,
          description: library.description || '',
          codeSnippets: library.codeSnippets || 0,
          trustScore: library.trustScore || 7.0,
          versions: library.versions || []
        });
      }
    }
    
    // Sort by trust score (highest first)
    libraries.sort((a, b) => b.trustScore - a.trustScore);
    
    return libraries;
  }

  /**
   * Creates a Context7 error with proper typing
   */
  private createContext7Error(code: string, error: unknown, context?: any): Context7Error {
    const context7Error = new Error(
      error instanceof Error ? error.message : 'Unknown Context7 error'
    ) as Context7Error;
    
    context7Error.code = code;
    context7Error.retryable = code.includes('TIMEOUT') || code.includes('NETWORK');
    
    if (context) {
      Object.assign(context7Error, context);
    }
    
    return context7Error;
  }
}
