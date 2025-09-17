/**
 * Shared Knowledge Base Service
 * 
 * Manages the shared knowledge base for promoted lessons and cross-project
 * learning patterns. Provides centralized access to validated, high-quality lessons.
 * 
 * Vibe Coder Benefits:
 * - Centralized high-quality lesson repository
 * - Cross-project knowledge sharing
 * - Quality-assured learning patterns
 * - Easy access to proven solutions
 */

import { Logger } from '../logger/logger.js';
import type { LessonCard } from '../lessons/lessons-learned.service.js';
import type { LearningPattern, LearningInsight } from '../learning/adaptive-learning.service.js';

const logger = new Logger('SharedKnowledgeBaseService');

export interface SharedLesson extends LessonCard {
  id: string;
  originalLessonId: string;
  promotedFrom: string;
  promotedAt: Date;
  promotionScore: number;
  usageCount: number;
  crossProjectUsage: string[];
  qualityMetrics: {
    confidence: number;
    successRate: number;
    userRating: number;
    lastValidated: Date;
  };
  metadata: LessonCard['metadata'] & {
    isShared: true;
    sharedVersion: number;
    lastUpdated: Date;
  };
}

export interface KnowledgeBaseStats {
  totalLessons: number;
  totalPatterns: number;
  totalInsights: number;
  averageQuality: number;
  crossProjectCoverage: number;
  topCategories: { category: string; count: number }[];
  topFrameworks: { framework: string; count: number }[];
  recentAdditions: number;
  qualityDistribution: {
    excellent: number; // 90-100
    good: number;     // 80-89
    average: number;  // 70-79
    poor: number;     // <70
  };
}

export interface SearchFilters {
  categories?: string[];
  frameworks?: string[];
  minQuality?: number;
  maxAge?: number; // in days
  hasExamples?: boolean;
  crossProjectUsed?: boolean;
}

export interface SearchResult {
  lessons: SharedLesson[];
  totalCount: number;
  searchTime: number;
  filters: SearchFilters;
}

export interface KnowledgeBaseConfiguration {
  maxLessons: number;
  minPromotionScore: number;
  autoCleanupEnabled: boolean;
  qualityThreshold: number;
  updateFrequency: number; // in hours
}

export class SharedKnowledgeBaseService {
  private sharedLessons = new Map<string, SharedLesson>();
  private sharedPatterns = new Map<string, LearningPattern>();
  private sharedInsights = new Map<string, LearningInsight>();
  private usageTracking = new Map<string, { count: number; projects: Set<string>; lastUsed: Date }>();
  private config: KnowledgeBaseConfiguration;

  constructor(config?: Partial<KnowledgeBaseConfiguration>) {
    this.config = {
      maxLessons: 1000,
      minPromotionScore: 70,
      autoCleanupEnabled: true,
      qualityThreshold: 0.7,
      updateFrequency: 24,
      ...config
    };

    logger.info('SharedKnowledgeBaseService initialized', { config: this.config });
  }

  /**
   * Add a lesson to the shared knowledge base
   */
  async addSharedLesson(
    lesson: LessonCard,
    promotionScore: number,
    originalLessonId: string,
    promotedFrom: string
  ): Promise<SharedLesson | null> {
    if (promotionScore < this.config.minPromotionScore) {
      logger.warn(`Lesson ${lesson.content.summary} rejected: promotion score ${promotionScore} below threshold ${this.config.minPromotionScore}`);
      return null;
    }

    if (this.sharedLessons.size >= this.config.maxLessons) {
      await this.performCleanup();
      if (this.sharedLessons.size >= this.config.maxLessons) {
        logger.warn(`Knowledge base full: cannot add lesson ${lesson.content.summary}`);
        return null;
      }
    }

    const sharedLesson: SharedLesson = {
      ...lesson,
      id: `shared_${lesson.id}`,
      originalLessonId,
      promotedFrom,
      promotedAt: new Date(),
      promotionScore,
      usageCount: 0,
      crossProjectUsage: [],
      qualityMetrics: {
        confidence: lesson.confidence || 0,
        successRate: lesson.successCount / (lesson.successCount + lesson.failureCount) || 0,
        userRating: 0,
        lastValidated: new Date()
      },
      metadata: {
        ...lesson.metadata,
        isShared: true,
        sharedVersion: 1,
        lastUpdated: new Date()
      }
    };

    this.sharedLessons.set(sharedLesson.id, sharedLesson);
    this.usageTracking.set(sharedLesson.id, {
      count: 0,
      projects: new Set(),
      lastUsed: new Date()
    });

    logger.info(`Added lesson to shared knowledge base: ${lesson.content.summary}`, {
      lessonId: sharedLesson.id,
      promotionScore,
      promotedFrom
    });

    return sharedLesson;
  }

