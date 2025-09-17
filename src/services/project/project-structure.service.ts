/**
 * Project Structure Analysis Service
 * 
 * Analyzes project structure based on Node.js best practices and common patterns.
 * Detects component-based vs layer-based architecture and identifies project types.
 * 
 * Vibe Coder Benefits:
 * - Automatic project structure detection
 * - Understands modern Node.js architecture patterns
 * - Provides insights for better code organization
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../logger/logger.js';

const logger = new Logger('ProjectStructureService');

export interface ProjectStructure {
  type: 'component-based' | 'layer-based' | 'monorepo' | 'microservice' | 'simple' | 'unknown';
  hasApps: boolean;
  hasLibraries: boolean;
  hasSrc: boolean;
  hasTests: boolean;
  hasDocs: boolean;
  hasConfig: boolean;
  components: string[];
  layers: string[];
  directories: string[];
  files: string[];
  architecture: {
    isModular: boolean;
    separationLevel: 'high' | 'medium' | 'low' | 'none';
    patterns: string[];
  };
}

export interface StructureAnalysisResult {
  isValid: boolean;
  score: number; // 0-100, higher is better
  recommendations: string[];
  structure: ProjectStructure;
}

export class ProjectStructureService {
  private structureCache = new Map<string, ProjectStructure>();

  constructor() {
    logger.info('ProjectStructureService initialized');
  }

  /**
   * Analyze project structure
   */
  async analyzeStructure(projectPath: string): Promise<ProjectStructure> {
    const resolvedPath = resolve(projectPath);
    
    // Check cache first
    const cachedStructure = this.structureCache.get(resolvedPath);
    if (cachedStructure) {
      return cachedStructure;
    }

    logger.info(`Analyzing project structure: ${resolvedPath}`);

    const structure: ProjectStructure = {
      type: 'unknown',
      hasApps: false,
      hasLibraries: false,
      hasSrc: false,
      hasTests: false,
      hasDocs: false,
      hasConfig: false,
      components: [],
      layers: [],
      directories: [],
      files: [],
      architecture: {
        isModular: false,
        separationLevel: 'none',
        patterns: []
      }
    };

    try {
      // Get all directories and files
      const { directories, files } = await this.scanDirectory(resolvedPath);
      structure.directories = directories;
      structure.files = files;

      // Analyze structure patterns
      await this.analyzePatterns(resolvedPath, structure);

      // Determine project type
      structure.type = this.determineProjectType(structure);

      // Analyze architecture quality
      this.analyzeArchitecture(structure);

      logger.info(`Project structure analyzed: ${structure.type} (${structure.architecture.separationLevel} separation)`);
      
    } catch (error) {
      logger.warn(`Failed to analyze project structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cache the result
    this.structureCache.set(resolvedPath, structure);
    return structure;
  }

  /**
   * Get structure analysis with recommendations
   */
  async getAnalysisWithRecommendations(projectPath: string): Promise<StructureAnalysisResult> {
    const structure = await this.analyzeStructure(projectPath);
    const recommendations = this.generateRecommendations(structure);
    const score = this.calculateStructureScore(structure);

    return {
      isValid: score >= 50,
      score,
      recommendations,
      structure
    };
  }

  /**
   * Scan directory for files and subdirectories
   */
  private async scanDirectory(projectPath: string, maxDepth: number = 3, currentDepth: number = 0): Promise<{
    directories: string[];
    files: string[];
  }> {
    const directories: string[] = [];
    const files: string[] = [];

    if (currentDepth >= maxDepth) {
      return { directories, files };
    }

    try {
      const entries = await readdir(projectPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(projectPath, entry.name);
        
        // Skip hidden directories and common ignore patterns
        if (entry.name.startsWith('.') || 
            ['node_modules', 'dist', 'build', 'coverage'].includes(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          directories.push(entry.name);
          
          // Recursively scan subdirectories
          const subResult = await this.scanDirectory(fullPath, maxDepth, currentDepth + 1);
          directories.push(...subResult.directories.map(dir => `${entry.name}/${dir}`));
          files.push(...subResult.files.map(file => `${entry.name}/${file}`));
        } else {
          files.push(entry.name);
        }
      }
    } catch (error) {
      logger.warn(`Failed to scan directory ${projectPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { directories, files };
  }

  /**
   * Analyze common patterns in project structure
   */
  private async analyzePatterns(projectPath: string, structure: ProjectStructure): Promise<void> {
    const { directories } = structure;

    // Check for component-based architecture (Node.js best practice)
    structure.hasApps = directories.includes('apps');
    structure.hasLibraries = directories.includes('libraries');

    // Check for common directories
    structure.hasSrc = directories.includes('src');
    structure.hasTests = directories.some(dir => 
      ['tests', 'test', '__tests__', 'spec'].includes(dir)
    );
    structure.hasDocs = directories.some(dir => 
      ['docs', 'documentation'].includes(dir)
    );
    structure.hasConfig = directories.some(dir => 
      ['config', 'configuration'].includes(dir)
    );

    // Extract components from apps directory
    if (structure.hasApps) {
      structure.components = directories
        .filter(dir => dir.startsWith('apps/'))
        .map(dir => dir.replace('apps/', ''));
    }

    // Extract layers from component directories
    const componentDirs = structure.components.length > 0 ? 
      structure.components : 
      directories.filter(dir => !['src', 'tests', 'docs', 'config'].includes(dir));

    for (const component of componentDirs) {
      const componentPath = structure.hasApps ? 
        join(projectPath, 'apps', component) : 
        join(projectPath, component);
      
      try {
        const componentDirs = await readdir(componentPath, { withFileTypes: true });
        const layers = componentDirs
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);
        
        structure.layers.push(...layers);
      } catch {
        // Component directory doesn't exist or can't be read
      }
    }

    // Remove duplicates
    structure.layers = [...new Set(structure.layers)];
  }

  /**
   * Determine project type based on structure
   */
  private determineProjectType(structure: ProjectStructure): ProjectStructure['type'] {
    // Check for monorepo patterns
    if (structure.hasApps && structure.hasLibraries) {
      return 'monorepo';
    }

    // Check for component-based architecture
    if (structure.hasApps || structure.components.length > 1) {
      return 'component-based';
    }

    // Check for microservice patterns
    if (structure.directories.includes('services') || 
        structure.directories.includes('microservices')) {
      return 'microservice';
    }

    // Check for layer-based architecture
    const commonLayers = ['controllers', 'services', 'models', 'views', 'routes'];
    const hasLayerPattern = commonLayers.some(layer => 
      structure.layers.includes(layer) || structure.directories.includes(layer)
    );
    
    if (hasLayerPattern) {
      return 'layer-based';
    }

    // Simple project
    if (structure.hasSrc || structure.files.includes('index.js') || structure.files.includes('app.js')) {
      return 'simple';
    }

    return 'unknown';
  }

  /**
   * Analyze architecture quality
   */
  private analyzeArchitecture(structure: ProjectStructure): void {
    const { architecture } = structure;

    // Check modularity
    architecture.isModular = structure.hasApps || structure.components.length > 1;

    // Determine separation level
    if (structure.hasApps && structure.hasLibraries) {
      architecture.separationLevel = 'high';
    } else if (structure.hasApps || structure.components.length > 2) {
      architecture.separationLevel = 'medium';
    } else if (structure.hasSrc || structure.directories.length > 3) {
      architecture.separationLevel = 'low';
    } else {
      architecture.separationLevel = 'none';
    }

    // Identify patterns
    const patterns: string[] = [];
    
    if (structure.hasApps) patterns.push('apps-libraries-pattern');
    if (structure.components.length > 0) patterns.push('component-based');
    if (structure.layers.includes('domain')) patterns.push('domain-driven-design');
    if (structure.layers.includes('controllers') && structure.layers.includes('services')) {
      patterns.push('mvc-pattern');
    }
    if (structure.hasTests) patterns.push('test-driven-development');
    if (structure.hasDocs) patterns.push('documentation-driven');

    architecture.patterns = patterns;
  }

  /**
   * Generate recommendations for improving structure
   */
  private generateRecommendations(structure: ProjectStructure): string[] {
    const recommendations: string[] = [];

    // Component-based architecture recommendations
    if (structure.type === 'layer-based' && structure.architecture.separationLevel === 'low') {
      recommendations.push('Consider migrating to component-based architecture using apps/ and libraries/ directories');
      recommendations.push('Break down by business components (orders, users, payments) rather than technical layers');
    }

    // Testing recommendations
    if (!structure.hasTests) {
      recommendations.push('Add test directory structure (tests/ or __tests__/)');
    }

    // Documentation recommendations
    if (!structure.hasDocs) {
      recommendations.push('Add documentation directory (docs/) for better project maintainability');
    }

    // Modularity recommendations
    if (!structure.architecture.isModular && structure.directories.length > 5) {
      recommendations.push('Consider modularizing the project using apps/ directory for business components');
    }

    // Configuration recommendations
    if (!structure.hasConfig) {
      recommendations.push('Add configuration directory (config/) for environment-specific settings');
    }

    return recommendations;
  }

  /**
   * Calculate structure quality score (0-100)
   */
  private calculateStructureScore(structure: ProjectStructure): number {
    let score = 0;

    // Base score for having some structure
    score += 20;

    // Component-based architecture bonus
    if (structure.hasApps) score += 25;
    if (structure.hasLibraries) score += 15;

    // Testing bonus
    if (structure.hasTests) score += 15;

    // Documentation bonus
    if (structure.hasDocs) score += 10;

    // Configuration bonus
    if (structure.hasConfig) score += 10;

    // Modularity bonus
    if (structure.architecture.isModular) score += 15;

    // Architecture patterns bonus
    score += Math.min(structure.architecture.patterns.length * 5, 20);

    return Math.min(score, 100);
  }

  /**
   * Clear structure cache
   */
  clearCache(): void {
    this.structureCache.clear();
    logger.info('Project structure cache cleared');
  }
}

// Helper function to resolve path
function resolve(path: string): string {
  return path.replace(/\\/g, '/');
}
