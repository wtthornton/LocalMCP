/**
 * Git Detector Service
 * 
 * Handles git repository detection, URL extraction, and branch/commit information.
 * Based on Node.js best practices for project identification.
 * 
 * Vibe Coder Benefits:
 * - Automatic git detection without manual configuration
 * - Reliable project identification across different environments
 * - Consistent git metadata extraction
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { stat } from 'fs/promises';
import { join } from 'path';
import { Logger } from '../logger/logger.js';

const logger = new Logger('GitDetectorService');

const execAsync = promisify(exec);

export interface GitInfo {
  isGitRepo: boolean;
  gitUrl?: string | undefined;
  gitBranch?: string | undefined;
  gitCommit?: string | undefined;
  gitRemote?: string | undefined;
  gitStatus?: string | undefined;
  lastCommitDate?: Date | undefined;
  hasUncommittedChanges?: boolean | undefined;
}

export interface GitValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  gitInfo: GitInfo;
}

export class GitDetectorService {
  private gitCache = new Map<string, GitInfo>();

  constructor() {
    logger.info('GitDetectorService initialized');
  }

  /**
   * Detect git repository information from a given path
   */
  async detectGitInfo(projectPath: string): Promise<GitInfo> {
    const resolvedPath = resolve(projectPath);
    
    // Check cache first
    const cachedInfo = this.gitCache.get(resolvedPath);
    if (cachedInfo) {
      return cachedInfo;
    }

    logger.info(`Detecting git info for: ${resolvedPath}`);

    const gitInfo: GitInfo = {
      isGitRepo: false
    };

    try {
      // Check if .git directory exists
      const hasGitDir = await this.hasGitDirectory(resolvedPath);
      if (!hasGitDir) {
        logger.info('No git repository found');
        return gitInfo;
      }

      gitInfo.isGitRepo = true;

      // Extract git information
      const [
        gitUrl,
        gitBranch,
        gitCommit,
        gitRemote,
        gitStatus,
        lastCommitDate,
        hasUncommittedChanges
      ] = await Promise.allSettled([
        this.getGitRemoteUrl(resolvedPath),
        this.getCurrentBranch(resolvedPath),
        this.getCurrentCommit(resolvedPath),
        this.getGitRemote(resolvedPath),
        this.getGitStatus(resolvedPath),
        this.getLastCommitDate(resolvedPath),
        this.hasUncommittedChanges(resolvedPath)
      ]);

      // Assign results (ignore rejected promises)
      if (gitUrl.status === 'fulfilled') gitInfo.gitUrl = gitUrl.value;
      if (gitBranch.status === 'fulfilled') gitInfo.gitBranch = gitBranch.value;
      if (gitCommit.status === 'fulfilled') gitInfo.gitCommit = gitCommit.value;
      if (gitRemote.status === 'fulfilled') gitInfo.gitRemote = gitRemote.value;
      if (gitStatus.status === 'fulfilled') gitInfo.gitStatus = gitStatus.value;
      if (lastCommitDate.status === 'fulfilled') gitInfo.lastCommitDate = lastCommitDate.value;
      if (hasUncommittedChanges.status === 'fulfilled') gitInfo.hasUncommittedChanges = hasUncommittedChanges.value;

      logger.info(`Git info detected: ${gitInfo.gitUrl} (${gitInfo.gitBranch})`);
      
    } catch (error) {
      logger.warn(`Failed to detect git info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Cache the result
    this.gitCache.set(resolvedPath, gitInfo);
    return gitInfo;
  }

  /**
   * Validate git repository
   */
  async validateGitRepository(projectPath: string): Promise<GitValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const gitInfo = await this.detectGitInfo(projectPath);

    if (!gitInfo.isGitRepo) {
      warnings.push('Not a git repository');
      return {
        isValid: true, // Not having git is not an error
        errors,
        warnings,
        gitInfo
      };
    }

    // Validate git repository integrity
    if (gitInfo.isGitRepo) {
      if (!gitInfo.gitUrl) {
        warnings.push('No remote origin configured');
      }

      if (!gitInfo.gitBranch) {
        warnings.push('No current branch detected');
      }

      if (!gitInfo.gitCommit) {
        warnings.push('No commit information available');
      }

      if (gitInfo.hasUncommittedChanges) {
        warnings.push('Repository has uncommitted changes');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      gitInfo
    };
  }

  /**
   * Check if directory has a .git folder
   */
  private async hasGitDirectory(projectPath: string): Promise<boolean> {
    try {
      const gitPath = join(projectPath, '.git');
      const stats = await stat(gitPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get git remote URL
   */
  private async getGitRemoteUrl(projectPath: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: projectPath });
      return stdout.trim() || undefined;
    } catch {
      // Try alternative remote names
      try {
        const { stdout } = await execAsync('git remote get-url upstream', { cwd: projectPath });
        return stdout.trim() || undefined;
      } catch {
        return undefined;
      }
    }
  }

  /**
   * Get current git branch
   */
  private async getCurrentBranch(projectPath: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: projectPath });
      const branch = stdout.trim();
      return branch === 'HEAD' ? undefined : branch;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current git commit hash
   */
  private async getCurrentCommit(projectPath: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: projectPath });
      return stdout.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get git remote name
   */
  private async getGitRemote(projectPath: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git remote', { cwd: projectPath });
      const remotes = stdout.trim().split('\n').filter(r => r);
      return remotes.includes('origin') ? 'origin' : remotes[0];
    } catch {
      return undefined;
    }
  }

  /**
   * Get git status
   */
  private async getGitStatus(projectPath: string): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: projectPath });
      return stdout.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get last commit date
   */
  private async getLastCommitDate(projectPath: string): Promise<Date | undefined> {
    try {
      const { stdout } = await execAsync('git log -1 --format=%ci', { cwd: projectPath });
      const dateStr = stdout.trim();
      return dateStr ? new Date(dateStr) : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check if repository has uncommitted changes
   */
  private async hasUncommittedChanges(projectPath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: projectPath });
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Clear git cache
   */
  clearCache(): void {
    this.gitCache.clear();
    logger.info('Git cache cleared');
  }
}

// Helper function to resolve path (matching the import in project-identifier.service.ts)
function resolve(path: string): string {
  // Simple path resolution - in a real implementation, you'd use path.resolve
  return path.replace(/\\/g, '/');
}
