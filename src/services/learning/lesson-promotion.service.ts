/**
 * Lesson Promotion Service
 * 
 * Manages the promotion of lessons from project-specific to shared knowledge base.
 * Implements confidence scoring, promotion criteria, and cross-project validation.
 * 
 * Vibe Coder Benefits:
 * - Automatic lesson quality assessment
 * - Smart promotion of valuable patterns
 * - Cross-project knowledge sharing
 * - Quality assurance for shared lessons
 */

import { Logger } from '../logger/logger.js';
import type { LessonCard } from '../lessons/lessons-learned.service.js';
import type { ProjectMetadata } from '../project/project-identifier.service.js';

const logger = new Logger('LessonPromotionService');

export interface PromotionCriteria {
  minUsageCount: number;
  minSuccessRate: number;
  minConfidenceScore: number;
  maxAge: number; // in days
  minProjectCount: number;
  requireValidation: boolean;
}

export interface PromotionScore {
  overallScore: number; // 0-100
  usageScore: number; // 0-25
  successScore: number; // 0-25
  confidenceScore: number; // 0-25
  diversityScore: number; // 0-25
  breakdown: {
    usageCount: number;
    successRate: number;
    confidence: number;
    projectDiversity: number;
    ageScore: number;
  };
}

export interface PromotionCandidate {
  lesson: LessonCard;
  score: PromotionScore;
  projectContext: ProjectMetadata;
  promotionReason: string;
  risks: string[];
  benefits: string[];
}

export interface PromotionResult {
  success: boolean;
  promotedLesson?: LessonCard;
  originalLessonId: string;
  promotionScore: number;
  errors: string[];
  warnings: string[];
}

export interface CrossProjectAnalysis {
  totalProjects: number;
  analyzedProjects: number;
  commonPatterns: string[];
  uniquePatterns: string[];
  promotionOpportunities: number;
  qualityTrends: {
    averageConfidence: number;
    averageSuccessRate: number;
    improvementRate: number;
  };
}

export class LessonPromotionService {
  private defaultCriteria: PromotionCriteria;
  private promotedLessons = new Map<string, LessonCard>();
  private promotionHistory: PromotionResult[] = [];

  constructor(criteria?: Partial<PromotionCriteria>) {
    this.defaultCriteria = {
      minUsageCount: 5,
      minSuccessRate: 0.8, // 80%
      minConfidenceScore: 0.7, // 70%
      maxAge: 30, // 30 days
      minProjectCount: 2,
      requireValidation: true,
      ...criteria
    };

    logger.info('LessonPromotionService initialized', { criteria: this.defaultCriteria });
  }

  /**
   * Analyze a lesson for promotion eligibility
   */
  analyzePromotionCandidate(
    lesson: LessonCard,
    projectContext: ProjectMetadata,
    allLessons: LessonCard[],
    criteria?: Partial<PromotionCriteria>
  ): PromotionCandidate | null {
    const promotionCriteria = { ...this.defaultCriteria, ...criteria };

    logger.debug(`Analyzing promotion candidate: ${lesson.content.summary}`, {
      projectId: projectContext.id,
      lessonId: lesson.id
    });

    // Calculate promotion score
    const score = this.calculatePromotionScore(lesson, allLessons, promotionCriteria);

    // Check if lesson meets minimum criteria
    if (score.overallScore < promotionCriteria.minConfidenceScore * 100) {
      logger.debug(`Lesson ${lesson.content.summary} does not meet promotion criteria`, {
        score: score.overallScore,
        required: promotionCriteria.minConfidenceScore * 100
      });
      return null;
    }

    // Generate promotion analysis
    const promotionReason = this.generatePromotionReason(lesson, score, projectContext);
    const risks = this.identifyPromotionRisks(lesson, projectContext);
    const benefits = this.identifyPromotionBenefits(lesson, score, projectContext);

    return {
      lesson,
      score,
      projectContext,
      promotionReason,
      risks,
      benefits
    };
  }

