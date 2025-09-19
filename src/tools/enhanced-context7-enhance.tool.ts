/**
 * Enhanced Context7 Integration Tool
 * Implements Phase 1 high-scoring areas with comprehensive Context7 integration
 * Based on Context7 best practices and TypeScript error handling patterns
 */

import { Logger } from '../services/logger/logger';
import { ConfigService } from '../config/config.service';
import { Context7MCPComplianceService } from '../services/context7/context7-mcp-compliance.service';
import { Context7MonitoringService } from '../services/context7/context7-monitoring.service';
import { Context7AdvancedCacheService } from '../services/context7/context7-advanced-cache.service';

export interface EnhancedContext7Request {
  prompt: string;
  context?: {
    file?: string;
    framework?: string;
    style?: string;
  };
  options?: {
    useCache?: boolean;
    maxTokens?: number;
    includeMetadata?: boolean;
  };
}

export interface EnhancedContext7Response {
  enhanced_prompt: string;
  context_used: {
    repo_facts: string[];
    code_snippets: string[];
    framework_docs: string[];
    project_docs: string[];
    context7_docs: string[];
    metadata?: {
      cache_hit: boolean;
      response_time: number;
      libraries_resolved: string[];
      monitoring_metrics: any;
    };
  };
  success: boolean;
  error?: string;
}

export class EnhancedContext7EnhanceTool {
  private logger: Logger;
  private config: ConfigService;
  private mcpCompliance: Context7MCPComplianceService;
  private monitoring: Context7MonitoringService;
  private cache: Context7AdvancedCacheService;

  constructor(
    logger: Logger,
    config: ConfigService,
    mcpCompliance: Context7MCPComplianceService,
    monitoring: Context7MonitoringService,
    cache: Context7AdvancedCacheService
  ) {
    this.logger = logger;
    this.config = config;
    this.mcpCompliance = mcpCompliance;
    this.monitoring = monitoring;
    this.cache = cache;
  }

