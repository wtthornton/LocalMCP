import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { PipelineStage, PipelineContext, PipelineError } from '../pipeline-engine.js';
import { readFile, readdir, access } from 'fs/promises';
import { join, extname, basename } from 'path';

export interface RepoFacts {
  projectType: 'nodejs' | 'react' | 'vue' | 'angular' | 'nextjs' | 'nuxt' | 'svelte' | 'vanilla' | 'unknown';
  framework: string;
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp' | 'go' | 'rust' | 'unknown';
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
  buildTool: 'webpack' | 'vite' | 'rollup' | 'parcel' | 'esbuild' | 'tsc' | 'unknown';
  testFramework: 'jest' | 'vitest' | 'mocha' | 'jasmine' | 'cypress' | 'playwright' | 'unknown';
  linting: 'eslint' | 'tslint' | 'prettier' | 'biome' | 'unknown';
  styling: 'css' | 'scss' | 'sass' | 'less' | 'styled-components' | 'emotion' | 'tailwind' | 'stylus' | 'unknown';
  features: string[];
  dependencies: string[];
  devDependencies: string[];
  scripts: Record<string, string>;
  configFiles: string[];
  structure: {
    hasSrc: boolean;
    hasPublic: boolean;
    hasComponents: boolean;
    hasUtils: boolean;
    hasTypes: boolean;
    hasTests: boolean;
    hasDocs: boolean;
  };
}

/**
 * Detect.RepoFacts Stage
 * 
 * Analyzes the repository structure and configuration files
 * to detect project type, framework, and key characteristics
 */
