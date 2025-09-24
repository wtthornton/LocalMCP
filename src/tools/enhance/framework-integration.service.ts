/**
 * Framework Integration Service
 * 
 * Handles framework detection and quality requirements analysis
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Intelligent framework detection
 * - Quality requirements analysis
 * - Framework-specific optimizations
 * - Single responsibility principle
 */

import { Logger } from '../../services/logger/logger.js';
import { FrameworkDetectorService } from '../../services/framework-detector/framework-detector.service.js';

export interface QualityRequirement {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

export interface FrameworkDetectionResult {
  detectedFrameworks: string[];
  confidence: number;
  suggestions: string[];
  context7Libraries: string[];
  detectionMethod: 'pattern' | 'ai' | 'project' | 'fallback' | 'context' | 'dynamic';
}

export class FrameworkIntegrationService {
  private logger: Logger;
  private frameworkDetector: FrameworkDetectorService;

  constructor(logger: Logger, frameworkDetector: FrameworkDetectorService) {
    this.logger = logger;
    this.frameworkDetector = frameworkDetector;
  }

  /**
   * Detect frameworks for a prompt with context awareness
   * Implements intelligent framework detection with fallback strategies
   */
  async detectFrameworks(
    prompt: string,
    projectContext?: any,
    explicitFramework?: string
  ): Promise<FrameworkDetectionResult> {
    try {
      // If explicit framework is provided in context, use it as primary detection
      if (explicitFramework) {
        this.logger.debug('Using explicit framework from context', { 
          framework: explicitFramework 
        });
        
        return {
          detectedFrameworks: [explicitFramework],
          confidence: 1.0,
          suggestions: [],
          context7Libraries: [],
          detectionMethod: 'context'
        };
      }

      // Use dynamic detection
      const detection = await this.frameworkDetector.detectFrameworks(
        prompt, 
        projectContext
      );

      this.logger.debug('Framework detection completed', {
        detectedFrameworks: detection.detectedFrameworks,
        confidence: detection.confidence,
        detectionMethod: detection.detectionMethod
      });

      return detection;

    } catch (error) {
      this.logger.warn('Framework detection failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });

      // Fallback to common frameworks
      return {
        detectedFrameworks: ['javascript'],
        confidence: 0.3,
        suggestions: ['react', 'vue', 'angular'],
        context7Libraries: [],
        detectionMethod: 'fallback'
      };
    }
  }

  /**
   * Detect quality requirements with project context
   * REDESIGNED: Uses complete project context for better quality requirements detection
   */
  async detectQualityRequirementsWithContext(
    prompt: string, 
    framework?: string, 
    projectContext?: any
  ): Promise<QualityRequirement[]> {
    try {
      const requirements: QualityRequirement[] = [];
      const promptLower = prompt.toLowerCase();
      
      // Get base requirements from prompt and framework
      const baseRequirements = await this.detectQualityRequirements(prompt, framework);
      requirements.push(...baseRequirements);
      
      // Add project-specific quality requirements
      if (projectContext) {
        const projectRequirements = this.extractProjectQualityRequirements(projectContext, promptLower);
        requirements.push(...projectRequirements);
      }
      
      // Remove duplicates and return
      return this.deduplicateQualityRequirements(requirements);

    } catch (error) {
      this.logger.warn('Context-aware quality requirements detection failed, falling back to basic detection', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Fallback to basic detection
      return await this.detectQualityRequirements(prompt, framework);
    }
  }

  /**
   * Detect quality requirements from prompt and framework
   * Implements intelligent quality requirements analysis
   */
  async detectQualityRequirements(prompt: string, framework?: string): Promise<QualityRequirement[]> {
    try {
      const requirements: QualityRequirement[] = [];
      const promptLower = prompt.toLowerCase();
      
      // Detect complexity level
      if (promptLower.includes('production') || promptLower.includes('enterprise')) {
        requirements.push({ 
          type: 'production', 
          priority: 'high',
          description: 'Production-ready code with enterprise standards'
        });
      }
      
      if (promptLower.includes('responsive') || promptLower.includes('mobile')) {
        requirements.push({ 
          type: 'responsive', 
          priority: 'medium',
          description: 'Mobile-first responsive design'
        });
      }
      
      if (promptLower.includes('accessible') || promptLower.includes('a11y')) {
        requirements.push({ 
          type: 'accessibility', 
          priority: 'high',
          description: 'WCAG compliant accessibility features'
        });
      }

      if (promptLower.includes('performance') || promptLower.includes('optimize')) {
        requirements.push({ 
          type: 'performance', 
          priority: 'high',
          description: 'Optimized for performance and speed'
        });
      }

      if (promptLower.includes('test') || promptLower.includes('testing')) {
        requirements.push({ 
          type: 'testing', 
          priority: 'medium',
          description: 'Comprehensive test coverage'
        });
      }

      if (promptLower.includes('secure') || promptLower.includes('security')) {
        requirements.push({ 
          type: 'security', 
          priority: 'high',
          description: 'Security best practices implementation'
        });
      }

      // Framework-specific requirements
      if (framework) {
        const frameworkRequirements = this.getFrameworkSpecificRequirements(framework, promptLower);
        requirements.push(...frameworkRequirements);
      }
      
      this.logger.debug('Quality requirements detected', {
        requirementsCount: requirements.length,
        detectedTechnologies: framework ? [framework] : [],
        confidence: 0.8
      });

      return requirements;

    } catch (error) {
      this.logger.warn('Quality requirements detection failed, continuing without them', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Return empty array on failure - graceful degradation
      return [];
    }
  }

  /**
   * Format quality requirements for display
   * Implements user-friendly formatting
   */
  formatQualityRequirements(requirements: QualityRequirement[]): string {
    try {
      if (!requirements || requirements.length === 0) {
        return '';
      }
      
      let formatted = '## Quality Requirements\n\n';
      
      requirements.forEach((req, index) => {
        const priority = req.priority || 'medium';
        const type = req.type || 'general';
        const description = req.description || '';
        const priorityEmoji = this.getPriorityEmoji(priority);
        
        formatted += `${index + 1}. **${type}** ${priorityEmoji} (${priority} priority)\n`;
        if (description) {
          formatted += `   - ${description}\n`;
        }
      });
      
      return formatted;

    } catch (error) {
      this.logger.warn('Quality requirements formatting failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requirementsCount: requirements?.length || 0
      });
      
      // Return fallback formatting
      return '';
    }
  }

  /**
   * Get framework-specific quality requirements
   * Implements framework-aware requirement detection
   */
  private getFrameworkSpecificRequirements(framework: string, promptLower: string): QualityRequirement[] {
    const requirements: QualityRequirement[] = [];
    const frameworkLower = framework.toLowerCase();

    // React-specific requirements
    if (frameworkLower.includes('react')) {
      if (promptLower.includes('component') || promptLower.includes('hook')) {
        requirements.push({
          type: 'react-patterns',
          priority: 'medium',
          description: 'Follow React best practices and patterns'
        });
      }
      
      if (promptLower.includes('state') || promptLower.includes('context')) {
        requirements.push({
          type: 'state-management',
          priority: 'medium',
          description: 'Proper state management implementation'
        });
      }
    }

    // TypeScript-specific requirements
    if (frameworkLower.includes('typescript')) {
      requirements.push({
        type: 'type-safety',
        priority: 'high',
        description: 'Strong typing and type safety'
      });
    }

    // Next.js-specific requirements
    if (frameworkLower.includes('next')) {
      if (promptLower.includes('api') || promptLower.includes('route')) {
        requirements.push({
          type: 'nextjs-patterns',
          priority: 'medium',
          description: 'Follow Next.js App Router patterns'
        });
      }
    }

    // Vue-specific requirements
    if (frameworkLower.includes('vue')) {
      if (promptLower.includes('component') || promptLower.includes('composition')) {
        requirements.push({
          type: 'vue-patterns',
          priority: 'medium',
          description: 'Follow Vue 3 Composition API patterns'
        });
      }
    }

    // Angular-specific requirements
    if (frameworkLower.includes('angular')) {
      requirements.push({
        type: 'angular-patterns',
        priority: 'medium',
        description: 'Follow Angular best practices and dependency injection'
      });
    }

    return requirements;
  }

  /**
   * Get priority emoji for display
   */
  private getPriorityEmoji(priority: string): string {
    const emojiMap: Record<string, string> = {
      'low': '🟢',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    };
    
    return emojiMap[priority] || '⚪';
  }

  /**
   * Extract project-specific quality requirements
   * REDESIGNED: Analyzes project context to determine quality standards
   */
  private extractProjectQualityRequirements(projectContext: any, promptLower: string): QualityRequirement[] {
    const requirements: QualityRequirement[] = [];
    
    try {
      // Check for TypeScript usage
      if (projectContext.repoFacts?.some((fact: string) => fact.toLowerCase().includes('typescript'))) {
        requirements.push({
          type: 'type-safety',
          priority: 'high',
          description: 'TypeScript type safety and strict typing'
        });
      }
      
      // Check for testing frameworks
      if (projectContext.repoFacts?.some((fact: string) => 
        fact.toLowerCase().includes('test') || fact.toLowerCase().includes('jest') || fact.toLowerCase().includes('vitest')
      )) {
        requirements.push({
          type: 'testing',
          priority: 'medium',
          description: 'Comprehensive test coverage and quality'
        });
      }
      
      // Check for linting/formatting tools
      if (projectContext.repoFacts?.some((fact: string) => 
        fact.toLowerCase().includes('eslint') || fact.toLowerCase().includes('prettier')
      )) {
        requirements.push({
          type: 'code-quality',
          priority: 'medium',
          description: 'Code quality standards and formatting'
        });
      }
      
      // Check for build tools and optimization
      if (projectContext.repoFacts?.some((fact: string) => 
        fact.toLowerCase().includes('webpack') || fact.toLowerCase().includes('vite') || fact.toLowerCase().includes('build')
      )) {
        requirements.push({
          type: 'performance',
          priority: 'medium',
          description: 'Build optimization and performance'
        });
      }
      
      // Check for accessibility patterns in code snippets
      if (projectContext.codeSnippets?.some((snippet: string) => 
        snippet.toLowerCase().includes('aria-') || snippet.toLowerCase().includes('role=') || snippet.toLowerCase().includes('alt=')
      )) {
        requirements.push({
          type: 'accessibility',
          priority: 'high',
          description: 'Accessibility best practices and WCAG compliance'
        });
      }
      
      // Check for responsive design patterns
      if (projectContext.codeSnippets?.some((snippet: string) => 
        snippet.toLowerCase().includes('@media') || snippet.toLowerCase().includes('responsive') || snippet.toLowerCase().includes('mobile')
      )) {
        requirements.push({
          type: 'responsive',
          priority: 'medium',
          description: 'Mobile-first responsive design'
        });
      }
      
      // Check for security patterns
      if (projectContext.codeSnippets?.some((snippet: string) => 
        snippet.toLowerCase().includes('sanitize') || snippet.toLowerCase().includes('validate') || snippet.toLowerCase().includes('csrf')
      )) {
        requirements.push({
          type: 'security',
          priority: 'high',
          description: 'Security best practices and input validation'
        });
      }
      
    } catch (error) {
      this.logger.warn('Failed to extract project quality requirements', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    return requirements;
  }

  /**
   * Deduplicate quality requirements
   * REDESIGNED: Removes duplicate requirements and merges similar ones
   */
  private deduplicateQualityRequirements(requirements: QualityRequirement[]): QualityRequirement[] {
    const uniqueRequirements = new Map<string, QualityRequirement>();
    
    for (const req of requirements) {
      const key = req.type.toLowerCase();
      const existing = uniqueRequirements.get(key);
      
      if (existing) {
        // Merge descriptions and take higher priority
        const mergedDescription = existing.description && req.description 
          ? `${existing.description}; ${req.description}`
          : existing.description || req.description;
        
        const higherPriority = this.getHigherPriority(existing.priority, req.priority);
        
        uniqueRequirements.set(key, {
          type: req.type,
          priority: higherPriority,
          description: mergedDescription || ''
        });
      } else {
        uniqueRequirements.set(key, req);
      }
    }
    
    return Array.from(uniqueRequirements.values());
  }

  /**
   * Get higher priority between two priorities
   */
  private getHigherPriority(priority1: string, priority2: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const p1 = priorityOrder[priority1 as keyof typeof priorityOrder] || 1;
    const p2 = priorityOrder[priority2 as keyof typeof priorityOrder] || 1;
    
    return p1 >= p2 ? priority1 as any : priority2 as any;
  }

  /**
   * Calculate optimal token limit based on framework and complexity
   * Implements intelligent token allocation
   */
  calculateOptimalTokenLimit(
    complexityLevel: string,
    framework: string,
    prompt: string
  ): number {
    let baseTokens = 1000; // Base token allocation
    
    // Adjust based on complexity
    switch (complexityLevel) {
      case 'simple':
        baseTokens = 400;
        break;
      case 'medium':
        baseTokens = 1200;
        break;
      case 'complex':
        baseTokens = 2000;
        break;
    }
    
    // Adjust based on framework
    const frameworkLower = framework.toLowerCase();
    if (frameworkLower.includes('react') || frameworkLower.includes('next')) {
      baseTokens = Math.floor(baseTokens * 1.2); // React docs are typically more verbose
    } else if (frameworkLower.includes('vue') || frameworkLower.includes('angular')) {
      baseTokens = Math.floor(baseTokens * 1.1);
    } else if (frameworkLower.includes('html') || frameworkLower.includes('css')) {
      baseTokens = Math.floor(baseTokens * 0.8); // HTML/CSS docs are typically shorter
    }
    
    // Adjust based on prompt length
    if (prompt.length > 200) {
      baseTokens = Math.floor(baseTokens * 1.1);
    } else if (prompt.length < 50) {
      baseTokens = Math.floor(baseTokens * 0.8);
    }
    
    return Math.min(baseTokens, 3000); // Cap at 3000 tokens
  }
}
