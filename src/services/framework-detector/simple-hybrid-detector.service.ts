/**
 * Simple Hybrid Detector Service
 * 
 * Combines pattern engine + existing AI suggestions for better framework detection.
 * Reuses existing services and adds simple learning capabilities.
 */

import type { LibraryMatch, FrameworkDetectionResult, ProjectContext } from './framework-detector.types.js';
import { SimplePatternEngineService } from './simple-pattern-engine.service.js';
import { SimpleTextClassifierService, type ClassificationResult } from './simple-text-classifier.service.js';
import { SimpleCacheManagerService } from './simple-cache-manager.service.js';
import { Context7CacheService } from './context7-cache.service.js';

export interface HybridDetectionResult extends FrameworkDetectionResult {
  patternMatches: LibraryMatch[];
  aiPredictions: LibraryMatch[];
  combinedConfidence: number;
  learningMetrics: {
    patternSuccessRate: number;
    aiSuccessRate: number;
    overallAccuracy: number;
  };
}

export class SimpleHybridDetectorService {
  private patternEngine: SimplePatternEngineService;
  private textClassifier: SimpleTextClassifierService;
  private cacheManager: SimpleCacheManagerService;
  private context7Cache: Context7CacheService;

  constructor(
    patternEngine: SimplePatternEngineService,
    textClassifier: SimpleTextClassifierService,
    cacheManager: SimpleCacheManagerService,
    context7Cache: Context7CacheService
  ) {
    this.patternEngine = patternEngine;
    this.textClassifier = textClassifier;
    this.cacheManager = cacheManager;
    this.context7Cache = context7Cache;
  }

  /**
   * Main hybrid detection method
   */
  async detectFrameworks(prompt: string, projectContext?: ProjectContext): Promise<HybridDetectionResult> {
    const cacheKey = this.cacheManager.generateCacheKey(prompt, projectContext);
    
    // Check cache first
    const cached = await this.cacheManager.getCachedResult(cacheKey);
    if (cached) {
      return cached as HybridDetectionResult;
    }

    try {
      // 1. Run pattern-based detection
      const patternMatches = await this.patternEngine.extractFrameworks(prompt);
      
      // 2. Run AI-based classification
      const classificationResult = await this.textClassifier.classifyFrameworks(prompt, patternMatches);
      
      // 3. Combine results with weighted scoring
      const combinedResult = this.combineDetectionResults(patternMatches, classificationResult);
      
      // 4. Resolve with Context7 (reuse existing logic)
      const context7Libraries = await this.resolveWithContext7(combinedResult.predictions);
      
      // 5. Build final result
      const result: HybridDetectionResult = {
        detectedFrameworks: context7Libraries.map(lib => lib.name),
        confidence: combinedResult.confidence,
        suggestions: this.generateSuggestions(context7Libraries),
        context7Libraries: context7Libraries.map(lib => lib.libraryId),
        detectionMethod: this.determineDetectionMethod(patternMatches, classificationResult),
        patternMatches,
        aiPredictions: classificationResult.predictions,
        combinedConfidence: combinedResult.confidence,
        learningMetrics: await this.calculateLearningMetrics(patternMatches, classificationResult)
      };

      // Cache the result
      await this.cacheManager.cacheResult(cacheKey, result, 'prompt');

      return result;
    } catch (error) {
      console.error('Hybrid detection failed', { error, prompt });
      return this.getFallbackResult();
    }
  }

  /**
   * Combine pattern and AI results with weighted scoring
   */
  private combineDetectionResults(
    patternMatches: LibraryMatch[], 
    classificationResult: ClassificationResult
  ): { predictions: LibraryMatch[]; confidence: number } {
    const allMatches = [...patternMatches, ...classificationResult.predictions];
    
    // Weighted combination based on method
    const weights = {
      'pattern-enhanced': 0.7, // AI + patterns
      'ai-suggestion': 0.6,    // AI only
      'fallback': 0.3          // Pattern fallback
    };

    const methodWeight = weights[classificationResult.method] || 0.5;
    const patternWeight = 1 - methodWeight;

    // Apply weights to confidence scores
    const weightedMatches = allMatches.map(match => ({
      ...match,
      confidence: match.confidence * (match.source.includes('pattern') ? patternWeight : methodWeight)
    }));

    // Deduplicate and sort
    const uniqueMatches = this.deduplicateMatches(weightedMatches);
    const sortedMatches = uniqueMatches.sort((a, b) => b.confidence - a.confidence).slice(0, 5);

    // Calculate combined confidence
    const avgConfidence = sortedMatches.length > 0 
      ? sortedMatches.reduce((sum, m) => sum + m.confidence, 0) / sortedMatches.length
      : 0;

    return {
      predictions: sortedMatches,
      confidence: Math.min(1.0, avgConfidence * 1.2) // Slight boost for combined approach
    };
  }

