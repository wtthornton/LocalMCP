/**
 * Simple Pattern Engine
 * 
 * Implements existing patterns with success tracking and automatic weight adjustment
 * for framework detection. Builds on the current hardcoded patterns but makes them adaptive.
 */

import { Logger } from '../logger/logger.js';
import { SimpleCacheManagerService } from './simple-cache-manager.service.js';
import type { 
  AdaptivePattern, 
  PatternMatch, 
  PatternExecutionResult, 
  PatternLearningData,
  PatternStats,
  PatternRegistry 
} from './adaptive-pattern.interface.js';

export class SimplePatternEngineService {
  private logger: Logger;
  private cacheManager: SimpleCacheManagerService;
  private registry: PatternRegistry;
  private initialized = false;

  constructor(logger: Logger, cacheManager: SimpleCacheManagerService) {
    this.logger = logger;
    this.cacheManager = cacheManager;
    
    this.registry = {
      patterns: new Map(),
      stats: new Map(),
      learningData: [],
      config: {
        minSuccessRate: 0.3,
        learningRate: 0.1,
        maxLearningData: 1000,
        autoLearningEnabled: true
      }
    };

    this.initializePatterns();
  }

  /**
   * Initialize patterns from existing hardcoded patterns
   */
  private initializePatterns(): void {
    const patterns: Omit<AdaptivePattern, 'successRate' | 'usageCount' | 'successCount' | 'lastUsed' | 'lastUpdated'>[] = [
      {
        id: 'create-component',
        name: 'Create Component Pattern',
        regex: /create\s+a\s+(\w+)\s+component/gi,
        type: 'component',
        weight: 1.0,
        baseConfidence: 0.9,
        enabled: true
      },
      {
        id: 'using-framework',
        name: 'Using Framework Pattern',
        regex: /using\s+(\w+)\s+framework/gi,
        type: 'framework',
        weight: 1.0,
        baseConfidence: 0.9,
        enabled: true
      },
      {
        id: 'with-library',
        name: 'With Library Pattern',
        regex: /with\s+(\w+)\s+library/gi,
        type: 'library',
        weight: 1.0,
        baseConfidence: 0.8,
        enabled: true
      },
      {
        id: 'build-app',
        name: 'Build App Pattern',
        regex: /build\s+(\w+)\s+app/gi,
        type: 'app',
        weight: 0.9,
        baseConfidence: 0.8,
        enabled: true
      },
      {
        id: 'component-suffix',
        name: 'Component Suffix Pattern',
        regex: /(\w+)\s+component/gi,
        type: 'component',
        weight: 0.8,
        baseConfidence: 0.7,
        enabled: true
      },
      {
        id: 'framework-suffix',
        name: 'Framework Suffix Pattern',
        regex: /(\w+)\s+framework/gi,
        type: 'framework',
        weight: 0.8,
        baseConfidence: 0.7,
        enabled: true
      },
      {
        id: 'library-suffix',
        name: 'Library Suffix Pattern',
        regex: /(\w+)\s+library/gi,
        type: 'library',
        weight: 0.8,
        baseConfidence: 0.7,
        enabled: true
      },
      {
        id: 'ui-library',
        name: 'UI Library Pattern',
        regex: /(\w+)\s+ui/gi,
        type: 'ui',
        weight: 0.7,
        baseConfidence: 0.6,
        enabled: true
      },
      {
        id: 'styling-library',
        name: 'Styling Library Pattern',
        regex: /(\w+)\s+styling/gi,
        type: 'styling',
        weight: 0.7,
        baseConfidence: 0.6,
        enabled: true
      }
    ];

    // Initialize patterns with default learning data
    patterns.forEach(patternData => {
      const now = new Date();
      const pattern: AdaptivePattern = {
        ...patternData,
        successRate: 1.0, // Start with high confidence
        usageCount: 0,
        successCount: 0,
        lastUsed: now,
        lastUpdated: now
      };

      this.registry.patterns.set(pattern.id, pattern);
      this.registry.stats.set(pattern.id, {
        patternId: pattern.id,
        totalUsage: 0,
        successCount: 0,
        successRate: 1.0,
        averageConfidence: pattern.baseConfidence,
        lastUsed: now,
        trend: 'stable'
      });
    });

    this.initialized = true;
    this.logger.info(`Initialized ${patterns.length} adaptive patterns`);
  }

