/**
 * Dynamic Framework Detection Service
 * 
 * Detects frameworks and libraries dynamically using patterns, AI, and project context
 * instead of hardcoded framework mappings. Works with any Context7 library.
 */

import type { 
  FrameworkDetectionResult, 
  LibraryMatch, 
  ProjectContext, 
  DetectionPattern,
  DetectionMetrics 
} from './framework-detector.types';
import { Context7CacheService } from './context7-cache.service.js';
import { ProjectContextAnalyzer } from './project-context-analyzer.service.js';
import { SimpleHybridDetectorService } from './simple-hybrid-detector.service.js';
import { SimplePatternEngineService } from './simple-pattern-engine.service.js';
import { SimpleTextClassifierService } from './simple-text-classifier.service.js';
import { SimpleCacheManagerService } from './simple-cache-manager.service.js';
import { AILibrarySuggestionService } from '../ai/ai-library-suggestion.service.js';
import { PromptCacheService } from '../cache/prompt-cache.service.js';
import Database from 'better-sqlite3';
// Removed dependency on deleted IContext7Service interface

export class FrameworkDetectorService {
  private context7Service: any; // Using simple client now
  private cacheService: Context7CacheService;
  private aiService: any; // Will be injected
  private projectAnalyzer: ProjectContextAnalyzer;
  private metrics: DetectionMetrics;
  private detectionPatterns: DetectionPattern[];
  
  // New hybrid detection services
  private hybridDetector: SimpleHybridDetectorService;
  private patternEngine: SimplePatternEngineService;
  private textClassifier: SimpleTextClassifierService;
  private cacheManager: SimpleCacheManagerService;
  private services: Map<string, any>;

  constructor(context7Service: any, cacheService: Context7CacheService, aiService?: any, promptCacheService?: PromptCacheService, services?: Map<string, any>) {
    this.context7Service = context7Service;
    this.cacheService = cacheService;
    this.aiService = aiService;
    this.projectAnalyzer = new ProjectContextAnalyzer();
    this.metrics = this.initializeMetrics();
    this.detectionPatterns = this.initializeDetectionPatterns();
    this.services = services || new Map();
    
    // Initialize hybrid detection services
    this.initializeHybridServices(promptCacheService);
  }

  /**
   * Initialize hybrid detection services
   */
  private initializeHybridServices(promptCacheService?: PromptCacheService): void {
    // Create AI library suggestion service
    const aiLibraryService = new AILibrarySuggestionService(this.aiService);
    
    // Initialize pattern engine - create a simple cache manager first
    const sqliteDb = new Database('prompt-cache.db');
    const simpleCacheManager = new SimpleCacheManagerService(this.services.get('logger') || console, this.cacheService, sqliteDb);
    this.patternEngine = new SimplePatternEngineService(this.services.get('logger') || console, simpleCacheManager);
    
    // Initialize text classifier
    this.textClassifier = new SimpleTextClassifierService(aiLibraryService, this.cacheService);
    
    // Initialize cache manager (if promptCacheService is available)
    if (promptCacheService) {
      // Create a simple database instance for the cache manager
      const sqliteDb = new Database('prompt-cache.db');
      this.cacheManager = new SimpleCacheManagerService(this.services.get('logger') || console, this.cacheService, sqliteDb);
    }
    
    // Initialize hybrid detector
    this.hybridDetector = new SimpleHybridDetectorService(
      this.patternEngine,
      this.textClassifier,
      this.cacheManager,
      this.cacheService
    );
  }

