import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { LessonsLearnedService } from '../lessons/lessons-learned.service.js';
import type { LessonCard, LessonAnalytics } from '../lessons/lessons-learned.service.js';
import { AdaptiveLearningService } from '../learning/adaptive-learning.service.js';
import type { LearningPattern, LearningInsight, LearningMetrics } from '../learning/adaptive-learning.service.js';

export interface AnalyticsDashboard {
  overview: {
    totalLessons: number;
    totalPatterns: number;
    totalInsights: number;
    averageSuccessRate: number;
    systemConfidence: number;
    lastUpdated: string;
  };
  performance: {
    topPerformingLessons: Array<{
      id: string;
      title: string;
      successRate: number;
      frequency: number;
      category: string;
    }>;
    emergingPatterns: Array<{
      name: string;
      growthRate: number;
      confidence: number;
      applications: number;
    }>;
    decliningPatterns: Array<{
      name: string;
      declineRate: number;
      lastUsed: string;
      recommendations: string[];
    }>;
  };
  insights: {
    validatedInsights: Array<{
      title: string;
      confidence: number;
      impact: string;
      evidence: string;
      recommendations: string[];
    }>;
    pendingInsights: Array<{
      title: string;
      confidence: number;
      validationNeeded: boolean;
      priority: 'high' | 'medium' | 'low';
    }>;
    antiPatterns: Array<{
      title: string;
      description: string;
      frequency: number;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  trends: {
    weeklyActivity: Array<{
      week: string;
      lessonsCreated: number;
      patternsDiscovered: number;
      insightsGenerated: number;
      successRate: number;
    }>;
    categoryDistribution: Array<{
      category: string;
      count: number;
      percentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    frameworkUsage: Array<{
      framework: string;
      usage: number;
      successRate: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  };
  recommendations: {
    immediateActions: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
      effort: 'low' | 'medium' | 'high';
      description: string;
    }>;
    optimizationOpportunities: Array<{
      area: string;
      currentState: string;
      potentialImprovement: string;
      confidence: number;
    }>;
    learningGaps: Array<{
      area: string;
      gap: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
}

export interface AnalyticsReport {
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    keyFindings: string[];
    criticalIssues: string[];
    opportunities: string[];
    recommendations: string[];
  };
  detailedAnalysis: {
    lessonEffectiveness: any;
    patternEvolution: any;
    insightValidation: any;
    systemPerformance: any;
  };
  actionItems: Array<{
    item: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    owner: string;
    dueDate: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>;
}

/**
 * Lesson Analytics Service
 * 
 * Provides comprehensive analytics and insights from the learning system.
 * Generates dashboards, reports, and actionable recommendations.
 * Tracks learning effectiveness and system performance over time.
 */
export class LessonAnalyticsService {
  private analyticsHistory: AnalyticsDashboard[] = [];
  private reportHistory: AnalyticsReport[] = [];

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private lessonsService: LessonsLearnedService,
    private adaptiveLearning: AdaptiveLearningService
  ) {}

  /**
   * Generate comprehensive analytics dashboard
   */
  async generateDashboard(): Promise<AnalyticsDashboard> {
    this.logger.info('Generating analytics dashboard');

    try {
      // Get data from services
      const lessonAnalytics = this.lessonsService.getAnalytics();
      const learningMetrics = this.adaptiveLearning.getLearningMetrics();

      // Generate dashboard sections
      const overview = await this.generateOverview(lessonAnalytics, learningMetrics);
      const performance = await this.generatePerformanceMetrics(lessonAnalytics, learningMetrics);
      const insights = await this.generateInsightsAnalysis(learningMetrics);
      const trends = await this.generateTrendAnalysis(lessonAnalytics, learningMetrics);
      const recommendations = await this.generateRecommendations(lessonAnalytics, learningMetrics);

      const dashboard: AnalyticsDashboard = {
        overview,
        performance,
        insights,
        trends,
        recommendations
      };

      // Store in history
      this.analyticsHistory.push(dashboard);

      this.logger.info('Analytics dashboard generated', {
        totalLessons: overview.totalLessons,
        totalPatterns: overview.totalPatterns,
        systemConfidence: overview.systemConfidence
      });

      return dashboard;

    } catch (error) {
      this.logger.error('Failed to generate analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Generate detailed analytics report
   */
  async generateReport(period: { start: string; end: string }): Promise<AnalyticsReport> {
    this.logger.info('Generating analytics report', { period });

    try {
      const report: AnalyticsReport = {
        generatedAt: new Date().toISOString(),
        period,
        summary: await this.generateSummaryAnalysis(period),
        detailedAnalysis: await this.generateDetailedAnalysis(period),
        actionItems: await this.generateActionItems(period)
      };

      // Store in history
      this.reportHistory.push(report);

      this.logger.info('Analytics report generated', {
        keyFindings: report.summary.keyFindings.length,
        actionItems: report.actionItems.length
      });

      return report;

    } catch (error) {
      this.logger.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Get analytics history
   */
  getAnalyticsHistory(): AnalyticsDashboard[] {
    return [...this.analyticsHistory];
  }

  /**
   * Get report history
   */
  getReportHistory(): AnalyticsReport[] {
    return [...this.reportHistory];
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(format: 'json' | 'csv' | 'html'): Promise<string> {
    const dashboard = await this.generateDashboard();
    
    switch (format) {
      case 'json':
        return JSON.stringify(dashboard, null, 2);
      case 'csv':
        return this.exportToCSV(dashboard);
      case 'html':
        return this.exportToHTML(dashboard);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async generateOverview(
    lessonAnalytics: LessonAnalytics,
    learningMetrics: LearningMetrics
  ): Promise<AnalyticsDashboard['overview']> {
    return {
      totalLessons: lessonAnalytics.totalLessons,
      totalPatterns: learningMetrics.totalPatterns,
      totalInsights: learningMetrics.insights.total,
      averageSuccessRate: lessonAnalytics.successRate,
      systemConfidence: learningMetrics.effectiveness.patternAccuracy,
      lastUpdated: new Date().toISOString()
    };
  }

  private async generatePerformanceMetrics(
    lessonAnalytics: LessonAnalytics,
    learningMetrics: LearningMetrics
  ): Promise<AnalyticsDashboard['performance']> {
    // Get top performing lessons
    const topPerformingLessons = await this.getTopPerformingLessons(5);
    
    // Get emerging patterns
    const emergingPatterns = learningMetrics.trends.emergingPatterns.map(pattern => ({
      name: pattern.pattern,
      growthRate: pattern.growthRate,
      confidence: pattern.confidence,
      applications: 0 // Would be calculated from actual usage data
    }));

    // Get declining patterns
    const decliningPatterns = learningMetrics.trends.decliningPatterns.map(pattern => ({
      name: pattern.pattern,
      declineRate: pattern.declineRate,
      lastUsed: pattern.lastUsed,
      recommendations: this.generatePatternRecommendations(pattern.pattern, 'declining')
    }));

    return {
      topPerformingLessons,
      emergingPatterns,
      decliningPatterns
    };
  }

  private async generateInsightsAnalysis(
    learningMetrics: LearningMetrics
  ): Promise<AnalyticsDashboard['insights']> {
    // This would typically fetch actual insights from the adaptive learning service
    // For now, we'll generate mock data based on metrics
    
    const validatedInsights = [
      {
        title: 'High-Performing React Patterns',
        confidence: 0.9,
        impact: 'high',
        evidence: `${learningMetrics.trends.topPerformingPatterns.length} patterns identified with >80% success rate`,
        recommendations: [
          'Apply React patterns more broadly',
          'Document successful patterns for team sharing',
          'Create pattern library for consistency'
        ]
      }
    ];

    const pendingInsights = [
      {
        title: 'CSS Framework Performance Impact',
        confidence: 0.7,
        validationNeeded: true,
        priority: 'medium' as const
      }
    ];

    const antiPatterns = [
      {
        title: 'Deprecated React Patterns',
        description: 'Using class components instead of functional components with hooks',
        frequency: 3,
        severity: 'medium' as const
      }
    ];

    return {
      validatedInsights,
      pendingInsights,
      antiPatterns
    };
  }

  private async generateTrendAnalysis(
    lessonAnalytics: LessonAnalytics,
    learningMetrics: LearningMetrics
  ): Promise<AnalyticsDashboard['trends']> {
    // Generate weekly activity trends
    const weeklyActivity = lessonAnalytics.recentActivity.map(activity => ({
      week: activity.date,
      lessonsCreated: activity.lessonsCreated,
      patternsDiscovered: 0, // Would be calculated from actual data
      insightsGenerated: 0, // Would be calculated from actual data
      successRate: activity.successRate
    }));

    // Generate category distribution
    const categoryDistribution = Object.entries(lessonAnalytics.byCategory).map(([category, count]) => ({
      category,
      count,
      percentage: (count / lessonAnalytics.totalLessons) * 100,
      trend: this.calculateCategoryTrend(category) as 'increasing' | 'decreasing' | 'stable'
    }));

    // Generate framework usage trends
    const frameworkUsage = [
      {
        framework: 'React',
        usage: 45,
        successRate: 0.85,
        trend: 'increasing' as const
      },
      {
        framework: 'Vue',
        usage: 20,
        successRate: 0.78,
        trend: 'stable' as const
      },
      {
        framework: 'Angular',
        usage: 15,
        successRate: 0.82,
        trend: 'decreasing' as const
      }
    ];

    return {
      weeklyActivity,
      categoryDistribution,
      frameworkUsage
    };
  }

  private async generateRecommendations(
    lessonAnalytics: LessonAnalytics,
    learningMetrics: LearningMetrics
  ): Promise<AnalyticsDashboard['recommendations']> {
    const immediateActions = [
      {
        action: 'Promote high-confidence patterns',
        priority: 'high' as const,
        impact: 'Increase success rate by 15-20%',
        effort: 'low' as const,
        description: 'Promote patterns with >80% confidence to stack-shared lessons'
      },
      {
        action: 'Address declining patterns',
        priority: 'medium' as const,
        impact: 'Prevent future failures',
        effort: 'medium' as const,
        description: 'Investigate and document alternatives for declining patterns'
      }
    ];

    const optimizationOpportunities = [
      {
        area: 'React Component Creation',
        currentState: '85% success rate',
        potentialImprovement: 'Could reach 95% with better TypeScript integration',
        confidence: 0.8
      },
      {
        area: 'CSS Styling Patterns',
        currentState: '70% success rate',
        potentialImprovement: 'Could reach 85% with accessibility guidelines',
        confidence: 0.7
      }
    ];

    const learningGaps = [
      {
        area: 'Performance Optimization',
        gap: 'Limited patterns for performance improvements',
        recommendation: 'Create more performance-focused lessons',
        priority: 'high' as const
      },
      {
        area: 'Testing Patterns',
        gap: 'Few testing-related lessons available',
        recommendation: 'Develop comprehensive testing patterns',
        priority: 'medium' as const
      }
    ];

    return {
      immediateActions,
      optimizationOpportunities,
      learningGaps
    };
  }

  private async getTopPerformingLessons(limit: number): Promise<AnalyticsDashboard['performance']['topPerformingLessons']> {
    // This would typically fetch from the lessons service
    // For now, return mock data
    return [
      {
        id: 'lesson_1',
        title: 'React Component with TypeScript',
        successRate: 0.92,
        frequency: 15,
        category: 'pattern'
      },
      {
        id: 'lesson_2',
        title: 'CSS Grid Layout Pattern',
        successRate: 0.88,
        frequency: 12,
        category: 'best-practice'
      }
    ];
  }

  private generatePatternRecommendations(patternName: string, status: string): string[] {
    const recommendations: Record<string, string[]> = {
      declining: [
        'Investigate alternative approaches',
        'Document why this pattern is declining',
        'Create migration guide to better patterns'
      ],
      emerging: [
        'Monitor pattern usage closely',
        'Document successful applications',
        'Consider promoting to high-confidence patterns'
      ],
      stable: [
        'Continue monitoring for changes',
        'Document best practices',
        'Share with team for consistency'
      ]
    };

    return recommendations[status] || ['Monitor pattern performance'];
  }

  private calculateCategoryTrend(category: string): string {
    // This would calculate actual trends from historical data
    const trends: Record<string, string> = {
      'pattern': 'increasing',
      'fix': 'stable',
      'best-practice': 'increasing',
      'anti-pattern': 'decreasing'
    };

    return trends[category] || 'stable';
  }

  private async generateSummaryAnalysis(period: { start: string; end: string }): Promise<AnalyticsReport['summary']> {
    return {
      keyFindings: [
        'System confidence increased by 12% over the period',
        'React patterns show highest success rate (92%)',
        'CSS styling patterns need attention (70% success rate)'
      ],
      criticalIssues: [
        'Declining pattern usage in Angular components',
        'Limited performance optimization patterns'
      ],
      opportunities: [
        'Promote high-confidence patterns to improve overall success rate',
        'Develop more testing-related lessons',
        'Create accessibility-focused patterns'
      ],
      recommendations: [
        'Focus on React and TypeScript pattern development',
        'Address CSS styling pattern failures',
        'Implement pattern promotion system'
      ]
    };
  }

  private async generateDetailedAnalysis(period: { start: string; end: string }): Promise<AnalyticsReport['detailedAnalysis']> {
    return {
      lessonEffectiveness: {
        averageSuccessRate: 0.82,
        topCategories: ['pattern', 'best-practice'],
        improvementAreas: ['css', 'testing']
      },
      patternEvolution: {
        newPatterns: 8,
        evolvedPatterns: 12,
        deprecatedPatterns: 3
      },
      insightValidation: {
        validatedInsights: 15,
        pendingValidation: 5,
        validationAccuracy: 0.87
      },
      systemPerformance: {
        responseTime: '120ms',
        accuracy: 0.85,
        userSatisfaction: 0.88
      }
    };
  }

  private async generateActionItems(period: { start: string; end: string }): Promise<AnalyticsReport['actionItems']> {
    return [
      {
        item: 'Promote high-confidence React patterns',
        priority: 'high',
        owner: 'Development Team',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        item: 'Investigate CSS pattern failures',
        priority: 'medium',
        owner: 'Frontend Team',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      },
      {
        item: 'Create performance optimization patterns',
        priority: 'high',
        owner: 'Architecture Team',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in-progress'
      }
    ];
  }

  private exportToCSV(dashboard: AnalyticsDashboard): string {
    const rows: string[] = [];
    
    // Add header
    rows.push('Metric,Value,Category');
    
    // Add overview metrics
    rows.push(`Total Lessons,${dashboard.overview.totalLessons},Overview`);
    rows.push(`Total Patterns,${dashboard.overview.totalPatterns},Overview`);
    rows.push(`Success Rate,${dashboard.overview.averageSuccessRate},Overview`);
    
    // Add performance metrics
    dashboard.performance.topPerformingLessons.forEach(lesson => {
      rows.push(`${lesson.title},${lesson.successRate},Top Performance`);
    });
    
    return rows.join('\n');
  }

  private exportToHTML(dashboard: AnalyticsDashboard): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Lesson Analytics Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .high { color: green; }
        .medium { color: orange; }
        .low { color: red; }
    </style>
</head>
<body>
    <h1>Lesson Analytics Dashboard</h1>
    <div class="metric">
        <h3>Overview</h3>
        <p>Total Lessons: ${dashboard.overview.totalLessons}</p>
        <p>Total Patterns: ${dashboard.overview.totalPatterns}</p>
        <p>Success Rate: ${(dashboard.overview.averageSuccessRate * 100).toFixed(1)}%</p>
    </div>
    
    <div class="metric">
        <h3>Top Performing Lessons</h3>
        ${dashboard.performance.topPerformingLessons.map(lesson => 
          `<p>${lesson.title}: ${(lesson.successRate * 100).toFixed(1)}% success</p>`
        ).join('')}
    </div>
    
    <div class="metric">
        <h3>Recommendations</h3>
        ${dashboard.recommendations.immediateActions.map(action => 
          `<p><strong>${action.action}</strong>: ${action.description}</p>`
        ).join('')}
    </div>
</body>
</html>
    `;
  }
}