  /**
   * Execute patterns against a prompt and return matches
   */
  async executePatterns(prompt: string): Promise<PatternExecutionResult> {
    const startTime = performance.now();
    const matches: PatternMatch[] = [];

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(prompt);
      const cached = await this.cacheManager.get('patterns', cacheKey);
      if (cached) {
        return {
          matches: cached.data,
          executionTime: performance.now() - startTime,
          success: true
        };
      }

      // Execute all enabled patterns
      for (const pattern of this.registry.patterns.values()) {
        if (!pattern.enabled) continue;

        const patternMatches = this.executeSinglePattern(pattern, prompt);
        matches.push(...patternMatches);

        // Update usage statistics
        if (patternMatches.length > 0) {
          this.updatePatternUsage(pattern.id);
        }
      }

      // Deduplicate and sort matches by confidence
      const deduplicatedMatches = this.deduplicateMatches(matches);
      const sortedMatches = deduplicatedMatches.sort((a, b) => b.confidence - a.confidence);

      // Cache the results
      await this.cacheManager.set('patterns', sortedMatches, 3600000, cacheKey); // 1 hour TTL

      return {
        matches: sortedMatches,
        executionTime: performance.now() - startTime,
        success: true
      };

    } catch (error) {
      this.logger.error('Pattern execution failed', { error, prompt });
      return {
        matches: [],
        executionTime: performance.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute a single pattern against the prompt
   */
  private executeSinglePattern(pattern: AdaptivePattern, prompt: string): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const regexMatches = prompt.matchAll(pattern.regex);

    for (const match of regexMatches) {
      const name = match[1]?.toLowerCase();
      if (name && this.isValidLibraryName(name)) {
        const confidence = this.calculatePatternConfidence(pattern, name);
        
        matches.push({
          name,
          libraryId: '',
          confidence,
          source: 'pattern',
          patternId: pattern.id,
          metadata: {
            matchText: match[0],
            position: match.index,
            context: this.extractContext(prompt, match.index || 0)
          }
        });
      }
    }

    return matches;
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private calculatePatternConfidence(pattern: AdaptivePattern, name: string): number {
    // Base confidence adjusted by pattern weight and success rate
    let confidence = pattern.baseConfidence * pattern.weight * pattern.successRate;
    
    // Boost confidence for known frameworks
    const knownFrameworks = ['react', 'vue', 'angular', 'svelte', 'html', 'css', 'javascript', 'typescript'];
    if (knownFrameworks.includes(name)) {
      confidence *= 1.2;
    }

    // Cap confidence at 1.0
    return Math.min(1.0, confidence);
  }

  /**
   * Validate library name
   */
  private isValidLibraryName(name: string): boolean {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    return name.length > 2 && !commonWords.includes(name) && /^[a-z0-9-]+$/.test(name);
  }

  /**
   * Extract context around a match
   */
  private extractContext(prompt: string, position: number): string {
    const contextLength = 50;
    const start = Math.max(0, position - contextLength);
    const end = Math.min(prompt.length, position + contextLength);
    return prompt.substring(start, end);
  }

  /**
   * Deduplicate matches by name, keeping the highest confidence
   */
  private deduplicateMatches(matches: PatternMatch[]): PatternMatch[] {
    const uniqueMatches = new Map<string, PatternMatch>();

    for (const match of matches) {
      const existing = uniqueMatches.get(match.name);
      if (!existing || match.confidence > existing.confidence) {
        uniqueMatches.set(match.name, match);
      }
    }

    return Array.from(uniqueMatches.values());
  }

  /**
   * Update pattern usage statistics
   */
  private updatePatternUsage(patternId: string): void {
    const pattern = this.registry.patterns.get(patternId);
    const stats = this.registry.stats.get(patternId);

    if (pattern && stats) {
      pattern.usageCount++;
      pattern.lastUsed = new Date();
      stats.totalUsage++;
      stats.lastUsed = new Date();
    }
  }

  /**
   * Learn from pattern execution results
   */
  async learnFromResults(learningData: PatternLearningData): Promise<void> {
    if (!this.registry.config.autoLearningEnabled) return;

    try {
      const pattern = this.registry.patterns.get(learningData.patternId);
      if (!pattern) return;

      // Update success statistics
      pattern.successCount += learningData.wasSuccessful ? 1 : 0;
      pattern.successRate = pattern.successCount / Math.max(1, pattern.usageCount);
      pattern.lastUpdated = new Date();

      // Adjust pattern weight based on success rate
      const weightAdjustment = learningData.wasSuccessful ? 
        this.registry.config.learningRate : -this.registry.config.learningRate;
      
      pattern.weight = Math.max(0.1, Math.min(1.0, pattern.weight + weightAdjustment));

      // Update stats
      const stats = this.registry.stats.get(learningData.patternId);
      if (stats) {
        stats.successCount = pattern.successCount;
        stats.successRate = pattern.successRate;
        
        // Determine trend
        if (stats.successRate > 0.7) stats.trend = 'up';
        else if (stats.successRate < 0.3) stats.trend = 'down';
        else stats.trend = 'stable';

        // Disable patterns with very low success rates
        if (pattern.successRate < this.registry.config.minSuccessRate && pattern.usageCount > 10) {
          pattern.enabled = false;
          this.logger.warn(`Disabled pattern ${learningData.patternId} due to low success rate`, {
            patternId: learningData.patternId,
            successRate: pattern.successRate,
            usageCount: pattern.usageCount
          });
        }
      }

      // Store learning data
      this.registry.learningData.push(learningData);
      
      // Trim learning data if it gets too large
      if (this.registry.learningData.length > this.registry.config.maxLearningData) {
        this.registry.learningData = this.registry.learningData.slice(-this.registry.config.maxLearningData);
      }

      this.logger.debug('Pattern learning completed', {
        patternId: learningData.patternId,
        wasSuccessful: learningData.wasSuccessful,
        newSuccessRate: pattern.successRate,
        newWeight: pattern.weight
      });

    } catch (error) {
      this.logger.error('Pattern learning failed', { error, learningData });
    }
  }

  /**
   * Get pattern statistics
   */
  getPatternStats(): PatternStats[] {
    return Array.from(this.registry.stats.values());
  }

  /**
   * Get enabled patterns
   */
  getEnabledPatterns(): AdaptivePattern[] {
    return Array.from(this.registry.patterns.values()).filter(p => p.enabled);
  }

  /**
   * Generate cache key for prompt
   */
  private generateCacheKey(prompt: string): string {
    // Simple hash of the prompt for caching
    return prompt.toLowerCase().replace(/\s+/g, '').substring(0, 50);
  }

  /**
   * Clear pattern cache
   */
  async clearCache(): Promise<void> {
    // This would clear pattern-specific cache entries
    // Implementation depends on cache manager capabilities
    this.logger.info('Pattern cache cleared');
  }

  /**
   * Extract frameworks using patterns (compatible with existing interface)
   */
  async extractFrameworks(prompt: string): Promise<any[]> {
    // Simple implementation that runs patterns and returns matches
    const matches: any[] = [];
    
    for (const [patternId, pattern] of this.registry.patterns) {
      if (!pattern.enabled) continue;
      
      const regexMatches = prompt.matchAll(pattern.regex);
      for (const match of regexMatches) {
        const name = match[1]?.toLowerCase();
        if (name) {
          matches.push({
            name,
            libraryId: '',
            confidence: pattern.weight * pattern.successRate,
            source: `pattern-${patternId}`
          });
        }
      }
    }
    
    return matches;
  }
}
