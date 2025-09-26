/**
 * Universal Quality Keywords Service
 * 
 * Provides universal keywords and quality requirements that should be injected
 * into every code generation prompt to ensure high-quality, secure, and maintainable code.
 * 
 * Benefits for vibe coders:
 * - Automatic quality enhancement without manual intervention
 * - Consistent security and accessibility compliance
 * - Framework-aware quality requirements
 * - Production-ready code generation
 */

import { Logger } from '../logger/logger.js';
import type {
  QualityKeyword,
  QualityRequirement,
  UniversalQualityKeywords,
  KeywordInjectionOptions,
  EnhancedPromptResult,
  QualityCategory,
  EnforcementLevel
} from '../../types/quality-keywords.types.js';

export class UniversalQualityKeywordsService {
  private logger: Logger;
  private keywords: UniversalQualityKeywords;

  constructor(logger: Logger) {
    this.logger = logger;
    this.keywords = this.initializeKeywords();
  }

  /**
   * Initialize universal quality keywords
   * Based on research findings for maximum code quality improvement
   */
  private initializeKeywords(): UniversalQualityKeywords {
    return {
      security: [
        {
          keyword: "secure coding practices",
          category: "security",
          enforcement: "critical",
          description: "Enforce secure coding practices and input validation",
          frameworkSpecific: false
        },
        {
          keyword: "input validation and sanitization",
          category: "security",
          enforcement: "critical",
          description: "Validate and sanitize all user inputs to prevent attacks",
          frameworkSpecific: false
        },
        {
          keyword: "prevent SQL injection",
          category: "security",
          enforcement: "critical",
          description: "Use prepared statements and parameterized queries",
          frameworkSpecific: false
        },
        {
          keyword: "prevent XSS attacks",
          category: "security",
          enforcement: "critical",
          description: "Sanitize output and use proper encoding",
          frameworkSpecific: false
        },
        {
          keyword: "error handling",
          category: "security",
          enforcement: "high",
          description: "Implement comprehensive error handling",
          frameworkSpecific: false
        },
        {
          keyword: "OWASP guidelines",
          category: "security",
          enforcement: "critical",
          description: "Follow OWASP security guidelines and best practices",
          frameworkSpecific: false
        },
        {
          keyword: "authentication and authorization",
          category: "security",
          enforcement: "high",
          description: "Implement proper authentication and authorization",
          frameworkSpecific: false
        },
        {
          keyword: "Content Security Policy",
          category: "security",
          enforcement: "critical",
          description: "Implement CSP headers for web applications",
          targetFrameworks: ["html", "react", "vue", "angular"]
        }
      ],
      quality: [
        {
          keyword: "clean code principles",
          category: "quality",
          enforcement: "high",
          description: "Follow clean code principles for maintainability",
          frameworkSpecific: false
        },
        {
          keyword: "SOLID principles",
          category: "quality",
          enforcement: "high",
          description: "Apply SOLID principles for better design",
          frameworkSpecific: false
        },
        {
          keyword: "maintainable and readable",
          category: "quality",
          enforcement: "high",
          description: "Write maintainable and readable code",
          frameworkSpecific: false
        },
        {
          keyword: "modular design",
          category: "quality",
          enforcement: "high",
          description: "Implement modular and reusable design",
          frameworkSpecific: false
        },
        {
          keyword: "proper documentation",
          category: "quality",
          enforcement: "high",
          description: "Include comprehensive documentation and comments",
          frameworkSpecific: false
        },
        {
          keyword: "DRY methodology",
          category: "quality",
          enforcement: "medium",
          description: "Don't Repeat Yourself - avoid code duplication",
          frameworkSpecific: false
        },
        {
          keyword: "single responsibility principle",
          category: "quality",
          enforcement: "high",
          description: "Each function/class should have one responsibility",
          frameworkSpecific: false
        }
      ],
      performance: [
        {
          keyword: "optimized for performance",
          category: "performance",
          enforcement: "high",
          description: "Optimize code for performance and efficiency",
          frameworkSpecific: false
        },
        {
          keyword: "efficient algorithms",
          category: "performance",
          enforcement: "high",
          description: "Use efficient algorithms and data structures",
          frameworkSpecific: false
        },
        {
          keyword: "scalable architecture",
          category: "performance",
          enforcement: "high",
          description: "Design for scalability and growth",
          frameworkSpecific: false
        },
        {
          keyword: "resource optimization",
          category: "performance",
          enforcement: "medium",
          description: "Optimize resource usage and memory management",
          frameworkSpecific: false
        },
        {
          keyword: "time complexity",
          category: "performance",
          enforcement: "high",
          description: "Consider time complexity (target O(n log n) or better)",
          frameworkSpecific: false
        },
        {
          keyword: "caching strategies",
          category: "performance",
          enforcement: "medium",
          description: "Implement appropriate caching strategies",
          frameworkSpecific: false
        },
        {
          keyword: "lazy loading",
          category: "performance",
          enforcement: "medium",
          description: "Implement lazy loading for better performance",
          targetFrameworks: ["html", "react", "vue", "angular"]
        }
      ],
      testing: [
        {
          keyword: "unit tests",
          category: "testing",
          enforcement: "high",
          description: "Include comprehensive unit tests",
          frameworkSpecific: false
        },
        {
          keyword: "integration tests",
          category: "testing",
          enforcement: "high",
          description: "Include integration tests for critical paths",
          frameworkSpecific: false
        },
        {
          keyword: "error handling",
          category: "testing",
          enforcement: "high",
          description: "Test error conditions and edge cases",
          frameworkSpecific: false
        },
        {
          keyword: "edge cases",
          category: "testing",
          enforcement: "high",
          description: "Cover all edge cases and boundary conditions",
          frameworkSpecific: false
        },
        {
          keyword: "test coverage",
          category: "testing",
          enforcement: "high",
          description: "Achieve minimum 80% test coverage",
          frameworkSpecific: false
        },
        {
          keyword: "automated testing",
          category: "testing",
          enforcement: "medium",
          description: "Implement automated testing pipelines",
          frameworkSpecific: false
        },
        {
          keyword: "test-driven development",
          category: "testing",
          enforcement: "medium",
          description: "Follow test-driven development practices",
          frameworkSpecific: false
        }
      ],
      accessibility: [
        {
          keyword: "WCAG 2.1 compliance",
          category: "accessibility",
          enforcement: "critical",
          description: "Follow WCAG 2.1 AA compliance standards",
          targetFrameworks: ["html", "react", "vue", "angular"]
        },
        {
          keyword: "semantic HTML",
          category: "accessibility",
          enforcement: "critical",
          description: "Use semantic HTML5 elements",
          targetFrameworks: ["html", "react", "vue", "angular"]
        },
        {
          keyword: "ARIA attributes",
          category: "accessibility",
          enforcement: "critical",
          description: "Implement proper ARIA attributes",
          targetFrameworks: ["html", "react", "vue", "angular"]
        },
        {
          keyword: "keyboard navigation",
          category: "accessibility",
          enforcement: "critical",
          description: "Ensure full keyboard navigation support",
          targetFrameworks: ["html", "react", "vue", "angular"]
        },
        {
          keyword: "screen reader support",
          category: "accessibility",
          enforcement: "critical",
          description: "Provide screen reader support",
          targetFrameworks: ["html", "react", "vue", "angular"]
        },
        {
          keyword: "color contrast",
          category: "accessibility",
          enforcement: "high",
          description: "Maintain WCAG AA color contrast ratios",
          targetFrameworks: ["html", "react", "vue", "angular"]
        },
        {
          keyword: "focus management",
          category: "accessibility",
          enforcement: "high",
          description: "Implement proper focus management",
          targetFrameworks: ["html", "react", "vue", "angular"]
        }
      ]
    };
  }

