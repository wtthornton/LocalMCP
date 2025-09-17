/**
 * Quality Gates Rule - Enforces code quality standards and best practices
 * 
 * This rule helps vibe coders maintain high code quality by automatically
 * checking for tests, linting, performance issues, and other quality metrics.
 */

import type { PolicyViolation, SecurityContext, QualityGatePolicy, PerformanceThreshold } from '../policy-gate.service';
import { ActionType } from '../policy-gate.service';

export interface QualityGatesRuleConfig extends QualityGatePolicy {
  testPatterns: string[];
  lintingRules: LintingRule[];
  performanceChecks: PerformanceCheck[];
  codeQualityMetrics: CodeQualityMetric[];
}

export interface LintingRule {
  name: string;
  severity: 'error' | 'warning' | 'info';
  pattern: string;
  message: string;
  fixable: boolean;
}

export interface PerformanceCheck {
  name: string;
  threshold: PerformanceThreshold;
  checkFunction: (resource: any) => Promise<PerformanceResult>;
}

export interface CodeQualityMetric {
  name: string;
  type: 'cyclomatic_complexity' | 'maintainability_index' | 'code_duplication' | 'test_coverage';
  threshold: number;
  unit: string;
}

export interface PerformanceResult {
  passed: boolean;
  value: number;
  threshold: number;
  unit: string;
  message: string;
}

export class QualityGatesRule {
  private config: QualityGatesRuleConfig;

  constructor(config: QualityGatesRuleConfig) {
    this.config = config;
  }

  /**
   * Check if an action violates quality gates
   */
  async checkQualityGates(action: ActionType, context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Only check file-related actions
    if (!this.isQualityCheckRequired(action)) {
      return violations;
    }

    // Check test requirements
    if (this.config.requireTests) {
      const testViolations = await this.checkTestRequirements(context);
      violations.push(...testViolations);
    }

    // Check linting requirements
    if (this.config.requireLinting) {
      const lintViolations = await this.checkLintingRequirements(context);
      violations.push(...lintViolations);
    }

    // Check type checking
    if (this.config.requireTypeChecking) {
      const typeViolations = await this.checkTypeCheckingRequirements(context);
      violations.push(...typeViolations);
    }

    // Check performance thresholds
    if (this.config.performanceThresholds.length > 0) {
      const performanceViolations = await this.checkPerformanceThresholds(context);
      violations.push(...performanceViolations);
    }

    // Check code quality metrics
    if (this.config.codeQualityMetrics.length > 0) {
      const qualityViolations = await this.checkCodeQualityMetrics(context);
      violations.push(...qualityViolations);
    }

    return violations;
  }

