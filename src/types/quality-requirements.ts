/**
 * Quality Requirements Types for PromptMCP Enhancement
 * 
 * This module defines TypeScript interfaces for the quality requirements detection
 * system that automatically identifies and formats quality requirements for different
 * types of prompts and frameworks.
 * 
 * @fileoverview Type definitions for quality requirements detection and formatting
 */

/**
 * Categories of quality requirements that can be detected and applied
 */
export type QualityCategory = 
  | 'accessibility' 
  | 'security' 
  | 'performance' 
  | 'maintainability';

/**
 * Priority levels for quality requirements
 */
export type QualityPriority = 
  | 'critical' 
  | 'high' 
  | 'medium' 
  | 'low';

/**
 * Represents a single quality requirement with its associated rules and metadata
 * 
 * @interface QualityRequirement
 * @example
 * ```typescript
 * const accessibilityRequirement: QualityRequirement = {
 *   category: 'accessibility',
 *   priority: 'critical',
 *   rules: [
 *     'Use semantic HTML elements (<main>, <button>, <section>) not generic <div>',
 *     'Add visible focus states with :focus-visible for all interactive elements'
 *   ],
 *   tokenBudget: 500
 * };
 * ```
 */
export interface QualityRequirement {
  /** The category of quality requirement (accessibility, security, etc.) */
  category: QualityCategory;
  
  /** The priority level of this requirement */
  priority: QualityPriority;
  
  /** Array of specific, actionable rules for this requirement */
  rules: string[];
  
  /** Token budget allocated for this requirement in prompt formatting */
  tokenBudget: number;
}

/**
 * Result of quality requirements detection process
 * 
 * @interface QualityDetectionResult
 * @example
 * ```typescript
 * const detectionResult: QualityDetectionResult = {
 *   requirements: [
 *     {
 *       category: 'accessibility',
 *       priority: 'critical',
 *       rules: ['Use semantic HTML', 'Add focus states'],
 *       tokenBudget: 500
 *     }
 *   ],
 *   detectedTechnologies: ['html', 'css', 'javascript'],
 *   confidence: 0.85
 * };
 * ```
 */
export interface QualityDetectionResult {
  /** Array of detected quality requirements */
  requirements: QualityRequirement[];
  
  /** Array of technologies/frameworks detected in the prompt */
  detectedTechnologies: string[];
  
  /** Confidence score (0-1) for the detection accuracy */
  confidence: number;
}

/**
 * Configuration options for quality requirements detection
 * 
 * @interface QualityDetectionOptions
 */
export interface QualityDetectionOptions {
  /** Whether to include framework-specific requirements */
  includeFrameworkSpecific?: boolean;
  
  /** Maximum number of requirements to detect */
  maxRequirements?: number;
  
  /** Minimum confidence threshold for including requirements */
  minConfidence?: number;
  
  /** Custom token budget allocation */
  customTokenBudget?: Record<QualityCategory, number>;
}

/**
 * Formatting options for quality requirements display
 * 
 * @interface QualityFormattingOptions
 */
export interface QualityFormattingOptions {
  /** Whether to include priority indicators in formatting */
  includePriority?: boolean;
  
  /** Whether to include category headers */
  includeCategoryHeaders?: boolean;
  
  /** Maximum tokens to use for formatting */
  maxTokens?: number;
  
  /** Custom formatting template */
  customTemplate?: string;
}

/**
 * Error types for quality requirements detection
 */
export interface QualityDetectionError {
  /** Error message */
  message: string;
  
  /** Error code for programmatic handling */
  code: 'DETECTION_FAILED' | 'VALIDATION_ERROR' | 'FORMATTING_ERROR';
  
  /** Additional error context */
  context?: Record<string, unknown>;
}

/**
 * Utility type for quality requirement validation
 */
export type QualityRequirementValidator = (requirement: QualityRequirement) => boolean;

/**
 * Default token budget allocation by category
 */
export const DEFAULT_TOKEN_BUDGET: Record<QualityCategory, number> = {
  accessibility: 600,
  security: 500,
  performance: 400,
  maintainability: 300
} as const;

/**
 * Default confidence thresholds by priority
 */
export const DEFAULT_CONFIDENCE_THRESHOLDS: Record<QualityPriority, number> = {
  critical: 0.8,
  high: 0.7,
  medium: 0.6,
  low: 0.5
} as const;

/**
 * Example quality requirements for different frameworks
 */
export const EXAMPLE_QUALITY_REQUIREMENTS: Record<string, QualityRequirement[]> = {
  html: [
    {
      category: 'accessibility',
      priority: 'critical',
      rules: [
        'Use semantic HTML elements (<main>, <button>, <section>) not generic <div>',
        'Add visible focus states with :focus-visible for all interactive elements',
        'Include role="status" aria-live="polite" for dynamic content updates',
        'Wrap animations in @media (prefers-reduced-motion: reduce) guards'
      ],
      tokenBudget: 600
    },
    {
      category: 'security',
      priority: 'critical',
      rules: [
        'Move inline <style> and <script> to external files',
        'Generate Content Security Policy headers',
        'Sanitize any dynamic content to prevent XSS'
      ],
      tokenBudget: 500
    }
  ],
  react: [
    {
      category: 'accessibility',
      priority: 'critical',
      rules: [
        'Use semantic HTML elements and proper ARIA roles',
        'Implement keyboard navigation support',
        'Add focus management for dynamic content',
        'Include screen reader announcements'
      ],
      tokenBudget: 600
    },
    {
      category: 'security',
      priority: 'critical',
      rules: [
        'Sanitize all props and user inputs',
        'Implement proper error boundaries',
        'Validate TypeScript interfaces strictly',
        'Use secure state management patterns'
      ],
      tokenBudget: 500
    }
  ]
} as const;
