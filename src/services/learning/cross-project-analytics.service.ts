/**
 * Cross-Project Analytics Service
 * 
 * Analyzes patterns and insights across multiple projects to identify
 * opportunities for knowledge sharing and lesson promotion.
 * 
 * Vibe Coder Benefits:
 * - Automatic pattern discovery across projects
 * - Cross-project insight generation
 * - Trend analysis and recommendations
 * - Quality assessment and improvement suggestions
 */

import { Logger } from '../logger/logger.js';
import type { LessonCard } from '../lessons/lessons-learned.service.js';
import type { ProjectMetadata } from '../project/project-identifier.service.js';
import type { LearningPattern, LearningInsight } from '../learning/adaptive-learning.service.js';

const logger = new Logger('CrossProjectAnalyticsService');

export interface CrossProjectPattern {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  frequency: number;
  successRate: number;
  averageConfidence: number;
  projects: string[];
  examples: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

export interface ProjectComparison {
  projectId: string;
  projectName: string;
  totalLessons: number;
  uniquePatterns: number;
  sharedPatterns: number;
  qualityScore: number;
  improvementAreas: string[];
  strengths: string[];
}

export interface CrossProjectInsight {
  id: string;
  type: 'pattern' | 'quality' | 'trend' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  affectedProjects: string[];
  recommendations: string[];
  metrics: {
    beforeValue?: number;
    afterValue?: number;
    improvement?: number;
  };
}

export interface CrossProjectReport {
  summary: {
    totalProjects: number;
    totalLessons: number;
    totalPatterns: number;
    averageQuality: number;
    improvementOpportunities: number;
  };
  patterns: CrossProjectPattern[];
  insights: CrossProjectInsight[];
  comparisons: ProjectComparison[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  generatedAt: Date;
}

export class CrossProjectAnalyticsService {
  private analysisCache = new Map<string, CrossProjectReport>();
  private cacheTimeout = 300000; // 5 minutes

  constructor() {
    logger.info('CrossProjectAnalyticsService initialized');
  }

  /**
   * Generate comprehensive cross-project analysis
   */
  async generateCrossProjectAnalysis(
    projects: ProjectMetadata[],
    allLessons: LessonCard[],
    allPatterns: LearningPattern[],
    allInsights: LearningInsight[]
  ): Promise<CrossProjectReport> {
    logger.info(`Generating cross-project analysis for ${projects.length} projects`);

    const cacheKey = this.generateCacheKey(projects, allLessons);
    const cached = this.analysisCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      logger.debug('Returning cached analysis');
      return cached;
    }

    try {
      // Group lessons by project
      const lessonsByProject = this.groupLessonsByProject(allLessons, projects);
      
      // Analyze patterns across projects
      const patterns = this.analyzeCrossProjectPatterns(allLessons, allPatterns, projects);
      
      // Generate insights
      const insights = this.generateCrossProjectInsights(lessonsByProject, patterns, allInsights);
      
      // Compare projects
      const comparisons = this.compareProjects(lessonsByProject, patterns);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(patterns, insights, comparisons);
      
      // Calculate summary metrics
      const summary = this.calculateSummaryMetrics(projects, allLessons, patterns, insights);

      const report: CrossProjectReport = {
        summary,
        patterns,
        insights,
        comparisons,
        recommendations,
        generatedAt: new Date()
      };

      // Cache the result
      this.analysisCache.set(cacheKey, report);

      logger.info(`Generated cross-project analysis with ${patterns.length} patterns and ${insights.length} insights`);
      return report;

    } catch (error) {
      logger.error('Failed to generate cross-project analysis:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Group lessons by project
   */
  private groupLessonsByProject(
    lessons: LessonCard[],
    projects: ProjectMetadata[]
  ): Map<string, LessonCard[]> {
    const lessonsByProject = new Map<string, LessonCard[]>();

    projects.forEach(project => {
      const projectLessons = lessons.filter(lesson => 
        lesson.metadata.source === project.id || 
        lesson.metadata.promotedFromProject === project.id
      );
      lessonsByProject.set(project.id, projectLessons);
    });

    return lessonsByProject;
  }

  /**
   * Analyze patterns across projects
   */
  private analyzeCrossProjectPatterns(
    lessons: LessonCard[],
    patterns: LearningPattern[],
    projects: ProjectMetadata[]
  ): CrossProjectPattern[] {
    const patternMap = new Map<string, CrossProjectPattern>();

    lessons.forEach(lesson => {
      const key = `${lesson.metadata.category}_${lesson.metadata.framework}`;
      
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          id: key,
          name: `${lesson.metadata.category} (${lesson.metadata.framework})`,
          description: `Common ${lesson.metadata.category} pattern in ${lesson.metadata.framework}`,
          category: lesson.metadata.category || 'unknown',
          framework: lesson.metadata.framework || 'generic',
          frequency: 0,
          successRate: 0,
          averageConfidence: 0,
          projects: [],
          examples: [],
          trend: 'stable',
          recommendation: ''
        });
      }

      const pattern = patternMap.get(key)!;
      pattern.frequency++;
      pattern.successRate += lesson.successCount / (lesson.successCount + lesson.failureCount) || 0;
      pattern.averageConfidence += lesson.confidence || 0;

      if (!pattern.projects.includes(lesson.metadata.source)) {
        pattern.projects.push(lesson.metadata.source);
      }

      if (pattern.examples.length < 3) {
        pattern.examples.push(lesson.content.summary);
      }
    });

