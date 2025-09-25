/**
 * Quality Validation Service
 * 
 * Validates the quality of AI summarization to ensure information retention,
 * technical accuracy, and overall usefulness of summarized content.
 */

import { Logger } from '../../logger/logger.js';
import type { 
  QualityScore,
  SummarizationValidationResult,
  SummarizationRequest,
  SummarizationResponse
} from '../types/summarization.types.js';
import { 
  QUALITY_VALIDATION_PROMPTS,
  formatPrompt 
} from './prompts/summarization-prompts.js';

export class QualityValidationService {
  private logger: Logger;
  private validationThreshold: number;

  constructor(validationThreshold: number = 0.8, logger?: Logger) {
    this.logger = logger || new Logger('QualityValidationService');
    this.validationThreshold = validationThreshold;
  }

  /**
   * Validate summarization quality
   */
  async validateSummarizationQuality(
    original: string[],
    summarized: string[],
    type: 'repoFacts' | 'context7Docs' | 'codeSnippets'
  ): Promise<QualityScore> {
    try {
      this.logger.debug('Starting quality validation', { type, originalLength: original.length, summarizedLength: summarized.length });

      const scores = await Promise.all([
        this.checkInformationRetention(original, summarized),
        this.checkTechnicalAccuracy(summarized),
        this.checkConciseness(original, summarized),
        this.checkRelevance(summarized, type)
      ]);

      const [informationRetention, technicalAccuracy, conciseness, relevance] = scores;
      
      // Weighted average with emphasis on information retention and technical accuracy
      const overall = (
        informationRetention * 0.4 +
        technicalAccuracy * 0.3 +
        conciseness * 0.2 +
        relevance * 0.1
      );

      const qualityScore: QualityScore = {
        overall: Math.round(overall),
        informationRetention: Math.round(informationRetention),
        technicalAccuracy: Math.round(technicalAccuracy),
        conciseness: Math.round(conciseness),
        relevance: Math.round(relevance),
        details: {
          missingKeyInfo: this.identifyMissingKeyInfo(original, summarized),
          technicalErrors: this.identifyTechnicalErrors(summarized),
          redundancyIssues: this.identifyRedundancyIssues(summarized),
          relevanceIssues: this.identifyRelevanceIssues(summarized, type)
        }
      };

      this.logger.debug('Quality validation completed', {
        type,
        overall: qualityScore.overall,
        breakdown: {
          informationRetention: qualityScore.informationRetention,
          technicalAccuracy: qualityScore.technicalAccuracy,
          conciseness: qualityScore.conciseness,
          relevance: qualityScore.relevance
        }
      });

      return qualityScore;
    } catch (error) {
      this.logger.error('Quality validation failed', { error, type });
      return this.getDefaultQualityScore();
    }
  }

  /**
   * Check information retention
   */
  private async checkInformationRetention(original: string[], summarized: string[]): Promise<number> {
    try {
      // Simple keyword-based analysis
      const originalKeywords = this.extractKeywords(original.join(' '));
      const summarizedKeywords = this.extractKeywords(summarized.join(' '));
      
      const commonKeywords = originalKeywords.filter(keyword => 
        summarizedKeywords.some(sumKeyword => 
          sumKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(sumKeyword.toLowerCase())
        )
      );

      const retentionRatio = commonKeywords.length / originalKeywords.length;
      return Math.min(100, retentionRatio * 100);
    } catch (error) {
      this.logger.warn('Information retention check failed', { error });
      return 50; // Default moderate score
    }
  }

