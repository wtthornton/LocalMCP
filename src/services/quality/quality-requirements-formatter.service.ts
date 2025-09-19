/**
 * Quality Requirements Formatter Service
 * 
 * This service formats quality requirements into well-structured markdown
 * for inclusion in enhanced prompts. It provides token-aware formatting
 * and ensures consistent presentation of quality requirements across
 * different types of prompts and frameworks.
 * 
 * @fileoverview Service for formatting quality requirements into markdown
 */

import { Logger } from '../logger/logger.js';
import type {
  QualityRequirement,
  QualityFormattingOptions,
  QualityCategory,
  QualityPriority
} from '../../types/quality-requirements.js';

/**
 * Service for formatting quality requirements into markdown
 * 
 * @example
 * ```typescript
 * const formatter = new QualityRequirementsFormatter(logger);
 * const formatted = formatter.formatRequirements([
 *   {
 *     category: 'accessibility',
 *     priority: 'critical',
 *     rules: ['Use semantic HTML', 'Add focus states'],
 *     tokenBudget: 500
 *   }
 * ]);
 * console.log(formatted); // Markdown formatted requirements
 * ```
 */
export class QualityRequirementsFormatter {
  private logger: Logger;
  
  /**
   * Priority indicators for markdown formatting
   */
  private readonly priorityIndicators: Record<QualityPriority, string> = {
    critical: '🔥',
    high: '⚡',
    medium: '📋',
    low: '💡'
  };

  /**
   * Category emojis for visual distinction
   */
  private readonly categoryEmojis: Record<QualityCategory, string> = {
    accessibility: '♿',
    security: '🔒',
    performance: '⚡',
    maintainability: '🔧'
  };

