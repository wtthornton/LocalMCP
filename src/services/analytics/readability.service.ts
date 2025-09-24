// src/services/analytics/readability.service.ts
import { Logger } from '../logger/logger.js';

export interface ReadabilityMetrics {
  fleschKincaid: number;
  smog: number;
  ari: number;
  averageGradeLevel: number;
  readabilityLevel: 'Elementary' | 'Middle School' | 'High School' | 'College' | 'Graduate';
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  averageWordsPerSentence: number;
  averageSyllablesPerWord: number;
}

export interface ContentStructureMetrics {
  hasHeaders: boolean;
  hasLists: boolean;
  hasCodeBlocks: boolean;
  hasLinks: boolean;
  structureScore: number;
  organizationLevel: 'Poor' | 'Fair' | 'Good' | 'Excellent';
}

export interface ContentQualityMetrics {
  readability: ReadabilityMetrics;
  structure: ContentStructureMetrics;
  overallQuality: number;
  recommendations: string[];
}

export class ReadabilityService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Calculates comprehensive readability metrics for text content
   */
  async analyzeReadability(text: string): Promise<ReadabilityMetrics> {
    this.logger.debug('Analyzing text readability', { textLength: text.length });

    const words = this.extractWords(text);
    const sentences = this.extractSentences(text);
    const syllables = this.countSyllables(words);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const syllableCount = syllables;

    const averageWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const averageSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;

    // Flesch-Kincaid Grade Level
    const fleschKincaid = this.calculateFleschKincaid(averageWordsPerSentence, averageSyllablesPerWord);

    // SMOG Index
    const smog = this.calculateSMOG(sentenceCount, syllables);

    // Automated Readability Index (ARI)
    const ari = this.calculateARI(averageWordsPerSentence, averageSyllablesPerWord);

    const averageGradeLevel = (fleschKincaid + smog + ari) / 3;
    const readabilityLevel = this.determineReadabilityLevel(averageGradeLevel);

    return {
      fleschKincaid,
      smog,
      ari,
      averageGradeLevel,
      readabilityLevel,
      wordCount,
      sentenceCount,
      syllableCount,
      averageWordsPerSentence,
      averageSyllablesPerWord
    };
  }

  /**
   * Analyzes content structure and organization
   */
  async analyzeStructure(text: string): Promise<ContentStructureMetrics> {
    this.logger.debug('Analyzing content structure', { textLength: text.length });

    const hasHeaders = this.hasHeaders(text);
    const hasLists = this.hasLists(text);
    const hasCodeBlocks = this.hasCodeBlocks(text);
    const hasLinks = this.hasLinks(text);

    const structureScore = this.calculateStructureScore({
      hasHeaders,
      hasLists,
      hasCodeBlocks,
      hasLinks
    });

    const organizationLevel = this.determineOrganizationLevel(structureScore);

    return {
      hasHeaders,
      hasLists,
      hasCodeBlocks,
      hasLinks,
      structureScore,
      organizationLevel
    };
  }

  /**
   * Comprehensive content quality analysis
   */
  async analyzeContentQuality(text: string): Promise<ContentQualityMetrics> {
    this.logger.debug('Analyzing content quality', { textLength: text.length });

    const readability = await this.analyzeReadability(text);
    const structure = await this.analyzeStructure(text);

    // Calculate overall quality score (0-100)
    const readabilityScore = this.normalizeReadabilityScore(readability.averageGradeLevel);
    const structureScore = structure.structureScore;
    const overallQuality = (readabilityScore + structureScore) / 2;

    const recommendations = this.generateRecommendations(readability, structure);

    return {
      readability,
      structure,
      overallQuality,
      recommendations
    };
  }

  private extractWords(text: string): string[] {
    // Remove markdown formatting and extract words
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/#+\s*/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .toLowerCase();

    return cleanText.split(/\s+/).filter(word => word.length > 0);
  }

  private extractSentences(text: string): string[] {
    // Split by sentence endings, accounting for abbreviations
    const sentences = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences;
  }

  private countSyllables(words: string[]): number {
    let totalSyllables = 0;
    
    for (const word of words) {
      totalSyllables += this.countWordSyllables(word);
    }

    return totalSyllables;
  }

  private countWordSyllables(word: string): number {
    // Remove common suffixes that don't add syllables
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    if (cleanWord.length === 0) return 0;
    if (cleanWord.length <= 3) return 1;

    // Count vowel groups
    const vowelGroups = cleanWord.match(/[aeiouy]+/g);
    if (!vowelGroups) return 1;

    let syllables = vowelGroups.length;

    // Adjust for silent 'e'
    if (cleanWord.endsWith('e') && syllables > 1) {
      syllables--;
    }

    // Adjust for consecutive vowels
    const consecutiveVowels = cleanWord.match(/[aeiouy]{2,}/g);
    if (consecutiveVowels) {
      syllables -= consecutiveVowels.length - 1;
    }

    return Math.max(1, syllables);
  }

  private calculateFleschKincaid(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
    return 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  }

  private calculateSMOG(sentenceCount: number, syllableCount: number): number {
    if (sentenceCount < 30) {
      // For texts with fewer than 30 sentences, use a simplified calculation
      return 1.043 * Math.sqrt(syllableCount / sentenceCount * 30) + 3.1291;
    }
    return 1.043 * Math.sqrt(syllableCount / sentenceCount * 30) + 3.1291;
  }

  private calculateARI(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
    return 4.71 * avgSyllablesPerWord + 0.5 * avgWordsPerSentence - 21.43;
  }

  private determineReadabilityLevel(gradeLevel: number): ReadabilityMetrics['readabilityLevel'] {
    if (gradeLevel <= 6) return 'Elementary';
    if (gradeLevel <= 8) return 'Middle School';
    if (gradeLevel <= 12) return 'High School';
    if (gradeLevel <= 16) return 'College';
    return 'Graduate';
  }

  private hasHeaders(text: string): boolean {
    return /^#+\s+.+$/m.test(text);
  }

  private hasLists(text: string): boolean {
    return /^[\s]*[-*+]\s+.+$/m.test(text) || /^[\s]*\d+\.\s+.+$/m.test(text);
  }

  private hasCodeBlocks(text: string): boolean {
    return /```[\s\S]*?```/.test(text);
  }

  private hasLinks(text: string): boolean {
    return /\[([^\]]+)\]\([^)]+\)/.test(text);
  }

  private calculateStructureScore(structure: {
    hasHeaders: boolean;
    hasLists: boolean;
    hasCodeBlocks: boolean;
    hasLinks: boolean;
  }): number {
    let score = 0;
    if (structure.hasHeaders) score += 25;
    if (structure.hasLists) score += 25;
    if (structure.hasCodeBlocks) score += 25;
    if (structure.hasLinks) score += 25;
    return score;
  }

  private determineOrganizationLevel(score: number): ContentStructureMetrics['organizationLevel'] {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Poor';
  }

  private normalizeReadabilityScore(gradeLevel: number): number {
    // Convert grade level to 0-100 score (lower grade level = higher score)
    const maxGrade = 20;
    const normalized = Math.max(0, Math.min(100, (maxGrade - gradeLevel) / maxGrade * 100));
    return normalized;
  }

  private generateRecommendations(readability: ReadabilityMetrics, structure: ContentStructureMetrics): string[] {
    const recommendations: string[] = [];

    if (readability.averageGradeLevel > 12) {
      recommendations.push('Consider simplifying language for better readability');
    }

    if (readability.averageWordsPerSentence > 20) {
      recommendations.push('Break down long sentences for better clarity');
    }

    if (readability.averageSyllablesPerWord > 2) {
      recommendations.push('Use shorter, simpler words where possible');
    }

    if (!structure.hasHeaders) {
      recommendations.push('Add headers to improve content organization');
    }

    if (!structure.hasLists) {
      recommendations.push('Use bullet points or numbered lists for better structure');
    }

    if (structure.structureScore < 50) {
      recommendations.push('Improve overall content organization and structure');
    }

    return recommendations;
  }
}