export class DetectRepoFactsStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  get name(): string {
    return 'Detect.RepoFacts';
  }

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Detect.RepoFacts stage executing', {
      requestId: context.requestId,
      toolName: context.toolName
    });

    try {
      const repoFacts = await this.detectRepoFacts(context);

      this.logger.debug('Detect.RepoFacts stage completed', {
        requestId: context.requestId,
        projectType: repoFacts.projectType,
        framework: repoFacts.framework,
        language: repoFacts.language,
        features: repoFacts.features.length
      });

      return {
        data: {
          repoFacts
        },
        metadata: {
          tokensUsed: this.estimateTokens(JSON.stringify(repoFacts)),
          chunksUsed: 1
        }
      };

    } catch (error) {
      this.logger.error('Detect.RepoFacts stage failed', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return basic facts instead of failing completely
      return {
        data: {
          repoFacts: {
            projectType: 'unknown',
            framework: 'unknown',
            language: 'unknown',
            packageManager: 'unknown',
            buildTool: 'unknown',
            testFramework: 'unknown',
            linting: 'unknown',
            styling: 'unknown',
            features: [],
            dependencies: [],
            devDependencies: [],
            scripts: {},
            configFiles: [],
            structure: {
              hasSrc: false,
              hasPublic: false,
              hasComponents: false,
              hasUtils: false,
              hasTypes: false,
              hasTests: false,
              hasDocs: false
            }
          }
        },
        metadata: {
          tokensUsed: 50,
          chunksUsed: 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    // Retry on file system errors
    return error.error.includes('ENOENT') || error.error.includes('EACCES') || error.error.includes('EMFILE');
  }

  getBudgetCost(): Partial<PipelineContext['budget']> {
    return {
      tokens: 300, // Estimated tokens for repo facts
      chunks: 1
    };
  }

  private async detectRepoFacts(context: PipelineContext): Promise<RepoFacts> {
    const facts: RepoFacts = {
      projectType: 'unknown',
      framework: 'unknown',
      language: 'unknown',
      packageManager: 'unknown',
      buildTool: 'unknown',
      testFramework: 'unknown',
      linting: 'unknown',
      styling: 'unknown',
      features: [],
      dependencies: [],
      devDependencies: [],
      scripts: {},
      configFiles: [],
      structure: {
        hasSrc: false,
        hasPublic: false,
        hasComponents: false,
        hasUtils: false,
        hasTypes: false,
        hasTests: false,
        hasDocs: false
      }
    };

    // Detect package.json
    try {
      const packageJson = JSON.parse(await readFile('package.json', 'utf-8'));
      facts.dependencies = Object.keys(packageJson.dependencies || {});
      facts.devDependencies = Object.keys(packageJson.devDependencies || {});
      facts.scripts = packageJson.scripts || {};

      // Detect package manager
      if (await this.fileExists('yarn.lock')) {
        facts.packageManager = 'yarn';
      } else if (await this.fileExists('pnpm-lock.yaml')) {
        facts.packageManager = 'pnpm';
      } else if (await this.fileExists('bun.lockb')) {
        facts.packageManager = 'bun';
      } else {
        facts.packageManager = 'npm';
      }

      // Detect project type and framework
      facts.projectType = this.detectProjectType(packageJson);
      facts.framework = this.detectFramework(packageJson);
      facts.language = this.detectLanguage(packageJson);
      facts.buildTool = this.detectBuildTool(packageJson);
      facts.testFramework = this.detectTestFramework(packageJson);
      facts.linting = this.detectLinting(packageJson);
      facts.styling = this.detectStyling(packageJson);

    } catch (error) {
      this.logger.warn('Could not read package.json', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Detect structure
    facts.structure = await this.detectStructure();

    // Detect config files
    facts.configFiles = await this.detectConfigFiles();

    // Detect features
    facts.features = this.detectFeatures(facts);

    return facts;
  }

  private detectProjectType(packageJson: any): RepoFacts['projectType'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.includes('next')) return 'nextjs';
    if (depKeys.includes('nuxt')) return 'nuxt';
    if (depKeys.includes('react')) return 'react';
    if (depKeys.includes('vue')) return 'vue';
    if (depKeys.includes('@angular/core')) return 'angular';
    if (depKeys.includes('svelte')) return 'svelte';
    if (depKeys.includes('express') || depKeys.includes('koa') || depKeys.includes('fastify')) return 'nodejs';
    
    return 'vanilla';
  }

  private detectFramework(packageJson: any): string {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.includes('next')) return 'Next.js';
    if (depKeys.includes('nuxt')) return 'Nuxt.js';
    if (depKeys.includes('react')) return 'React';
    if (depKeys.includes('vue')) return 'Vue.js';
    if (depKeys.includes('@angular/core')) return 'Angular';
    if (depKeys.includes('svelte')) return 'Svelte';
    if (depKeys.includes('express')) return 'Express';
    if (depKeys.includes('koa')) return 'Koa';
    if (depKeys.includes('fastify')) return 'Fastify';
    
    return 'unknown';
  }

  private detectLanguage(packageJson: any): RepoFacts['language'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.includes('typescript') || depKeys.includes('@types/node')) return 'typescript';
    if (depKeys.includes('python')) return 'python';
    if (depKeys.includes('java')) return 'java';
    if (depKeys.includes('csharp')) return 'csharp';
    if (depKeys.includes('go')) return 'go';
    if (depKeys.includes('rust')) return 'rust';
    
    return 'javascript';
  }

  private detectBuildTool(packageJson: any): RepoFacts['buildTool'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.includes('vite')) return 'vite';
    if (depKeys.includes('webpack')) return 'webpack';
    if (depKeys.includes('rollup')) return 'rollup';
    if (depKeys.includes('parcel')) return 'parcel';
    if (depKeys.includes('esbuild')) return 'esbuild';
    if (depKeys.includes('typescript')) return 'tsc';
    
    return 'unknown';
  }

  private detectTestFramework(packageJson: any): RepoFacts['testFramework'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.includes('vitest')) return 'vitest';
    if (depKeys.includes('jest')) return 'jest';
    if (depKeys.includes('mocha')) return 'mocha';
    if (depKeys.includes('jasmine')) return 'jasmine';
    if (depKeys.includes('cypress')) return 'cypress';
    if (depKeys.includes('@playwright/test')) return 'playwright';
    
    return 'unknown';
  }

  private detectLinting(packageJson: any): RepoFacts['linting'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.includes('biome')) return 'biome';
    if (depKeys.includes('eslint')) return 'eslint';
    if (depKeys.includes('tslint')) return 'tslint';
    if (depKeys.includes('prettier')) return 'prettier';
    
    return 'unknown';
  }

  private detectStyling(packageJson: any): RepoFacts['styling'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depKeys = Object.keys(deps);

    if (depKeys.includes('tailwindcss')) return 'tailwind';
    if (depKeys.includes('styled-components')) return 'styled-components';
    if (depKeys.includes('@emotion/react')) return 'emotion';
    if (depKeys.includes('sass')) return 'sass';
    if (depKeys.includes('less')) return 'less';
    if (depKeys.includes('stylus')) return 'stylus';
    
    return 'css';
  }

  private async detectStructure(): Promise<RepoFacts['structure']> {
    return {
      hasSrc: await this.fileExists('src'),
      hasPublic: await this.fileExists('public'),
      hasComponents: await this.fileExists('src/components') || await this.fileExists('components'),
      hasUtils: await this.fileExists('src/utils') || await this.fileExists('utils'),
      hasTypes: await this.fileExists('src/types') || await this.fileExists('types'),
      hasTests: await this.fileExists('tests') || await this.fileExists('__tests__') || await this.fileExists('src/__tests__'),
      hasDocs: await this.fileExists('docs') || await this.fileExists('documentation')
    };
  }

  private async detectConfigFiles(): Promise<string[]> {
    const configFiles = [
      'tsconfig.json',
      'jsconfig.json',
      'webpack.config.js',
      'vite.config.js',
      'rollup.config.js',
      'eslint.config.js',
      '.eslintrc.js',
      '.eslintrc.json',
      'prettier.config.js',
      '.prettierrc',
      'tailwind.config.js',
      'next.config.js',
      'nuxt.config.js',
      'vue.config.js',
      'svelte.config.js',
      'jest.config.js',
      'vitest.config.js',
      'cypress.config.js',
      'playwright.config.js'
    ];

    const existingConfigs: string[] = [];
    for (const configFile of configFiles) {
      if (await this.fileExists(configFile)) {
        existingConfigs.push(configFile);
      }
    }

    return existingConfigs;
  }

  private detectFeatures(facts: RepoFacts): string[] {
    const features: string[] = [];

    if (facts.projectType !== 'unknown') features.push(facts.projectType);
    if (facts.framework !== 'unknown') features.push(facts.framework);
    if (facts.language !== 'unknown') features.push(facts.language);
    if (facts.buildTool !== 'unknown') features.push(facts.buildTool);
    if (facts.testFramework !== 'unknown') features.push(facts.testFramework);
    if (facts.linting !== 'unknown') features.push(facts.linting);
    if (facts.styling !== 'unknown') features.push(facts.styling);

    // Detect additional features
    if (facts.dependencies.includes('typescript')) features.push('typescript');
    if (facts.dependencies.includes('react-router')) features.push('routing');
    if (facts.dependencies.includes('redux')) features.push('state-management');
    if (facts.dependencies.includes('zustand')) features.push('state-management');
    if (facts.dependencies.includes('axios')) features.push('http-client');
    if (facts.dependencies.includes('graphql')) features.push('graphql');
    if (facts.dependencies.includes('prisma')) features.push('database-orm');
    if (facts.dependencies.includes('mongoose')) features.push('database-orm');

    return features;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private estimateTokens(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(content.length / 4);
  }
}
