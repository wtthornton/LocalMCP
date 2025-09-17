/**
 * Project Storage Service
 * 
 * Manages project-scoped data storage and isolation. Provides separate storage
 * contexts for lessons learned, RAG data, and other project-specific information.
 * 
 * Vibe Coder Benefits:
 * - Automatic project data isolation
 * - No cross-project data contamination
 * - Project-specific learning and context
 * - Seamless project switching with data preservation
 */

import { Logger } from '../logger/logger.js';
import { ProjectIdentifierService, type ProjectMetadata } from './project-identifier.service.js';

const logger = new Logger('ProjectStorageService');

export interface ProjectStorageContext {
  projectId: string;
  projectName: string;
  rootPath: string;
  createdAt: Date;
  lastAccessed: Date;
  dataTypes: string[];
  storageStats: {
    totalDocuments: number;
    totalLessons: number;
    totalPatterns: number;
    storageSize: number;
  };
}

export interface ProjectStorageOptions {
  enableIsolation: boolean;
  autoCleanup: boolean;
  maxStorageSize: number; // in MB
  retentionPeriod: number; // in days
}

export interface StorageMigrationResult {
  success: boolean;
  migratedProjects: string[];
  errors: string[];
  warnings: string[];
}

export class ProjectStorageService {
  private projectContexts = new Map<string, ProjectStorageContext>();
  private storageOptions: ProjectStorageOptions;
  private projectIdentifier: ProjectIdentifierService;

  constructor(options?: Partial<ProjectStorageOptions>) {
    this.storageOptions = {
      enableIsolation: true,
      autoCleanup: true,
      maxStorageSize: 1000, // 1GB default
      retentionPeriod: 90, // 90 days default
      ...options
    };

    this.projectIdentifier = new ProjectIdentifierService();
    logger.info('ProjectStorageService initialized', { options: this.storageOptions });
  }

  /**
   * Initialize storage context for a project
   */
  async initializeProjectStorage(project: ProjectMetadata): Promise<ProjectStorageContext> {
    logger.info(`Initializing storage for project: ${project.name} (${project.id})`);

    const context: ProjectStorageContext = {
      projectId: project.id,
      projectName: project.name,
      rootPath: project.rootPath,
      createdAt: new Date(),
      lastAccessed: new Date(),
      dataTypes: [],
      storageStats: {
        totalDocuments: 0,
        totalLessons: 0,
        totalPatterns: 0,
        storageSize: 0
      }
    };

    this.projectContexts.set(project.id, context);
    return context;
  }

  /**
   * Get storage context for a project
   */
  getProjectStorageContext(projectId: string): ProjectStorageContext | undefined {
    return this.projectContexts.get(projectId);
  }

  /**
   * Get all project storage contexts
   */
  getAllProjectStorageContexts(): ProjectStorageContext[] {
    return Array.from(this.projectContexts.values());
  }

  /**
   * Update project storage context
   */
  updateProjectStorageContext(projectId: string, updates: Partial<ProjectStorageContext>): void {
    const context = this.projectContexts.get(projectId);
    if (!context) {
      logger.warn(`Project storage context not found: ${projectId}`);
      return;
    }

    // Update last accessed time
    context.lastAccessed = new Date();

    // Apply updates
    Object.assign(context, updates);

    logger.debug(`Updated storage context for project: ${context.projectName}`);
  }

  /**
   * Add data type to project storage
   */
  addDataType(projectId: string, dataType: string): void {
    const context = this.projectContexts.get(projectId);
    if (!context) {
      logger.warn(`Project storage context not found: ${projectId}`);
      return;
    }

    if (!context.dataTypes.includes(dataType)) {
      context.dataTypes.push(dataType);
      logger.debug(`Added data type '${dataType}' to project: ${context.projectName}`);
    }
  }

  /**
   * Update storage statistics for a project
   */
  updateStorageStats(projectId: string, stats: Partial<ProjectStorageContext['storageStats']>): void {
    const context = this.projectContexts.get(projectId);
    if (!context) {
      logger.warn(`Project storage context not found: ${projectId}`);
      return;
    }

    Object.assign(context.storageStats, stats);
    logger.debug(`Updated storage stats for project: ${context.projectName}`);
  }

  /**
   * Get project-scoped storage key
   */
  getProjectScopedKey(projectId: string, key: string): string {
    if (!this.storageOptions.enableIsolation) {
      return key;
    }
    return `project:${projectId}:${key}`;
  }

  /**
   * Get project-scoped collection name
   */
  getProjectScopedCollection(projectId: string, collectionType: string): string {
    if (!this.storageOptions.enableIsolation) {
      return collectionType;
    }
    return `project_${projectId}_${collectionType}`;
  }

  /**
   * Check if project has storage context
   */
  hasProjectStorage(projectId: string): boolean {
    return this.projectContexts.has(projectId);
  }

  /**
   * Remove project storage context
   */
  removeProjectStorage(projectId: string): boolean {
    const context = this.projectContexts.get(projectId);
    if (!context) {
      return false;
    }

    logger.info(`Removing storage context for project: ${context.projectName} (${projectId})`);
    this.projectContexts.delete(projectId);
    return true;
  }

