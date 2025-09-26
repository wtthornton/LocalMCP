/**
 * Response Builder Service
 * 
 * Handles enhanced prompt building and content optimization
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Intelligent content truncation and optimization
 * - Context-aware prompt enhancement
 * - Smart section scoring and selection
 * - Single responsibility principle
 */

import { Logger } from '../../services/logger/logger.js';
import { OpenAIService } from '../../services/ai/openai.service.js';
import { UniversalQualityKeywordsService } from '../../services/quality/universal-quality-keywords.service.js';
import { AgentConfigService } from '../../services/agent/agent-config.service.js';
import { SimpleResearchService } from '../../services/research/simple-research.service.js';
import { UniversalBaselineService } from '../../services/baseline/universal-baseline.service.js';
import type { 
  PromptEnhancementRequest, 
  PromptEnhancementResponse,
  EnhancementContext,
  EnhancementOptions,
  EnhancementGoals,
  ProjectContext,
  FrameworkContext,
  QualityRequirements,
  CodeSnippet,
  DocumentationContext,
  UserPreferences
} from '../../types/prompt-enhancement.types.js';
import type { KeywordInjectionOptions } from '../../types/quality-keywords.types.js';

export interface PromptContext {
  repoFacts: string[];
  codeSnippets: string[];
  context7Docs: string;
  qualityRequirements: any[];
  frameworkDetection: any;
  frameworkDocs: string[];
  projectDocs: string[];
}

export interface PromptComplexity {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  indicators: string[];
}

export class ResponseBuilderService {
  private logger: Logger;
  private openAIService?: OpenAIService;
  private universalKeywords: UniversalQualityKeywordsService;
  private agentConfig: AgentConfigService;
  private researchService?: SimpleResearchService;
  private baselineService: UniversalBaselineService;

  constructor(logger: Logger, openAIService?: OpenAIService, researchService?: SimpleResearchService) {
    this.logger = logger;
    this.openAIService = openAIService;
    this.universalKeywords = new UniversalQualityKeywordsService(logger);
    this.agentConfig = new AgentConfigService(logger);
    this.researchService = researchService;
    this.baselineService = new UniversalBaselineService(logger);
  }

