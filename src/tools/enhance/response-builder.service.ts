/**
 * Response Builder Service
 * 
 * Handles enhanced prompt building and content optimization
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Intelligent content truncation and optimization
 * - Context-aware prompt enhancement
 * - Smart section scoring and selection
 * - Single responsibility principle
 */

import { Logger } from '../../services/logger/logger.js';

export interface PromptContext {
  repoFacts: string[];
  codeSnippets: string[];
  context7Docs: string;
  qualityRequirements: any[];
  frameworkDetection: any;
  frameworkDocs: string[];
  projectDocs: string[];
}

export interface PromptComplexity {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  indicators: string[];
}

export class ResponseBuilderService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Build enhanced prompt with all context
   * Implements comprehensive prompt enhancement with complexity awareness
   */
  buildEnhancedPrompt(
    originalPrompt: string,
    context: PromptContext,
    complexity?: PromptComplexity
  ): string {
    let enhanced = originalPrompt;
    
    // For simple prompts, provide minimal context
    if (complexity?.level === 'simple') {
      return this.buildSimplePrompt(enhanced, context);
    }
    
    // For medium/complex prompts, add comprehensive context
    return this.buildComplexPrompt(enhanced, context, complexity);
  }

  /**
   * Build simple prompt with minimal context
   * Optimized for simple questions and quick responses
   */
  private buildSimplePrompt(enhanced: string, context: PromptContext): string {
    // Only add essential framework detection if relevant
    if (context.frameworkDetection && context.frameworkDetection.detectedFrameworks.length > 0) {
      enhanced += `\n\n## Detected Framework: ${context.frameworkDetection.detectedFrameworks[0]}`;
    }
    
    // Add minimal project context
    if (context.repoFacts.length > 0) {
      enhanced += `\n\n## Project: ${context.repoFacts[0]}`;
    }
    
    // Add Context7 docs for simple HTML questions
    if (context.context7Docs && context.frameworkDetection?.detectedFrameworks.includes('html')) {
      enhanced += `\n\n${context.context7Docs}`;
    }
    
    return enhanced;
  }

  /**
   * Build complex prompt with comprehensive context
   * Optimized for development tasks and complex requests
   */
  private buildComplexPrompt(
    enhanced: string, 
    context: PromptContext, 
    complexity?: PromptComplexity
  ): string {
    // Add framework detection information
    if (context.frameworkDetection && context.frameworkDetection.detectedFrameworks.length > 0) {
      enhanced += `\n\n## Detected Frameworks/Libraries:\n`;
      enhanced += `- **Frameworks**: ${context.frameworkDetection.detectedFrameworks.join(', ')}\n`;
      enhanced += `- **Detection Method**: ${context.frameworkDetection.detectionMethod}\n`;
      enhanced += `- **Confidence**: ${(context.frameworkDetection.confidence * 100).toFixed(1)}%\n`;
      if (context.frameworkDetection.suggestions.length > 0) {
        enhanced += `- **Suggestions**: ${context.frameworkDetection.suggestions.join(', ')}\n`;
      }
    }
    
    // Add quality requirements if detected (skip for simple prompts)
    if (complexity?.level !== 'simple' && context.qualityRequirements && context.qualityRequirements.length > 0) {
      const qualityFormatted = this.formatQualityRequirements(context.qualityRequirements);
      if (qualityFormatted) {
        enhanced += `\n\n${qualityFormatted}`;
      }
    }
    
    // Add Context7 documentation if available (with smart truncation)
    if (context.context7Docs) {
      const maxTokens = complexity?.level === 'simple' ? 200 : 
                       complexity?.level === 'medium' ? 800 : 1500;
      const smartTruncatedDocs = this.smartTruncateContent(
        context.context7Docs, 
        maxTokens, 
        enhanced
      );
      enhanced += `\n\n## Framework Best Practices (from Context7):\n${smartTruncatedDocs}`;
    }
    
    // Add framework-specific documentation if available
    if (context.frameworkDocs && context.frameworkDocs.length > 0) {
      enhanced += `\n\n## Framework-Specific Best Practices:\n${context.frameworkDocs.join('\n')}`;
    }
    
    // Add project documentation if available
    if (context.projectDocs && context.projectDocs.length > 0) {
      enhanced += `\n\n## Project Documentation:\n${context.projectDocs.join('\n')}`;
    }
    
    // Add repository context
    if (context.repoFacts.length > 0) {
      enhanced += `\n\n## Repository Context:\n${context.repoFacts.join('\n')}`;
    }
    
    // Add existing code patterns if available (with smart truncation)
    if (context.codeSnippets.length > 0) {
      const codeContent = context.codeSnippets.join('\n\n');
      const maxTokens = complexity?.level === 'simple' ? 300 : 
                       complexity?.level === 'medium' ? 600 : 1200;
      const smartTruncatedCode = this.smartTruncateContent(
        codeContent, 
        maxTokens, 
        enhanced
      );
      enhanced += `\n\n## Existing Code Patterns:\n\`\`\`typescript\n${smartTruncatedCode}\n\`\`\``;
    }
    
    // Add final instructions
    enhanced += `\n\n## Instructions:\nMake your response consistent with the project's existing patterns, best practices, and coding standards. Use the provided context to ensure your solution fits well with the existing codebase.`;
    
    return enhanced;
  }

  /**
   * Smart content truncation with relevance scoring
   * Implements intelligent content filtering and prioritization
   */
  smartTruncateContent(content: string, maxTokens: number, prompt: string): string {
    if (!content || content.length === 0) return content;
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = this.countTokens(content);
    
    if (estimatedTokens <= maxTokens) {
      this.logTokenUsage('smart_truncate', content, maxTokens, prompt);
      return content;
    }
    
    // Extract key sections based on prompt relevance
    const promptKeywords = this.extractKeywords(prompt);
    const sections = this.splitIntoSections(content);
    const scoredSections = this.scoreSections(sections, promptKeywords);
    
    // Select highest scoring sections within token limit
    const selectedSections = this.selectSectionsWithinLimit(scoredSections, maxTokens);
    const result = selectedSections.join('\n\n');
    
    // Log token usage for monitoring
    this.logTokenUsage('smart_truncate', result, maxTokens, prompt);
    
    return result;
  }

  /**
   * Format quality requirements for display
   * Implements user-friendly formatting with priority indicators
   */
  formatQualityRequirements(requirements: any[]): string {
    try {
      if (!requirements || requirements.length === 0) {
        return '';
      }
      
      let formatted = '## Quality Requirements\n\n';
      
      requirements.forEach((req, index) => {
        const priority = req.priority || 'medium';
        const type = req.type || 'general';
        const description = req.description || '';
        const priorityEmoji = this.getPriorityEmoji(priority);
        
        formatted += `${index + 1}. **${type}** ${priorityEmoji} (${priority} priority)\n`;
        if (description) {
          formatted += `   - ${description}\n`;
        }
      });
      
      return formatted;

    } catch (error) {
      this.logger.warn('Quality requirements formatting failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requirementsCount: requirements?.length || 0
      });
      
      // Return fallback formatting
      return '';
    }
  }

  /**
   * Extract keywords from prompt for relevance scoring
   * Used for content prioritization and smart truncation
   */
  private extractKeywords(prompt: string): string[] {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
    
    // Remove duplicates and return
    return [...new Set(words)];
  }

  /**
   * Check if a word is a stop word (common words that don't add meaning)
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'for', 'with', 'from', 'this', 'that', 'these', 'those',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you',
      'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    
    return stopWords.has(word);
  }

  /**
   * Split content into logical sections for processing
   * Implements intelligent content segmentation
   */
  private splitIntoSections(content: string): string[] {
    // Split by common section markers
    const sectionMarkers = [
      /\n## /g,
      /\n### /g,
      /\n#### /g,
      /\n- /g,
      /\n\* /g,
      /\n\d+\. /g
    ];
    
    let sections = [content];
    
    for (const marker of sectionMarkers) {
      const newSections: string[] = [];
      for (const section of sections) {
        const parts = section.split(marker);
        if (parts.length > 1) {
          newSections.push(...parts.filter(part => part.trim().length > 0));
        } else {
          newSections.push(section);
        }
      }
      sections = newSections;
    }
    
    return sections.filter(section => section.trim().length > 0);
  }

  /**
   * Score sections based on keyword relevance
   * Implements intelligent content scoring for prioritization
   */
  private scoreSections(sections: string[], keywords: string[]): Array<{ content: string; score: number; tokens: number }> {
    return sections.map(section => {
      const sectionLower = section.toLowerCase();
      let score = 0;
      
      // Score based on keyword matches
      for (const keyword of keywords) {
        const matches = (sectionLower.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 2; // Weight keyword matches
      }
      
      // Boost score for code examples and practical content
      if (section.includes('```') || section.includes('example') || section.includes('usage')) {
        score += 5;
      }
      
      // Boost score for API references and methods
      if (section.includes('function') || section.includes('method') || section.includes('API')) {
        score += 3;
      }
      
      // Boost score for configuration and setup
      if (section.includes('config') || section.includes('setup') || section.includes('install')) {
        score += 2;
      }
      
      // Boost score for troubleshooting and common issues
      if (section.includes('error') || section.includes('issue') || section.includes('problem')) {
        score += 2;
      }
      
      // Calculate token count for this section
      const tokens = this.countTokens(section);
      
      return { content: section, score, tokens };
    });
  }

  /**
   * Select sections within token limit based on scores
   * Implements optimal content selection algorithm
   */
  private selectSectionsWithinLimit(
    scoredSections: Array<{ content: string; score: number; tokens: number }>,
    maxTokens: number
  ): string[] {
    // Sort by score (highest first)
    const sortedSections = scoredSections.sort((a, b) => b.score - a.score);
    
    const selectedSections: string[] = [];
    let totalTokens = 0;
    
    for (const section of sortedSections) {
      if (totalTokens + section.tokens <= maxTokens) {
        selectedSections.push(section.content);
        totalTokens += section.tokens;
      } else {
        // Try to fit partial content if we have space
        const remainingTokens = maxTokens - totalTokens;
        if (remainingTokens > 100) { // Only if we have meaningful space left
          const partialContent = this.truncateToTokens(section.content, remainingTokens);
          if (partialContent.trim().length > 0) {
            selectedSections.push(partialContent);
          }
        }
        break;
      }
    }
    
    return selectedSections;
  }

  /**
   * Truncate content to specific token count
   * Implements safe content truncation
   */
  private truncateToTokens(content: string, maxTokens: number): string {
    const estimatedChars = maxTokens * 4; // Rough approximation
    if (content.length <= estimatedChars) {
      return content;
    }
    
    // Find a good breaking point (end of sentence or word)
    let truncated = content.substring(0, estimatedChars);
    const lastSentence = truncated.lastIndexOf('.');
    const lastWord = truncated.lastIndexOf(' ');
    
    if (lastSentence > estimatedChars * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    } else if (lastWord > estimatedChars * 0.8) {
      return truncated.substring(0, lastWord) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Count tokens in content (rough approximation)
   * Implements token counting for content optimization
   */
  private countTokens(content: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    // This is a simplified version - in production, you might want to use a proper tokenizer
    return Math.ceil(content.length / 4);
  }

  /**
   * Get priority emoji for display
   */
  private getPriorityEmoji(priority: string): string {
    const emojiMap: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    };
    
    return emojiMap[priority] || '⚪';
  }

  /**
   * Log token usage for monitoring
   * Implements usage tracking for optimization
   */
  private logTokenUsage(operation: string, content: string, maxTokens: number, prompt: string): void {
    const actualTokens = this.countTokens(content);
    const efficiency = maxTokens > 0 ? (actualTokens / maxTokens) * 100 : 0;
    
    this.logger.debug('Token usage logged', {
      operation,
      actualTokens,
      maxTokens,
      efficiency: efficiency.toFixed(1) + '%',
      promptLength: prompt.length,
      contentLength: content.length
    });
  }
}
