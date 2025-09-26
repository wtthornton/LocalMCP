/**
 * Simple Text Classifier Service
 * 
 * Reuses existing AI service for framework classification.
 * Provides lightweight ML-like capabilities without complex training.
 */

import { AILibrarySuggestionService, type LibrarySuggestion } from '../ai/ai-library-suggestion.service.js';
import type { LibraryMatch } from './framework-detector.types.js';
import { Context7CacheService } from './context7-cache.service.js';

export interface ClassificationResult {
  predictions: LibraryMatch[];
  confidence: number;
  method: 'ai-suggestion' | 'pattern-enhanced' | 'fallback';
}

export class SimpleTextClassifierService {
  private aiService: AILibrarySuggestionService;
  private cacheService: Context7CacheService;

  constructor(aiService: AILibrarySuggestionService, cacheService: Context7CacheService) {
    this.aiService = aiService;
    this.cacheService = cacheService;
  }

  /**
   * Classify frameworks using existing AI service
   */
  async classifyFrameworks(prompt: string, existingPatterns: LibraryMatch[]): Promise<ClassificationResult> {
    const cacheKey = `classification-${prompt}`;
    
    // Check cache first
    const cached = await this.cacheService.getCachedMLPredictions(cacheKey);
    if (cached) {
      return {
        predictions: cached.predictions,
        confidence: cached.confidence,
        method: 'ai-suggestion'
      };
    }

    try {
      // Use existing AI service for suggestions
      const aiSuggestions = await this.aiService.suggestLibraries(prompt);
      
      // Convert AI suggestions to LibraryMatch format
      const predictions = aiSuggestions.map((suggestion: LibrarySuggestion) => ({
        name: suggestion.name,
        libraryId: '', // Will be resolved by Context7 later
        confidence: suggestion.confidence,
        source: 'ai-classification'
      }));

      // Enhance with existing patterns if available
      const enhancedPredictions = this.enhanceWithPatterns(predictions, existingPatterns);
      
      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(enhancedPredictions);
      
      const result: ClassificationResult = {
        predictions: enhancedPredictions,
        confidence,
        method: existingPatterns.length > 0 ? 'pattern-enhanced' : 'ai-suggestion'
      };

      // Cache the result
      await this.cacheService.cacheMLPredictions(cacheKey, result.predictions, result.confidence);

      return result;
    } catch (error) {
      console.warn('AI classification failed, using fallback', { error });
      return this.getFallbackResult(existingPatterns);
    }
  }

  /**
   * Enhance AI predictions with existing pattern matches
   */
  private enhanceWithPatterns(aiPredictions: LibraryMatch[], patterns: LibraryMatch[]): LibraryMatch[] {
    const enhanced = [...aiPredictions];
    
    // Add patterns that aren't already covered by AI
    for (const pattern of patterns) {
      const existing = enhanced.find(p => p.name.toLowerCase() === pattern.name.toLowerCase());
      if (existing) {
        // Boost confidence if pattern supports AI prediction
        existing.confidence = Math.min(1.0, existing.confidence + 0.1);
        existing.source += `, ${pattern.source}`;
      } else {
        // Add new pattern-based prediction
        enhanced.push({
          ...pattern,
          confidence: pattern.confidence * 0.8, // Slightly lower confidence for pattern-only matches
          source: `${pattern.source}, pattern-enhanced`
        });
      }
    }

    // Sort by confidence and deduplicate
    return this.deduplicateAndSort(enhanced);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(predictions: LibraryMatch[]): number {
    if (predictions.length === 0) return 0;
    
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    const maxConfidence = Math.max(...predictions.map(p => p.confidence));
    
    // Weighted average favoring higher confidence predictions
    return (avgConfidence * 0.6) + (maxConfidence * 0.4);
  }

  /**
   * Deduplicate and sort predictions
   */
  private deduplicateAndSort(predictions: LibraryMatch[]): LibraryMatch[] {
    const unique = new Map<string, LibraryMatch>();
    
    for (const prediction of predictions) {
      const key = prediction.name.toLowerCase();
      const existing = unique.get(key);
      
      if (existing) {
        // Keep the higher confidence prediction
        if (prediction.confidence > existing.confidence) {
          unique.set(key, {
            ...prediction,
            source: `${existing.source}, ${prediction.source}`
          });
        }
      } else {
        unique.set(key, prediction);
      }
    }

    return Array.from(unique.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Limit to top 5 predictions
  }

  /**
   * Fallback result when AI classification fails
   */
  private getFallbackResult(patterns: LibraryMatch[]): ClassificationResult {
    return {
      predictions: patterns.length > 0 ? patterns.slice(0, 3) : [],
      confidence: patterns.length > 0 ? 0.5 : 0.1,
      method: 'fallback'
    };
  }
}
