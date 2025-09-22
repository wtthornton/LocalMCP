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
   * Extract framework-specific information from Context7 documentation
   */
  extractFrameworkSpecificInfo(content: string, framework: string): string[] {
    const info: string[] = [];
    
    // Framework-specific patterns
    const frameworkPatterns: Record<string, RegExp[]> = {
      'html': [
        /<[^>]+>/g, // HTML tags
        /(?:semantic|accessibility|aria|aria-)/gi, // Accessibility
        /(?:button|form|input|select|textarea)/gi // Form elements
      ],
      'react': [
        /(?:useState|useEffect|useCallback|useMemo|useContext)/g, // Hooks
        /(?:component|jsx|props|state)/gi, // React concepts
        /(?:functional|class|arrow function)/gi // Component types
      ],
      'typescript': [
        /(?:interface|type|enum|generic|extends|implements)/g, // TypeScript features
        /(?:strict|compiler|tsconfig)/gi, // Configuration
        /(?:error|exception|try|catch)/gi // Error handling
      ],
      'nextjs': [
        /(?:getServerSideProps|getStaticProps|getStaticPaths)/g, // Next.js functions
        /(?:api|route|middleware)/gi, // Next.js concepts
        /(?:pages|app|components)/gi // Directory structure
      ]
    };
    
    const patterns = frameworkPatterns[framework] || [];
    for (const pattern of patterns) {
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
   * Check if section is relevant to framework
   */
  private isRelevantToFramework(section: string, framework: string): boolean {
    const frameworkKeywords: Record<string, string[]> = {
      'html': ['html', 'dom', 'element', 'tag', 'attribute'],
      'react': ['react', 'component', 'hook', 'jsx', 'state'],
      'typescript': ['typescript', 'type', 'interface', 'generic', 'enum'],
      'nextjs': ['next', 'nextjs', 'server', 'client', 'api']
    };
    
    const keywords = frameworkKeywords[framework] || [];
    const sectionLower = section.toLowerCase();
    
    return keywords.some(keyword => sectionLower.includes(keyword));
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