    // Calculate averages and trends
    const crossProjectPatterns = Array.from(patternMap.values()).map(pattern => {
      pattern.successRate = pattern.successRate / pattern.frequency;
      pattern.averageConfidence = pattern.averageConfidence / pattern.frequency;
      pattern.trend = this.calculatePatternTrend(pattern, lessons);
      pattern.recommendation = this.generatePatternRecommendation(pattern);
      
      return pattern;
    });

    // Sort by frequency and quality
    return crossProjectPatterns.sort((a, b) => {
      const scoreA = a.frequency * a.successRate * a.averageConfidence;
      const scoreB = b.frequency * b.successRate * b.averageConfidence;
      return scoreB - scoreA;
    });
  }

  /**
   * Generate cross-project insights
   */
  private generateCrossProjectInsights(
    lessonsByProject: Map<string, LessonCard[]>,
    patterns: CrossProjectPattern[],
    existingInsights: LearningInsight[]
  ): CrossProjectInsight[] {
    const insights: CrossProjectInsight[] = [];

    // Quality insights
    insights.push(...this.generateQualityInsights(lessonsByProject));
    
    // Pattern insights
    insights.push(...this.generatePatternInsights(patterns));
    
    // Trend insights
    insights.push(...this.generateTrendInsights(lessonsByProject, patterns));
    
    // Opportunity insights
    insights.push(...this.generateOpportunityInsights(lessonsByProject, patterns));

    return insights.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      return (impactScore[b.impact] * b.confidence) - (impactScore[a.impact] * a.confidence);
    });
  }

  /**
   * Generate quality insights
   */
  private generateQualityInsights(lessonsByProject: Map<string, LessonCard[]>): CrossProjectInsight[] {
    const insights: CrossProjectInsight[] = [];

    const projectQualities = Array.from(lessonsByProject.entries()).map(([projectId, lessons]) => {
      const avgConfidence = lessons.reduce((sum, l) => sum + (l.confidence || 0), 0) / lessons.length;
      const avgSuccessRate = lessons.reduce((sum, l) => sum + (l.successCount / (l.successCount + l.failureCount) || 0), 0) / lessons.length;
      return { projectId, quality: (avgConfidence + avgSuccessRate) / 2, lessonCount: lessons.length };
    });

    const avgQuality = projectQualities.reduce((sum, p) => sum + p.quality, 0) / projectQualities.length;
    const highQualityProjects = projectQualities.filter(p => p.quality > avgQuality * 1.2);
    const lowQualityProjects = projectQualities.filter(p => p.quality < avgQuality * 0.8);

    if (highQualityProjects.length > 0) {
      insights.push({
        id: 'quality_high_performers',
        type: 'quality',
        title: 'High-Quality Project Patterns',
        description: `${highQualityProjects.length} projects show exceptional lesson quality`,
        impact: 'high',
        confidence: 0.9,
        affectedProjects: highQualityProjects.map(p => p.projectId),
        recommendations: [
          'Study high-quality projects for best practices',
          'Consider promoting lessons from these projects',
          'Document quality improvement strategies'
        ],
        metrics: {
          afterValue: avgQuality,
          improvement: highQualityProjects.length / projectQualities.length
        }
      });
    }

    if (lowQualityProjects.length > 0) {
      insights.push({
        id: 'quality_improvement_opportunity',
        type: 'opportunity',
        title: 'Quality Improvement Opportunity',
        description: `${lowQualityProjects.length} projects could benefit from quality improvements`,
        impact: 'medium',
        confidence: 0.8,
        affectedProjects: lowQualityProjects.map(p => p.projectId),
        recommendations: [
          'Review lesson creation process',
          'Implement quality validation steps',
          'Learn from high-quality projects'
        ],
        metrics: {
          beforeValue: avgQuality,
          improvement: (avgQuality - lowQualityProjects.reduce((sum, p) => sum + p.quality, 0) / lowQualityProjects.length) / avgQuality
        }
      });
    }

    return insights;
  }

  /**
   * Generate pattern insights
   */
  private generatePatternInsights(patterns: CrossProjectPattern[]): CrossProjectInsight[] {
    const insights: CrossProjectInsight[] = [];

    const popularPatterns = patterns.filter(p => p.frequency >= 3);
    const uniquePatterns = patterns.filter(p => p.frequency === 1);

    if (popularPatterns.length > 0) {
      insights.push({
        id: 'pattern_popular',
        type: 'pattern',
        title: 'Popular Cross-Project Patterns',
        description: `${popularPatterns.length} patterns are used across multiple projects`,
        impact: 'high',
        confidence: 0.9,
        affectedProjects: [...new Set(popularPatterns.flatMap(p => p.projects))],
        recommendations: [
          'Consider promoting popular patterns to shared knowledge base',
          'Standardize implementation across projects',
          'Create shared documentation for these patterns'
        ],
        metrics: {
          afterValue: popularPatterns.length,
          improvement: popularPatterns.length / patterns.length
        }
      });
    }

    if (uniquePatterns.length > 0) {
      insights.push({
        id: 'pattern_unique',
        type: 'opportunity',
        title: 'Unique Pattern Sharing Opportunity',
        description: `${uniquePatterns.length} patterns are unique to individual projects`,
        impact: 'medium',
        confidence: 0.7,
        affectedProjects: uniquePatterns.map(p => p.projects[0]),
        recommendations: [
          'Evaluate unique patterns for cross-project applicability',
          'Share successful unique patterns with other projects',
          'Document specialized project-specific solutions'
        ],
        metrics: {
          afterValue: uniquePatterns.length,
          improvement: uniquePatterns.length / patterns.length
        }
      });
    }

    return insights;
  }

  /**
   * Generate trend insights
   */
  private generateTrendInsights(
    lessonsByProject: Map<string, LessonCard[]>,
    patterns: CrossProjectPattern[]
  ): CrossProjectInsight[] {
    const insights: CrossProjectInsight[] = [];

    const increasingPatterns = patterns.filter(p => p.trend === 'increasing');
    const decreasingPatterns = patterns.filter(p => p.trend === 'decreasing');

    if (increasingPatterns.length > 0) {
      insights.push({
        id: 'trend_increasing',
        type: 'trend',
        title: 'Growing Pattern Adoption',
        description: `${increasingPatterns.length} patterns are showing increasing adoption`,
        impact: 'high',
        confidence: 0.8,
        affectedProjects: [...new Set(increasingPatterns.flatMap(p => p.projects))],
        recommendations: [
          'Accelerate adoption of growing patterns',
          'Promote successful patterns to all projects',
          'Monitor and support pattern evolution'
        ],
        metrics: {
          afterValue: increasingPatterns.length,
          improvement: increasingPatterns.length / patterns.length
        }
      });
    }

    if (decreasingPatterns.length > 0) {
      insights.push({
        id: 'trend_decreasing',
        type: 'warning',
        title: 'Declining Pattern Usage',
        description: `${decreasingPatterns.length} patterns are showing declining usage`,
        impact: 'medium',
        confidence: 0.7,
        affectedProjects: [...new Set(decreasingPatterns.flatMap(p => p.projects))],
        recommendations: [
          'Investigate reasons for declining usage',
          'Consider deprecating outdated patterns',
          'Update or replace declining patterns'
        ],
        metrics: {
          beforeValue: decreasingPatterns.length,
          improvement: -decreasingPatterns.length / patterns.length
        }
      });
    }

    return insights;
  }

  /**
   * Generate opportunity insights
   */
  private generateOpportunityInsights(
    lessonsByProject: Map<string, LessonCard[]>,
    patterns: CrossProjectPattern[]
  ): CrossProjectInsight[] {
    const insights: CrossProjectInsight[] = [];

    // Find projects with few lessons
    const projectsWithFewLessons = Array.from(lessonsByProject.entries())
      .filter(([_, lessons]) => lessons.length < 5)
      .map(([projectId, _]) => projectId);

    if (projectsWithFewLessons.length > 0) {
      insights.push({
        id: 'opportunity_lesson_creation',
        type: 'opportunity',
        title: 'Lesson Creation Opportunity',
        description: `${projectsWithFewLessons.length} projects have few documented lessons`,
        impact: 'medium',
        confidence: 0.8,
        affectedProjects: projectsWithFewLessons,
        recommendations: [
          'Encourage lesson creation in under-documented projects',
          'Provide templates and guidance for lesson creation',
          'Implement lesson creation incentives'
        ],
        metrics: {
          beforeValue: projectsWithFewLessons.length,
          improvement: projectsWithFewLessons.length / lessonsByProject.size
        }
      });
    }

    return insights;
  }

  /**
   * Compare projects
   */
  private compareProjects(
    lessonsByProject: Map<string, LessonCard[]>,
    patterns: CrossProjectPattern[]
  ): ProjectComparison[] {
    const comparisons: ProjectComparison[] = [];

    lessonsByProject.forEach((lessons, projectId) => {
      const uniquePatterns = lessons.filter(lesson => 
        patterns.find(p => p.projects.includes(lesson.metadata.source) && p.projects.length === 1)
      ).length;

      const sharedPatterns = lessons.filter(lesson => 
        patterns.find(p => p.projects.includes(lesson.metadata.source) && p.projects.length > 1)
      ).length;

      const qualityScore = lessons.length > 0 ? 
        lessons.reduce((sum, l) => sum + (l.confidence || 0) + (l.successCount / (l.successCount + l.failureCount) || 0), 0) / (lessons.length * 2) :
        0;

      const improvementAreas = this.identifyImprovementAreas(lessons, patterns);
      const strengths = this.identifyStrengths(lessons, patterns);

      comparisons.push({
        projectId,
        projectName: `Project ${projectId.substring(0, 8)}`,
        totalLessons: lessons.length,
        uniquePatterns,
        sharedPatterns,
        qualityScore,
        improvementAreas,
        strengths
      });
    });

    return comparisons.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  /**
   * Identify improvement areas for a project
   */
  private identifyImprovementAreas(lessons: LessonCard[], patterns: CrossProjectPattern[]): string[] {
    const areas: string[] = [];

    if (lessons.length < 5) {
      areas.push('Low lesson count');
    }

    const avgConfidence = lessons.reduce((sum, l) => sum + (l.confidence || 0), 0) / lessons.length;
    if (avgConfidence < 0.6) {
      areas.push('Low confidence scores');
    }

    const avgSuccessRate = lessons.reduce((sum, l) => sum + (l.successCount / (l.successCount + l.failureCount) || 0), 0) / lessons.length;
    if (avgSuccessRate < 0.7) {
      areas.push('Low success rates');
    }

    return areas;
  }

  /**
   * Identify strengths for a project
   */
  private identifyStrengths(lessons: LessonCard[], patterns: CrossProjectPattern[]): string[] {
    const strengths: string[] = [];

    if (lessons.length >= 10) {
      strengths.push('High lesson count');
    }

    const avgConfidence = lessons.reduce((sum, l) => sum + (l.confidence || 0), 0) / lessons.length;
    if (avgConfidence >= 0.8) {
      strengths.push('High confidence scores');
    }

    const avgSuccessRate = lessons.reduce((sum, l) => sum + (l.successCount / (l.successCount + l.failureCount) || 0), 0) / lessons.length;
    if (avgSuccessRate >= 0.9) {
      strengths.push('High success rates');
    }

    return strengths;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    patterns: CrossProjectPattern[],
    insights: CrossProjectInsight[],
    comparisons: ProjectComparison[]
  ): { immediate: string[]; shortTerm: string[]; longTerm: string[] } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate recommendations
    const highImpactInsights = insights.filter(i => i.impact === 'high');
    if (highImpactInsights.length > 0) {
      immediate.push('Address high-impact insights immediately');
    }

    const popularPatterns = patterns.filter(p => p.frequency >= 3);
    if (popularPatterns.length > 0) {
      immediate.push('Promote popular patterns to shared knowledge base');
    }

    // Short-term recommendations
    const qualityInsights = insights.filter(i => i.type === 'quality');
    if (qualityInsights.length > 0) {
      shortTerm.push('Implement quality improvement initiatives');
    }

    shortTerm.push('Establish cross-project pattern sharing process');
    shortTerm.push('Create pattern documentation standards');

    // Long-term recommendations
    longTerm.push('Develop automated pattern discovery system');
    longTerm.push('Implement cross-project learning analytics');
    longTerm.push('Create pattern evolution tracking');

    return { immediate, shortTerm, longTerm };
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummaryMetrics(
    projects: ProjectMetadata[],
    lessons: LessonCard[],
    patterns: CrossProjectPattern[],
    insights: CrossProjectInsight[]
  ): CrossProjectReport['summary'] {
    const totalProjects = projects.length;
    const totalLessons = lessons.length;
    const totalPatterns = patterns.length;
    
    const averageQuality = lessons.length > 0 ? 
      lessons.reduce((sum, l) => sum + (l.confidence || 0) + (l.successCount / (l.successCount + l.failureCount) || 0), 0) / (lessons.length * 2) :
      0;

    const improvementOpportunities = insights.filter(i => i.type === 'opportunity').length;

    return {
      totalProjects,
      totalLessons,
      totalPatterns,
      averageQuality,
      improvementOpportunities
    };
  }

  /**
   * Calculate pattern trend
   */
  private calculatePatternTrend(pattern: CrossProjectPattern, lessons: LessonCard[]): 'increasing' | 'decreasing' | 'stable' {
    // Simplified trend calculation - in a real implementation, you'd analyze temporal data
    const recentLessons = lessons.filter(l => 
      l.metadata.category === pattern.category && 
      l.metadata.framework === pattern.framework &&
      l.updatedAt &&
      new Date(l.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    if (recentLessons.length > pattern.frequency * 0.3) {
      return 'increasing';
    } else if (recentLessons.length < pattern.frequency * 0.1) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Generate pattern recommendation
   */
  private generatePatternRecommendation(pattern: CrossProjectPattern): string {
    if (pattern.frequency >= 3 && pattern.successRate >= 0.8) {
      return 'Promote to shared knowledge base';
    } else if (pattern.frequency >= 2 && pattern.averageConfidence >= 0.7) {
      return 'Consider for promotion';
    } else if (pattern.frequency === 1) {
      return 'Evaluate for cross-project applicability';
    } else {
      return 'Monitor and gather more data';
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(projects: ProjectMetadata[], lessons: LessonCard[]): string {
    const projectIds = projects.map(p => p.id).sort().join(',');
    const lessonIds = lessons.map(l => l.id).sort().join(',');
    return `${projectIds}_${lessonIds}`;
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(report: CrossProjectReport): boolean {
    const age = Date.now() - report.generatedAt.getTime();
    return age < this.cacheTimeout;
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
    logger.info('Cross-project analysis cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): { size: number; entries: string[] } {
    return {
      size: this.analysisCache.size,
      entries: Array.from(this.analysisCache.keys())
    };
  }
}
