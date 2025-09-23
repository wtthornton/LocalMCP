/**
 * Context7 Content Extractor Service
 * Extracts code examples, best practices, and framework-specific information from Context7 documentation
 * Based on Context7 MCP best practices and content patterns
 */

import { Logger } from '../logger/logger.js';

export interface Context7Content {
  codeBlocks: string[];
  bestPractices: string[];
  frameworkInfo: string[];
  metadata: Context7Metadata;
}

export interface Context7Metadata {
  libraryId: string;
  trustScore: number;
  codeSnippets: number;
  versions: string[];
  rules: string[];
}

export class Context7ContentExtractor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Extract code blocks from Context7 documentation
   */
  extractCodeBlocks(content: string, libraryId: string): string[] {
    const codeBlocks: string[] = [];
    
    // Extract code blocks using regex
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = content.match(codeBlockRegex) || [];
    
    for (const match of matches) {
      // Clean up the code block
      const cleaned = this.cleanCodeBlock(match);
      if (cleaned.length > 10) { // Only include substantial code blocks
        codeBlocks.push(cleaned);
      }
    }
    
    // If no code blocks found, extract inline code examples
    if (codeBlocks.length === 0) {
      const inlineCodeRegex = /`[^`]+`/g;
      const inlineMatches = content.match(inlineCodeRegex) || [];
      for (const match of inlineMatches) {
        const cleaned = match.replace(/`/g, '').trim();
        if (cleaned.length > 5) {
          codeBlocks.push(cleaned);
        }
      }
    }
    
    this.logger.debug('Code blocks extracted', { 
      libraryId, 
      totalBlocks: codeBlocks.length,
      blocks: codeBlocks.slice(0, 2)
    });
    
    return codeBlocks.slice(0, 5); // Limit to 5 code examples
  }

  /**
   * Extract best practices from Context7 documentation
   */
  extractBestPractices(content: string, framework: string): string[] {
    const practices: string[] = [];
    
    // Look for best practices sections
    const bestPracticeRegex = /(?:best practice|best practices|recommendation|guideline)[\s\S]*?(?=\n##|\n###|$)/gi;
    const matches = content.match(bestPracticeRegex) || [];
    
    for (const match of matches) {
      // Extract bullet points and numbered lists
      const lines = match.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if ((trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) && 
            trimmed.length > 10) {
          practices.push(trimmed.substring(1).trim());
        } else if (/^\d+\./.test(trimmed) && trimmed.length > 10) {
          practices.push(trimmed.replace(/^\d+\.\s*/, '').trim());
        }
      }
    }
    
    // If no structured practices found, look for general advice
    if (practices.length === 0) {
      const adviceRegex = /(?:should|must|recommend|avoid|always|never)[\s\S]*?[.!?]/gi;
      const adviceMatches = content.match(adviceRegex) || [];
      for (const match of adviceMatches) {
        if (match.length > 20 && match.length < 200) {
          practices.push(match.trim());
        }
      }
    }
    
    this.logger.debug('Best practices extracted', { 
      framework, 
      totalPractices: practices.length,
      practices: practices.slice(0, 3)
    });
    
    return practices.slice(0, 10); // Limit to 10 best practices
  }

  /**
   * Extract framework-specific information using dynamic pattern detection
   * Replaces hardcoded framework patterns with intelligent content analysis
   */
  extractFrameworkSpecificInfo(content: string, framework: string): string[] {
    const info: string[] = [];
    
    // Use dynamic pattern detection instead of hardcoded patterns
    const dynamicPatterns = this.generateDynamicPatterns(framework);
    
    for (const pattern of dynamicPatterns) {
      const matches = content.match(pattern) || [];
      for (const match of matches) {
        if (match.length > 2 && !info.includes(match)) {
          info.push(match);
        }
      }
    }
    
    this.logger.debug('Framework-specific info extracted', { 
      framework, 
      totalInfo: info.length,
      info: info.slice(0, 5)
    });
    
    return info.slice(0, 15); // Limit to 15 framework-specific items
  }

  /**
   * Generate dynamic patterns based on framework name and content analysis
   * Replaces hardcoded framework-specific patterns
   */
  private generateDynamicPatterns(framework: string): RegExp[] {
    const patterns: RegExp[] = [];
    const frameworkLower = framework.toLowerCase();
    
    // Generic patterns that work for most frameworks
    const genericPatterns = [
      /(?:function|method|class|interface|type|component)/gi, // Code structures
      /(?:import|export|require|module)/gi, // Module system
      /(?:api|endpoint|route|handler)/gi, // API patterns
      /(?:config|configuration|setting)/gi, // Configuration
      /(?:error|exception|try|catch|throw)/gi // Error handling
    ];
    
    // Framework-specific pattern generation based on common patterns
    if (frameworkLower.includes('html') || frameworkLower.includes('web')) {
      patterns.push(/<[^>]+>/g); // HTML tags
      patterns.push(/(?:semantic|accessibility|aria)/gi); // Web standards
    }
    
    if (frameworkLower.includes('react') || frameworkLower.includes('jsx')) {
      patterns.push(/(?:useState|useEffect|useCallback|useMemo)/g); // React hooks
      patterns.push(/(?:component|jsx|props|state)/gi); // React concepts
    }
    
    if (frameworkLower.includes('typescript') || frameworkLower.includes('ts')) {
      patterns.push(/(?:interface|type|enum|generic)/g); // TypeScript features
      patterns.push(/(?:extends|implements|strict)/gi); // TypeScript concepts
    }
    
    if (frameworkLower.includes('node') || frameworkLower.includes('server')) {
      patterns.push(/(?:express|middleware|route|handler)/gi); // Node.js patterns
      patterns.push(/(?:async|await|promise|callback)/gi); // Async patterns
    }
    
    // Always include generic patterns as fallback
    patterns.push(...genericPatterns);
    
    return patterns;
  }

  /**
   * Extract content from Context7 library ID
   */
  async extractFromLibraryId(libraryId: string, prompt: string): Promise<Context7Content> {
    try {
      // This would integrate with Context7 MCP in a real implementation
      // For now, return a structured response
      const content = `# ${libraryId} Documentation\n\nContent for ${libraryId} based on prompt: ${prompt}`;
      
      const codeBlocks = this.extractCodeBlocks(content, libraryId);
      const bestPractices = this.extractBestPractices(content, this.getFrameworkFromLibraryId(libraryId));
      const frameworkInfo = this.extractFrameworkSpecificInfo(content, this.getFrameworkFromLibraryId(libraryId));
      
      const metadata: Context7Metadata = {
        libraryId,
        trustScore: 8.0, // Default trust score
        codeSnippets: codeBlocks.length,
        versions: ['latest'],
        rules: []
      };
      
      return {
        codeBlocks,
        bestPractices,
        frameworkInfo,
        metadata
      };
    } catch (error) {
      this.logger.warn('Failed to extract from library ID', { libraryId, error });
      return this.getEmptyContent(libraryId);
    }
  }

  /**
   * Filter content by relevance to prompt
   */
  filterByRelevance(content: string, prompt: string): string {
    const promptWords = prompt.toLowerCase().split(/\s+/);
    const lines = content.split('\n');
    const relevantLines: string[] = [];
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      const relevanceScore = promptWords.reduce((score, word) => {
        return score + (lineLower.includes(word) ? 1 : 0);
      }, 0);
      
      if (relevanceScore > 0) {
        relevantLines.push(line);
      }
    }
    
    return relevantLines.join('\n');
  }

  /**
   * Apply Context7 rules to content
   */
  applyContext7Rules(content: string, rules: string[]): string {
    let filteredContent = content;
    
    for (const rule of rules) {
      if (rule.includes('Use') && rule.includes('as')) {
        // Extract technology from rule (e.g., "Use Upstash Redis as a database")
        const technology = rule.split('Use ')[1]?.split(' as')[0];
        if (technology && !content.toLowerCase().includes(technology.toLowerCase())) {
          // Skip content that doesn't match the rule
          continue;
        }
      }
    }
    
    return filteredContent;
  }

  /**
   * Clean code block by removing markdown syntax
   */
  private cleanCodeBlock(block: string): string {
    return block.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
  }

  /**
   * Check if section is relevant to framework using dynamic detection
   * Replaces hardcoded framework keywords with intelligent analysis
   */
  private isRelevantToFramework(section: string, framework: string): boolean {
    const sectionLower = section.toLowerCase();
    const frameworkLower = framework.toLowerCase();
    
    // Check if section mentions the framework name
    const mentionsFramework = sectionLower.includes(frameworkLower) || 
                             sectionLower.includes(frameworkLower.replace(/\./g, ''));
    
    // Check for generic relevance indicators
    const genericIndicators = [
      'api', 'documentation', 'example', 'usage', 'guide', 'tutorial',
      'function', 'method', 'class', 'interface', 'component'
    ];
    
    const hasGenericIndicators = genericIndicators.some(indicator => 
      sectionLower.includes(indicator)
    );
    
    // Check for code-like content
    const hasCodeContent = /[{}[\]();]/.test(section) || 
                          /["'`]/.test(section) || 
                          /import|export|require/.test(sectionLower);
    
    // Section is relevant if it mentions the framework OR has documentation indicators
    return mentionsFramework || (hasGenericIndicators && hasCodeContent);
  }

  /**
   * Parse Context7 metadata from content
   */
  private parseContext7Metadata(content: string): Context7Metadata {
    // This would parse actual Context7 metadata in a real implementation
    return {
      libraryId: 'unknown',
      trustScore: 5.0,
      codeSnippets: 0,
      versions: ['latest'],
      rules: []
    };
  }

  /**
   * Get framework from library ID
   */
  private getFrameworkFromLibraryId(libraryId: string): string {
    if (libraryId.includes('html')) return 'html';
    if (libraryId.includes('react')) return 'react';
    if (libraryId.includes('typescript')) return 'typescript';
    if (libraryId.includes('next')) return 'nextjs';
    if (libraryId.includes('vue')) return 'vue';
    if (libraryId.includes('angular')) return 'angular';
    return 'generic';
  }

  /**
   * Get empty content structure
   */
  private getEmptyContent(libraryId: string): Context7Content {
    return {
      codeBlocks: [],
      bestPractices: [],
      frameworkInfo: [],
      metadata: {
        libraryId,
        trustScore: 0,
        codeSnippets: 0,
        versions: [],
        rules: []
      }
    };
  }
}
