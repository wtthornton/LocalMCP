/**
 * Simple Context7 MCP Client
 * 
 * This client uses internal MCP tools instead of direct HTTP calls
 * Following best practices for Context7 MCP integration
 */

import { SSEParser } from './sse-parser.js';
import { Context7OpenAIInterceptor } from '../ai/context7-openai-interceptor.service.js';
import type { Context7EnhancementOptions, Context7EnhancementResult } from '../ai/context7-openai-interceptor.service.js';

export interface Context7Config {
  apiKey: string;
}

export interface Context7LibraryInfo {
  libraryId: string;
  name: string;
  description: string;
  codeSnippets: number;
  trustScore: number;
}

export interface Context7Documentation {
  content: string;
  metadata: {
    libraryId: string;
    topic?: string | undefined;
    tokens: number;
    retrievedAt: Date;
    source: string;
  };
  enhancementResult?: Context7EnhancementResult;
}

export class SimpleContext7Client {
  private apiKey: string;
  private logger: any;
  private mcpServer: any; // Reference to MCP server for internal tool calls
  private config?: any; // Configuration for URLs and settings
  private openAIInterceptor?: Context7OpenAIInterceptor;

  constructor(
    config: Context7Config, 
    logger?: any, 
    mcpServer?: any,
    openAIInterceptor?: Context7OpenAIInterceptor
  ) {
    this.apiKey = config.apiKey;
    this.logger = logger || console;
    this.mcpServer = mcpServer;
    this.config = config;
    this.openAIInterceptor = openAIInterceptor;
    
    console.log('🔍 [Context7-Client-Debug] SimpleContext7Client initialized', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      hasLogger: !!this.logger,
      hasMcpServer: !!this.mcpServer,
      mcpServerType: typeof this.mcpServer
    });
    
