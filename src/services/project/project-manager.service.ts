/**
 * Project Manager Service
 * 
 * Manages multiple projects, handles project discovery, switching, and status tracking.
 * Provides centralized project management with project isolation and context switching.
 * 
 * Vibe Coder Benefits:
 * - Automatic project discovery and management
 * - Seamless switching between projects
 * - Project-specific context and data isolation
 * - No manual configuration needed
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../logger/logger.js';
import { ProjectIdentifierService, type ProjectMetadata } from './project-identifier.service.js';

const logger = new Logger('ProjectManagerService');

export interface ProjectStatus {
  id: string;
  name: string;
  rootPath: string;
  isActive: boolean;
  lastAccessed: Date;
  isHealthy: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProjectSwitchResult {
  success: boolean;
  previousProject?: string;
  currentProject: string;
  errors: string[];
  warnings: string[];
}

export interface ProjectDiscoveryOptions {
  searchPaths: string[];
  maxDepth: number;
  includeHidden: boolean;
  followSymlinks: boolean;
}

export interface ProjectManagerConfig {
  autoDiscovery: boolean;
  discoveryPaths: string[];
  maxProjects: number;
  cacheTimeout: number;
  healthCheckInterval: number;
}

export class ProjectManagerService {
  private projects = new Map<string, ProjectMetadata>();
  private projectStatuses = new Map<string, ProjectStatus>();
  private currentProjectId?: string;
  private projectIdentifier: ProjectIdentifierService;
  private config: ProjectManagerConfig;
  private discoveryTimer?: NodeJS.Timeout;

  constructor(config?: Partial<ProjectManagerConfig>) {
    this.projectIdentifier = new ProjectIdentifierService();
    this.config = {
      autoDiscovery: true,
      discoveryPaths: [
        process.cwd(),
        process.env.HOME || process.env.USERPROFILE || '',
        process.env.WORKSPACE || '',
        process.env.PROJECTS_DIR || ''
      ].filter(Boolean),
      maxProjects: 50,
      cacheTimeout: 300000, // 5 minutes
      healthCheckInterval: 60000, // 1 minute
      ...config
    };

    logger.info('ProjectManagerService initialized', { config: this.config });
    
    if (this.config.autoDiscovery) {
      this.startAutoDiscovery();
    }
  }

  /**
   * Discover projects in configured search paths
   */
  async discoverProjects(options?: Partial<ProjectDiscoveryOptions>): Promise<ProjectMetadata[]> {
    const discoveryOptions: ProjectDiscoveryOptions = {
      searchPaths: this.config.discoveryPaths,
      maxDepth: 3,
      includeHidden: false,
      followSymlinks: false,
      ...options
    };

    logger.info('Starting project discovery', { options: discoveryOptions });

    const discoveredProjects: ProjectMetadata[] = [];

    for (const searchPath of discoveryOptions.searchPaths) {
      try {
        const projects = await this.scanDirectoryForProjects(
          searchPath, 
          discoveryOptions.maxDepth,
          discoveryOptions.includeHidden,
          discoveryOptions.followSymlinks
        );
        discoveredProjects.push(...projects);
      } catch (error) {
        logger.warn(`Failed to scan directory ${searchPath}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Remove duplicates and limit to maxProjects
    const uniqueProjects = this.deduplicateProjects(discoveredProjects);
    const limitedProjects = uniqueProjects.slice(0, this.config.maxProjects);

    // Update internal project cache
    for (const project of limitedProjects) {
      this.projects.set(project.id, project);
      this.updateProjectStatus(project.id);
    }

    logger.info(`Discovered ${limitedProjects.length} projects`);
    return limitedProjects;
  }

  /**
   * Get all managed projects
   */
  getProjects(): ProjectMetadata[] {
    return Array.from(this.projects.values());
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): ProjectMetadata | undefined {
    return this.projects.get(projectId);
  }

  /**
   * Get current active project
   */
  getCurrentProject(): ProjectMetadata | undefined {
    if (!this.currentProjectId) {
      return undefined;
    }
    return this.projects.get(this.currentProjectId);
  }

  /**
   * Switch to a different project
   */
  async switchProject(projectId: string): Promise<ProjectSwitchResult> {
    const previousProjectId = this.currentProjectId;
    const errors: string[] = [];
    const warnings: string[] = [];

    logger.info(`Switching to project: ${projectId}`, { previousProject: previousProjectId });

    // Validate project exists
    const project = this.projects.get(projectId);
    if (!project) {
      errors.push(`Project with ID ${projectId} not found`);
      return {
        success: false,
        previousProject: previousProjectId,
        currentProject: projectId,
        errors,
        warnings
      };
    }

    try {
      // Validate project is still accessible
      const validation = await this.projectIdentifier.validateProject(project.rootPath);
      if (!validation.isValid) {
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }

      // Update current project
      this.currentProjectId = projectId;
      
      // Update project status
      this.updateProjectStatus(projectId);
      
      // Update last accessed time
      project.lastAccessed = new Date();

      logger.info(`Successfully switched to project: ${project.name} (${projectId})`);

      return {
        success: errors.length === 0,
        previousProject: previousProjectId,
        currentProject: projectId,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Failed to switch to project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        previousProject: previousProjectId,
        currentProject: projectId,
        errors,
        warnings
      };
    }
  }

  /**
   * Add a project manually
   */
  async addProject(projectPath: string): Promise<ProjectMetadata | null> {
    try {
      logger.info(`Adding project manually: ${projectPath}`);
      
      const project = await this.projectIdentifier.identifyProject(projectPath);
      
      // Check if project already exists
      const existingProject = Array.from(this.projects.values())
        .find(p => p.rootPath === project.rootPath);
      
      if (existingProject) {
        logger.info(`Project already exists: ${existingProject.name}`);
        return existingProject;
      }

      // Add to projects cache
      this.projects.set(project.id, project);
      this.updateProjectStatus(project.id);

      logger.info(`Successfully added project: ${project.name} (${project.id})`);
      return project;

    } catch (error) {
      logger.error(`Failed to add project ${projectPath}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Remove a project
   */
  removeProject(projectId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) {
      return false;
    }

    logger.info(`Removing project: ${project.name} (${projectId})`);

    // Remove from caches
    this.projects.delete(projectId);
    this.projectStatuses.delete(projectId);

    // If this was the current project, clear current project
    if (this.currentProjectId === projectId) {
      this.currentProjectId = undefined;
    }

    return true;
  }

  /**
   * Get project status
   */
  getProjectStatus(projectId: string): ProjectStatus | undefined {
    return this.projectStatuses.get(projectId);
  }

  /**
   * Get all project statuses
   */
  getAllProjectStatuses(): ProjectStatus[] {
    return Array.from(this.projectStatuses.values());
  }

  /**
   * Refresh project information
   */
  async refreshProject(projectId: string): Promise<ProjectMetadata | null> {
    const existingProject = this.projects.get(projectId);
    if (!existingProject) {
      return null;
    }

    try {
      logger.info(`Refreshing project: ${existingProject.name} (${projectId})`);
      
      const updatedProject = await this.projectIdentifier.identifyProject(existingProject.rootPath);
      
      // Update project in cache
      this.projects.set(projectId, updatedProject);
      this.updateProjectStatus(projectId);

      return updatedProject;

    } catch (error) {
      logger.error(`Failed to refresh project ${projectId}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Start automatic project discovery
   */
  private startAutoDiscovery(): void {
    // Initial discovery
    this.discoverProjects().catch(error => {
      logger.error('Initial project discovery failed:', error instanceof Error ? error.message : 'Unknown error');
    });

    // Set up periodic discovery
    this.discoveryTimer = setInterval(() => {
      this.discoverProjects().catch(error => {
        logger.error('Periodic project discovery failed:', error instanceof Error ? error.message : 'Unknown error');
      });
    }, this.config.cacheTimeout);
  }

  /**
   * Stop automatic project discovery
   */
  stopAutoDiscovery(): void {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = undefined;
    }
  }

  /**
   * Scan directory for projects
   */
  private async scanDirectoryForProjects(
    searchPath: string,
    maxDepth: number,
    includeHidden: boolean,
    followSymlinks: boolean,
    currentDepth: number = 0
  ): Promise<ProjectMetadata[]> {
    const projects: ProjectMetadata[] = [];

    if (currentDepth >= maxDepth) {
      return projects;
    }

    try {
      const entries = await readdir(searchPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(searchPath, entry.name);

        // Skip hidden directories unless requested
        if (!includeHidden && entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          // Check if this directory is a project
          try {
            const project = await this.projectIdentifier.identifyProject(fullPath);
            projects.push(project);
          } catch {
            // Not a valid project, continue scanning
          }

          // Recursively scan subdirectories
          const subProjects = await this.scanDirectoryForProjects(
            fullPath,
            maxDepth,
            includeHidden,
            followSymlinks,
            currentDepth + 1
          );
          projects.push(...subProjects);
        }
      }
    } catch (error) {
      // Directory might not be readable, skip silently
    }

    return projects;
  }

  /**
   * Remove duplicate projects based on root path
   */
  private deduplicateProjects(projects: ProjectMetadata[]): ProjectMetadata[] {
    const seen = new Set<string>();
    return projects.filter(project => {
      if (seen.has(project.rootPath)) {
        return false;
      }
      seen.add(project.rootPath);
      return true;
    });
  }

  /**
   * Update project status
   */
  private updateProjectStatus(projectId: string): void {
    const project = this.projects.get(projectId);
    if (!project) {
      return;
    }

    const status: ProjectStatus = {
      id: project.id,
      name: project.name,
      rootPath: project.rootPath,
      isActive: this.currentProjectId === projectId,
      lastAccessed: project.lastAccessed,
      isHealthy: true,
      errors: [],
      warnings: []
    };

    // Basic health checks
    try {
      // Check if project directory still exists and is accessible
      stat(project.rootPath);
    } catch (error) {
      status.isHealthy = false;
      status.errors.push(`Project directory not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    this.projectStatuses.set(projectId, status);
  }

  /**
   * Clear all projects
   */
  clearProjects(): void {
    this.projects.clear();
    this.projectStatuses.clear();
    this.currentProjectId = undefined;
    logger.info('All projects cleared');
  }

  /**
   * Get project statistics
   */
  getProjectStatistics(): {
    totalProjects: number;
    activeProject: string | undefined;
    healthyProjects: number;
    totalErrors: number;
    totalWarnings: number;
  } {
    const statuses = Array.from(this.projectStatuses.values());
    
    return {
      totalProjects: this.projects.size,
      activeProject: this.currentProjectId,
      healthyProjects: statuses.filter(s => s.isHealthy).length,
      totalErrors: statuses.reduce((sum, s) => sum + s.errors.length, 0),
      totalWarnings: statuses.reduce((sum, s) => sum + s.warnings.length, 0)
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoDiscovery();
    this.clearProjects();
    logger.info('ProjectManagerService destroyed');
  }
}

// Helper function to resolve path
function resolve(path: string): string {
  return path.replace(/\\/g, '/');
}
