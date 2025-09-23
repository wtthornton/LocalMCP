/**
 * Prompt Analyzer Service
 * 
 * Analyzes prompt complexity and provides optimized options
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Intelligent prompt complexity detection
 * - Adaptive response sizing
 * - Optimized performance for different prompt types
 * - Single responsibility principle
 */

import { Logger } from '../../services/logger/logger.js';

export interface PromptComplexity {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  indicators: string[];
}

export interface OptimizedOptions {
  maxTokens: number;
  includeMetadata: boolean;
  useCache: boolean;
  simpleMode?: boolean;
}

export class PromptAnalyzerService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Analyze prompt complexity to determine appropriate response strategy
   * Implements intelligent complexity detection with multiple indicators
   */
  analyzePromptComplexity(prompt: string): PromptComplexity {
    const indicators: string[] = [];
    let score = 0;
    
    // Length-based scoring
    if (prompt.length < 20) {
      score += 3;
      indicators.push('very-short');
    } else if (prompt.length < 50) {
      score += 2;
      indicators.push('short');
    } else if (prompt.length > 200) {
      score += 1;
      indicators.push('long');
    }
    
    // Simple question patterns
    const simplePatterns = [
      /^(yes|no|ok|sure|maybe)\s*$/i,
      /^(yes|no)\s+or\s+(yes|no)/i,
      /^(what|how|when|where|why)\s+\w+\?$/i,
      /^(is|are|was|were|do|does|did|can|could|will|would)\s+\w+/i,
      /^what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+\??$/i,  // Math questions like "What is 2+2?"
      /^\d+\s*[\+\-\*\/]\s*\d+\??$/i,  // Direct math like "2+2?"
      /^what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+\s*\??$/i,  // "What is 2+2" without question mark
      /^how\s+do\s+i\s+create\s+a\s+(button|div|span|form|input|select)\??$/i,  // Simple HTML element questions
      /^how\s+to\s+create\s+a\s+(button|div|span|form|input|select)\??$/i,  // Simple HTML element questions
      /^how\s+do\s+i\s+make\s+a\s+(button|div|span|form|input|select)\??$/i  // Simple HTML element questions
    ];
    
    if (simplePatterns.some(pattern => pattern.test(prompt.trim()))) {
      score += 2;
      indicators.push('simple-question');
    }
    
    // Complex development patterns
    const complexPatterns = [
      /create|build|implement|develop/i,
      /component|function|class|service/i,
      /api|endpoint|database|schema/i,
      /test|testing|debug|fix/i,
      /deploy|production|staging/i
    ];
    
    const complexMatches = complexPatterns.filter(pattern => pattern.test(prompt));
    if (complexMatches.length > 0) {
      score -= complexMatches.length;
      indicators.push(...complexMatches.map(() => 'development-task'));
    }
    
    // Framework-specific complexity
    const frameworkKeywords = [
      'react', 'vue', 'angular', 'typescript', 'javascript',
      'node', 'express', 'next', 'nuxt', 'svelte'
    ];
    
    const frameworkMatches = frameworkKeywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    if (frameworkMatches.length > 0) {
      score -= frameworkMatches.length * 0.5;
      indicators.push(...frameworkMatches.map(() => 'framework-specific'));
    }
    
    // Determine complexity level
    let level: 'simple' | 'medium' | 'complex';
    if (score >= 2) {
      level = 'simple';
    } else if (score >= 0) {
      level = 'medium';
    } else {
      level = 'complex';
    }
    
    this.logger.debug('Prompt complexity analysis', {
      prompt: prompt.substring(0, 100) + '...',
      level,
      score,
      indicators
    });
    
    return { level, score, indicators };
  }

  /**
   * Get optimized options based on prompt complexity
   * Implements adaptive response sizing for better user experience
   */
  getOptimizedOptions(
    originalOptions: any,
    complexity: PromptComplexity
  ): OptimizedOptions {
    const options = { ...originalOptions };
    
    switch (complexity.level) {
      case 'simple':
        // Minimal context for simple prompts like "yes or no" (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 400);
        options.includeMetadata = false;
        options.useCache = true;
        options.simpleMode = true;
        break;
        
      case 'medium':
        // Moderate context for medium complexity prompts (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 1200);
        options.includeMetadata = true;
        options.useCache = true;
        break;
        
      case 'complex':
        // Full context for complex development tasks (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 3200);
        options.includeMetadata = true;
        options.useCache = true;
        break;
    }
    
    this.logger.debug('Optimized options generated', {
      complexity: complexity.level,
      maxTokens: options.maxTokens,
      includeMetadata: options.includeMetadata,
      useCache: options.useCache
    });
    
    return options;
  }

  /**
   * Check if a prompt should trigger breakdown functionality
   * Analyzes prompt characteristics to determine if task breakdown would be beneficial
   */
  shouldBreakdown(prompt: string, options?: { includeBreakdown?: boolean; maxTasks?: number }): boolean {
    try {
      // If explicitly disabled, don't breakdown
      if (options?.includeBreakdown === false) {
        return false;
      }

      // If explicitly enabled, always breakdown
      if (options?.includeBreakdown === true) {
        return true;
      }

      // Auto-detect based on prompt characteristics
      const promptLower = prompt.toLowerCase();
      
      // Keywords that suggest complex, multi-step projects
      const complexKeywords = [
        'build', 'create', 'develop', 'implement', 'design', 'setup',
        'application', 'app', 'platform', 'system', 'website', 'dashboard',
        'full-stack', 'end-to-end', 'complete', 'entire', 'whole'
      ];
      
      // Keywords that suggest simple, single tasks
      const simpleKeywords = [
        'fix', 'debug', 'update', 'change', 'modify', 'add', 'remove',
        'component', 'function', 'method', 'class', 'variable'
      ];
      
      const hasComplexKeywords = complexKeywords.some(keyword => promptLower.includes(keyword));
      const hasSimpleKeywords = simpleKeywords.some(keyword => promptLower.includes(keyword));
      
      // Check prompt length (longer prompts are more likely to be complex)
      const isLongPrompt = prompt.length > 100;
      
      // Check for multiple sentences or bullet points (suggests multiple tasks)
      const hasMultipleParts = prompt.includes('.') && prompt.split('.').length > 2;
      const hasBulletPoints = prompt.includes('-') || prompt.includes('*') || prompt.includes('•');
      
      // Decision logic
      if (hasComplexKeywords && (isLongPrompt || hasMultipleParts || hasBulletPoints)) {
        return true;
      }
      
      if (hasSimpleKeywords && !isLongPrompt) {
        return false;
      }
      
      // Default to breakdown for medium-length prompts with project keywords
      return isLongPrompt && (hasComplexKeywords || hasMultipleParts);
      
    } catch (error) {
      this.logger.warn('Error detecting prompt complexity for breakdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      return false;
    }
  }

  /**
   * Extract keywords from prompt for better analysis
   * Used for Context7 library selection and content scoring
   */
  extractKeywords(prompt: string): string[] {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out short words
      .filter(word => !this.isStopWord(word)); // Remove stop words
    
    // Get unique words and limit to top 10
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * Check if a word is a stop word (common words that don't add meaning)
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    
    return stopWords.has(word);
  }
}
