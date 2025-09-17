import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { LessonsLearnedService } from '../lessons/lessons-learned.service.js';
import type { LessonCard, LessonSearchResult } from '../lessons/lessons-learned.service.js';
import { VectorDatabaseService } from '../vector/vector-db.service.js';

export interface LearningPattern {
  id: string;
  name: string;
  description: string;
  confidence: number; // 0-1
  frequency: number;
  lastSeen: string;
  evolution: {
    initialConfidence: number;
    currentConfidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    stabilityScore: number; // 0-1, higher = more stable
  };
  context: {
    frameworks: string[];
    languages: string[];
    projectTypes: string[];
    tools: string[];
    complexity: 'low' | 'medium' | 'high';
  };
  applications: {
    successCases: number;
    failureCases: number;
    adaptationRate: number; // How often pattern is adapted vs used as-is
    effectivenessScore: number; // 0-1
  };
  relatedPatterns: string[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    source: 'discovered' | 'promoted' | 'evolved' | 'deprecated';
    version: number;
  };
}

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'anti-pattern' | 'optimization' | 'warning';
  title: string;
  description: string;
  confidence: number;
  evidence: {
    supportingLessons: string[];
    contradictingLessons: string[];
    successRate: number;
    sampleSize: number;
  };
  recommendations: string[];
  impact: 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
  createdAt: string;
  validatedAt?: string;
}

export interface LearningMetrics {
  totalPatterns: number;
  activePatterns: number; // Patterns used in last 30 days
  patternEvolution: {
    newPatterns: number;
    evolvedPatterns: number;
    deprecatedPatterns: number;
  };
  effectiveness: {
    averageSuccessRate: number;
    patternAccuracy: number;
    adaptationRate: number;
  };
  insights: {
    total: number;
    validated: number;
    pending: number;
  };
  trends: {
    topPerformingPatterns: Array<{
      pattern: string;
      successRate: number;
      frequency: number;
    }>;
    emergingPatterns: Array<{
      pattern: string;
      growthRate: number;
      confidence: number;
    }>;
    decliningPatterns: Array<{
      pattern: string;
      declineRate: number;
      lastUsed: string;
    }>;
  };
}

/**
 * Adaptive Learning Engine
 * 
 * Analyzes lessons learned to discover patterns, insights, and optimizations.
 * Evolves understanding over time and provides intelligent recommendations.
 * Implements pattern recognition, evolution tracking, and adaptive strategies.
 */
