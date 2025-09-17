import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { VectorDatabaseService } from '../vector/vector-db.service.js';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';

export interface LessonCard {
  id: string;
  feedback: string;
  context: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  confidence: number; // 0-1
  successCount: number;
  failureCount: number;
  lastUsed: string;
  metadata: {
    toolName: string;
    projectType: string;
    framework: string;
    language: string;
    complexity: 'low' | 'medium' | 'high';
    category: 'pattern' | 'fix' | 'best-practice' | 'anti-pattern' | 'archived';
    source: 'user' | 'system' | 'promoted';
    promotedFrom?: string;
    promotedFromProject?: string;
    promotedAt?: string;
    promotionScore?: number;
    isPromoted?: boolean;
  };
  content: {
    summary: string;
    description: string;
    examples: string[];
    applications: string[];
    warnings: string[];
    relatedLessons: string[];
  };
}

export interface LessonSearchResult {
  lesson: LessonCard;
  similarity: number;
  relevance: number;
}

export interface LessonAnalytics {
  totalLessons: number;
  byCategory: Record<string, number>;
  byConfidence: {
    high: number; // >= 0.7
    medium: number; // 0.4-0.7
    low: number; // < 0.4
  };
  bySource: Record<string, number>;
  successRate: number;
  topTags: Array<{ tag: string; count: number }>;
  recentActivity: Array<{
    date: string;
    lessonsCreated: number;
    lessonsUsed: number;
    successRate: number;
  }>;
}

/**
 * Lessons Learned Service
 * 
 * Manages the intelligent pattern capture and learning system.
 * Stores lessons in vector database for semantic search and retrieval.
 * Implements pattern recognition, confidence scoring, and adaptive learning.
 */
