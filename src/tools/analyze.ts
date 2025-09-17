import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { Context7Service } from '../services/context7/context7.service.js';
import { VectorDatabaseService } from '../services/vector/vector-db.service.js';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

export interface ProjectAnalysis {
  projectOverview: {
    name: string;
    type: string;
    language: string;
    framework?: string | undefined;
    mainComponents: string[];
  };
  dependencies: {
    name: string;
    version: string;
    type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  }[];
  configurations: {
    file: string;
    type: string;
    detected: boolean;
  }[];
  identifiedPatterns: {
    pattern: string;
    description: string;
    confidence: number;
  }[];
  potentialIssues: {
    type: 'warning' | 'error' | 'info';
    message: string;
    file?: string;
    line?: number;
  }[];
  responseChunks: {
    source: string;
    content: string;
    relevance: number;
  }[];
}

/**
 * ProjectAnalyzer - "Look at my project"
 * 
 * Analyzes project structure, dependencies, configurations, and patterns
 * to provide comprehensive understanding without manual inspection.
 */
export class ProjectAnalyzer {
  constructor(
    private logger: Logger,
    private config: ConfigService,
    private context7?: Context7Service,
    private vectorDb?: VectorDatabaseService
  ) {}

  async analyze(path: string, query?: string): Promise<ProjectAnalysis> {
    this.logger.info(`Analyzing project at: ${path}`, { query });

    try {
      const projectOverview = await this.analyzeProjectOverview(path);
      const dependencies = await this.analyzeDependencies(path);
      const configurations = await this.analyzeConfigurations(path);
      const identifiedPatterns = await this.identifyPatterns(path);
      const potentialIssues = await this.detectIssues(path);
      const responseChunks = await this.retrieveResponseChunks(path, query);

      const analysis: ProjectAnalysis = {
        projectOverview,
        dependencies,
        configurations,
        identifiedPatterns,
        potentialIssues,
        responseChunks
      };

      this.logger.info('Project analysis completed', {
        projectType: projectOverview.type,
        dependenciesCount: dependencies.length,
        issuesCount: potentialIssues.length
      });

      return analysis;

    } catch (error) {
      this.logger.error('Project analysis failed:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeProjectOverview(path: string) {
    const packageJsonPath = join(path, 'package.json');
    
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      
      // Detect project type
      let type = 'unknown';
      let framework = undefined;
      
      if (packageJson.dependencies?.next) {
        type = 'nextjs';
        framework = 'Next.js';
      } else if (packageJson.dependencies?.react) {
        type = 'react';
        framework = 'React';
      } else if (packageJson.dependencies?.vue) {
        type = 'vue';
        framework = 'Vue.js';
      } else if (packageJson.dependencies?.express) {
        type = 'express';
        framework = 'Express';
      } else if (packageJson.dependencies?.fastify) {
        type = 'fastify';
        framework = 'Fastify';
      } else if (packageJson.dependencies?.nestjs) {
        type = 'nestjs';
        framework = 'NestJS';
      }

      // Detect main components
      const mainComponents = await this.detectMainComponents(path);

      return {
        name: packageJson.name || 'unnamed-project',
        type,
        language: 'typescript', // Default for LocalMCP
        framework: framework || undefined,
        mainComponents
      };

    } catch (error) {
      this.logger.warn('Could not read package.json, using defaults');
      return {
        name: 'unknown-project',
        type: 'unknown',
        language: 'typescript',
        mainComponents: []
      };
    }
  }

  private async detectMainComponents(path: string): Promise<string[]> {
    const components: string[] = [];
    
    try {
      const entries = await readdir(path, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirName = entry.name.toLowerCase();
          if (['src', 'lib', 'components', 'pages', 'app', 'api'].includes(dirName)) {
            components.push(dirName);
          }
        }
      }
    } catch (error) {
      this.logger.warn('Could not detect main components:', error);
    }

    return components;
  }