  /**
   * Inject universal quality keywords into a prompt
   */
  injectKeywords(
    originalPrompt: string, 
    framework: string = 'generic',
    options: Partial<KeywordInjectionOptions> = {}
  ): EnhancedPromptResult {
    const {
      includeFrameworkSpecific = true,
      targetFramework = framework,
      maxTokens = 2000,
      minEnforcementLevel = 'medium',
      includeExamples = true
    } = options;

    this.logger.debug('Injecting universal quality keywords', {
      originalPromptLength: originalPrompt.length,
      framework: targetFramework,
      options
    });

    // Select keywords based on enforcement level and framework
    const selectedKeywords = this.selectKeywords(targetFramework, minEnforcementLevel, includeFrameworkSpecific);
    
    // Build enhanced prompt
    const enhancedPrompt = this.buildEnhancedPrompt(originalPrompt, selectedKeywords, includeExamples);
    
    // Calculate token count
    const tokenCount = this.estimateTokenCount(enhancedPrompt);
    
    // Estimate quality score
    const estimatedQualityScore = this.estimateQualityScore(selectedKeywords);

    return {
      enhancedPrompt,
      injectedKeywords: selectedKeywords,
      appliedRequirements: this.buildQualityRequirements(selectedKeywords),
      tokenCount,
      estimatedQualityScore
    };
  }

