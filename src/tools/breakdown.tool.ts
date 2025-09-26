/**
 * Breakdown Tool
 * 
 * MCP tool for AI-powered task breakdown using Context7 + OpenAI
 * Provides intelligent prompt-to-subtask decomposition
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../services/logger/logger.js';
import { TaskBreakdownService } from '../services/task-breakdown/task-breakdown.service.js';
// Removed dependency on deleted Context7RealIntegrationService
import { ConfigService } from '../config/config.service.js';

export interface BreakdownRequest {
  prompt: string;
  projectId?: string;
  options?: {
    maxTasks?: number;
    includeSubtasks?: boolean;
    includeDependencies?: boolean;
  };
}

export interface BreakdownResponse {
  success: boolean;
  message: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    category: string;
    estimatedHours: number;
  }>;
  subtasks?: Array<{
    id: string;
    parentTaskId: string;
    title: string;
    description: string;
    estimatedHours: number;
  }>;
  dependencies?: Array<{
    taskId: string;
    dependsOnTaskId: string;
  }>;
  breakdown?: {
    mainTasks: any[];
    subtasks: any[];
    dependencies: any[];
  };
  context?: {
    frameworks: string[];
    documentationUsed: string[];
  };
}

export class BreakdownTool {
  private logger: Logger;
  private taskBreakdownService: TaskBreakdownService | undefined;
  private context7Service: any;
  private config: ConfigService;

  constructor(
    logger: Logger,
    taskBreakdownService: TaskBreakdownService | null,
    context7Service: any,
    config: ConfigService
  ) {
    this.logger = logger;
    this.taskBreakdownService = taskBreakdownService || undefined;
    this.context7Service = context7Service;
    this.config = config;
  }

  /**
   * Get tool schema for MCP
   */
  getToolSchema(): Tool {
    return {
      name: 'promptmcp.breakdown',
      description: 'Break down a user prompt into structured tasks using AI and Context7 documentation',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The user prompt to break down into tasks'
          },
          projectId: {
            type: 'string',
            description: 'Project ID for context (optional)',
            default: 'default'
          },
          options: {
            type: 'object',
            description: 'Breakdown options',
            properties: {
              maxTasks: {
                type: 'number',
                description: 'Maximum number of main tasks to create',
                default: 7
              },
              includeSubtasks: {
                type: 'boolean',
                description: 'Whether to include subtasks',
                default: true
              },
              includeDependencies: {
                type: 'boolean',
                description: 'Whether to include task dependencies',
                default: true
              }
            }
          }
        },
        required: ['prompt']
      }
    };
  }

  /**
   * Handle breakdown request
   */
  async handleBreakdown(request: BreakdownRequest): Promise<BreakdownResponse> {
    try {
      this.logger.info('Handling breakdown request', {
        prompt: request.prompt.substring(0, 100) + '...',
        projectId: request.projectId || 'default',
        options: request.options
      });

      // Validate OpenAI configuration
      const openaiApiKey = this.config.getEnv('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
      }

      // Validate API key format
      if (!openaiApiKey.startsWith('sk-')) {
        this.logger.warn('OpenAI API key format appears invalid', {
          keyPrefix: openaiApiKey.substring(0, 10) + '...',
          suggestion: 'OpenAI API keys should start with "sk-"'
        });
      }

      // Configure task breakdown service
      const taskBreakdownConfig = {
        openai: {
          apiKey: openaiApiKey,
          projectId: this.config.getEnv('OPENAI_PROJECT_ID'),
          model: this.config.getEnv('OPENAI_MODEL', 'gpt-4o'),
          maxTokens: parseInt(this.config.getEnv('OPENAI_MAX_TOKENS', '4000')),
          temperature: parseFloat(this.config.getEnv('OPENAI_TEMPERATURE', '0.3'))
        },
        context7: {
          maxTokensPerLibrary: parseInt(this.config.getEnv('CONTEXT7_MAX_TOKENS_PER_LIBRARY', '1000')),
          maxLibraries: parseInt(this.config.getEnv('CONTEXT7_MAX_LIBRARIES', '3'))
        }
      };

      // Create task breakdown service instance if not already created
      if (!this.taskBreakdownService) {
        this.taskBreakdownService = new TaskBreakdownService(
          this.logger,
          this.context7Service,
          taskBreakdownConfig
        );
      }

      // Test configuration
      const configTest = await this.taskBreakdownService.testConfiguration();
      if (!configTest.openai) {
        throw new Error('OpenAI service is not available. Please check your API key and configuration.');
      }
      if (!configTest.context7) {
        this.logger.warn('Context7 service is not available, using fallback documentation');
      }

      // Perform breakdown
      const breakdown = await this.taskBreakdownService.breakdownPrompt(
        request.prompt,
        request.projectId || 'default'
      );

      // Convert to response format
      const response = this.convertBreakdownToResponse(breakdown, request);

      this.logger.info('Breakdown completed successfully', {
        mainTasks: response.tasks.length,
        subtasks: response.subtasks?.length || 0,
        dependencies: response.dependencies?.length || 0
      });

      return response;

    } catch (error) {
      this.logger.error('Breakdown request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: request.prompt.substring(0, 100) + '...'
      });

      return {
        success: false,
        message: `Breakdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tasks: []
      };
    }
  }

  /**
   * Convert breakdown result to response format
   */
  private convertBreakdownToResponse(breakdown: any, request: BreakdownRequest): BreakdownResponse {
    const tasks = breakdown.mainTasks.map((task: any, index: number) => ({
      id: `task-${index + 1}`,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      estimatedHours: task.estimatedHours
    }));

    const subtasks = request.options?.includeSubtasks !== false ? breakdown.subtasks.map((subtask: any, index: number) => ({
      id: `subtask-${index + 1}`,
      parentTaskId: `task-${breakdown.mainTasks.findIndex((t: any) => t.title === subtask.parentTaskTitle) + 1}`,
      title: subtask.title,
      description: subtask.description,
      estimatedHours: subtask.estimatedHours
    })) : undefined;

    const dependencies = request.options?.includeDependencies !== false ? breakdown.dependencies.map((dep: any) => ({
      taskId: `task-${breakdown.mainTasks.findIndex((t: any) => t.title === dep.taskTitle) + 1}`,
      dependsOnTaskId: `task-${breakdown.mainTasks.findIndex((t: any) => t.title === dep.dependsOnTaskTitle) + 1}`
    })) : undefined;

    return {
      success: true,
      message: `Successfully broke down prompt into ${tasks.length} main tasks${subtasks ? ` with ${subtasks.length} subtasks` : ''}${dependencies ? ` and ${dependencies.length} dependencies` : ''}`,
      tasks,
      subtasks,
      dependencies,
      breakdown: {
        mainTasks: breakdown.mainTasks,
        subtasks: breakdown.subtasks,
        dependencies: breakdown.dependencies
      },
      context: {
        frameworks: [], // TODO: Extract from breakdown process
        documentationUsed: [] // TODO: Extract from Context7 usage
      }
    };
  }
}