  /**
   * Priority labels for display
   */
  private readonly priorityLabels: Record<QualityPriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Formats quality requirements into markdown string
   * 
   * @param requirements - Array of quality requirements to format
   * @param options - Optional formatting configuration
   * @returns string - Formatted markdown string
   * 
   * @example
   * ```typescript
   * const requirements = [
   *   {
   *     category: 'accessibility',
   *     priority: 'critical',
   *     rules: ['Use semantic HTML', 'Add focus states'],
   *     tokenBudget: 500
   *   }
   * ];
   * 
   * const formatted = formatter.formatRequirements(requirements, {
   *   includePriority: true,
   *   includeCategoryHeaders: true,
   *   maxTokens: 1000
   * });
   * ```
   */
  formatRequirements(
    requirements: QualityRequirement[],
    options: QualityFormattingOptions = {}
  ): string {
    try {
      if (!requirements || requirements.length === 0) {
        return '';
      }

      this.logger.debug('Formatting quality requirements', {
        requirementsCount: requirements.length,
        options
      });

      // Sort requirements by priority (critical first)
      const sortedRequirements = this.sortRequirementsByPriority(requirements);
      
      // Group requirements by category
      const groupedRequirements = this.groupRequirementsByCategory(sortedRequirements);
      
      // Format each category
      const categorySections = Object.entries(groupedRequirements).map(([category, reqs]) => {
        return this.formatCategory(category as QualityCategory, reqs, options);
      });

      // Combine all sections
      let formatted = `## CRITICAL Quality Requirements:\n\n${categorySections.join('\n\n')}`;

      // Apply token optimization if needed
      if (options.maxTokens && options.maxTokens > 0) {
        formatted = this.optimizeForTokens(formatted, options.maxTokens);
      }

      this.logger.debug('Quality requirements formatted successfully', {
        originalLength: requirements.length,
        formattedLength: formatted.length,
        tokensUsed: this.estimateTokens(formatted)
      });

      return formatted;

    } catch (error) {
      this.logger.error('Failed to format quality requirements', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requirementsCount: requirements?.length || 0
      });
      
      // Return fallback formatting
      return this.createFallbackFormatting(requirements);
    }
  }

  /**
   * Formats a single category of requirements
   * 
   * @param category - The quality category
   * @param requirements - Requirements for this category
   * @param options - Formatting options
   * @returns string - Formatted category section
   */
  private formatCategory(
    category: QualityCategory,
    requirements: QualityRequirement[],
    options: QualityFormattingOptions
  ): string {
    const categoryEmoji = this.categoryEmojis[category];
    const categoryName = this.capitalizeFirst(category);
    
    // Group by priority within category
    const priorityGroups = this.groupRequirementsByPriority(requirements);
    
    const prioritySections = Object.entries(priorityGroups).map(([priority, reqs]) => {
      return this.formatPriorityGroup(priority as QualityPriority, reqs, options);
    });

    const categoryHeader = `### ${categoryEmoji} ${categoryName}`;
    const categoryContent = prioritySections.join('\n');

    return `${categoryHeader}\n${categoryContent}`;
  }

  /**
   * Formats a group of requirements with the same priority
   * 
   * @param priority - The priority level
   * @param requirements - Requirements with this priority
   * @param options - Formatting options
   * @returns string - Formatted priority section
   */
  private formatPriorityGroup(
    priority: QualityPriority,
    requirements: QualityRequirement[],
    options: QualityFormattingOptions
  ): string {
    const priorityIndicator = options.includePriority !== false 
      ? this.priorityIndicators[priority] 
      : '';
    const priorityLabel = options.includePriority !== false 
      ? ` (${this.priorityLabels[priority]})` 
      : '';

    // Combine all rules from requirements with same priority
    const allRules = requirements.flatMap(req => req.rules);
    const uniqueRules = [...new Set(allRules)]; // Remove duplicates

    const rulesList = this.formatRules(uniqueRules);
    
    return `${priorityIndicator} **${priorityLabel}**\n${rulesList}`;
  }

  /**
   * Formats an array of rules into markdown list
   * 
   * @param rules - Array of rule strings
   * @returns string - Formatted rules list
   */
  private formatRules(rules: string[]): string {
    if (!rules || rules.length === 0) {
      return '';
    }

    return rules.map(rule => `- ${rule}`).join('\n');
  }

  /**
   * Sorts requirements by priority (critical first)
   * 
   * @param requirements - Requirements to sort
   * @returns QualityRequirement[] - Sorted requirements
   */
  private sortRequirementsByPriority(requirements: QualityRequirement[]): QualityRequirement[] {
    const priorityOrder: Record<QualityPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };

    return [...requirements].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Groups requirements by category
   * 
   * @param requirements - Requirements to group
   * @returns Record<string, QualityRequirement[]> - Grouped requirements
   */
  private groupRequirementsByCategory(
    requirements: QualityRequirement[]
  ): Record<string, QualityRequirement[]> {
    return requirements.reduce((groups, req) => {
      const category = req.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(req);
      return groups;
    }, {} as Record<string, QualityRequirement[]>);
  }

  /**
   * Groups requirements by priority within a category
   * 
   * @param requirements - Requirements to group
   * @returns Record<string, QualityRequirement[]> - Grouped requirements
   */
  private groupRequirementsByPriority(
    requirements: QualityRequirement[]
  ): Record<string, QualityRequirement[]> {
    return requirements.reduce((groups, req) => {
      const priority = req.priority;
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(req);
      return groups;
    }, {} as Record<string, QualityRequirement[]>);
  }

  /**
   * Optimizes formatted content for token usage
   * 
   * @param content - Content to optimize
   * @param maxTokens - Maximum token limit
   * @returns string - Optimized content
   */
  private optimizeForTokens(content: string, maxTokens: number): string {
    const currentTokens = this.estimateTokens(content);
    
    if (currentTokens <= maxTokens) {
      return content;
    }

    this.logger.debug('Optimizing content for token usage', {
      currentTokens,
      maxTokens,
      reductionNeeded: currentTokens - maxTokens
    });

    // Apply compression strategies
    let optimized = content;

    // Strategy 1: Remove extra whitespace
    optimized = optimized.replace(/\n{3,}/g, '\n\n');

    // Strategy 2: Shorten rule descriptions
    optimized = optimized.replace(/- (.{100,})/g, (match, rule) => {
      if (rule.length > 80) {
        return `- ${rule.substring(0, 77)}...`;
      }
      return match;
    });

    // Strategy 3: Remove priority indicators if needed
    const optimizedTokens = this.estimateTokens(optimized);
    if (optimizedTokens > maxTokens) {
      optimized = optimized.replace(/[🔥⚡📋💡]/g, '');
    }

    // Strategy 4: Truncate if still too long
    const finalTokens = this.estimateTokens(optimized);
    if (finalTokens > maxTokens) {
      const ratio = maxTokens / finalTokens;
      const targetLength = Math.floor(optimized.length * ratio);
      optimized = optimized.substring(0, targetLength) + '...';
    }

    this.logger.debug('Content optimization completed', {
      originalTokens: currentTokens,
      optimizedTokens: this.estimateTokens(optimized),
      maxTokens
    });

    return optimized;
  }

  /**
   * Creates fallback formatting when normal formatting fails
   * 
   * @param requirements - Requirements to format
   * @returns string - Fallback formatted string
   */
  private createFallbackFormatting(requirements: QualityRequirement[]): string {
    if (!requirements || requirements.length === 0) {
      return '';
    }

    const fallbackRules = requirements.flatMap(req => req.rules);
    const uniqueRules = [...new Set(fallbackRules)];
    
    return `## Quality Requirements:\n\n${uniqueRules.map(rule => `- ${rule}`).join('\n')}`;
  }

  /**
   * Estimates token count for a string (simple approximation)
   * 
   * @param text - Text to estimate tokens for
   * @returns number - Estimated token count
   */
  private estimateTokens(text: string): number {
    if (!text) return 0;
    
    // Simple approximation: ~4 characters per token
    // This is a rough estimate for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Capitalizes the first letter of a string
   * 
   * @param str - String to capitalize
   * @returns string - Capitalized string
   */
  private capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
