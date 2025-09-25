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

  constructor(logger: Logger, openAIService?: OpenAIService) {
    this.logger = logger;
    this.openAIService = openAIService;
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
    // Extract project context from framework detection
    const projectContext: ProjectContext = {
      projectType: this.detectProjectType(context),
      framework: context.frameworkDetection?.detectedFrameworks?.[0] || 'Unknown',
      language: this.detectLanguage(context),
      architecture: 'Unknown',
      patterns: this.extractPatterns(context),
      conventions: this.extractConventions(context),
      dependencies: this.extractDependencies(context),
      environment: 'development'
    };

    // Extract framework context
    const frameworkContext: FrameworkContext = {
      framework: context.frameworkDetection?.detectedFrameworks?.[0] || 'Unknown',
      version: 'Unknown',
      bestPractices: this.extractBestPractices(context),
      commonPatterns: this.extractCommonPatterns(context),
      antiPatterns: [],
      performanceTips: [],
      securityConsiderations: [],
      testingApproaches: []
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

    // Extract documentation context
    const documentationContext: DocumentationContext = {
      apiDocs: context.frameworkDocs || [],
      guides: [],
      examples: [],
      tutorials: [],
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
