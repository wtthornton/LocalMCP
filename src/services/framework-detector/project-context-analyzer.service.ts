/**
 * Project Context Analyzer Service
 * 
 * Analyzes project structure, dependencies, and files to provide
 * context for framework detection instead of relying on hardcoded mappings.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectContext } from './framework-detector.types';

export interface ProjectAnalysisResult {
  dependencies: Record<string, string>;
  fileStructure: string[];
  frameworkFiles: string[];
  suggestedFrameworks: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  projectType: 'frontend' | 'backend' | 'fullstack' | 'library' | 'unknown';
  confidence: number;
}

export class ProjectContextAnalyzer {
  private logger: any; // Will be injected

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Analyze project context from a given path
   */
  async analyzeProjectContext(projectPath: string): Promise<ProjectContext> {
    try {
      this.logger.info('Starting project context analysis', { projectPath });

      // 1. Read package.json for dependencies
      const dependencies = await this.getDependencies(projectPath);
      
      // 2. Analyze file structure
      const fileStructure = await this.analyzeFileStructure(projectPath);
      
      // 3. Check for framework-specific files
      const frameworkFiles = await this.detectFrameworkFiles(projectPath);
      
      // 4. Suggest frameworks based on analysis
      const suggestedFrameworks = this.suggestFrameworks(dependencies, fileStructure, frameworkFiles);

      const result: ProjectContext = {
        dependencies,
        fileStructure,
        frameworkFiles,
        suggestedFrameworks
      };

      this.logger.info('Project context analysis completed', {
        dependenciesCount: Object.keys(dependencies).length,
        fileStructureCount: fileStructure.length,
        frameworkFilesCount: frameworkFiles.length,
        suggestedFrameworksCount: suggestedFrameworks.length
      });

      return result;
    } catch (error) {
      this.logger.error('Project context analysis failed', { error, projectPath });
      throw new Error(`Failed to analyze project context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get dependencies from package.json
   */
  private async getDependencies(projectPath: string): Promise<Record<string, string>> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      
      return {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {},
        ...packageJson.peerDependencies || {}
      };
    } catch (error) {
      this.logger.warn('Could not read package.json', { error, projectPath });
      return {};
    }
  }

  /**
   * Analyze file structure
   */
  private async analyzeFileStructure(projectPath: string): Promise<string[]> {
    try {
      const files: string[] = [];
      await this.scanDirectory(projectPath, files, 0, 3); // Max depth 3
      return files;
    } catch (error) {
      this.logger.warn('Could not analyze file structure', { error, projectPath });
      return [];
    }
  }

  /**
   * Recursively scan directory
   */
  private async scanDirectory(dirPath: string, files: string[], depth: number, maxDepth: number): Promise<void> {
    if (depth >= maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common directories that don't contain source code
          if (!this.shouldSkipDirectory(entry.name)) {
            await this.scanDirectory(fullPath, files, depth + 1, maxDepth);
          }
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  /**
   * Check if directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      'node_modules', '.git', '.next', '.nuxt', 'dist', 'build', 'out',
      '.vscode', '.idea', 'coverage', '.nyc_output', 'logs', 'tmp'
    ];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * Detect framework-specific files
   */
  private async detectFrameworkFiles(projectPath: string): Promise<string[]> {
    const frameworkFiles: string[] = [];
    
    const frameworkPatterns = {
      'react': ['src/**/*.jsx', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.ts'],
      'vue': ['src/**/*.vue', 'src/**/*.js', 'src/**/*.ts'],
      'angular': ['src/**/*.component.ts', 'src/**/*.service.ts', 'src/**/*.module.ts'],
      'nextjs': ['pages/**/*.js', 'pages/**/*.tsx', 'pages/**/*.ts', 'app/**/*.js', 'app/**/*.tsx'],
      'nuxt': ['pages/**/*.vue', 'components/**/*.vue', 'layouts/**/*.vue'],
      'svelte': ['src/**/*.svelte'],
      'express': ['routes/**/*.js', 'routes/**/*.ts', 'app.js', 'server.js'],
      'fastapi': ['main.py', 'app.py', '**/*.py'],
      'django': ['manage.py', '**/models.py', '**/views.py'],
      'spring': ['src/**/*.java', 'pom.xml', 'build.gradle'],
      'laravel': ['app/**/*.php', 'routes/**/*.php', 'artisan'],
      'rails': ['app/**/*.rb', 'config/**/*.rb', 'Gemfile']
    };

    for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
      for (const pattern of patterns) {
        try {
          const files = await this.findFilesByPattern(projectPath, pattern);
          if (files.length > 0) {
            frameworkFiles.push(...files);
          }
        } catch (error) {
          // Skip patterns that fail
        }
      }
    }

    return [...new Set(frameworkFiles)]; // Remove duplicates
  }

  /**
   * Find files by pattern (simplified glob matching)
   */
  private async findFilesByPattern(projectPath: string, pattern: string): Promise<string[]> {
    const files: string[] = [];
    const parts = pattern.split('/');
    
    try {
      await this.findFilesRecursive(projectPath, parts, 0, files);
    } catch (error) {
      // Pattern matching failed
    }
    
    return files;
  }

  /**
   * Recursively find files matching pattern
   */
  private async findFilesRecursive(
    currentPath: string, 
    patternParts: string[], 
    partIndex: number, 
    files: string[]
  ): Promise<void> {
    if (partIndex >= patternParts.length) return;

    const currentPart = patternParts[partIndex];
    
    if (currentPart === '**') {
      // Match any directory
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await this.findFilesRecursive(
            path.join(currentPath, entry.name), 
            patternParts, 
            partIndex, 
            files
          );
        }
      }
    } else if (currentPart.includes('*')) {
      // Simple wildcard matching
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const regex = new RegExp(currentPart.replace(/\*/g, '.*'));
      
      for (const entry of entries) {
        if (regex.test(entry.name)) {
          if (entry.isDirectory() && partIndex < patternParts.length - 1) {
            await this.findFilesRecursive(
              path.join(currentPath, entry.name), 
              patternParts, 
              partIndex + 1, 
              files
            );
          } else if (entry.isFile() && partIndex === patternParts.length - 1) {
            files.push(path.join(currentPath, entry.name));
          }
        }
      }
    } else {
      // Exact match
      const targetPath = path.join(currentPath, currentPart);
      try {
        const stat = await fs.stat(targetPath);
        if (stat.isDirectory() && partIndex < patternParts.length - 1) {
          await this.findFilesRecursive(targetPath, patternParts, partIndex + 1, files);
        } else if (stat.isFile() && partIndex === patternParts.length - 1) {
          files.push(targetPath);
        }
      } catch (error) {
        // File/directory doesn't exist
      }
    }
  }

  /**
   * Suggest frameworks based on analysis
   */
  private suggestFrameworks(
    dependencies: Record<string, string>,
    fileStructure: string[],
    frameworkFiles: string[]
  ): string[] {
    const suggestions: string[] = [];
    
    // Analyze dependencies
    for (const [name, version] of Object.entries(dependencies)) {
      const framework = this.mapDependencyToFramework(name);
      if (framework && !suggestions.includes(framework)) {
        suggestions.push(framework);
      }
    }
    
    // Analyze file structure
    for (const file of fileStructure) {
      const framework = this.mapFileToFramework(file);
      if (framework && !suggestions.includes(framework)) {
        suggestions.push(framework);
      }
    }
    
    // Analyze framework files
    for (const file of frameworkFiles) {
      const framework = this.mapFileToFramework(file);
      if (framework && !suggestions.includes(framework)) {
        suggestions.push(framework);
      }
    }
    
    return suggestions;
  }

  /**
   * Map dependency name to framework
   */
  private mapDependencyToFramework(dependencyName: string): string | null {
    const dependencyMap: Record<string, string> = {
      'react': 'react',
      'vue': 'vue',
      'angular': 'angular',
      'next': 'nextjs',
      'nuxt': 'nuxt',
      'svelte': 'svelte',
      'express': 'express',
      'fastapi': 'fastapi',
      'django': 'django',
      'spring-boot': 'spring',
      'laravel': 'laravel',
      'rails': 'rails',
      'typescript': 'typescript',
      'tailwindcss': 'tailwind',
      'bootstrap': 'bootstrap'
    };
    
    return dependencyMap[dependencyName] || null;
  }

  /**
   * Map file path to framework
   */
  private mapFileToFramework(filePath: string): string | null {
    const fileMap: Record<string, string> = {
      '.jsx': 'react',
      '.tsx': 'react',
      '.vue': 'vue',
      '.component.ts': 'angular',
      '.service.ts': 'angular',
      '.module.ts': 'angular',
      'pages/': 'nextjs',
      'app/': 'nextjs',
      'components/': 'vue',
      'layouts/': 'nuxt',
      '.svelte': 'svelte',
      'routes/': 'express',
      'main.py': 'fastapi',
      'app.py': 'fastapi',
      'manage.py': 'django',
      'pom.xml': 'spring',
      'build.gradle': 'spring',
      'artisan': 'laravel',
      'Gemfile': 'rails'
    };
    
    for (const [pattern, framework] of Object.entries(fileMap)) {
      if (filePath.includes(pattern)) {
        return framework;
      }
    }
    
    return null;
  }

  /**
   * Get comprehensive project analysis
   */
  async getComprehensiveAnalysis(projectPath: string): Promise<ProjectAnalysisResult> {
    const context = await this.analyzeProjectContext(projectPath);
    
    return {
      dependencies: context.dependencies,
      fileStructure: context.fileStructure,
      frameworkFiles: context.frameworkFiles,
      suggestedFrameworks: context.suggestedFrameworks,
      packageManager: await this.detectPackageManager(projectPath),
      projectType: this.detectProjectType(context),
      confidence: this.calculateConfidence(context)
    };
  }

  /**
   * Detect package manager
   */
  private async detectPackageManager(projectPath: string): Promise<'npm' | 'yarn' | 'pnpm' | 'unknown'> {
    try {
      if (await this.fileExists(path.join(projectPath, 'yarn.lock'))) return 'yarn';
      if (await this.fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
      if (await this.fileExists(path.join(projectPath, 'package-lock.json'))) return 'npm';
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Detect project type
   */
  private detectProjectType(context: ProjectContext): 'frontend' | 'backend' | 'fullstack' | 'library' | 'unknown' {
    const frontendFrameworks = ['react', 'vue', 'angular', 'nextjs', 'nuxt', 'svelte'];
    const backendFrameworks = ['express', 'fastapi', 'django', 'spring', 'laravel', 'rails'];
    
    const hasFrontend = context.suggestedFrameworks.some(fw => frontendFrameworks.includes(fw));
    const hasBackend = context.suggestedFrameworks.some(fw => backendFrameworks.includes(fw));
    
    if (hasFrontend && hasBackend) return 'fullstack';
    if (hasFrontend) return 'frontend';
    if (hasBackend) return 'backend';
    if (context.suggestedFrameworks.includes('typescript') || context.suggestedFrameworks.includes('javascript')) return 'library';
    
    return 'unknown';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(context: ProjectContext): number {
    let score = 0;
    
    // Dependencies provide high confidence
    score += Math.min(1, Object.keys(context.dependencies).length * 0.1);
    
    // Framework files provide medium confidence
    score += Math.min(0.5, context.frameworkFiles.length * 0.1);
    
    // Suggested frameworks provide high confidence
    score += Math.min(0.8, context.suggestedFrameworks.length * 0.2);
    
    return Math.min(1, score);
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
}