  /**
   * Select keywords based on framework and enforcement level
   */
  private selectKeywords(
    framework: string, 
    minEnforcementLevel: EnforcementLevel,
    includeFrameworkSpecific: boolean
  ): QualityKeyword[] {
    const selectedKeywords: QualityKeyword[] = [];
    
    // Get enforcement level priority
    const enforcementPriority = ['critical', 'high', 'medium', 'low'];
    const minLevelIndex = enforcementPriority.indexOf(minEnforcementLevel);
    
    // Process each category
    Object.entries(this.keywords).forEach(([category, keywords]) => {
      (keywords as QualityKeyword[]).forEach(keyword => {
        // Check enforcement level
        const keywordLevelIndex = enforcementPriority.indexOf(keyword.enforcement);
        if (keywordLevelIndex > minLevelIndex) return;
        
        // Check framework specificity
        if (keyword.frameworkSpecific && !includeFrameworkSpecific) return;
        if (keyword.frameworkSpecific && keyword.targetFrameworks && 
            !keyword.targetFrameworks.includes(framework.toLowerCase())) return;
        
        selectedKeywords.push(keyword);
      });
    });

    return selectedKeywords;
  }

  /**
   * Build enhanced prompt with quality requirements
   */
  private buildEnhancedPrompt(
    originalPrompt: string, 
    keywords: QualityKeyword[],
    includeExamples: boolean
  ): string {
    let enhanced = originalPrompt;
    
    // Add quality requirements section
    enhanced += '\n\n## MANDATORY QUALITY REQUIREMENTS:\n\n';
    
    // Group keywords by category
    const keywordsByCategory = this.groupKeywordsByCategory(keywords);
    
    // Add each category section
    Object.entries(keywordsByCategory).forEach(([category, categoryKeywords]) => {
      enhanced += this.buildCategorySection(category, categoryKeywords, includeExamples);
    });
    
    // Add output requirements
    enhanced += this.buildOutputRequirements();
    
    return enhanced;
  }

  /**
   * Group keywords by category
   */
  private groupKeywordsByCategory(keywords: QualityKeyword[]): Record<string, QualityKeyword[]> {
    return keywords.reduce((groups, keyword) => {
      if (!groups[keyword.category]) {
        groups[keyword.category] = [];
      }
      groups[keyword.category].push(keyword);
      return groups;
    }, {} as Record<string, QualityKeyword[]>);
  }

  /**
   * Build category section for enhanced prompt
   */
  private buildCategorySection(
    category: string, 
    keywords: QualityKeyword[],
    includeExamples: boolean
  ): string {
    const categoryTitles = {
      security: 'Security (Critical - MANDATORY)',
      quality: 'Code Quality (High - REQUIRED)',
      performance: 'Performance (High - REQUIRED)',
      testing: 'Testing (High - REQUIRED)',
      accessibility: 'Accessibility (Web - CRITICAL)'
    };

    const categoryTitle = categoryTitles[category as keyof typeof categoryTitles] || category;
    let section = `### ${categoryTitle}:\n`;
    
    // Add keyword-based requirements
    keywords.forEach(keyword => {
      section += `- ${keyword.description}\n`;
    });
    
    // Add category-specific examples if requested
    if (includeExamples) {
      section += this.getCategoryExamples(category);
    }
    
    section += '\n';
    return section;
  }

