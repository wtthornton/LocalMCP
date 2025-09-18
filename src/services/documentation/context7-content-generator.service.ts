/**
 * Context7 Content Generator Service
 * 
 * Phase 6: Dynamic content generation using Context7 MCP
 * 
 * Benefits for vibe coders:
 * - Always up-to-date documentation
 * - Context-aware content generation
 * - Real-time framework information
 * - Intelligent content suggestions
 */

import { Context7MCPClientService } from '../context7/context7-mcp-client.service';
import { VectorDatabaseService } from '../vector-database/vector-database.service';
import { EventEmitter } from 'events';

export interface ContentGenerationRequest {
  topic: string;
  pageType: 'getting-started' | 'tutorial' | 'reference' | 'troubleshooting' | 'advanced';
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  projectContext?: string;
  preferredFrameworks?: string[];
  maxLength?: number;
  includeExamples?: boolean;
  includeScreenshots?: boolean;
}

export interface GeneratedContent {
  title: string;
  content: string;
  examples: CodeExample[];
  relatedTopics: string[];
  tags: string[];
  lastUpdated: Date;
  sources: ContentSource[];
  confidence: number;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  framework?: string;
  runnable: boolean;
  expectedOutput?: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ContentSource {
  type: 'context7' | 'rag' | 'local' | 'web';
  title: string;
  url?: string;
  relevance: number;
  lastUpdated: Date;
}

export class Context7ContentGeneratorService extends EventEmitter {
  private context7Client: Context7MCPClientService;
  private vectorDb: VectorDatabaseService;
  private contentCache: Map<string, GeneratedContent> = new Map();
  private isGenerating: boolean = false;

