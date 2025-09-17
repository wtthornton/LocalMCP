import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { PipelineStage, PipelineContext, PipelineError } from '../pipeline-engine.js';
import { readFile, readdir, access, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

export interface CodeSnippet {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  language: string;
  type: 'function' | 'class' | 'component' | 'interface' | 'type' | 'config' | 'test' | 'unknown';
  metadata: {
    size: number;
    complexity: 'low' | 'medium' | 'high';
    dependencies: string[];
    exports: string[];
    imports: string[];
  };
}

export interface SnippetData {
  snippets: CodeSnippet[];
  totalSnippets: number;
  readTime: number;
  error?: string;
}

/**
 * Read.Snippet Stage
 * 
 * Reads and analyzes relevant code snippets from the project
 * based on the current request context
 */
export class ReadSnippetStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  get name(): string {
    return 'Read.Snippet';
  }

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Read.Snippet stage executing', {
      requestId: context.requestId,
      toolName: context.toolName
    });

    try {
      const snippetData = await this.readSnippets(context);

      this.logger.debug('Read.Snippet stage completed', {
        requestId: context.requestId,
        snippetsRead: snippetData.snippets.length,
        readTime: snippetData.readTime
      });

      return {
        data: {
          snippets: snippetData
        },
        metadata: {
          tokensUsed: this.estimateTokens(snippetData),
          chunksUsed: snippetData.snippets.length,
          snippetReadTime: snippetData.readTime
        }
      };

    } catch (error) {
      this.logger.error('Read.Snippet stage failed', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty results instead of failing completely
      return {
        data: {
          snippets: {
            snippets: [],
            totalSnippets: 0,
            readTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        metadata: {
          tokensUsed: 50,
          chunksUsed: 0,
          snippetReadTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    // Retry on file system errors
    return error.error.includes('ENOENT') || 
           error.error.includes('EACCES') || 
           error.error.includes('EMFILE');
  }

  getBudgetCost(): Partial<PipelineContext['budget']> {
    return {
      tokens: 200, // Estimated tokens for code snippets
      chunks: 2
    };
  }

  private async readSnippets(context: PipelineContext): Promise<SnippetData> {
    const startTime = Date.now();
    const snippets: CodeSnippet[] = [];

    try {
      // Determine which files to read based on the request
      const filesToRead = await this.determineFilesToRead(context);

      this.logger.debug('Reading code snippets', {
        requestId: context.requestId,
        filesToRead: filesToRead.length
      });

      // Read and analyze each file
      for (const filePath of filesToRead) {
        try {
          const snippet = await this.readAndAnalyzeFile(filePath, context);
          if (snippet) {
            snippets.push(snippet);
          }
        } catch (error) {
          this.logger.warn('Failed to read file', {
            requestId: context.requestId,
            filePath,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue with other files
        }
      }

      const readTime = Date.now() - startTime;

      return {
        snippets,
        totalSnippets: snippets.length,
        readTime
      };

    } catch (error) {
      const readTime = Date.now() - startTime;
      
      return {
        snippets: [],
        totalSnippets: 0,
        readTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async determineFilesToRead(context: PipelineContext): Promise<string[]> {
    const toolName = context.toolName;
    const requestData = context.data;
    const repoFacts = context.data.repoFacts;
    const scope = context.scope;

    const filesToRead: string[] = [];

    switch (toolName) {
      case 'localmcp.create':
        filesToRead.push(...await this.getFilesForCreate(requestData, repoFacts, scope));
        break;
      case 'localmcp.analyze':
        filesToRead.push(...await this.getFilesForAnalyze(requestData, repoFacts, scope));
        break;
      case 'localmcp.fix':
        filesToRead.push(...await this.getFilesForFix(requestData, repoFacts, scope));
        break;
      case 'localmcp.learn':
        filesToRead.push(...await this.getFilesForLearn(requestData, repoFacts, scope));
        break;
      default:
        filesToRead.push(...await this.getFilesForGeneric(requestData, repoFacts, scope));
    }

    // Limit files based on budget
    const maxFiles = Math.min(filesToRead.length, context.budget.files);
    return filesToRead.slice(0, maxFiles);
  }

  private async getFilesForCreate(requestData: any, repoFacts: any, scope: any): Promise<string[]> {
    const files: string[] = [];
    const targetPath = requestData.targetPath || '.';
    const framework = repoFacts?.framework || 'unknown';

    // Look for existing components or similar files
    const commonPaths = [
      'src/components',
      'src/pages',
      'src/views',
      'components',
      'pages',
      'views'
    ];

    for (const path of commonPaths) {
      try {
        const fullPath = join(targetPath, path);
        if (await this.fileExists(fullPath)) {
          const filesInDir = await this.getFilesInDirectory(fullPath, scope.allowedFileTypes);
          files.push(...filesInDir.slice(0, 2)); // Limit to 2 files per directory
        }
      } catch (error) {
        // Directory doesn't exist, continue
      }
    }

    return files;
  }

  private async getFilesForAnalyze(requestData: any, repoFacts: any, scope: any): Promise<string[]> {
    const files: string[] = [];
    const path = requestData.path || '.';

    try {
      if (await this.fileExists(path)) {
        const stat = await this.getFileStat(path);
        if (stat.isDirectory()) {
          const filesInDir = await this.getFilesInDirectory(path, scope.allowedFileTypes);
          files.push(...filesInDir.slice(0, scope.maxFiles));
        } else {
          files.push(path);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to analyze path', { path, error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return files;
  }

  private async getFilesForFix(requestData: any, repoFacts: any, scope: any): Promise<string[]> {
    const files: string[] = [];
    const filePath = requestData.filePath;

    if (filePath && await this.fileExists(filePath)) {
      files.push(filePath);
    }

    // Look for related files (e.g., test files, similar components)
    if (filePath) {
      const relatedFiles = await this.findRelatedFiles(filePath, scope);
      files.push(...relatedFiles);
    }

    return files;
  }

  private async getFilesForLearn(requestData: any, repoFacts: any, scope: any): Promise<string[]> {
    const files: string[] = [];
    const context = requestData.context || '';

    // Extract file paths from context
    const filePathRegex = /(?:file:\/\/|\.\/|\/)[^\s]+\.(ts|js|tsx|jsx|html|css|md)/gi;
    const matches = context.match(filePathRegex) || [];

    for (const match of matches) {
      const filePath = match.replace('file://', '');
      if (await this.fileExists(filePath)) {
        files.push(filePath);
      }
    }

    return files;
  }

  private async getFilesForGeneric(requestData: any, repoFacts: any, scope: any): Promise<string[]> {
    const files: string[] = [];

    // Look for main entry points
    const entryPoints = [
      'src/index.ts',
      'src/index.js',
      'src/main.ts',
      'src/main.js',
      'index.ts',
      'index.js',
      'app.ts',
      'app.js'
    ];

    for (const entryPoint of entryPoints) {
      if (await this.fileExists(entryPoint)) {
        files.push(entryPoint);
        break; // Only take the first found entry point
      }
    }

    return files;
  }

  private async readAndAnalyzeFile(filePath: string, context: PipelineContext): Promise<CodeSnippet | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);
      const type = this.detectType(content, language);
      const metadata = this.analyzeMetadata(content, language);

      // Limit content based on scope
      const maxLines = context.scope.maxLinesPerFile;
      const lines = content.split('\n');
      const limitedContent = lines.slice(0, maxLines).join('\n');

      return {
        filePath,
        content: limitedContent,
        startLine: 1,
        endLine: Math.min(lines.length, maxLines),
        language,
        type,
        metadata
      };

    } catch (error) {
      this.logger.warn('Failed to read file', {
        requestId: context.requestId,
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private detectLanguage(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml'
    };

    return languageMap[ext] || 'text';
  }

  private detectType(content: string, language: string): CodeSnippet['type'] {
    const lines = content.split('\n');
    
    // Look for function definitions
    if (lines.some(line => line.includes('function ') || line.includes('const ') && line.includes('=') && line.includes('('))) {
      return 'function';
    }
    
    // Look for class definitions
    if (lines.some(line => line.includes('class '))) {
      return 'class';
    }
    
    // Look for React components
    if (language === 'typescript' || language === 'javascript') {
      if (lines.some(line => line.includes('React.FC') || line.includes('function ') && line.includes('(') && line.includes(')'))) {
        return 'component';
      }
    }
    
    // Look for interfaces
    if (language === 'typescript' && lines.some(line => line.includes('interface '))) {
      return 'interface';
    }
    
    // Look for type definitions
    if (language === 'typescript' && lines.some(line => line.includes('type '))) {
      return 'type';
    }
    
    // Look for config files
    if (lines.some(line => line.includes('module.exports') || line.includes('export default'))) {
      return 'config';
    }
    
    // Look for test files
    if (lines.some(line => line.includes('describe(') || line.includes('test(') || line.includes('it('))) {
      return 'test';
    }
    
    return 'unknown';
  }

  private analyzeMetadata(content: string, language: string): CodeSnippet['metadata'] {
    const lines = content.split('\n');
    const size = content.length;
    
    // Calculate complexity (simple heuristic)
    const complexity = this.calculateComplexity(lines);
    
    // Extract dependencies
    const dependencies = this.extractDependencies(content, language);
    
    // Extract exports
    const exports = this.extractExports(content, language);
    
    // Extract imports
    const imports = this.extractImports(content, language);

    return {
      size,
      complexity,
      dependencies,
      exports,
      imports
    };
  }

  private calculateComplexity(lines: string[]): 'low' | 'medium' | 'high' {
    let complexity = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Count control structures
      if (trimmed.includes('if ') || trimmed.includes('else')) complexity++;
      if (trimmed.includes('for ') || trimmed.includes('while ')) complexity++;
      if (trimmed.includes('switch ') || trimmed.includes('case ')) complexity++;
      if (trimmed.includes('try ') || trimmed.includes('catch ')) complexity++;
      if (trimmed.includes('&&') || trimmed.includes('||')) complexity++;
    }
    
    if (complexity < 5) return 'low';
    if (complexity < 15) return 'medium';
    return 'high';
  }

  private extractDependencies(content: string, language: string): string[] {
    const dependencies: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Extract from import statements
      const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) dependencies.push(match[1]);
      }
      
      // Extract from require statements
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        if (match[1]) dependencies.push(match[1]);
      }
    }
    
    return dependencies;
  }

  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Extract from export statements
      const exportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
      let match;
      while ((match = exportRegex.exec(content)) !== null) {
        if (match[1]) exports.push(match[1]);
      }
    }
    
    return exports;
  }

  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Extract from import statements
      const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) imports.push(match[1]);
      }
    }
    
    return imports;
  }

  private async findRelatedFiles(filePath: string, scope: any): Promise<string[]> {
    const relatedFiles: string[] = [];
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    const baseName = basename(filePath, extname(filePath));

    try {
      const files = await this.getFilesInDirectory(dir, scope.allowedFileTypes);
      
      // Look for files with similar names
      for (const file of files) {
        const fileName = basename(file, extname(file));
        if (fileName.includes(baseName) || baseName.includes(fileName)) {
          relatedFiles.push(file);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return relatedFiles.slice(0, 2); // Limit to 2 related files
  }

  private async getFilesInDirectory(dir: string, allowedTypes: string[]): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = await this.getFileStat(fullPath);
        
        if (stat.isFile()) {
          const ext = extname(entry).toLowerCase();
          if (allowedTypes.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    
    return files;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async getFileStat(path: string) {
    return await stat(path);
  }

  private estimateTokens(snippetData: SnippetData): number {
    const content = snippetData.snippets.map(s => s.content).join(' ');
    return Math.ceil(content.length / 4); // Rough estimation: 1 token ≈ 4 characters
  }
}
