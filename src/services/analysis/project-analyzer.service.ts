/**
 * Project Analyzer Service
 * 
 * Analyzes the current project to extract repo facts and relevant code snippets
 * for context enhancement. This service provides the actual data that was missing
 * from the enhance tool response.
 * 
 * Benefits for vibe coders:
 * - Real project context in AI responses
 * - Relevant code examples from your codebase
 * - Better understanding of project structure and patterns
 * - Contextual suggestions based on existing code
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../logger/logger.js';

export interface RepoFact {
  type: 'framework' | 'architecture' | 'pattern' | 'dependency' | 'structure';
  fact: string;
  confidence: number;
  source: string;
}

export interface CodeSnippet {
  file: string;
  content: string;
  language: string;
  relevance: number;
  description: string;
}

export interface ProjectAnalysis {
  repoFacts: RepoFact[];
  codeSnippets: CodeSnippet[];
  projectType: string;
  mainFrameworks: string[];
  architecture: string;
}

export class ProjectAnalyzerService {
  private logger: Logger;
  private projectRoot: string;

  constructor(logger: Logger, projectRoot: string = process.cwd()) {
    this.logger = logger;
    this.projectRoot = projectRoot;
  }

  /**
   * Analyze the project and return comprehensive facts and snippets
   */
  async analyzeProject(): Promise<RepoFact[]> {
    try {
      console.log('🔍 [ProjectAnalyzer] Starting comprehensive project analysis', { projectRoot: this.projectRoot });
      this.logger.info('Starting comprehensive project analysis', { projectRoot: this.projectRoot });

      const repoFacts: RepoFact[] = [];

      // 1. Analyze package.json for dependencies and project info
      console.log('🔍 [ProjectAnalyzer] Analyzing package.json...');
      const packageFacts = await this.analyzePackageJson();
      console.log('🔍 [ProjectAnalyzer] Package facts found:', packageFacts.length);
      repoFacts.push(...packageFacts);

      // 2. Analyze project structure
      console.log('🔍 [ProjectAnalyzer] Analyzing project structure...');
      const structureFacts = await this.analyzeProjectStructure();
      console.log('🔍 [ProjectAnalyzer] Structure facts found:', structureFacts.length);
      repoFacts.push(...structureFacts);

      // 3. Analyze framework usage
      console.log('🔍 [ProjectAnalyzer] Analyzing framework usage...');
      const frameworkFacts = await this.analyzeFrameworkUsage();
      console.log('🔍 [ProjectAnalyzer] Framework facts found:', frameworkFacts.length);
      repoFacts.push(...frameworkFacts);

      // 4. Analyze architecture patterns
      console.log('🔍 [ProjectAnalyzer] Analyzing architecture patterns...');
      const architectureFacts = await this.analyzeArchitecturePatterns();
      console.log('🔍 [ProjectAnalyzer] Architecture facts found:', architectureFacts.length);
      repoFacts.push(...architectureFacts);

      console.log('✅ [ProjectAnalyzer] Project analysis completed', { 
        factsCount: repoFacts.length,
        factTypes: [...new Set(repoFacts.map(f => f.type))]
      });

      this.logger.info('Project analysis completed', { 
        factsCount: repoFacts.length,
        factTypes: [...new Set(repoFacts.map(f => f.type))]
      });

      return repoFacts;

    } catch (error) {
      console.error('❌ [ProjectAnalyzer] Project analysis failed', error);
      this.logger.error('Project analysis failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return [];
    }
  }

  /**
   * Find relevant code snippets based on prompt
   */
  async findRelevantCodeSnippets(prompt: string, targetFile?: string): Promise<CodeSnippet[]> {
    try {
      console.log('🔍 [ProjectAnalyzer] Finding relevant code snippets', { prompt: prompt.substring(0, 100) + '...', targetFile });
      this.logger.info('Finding relevant code snippets', { prompt: prompt.substring(0, 100) + '...', targetFile });

      const snippets: CodeSnippet[] = [];

      // If target file is specified, analyze that file
      if (targetFile) {
        console.log('🔍 [ProjectAnalyzer] Analyzing target file:', targetFile);
        const fileSnippets = await this.analyzeFileForSnippets(targetFile, prompt);
        console.log('🔍 [ProjectAnalyzer] Target file snippets found:', fileSnippets.length);
        snippets.push(...fileSnippets);
      }

      // Analyze common source directories
      const sourceDirs = ['src', 'lib', 'app', 'components', 'pages', 'utils'];
      console.log('🔍 [ProjectAnalyzer] Analyzing source directories:', sourceDirs);
      for (const dir of sourceDirs) {
        const dirPath = path.join(this.projectRoot, dir);
        if (await this.directoryExists(dirPath)) {
          console.log('🔍 [ProjectAnalyzer] Analyzing directory:', dirPath);
          const dirSnippets = await this.analyzeDirectoryForSnippets(dirPath, prompt);
          console.log('🔍 [ProjectAnalyzer] Directory snippets found:', dirSnippets.length);
          snippets.push(...dirSnippets);
        } else {
          console.log('🔍 [ProjectAnalyzer] Directory does not exist:', dirPath);
        }
      }

      // Sort by relevance and return top snippets
      const sortedSnippets = snippets
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 10); // Limit to top 10 snippets

      console.log('✅ [ProjectAnalyzer] Code snippet analysis completed', { 
        totalSnippets: snippets.length,
        returnedSnippets: sortedSnippets.length
      });

      this.logger.info('Code snippet analysis completed', { 
        totalSnippets: snippets.length,
        returnedSnippets: sortedSnippets.length
      });

      return sortedSnippets;

    } catch (error) {
      console.error('❌ [ProjectAnalyzer] Code snippet analysis failed', error);
      this.logger.error('Code snippet analysis failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return [];
    }
  }

  /**
   * Analyze package.json for project facts
   */
  private async analyzePackageJson(): Promise<RepoFact[]> {
    const facts: RepoFact[] = [];

    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // Project name and description
      if (packageJson.name) {
        facts.push({
          type: 'structure',
          fact: `Project name: ${packageJson.name}`,
          confidence: 1.0,
          source: 'package.json'
        });
      }

      if (packageJson.description) {
        facts.push({
          type: 'structure',
          fact: `Project description: ${packageJson.description}`,
          confidence: 1.0,
          source: 'package.json'
        });
      }

      // Main dependencies
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      const allDeps = { ...dependencies, ...devDependencies };

      // Framework detection
      const frameworks = this.detectFrameworksFromDependencies(allDeps);
      for (const framework of frameworks) {
        facts.push({
          type: 'framework',
          fact: `Uses ${framework.name} framework (${framework.version})`,
          confidence: framework.confidence,
          source: 'package.json'
        });
      }

      // Project type detection
      const projectType = this.detectProjectType(packageJson);
      if (projectType) {
        facts.push({
          type: 'architecture',
          fact: `Project type: ${projectType}`,
          confidence: 0.9,
          source: 'package.json'
        });
      }

      // Scripts analysis
      if (packageJson.scripts) {
        const scriptFacts = this.analyzeScripts(packageJson.scripts);
        facts.push(...scriptFacts);
      }

    } catch (error) {
      this.logger.warn('Failed to analyze package.json', { error });
    }

    return facts;
  }

  /**
   * Analyze project structure
   */
  private async analyzeProjectStructure(): Promise<RepoFact[]> {
    const facts: RepoFact[] = [];

    try {
      const entries = await fs.readdir(this.projectRoot, { withFileTypes: true });

      // Check for common project files
      const commonFiles = ['README.md', 'LICENSE', 'Dockerfile', 'docker-compose.yml', '.gitignore'];
      for (const file of commonFiles) {
        if (entries.some(entry => entry.name === file)) {
          facts.push({
            type: 'structure',
            fact: `Contains ${file}`,
            confidence: 1.0,
            source: 'file-system'
          });
        }
      }

      // Check for source directories
      const sourceDirs = ['src', 'lib', 'app', 'components', 'pages', 'utils', 'services'];
      const foundDirs = entries
        .filter(entry => entry.isDirectory() && sourceDirs.includes(entry.name))
        .map(entry => entry.name);

      if (foundDirs.length > 0) {
        facts.push({
          type: 'structure',
          fact: `Source directories: ${foundDirs.join(', ')}`,
          confidence: 0.9,
          source: 'file-system'
        });
      }

      // Check for config files
      const configFiles = ['tsconfig.json', 'jest.config.js', 'webpack.config.js', 'vite.config.js', 'next.config.js'];
      const foundConfigs = entries
        .filter(entry => entry.isFile() && configFiles.includes(entry.name))
        .map(entry => entry.name);

      if (foundConfigs.length > 0) {
        facts.push({
          type: 'structure',
          fact: `Configuration files: ${foundConfigs.join(', ')}`,
          confidence: 0.8,
          source: 'file-system'
        });
      }

    } catch (error) {
      this.logger.warn('Failed to analyze project structure', { error });
    }

    return facts;
  }

  /**
   * Analyze framework usage patterns
   */
  private async analyzeFrameworkUsage(): Promise<RepoFact[]> {
    const facts: RepoFact[] = [];

    try {
      // Check for TypeScript usage
      const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
      if (await this.fileExists(tsConfigPath)) {
        facts.push({
          type: 'framework',
          fact: 'Uses TypeScript for type safety',
          confidence: 1.0,
          source: 'tsconfig.json'
        });
      }

      // Check for React usage
      const reactFiles = await this.findFilesByPattern('**/*.{tsx,jsx}');
      if (reactFiles.length > 0) {
        facts.push({
          type: 'framework',
          fact: `Uses React with ${reactFiles.length} component files`,
          confidence: 0.9,
          source: 'file-analysis'
        });
      }

      // Check for Node.js/Express usage
      const serverFiles = await this.findFilesByPattern('**/server.{js,ts}');
      const appFiles = await this.findFilesByPattern('**/app.{js,ts}');
      if (serverFiles.length > 0 || appFiles.length > 0) {
        facts.push({
          type: 'framework',
          fact: 'Uses Node.js/Express for backend',
          confidence: 0.8,
          source: 'file-analysis'
        });
      }

      // Check for testing setup
      const testFiles = await this.findFilesByPattern('**/*.{test,spec}.{js,ts,tsx}');
      if (testFiles.length > 0) {
        facts.push({
          type: 'pattern',
          fact: `Uses testing with ${testFiles.length} test files`,
          confidence: 0.9,
          source: 'file-analysis'
        });
      }

    } catch (error) {
      this.logger.warn('Failed to analyze framework usage', { error });
    }

    return facts;
  }

  /**
   * Analyze architecture patterns
   */
  private async analyzeArchitecturePatterns(): Promise<RepoFact[]> {
    const facts: RepoFact[] = [];

    try {
      // Check for MCP (Model Context Protocol) usage
      const mcpFiles = await this.findFilesByPattern('**/*mcp*');
      if (mcpFiles.length > 0) {
        facts.push({
          type: 'architecture',
          fact: 'Uses Model Context Protocol (MCP) for AI integration',
          confidence: 0.9,
          source: 'file-analysis'
        });
      }

      // Check for service-oriented architecture
      const serviceFiles = await this.findFilesByPattern('**/services/**/*.{js,ts}');
      if (serviceFiles.length > 0) {
        facts.push({
          type: 'architecture',
          fact: `Uses service-oriented architecture with ${serviceFiles.length} service files`,
          confidence: 0.8,
          source: 'file-analysis'
        });
      }

      // Check for tool-based architecture
      const toolFiles = await this.findFilesByPattern('**/tools/**/*.{js,ts}');
      if (toolFiles.length > 0) {
        facts.push({
          type: 'architecture',
          fact: `Uses tool-based architecture with ${toolFiles.length} tool files`,
          confidence: 0.8,
          source: 'file-analysis'
        });
      }

      // Check for Docker usage
      const dockerFiles = await this.findFilesByPattern('**/Dockerfile*');
      if (dockerFiles.length > 0) {
        facts.push({
          type: 'architecture',
          fact: 'Uses Docker for containerization',
          confidence: 1.0,
          source: 'file-analysis'
        });
      }

    } catch (error) {
      this.logger.warn('Failed to analyze architecture patterns', { error });
    }

    return facts;
  }

  /**
   * Analyze a specific file for code snippets
   */
  private async analyzeFileForSnippets(filePath: string, prompt: string): Promise<CodeSnippet[]> {
    const snippets: CodeSnippet[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);
      
      // Extract relevant code blocks
      const codeBlocks = this.extractCodeBlocks(content, prompt);
      
      for (const block of codeBlocks) {
        snippets.push({
          file: path.relative(this.projectRoot, filePath),
          content: block.content,
          language,
          relevance: block.relevance,
          description: block.description
        });
      }

    } catch (error) {
      this.logger.warn('Failed to analyze file for snippets', { filePath, error });
    }

    return snippets;
  }

  /**
   * Analyze directory for code snippets
   */
  private async analyzeDirectoryForSnippets(dirPath: string, prompt: string): Promise<CodeSnippet[]> {
    const snippets: CodeSnippet[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively analyze subdirectories (limit depth)
          const subSnippets = await this.analyzeDirectoryForSnippets(fullPath, prompt);
          snippets.push(...subSnippets);
        } else if (this.isCodeFile(entry.name)) {
          const fileSnippets = await this.analyzeFileForSnippets(fullPath, prompt);
          snippets.push(...fileSnippets);
        }
      }

    } catch (error) {
      this.logger.warn('Failed to analyze directory for snippets', { dirPath, error });
    }

    return snippets;
  }

  /**
   * Extract code blocks from content based on prompt relevance
   */
  private extractCodeBlocks(content: string, prompt: string): Array<{ content: string; relevance: number; description: string }> {
    const blocks: Array<{ content: string; relevance: number; description: string }> = [];
    const lines = content.split('\n');
    
    // Extract function definitions
    const functionRegex = /(?:function|const|let|var)\s+\w+\s*[=\(]/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length - 1;
      const endLine = this.findFunctionEnd(lines, startLine);
      
      if (endLine > startLine) {
        const functionContent = lines.slice(startLine, endLine + 1).join('\n');
        const relevance = this.calculateRelevance(functionContent, prompt);
        
        if (relevance > 0.3) {
          blocks.push({
            content: functionContent,
            relevance,
            description: `Function definition: ${this.extractFunctionName(functionContent)}`
          });
        }
      }
    }

    // Extract class definitions
    const classRegex = /class\s+\w+/g;
    while ((match = classRegex.exec(content)) !== null) {
      const startLine = content.substring(0, match.index).split('\n').length - 1;
      const endLine = this.findClassEnd(lines, startLine);
      
      if (endLine > startLine) {
        const classContent = lines.slice(startLine, endLine + 1).join('\n');
        const relevance = this.calculateRelevance(classContent, prompt);
        
        if (relevance > 0.3) {
          blocks.push({
            content: classContent,
            relevance,
            description: `Class definition: ${this.extractClassName(classContent)}`
          });
        }
      }
    }

    return blocks;
  }

  /**
   * Calculate relevance score between content and prompt
   */
  private calculateRelevance(content: string, prompt: string): number {
    const contentLower = content.toLowerCase();
    const promptLower = prompt.toLowerCase();
    
    // Extract keywords from prompt
    const promptWords = promptLower.split(/\s+/).filter(word => word.length > 3);
    
    // Count matches
    let matches = 0;
    for (const word of promptWords) {
      if (contentLower.includes(word)) {
        matches++;
      }
    }
    
    return Math.min(1, matches / promptWords.length);
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown'
    };
    
    return languageMap[ext] || 'text';
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.php', '.rb', '.cs', '.cpp', '.c', '.html', '.css', '.scss'];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Find function end line
   */
  private findFunctionEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      if (line && line.includes('{')) {
        braceCount++;
        inFunction = true;
      }
      
      if (line && line.includes('}')) {
        braceCount--;
      }
      
      if (inFunction && braceCount === 0) {
        return i;
      }
    }
    
    return startLine;
  }

  /**
   * Find class end line
   */
  private findClassEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let inClass = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      if (line && line.includes('{')) {
        braceCount++;
        inClass = true;
      }
      
      if (line && line.includes('}')) {
        braceCount--;
      }
      
      if (inClass && braceCount === 0) {
        return i;
      }
    }
    
    return startLine;
  }

  /**
   * Extract function name from content
   */
  private extractFunctionName(content: string): string {
    const match = content.match(/(?:function|const|let|var)\s+(\w+)/);
    return match?.[1] || 'anonymous';
  }

  /**
   * Extract class name from content
   */
  private extractClassName(content: string): string {
    const match = content.match(/class\s+(\w+)/);
    return match?.[1] || 'Unknown';
  }

  /**
   * Detect frameworks from dependencies
   */
  private detectFrameworksFromDependencies(dependencies: Record<string, string>): Array<{ name: string; version: string; confidence: number }> {
    const frameworks: Array<{ name: string; version: string; confidence: number }> = [];
    
    const frameworkMap: Record<string, { name: string; confidence: number }> = {
      'react': { name: 'React', confidence: 0.9 },
      'vue': { name: 'Vue.js', confidence: 0.9 },
      'angular': { name: 'Angular', confidence: 0.9 },
      'next': { name: 'Next.js', confidence: 0.9 },
      'nuxt': { name: 'Nuxt.js', confidence: 0.9 },
      'svelte': { name: 'Svelte', confidence: 0.9 },
      'express': { name: 'Express.js', confidence: 0.9 },
      'fastapi': { name: 'FastAPI', confidence: 0.9 },
      'django': { name: 'Django', confidence: 0.9 },
      'spring': { name: 'Spring', confidence: 0.9 },
      'laravel': { name: 'Laravel', confidence: 0.9 },
      'rails': { name: 'Ruby on Rails', confidence: 0.9 },
      'typescript': { name: 'TypeScript', confidence: 0.8 },
      'jest': { name: 'Jest', confidence: 0.8 },
      'vitest': { name: 'Vitest', confidence: 0.8 },
      'playwright': { name: 'Playwright', confidence: 0.8 },
      'docker': { name: 'Docker', confidence: 0.8 }
    };
    
    for (const [dep, version] of Object.entries(dependencies)) {
      const framework = frameworkMap[dep];
      if (framework) {
        frameworks.push({
          name: framework.name,
          version,
          confidence: framework.confidence
        });
      }
    }
    
    return frameworks;
  }

  /**
   * Detect project type from package.json
   */
  private detectProjectType(packageJson: any): string | null {
    if (packageJson.scripts?.build && packageJson.scripts?.start) {
      return 'Full-stack application';
    }
    
    if (packageJson.scripts?.build) {
      return 'Frontend application';
    }
    
    if (packageJson.scripts?.start && !packageJson.scripts?.build) {
      return 'Backend application';
    }
    
    if (packageJson.main || packageJson.module) {
      return 'Library/package';
    }
    
    return null;
  }

  /**
   * Analyze npm scripts
   */
  private analyzeScripts(scripts: Record<string, string>): RepoFact[] {
    const facts: RepoFact[] = [];
    
    if (scripts.test) {
      facts.push({
        type: 'pattern',
        fact: 'Has testing setup',
        confidence: 0.9,
        source: 'package.json'
      });
    }
    
    if (scripts.build) {
      facts.push({
        type: 'pattern',
        fact: 'Has build process',
        confidence: 0.9,
        source: 'package.json'
      });
    }
    
    if (scripts.dev || scripts.development) {
      facts.push({
        type: 'pattern',
        fact: 'Has development server',
        confidence: 0.9,
        source: 'package.json'
      });
    }
    
    return facts;
  }

  /**
   * Find files by pattern
   */
  private async findFilesByPattern(pattern: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const glob = await import('glob');
      const matches = await glob.glob(pattern, { cwd: this.projectRoot });
      files.push(...matches);
    } catch (error) {
      // Fallback to simple directory traversal
      await this.findFilesRecursively(this.projectRoot, pattern, files);
    }
    
    return files;
  }

  /**
   * Find files recursively (fallback)
   */
  private async findFilesRecursively(dir: string, pattern: string, files: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await this.findFilesRecursively(fullPath, pattern, files);
        } else if (this.matchesPattern(entry.name, pattern)) {
          files.push(path.relative(this.projectRoot, fullPath));
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Check if filename matches pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    // Simple pattern matching - can be enhanced
    if (pattern.includes('**/*')) {
      const ext = pattern.split('.').pop();
      return filename.endsWith('.' + ext);
    }
    
    return filename.includes(pattern);
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