export class AdaptiveLearningService {
  private patterns: Map<string, LearningPattern> = new Map();
  private insights: Map<string, LearningInsight> = new Map();
  private learningHistory: Array<{
    timestamp: string;
    action: string;
    pattern?: string;
    insight?: string;
    outcome: 'success' | 'failure' | 'partial';
  }> = [];

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private lessonsService: LessonsLearnedService,
    private vectorDb: VectorDatabaseService
  ) {}

  /**
   * Initialize the adaptive learning service
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Adaptive Learning Service');
    
    try {
      // Load existing patterns and insights
      await this.loadLearningData();
      
      // Discover patterns from existing lessons
      await this.discoverPatterns();
      
      // Generate initial insights
      await this.generateInsights();
      
      this.logger.info('Adaptive Learning Service initialized', {
        patternsDiscovered: this.patterns.size,
        insightsGenerated: this.insights.size
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize Adaptive Learning Service:', error);
      throw error;
    }
  }

  /**
   * Learn from a new interaction
   */
  async learnFromInteraction(
    toolName: string,
    context: string,
    outcome: 'success' | 'failure' | 'partial',
    feedback?: string
  ): Promise<void> {
    this.logger.debug('Learning from interaction', { toolName, outcome });

    try {
      // Record the learning event
      this.learningHistory.push({
        timestamp: new Date().toISOString(),
        action: `${toolName}_${outcome}`,
        outcome
      });

      // Extract patterns from the interaction
      const extractedPatterns = await this.extractPatternsFromInteraction(
        toolName,
        context,
        outcome,
        feedback
      );

      // Update existing patterns or create new ones
      for (const pattern of extractedPatterns) {
        await this.updateOrCreatePattern(pattern, outcome);
      }

      // Generate new insights if significant
      if (this.shouldGenerateInsights()) {
        await this.generateInsights();
      }

      // Evolve patterns based on new data
      await this.evolvePatterns();

    } catch (error) {
      this.logger.error('Failed to learn from interaction:', error);
    }
  }

  /**
   * Get learning recommendations for a specific context
   */
  async getRecommendations(
    toolName: string,
    context: string,
    options: {
      maxRecommendations?: number;
      includeWarnings?: boolean;
      minConfidence?: number;
    } = {}
  ): Promise<{
    patterns: LearningPattern[];
    insights: LearningInsight[];
    warnings: LearningInsight[];
    confidence: number;
  }> {
    const {
      maxRecommendations = 5,
      includeWarnings = true,
      minConfidence = 0.6
    } = options;

    try {
      // Search for relevant patterns
      const relevantPatterns = await this.findRelevantPatterns(
        toolName,
        context,
        maxRecommendations,
        minConfidence
      );

      // Get relevant insights
      const relevantInsights = await this.findRelevantInsights(
        toolName,
        context,
        maxRecommendations,
        minConfidence
      );

      // Get warnings if requested
      let warnings: LearningInsight[] = [];
      if (includeWarnings) {
        warnings = relevantInsights.filter(insight => 
          insight.type === 'warning' && insight.confidence >= minConfidence
        );
      }

      // Calculate overall confidence
      const confidence = this.calculateRecommendationConfidence(
        relevantPatterns,
        relevantInsights
      );

      return {
        patterns: relevantPatterns,
        insights: relevantInsights.filter(insight => insight.type !== 'warning'),
        warnings,
        confidence
      };

    } catch (error) {
      this.logger.error('Failed to get recommendations:', error);
      return {
        patterns: [],
        insights: [],
        warnings: [],
        confidence: 0
      };
    }
  }

  /**
   * Get learning metrics and analytics
   */
  getLearningMetrics(): LearningMetrics {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate pattern statistics
    const allPatterns = Array.from(this.patterns.values());
    const activePatterns = allPatterns.filter(pattern => 
      new Date(pattern.lastSeen) > thirtyDaysAgo
    );

    // Calculate pattern evolution
    const newPatterns = allPatterns.filter(pattern => 
      new Date(pattern.metadata.createdAt) > thirtyDaysAgo
    ).length;

    const evolvedPatterns = allPatterns.filter(pattern => 
      pattern.evolution.trend !== 'stable'
    ).length;

    const deprecatedPatterns = allPatterns.filter(pattern => 
      pattern.confidence < 0.3 && new Date(pattern.lastSeen) < thirtyDaysAgo
    ).length;

    // Calculate effectiveness metrics
    const averageSuccessRate = allPatterns.length > 0 
      ? allPatterns.reduce((sum, pattern) => 
          sum + (pattern.applications.successCases / 
            (pattern.applications.successCases + pattern.applications.failureCases || 1)
          ), 0) / allPatterns.length
      : 0;

    const patternAccuracy = this.calculatePatternAccuracy();
    const adaptationRate = this.calculateAdaptationRate();

    // Calculate insights statistics
    const allInsights = Array.from(this.insights.values());
    const validatedInsights = allInsights.filter(insight => insight.validatedAt).length;
    const pendingInsights = allInsights.filter(insight => !insight.validatedAt).length;

    // Calculate trends
    const topPerformingPatterns = this.getTopPerformingPatterns();
    const emergingPatterns = this.getEmergingPatterns();
    const decliningPatterns = this.getDecliningPatterns();

    return {
      totalPatterns: allPatterns.length,
      activePatterns: activePatterns.length,
      patternEvolution: {
        newPatterns,
        evolvedPatterns,
        deprecatedPatterns
      },
      effectiveness: {
        averageSuccessRate,
        patternAccuracy,
        adaptationRate
      },
      insights: {
        total: allInsights.length,
        validated: validatedInsights,
        pending: pendingInsights
      },
      trends: {
        topPerformingPatterns,
        emergingPatterns,
        decliningPatterns
      }
    };
  }

  /**
   * Validate an insight based on new evidence
   */
  async validateInsight(
    insightId: string,
    validation: 'confirmed' | 'refuted' | 'partial',
    evidence?: string
  ): Promise<void> {
    const insight = this.insights.get(insightId);
    if (!insight) {
      this.logger.warn('Insight not found for validation', { insightId });
      return;
    }

    // Update insight based on validation
    switch (validation) {
      case 'confirmed':
        insight.confidence = Math.min(insight.confidence + 0.1, 1.0);
        break;
      case 'refuted':
        insight.confidence = Math.max(insight.confidence - 0.2, 0.0);
        break;
      case 'partial':
        insight.confidence = Math.max(insight.confidence - 0.05, 0.0);
        break;
    }

    insight.validatedAt = new Date().toISOString();

    // Update evidence if provided
    if (evidence) {
      insight.description += `\n\nValidation: ${evidence}`;
    }

    this.logger.info('Insight validated', {
      insightId,
      validation,
      newConfidence: insight.confidence
    });
  }

  private async loadLearningData(): Promise<void> {
    // Load patterns and insights from storage
    // In a real implementation, this would load from persistent storage
    this.logger.debug('Loading learning data');
  }

  private async discoverPatterns(): Promise<void> {
    // Search for patterns in existing lessons
    const lessons = await this.lessonsService.searchLessons('', { limit: 100 });
    
    for (const result of lessons) {
      const lesson = result.lesson;
      
      // Extract patterns from lesson metadata and content
      const patterns = this.extractPatternsFromLesson(lesson);
      
      for (const pattern of patterns) {
        await this.updateOrCreatePattern(pattern, 'success');
      }
    }

    this.logger.info('Pattern discovery completed', {
      patternsDiscovered: this.patterns.size
    });
  }

  private async generateInsights(): Promise<void> {
    // Analyze patterns to generate insights
    const patterns = Array.from(this.patterns.values());
    
    // Generate insights based on pattern analysis
    const insights = this.analyzePatternsForInsights(patterns);
    
    for (const insight of insights) {
      this.insights.set(insight.id, insight);
    }

    this.logger.info('Insight generation completed', {
      insightsGenerated: insights.length
    });
  }

  private async extractPatternsFromInteraction(
    toolName: string,
    context: string,
    outcome: 'success' | 'failure' | 'partial',
    feedback?: string
  ): Promise<Partial<LearningPattern>[]> {
    const patterns: Partial<LearningPattern>[] = [];

    // Extract patterns based on tool and context
    if (toolName === 'localmcp.create') {
      patterns.push(...this.extractCreationPatterns(context, outcome));
    } else if (toolName === 'localmcp.fix') {
      patterns.push(...this.extractFixPatterns(context, outcome));
    } else if (toolName === 'localmcp.analyze') {
      patterns.push(...this.extractAnalysisPatterns(context, outcome));
    }

    // Extract patterns from feedback
    if (feedback) {
      patterns.push(...this.extractFeedbackPatterns(feedback, outcome));
    }

    return patterns;
  }

  private extractCreationPatterns(
    context: string,
    outcome: 'success' | 'failure' | 'partial'
  ): Partial<LearningPattern>[] {
    const patterns: Partial<LearningPattern>[] = [];

    // Extract framework patterns
    if (context.includes('react')) {
      patterns.push({
        name: 'React Component Creation',
        description: 'Pattern for creating React components',
        context: {
          frameworks: ['React'],
          languages: ['TypeScript', 'JavaScript'],
          projectTypes: ['web'],
          tools: ['localmcp.create'],
          complexity: 'medium'
        }
      });
    }

    // Extract styling patterns
    if (context.includes('css') || context.includes('styling')) {
      patterns.push({
        name: 'CSS Styling Pattern',
        description: 'Pattern for CSS styling approaches',
        context: {
          frameworks: ['vanilla'],
          languages: ['CSS'],
          projectTypes: ['web'],
          tools: ['localmcp.create'],
          complexity: 'low'
        }
      });
    }

    return patterns;
  }

  private extractFixPatterns(
    context: string,
    outcome: 'success' | 'failure' | 'partial'
  ): Partial<LearningPattern>[] {
    const patterns: Partial<LearningPattern>[] = [];

    // Extract error type patterns
    if (context.includes('TypeScript') && context.includes('error')) {
      patterns.push({
        name: 'TypeScript Error Resolution',
        description: 'Pattern for resolving TypeScript errors',
        context: {
          frameworks: ['TypeScript'],
          languages: ['TypeScript'],
          projectTypes: ['web', 'node'],
          tools: ['localmcp.fix'],
          complexity: 'medium'
        }
      });
    }

    return patterns;
  }

  private extractAnalysisPatterns(
    context: string,
    outcome: 'success' | 'failure' | 'partial'
  ): Partial<LearningPattern>[] {
    const patterns: Partial<LearningPattern>[] = [];

    // Extract analysis patterns
    patterns.push({
      name: 'Code Analysis Pattern',
      description: 'Pattern for analyzing code structure and quality',
      context: {
        frameworks: ['any'],
        languages: ['any'],
        projectTypes: ['any'],
        tools: ['localmcp.analyze'],
        complexity: 'high'
      }
    });

    return patterns;
  }

  private extractFeedbackPatterns(
    feedback: string,
    outcome: 'success' | 'failure' | 'partial'
  ): Partial<LearningPattern>[] {
    const patterns: Partial<LearningPattern>[] = [];

    // Extract patterns from feedback content
    if (feedback.toLowerCase().includes('performance')) {
      patterns.push({
        name: 'Performance Optimization',
        description: 'Pattern for performance-related improvements',
        context: {
          frameworks: ['any'],
          languages: ['any'],
          projectTypes: ['any'],
          tools: ['any'],
          complexity: 'high'
        }
      });
    }

    return patterns;
  }

  private extractPatternsFromLesson(lesson: LessonCard): Partial<LearningPattern>[] {
    const patterns: Partial<LearningPattern>[] = [];

    // Extract patterns from lesson metadata
    patterns.push({
      name: `${lesson.metadata.framework} ${lesson.metadata.category}`,
      description: lesson.content.summary,
      context: {
        frameworks: [lesson.metadata.framework],
        languages: [lesson.metadata.language],
        projectTypes: [lesson.metadata.projectType],
        tools: [lesson.metadata.toolName],
        complexity: lesson.metadata.complexity
      }
    });

    return patterns;
  }

  private async updateOrCreatePattern(
    patternData: Partial<LearningPattern>,
    outcome: 'success' | 'failure' | 'partial'
  ): Promise<void> {
    const patternName = patternData.name || 'Unknown Pattern';
    const existingPattern = Array.from(this.patterns.values())
      .find(p => p.name === patternName);

    if (existingPattern) {
      // Update existing pattern
      existingPattern.frequency++;
      existingPattern.lastSeen = new Date().toISOString();
      
      // Update applications
      if (outcome === 'success') {
        existingPattern.applications.successCases++;
      } else {
        existingPattern.applications.failureCases++;
      }

      // Update confidence
      const totalCases = existingPattern.applications.successCases + existingPattern.applications.failureCases;
      existingPattern.confidence = existingPattern.applications.successCases / totalCases;

      // Update evolution
      this.updatePatternEvolution(existingPattern);

      existingPattern.metadata.updatedAt = new Date().toISOString();
    } else {
      // Create new pattern
      const newPattern: LearningPattern = {
        id: this.generatePatternId(),
        name: patternName,
        description: patternData.description || '',
        confidence: 0.5, // Initial confidence
        frequency: 1,
        lastSeen: new Date().toISOString(),
        evolution: {
          initialConfidence: 0.5,
          currentConfidence: 0.5,
          trend: 'stable',
          stabilityScore: 0.5
        },
        context: patternData.context || {
          frameworks: [],
          languages: [],
          projectTypes: [],
          tools: [],
          complexity: 'medium'
        },
        applications: {
          successCases: outcome === 'success' ? 1 : 0,
          failureCases: outcome === 'success' ? 0 : 1,
          adaptationRate: 0.0,
          effectivenessScore: 0.5
        },
        relatedPatterns: [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'discovered',
          version: 1
        }
      };

      this.patterns.set(newPattern.id, newPattern);
    }
  }

  private updatePatternEvolution(pattern: LearningPattern): void {
    const currentConfidence = pattern.confidence;
    const previousConfidence = pattern.evolution.currentConfidence;

    pattern.evolution.currentConfidence = currentConfidence;

    // Determine trend
    if (currentConfidence > previousConfidence + 0.05) {
      pattern.evolution.trend = 'increasing';
    } else if (currentConfidence < previousConfidence - 0.05) {
      pattern.evolution.trend = 'decreasing';
    } else {
      pattern.evolution.trend = 'stable';
    }

    // Calculate stability score
    const confidenceChange = Math.abs(currentConfidence - previousConfidence);
    pattern.evolution.stabilityScore = Math.max(0, 1 - confidenceChange * 10);
  }

  private analyzePatternsForInsights(patterns: LearningPattern[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Analyze for high-performing patterns
    const highPerformingPatterns = patterns.filter(p => 
      p.confidence > 0.8 && p.applications.successCases > 5
    );

    if (highPerformingPatterns.length > 0) {
      insights.push({
        id: this.generateInsightId(),
        type: 'pattern',
        title: 'High-Performing Patterns Identified',
        description: `Found ${highPerformingPatterns.length} patterns with high success rates. Consider applying these patterns more broadly.`,
        confidence: 0.9,
        evidence: {
          supportingLessons: highPerformingPatterns.map(p => p.id),
          contradictingLessons: [],
          successRate: highPerformingPatterns.reduce((sum, p) => sum + p.confidence, 0) / highPerformingPatterns.length,
          sampleSize: highPerformingPatterns.reduce((sum, p) => sum + p.frequency, 0)
        },
        recommendations: [
          'Apply high-performing patterns to similar contexts',
          'Document successful patterns for team knowledge sharing',
          'Consider promoting patterns with >90% success rate'
        ],
        impact: 'high',
        category: 'performance',
        tags: ['pattern', 'success', 'optimization'],
        createdAt: new Date().toISOString()
      });
    }

    // Analyze for anti-patterns
    const antiPatterns = patterns.filter(p => 
      p.confidence < 0.3 && p.applications.failureCases > 3
    );

    if (antiPatterns.length > 0) {
      insights.push({
        id: this.generateInsightId(),
        type: 'anti-pattern',
        title: 'Anti-Patterns Detected',
        description: `Identified ${antiPatterns.length} patterns with low success rates. Avoid these approaches.`,
        confidence: 0.8,
        evidence: {
          supportingLessons: antiPatterns.map(p => p.id),
          contradictingLessons: [],
          successRate: antiPatterns.reduce((sum, p) => sum + p.confidence, 0) / antiPatterns.length,
          sampleSize: antiPatterns.reduce((sum, p) => sum + p.frequency, 0)
        },
        recommendations: [
          'Avoid approaches that have failed multiple times',
          'Document anti-patterns to prevent repetition',
          'Investigate alternative approaches for failed patterns'
        ],
        impact: 'high',
        category: 'anti-pattern',
        tags: ['anti-pattern', 'failure', 'warning'],
        createdAt: new Date().toISOString()
      });
    }

    return insights;
  }

  private async findRelevantPatterns(
    toolName: string,
    context: string,
    maxRecommendations: number,
    minConfidence: number
  ): Promise<LearningPattern[]> {
    const patterns = Array.from(this.patterns.values());
    
    return patterns
      .filter(pattern => {
        // Filter by tool and confidence
        return pattern.context.tools.includes(toolName) && 
               pattern.confidence >= minConfidence;
      })
      .sort((a, b) => {
        // Sort by confidence and frequency
        const scoreA = a.confidence * Math.log(a.frequency + 1);
        const scoreB = b.confidence * Math.log(b.frequency + 1);
        return scoreB - scoreA;
      })
      .slice(0, maxRecommendations);
  }

  private async findRelevantInsights(
    toolName: string,
    context: string,
    maxRecommendations: number,
    minConfidence: number
  ): Promise<LearningInsight[]> {
    const insights = Array.from(this.insights.values());
    
    return insights
      .filter(insight => insight.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxRecommendations);
  }

  private calculateRecommendationConfidence(
    patterns: LearningPattern[],
    insights: LearningInsight[]
  ): number {
    if (patterns.length === 0 && insights.length === 0) {
      return 0;
    }

    const patternConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0;

    const insightConfidence = insights.length > 0 
      ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length 
      : 0;

    return (patternConfidence + insightConfidence) / 2;
  }

  private shouldGenerateInsights(): boolean {
    // Generate insights every 10 learning events or when significant changes occur
    return this.learningHistory.length % 10 === 0;
  }

  private async evolvePatterns(): Promise<void> {
    // Evolve patterns based on recent learning
    const patterns = Array.from(this.patterns.values());
    
    for (const pattern of patterns) {
      // Update pattern evolution
      this.updatePatternEvolution(pattern);
      
      // Check if pattern should be deprecated
      if (pattern.confidence < 0.2 && pattern.frequency > 10) {
        pattern.metadata.source = 'deprecated';
      }
    }
  }

  private calculatePatternAccuracy(): number {
    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) return 0;

    return patterns.reduce((sum, pattern) => sum + pattern.confidence, 0) / patterns.length;
  }

  private calculateAdaptationRate(): number {
    const patterns = Array.from(this.patterns.values());
    if (patterns.length === 0) return 0;

    return patterns.reduce((sum, pattern) => sum + pattern.applications.adaptationRate, 0) / patterns.length;
  }

  private getTopPerformingPatterns(): Array<{
    pattern: string;
    successRate: number;
    frequency: number;
  }> {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(pattern => ({
        pattern: pattern.name,
        successRate: pattern.confidence,
        frequency: pattern.frequency
      }));
  }

  private getEmergingPatterns(): Array<{
    pattern: string;
    growthRate: number;
    confidence: number;
  }> {
    return Array.from(this.patterns.values())
      .filter(pattern => 
        pattern.evolution.trend === 'increasing' && 
        pattern.frequency < 10
      )
      .sort((a, b) => b.evolution.currentConfidence - a.evolution.currentConfidence)
      .slice(0, 5)
      .map(pattern => ({
        pattern: pattern.name,
        growthRate: pattern.evolution.currentConfidence - pattern.evolution.initialConfidence,
        confidence: pattern.confidence
      }));
  }

  private getDecliningPatterns(): Array<{
    pattern: string;
    declineRate: number;
    lastUsed: string;
  }> {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.evolution.trend === 'decreasing')
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, 5)
      .map(pattern => ({
        pattern: pattern.name,
        declineRate: pattern.evolution.initialConfidence - pattern.evolution.currentConfidence,
        lastUsed: pattern.lastSeen
      }));
  }

  private generatePatternId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `pattern_${timestamp}_${random}`;
  }

  private generateInsightId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `insight_${timestamp}_${random}`;
  }
}
