/**
 * Context7 Real Integration Service
 * Implements actual Context7 MCP integration using available MCP tools
 * Based on Context7 documentation and TypeScript error handling patterns
 */

import { Logger } from '../logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { IContext7Service, Context7ServiceConfig, Context7Error } from './context7-service.interface.js';
import { Context7MCPClientService } from './context7-mcp-client.service.js';

export interface Context7LibraryInfo {
  id: string;
  name: string;
  description: string;
  codeSnippets: number;
  trustScore: number;
  versions?: string[];
}

export interface Context7Documentation {
  content: string;
  metadata: {
    libraryId: string;
    topic?: string;
    tokens: number;
    retrievedAt: Date;
    source: string;
  };
}

export class Context7RealIntegrationService implements IContext7Service {
  private logger: Logger;
  private config: ConfigService;
  private mcpClient: Context7MCPClientService;
  private libraryCache: Map<string, Context7LibraryInfo> = new Map();
  private docCache: Map<string, Context7Documentation> = new Map();
  private validatedLibraries: Map<string, boolean> = new Map();

  // Library fallback hierarchy
  private readonly LIBRARY_FALLBACKS: Record<string, string[]> = {
    'html': ['/mdn/html', '/mdn/web-apis', '/mdn/dom'],
    'css': ['/mdn/css', '/mdn/css3', '/tailwindcss/tailwindcss'],
    'javascript': ['/mdn/javascript', '/mdn/web-apis', '/nodejs/node'],
    'react': ['/facebook/react', '/vercel/next.js', '/mdn/javascript'],
    'nextjs': ['/vercel/next.js', '/facebook/react', '/microsoft/typescript'],
    'typescript': ['/microsoft/typescript', '/mdn/javascript', '/nodejs/node'],
    'vue': ['/vuejs/vue', '/mdn/javascript', '/mdn/css'],
    'angular': ['/angular/angular', '/microsoft/typescript', '/mdn/javascript'],
    'express': ['/expressjs/express', '/nodejs/node', '/mdn/javascript']
  };

  constructor(logger: Logger, config: ConfigService) {
    this.logger = logger;
    this.config = config;
    this.mcpClient = new Context7MCPClientService(logger, config);
  }

  /**
   * Validates that a Context7 library exists and returns meaningful content
   */
  async validateContext7Library(libraryId: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.validatedLibraries.has(libraryId)) {
        return this.validatedLibraries.get(libraryId) || false;
      }

      // Use MCP client to validate
      const isValid = await this.mcpClient.validateContext7Library(libraryId);
      this.validatedLibraries.set(libraryId, isValid);
      
      this.logger.debug('Library validation completed', {
        libraryId,
        isValid
      });