  /**
   * Get recommendations for quality gate violations
   */
  getRecommendations(violations: PolicyViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.ruleId === 'QUALITY_TESTS_REQUIRED')) {
      recommendations.push('🧪 Add comprehensive tests for your code changes');
      recommendations.push('🧪 Use test-driven development (TDD) approach');
      recommendations.push('🧪 Ensure test coverage meets project requirements');
      recommendations.push('🧪 Write both unit and integration tests');
    }

    if (violations.some(v => v.ruleId === 'QUALITY_LINTING_FAILED')) {
      recommendations.push('🔍 Fix linting errors and warnings');
      recommendations.push('🔍 Use automated linting tools in your IDE');
      recommendations.push('🔍 Follow project coding standards and style guides');
      recommendations.push('🔍 Consider using Prettier for code formatting');
    }

    if (violations.some(v => v.ruleId === 'QUALITY_TYPE_CHECKING_FAILED')) {
      recommendations.push('📝 Fix TypeScript type errors');
      recommendations.push('📝 Add proper type annotations');
      recommendations.push('📝 Use strict TypeScript configuration');
      recommendations.push('📝 Consider using type guards for runtime safety');
    }

    if (violations.some(v => v.ruleId === 'QUALITY_PERFORMANCE_THRESHOLD')) {
      recommendations.push('⚡ Optimize code for better performance');
      recommendations.push('⚡ Consider using performance profiling tools');
      recommendations.push('⚡ Review algorithms and data structures');
      recommendations.push('⚡ Use caching where appropriate');
    }

    if (violations.some(v => v.ruleId === 'QUALITY_METRICS_FAILED')) {
      recommendations.push('📊 Improve code quality metrics');
      recommendations.push('📊 Reduce cyclomatic complexity');
      recommendations.push('📊 Improve maintainability index');
      recommendations.push('📊 Eliminate code duplication');
    }

    return recommendations;
  }

  /**
   * Check test requirements
   */
  private async checkTestRequirements(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Check if file has corresponding tests
    const hasTests = await this.hasCorrespondingTests(context.resource);
    const testCoverage = await this.getTestCoverage(context.resource);

    if (!hasTests) {
      violations.push({
        ruleId: 'QUALITY_TESTS_REQUIRED',
        ruleName: 'Test Coverage Required',
        severity: 'medium',
        message: 'Tests are required for this file modification. Help ensure code reliability!',
        context: {
          resource: context.resource.path,
          hasTests: false,
          testCoverage: testCoverage,
          requiredCoverage: this.config.minTestCoverage,
          recommendation: 'Add comprehensive tests for your changes'
        },
        timestamp: new Date()
      });
    }

    // Check test coverage
    if (testCoverage < this.config.minTestCoverage) {
      violations.push({
        ruleId: 'QUALITY_TEST_COVERAGE_LOW',
        ruleName: 'Test Coverage Too Low',
        severity: 'medium',
        message: `Test coverage (${testCoverage}%) is below required threshold (${this.config.minTestCoverage}%)`,
        context: {
          resource: context.resource.path,
          testCoverage: testCoverage,
          requiredCoverage: this.config.minTestCoverage,
          recommendation: 'Add more tests to improve coverage'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Check linting requirements
   */
  private async checkLintingRequirements(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Simulate linting check
    const lintResults = await this.runLintingCheck(context.resource);
    
    if (lintResults.errors.length > 0) {
      violations.push({
        ruleId: 'QUALITY_LINTING_FAILED',
        ruleName: 'Linting Errors',
        severity: 'high',
        message: `Found ${lintResults.errors.length} linting errors that must be fixed`,
        context: {
          resource: context.resource.path,
          errors: lintResults.errors,
          warnings: lintResults.warnings,
          recommendation: 'Fix all linting errors before proceeding'
        },
        timestamp: new Date()
      });
    }

    if (lintResults.warnings.length > 0) {
      violations.push({
        ruleId: 'QUALITY_LINTING_WARNINGS',
        ruleName: 'Linting Warnings',
        severity: 'low',
        message: `Found ${lintResults.warnings.length} linting warnings`,
        context: {
          resource: context.resource.path,
          warnings: lintResults.warnings,
          recommendation: 'Review and fix linting warnings'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Check type checking requirements
   */
  private async checkTypeCheckingRequirements(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Simulate TypeScript type checking
    const typeCheckResults = await this.runTypeCheck(context.resource);
    
    if (typeCheckResults.errors.length > 0) {
      violations.push({
        ruleId: 'QUALITY_TYPE_CHECKING_FAILED',
        ruleName: 'TypeScript Type Errors',
        severity: 'high',
        message: `Found ${typeCheckResults.errors.length} TypeScript type errors`,
        context: {
          resource: context.resource.path,
          typeErrors: typeCheckResults.errors,
          recommendation: 'Fix all TypeScript type errors'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Check performance thresholds
   */
  private async checkPerformanceThresholds(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    for (const threshold of this.config.performanceThresholds) {
      const performanceResult = await this.checkPerformanceThreshold(context.resource, threshold);
      
      if (!performanceResult.passed) {
        violations.push({
          ruleId: 'QUALITY_PERFORMANCE_THRESHOLD',
          ruleName: 'Performance Threshold Exceeded',
          severity: 'medium',
          message: `Performance threshold exceeded: ${performanceResult.message}`,
          context: {
            resource: context.resource.path,
            metric: threshold.metric,
            value: performanceResult.value,
            threshold: performanceResult.threshold,
            unit: performanceResult.unit,
            recommendation: 'Optimize code to meet performance requirements'
          },
          timestamp: new Date()
        });
      }
    }

    return violations;
  }

  /**
   * Check code quality metrics
   */
  private async checkCodeQualityMetrics(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    for (const metric of this.config.codeQualityMetrics) {
      const metricResult = await this.checkCodeQualityMetric(context.resource, metric);
      
      if (!metricResult.passed) {
        violations.push({
          ruleId: 'QUALITY_METRICS_FAILED',
          ruleName: 'Code Quality Metric Failed',
          severity: 'medium',
          message: `Code quality metric '${metric.name}' failed: ${metricResult.message}`,
          context: {
            resource: context.resource.path,
            metric: metric.name,
            value: metricResult.value,
            threshold: metric.threshold,
            unit: metric.unit,
            recommendation: `Improve ${metric.name} to meet quality standards`
          },
          timestamp: new Date()
        });
      }
    }

    return violations;
  }

  // Helper methods for quality checks

  private isQualityCheckRequired(action: ActionType): boolean {
    return [
      ActionType.CREATE_FILE,
      ActionType.EDIT_FILE,
      ActionType.EXECUTE_CODE
    ].includes(action);
  }

  private async hasCorrespondingTests(resource: any): Promise<boolean> {
    // Simulate test file detection
    const testPatterns = this.config.testPatterns || [
      '.test.', '.spec.', '.test/', '.spec/', 'test/', '__tests__/'
    ];
    
    return testPatterns.some(pattern => 
      resource.path.includes(pattern)
    );
  }

  private async getTestCoverage(resource: any): Promise<number> {
    // Simulate test coverage calculation
    return Math.random() * 100; // Placeholder
  }

  private async runLintingCheck(resource: any): Promise<LintResults> {
    // Simulate linting check
    return {
      errors: [], // Placeholder - would run actual linter
      warnings: [],
      info: []
    };
  }

  private async runTypeCheck(resource: any): Promise<TypeCheckResults> {
    // Simulate TypeScript type checking
    return {
      errors: [], // Placeholder - would run actual TypeScript compiler
      warnings: []
    };
  }

  private async checkPerformanceThreshold(
    resource: any, 
    threshold: PerformanceThreshold
  ): Promise<PerformanceResult> {
    // Simulate performance check
    const mockValue = Math.random() * (threshold.threshold * 2);
    
    return {
      passed: mockValue <= threshold.threshold,
      value: mockValue,
      threshold: threshold.threshold,
      unit: threshold.unit,
      message: mockValue <= threshold.threshold ? 
        'Performance threshold met' : 
        `Performance threshold exceeded (${mockValue.toFixed(2)} ${threshold.unit})`
    };
  }

  private async checkCodeQualityMetric(
    resource: any, 
    metric: CodeQualityMetric
  ): Promise<QualityMetricResult> {
    // Simulate code quality metric check
    const mockValue = Math.random() * (metric.threshold * 2);
    
    return {
      passed: mockValue <= metric.threshold,
      value: mockValue,
      threshold: metric.threshold,
      unit: metric.unit,
      message: mockValue <= metric.threshold ? 
        'Quality metric met' : 
        `Quality metric failed (${mockValue.toFixed(2)} ${metric.unit})`
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QualityGatesRuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): QualityGatesRuleConfig {
    return { ...this.config };
  }
}

export interface LintResults {
  errors: LintError[];
  warnings: LintWarning[];
  info: LintInfo[];
}

export interface LintError {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'error';
}

export interface LintWarning {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'warning';
}

export interface LintInfo {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'info';
}

export interface TypeCheckResults {
  errors: TypeError[];
  warnings: TypeWarning[];
}

export interface TypeError {
  message: string;
  line: number;
  column: number;
  severity: 'error';
}

export interface TypeWarning {
  message: string;
  line: number;
  column: number;
  severity: 'warning';
}

export interface QualityMetricResult {
  passed: boolean;
  value: number;
  threshold: number;
  unit: string;
  message: string;
}

export default QualityGatesRule;
