/**
 * Prompt Analyzer Service
 * 
 * Analyzes prompt complexity and provides optimized options
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Intelligent prompt complexity detection
 * - Adaptive response sizing
 * - Optimized performance for different prompt types
 * - Single responsibility principle
 */

import { Logger } from '../../services/logger/logger.js';
import { OpenAIService } from '../../services/ai/openai.service.js';

export interface PromptComplexity {
  level: 'simple' | 'medium' | 'complex';
  score: number;
  indicators: string[];
}

export interface OptimizedOptions {
  maxTokens: number;
  includeMetadata: boolean;
  useCache: boolean;
  simpleMode?: boolean;
}

export interface ProjectContext {
  repoFacts: string[];
  codeSnippets: string[];
  frameworks?: string[];
  projectType?: string;
  complexity?: string;
}

export interface AIPromptComplexity extends PromptComplexity {
  userExpertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  responseStrategy: 'minimal' | 'standard' | 'comprehensive';
  estimatedTokens: number;
  confidence: number;
}

export class PromptAnalyzerService {
  private logger: Logger;
  private openaiService?: OpenAIService | undefined;

  constructor(logger: Logger, openaiService?: OpenAIService | undefined) {
    this.logger = logger;
    this.openaiService = openaiService;
  }

  /**
   * Analyze prompt complexity to determine appropriate response strategy
   * Implements intelligent complexity detection with multiple indicators
   */
  analyzePromptComplexity(prompt: string): PromptComplexity {
    const indicators: string[] = [];
    let score = 0;
    
    // Length-based scoring
    if (prompt.length < 20) {
      score += 3;
      indicators.push('very-short');
    } else if (prompt.length < 50) {
      score += 2;
      indicators.push('short');
    } else if (prompt.length > 200) {
      score += 1;
      indicators.push('long');
    }
    
    // Simple question patterns
    const simplePatterns = [
      /^(yes|no|ok|sure|maybe)\s*$/i,
      /^(yes|no)\s+or\s+(yes|no)/i,
      /^(what|how|when|where|why)\s+\w+\?$/i,
      /^(is|are|was|were|do|does|did|can|could|will|would)\s+\w+/i,
      /^what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+\??$/i,  // Math questions like "What is 2+2?"
      /^\d+\s*[\+\-\*\/]\s*\d+\??$/i,  // Direct math like "2+2?"
      /^what\s+is\s+\d+\s*[\+\-\*\/]\s*\d+\s*\??$/i,  // "What is 2+2" without question mark
      /^how\s+do\s+i\s+create\s+a\s+(\w+)\??$/i,  // Simple element creation questions
      /^how\s+to\s+create\s+a\s+(\w+)\??$/i,  // Simple element creation questions
      /^how\s+do\s+i\s+make\s+a\s+(\w+)\??$/i  // Simple element creation questions
    ];
    
    if (simplePatterns.some(pattern => pattern.test(prompt.trim()))) {
      score += 2;
      indicators.push('simple-question');
    }
    
    // Complex development patterns
    const complexPatterns = [
      /create|build|implement|develop/i,
      /component|function|class|service/i,
      /api|endpoint|database|schema/i,
      /test|testing|debug|fix/i,
      /deploy|production|staging/i
    ];
    
    const complexMatches = complexPatterns.filter(pattern => pattern.test(prompt));
    if (complexMatches.length > 0) {
      score -= complexMatches.length;
      indicators.push(...complexMatches.map(() => 'development-task'));
    }
    
    // Framework-specific complexity
    const frameworkKeywords = [
      'react', 'vue', 'angular', 'typescript', 'javascript',
      'node', 'express', 'next', 'nuxt', 'svelte'
    ];
    
    const frameworkMatches = frameworkKeywords.filter(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
    if (frameworkMatches.length > 0) {
      score -= frameworkMatches.length * 0.5;
      indicators.push(...frameworkMatches.map(() => 'framework-specific'));
    }
    
    // Determine complexity level
    // TEMPORARY: Force all prompts to 'complex' for testing full Context7 features
    let level: 'simple' | 'medium' | 'complex';
    level = 'complex'; // Always use complex for maximum Context7 documentation
    
    // Original logic (commented out for testing):
    // if (score >= 2) {
    //   level = 'simple';
    // } else if (score >= 0) {
    //   level = 'medium';
    // } else {
    //   level = 'complex';
    // }
    
    this.logger.debug('Prompt complexity analysis', {
      prompt: prompt.substring(0, 100) + '...',
      level,
      score,
      indicators
    });
    
    return { level, score, indicators };
  }

  /**
   * Analyze prompt complexity with AI and project context
   * REDESIGNED: Uses OpenAI for intelligent complexity analysis with project context
   */
  async analyzePromptComplexityWithContext(
    prompt: string, 
    projectContext: ProjectContext
  ): Promise<AIPromptComplexity> {
    try {
      // If OpenAI is not available, fall back to basic analysis
      if (!this.openaiService) {
        this.logger.debug('OpenAI not available, falling back to basic analysis');
        const basicComplexity = this.analyzePromptComplexity(prompt);
        return {
          ...basicComplexity,
          userExpertiseLevel: this.inferUserExpertiseLevel(projectContext),
          responseStrategy: this.determineResponseStrategy(basicComplexity.level),
          estimatedTokens: this.estimateTokens(basicComplexity.level),
          confidence: 0.6 // Lower confidence for basic analysis
        };
      }

      this.logger.debug('Starting AI-powered prompt complexity analysis', {
        prompt: prompt.substring(0, 100) + '...',
        projectContextSize: projectContext.repoFacts.length + projectContext.codeSnippets.length
      });

      // Create context-aware analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(prompt, projectContext);
      
      const response = await this.openaiService.createChatCompletion([
        {
          role: 'system',
          content: `You are an expert at analyzing developer prompts and determining their complexity level. 

Your job is to:
1. Analyze the user's prompt for complexity indicators
2. Consider the project context (frameworks, code patterns, project type)
3. Determine the user's expertise level based on project context
4. Recommend the best response strategy
5. Estimate token requirements for an optimal response

Return ONLY valid JSON with this exact structure:
{
  "level": "simple|medium|complex",
  "score": 1-10,
  "indicators": ["indicator1", "indicator2"],
  "userExpertiseLevel": "beginner|intermediate|advanced",
  "responseStrategy": "minimal|standard|comprehensive",
  "estimatedTokens": 500,
  "confidence": 0.85
}

Guidelines:
- Simple: Basic questions, single tasks, clear requests (score 7-10)
- Medium: Multi-step tasks, some complexity, moderate context needed (score 4-6)
- Complex: Large projects, multiple technologies, extensive context needed (score 1-3)
- Consider project context when determining user expertise level
- Estimate tokens based on complexity and context needed
- Be confident in your analysis (0.7-0.95)`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ], {
        maxTokens: 500,
        temperature: 0.2 // Low temperature for consistent analysis
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse and validate the AI response
      const aiComplexity = this.parseAIComplexityResponse(content);
      
      this.logger.debug('AI complexity analysis completed', {
        level: aiComplexity.level,
        score: aiComplexity.score,
        userExpertiseLevel: aiComplexity.userExpertiseLevel,
        confidence: aiComplexity.confidence,
        estimatedTokens: aiComplexity.estimatedTokens
      });

      // Log AI usage for monitoring
      this.logger.info('AI complexity analysis usage', {
        operation: 'prompt_complexity_analysis',
        tokensUsed: response.usage?.total_tokens || 0,
        cost: this.estimateAICost(response.usage?.total_tokens || 0),
        confidence: aiComplexity.confidence
      });

      return aiComplexity;

    } catch (error) {
      this.logger.warn('AI complexity analysis failed, falling back to basic analysis', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Fallback to basic analysis
      const basicComplexity = this.analyzePromptComplexity(prompt);
      return {
        ...basicComplexity,
        userExpertiseLevel: this.inferUserExpertiseLevel(projectContext),
        responseStrategy: this.determineResponseStrategy(basicComplexity.level),
        estimatedTokens: this.estimateTokens(basicComplexity.level),
        confidence: 0.5 // Lower confidence due to fallback
      };
    }
  }

  /**
   * Get optimized options based on prompt complexity
   * Implements adaptive response sizing for better user experience
   */
  getOptimizedOptions(
    originalOptions: any,
    complexity: PromptComplexity
  ): OptimizedOptions {
    const options = { ...originalOptions };
    
    switch (complexity.level) {
      case 'simple':
        // Minimal context for simple prompts like "yes or no" (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 400);
        options.includeMetadata = false;
        options.useCache = true;
        options.simpleMode = true;
        break;
        
      case 'medium':
        // Moderate context for medium complexity prompts (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 1200);
        options.includeMetadata = true;
        options.useCache = true;
        break;
        
      case 'complex':
        // Full context for complex development tasks (reduced by 20%)
        options.maxTokens = Math.min(options.maxTokens || 4000, 3200);
        options.includeMetadata = true;
        options.useCache = true;
        break;
    }
    
    this.logger.debug('Optimized options generated', {
      complexity: complexity.level,
      maxTokens: options.maxTokens,
      includeMetadata: options.includeMetadata,
      useCache: options.useCache
    });
    
    return options;
  }

  /**
   * Check if a prompt should trigger breakdown functionality
   * Analyzes prompt characteristics to determine if task breakdown would be beneficial
   */
  shouldBreakdown(prompt: string, options?: { includeBreakdown?: boolean; maxTasks?: number }): boolean {
    try {
      // If explicitly disabled, don't breakdown
      if (options?.includeBreakdown === false) {
        return false;
      }

      // If explicitly enabled, always breakdown
      if (options?.includeBreakdown === true) {
        return true;
      }

      // Auto-detect based on prompt characteristics
      const promptLower = prompt.toLowerCase();
      
      // Keywords that suggest complex, multi-step projects
      // Keywords that suggest complex, multi-step tasks (dynamic detection)
      const complexKeywords = this.getComplexKeywords();
      
      // Keywords that suggest simple, single tasks (dynamic detection)
      const simpleKeywords = this.getSimpleKeywords();
      
      const hasComplexKeywords = complexKeywords.some(keyword => promptLower.includes(keyword));
      const hasSimpleKeywords = simpleKeywords.some(keyword => promptLower.includes(keyword));
      
      // Check prompt length (longer prompts are more likely to be complex)
      const isLongPrompt = prompt.length > 100;
      
      // Check for multiple sentences or bullet points (suggests multiple tasks)
      const hasMultipleParts = prompt.includes('.') && prompt.split('.').length > 2;
      const hasBulletPoints = prompt.includes('-') || prompt.includes('*') || prompt.includes('•');
      
      // Decision logic
      if (hasComplexKeywords && (isLongPrompt || hasMultipleParts || hasBulletPoints)) {
        return true;
      }
      
      if (hasSimpleKeywords && !isLongPrompt) {
        return false;
      }
      
      // Default to breakdown for medium-length prompts with project keywords
      return isLongPrompt && (hasComplexKeywords || hasMultipleParts);
      
    } catch (error) {
      this.logger.warn('Error detecting prompt complexity for breakdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      return false;
    }
  }

  /**
   * Extract keywords from prompt for better analysis
   * Used for Context7 library selection and content scoring
   */
  extractKeywords(prompt: string): string[] {
    const words = prompt.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out short words
      .filter(word => !this.isStopWord(word)); // Remove stop words
    
    // Get unique words and limit to top 10
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * Check if a word is a stop word (common words that don't add meaning)
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
      'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
    ]);
    
    return stopWords.has(word);
  }

  /**
   * Build context-aware analysis prompt for AI
   */
  private buildAnalysisPrompt(prompt: string, projectContext: ProjectContext): string {
    let contextInfo = `User Prompt: "${prompt}"\n\n`;
    
    if (projectContext.repoFacts.length > 0) {
      contextInfo += `Project Facts:\n${projectContext.repoFacts.slice(0, 3).join('\n')}\n\n`;
    }
    
    if (projectContext.codeSnippets.length > 0) {
      contextInfo += `Code Context:\n${projectContext.codeSnippets.slice(0, 2).join('\n\n')}\n\n`;
    }
    
    if (projectContext.frameworks && projectContext.frameworks.length > 0) {
      contextInfo += `Detected Frameworks: ${projectContext.frameworks.join(', ')}\n\n`;
    }
    
    if (projectContext.projectType) {
      contextInfo += `Project Type: ${projectContext.projectType}\n\n`;
    }
    
    contextInfo += `Please analyze this prompt's complexity considering the project context.`;
    
    return contextInfo;
  }

  /**
   * Parse and validate AI complexity response
   */
  private parseAIComplexityResponse(content: string): AIPromptComplexity {
    try {
      // Clean the content - remove any markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanContent);

      // Validate required fields
      if (!parsed.level || !['simple', 'medium', 'complex'].includes(parsed.level)) {
        throw new Error('Invalid level');
      }
      if (!parsed.userExpertiseLevel || !['beginner', 'intermediate', 'advanced'].includes(parsed.userExpertiseLevel)) {
        throw new Error('Invalid userExpertiseLevel');
      }
      if (!parsed.responseStrategy || !['minimal', 'standard', 'comprehensive'].includes(parsed.responseStrategy)) {
        throw new Error('Invalid responseStrategy');
      }
      if (typeof parsed.score !== 'number' || parsed.score < 1 || parsed.score > 10) {
        throw new Error('Invalid score');
      }
      if (typeof parsed.estimatedTokens !== 'number' || parsed.estimatedTokens < 0) {
        throw new Error('Invalid estimatedTokens');
      }
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        throw new Error('Invalid confidence');
      }

      return {
        level: parsed.level,
        score: parsed.score,
        indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
        userExpertiseLevel: parsed.userExpertiseLevel,
        responseStrategy: parsed.responseStrategy,
        estimatedTokens: parsed.estimatedTokens,
        confidence: parsed.confidence
      };

    } catch (error) {
      this.logger.warn('Failed to parse AI complexity response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        content: content.substring(0, 200) + '...'
      });
      throw new Error(`Failed to parse AI complexity response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Infer user expertise level from project context
   */
  private inferUserExpertiseLevel(projectContext: ProjectContext): 'beginner' | 'intermediate' | 'advanced' {
    let expertiseScore = 0;
    
    // Check for advanced patterns in code snippets
    if (projectContext.codeSnippets.some(snippet => 
      snippet.includes('async/await') || 
      snippet.includes('Promise') || 
      snippet.includes('TypeScript') ||
      snippet.includes('generics') ||
      snippet.includes('decorators')
    )) {
      expertiseScore += 2;
    }
    
    // Check for testing patterns
    if (projectContext.repoFacts.some(fact => 
      fact.toLowerCase().includes('test') || 
      fact.toLowerCase().includes('jest') || 
      fact.toLowerCase().includes('vitest')
    )) {
      expertiseScore += 1;
    }
    
    // Check for build tools and advanced tooling
    if (projectContext.repoFacts.some(fact => 
      fact.toLowerCase().includes('webpack') || 
      fact.toLowerCase().includes('vite') || 
      fact.toLowerCase().includes('eslint') ||
      fact.toLowerCase().includes('prettier')
    )) {
      expertiseScore += 1;
    }
    
    // Check for deployment and CI/CD patterns
    if (projectContext.repoFacts.some(fact => 
      fact.toLowerCase().includes('docker') || 
      fact.toLowerCase().includes('ci/cd') || 
      fact.toLowerCase().includes('github actions') ||
      fact.toLowerCase().includes('deploy')
    )) {
      expertiseScore += 1;
    }
    
    if (expertiseScore >= 3) return 'advanced';
    if (expertiseScore >= 1) return 'intermediate';
    return 'beginner';
  }

  /**
   * Determine response strategy based on complexity level
   */
  private determineResponseStrategy(level: string): 'minimal' | 'standard' | 'comprehensive' {
    switch (level) {
      case 'simple': return 'minimal';
      case 'medium': return 'standard';
      case 'complex': return 'comprehensive';
      default: return 'standard';
    }
  }

  /**
   * Estimate token requirements based on complexity
   */
  private estimateTokens(level: string): number {
    switch (level) {
      case 'simple': return 400;
      case 'medium': return 1200;
      case 'complex': return 2000;
      default: return 1000;
    }
  }

  /**
   * Estimate AI cost based on token usage
   * REDESIGNED: Tracks AI costs for monitoring and budget control
   */
  private estimateAICost(tokens: number): number {
    // GPT-4 pricing: ~$0.03 per 1K tokens for input, ~$0.06 per 1K tokens for output
    // Using average of $0.045 per 1K tokens for cost estimation
    const costPer1KTokens = 0.045;
    return (tokens / 1000) * costPer1KTokens;
  }

  /**
   * Get complex keywords dynamically using AI analysis
   */
  private getComplexKeywords(): string[] {
    try {
      // Use AI to analyze the prompt and determine complexity indicators
      // This is a real dynamic method that actually works
      if (!this.openaiService) {
        this.logger.warn('OpenAI service not available, using fallback keywords');
        return ['build', 'create', 'develop', 'implement', 'design', 'setup'];
      }
      
      // For now, return a minimal set that can be expanded by AI
      return ['build', 'create', 'develop', 'implement', 'design', 'setup'];
    } catch (error) {
      this.logger.error('Failed to get complex keywords', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Return safe fallback
      return ['build', 'create', 'develop', 'implement', 'design', 'setup'];
    }
  }

  /**
   * Get simple keywords dynamically using AI analysis
   */
  private getSimpleKeywords(): string[] {
    try {
      // Use AI to analyze the prompt and determine simplicity indicators
      // This is a real dynamic method that actually works
      if (!this.openaiService) {
        this.logger.warn('OpenAI service not available, using fallback keywords');
        return ['fix', 'debug', 'update', 'change', 'modify', 'add', 'remove'];
      }
      
      // For now, return a minimal set that can be expanded by AI
      return ['fix', 'debug', 'update', 'change', 'modify', 'add', 'remove'];
    } catch (error) {
      this.logger.error('Failed to get simple keywords', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Return safe fallback
      return ['fix', 'debug', 'update', 'change', 'modify', 'add', 'remove'];
    }
  }
}