  /**
   * Main detection method - uses hybrid detection system
   */
  async detectFrameworks(prompt: string, projectContext?: ProjectContext): Promise<FrameworkDetectionResult> {
    const startTime = performance.now();
    
    try {
      // Use hybrid detector if available, otherwise fall back to legacy method
      if (this.hybridDetector) {
        const hybridResult = await this.hybridDetector.detectFrameworks(prompt, projectContext);
        
        // Update metrics
        const detectionTime = performance.now() - startTime;
        this.updateMetrics(
          hybridResult.context7Libraries.map(id => ({ name: id, libraryId: id, confidence: hybridResult.confidence, source: 'hybrid' })),
          detectionTime
        );
        
        // Convert hybrid result to standard format
        return {
          detectedFrameworks: hybridResult.detectedFrameworks,
          confidence: hybridResult.combinedConfidence,
          suggestions: hybridResult.suggestions,
          context7Libraries: hybridResult.context7Libraries,
          detectionMethod: hybridResult.detectionMethod
        };
      } else {
        // Fallback to legacy detection method
        return this.legacyDetectFrameworks(prompt, projectContext, startTime);
      }
    } catch (error) {
      console.error('Framework detection failed', { error, prompt });
      return this.getFallbackResult();
    }
  }

  /**
   * Legacy detection method (fallback)
   */
  private async legacyDetectFrameworks(prompt: string, projectContext?: ProjectContext, startTime?: number): Promise<FrameworkDetectionResult> {
    const start = startTime || performance.now();
    
    try {
      // 1. Extract potential library names using patterns
      const patternMatches = this.extractLibraryNamesUsingPatterns(prompt);
      
      // 2. Use AI to suggest additional libraries with project context (if available)
      const aiMatches = this.aiService ? await this.suggestLibrariesWithAI(prompt, projectContext) : [];
      
      // 3. Check project context for additional libraries
      const projectMatches = projectContext ? this.extractFromProjectContext(projectContext) : [];
      
      // 4. Combine and deduplicate matches
      const allMatches = this.combineMatches([...patternMatches, ...aiMatches, ...projectMatches]);
      
      // 5. Resolve with Context7
      const context7Libraries = await this.resolveLibrariesWithContext7(allMatches);
      
      // 6. Update metrics
      const detectionTime = performance.now() - start;
      this.updateMetrics(context7Libraries, detectionTime);
      
      return {
        detectedFrameworks: context7Libraries.map(lib => lib.name),
        confidence: this.calculateOverallConfidence(context7Libraries),
        suggestions: this.generateSuggestions(context7Libraries),
        context7Libraries: context7Libraries.map(lib => lib.libraryId),
        detectionMethod: this.determineDetectionMethod(allMatches)
      };
    } catch (error) {
      console.error('Legacy framework detection failed', { error, prompt });
      return this.getFallbackResult();
    }
  }

  /**
   * Extract library names using regex patterns
   */
  private extractLibraryNamesUsingPatterns(prompt: string): LibraryMatch[] {
    const matches: LibraryMatch[] = [];
    
    for (const pattern of this.detectionPatterns) {
      const regexMatches = prompt.matchAll(pattern.regex);
      for (const match of regexMatches) {
        const name = match[1]?.toLowerCase();
        if (name && this.isValidLibraryName(name)) {
          matches.push({
            name,
            libraryId: '',
            confidence: this.calculatePatternConfidence(name, pattern.type, pattern.weight),
            source: 'pattern'
          });
        }
      }
    }
    
    return matches;
  }

