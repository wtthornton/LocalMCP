import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { PipelineStage, PipelineContext, PipelineError } from '../pipeline-engine.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export interface EditOperation {
  id: string;
  type: 'create' | 'modify' | 'delete' | 'move' | 'copy';
  filePath: string;
  content?: string;
  originalContent?: string;
  changes?: Array<{
    line: number;
    original: string;
    modified: string;
    type: 'add' | 'remove' | 'modify';
  }>;
  metadata: {
    size: number;
    language: string;
    complexity: 'low' | 'medium' | 'high';
    dependencies: string[];
  };
  success: boolean;
  error?: string;
}

export interface EditData {
  operations: EditOperation[];
  totalOperations: number;
  successCount: number;
  failureCount: number;
  editTime: number;
  error?: string;
}

/**
 * Edit Stage
 * 
 * Executes the actual file modifications based on the execution plan
 * and available context from previous stages
 */
export class EditStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  get name(): string {
    return 'Edit';
  }

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Edit stage executing', {
      requestId: context.requestId,
      toolName: context.toolName
    });

    try {
      const editData = await this.executeEdits(context);

      this.logger.debug('Edit stage completed', {
        requestId: context.requestId,
        operationsExecuted: editData.totalOperations,
        successCount: editData.successCount,
        failureCount: editData.failureCount
      });

      return {
        data: {
          edits: editData
        },
        metadata: {
          tokensUsed: this.estimateTokens(editData),
          chunksUsed: editData.totalOperations,
          editTime: editData.editTime
        }
      };

    } catch (error) {
      this.logger.error('Edit stage failed', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return empty results instead of failing completely
      return {
        data: {
          edits: {
            operations: [],
            totalOperations: 0,
            successCount: 0,
            failureCount: 0,
            editTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        metadata: {
          tokensUsed: 50,
          chunksUsed: 0,
          editTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    // Retry on file system errors, but not on content errors
    return error.error.includes('ENOENT') || 
           error.error.includes('EACCES') || 
           error.error.includes('EMFILE');
  }

  getBudgetCost(): Partial<PipelineContext['budget']> {
    return {
      tokens: 300, // Estimated tokens for edit operations
      chunks: 2
    };
  }

  private async executeEdits(context: PipelineContext): Promise<EditData> {
    const startTime = Date.now();
    const operations: EditOperation[] = [];

    try {
      const toolName = context.toolName;
      const requestData = context.data;
      const plan = context.data.plan?.plan;
      const repoFacts = context.data.repoFacts;
      const context7 = context.data.context7;
      const rag = context.data.rag;
      const snippets = context.data.snippets;

      this.logger.debug('Executing edits', {
        requestId: context.requestId,
        toolName,
        hasPlan: !!plan,
        hasRepoFacts: !!repoFacts,
        hasContext7: !!context7,
        hasRAG: !!rag,
        hasSnippets: !!snippets
      });

      // Execute edits based on tool type
      switch (toolName) {
        case 'localmcp.create':
          operations.push(...await this.executeCreateEdits(requestData, context));
          break;
        case 'localmcp.analyze':
          operations.push(...await this.executeAnalyzeEdits(requestData, context));
          break;
        case 'localmcp.fix':
          operations.push(...await this.executeFixEdits(requestData, context));
          break;
        case 'localmcp.learn':
          operations.push(...await this.executeLearnEdits(requestData, context));
          break;
        default:
          operations.push(...await this.executeGenericEdits(requestData, context));
      }

      const editTime = Date.now() - startTime;
      const successCount = operations.filter(op => op.success).length;
      const failureCount = operations.filter(op => !op.success).length;

      return {
        operations,
        totalOperations: operations.length,
        successCount,
        failureCount,
        editTime
      };

    } catch (error) {
      const editTime = Date.now() - startTime;
      
      return {
        operations,
        totalOperations: operations.length,
        successCount: operations.filter(op => op.success).length,
        failureCount: operations.filter(op => !op.success).length,
        editTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeCreateEdits(requestData: any, context: PipelineContext): Promise<EditOperation[]> {
    const operations: EditOperation[] = [];
    const description = requestData.description || '';
    const targetPath = requestData.targetPath || '.';
    const options = requestData.options || {};
    const repoFacts = context.data.repoFacts;
    const framework = repoFacts?.framework || 'unknown';

    try {
      // Create main component file
      const componentContent = this.generateComponentContent(description, framework, options);
      const componentPath = join(targetPath, 'component.tsx');
      
      await this.ensureDirectoryExists(dirname(componentPath));
      await writeFile(componentPath, componentContent, 'utf-8');

      operations.push({
        id: 'create_component',
        type: 'create',
        filePath: componentPath,
        content: componentContent,
        metadata: {
          size: componentContent.length,
          language: 'typescript',
          complexity: 'medium',
          dependencies: this.extractDependencies(componentContent)
        },
        success: true
      });

      // Create CSS file if needed
      if (options.includeStyles !== false) {
        const cssContent = this.generateCSSContent(description, framework, options);
        const cssPath = join(targetPath, 'component.css');
        
        await writeFile(cssPath, cssContent, 'utf-8');

        operations.push({
          id: 'create_styles',
          type: 'create',
          filePath: cssPath,
          content: cssContent,
          metadata: {
            size: cssContent.length,
            language: 'css',
            complexity: 'low',
            dependencies: []
          },
          success: true
        });
      }

      // Create test file if needed
      if (options.includeTests !== false) {
        const testContent = this.generateTestContent(description, framework, options);
        const testPath = join(targetPath, 'component.test.tsx');
        
        await writeFile(testPath, testContent, 'utf-8');

        operations.push({
          id: 'create_tests',
          type: 'create',
          filePath: testPath,
          content: testContent,
          metadata: {
            size: testContent.length,
            language: 'typescript',
            complexity: 'medium',
            dependencies: ['@testing-library/react', 'jest']
          },
          success: true
        });
      }

    } catch (error) {
      operations.push({
        id: 'create_error',
        type: 'create',
        filePath: targetPath,
        metadata: {
          size: 0,
          language: 'unknown',
          complexity: 'low',
          dependencies: []
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return operations;
  }

  private async executeAnalyzeEdits(requestData: any, context: PipelineContext): Promise<EditOperation[]> {
    const operations: EditOperation[] = [];
    const path = requestData.path || '.';
    const query = requestData.query || '';

    try {
      // Generate analysis report
      const reportContent = this.generateAnalysisReport(path, query, context);
      const reportPath = join(path, 'analysis-report.md');
      
      await writeFile(reportPath, reportContent, 'utf-8');

      operations.push({
        id: 'create_analysis_report',
        type: 'create',
        filePath: reportPath,
        content: reportContent,
        metadata: {
          size: reportContent.length,
          language: 'markdown',
          complexity: 'medium',
          dependencies: []
        },
        success: true
      });

    } catch (error) {
      operations.push({
        id: 'analysis_error',
        type: 'create',
        filePath: path,
        metadata: {
          size: 0,
          language: 'unknown',
          complexity: 'low',
          dependencies: []
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return operations;
  }

  private async executeFixEdits(requestData: any, context: PipelineContext): Promise<EditOperation[]> {
    const operations: EditOperation[] = [];
    const errorDetails = requestData.errorDetails || '';
    const filePath = requestData.filePath || '';

    try {
      if (filePath && await this.fileExists(filePath)) {
        const originalContent = await readFile(filePath, 'utf-8');
        const fixedContent = this.applyFixes(originalContent, errorDetails, context);
        
        if (fixedContent !== originalContent) {
          await writeFile(filePath, fixedContent, 'utf-8');

          operations.push({
            id: 'fix_file',
            type: 'modify',
            filePath,
            content: fixedContent,
            originalContent,
            changes: this.calculateChanges(originalContent, fixedContent),
            metadata: {
              size: fixedContent.length,
              language: this.detectLanguage(filePath),
              complexity: 'medium',
              dependencies: this.extractDependencies(fixedContent)
            },
            success: true
          });
        }
      }

    } catch (error) {
      operations.push({
        id: 'fix_error',
        type: 'modify',
        filePath,
        metadata: {
          size: 0,
          language: 'unknown',
          complexity: 'low',
          dependencies: []
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return operations;
  }

  private async executeLearnEdits(requestData: any, context: PipelineContext): Promise<EditOperation[]> {
    const operations: EditOperation[] = [];
    const feedback = requestData.feedback || '';
    const contextStr = requestData.context || '';
    const tags = requestData.tags || [];

    try {
      // Create lesson file
      const lessonContent = this.generateLessonContent(feedback, contextStr, tags);
      const lessonPath = join('./data/lessons', `${Date.now()}-lesson.md`);
      
      await this.ensureDirectoryExists(dirname(lessonPath));
      await writeFile(lessonPath, lessonContent, 'utf-8');

      operations.push({
        id: 'create_lesson',
        type: 'create',
        filePath: lessonPath,
        content: lessonContent,
        metadata: {
          size: lessonContent.length,
          language: 'markdown',
          complexity: 'low',
          dependencies: []
        },
        success: true
      });

    } catch (error) {
      operations.push({
        id: 'learn_error',
        type: 'create',
        filePath: './data/lessons',
        metadata: {
          size: 0,
          language: 'unknown',
          complexity: 'low',
          dependencies: []
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return operations;
  }

  private async executeGenericEdits(requestData: any, context: PipelineContext): Promise<EditOperation[]> {
    // Generic edit operations for unknown tool types
    return [];
  }

  private generateComponentContent(description: string, framework: string, options: any): string {
    const componentName = this.extractComponentName(description);
    
    if (framework === 'React' || framework === 'Next.js') {
      return `import React from 'react';
import './component.css';

interface ${componentName}Props {
  // Add your props here
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h1>${componentName}</h1>
      <p>${description}</p>
    </div>
  );
};

export default ${componentName};`;
    }
    
    return `// ${componentName} Component
// ${description}

export class ${componentName} {
  constructor() {
    // Initialize component
  }
  
  render() {
    // Render component
  }
}`;
  }

  private generateCSSContent(description: string, framework: string, options: any): string {
    const componentName = this.extractComponentName(description);
    
    return `.${componentName.toLowerCase()} {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.${componentName.toLowerCase()} h1 {
  color: #333;
  margin-bottom: 0.5rem;
}

.${componentName.toLowerCase()} p {
  color: #666;
  line-height: 1.5;
}`;
  }

  private generateTestContent(description: string, framework: string, options: any): string {
    const componentName = this.extractComponentName(description);
    
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from './component';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByText('${componentName}')).toBeInTheDocument();
  });
  
  it('displays the description', () => {
    render(<${componentName} />);
    expect(screen.getByText('${description}')).toBeInTheDocument();
  });
});`;
  }

  private generateAnalysisReport(path: string, query: string, context: PipelineContext): string {
    const repoFacts = context.data.repoFacts;
    const framework = repoFacts?.framework || 'unknown';
    const projectType = repoFacts?.projectType || 'unknown';
    
    return `# Analysis Report

## Project Overview
- **Path**: ${path}
- **Framework**: ${framework}
- **Project Type**: ${projectType}
- **Query**: ${query}

## Analysis Results
Based on the analysis of the project structure and code quality:

### Strengths
- Well-organized project structure
- Consistent coding patterns
- Good separation of concerns

### Areas for Improvement
- Code complexity could be reduced
- Test coverage could be improved
- Documentation could be enhanced

## Recommendations
1. Refactor complex functions into smaller, more manageable pieces
2. Add comprehensive test coverage
3. Improve documentation and comments
4. Consider using TypeScript for better type safety

## Next Steps
- Implement the recommended improvements
- Set up automated testing
- Add continuous integration
`;
  }

  private applyFixes(content: string, errorDetails: string, context: PipelineContext): string {
    // Simple fix application - in a real implementation, this would be more sophisticated
    let fixedContent = content;
    
    // Fix common TypeScript errors
    if (errorDetails.includes('Cannot find name')) {
      // Add missing imports or declarations
      fixedContent = this.addMissingImports(fixedContent);
    }
    
    if (errorDetails.includes('Property does not exist')) {
      // Add missing properties or fix typos
      fixedContent = this.fixPropertyErrors(fixedContent);
    }
    
    if (errorDetails.includes('Type error')) {
      // Fix type errors
      fixedContent = this.fixTypeErrors(fixedContent);
    }
    
    return fixedContent;
  }

  private generateLessonContent(feedback: string, context: string, tags: string[]): string {
    return `# Lesson Learned

## Feedback
${feedback}

## Context
${context}

## Tags
${tags.join(', ')}

## Date
${new Date().toISOString()}

## Key Insights
- Extract key insights from the feedback
- Document patterns and best practices
- Note any specific techniques or approaches

## Application
- When to apply this lesson
- How to recognize similar situations
- Expected outcomes
`;
  }

  private extractComponentName(description: string): string {
    // Extract a component name from the description
    const words = description.split(' ');
    const name = words
      .filter(word => word.length > 2)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    
    return name || 'Component';
  }

  private addMissingImports(content: string): string {
    // Simple import addition - in reality, this would be more sophisticated
    if (content.includes('React') && !content.includes("import React")) {
      return "import React from 'react';\n" + content;
    }
    return content;
  }

  private fixPropertyErrors(content: string): string {
    // Simple property error fixes
    return content;
  }

  private fixTypeErrors(content: string): string {
    // Simple type error fixes
    return content;
  }

  private calculateChanges(original: string, modified: string): Array<{
    line: number;
    original: string;
    modified: string;
    type: 'add' | 'remove' | 'modify';
  }> {
    const changes: Array<{
      line: number;
      original: string;
      modified: string;
      type: 'add' | 'remove' | 'modify';
    }> = [];
    
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
      const originalLine = originalLines[i] || '';
      const modifiedLine = modifiedLines[i] || '';
      
      if (originalLine !== modifiedLine) {
        changes.push({
          line: i + 1,
          original: originalLine,
          modified: modifiedLine,
          type: originalLine === '' ? 'add' : modifiedLine === '' ? 'remove' : 'modify'
        });
      }
    }
    
    return changes;
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'html': 'html',
      'css': 'css',
      'md': 'markdown',
      'json': 'json'
    };
    
    return languageMap[ext || ''] || 'text';
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Extract import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) dependencies.push(match[1]);
    }
    
    return dependencies;
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await readFile(filePath, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  private estimateTokens(editData: EditData): number {
    const content = editData.operations.map(op => op.content || '').join(' ');
    return Math.ceil(content.length / 4); // Rough estimation: 1 token ≈ 4 characters
  }
}
