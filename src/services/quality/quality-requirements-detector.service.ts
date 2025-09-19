/**
 * Quality Requirements Detector Service
 * 
 * This service analyzes prompts to automatically detect quality requirements
 * for accessibility, security, performance, and maintainability. It uses
 * keyword detection, framework analysis, and pattern matching to identify
 * relevant quality requirements for different types of code generation tasks.
 * 
 * @fileoverview Service for detecting quality requirements from prompts
 */

import { Logger } from '../logger/logger.js';
import type {
  QualityRequirement,
  QualityDetectionResult,
  QualityCategory,
  QualityPriority,
  QualityDetectionOptions
} from '../../types/quality-requirements.js';
import {
  DEFAULT_TOKEN_BUDGET,
  DEFAULT_CONFIDENCE_THRESHOLDS,
  EXAMPLE_QUALITY_REQUIREMENTS
} from '../../types/quality-requirements.js';

/**
 * Service for detecting quality requirements from prompts
 * 
 * @example
 * ```typescript
 * const detector = new QualityRequirementsDetector(logger);
 * const result = await detector.detectRequirements(
 *   "Create a React component with accessibility features",
 *   "react"
 * );
 * console.log(result.requirements); // Array of detected requirements
 * ```
 */
export class QualityRequirementsDetector {
  private logger: Logger;
  
  /**
   * Keywords that indicate accessibility requirements
   */
  private readonly accessibilityKeywords = [
    'accessibility', 'a11y', 'screen reader', 'keyboard', 'focus',
    'aria', 'semantic', 'wcag', 'contrast', 'alt text', 'tabindex',
    'skip link', 'navigation', 'heading', 'landmark'
  ];
  
  /**
   * Keywords that indicate security requirements
   */
  private readonly securityKeywords = [
    'security', 'secure', 'authentication', 'authorization', 'csrf',
    'xss', 'injection', 'sanitize', 'validate', 'csp', 'cors',
    'https', 'encryption', 'hash', 'salt', 'token', 'jwt'
  ];
  
  /**
   * Keywords that indicate performance requirements
   */
  private readonly performanceKeywords = [
    'performance', 'optimize', 'fast', 'speed', 'lazy', 'cache',
    'bundle', 'minify', 'compress', 'cdn', 'critical', 'vitals',
    'lighthouse', 'metrics', 'monitoring', 'profiling'
  ];
  
