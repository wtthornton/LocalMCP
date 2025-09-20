/**
 * AI-Powered Library Suggestion Service
 * 
 * Uses AI to suggest relevant libraries and frameworks for any prompt
 * instead of relying on hardcoded framework mappings.
 */

export interface AILibrarySuggestionConfig {
  enabled: boolean;
  timeoutMs: number;
  maxSuggestions: number;
  confidenceThreshold: number;
}

export interface LibrarySuggestion {
  name: string;
  confidence: number;
  reason: string;
  category: 'framework' | 'library' | 'tool' | 'language';
}

export class AILibrarySuggestionService {
  private config: AILibrarySuggestionConfig;
  private aiService: any; // Will be injected

  constructor(aiService: any, config?: Partial<AILibrarySuggestionConfig>) {
    this.aiService = aiService;
    this.config = {
      enabled: true,
      timeoutMs: 5000,
      maxSuggestions: 5,
      confidenceThreshold: 0.7,
      ...config
    };
  }

  /**
   * Suggest libraries using AI analysis
   */
  async suggestLibraries(prompt: string): Promise<LibrarySuggestion[]> {
    if (!this.config.enabled || !this.aiService) {
      return [];
    }

    try {
      const analysisPrompt = this.buildAnalysisPrompt(prompt);
      
      const response = await Promise.race([
        this.aiService.analyze(analysisPrompt),
        this.createTimeoutPromise(this.config.timeoutMs)
      ]);

      return this.parseLibrarySuggestions(response);
    } catch (error) {
      console.warn('AI library suggestion failed', { error, prompt: prompt.substring(0, 100) });
      return [];
    }
  }

  /**
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(prompt: string): string {
    return `
Analyze this development prompt and suggest ${this.config.maxSuggestions} most relevant library/framework names that would provide useful documentation:

Prompt: "${prompt}"

Requirements:
- Return only library names, one per line
- Focus on frameworks, UI libraries, and development tools
- Be specific (e.g., "react" not "javascript framework")
- Consider the context and technology stack
- Prioritize popular, well-documented libraries
- Include confidence score (0-1) and reason for each suggestion

Format each suggestion as:
name|confidence|reason|category

Examples:
- For "create a component" -> react|0.9|Popular component library|framework
- For "build a web app" -> nextjs|0.8|Full-stack React framework|framework
- For "styling" -> tailwindcss|0.9|Utility-first CSS framework|library
- For "API development" -> express|0.8|Node.js web framework|framework
- For "testing" -> jest|0.9|JavaScript testing framework|tool

Categories: framework, library, tool, language
    `.trim();
  }

  /**
   * Parse AI response into structured suggestions
   */
  private parseLibrarySuggestions(response: string): LibrarySuggestion[] {
    const suggestions: LibrarySuggestion[] = [];
    
    const lines = response.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .slice(0, this.config.maxSuggestions);

    for (const line of lines) {
      try {
        const parts = line.split('|');
        if (parts.length >= 4) {
          const [name, confidenceStr, reason, category] = parts;
          const confidence = parseFloat(confidenceStr || '0.5') || 0.5;
          
          if (name && this.isValidLibraryName(name) && confidence >= this.config.confidenceThreshold) {
            suggestions.push({
              name: name.toLowerCase().trim(),
              confidence,
              reason: (reason || '').trim(),
              category: this.validateCategory((category || '').trim())
            });
          }
        } else {
          // Fallback parsing for simple format
          const name = line.replace(/^[-*]\s*/, '').toLowerCase().trim();
          if (this.isValidLibraryName(name)) {
            suggestions.push({
              name,
              confidence: 0.8,
              reason: 'AI suggested',
              category: 'library'
            });
          }
        }
      } catch (error) {
        console.warn('Failed to parse suggestion line', { line, error });
      }
    }

    return suggestions;
  }

  /**
   * Validate library name
   */
  private isValidLibraryName(name: string): boolean {
    const commonWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot', 'cant'
    ];
    
    return name.length > 2 && 
           !commonWords.includes(name) && 
           /^[a-z0-9-]+$/.test(name) &&
           !name.includes(' ') &&
           !name.includes('.');
  }

  /**
   * Validate category
   */
  private validateCategory(category: string): 'framework' | 'library' | 'tool' | 'language' {
    const validCategories = ['framework', 'library', 'tool', 'language'];
    return validCategories.includes(category.toLowerCase()) ? 
      category.toLowerCase() as any : 'library';
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI suggestion timeout')), timeoutMs);
    });
  }

  /**
   * Get service configuration
   */
  getConfig(): AILibrarySuggestionConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<AILibrarySuggestionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.aiService;
  }
}