  constructor(
    context7Client: Context7MCPClientService,
    vectorDb: VectorDatabaseService
  ) {
    super();
    this.context7Client = context7Client;
    this.vectorDb = vectorDb;
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Context7 Content Generator Service...');
    
    try {
      // Test Context7 connection
      await this.testContext7Connection();
      
      console.log('✅ Context7 Content Generator Service started');
      this.emit('started');
    } catch (error) {
      console.error('❌ Failed to start Context7 Content Generator Service:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    if (this.isGenerating) {
      throw new Error('Content generation already in progress');
    }

    this.isGenerating = true;
    console.log(`📝 Generating content for: ${request.topic}`);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = this.contentCache.get(cacheKey);
      if (cached && this.isContentFresh(cached)) {
        console.log('📚 Using cached content');
        return cached;
      }

      // Generate new content
      const content = await this.generateNewContent(request);
      
      // Cache the result
      this.contentCache.set(cacheKey, content);
      
      console.log('✅ Content generated successfully');
      this.emit('contentGenerated', { topic: request.topic, content });
      
      return content;
    } catch (error) {
      console.error('❌ Failed to generate content:', error);
      this.emit('error', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  private async generateNewContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    // Step 1: Gather information from Context7
    const context7Info = await this.gatherContext7Info(request);
    
    // Step 2: Gather project-specific information from RAG
    const ragInfo = await this.gatherRAGInfo(request);
    
    // Step 3: Generate content based on gathered information
    const content = await this.synthesizeContent(request, context7Info, ragInfo);
    
    // Step 4: Generate examples
    const examples = await this.generateExamples(request, context7Info, ragInfo);
    
    // Step 5: Generate related topics
    const relatedTopics = await this.generateRelatedTopics(request, context7Info, ragInfo);
    
    // Step 6: Generate tags
    const tags = this.generateTags(request, content);
    
    return {
      title: this.generateTitle(request.topic, request.pageType),
      content,
      examples,
      relatedTopics,
      tags,
      lastUpdated: new Date(),
      sources: [...context7Info.sources, ...ragInfo.sources],
      confidence: this.calculateConfidence(context7Info, ragInfo)
    };
  }

  private async gatherContext7Info(request: ContentGenerationRequest): Promise<{
    content: string;
    sources: ContentSource[];
  }> {
    try {
      // Search for relevant documentation
      const searchResults = await this.context7Client.searchDocumentation(
        request.topic,
        10
      );

      if (!searchResults || searchResults.length === 0) {
        return {
          content: `# ${request.topic}\n\nContent will be generated based on Context7 documentation.`,
          sources: []
        };
      }

      // Process search results
      const content = searchResults
        .map(result => result.content)
        .join('\n\n');

      const sources: ContentSource[] = searchResults.map(result => ({
        type: 'context7',
        title: result.title || 'Context7 Documentation',
        url: result.url,
        relevance: result.relevance || 0.8,
        lastUpdated: new Date()
      }));

      return { content, sources };
    } catch (error) {
      console.warn('⚠️  Context7 information gathering failed:', error);
      return {
        content: `# ${request.topic}\n\nContent will be generated based on Context7 documentation.`,
        sources: []
      };
    }
  }

  private async gatherRAGInfo(request: ContentGenerationRequest): Promise<{
    content: string;
    sources: ContentSource[];
  }> {
    try {
      // Query vector database for project-specific information
      const ragResults = await this.vectorDb.query(
        request.topic,
        {
          maxResults: 5,
          minRelevance: 0.7,
          filters: request.projectContext ? { project: request.projectContext } : undefined
        }
      );

      if (!ragResults || ragResults.length === 0) {
        return {
          content: '',
          sources: []
        };
      }

      const content = ragResults
        .map(result => result.content)
        .join('\n\n');

      const sources: ContentSource[] = ragResults.map(result => ({
        type: 'rag',
        title: result.metadata?.title || 'Project Documentation',
        url: result.metadata?.url,
        relevance: result.relevance,
        lastUpdated: new Date(result.metadata?.lastUpdated || Date.now())
      }));

      return { content, sources };
    } catch (error) {
      console.warn('⚠️  RAG information gathering failed:', error);
      return {
        content: '',
        sources: []
      };
    }
  }

  private async synthesizeContent(
    request: ContentGenerationRequest,
    context7Info: { content: string; sources: ContentSource[] },
    ragInfo: { content: string; sources: ContentSource[] }
  ): Promise<string> {
    // Combine Context7 and RAG information
    let content = '';

    // Add introduction based on page type
    content += this.generateIntroduction(request);

    // Add Context7 content
    if (context7Info.content) {
      content += '\n\n## Framework Documentation\n\n';
      content += this.processContext7Content(context7Info.content, request);
    }

    // Add project-specific content
    if (ragInfo.content) {
      content += '\n\n## Project-Specific Information\n\n';
      content += this.processRAGContent(ragInfo.content, request);
    }

    // Add conclusion
    content += '\n\n## Next Steps\n\n';
    content += this.generateNextSteps(request);

    return content;
  }

  private generateIntroduction(request: ContentGenerationRequest): string {
    const introductions = {
      'getting-started': `# ${request.topic}\n\nWelcome to LocalMCP! This guide will help you get started with ${request.topic} and set up your development environment.`,
      'tutorial': `# ${request.topic} Tutorial\n\nFollow this step-by-step tutorial to learn ${request.topic} with practical examples.`,
      'reference': `# ${request.topic} Reference\n\nComplete reference documentation for ${request.topic} including all available options and configurations.`,
      'troubleshooting': `# ${request.topic} Troubleshooting\n\nCommon issues and solutions for ${request.topic}.`,
      'advanced': `# Advanced ${request.topic}\n\nAdvanced techniques and best practices for ${request.topic}.`
    };

    return introductions[request.pageType] || `# ${request.topic}\n\nLearn about ${request.topic} with LocalMCP.`;
  }

  private processContext7Content(content: string, request: ContentGenerationRequest): string {
    // Process Context7 content to match target audience
    let processed = content;

    // Simplify for beginners
    if (request.targetAudience === 'beginner') {
      processed = this.simplifyContent(processed);
    }

    // Add framework-specific information
    if (request.preferredFrameworks && request.preferredFrameworks.length > 0) {
      processed = this.addFrameworkContext(processed, request.preferredFrameworks);
    }

    return processed;
  }

  private processRAGContent(content: string, request: ContentGenerationRequest): string {
    // Process RAG content to be project-specific
    let processed = content;

    // Add project context
    if (request.projectContext) {
      processed = `This information is specific to your project: ${request.projectContext}\n\n${processed}`;
    }

    return processed;
  }

  private generateNextSteps(request: ContentGenerationRequest): string {
    const nextSteps = {
      'getting-started': [
        'Try the Quick Start guide',
        'Explore the Tool Reference',
        'Set up your first project'
      ],
      'tutorial': [
        'Practice with the examples',
        'Try variations of the code',
        'Move to the next tutorial'
      ],
      'reference': [
        'Use the search functionality',
        'Check related topics',
        'Explore advanced features'
      ],
      'troubleshooting': [
        'Check the Admin Console',
        'Review system logs',
        'Contact support if needed'
      ],
      'advanced': [
        'Experiment with configurations',
        'Explore integration options',
        'Contribute to the project'
      ]
    };

    const steps = nextSteps[request.pageType] || ['Continue learning', 'Explore more features'];
    
    return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  }

  private async generateExamples(
    request: ContentGenerationRequest,
    context7Info: { content: string; sources: ContentSource[] },
    ragInfo: { content: string; sources: ContentSource[] }
  ): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];

    // Generate examples based on topic and page type
    switch (request.pageType) {
      case 'getting-started':
        examples.push(...this.generateGettingStartedExamples(request));
        break;
      case 'tutorial':
        examples.push(...this.generateTutorialExamples(request));
        break;
      case 'reference':
        examples.push(...this.generateReferenceExamples(request));
        break;
      case 'troubleshooting':
        examples.push(...this.generateTroubleshootingExamples(request));
        break;
      case 'advanced':
        examples.push(...this.generateAdvancedExamples(request));
        break;
    }

    return examples;
  }