export class LessonsLearnedService {
  private lessons: Map<string, LessonCard> = new Map();
  private lessonsDir: string;

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private vectorDb: VectorDatabaseService
  ) {
    this.lessonsDir = this.config.getNested('database', 'path')?.replace('.db', '') || './data/lessons';
  }

  /**
   * Initialize the lessons learned service
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Lessons Learned Service');
    
    try {
      // Ensure lessons directory exists
      await this.ensureDirectoryExists(this.lessonsDir);
      
      // Load existing lessons from disk
      await this.loadLessonsFromDisk();
      
      // Initialize vector database collection for lessons
      await this.initializeVectorCollection();
      
      this.logger.info('Lessons Learned Service initialized', {
        lessonsLoaded: this.lessons.size,
        lessonsDir: this.lessonsDir
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize Lessons Learned Service:', error);
      throw error;
    }
  }

  /**
   * Create a new lesson from feedback and context
   */
  async createLesson(
    feedback: string,
    context: string,
    tags: string[],
    metadata: Partial<LessonCard['metadata']> = {}
  ): Promise<LessonCard> {
    const lessonId = this.generateLessonId();
    const now = new Date().toISOString();
    
    const lesson: LessonCard = {
      id: lessonId,
      feedback,
      context,
      tags: [...new Set(tags)], // Remove duplicates
      createdAt: now,
      updatedAt: now,
      confidence: 0.5, // Initial confidence
      successCount: 0,
      failureCount: 0,
      lastUsed: now,
      metadata: {
        toolName: metadata.toolName || 'unknown',
        projectType: metadata.projectType || 'unknown',
        framework: metadata.framework || 'unknown',
        language: metadata.language || 'unknown',
        complexity: metadata.complexity || 'medium',
        category: metadata.category || 'pattern',
        source: metadata.source || 'user',
        ...metadata
      },
      content: await this.generateLessonContent(feedback, context, tags, metadata)
    };

    // Store in memory
    this.lessons.set(lessonId, lesson);
    
    // Store in vector database
    await this.storeLessonInVector(lesson);
    
    // Persist to disk
    await this.persistLessonToDisk(lesson);
    
    this.logger.info('Lesson created', {
      lessonId,
      tags: lesson.tags,
      confidence: lesson.confidence,
      category: lesson.metadata.category
    });
    
    return lesson;
  }

  /**
   * Search for relevant lessons based on query
   */
  async searchLessons(
    query: string,
    options: {
      limit?: number;
      minConfidence?: number;
      tags?: string[];
      category?: string;
      framework?: string;
    } = {}
  ): Promise<LessonSearchResult[]> {
    const {
      limit = 5,
      minConfidence = 0.3,
      tags = [],
      category,
      framework
    } = options;

    try {
      // Search in vector database
      const vectorResults = await this.vectorDb.searchLessons(query, {
        limit: limit * 2, // Get more results to filter
        scoreThreshold: 0.5
      });

      // Filter and rank results
      const filteredResults = vectorResults
        .filter(result => {
          const lesson = this.lessons.get(result.id);
          if (!lesson) return false;
          
          // Apply filters
          if (lesson.confidence < minConfidence) return false;
          if (category && lesson.metadata.category !== category) return false;
          if (framework && lesson.metadata.framework !== framework) return false;
          if (tags.length > 0 && !tags.some(tag => lesson.tags.includes(tag))) return false;
          
          return true;
        })
        .map(result => {
          const lesson = this.lessons.get(result.id)!;
          const relevance = this.calculateRelevance(lesson, query, options);
          
          return {
            lesson,
            similarity: result.score,
            relevance
          };
        })
        .sort((a, b) => (b.relevance + b.similarity) - (a.relevance + a.similarity))
        .slice(0, limit);

      this.logger.debug('Lesson search completed', {
        query,
        resultsFound: filteredResults.length,
        totalLessons: this.lessons.size
      });

      return filteredResults;

    } catch (error) {
      this.logger.error('Lesson search failed:', error);
      return [];
    }
  }

  /**
   * Update lesson based on usage feedback
   */
  async updateLessonUsage(
    lessonId: string,
    success: boolean,
    feedback?: string
  ): Promise<void> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) {
      this.logger.warn('Lesson not found for usage update', { lessonId });
      return;
    }

    // Update counters
    if (success) {
      lesson.successCount++;
    } else {
      lesson.failureCount++;
    }

    // Update confidence based on success rate
    const totalUses = lesson.successCount + lesson.failureCount;
    lesson.confidence = lesson.successCount / totalUses;
    
    // Update last used timestamp
    lesson.lastUsed = new Date().toISOString();
    lesson.updatedAt = lesson.lastUsed;

    // Update content if feedback provided
    if (feedback) {
      lesson.content.description += `\n\nUpdate: ${feedback}`;
    }

    // Store updated lesson
    await this.storeLessonInVector(lesson);
    await this.persistLessonToDisk(lesson);

    this.logger.info('Lesson usage updated', {
      lessonId,
      success,
      newConfidence: lesson.confidence,
      totalUses
    });
  }

  /**
   * Get lesson analytics
   */
  getAnalytics(): LessonAnalytics {
    const lessons = Array.from(this.lessons.values());
    
    const byCategory = lessons.reduce((acc, lesson) => {
      acc[lesson.metadata.category] = (acc[lesson.metadata.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySource = lessons.reduce((acc, lesson) => {
      acc[lesson.metadata.source] = (acc[lesson.metadata.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byConfidence = {
      high: lessons.filter(l => l.confidence >= 0.7).length,
      medium: lessons.filter(l => l.confidence >= 0.4 && l.confidence < 0.7).length,
      low: lessons.filter(l => l.confidence < 0.4).length
    };

    const totalSuccesses = lessons.reduce((sum, l) => sum + l.successCount, 0);
    const totalFailures = lessons.reduce((sum, l) => sum + l.failureCount, 0);
    const successRate = totalSuccesses + totalFailures > 0 ? totalSuccesses / (totalSuccesses + totalFailures) : 0;

    const tagCounts = lessons.reduce((acc, lesson) => {
      lesson.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalLessons: lessons.length,
      byCategory,
      byConfidence,
      bySource,
      successRate,
      topTags,
      recentActivity: this.getRecentActivity(lessons)
    };
  }

  /**
   * Promote high-confidence lessons to stack-shared
   */
  async promoteLessons(): Promise<number> {
    const lessons = Array.from(this.lessons.values());
    const promotionThreshold = 5; // Minimum success count
    const confidenceThreshold = 0.7; // Minimum confidence
    
    const lessonsToPromote = lessons.filter(lesson => 
      lesson.successCount >= promotionThreshold &&
      lesson.confidence >= confidenceThreshold &&
      lesson.metadata.source !== 'promoted'
    );

    let promotedCount = 0;
    for (const lesson of lessonsToPromote) {
      lesson.metadata.source = 'promoted';
      lesson.updatedAt = new Date().toISOString();
      
      await this.storeLessonInVector(lesson);
      await this.persistLessonToDisk(lesson);
      
      promotedCount++;
    }

    this.logger.info('Lessons promoted to stack-shared', {
      promotedCount,
      totalLessons: lessons.length
    });

    return promotedCount;
  }

  /**
   * Decay old lessons with low success rates
   */
  async decayLessons(): Promise<number> {
    const lessons = Array.from(this.lessons.values());
    const decayThreshold = 30; // Days
    const minSuccessRate = 0.3;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - decayThreshold);
    
    const lessonsToDecay = lessons.filter(lesson => {
      const lastUsed = new Date(lesson.lastUsed);
      const totalUses = lesson.successCount + lesson.failureCount;
      const successRate = totalUses > 0 ? lesson.successCount / totalUses : 0;
      
      return lastUsed < cutoffDate && successRate < minSuccessRate;
    });

    let decayedCount = 0;
    for (const lesson of lessonsToDecay) {
      // Reduce confidence
      lesson.confidence *= 0.8;
      
      // Archive old lessons instead of deleting
      lesson.metadata.category = 'archived';
      lesson.updatedAt = new Date().toISOString();
      
      await this.persistLessonToDisk(lesson);
      decayedCount++;
    }

    this.logger.info('Old lessons decayed', {
      decayedCount,
      totalLessons: lessons.length
    });

    return decayedCount;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async loadLessonsFromDisk(): Promise<void> {
    try {
      const files = await readdir(this.lessonsDir);
      const lessonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of lessonFiles) {
        try {
          const filePath = join(this.lessonsDir, file);
          const content = await readFile(filePath, 'utf-8');
          const lesson: LessonCard = JSON.parse(content);
          
          this.lessons.set(lesson.id, lesson);
        } catch (error) {
          this.logger.warn('Failed to load lesson file', { file, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
      
      this.logger.info('Lessons loaded from disk', {
        filesLoaded: lessonFiles.length,
        totalLessons: this.lessons.size
      });
      
    } catch (error) {
      this.logger.warn('Failed to load lessons from disk', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async initializeVectorCollection(): Promise<void> {
    // Vector collection is already initialized in VectorDatabaseService
    // Just ensure we can store lessons
    this.logger.debug('Vector collection for lessons is ready');
  }

  private async generateLessonContent(
    feedback: string,
    context: string,
    tags: string[],
    metadata: Partial<LessonCard['metadata']>
  ): Promise<LessonCard['content']> {
    // Generate structured content from feedback and context
    const summary = this.extractSummary(feedback);
    const description = this.generateDescription(feedback, context);
    const examples = this.extractExamples(context);
    const applications = this.generateApplications(tags, metadata);
    const warnings = this.generateWarnings(feedback, context);
    
    return {
      summary,
      description,
      examples,
      applications,
      warnings,
      relatedLessons: []
    };
  }

  private extractSummary(feedback: string): string {
    // Simple summary extraction - in a real implementation, this would be more sophisticated
    const sentences = feedback.split('.').filter(s => s.trim().length > 10);
    return sentences[0]?.trim() || feedback.substring(0, 100);
  }

  private generateDescription(feedback: string, context: string): string {
    return `${feedback}\n\nContext: ${context}`;
  }

  private extractExamples(context: string): string[] {
    // Extract code examples or patterns from context
    const examples: string[] = [];
    
    // Look for code blocks
    const codeBlocks = context.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      examples.push(...codeBlocks);
    }
    
    // Look for file paths or patterns
    const filePaths = context.match(/[^\s]+\.(ts|js|tsx|jsx|html|css)/g);
    if (filePaths) {
      examples.push(...filePaths.slice(0, 3));
    }
    
    return examples;
  }

  private generateApplications(tags: string[], metadata: Partial<LessonCard['metadata']>): string[] {
    const applications: string[] = [];
    
    if (tags.includes('css')) applications.push('Styling and layout');
    if (tags.includes('react')) applications.push('React component development');
    if (tags.includes('typescript')) applications.push('TypeScript development');
    if (tags.includes('error')) applications.push('Error handling and debugging');
    if (tags.includes('performance')) applications.push('Performance optimization');
    
    if (metadata.framework) {
      applications.push(`${metadata.framework} development`);
    }
    
    return applications.length > 0 ? applications : ['General development'];
  }

  private generateWarnings(feedback: string, context: string): string[] {
    const warnings: string[] = [];
    
    if (feedback.toLowerCase().includes('warning') || feedback.toLowerCase().includes('caution')) {
      warnings.push('Pay attention to potential issues mentioned in feedback');
    }
    
    if (context.toLowerCase().includes('deprecated') || context.toLowerCase().includes('legacy')) {
      warnings.push('Consider using modern alternatives');
    }
    
    return warnings;
  }

  private async storeLessonInVector(lesson: LessonCard): Promise<void> {
    try {
      const content = `${lesson.content.summary}\n\n${lesson.content.description}\n\nTags: ${lesson.tags.join(', ')}`;
      
      await this.vectorDb.storeDocument({
        id: lesson.id,
        content,
        metadata: {
          type: 'lesson',
          source: 'lessons-learned',
          title: lesson.content.summary,
          tags: lesson.tags,
          confidence: lesson.confidence,
          category: lesson.metadata.category,
          framework: lesson.metadata.framework,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt
        }
      });
      
    } catch (error) {
      this.logger.error('Failed to store lesson in vector database:', error);
    }
  }

  private async persistLessonToDisk(lesson: LessonCard): Promise<void> {
    try {
      const filePath = join(this.lessonsDir, `${lesson.id}.json`);
      await writeFile(filePath, JSON.stringify(lesson, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to persist lesson to disk:', error);
    }
  }

  private calculateRelevance(lesson: LessonCard, query: string, options: any): number {
    let relevance = 0.5; // Base relevance
    
    // Boost relevance for exact tag matches
    if (options.tags) {
      const tagMatches = options.tags.filter((tag: string) => lesson.tags.includes(tag)).length;
      relevance += tagMatches * 0.1;
    }
    
    // Boost relevance for category matches
    if (options.category && lesson.metadata.category === options.category) {
      relevance += 0.2;
    }
    
    // Boost relevance for framework matches
    if (options.framework && lesson.metadata.framework === options.framework) {
      relevance += 0.2;
    }
    
    // Boost relevance based on confidence
    relevance += lesson.confidence * 0.2;
    
    // Boost relevance for recent lessons
    const daysSinceCreated = (Date.now() - new Date(lesson.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 30) {
      relevance += 0.1;
    }
    
    return Math.min(relevance, 1.0);
  }

  private getRecentActivity(lessons: LessonCard[]): Array<{
    date: string;
    lessonsCreated: number;
    lessonsUsed: number;
    successRate: number;
  }> {
    // Generate activity for last 7 days
    const activity: Array<{
      date: string;
      lessonsCreated: number;
      lessonsUsed: number;
      successRate: number;
    }> = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0] || '';
      
      const dayLessons = lessons.filter(lesson => 
        (lesson.createdAt as string).startsWith(dateStr) || (lesson.lastUsed as string).startsWith(dateStr)
      );
      
      const createdToday = lessons.filter(lesson => 
        (lesson.createdAt as string).startsWith(dateStr)
      ).length;
      const usedToday = lessons.filter(lesson => 
        (lesson.lastUsed as string).startsWith(dateStr)
      ).length;
      
      const todaySuccesses = dayLessons.reduce((sum, lesson) => sum + lesson.successCount, 0);
      const todayFailures = dayLessons.reduce((sum, lesson) => sum + lesson.failureCount, 0);
      const todaySuccessRate = todaySuccesses + todayFailures > 0 ? todaySuccesses / (todaySuccesses + todayFailures) : 0;
      
      activity.push({
        date: dateStr || '',
        lessonsCreated: createdToday,
        lessonsUsed: usedToday,
        successRate: todaySuccessRate
      });
    }
    
    return activity;
  }

  private generateLessonId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `lesson_${timestamp}_${random}`;
  }
}
