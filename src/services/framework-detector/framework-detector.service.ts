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
import type { IContext7Service } from '../context7/context7-service.interface.js';

export class FrameworkDetectorService {
  private context7Service: IContext7Service;
  private cacheService: Context7CacheService;
  private aiService: any; // Will be injected
  private projectAnalyzer: ProjectContextAnalyzer;
  private metrics: DetectionMetrics;
  private detectionPatterns: DetectionPattern[];

  constructor(context7Service: IContext7Service, cacheService: Context7CacheService, aiService?: any) {
    this.context7Service = context7Service;
    this.cacheService = cacheService;
    this.aiService = aiService;
    this.projectAnalyzer = new ProjectContextAnalyzer();
    this.metrics = this.initializeMetrics();
    this.detectionPatterns = this.initializeDetectionPatterns();
  }

  /**
   * Main detection method - detects frameworks dynamically
   */
  async detectFrameworks(prompt: string, projectContext?: ProjectContext): Promise<FrameworkDetectionResult> {
    const startTime = performance.now();
    
    try {
      // 1. Extract potential library names using patterns
      const patternMatches = this.extractLibraryNamesUsingPatterns(prompt);
      
      // 2. Use AI to suggest additional libraries (if available)
      const aiMatches = this.aiService ? await this.suggestLibrariesWithAI(prompt) : [];
      
      // 3. Check project context for additional libraries
      const projectMatches = projectContext ? this.extractFromProjectContext(projectContext) : [];
      
      // 4. Combine and deduplicate matches
      const allMatches = this.combineMatches([...patternMatches, ...aiMatches, ...projectMatches]);
      
      // 5. Resolve with Context7
      const context7Libraries = await this.resolveLibrariesWithContext7(allMatches);
      
      // 6. Update metrics
      const detectionTime = performance.now() - startTime;
      this.updateMetrics(context7Libraries, detectionTime);
      
      return {
        detectedFrameworks: context7Libraries.map(lib => lib.name),
        confidence: this.calculateOverallConfidence(context7Libraries),
        suggestions: this.generateSuggestions(context7Libraries),
        context7Libraries: context7Libraries.map(lib => lib.libraryId),
        detectionMethod: this.determineDetectionMethod(allMatches)
      };
    } catch (error) {
      console.error('Framework detection failed', { error, prompt });
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
   */
  private async suggestLibrariesWithAI(prompt: string): Promise<LibraryMatch[]> {
    if (!this.aiService) {
      return [];
    }

    try {
      const analysisPrompt = `
        Analyze this development prompt and suggest 3-5 most relevant library/framework names that would provide useful documentation:
        
        Prompt: "${prompt}"
        
        Requirements:
        - Return only library names, one per line
        - Focus on frameworks, UI libraries, and development tools
        - Be specific (e.g., "react" not "javascript framework")
        - Consider the context and technology stack
        - Prioritize popular, well-documented libraries
        
        Examples:
        - For "create a component" -> react, vue, angular
        - For "build a web app" -> nextjs, nuxt, sveltekit
        - For "styling" -> tailwindcss, styled-components, emotion
      `;
      
      const response = await this.aiService.analyze(analysisPrompt);
      return this.parseLibrarySuggestions(response);
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
   * Initialize detection patterns
   */
  private initializeDetectionPatterns(): DetectionPattern[] {
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
   * Parse AI suggestions
   */
  private parseLibrarySuggestions(response: string): LibraryMatch[] {
    const lines = response.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-*]\s*/, '').toLowerCase())
      .filter(name => this.isValidLibraryName(name));
    
    return [...new Set(lines)].map(name => ({
      name,
      libraryId: '',
      confidence: 0.8,
      source: 'ai' as const
    }));
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
