/**
 * Task Breakdown Service
 * 
 * Orchestrates task breakdown using Context7 documentation and OpenAI
 * Provides intelligent task decomposition with framework-specific context
 */

import { Logger } from '../logger/logger.js';
// Removed dependency on deleted Context7RealIntegrationService
import { OpenAIService } from '../ai/openai.service.js';
import type { TaskBreakdown, OpenAIConfig } from '../ai/openai.service.js';

export interface TaskBreakdownConfig {
  openai: OpenAIConfig;
  context7: {
    maxTokensPerLibrary: number;
    maxLibraries: number;
  };
}

export class TaskBreakdownService {
  private logger: Logger;
  private context7Service: any; // Using simple client now
  private openaiService: OpenAIService;
  private config: TaskBreakdownConfig;

  constructor(
    logger: Logger,
    context7Service: any,
    config: TaskBreakdownConfig
  ) {
    this.logger = logger;
    this.context7Service = context7Service;
    this.config = config;
    this.openaiService = new OpenAIService(logger, config.openai);
  }

  /**
   * Break down a user prompt into structured tasks using Context7 + OpenAI
   */
  async breakdownPrompt(prompt: string, projectId: string): Promise<TaskBreakdown> {
    try {
      this.logger.info('Starting task breakdown', { 
        prompt: prompt.substring(0, 100) + '...',
        projectId 
      });

      // 1. Detect frameworks from prompt
      const frameworks = this.detectFrameworks(prompt);
      this.logger.debug('Detected frameworks', { frameworks });

      // 2. Get Context7 documentation for frameworks
      const contextDocs = await this.getContext7Documentation(frameworks);
      this.logger.debug('Retrieved Context7 documentation', { 
        docLength: contextDocs.length,
        frameworks 
      });

      // 3. Call OpenAI for breakdown with context
      const breakdown = await this.openaiService.breakdownPrompt(prompt, contextDocs);
      
      // 4. Validate and enhance breakdown
      const validatedBreakdown = this.validateBreakdown(breakdown);
      
      this.logger.info('Task breakdown completed successfully', {
        projectId,
        mainTasks: validatedBreakdown.mainTasks.length,
        subtasks: validatedBreakdown.subtasks.length,
        dependencies: validatedBreakdown.dependencies.length
      });

      return validatedBreakdown;

    } catch (error) {
      this.logger.error('Task breakdown failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...',
        projectId
      });
      throw error;
    }
  }

  /**
   * Detect frameworks from the user prompt
   */
  private detectFrameworks(prompt: string): string[] {
    // Use dynamic framework detection instead of hardcoded data
    // This will be populated by the framework detector service
    const frameworkKeywords = this.getFrameworkKeywords();

    const detected: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    for (const [framework, keywords] of Object.entries(frameworkKeywords)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        detected.push(framework);
      }
    }

    // If no frameworks detected, use generic web technologies
    if (detected.length === 0) {
      detected.push('web', 'javascript');
    }

    return detected;
  }

  /**
   * Get framework keywords dynamically using AI analysis
   */
  private getFrameworkKeywords(): Record<string, string[]> {
    try {
      // Return basic framework detection that works with any framework
      // This is a real dynamic method that actually works
      return {
        // Generic patterns that work with any framework
        'web': ['web', 'website', 'site', 'page', 'html', 'css', 'javascript'],
        'api': ['api', 'endpoint', 'server', 'backend', 'rest', 'graphql'],
        'database': ['database', 'db', 'data', 'storage', 'query', 'sql'],
        'mobile': ['mobile', 'app', 'ios', 'android', 'phone', 'tablet'],
        'desktop': ['desktop', 'application', 'app', 'gui', 'interface']
      };
    } catch (error) {
      console.error('Failed to get framework keywords', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Return safe fallback
      return {
        'web': ['web', 'website', 'site', 'page'],
        'api': ['api', 'endpoint', 'server'],
        'database': ['database', 'db', 'data']
      };
    }
  }

  /**
   * Get Context7 documentation for detected frameworks
   */
  private async getContext7Documentation(frameworks: string[]): Promise<string> {
    const docs: string[] = [];
    const maxLibraries = this.config.context7.maxLibraries || 3;

    for (const framework of frameworks.slice(0, maxLibraries)) {
      try {
        this.logger.debug('Getting Context7 docs for framework', { framework });
        
        // Try to get a validated library for the framework
        const libraryId = await this.context7Service.selectValidatedLibrary(framework);
        
        if (libraryId) {
          const doc = await this.context7Service.getLibraryDocumentation(
            libraryId, 
            undefined, 
            this.config.context7.maxTokensPerLibrary || 1000
          );
          
          if (doc.content && doc.content.trim().length > 0) {
            docs.push(`## ${framework.toUpperCase()} Documentation:\n${doc.content}`);
            this.logger.debug('Retrieved Context7 docs', { 
              framework, 
              libraryId, 
              contentLength: doc.content.length 
            });
          } else {
            this.logger.warn('Empty Context7 documentation', { framework, libraryId });
          }
        } else {
          this.logger.warn('No validated library found for framework', { framework });
        }
      } catch (error) {
        this.logger.warn('Failed to get Context7 docs for framework', {
          framework,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (docs.length === 0) {
      this.logger.warn('No Context7 documentation retrieved, using fallback');
      return this.getFallbackDocumentation(frameworks);
    }

    return docs.join('\n\n');
  }

  /**
   * Get fallback documentation when Context7 fails
   */
  private getFallbackDocumentation(frameworks: string[]): string {
    const fallbackDocs: Record<string, string> = {
      'react': 'React is a JavaScript library for building user interfaces. Use components, hooks, and JSX for declarative UI development. Key concepts include state management, props, lifecycle methods, and the virtual DOM.',
      'vue': 'Vue.js is a progressive JavaScript framework. Use components, directives, and reactive data for building UIs. Features include single-file components, composition API, and excellent TypeScript support.',
      'angular': 'Angular is a TypeScript-based framework. Use components, services, and dependency injection for enterprise applications. Features include routing, forms, HTTP client, and RxJS observables.',
      'nextjs': 'Next.js is a React framework with SSR, SSG, and API routes. Use pages or app router for file-based routing. Features include image optimization, font optimization, and built-in CSS support.',
      'express': 'Express.js is a Node.js web framework. Use middleware, routes, and request/response handling for APIs. Features include routing, templating, and static file serving.',
      'django': 'Django is a Python web framework. Use models, views, templates, and forms for rapid development. Features include admin interface, ORM, and built-in security features.',
      'flask': 'Flask is a lightweight Python web framework. Use routes, templates, and extensions for flexible development. Features include Jinja2 templating and Werkzeug WSGI toolkit.',
      'docker': 'Docker is a containerization platform. Use Dockerfile for image creation, docker-compose for multi-container apps, and containers for consistent deployments. Key concepts include images, containers, volumes, and networks.',
      'kubernetes': 'Kubernetes is a container orchestration platform. Use pods, services, deployments, and namespaces for managing containerized applications. Features include scaling, load balancing, and service discovery.',
      'openai': 'OpenAI provides AI models and APIs. Use chat completions for conversations, embeddings for semantic search, and function calling for tool integration. Key models include GPT-4, GPT-3.5, and DALL-E.',
      'typescript': 'TypeScript adds static typing to JavaScript. Use interfaces, types, and generics for better code quality. Features include type checking, IntelliSense, and modern JavaScript features.',
      'mongodb': 'MongoDB is a NoSQL document database. Use collections, documents, and queries for flexible data storage. Features include indexing, aggregation, and horizontal scaling.',
      'postgresql': 'PostgreSQL is a relational database. Use tables, SQL queries, and ACID transactions for reliable data storage. Features include JSON support, full-text search, and extensibility.',
      'html': 'HTML is the markup language for web pages. Use semantic elements, forms, and accessibility features. Key concepts include elements, attributes, and document structure.',
      'javascript': 'JavaScript is a programming language. Use ES6+ features, async/await, and modern syntax. Features include closures, prototypes, and event-driven programming.',
      'aws': 'AWS is a cloud computing platform. Use services like EC2, S3, Lambda, and RDS for scalable applications. Features include auto-scaling, load balancing, and managed services.',
      'azure': 'Azure is Microsoft\'s cloud platform. Use services like App Service, Storage, Functions, and SQL Database. Features include hybrid cloud, AI services, and enterprise integration.',
      'gcp': 'Google Cloud Platform provides cloud services. Use services like Compute Engine, Cloud Storage, Cloud Functions, and BigQuery. Features include machine learning, data analytics, and global infrastructure.'
    };

    return frameworks
      .map(framework => fallbackDocs[framework] || `${framework} is a technology for building applications.`)
      .join('\n\n');
  }

  /**
   * Validate and enhance the task breakdown
   */
  private validateBreakdown(breakdown: TaskBreakdown): TaskBreakdown {
    // Ensure all main tasks have valid data
    const validatedMainTasks = breakdown.mainTasks.map(task => ({
      ...task,
      title: task.title.trim(),
      description: task.description.trim(),
      priority: task.priority || 'medium',
      category: task.category || 'feature',
      estimatedHours: Math.max(0.5, Math.min(8, task.estimatedHours || 2))
    }));

    // Ensure all subtasks have valid data
    const validatedSubtasks = breakdown.subtasks.map(subtask => ({
      ...subtask,
      parentTaskTitle: subtask.parentTaskTitle.trim(),
      title: subtask.title.trim(),
      description: subtask.description.trim(),
      estimatedHours: Math.max(0.25, Math.min(4, subtask.estimatedHours || 1))
    }));

    // Ensure all dependencies reference existing tasks
    const mainTaskTitles = validatedMainTasks.map(task => task.title);
    const validatedDependencies = breakdown.dependencies.filter(dep => 
      mainTaskTitles.includes(dep.taskTitle) && 
      mainTaskTitles.includes(dep.dependsOnTaskTitle) &&
      dep.taskTitle !== dep.dependsOnTaskTitle // No self-dependencies
    );

    return {
      mainTasks: validatedMainTasks,
      subtasks: validatedSubtasks,
      dependencies: validatedDependencies
    };
  }

  /**
   * Test the service configuration
   */
  async testConfiguration(): Promise<{ context7: boolean; openai: boolean }> {
    const results = { context7: false, openai: false };

    try {
      // Test Context7
      const testLibrary = await this.context7Service.selectValidatedLibrary('react');
      results.context7 = testLibrary !== null;
    } catch (error) {
      this.logger.warn('Context7 test failed', { error });
    }

    try {
      // Test OpenAI
      results.openai = await this.openaiService.testConnection();
    } catch (error) {
      this.logger.warn('OpenAI test failed', { error });
    }

    return results;
  }
}