  /**
   * Resolve libraries with Context7 (reuse existing logic)
   */
  private async resolveWithContext7(predictions: LibraryMatch[]): Promise<LibraryMatch[]> {
    const resolved: LibraryMatch[] = [];
    
    for (const prediction of predictions) {
      try {
        // Try to resolve with Context7
        const docs = await this.context7Cache.getCachedDocs(prediction.name);
        if (docs) {
          resolved.push({
            ...prediction,
            libraryId: prediction.name // Simple mapping for now
          });
        } else {
          // Keep prediction even if Context7 resolution fails
          resolved.push(prediction);
        }
      } catch (error) {
        // Continue with unresolved prediction
        resolved.push(prediction);
      }
    }

    return resolved;
  }

  /**
   * Determine detection method based on results
   */
  private determineDetectionMethod(
    patternMatches: LibraryMatch[], 
    classificationResult: ClassificationResult
  ): 'pattern' | 'ai' | 'project' | 'fallback' {
    if (classificationResult.method === 'pattern-enhanced') return 'ai';
    if (patternMatches.length > 0) return 'pattern';
    if (classificationResult.predictions.length > 0) return 'ai';
    return 'fallback';
  }

  /**
   * Generate suggestions based on detected frameworks
   */
  private generateSuggestions(libraries: LibraryMatch[]): string[] {
    const suggestions: string[] = [];
    
    for (const lib of libraries.slice(0, 3)) {
      if (lib.confidence > 0.7) {
        suggestions.push(`Consider using ${lib.name} for this task`);
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Consider using popular frameworks like React, Vue, or Angular for UI components');
    }

    return suggestions;
  }

  /**
   * Calculate learning metrics for pattern and AI success rates
   */
  private async calculateLearningMetrics(
    patternMatches: LibraryMatch[], 
    classificationResult: ClassificationResult
  ): Promise<{ patternSuccessRate: number; aiSuccessRate: number; overallAccuracy: number }> {
    // Simple metrics calculation - in a real system, this would track actual usage
    const patternSuccessRate = patternMatches.length > 0 ? 0.8 : 0.2;
    const aiSuccessRate = classificationResult.confidence;
    const overallAccuracy = (patternSuccessRate + aiSuccessRate) / 2;

    return {
      patternSuccessRate,
      aiSuccessRate,
      overallAccuracy
    };
  }

  /**
   * Deduplicate matches by name
   */
  private deduplicateMatches(matches: LibraryMatch[]): LibraryMatch[] {
    const unique = new Map<string, LibraryMatch>();
    
    for (const match of matches) {
      const key = match.name.toLowerCase();
      const existing = unique.get(key);
      
      if (existing) {
        // Keep the higher confidence match
        if (match.confidence > existing.confidence) {
          unique.set(key, {
            ...match,
            source: `${existing.source}, ${match.source}`
          });
        }
      } else {
        unique.set(key, match);
      }
    }

    return Array.from(unique.values());
  }

  /**
   * Fallback result when detection fails
   */
  private getFallbackResult(): HybridDetectionResult {
    return {
      detectedFrameworks: [],
      confidence: 0.1,
      suggestions: ['Consider specifying the framework or technology stack you want to use'],
      context7Libraries: [],
      detectionMethod: 'fallback',
      patternMatches: [],
      aiPredictions: [],
      combinedConfidence: 0.1,
      learningMetrics: {
        patternSuccessRate: 0,
        aiSuccessRate: 0,
        overallAccuracy: 0
      }
    };
  }
}