  private generateGettingStartedExamples(request: ContentGenerationRequest): CodeExample[] {
    return [
      {
        id: 'basic-setup',
        title: 'Basic Setup',
        description: 'Set up LocalMCP in your project',
        code: `# Install LocalMCP
npm install localmcp

# Start the server
npx localmcp start

# Test the connection
curl http://localhost:3000/health`,
        language: 'bash',
        runnable: true,
        expectedOutput: '{"status":"healthy","services":{"localmcp":"healthy"}}',
        explanation: 'This example shows how to install and start LocalMCP.',
        difficulty: 'beginner'
      }
    ];
  }

  private generateTutorialExamples(request: ContentGenerationRequest): CodeExample[] {
    return [
      {
        id: 'step-by-step',
        title: 'Step-by-Step Example',
        description: 'Follow this example to learn the basics',
        code: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "localmcp.analyze",
    "arguments": {
      "target": "src/components/Button.tsx",
      "analysisType": "code"
    }
  }
}`,
        language: 'json',
        runnable: true,
        expectedOutput: 'Analysis results with code quality metrics',
        explanation: 'This example shows how to use the analyze tool.',
        difficulty: 'intermediate'
      }
    ];
  }

  private generateReferenceExamples(request: ContentGenerationRequest): CodeExample[] {
    return [
      {
        id: 'api-reference',
        title: 'API Reference Example',
        description: 'Complete API usage example',
        code: `// Example API usage
const result = await localmcp.analyze({
  target: 'src/components/Button.tsx',
  analysisType: 'code',
  options: {
    includeMetrics: true,
    includeSuggestions: true
  }
});`,
        language: 'typescript',
        runnable: false,
        explanation: 'This example shows the complete API usage.',
        difficulty: 'advanced'
      }
    ];
  }

  private generateTroubleshootingExamples(request: ContentGenerationRequest): CodeExample[] {
    return [
      {
        id: 'common-issue',
        title: 'Common Issue Fix',
        description: 'How to fix a common problem',
        code: `# Check if LocalMCP is running
curl http://localhost:3000/health

# If not running, start it
npx localmcp start

# Check logs
npx localmcp logs`,
        language: 'bash',
        runnable: true,
        expectedOutput: 'Service status and diagnostic information',
        explanation: 'This example shows how to diagnose and fix common issues.',
        difficulty: 'beginner'
      }
    ];
  }

  private generateAdvancedExamples(request: ContentGenerationRequest): CodeExample[] {
    return [
      {
        id: 'advanced-config',
        title: 'Advanced Configuration',
        description: 'Advanced configuration example',
        code: `// Advanced LocalMCP configuration
const config = {
  pipeline: {
    stages: ['retrieve', 'analyze', 'generate', 'validate'],
    timeout: 30000,
    retries: 3
  },
  context7: {
    cache: true,
    ttl: 3600,
    fallback: true
  }
};`,
        language: 'typescript',
        runnable: false,
        explanation: 'This example shows advanced configuration options.',
        difficulty: 'advanced'
      }
    ];
  }

  private async generateRelatedTopics(
    request: ContentGenerationRequest,
    context7Info: { content: string; sources: ContentSource[] },
    ragInfo: { content: string; sources: ContentSource[] }
  ): Promise<string[]> {
    // Generate related topics based on content and context
    const topics = new Set<string>();

    // Add topics based on page type
    const typeTopics = {
      'getting-started': ['quick-start', 'tool-reference', 'configuration'],
      'tutorial': ['getting-started', 'examples', 'best-practices'],
      'reference': ['api-documentation', 'examples', 'troubleshooting'],
      'troubleshooting': ['admin-console', 'logs', 'support'],
      'advanced': ['configuration', 'integration', 'customization']
    };

    (typeTopics[request.pageType] || []).forEach(topic => topics.add(topic));

    // Add topics from Context7 sources
    context7Info.sources.forEach(source => {
      if (source.title) {
        topics.add(source.title.toLowerCase().replace(/\s+/g, '-'));
      }
    });

    return Array.from(topics).slice(0, 5);
  }

  private generateTags(request: ContentGenerationRequest, content: string): string[] {
    const tags = new Set<string>();

    // Add audience tag
    tags.add(request.targetAudience);

    // Add page type tag
    tags.add(request.pageType);

    // Add topic-based tags
    const topicWords = request.topic.toLowerCase().split(' ');
    topicWords.forEach(word => {
      if (word.length > 3) {
        tags.add(word);
      }
    });

    // Add framework tags
    if (request.preferredFrameworks) {
      request.preferredFrameworks.forEach(framework => {
        tags.add(framework.toLowerCase());
      });
    }

    return Array.from(tags).slice(0, 10);
  }

  private generateTitle(topic: string, pageType: string): string {
    const titles = {
      'getting-started': `Getting Started with ${topic}`,
      'tutorial': `${topic} Tutorial`,
      'reference': `${topic} Reference`,
      'troubleshooting': `${topic} Troubleshooting`,
      'advanced': `Advanced ${topic}`
    };

    return titles[pageType] || topic;
  }

  private generateCacheKey(request: ContentGenerationRequest): string {
    return `${request.topic}-${request.pageType}-${request.targetAudience}-${request.projectContext || 'default'}`;
  }

  private isContentFresh(content: GeneratedContent): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - content.lastUpdated.getTime() < maxAge;
  }

  private calculateConfidence(
    context7Info: { content: string; sources: ContentSource[] },
    ragInfo: { content: string; sources: ContentSource[] }
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on Context7 sources
    if (context7Info.sources.length > 0) {
      confidence += 0.3;
    }

    // Increase confidence based on RAG sources
    if (ragInfo.sources.length > 0) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  private simplifyContent(content: string): string {
    // Simple content simplification for beginners
    return content
      .replace(/advanced|complex|sophisticated/gi, 'simple')
      .replace(/expert|professional/gi, 'beginner')
      .replace(/enterprise|production/gi, 'development');
  }

  private addFrameworkContext(content: string, frameworks: string[]): string {
    let enhanced = content;
    
    frameworks.forEach(framework => {
      enhanced += `\n\n**Note**: This example uses ${framework}. Make sure you have ${framework} installed and configured.`;
    });

    return enhanced;
  }

  private async testContext7Connection(): Promise<void> {
    try {
      await this.context7Client.getHealth();
      console.log('✅ Context7 connection verified');
    } catch (error) {
      console.warn('⚠️  Context7 connection failed:', error);
      // Continue without Context7
    }
  }

  // Public API methods
  async getContent(topic: string, pageType: string): Promise<GeneratedContent | null> {
    const request: ContentGenerationRequest = {
      topic,
      pageType: pageType as any,
      targetAudience: 'intermediate',
      includeExamples: true,
      includeScreenshots: false
    };

    try {
      return await this.generateContent(request);
    } catch (error) {
      console.error('Failed to get content:', error);
      return null;
    }
  }

  clearCache(): void {
    this.contentCache.clear();
    console.log('🗑️  Content cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.contentCache.size,
      keys: Array.from(this.contentCache.keys())
    };
  }
}

export default Context7ContentGeneratorService;
