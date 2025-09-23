/**
 * Context7 Documentation Service
 * 
 * Handles Context7 documentation retrieval, processing, and optimization
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Intelligent library selection based on prompt analysis
 * - Optimized documentation processing for relevance
 * - Parallel processing for better performance
 * - Smart content filtering and prioritization
 */

import { Logger } from '../../services/logger/logger.js';
import { Context7RealIntegrationService } from '../../services/context7/context7-real-integration.service.js';

export interface Context7DocumentationResult {
  docs: string;
  libraries: string[];
}

export interface LibraryInfo {
  id: string;
  name: string;
  score: number;
  topics: string[];
}

export class Context7DocumentationService {
  private logger: Logger;
  private realContext7: Context7RealIntegrationService;

  constructor(logger: Logger, realContext7: Context7RealIntegrationService) {
    this.logger = logger;
    this.realContext7 = realContext7;
  }

  /**
   * Select optimal Context7 libraries based on prompt analysis
   * Implements intelligent library selection with relevance scoring
   */
  async selectOptimalContext7Libraries(
    prompt: string,
    detectedFrameworks: string[],
    promptComplexity: { level: string; score: number; indicators: string[] }
  ): Promise<string[]> {
    const promptLower = prompt.toLowerCase();
    const promptKeywords = this.extractKeywords(prompt);
    
    // Get actual library IDs from Context7 API for each detected framework
    const actualLibraries: LibraryInfo[] = [];
    
    for (const framework of detectedFrameworks) {
      try {
        const libraries = await this.realContext7.resolveLibraryId(framework);
        if (libraries && libraries.length > 0) {
          // Take the first (highest trust score) library for each framework
          const library = libraries[0];
          if (library) {
            actualLibraries.push({
              id: library.id,
              name: library.name,
              score: 0,
              topics: this.getTopicsForFramework(framework)
            });
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to resolve library for ${framework}`, { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // If no frameworks detected, try common ones
    if (actualLibraries.length === 0) {
      const commonFrameworks = ['react', 'html', 'css', 'javascript'];
      for (const framework of commonFrameworks) {
        try {
          const libraries = await this.realContext7.resolveLibraryId(framework);
          if (libraries && libraries.length > 0) {
            const library = libraries[0];
            if (library) {
              actualLibraries.push({
                id: library.id,
                name: library.name,
                score: 0,
                topics: this.getTopicsForFramework(framework)
              });
              break; // Only take one fallback library
            }
          }
        } catch (error) {
          // Continue to next framework
        }
      }
    }
    
    // Calculate relevance scores for each actual library
    for (const library of actualLibraries) {
      let score = 0;
      
      // Base score for detected frameworks
      if (detectedFrameworks.some(fw => library.name.toLowerCase().includes(fw))) {
        score += 10;
      }
      
      // Score based on prompt keywords
      for (const keyword of promptKeywords) {
        if (library.topics.some(topic => topic.includes(keyword))) {
          score += 3;
        }
        if (promptLower.includes(keyword) && library.topics.some(topic => topic.includes(keyword))) {
          score += 5;
        }
      }
      
      // Score based on specific prompt patterns
      if (promptLower.includes('component') && library.name.toLowerCase().includes('react')) {
        score += 8;
      }
      
      if (promptLower.includes('api') && library.name.toLowerCase().includes('next')) {
        score += 8;
      }
      
      if (promptLower.includes('style') && (library.name.toLowerCase().includes('css') || library.name.toLowerCase().includes('html'))) {
        score += 8;
      }
      
      if (promptLower.includes('type') && library.name.toLowerCase().includes('typescript')) {
        score += 8;
      }
      
      library.score = score;
    }
    
    // Sort libraries by score and select top ones based on complexity
    const sortedLibraries = actualLibraries
      .filter(library => library.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Select libraries based on complexity
    let maxLibraries = 1;
    if (promptComplexity.level === 'medium') {
      maxLibraries = 2;
    } else if (promptComplexity.level === 'complex') {
      maxLibraries = 3;
    }
    
    const selectedLibraries = sortedLibraries
      .slice(0, maxLibraries)
      .map(library => library.id);
    
    this.logger.debug('Context7 library selection completed', {
      prompt: prompt.substring(0, 100),
      detectedFrameworks,
      selectedLibraries,
      libraryScores: sortedLibraries.map(lib => ({ name: lib.name, score: lib.score }))
    });
    
    return selectedLibraries;
  }

  /**
   * Get Context7 documentation for multiple frameworks
   * Implements parallel processing for better performance
   */
  async getContext7DocumentationForFrameworks(
    context7Libraries: string[],
    prompt: string,
    maxTokens: number
  ): Promise<Context7DocumentationResult> {
    try {
      const allDocs: string[] = [];
      const successfulLibraries: string[] = [];
      
      // Process libraries in parallel for better performance
      const docPromises = context7Libraries.map(async (libraryId) => {
        try {
          const docsResult = await this.realContext7.getLibraryDocumentation(
            libraryId,
            this.extractTopicFromPrompt(prompt),
            Math.floor(maxTokens / context7Libraries.length) // Distribute tokens evenly
          );

          if (docsResult && docsResult.content) {
            return {
              libraryId,
              docs: docsResult.content
            };
          }
          return null;
        } catch (error) {
          this.logger.warn(`Failed to get docs for ${libraryId}`, { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          return null;
        }
      });
      
      const results = await Promise.all(docPromises);
      
      for (const result of results) {
        if (result && result.docs) {
          allDocs.push(`## ${result.libraryId} Documentation:\n${result.docs}`);
          successfulLibraries.push(result.libraryId);
        }
      }
      
      this.logger.info('Context7 documentation retrieved successfully', {
        requestedLibraries: context7Libraries.length,
        successfulLibraries: successfulLibraries.length,
        totalDocsLength: allDocs.join('\n\n').length
      });
      
      // If no docs were retrieved, provide fallback documentation
      if (allDocs.length === 0) {
        const fallbackDocs = this.generateFallbackDocumentation(prompt, context7Libraries);
        return {
          docs: fallbackDocs,
          libraries: ['fallback']
        };
      }

      return {
        docs: allDocs.join('\n\n'),
        libraries: successfulLibraries
      };

    } catch (error) {
      this.logger.error('Context7 documentation retrieval failed', {
        libraries: context7Libraries,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Process Context7 documentation for better relevance
   * Implements intelligent content filtering and prioritization
   */
  processContext7Documentation(
    docs: string,
    libraryId: string,
    prompt: string,
    promptKeywords: string[]
  ): string {
    if (!docs || docs.length === 0) return docs;
    
    // Split documentation into sections
    const sections = this.splitIntoSections(docs);
    const scoredSections = this.scoreSections(sections, promptKeywords);
    
    // Boost scores for specific content types based on library
    const enhancedSections = scoredSections.map(section => {
      let enhancedScore = section.score;
      
      // Boost scores for practical content
      if (section.content.includes('```') || section.content.includes('example')) {
        enhancedScore += 5;
      }
      
      // Boost scores for API references
      if (section.content.includes('function') || section.content.includes('method')) {
        enhancedScore += 3;
      }
      
      // Library-specific boosts
      if (libraryId.includes('react') && section.content.includes('component')) {
        enhancedScore += 4;
      }
      
      if (libraryId.includes('next') && section.content.includes('api')) {
        enhancedScore += 4;
      }
      
      if (libraryId.includes('html') && section.content.includes('element')) {
        enhancedScore += 4;
      }
      
      if (libraryId.includes('css') && section.content.includes('property')) {
        enhancedScore += 4;
      }
      
      return { ...section, score: enhancedScore };
    });
    
    // Select top sections and join them
    const topSections = enhancedSections
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Limit to top 5 sections
      .map(section => section.content);
    
    return topSections.join('\n\n');
  }

  /**
   * Get topics for a framework to help with scoring
   */
  private getTopicsForFramework(framework: string): string[] {
    const topicMap: Record<string, string[]> = {
      'html': ['elements', 'attributes', 'semantic', 'accessibility'],
      'css': ['styling', 'layout', 'flexbox', 'grid', 'animations'],
      'javascript': ['functions', 'objects', 'arrays', 'async', 'dom'],
      'react': ['components', 'hooks', 'state', 'props', 'jsx'],
      'nextjs': ['routing', 'api', 'ssr', 'ssg', 'middleware'],
      'typescript': ['types', 'interfaces', 'generics', 'enums'],
      'vue': ['components', 'directives', 'composition', 'reactivity'],
      'angular': ['components', 'services', 'dependency', 'injection'],
      'express': ['middleware', 'routing', 'api', 'sessions'],
      'nodejs': ['modules', 'fs', 'http', 'streams', 'events']
    };
    
    return topicMap[framework.toLowerCase()] || [];
  }

  /**
   * Extract topic from prompt for Context7 queries
   * Implements intelligent topic extraction
   */
  private extractTopicFromPrompt(prompt: string): string {
    const promptLower = prompt.toLowerCase();
    
    // Topic mapping based on common patterns
    const topicMap = {
      'component': 'components',
      'routing': 'routing',
      'route': 'routing',
      'auth': 'authentication',
      'login': 'authentication',
      'api': 'api',
      'endpoint': 'api',
      'styling': 'styling',
      'css': 'styling',
      'test': 'testing',
      'testing': 'testing',
      'error': 'error handling',
      'exception': 'error handling',
      'performance': 'performance',
      'optimization': 'performance',
      'security': 'security',
      'deployment': 'deployment',
      'docker': 'deployment',
      'database': 'database',
      'db': 'database',
      'migration': 'database',
      'hook': 'hooks',
      'lifecycle': 'lifecycle',
      'state': 'state management',
      'redux': 'state management',
      'context': 'state management'
    };
    
    for (const [keyword, topic] of Object.entries(topicMap)) {
      if (promptLower.includes(keyword)) {
        return topic;
      }
    }
    
    return 'best practices';
  }

  /**
   * Extract keywords from prompt for better analysis
   * Used for Context7 library selection and content scoring
   */
  private extractKeywords(prompt: string): string[] {
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
   * Split documentation into sections for processing
   */
  private splitIntoSections(docs: string): Array<{ content: string; score: number }> {
    // Split by headers (## or ###)
    const sections = docs.split(/(?=^#{2,3}\s)/m)
      .filter(section => section.trim().length > 0)
      .map(section => ({ content: section.trim(), score: 0 }));
    
    return sections;
  }

  /**
   * Score sections based on prompt keywords
   */
  private scoreSections(sections: Array<{ content: string; score: number }>, promptKeywords: string[]): Array<{ content: string; score: number }> {
    return sections.map(section => {
      let score = 0;
      const contentLower = section.content.toLowerCase();
      
      // Score based on keyword matches
      for (const keyword of promptKeywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
      
      // Score based on code examples
      if (section.content.includes('```')) {
        score += 3;
      }
      
      // Score based on examples
      if (contentLower.includes('example') || contentLower.includes('usage')) {
        score += 2;
      }
      
      return { ...section, score };
    });
  }

  /**
   * Generate fallback documentation when Context7 is unavailable
   */
  private generateFallbackDocumentation(prompt: string, requestedLibraries: string[]): string {
    const promptLower = prompt.toLowerCase();
    const fallbackDocs: string[] = [];
    
    // HTML/CSS fallback for web development
    if (promptLower.includes('html') || promptLower.includes('page') || promptLower.includes('web')) {
      fallbackDocs.push(`
## HTML Best Practices

### Semantic HTML
- Use semantic elements like <header>, <nav>, <main>, <section>, <article>, <aside>, <footer>
- This improves accessibility and SEO

### Modern HTML Structure
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
</head>
<body>
    <!-- Your content here -->
</body>
</html>
\`\`\`

### Accessibility
- Always include alt text for images
- Use proper heading hierarchy (h1, h2, h3...)
- Ensure sufficient color contrast
- Make interactive elements keyboard accessible
      `);
    }
    
    // CSS fallback
    if (promptLower.includes('css') || promptLower.includes('style') || promptLower.includes('design')) {
      fallbackDocs.push(`
## CSS Best Practices

### Modern CSS Layout
- Use CSS Grid for complex layouts
- Use Flexbox for component layouts
- Use CSS Custom Properties (variables) for theming

### Responsive Design
\`\`\`css
.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
    }
}
\`\`\`

### Performance
- Use CSS transforms instead of changing layout properties
- Minimize reflows and repaints
- Use CSS containment when possible
      `);
    }
    
    // JavaScript/TypeScript fallback
    if (promptLower.includes('javascript') || promptLower.includes('typescript') || promptLower.includes('js')) {
      fallbackDocs.push(`
## JavaScript/TypeScript Best Practices

### Modern JavaScript
- Use const/let instead of var
- Use arrow functions for short functions
- Use template literals for string interpolation
- Use destructuring for object/array assignment

### TypeScript Benefits
- Type safety catches errors at compile time
- Better IDE support with autocomplete
- Self-documenting code with type annotations
- Refactoring is safer with type checking

### Example TypeScript Function
\`\`\`typescript
interface User {
    id: number;
    name: string;
    email: string;
}

function createUser(userData: Partial<User>): User {
    return {
        id: Date.now(),
        name: userData.name || 'Anonymous',
        email: userData.email || ''
    };
}
\`\`\`
      `);
    }
    
    // General programming fallback
    if (fallbackDocs.length === 0) {
      fallbackDocs.push(`
## General Programming Best Practices

### Code Quality
- Write clean, readable code
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Follow consistent coding style

### Error Handling
- Always handle potential errors
- Use try-catch blocks appropriately
- Provide meaningful error messages
- Log errors for debugging

### Performance
- Optimize for readability first, then performance
- Profile before optimizing
- Use appropriate data structures
- Avoid premature optimization
      `);
    }
    
    return fallbackDocs.join('\n\n');
  }
}