  /**
   * Promote a lesson to the shared knowledge base
   */
  async promoteLesson(
    candidate: PromotionCandidate,
    validationData?: any
  ): Promise<PromotionResult> {
    const { lesson, score, projectContext } = candidate;
    const errors: string[] = [];
    const warnings: string[] = [];

    logger.info(`Promoting lesson: ${lesson.content.summary}`, {
      projectId: projectContext.id,
      score: score.overallScore
    });

    try {
      // Validate promotion criteria
      if (this.defaultCriteria.requireValidation && !validationData) {
        errors.push('Validation data required for promotion');
      }

      // Check if lesson is already promoted
      if (this.promotedLessons.has(lesson.id)) {
        errors.push('Lesson is already promoted');
      }

      // Perform additional validation
      const validation = await this.validatePromotion(lesson, projectContext);
      if (!validation.isValid) {
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }

      if (errors.length > 0) {
        return {
          success: false,
          originalLessonId: lesson.id,
          promotionScore: score.overallScore,
          errors,
          warnings
        };
      }

      // Create promoted lesson
      const promotedLesson = this.createPromotedLesson(lesson, projectContext, score);
      
      // Store in promoted lessons
      this.promotedLessons.set(lesson.id, promotedLesson);

      // Record promotion
      const result: PromotionResult = {
        success: true,
        promotedLesson,
        originalLessonId: lesson.id,
        promotionScore: score.overallScore,
        errors,
        warnings
      };

      this.promotionHistory.push(result);

      logger.info(`Successfully promoted lesson: ${lesson.content.summary}`, {
        promotedLessonId: promotedLesson.id,
        score: score.overallScore
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Promotion failed: ${errorMessage}`);

      logger.error(`Failed to promote lesson ${lesson.content.summary}:`, errorMessage);

      return {
        success: false,
        originalLessonId: lesson.id,
        promotionScore: score.overallScore,
        errors,
        warnings
      };
    }
  }

  /**
   * Calculate promotion score for a lesson
   */
  private calculatePromotionScore(
    lesson: LessonCard,
    allLessons: LessonCard[],
    criteria: PromotionCriteria
  ): PromotionScore {
    // Usage score (0-25)
    const usageCount = lesson.successCount + lesson.failureCount;
    const usageScore = Math.min(25, (usageCount / criteria.minUsageCount) * 25);

    // Success rate score (0-25)
    const successRate = lesson.successCount / (lesson.successCount + lesson.failureCount) || 0;
    const successScore = Math.min(25, (successRate / criteria.minSuccessRate) * 25);

    // Confidence score (0-25)
    const confidence = lesson.confidence || 0;
    const confidenceScore = Math.min(25, (confidence / criteria.minConfidenceScore) * 25);

    // Diversity score (0-25)
    const diversityScore = this.calculateDiversityScore(lesson, allLessons);

    // Age score (bonus for newer lessons)
    const ageScore = this.calculateAgeScore(lesson, criteria.maxAge);

    const overallScore = Math.min(100, usageScore + successScore + confidenceScore + diversityScore + ageScore);

    return {
      overallScore,
      usageScore,
      successScore,
      confidenceScore,
      diversityScore,
      breakdown: {
        usageCount,
        successRate,
        confidence,
        projectDiversity: diversityScore,
        ageScore
      }
    };
  }

  /**
   * Calculate diversity score based on cross-project usage
   */
  private calculateDiversityScore(lesson: LessonCard, allLessons: LessonCard[]): number {
    // Find similar lessons across projects
    const similarLessons = allLessons.filter(l => 
      l.id !== lesson.id && 
      l.metadata.category === lesson.metadata.category &&
      l.metadata.framework === lesson.metadata.framework
    );

    // Calculate diversity based on number of unique projects
    const uniqueProjects = new Set(similarLessons.map(l => l.metadata.source)).size;
    const diversityScore = Math.min(25, uniqueProjects * 5); // 5 points per unique project

    return diversityScore;
  }

  /**
   * Calculate age score (bonus for newer lessons)
   */
  private calculateAgeScore(lesson: LessonCard, maxAge: number): number {
    const lessonAge = lesson.updatedAt ?
      (Date.now() - new Date(lesson.updatedAt).getTime()) / (1000 * 60 * 60 * 24) :
      maxAge;

    if (lessonAge > maxAge) {
      return 0; // Too old
    }

    // Bonus for newer lessons (up to 10 points)
    const ageScore = Math.max(0, 10 - (lessonAge / maxAge) * 10);
    return ageScore;
  }

  /**
   * Generate promotion reason
   */
  private generatePromotionReason(
    lesson: LessonCard,
    score: PromotionScore,
    projectContext: ProjectMetadata
  ): string {
    const reasons: string[] = [];

    if (score.usageScore >= 20) {
      reasons.push(`High usage (${score.breakdown.usageCount} times)`);
    }

    if (score.successScore >= 20) {
      reasons.push(`High success rate (${Math.round(score.breakdown.successRate * 100)}%)`);
    }

    if (score.confidenceScore >= 20) {
      reasons.push(`High confidence (${Math.round(score.breakdown.confidence * 100)}%)`);
    }

    if (score.diversityScore >= 15) {
      reasons.push(`Cross-project applicability`);
    }

    if (reasons.length === 0) {
      reasons.push('Meets minimum promotion criteria');
    }

    return `Promoted from ${projectContext.name}: ${reasons.join(', ')}`;
  }

  /**
   * Identify promotion risks
   */
  private identifyPromotionRisks(lesson: LessonCard, projectContext: ProjectMetadata): string[] {
    const risks: string[] = [];

    // Project-specific risks
    if (lesson.metadata.framework && lesson.metadata.framework !== 'generic') {
      risks.push(`May be specific to ${lesson.metadata.framework} framework`);
    }

    if (lesson.metadata.category === 'anti-pattern') {
      risks.push('Anti-pattern lesson may need careful context');
    }

    // Age risks
    const lessonAge = lesson.updatedAt ?
      (Date.now() - new Date(lesson.updatedAt).getTime()) / (1000 * 60 * 60 * 24) :
      0;

    if (lessonAge > 14) {
      risks.push('Lesson may be outdated');
    }

    // Usage risks
    const usageCount = lesson.successCount + lesson.failureCount;
    if (usageCount < 3) {
      risks.push('Limited usage history');
    }

    return risks;
  }

  /**
   * Identify promotion benefits
   */
  private identifyPromotionBenefits(
    lesson: LessonCard,
    score: PromotionScore,
    projectContext: ProjectMetadata
  ): string[] {
    const benefits: string[] = [];

    benefits.push('Shareable across multiple projects');
    benefits.push('Reduces duplication of effort');

    if (score.breakdown.successRate >= 0.9) {
      benefits.push('Proven high-success pattern');
    }

    if (score.breakdown.confidence >= 0.8) {
      benefits.push('High-confidence solution');
    }

    if (lesson.metadata.category === 'best-practice') {
      benefits.push('Establishes best practice standard');
    }

    return benefits;
  }

  /**
   * Create promoted lesson from original
   */
  private createPromotedLesson(
    originalLesson: LessonCard,
    projectContext: ProjectMetadata,
    score: PromotionScore
  ): LessonCard {
    const promotedLesson: LessonCard = {
      ...originalLesson,
      id: `promoted_${originalLesson.id}`,
      metadata: {
        ...originalLesson.metadata,
        source: 'promoted',
        promotedFrom: originalLesson.id,
        promotedFromProject: projectContext.id,
        promotedAt: new Date().toISOString(),
        promotionScore: score.overallScore,
        isPromoted: true
      }
    };

    return promotedLesson;
  }

  /**
   * Validate promotion
   */
  private async validatePromotion(
    lesson: LessonCard,
    projectContext: ProjectMetadata
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check lesson completeness
    if (!lesson.content.summary || !lesson.content.description) {
      errors.push('Lesson missing required fields');
    }

    // Check metadata completeness
    if (!lesson.metadata.category || !lesson.metadata.framework) {
      warnings.push('Lesson metadata incomplete');
    }

    // Check for potential conflicts
    const existingPromoted = Array.from(this.promotedLessons.values())
      .find(l => l.content.summary === lesson.content.summary && l.metadata.framework === lesson.metadata.framework);

    if (existingPromoted) {
      warnings.push('Similar lesson already promoted');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get promoted lessons
   */
  getPromotedLessons(): LessonCard[] {
    return Array.from(this.promotedLessons.values());
  }

  /**
   * Get promotion history
   */
  getPromotionHistory(): PromotionResult[] {
    return [...this.promotionHistory];
  }

  /**
   * Analyze cross-project patterns
   */
  analyzeCrossProjectPatterns(
    allLessons: LessonCard[],
    projectContexts: ProjectMetadata[]
  ): CrossProjectAnalysis {
    const analyzedProjects = new Set(allLessons.map(l => l.metadata.source)).size;
    const totalProjects = projectContexts.length;

    // Find common patterns
    const categoryCounts = new Map<string, number>();
    const frameworkCounts = new Map<string, number>();

    allLessons.forEach(lesson => {
      const category = lesson.metadata.category || 'unknown';
      const framework = lesson.metadata.framework || 'unknown';
      
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      frameworkCounts.set(framework, (frameworkCounts.get(framework) || 0) + 1);
    });

    const commonPatterns = Array.from(categoryCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([category, _]) => category);

    const uniquePatterns = Array.from(categoryCounts.entries())
      .filter(([_, count]) => count === 1)
      .map(([category, _]) => category);

    // Calculate quality trends
    const confidences = allLessons.map(l => l.confidence || 0);
    const successRates = allLessons.map(l => l.successCount / (l.successCount + l.failureCount) || 0);

    const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const averageSuccessRate = successRates.reduce((sum, s) => sum + s, 0) / successRates.length;

    // Calculate improvement rate (simplified)
    const improvementRate = Math.min(1, averageConfidence * averageSuccessRate);

    // Count promotion opportunities
    const promotionOpportunities = allLessons.filter(lesson => {
      const usageCount = lesson.successCount + lesson.failureCount;
      const successRate = lesson.successCount / (lesson.successCount + lesson.failureCount) || 0;
      const confidence = lesson.confidence || 0;

      return usageCount >= 3 && successRate >= 0.7 && confidence >= 0.6;
    }).length;

    return {
      totalProjects,
      analyzedProjects,
      commonPatterns,
      uniquePatterns,
      promotionOpportunities,
      qualityTrends: {
        averageConfidence,
        averageSuccessRate,
        improvementRate
      }
    };
  }

  /**
   * Get promotion statistics
   */
  getPromotionStatistics(): {
    totalPromoted: number;
    successRate: number;
    averageScore: number;
    topCategories: string[];
    topFrameworks: string[];
  } {
    const promoted = Array.from(this.promotedLessons.values());
    const history = this.promotionHistory;

    const totalPromoted = promoted.length;
    const successfulPromotions = history.filter(r => r.success).length;
    const successRate = history.length > 0 ? successfulPromotions / history.length : 0;
    const averageScore = history.length > 0 ? 
      history.reduce((sum, r) => sum + r.promotionScore, 0) / history.length : 0;

    // Top categories
    const categoryCounts = new Map<string, number>();
    promoted.forEach(lesson => {
      const category = lesson.metadata.category || 'unknown';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, _]) => category);

    // Top frameworks
    const frameworkCounts = new Map<string, number>();
    promoted.forEach(lesson => {
      const framework = lesson.metadata.framework || 'unknown';
      frameworkCounts.set(framework, (frameworkCounts.get(framework) || 0) + 1);
    });

    const topFrameworks = Array.from(frameworkCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([framework, _]) => framework);

    return {
      totalPromoted,
      successRate,
      averageScore,
      topCategories,
      topFrameworks
    };
  }

  /**
   * Update promotion criteria
   */
  updatePromotionCriteria(criteria: Partial<PromotionCriteria>): void {
    Object.assign(this.defaultCriteria, criteria);
    logger.info('Updated promotion criteria', { criteria });
  }

  /**
   * Clear promotion data
   */
  clearPromotionData(): void {
    this.promotedLessons.clear();
    this.promotionHistory = [];
    logger.info('Cleared all promotion data');
  }
}