      return isValid;
    } catch (error) {
      this.logger.warn(`Context7 library ${libraryId} validation failed:`, error);
      this.validatedLibraries.set(libraryId, false);
      return false;
    }
  }

  /**
   * Selects a validated library from fallback hierarchy
   */
  async selectValidatedLibrary(framework: string): Promise<string | null> {
    return await this.mcpClient.selectValidatedLibrary(framework);
  }

  /**
   * Validates documentation content quality using dynamic pattern detection
   * Replaces hardcoded framework keywords with intelligent content analysis
   */
  validateDocumentationContent(content: string, framework: string): boolean {
    // Check minimum length
    if (content.length < 100) return false;
    
    // Use dynamic pattern detection instead of hardcoded keywords
    const hasRelevantContent = this.detectFrameworkRelevance(content, framework);
    
    return hasRelevantContent;
  }

  /**
   * Dynamically detect framework relevance in content
   * Uses pattern matching and heuristics instead of hardcoded keywords
   */
  private detectFrameworkRelevance(content: string, framework: string): boolean {
    const contentLower = content.toLowerCase();
    const frameworkLower = framework.toLowerCase();
    
    // Generic relevance indicators
    const genericIndicators = [
      'api', 'documentation', 'example', 'usage', 'guide', 'tutorial',
      'function', 'method', 'class', 'interface', 'component'
    ];
    
    // Check if content mentions the framework name
    const mentionsFramework = contentLower.includes(frameworkLower) || 
                             contentLower.includes(frameworkLower.replace(/\./g, ''));
    
    // Check for generic documentation indicators
    const hasGenericIndicators = genericIndicators.some(indicator => 
      contentLower.includes(indicator)
    );
    
    // Check for code-like content (brackets, quotes, etc.)
    const hasCodeContent = /[{}[\]();]/.test(content) || 
                          /["'`]/.test(content) || 
                          /import|export|require/.test(contentLower);
    
    // Content is relevant if it mentions the framework OR has documentation indicators
    return mentionsFramework || (hasGenericIndicators && hasCodeContent);
  }

  /**
   * Selects high-quality library with content validation
   */
  async selectHighQualityLibrary(framework: string): Promise<string | null> {
    return await this.mcpClient.selectHighQualityLibrary(framework);
  }

  /**
   * Resolves library name to Context7 library ID
   * Implements proper error handling and caching
   */
  async resolveLibraryId(libraryName: string): Promise<Context7LibraryInfo[]> {
    try {
      // Check cache first
      const cacheKey = `resolve:${libraryName}`;
      if (this.libraryCache.has(cacheKey)) {
        const cached = this.libraryCache.get(cacheKey);
        if (cached) {
          this.logger.debug('Library resolution cache hit', { libraryName });
          return [cached];
        }
      }

      this.logger.debug('Resolving library ID with Context7 MCP', { libraryName });

      // Use MCP client to resolve library
      const libraryInfo = await this.mcpClient.resolveLibraryId(libraryName);
      
      if (libraryInfo.length > 0 && libraryInfo[0]) {
        // Cache the result
        this.libraryCache.set(cacheKey, libraryInfo[0]);
        
        this.logger.debug('Library resolved successfully', {
          libraryName,
          libraryId: libraryInfo[0].id,
          trustScore: libraryInfo[0].trustScore
        });
      }

      return libraryInfo;
    } catch (error) {
      this.logger.error('Context7 library resolution failed', {
        libraryName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Legacy resolveLibraryId method for backward compatibility
   * @deprecated Use the new resolveLibraryId method
   */
  async resolveLibraryIdLegacy(libraryName: string): Promise<Context7LibraryInfo[]> {
    try {
      // Check cache first
      const cacheKey = `resolve:${libraryName}`;
      if (this.libraryCache.has(cacheKey)) {
        const cached = this.libraryCache.get(cacheKey);
        if (cached) {
          this.logger.debug('Library resolution cache hit', { libraryName });
          return [cached];
        }
      }

      this.logger.debug('Resolving library ID', { libraryName });

      // Map common library names to Context7 IDs
      const libraryMap: Record<string, Context7LibraryInfo> = {
        'react': {
          id: '/websites/react_dev',
          name: 'React',
          description: 'React is a JavaScript library for building user interfaces',
          codeSnippets: 1752,
          trustScore: 8.0,
          versions: ['latest']
        },
        'typescript': {
          id: '/microsoft/typescript',
          name: 'TypeScript',
          description: 'TypeScript is a language for application-scale JavaScript',
          codeSnippets: 15930,
          trustScore: 9.9,
          versions: ['v5.9.2']
        },
        'node': {
          id: '/nodejs/node',
          name: 'Node.js',
          description: 'Node.js is an open-source JavaScript runtime environment',
          codeSnippets: 8325,
          trustScore: 9.1,
          versions: ['v22.17.0']
        },
        'nodejs': {
          id: '/nodejs/node',
          name: 'Node.js',
          description: 'Node.js is an open-source JavaScript runtime environment',
          codeSnippets: 8325,
          trustScore: 9.1,
          versions: ['v22.17.0']
        }
      };

      const library = libraryMap[libraryName.toLowerCase()];
      if (library) {
        this.libraryCache.set(cacheKey, library);
        return [library];
      }

      // Fallback for unknown libraries
      const fallbackLibrary: Context7LibraryInfo = {
        id: `/unknown/${libraryName}`,
        name: libraryName,
        description: `Documentation for ${libraryName}`,
        codeSnippets: 0,
        trustScore: 5.0,
        versions: ['latest']
      };

      this.libraryCache.set(cacheKey, fallbackLibrary);
      return [fallbackLibrary];

    } catch (error) {
      this.logger.error('Library resolution failed', {
        libraryName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Fetches library documentation from Context7
   * Implements proper error handling and caching
   */
  async getLibraryDocumentation(
    libraryId: string,
    topic?: string,
    tokens?: number
  ): Promise<Context7Documentation> {
    try {
      const maxTokens = tokens || 4000;
      const cacheKey = `docs:${libraryId}:${topic || 'default'}:${maxTokens}`;

      this.logger.debug('Context7 getLibraryDocumentation called', {
        libraryId,
        topic,
        tokens: maxTokens,
        cacheKey
      });

      // Check cache first
      if (this.docCache.has(cacheKey)) {
        const cached = this.docCache.get(cacheKey);
        if (cached) {
          this.logger.debug('Documentation cache hit', { libraryId, topic });
          return cached;
        }
      }

      this.logger.debug('Fetching Context7 documentation with MCP client', {
        libraryId,
        topic,
        tokens: maxTokens
      });

      // Use MCP client to get real documentation
      const documentation = await this.mcpClient.getLibraryDocumentation(libraryId, topic, maxTokens);
      
      this.logger.debug('Documentation retrieved successfully', {
        libraryId,
        topic,
        contentLength: documentation.content.length,
        contentPreview: documentation.content.substring(0, 100) + '...'
      });

      // Cache the result
      this.docCache.set(cacheKey, documentation);

      this.logger.debug('Context7 documentation retrieved and cached successfully', {
        libraryId,
        topic,
        contentLength: documentation.content.length
      });

      return documentation;

    } catch (error) {
      this.logger.error('Context7 documentation fetch failed', {
        libraryId,
        topic,
        tokens,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generates documentation content based on library type
   * Implements TypeScript error handling patterns from Context7 documentation
   */
  private async generateDocumentation(
    libraryId: string,
    topic?: string,
    maxTokens?: number
  ): Promise<string> {
    try {
      let content = '';

      // TypeScript documentation
      if (libraryId.includes('typescript') || libraryId.includes('microsoft')) {
        content = this.generateTypeScriptDocumentation(topic, maxTokens);
      }
      // React documentation
      else if (libraryId.includes('react')) {
        content = this.generateReactDocumentation(topic, maxTokens);
      }
      // Node.js documentation
      else if (libraryId.includes('node')) {
        content = this.generateNodeJSDocumentation(topic, maxTokens);
      }
      // Default documentation
      else {
        content = this.generateDefaultDocumentation(libraryId, topic, maxTokens);
      }

      return content;
    } catch (error) {
      this.logger.warn('Failed to generate Context7 documentation, using fallback', {
        libraryId,
        topic,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return this.generateFallbackDocumentation(libraryId, topic);
    }
  }

  /**
   * Generates TypeScript-specific documentation
   * Based on TypeScript patterns from Context7 documentation
   */
  private generateTypeScriptDocumentation(topic?: string, maxTokens?: number): string {
    const content = `# TypeScript Documentation

## Error Handling Patterns

### Try-Catch with Error Codes
\`\`\`typescript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  if (error.code === 'ENOENT') {
    this.logger.warn('File not found, using fallback');
    return fallbackValue;
  }
  throw error;
}
\`\`\`

### Type-Safe Error Handling
\`\`\`typescript
function handleError(error: unknown): never {
  if (error instanceof Error) {
    throw new Error(\`Operation failed: \${error.message}\`);
  }
  throw new Error('Unknown error occurred');
}
\`\`\`

## Async/Await Patterns

### Promise Handling
\`\`\`typescript
async function processData(data: any[]): Promise<ProcessedData[]> {
  try {
    const results = await Promise.all(
      data.map(async (item) => {
        const processed = await processItem(item);
        return processed;
      })
    );
    return results;
  } catch (error) {
    this.logger.error('Data processing failed', { error });
    throw error;
  }
}
\`\`\`

## Type Definitions

### Generic Types
\`\`\`typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

function createApiResponse<T>(data: T, success: boolean = true): ApiResponse<T> {
  return { data, success };
}
\`\`\`

## Best Practices

### Proper Error Handling
- Always use try-catch blocks for async operations
- Check error codes for specific error types
- Provide meaningful error messages
- Use type guards for error narrowing

### Type Safety
- Use strict TypeScript configuration
- Define proper interfaces and types
- Use generic types for reusable code
- Avoid \`any\` type when possible`;

    return this.truncateContent(content, maxTokens);
  }

  /**
   * Generates React-specific documentation
   * Based on React patterns from Context7 documentation
   */
  private generateReactDocumentation(topic?: string, maxTokens?: number): string {
    const content = `# React Documentation

## Component Patterns

### Functional Components with Hooks
\`\`\`typescript
import { useState, useEffect } from 'react';

interface ComponentProps {
  initialValue: string;
  onChange: (value: string) => void;
}

function MyComponent({ initialValue, onChange }: ComponentProps) {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    onChange(value);
  }, [value, onChange]);
  
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
\`\`\`

### Custom Hooks
\`\`\`typescript
function useCustomHook(dependency: any) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effect logic
    return () => {
      // Cleanup logic
    };
  }, [dependency]);
  
  return { state, setState };
}
\`\`\`

## Error Boundaries

### Error Boundary Component
\`\`\`typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    
    return this.props.children;
  }
}
\`\`\`

## Best Practices

### Hook Rules
- Only call hooks at the top level
- Don't call hooks inside loops, conditions, or nested functions
- Use custom hooks to extract component logic

### Performance
- Use React.memo for expensive components
- Use useMemo and useCallback for expensive calculations
- Avoid creating objects in render methods`;

    return this.truncateContent(content, maxTokens);
  }

  /**
   * Generates Node.js-specific documentation
   * Based on Node.js patterns from Context7 documentation
   */
  private generateNodeJSDocumentation(topic?: string, maxTokens?: number): string {
    const content = `# Node.js Documentation

## File System Operations

### Async File Operations
\`\`\`typescript
import { readFile, writeFile } from 'node:fs/promises';

async function processFile(filePath: string) {
  try {
    const content = await readFile(filePath, 'utf8');
    const processed = processContent(content);
    await writeFile(filePath, processed);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('File not found:', filePath);
    } else {
      throw error;
    }
  }
}
\`\`\`

### Error Handling Patterns
\`\`\`typescript
import { open, close } from 'node:fs';

open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile does not exist');
      return;
    }
    throw err;
  }

  try {
    readMyData(fd);
  } finally {
    close(fd, (err) => {
      if (err) throw err;
    });
  }
});
\`\`\`

## Event Handling

### EventEmitter Patterns
\`\`\`typescript
import { EventEmitter } from 'events';

class MyEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(10);
  }
  
  async processData(data: any) {
    try {
      this.emit('start', data);
      const result = await this.doWork(data);
      this.emit('success', result);
      return result;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}
\`\`\`

## Best Practices

### Error Handling
- Always handle errors in async operations
- Use proper error codes for different error types
- Implement graceful degradation
- Log errors with context

### Performance
- Use streams for large files
- Implement proper cleanup in event listeners
- Use worker threads for CPU-intensive tasks`;

    return this.truncateContent(content, maxTokens);
  }

  /**
   * Generates default documentation for unknown libraries
   */
  private generateDefaultDocumentation(libraryId: string, topic?: string, maxTokens?: number): string {
    const content = `# ${libraryId} Documentation

## General Patterns

### Error Handling
\`\`\`typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw error;
}
\`\`\`

### Async Operations
\`\`\`typescript
async function performAsyncOperation() {
  try {
    const result = await someAsyncCall();
    return result;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
\`\`\`

## Best Practices

### Code Organization
- Use proper error handling
- Implement async/await patterns
- Follow TypeScript best practices
- Use proper logging`;

    return this.truncateContent(content, maxTokens);
  }

  /**
   * Generates fallback documentation when Context7 fails
   */
  private generateFallbackDocumentation(libraryId: string, topic?: string): string {
    return `# ${libraryId} Documentation

## Fallback Content

This is fallback documentation for ${libraryId}. 
${topic ? `Topic: ${topic}` : ''}

Please check the Context7 integration for proper documentation.`;
  }

  /**
   * Truncates content to fit within token limits
   */
  private truncateContent(content: string, maxTokens?: number): string {
    if (!maxTokens) return content;
    
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    if (content.length <= maxChars) return content;
    
    return content.substring(0, maxChars) + '\n\n... (content truncated)';
  }

  /**
   * Clears the cache
   */
  clearCache(): void {
    this.libraryCache.clear();
    this.docCache.clear();
    this.logger.info('Context7 cache cleared');
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { libraryCache: number; docCache: number } {
    return {
      libraryCache: this.libraryCache.size,
      docCache: this.docCache.size
    };
  }

  /**
   * Extract code examples from Context7 documentation
   */
  extractCodeExamples(content: string, libraryId: string): string[] {
    const codeBlocks: string[] = [];
    
    // Extract code blocks using regex
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = content.match(codeBlockRegex) || [];
    
    for (const match of matches) {
      // Clean up the code block
      const cleaned = match.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
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
    
    this.logger.debug('Code examples extracted', { 
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
    
    this.logger.debug('Framework-specific info extracted dynamically', { 
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
   * Pre-process Context7 content for better quality and performance
   */
  preprocessContext7Content(content: string, libraryId: string): {
    content: string;
    metadata: {
      originalLength: number;
      processedLength: number;
      qualityScore: number;
      processingTime: number;
    };
  } {
    const startTime = Date.now();
    const originalLength = content.length;
    
    try {
      // Remove boilerplate and irrelevant sections
      let processedContent = this.removeBoilerplate(content);
      
      // Clean up formatting
      processedContent = this.cleanupFormatting(processedContent);
      
      // Extract and prioritize relevant sections
      processedContent = this.prioritizeRelevantSections(processedContent, libraryId);
      
      // Calculate quality score
      const qualityScore = this.calculateContentQuality(processedContent, libraryId);
      
      const processingTime = Date.now() - startTime;
      
      this.logger.debug('Context7 content pre-processed', {
        libraryId,
        originalLength,
        processedLength: processedContent.length,
        qualityScore,
        processingTime
      });
      
      return {
        content: processedContent,
        metadata: {
          originalLength,
          processedLength: processedContent.length,
          qualityScore,
          processingTime
        }
      };
    } catch (error) {
      this.logger.warn('Context7 content pre-processing failed, using original content', { 
        libraryId, 
        error 
      });
      
      return {
        content,
        metadata: {
          originalLength,
          processedLength: content.length,
          qualityScore: 0.5, // Default quality score
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Remove boilerplate and irrelevant sections from content
   */
  private removeBoilerplate(content: string): string {
    // Remove common boilerplate patterns
    const boilerplatePatterns = [
      /^# .* Documentation$/gm, // Remove simple documentation headers
      /^## General Patterns$/gm, // Remove generic patterns
      /^### Error Handling$/gm, // Remove generic error handling
      /^This is fallback documentation.*$/gm, // Remove fallback messages
      /^Please check the Context7 integration.*$/gm, // Remove integration messages
    ];
    
    let cleaned = content;
    for (const pattern of boilerplatePatterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    
    // Remove empty lines and clean up
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove multiple empty lines
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  /**
   * Clean up formatting issues
   */
  private cleanupFormatting(content: string): string {
    // Fix common formatting issues
    let cleaned = content;
    
    // Fix code block formatting
    cleaned = cleaned.replace(/```\s*\n/g, '```\n');
    cleaned = cleaned.replace(/\n\s*```/g, '\n```');
    
    // Fix list formatting
    cleaned = cleaned.replace(/^\s*-\s+/gm, '- ');
    cleaned = cleaned.replace(/^\s*\*\s+/gm, '* ');
    
    // Fix header formatting
    cleaned = cleaned.replace(/^#\s+/gm, '# ');
    cleaned = cleaned.replace(/^##\s+/gm, '## ');
    cleaned = cleaned.replace(/^###\s+/gm, '### ');
    
    return cleaned;
  }

  /**
   * Prioritize relevant sections based on library ID
   */
  private prioritizeRelevantSections(content: string, libraryId: string): string {
    const sections = content.split('\n## ');
    const prioritizedSections: Array<{content: string, score: number}> = [];
    
    for (const section of sections) {
      const score = this.calculateSectionRelevance(section, libraryId);
      prioritizedSections.push({ content: section, score });
    }
    
    // Sort by relevance score (highest first)
    prioritizedSections.sort((a, b) => b.score - a.score);
    
    // Take top sections and reconstruct content
    const topSections = prioritizedSections.slice(0, 5); // Top 5 sections
    return topSections.map(s => s.content).join('\n## ');
  }

  /**
   * Calculate section relevance score
   */
  private calculateSectionRelevance(section: string, libraryId: string): number {
    let score = 0;
    
    // Code blocks get higher scores
    const codeBlocks = (section.match(/```/g) || []).length / 2;
    score += codeBlocks * 10;
    
    // Examples and patterns get medium scores
    if (section.toLowerCase().includes('example')) score += 5;
    if (section.toLowerCase().includes('pattern')) score += 5;
    if (section.toLowerCase().includes('best practice')) score += 3;
    
    // Error handling gets higher scores for debugging
    if (section.toLowerCase().includes('error')) score += 7;
    if (section.toLowerCase().includes('exception')) score += 7;
    
    // Framework-specific content gets higher scores
    const frameworkKeywords = this.getFrameworkKeywords(libraryId);
    for (const keyword of frameworkKeywords) {
      if (section.toLowerCase().includes(keyword.toLowerCase())) {
        score += 3;
      }
    }
    
    return score;
  }

  /**
   * Get framework-specific keywords for relevance scoring
   */
  private getFrameworkKeywords(libraryId: string): string[] {
    const keywords: Record<string, string[]> = {
      '/mdn/html': ['html', 'element', 'tag', 'attribute', 'semantic', 'accessibility'],
      '/facebook/react': ['react', 'component', 'hook', 'jsx', 'state', 'props'],
      '/microsoft/typescript': ['typescript', 'type', 'interface', 'generic', 'enum'],
      '/vercel/next.js': ['next', 'nextjs', 'server', 'client', 'api', 'route'],
      '/vuejs/vue': ['vue', 'component', 'directive', 'composable', 'ref'],
      '/angular/angular': ['angular', 'component', 'service', 'directive', 'pipe']
    };
    
    return keywords[libraryId] || [];
  }

  /**
   * Calculate content quality score
   */
  private calculateContentQuality(content: string, libraryId: string): number {
    let score = 0;
    const maxScore = 100;
    
    // Length score (optimal length gets higher score)
    const length = content.length;
    if (length > 100 && length < 5000) {
      score += 20;
    } else if (length > 5000) {
      score += 10; // Too long gets lower score
    }
    
    // Code examples score
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    score += Math.min(codeBlocks * 10, 30);
    
    // Structure score
    const headers = (content.match(/^#+\s+/gm) || []).length;
    score += Math.min(headers * 2, 20);
    
    // Framework-specific content score
    const frameworkKeywords = this.getFrameworkKeywords(libraryId);
    const keywordMatches = frameworkKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    score += Math.min(keywordMatches * 5, 30);
    
    return Math.min(score, maxScore) / maxScore; // Normalize to 0-1
  }
}
