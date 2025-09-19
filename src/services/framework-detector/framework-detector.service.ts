/**
 * Dynamic Framework Detection Service
 * 
 * Detects frameworks and libraries dynamically using patterns, AI, and project context
 * instead of hardcoded framework mappings. Works with any Context7 library.
 */

import { 
  FrameworkDetectionResult, 
  LibraryMatch, 
  ProjectContext, 
  DetectionPattern,
  DetectionMetrics 
} from './framework-detector.types';
import { Context7CacheService } from './context7-cache.service';
import { ProjectContextAnalyzer } from './project-context-analyzer.service';

export class FrameworkDetectorService {
  private context7Service: any; // Will be injected
  private cacheService: Context7CacheService;
  private aiService: any; // Will be injected
  private projectAnalyzer: ProjectContextAnalyzer;
  private metrics: DetectionMetrics;
  private detectionPatterns: DetectionPattern[];

  constructor(context7Service: any, cacheService: Context7CacheService, aiService?: any) {
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
        const name = match[1].toLowerCase();
        if (this.isValidLibraryName(name)) {
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
   * Use AI to suggest libraries
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
        const libraryId = await this.context7Service.resolveLibraryId(match.name);
        const docs = await this.context7Service.getLibraryDocs(libraryId, { tokens: 2000 });
        
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
