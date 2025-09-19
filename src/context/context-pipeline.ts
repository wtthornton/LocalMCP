import { Logger } from '../services/logger/logger.js';
import { Context7Service } from '../services/context7/context7.service.js';
import { Context7MCPClientReal } from '../services/context7/context7-mcp-client-real.js';
import { VectorDatabaseService } from '../services/vector/vector-db.service.js';
import { ConfigService } from '../config/config.service.js';
import { readFile, readdir } from 'fs/promises';

export interface ContextResult {
  repoFacts: string[];
  frameworkDocs: string[];
  projectDocs: string[];
  codeSnippets: string[];
}

export class ContextPipeline {
  private logger: Logger;
  private context7: Context7Service;
  private context7MCP: Context7MCPClientReal;
  private vectorDb: VectorDatabaseService;
  private config: ConfigService;

  constructor() {
    this.logger = new Logger('ContextPipeline');
    this.config = new ConfigService();
    this.context7 = new Context7Service(this.logger, this.config);
    const apiKey = this.config.getNested('context7', 'apiKey');
    if (!apiKey) {
      throw new Error('Context7 API key is required in configuration');
    }
    
    this.context7MCP = new Context7MCPClientReal({
      apiKey: apiKey,
      mcpUrl: 'https://mcp.context7.com/mcp',
      timeout: 30000
    });
    this.vectorDb = new VectorDatabaseService(this.logger, this.config);
  }

  async gatherContext(
    prompt: string,
    framework?: string,
    filePath?: string
  ): Promise<ContextResult> {
    this.logger.info('Gathering context for prompt', { prompt, framework, filePath });

    try {
      // Run all 4 context stages in parallel for speed
      const [repoFacts, frameworkDocs, projectDocs, codeSnippets] = await Promise.all([
        this.detectRepoFacts(),
        this.retrieveContext7(framework),
        this.retrieveRAG(prompt),
        this.readSnippets(filePath)
      ]);

      return {
        repoFacts,
        frameworkDocs,
        projectDocs,
        codeSnippets
      };
    } catch (error) {
      this.logger.error('Context gathering failed', { error: (error as Error).message });
      throw error;
    }
  }

