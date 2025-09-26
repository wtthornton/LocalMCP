/**
 * Quality Keywords Types
 * 
 * Defines types and interfaces for universal quality keywords system
 * that ensures high-quality code generation across all frameworks
 */

export type QualityCategory = 
  | 'security' 
  | 'quality' 
  | 'performance' 
  | 'testing' 
  | 'accessibility';

export type EnforcementLevel = 
  | 'critical'    // MANDATORY - Code will be rejected if not implemented
  | 'high'        // REQUIRED - Strongly recommended for production
  | 'medium'      // RECOMMENDED - Best practice for maintainability
  | 'low'         // SUGGESTED - Nice to have for future enhancement
  | 'mandatory'   // MANDATORY - Code will be rejected if not implemented
  | 'required';   // REQUIRED - Strongly recommended for production

export interface QualityKeyword {
  /** The keyword phrase to inject */
  keyword: string;
  /** Category this keyword belongs to */
  category: QualityCategory;
  /** Enforcement level for this keyword */
  enforcement: EnforcementLevel;
  /** Description of what this keyword enforces */
  description: string;
  /** Whether this keyword is framework-specific */
  frameworkSpecific?: boolean;
  /** Target frameworks for this keyword */
  targetFrameworks?: string[];
}

export interface QualityRequirement {
  /** Category of quality requirement */
  category: QualityCategory;
  /** Priority level */
  priority: EnforcementLevel;
  /** Specific rules to enforce */
  rules: string[];
  /** Token budget for this requirement */
  tokenBudget: number;
  /** Whether this is framework-specific */
  frameworkSpecific?: boolean;
  /** Target frameworks */
  targetFrameworks?: string[];
}

export interface UniversalQualityKeywords {
  security: QualityKeyword[];
  quality: QualityKeyword[];
  performance: QualityKeyword[];
  testing: QualityKeyword[];
  accessibility: QualityKeyword[];
}

export interface AgentTaskList {
  /** Agent capabilities */
  capabilities: string[];
  /** Quality standards to enforce */
  qualityStandards: QualityStandard[];
  /** Review checklist items */
  reviewChecklist: ReviewItem[];
  /** Continuous improvement tasks */
  continuousImprovement: ImprovementTask[];
  /** Project context tasks */
  projectContext: ProjectContextTask[];
}

export interface QualityStandard {
  /** Name of the standard */
  name: string;
  /** Priority level */
  priority: EnforcementLevel;
  /** Enforcement level */
  enforcement: EnforcementLevel;
  /** Description of the standard */
  description: string;
  /** Whether this is framework-specific */
  frameworkSpecific?: boolean;
  /** Target frameworks for this standard */
  targetFrameworks?: string[];
}

export interface ReviewItem {
  /** Name of the review item */
  name: string;
  /** Category of the review */
  category: QualityCategory;
  /** Whether this item is mandatory */
  mandatory: boolean;
  /** Description of what to check */
  description: string;
}

export interface ImprovementTask {
  /** Name of the improvement task */
  name: string;
  /** Category of improvement */
  category: QualityCategory;
  /** Priority level */
  priority: EnforcementLevel;
  /** Description of the task */
  description: string;
  /** Whether this is active */
  active: boolean;
}

export interface ProjectContextTask {
  /** Name of the context task */
  name: string;
  /** Type of context */
  type: 'architecture' | 'conventions' | 'dependencies' | 'patterns';
  /** Description of the task */
  description: string;
  /** Whether this is active */
  active: boolean;
}

export interface QualityValidationResult {
  /** Overall quality score (0-10) */
  overallScore: number;
  /** Category-specific scores */
  categoryScores: {
    security: number;
    quality: number;
    performance: number;
    testing: number;
    accessibility: number;
  };
  /** Validation passed */
  passed: boolean;
  /** Issues found */
  issues: QualityIssue[];
  /** Recommendations for improvement */
  recommendations: string[];
}

export interface QualityIssue {
  /** Type of issue */
  type: 'error' | 'warning' | 'suggestion';
  /** Category of the issue */
  category: QualityCategory;
  /** Description of the issue */
  description: string;
  /** Severity level */
  severity: EnforcementLevel;
  /** Suggested fix */
  fix?: string;
}

export interface KeywordInjectionOptions {
  /** Whether to include framework-specific keywords */
  includeFrameworkSpecific: boolean;
  /** Target framework for specific keywords */
  targetFramework?: string;
  /** Maximum tokens for keyword injection */
  maxTokens?: number;
  /** Enforcement level threshold */
  minEnforcementLevel?: EnforcementLevel;
  /** Whether to include examples */
  includeExamples: boolean;
}

export interface EnhancedPromptResult {
  /** The enhanced prompt */
  enhancedPrompt: string;
  /** Keywords injected */
  injectedKeywords: QualityKeyword[];
  /** Quality requirements applied */
  appliedRequirements: QualityRequirement[];
  /** Token count */
  tokenCount: number;
  /** Quality score estimate */
  estimatedQualityScore: number;
}