  /**
   * Search shared lessons
   */
  searchLessons(
    query?: string,
    filters?: SearchFilters,
    limit: number = 50,
    offset: number = 0
  ): SearchResult {
    const startTime = Date.now();
    let results = Array.from(this.sharedLessons.values());

    // Apply text search
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      results = results.filter(lesson => {
        const searchText = `${lesson.content.summary} ${lesson.content.description} ${lesson.metadata.category} ${lesson.metadata.framework}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
    }

    // Apply filters
    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        results = results.filter(lesson => 
          lesson.metadata.category && filters.categories!.includes(lesson.metadata.category)
        );
      }

      if (filters.frameworks && filters.frameworks.length > 0) {
        results = results.filter(lesson => 
          lesson.metadata.framework && filters.frameworks!.includes(lesson.metadata.framework)
        );
      }

      if (filters.minQuality !== undefined) {
        results = results.filter(lesson => 
          lesson.qualityMetrics.confidence >= filters.minQuality!
        );
      }

      if (filters.maxAge !== undefined) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.maxAge!);
        results = results.filter(lesson => lesson.promotedAt >= cutoffDate);
      }

      if (filters.hasExamples !== undefined) {
        results = results.filter(lesson => 
          filters.hasExamples ? lesson.content.examples && lesson.content.examples.length > 0 : true
        );
      }

      if (filters.crossProjectUsed !== undefined) {
        results = results.filter(lesson => 
          filters.crossProjectUsed ? lesson.crossProjectUsage.length > 1 : true
        );
      }
    }

    // Sort by quality and relevance
    results.sort((a, b) => {
      const scoreA = a.qualityMetrics.confidence * a.qualityMetrics.successRate * a.usageCount;
      const scoreB = b.qualityMetrics.confidence * b.qualityMetrics.successRate * b.usageCount;
      return scoreB - scoreA;
    });

    // Apply pagination
    const totalCount = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    const searchTime = Date.now() - startTime;

    logger.debug(`Search completed: ${paginatedResults.length} results in ${searchTime}ms`, {
      query,
      filters,
      totalCount
    });

    return {
      lessons: paginatedResults,
      totalCount,
      searchTime,
      filters: filters || {}
    };
  }

  /**
   * Get lesson by ID
   */
  getSharedLesson(lessonId: string): SharedLesson | undefined {
    return this.sharedLessons.get(lessonId);
  }

  /**
   * Track lesson usage
   */
  trackLessonUsage(lessonId: string, projectId: string): void {
    const lesson = this.sharedLessons.get(lessonId);
    if (!lesson) {
      logger.warn(`Cannot track usage for non-existent lesson: ${lessonId}`);
      return;
    }

    const usage = this.usageTracking.get(lessonId);
    if (!usage) {
      logger.warn(`Cannot track usage for lesson without tracking data: ${lessonId}`);
      return;
    }

    usage.count++;
    usage.projects.add(projectId);
    usage.lastUsed = new Date();

    // Update lesson data
    lesson.usageCount = usage.count;
    lesson.crossProjectUsage = Array.from(usage.projects);

    logger.debug(`Tracked usage for lesson: ${lesson.content.summary}`, {
      lessonId,
      projectId,
      totalUsage: usage.count,
      uniqueProjects: usage.projects.size
    });
  }

  /**
   * Update lesson quality metrics
   */
  updateLessonQuality(lessonId: string, metrics: Partial<SharedLesson['qualityMetrics']>): boolean {
    const lesson = this.sharedLessons.get(lessonId);
    if (!lesson) {
      return false;
    }

    Object.assign(lesson.qualityMetrics, metrics);
    lesson.qualityMetrics.lastValidated = new Date();
    lesson.metadata.lastUpdated = new Date();

    logger.info(`Updated quality metrics for lesson: ${lesson.content.summary}`, {
      lessonId,
      metrics
    });

    return true;
  }

  /**
   * Add shared pattern
   */
  addSharedPattern(pattern: LearningPattern): void {
    this.sharedPatterns.set(pattern.id, pattern);
    logger.info(`Added shared pattern: ${pattern.name}`, { patternId: pattern.id });
  }

  /**
   * Add shared insight
   */
  addSharedInsight(insight: LearningInsight): void {
    this.sharedInsights.set(insight.id, insight);
    logger.info(`Added shared insight: ${insight.title}`, { insightId: insight.id });
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats(): KnowledgeBaseStats {
    const lessons = Array.from(this.sharedLessons.values());
    const patterns = Array.from(this.sharedPatterns.values());
    const insights = Array.from(this.sharedInsights.values());

    // Calculate quality distribution
    const qualityDistribution = {
      excellent: 0,
      good: 0,
      average: 0,
      poor: 0
    };

    lessons.forEach(lesson => {
      const quality = lesson.qualityMetrics.confidence;
      if (quality >= 0.9) qualityDistribution.excellent++;
      else if (quality >= 0.8) qualityDistribution.good++;
      else if (quality >= 0.7) qualityDistribution.average++;
      else qualityDistribution.poor++;
    });

    // Calculate top categories
    const categoryCounts = new Map<string, number>();
    lessons.forEach(lesson => {
      const category = lesson.metadata.category || 'unknown';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));

    // Calculate top frameworks
    const frameworkCounts = new Map<string, number>();
    lessons.forEach(lesson => {
      const framework = lesson.metadata.framework || 'unknown';
      frameworkCounts.set(framework, (frameworkCounts.get(framework) || 0) + 1);
    });

    const topFrameworks = Array.from(frameworkCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([framework, count]) => ({ framework, count }));

    // Calculate recent additions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAdditions = lessons.filter(lesson => lesson.promotedAt >= sevenDaysAgo).length;

    // Calculate cross-project coverage
    const crossProjectCoverage = lessons.length > 0 ? 
      lessons.filter(lesson => lesson.crossProjectUsage.length > 1).length / lessons.length : 0;

    // Calculate average quality
    const averageQuality = lessons.length > 0 ?
      lessons.reduce((sum, lesson) => sum + lesson.qualityMetrics.confidence, 0) / lessons.length : 0;

    return {
      totalLessons: lessons.length,
      totalPatterns: patterns.length,
      totalInsights: insights.length,
      averageQuality,
      crossProjectCoverage,
      topCategories,
      topFrameworks,
      recentAdditions,
      qualityDistribution
    };
  }

  /**
   * Get recommended lessons for a project
   */
  getRecommendedLessons(
    projectContext: any,
    limit: number = 10
  ): SharedLesson[] {
    const lessons = Array.from(this.sharedLessons.values());

    // Filter lessons relevant to project context
    let relevantLessons = lessons.filter(lesson => {
      // Match framework if specified
      if (projectContext.techStack?.frameworks?.length > 0) {
        return projectContext.techStack.frameworks.includes(lesson.metadata.framework) ||
               lesson.metadata.framework === 'generic';
      }
      return true;
    });

    // Sort by relevance and quality
    relevantLessons.sort((a, b) => {
      const relevanceScoreA = this.calculateRelevanceScore(a, projectContext);
      const relevanceScoreB = this.calculateRelevanceScore(b, projectContext);
      return relevanceScoreB - relevanceScoreA;
    });

    return relevantLessons.slice(0, limit);
  }

  /**
   * Calculate relevance score for a lesson
   */
  private calculateRelevanceScore(lesson: SharedLesson, projectContext: any): number {
    let score = 0;

    // Base quality score
    score += lesson.qualityMetrics.confidence * 0.3;
    score += lesson.qualityMetrics.successRate * 0.3;

    // Usage score
    score += Math.min(0.2, lesson.usageCount / 100);

    // Framework relevance
    if (projectContext.techStack?.frameworks?.includes(lesson.metadata.framework)) {
      score += 0.2;
    }

    return score;
  }

  /**
   * Perform cleanup of low-quality or unused lessons
   */
  async performCleanup(): Promise<{ removed: number; kept: number }> {
    if (!this.config.autoCleanupEnabled) {
      return { removed: 0, kept: this.sharedLessons.size };
    }

    const lessons = Array.from(this.sharedLessons.values());
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days

    const toRemove = lessons.filter(lesson => {
      const usage = this.usageTracking.get(lesson.id);
      const isOld = lesson.promotedAt < cutoffDate;
      const isLowQuality = lesson.qualityMetrics.confidence < this.config.qualityThreshold;
      const isUnused = !usage || usage.count === 0;

      return isOld && (isLowQuality || isUnused);
    });

    // Remove lessons (keep top 80% by quality)
    const sortedLessons = lessons.sort((a, b) => b.qualityMetrics.confidence - a.qualityMetrics.confidence);
    const keepCount = Math.floor(sortedLessons.length * 0.8);
    const toKeep = sortedLessons.slice(0, keepCount);

    // Remove lessons not in keep list
    const actuallyRemoved = toRemove.filter(lesson => !toKeep.includes(lesson));
    
    actuallyRemoved.forEach(lesson => {
      this.sharedLessons.delete(lesson.id);
      this.usageTracking.delete(lesson.id);
    });

    logger.info(`Performed knowledge base cleanup`, {
      removed: actuallyRemoved.length,
      kept: this.sharedLessons.size,
      totalBefore: lessons.length
    });

    return { removed: actuallyRemoved.length, kept: this.sharedLessons.size };
  }

  /**
   * Export knowledge base
   */
  exportKnowledgeBase(): {
    lessons: SharedLesson[];
    patterns: LearningPattern[];
    insights: LearningInsight[];
    stats: KnowledgeBaseStats;
    exportedAt: Date;
  } {
    return {
      lessons: Array.from(this.sharedLessons.values()),
      patterns: Array.from(this.sharedPatterns.values()),
      insights: Array.from(this.sharedInsights.values()),
      stats: this.getKnowledgeBaseStats(),
      exportedAt: new Date()
    };
  }

  /**
   * Import knowledge base
   */
  importKnowledgeBase(data: {
    lessons: SharedLesson[];
    patterns: LearningPattern[];
    insights: LearningInsight[];
  }): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    // Import lessons
    data.lessons.forEach(lesson => {
      try {
        this.sharedLessons.set(lesson.id, lesson);
        this.usageTracking.set(lesson.id, {
          count: lesson.usageCount,
          projects: new Set(lesson.crossProjectUsage),
          lastUsed: new Date()
        });
        imported++;
      } catch (error) {
        errors.push(`Failed to import lesson ${lesson.content.summary}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Import patterns
    data.patterns.forEach(pattern => {
      try {
        this.sharedPatterns.set(pattern.id, pattern);
        imported++;
      } catch (error) {
        errors.push(`Failed to import pattern ${pattern.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Import insights
    data.insights.forEach(insight => {
      try {
        this.sharedInsights.set(insight.id, insight);
        imported++;
      } catch (error) {
        errors.push(`Failed to import insight ${insight.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    logger.info(`Imported knowledge base`, { imported, errors: errors.length });
    return { imported, errors };
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<KnowledgeBaseConfiguration>): void {
    Object.assign(this.config, config);
    logger.info('Updated knowledge base configuration', { config });
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.sharedLessons.clear();
    this.sharedPatterns.clear();
    this.sharedInsights.clear();
    this.usageTracking.clear();
    logger.info('Cleared all knowledge base data');
  }
}
