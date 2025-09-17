import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { PlaywrightService } from '../../services/playwright/playwright.service.js';
import type { PipelineStage, PipelineContext, PipelineError, PipelineBudget } from '../pipeline-engine.js';

/**
 * Validate Stage - Validates pipeline execution results
 * 
 * This stage validates the results of pipeline execution,
 * including code quality, functionality, and compliance checks.
 */
export class ValidateStage implements PipelineStage {
  readonly name = 'Validate';

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private playwright: PlaywrightService
  ) {}

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Executing Validate stage', { 
      toolName: context.toolName,
      requestId: context.requestId 
    });

    try {
      const results: any = {
        validationPassed: true,
        checksPerformed: [],
        issues: [],
        warnings: [],
        suggestions: []
      };

      // Validate based on tool type
      switch (context.toolName) {
        case 'localmcp.create':
          await this.validateCreateResults(context, results);
          break;
        case 'localmcp.fix':
          await this.validateFixResults(context, results);
          break;
        case 'localmcp.analyze':
          await this.validateAnalyzeResults(context, results);
          break;
        case 'localmcp.learn':
          await this.validateLearnResults(context, results);
          break;
        default:
          this.logger.warn('Unknown tool for validation', { toolName: context.toolName });
      }

      // Update context with validation results
      context.metadata = {
        ...context.metadata,
        validation: {
          stage: 'Validate',
          timestamp: new Date().toISOString(),
          passed: results.validationPassed,
          checksPerformed: results.checksPerformed.length,
          issues: results.issues.length,
          warnings: results.warnings.length
        }
      };

      // Add warnings to context if any
      if (results.warnings.length > 0) {
        context.warnings = [...(context.warnings || []), ...results.warnings];
      }

      // If validation failed, mark context as unsuccessful
      if (!results.validationPassed && results.issues.length > 0) {
        context.success = false;
        context.error = {
          stage: 'Validate',
          message: `Validation failed: ${results.issues.join(', ')}`,
          timestamp: new Date().toISOString(),
          context: {
            toolName: context.toolName,
            requestId: context.requestId
          }
        };
      }

      this.logger.info('Validate stage completed', {
        toolName: context.toolName,
        validationPassed: results.validationPassed,
        checksPerformed: results.checksPerformed.length,
        issues: results.issues.length
      });

      return {
        data: {
          ...context.data,
          validationResults: results
        },
        metadata: {
          ...context.metadata,
          validation: {
            stage: 'Validate',
            timestamp: Date.now(),
            passed: results.validationPassed,
            checksPerformed: results.checksPerformed.length,
            issues: results.issues.length,
            warnings: results.warnings.length
          }
        }
      };

    } catch (error) {
      this.logger.error('Validate stage failed:', error);
      return {
        errors: [
          ...context.errors,
          {
            stage: 'Validate',
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
      time: 500, // 0.5 seconds
      tokens: 50,
      chunks: 0,
      files: 0
    };
  }

  private async validateCreateResults(context: PipelineContext, results: any): Promise<void> {
    results.checksPerformed.push('create-validation');

    // Check if files were created
    const editResults = context.data?.editResults;
    if (!editResults || !editResults.filesCreated || editResults.filesCreated.length === 0) {
      results.issues.push('No files were created');
      results.validationPassed = false;
    } else {
      // Validate each created file
      for (const file of editResults.filesCreated) {
        await this.validateCreatedFile(file, results);
      }
    }

    // Check for basic code quality
    if (editResults?.filesCreated) {
      for (const file of editResults.filesCreated) {
        if (file.content && file.path.endsWith('.ts')) {
          this.validateTypeScriptCode(file.content, results);
        } else if (file.content && file.path.endsWith('.js')) {
          this.validateJavaScriptCode(file.content, results);
        } else if (file.content && file.path.endsWith('.html')) {
          this.validateHTMLCode(file.content, results);
        } else if (file.content && file.path.endsWith('.css')) {
          this.validateCSSCode(file.content, results);
        }
      }
    }
  }

  private async validateFixResults(context: PipelineContext, results: any): Promise<void> {
    results.checksPerformed.push('fix-validation');

    // Check if fixes were applied
    const editResults = context.data?.editResults;
    if (!editResults || !editResults.filesModified || editResults.filesModified.length === 0) {
      results.issues.push('No fixes were applied');
      results.validationPassed = false;
    } else {
      // Validate that fixes address the original problem
      const originalRequest = context.data?.request;
      if (typeof originalRequest === 'object' && originalRequest.description) {
        this.validateFixRelevance(originalRequest.description, editResults, results);
      }
    }
  }

  private async validateAnalyzeResults(context: PipelineContext, results: any): Promise<void> {
    results.checksPerformed.push('analyze-validation');

    // Check if analysis was performed
    const analysisResults = context.data?.codeAnalysis;
    if (!analysisResults) {
      results.issues.push('No analysis was performed');
      results.validationPassed = false;
    } else {
      // Validate analysis completeness
      this.validateAnalysisCompleteness(analysisResults, results);
    }
  }

  private async validateLearnResults(context: PipelineContext, results: any): Promise<void> {
    results.checksPerformed.push('learn-validation');

    // Check if learning occurred
    const learnResults = context.data?.learnResults;
    if (!learnResults) {
      results.warnings.push('No learning data was captured');
    } else {
      // Validate learning data quality
      this.validateLearningData(learnResults, results);
    }
  }

  private async validateCreatedFile(file: any, results: any): Promise<void> {
    // Basic file validation
    if (!file.path || !file.content) {
      results.issues.push(`Invalid file: ${file.path || 'unknown'}`);
      results.validationPassed = false;
      return;
    }

    // Check file size
    if (file.content.length > 100000) { // 100KB limit
      results.warnings.push(`Large file created: ${file.path} (${file.content.length} characters)`);
    }

    // Check for empty files
    if (file.content.trim().length === 0) {
      results.issues.push(`Empty file created: ${file.path}`);
      results.validationPassed = false;
    }

    // Check for basic structure
    if (file.path.endsWith('.html') && !file.content.includes('<html')) {
      results.warnings.push(`HTML file may be missing proper structure: ${file.path}`);
    }

    if (file.path.endsWith('.ts') && !file.content.includes('import') && !file.content.includes('export')) {
      results.warnings.push(`TypeScript file may be missing imports/exports: ${file.path}`);
    }
  }

  private validateTypeScriptCode(content: string, results: any): void {
    // Basic TypeScript validation
    if (content.includes('any')) {
      results.warnings.push('TypeScript code contains "any" types');
    }

    if (!content.includes('interface') && !content.includes('type') && content.length > 100) {
      results.warnings.push('TypeScript code may benefit from type definitions');
    }

    // Check for common issues
    if (content.includes('console.log')) {
      results.warnings.push('Code contains console.log statements');
    }
  }

  private validateJavaScriptCode(content: string, results: any): void {
    // Basic JavaScript validation
    if (content.includes('var ')) {
      results.warnings.push('JavaScript code uses var instead of let/const');
    }

    if (content.includes('==') && !content.includes('===')) {
      results.warnings.push('JavaScript code uses loose equality (==) instead of strict equality (===)');
    }

    // Check for common issues
    if (content.includes('console.log')) {
      results.warnings.push('Code contains console.log statements');
    }
  }

  private validateHTMLCode(content: string, results: any): void {
    // Basic HTML validation
    if (!content.includes('<!DOCTYPE html>')) {
      results.warnings.push('HTML file missing DOCTYPE declaration');
    }

    if (!content.includes('<meta charset="utf-8">') && !content.includes('<meta charset="UTF-8">')) {
      results.warnings.push('HTML file missing charset declaration');
    }

    // Check for accessibility
    if (content.includes('<img') && !content.includes('alt=')) {
      results.warnings.push('Images missing alt attributes');
    }
  }

  private validateCSSCode(content: string, results: any): void {
    // Basic CSS validation
    if (content.includes('!important')) {
      results.warnings.push('CSS uses !important which may indicate specificity issues');
    }

    // Check for modern CSS practices
    if (content.includes('float:') && !content.includes('display: flex') && !content.includes('display: grid')) {
      results.warnings.push('CSS uses float instead of modern layout methods');
    }
  }

  private validateFixRelevance(originalDescription: string, editResults: any, results: any): void {
    // Simple relevance check - in a real implementation, this would be more sophisticated
    const description = originalDescription.toLowerCase();
    
    if (description.includes('error') && editResults.filesModified) {
      results.checksPerformed.push('error-fix-relevance');
    }

    if (description.includes('bug') && editResults.filesModified) {
      results.checksPerformed.push('bug-fix-relevance');
    }

    if (description.includes('performance') && editResults.filesModified) {
      results.checksPerformed.push('performance-fix-relevance');
    }
  }

  private validateAnalysisCompleteness(analysisResults: any, results: any): void {
    // Check if analysis covers key areas
    const checks = ['dependencies', 'exports', 'imports', 'language', 'framework'];
    
    for (const check of checks) {
      if (analysisResults[check] !== undefined) {
        results.checksPerformed.push(`analysis-${check}`);
      }
    }

    // Check analysis depth
    if (analysisResults.dependencies && analysisResults.dependencies.length === 0) {
      results.warnings.push('Analysis found no dependencies - this may be incomplete');
    }

    if (analysisResults.language === 'unknown') {
      results.warnings.push('Analysis could not determine programming language');
    }
  }

  private validateLearningData(learnResults: any, results: any): void {
    // Check if learning captured meaningful data
    if (learnResults.lessonsCaptured === 0 && learnResults.patternsDiscovered === 0) {
      results.warnings.push('No lessons or patterns were captured from this interaction');
    }

    if (learnResults.recommendations && learnResults.recommendations.length === 0) {
      results.warnings.push('No recommendations were generated');
    }

    // Validate lesson quality if captured
    if (learnResults.lessonId) {
      results.checksPerformed.push('lesson-quality');
    }
  }
}