  /**
   * Enhance prompt with comprehensive Context7 integration
   * Implements Phase 1 high-scoring areas
   */
  async enhance(request: EnhancedContext7Request): Promise<EnhancedContext7Response> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting enhanced Context7 prompt enhancement', {
        prompt: request.prompt.substring(0, 100) + '...',
        context: request.context,
        options: request.options
      });

      // 1. Detect framework from context or prompt
      const framework = await this.detectFramework(request);
      
      // 2. Get Context7 documentation with caching
      let context7Docs = '';
      let librariesResolved: string[] = [];
      
      if (framework) {
        try {
          const context7Result = await this.getContext7Documentation(
            framework, 
            request.prompt, 
            request.options?.maxTokens || 4000
          );
          context7Docs = context7Result.docs;
          librariesResolved = context7Result.libraries;
        } catch (error) {
          this.logger.warn('Context7 documentation failed, continuing without it', {
            framework,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue without Context7 docs - graceful degradation
        }
      }

      // 3. Gather additional context (placeholder for now)
      const repoFacts = await this.gatherRepoFacts(request);
      const codeSnippets = await this.gatherCodeSnippets(request);
      const frameworkDocs = await this.gatherFrameworkDocs(request);
      const projectDocs = await this.gatherProjectDocs(request);

      // 4. Build enhanced prompt
      const enhancedPrompt = this.buildEnhancedPrompt(
        request.prompt,
        {
          repoFacts,
          codeSnippets,
          frameworkDocs,
          projectDocs,
          context7Docs
        }
      );

      const responseTime = Date.now() - startTime;
      
      // Record successful request
      this.monitoring.recordRequest(
        'enhance',
        responseTime,
        framework || 'unknown'
      );

      const response: EnhancedContext7Response = {
        enhanced_prompt: enhancedPrompt,
        context_used: {
          repo_facts: repoFacts,
          code_snippets: codeSnippets,
          framework_docs: frameworkDocs,
          project_docs: projectDocs,
          context7_docs: context7Docs ? [context7Docs] : [],
          ...(request.options?.includeMetadata && {
            metadata: {
              cache_hit: false, // Would be determined by cache service
              response_time: responseTime,
              libraries_resolved: librariesResolved,
              monitoring_metrics: this.monitoring.getMetrics()
            }
          })
        },
        success: true
      };

      this.logger.info('Enhanced Context7 prompt completed successfully', {
        responseTime,
        context7DocsLength: context7Docs.length,
        librariesResolved: librariesResolved.length,
        enhancedPromptLength: enhancedPrompt.length
      });

      return response;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed request
      this.monitoring.recordError(
        'enhance',
        error instanceof Error ? error : new Error('Unknown error'),
        responseTime
      );

      this.logger.error('Enhanced Context7 prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        prompt: request.prompt.substring(0, 100) + '...'
      });

      return {
        enhanced_prompt: request.prompt, // Fallback to original prompt
        context_used: {
          repo_facts: [],
          code_snippets: [],
          framework_docs: [],
          project_docs: [],
          context7_docs: []
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Detect framework from prompt or context
   * Implements intelligent framework detection
   */
  private async detectFramework(request: EnhancedContext7Request): Promise<string | null> {
    const prompt = request.prompt.toLowerCase();
    const contextFramework = request.context?.framework?.toLowerCase();
    
    const frameworks = [
      'react', 'vue', 'angular', 'next.js', 'nuxt', 'svelte', 
      'node.js', 'express', 'typescript', 'javascript',
      'python', 'django', 'flask', 'fastapi',
      'java', 'spring', 'spring boot',
      'c#', '.net', 'asp.net',
      'go', 'golang', 'gin', 'echo',
      'rust', 'actix', 'warp',
      'php', 'laravel', 'symfony'
    ];
    
    // Check context first
    if (contextFramework && frameworks.includes(contextFramework)) {
      return contextFramework;
    }
    
    // Check prompt for framework mentions
    for (const framework of frameworks) {
      if (prompt.includes(framework)) {
        return framework;
      }
    }
    
    // Check for common patterns
    if (prompt.includes('component') || prompt.includes('jsx')) {
      return 'react';
    }
    
    if (prompt.includes('vue') || prompt.includes('vuex') || prompt.includes('nuxt')) {
      return 'vue';
    }
    
    if (prompt.includes('angular') || prompt.includes('ng-')) {
      return 'angular';
    }
    
    if (prompt.includes('api') || prompt.includes('endpoint') || prompt.includes('server')) {
      return 'node.js';
    }
    
    return null;
  }

  /**
   * Get Context7 documentation with caching and MCP compliance
   * Implements comprehensive Context7 integration
   */
  private async getContext7Documentation(
    framework: string,
    prompt: string,
    maxTokens: number
  ): Promise<{ docs: string; libraries: string[] }> {
    try {
      // 1. Resolve library ID using MCP compliance
      const resolveResult = await this.mcpCompliance.executeToolCall('resolve-library-id', {
        libraryName: framework
      });

      if (!resolveResult.success || !resolveResult.data || resolveResult.data.length === 0) {
        throw new Error(`Failed to resolve library ID for ${framework}`);
      }

      const libraries = resolveResult.data;
      const bestLibrary = libraries[0]; // Use first (highest trust score)
      
      // 2. Extract topic from prompt
      const topic = this.extractTopicFromPrompt(prompt);
      
      // 3. Check cache first
      let docs = '';
      let cacheHit = false;
      
      if (this.cache) {
        const cachedDocs = await this.cache.getCachedDocumentation(
          bestLibrary.id,
          topic,
          maxTokens
        );
        
        if (cachedDocs) {
          docs = cachedDocs;
          cacheHit = true;
          this.logger.debug('Context7 docs retrieved from cache', {
            framework,
            topic,
            libraryId: bestLibrary.id
          });
        }
      }
      
      // 4. Get fresh documentation if not cached
      if (!docs) {
        const docsResult = await this.mcpCompliance.executeToolCall('get-library-docs', {
          context7CompatibleLibraryID: bestLibrary.id,
          topic,
          tokens: maxTokens
        });

        if (!docsResult.success || !docsResult.data) {
          throw new Error(`Failed to get documentation for ${framework}`);
        }

        docs = docsResult.data.content || '';
        
        // Cache the result
        if (this.cache && docs) {
          await this.cache.setCachedDocumentation(
            bestLibrary.id,
            topic,
            maxTokens,
            docs
          );
        }
      }

      return {
        docs,
        libraries: libraries.map((lib: any) => lib.id)
      };

    } catch (error) {
      this.logger.error('Context7 documentation retrieval failed', {
        framework,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
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
   * Gather repository facts (placeholder implementation)
   */
  private async gatherRepoFacts(request: EnhancedContext7Request): Promise<string[]> {
    // This would integrate with actual repository analysis
    return [
      'Project uses TypeScript for type safety',
      'Follows modern JavaScript/TypeScript patterns',
      'Implements proper error handling'
    ];
  }

  /**
   * Gather code snippets (placeholder implementation)
   */
  private async gatherCodeSnippets(request: EnhancedContext7Request): Promise<string[]> {
    // This would integrate with actual code analysis
    return [
      '// Example: Proper error handling pattern',
      'try {',
      '  const result = await someAsyncOperation();',
      '  return result;',
      '} catch (error) {',
      '  logger.error("Operation failed", { error });',
      '  throw error;',
      '}'
    ];
  }

  /**
   * Gather framework documentation (placeholder implementation)
   */
  private async gatherFrameworkDocs(request: EnhancedContext7Request): Promise<string[]> {
    // This would integrate with actual framework documentation
    return [
      'Framework-specific best practices and patterns',
      'Common pitfalls and how to avoid them',
      'Performance optimization techniques'
    ];
  }

  /**
   * Gather project documentation (placeholder implementation)
   */
  private async gatherProjectDocs(request: EnhancedContext7Request): Promise<string[]> {
    // This would integrate with actual project documentation
    return [
      'Project-specific coding standards',
      'Architecture guidelines',
      'Testing requirements'
    ];
  }

  /**
   * Build enhanced prompt with all context
   * Implements comprehensive prompt enhancement
   */
  private buildEnhancedPrompt(
    originalPrompt: string,
    context: {
      repoFacts: string[];
      codeSnippets: string[];
      frameworkDocs: string[];
      projectDocs: string[];
      context7Docs: string;
    }
  ): string {
    let enhanced = originalPrompt;
    
    // Add Context7 documentation if available
    if (context.context7Docs) {
      enhanced += `\n\n## Framework Best Practices (from Context7):\n${context.context7Docs}`;
    }
    
    // Add framework documentation
    if (context.frameworkDocs.length > 0) {
      enhanced += `\n\n## Project Framework Documentation:\n${context.frameworkDocs.join('\n')}`;
    }
    
    // Add project-specific requirements
    if (context.projectDocs.length > 0) {
      enhanced += `\n\n## Project-specific Requirements:\n${context.projectDocs.join('\n')}`;
    }
    
    // Add repository facts
    if (context.repoFacts.length > 0) {
      enhanced += `\n\n## Repository Context:\n${context.repoFacts.join('\n')}`;
    }
    
    // Add code snippets
    if (context.codeSnippets.length > 0) {
      enhanced += `\n\n## Existing Code Patterns:\n\`\`\`typescript\n${context.codeSnippets.join('\n')}\n\`\`\``;
    }
    
    // Add guidance for consistency
    if (context.context7Docs || context.frameworkDocs.length > 0 || 
        context.projectDocs.length > 0 || context.codeSnippets.length > 0) {
      enhanced += `\n\n## Instructions:\nMake your response consistent with the project's existing patterns, best practices, and coding standards. Use the provided context to ensure your solution fits well with the existing codebase.`;
    }
    
    return enhanced;
  }

  /**
   * Get tool health status
   * Implements health monitoring
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      mcpCompliance: boolean;
      monitoring: boolean;
      cache: boolean;
    };
    metrics: any;
  }> {
    try {
      const mcpHealth = await this.mcpCompliance.healthCheck();
      const monitoringHealth = await this.monitoring.getHealthStatus();
      const cacheStats = this.cache.getCacheStats();
      
      const components = {
        mcpCompliance: mcpHealth.status === 'healthy',
        monitoring: monitoringHealth.status === 'healthy',
        cache: cacheStats.memory.hitRate > 0 || cacheStats.sqlite.hitRate > 0
      };
      
      const healthyComponents = Object.values(components).filter(Boolean).length;
      const totalComponents = Object.keys(components).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyComponents === totalComponents) {
        status = 'healthy';
      } else if (healthyComponents >= totalComponents * 0.5) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return {
        status,
        components,
        metrics: {
          mcp: mcpHealth,
          monitoring: monitoringHealth.metrics,
          cache: cacheStats
        }
      };
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        status: 'unhealthy',
        components: {
          mcpCompliance: false,
          monitoring: false,
          cache: false
        },
        metrics: {}
      };
    }
  }
}
