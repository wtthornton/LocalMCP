/**
 * Tech Stack Detector Service
 * 
 * Comprehensive technology stack detection from package.json, configuration files,
 * and project structure. Based on Node.js best practices and modern web frameworks.
 * 
 * Vibe Coder Benefits:
 * - Automatic tech stack detection
 * - Framework-specific optimization recommendations
 * - Dependency conflict detection
 * - Modern tooling identification
 */

import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../logger/logger.js';

const logger = new Logger('TechStackDetectorService');

export interface TechStack {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  buildTools: string[];
  testing: string[];
  styling: string[];
  databases: string[];
  deployment: string[];
  devTools: string[];
  packageManager: string;
  nodeVersion?: string;
  metadata: {
    hasTypeScript: boolean;
    hasJSX: boolean;
    hasCSS: boolean;
    hasSASS: boolean;
    hasLess: boolean;
    hasStylus: boolean;
    isMonorepo: boolean;
    isMicroservice: boolean;
    complexity: 'simple' | 'medium' | 'complex';
  };
}

export interface TechStackAnalysis {
  stack: TechStack;
  recommendations: string[];
  warnings: string[];
  compatibility: {
    score: number; // 0-100
    issues: string[];
  };
}

export class TechStackDetectorService {
  private techStackCache = new Map<string, TechStack>();

  constructor() {
    logger.info('TechStackDetectorService initialized');
  }

