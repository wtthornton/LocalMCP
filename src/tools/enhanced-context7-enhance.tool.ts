/**
 * Enhanced Context7 Integration Tool
 * Implements Phase 1 high-scoring areas with comprehensive Context7 integration
 * Based on Context7 best practices and TypeScript error handling patterns
 */

import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { Context7MCPComplianceService } from '../services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from '../services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from '../services/context7/context7-advanced-cache.service.js';
import { QualityRequirementsDetector } from '../services/quality/quality-requirements-detector.service.js';
import { QualityRequirementsFormatter } from '../services/quality/quality-requirements-formatter.service.js';
import { FrameworkDetectorService, Context7CacheService } from '../services/framework-detector/index.js';

export interface EnhancedContext7Request {
  prompt: string;
  context?: {
    file?: string;
    framework?: string;
    style?: string;
    projectContext?: any;
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
  private qualityDetector: QualityRequirementsDetector;
  private qualityFormatter: QualityRequirementsFormatter;
  private frameworkDetector: FrameworkDetectorService;
  private frameworkCache: Context7CacheService;

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
    this.qualityDetector = new QualityRequirementsDetector(logger);
    this.qualityFormatter = new QualityRequirementsFormatter(logger);
    
    // Initialize dynamic framework detection
    this.frameworkCache = new Context7CacheService();
    this.frameworkDetector = new FrameworkDetectorService(
      mcpCompliance, // Use MCP compliance as Context7 service
      this.frameworkCache
    );
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

      // 1. Detect frameworks dynamically using pattern matching, AI, and project context
      const frameworkDetection = await this.frameworkDetector.detectFrameworks(
        request.prompt, 
        request.context?.projectContext
      );
      
      // 2. Detect quality requirements from prompt and detected frameworks
      const qualityRequirements = await this.detectQualityRequirements(
        request.prompt, 
        frameworkDetection.detectedFrameworks[0] // Use first detected framework
      );
      
      // 3. Get Context7 documentation for all detected frameworks
      let context7Docs = '';
      let librariesResolved: string[] = [];
      
      if (frameworkDetection.context7Libraries.length > 0) {
        try {
          const context7Result = await this.getContext7DocumentationForFrameworks(
            frameworkDetection.context7Libraries,
            request.prompt, 
            request.options?.maxTokens || 4000
          );
          context7Docs = context7Result.docs;
          librariesResolved = context7Result.libraries;
        } catch (error) {
          this.logger.warn('Context7 documentation failed, continuing without it', {
            detectedFrameworks: frameworkDetection.detectedFrameworks,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue without Context7 docs - graceful degradation
        }
      }

      // 4. Gather additional context (placeholder for now)
      const repoFacts = await this.gatherRepoFacts(request);
      const codeSnippets = await this.gatherCodeSnippets(request);
      const frameworkDocs = await this.gatherFrameworkDocs(request);
      const projectDocs = await this.gatherProjectDocs(request);

      // 5. Build enhanced prompt with dynamic framework detection results
      const enhancedPrompt = this.buildEnhancedPrompt(
        request.prompt,
        {
          repoFacts,
          codeSnippets,
          frameworkDocs,
          projectDocs,
          context7Docs,
          qualityRequirements,
          frameworkDetection
        }
      );

      const responseTime = Date.now() - startTime;
      
      // Record successful request
      this.monitoring.recordRequest(
        'enhance',
        responseTime,
        frameworkDetection.detectedFrameworks[0] || 'unknown'
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
   * Get Context7 documentation for multiple frameworks
   * Implements dynamic framework documentation retrieval
   */
  private async getContext7DocumentationForFrameworks(
    context7Libraries: string[],
    prompt: string,
    maxTokens: number
  ): Promise<{ docs: string; libraries: string[] }> {
    try {
      const allDocs: string[] = [];
      const successfulLibraries: string[] = [];
      
      // Process libraries in parallel for better performance
      const docPromises = context7Libraries.map(async (libraryId) => {
        try {
          const docsResult = await this.mcpCompliance.executeToolCall('get-library-docs', {
            context7CompatibleLibraryID: libraryId,
            topic: this.extractTopicFromPrompt(prompt),
            tokens: Math.floor(maxTokens / context7Libraries.length) // Distribute tokens evenly
          });

          if (docsResult.success && docsResult.data) {
            return {
              libraryId,
              docs: docsResult.data.content || ''
            };
          }
          return null;
        } catch (error) {
          this.logger.warn(`Failed to get docs for ${libraryId}`, { error });
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
      qualityRequirements: any[];
      frameworkDetection: any;
    }
  ): string {
    let enhanced = originalPrompt;
    
    // Add framework detection results if available
    if (context.frameworkDetection && context.frameworkDetection.detectedFrameworks.length > 0) {
      enhanced += `\n\n## Detected Frameworks/Libraries:\n`;
      enhanced += `- **Frameworks**: ${context.frameworkDetection.detectedFrameworks.join(', ')}\n`;
      enhanced += `- **Detection Method**: ${context.frameworkDetection.detectionMethod}\n`;
      enhanced += `- **Confidence**: ${(context.frameworkDetection.confidence * 100).toFixed(1)}%\n`;
      if (context.frameworkDetection.suggestions.length > 0) {
        enhanced += `- **Suggestions**: ${context.frameworkDetection.suggestions.join(', ')}\n`;
      }
    }
    
    // Add quality requirements if detected
    if (context.qualityRequirements && context.qualityRequirements.length > 0) {
      const qualityFormatted = this.formatQualityRequirements(context.qualityRequirements);
      if (qualityFormatted) {
        enhanced += `\n\n${qualityFormatted}`;
      }
    }
    
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
   * Detects quality requirements from prompt and framework
   * 
   * @param prompt - The input prompt
   * @param framework - Detected framework
   * @returns Promise<any[]> - Detected quality requirements
   */
  private async detectQualityRequirements(prompt: string, framework?: string): Promise<any[]> {
    try {
      const detectionResult = await this.qualityDetector.detectRequirements(prompt, framework);
      
      this.logger.debug('Quality requirements detected', {
        requirementsCount: detectionResult.requirements.length,
        detectedTechnologies: detectionResult.detectedTechnologies,
        confidence: detectionResult.confidence
      });

      return detectionResult.requirements;
    } catch (error) {
      this.logger.warn('Quality requirements detection failed, continuing without them', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      
      // Return empty array on failure - graceful degradation
      return [];
    }
  }

  /**
   * Formats quality requirements using the formatter service
   * 
   * @param requirements - Quality requirements to format
   * @returns string - Formatted quality requirements
   */
  private formatQualityRequirements(requirements: any[]): string {
    try {
      return this.qualityFormatter.formatRequirements(requirements, {
        includePriority: true,
        includeCategoryHeaders: true,
        maxTokens: 1000 // Reserve reasonable token budget for quality requirements
      });
    } catch (error) {
      this.logger.warn('Quality requirements formatting failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requirementsCount: requirements?.length || 0
      });
      
      // Return fallback formatting
      return '';
    }
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
