import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { PipelineStage, PipelineContext, PipelineError, PipelineBudget } from '../pipeline-engine.js';

/**
 * Document Stage - Generates documentation from pipeline execution
 * 
 * This stage generates comprehensive documentation about the pipeline
 * execution, including decisions made, files created, and lessons learned.
 */
export class DocumentStage implements PipelineStage {
  readonly name = 'Document';

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Executing Document stage', { 
      toolName: context.toolName,
      requestId: context.requestId 
    });

    try {
      const results: any = {
        documentationGenerated: false,
        filesCreated: [],
        summaryGenerated: false,
        lessonsDocumented: false,
        executionReport: null
      };

      // Generate execution report
      const executionReport = await this.generateExecutionReport(context);
      results.executionReport = executionReport;

      // Generate documentation based on tool type
      switch (context.toolName) {
        case 'localmcp.create':
          await this.documentCreateOperation(context, results);
          break;
        case 'localmcp.fix':
          await this.documentFixOperation(context, results);
          break;
        case 'localmcp.analyze':
          await this.documentAnalyzeOperation(context, results);
          break;
        case 'localmcp.learn':
          await this.documentLearnOperation(context, results);
          break;
        default:
          this.logger.warn('Unknown tool for documentation', { toolName: context.toolName });
      }

      // Generate summary documentation
      await this.generateSummaryDocumentation(context, results);

      // Update context with documentation results
      context.metadata = {
        ...context.metadata,
        documentation: {
          stage: 'Document',
          timestamp: new Date().toISOString(),
          documentationGenerated: results.documentationGenerated,
          filesCreated: results.filesCreated.length,
          summaryGenerated: results.summaryGenerated,
          lessonsDocumented: results.lessonsDocumented
        }
      };

      this.logger.info('Document stage completed', {
        toolName: context.toolName,
        documentationGenerated: results.documentationGenerated,
        filesCreated: results.filesCreated.length,
        summaryGenerated: results.summaryGenerated
      });

      return {
        data: {
          ...context.data,
          documentationResults: results
        },
        metadata: {
          ...context.metadata,
          documentation: {
            stage: 'Document',
            timestamp: Date.now(),
            documentationGenerated: results.documentationGenerated,
            filesCreated: results.filesCreated.length,
            summaryGenerated: results.summaryGenerated,
            lessonsDocumented: results.lessonsDocumented
          }
        }
      };

    } catch (error) {
      this.logger.error('Document stage failed:', error);
      return {
        errors: [
          ...context.errors,
          {
            stage: 'Document',
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
      tokens: 200,
      chunks: 0,
      files: 5
    };
  }

  private async generateExecutionReport(context: PipelineContext): Promise<any> {
    return {
      toolName: context.toolName,
      requestId: context.requestId,
      timestamp: new Date().toISOString(),
      executionTime: context.executionTime,
      success: context.success,
      error: context.error,
      warnings: context.warnings,
      stagesExecuted: context.stagesExecuted,
      stageResults: context.stageResults,
      metadata: context.metadata,
      summary: this.generateExecutionSummary(context)
    };
  }

  private generateExecutionSummary(context: PipelineContext): string {
    const parts: string[] = [];

    parts.push(`Pipeline execution for ${context.toolName}`);
    parts.push(`Request ID: ${context.requestId}`);
    parts.push(`Status: ${context.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (context.executionTime) {
      parts.push(`Execution time: ${context.executionTime}ms`);
    }

    parts.push(`Stages executed: ${context.stagesExecuted.join(', ')}`);

    if (context.error) {
      parts.push(`Error: ${context.error.message}`);
    }

    if (context.warnings && context.warnings.length > 0) {
      parts.push(`Warnings: ${context.warnings.join(', ')}`);
    }

    return parts.join('\n');
  }

  private async documentCreateOperation(context: PipelineContext, results: any): Promise<void> {
    const editResults = context.stageResults?.['Edit']?.data;
    if (!editResults?.filesCreated) return;

    const documentation = this.generateCreateDocumentation(context, editResults);
    
    try {
      const docPath = await this.saveDocumentation('create-operation.md', documentation);
      results.filesCreated.push(docPath);
      results.documentationGenerated = true;
    } catch (error) {
      this.logger.error('Failed to save create operation documentation:', error);
    }
  }

  private async documentFixOperation(context: PipelineContext, results: any): Promise<void> {
    const editResults = context.stageResults?.['Edit']?.data;
    if (!editResults?.filesModified) return;

    const documentation = this.generateFixDocumentation(context, editResults);
    
    try {
      const docPath = await this.saveDocumentation('fix-operation.md', documentation);
      results.filesCreated.push(docPath);
      results.documentationGenerated = true;
    } catch (error) {
      this.logger.error('Failed to save fix operation documentation:', error);
    }
  }

  private async documentAnalyzeOperation(context: PipelineContext, results: any): Promise<void> {
    const analysisResults = context.stageResults?.['Read.Snippet']?.data;
    if (!analysisResults) return;

    const documentation = this.generateAnalyzeDocumentation(context, analysisResults);
    
    try {
      const docPath = await this.saveDocumentation('analysis-report.md', documentation);
      results.filesCreated.push(docPath);
      results.documentationGenerated = true;
    } catch (error) {
      this.logger.error('Failed to save analysis documentation:', error);
    }
  }

  private async documentLearnOperation(context: PipelineContext, results: any): Promise<void> {
    const learnResults = context.stageResults?.['Learn']?.data;
    if (!learnResults) return;

    const documentation = this.generateLearnDocumentation(context, learnResults);
    
    try {
      const docPath = await this.saveDocumentation('learning-report.md', documentation);
      results.filesCreated.push(docPath);
      results.documentationGenerated = true;
      results.lessonsDocumented = true;
    } catch (error) {
      this.logger.error('Failed to save learning documentation:', error);
    }
  }

  private generateCreateDocumentation(context: PipelineContext, editResults: any): string {
    const doc: string[] = [];

    doc.push('# Create Operation Documentation');
    doc.push('');
    doc.push(`**Tool:** ${context.toolName}`);
    doc.push(`**Request ID:** ${context.requestId}`);
    doc.push(`**Timestamp:** ${new Date().toISOString()}`);
    doc.push(`**Status:** ${context.success ? 'SUCCESS' : 'FAILED'}`);
    doc.push('');

    if (context.request && typeof context.request === 'object') {
      doc.push('## Request Details');
      doc.push('');
      doc.push('```json');
      doc.push(JSON.stringify(context.request, null, 2));
      doc.push('```');
      doc.push('');
    }

    doc.push('## Files Created');
    doc.push('');

    if (editResults.filesCreated && editResults.filesCreated.length > 0) {
      for (const file of editResults.filesCreated) {
        doc.push(`### ${file.path}`);
        doc.push('');
        doc.push(`**Size:** ${file.content?.length || 0} characters`);
        doc.push('');
        
        if (file.content) {
          doc.push('```');
          doc.push(file.content.substring(0, 500) + (file.content.length > 500 ? '...' : ''));
          doc.push('```');
          doc.push('');
        }
      }
    } else {
      doc.push('No files were created.');
      doc.push('');
    }

    if (context.error) {
      doc.push('## Error Information');
      doc.push('');
      doc.push(`**Error:** ${context.error.message}`);
      doc.push(`**Stage:** ${context.error.stage}`);
      doc.push('');
    }

    if (context.warnings && context.warnings.length > 0) {
      doc.push('## Warnings');
      doc.push('');
      for (const warning of context.warnings) {
        doc.push(`- ${warning}`);
      }
      doc.push('');
    }

    doc.push('## Execution Summary');
    doc.push('');
    doc.push(`**Execution Time:** ${context.executionTime || 'N/A'}ms`);
    doc.push(`**Stages Executed:** ${context.stagesExecuted.join(', ')}`);
    doc.push('');

    return doc.join('\n');
  }

  private generateFixDocumentation(context: PipelineContext, editResults: any): string {
    const doc: string[] = [];

    doc.push('# Fix Operation Documentation');
    doc.push('');
    doc.push(`**Tool:** ${context.toolName}`);
    doc.push(`**Request ID:** ${context.requestId}`);
    doc.push(`**Timestamp:** ${new Date().toISOString()}`);
    doc.push(`**Status:** ${context.success ? 'SUCCESS' : 'FAILED'}`);
    doc.push('');

    if (context.request && typeof context.request === 'object') {
      doc.push('## Request Details');
      doc.push('');
      doc.push('```json');
      doc.push(JSON.stringify(context.request, null, 2));
      doc.push('```');
      doc.push('');
    }

    doc.push('## Files Modified');
    doc.push('');

    if (editResults.filesModified && editResults.filesModified.length > 0) {
      for (const file of editResults.filesModified) {
        doc.push(`### ${file.path}`);
        doc.push('');
        doc.push(`**Changes:** ${file.changes?.length || 0} modifications`);
        doc.push('');
        
        if (file.changes) {
          for (const change of file.changes) {
            doc.push(`- **Line ${change.line}:** ${change.type} - ${change.description}`);
          }
          doc.push('');
        }
      }
    } else {
      doc.push('No files were modified.');
      doc.push('');
    }

    return doc.join('\n');
  }

  private generateAnalyzeDocumentation(context: PipelineContext, analysisResults: any): string {
    const doc: string[] = [];

    doc.push('# Code Analysis Report');
    doc.push('');
    doc.push(`**Tool:** ${context.toolName}`);
    doc.push(`**Request ID:** ${context.requestId}`);
    doc.push(`**Timestamp:** ${new Date().toISOString()}`);
    doc.push(`**Status:** ${context.success ? 'SUCCESS' : 'FAILED'}`);
    doc.push('');

    doc.push('## Analysis Results');
    doc.push('');

    if (analysisResults.language) {
      doc.push(`**Language:** ${analysisResults.language}`);
    }

    if (analysisResults.framework) {
      doc.push(`**Framework:** ${analysisResults.framework}`);
    }

    if (analysisResults.dependencies && analysisResults.dependencies.length > 0) {
      doc.push(`**Dependencies:** ${analysisResults.dependencies.join(', ')}`);
    }

    if (analysisResults.exports && analysisResults.exports.length > 0) {
      doc.push(`**Exports:** ${analysisResults.exports.join(', ')}`);
    }

    if (analysisResults.imports && analysisResults.imports.length > 0) {
      doc.push(`**Imports:** ${analysisResults.imports.join(', ')}`);
    }

    doc.push('');
    doc.push('## Detailed Analysis');
    doc.push('');
    doc.push('```json');
    doc.push(JSON.stringify(analysisResults, null, 2));
    doc.push('```');

    return doc.join('\n');
  }

  private generateLearnDocumentation(context: PipelineContext, learnResults: any): string {
    const doc: string[] = [];

    doc.push('# Learning Report');
    doc.push('');
    doc.push(`**Tool:** ${context.toolName}`);
    doc.push(`**Request ID:** ${context.requestId}`);
    doc.push(`**Timestamp:** ${new Date().toISOString()}`);
    doc.push(`**Status:** ${context.success ? 'SUCCESS' : 'FAILED'}`);
    doc.push('');

    doc.push('## Learning Summary');
    doc.push('');
    doc.push(`**Lessons Captured:** ${learnResults.lessonsCaptured || 0}`);
    doc.push(`**Patterns Discovered:** ${learnResults.patternsDiscovered || 0}`);
    doc.push(`**Insights Generated:** ${learnResults.insightsGenerated || 0}`);
    doc.push('');

    if (learnResults.lessonId) {
      doc.push(`**Lesson ID:** ${learnResults.lessonId}`);
      doc.push('');
    }

    if (learnResults.recommendations && learnResults.recommendations.length > 0) {
      doc.push('## Recommendations');
      doc.push('');
      for (const recommendation of learnResults.recommendations) {
        doc.push(`- ${recommendation}`);
      }
      doc.push('');
    }

    doc.push('## Learning Context');
    doc.push('');
    if (context.request && typeof context.request === 'object') {
      doc.push('```json');
      doc.push(JSON.stringify(context.request, null, 2));
      doc.push('```');
    }

    return doc.join('\n');
  }

  private async generateSummaryDocumentation(context: PipelineContext, results: any): Promise<void> {
    const summary = this.generateExecutionSummary(context);
    
    try {
      const summaryPath = await this.saveDocumentation('execution-summary.md', summary);
      results.filesCreated.push(summaryPath);
      results.summaryGenerated = true;
    } catch (error) {
      this.logger.error('Failed to save summary documentation:', error);
    }
  }

  private async saveDocumentation(filename: string, content: string): Promise<string> {
    const docsDir = join(process.cwd(), 'docs', 'pipeline-executions');
    
    try {
      await mkdir(docsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filePath = join(docsDir, filename);
    await writeFile(filePath, content, 'utf-8');
    
    this.logger.info('Documentation saved', { filePath });
    return filePath;
  }
}
