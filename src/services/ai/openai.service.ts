/**
 * OpenAI Service
 * 
 * Handles OpenAI API integration for task breakdown and AI-powered features
 * Provides structured task breakdown using GPT-4 with Context7 documentation
 */

import OpenAI from 'openai';
import { Logger } from '../logger/logger.js';

export interface TaskBreakdown {
  mainTasks: MainTask[];
  subtasks: Subtask[];
  dependencies: TaskDependency[];
}

export interface MainTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'feature' | 'bug' | 'refactor' | 'testing' | 'documentation' | 'deployment' | 'maintenance';
  estimatedHours: number;
}

export interface Subtask {
  parentTaskTitle: string;
  title: string;
  description: string;
  estimatedHours: number;
}

export interface TaskDependency {
  taskTitle: string;
  dependsOnTaskTitle: string;
}

export interface OpenAIConfig {
  apiKey: string;
  projectId?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class OpenAIService {
  private client: OpenAI;
  private logger: Logger;
  private config: OpenAIConfig;

  constructor(logger: Logger, config: OpenAIConfig) {
    this.logger = logger;
    this.config = config;
    this.client = new OpenAI({ 
      apiKey: config.apiKey,
      project: config.projectId
    });
  }

  /**
   * Break down a user prompt into structured tasks using OpenAI
   */
  async breakdownPrompt(prompt: string, context: string): Promise<TaskBreakdown> {
    try {
      this.logger.debug('Starting OpenAI task breakdown', { 
        prompt: prompt.substring(0, 100) + '...',
        contextLength: context.length 
      });

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a task breakdown expert. Break down user requests into structured tasks using the provided documentation context.

Your job is to:
1. Analyze the user's request
2. Use the provided documentation to understand best practices
3. Break down the request into logical, manageable tasks
4. Identify subtasks for complex tasks
5. Determine task dependencies
6. Assign appropriate priorities and categories
7. Provide realistic time estimates

Return ONLY valid JSON with this exact structure:
{
  "mainTasks": [
    {
      "title": "Task title",
      "description": "Detailed description of what needs to be done",
      "priority": "high|medium|low|critical",
      "category": "feature|bug|refactor|testing|documentation|deployment|maintenance|setup|configuration|infrastructure|design|planning|research",
      "estimatedHours": 2.5
    }
  ],
  "subtasks": [
    {
      "parentTaskTitle": "Task title",
      "title": "Subtask title",
      "description": "Subtask description",
      "estimatedHours": 1.0
    }
  ],
  "dependencies": [
    {
      "taskTitle": "Task that depends on another",
      "dependsOnTaskTitle": "Task it depends on"
    }
  ]
}

Guidelines:
- Break down complex tasks into 3-7 main tasks
- Each main task should have 2-5 subtasks if needed
- Use realistic time estimates (0.5 to 8 hours per task)
- Assign priorities based on importance and urgency
- Identify clear dependencies between tasks
- Use the documentation context to ensure accuracy
- Focus on actionable, specific tasks`
          },
          {
            role: 'user',
            content: `User Request: ${prompt}

Relevant Documentation:
${context}

Please break this down into structured tasks.`
          }
        ],
        temperature: this.config.temperature || 0.3,
        max_tokens: this.config.maxTokens || 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      this.logger.debug('OpenAI response received', { 
        responseLength: content.length,
        usage: response.usage 
      });

      // Parse and validate the JSON response
      const breakdown = this.parseAndValidateBreakdown(content);
      
      this.logger.info('Task breakdown completed successfully', {
        mainTasks: breakdown.mainTasks.length,
        subtasks: breakdown.subtasks.length,
        dependencies: breakdown.dependencies.length
      });

      return breakdown;

    } catch (error) {
      this.logger.error('OpenAI task breakdown failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      throw new Error(`Task breakdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse and validate the JSON response from OpenAI
   */
  private parseAndValidateBreakdown(content: string): TaskBreakdown {
    try {
      // Clean the content - remove any markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanContent);

      // Validate the structure
      if (!parsed.mainTasks || !Array.isArray(parsed.mainTasks)) {
        throw new Error('Invalid response: mainTasks is required and must be an array');
      }

      if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
        throw new Error('Invalid response: subtasks is required and must be an array');
      }

      if (!parsed.dependencies || !Array.isArray(parsed.dependencies)) {
        throw new Error('Invalid response: dependencies is required and must be an array');
      }

      // Validate main tasks
      for (const task of parsed.mainTasks) {
        if (!task.title || !task.description) {
          throw new Error('Invalid main task: title and description are required');
        }
        if (!['low', 'medium', 'high', 'critical'].includes(task.priority)) {
          throw new Error(`Invalid priority: ${task.priority}`);
        }
        if (!['feature', 'bug', 'refactor', 'testing', 'documentation', 'deployment', 'maintenance', 'setup', 'configuration', 'infrastructure', 'design', 'planning', 'research'].includes(task.category)) {
          throw new Error(`Invalid category: ${task.category}`);
        }
        if (typeof task.estimatedHours !== 'number' || task.estimatedHours <= 0) {
          throw new Error(`Invalid estimated hours: ${task.estimatedHours}`);
        }
      }

      // Validate subtasks
      for (const subtask of parsed.subtasks) {
        if (!subtask.parentTaskTitle || !subtask.title || !subtask.description) {
          throw new Error('Invalid subtask: parentTaskTitle, title, and description are required');
        }
        if (typeof subtask.estimatedHours !== 'number' || subtask.estimatedHours <= 0) {
          throw new Error(`Invalid subtask estimated hours: ${subtask.estimatedHours}`);
        }
      }

      // Validate dependencies
      for (const dep of parsed.dependencies) {
        if (!dep.taskTitle || !dep.dependsOnTaskTitle) {
          throw new Error('Invalid dependency: taskTitle and dependsOnTaskTitle are required');
        }
      }

      return parsed as TaskBreakdown;

    } catch (error) {
      this.logger.error('Failed to parse OpenAI response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        content: content.substring(0, 200) + '...'
      });
      throw new Error(`Failed to parse task breakdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a chat completion with custom messages
   */
  async createChatCompletion(messages: any[], options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<any> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || this.config.model || 'gpt-4',
        messages,
        max_tokens: options?.maxTokens || this.config.maxTokens || 2000,
        temperature: options?.temperature || this.config.temperature || 0.3
      });

      return response;
    } catch (error) {
      this.logger.error('OpenAI chat completion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: options?.model || this.config.model
      });
      throw error;
    }
  }

  /**
   * Test the OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'user', content: 'Hello, this is a test message.' }
        ],
        max_tokens: 10
      });

      return response.choices[0]?.message?.content !== undefined;
    } catch (error) {
      this.logger.error('OpenAI connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}