  /**
   * Framework-specific keyword patterns
   */
  private readonly frameworkPatterns = {
    html: ['html', 'web', 'page', 'website', 'frontend', 'dom'],
    react: ['react', 'jsx', 'component', 'hook', 'state', 'props'],
    vue: ['vue', 'component', 'template', 'directive'],
    angular: ['angular', 'component', 'service', 'directive'],
    node: ['node', 'server', 'api', 'express', 'backend'],
    python: ['python', 'django', 'flask', 'fastapi'],
    java: ['java', 'spring', 'maven', 'gradle']
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Detects quality requirements from a prompt and optional framework
   * 
   * @param prompt - The input prompt to analyze
   * @param framework - Optional framework to consider for specific requirements
   * @param options - Optional configuration for detection
   * @returns Promise<QualityDetectionResult> - Detected requirements and metadata
   * 
   * @example
   * ```typescript
   * const result = await detector.detectRequirements(
   *   "Create a secure login form with accessibility features",
   *   "react",
   *   { includeFrameworkSpecific: true, maxRequirements: 5 }
   * );
   * ```
   */
  async detectRequirements(
    prompt: string,
    framework?: string,
    options: QualityDetectionOptions = {}
  ): Promise<QualityDetectionResult> {
    try {
      this.logger.debug('Starting quality requirements detection', {
        prompt: prompt.substring(0, 100) + '...',
        framework,
        options
      });

      const requirements: QualityRequirement[] = [];
      const detectedTechnologies: string[] = [];
      let confidence = 0;

      // Detect technologies from prompt
      const technologies = this.detectTechnologies(prompt);
      detectedTechnologies.push(...technologies);

      // Detect accessibility requirements
      if (this.containsAccessibilityKeywords(prompt)) {
        const accessibilityReqs = this.getAccessibilityRules('critical');
        requirements.push(...accessibilityReqs);
        confidence += 0.3;
      }

      // Detect security requirements
      if (this.containsSecurityKeywords(prompt)) {
        const securityReqs = this.getSecurityRules('critical');
        requirements.push(...securityReqs);
        confidence += 0.3;
      }

      // Detect performance requirements
      if (this.containsPerformanceKeywords(prompt)) {
        const performanceReqs = this.getPerformanceRules('high');
        requirements.push(...performanceReqs);
        confidence += 0.2;
      }

      // Add framework-specific requirements
      if (framework && options.includeFrameworkSpecific !== false) {
        const frameworkReqs = this.getFrameworkSpecificRequirements(framework);
        requirements.push(...frameworkReqs);
        confidence += 0.2;
      }

      // Auto-detect requirements for HTML/web prompts
      if (this.isHtmlWebPrompt(prompt) && !framework) {
        const htmlReqs = this.getFrameworkSpecificRequirements('html');
        requirements.push(...htmlReqs);
        confidence += 0.3;
      }

      // Apply maximum requirements limit
      const maxReqs = options.maxRequirements || 10;
      const finalRequirements = requirements.slice(0, maxReqs);

      // Calculate final confidence
      const finalConfidence = Math.min(confidence, 1.0);

      // Filter by confidence threshold
      const minConfidence = options.minConfidence || 0.5;
      const filteredRequirements = finalConfidence >= minConfidence 
        ? finalRequirements 
        : [];

      const result: QualityDetectionResult = {
        requirements: filteredRequirements,
        detectedTechnologies: [...new Set(detectedTechnologies)],
        confidence: finalConfidence
      };

      this.logger.info('Quality requirements detection completed', {
        requirementsCount: result.requirements.length,
        technologies: result.detectedTechnologies,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      this.logger.error('Quality requirements detection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Return fallback result
      return {
        requirements: [],
        detectedTechnologies: [],
        confidence: 0
      };
    }
  }

  /**
   * Checks if prompt contains accessibility-related keywords
   * 
   * @param prompt - The prompt to analyze
   * @returns boolean - True if accessibility keywords found
   * 
   * @example
   * ```typescript
   * const hasAccessibility = detector.containsAccessibilityKeywords(
   *   "Create a form with keyboard navigation"
   * ); // true
   * ```
   */
  private containsAccessibilityKeywords(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return this.accessibilityKeywords.some(keyword => 
      lowerPrompt.includes(keyword.toLowerCase())
    );
  }

  /**
   * Checks if prompt contains security-related keywords
   * 
   * @param prompt - The prompt to analyze
   * @returns boolean - True if security keywords found
   */
  private containsSecurityKeywords(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return this.securityKeywords.some(keyword => 
      lowerPrompt.includes(keyword.toLowerCase())
    );
  }

  /**
   * Checks if prompt contains performance-related keywords
   * 
   * @param prompt - The prompt to analyze
   * @returns boolean - True if performance keywords found
   */
  private containsPerformanceKeywords(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return this.performanceKeywords.some(keyword => 
      lowerPrompt.includes(keyword.toLowerCase())
    );
  }

  /**
   * Detects technologies mentioned in the prompt
   * 
   * @param prompt - The prompt to analyze
   * @returns string[] - Array of detected technologies
   */
  private detectTechnologies(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const detected: string[] = [];

    for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
      if (patterns.some(pattern => lowerPrompt.includes(pattern))) {
        detected.push(framework);
      }
    }

    return detected;
  }

  /**
   * Checks if prompt is related to HTML/web development
   * 
   * @param prompt - The prompt to analyze
   * @returns boolean - True if HTML/web related
   */
  private isHtmlWebPrompt(prompt: string): boolean {
    const htmlKeywords = ['html', 'web', 'page', 'website', 'frontend', 'css', 'javascript'];
    const lowerPrompt = prompt.toLowerCase();
    
    return htmlKeywords.some(keyword => lowerPrompt.includes(keyword)) ||
           lowerPrompt.includes('create') && (
             lowerPrompt.includes('page') || 
             lowerPrompt.includes('component') ||
             lowerPrompt.includes('ui')
           );
  }

  /**
   * Generates accessibility rules based on priority
   * 
   * @param priority - Priority level for the rules
   * @returns QualityRequirement[] - Array of accessibility requirements
   */
  private getAccessibilityRules(priority: QualityPriority): QualityRequirement[] {
    const rules: string[] = [];

    if (priority === 'critical' || priority === 'high') {
      rules.push(
        'Use semantic HTML elements (<main>, <button>, <section>) not generic <div>',
        'Add visible focus states with :focus-visible for all interactive elements',
        'Include role="status" aria-live="polite" for dynamic content updates'
      );
    }

    if (priority === 'critical') {
      rules.push(
        'Wrap animations in @media (prefers-reduced-motion: reduce) guards',
        'Ensure WCAG AA contrast ratios (4.5:1 minimum)',
        'Provide keyboard navigation support (Space/Enter keys)'
      );
    }

    return [{
      category: 'accessibility',
      priority,
      rules,
      tokenBudget: DEFAULT_TOKEN_BUDGET.accessibility
    }];
  }

  /**
   * Generates security rules based on priority
   * 
   * @param priority - Priority level for the rules
   * @returns QualityRequirement[] - Array of security requirements
   */
  private getSecurityRules(priority: QualityPriority): QualityRequirement[] {
    const rules: string[] = [];

    if (priority === 'critical') {
      rules.push(
        'Move inline <style> and <script> to external files',
        'Generate Content Security Policy headers',
        'Sanitize any dynamic content to prevent XSS'
      );
    }

    if (priority === 'critical' || priority === 'high') {
      rules.push(
        'Validate all user inputs',
        'Implement proper authentication and authorization',
        'Use HTTPS for all communications'
      );
    }

    return [{
      category: 'security',
      priority,
      rules,
      tokenBudget: DEFAULT_TOKEN_BUDGET.security
    }];
  }

  /**
   * Generates performance rules based on priority
   * 
   * @param priority - Priority level for the rules
   * @returns QualityRequirement[] - Array of performance requirements
   */
  private getPerformanceRules(priority: QualityPriority): QualityRequirement[] {
    const rules: string[] = [];

    if (priority === 'high' || priority === 'critical') {
      rules.push(
        'Optimize for Core Web Vitals metrics',
        'Implement lazy loading for images and components',
        'Use efficient caching strategies'
      );
    }

    if (priority === 'high') {
      rules.push(
        'Minimize bundle size with code splitting',
        'Optimize animations for 60fps performance',
        'Implement proper error boundaries'
      );
    }

    return [{
      category: 'performance',
      priority,
      rules,
      tokenBudget: DEFAULT_TOKEN_BUDGET.performance
    }];
  }

  /**
   * Gets framework-specific quality requirements
   * 
   * @param framework - The framework to get requirements for
   * @returns QualityRequirement[] - Array of framework-specific requirements
   */
  private getFrameworkSpecificRequirements(framework: string): QualityRequirement[] {
    const frameworkKey = framework.toLowerCase();
    
    if (frameworkKey in EXAMPLE_QUALITY_REQUIREMENTS) {
      return EXAMPLE_QUALITY_REQUIREMENTS[frameworkKey as keyof typeof EXAMPLE_QUALITY_REQUIREMENTS] || [];
    }

    // Fallback for unknown frameworks
    if (this.frameworkPatterns.html.includes(frameworkKey)) {
      return this.getHtmlSpecificRequirements();
    }

    if (this.frameworkPatterns.react.includes(frameworkKey)) {
      return this.getReactSpecificRequirements();
    }

    return [];
  }

  /**
   * Gets HTML-specific quality requirements
   * 
   * @returns QualityRequirement[] - HTML-specific requirements
   */
  private getHtmlSpecificRequirements(): QualityRequirement[] {
    return [
      {
        category: 'accessibility',
        priority: 'critical',
        rules: [
          'Use semantic HTML elements (<main>, <button>, <section>) not generic <div>',
          'Add visible focus states with :focus-visible for all interactive elements',
          'Include role="status" aria-live="polite" for dynamic content updates',
          'Wrap animations in @media (prefers-reduced-motion: reduce) guards'
        ],
        tokenBudget: DEFAULT_TOKEN_BUDGET.accessibility
      },
      {
        category: 'security',
        priority: 'critical',
        rules: [
          'Move inline <style> and <script> to external files',
          'Generate Content Security Policy headers',
          'Sanitize any dynamic content to prevent XSS'
        ],
        tokenBudget: DEFAULT_TOKEN_BUDGET.security
      }
    ];
  }

  /**
   * Gets React-specific quality requirements
   * 
   * @returns QualityRequirement[] - React-specific requirements
   */
  private getReactSpecificRequirements(): QualityRequirement[] {
    return [
      {
        category: 'accessibility',
        priority: 'critical',
        rules: [
          'Use semantic HTML elements and proper ARIA roles',
          'Implement keyboard navigation support',
          'Add focus management for dynamic content',
          'Include screen reader announcements'
        ],
        tokenBudget: DEFAULT_TOKEN_BUDGET.accessibility
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
        tokenBudget: DEFAULT_TOKEN_BUDGET.security
      },
      {
        category: 'performance',
        priority: 'high',
        rules: [
          'Implement React.memo for expensive components',
          'Use useCallback/useMemo appropriately',
          'Implement code splitting with React.lazy',
          'Optimize re-renders with proper dependencies'
        ],
        tokenBudget: DEFAULT_TOKEN_BUDGET.performance
      }
    ];
  }
}
