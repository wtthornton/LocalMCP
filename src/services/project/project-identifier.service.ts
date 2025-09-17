/**
 * Project Identifier Service
 * 
 * Handles project identification, validation, and metadata extraction.
 * Creates unique project IDs based on git URL + root path for project isolation.
 * 
 * Vibe Coder Benefits:
 * - Automatic project detection and isolation
 * - No manual configuration needed
 * - Consistent project identification across sessions
 */

import { createHash } from 'crypto';
import { resolve, join } from 'path';
import { readFile, stat } from 'fs/promises';
import { Logger } from '../logger/logger.js';

const logger = new Logger('ProjectIdentifierService');
import { GitDetectorService, type GitInfo } from './git-detector.service.js';
import { ProjectStructureService, type ProjectStructure } from './project-structure.service.js';
import { TechStackDetectorService, type TechStack } from './tech-stack-detector.service.js';

export interface ProjectMetadata {
  id: string;
  name: string;
  rootPath: string;
  gitInfo: GitInfo;
  projectStructure: ProjectStructure;
  techStack: TechStack;
  packageJson?: {
    name?: string;
    version?: string;
    description?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } | undefined;
  createdAt: Date;
  lastAccessed: Date;
}

export interface ProjectValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: Partial<ProjectMetadata>;
}

export class ProjectIdentifierService {
  private projectCache = new Map<string, ProjectMetadata>();
  private currentProjectId?: string | undefined;
  private gitDetector: GitDetectorService;
  private structureDetector: ProjectStructureService;
  private techStackDetector: TechStackDetectorService;

  constructor() {
    this.gitDetector = new GitDetectorService();
    this.structureDetector = new ProjectStructureService();
    this.techStackDetector = new TechStackDetectorService();
    logger.info('ProjectIdentifierService initialized');
  }

  /**
   * Identify and validate a project from a given path
   */
  async identifyProject(projectPath: string): Promise<ProjectMetadata> {
    const resolvedPath = resolve(projectPath);
    
    // Check cache first
    const cachedProject = this.projectCache.get(resolvedPath);
    if (cachedProject) {
      cachedProject.lastAccessed = new Date();
      return cachedProject;
    }

    logger.info(`Identifying project at: ${resolvedPath}`);

    // Validate project path
    const validation = await this.validateProject(resolvedPath);
    if (!validation.isValid) {
      throw new Error(`Invalid project path: ${validation.errors.join(', ')}`);
    }

    // Extract information using specialized services
    const [gitInfo, projectStructure, techStack, packageInfo] = await Promise.all([
      this.gitDetector.detectGitInfo(resolvedPath),
      this.structureDetector.analyzeStructure(resolvedPath),
      this.techStackDetector.detectTechStack(resolvedPath),
      this.extractPackageInfo(resolvedPath)
    ]);
    
    // Generate project ID
    const projectId = this.generateProjectId(resolvedPath, gitInfo.gitUrl);
    
    // Generate project name
    const projectName = this.generateProjectName(packageInfo, gitInfo, resolvedPath);

    const metadata: ProjectMetadata = {
      id: projectId,
      name: projectName,
      rootPath: resolvedPath,
      gitInfo,
      projectStructure,
      techStack,
      packageJson: packageInfo,
      createdAt: new Date(),
      lastAccessed: new Date()
    };

    // Cache the project
    this.projectCache.set(resolvedPath, metadata);
    this.currentProjectId = projectId;

    logger.info(`Project identified: ${projectName} (${projectId})`);
    return metadata;
  }

  /**
   * Validate if a path is a valid project
   */
  async validateProject(projectPath: string): Promise<ProjectValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Partial<ProjectMetadata> = {};