    this.logger.info('🔍 [Context7-Client-Debug] SimpleContext7Client initialized', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey.length,
      hasLogger: !!this.logger,
      hasMcpServer: !!this.mcpServer,
      mcpServerType: typeof this.mcpServer
    });
  }

  /**
   * Resolve library name to Context7 library information
   * Uses internal MCP tools instead of direct HTTP calls
   */
  async resolveLibraryId(libraryName: string): Promise<Context7LibraryInfo[]> {
    const debugMode = process.env.CONTEXT7_DEBUG === 'true';
    
    // Always log the first call to see if the method is being called at all
    this.logger.info('🔍 [Context7-Debug] resolveLibraryId called', {
      libraryName,
      debugMode,
      context7DebugEnv: process.env.CONTEXT7_DEBUG,
      timestamp: new Date().toISOString(),
      hasMcpServer: !!this.mcpServer,
      hasExecuteToolInternal: !!(this.mcpServer && this.mcpServer.executeToolInternal)
    });
    
    if (debugMode) {
      this.logger.info('🔍 [Context7-Debug] Starting library resolution', {
        libraryName,
        timestamp: new Date().toISOString(),
        hasMcpServer: !!this.mcpServer,
        hasExecuteToolInternal: !!(this.mcpServer && this.mcpServer.executeToolInternal)
      });
    }

    try {
      // Always call external Context7 API directly (like Cursor does)
      if (false) { // Disabled internal tool calls - use direct API instead
        if (debugMode) {
          this.logger.info('🔍 [Context7-Debug] Using internal MCP tool', { libraryName });
        }
        
        this.logger.info('🔍 [Context7-Debug] MCP server available, calling executeToolInternal', {
          hasMcpServer: !!this.mcpServer,
          hasExecuteToolInternal: !!this.mcpServer.executeToolInternal,
          libraryName
        });
        
        const result = await this.mcpServer.executeToolInternal('resolve-library-id', { libraryName });
        
        if (debugMode) {
          this.logger.info('🔍 [Context7-Debug] Internal MCP tool result', {
            libraryName,
            success: result.success,
            hasResult: !!result.result,
            resultLength: result.result ? result.result.length : 0,
            error: result.error,
            resultType: typeof result.result,
            isArray: Array.isArray(result.result)
          });
        }
        
        if (result.success) {
          const libraries = result.result || [];
          if (debugMode) {
            this.logger.info('🔍 [Context7-Debug] Internal MCP tool success', {
              libraryName,
              librariesFound: libraries.length,
            libraries: libraries.map((lib: any) => ({
              libraryId: lib.libraryId,
              name: lib.name,
              codeSnippets: lib.codeSnippets,
              trustScore: lib.trustScore
            }))
            });
          }
          return libraries;
        } else {
          this.logger.warn('Internal MCP tool failed, falling back to direct API call', { 
            error: result.error 
          });
        }
      }

      // Fallback to direct API call if internal MCP tool not available
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: { libraryName }
        }
      };

      if (debugMode) {
        const apiUrl = process.env.CONTEXT7_BASE_URL || this.config?.mcp?.serverUrl || this.config?.baseUrl || 'https://mcp.context7.com/mcp';
        this.logger.info('🔍 [Context7-Debug] Making direct API call', {
          libraryName,
          requestId: mcpRequest.id,
          apiUrl,
          requestBody: JSON.stringify(mcpRequest, null, 2)
        });
      }

      const apiUrl = process.env.CONTEXT7_BASE_URL || this.config?.mcp?.serverUrl || this.config?.baseUrl || 'https://mcp.context7.com/mcp';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'CONTEXT7_API_KEY': this.apiKey,
          'User-Agent': 'PromptMCP-SimpleClient/1.0.0'
        },
        body: JSON.stringify(mcpRequest)
      });

      if (debugMode) {
        this.logger.info('🔍 [Context7-Debug] API response received', {
          libraryName,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      
      if (debugMode) {
        this.logger.info('🔍 [Context7-Debug] Raw response text', {
          libraryName,
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 500),
          isSSE: responseText.includes('event:'),
          hasData: responseText.includes('data:')
        });
      }

      const result = SSEParser.parseResponse(responseText);
      
      if (debugMode) {
        this.logger.info('🔍 [Context7-Debug] Parsed response', {
          libraryName,
          hasResult: !!result,
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : [],
          hasResultArray: !!(result && result.result),
          resultArrayLength: result && result.result ? result.result.length : 0,
          hasContentArray: !!(result && result.result && result.result.content),
          contentArrayLength: result && result.result && result.result.content ? result.result.content.length : 0
        });
      }
      
      // Context7 returns text-based response format:
      // { result: { content: [{ type: "text", text: "Available Libraries...\n- Title: React\n- Context7-compatible library ID: /websites/react_dev\n..." }] } }
      let libraries = [];
      
      if (result && result.result) {
        if (Array.isArray(result.result)) {
          // Direct array format (expected but not used by Context7)
          libraries = result.result;
        } else if (result.result.content && Array.isArray(result.result.content)) {
          // Text-based format (actual Context7 response)
          const textContent = result.result.content[0]?.text || '';
          libraries = this.parseLibraryTextResponse(textContent);
          
          if (debugMode) {
            this.logger.info('🔍 [Context7-Debug] Parsed text response', {
              libraryName,
              textLength: textContent.length,
              librariesFound: libraries.length,
            libraries: libraries.map((lib: any) => ({
              libraryId: lib.libraryId,
              name: lib.name,
              codeSnippets: lib.codeSnippets,
              trustScore: lib.trustScore
            }))
            });
          }
        }
      }
      
      if (debugMode) {
        this.logger.info('🔍 [Context7-Debug] Final library resolution result', {
          libraryName,
          librariesFound: libraries.length,
          libraries: libraries.map((lib: any) => ({
            libraryId: lib.libraryId,
            name: lib.name,
            description: lib.description ? lib.description.substring(0, 100) + '...' : 'No description',
            codeSnippets: lib.codeSnippets,
            trustScore: lib.trustScore
          }))
        });
      }
      
      return libraries;
    } catch (error) {
      if (debugMode) {
        this.logger.error('🔍 [Context7-Debug] Library resolution failed with error', {
          libraryName,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          errorType: typeof error
        });
      }
      
      this.logger.warn('Context7 library resolution failed', { 
        libraryName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return [];
    }
  }

  /**
   * Get library documentation from Context7
   * Verified against actual Context7 API with optional AI enhancement
   */
  async getLibraryDocs(
    libraryId: string, 
    topic?: string, 
    tokens?: number,
    enhancementOptions?: Context7EnhancementOptions
  ): Promise<Context7Documentation> {
    const debugMode = process.env.CONTEXT7_DEBUG === 'true';
    
    if (debugMode) {
      this.logger.info('📚 [Context7-Debug] Starting documentation retrieval', {
        libraryId,
        topic,
        tokens: tokens || 4000,
        timestamp: new Date().toISOString(),
        hasMcpServer: !!this.mcpServer,
        hasExecuteToolInternal: !!(this.mcpServer && this.mcpServer.executeToolInternal)
      });
    }

    try {
      // Always call external Context7 API directly (like Cursor does)
      if (false) { // Disabled internal tool calls - use direct API instead
        if (debugMode) {
          this.logger.info('📚 [Context7-Debug] Using internal MCP tool for docs', {
            libraryId,
            topic,
            tokens: tokens || 4000
          });
        }
        
        const result = await this.mcpServer.executeToolInternal('get-library-docs', {
          context7CompatibleLibraryID: libraryId,
          topic,
          tokens: tokens || 4000
        });
        
        if (debugMode) {
          this.logger.info('📚 [Context7-Debug] Internal MCP tool result for docs', {
            libraryId,
            success: result.success,
            hasResult: !!result.result,
            hasContent: !!(result.result && result.result.content),
            contentLength: result.result && result.result.content ? result.result.content.length : 0,
            error: result.error
          });
        }
        
        if (result.success) {
          const docs = {
            content: result.result?.content || '',
            metadata: {
              libraryId,
              topic,
              tokens: tokens || 4000,
              retrievedAt: new Date(),
              source: 'internal-mcp'
            }
          };
          
          if (debugMode) {
            this.logger.info('📚 [Context7-Debug] Internal MCP tool success for docs', {
              libraryId,
              contentLength: docs.content.length,
              hasContent: docs.content.length > 0,
              contentPreview: docs.content.substring(0, 200) + (docs.content.length > 200 ? '...' : ''),
              metadata: docs.metadata
            });
          }
          
          return docs;
        } else {
          this.logger.warn('Internal MCP tool failed, falling back to direct API call', { 
            error: result.error 
          });
        }
      }

      // Fallback to direct API call if internal MCP tool not available
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'get-library-docs',
          arguments: {
            context7CompatibleLibraryID: libraryId,
            topic,
            tokens: tokens || 4000
          }
        }
      };

      if (debugMode) {
        const apiUrl = process.env.CONTEXT7_BASE_URL || this.config?.mcp?.serverUrl || this.config?.baseUrl || 'https://mcp.context7.com/mcp';
        this.logger.info('📚 [Context7-Debug] Making direct API call for docs', {
          libraryId,
          topic,
          tokens: tokens || 4000,
          requestId: mcpRequest.id,
          apiUrl,
          requestBody: JSON.stringify(mcpRequest, null, 2)
        });
      }

      const apiUrl = process.env.CONTEXT7_BASE_URL || this.config?.mcp?.serverUrl || this.config?.baseUrl || 'https://mcp.context7.com/mcp';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'CONTEXT7_API_KEY': this.apiKey,
          'User-Agent': 'PromptMCP-SimpleClient/1.0.0'
        },
        body: JSON.stringify(mcpRequest)
      });

      if (debugMode) {
        this.logger.info('📚 [Context7-Debug] API response received for docs', {
          libraryId,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      
      if (debugMode) {
        this.logger.info('📚 [Context7-Debug] Raw response text for docs', {
          libraryId,
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 500),
          isSSE: responseText.includes('event:'),
          hasData: responseText.includes('data:')
        });
      }

      const result = SSEParser.parseResponse(responseText);
      
      if (debugMode) {
        this.logger.info('📚 [Context7-Debug] Parsed response for docs', {
          libraryId,
          hasResult: !!result,
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : [],
          hasResultContent: !!(result && result.result && result.result.content),
          contentLength: result && result.result && result.result.content ? result.result.content.length : 0
        });
      }
      
      // Context7 returns documentation with text-based format:
      // { result: { content: [{ type: "text", text: "================\nCODE SNIPPETS\n================\nTITLE: ..." }] } }
      let content = '';
      
      if (result && result.result) {
        if (typeof result.result.content === 'string') {
          // Direct string content
          content = result.result.content;
        } else if (Array.isArray(result.result.content) && result.result.content[0] && result.result.content[0].text) {
          // Text-based format (actual Context7 response)
          content = result.result.content[0].text;
        }
      }
      
      let finalContent = content;
      let enhancementResult: Context7EnhancementResult | undefined;

      // Apply AI enhancement if enabled
      if (this.openAIInterceptor && enhancementOptions?.useAIEnhancement && content) {
        try {
          const framework = this.extractFrameworkFromLibraryId(libraryId);
          enhancementResult = await this.openAIInterceptor.enhanceContext7Result(
            content,
            framework,
            enhancementOptions
          );
          
          finalContent = enhancementResult.enhancedDocs;
          
          if (debugMode) {
            this.logger.info('📚 [Context7-Debug] Applied AI enhancement', {
              libraryId,
              originalLength: content.length,
              enhancedLength: finalContent.length,
              tokensUsed: enhancementResult.enhancementMetadata.tokensUsed,
              cost: enhancementResult.enhancementMetadata.cost
            });
          }
        } catch (enhancementError) {
          this.logger.warn('AI enhancement failed, using original content', {
            libraryId,
            error: enhancementError instanceof Error ? enhancementError.message : 'Unknown error'
          });
        }
      }

      const docs = {
        content: finalContent,
        metadata: {
          libraryId,
          topic,
          tokens: tokens || 4000,
          retrievedAt: new Date(),
          source: 'Context7 MCP'
        },
        enhancementResult
      };
      
      if (debugMode) {
        this.logger.info('📚 [Context7-Debug] Final documentation result', {
          libraryId,
          contentLength: docs.content.length,
          hasContent: docs.content.length > 0,
          contentPreview: docs.content.substring(0, 200) + (docs.content.length > 200 ? '...' : ''),
          metadata: docs.metadata,
          hasEnhancement: !!enhancementResult
        });
      }
      
      return docs;
    } catch (error) {
      if (debugMode) {
        this.logger.error('📚 [Context7-Debug] Documentation retrieval failed with error', {
          libraryId,
          topic,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          errorType: typeof error
        });
      }
      
      this.logger.warn('Context7 documentation retrieval failed', { 
        libraryId, 
        topic, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return {
        content: '',
        metadata: {
          libraryId,
          topic,
          tokens: tokens || 4000,
          retrievedAt: new Date(),
          source: 'Context7 MCP (error)'
        }
      };
    }
  }

  /**
   * Parse Context7 text-based response format into library objects
   * Context7 returns text like:
   * "Available Libraries (top matches):\n\n- Title: React\n- Context7-compatible library ID: /websites/react_dev\n- Description: ...\n- Code Snippets: 1752\n- Trust Score: 8\n----------\n..."
   */
  private parseLibraryTextResponse(textContent: string): Context7LibraryInfo[] {
    const libraries: Context7LibraryInfo[] = [];
    
    try {
      // Split by library separator (----------)
      const librarySections = textContent.split('----------').filter(section => section.trim());
      
      for (const section of librarySections) {
        const lines = section.split('\n').map(line => line.trim()).filter(line => line);
        
        let library: Partial<Context7LibraryInfo> = {};
        
        for (const line of lines) {
          if (line.startsWith('- Title:')) {
            library.name = line.replace('- Title:', '').trim();
          } else if (line.startsWith('- Context7-compatible library ID:')) {
            library.libraryId = line.replace('- Context7-compatible library ID:', '').trim();
          } else if (line.startsWith('- Description:')) {
            library.description = line.replace('- Description:', '').trim();
          } else if (line.startsWith('- Code Snippets:')) {
            const snippets = line.replace('- Code Snippets:', '').trim();
            library.codeSnippets = parseInt(snippets) || 0;
          } else if (line.startsWith('- Trust Score:')) {
            const score = line.replace('- Trust Score:', '').trim();
            library.trustScore = parseFloat(score) || 0;
          } else if (line.startsWith('- Versions:')) {
            const versions = line.replace('- Versions:', '').trim();
            (library as any).versions = versions.split(',').map(v => v.trim());
          }
        }
        
        // Only add if we have the required fields
        if (library.libraryId && library.name) {
          libraries.push({
            libraryId: library.libraryId,
            name: library.name,
            description: library.description || '',
            codeSnippets: library.codeSnippets || 0,
            trustScore: library.trustScore || 0,
            ...((library as any).versions && { versions: (library as any).versions })
          });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to parse Context7 text response', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        textLength: textContent.length
      });
    }
    
    return libraries;
  }

  /**
   * Get documentation for multiple frameworks in parallel
   * This is the main method used by the enhance tool
   */
  async getDocumentation(
    prompt: string,
    detectedFrameworks: string[]
  ): Promise<{ docs: string; libraries: string[] }> {
    try {
      if (!detectedFrameworks || detectedFrameworks.length === 0) {
        return { docs: '', libraries: [] };
      }

      // Parallel library resolution
      const libraryPromises = detectedFrameworks.map(fw =>
        this.resolveLibraryId(fw)
      );
      const libraryResults = await Promise.all(libraryPromises);
      
      // Flatten and get unique library IDs
      const allLibraries = libraryResults.flat();
      const uniqueLibraries = [...new Set(allLibraries.map(lib => lib.libraryId))];
      
      if (uniqueLibraries.length === 0) {
        return { docs: '', libraries: [] };
      }

      // Extract topic from prompt (simple keyword extraction)
      const topic = this.extractTopicFromPrompt(prompt);
      
      // Parallel documentation fetching
      const docPromises = uniqueLibraries.map(libraryId =>
        this.getLibraryDocs(libraryId, topic, Math.floor(4000 / uniqueLibraries.length))
      );
      
      const docResults = await Promise.all(docPromises);
      
      // Combine results
      const allDocs = docResults
        .filter(doc => doc && doc.content)
        .map((doc, index) => `## ${uniqueLibraries[index]} Documentation:\n${doc.content}`);
      
      return {
        docs: allDocs.join('\n\n'),
        libraries: uniqueLibraries
      };
    } catch (error) {
      this.logger.warn('Context7 documentation retrieval failed', { 
        prompt: prompt.substring(0, 100) + '...', 
        detectedFrameworks,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return { docs: '', libraries: [] };
    }
  }

  /**
   * Simple topic extraction from prompt
   */
  private extractTopicFromPrompt(prompt: string): string {
    const keywords = ['hooks', 'components', 'routing', 'middleware', 'api', 'state', 'props'];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        return keyword;
      }
    }
    
    return '';
  }

  /**
   * Extract framework name from library ID
   */
  private extractFrameworkFromLibraryId(libraryId: string): string | undefined {
    // Common library ID patterns
    const frameworkPatterns: Record<string, string> = {
      '/facebook/react': 'react',
      '/vuejs/vue': 'vue',
      '/angular/angular': 'angular',
      '/mdn/html': 'html',
      '/mdn/css': 'css',
      '/nodejs/node': 'node',
      '/expressjs/express': 'express',
      '/mongodb/docs': 'mongodb',
      '/postgresql/postgres': 'postgresql'
    };

    // Check for exact matches first
    if (frameworkPatterns[libraryId]) {
      return frameworkPatterns[libraryId];
    }

    // Try to extract from path-like library IDs
    const pathParts = libraryId.split('/');
    if (pathParts.length >= 2) {
      const framework = pathParts[1];
      // Common framework names
      if (['react', 'vue', 'angular', 'html', 'css', 'node', 'express', 'mongodb', 'postgresql'].includes(framework)) {
        return framework;
      }
    }

    return undefined;
  }
}
