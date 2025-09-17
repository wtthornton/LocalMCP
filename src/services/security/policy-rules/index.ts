/**
 * Policy Rules Index - Centralized exports for all policy rules
 * 
 * This module provides a clean interface for importing and using all policy rules
 * in the PolicyGate service.
 */

export { default as EditCapsRule } from './edit-caps.rule';
export { default as CitationRule } from './citation.rule';
export { default as QualityGatesRule } from './quality-gates.rule';
export { default as SecurityChecksRule } from './security-checks.rule';

export type {
  EditCapRuleConfig,
  SessionStats
} from './edit-caps.rule';

export type {
  CitationRuleConfig,
  CitationTemplate,
  CitationAnalysis,
  DetectedSource,
  GeneratedCitation
} from './citation.rule';

export type {
  QualityGatesRuleConfig,
  LintingRule,
  PerformanceCheck,
  CodeQualityMetric,
  PerformanceResult,
  LintResults,
  LintError,
  LintWarning,
  LintInfo,
  TypeCheckResults,
  TypeError,
  TypeWarning,
  QualityMetricResult
} from './quality-gates.rule';

export type {
  SecurityChecksRuleConfig,
  SecretPattern,
  VulnerabilityScanner,
  SecurityRule,
  DependencyChecker,
  SecurityCheckResult,
  SecurityFinding
} from './security-checks.rule';
