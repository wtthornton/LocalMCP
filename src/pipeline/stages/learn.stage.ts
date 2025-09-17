import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { VectorDatabaseService } from '../../services/vector/vector-db.service.js';
import { LessonsLearnedService } from '../../services/lessons/lessons-learned.service.js';
import { AdaptiveLearningService } from '../../services/learning/adaptive-learning.service.js';
import type { PipelineStage, PipelineContext, PipelineError, PipelineBudget } from '../pipeline-engine.js';

/**
 * Learn Stage - Captures lessons and patterns from pipeline execution
 * 
 * This stage analyzes the pipeline execution results and captures
 * lessons learned, patterns, and insights for future use.
 */
export class LearnStage implements PipelineStage {
  readonly name = 'Learn';

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private vectorDb: VectorDatabaseService,
    private lessonsService?: LessonsLearnedService,
    private adaptiveLearning?: AdaptiveLearningService
  ) {}

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Executing Learn stage', { 
      toolName: context.toolName,
      requestId: context.requestId 
    });

    try {
      const results: any = {
        lessonsCaptured: 0,
        patternsDiscovered: 0,
        insightsGenerated: 0,
        recommendations: []
      };

      // Extract learning data from pipeline context
      const learningData = this.extractLearningData(context);
      
      if (learningData && this.lessonsService) {
        // Capture lessons from the execution
        const lesson = await this.captureLesson(context, learningData);
        if (lesson) {
          results.lessonsCaptured = 1;
          results.lessonId = lesson.id;
        }
      }

      // Learn from the interaction if adaptive learning is available
      if (this.adaptiveLearning && learningData) {
        await this.learnFromInteraction(context, learningData);
        results.patternsDiscovered = 1;
      }

      // Generate recommendations for future improvements
      if (this.adaptiveLearning) {
        const recommendations = await this.generateRecommendations(context);
        results.recommendations = recommendations;
      }

      // Store learning metadata in context
      context.metadata = {
        ...context.metadata,
        learning: {
          stage: 'Learn',
          timestamp: new Date().toISOString(),
          lessonsCaptured: results.lessonsCaptured,
          patternsDiscovered: results.patternsDiscovered,
          insightsGenerated: results.insightsGenerated
        }
      };

      this.logger.info('Learn stage completed', {
        toolName: context.toolName,
        lessonsCaptured: results.lessonsCaptured,
        patternsDiscovered: results.patternsDiscovered,
        recommendations: results.recommendations.length
      });

      return {
        data: {
          ...context.data,
          learnResults: results
        },
        metadata: {
          ...context.metadata,
          learning: {
            stage: 'Learn',
            timestamp: Date.now(),
            lessonsCaptured: results.lessonsCaptured,
            patternsDiscovered: results.patternsDiscovered,
            insightsGenerated: results.insightsGenerated
          }
        }
      };

    } catch (error) {
      this.logger.error('Learn stage failed:', error);
      return {
        errors: [
          ...context.errors,
          {
            stage: 'Learn',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
            retryable: false
          }
        ]
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    return error.retryable && this.getBudgetCost().time !== undefined;
  }

  getBudgetCost(): Partial<PipelineBudget> {
    return {
      time: 1000, // 1 second
      tokens: 100,
      chunks: 1,
      files: 0
    };
  }

  private extractLearningData(context: PipelineContext): any {
    const learningData: any = {
      toolName: context.toolName,
      requestId: context.requestId,
      startTime: context.startTime,
      budget: context.budget,
      scope: context.scope,
      data: context.data,
      metadata: context.metadata,
      errors: context.errors
    };

    // Extract relevant information from context data
    if (context.data) {
      // Extract context from Context7 stage
      if (context.data.context7Data) {
        learningData.context7Data = context.data.context7Data;
      }

      // Extract RAG results
      if (context.data.ragResults) {
        learningData.ragResults = context.data.ragResults;
      }

      // Extract repository facts
      if (context.data.repoFacts) {
        learningData.repoFacts = context.data.repoFacts;
      }

      // Extract code analysis
      if (context.data.codeAnalysis) {
        learningData.codeAnalysis = context.data.codeAnalysis;
      }

      // Extract planning results
      if (context.data.planning) {
        learningData.planning = context.data.planning;
      }

      // Extract edit results
      if (context.data.editResults) {
        learningData.editResults = context.data.editResults;
      }
    }

    return learningData;
  }

  private async captureLesson(
    context: PipelineContext, 
    learningData: any
  ): Promise<any> {
    if (!this.lessonsService) return null;

    try {
      // Determine lesson category based on tool and outcome
      const category = this.determineLessonCategory(context);
      
      // Extract tags from the execution
      const tags = this.extractTags(context, learningData);
      
      // Create lesson feedback
      const feedback = this.generateLessonFeedback(context, learningData);
      
      // Create lesson context
      const lessonContext = this.generateLessonContext(learningData);

      // Create the lesson
      const lesson = await this.lessonsService.createLesson(
        feedback,
        lessonContext,
        tags,
        {
          toolName: context.toolName,
          projectType: learningData.repoFacts?.projectType || 'unknown',
          framework: learningData.repoFacts?.framework || 'unknown',
          language: learningData.repoFacts?.language || 'unknown',
          complexity: this.determineComplexity(learningData),
          category,
          source: 'system'
        }
      );

      return lesson;

    } catch (error) {
      this.logger.error('Failed to capture lesson:', error);
      return null;
    }
  }

  private async learnFromInteraction(
    context: PipelineContext,
    learningData: any
  ): Promise<void> {
    if (!this.adaptiveLearning) return;

    try {
      // Determine outcome based on context errors
      let outcome: 'success' | 'failure' | 'partial' = 'success';
      
      if (context.errors && context.errors.length > 0) {
        outcome = 'failure';
      } else if (context.metadata?.warnings && context.metadata.warnings.length > 0) {
        outcome = 'partial';
      }

      // Generate feedback for learning
      const feedback = this.generateLearningFeedback(context, learningData);

      // Learn from the interaction
      await this.adaptiveLearning.learnFromInteraction(
        context.toolName,
        this.generateInteractionContext(learningData),
        outcome,
        feedback
      );

    } catch (error) {
      this.logger.error('Failed to learn from interaction:', error);
    }
  }

  private async generateRecommendations(context: PipelineContext): Promise<string[]> {
    if (!this.adaptiveLearning) return [];

    try {
      const recommendations = await this.adaptiveLearning.getRecommendations(
        context.toolName,
        this.generateInteractionContext(context),
        {
          maxRecommendations: 3,
          includeWarnings: true,
          minConfidence: 0.6
        }
      );

      return [
        ...recommendations.patterns.map(p => `Pattern: ${p.name} (${(p.confidence * 100).toFixed(1)}% confidence)`),
        ...recommendations.insights.map(i => `Insight: ${i.title} (${(i.confidence * 100).toFixed(1)}% confidence)`),
        ...recommendations.warnings.map(w => `Warning: ${w.title}`)
      ];

    } catch (error) {
      this.logger.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  private determineLessonCategory(context: PipelineContext): string {
    switch (context.toolName) {
      case 'localmcp.create':
        return 'pattern';
      case 'localmcp.fix':
        return 'fix';
      case 'localmcp.analyze':
        return 'best-practice';
      case 'localmcp.learn':
        return 'pattern';
      default:
        return 'pattern';
    }
  }

  private extractTags(context: PipelineContext, learningData: any): string[] {
    const tags: string[] = [context.toolName];

    // Add tags based on repository facts
    if (learningData.repoFacts) {
      if (learningData.repoFacts.framework) {
        tags.push(learningData.repoFacts.framework.toLowerCase());
      }
      if (learningData.repoFacts.language) {
        tags.push(learningData.repoFacts.language.toLowerCase());
      }
      if (learningData.repoFacts.projectType) {
        tags.push(learningData.repoFacts.projectType.toLowerCase());
      }
    }

    // Add tags based on context7 data
    if (learningData.context7Data?.library) {
      tags.push(learningData.context7Data.library.toLowerCase());
    }

    // Add tags based on code analysis
    if (learningData.codeAnalysis) {
      if (learningData.codeAnalysis.language) {
        tags.push(learningData.codeAnalysis.language.toLowerCase());
      }
      if (learningData.codeAnalysis.framework) {
        tags.push(learningData.codeAnalysis.framework.toLowerCase());
      }
    }

    // Add outcome tags
    if (context.success) {
      tags.push('success');
    } else {
      tags.push('failure');
    }

    if (context.error) {
      tags.push('error');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private generateLessonFeedback(context: PipelineContext, learningData: any): string {
    const parts: string[] = [];

    // Tool and outcome
    const hasErrors = context.errors && context.errors.length > 0;
    parts.push(`${context.toolName} execution ${hasErrors ? 'failed' : 'succeeded'}`);

    // Add execution details
    const executionTime = Date.now() - context.startTime;
    parts.push(`Execution time: ${executionTime}ms`);

    // Add context information
    if (learningData.repoFacts) {
      parts.push(`Project: ${learningData.repoFacts.projectType} with ${learningData.repoFacts.framework}`);
    }

    // Add error information if any
    if (context.errors && context.errors.length > 0) {
      parts.push(`Errors: ${context.errors.map(e => e.error).join(', ')}`);
    }

    // Add warnings if any
    if (context.metadata?.warnings && context.metadata.warnings.length > 0) {
      parts.push(`Warnings: ${context.metadata.warnings.join(', ')}`);
    }

    return parts.join('. ');
  }

  private generateLessonContext(learningData: any): string {
    const contextParts: string[] = [];

    // Add request information
    if (learningData.requestId) {
      contextParts.push(`Request ID: ${learningData.requestId}`);
    }

    // Add execution information
    if (learningData.startTime) {
      contextParts.push(`Start time: ${new Date(learningData.startTime).toISOString()}`);
    }

    // Add repository facts
    if (learningData.repoFacts) {
      contextParts.push(`Repository facts: ${JSON.stringify(learningData.repoFacts)}`);
    }

    // Add code analysis
    if (learningData.codeAnalysis) {
      contextParts.push(`Code analysis: ${JSON.stringify(learningData.codeAnalysis)}`);
    }

    // Add errors if any
    if (learningData.errors && learningData.errors.length > 0) {
      contextParts.push(`Errors: ${learningData.errors.map((e: any) => e.error).join(', ')}`);
    }

    return contextParts.join('\n\n');
  }

  private determineComplexity(learningData: any): 'low' | 'medium' | 'high' {
    let complexity = 'low';

    // Increase complexity based on number of data sources
    const dataSources = Object.keys(learningData).filter(key => 
      learningData[key] && typeof learningData[key] === 'object' && learningData[key] !== null
    );
    if (dataSources.length > 3) {
      complexity = 'medium';
    }

    // Increase complexity based on code analysis
    if (learningData.codeAnalysis?.complexity === 'high') {
      complexity = 'high';
    }

    // Increase complexity based on errors
    if (learningData.errors && learningData.errors.length > 0) {
      complexity = 'medium';
    }

    return complexity as 'low' | 'medium' | 'high';
  }

  private generateLearningFeedback(context: PipelineContext, learningData: any): string {
    const feedback: string[] = [];

    const hasErrors = context.errors && context.errors.length > 0;
    if (hasErrors) {
      feedback.push('Execution failed');
    } else {
      feedback.push('Execution completed successfully');
    }

    const executionTime = Date.now() - context.startTime;
    feedback.push(`Performance: ${executionTime}ms`);

    if (context.errors && context.errors.length > 0) {
      feedback.push(`Error encountered: ${context.errors[0].error}`);
    }

    return feedback.join('. ');
  }

  private generateInteractionContext(data: any): string {
    const contextParts: string[] = [];

    if (data.repoFacts) {
      contextParts.push(`${data.repoFacts.projectType} project using ${data.repoFacts.framework}`);
    }

    if (data.context7Data?.library) {
      contextParts.push(`Using ${data.context7Data.library} library`);
    }

    if (data.codeAnalysis?.language) {
      contextParts.push(`Code in ${data.codeAnalysis.language}`);
    }

    return contextParts.join(', ');
  }
}