  /**
   * Check technical accuracy
   */
  private async checkTechnicalAccuracy(summarized: string[]): Promise<number> {
    try {
      const text = summarized.join(' ').toLowerCase();
      
      // Check for technical terms and patterns
      const technicalPatterns = [
        /\b(typescript|javascript|react|vue|angular|node\.?js)\b/g,
        /\b(api|rest|graphql|http|https)\b/g,
        /\b(database|sqlite|postgresql|mysql|mongodb)\b/g,
        /\b(component|hook|state|props|interface|type)\b/g,
        /\b(async|await|promise|callback|function)\b/g,
        /\b(error|exception|validation|authentication|authorization)\b/g
      ];

      let accuracyScore = 0;
      const totalPatterns = technicalPatterns.length;

      for (const pattern of technicalPatterns) {
        if (pattern.test(text)) {
          accuracyScore += 100 / totalPatterns;
        }
      }

      // Check for common technical errors
      const errorPatterns = [
        /\b(jsx|tsx|html|css)\b.*\b(typescript|javascript)\b/g, // Mixed terminology
        /\b(api|rest)\b.*\b(graphql|soap)\b/g, // Conflicting protocols
        /\b(react|vue|angular)\b.*\b(server|backend)\b/g // Frontend/backend confusion
      ];

      let errorPenalty = 0;
      for (const pattern of errorPatterns) {
        if (pattern.test(text)) {
          errorPenalty += 10;
        }
      }

      return Math.max(0, Math.min(100, accuracyScore - errorPenalty));
    } catch (error) {
      this.logger.warn('Technical accuracy check failed', { error });
      return 50; // Default moderate score
    }
  }

  /**
   * Check conciseness
   */
  private async checkConciseness(original: string[], summarized: string[]): Promise<number> {
    try {
      const originalLength = original.join(' ').length;
      const summarizedLength = summarized.join(' ').length;
      
      if (originalLength === 0) return 100;
      
      const reductionRatio = (originalLength - summarizedLength) / originalLength;
      
      // Optimal reduction is between 60-80%
      if (reductionRatio >= 0.6 && reductionRatio <= 0.8) {
        return 100;
      } else if (reductionRatio > 0.8) {
        // Too much reduction might indicate information loss
        return Math.max(60, 100 - (reductionRatio - 0.8) * 200);
      } else {
        // Not enough reduction
        return Math.max(40, reductionRatio * 125);
      }
    } catch (error) {
      this.logger.warn('Conciseness check failed', { error });
      return 50; // Default moderate score
    }
  }

  /**
   * Check relevance
   */
  private async checkRelevance(summarized: string[], type: 'repoFacts' | 'context7Docs' | 'codeSnippets'): Promise<number> {
    try {
      const text = summarized.join(' ').toLowerCase();
      
      // Type-specific relevance patterns
      const relevancePatterns = {
        repoFacts: [
          /\b(project|application|framework|library|tool)\b/g,
          /\b(typescript|javascript|react|vue|angular|node)\b/g,
          /\b(architecture|pattern|design|structure)\b/g,
          /\b(testing|ci|cd|deployment|quality)\b/g
        ],
        context7Docs: [
          /\b(documentation|guide|tutorial|example|usage)\b/g,
          /\b(api|method|function|class|interface)\b/g,
          /\b(best practice|convention|pattern|recommendation)\b/g,
          /\b(integration|implementation|configuration)\b/g
        ],
        codeSnippets: [
          /\b(pattern|concept|principle|approach)\b/g,
          /\b(architecture|design|structure|organization)\b/g,
          /\b(reusable|modular|scalable|maintainable)\b/g,
          /\b(convention|standard|practice|guideline)\b/g
        ]
      };

      const patterns = relevancePatterns[type];
      let relevanceScore = 0;
      const totalPatterns = patterns.length;

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          relevanceScore += 100 / totalPatterns;
        }
      }

