/**
 * Edit Caps Rule - Enforces file edit limits and rate limiting
 * 
 * This rule ensures vibe coders don't accidentally make massive changes
 * that could break their project or overwhelm the system.
 */

import type { PolicyViolation, SecurityContext, EditCapPolicy } from '../policy-gate.service';
import { ActionType } from '../policy-gate.service';

export interface EditCapRuleConfig {
  maxFilesPerSession: number;
  maxLinesPerFile: number;
  maxTotalLines: number;
  rateLimitPerMinute: number;
  protectedFiles: string[];
  protectedDirectories: string[];
}

export class EditCapsRule {
  private config: EditCapRuleConfig;

  constructor(config: EditCapRuleConfig) {
    this.config = config;
  }

  /**
   * Check if an action violates edit caps
   */
  checkEditCaps(action: ActionType, context: SecurityContext, sessionStats: SessionStats): PolicyViolation[] {
    const violations: PolicyViolation[] = [];

    // Only check file-related actions
    if (!this.isFileAction(action)) {
      return violations;
    }

    // Check file count limit
    if (sessionStats.filesModified >= this.config.maxFilesPerSession) {
      violations.push({
        ruleId: 'EDIT_CAP_FILE_COUNT',
        ruleName: 'File Edit Count Limit',
        severity: 'high',
        message: `Maximum file edits per session exceeded (${this.config.maxFilesPerSession}). Consider breaking down your changes.`,
        context: {
          filesModified: sessionStats.filesModified,
          limit: this.config.maxFilesPerSession,
          recommendation: 'Break down large changes into smaller, focused commits'
        },
        timestamp: new Date()
      });
    }

    // Check lines per file limit
    if (context.resource.size && context.resource.size > this.config.maxLinesPerFile) {
      violations.push({
        ruleId: 'EDIT_CAP_LINES_PER_FILE',
        ruleName: 'Lines Per File Limit',
        severity: 'medium',
        message: `File exceeds maximum lines per file (${this.config.maxLinesPerFile}). Consider refactoring into smaller files.`,
        context: {
          fileSize: context.resource.size,
          limit: this.config.maxLinesPerFile,
          filePath: context.resource.path,
          recommendation: 'Refactor large files into smaller, focused modules'
        },
        timestamp: new Date()
      });
    }

    // Check total lines limit
    if (sessionStats.totalLinesModified >= this.config.maxTotalLines) {
      violations.push({
        ruleId: 'EDIT_CAP_TOTAL_LINES',
        ruleName: 'Total Lines Limit',
        severity: 'high',
        message: `Maximum total lines modified exceeded (${this.config.maxTotalLines}). Consider staging your changes.`,
        context: {
          totalLines: sessionStats.totalLinesModified,
          limit: this.config.maxTotalLines,
          recommendation: 'Stage changes in smaller batches'
        },
        timestamp: new Date()
      });
    }

    // Check rate limiting
    if (sessionStats.rateLimitExceeded) {
      violations.push({
        ruleId: 'EDIT_CAP_RATE_LIMIT',
        ruleName: 'Edit Rate Limit',
        severity: 'medium',
        message: `Edit rate limit exceeded (${this.config.rateLimitPerMinute} per minute). Please slow down your editing pace.`,
        context: {
          currentRate: sessionStats.currentRate,
          limit: this.config.rateLimitPerMinute,
          recommendation: 'Take breaks between major edits'
        },
        timestamp: new Date()
      });
    }

    // Check protected resources
    if (this.isProtectedResource(context.resource.path)) {
      violations.push({
        ruleId: 'EDIT_CAP_PROTECTED_RESOURCE',
        ruleName: 'Protected Resource Access',
        severity: 'critical',
        message: `Attempted to modify protected resource: ${context.resource.path}. This file/directory is protected by policy.`,
        context: {
          resource: context.resource.path,
          isProtectedFile: this.config.protectedFiles.includes(context.resource.path),
          isProtectedDirectory: this.config.protectedDirectories.some(dir => 
            context.resource.path.startsWith(dir)
          ),
          recommendation: 'Contact administrator to modify protected resources'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Get recommendations for edit cap violations
   */
  getRecommendations(violations: PolicyViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.ruleId === 'EDIT_CAP_FILE_COUNT')) {
      recommendations.push('💡 Break down large changes into smaller, focused commits');
      recommendations.push('💡 Use git add -p to stage changes incrementally');
      recommendations.push('💡 Consider using feature branches for large changes');
    }

    if (violations.some(v => v.ruleId === 'EDIT_CAP_LINES_PER_FILE')) {
      recommendations.push('💡 Refactor large files into smaller, focused modules');
      recommendations.push('💡 Extract classes and functions into separate files');
      recommendations.push('💡 Use composition over large monolithic files');
    }

    if (violations.some(v => v.ruleId === 'EDIT_CAP_TOTAL_LINES')) {
      recommendations.push('💡 Stage changes in smaller batches');
      recommendations.push('💡 Use git stash to temporarily save changes');
      recommendations.push('💡 Plan your changes before implementing');
    }

    if (violations.some(v => v.ruleId === 'EDIT_CAP_RATE_LIMIT')) {
      recommendations.push('💡 Take breaks between major edits');
      recommendations.push('💡 Use automated tools for repetitive changes');
      recommendations.push('💡 Plan your editing sessions');
    }

    if (violations.some(v => v.ruleId === 'EDIT_CAP_PROTECTED_RESOURCE')) {
      recommendations.push('💡 Contact administrator for protected resource access');
      recommendations.push('💡 Review project documentation for protected files');
      recommendations.push('💡 Use alternative approaches that don\'t modify protected resources');
    }

    return recommendations;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EditCapRuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): EditCapRuleConfig {
    return { ...this.config };
  }

  private isFileAction(action: ActionType): boolean {
    return [
      ActionType.CREATE_FILE,
      ActionType.EDIT_FILE,
      ActionType.DELETE_FILE
    ].includes(action);
  }

  private isProtectedResource(path: string): boolean {
    return this.config.protectedFiles.includes(path) ||
           this.config.protectedDirectories.some(dir => path.startsWith(dir));
  }
}

export interface SessionStats {
  filesModified: number;
  totalLinesModified: number;
  rateLimitExceeded: boolean;
  currentRate: number;
  startTime: number;
}

export default EditCapsRule;