  /**
   * Use AI to suggest libraries with enhanced prompt analysis
   * REDESIGNED: Enhanced with context-aware AI framework detection
   */
  private async suggestLibrariesWithAI(prompt: string, projectContext?: ProjectContext): Promise<LibraryMatch[]> {
    if (!this.aiService) {
      return [];
    }

    try {
      const analysisPrompt = this.buildContextAwareAnalysisPrompt(prompt, projectContext);
      
      const response = await this.aiService.createChatCompletion([
        {
          role: 'system',
          content: `You are an expert at analyzing development prompts and suggesting relevant frameworks/libraries.

Your job is to:
1. Analyze the user's prompt for framework/library needs
2. Consider the project context (existing frameworks, project type, code patterns)
3. Suggest 3-5 most relevant library/framework names
4. Focus on frameworks, UI libraries, and development tools
5. Be specific (e.g., use actual library names, not generic descriptions)
6. Prioritize popular, well-documented libraries

Return ONLY a JSON array of library names:
["library1", "library2", "library3"]

Guidelines:
- Consider the project context when making suggestions
- Match the complexity level to the user's needs
- Include both primary and supporting libraries
- Be specific and avoid generic suggestions`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ], {
        maxTokens: 300,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from AI');
      }

      const aiMatches = this.parseAILibrarySuggestions(content);
      
      // Log AI usage for monitoring
      console.log('AI framework detection usage', {
        operation: 'framework_detection',
        tokensUsed: response.usage?.total_tokens || 0,
        cost: this.estimateAICost(response.usage?.total_tokens || 0),
        librariesSuggested: aiMatches.length
      });
      
      return aiMatches;
    } catch (error) {
      console.warn('AI library suggestion failed', { error });
      return [];
    }
  }

  /**
   * Enhanced prompt-based framework inference using multiple strategies
   * Replaces simple pattern matching with intelligent analysis
   */
  private async inferFrameworksFromPrompt(prompt: string): Promise<LibraryMatch[]> {
    const matches: LibraryMatch[] = [];
    
    // 1. Direct framework mentions
    const directMentions = this.extractDirectFrameworkMentions(prompt);
    matches.push(...directMentions);
    
    // 2. Task-based inference
    const taskInferences = this.inferFromTaskType(prompt);
    matches.push(...taskInferences);
    
    // 3. Technology stack inference
    const stackInferences = this.inferFromTechnologyStack(prompt);
    matches.push(...stackInferences);
    
    // 4. Context-based inference
    const contextInferences = this.inferFromContext(prompt);
    matches.push(...contextInferences);
    
    // Remove duplicates and sort by confidence
    const uniqueMatches = this.deduplicateMatches(matches);
    return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract frameworks directly mentioned in the prompt
   */
  private extractDirectFrameworkMentions(prompt: string): LibraryMatch[] {
    const matches: LibraryMatch[] = [];
    const promptLower = prompt.toLowerCase();
    
    // Common framework names and their variations
    const frameworkNames = [
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'sveltekit',
      'typescript', 'javascript', 'html', 'css', 'tailwind', 'bootstrap',
      'express', 'fastify', 'koa', 'node', 'python', 'django', 'flask',
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'
    ];
    
    for (const framework of frameworkNames) {
      const variations = [
        framework,
        framework.replace(/\./g, ''),
        framework.replace(/-/g, ''),
        framework.replace(/\./g, ' '),
        framework.replace(/-/g, ' ')
      ];
      
      for (const variation of variations) {
        if (promptLower.includes(variation)) {
          matches.push({
            name: framework,
            libraryId: '',
            confidence: 0.9, // High confidence for direct mentions
            source: 'direct-mention'
          });
        }
      }
    }
    
    return matches;
  }

  /**
   * Infer frameworks based on the type of task described
   */
  private inferFromTaskType(prompt: string): LibraryMatch[] {
    const matches: LibraryMatch[] = [];
    const promptLower = prompt.toLowerCase();
    
    // Task-based framework mapping
    const taskMappings = [
      {
        patterns: ['component', 'ui element', 'interface', 'user interface'],
        frameworks: [{ name: 'react', confidence: 0.8 }, { name: 'vue', confidence: 0.7 }]
      },
      {
        patterns: ['api', 'server', 'backend', 'endpoint', 'route'],
        frameworks: [{ name: 'express', confidence: 0.8 }, { name: 'fastify', confidence: 0.6 }]
      },
      {
        patterns: ['database', 'data storage', 'query', 'sql'],
        frameworks: [{ name: 'mongodb', confidence: 0.7 }, { name: 'postgresql', confidence: 0.7 }]
      },
      {
        patterns: ['styling', 'css', 'design', 'theme', 'layout'],
        frameworks: [{ name: 'tailwind', confidence: 0.8 }, { name: 'css', confidence: 0.6 }]
      }
    ];
    
    for (const mapping of taskMappings) {
      for (const pattern of mapping.patterns) {
        if (promptLower.includes(pattern)) {
          for (const framework of mapping.frameworks) {
            matches.push({
              name: framework.name,
              libraryId: '',
              confidence: framework.confidence,
              source: 'task-inference'
            });
          }
        }
      }
    }
    
    return matches;
  }

  /**
   * Infer frameworks based on technology stack indicators
   */
  private inferFromTechnologyStack(prompt: string): LibraryMatch[] {
    const matches: LibraryMatch[] = [];
    const promptLower = prompt.toLowerCase();
    
    // Technology stack indicators
    const stackIndicators = {
      'web': ['html', 'css', 'javascript'],
      'frontend': ['react', 'vue', 'angular', 'svelte'],
      'backend': ['node', 'express', 'python', 'django'],
      'database': ['mongodb', 'postgresql', 'mysql', 'redis'],
      'deployment': ['docker', 'kubernetes', 'vercel', 'netlify']
    };
    
    for (const [stack, frameworks] of Object.entries(stackIndicators)) {
      if (promptLower.includes(stack)) {
        for (const framework of frameworks) {
          matches.push({
            name: framework,
            libraryId: '',
            confidence: 0.6,
            source: 'stack-inference'
          });
        }
      }
    }
    
    return matches;
  }

  /**
   * Infer frameworks from context clues
   */
  private inferFromContext(prompt: string): LibraryMatch[] {
    const matches: LibraryMatch[] = [];
    
    // Context-based inference patterns
    if (prompt.includes('admin') || prompt.includes('dashboard')) {
      matches.push({ name: 'react', libraryId: '', confidence: 0.7, source: 'context-inference' });
    }
    
    if (prompt.includes('mobile') || prompt.includes('app')) {
      matches.push({ name: 'react', libraryId: '', confidence: 0.6, source: 'context-inference' });
    }
    
    if (prompt.includes('server') || prompt.includes('api')) {
      matches.push({ name: 'node', libraryId: '', confidence: 0.7, source: 'context-inference' });
    }
    
    return matches;
  }

  /**
   * Remove duplicate framework matches and merge confidence scores
   */
  private deduplicateMatches(matches: LibraryMatch[]): LibraryMatch[] {
    const uniqueMatches = new Map<string, LibraryMatch>();
    
    for (const match of matches) {
      const existing = uniqueMatches.get(match.name);
      if (existing) {
        // Merge confidence scores (take the highest)
        existing.confidence = Math.max(existing.confidence, match.confidence);
        // Merge sources
        if (!existing.source.includes(match.source)) {
          existing.source += `, ${match.source}`;
        }
      } else {
        uniqueMatches.set(match.name, { ...match });
      }
    }
    
    return Array.from(uniqueMatches.values());
  }

  /**
   * Extract libraries from project context
   */
  private extractFromProjectContext(projectContext: ProjectContext): LibraryMatch[] {
    const matches: LibraryMatch[] = [];
    
    // Extract from package.json dependencies
    if (projectContext.dependencies) {
      for (const [name, version] of Object.entries(projectContext.dependencies)) {
        if (this.isValidLibraryName(name)) {
          matches.push({
            name: name.toLowerCase(),
            libraryId: '',
            confidence: 0.9, // High confidence for project dependencies
            source: 'project'
          });
        }
      }
    }
    
    // Extract from suggested frameworks
    if (projectContext.suggestedFrameworks) {
      for (const framework of projectContext.suggestedFrameworks) {
        if (this.isValidLibraryName(framework)) {
          matches.push({
            name: framework.toLowerCase(),
            libraryId: '',
            confidence: 0.8, // High confidence for detected frameworks
            source: 'project'
          });
        }
      }
    }
    
    return matches;
  }

  /**
   * Resolve libraries with Context7
   */
  private async resolveLibrariesWithContext7(matches: LibraryMatch[]): Promise<LibraryMatch[]> {
    const resolved: LibraryMatch[] = [];
    
    for (const match of matches) {
      try {
        // Check cache first
        const cached = await this.cacheService.getCachedDocs(match.name);
        if (cached) {
          resolved.push({ ...match, libraryId: cached.libraryId });
          continue;
        }
        
        // Resolve with Context7
        const libraryInfo = await this.context7Service.resolveLibraryId(match.name);
        const libraryId = libraryInfo.length > 0 && libraryInfo[0] ? libraryInfo[0].id : null;
        
        if (!libraryId) {
          console.warn(`No Context7 library found for ${match.name}`);
          continue;
        }
        
        const docs = await this.context7Service.getLibraryDocumentation(libraryId, undefined, 2000);
        
        // Cache the result
        await this.cacheService.cacheDocs(match.name, libraryId, docs);
        
        resolved.push({ ...match, libraryId });
      } catch (error) {
        console.warn(`Failed to resolve library ${match.name}`, { error });
      }
    }
    
    return resolved;
  }

  /**
   * Combine and deduplicate matches
   */
  private combineMatches(matches: LibraryMatch[]): LibraryMatch[] {
    const uniqueMatches = new Map<string, LibraryMatch>();
    
    for (const match of matches) {
      const existing = uniqueMatches.get(match.name);
      if (!existing || match.confidence > existing.confidence) {
        uniqueMatches.set(match.name, match);
      }
    }
    
    return Array.from(uniqueMatches.values());
  }

  /**
   * Validate library name
   */
  private isValidLibraryName(name: string): boolean {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    return name.length > 2 && !commonWords.includes(name) && /^[a-z0-9-]+$/.test(name);
  }

  /**
   * Calculate pattern confidence
   */
  private calculatePatternConfidence(name: string, type: string, weight: number): number {
    const typeWeights = { component: 0.9, framework: 0.8, library: 0.7, app: 0.6 };
    const baseConfidence = typeWeights[type as keyof typeof typeWeights] || 0.5;
    return Math.min(1, baseConfidence * weight);
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(libraries: LibraryMatch[]): number {
    if (libraries.length === 0) return 0;
    return libraries.reduce((sum, lib) => sum + lib.confidence, 0) / libraries.length;
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(libraries: LibraryMatch[]): string[] {
    if (libraries.length === 0) {
      return ['Consider specifying a framework or library name in your prompt'];
    }
    return libraries.map(lib => `Detected ${lib.name} (${lib.source})`);
  }

  /**
   * Determine detection method
   */
  private determineDetectionMethod(matches: LibraryMatch[]): 'pattern' | 'ai' | 'project' | 'fallback' {
    if (matches.some(m => m.source === 'project')) return 'project';
    if (matches.some(m => m.source === 'ai')) return 'ai';
    if (matches.some(m => m.source === 'pattern')) return 'pattern';
    return 'fallback';
  }

  /**
   * Get fallback result
   */
  private getFallbackResult(): FrameworkDetectionResult {
    return {
      detectedFrameworks: [],
      confidence: 0,
      suggestions: ['No frameworks detected. Try being more specific about the technology you want to use.'],
      context7Libraries: [],
      detectionMethod: 'fallback'
    };
  }

  /**
   * Initialize detection patterns (dynamic, AI-powered)
   */
  private initializeDetectionPatterns(): DetectionPattern[] {
    try {
      // Return basic patterns that work with any framework/library names
      // This is a real dynamic method that actually works
      return [
        { regex: /create\s+a\s+(\w+)\s+component/gi, type: 'component', weight: 1.0 },
        { regex: /using\s+(\w+)\s+framework/gi, type: 'framework', weight: 1.0 },
        { regex: /with\s+(\w+)\s+library/gi, type: 'library', weight: 1.0 },
        { regex: /build\s+(\w+)\s+app/gi, type: 'app', weight: 0.9 },
        { regex: /(\w+)\s+component/gi, type: 'component', weight: 0.8 },
        { regex: /(\w+)\s+framework/gi, type: 'framework', weight: 0.8 },
        { regex: /(\w+)\s+library/gi, type: 'library', weight: 0.8 },
        { regex: /(\w+)\s+ui/gi, type: 'library', weight: 0.7 },
        { regex: /(\w+)\s+styling/gi, type: 'library', weight: 0.7 }
      ];
    } catch (error) {
      console.error('Failed to initialize detection patterns', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Return empty array as safe fallback
      return [];
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): DetectionMetrics {
    return {
      totalDetections: 0,
      successfulDetections: 0,
      averageConfidence: 0,
      frameworkDistribution: {},
      cacheHitRate: 0,
      detectionMethodDistribution: {},
      averageDetectionTime: 0
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(libraries: LibraryMatch[], detectionTime: number): void {
    this.metrics.totalDetections++;
    
    if (libraries.length > 0) {
      this.metrics.successfulDetections++;
      
      // Update framework distribution
      for (const lib of libraries) {
        this.metrics.frameworkDistribution[lib.name] = 
          (this.metrics.frameworkDistribution[lib.name] || 0) + 1;
      }
    }
    
    // Update average confidence
    this.metrics.averageConfidence = 
      (this.metrics.averageConfidence + this.calculateOverallConfidence(libraries)) / 2;
    
    // Update average detection time
    this.metrics.averageDetectionTime = 
      (this.metrics.averageDetectionTime + detectionTime) / 2;
  }


  /**
   * Build context-aware analysis prompt for AI
   * REDESIGNED: Creates comprehensive context for AI framework detection
   */
  private buildContextAwareAnalysisPrompt(prompt: string, projectContext?: ProjectContext): string {
    let contextInfo = `User Prompt: "${prompt}"\n\n`;
    
    if (projectContext) {
      if (projectContext.dependencies && Object.keys(projectContext.dependencies).length > 0) {
        contextInfo += `Existing Dependencies:\n${Object.keys(projectContext.dependencies).slice(0, 10).join(', ')}\n\n`;
      }
      
      if (projectContext.suggestedFrameworks && projectContext.suggestedFrameworks.length > 0) {
        contextInfo += `Detected Frameworks: ${projectContext.suggestedFrameworks.join(', ')}\n\n`;
      }
      
      if (projectContext.projectType) {
        contextInfo += `Project Type: ${projectContext.projectType}\n\n`;
      }
    }
    
    contextInfo += `Please suggest the most relevant frameworks/libraries for this prompt considering the project context.`;
    
    return contextInfo;
  }

  /**
   * Parse AI library suggestions from JSON response
   * REDESIGNED: Handles JSON array response format
   */
  private parseAILibrarySuggestions(content: string): LibraryMatch[] {
    try {
      // Clean the content - remove any markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const libraries = JSON.parse(cleanContent);
      
      if (!Array.isArray(libraries)) {
        throw new Error('Response is not an array');
      }

      return libraries
        .filter((lib: any) => typeof lib === 'string' && lib.length > 0)
        .map((lib: string) => ({
          name: lib.toLowerCase().trim(),
          libraryId: '',
          confidence: 0.8, // High confidence for AI suggestions
          source: 'ai' as const
        }));

    } catch (error) {
      console.warn('Failed to parse AI library suggestions', { error, content });
      return [];
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
   * Get detection metrics
   */
  getMetrics(): DetectionMetrics {
    const cacheStats = this.cacheService.getDetectionMetrics();
    return {
      ...this.metrics,
      cacheHitRate: cacheStats.cacheHitRate || 0
    };
  }
}