  /**
   * Get storage statistics across all projects
   */
  getGlobalStorageStats(): {
    totalProjects: number;
    totalDocuments: number;
    totalLessons: number;
    totalPatterns: number;
    totalStorageSize: number;
    averageStorageSize: number;
    largestProject: string | undefined;
    smallestProject: string | undefined;
  } {
    const contexts = Array.from(this.projectContexts.values());
    
    const totalDocuments = contexts.reduce((sum, c) => sum + c.storageStats.totalDocuments, 0);
    const totalLessons = contexts.reduce((sum, c) => sum + c.storageStats.totalLessons, 0);
    const totalPatterns = contexts.reduce((sum, c) => sum + c.storageStats.totalPatterns, 0);
    const totalStorageSize = contexts.reduce((sum, c) => sum + c.storageStats.storageSize, 0);
    const averageStorageSize = contexts.length > 0 ? totalStorageSize / contexts.length : 0;

    // Find largest and smallest projects by storage size
    const sortedBySize = contexts.sort((a, b) => b.storageStats.storageSize - a.storageStats.storageSize);
    const largestProject = sortedBySize[0]?.projectName;
    const smallestProject = sortedBySize[sortedBySize.length - 1]?.projectName;

    return {
      totalProjects: contexts.length,
      totalDocuments,
      totalLessons,
      totalPatterns,
      totalStorageSize,
      averageStorageSize,
      largestProject,
      smallestProject
    };
  }

  /**
   * Clean up old project storage contexts
   */
  async cleanupOldProjects(): Promise<{
    removedProjects: string[];
    errors: string[];
  }> {
    if (!this.storageOptions.autoCleanup) {
      return { removedProjects: [], errors: [] };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.storageOptions.retentionPeriod);

    const removedProjects: string[] = [];
    const errors: string[] = [];

    for (const [projectId, context] of this.projectContexts.entries()) {
      if (context.lastAccessed < cutoffDate) {
        try {
          logger.info(`Cleaning up old project storage: ${context.projectName} (last accessed: ${context.lastAccessed.toISOString()})`);
          this.projectContexts.delete(projectId);
          removedProjects.push(projectId);
        } catch (error) {
          errors.push(`Failed to cleanup project ${context.projectName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    logger.info(`Cleaned up ${removedProjects.length} old project storage contexts`);
    return { removedProjects, errors };
  }

  /**
   * Migrate project storage (for future use)
   */
  async migrateProjectStorage(
    fromProjectId: string, 
    toProjectId: string
  ): Promise<StorageMigrationResult> {
    logger.info(`Migrating project storage from ${fromProjectId} to ${toProjectId}`);

    const result: StorageMigrationResult = {
      success: false,
      migratedProjects: [],
      errors: [],
      warnings: []
    };

    try {
      const fromContext = this.projectContexts.get(fromProjectId);
      const toContext = this.projectContexts.get(toProjectId);

      if (!fromContext) {
        result.errors.push(`Source project context not found: ${fromProjectId}`);
        return result;
      }

      if (!toContext) {
        result.errors.push(`Target project context not found: ${toProjectId}`);
        return result;
      }

      // Merge data types
      const mergedDataTypes = [...new Set([...toContext.dataTypes, ...fromContext.dataTypes])];
      toContext.dataTypes = mergedDataTypes;

      // Merge storage stats
      toContext.storageStats = {
        totalDocuments: toContext.storageStats.totalDocuments + fromContext.storageStats.totalDocuments,
        totalLessons: toContext.storageStats.totalLessons + fromContext.storageStats.totalLessons,
        totalPatterns: toContext.storageStats.totalPatterns + fromContext.storageStats.totalPatterns,
        storageSize: toContext.storageStats.storageSize + fromContext.storageStats.storageSize
      };

      // Remove source context
      this.projectContexts.delete(fromProjectId);
      result.migratedProjects.push(fromProjectId);

      result.success = true;
      logger.info(`Successfully migrated project storage from ${fromProjectId} to ${toProjectId}`);

    } catch (error) {
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate project storage integrity
   */
  async validateProjectStorage(projectId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const context = this.projectContexts.get(projectId);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!context) {
      errors.push(`Project storage context not found: ${projectId}`);
      return { isValid: false, errors, warnings };
    }

    // Check if project still exists
    try {
      const project = this.projectIdentifier.getProjectMetadata(projectId);
      if (!project) {
        warnings.push(`Project metadata not found for storage context: ${projectId}`);
      }
    } catch (error) {
      warnings.push(`Failed to validate project metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check storage size limits
    if (context.storageStats.storageSize > this.storageOptions.maxStorageSize * 1024 * 1024) {
      warnings.push(`Project storage size exceeds limit: ${context.storageStats.storageSize} bytes`);
    }

    // Check for stale data
    const daysSinceLastAccess = (Date.now() - context.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastAccess > this.storageOptions.retentionPeriod) {
      warnings.push(`Project storage hasn't been accessed for ${Math.floor(daysSinceLastAccess)} days`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get storage configuration
   */
  getStorageConfiguration(): ProjectStorageOptions {
    return { ...this.storageOptions };
  }

  /**
   * Update storage configuration
   */
  updateStorageConfiguration(options: Partial<ProjectStorageOptions>): void {
    Object.assign(this.storageOptions, options);
    logger.info('Updated storage configuration', { options });
  }

  /**
   * Clear all project storage contexts
   */
  clearAllProjectStorage(): void {
    this.projectContexts.clear();
    logger.info('All project storage contexts cleared');
  }

  /**
   * Export project storage context
   */
  exportProjectStorageContext(projectId: string): ProjectStorageContext | null {
    return this.projectContexts.get(projectId) || null;
  }

  /**
   * Import project storage context
   */
  importProjectStorageContext(context: ProjectStorageContext): void {
    this.projectContexts.set(context.projectId, context);
    logger.info(`Imported storage context for project: ${context.projectName}`);
  }
}
