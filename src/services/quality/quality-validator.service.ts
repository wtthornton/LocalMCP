/**
 * Quality Validator Service
 * 
 * Validates generated code against quality standards and provides
 * comprehensive quality scoring and recommendations.
 * 
 * Benefits for vibe coders:
 * - Automatic quality validation
 * - Detailed quality scoring and feedback
 * - Security vulnerability detection
 * - Performance and accessibility validation
 * - Actionable improvement recommendations
 */

import { Logger } from '../logger/logger.js';
import type {
  QualityValidationResult,
  QualityIssue,
  QualityCategory,
  EnforcementLevel
} from '../../types/quality-keywords.types.js';

export class QualityValidatorService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Validate code quality and return comprehensive results
   */
  validateCodeQuality(
    code: string, 
    framework: string = 'generic',
    options: ValidationOptions = {}
  ): QualityValidationResult {
    this.logger.debug('Validating code quality', {
      codeLength: code.length,
      framework,
      options
    });

    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];

    // Perform validation checks
    this.validateSecurity(code, issues, recommendations);
    this.validateCodeQualityAspects(code, issues, recommendations);
    this.validatePerformance(code, issues, recommendations);
    this.validateTesting(code, issues, recommendations);
    this.validateAccessibility(code, issues, recommendations, framework);

    // Calculate scores
    const categoryScores = this.calculateCategoryScores(issues);
    const overallScore = this.calculateOverallScore(categoryScores);

    // Determine if validation passed
    const passed = this.determineValidationPassed(overallScore, issues, options);

    const result: QualityValidationResult = {
      overallScore,
      categoryScores,
      passed,
      issues,
      recommendations
    };

    this.logger.info('Code quality validation completed', {
      overallScore,
      passed,
      issuesCount: issues.length,
      recommendationsCount: recommendations.length
    });

    return result;
  }

  /**
   * Validate security aspects
   */
  private validateSecurity(code: string, issues: QualityIssue[], recommendations: string[]): void {
    // Check for common security vulnerabilities
    const securityChecks = [
      {
        pattern: /innerHTML\s*=/g,
        issue: 'innerHTML usage detected - potential XSS vulnerability',
        severity: 'high' as EnforcementLevel,
        fix: 'Use textContent or proper sanitization'
      },
      {
        pattern: /eval\s*\(/g,
        issue: 'eval() usage detected - security risk',
        severity: 'critical' as EnforcementLevel,
        fix: 'Avoid eval() - use safer alternatives'
      },
      {
        pattern: /document\.write\s*\(/g,
        issue: 'document.write() usage detected - security risk',
        severity: 'high' as EnforcementLevel,
        fix: 'Use DOM manipulation methods instead'
      },
      {
        pattern: /<script[^>]*>/gi,
        issue: 'Inline script detected - security risk',
        severity: 'high' as EnforcementLevel,
        fix: 'Use external script files with proper CSP'
      },
      {
        pattern: /onclick\s*=/gi,
        issue: 'Inline event handlers detected - security risk',
        severity: 'medium' as EnforcementLevel,
        fix: 'Use addEventListener() instead'
      }
    ];

    securityChecks.forEach(check => {
      if (check.pattern.test(code)) {
        issues.push({
          type: 'error',
          category: 'security',
          description: check.issue,
          severity: check.severity,
          fix: check.fix
        });
      }
    });

    // Check for security best practices
    if (!code.includes('Content-Security-Policy') && code.includes('<meta')) {
      issues.push({
        type: 'warning',
        category: 'security',
        description: 'Missing Content Security Policy headers',
        severity: 'high',
        fix: 'Add CSP meta tag for security'
      });
    }

    if (!code.includes('X-Frame-Options') && code.includes('<head>')) {
      issues.push({
        type: 'warning',
        category: 'security',
        description: 'Missing X-Frame-Options header',
        severity: 'medium',
        fix: 'Add X-Frame-Options meta tag'
      });
    }
  }

  /**
   * Validate code quality aspects
   */
  private validateCodeQualityAspects(code: string, issues: QualityIssue[], recommendations: string[]): void {
    // Check for code quality issues
    const qualityChecks = [
      {
        pattern: /console\.log\s*\(/g,
        issue: 'console.log() detected - should be removed in production',
        severity: 'low' as EnforcementLevel,
        fix: 'Remove console.log() statements'
      },
      {
        pattern: /\/\/\s*TODO/g,
        issue: 'TODO comments detected - incomplete implementation',
        severity: 'low' as EnforcementLevel,
        fix: 'Complete TODO items or remove comments'
      },
      {
        pattern: /\/\/\s*FIXME/g,
        issue: 'FIXME comments detected - code needs fixing',
        severity: 'medium' as EnforcementLevel,
        fix: 'Address FIXME items'
      },
      {
        pattern: /var\s+\w+/g,
        issue: 'var declarations detected - use let/const instead',
        severity: 'medium' as EnforcementLevel,
        fix: 'Use let or const instead of var'
      },
      {
        pattern: /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}/g,
        issue: 'Function length check needed',
        severity: 'low' as EnforcementLevel,
        fix: 'Consider breaking down long functions'
      }
    ];

    qualityChecks.forEach(check => {
      if (check.pattern.test(code)) {
        issues.push({
          type: 'warning',
          category: 'quality',
          description: check.issue,
          severity: check.severity,
          fix: check.fix
        });
      }
    });

    // Check for documentation
    if (!code.includes('/**') && !code.includes('/*') && code.length > 200) {
      issues.push({
        type: 'suggestion',
        category: 'quality',
        description: 'Missing code documentation',
        severity: 'medium',
        fix: 'Add comprehensive code documentation'
      });
    }
  }

  /**
   * Validate performance aspects
   */
  private validatePerformance(code: string, issues: QualityIssue[], recommendations: string[]): void {
    // Check for performance issues
    const performanceChecks = [
      {
        pattern: /for\s*\(\s*var\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\w+\.length\s*;\s*\w+\+\+\s*\)/g,
        issue: 'Inefficient loop with length property access',
        severity: 'medium' as EnforcementLevel,
        fix: 'Cache length property or use for...of loop'
      },
      {
        pattern: /document\.getElementById\s*\(/g,
        issue: 'Multiple getElementById calls detected',
        severity: 'low' as EnforcementLevel,
        fix: 'Cache DOM element references'
      },
      {
        pattern: /setTimeout\s*\(\s*function/g,
        issue: 'setTimeout with function - consider arrow functions',
        severity: 'low' as EnforcementLevel,
        fix: 'Use arrow functions for better performance'
      }
    ];

    performanceChecks.forEach(check => {
      if (check.pattern.test(code)) {
        issues.push({
          type: 'suggestion',
          category: 'performance',
          description: check.issue,
          severity: check.severity,
          fix: check.fix
        });
      }
    });

    // Check for performance best practices
    if (code.includes('<img') && !code.includes('loading="lazy"')) {
      issues.push({
        type: 'suggestion',
        category: 'performance',
        description: 'Images missing lazy loading',
        severity: 'medium',
        fix: 'Add loading="lazy" to images'
      });
    }
  }

  /**
   * Validate testing aspects
   */
  private validateTesting(code: string, issues: QualityIssue[], recommendations: string[]): void {
    // Check for testing-related issues
    if (code.includes('function') && !code.includes('test') && !code.includes('spec')) {
      issues.push({
        type: 'suggestion',
        category: 'testing',
        description: 'No test files detected',
        severity: 'medium',
        fix: 'Add comprehensive test coverage'
      });
    }

    if (code.includes('async') && !code.includes('await')) {
      issues.push({
        type: 'warning',
        category: 'testing',
        description: 'Async function without proper await handling',
        severity: 'medium',
        fix: 'Add proper async/await error handling'
      });
    }
  }

  /**
   * Validate accessibility aspects
   */
  private validateAccessibility(
    code: string, 
    issues: QualityIssue[], 
    recommendations: string[],
    framework: string
  ): void {
    // Only validate accessibility for web frameworks
    if (!['html', 'react', 'vue', 'angular', 'nextjs'].includes(framework.toLowerCase())) {
      return;
    }

    // Check for accessibility issues
    const accessibilityChecks = [
      {
        pattern: /<img[^>]*(?!alt=)[^>]*>/gi,
        issue: 'Images missing alt attributes',
        severity: 'high' as EnforcementLevel,
        fix: 'Add descriptive alt attributes to all images'
      },
      {
        pattern: /<input[^>]*(?!type=)[^>]*>/gi,
        issue: 'Input elements missing type attributes',
        severity: 'high' as EnforcementLevel,
        fix: 'Add type attributes to input elements'
      },
      {
        pattern: /<button[^>]*(?!aria-label)[^>]*>/gi,
        issue: 'Buttons missing accessible labels',
        severity: 'medium' as EnforcementLevel,
        fix: 'Add aria-label or visible text to buttons'
      },
      {
        pattern: /<div[^>]*onclick[^>]*>/gi,
        issue: 'Clickable divs detected - use semantic elements',
        severity: 'medium' as EnforcementLevel,
        fix: 'Use button or anchor elements instead of divs'
      }
    ];

    accessibilityChecks.forEach(check => {
      if (check.pattern.test(code)) {
        issues.push({
          type: 'error',
          category: 'accessibility',
          description: check.issue,
          severity: check.severity,
          fix: check.fix
        });
      }
    });

    // Check for semantic HTML
    if (code.includes('<div') && !code.includes('<main') && !code.includes('<section')) {
      issues.push({
        type: 'suggestion',
        category: 'accessibility',
        description: 'Missing semantic HTML elements',
        severity: 'medium',
        fix: 'Use semantic HTML5 elements (main, section, article, etc.)'
      });
    }
  }

  /**
   * Calculate category scores based on issues
   */
  private calculateCategoryScores(issues: QualityIssue[]): {
    security: number;
    quality: number;
    performance: number;
    testing: number;
    accessibility: number;
  } {
    const categoryScores = {
      security: 10,
      quality: 10,
      performance: 10,
      testing: 10,
      accessibility: 10
    };

    const severityWeights = {
      critical: 3,
      high: 2,
      medium: 1,
      low: 0.5
    };

    issues.forEach(issue => {
      const weight = severityWeights[issue.severity] || 0;
      const category = issue.category as keyof typeof categoryScores;
      
      if (categoryScores[category] !== undefined) {
        categoryScores[category] = Math.max(0, categoryScores[category] - weight);
      }
    });

    return categoryScores;
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(categoryScores: {
    security: number;
    quality: number;
    performance: number;
    testing: number;
    accessibility: number;
  }): number {
    const scores = Object.values(categoryScores);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Round to 1 decimal place
    return Math.round(averageScore * 10) / 10;
  }

  /**
   * Determine if validation passed
   */
  private determineValidationPassed(
    overallScore: number, 
    issues: QualityIssue[], 
    options: ValidationOptions
  ): boolean {
    const minScore = options.minScore || 7.0;
    const maxCriticalIssues = options.maxCriticalIssues || 0;
    const maxHighIssues = options.maxHighIssues || 2;

    // Check score threshold
    if (overallScore < minScore) {
      return false;
    }

    // Check critical issues
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > maxCriticalIssues) {
      return false;
    }

    // Check high severity issues
    const highIssues = issues.filter(issue => issue.severity === 'high');
    if (highIssues.length > maxHighIssues) {
      return false;
    }

    return true;
  }

  /**
   * Get quality improvement recommendations
   */
  getQualityRecommendations(validationResult: QualityValidationResult): string[] {
    const recommendations: string[] = [];

    // Add category-specific recommendations
    if (validationResult.categoryScores.security < 8) {
      recommendations.push('Focus on security improvements - implement input validation and sanitization');
    }

    if (validationResult.categoryScores.quality < 8) {
      recommendations.push('Improve code quality - add documentation and follow best practices');
    }

    if (validationResult.categoryScores.performance < 8) {
      recommendations.push('Optimize performance - consider caching and efficient algorithms');
    }

    if (validationResult.categoryScores.testing < 8) {
      recommendations.push('Add comprehensive testing - implement unit and integration tests');
    }

    if (validationResult.categoryScores.accessibility < 8) {
      recommendations.push('Enhance accessibility - implement WCAG guidelines and semantic HTML');
    }

    return recommendations;
  }
}

export interface ValidationOptions {
  minScore?: number;
  maxCriticalIssues?: number;
  maxHighIssues?: number;
  framework?: string;
}