  /**
   * Detect technology stack from project
   */
  async detectTechStack(projectPath: string): Promise<TechStack> {
    const resolvedPath = resolve(projectPath);
    
    // Check cache first
    const cachedStack = this.techStackCache.get(resolvedPath);
    if (cachedStack) {
      return cachedStack;
    }

    logger.info(`Detecting tech stack: ${resolvedPath}`);

    const stack: TechStack = {
      languages: [],
      frameworks: [],
      libraries: [],
      buildTools: [],
      testing: [],
      styling: [],
      databases: [],
      deployment: [],
      devTools: [],
      packageManager: 'npm',
      metadata: {
        hasTypeScript: false,
        hasJSX: false,
        hasCSS: false,
        hasSASS: false,
        hasLess: false,
        hasStylus: false,
        isMonorepo: false,
        isMicroservice: false,
        complexity: 'simple'
      }
    };

    try {
      // Detect from package.json
      await this.detectFromPackageJson(resolvedPath, stack);
      
      // Detect from configuration files
      await this.detectFromConfigFiles(resolvedPath, stack);
      
      // Detect from project structure
      await this.detectFromStructure(resolvedPath, stack);
      
      // Analyze metadata
      this.analyzeMetadata(stack);

      logger.info(`Tech stack detected: ${stack.frameworks.join(', ')} (${stack.languages.join(', ')})`);
      
    } catch (error) {
      logger.warn(`Failed to detect tech stack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cache the result
    this.techStackCache.set(resolvedPath, stack);
    return stack;
  }

  /**
   * Get tech stack analysis with recommendations
   */
  async getTechStackAnalysis(projectPath: string): Promise<TechStackAnalysis> {
    const stack = await this.detectTechStack(projectPath);
    const recommendations = this.generateRecommendations(stack);
    const warnings = this.generateWarnings(stack);
    const compatibility = this.analyzeCompatibility(stack);

    return {
      stack,
      recommendations,
      warnings,
      compatibility
    };
  }

  /**
   * Detect technologies from package.json
   */
  private async detectFromPackageJson(projectPath: string, stack: TechStack): Promise<void> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      // Detect package manager
      if (await this.hasFile(projectPath, 'yarn.lock')) {
        stack.packageManager = 'yarn';
      } else if (await this.hasFile(projectPath, 'pnpm-lock.yaml')) {
        stack.packageManager = 'pnpm';
      }

      // Detect Node.js version
      if (packageJson.engines?.node) {
        stack.nodeVersion = packageJson.engines.node;
      }

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
        ...packageJson.optionalDependencies
      };

      // Language detection
      if (allDeps['typescript']) stack.languages.push('typescript');
      if (allDeps['@types/node']) stack.languages.push('typescript');
      if (allDeps['flow-bin']) stack.languages.push('flow');
      if (allDeps['coffeescript']) stack.languages.push('coffeescript');
      
      // Default to JavaScript if no other language detected
      if (stack.languages.length === 0) {
        stack.languages.push('javascript');
      }

      // Framework detection
      this.detectFrameworks(allDeps, stack);
      
      // Library detection
      this.detectLibraries(allDeps, stack);
      
      // Build tools detection
      this.detectBuildTools(allDeps, stack);
      
      // Testing detection
      this.detectTesting(allDeps, stack);
      
      // Styling detection
      this.detectStyling(allDeps, stack);
      
      // Database detection
      this.detectDatabases(allDeps, stack);
      
      // Deployment detection
      this.detectDeployment(allDeps, stack);
      
      // Dev tools detection
      this.detectDevTools(allDeps, stack);

    } catch (error) {
      logger.warn(`Failed to read package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect frameworks from dependencies
   */
  private detectFrameworks(deps: Record<string, string>, stack: TechStack): void {
    // Frontend frameworks
    if (deps['react']) stack.frameworks.push('react');
    if (deps['vue']) stack.frameworks.push('vue');
    if (deps['@angular/core']) stack.frameworks.push('angular');
    if (deps['svelte']) stack.frameworks.push('svelte');
    if (deps['preact']) stack.frameworks.push('preact');

    // Full-stack frameworks
    if (deps['next']) stack.frameworks.push('nextjs');
    if (deps['nuxt']) stack.frameworks.push('nuxt');
    if (deps['sveltekit']) stack.frameworks.push('sveltekit');
    if (deps['remix']) stack.frameworks.push('remix');

    // Backend frameworks
    if (deps['express']) stack.frameworks.push('express');
    if (deps['koa']) stack.frameworks.push('koa');
    if (deps['fastify']) stack.frameworks.push('fastify');
    if (deps['hapi']) stack.frameworks.push('hapi');
    if (deps['nestjs']) stack.frameworks.push('nestjs');
    if (deps['sails']) stack.frameworks.push('sails');

    // Static site generators
    if (deps['gatsby']) stack.frameworks.push('gatsby');
    if (deps['gridsome']) stack.frameworks.push('gridsome');
    if (deps['vitepress']) stack.frameworks.push('vitepress');
    if (deps['docusaurus']) stack.frameworks.push('docusaurus');

    // Mobile frameworks
    if (deps['react-native']) stack.frameworks.push('react-native');
    if (deps['ionic']) stack.frameworks.push('ionic');
    if (deps['cordova']) stack.frameworks.push('cordova');
    if (deps['capacitor']) stack.frameworks.push('capacitor');
  }

  /**
   * Detect libraries from dependencies
   */
  private detectLibraries(deps: Record<string, string>, stack: TechStack): void {
    // State management
    if (deps['redux']) stack.libraries.push('redux');
    if (deps['mobx']) stack.libraries.push('mobx');
    if (deps['zustand']) stack.libraries.push('zustand');
    if (deps['jotai']) stack.libraries.push('jotai');

    // HTTP clients
    if (deps['axios']) stack.libraries.push('axios');
    if (deps['fetch']) stack.libraries.push('fetch');
    if (deps['ky']) stack.libraries.push('ky');

    // Utility libraries
    if (deps['lodash']) stack.libraries.push('lodash');
    if (deps['ramda']) stack.libraries.push('ramda');
    if (deps['moment']) stack.libraries.push('moment');
    if (deps['date-fns']) stack.libraries.push('date-fns');

    // UI libraries
    if (deps['@mui/material']) stack.libraries.push('mui');
    if (deps['@chakra-ui/react']) stack.libraries.push('chakra-ui');
    if (deps['antd']) stack.libraries.push('antd');
    if (deps['@headlessui/react']) stack.libraries.push('headlessui');

    // Form libraries
    if (deps['react-hook-form']) stack.libraries.push('react-hook-form');
    if (deps['formik']) stack.libraries.push('formik');
    if (deps['@hookform/resolvers']) stack.libraries.push('hookform-resolvers');
  }

  /**
   * Detect build tools from dependencies
   */
  private detectBuildTools(deps: Record<string, string>, stack: TechStack): void {
    // Bundlers
    if (deps['webpack']) stack.buildTools.push('webpack');
    if (deps['rollup']) stack.buildTools.push('rollup');
    if (deps['parcel']) stack.buildTools.push('parcel');
    if (deps['vite']) stack.buildTools.push('vite');
    if (deps['esbuild']) stack.buildTools.push('esbuild');

    // Build tools
    if (deps['gulp']) stack.buildTools.push('gulp');
    if (deps['grunt']) stack.buildTools.push('grunt');

    // Task runners
    if (deps['npm-run-all']) stack.buildTools.push('npm-run-all');
    if (deps['concurrently']) stack.buildTools.push('concurrently');
  }

  /**
   * Detect testing frameworks from dependencies
   */
  private detectTesting(deps: Record<string, string>, stack: TechStack): void {
    // Unit testing
    if (deps['jest']) stack.testing.push('jest');
    if (deps['vitest']) stack.testing.push('vitest');
    if (deps['mocha']) stack.testing.push('mocha');
    if (deps['jasmine']) stack.testing.push('jasmine');

    // E2E testing
    if (deps['cypress']) stack.testing.push('cypress');
    if (deps['playwright']) stack.testing.push('playwright');
    if (deps['puppeteer']) stack.testing.push('puppeteer');
    if (deps['selenium-webdriver']) stack.testing.push('selenium');

    // React testing
    if (deps['@testing-library/react']) stack.testing.push('testing-library-react');
    if (deps['@testing-library/jest-dom']) stack.testing.push('testing-library-jest-dom');
    if (deps['enzyme']) stack.testing.push('enzyme');

    // Vue testing
    if (deps['@vue/test-utils']) stack.testing.push('vue-test-utils');

    // Coverage
    if (deps['nyc']) stack.testing.push('nyc');
    if (deps['c8']) stack.testing.push('c8');
  }

  /**
   * Detect styling frameworks from dependencies
   */
  private detectStyling(deps: Record<string, string>, stack: TechStack): void {
    // CSS frameworks
    if (deps['tailwindcss']) stack.styling.push('tailwind');
    if (deps['bootstrap']) stack.styling.push('bootstrap');
    if (deps['bulma']) stack.styling.push('bulma');
    if (deps['foundation']) stack.styling.push('foundation');

    // CSS-in-JS
    if (deps['styled-components']) stack.styling.push('styled-components');
    if (deps['emotion']) stack.styling.push('emotion');
    if (deps['@emotion/react']) stack.styling.push('emotion');
    if (deps['@stitches/react']) stack.styling.push('stitches');

    // CSS preprocessors
    if (deps['sass']) stack.styling.push('sass');
    if (deps['less']) stack.styling.push('less');
    if (deps['stylus']) stack.styling.push('stylus');

    // PostCSS
    if (deps['postcss']) stack.styling.push('postcss');
    if (deps['autoprefixer']) stack.styling.push('autoprefixer');
  }

  /**
   * Detect databases from dependencies
   */
  private detectDatabases(deps: Record<string, string>, stack: TechStack): void {
    // SQL databases
    if (deps['mysql']) stack.databases.push('mysql');
    if (deps['mysql2']) stack.databases.push('mysql2');
    if (deps['pg']) stack.databases.push('postgresql');
    if (deps['sqlite3']) stack.databases.push('sqlite');
    if (deps['better-sqlite3']) stack.databases.push('better-sqlite');

    // NoSQL databases
    if (deps['mongodb']) stack.databases.push('mongodb');
    if (deps['mongoose']) stack.databases.push('mongoose');
    if (deps['redis']) stack.databases.push('redis');
    if (deps['ioredis']) stack.databases.push('ioredis');

    // ORMs
    if (deps['sequelize']) stack.databases.push('sequelize');
    if (deps['typeorm']) stack.databases.push('typeorm');
    if (deps['prisma']) stack.databases.push('prisma');
    if (deps['knex']) stack.databases.push('knex');
  }

  /**
   * Detect deployment tools from dependencies
   */
  private detectDeployment(deps: Record<string, string>, stack: TechStack): void {
    // Containerization
    if (deps['docker']) stack.deployment.push('docker');
    if (deps['@vercel/ncc']) stack.deployment.push('vercel');

    // Serverless
    if (deps['serverless']) stack.deployment.push('serverless');
    if (deps['@aws-sdk/client-lambda']) stack.deployment.push('aws-lambda');

    // CI/CD
    if (deps['@actions/core']) stack.deployment.push('github-actions');
    if (deps['@semantic-release/changelog']) stack.deployment.push('semantic-release');
  }

  /**
   * Detect development tools from dependencies
   */
  private detectDevTools(deps: Record<string, string>, stack: TechStack): void {
    // Linting
    if (deps['eslint']) stack.devTools.push('eslint');
    if (deps['prettier']) stack.devTools.push('prettier');
    if (deps['@typescript-eslint/eslint-plugin']) stack.devTools.push('typescript-eslint');

    // Development servers
    if (deps['nodemon']) stack.devTools.push('nodemon');
    if (deps['ts-node']) stack.devTools.push('ts-node');
    if (deps['tsx']) stack.devTools.push('tsx');

    // Documentation
    if (deps['typedoc']) stack.devTools.push('typedoc');
    if (deps['jsdoc']) stack.devTools.push('jsdoc');
    if (deps['storybook']) stack.devTools.push('storybook');

    // Monitoring
    if (deps['@sentry/node']) stack.devTools.push('sentry');
    if (deps['winston']) stack.devTools.push('winston');
    if (deps['pino']) stack.devTools.push('pino');
  }

  /**
   * Detect technologies from configuration files
   */
  private async detectFromConfigFiles(projectPath: string, stack: TechStack): Promise<void> {
    const configFiles = [
      { file: 'tsconfig.json', tech: 'typescript' },
      { file: 'tailwind.config.js', tech: 'tailwind' },
      { file: 'tailwind.config.ts', tech: 'tailwind' },
      { file: 'next.config.js', tech: 'nextjs' },
      { file: 'next.config.ts', tech: 'nextjs' },
      { file: 'nuxt.config.js', tech: 'nuxt' },
      { file: 'nuxt.config.ts', tech: 'nuxt' },
      { file: 'vite.config.js', tech: 'vite' },
      { file: 'vite.config.ts', tech: 'vite' },
      { file: 'webpack.config.js', tech: 'webpack' },
      { file: 'webpack.config.ts', tech: 'webpack' },
      { file: 'rollup.config.js', tech: 'rollup' },
      { file: 'rollup.config.ts', tech: 'rollup' },
      { file: 'jest.config.js', tech: 'jest' },
      { file: 'jest.config.ts', tech: 'jest' },
      { file: 'vitest.config.ts', tech: 'vitest' },
      { file: 'playwright.config.ts', tech: 'playwright' },
      { file: 'cypress.config.js', tech: 'cypress' },
      { file: 'cypress.config.ts', tech: 'cypress' },
      { file: 'eslint.config.js', tech: 'eslint' },
      { file: 'eslint.config.ts', tech: 'eslint' },
      { file: '.prettierrc', tech: 'prettier' },
      { file: '.prettierrc.js', tech: 'prettier' },
      { file: 'prettier.config.js', tech: 'prettier' },
      { file: 'Dockerfile', tech: 'docker' },
      { file: 'docker-compose.yml', tech: 'docker' },
      { file: 'docker-compose.yaml', tech: 'docker' }
    ];

    for (const { file, tech } of configFiles) {
      if (await this.hasFile(projectPath, file)) {
        if (tech === 'typescript') {
          if (!stack.languages.includes('typescript')) {
            stack.languages.push('typescript');
          }
        } else if (tech === 'tailwind' && !stack.styling.includes('tailwind')) {
          stack.styling.push('tailwind');
        } else if (tech === 'nextjs' && !stack.frameworks.includes('nextjs')) {
          stack.frameworks.push('nextjs');
        } else if (tech === 'nuxt' && !stack.frameworks.includes('nuxt')) {
          stack.frameworks.push('nuxt');
        } else if (tech === 'vite' && !stack.buildTools.includes('vite')) {
          stack.buildTools.push('vite');
        } else if (tech === 'webpack' && !stack.buildTools.includes('webpack')) {
          stack.buildTools.push('webpack');
        } else if (tech === 'rollup' && !stack.buildTools.includes('rollup')) {
          stack.buildTools.push('rollup');
        } else if (tech === 'jest' && !stack.testing.includes('jest')) {
          stack.testing.push('jest');
        } else if (tech === 'vitest' && !stack.testing.includes('vitest')) {
          stack.testing.push('vitest');
        } else if (tech === 'playwright' && !stack.testing.includes('playwright')) {
          stack.testing.push('playwright');
        } else if (tech === 'cypress' && !stack.testing.includes('cypress')) {
          stack.testing.push('cypress');
        } else if (tech === 'eslint' && !stack.devTools.includes('eslint')) {
          stack.devTools.push('eslint');
        } else if (tech === 'prettier' && !stack.devTools.includes('prettier')) {
          stack.devTools.push('prettier');
        } else if (tech === 'docker' && !stack.deployment.includes('docker')) {
          stack.deployment.push('docker');
        }
      }
    }
  }

  /**
   * Detect technologies from project structure
   */
  private async detectFromStructure(projectPath: string, stack: TechStack): Promise<void> {
    // Check for common directories that indicate technologies
    const structureChecks = [
      { dir: 'src', tech: 'src-structure' },
      { dir: 'app', tech: 'app-router' },
      { dir: 'pages', tech: 'pages-router' },
      { dir: 'components', tech: 'component-structure' },
      { dir: 'lib', tech: 'lib-structure' },
      { dir: 'utils', tech: 'utils-structure' },
      { dir: 'hooks', tech: 'hooks-structure' },
      { dir: 'stores', tech: 'state-management' },
      { dir: 'styles', tech: 'style-structure' },
      { dir: 'public', tech: 'static-assets' }
    ];

    for (const { dir, tech } of structureChecks) {
      if (await this.hasDirectory(projectPath, dir)) {
        stack.libraries.push(tech);
      }
    }
  }

  /**
   * Analyze metadata about the tech stack
   */
  private analyzeMetadata(stack: TechStack): void {
    const { metadata } = stack;

    // Language metadata
    metadata.hasTypeScript = stack.languages.includes('typescript');
    metadata.hasJSX = stack.frameworks.includes('react') || stack.frameworks.includes('nextjs');

    // Styling metadata
    metadata.hasCSS = stack.styling.length > 0;
    metadata.hasSASS = stack.styling.includes('sass');
    metadata.hasLess = stack.styling.includes('less');
    metadata.hasStylus = stack.styling.includes('stylus');

    // Architecture metadata
    metadata.isMonorepo = stack.libraries.includes('src-structure') && stack.libraries.includes('lib-structure');
    metadata.isMicroservice = stack.frameworks.includes('express') || stack.frameworks.includes('nestjs');

    // Complexity analysis
    const totalTechnologies = [
      ...stack.languages,
      ...stack.frameworks,
      ...stack.libraries,
      ...stack.buildTools,
      ...stack.testing,
      ...stack.styling,
      ...stack.databases,
      ...stack.deployment,
      ...stack.devTools
    ].length;

    if (totalTechnologies > 15) {
      metadata.complexity = 'complex';
    } else if (totalTechnologies > 8) {
      metadata.complexity = 'medium';
    } else {
      metadata.complexity = 'simple';
    }
  }

  /**
   * Generate recommendations based on tech stack
   */
  private generateRecommendations(stack: TechStack): string[] {
    const recommendations: string[] = [];

    // TypeScript recommendations
    if (!stack.languages.includes('typescript') && stack.metadata.complexity === 'medium') {
      recommendations.push('Consider adding TypeScript for better type safety and developer experience');
    }

    // Testing recommendations
    if (stack.testing.length === 0) {
      recommendations.push('Add testing framework (Jest, Vitest, or Mocha) for better code quality');
    }

    // Build tool recommendations
    if (stack.buildTools.length === 0 && stack.frameworks.includes('react')) {
      recommendations.push('Consider adding a build tool (Vite, Webpack, or Rollup) for production builds');
    }

    // Linting recommendations
    if (!stack.devTools.includes('eslint')) {
      recommendations.push('Add ESLint for code quality and consistency');
    }

    // Styling recommendations
    if (stack.styling.length === 0 && stack.frameworks.includes('react')) {
      recommendations.push('Consider adding a styling solution (Tailwind CSS, Styled Components, or CSS modules)');
    }

    return recommendations;
  }

  /**
   * Generate warnings based on tech stack
   */
  private generateWarnings(stack: TechStack): string[] {
    const warnings: string[] = [];

    // Dependency warnings
    if (stack.libraries.includes('moment') && stack.libraries.includes('date-fns')) {
      warnings.push('Using both Moment.js and date-fns may cause bundle size issues');
    }

    if (stack.testing.includes('jest') && stack.testing.includes('mocha')) {
      warnings.push('Using both Jest and Mocha may cause conflicts');
    }

    // Version warnings
    if (stack.nodeVersion && stack.nodeVersion.includes('<14')) {
      warnings.push('Node.js version is outdated, consider upgrading to Node.js 18+ for better performance');
    }

    return warnings;
  }

  /**
   * Analyze technology compatibility
   */
  private analyzeCompatibility(stack: TechStack): { score: number; issues: string[] } {
    let score = 100;
    const issues: string[] = [];

    // Framework compatibility checks
    if (stack.frameworks.includes('react') && stack.frameworks.includes('vue')) {
      score -= 30;
      issues.push('Mixing React and Vue frameworks may cause conflicts');
    }

    if (stack.frameworks.includes('nextjs') && stack.frameworks.includes('nuxt')) {
      score -= 30;
      issues.push('Mixing Next.js and Nuxt frameworks may cause conflicts');
    }

    // Build tool compatibility
    if (stack.buildTools.includes('webpack') && stack.buildTools.includes('vite')) {
      score -= 20;
      issues.push('Using both Webpack and Vite may cause build conflicts');
    }

    // Testing compatibility
    if (stack.testing.includes('jest') && stack.testing.includes('vitest')) {
      score -= 15;
      issues.push('Using both Jest and Vitest may cause test conflicts');
    }

    return {
      score: Math.max(score, 0),
      issues
    };
  }

  /**
   * Check if file exists
   */
  private async hasFile(projectPath: string, filename: string): Promise<boolean> {
    try {
      await stat(join(projectPath, filename));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory exists
   */
  private async hasDirectory(projectPath: string, dirname: string): Promise<boolean> {
    try {
      const stats = await stat(join(projectPath, dirname));
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Clear tech stack cache
   */
  clearCache(): void {
    this.techStackCache.clear();
    logger.info('Tech stack cache cleared');
  }
}

// Helper function to resolve path
function resolve(path: string): string {
  return path.replace(/\\/g, '/');
}