  /**
   * Get category-specific examples
   */
  private getCategoryExamples(category: string): string {
    const examples = {
      security: [
        '- Implement Content Security Policy headers',
        '- Use prepared statements for database queries',
        '- Validate and sanitize all user inputs',
        '- Implement proper authentication flows'
      ],
      quality: [
        '- Follow language-specific style guides (PEP 8, ESLint)',
        '- Use meaningful variable and function names',
        '- Write self-documenting code',
        '- Implement proper error handling'
      ],
      performance: [
        '- Optimize for O(n log n) or better time complexity',
        '- Implement proper memory management',
        '- Use efficient data structures',
        '- Implement caching where appropriate'
      ],
      testing: [
        '- Achieve minimum 80% test coverage',
        '- Test all edge cases and error conditions',
        '- Implement automated testing pipelines',
        '- Include performance benchmarks'
      ],
      accessibility: [
        '- Use semantic HTML5 elements',
        '- Implement proper ARIA attributes',
        '- Ensure keyboard navigation',
        '- Provide screen reader support'
      ]
    };

    const categoryExamples = examples[category as keyof typeof examples] || [];
    return categoryExamples.map(example => `  ${example}`).join('\n') + '\n';
  }

  /**
   * Build output requirements section
   */
  private buildOutputRequirements(): string {
    return `
## OUTPUT REQUIREMENTS:
- Provide complete, production-ready code with all dependencies
- Include detailed comments, documentation, and usage examples
- Specify all required dependencies and configuration
- Include comprehensive test cases and validation
- Ensure code follows industry best practices and standards
- Provide implementation notes and security considerations
`;
  }

  /**
   * Build quality requirements from keywords
   */
  private buildQualityRequirements(keywords: QualityKeyword[]): QualityRequirement[] {
    const requirements: QualityRequirement[] = [];
    const keywordsByCategory = this.groupKeywordsByCategory(keywords);
    
    Object.entries(keywordsByCategory).forEach(([category, categoryKeywords]) => {
      const rules = categoryKeywords.map(k => k.description);
      const priority = this.getHighestEnforcementLevel(categoryKeywords);
      
      requirements.push({
        category: category as QualityCategory,
        priority,
        rules,
        tokenBudget: this.calculateTokenBudget(category, rules.length),
        frameworkSpecific: categoryKeywords.some(k => k.frameworkSpecific)
      });
    });
    
    return requirements;
  }

  /**
   * Get highest enforcement level from keywords
   */
  private getHighestEnforcementLevel(keywords: QualityKeyword[]): EnforcementLevel {
    const levels = ['critical', 'high', 'medium', 'low'];
    const keywordLevels = keywords.map(k => levels.indexOf(k.enforcement));
    const highestIndex = Math.min(...keywordLevels);
    return levels[highestIndex] as EnforcementLevel;
  }

  /**
   * Calculate token budget for category
   */
  private calculateTokenBudget(category: string, ruleCount: number): number {
    const baseBudgets = {
      security: 800,
      quality: 600,
      performance: 500,
      testing: 400,
      accessibility: 700
    };
    
    const baseBudget = baseBudgets[category as keyof typeof baseBudgets] || 500;
    return baseBudget + (ruleCount * 50);
  }

  /**
   * Estimate token count for text
   */
  private estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate quality score based on keywords
   */
  private estimateQualityScore(keywords: QualityKeyword[]): number {
    const enforcementScores = {
      critical: 10,
      high: 8,
      medium: 6,
      low: 4
    };
    
    const totalScore = keywords.reduce((sum, keyword) => {
      return sum + enforcementScores[keyword.enforcement];
    }, 0);
    
    const averageScore = totalScore / keywords.length;
    return Math.min(10, Math.max(1, averageScore));
  }

  /**
   * Get keywords for specific framework
   */
  getKeywordsForFramework(framework: string): UniversalQualityKeywords {
    const frameworkKeywords: UniversalQualityKeywords = {
      security: [],
      quality: [],
      performance: [],
      testing: [],
      accessibility: []
    };

    Object.entries(this.keywords).forEach(([category, keywords]) => {
      frameworkKeywords[category as keyof UniversalQualityKeywords] = (keywords as QualityKeyword[]).filter(
        keyword => !keyword.frameworkSpecific || 
        (keyword.targetFrameworks && keyword.targetFrameworks.includes(framework.toLowerCase()))
      );
    });

    return frameworkKeywords;
  }

  /**
   * Update keywords (for dynamic configuration)
   */
  updateKeywords(newKeywords: Partial<UniversalQualityKeywords>): void {
    this.keywords = { ...this.keywords, ...newKeywords };
    this.logger.info('Universal quality keywords updated', {
      updatedCategories: Object.keys(newKeywords)
    });
  }
}