  /**
   * Build enhanced prompt with all context
   * Implements comprehensive prompt enhancement with complexity awareness
   */
  async buildEnhancedPrompt(
    originalPrompt: string,
    context: PromptContext,
    complexity?: PromptComplexity,
    useAIEnhancement: boolean = false
  ): Promise<string> {
    let enhanced = originalPrompt;
    
    // For simple prompts, provide minimal context
    if (complexity?.level === 'simple') {
      enhanced = this.buildSimplePrompt(enhanced, context);
    } else {
      // For medium/complex prompts, add comprehensive context
      enhanced = this.buildComplexPrompt(enhanced, context, complexity);
    }

    // Apply AI enhancement if requested and available
    if (useAIEnhancement && this.openAIService) {
      try {
        const aiEnhanced = this.buildEnhancedPromptWithAI(originalPrompt, context, complexity);
        return await aiEnhanced;
      } catch (error) {
        this.logger.warn('AI enhancement failed, falling back to standard enhancement', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return enhanced;
      }
    }

    return enhanced;
  }

  /**
   * Build enhanced prompt using dynamic enhancement approach
   * Combines: User Prompt + Universal Baseline + Context7 Research + Enhanced Quality Guidance
   */
  async buildDynamicEnhancedPrompt(
    originalPrompt: string,
    framework: string = 'generic',
    options: {
      useResearch?: boolean;
      useBaseline?: boolean;
      maxTokens?: number;
    } = {}
  ): Promise<{ enhancedPrompt: string; contextUsed: any }> {
    const { useResearch = true, useBaseline = true, maxTokens = 2000 } = options;
    
    this.logger.debug('Building dynamic enhanced prompt', {
      originalPromptLength: originalPrompt.length,
      framework,
      useResearch,
      useBaseline,
      maxTokens
    });

    let enhanced = originalPrompt;
    const contextUsed: any = {
      framework,
      researchUsed: false,
      baselineUsed: false,
      qualityGuidanceUsed: false
    };

    // Step 1: Apply Universal Baseline (always applied)
    if (useBaseline) {
      try {
        const baselineResult = this.baselineService.applyBaseline(enhanced, {
          framework,
          maxTokens: Math.floor(maxTokens * 0.3), // 30% of tokens for baseline
          includeExamples: true
        });

        if (baselineResult.success) {
          enhanced = baselineResult.enhancedPrompt;
          contextUsed.baselineUsed = true;
          contextUsed.baselineKeywords = baselineResult.baselineKeywords;
        }
      } catch (error) {
        this.logger.warn('Baseline application failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 2: Apply Context7 Research (if available)
    if (useResearch && this.researchService && this.researchService.isAvailable()) {
      try {
        const researchResult = await this.researchService.researchFrameworkBestPractices(
          framework,
          { maxTokens: Math.floor(maxTokens * 0.4), useCache: true } // 40% of tokens for research
        );

        if (researchResult.success && researchResult.bestPractices) {
          enhanced += `\n\n## FRAMEWORK-SPECIFIC REQUIREMENTS:\n${researchResult.bestPractices}`;
          contextUsed.researchUsed = true;
          contextUsed.researchContent = researchResult.bestPractices.substring(0, 200) + '...';
        }
      } catch (error) {
        this.logger.warn('Research failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 3: Apply Enhanced Quality Guidance (always applied)
    try {
      const qualityGuidance = this.getEnhancedQualityGuidance(framework);
      if (qualityGuidance) {
        enhanced += `\n\n## ENHANCED QUALITY GUIDANCE:\n${qualityGuidance}`;
        contextUsed.qualityGuidanceUsed = true;
      }
    } catch (error) {
      this.logger.warn('Quality guidance application failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    this.logger.info('Dynamic enhanced prompt completed', {
      originalLength: originalPrompt.length,
      enhancedLength: enhanced.length,
      contextUsed
    });

    return {
      enhancedPrompt: enhanced,
      contextUsed
    };
  }

  /**
   * Get enhanced quality guidance for a framework
   * Uses the enhanced quality guidance from Context7 enhancement prompts
   */
  private getEnhancedQualityGuidance(framework: string): string {
    // This would integrate with the enhanced quality guidance we created
    // For now, return a simple quality guidance
    return `Follow 2025 best practices for ${framework} development including:
- secure coding practices
- input validation  
- step-by-step implementation
- accessibility compliant design
- performance optimized code
- comprehensive unit tests`;
  }

  /**
   * Build enhanced prompt with context separation
   * Returns only the enhanced version of the original prompt
   * Context is used for enhancement but not included in response
   */
  async buildEnhancedOnlyPrompt(
    originalPrompt: string,
    context: PromptContext,
    complexity?: PromptComplexity,
    useAIEnhancement: boolean = false
  ): Promise<{ enhancedPrompt: string; contextUsed: any }> {
    // Start with original prompt
    let enhanced = originalPrompt;
    
    // Apply framework-specific enhancements based on context
    if (context.frameworkDetection && context.frameworkDetection.detectedFrameworks.length > 0) {
      const framework = context.frameworkDetection.detectedFrameworks[0];
      enhanced = this.applyFrameworkEnhancement(enhanced, framework, context);
    }
    
    // Apply quality enhancements if detected
    if (complexity?.level !== 'simple' && context.qualityRequirements && context.qualityRequirements.length > 0) {
      enhanced = this.applyQualityEnhancement(enhanced, context.qualityRequirements);
    }
    
    // Apply project-specific enhancements
    if (context.repoFacts.length > 0) {
      enhanced = this.applyProjectEnhancement(enhanced, context.repoFacts);
    }
    
    // Apply code pattern enhancements
    if (context.codeSnippets.length > 0) {
      enhanced = this.applyCodePatternEnhancement(enhanced, context.codeSnippets);
    }

    // Apply AI enhancement if requested and available
    if (useAIEnhancement && this.openAIService) {
      try {
        const aiEnhanced = await this.buildEnhancedPromptWithAI(originalPrompt, context, complexity);
        enhanced = aiEnhanced;
      } catch (error) {
        this.logger.warn('AI enhancement failed, falling back to standard enhancement', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Prepare context data for logging (not included in response)
    const contextUsed = {
      frameworkDetection: context.frameworkDetection,
      qualityRequirements: context.qualityRequirements,
      context7Docs: context.context7Docs,
      frameworkDocs: context.frameworkDocs,
      projectDocs: context.projectDocs,
      repoFacts: context.repoFacts,
      codeSnippets: context.codeSnippets
    };

    return { enhancedPrompt: enhanced, contextUsed };
  }

  /**
   * Apply framework-specific enhancements to prompt
   */
  private applyFrameworkEnhancement(prompt: string, framework: string, context: PromptContext): string {
    let enhanced = prompt;
    
    switch (framework.toLowerCase()) {
      case 'react':
        enhanced = this.enhanceForReact(enhanced, context);
        break;
      case 'vue':
        enhanced = this.enhanceForVue(enhanced, context);
        break;
      case 'angular':
        enhanced = this.enhanceForAngular(enhanced, context);
        break;
      case 'nextjs':
        enhanced = this.enhanceForNextJS(enhanced, context);
        break;
      case 'html':
        enhanced = this.enhanceForHTML(enhanced, context);
        break;
      default:
        // Generic framework enhancement
        enhanced = this.enhanceForGeneric(enhanced, context);
    }
    
    return enhanced;
  }

  /**
   * Apply quality enhancements to prompt
   */
  private applyQualityEnhancement(prompt: string, qualityRequirements: any[]): string {
    let enhanced = prompt;
    
    // Add quality-specific enhancements based on requirements
    const hasAccessibility = qualityRequirements.some(req => req.type === 'accessibility');
    const hasPerformance = qualityRequirements.some(req => req.type === 'performance');
    const hasSecurity = qualityRequirements.some(req => req.type === 'security');
    const hasTesting = qualityRequirements.some(req => req.type === 'testing');
    
    if (hasAccessibility) {
      enhanced += ' Ensure the component is accessible with proper ARIA attributes and keyboard navigation.';
    }
    
    if (hasPerformance) {
      enhanced += ' Optimize for performance with proper memoization and efficient rendering.';
    }
    
    if (hasSecurity) {
      enhanced += ' Implement proper security measures and input validation.';
    }
    
    if (hasTesting) {
      enhanced += ' Include comprehensive testing with unit and integration tests.';
    }
    
    return enhanced;
  }

  /**
   * Apply project-specific enhancements to prompt
   */
  private applyProjectEnhancement(prompt: string, repoFacts: string[]): string {
    let enhanced = prompt;
    
    // Extract key project patterns from repo facts
    const hasTypeScript = repoFacts.some(fact => fact.includes('TypeScript') || fact.includes('typescript'));
    const hasTailwind = repoFacts.some(fact => fact.includes('Tailwind') || fact.includes('tailwind'));
    const hasTesting = repoFacts.some(fact => fact.includes('test') || fact.includes('Test'));
    
    if (hasTypeScript) {
      enhanced += ' Use TypeScript with proper type definitions.';
    }
    
    if (hasTailwind) {
      enhanced += ' Use Tailwind CSS for styling.';
    }
    
    if (hasTesting) {
      enhanced += ' Include proper testing setup.';
    }
    
    return enhanced;
  }

  /**
   * Apply code pattern enhancements to prompt
   */
  private applyCodePatternEnhancement(prompt: string, codeSnippets: string[]): string {
    let enhanced = prompt;
    
    // Analyze code patterns and enhance accordingly
    const hasHooks = codeSnippets.some(snippet => snippet.includes('useState') || snippet.includes('useEffect'));
    const hasContext = codeSnippets.some(snippet => snippet.includes('createContext') || snippet.includes('useContext'));
    const hasAsync = codeSnippets.some(snippet => snippet.includes('async') || snippet.includes('await'));
    
    if (hasHooks) {
      enhanced += ' Use React hooks for state management.';
    }
    
    if (hasContext) {
      enhanced += ' Consider using React Context for state sharing.';
    }
    
    if (hasAsync) {
      enhanced += ' Handle async operations properly with error handling.';
    }
    
    return enhanced;
  }

  /**
   * React-specific enhancement with universal quality keywords
   */
  private enhanceForReact(prompt: string, context: PromptContext): string {
    this.logger.debug('Enhancing React prompt with universal quality keywords');
    
    // Use universal keyword injection for comprehensive React enhancement
    const injectionOptions: KeywordInjectionOptions = {
      includeFrameworkSpecific: true,
      targetFramework: 'react',
      maxTokens: 2500,
      minEnforcementLevel: 'medium',
      includeExamples: true
    };
    
    const result = this.universalKeywords.injectKeywords(prompt, 'react', injectionOptions);
    
    // Add React-specific enhancements
    let enhanced = result.enhancedPrompt;
    
    // Add React-specific requirements
    enhanced += '\n\n## REACT-SPECIFIC REQUIREMENTS:\n';
    enhanced += '- Use functional components with React hooks\n';
    enhanced += '- Include proper TypeScript types and interfaces\n';
    enhanced += '- Implement proper error boundaries and loading states\n';
    enhanced += '- Follow React best practices for component design\n';
    enhanced += '- Use proper state management patterns (useState, useReducer)\n';
    enhanced += '- Consider performance optimization with React.memo and useMemo\n';
    enhanced += '- Implement proper prop validation and default values\n';
    
    this.logger.info('React prompt enhanced with universal keywords', {
      originalLength: prompt.length,
      enhancedLength: enhanced.length,
      keywordsInjected: result.injectedKeywords.length,
      estimatedQualityScore: result.estimatedQualityScore
    });
    
    return enhanced;
  }

  /**
   * Vue-specific enhancement with universal quality keywords
   */
  private enhanceForVue(prompt: string, context: PromptContext): string {
    this.logger.debug('Enhancing Vue prompt with universal quality keywords');
    
    // Use universal keyword injection for comprehensive Vue enhancement
    const injectionOptions: KeywordInjectionOptions = {
      includeFrameworkSpecific: true,
      targetFramework: 'vue',
      maxTokens: 2500,
      minEnforcementLevel: 'medium',
      includeExamples: true
    };
    
    const result = this.universalKeywords.injectKeywords(prompt, 'vue', injectionOptions);
    
    // Add Vue-specific enhancements
    let enhanced = result.enhancedPrompt;
    
    // Add Vue-specific requirements
    enhanced += '\n\n## VUE-SPECIFIC REQUIREMENTS:\n';
    enhanced += '- Use Vue 3 Composition API with TypeScript\n';
    enhanced += '- Implement proper component lifecycle management\n';
    enhanced += '- Use reactive data handling with ref() and reactive()\n';
    enhanced += '- Follow Vue best practices for component design\n';
    enhanced += '- Implement proper prop validation and emits\n';
    enhanced += '- Use composables for reusable logic\n';
    enhanced += '- Consider performance optimization with computed and watch\n';
    
    this.logger.info('Vue prompt enhanced with universal keywords', {
      originalLength: prompt.length,
      enhancedLength: enhanced.length,
      keywordsInjected: result.injectedKeywords.length,
      estimatedQualityScore: result.estimatedQualityScore
    });
    
    return enhanced;
  }

  /**
   * Angular-specific enhancement with universal quality keywords
   */
  private enhanceForAngular(prompt: string, context: PromptContext): string {
    this.logger.debug('Enhancing Angular prompt with universal quality keywords');
    
    // Use universal keyword injection for comprehensive Angular enhancement
    const injectionOptions: KeywordInjectionOptions = {
      includeFrameworkSpecific: true,
      targetFramework: 'angular',
      maxTokens: 2500,
      minEnforcementLevel: 'medium',
      includeExamples: true
    };
    
    const result = this.universalKeywords.injectKeywords(prompt, 'angular', injectionOptions);
    
    // Add Angular-specific enhancements
    let enhanced = result.enhancedPrompt;
    
    // Add Angular-specific requirements
    enhanced += '\n\n## ANGULAR-SPECIFIC REQUIREMENTS:\n';
    enhanced += '- Use Angular with TypeScript and proper dependency injection\n';
    enhanced += '- Implement proper component lifecycle management\n';
    enhanced += '- Use Angular services for business logic\n';
    enhanced += '- Follow Angular best practices for component design\n';
    enhanced += '- Implement proper routing and navigation\n';
    enhanced += '- Use Angular forms with proper validation\n';
    enhanced += '- Consider performance optimization with OnPush change detection\n';
    enhanced += '- Implement proper error handling with Angular interceptors\n';
    
    this.logger.info('Angular prompt enhanced with universal keywords', {
      originalLength: prompt.length,
      enhancedLength: enhanced.length,
      keywordsInjected: result.injectedKeywords.length,
      estimatedQualityScore: result.estimatedQualityScore
    });
    
    return enhanced;
  }

  /**
   * Next.js-specific enhancement with universal quality keywords
   */
  private enhanceForNextJS(prompt: string, context: PromptContext): string {
    this.logger.debug('Enhancing Next.js prompt with universal quality keywords');
    
    // Use universal keyword injection for comprehensive Next.js enhancement
    const injectionOptions: KeywordInjectionOptions = {
      includeFrameworkSpecific: true,
      targetFramework: 'nextjs',
      maxTokens: 2500,
      minEnforcementLevel: 'medium',
      includeExamples: true
    };
    
    const result = this.universalKeywords.injectKeywords(prompt, 'nextjs', injectionOptions);
    
    // Add Next.js-specific enhancements
    let enhanced = result.enhancedPrompt;
    
    // Add Next.js-specific requirements
    enhanced += '\n\n## NEXT.JS-SPECIFIC REQUIREMENTS:\n';
    enhanced += '- Use Next.js with TypeScript and consider server-side rendering\n';
    enhanced += '- Implement proper routing with Next.js App Router or Pages Router\n';
    enhanced += '- Use Next.js Image component for optimized images\n';
    enhanced += '- Implement proper SEO with Next.js Head component\n';
    enhanced += '- Use Next.js API routes for backend functionality\n';
    enhanced += '- Consider performance optimization with dynamic imports\n';
    enhanced += '- Implement proper error handling with Next.js error boundaries\n';
    enhanced += '- Use Next.js middleware for authentication and routing\n';
    
    this.logger.info('Next.js prompt enhanced with universal keywords', {
      originalLength: prompt.length,
      enhancedLength: enhanced.length,
      keywordsInjected: result.injectedKeywords.length,
      estimatedQualityScore: result.estimatedQualityScore
    });
    
    return enhanced;
  }

  /**
   * HTML-specific enhancement with universal quality keywords
   */
  private enhanceForHTML(prompt: string, context: PromptContext): string {
    this.logger.debug('Enhancing HTML prompt with universal quality keywords');
    
    // Use universal keyword injection for comprehensive HTML enhancement
    const injectionOptions: KeywordInjectionOptions = {
      includeFrameworkSpecific: true,
      targetFramework: 'html',
      maxTokens: 2000,
      minEnforcementLevel: 'medium',
      includeExamples: true
    };
    
    const result = this.universalKeywords.injectKeywords(prompt, 'html', injectionOptions);
    
    this.logger.info('HTML prompt enhanced with universal keywords', {
      originalLength: prompt.length,
      enhancedLength: result.enhancedPrompt.length,
      keywordsInjected: result.injectedKeywords.length,
      estimatedQualityScore: result.estimatedQualityScore
    });
    
    return result.enhancedPrompt;
  }

  /**
   * Generic framework enhancement with universal quality keywords
   */
  private enhanceForGeneric(prompt: string, context: PromptContext): string {
    this.logger.debug('Enhancing generic prompt with universal quality keywords');
    
    // Use universal keyword injection for comprehensive enhancement
    const injectionOptions: KeywordInjectionOptions = {
      includeFrameworkSpecific: false,
      maxTokens: 1500,
      minEnforcementLevel: 'medium',
      includeExamples: true
    };
    
    const result = this.universalKeywords.injectKeywords(prompt, 'generic', injectionOptions);
    
    this.logger.info('Generic prompt enhanced with universal keywords', {
      originalLength: prompt.length,
      enhancedLength: result.enhancedPrompt.length,
      keywordsInjected: result.injectedKeywords.length,
      estimatedQualityScore: result.estimatedQualityScore
    });
    
    return result.enhancedPrompt;
  }

  /**
   * Build AI-enhanced prompt with OpenAI integration
   * Implements intelligent prompt enhancement using AI
   */
  async buildEnhancedPromptWithAI(
    originalPrompt: string,
    context: PromptContext,
    complexity?: PromptComplexity
  ): Promise<string> {
    if (!this.openAIService) {
      throw new Error('OpenAI service not available for AI enhancement');
    }

    this.logger.debug('Starting AI-enhanced prompt building', {
      originalPrompt: originalPrompt.substring(0, 100) + '...',
      complexity: complexity?.level || 'unknown'
    });

    // Prepare enhancement context
    const enhancementContext = this.prepareEnhancementContext(context, complexity);
    
    // Create enhancement request
    const request: PromptEnhancementRequest = {
      originalPrompt,
      context: enhancementContext,
      options: this.createEnhancementOptions(complexity),
      goals: this.createEnhancementGoals(originalPrompt, context)
    };

    // Call OpenAI for enhancement
    const startTime = Date.now();
    const enhancement = await this.openAIService.enhancePromptWithContext(request);
    const processingTime = Date.now() - startTime;

    // Update metadata with processing time
    enhancement.metadata.processingTime = processingTime;

    this.logger.info('AI-enhanced prompt building completed', {
      originalLength: originalPrompt.length,
      enhancedLength: enhancement.enhancedPrompt.length,
      qualityScore: enhancement.quality.overall,
      confidenceScore: enhancement.confidence.overall,
      processingTime
    });

    return enhancement.enhancedPrompt;
  }

  /**
   * Build simple prompt with minimal context
   * Optimized for simple questions and quick responses
   */
  private buildSimplePrompt(enhanced: string, context: PromptContext): string {
    // For very simple prompts, keep it minimal - skip repository context entirely
    
    // Only add essential framework detection if relevant and not already mentioned
    if (context.frameworkDetection && 
        context.frameworkDetection.detectedFrameworks.length > 0 &&
        !enhanced.toLowerCase().includes(context.frameworkDetection.detectedFrameworks[0].toLowerCase())) {
      enhanced += `\n\nFramework: ${context.frameworkDetection.detectedFrameworks[0]}`;
    }
    
    // Add minimal Context7 docs for simple HTML/CSS questions (heavily truncated)
    if (context.context7Docs && context.frameworkDetection?.detectedFrameworks.includes('html')) {
      const truncatedDocs = this.smartTruncateContent(context.context7Docs, 100, enhanced);
      enhanced += `\n\n${truncatedDocs}`;
    }
    
    // Log token usage for monitoring
    this.logTokenUsage('simple_prompt', enhanced, 200, enhanced);
    
    return enhanced;
  }

  /**
   * Build complex prompt with comprehensive context
   * Optimized for development tasks and complex requests
   */
  private buildComplexPrompt(
    enhanced: string, 
    context: PromptContext, 
    complexity?: PromptComplexity
  ): string {
    // Add framework detection information
    if (context.frameworkDetection && context.frameworkDetection.detectedFrameworks.length > 0) {
      enhanced += `\n\n## Detected Frameworks/Libraries:\n`;
      enhanced += `- **Frameworks**: ${context.frameworkDetection.detectedFrameworks.join(', ')}\n`;
      enhanced += `- **Detection Method**: ${context.frameworkDetection.detectionMethod}\n`;
      enhanced += `- **Confidence**: ${(context.frameworkDetection.confidence * 100).toFixed(1)}%\n`;
      if (context.frameworkDetection.suggestions.length > 0) {
        enhanced += `- **Suggestions**: ${context.frameworkDetection.suggestions.join(', ')}\n`;
      }
    }
    
    // Add quality requirements if detected (skip for simple prompts)
    if (complexity?.level !== 'simple' && context.qualityRequirements && context.qualityRequirements.length > 0) {
      const qualityFormatted = this.formatQualityRequirements(context.qualityRequirements);
      if (qualityFormatted) {
        enhanced += `\n\n${qualityFormatted}`;
      }
    }
    
    // Add Context7 documentation if available (with smart truncation)
    if (context.context7Docs) {
      const maxTokens = complexity?.level === 'simple' ? 200 : 
                       complexity?.level === 'medium' ? 500 : 800;
      const smartTruncatedDocs = this.smartTruncateContent(
        context.context7Docs, 
        maxTokens, 
        enhanced
      );
      enhanced += `\n\n## Framework Best Practices:\n${smartTruncatedDocs}`;
    }
    
    // Add framework-specific documentation if available
    if (context.frameworkDocs && context.frameworkDocs.length > 0) {
      enhanced += `\n\n## Framework-Specific Best Practices:\n${context.frameworkDocs.join('\n')}`;
    }
    
    // Add project documentation if available
    if (context.projectDocs && context.projectDocs.length > 0) {
      enhanced += `\n\n## Project Documentation:\n${context.projectDocs.join('\n')}`;
    }
    
    // Add repository context
    if (context.repoFacts.length > 0) {
      enhanced += `\n\n## Repository Context:\n${context.repoFacts.join('\n')}`;
    }
    
    // Add existing code patterns if available (with smart truncation)
    if (context.codeSnippets.length > 0) {
      const codeContent = context.codeSnippets.join('\n\n');
      const maxTokens = complexity?.level === 'simple' ? 200 : 
                       complexity?.level === 'medium' ? 400 : 600;
      const smartTruncatedCode = this.smartTruncateContent(
        codeContent, 
        maxTokens, 
        enhanced
      );
      enhanced += `\n\n## Existing Code Patterns:\n\`\`\`typescript\n${smartTruncatedCode}\n\`\`\``;
    }
    
    // Add final instructions
    enhanced += `\n\n## Instructions:\nMake your response consistent with the project's existing patterns, best practices, and coding standards. Use the provided context to ensure your solution fits well with the existing codebase.`;
    
    return enhanced;
  }

  /**
   * Smart content truncation with relevance scoring
   * Implements intelligent content filtering and prioritization
   */
  smartTruncateContent(content: string, maxTokens: number, prompt: string): string {
    if (!content || content.length === 0) return content;
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = this.countTokens(content);
    
    if (estimatedTokens <= maxTokens) {
      this.logTokenUsage('smart_truncate', content, maxTokens, prompt);
      return content;
    }
    
    // Extract key sections based on prompt relevance
    const promptKeywords = this.extractKeywords(prompt);
    const sections = this.splitIntoSections(content);
    const scoredSections = this.scoreSections(sections, promptKeywords);
    
    // Select highest scoring sections within token limit
    const selectedSections = this.selectSectionsWithinLimit(scoredSections, maxTokens);
    const result = selectedSections.join('\n\n');
    
    // Log token usage for monitoring
    this.logTokenUsage('smart_truncate', result, maxTokens, prompt);
    
    return result;
  }

  /**
   * Format quality requirements for display
   * Implements user-friendly formatting with priority indicators
   */
  formatQualityRequirements(requirements: any[]): string {
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
   * Extract keywords from prompt for relevance scoring
   * Used for content prioritization and smart truncation
   */
  private extractKeywords(prompt: string): string[] {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
    
    // Remove duplicates and return
    return [...new Set(words)];
  }

  /**
   * Check if a word is a stop word (common words that don't add meaning)
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'for', 'with', 'from', 'this', 'that', 'these', 'those',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'you',
      'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    
    return stopWords.has(word);
  }

  /**
   * Split content into logical sections for processing
   * Implements intelligent content segmentation
   */
  private splitIntoSections(content: string): string[] {
    // Split by common section markers
    const sectionMarkers = [
      /\n## /g,
      /\n### /g,
      /\n#### /g,
      /\n- /g,
      /\n\* /g,
      /\n\d+\. /g
    ];
    
    let sections = [content];
    
    for (const marker of sectionMarkers) {
      const newSections: string[] = [];
      for (const section of sections) {
        const parts = section.split(marker);
        if (parts.length > 1) {
          newSections.push(...parts.filter(part => part.trim().length > 0));
        } else {
          newSections.push(section);
        }
      }
      sections = newSections;
    }
    
    return sections.filter(section => section.trim().length > 0);
  }

  /**
   * Score sections based on keyword relevance
   * Implements intelligent content scoring for prioritization
   */
  private scoreSections(sections: string[], keywords: string[]): Array<{ content: string; score: number; tokens: number }> {
    return sections.map(section => {
      const sectionLower = section.toLowerCase();
      let score = 0;
      
      // Score based on keyword matches
      for (const keyword of keywords) {
        const matches = (sectionLower.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 2; // Weight keyword matches
      }
      
      // Boost score for code examples and practical content
      if (section.includes('```') || section.includes('example') || section.includes('usage')) {
        score += 5;
      }
      
      // Boost score for API references and methods
      if (section.includes('function') || section.includes('method') || section.includes('API')) {
        score += 3;
      }
      
      // Boost score for configuration and setup
      if (section.includes('config') || section.includes('setup') || section.includes('install')) {
        score += 2;
      }
      
      // Boost score for troubleshooting and common issues
      if (section.includes('error') || section.includes('issue') || section.includes('problem')) {
        score += 2;
      }
      
      // Calculate token count for this section
      const tokens = this.countTokens(section);
      
      return { content: section, score, tokens };
    });
  }

  /**
   * Select sections within token limit based on scores
   * Implements optimal content selection algorithm
   */
  private selectSectionsWithinLimit(
    scoredSections: Array<{ content: string; score: number; tokens: number }>,
    maxTokens: number
  ): string[] {
    // Sort by score (highest first)
    const sortedSections = scoredSections.sort((a, b) => b.score - a.score);
    
    const selectedSections: string[] = [];
    let totalTokens = 0;
    
    for (const section of sortedSections) {
      if (totalTokens + section.tokens <= maxTokens) {
        selectedSections.push(section.content);
        totalTokens += section.tokens;
      } else {
        // Try to fit partial content if we have space
        const remainingTokens = maxTokens - totalTokens;
        if (remainingTokens > 100) { // Only if we have meaningful space left
          const partialContent = this.truncateToTokens(section.content, remainingTokens);
          if (partialContent.trim().length > 0) {
            selectedSections.push(partialContent);
          }
        }
        break;
      }
    }
    
    return selectedSections;
  }

  /**
   * Truncate content to specific token count
   * Implements safe content truncation
   */
  private truncateToTokens(content: string, maxTokens: number): string {
    const estimatedChars = maxTokens * 4; // Rough approximation
    if (content.length <= estimatedChars) {
      return content;
    }
    
    // Find a good breaking point (end of sentence or word)
    let truncated = content.substring(0, estimatedChars);
    const lastSentence = truncated.lastIndexOf('.');
    const lastWord = truncated.lastIndexOf(' ');
    
    if (lastSentence > estimatedChars * 0.8) {
      return truncated.substring(0, lastSentence + 1);
    } else if (lastWord > estimatedChars * 0.8) {
      return truncated.substring(0, lastWord) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Count tokens in content (rough approximation)
   * Implements token counting for content optimization
   */
  private countTokens(content: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    // This is a simplified version - in production, you might want to use a proper tokenizer
    return Math.ceil(content.length / 4);
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
   * Log token usage for monitoring
   * Implements usage tracking for optimization
   */
  private logTokenUsage(operation: string, content: string, maxTokens: number, prompt: string): void {
    const actualTokens = this.countTokens(content);
    const efficiency = maxTokens > 0 ? (actualTokens / maxTokens) * 100 : 0;
    
    this.logger.debug('Token usage logged', {
      operation,
      actualTokens,
      maxTokens,
      efficiency: efficiency.toFixed(1) + '%',
      promptLength: prompt.length,
      contentLength: content.length
    });
  }

  /**
   * Prepare enhancement context for AI processing
   * Converts PromptContext to EnhancementContext format
   */
  private prepareEnhancementContext(context: PromptContext, complexity?: PromptComplexity): EnhancementContext {
    // Extract project context from framework detection - include repo facts
    const projectContext: ProjectContext = {
      projectType: this.detectProjectType(context),
      framework: context.frameworkDetection?.detectedFrameworks?.[0] || 'Unknown',
      language: this.detectLanguage(context),
      architecture: 'Unknown',
      patterns: this.extractPatterns(context),
      conventions: this.extractConventions(context),
      dependencies: this.extractDependencies(context),
      environment: 'development',
      // Include repository facts for project-specific context
      repositoryFacts: context.repoFacts || []
    };

    // Extract framework context - include Context7 docs
    const frameworkContext: FrameworkContext = {
      framework: context.frameworkDetection?.detectedFrameworks?.[0] || 'Unknown',
      version: 'Unknown',
      bestPractices: this.extractBestPractices(context),
      commonPatterns: this.extractCommonPatterns(context),
      antiPatterns: [],
      performanceTips: [],
      securityConsiderations: [],
      testingApproaches: [],
      // Include Context7 documentation for latest framework info
      context7Documentation: context.context7Docs || ''
    };

    // Extract quality requirements
    const qualityRequirements: QualityRequirements = {
      accessibility: this.hasQualityRequirement(context, 'accessibility'),
      performance: this.hasQualityRequirement(context, 'performance'),
      security: this.hasQualityRequirement(context, 'security'),
      testing: this.hasQualityRequirement(context, 'testing'),
      documentation: this.hasQualityRequirement(context, 'documentation'),
      maintainability: this.hasQualityRequirement(context, 'maintainability'),
      scalability: this.hasQualityRequirement(context, 'scalability'),
      userExperience: this.hasQualityRequirement(context, 'userExperience')
    };

    // Extract code snippets
    const codeSnippets: CodeSnippet[] = context.codeSnippets.map((snippet, index) => ({
      content: snippet,
      language: this.detectCodeLanguage(snippet),
      purpose: 'example',
      relevance: 0.8,
      location: `snippet_${index}`
    }));

    // Extract documentation context - include ALL available docs
    const documentationContext: DocumentationContext = {
      apiDocs: context.frameworkDocs || [],
      guides: context.projectDocs || [],
      examples: context.codeSnippets || [],
      tutorials: context.context7Docs ? [context.context7Docs] : [],
      troubleshooting: []
    };

    // Default user preferences
    const userPreferences: UserPreferences = {
      codingStyle: 'functional',
      verbosity: complexity?.level === 'simple' ? 'concise' : 'detailed',
      focus: 'quality',
      experience: 'intermediate'
    };

    return {
      projectContext,
      frameworkContext,
      qualityRequirements,
      codeSnippets,
      documentation: documentationContext,
      userPreferences
    };
  }

  /**
   * Create enhancement options based on complexity
   */
  private createEnhancementOptions(complexity?: PromptComplexity): EnhancementOptions {
    const maxTokens = complexity?.level === 'simple' ? 1000 : 
                     complexity?.level === 'medium' ? 2000 : 3000;

    return {
      strategy: {
        type: 'general',
        focus: ['clarity', 'actionability'],
        approach: 'comprehensive',
        priority: 'quality'
      },
      qualityThreshold: 0.8,
      maxTokens,
      temperature: 0.3,
      includeExamples: true,
      includeBestPractices: true,
      includeAntiPatterns: false,
      includePerformanceTips: true,
      includeSecurityConsiderations: true,
      includeTestingApproaches: true
    };
  }

  /**
   * Create enhancement goals based on prompt and context
   */
  private createEnhancementGoals(originalPrompt: string, context: PromptContext): EnhancementGoals {
    return {
      primary: 'Enhance prompt clarity and actionability',
      secondary: [
        'Integrate framework-specific best practices',
        'Apply quality requirements',
        'Provide specific implementation guidance'
      ],
      constraints: [
        'Maintain original intent',
        'Use appropriate technical terminology',
        'Ensure implementable solutions'
      ],
      successCriteria: [
        'Enhanced prompt is more specific than original',
        'Includes relevant technical context',
        'Provides clear implementation steps'
      ],
      expectedOutcome: 'A more actionable and context-aware prompt that leads to better implementation results'
    };
  }

  /**
   * Detect project type from context
   */
  private detectProjectType(context: PromptContext): 'frontend' | 'backend' | 'fullstack' | 'library' | 'mobile' | 'desktop' | 'cli' | 'other' {
    const frameworks = context.frameworkDetection?.detectedFrameworks || [];
    
    if (frameworks.some(f => ['react', 'vue', 'angular', 'svelte'].includes(f.toLowerCase()))) {
      return 'frontend';
    }
    
    if (frameworks.some(f => ['express', 'fastify', 'koa', 'nest'].includes(f.toLowerCase()))) {
      return 'backend';
    }
    
    if (frameworks.some(f => ['next', 'nuxt', 'sveltekit'].includes(f.toLowerCase()))) {
      return 'fullstack';
    }
    
    return 'other';
  }

  /**
   * Detect programming language from context
   */
  private detectLanguage(context: PromptContext): string {
    const frameworks = context.frameworkDetection?.detectedFrameworks || [];
    
    if (frameworks.some(f => ['react', 'vue', 'angular', 'svelte'].includes(f.toLowerCase()))) {
      return 'typescript';
    }
    
    if (frameworks.some(f => ['express', 'fastify', 'koa'].includes(f.toLowerCase()))) {
      return 'javascript';
    }
    
    return 'typescript';
  }

  /**
   * Extract patterns from context
   */
  private extractPatterns(context: PromptContext): string[] {
    const patterns: string[] = [];
    
    if (context.codeSnippets.some(snippet => snippet.includes('useState'))) {
      patterns.push('React Hooks');
    }
    
    if (context.codeSnippets.some(snippet => snippet.includes('computed'))) {
      patterns.push('Vue Composition API');
    }
    
    if (context.codeSnippets.some(snippet => snippet.includes('@Component'))) {
      patterns.push('Angular Components');
    }
    
    return patterns;
  }

  /**
   * Extract conventions from context
   */
  private extractConventions(context: PromptContext): string[] {
    const conventions: string[] = [];
    
    if (context.codeSnippets.some(snippet => snippet.includes('camelCase'))) {
      conventions.push('camelCase naming');
    }
    
    if (context.codeSnippets.some(snippet => snippet.includes('PascalCase'))) {
      conventions.push('PascalCase for components');
    }
    
    return conventions;
  }

  /**
   * Extract dependencies from context
   */
  private extractDependencies(context: PromptContext): string[] {
    return context.frameworkDetection?.detectedFrameworks || [];
  }

  /**
   * Extract best practices from context
   */
  private extractBestPractices(context: PromptContext): string[] {
    const practices: string[] = [];
    
    if (context.context7Docs) {
      practices.push('Framework-specific best practices from documentation');
    }
    
    if (context.frameworkDocs && context.frameworkDocs.length > 0) {
      practices.push('Framework-specific patterns and conventions');
    }
    
    return practices;
  }

  /**
   * Extract common patterns from context
   */
  private extractCommonPatterns(context: PromptContext): string[] {
    const patterns: string[] = [];
    
    if (context.codeSnippets.some(snippet => snippet.includes('function'))) {
      patterns.push('Functional programming patterns');
    }
    
    if (context.codeSnippets.some(snippet => snippet.includes('class'))) {
      patterns.push('Object-oriented patterns');
    }
    
    return patterns;
  }

  /**
   * Check if quality requirement is present
   */
  private hasQualityRequirement(context: PromptContext, requirement: string): boolean {
    if (!context.qualityRequirements || context.qualityRequirements.length === 0) {
      return false;
    }
    
    return context.qualityRequirements.some(req => 
      req.type?.toLowerCase().includes(requirement.toLowerCase()) ||
      req.description?.toLowerCase().includes(requirement.toLowerCase())
    );
  }

  /**
   * Detect code language from snippet
   */
  private detectCodeLanguage(snippet: string): string {
    if (snippet.includes('import') && snippet.includes('from')) {
      return 'typescript';
    }
    
    if (snippet.includes('const') && snippet.includes('=>')) {
      return 'javascript';
    }
    
    if (snippet.includes('<div') && snippet.includes('className')) {
      return 'jsx';
    }
    
    if (snippet.includes('<template') && snippet.includes('v-')) {
      return 'vue';
    }
    
    return 'typescript';
  }
}