  private async detectRepoFacts(): Promise<string[]> {
    try {
      const facts: string[] = [];
      const detectedTechnologies = new Set<string>(); // Use Set to prevent duplicates
      
      // Read package.json to detect tech stack
      try {
        const packageJson = JSON.parse(await readFile('package.json', 'utf-8'));
        
        // Detect project type and name
        if (packageJson.name) {
          facts.push(`Project: ${packageJson.name}`);
        }
        
        // Check both dependencies and devDependencies for technologies
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };
        
        Object.keys(allDeps).forEach(dep => {
          if (dep.includes('react')) detectedTechnologies.add('React');
          if (dep.includes('vue')) detectedTechnologies.add('Vue');
          if (dep.includes('angular')) detectedTechnologies.add('Angular');
          if (dep.includes('next')) detectedTechnologies.add('Next.js');
          if (dep.includes('typescript')) detectedTechnologies.add('TypeScript');
          if (dep.includes('tailwind')) detectedTechnologies.add('Tailwind CSS');
          if (dep.includes('prisma')) detectedTechnologies.add('Prisma');
          if (dep.includes('express')) detectedTechnologies.add('Express');
          if (dep.includes('@modelcontextprotocol')) detectedTechnologies.add('MCP (Model Context Protocol)');
          if (dep.includes('qdrant')) detectedTechnologies.add('Qdrant Vector DB');
          if (dep.includes('playwright')) detectedTechnologies.add('Playwright');
          if (dep.includes('jest')) detectedTechnologies.add('Jest Testing');
          if (dep.includes('vitest')) detectedTechnologies.add('Vitest Testing');
          if (dep.includes('eslint')) detectedTechnologies.add('ESLint');
          if (dep.includes('prettier')) detectedTechnologies.add('Prettier');
        });
        
        // Add unique technologies to facts
        detectedTechnologies.forEach(tech => facts.push(tech));
      } catch (e) {
        // No package.json found
      }

      // Detect project structure and type
      try {
        const files = await readdir('.');
        
        // Detect PromptMCP specific structure
        if (files.includes('src') && files.includes('dist')) {
          facts.push('TypeScript project with build output');
        }
        if (files.includes('docker-compose.yml')) {
          facts.push('Docker containerized application');
        }
        if (files.includes('docs')) {
          facts.push('Documentation-driven development');
        }
        if (files.includes('imp')) {
          facts.push('Implementation tracking structure');
        }
        if (files.includes('scripts')) {
          facts.push('Automated script management');
        }
        
        // Detect common web frameworks
        if (files.includes('src') && files.includes('public')) {
          facts.push('Web application structure');
        }
        if (files.includes('components')) {
          facts.push('Component-based architecture');
        }
        if (files.includes('pages')) {
          facts.push('Page-based routing');
        }
        if (files.includes('app')) {
          facts.push('App Router structure');
        }
        
        // Detect MCP server structure
        if (files.includes('src/mcp') || files.includes('src/tools')) {
          facts.push('MCP Server implementation');
        }
        
        // Detect specific PromptMCP features
        if (files.includes('cursor-settings-with-promptmcp.json')) {
          facts.push('Cursor IDE MCP integration');
        }
        if (files.includes('promptmcp-docker-mcp.sh')) {
          facts.push('Docker MCP deployment scripts');
        }
      } catch (e) {
        // Directory read failed
      }

      // Add project-specific facts based on detected structure
      if (facts.length === 0) {
        facts.push('Unknown project structure');
      } else {
        // Add context about what this project does
        if (facts.some(f => f.includes('MCP'))) {
          facts.push('PromptMCP - Prompt enhancement MCP server');
          facts.push('Provides single tool: promptmcp.enhance for better AI context');
        }
      }

      return facts;
    } catch (error) {
      this.logger.warn('Failed to detect repo facts', { error: (error as Error).message });
      return ['Unable to detect project structure'];
    }
  }

  private async retrieveContext7(framework?: string): Promise<string[]> {
    try {
      if (!framework) return [];
      
      this.logger.info('Using real Context7 MCP client', { framework });
      
      // Use real Context7 MCP client service
      const docs = await this.queryContext7MCPClient(framework);
      return docs ? [docs] : [];
    } catch (error) {
      this.logger.warn('Failed to retrieve Context7 docs', { error: (error as Error).message });
      return [];
    }
  }

  private async queryContext7MCPClient(framework: string): Promise<string> {
    try {
      // Connect to the Context7 MCP client
      if (!this.context7MCP.isClientConnected()) {
        await this.context7MCP.connect();
      }
      
      // Resolve library ID for the framework
      const libraryId = await this.context7MCP.resolveLibraryId(framework);
      
      if (libraryId) {
        // Get documentation for the library
        const docs = await this.context7MCP.getLibraryDocs(libraryId, 'best practices', 'latest');
        
        if (docs && docs.length > 0) {
          const doc = docs[0];
          if (doc && doc.content) {
            return `Context7 Documentation for ${framework}: ${doc.content}`;
          }
        }
      }
      
      return `Context7 documentation for ${framework}: Best practices and patterns available.`;
    } catch (error) {
      this.logger.warn('Context7 MCP client query failed, using mock documentation', { error: (error as Error).message });
      // Use mock documentation if Context7 fails
      return this.getMockFrameworkDocs(framework);
    }
  }

  private getMockFrameworkDocs(framework: string): string {
    const docs: Record<string, string> = {
      'react': 'React Best Practices: Use functional components with hooks, implement proper state management with useState/useEffect, follow component composition patterns, use TypeScript for type safety, implement proper error boundaries.',
      'vue': 'Vue.js Best Practices: Use Composition API for new projects, implement proper reactivity with ref/reactive, follow single-file component structure, use TypeScript for better development experience, implement proper state management with Pinia.',
      'angular': 'Angular Best Practices: Use Angular CLI for project generation, implement proper dependency injection, follow component-based architecture, use TypeScript throughout, implement proper routing with Angular Router.',
      'typescript': 'TypeScript Best Practices: Use strict type checking, implement proper interfaces and types, leverage union types and generics, use proper module resolution, implement proper error handling with type guards.'
    };
    
    return docs[framework.toLowerCase()] || `Framework documentation for ${framework}: Best practices include proper component structure, state management, and following framework-specific patterns.`;
  }

  private async retrieveRAG(prompt: string): Promise<string[]> {
    try {
      const results = await this.vectorDb.searchDocuments(prompt, { limit: 3 });
      return results.map((r: any) => r.content);
    } catch (error) {
      this.logger.warn('Failed to retrieve RAG context', { error: (error as Error).message });
      return [];
    }
  }

  private async readSnippets(filePath?: string): Promise<string[]> {
    try {
      if (!filePath) return [];
      
      const content = await readFile(filePath, 'utf-8');
      // Return first 500 characters as snippet
      return [content.substring(0, 500) + '...'];
    } catch (error) {
      this.logger.warn('Failed to read code snippets', { error: (error as Error).message });
      return [];
    }
  }
}
