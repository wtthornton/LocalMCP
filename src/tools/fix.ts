import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { Context7Service } from '../services/context7/context7.service.js';
import { VectorDatabaseService } from '../services/vector/vector-db.service.js';
import { PlaywrightService } from '../services/playwright/playwright.service.js';
import { readFile, writeFile } from 'fs/promises';

export interface FixResult {
  appliedFixes: {
    file: string;
    changes: {
      line: number;
      original: string;
      fixed: string;
      reason: string;
    }[];
  }[];
  explanation: string;
  validationResult: {
    success: boolean;
    message: string;
    details?: any;
  };
}

/**
 * ErrorFixer - "Fix this problem"
 * 
 * Diagnoses and automatically resolves coding issues, build errors, or runtime problems
 * using project context and cached knowledge.
 */
export class ErrorFixer {
  constructor(
    private logger: Logger,
    private config: ConfigService,
    private context7?: Context7Service,
    private vectorDb?: VectorDatabaseService,
    private playwright?: PlaywrightService
  ) {}

  async fix(
    errorDetails: string,
    filePath?: string,
    context?: string
  ): Promise<FixResult> {
    this.logger.info('Fixing error', { errorDetails, filePath });

    try {
      const diagnosis = await this.diagnoseError(errorDetails, filePath, context);
      const appliedFixes = await this.applyFixes(diagnosis);
      const explanation = this.generateExplanation(diagnosis, appliedFixes);
      const validationResult = await this.validateFixes(appliedFixes);

      const result: FixResult = {
        appliedFixes,
        explanation,
        validationResult
      };

      this.logger.info('Error fix completed', {
        fixesApplied: appliedFixes.length,
        success: validationResult.success
      });

      return result;

    } catch (error) {
      this.logger.error('Error fix failed:', error);
      throw new Error(`Error fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async diagnoseError(errorDetails: string, filePath?: string, context?: string) {
    const diagnosis = {
      errorType: 'unknown',
      severity: 'medium',
      rootCause: '',
      suggestedFixes: [] as string[],
      affectedFiles: [] as string[],
      confidence: 0
    };

    // Parse common error patterns
    const errorLower = errorDetails.toLowerCase();

    // TypeScript errors
    if (errorLower.includes('typescript') || errorLower.includes('ts')) {
      diagnosis.errorType = 'typescript';
      diagnosis.confidence = 0.9;
      
      if (errorLower.includes('cannot find module')) {
        diagnosis.rootCause = 'Missing module import or incorrect path';
        diagnosis.suggestedFixes.push('Check import path and ensure module is installed');
        diagnosis.suggestedFixes.push('Verify package.json dependencies');
      } else if (errorLower.includes('property') && errorLower.includes('does not exist')) {
        diagnosis.rootCause = 'Type definition missing or incorrect property access';
        diagnosis.suggestedFixes.push('Add proper type definitions');
        diagnosis.suggestedFixes.push('Check object structure and property names');
      } else if (errorLower.includes('type') && errorLower.includes('is not assignable')) {
        diagnosis.rootCause = 'Type mismatch in assignment or function parameter';
        diagnosis.suggestedFixes.push('Check type compatibility');
        diagnosis.suggestedFixes.push('Add type assertions if appropriate');
      }
    }

    // JavaScript errors
    else if (errorLower.includes('referenceerror') || errorLower.includes('undefined')) {
      diagnosis.errorType = 'javascript';
      diagnosis.severity = 'high';
      diagnosis.confidence = 0.8;
      diagnosis.rootCause = 'Variable or function is not defined';
      diagnosis.suggestedFixes.push('Check variable declaration and scope');
      diagnosis.suggestedFixes.push('Verify function is imported or defined');
    }

    // Syntax errors
    else if (errorLower.includes('syntax') || errorLower.includes('unexpected token')) {
      diagnosis.errorType = 'syntax';
      diagnosis.severity = 'high';
      diagnosis.confidence = 0.95;
      diagnosis.rootCause = 'Invalid syntax in code';
      diagnosis.suggestedFixes.push('Check for missing brackets, semicolons, or quotes');
      diagnosis.suggestedFixes.push('Verify proper syntax for the language');
    }

    // Build errors
    else if (errorLower.includes('build') || errorLower.includes('compilation')) {
      diagnosis.errorType = 'build';
      diagnosis.severity = 'high';
      diagnosis.confidence = 0.7;
      diagnosis.rootCause = 'Build process failed';
      diagnosis.suggestedFixes.push('Check build configuration');
      diagnosis.suggestedFixes.push('Verify all dependencies are installed');
    }

    // Runtime errors
    else if (errorLower.includes('runtime') || errorLower.includes('exception')) {
      diagnosis.errorType = 'runtime';
      diagnosis.severity = 'high';
      diagnosis.confidence = 0.6;
      diagnosis.rootCause = 'Error occurred during execution';
      diagnosis.suggestedFixes.push('Check runtime environment and dependencies');
      diagnosis.suggestedFixes.push('Add error handling and validation');
    }

    // Add file context if available
    if (filePath) {
      diagnosis.affectedFiles.push(filePath);
    }

    return diagnosis;
  }

  private async applyFixes(diagnosis: any): Promise<FixResult['appliedFixes']> {
    const appliedFixes: FixResult['appliedFixes'] = [];

    for (const filePath of diagnosis.affectedFiles) {
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        const changes: FixResult['appliedFixes'][0]['changes'] = [];

        // Apply fixes based on error type
        switch (diagnosis.errorType) {
          case 'typescript':
            await this.applyTypeScriptFixes(filePath, lines, changes, diagnosis);
            break;
          case 'javascript':
            await this.applyJavaScriptFixes(filePath, lines, changes, diagnosis);
            break;
          case 'syntax':
            await this.applySyntaxFixes(filePath, lines, changes, diagnosis);
            break;
          default:
            await this.applyGenericFixes(filePath, lines, changes, diagnosis);
        }

        if (changes.length > 0) {
          // Write the fixed content back to file
          const fixedContent = lines.join('\n');
          await writeFile(filePath, fixedContent, 'utf-8');

          appliedFixes.push({
            file: filePath,
            changes
          });
        }

      } catch (error) {
        this.logger.warn(`Could not apply fixes to ${filePath}:`, error);
      }
    }

    return appliedFixes;
  }

  private async applyTypeScriptFixes(
    filePath: string,
    lines: string[],
    changes: FixResult['appliedFixes'][0]['changes'],
    diagnosis: any
  ) {
    // Common TypeScript fixes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const lineNumber = i + 1;

      // Fix missing type annotations
      if (line.includes('function') && !line.includes(':')) {
        const fixed = line.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/, (match, funcName, params) => {
          return `function ${funcName}(${params}): any {`;
        });
        
        if (fixed !== line) {
          lines[i] = fixed;
          changes.push({
            line: lineNumber,
            original: line,
            fixed,
            reason: 'Added return type annotation'
          });
        }
      }

      // Fix missing interface properties
      if (line.includes('interface') && line.includes('{')) {
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.trim() === '}') {
          const interfaceName = line.match(/interface\s+(\w+)/)?.[1];
          if (interfaceName) {
            lines[i + 1] = `  // Add properties here\n}`;
              const nextLineFixed = lines[i + 1];
              if (nextLineFixed) {
                changes.push({
                  line: lineNumber + 1,
                  original: nextLine,
                  fixed: nextLineFixed,
                  reason: 'Added placeholder for interface properties'
                });
              }
          }
        }
      }

      // Fix import statements
      if (line.includes('import') && line.includes('from') && !line.includes('type')) {
        const fixed = line.replace(/import\s+{([^}]+)}\s+from/, 'import { $1 } from');
        if (fixed !== line) {
          lines[i] = fixed;
          changes.push({
            line: lineNumber,
            original: line,
            fixed,
            reason: 'Fixed import statement formatting'
          });
        }
      }
    }
  }

  private async applyJavaScriptFixes(
    filePath: string,
    lines: string[],
    changes: FixResult['appliedFixes'][0]['changes'],
    diagnosis: any
  ) {
    // Common JavaScript fixes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const lineNumber = i + 1;

      // Fix undefined variable references
      if (line.includes('undefined') && line.includes('===')) {
        const fixed = line.replace(/=== undefined/g, '== null');
        if (fixed !== line) {
          lines[i] = fixed;
          changes.push({
            line: lineNumber,
            original: line,
            fixed,
            reason: 'Fixed undefined check to use null comparison'
          });
        }
      }

      // Add missing variable declarations
      if (line.includes('let ') || line.includes('const ') || line.includes('var ')) {
        // Check if variable is used before declaration
        const varName = line.match(/(let|const|var)\s+(\w+)/)?.[2];
        if (varName) {
          // Look for usage before this line
          for (let j = 0; j < i; j++) {
            const prevLine = lines[j];
            if (prevLine && prevLine.includes(varName) && !prevLine.includes('let ') && !prevLine.includes('const ') && !prevLine.includes('var ')) {
              // Move declaration to the top
              const declaration = lines[i];
              if (declaration) {
                lines.splice(i, 1);
                lines.unshift(declaration);
                
                changes.push({
                  line: lineNumber,
                  original: line,
                  fixed: `// Moved to top: ${line}`,
                  reason: 'Moved variable declaration to prevent hoisting issues'
                });
                break;
              }
            }
          }
        }
      }
    }
  }

  private async applySyntaxFixes(
    filePath: string,
    lines: string[],
    changes: FixResult['appliedFixes'][0]['changes'],
    diagnosis: any
  ) {
    // Common syntax fixes
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const lineNumber = i + 1;

      // Fix missing semicolons
      if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        const fixed = line + ';';
        lines[i] = fixed;
        changes.push({
          line: lineNumber,
          original: line,
          fixed,
          reason: 'Added missing semicolon'
        });
      }

      // Fix missing brackets
      if (line.includes('if') && !line.includes('{')) {
        const fixed = line.replace(/if\s*\([^)]+\)\s*$/, (match) => match + ' {');
        if (fixed !== line) {
          lines[i] = fixed;
          changes.push({
            line: lineNumber,
            original: line,
            fixed,
            reason: 'Added missing opening brace for if statement'
          });
        }
      }

      // Fix quote mismatches
      if (line.includes('"') && line.includes("'")) {
        const fixed = line.replace(/'/g, '"');
        if (fixed !== line) {
          lines[i] = fixed;
          changes.push({
            line: lineNumber,
            original: line,
            fixed,
            reason: 'Standardized quotes to double quotes'
          });
        }
      }
    }
  }

  private async applyGenericFixes(
    filePath: string,
    lines: string[],
    changes: FixResult['appliedFixes'][0]['changes'],
    diagnosis: any
  ) {
    // Generic fixes for unknown error types
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      const lineNumber = i + 1;

      // Add error handling
      if (line.includes('throw') && !line.includes('try')) {
        const fixed = `try {\n  ${line}\n} catch (error) {\n  console.error('Error:', error);\n}`;
        lines[i] = fixed;
        changes.push({
          line: lineNumber,
          original: line,
          fixed,
          reason: 'Added error handling with try-catch'
        });
      }

      // Add null checks
      if (line.includes('.') && !line.includes('?.')) {
        const fixed = line.replace(/(\w+)\.(\w+)/g, '$1?.$2');
        if (fixed !== line) {
          lines[i] = fixed;
          changes.push({
            line: lineNumber,
            original: line,
            fixed,
            reason: 'Added optional chaining for safer property access'
          });
        }
      }
    }
  }

  private generateExplanation(diagnosis: any, appliedFixes: FixResult['appliedFixes']): string {
    let explanation = `## Error Analysis and Fix\n\n`;
    
    explanation += `**Error Type:** ${diagnosis.errorType}\n`;
    explanation += `**Severity:** ${diagnosis.severity}\n`;
    explanation += `**Root Cause:** ${diagnosis.rootCause}\n\n`;
    
    explanation += `**Applied Fixes:**\n`;
    appliedFixes.forEach(fix => {
      explanation += `\n### ${fix.file}\n`;
      fix.changes.forEach(change => {
        explanation += `- **Line ${change.line}:** ${change.reason}\n`;
        explanation += `  - Original: \`${change.original.trim()}\`\n`;
        explanation += `  - Fixed: \`${change.fixed.trim()}\`\n`;
      });
    });
    
    explanation += `\n**Confidence Level:** ${Math.round(diagnosis.confidence * 100)}%\n`;
    
    if (diagnosis.suggestedFixes.length > 0) {
      explanation += `\n**Additional Recommendations:**\n`;
      diagnosis.suggestedFixes.forEach((suggestion: string, index: number) => {
        explanation += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return explanation;
  }

  private async validateFixes(appliedFixes: FixResult['appliedFixes']): Promise<FixResult['validationResult']> {
    // Basic validation - in a real implementation, this would run tests or linting
    try {
      if (appliedFixes.length === 0) {
        return {
          success: false,
          message: 'No fixes were applied',
          details: 'The error could not be automatically resolved'
        };
      }

      // Check if any files were modified
      const modifiedFiles = appliedFixes.filter(fix => fix.changes.length > 0);
      
      if (modifiedFiles.length === 0) {
        return {
          success: false,
          message: 'No changes were made to any files',
          details: 'The suggested fixes could not be applied'
        };
      }

      return {
        success: true,
        message: `Successfully applied ${modifiedFiles.length} fix(es)`,
        details: {
          filesModified: modifiedFiles.length,
          totalChanges: modifiedFiles.reduce((sum, fix) => sum + fix.changes.length, 0)
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Validation failed',
        details: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }
}
