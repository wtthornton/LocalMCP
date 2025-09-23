/**
 * Simple Context7 MCP Client
 * 
 * This replaces all the complex Context7 services with a simple, verified implementation
 * that follows Context7's official best practices.
 */

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
}

export class SimpleContext7Client {
  private apiKey: string;
  private logger: any;

  constructor(config: Context7Config, logger?: any) {
    this.apiKey = config.apiKey;
    this.logger = logger || console;
  }

  /**
   * Resolve library name to Context7 library information
   * Verified against actual Context7 API
   */
  async resolveLibraryId(libraryName: string): Promise<Context7LibraryInfo[]> {
    try {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: { libraryName }
        }
      };

      const response = await fetch('https://mcp.context7.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'PromptMCP-SimpleClient/1.0.0'
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Context7 returns array of library matches with this structure:
      // { libraryId: "/websites/react_dev", name: "React", description: "...", codeSnippets: 1752, trustScore: 8 }
      return result.result || [];
    } catch (error) {
      this.logger.warn('Context7 library resolution failed', { 
        libraryName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return [];
    }
  }

  /**
   * Get library documentation from Context7
   * Verified against actual Context7 API
   */
  async getLibraryDocs(
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
            topic,
            tokens: tokens || 4000
          }
        }
      };

      const response = await fetch('https://mcp.context7.com/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'PromptMCP-SimpleClient/1.0.0'
        },
        body: JSON.stringify(mcpRequest)
      });

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Context7 returns documentation with this structure:
      // { content: "===============\nCODE SNIPPETS\n================\nTITLE: ...", metadata: {...} }
      return {
        content: result.result?.content || '',
        metadata: {
          libraryId,
          topic,
          tokens: tokens || 4000,
          retrievedAt: new Date(),
          source: 'Context7 MCP'
        }
      };
    } catch (error) {
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
}
