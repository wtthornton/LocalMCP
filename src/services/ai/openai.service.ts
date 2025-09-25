/**
 * OpenAI Service
 * 
 * Handles OpenAI API integration for task breakdown and AI-powered features
 * Provides structured task breakdown using GPT-4 with Context7 documentation
 */

import OpenAI from 'openai';
import { Logger } from '../logger/logger.js';
import type { 
  PromptEnhancementRequest, 
  PromptEnhancementResponse, 
  EnhancementContext,
  EnhancementOptions,
  EnhancementGoals,
  TokenUsage,
  EnhancementMetadata,
  QualityMetrics,
  EnhancementConfidence,
  EnhancementImprovement
} from '../../types/prompt-enhancement.types.js';
import { PromptEnhancementPrompts } from './prompt-enhancement-prompts.js';

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

export interface OpenAICostData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
  timestamp: Date;
}

export interface OpenAIUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageCostPerRequest: number;
  averageTokensPerRequest: number;
  costByModel: Record<string, number>;
  requestsByModel: Record<string, number>;
}

export class OpenAIService {
  private client: OpenAI;
  private logger: Logger;
  private config: OpenAIConfig;
  private costData: OpenAICostData[] = [];
  private usageStats: OpenAIUsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageCostPerRequest: 0,
    averageTokensPerRequest: 0,
    costByModel: {},
    requestsByModel: {}
  };

  // OpenAI pricing per 1K tokens (as of 2024)
  private readonly PRICING = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
  };

  constructor(logger: Logger, config: OpenAIConfig) {
    this.logger = logger;
    this.config = config;
    
    // DEBUG: Print API key and project ID being used
    console.log('🔑 OpenAI Service Debug:');
    console.log('  API Key:', config.apiKey ? `${config.apiKey.substring(0, 20)}...` : 'NOT SET');
    console.log('  Project ID:', config.projectId || 'NOT SET');
    console.log('  Full API Key Length:', config.apiKey?.length || 0);
    
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

      // Track cost and usage
      if (response.usage) {
        this.trackUsage(response.usage, this.config.model || 'gpt-4');
      }

      // Parse and validate the JSON response
      const breakdown = this.parseAndValidateBreakdown(content);
      
      this.logger.info('Task breakdown completed successfully', {
        mainTasks: breakdown.mainTasks.length,
        subtasks: breakdown.subtasks.length,
        dependencies: breakdown.dependencies.length
      });

      return breakdown;

    } catch (error) {
      // Enhanced error handling with specific API key error detection
      if (error instanceof Error && error.message.includes('401')) {
        this.logger.error('OpenAI API key invalid or expired', {
          error: 'API key authentication failed',
          suggestion: 'Please update OPENAI_API_KEY environment variable',
          prompt: prompt.substring(0, 100) + '...'
        });
        throw new Error('OpenAI API key is invalid or expired. Please check your OPENAI_API_KEY environment variable.');
      } else if (error instanceof Error && error.message.includes('429')) {
        this.logger.error('OpenAI API rate limit exceeded', {
          error: 'Rate limit exceeded',
          suggestion: 'Please wait before retrying or upgrade your OpenAI plan',
          prompt: prompt.substring(0, 100) + '...'
        });
        throw new Error('OpenAI API rate limit exceeded. Please wait before retrying.');
      } else if (error instanceof Error && error.message.includes('403')) {
        this.logger.error('OpenAI API access forbidden', {
          error: 'API access forbidden',
          suggestion: 'Please check your OpenAI API key permissions',
          prompt: prompt.substring(0, 100) + '...'
        });
        throw new Error('OpenAI API access forbidden. Please check your API key permissions.');
      } else {
        this.logger.error('OpenAI task breakdown failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          prompt: prompt.substring(0, 100) + '...'
        });
        throw new Error(`Task breakdown failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
      // DEBUG: Print API key and project ID before each API call
      console.log('🔑 OpenAI API Call Debug:');
      console.log('  API Key:', this.config.apiKey ? `${this.config.apiKey.substring(0, 20)}...` : 'NOT SET');
      console.log('  Project ID:', this.config.projectId || 'NOT SET');
      console.log('  Model:', options?.model || this.config.model || 'gpt-4');
      console.log('  Full API Key Length:', this.config.apiKey?.length || 0);
      
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

  /**
   * Track usage and calculate costs for OpenAI API calls
   */
  private trackUsage(usage: any, model: string): void {
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;
    
    const cost = this.calculateCost(promptTokens, completionTokens, model);
    
    const costData: OpenAICostData = {
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      model,
      timestamp: new Date()
    };

    this.costData.push(costData);
    this.updateUsageStats(costData);
    
    this.logger.debug('OpenAI usage tracked', {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      cost: cost.toFixed(4)
    });
  }

  /**
   * Calculate cost based on token usage and model
   */
  private calculateCost(promptTokens: number, completionTokens: number, model: string): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING] || this.PRICING['gpt-4'];
    
    const inputCost = (promptTokens / 1000) * pricing.input;
    const outputCost = (completionTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(costData: OpenAICostData): void {
    this.usageStats.totalRequests++;
    this.usageStats.totalTokens += costData.totalTokens;
    this.usageStats.totalCost += costData.cost;
    
    // Update model-specific stats
    if (!this.usageStats.costByModel[costData.model]) {
      this.usageStats.costByModel[costData.model] = 0;
      this.usageStats.requestsByModel[costData.model] = 0;
    }
    
    this.usageStats.costByModel[costData.model] = (this.usageStats.costByModel[costData.model] || 0) + costData.cost;
    this.usageStats.requestsByModel[costData.model] = (this.usageStats.requestsByModel[costData.model] || 0) + 1;
    
    // Update averages
    this.usageStats.averageCostPerRequest = this.usageStats.totalCost / this.usageStats.totalRequests;
    this.usageStats.averageTokensPerRequest = this.usageStats.totalTokens / this.usageStats.totalRequests;
  }

  /**
   * Get current usage statistics
   */
  getUsageStats(): OpenAIUsageStats {
    return { ...this.usageStats };
  }

  /**
   * Get cost data for a specific time range
   */
  getCostData(startDate?: Date, endDate?: Date): OpenAICostData[] {
    if (!startDate && !endDate) {
      return [...this.costData];
    }
    
    return this.costData.filter(data => {
      if (startDate && data.timestamp < startDate) return false;
      if (endDate && data.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Get total cost for a specific time range
   */
  getTotalCost(startDate?: Date, endDate?: Date): number {
    const filteredData = this.getCostData(startDate, endDate);
    return filteredData.reduce((total, data) => total + data.cost, 0);
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.costData = [];
    this.usageStats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageCostPerRequest: 0,
      averageTokensPerRequest: 0,
      costByModel: {},
      requestsByModel: {}
    };
  }

  /**
   * Enhance a prompt with context using OpenAI
   */
  async enhancePromptWithContext(request: PromptEnhancementRequest): Promise<PromptEnhancementResponse> {
    try {
      this.logger.debug('Starting OpenAI prompt enhancement', {
        originalPrompt: request.originalPrompt.substring(0, 100) + '...',
        strategy: request.options.strategy.type,
        contextSize: JSON.stringify(request.context).length
      });

      // Get the appropriate enhancement prompt
      const enhancementPrompt = PromptEnhancementPrompts.getContextualEnhancementPrompt(
        request.originalPrompt,
        request.context,
        request.options.strategy
      );

      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: enhancementPrompt
          },
          {
            role: 'user',
            content: `Please enhance this prompt with the provided context:

Original Prompt: ${request.originalPrompt}

Context: ${JSON.stringify(request.context, null, 2)}

Enhancement Options: ${JSON.stringify(request.options, null, 2)}

Goals: ${JSON.stringify(request.goals, null, 2)}`
          }
        ],
        temperature: request.options.temperature || this.config.temperature || 0.3,
        max_tokens: request.options.maxTokens || this.config.maxTokens || 2000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      this.logger.debug('OpenAI enhancement response received', {
        responseLength: content.length,
        usage: response.usage
      });

      // Track cost and usage
      if (response.usage) {
        this.trackUsage(response.usage, this.config.model || 'gpt-4');
      }

      // Parse and validate the enhancement response
      const enhancement = this.parseAndValidateEnhancement(content, request);
      
      this.logger.info('Prompt enhancement completed successfully', {
        originalLength: request.originalPrompt.length,
        enhancedLength: enhancement.enhancedPrompt.length,
        qualityScore: enhancement.quality.overall,
        confidenceScore: enhancement.confidence.overall
      });

      return enhancement;

    } catch (error) {
      this.logger.error('OpenAI prompt enhancement failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalPrompt: request.originalPrompt.substring(0, 100) + '...'
      });
      throw new Error(`Prompt enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse and validate the enhancement response from OpenAI
   */
  private parseAndValidateEnhancement(content: string, request: PromptEnhancementRequest): PromptEnhancementResponse {
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
      if (!parsed.enhancedPrompt || typeof parsed.enhancedPrompt !== 'string') {
        throw new Error('Invalid response: enhancedPrompt is required and must be a string');
      }

      if (!parsed.improvements || !Array.isArray(parsed.improvements)) {
        throw new Error('Invalid response: improvements is required and must be an array');
      }

      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid response: recommendations is required and must be an array');
      }

      // Validate improvements
      for (const improvement of parsed.improvements) {
        if (!improvement.type || !improvement.description) {
          throw new Error('Invalid improvement: type and description are required');
        }
        if (!['clarity', 'specificity', 'actionability', 'completeness', 'relevance', 'best-practice', 'performance', 'security'].includes(improvement.type)) {
          throw new Error(`Invalid improvement type: ${improvement.type}`);
        }
        if (!['low', 'medium', 'high'].includes(improvement.impact)) {
          throw new Error(`Invalid improvement impact: ${improvement.impact}`);
        }
      }

      // Create the enhancement response
      const enhancement: PromptEnhancementResponse = {
        enhancedPrompt: parsed.enhancedPrompt,
        metadata: {
          originalLength: request.originalPrompt.length,
          enhancedLength: parsed.enhancedPrompt.length,
          tokenUsage: {
            promptTokens: 0, // Will be filled by trackUsage
            completionTokens: 0,
            totalTokens: 0,
            cost: 0,
            model: this.config.model || 'gpt-4'
          },
          processingTime: 0, // Will be filled by the caller
          strategy: request.options.strategy,
          framework: request.context.frameworkContext?.framework || 'Unknown',
          projectType: request.context.projectContext?.projectType || 'Unknown',
          timestamp: new Date()
        },
        quality: {
          clarity: parsed.qualityScore || 0.8,
          specificity: parsed.qualityScore || 0.8,
          actionability: parsed.qualityScore || 0.8,
          completeness: parsed.qualityScore || 0.8,
          relevance: parsed.qualityScore || 0.8,
          overall: parsed.qualityScore || 0.8
        },
        confidence: {
          overall: parsed.confidenceScore || 0.8,
          contextRelevance: parsed.confidenceScore || 0.8,
          frameworkAccuracy: parsed.confidenceScore || 0.8,
          qualityAlignment: parsed.confidenceScore || 0.8,
          projectFit: parsed.confidenceScore || 0.8
        },
        improvements: parsed.improvements.map((imp: any) => ({
          type: imp.type,
          description: imp.description,
          impact: imp.impact,
          before: imp.before || '',
          after: imp.after || ''
        })),
        recommendations: parsed.recommendations
      };

      return enhancement;

    } catch (error) {
      this.logger.error('Failed to parse OpenAI enhancement response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        content: content.substring(0, 200) + '...'
      });
      throw new Error(`Failed to parse enhancement response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