  private async analyzeDependencies(path: string) {
    const packageJsonPath = join(path, 'package.json');
    
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      const dependencies: ProjectAnalysis['dependencies'] = [];

      // Process different dependency types
      const depTypes = ['dependencies', 'devDependencies', 'peerDependencies'] as const;
      
      for (const depType of depTypes) {
        if (packageJson[depType]) {
          for (const [name, version] of Object.entries(packageJson[depType])) {
            dependencies.push({
              name,
              version: version as string,
              type: depType
            });
          }
        }
      }

      return dependencies;

    } catch (error) {
      this.logger.warn('Could not analyze dependencies:', error);
      return [];
    }
  }

  private async analyzeConfigurations(path: string) {
    const configFiles = [
      'tsconfig.json',
      'next.config.js',
      'next.config.ts',
      'vite.config.js',
      'vite.config.ts',
      'webpack.config.js',
      'jest.config.js',
      'vitest.config.ts',
      '.eslintrc.js',
      '.eslintrc.json',
      'tailwind.config.js',
      'tailwind.config.ts'
    ];

    const configurations: ProjectAnalysis['configurations'] = [];

    for (const configFile of configFiles) {
      try {
        const configPath = join(path, configFile);
        await stat(configPath);
        configurations.push({
          file: configFile,
          type: this.getConfigType(configFile),
          detected: true
        });
      } catch {
        // File doesn't exist, skip
      }
    }

    return configurations;
  }

  private getConfigType(filename: string): string {
    if (filename.includes('tsconfig')) return 'TypeScript';
    if (filename.includes('next')) return 'Next.js';
    if (filename.includes('vite')) return 'Vite';
    if (filename.includes('webpack')) return 'Webpack';
    if (filename.includes('jest')) return 'Jest';
    if (filename.includes('vitest')) return 'Vitest';
    if (filename.includes('eslint')) return 'ESLint';
    if (filename.includes('tailwind')) return 'Tailwind CSS';
    return 'Configuration';
  }

  private async identifyPatterns(path: string) {
    const patterns: ProjectAnalysis['identifiedPatterns'] = [];

    try {
      // Check for common patterns
      const entries = await readdir(path, { withFileTypes: true });
      
      // Check for component-based architecture
      if (entries.some(e => e.name === 'components' && e.isDirectory())) {
        patterns.push({
          pattern: 'Component-based architecture',
          description: 'Uses a components directory for UI organization',
          confidence: 0.9
        });
      }

      // Check for API routes
      if (entries.some(e => e.name === 'api' && e.isDirectory())) {
        patterns.push({
          pattern: 'API routes',
          description: 'Has dedicated API routes directory',
          confidence: 0.8
        });
      }

      // Check for TypeScript usage
      const tsFiles = entries.filter(e => e.isFile() && extname(e.name) === '.ts');
      if (tsFiles.length > 0) {
        patterns.push({
          pattern: 'TypeScript usage',
          description: `Uses TypeScript (${tsFiles.length} .ts files)`,
          confidence: 0.95
        });
      }

    } catch (error) {
      this.logger.warn('Could not identify patterns:', error);
    }

    return patterns;
  }

  private async detectIssues(path: string) {
    const issues: ProjectAnalysis['potentialIssues'] = [];

    try {
      // Check for missing package.json
      try {
        await readFile(join(path, 'package.json'), 'utf-8');
      } catch {
        issues.push({
          type: 'error',
          message: 'No package.json found - this may not be a Node.js project'
        });
      }

      // Check for missing TypeScript config
      try {
        await readFile(join(path, 'tsconfig.json'), 'utf-8');
      } catch {
        issues.push({
          type: 'warning',
          message: 'No tsconfig.json found - TypeScript configuration missing'
        });
      }

      // Check for missing .gitignore
      try {
        await readFile(join(path, '.gitignore'), 'utf-8');
      } catch {
        issues.push({
          type: 'info',
          message: 'No .gitignore found - consider adding one'
        });
      }

    } catch (error) {
      this.logger.warn('Could not detect issues:', error);
    }

    return issues;
  }

  private async retrieveResponseChunks(path: string, query?: string) {
    const chunks: ProjectAnalysis['responseChunks'] = [];

    try {
      // Look for documentation files
      const docFiles = ['README.md', 'docs', 'adr', 'design'];
      
      for (const docFile of docFiles) {
        try {
          const docPath = join(path, docFile);
          const stat = await readFile(docPath, 'utf-8');
          
          chunks.push({
            source: docFile,
            content: stat.substring(0, 500), // First 500 chars
            relevance: query ? this.calculateRelevance(stat, query) : 0.5
          });
        } catch {
          // File doesn't exist, skip
        }
      }

    } catch (error) {
      this.logger.warn('Could not retrieve response chunks:', error);
    }

    return chunks;
  }

  private calculateRelevance(content: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }
}