    try {
      // Check if path exists and is a directory
      const stats = await stat(projectPath);
      if (!stats.isDirectory()) {
        errors.push('Path is not a directory');
        return { isValid: false, errors, warnings, metadata };
      }

      // Check for package.json (preferred) or other project indicators
      const packageJsonPath = join(projectPath, 'package.json');
      try {
        await stat(packageJsonPath);
        metadata.packageJson = await this.extractPackageInfo(projectPath);
      } catch {
        // Check for other project indicators
        const hasGit = await this.hasGitRepository(projectPath);
        const hasProjectFiles = await this.hasProjectFiles(projectPath);
        
        if (!hasGit && !hasProjectFiles) {
          warnings.push('No package.json, .git, or obvious project files found');
        }
      }

      // Check for git repository
      const gitInfo = await this.gitDetector.detectGitInfo(projectPath);
      if (gitInfo.isGitRepo) {
        metadata.gitInfo = gitInfo;
      } else {
        warnings.push('Not a git repository');
      }

    } catch (error) {
      errors.push(`Path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata
    };
  }

  /**
   * Generate a unique project ID based on git URL and root path
   */
  private generateProjectId(rootPath: string, gitUrl?: string): string {
    const hash = createHash('sha256');
    
    if (gitUrl) {
      // Use git URL as primary identifier
      hash.update(gitUrl);
      hash.update(rootPath);
    } else {
      // Fallback to path-based ID
      hash.update(rootPath);
      hash.update(Date.now().toString()); // Add timestamp for uniqueness
    }
    
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Generate a human-readable project name
   */
  private generateProjectName(
    packageInfo?: ProjectMetadata['packageJson'],
    gitInfo?: { gitUrl?: string | undefined; gitBranch?: string | undefined },
    rootPath?: string
  ): string {
    // Prefer package.json name
    if (packageInfo?.name) {
      return packageInfo.name;
    }

    // Try to extract name from git URL
    if (gitInfo?.gitUrl) {
      const urlParts = gitInfo.gitUrl.split('/');
      const repoName = urlParts[urlParts.length - 1];
      if (repoName && repoName !== '.git') {
        return repoName.replace('.git', '');
      }
    }

    // Fallback to directory name
    if (rootPath) {
      const dirName = rootPath.split(/[/\\]/).pop();
      return dirName || 'Unknown Project';
    }

    return 'Unknown Project';
  }


  /**
   * Extract package.json information
   */
  private async extractPackageInfo(projectPath: string): Promise<ProjectMetadata['packageJson']> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      return {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        dependencies: packageJson.dependencies,
        devDependencies: packageJson.devDependencies
      };
    } catch (error) {
      logger.warn(`Failed to extract package.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return undefined;
    }
  }


  /**
   * Check if directory has a git repository
   */
  private async hasGitRepository(projectPath: string): Promise<boolean> {
    try {
      await stat(join(projectPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if directory has common project files
   */
  private async hasProjectFiles(projectPath: string): Promise<boolean> {
    const commonFiles = [
      'package.json',
      'Cargo.toml',
      'requirements.txt',
      'pom.xml',
      'build.gradle',
      'Makefile',
      'Dockerfile'
    ];

    for (const file of commonFiles) {
      try {
        await stat(join(projectPath, file));
        return true;
      } catch {
        // Continue checking other files
      }
    }

    return false;
  }

  /**
   * Check if a specific file exists
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
   * Get current project ID
   */
  getCurrentProjectId(): string | undefined {
    return this.currentProjectId;
  }

  /**
   * Get project metadata by ID
   */
  getProjectMetadata(projectId: string): ProjectMetadata | undefined {
    for (const metadata of this.projectCache.values()) {
      if (metadata.id === projectId) {
        return metadata;
      }
    }
    return undefined;
  }

  /**
   * List all cached projects
   */
  listProjects(): ProjectMetadata[] {
    return Array.from(this.projectCache.values());
  }

  /**
   * Clear project cache
   */
  clearCache(): void {
    this.projectCache.clear();
    this.currentProjectId = undefined;
    this.gitDetector.clearCache();
    this.structureDetector.clearCache();
    this.techStackDetector.clearCache();
    logger.info('Project cache cleared');
  }
}
