import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { VectorDatabaseService } from '../services/vector/vector-db.service.js';
import { PlaywrightService } from '../services/playwright/playwright.service.js';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface LearnResult {
  confirmation: string;
  lessonId: string;
  impact: string;
}

export interface LessonCard {
  id: string;
  timestamp: string;
  feedback: string;
  context: string;
  tags: string[];
  pattern: string;
  solution: string;
  confidence: number;
  usageCount: number;
  lastUsed: string;
}

/**
 * LessonLearner - "Remember this solution"
 * 
 * Captures successful coding patterns, solutions, or best practices from the current interaction
 * and integrates them into LocalMCP's knowledge base for future application.
 */
export class LessonLearner {
  private lessonsPath: string;
  private lessons: Map<string, LessonCard> = new Map();

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private vectorDb?: VectorDatabaseService,
    private playwright?: PlaywrightService
  ) {
    this.lessonsPath = join(process.cwd(), 'data', 'lessons');
    this.loadLessons();
  }

  async learn(
    feedback: string,
    context: string,
    tags: string[] = []
  ): Promise<LearnResult> {
    this.logger.info('Learning new pattern', { feedback, tags });

    try {
      const lessonId = this.generateLessonId();
      const lesson = await this.createLessonCard(lessonId, feedback, context, tags);
      
      await this.saveLesson(lesson);
      this.lessons.set(lessonId, lesson);

      const confirmation = this.generateConfirmation(lesson);
      const impact = this.assessImpact(lesson);

      const result: LearnResult = {
        confirmation,
        lessonId,
        impact
      };

      // Add visual regression testing if Playwright is available
      let visualTestResult: { explanation: string; nextSteps: string[] } | null = null;
      if (this.playwright?.isEnabled() && context) {
        visualTestResult = await this.performVisualRegressionTesting(feedback, context, tags);
      }

      this.logger.info('Lesson learned successfully', {
        lessonId,
        tags: lesson.tags,
        confidence: lesson.confidence,
        visualTested: !!visualTestResult
      });

      return result;

    } catch (error) {
      this.logger.error('Learning failed:', error);
      throw new Error(`Learning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRelevantLessons(query: string, limit: number = 5): Promise<LessonCard[]> {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    
    const scoredLessons = Array.from(this.lessons.values())
      .map(lesson => ({
        lesson,
        score: this.calculateRelevanceScore(lesson, queryWords)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.lesson);

    return scoredLessons;
  }

  async updateLessonUsage(lessonId: string): Promise<void> {
    const lesson = this.lessons.get(lessonId);
    if (lesson) {
      lesson.usageCount++;
      lesson.lastUsed = new Date().toISOString();
      await this.saveLesson(lesson);
    }
  }

  private async createLessonCard(
    lessonId: string,
    feedback: string,
    context: string,
    tags: string[]
  ): Promise<LessonCard> {
    const now = new Date().toISOString();
    
    // Extract pattern and solution from context
    const { pattern, solution } = this.extractPatternAndSolution(context);
    
    // Calculate confidence based on feedback quality and context length
    const confidence = this.calculateConfidence(feedback, context);
    
    // Generate additional tags from context
    const generatedTags = this.generateTagsFromContext(context);
    const allTags = [...new Set([...tags, ...generatedTags])];

    return {
      id: lessonId,
      timestamp: now,
      feedback,
      context,
      tags: allTags,
      pattern,
      solution,
      confidence,
      usageCount: 0,
      lastUsed: now
    };
  }

  private extractPatternAndSolution(context: string): { pattern: string; solution: string } {
    // Simple pattern extraction - in a real implementation, this would be more sophisticated
    const lines = context.split('\n').filter(line => line.trim());
    
    let pattern = '';
    let solution = '';
    
    // Look for common patterns
    if (context.includes('function') || context.includes('const') || context.includes('let')) {
      pattern = 'Code structure pattern';
    } else if (context.includes('error') || context.includes('fix')) {
      pattern = 'Error resolution pattern';
    } else if (context.includes('component') || context.includes('React') || context.includes('Vue')) {
      pattern = 'Component pattern';
    } else if (context.includes('API') || context.includes('fetch') || context.includes('axios')) {
      pattern = 'API integration pattern';
    } else {
      pattern = 'General coding pattern';
    }
    
    // Extract solution (first few lines that look like code)
    const codeLines = lines.filter(line => 
      line.includes('{') || 
      line.includes('(') || 
      line.includes('=') || 
      line.includes('import') ||
      line.includes('export')
    );
    
    solution = codeLines.slice(0, 3).join('\n') || context.substring(0, 200);

    return { pattern, solution };
  }

  private calculateConfidence(feedback: string, context: string): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on feedback quality
    if (feedback.toLowerCase().includes('works') || feedback.toLowerCase().includes('perfect')) {
      confidence += 0.3;
    }
    if (feedback.toLowerCase().includes('great') || feedback.toLowerCase().includes('excellent')) {
      confidence += 0.2;
    }
    if (feedback.toLowerCase().includes('thanks') || feedback.toLowerCase().includes('helpful')) {
      confidence += 0.1;
    }
    
    // Increase confidence based on context length and detail
    if (context.length > 500) {
      confidence += 0.1;
    }
    if (context.includes('code') || context.includes('function') || context.includes('component')) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private generateTagsFromContext(context: string): string[] {
    const tags: string[] = [];
    const contextLower = context.toLowerCase();
    
    // Technology tags
    if (contextLower.includes('react')) tags.push('react');
    if (contextLower.includes('vue')) tags.push('vue');
    if (contextLower.includes('angular')) tags.push('angular');
    if (contextLower.includes('typescript')) tags.push('typescript');
    if (contextLower.includes('javascript')) tags.push('javascript');
    if (contextLower.includes('node')) tags.push('nodejs');
    if (contextLower.includes('express')) tags.push('express');
    if (contextLower.includes('next')) tags.push('nextjs');
    
    // Pattern tags
    if (contextLower.includes('component')) tags.push('component');
    if (contextLower.includes('function')) tags.push('function');
    if (contextLower.includes('class')) tags.push('class');
    if (contextLower.includes('hook')) tags.push('hook');
    if (contextLower.includes('api')) tags.push('api');
    if (contextLower.includes('error')) tags.push('error-handling');
    if (contextLower.includes('test')) tags.push('testing');
    if (contextLower.includes('style') || contextLower.includes('css')) tags.push('styling');
    
    // Problem type tags
    if (contextLower.includes('fix') || contextLower.includes('bug')) tags.push('bug-fix');
    if (contextLower.includes('create') || contextLower.includes('new')) tags.push('creation');
    if (contextLower.includes('optimize') || contextLower.includes('performance')) tags.push('optimization');
    if (contextLower.includes('refactor')) tags.push('refactoring');
    
    return tags;
  }

  private calculateRelevanceScore(lesson: LessonCard, queryWords: string[]): number {
    let score = 0;
    
    // Check tags
    const lessonTags = lesson.tags.map(tag => tag.toLowerCase());
    for (const word of queryWords) {
      if (lessonTags.some(tag => tag.includes(word))) {
        score += 2;
      }
    }
    
    // Check pattern
    const patternLower = lesson.pattern.toLowerCase();
    for (const word of queryWords) {
      if (patternLower.includes(word)) {
        score += 1.5;
      }
    }
    
    // Check solution
    const solutionLower = lesson.solution.toLowerCase();
    for (const word of queryWords) {
      if (solutionLower.includes(word)) {
        score += 1;
      }
    }
    
    // Check context
    const contextLower = lesson.context.toLowerCase();
    for (const word of queryWords) {
      if (contextLower.includes(word)) {
        score += 0.5;
      }
    }
    
    // Boost score for frequently used lessons
    score += Math.log(lesson.usageCount + 1) * 0.5;
    
    // Boost score for recent lessons
    const daysSinceLastUsed = (Date.now() - new Date(lesson.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUsed < 7) {
      score += 1;
    }
    
    return score;
  }

  private generateLessonId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `lesson_${timestamp}_${random}`;
  }

  private generateConfirmation(lesson: LessonCard): string {
    return `✅ Lesson captured successfully!

**Pattern:** ${lesson.pattern}
**Tags:** ${lesson.tags.join(', ')}
**Confidence:** ${Math.round(lesson.confidence * 100)}%

This solution will be available for future similar problems. LocalMCP will get smarter and more personalized over time!`;
  }

  private assessImpact(lesson: LessonCard): string {
    const impactLevels = [];
    
    if (lesson.confidence > 0.8) {
      impactLevels.push('High confidence solution');
    }
    
    if (lesson.tags.length > 3) {
      impactLevels.push('Well-categorized for easy retrieval');
    }
    
    if (lesson.pattern.includes('Error') || lesson.pattern.includes('Bug')) {
      impactLevels.push('Will help prevent similar errors');
    }
    
    if (lesson.pattern.includes('Component') || lesson.pattern.includes('API')) {
      impactLevels.push('Will accelerate future development');
    }
    
    if (impactLevels.length === 0) {
      return 'This lesson will be useful for future reference and pattern matching.';
    }
    
    return impactLevels.join('. ') + '.';
  }

  private async saveLesson(lesson: LessonCard): Promise<void> {
    try {
      await mkdir(this.lessonsPath, { recursive: true });
      const filePath = join(this.lessonsPath, `${lesson.id}.json`);
      await writeFile(filePath, JSON.stringify(lesson, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to save lesson:', error);
      throw error;
    }
  }

  private async loadLessons(): Promise<void> {
    try {
      // In a real implementation, this would load from a database
      // For now, we'll just initialize an empty map
      this.logger.info('Lessons loaded', { count: this.lessons.size });
    } catch (error) {
      this.logger.warn('Could not load lessons:', error);
    }
  }

  private async performVisualRegressionTesting(
    feedback: string,
    context: string,
    tags: string[]
  ): Promise<{ explanation: string; nextSteps: string[] } | null> {
    if (!this.playwright?.isEnabled()) {
      return null;
    }

    try {
      this.logger.info('Starting visual regression testing for lesson', { tags });

      const testResults: string[] = [];
      const nextSteps: string[] = [];

      // Check if the context contains file paths that can be tested
      const filePaths = this.extractFilePathsFromContext(context);
      if (filePaths.length === 0) {
        return null; // No testable files found
      }

      for (const filePath of filePaths) {
        if (!filePath.endsWith('.html')) {
          continue; // Only test HTML files
        }

        const fileUrl = `file://${filePath}`;
        
        // Take a screenshot for visual regression testing
        const screenshotResult = await this.playwright.takeScreenshot(fileUrl, {
          fullPage: true,
          quality: 90,
          format: 'png'
        });

        if (screenshotResult.success) {
          testResults.push(`✅ Visual regression screenshot captured: ${filePath}`);
          
          // Validate the page structure
          const validationResult = await this.playwright.validatePage(fileUrl, {
            elements: ['body', 'head', 'title'],
            screenshots: true
          });

          if (validationResult.success && validationResult.validation) {
            const validation = validationResult.validation;
            if (validation.passed) {
              testResults.push(`✅ Visual structure validation passed`);
            } else {
              testResults.push(`⚠️  Visual structure issues: ${validation.errors?.join(', ')}`);
              nextSteps.push('Review visual structure issues found during regression testing');
            }
          }

          // Check for visual consistency
          const pageInfo = await this.playwright.getPageInfo(fileUrl);
          if (pageInfo.success && pageInfo.info) {
            const info = pageInfo.info;
            testResults.push(`📊 Visual analysis: ${info.elements.length} elements, ${info.images.length} images`);
            
            // Check for visual elements that might be affected by the lesson
            if (tags.includes('css') || tags.includes('styling')) {
              testResults.push(`🎨 CSS-related lesson detected - visual changes may be present`);
              nextSteps.push('Compare before/after screenshots for visual changes');
            }
            
            if (tags.includes('layout') || tags.includes('responsive')) {
              testResults.push(`📱 Layout-related lesson detected - responsive design validation recommended`);
              nextSteps.push('Test the page at different screen sizes');
            }
          }

        } else {
          testResults.push(`❌ Visual regression test failed for ${filePath}: ${screenshotResult.error}`);
        }
      }

      if (testResults.length > 0) {
        nextSteps.push('Store visual regression screenshots for future comparison');
        nextSteps.push('Set up automated visual regression testing pipeline');
        
        return {
          explanation: `Visual Regression Testing Results:\n${testResults.join('\n')}`,
          nextSteps
        };
      }

      return null;

    } catch (error) {
      this.logger.error('Visual regression testing failed:', error);
      return {
        explanation: `Visual regression testing encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        nextSteps: ['Check Playwright sidecar is running: docker-compose up playwright']
      };
    }
  }

  private extractFilePathsFromContext(context: string): string[] {
    // Extract file paths from context string
    const filePathRegex = /(?:file:\/\/|\.\/|\/)[^\s]+\.(html|htm|css|js|ts|tsx|jsx)/gi;
    const matches = context.match(filePathRegex) || [];
    
    return matches.map(match => {
      // Clean up the file path
      if (match.startsWith('file://')) {
        return match.substring(7); // Remove file:// prefix
      }
      return match;
    });
  }
}