      return Math.min(100, relevanceScore);
    } catch (error) {
      this.logger.warn('Relevance check failed', { error });
      return 50; // Default moderate score
    }
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
      'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'shall', 'a', 'an', 'some', 'any', 'all'
    ]);
    return stopWords.has(word);
  }

  /**
   * Identify missing key information
   */
  private identifyMissingKeyInfo(original: string[], summarized: string[]): string[] {
    const originalKeywords = this.extractKeywords(original.join(' '));
    const summarizedKeywords = this.extractKeywords(summarized.join(' '));
    
    return originalKeywords
      .filter(keyword => !summarizedKeywords.some(sumKeyword => 
        sumKeyword.includes(keyword) || keyword.includes(sumKeyword)
      ))
      .slice(0, 5); // Limit to top 5 missing keywords
  }

  /**
   * Identify technical errors
   */
  private identifyTechnicalErrors(summarized: string[]): string[] {
    const errors: string[] = [];
    const text = summarized.join(' ').toLowerCase();
    
    // Check for common technical mistakes
    if (text.includes('jsx') && text.includes('typescript')) {
      errors.push('Mixed JSX/TypeScript terminology');
    }
    if (text.includes('api') && text.includes('graphql') && text.includes('rest')) {
      errors.push('Conflicting API protocol references');
    }
    if (text.includes('react') && text.includes('server-side')) {
      errors.push('Frontend/backend concept confusion');
    }
    
    return errors;
  }

  /**
   * Identify redundancy issues
   */
  private identifyRedundancyIssues(summarized: string[]): string[] {
    const issues: string[] = [];
    const text = summarized.join(' ').toLowerCase();
    
    // Check for repeated phrases
    const words = text.split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 4) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    
    for (const [word, count] of wordCounts.entries()) {
      if (count > 3) {
        issues.push(`Excessive repetition of "${word}"`);
      }
    }
    
    return issues.slice(0, 3); // Limit to top 3 issues
  }

  /**
   * Identify relevance issues
   */
  private identifyRelevanceIssues(summarized: string[], type: 'repoFacts' | 'context7Docs' | 'codeSnippets'): string[] {
    const issues: string[] = [];
    const text = summarized.join(' ').toLowerCase();
    
    // Type-specific relevance checks
    if (type === 'repoFacts' && !text.includes('project') && !text.includes('application')) {
      issues.push('Missing project context information');
    }
    if (type === 'context7Docs' && !text.includes('documentation') && !text.includes('guide')) {
      issues.push('Missing documentation context');
    }
    if (type === 'codeSnippets' && !text.includes('pattern') && !text.includes('concept')) {
      issues.push('Missing code pattern information');
    }
    
    return issues;
  }

  /**
   * Get default quality score for error cases
   */
  private getDefaultQualityScore(): QualityScore {
    return {
      overall: 50,
      informationRetention: 50,
      technicalAccuracy: 50,
      conciseness: 50,
      relevance: 50,
      details: {
        missingKeyInfo: [],
        technicalErrors: [],
        redundancyIssues: [],
        relevanceIssues: []
      }
    };
  }

  /**
   * Validate complete summarization response
   */
  async validateSummarizationResponse(
    request: SummarizationRequest,
    response: SummarizationResponse
  ): Promise<SummarizationValidationResult> {
    try {
      const original = [
        ...request.repoFacts,
        ...request.context7Docs,
        ...request.codeSnippets
      ];
      
      const summarized = [
        ...response.summarizedRepoFacts,
        ...response.summarizedContext7Docs,
        ...response.summarizedCodeSnippets
      ];

      const qualityScore = await this.validateSummarizationQuality(
        original,
        summarized,
        'repoFacts' // Use repoFacts as default type for overall validation
      );

      const isValid = qualityScore.overall >= (this.validationThreshold * 100);
      const issues = [
        ...qualityScore.details.missingKeyInfo,
        ...qualityScore.details.technicalErrors,
        ...qualityScore.details.redundancyIssues,
        ...qualityScore.details.relevanceIssues
      ];

      const recommendations = this.generateRecommendations(qualityScore);

      return {
        isValid,
        qualityScore: qualityScore.overall,
        issues,
        recommendations
      };
    } catch (error) {
      this.logger.error('Summarization response validation failed', { error });
      return {
        isValid: false,
        qualityScore: 0,
        issues: ['Validation failed due to internal error'],
        recommendations: ['Retry summarization with different parameters']
      };
    }
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(qualityScore: QualityScore): string[] {
    const recommendations: string[] = [];

    if (qualityScore.informationRetention < 70) {
      recommendations.push('Include more key technical details in summarization');
    }
    if (qualityScore.technicalAccuracy < 70) {
      recommendations.push('Improve technical terminology and accuracy');
    }
    if (qualityScore.conciseness < 70) {
      recommendations.push('Reduce verbosity while maintaining information density');
    }
    if (qualityScore.relevance < 70) {
      recommendations.push('Focus on context-specific and actionable information');
    }

    if (recommendations.length === 0) {
      recommendations.push('Quality is acceptable, no specific improvements needed');
    }

    return recommendations;
  }
}
