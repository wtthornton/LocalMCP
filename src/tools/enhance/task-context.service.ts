/**
 * Task Context Service
 * 
 * Handles task breakdown integration and context management
 * Extracted from enhanced-context7-enhance.tool.ts for better maintainability
 * 
 * Benefits for vibe coders:
 * - Intelligent task breakdown for complex prompts
 * - Context-aware task management
 * - Time estimation and planning
 * - Single responsibility principle
 */

import { Logger } from '../../services/logger/logger.js';
import { TaskBreakdownService } from '../../services/task-breakdown/task-breakdown.service.js';
import { TodoService } from '../../services/todo/todo.service.js';

export interface TaskBreakdownResult {
  tasks: any[];
  mainTasks: number;
  subtasks: number;
  dependencies: number;
  estimatedTotalTime: string;
}

export interface TaskContextOptions {
  includeBreakdown?: boolean;
  maxTasks?: number;
}

export class TaskContextService {
  private logger: Logger;
  private taskBreakdownService: TaskBreakdownService | undefined;
  private todoService: TodoService;

  constructor(
    logger: Logger, 
    todoService: TodoService,
    taskBreakdownService?: TaskBreakdownService
  ) {
    this.logger = logger;
    this.todoService = todoService;
    this.taskBreakdownService = taskBreakdownService;
  }

  /**
   * Check if a prompt should trigger breakdown functionality
   * Analyzes prompt characteristics to determine if task breakdown would be beneficial
   */
  shouldBreakdown(prompt: string, options?: TaskContextOptions): boolean {
    try {
      const debugMode = process.env.ENHANCE_DEBUG === 'true';
      
      if (debugMode) {
        console.log('🔍 [TaskContext] shouldBreakdown called with:', {
          prompt: prompt.substring(0, 100) + '...',
          options: options,
          includeBreakdown: options?.includeBreakdown
        });
      }

      // If explicitly disabled, don't breakdown
      if (options?.includeBreakdown === false) {
        if (debugMode) {
          console.log('🔍 [TaskContext] Breakdown disabled by options');
        }
        return false;
      }

      // If explicitly enabled, always breakdown
      if (options?.includeBreakdown === true) {
        if (debugMode) {
          console.log('🔍 [TaskContext] Breakdown enabled by options');
        }
        return true;
      }

      // Auto-detect based on prompt characteristics
      const promptLower = prompt.toLowerCase();
      
      // Keywords that suggest complex, multi-step projects
      const complexKeywords = [
        'build', 'create', 'develop', 'implement', 'design', 'setup',
        'application', 'app', 'platform', 'system', 'website', 'dashboard',
        'full-stack', 'end-to-end', 'complete', 'entire', 'whole'
      ];
      
      // Keywords that suggest simple, single tasks
      const simpleKeywords = [
        'fix', 'debug', 'update', 'change', 'modify', 'add', 'remove',
        'component', 'function', 'method', 'class', 'variable'
      ];
      
      const hasComplexKeywords = complexKeywords.some(keyword => promptLower.includes(keyword));
      const hasSimpleKeywords = simpleKeywords.some(keyword => promptLower.includes(keyword));
      
      if (debugMode) {
        console.log('🔍 [TaskContext] Keyword analysis:', {
          hasComplexKeywords,
          hasSimpleKeywords,
          complexKeywordsFound: complexKeywords.filter(keyword => promptLower.includes(keyword)),
          simpleKeywordsFound: simpleKeywords.filter(keyword => promptLower.includes(keyword))
        });
      }
      
      // Check prompt length (longer prompts are more likely to be complex)
      const isLongPrompt = prompt.length > 100;
      
      // Check for multiple sentences or bullet points (suggests multiple tasks)
      const hasMultipleParts = prompt.includes('.') && prompt.split('.').length > 2;
      const hasBulletPoints = prompt.includes('-') || prompt.includes('*') || prompt.includes('•');
      
      if (debugMode) {
        console.log('🔍 [TaskContext] Prompt analysis:', {
          isLongPrompt,
          hasMultipleParts,
          hasBulletPoints,
          promptLength: prompt.length
        });
      }
      
      // Decision logic
      if (hasComplexKeywords && (isLongPrompt || hasMultipleParts || hasBulletPoints)) {
        if (debugMode) {
          console.log('🔍 [TaskContext] Breakdown decision: TRUE (complex keywords + complexity indicators)');
        }
        return true;
      }
      
      if (hasSimpleKeywords && !isLongPrompt) {
        if (debugMode) {
          console.log('🔍 [TaskContext] Breakdown decision: FALSE (simple keywords + short prompt)');
        }
        return false;
      }
      
      // Default to breakdown for medium-length prompts with project keywords
      const defaultDecision = isLongPrompt && (hasComplexKeywords || hasMultipleParts);
      if (debugMode) {
        console.log('🔍 [TaskContext] Breakdown decision: DEFAULT', {
          result: defaultDecision,
          reason: 'isLongPrompt && (hasComplexKeywords || hasMultipleParts)'
        });
      }
      return defaultDecision;
      
    } catch (error) {
      this.logger.warn('Error detecting prompt complexity for breakdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
        prompt: prompt.substring(0, 100) + '...'
      });
      return false;
    }
  }

  /**
   * Perform task breakdown for complex prompts
   * Implements AI-powered task decomposition with todo creation
   */
  async performTaskBreakdown(
    prompt: string,
    projectId: string,
    options?: TaskContextOptions
  ): Promise<{ breakdown?: TaskBreakdownResult; todos?: any[] }> {
    try {
      const debugMode = process.env.ENHANCE_DEBUG === 'true';
      
      if (debugMode) {
        console.log('🔍 [TaskContext] performTaskBreakdown called with:', {
          prompt: prompt.substring(0, 100) + '...',
          projectId,
          options,
          hasTaskBreakdownService: !!this.taskBreakdownService
        });
      }
      
      if (!this.taskBreakdownService) {
        if (debugMode) {
          console.log('❌ [TaskContext] TaskBreakdownService not available, skipping breakdown');
        }
        this.logger.warn('TaskBreakdownService not available, skipping breakdown');
        return {};
      }

      this.logger.info('Performing task breakdown for complex prompt', {
        prompt: prompt.substring(0, 100) + '...',
        projectId
      });

      // Perform breakdown
      if (debugMode) {
        console.log('🔍 [TaskContext] Calling TaskBreakdownService.breakdownPrompt...');
      }
      
      const breakdownResult = await this.taskBreakdownService.breakdownPrompt(
        prompt,
        projectId
      );
      
      if (debugMode) {
        console.log('🔍 [TaskContext] TaskBreakdownService.breakdownPrompt returned:', {
          hasResult: !!breakdownResult,
          hasMainTasks: !!(breakdownResult?.mainTasks),
          mainTasksCount: breakdownResult?.mainTasks?.length || 0,
          hasSubtasks: !!(breakdownResult?.subtasks),
          subtasksCount: breakdownResult?.subtasks?.length || 0
        });
      }

      if (!breakdownResult || !breakdownResult.mainTasks) {
        this.logger.warn('Task breakdown returned no results');
        return {};
      }

      const breakdown: TaskBreakdownResult = {
        tasks: breakdownResult.mainTasks || [],
        mainTasks: breakdownResult.mainTasks?.length || 0,
        subtasks: breakdownResult.subtasks?.length || 0,
        dependencies: breakdownResult.dependencies?.length || 0,
        estimatedTotalTime: this.calculateEstimatedTime(breakdownResult.mainTasks)
      };

      // Create todos from breakdown
      const todos: any[] = [];
      if (breakdownResult.mainTasks && breakdownResult.mainTasks.length > 0) {
        if (debugMode) {
          console.log('🔍 [TaskContext] Creating todos from breakdown tasks...');
        }
        
        for (const task of breakdownResult.mainTasks) {
          try {
            if (debugMode) {
              console.log('🔍 [TaskContext] Creating todo for task:', {
                title: task.title,
                description: task.description?.substring(0, 50) + '...',
                priority: task.priority,
                category: task.category
              });
            }
            
            const todoResult = await this.todoService.createTodo({
              title: task.title,
              description: task.description || '',
              priority: task.priority || 'medium',
              category: task.category || 'feature',
              projectId: projectId
            });

            todos.push(todoResult);
            
            if (debugMode) {
              console.log('✅ [TaskContext] Todo created successfully:', {
                id: todoResult.id,
                title: todoResult.title
              });
            }
          } catch (todoError) {
            if (debugMode) {
              console.log('❌ [TaskContext] Failed to create todo:', {
                error: todoError instanceof Error ? todoError.message : 'Unknown error',
                taskTitle: task.title
              });
            }
            this.logger.warn('Failed to create todo from breakdown task', {
              error: todoError instanceof Error ? todoError.message : 'Unknown error',
              taskTitle: task.title
            });
          }
        }
      }

      this.logger.info('Task breakdown completed successfully', {
        tasksCreated: todos.length,
        breakdown: breakdown
      });

      return { breakdown, todos };

    } catch (error) {
      this.logger.warn('Task breakdown failed, continuing with enhancement only', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {};
    }
  }

  /**
   * Calculate estimated time for task completion
   * Implements intelligent time estimation based on task complexity
   */
  calculateEstimatedTime(mainTasks: any[]): string {
    if (!mainTasks || mainTasks.length === 0) {
      return 'Unknown';
    }

    const totalHours = mainTasks.reduce((sum, task) => {
      return sum + (task.estimatedHours || 0);
    }, 0);

    if (totalHours < 1) {
      return `${Math.round(totalHours * 60)} minutes`;
    } else if (totalHours < 8) {
      return `${Math.round(totalHours * 10) / 10} hours`;
    } else {
      const days = Math.round(totalHours / 8 * 10) / 10;
      return `${days} days`;
    }
  }

  /**
   * Get task context for a project
   * Implements project-aware task context retrieval
   */
  async getTaskContext(projectId: string): Promise<{
    activeTodos: any[];
    completedTodos: any[];
    totalTasks: number;
    completionRate: number;
  }> {
    try {
      const todos = await this.todoService.listTodos(projectId);
      
      const activeTodos = todos.filter((todo: any) => todo.status === 'pending' || todo.status === 'in_progress');
      const completedTodos = todos.filter((todo: any) => todo.status === 'completed');
      const totalTasks = todos.length;
      const completionRate = totalTasks > 0 ? (completedTodos.length / totalTasks) * 100 : 0;

      return {
        activeTodos,
        completedTodos,
        totalTasks,
        completionRate
      };

    } catch (error) {
      this.logger.warn('Failed to get task context', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId
      });
      
      return {
        activeTodos: [],
        completedTodos: [],
        totalTasks: 0,
        completionRate: 0
      };
    }
  }

  /**
   * Update task context based on prompt analysis
   * Implements context-aware task management
   */
  async updateTaskContext(
    prompt: string,
    projectId: string,
    context: any
  ): Promise<any> {
    try {
      // Analyze prompt for task-related keywords
      const taskKeywords = this.extractTaskKeywords(prompt);
      
      // Update context with task information
      const updatedContext = {
        ...context,
        taskKeywords,
        hasTaskContext: taskKeywords.length > 0,
        projectId
      };

      this.logger.debug('Task context updated', {
        projectId,
        taskKeywords,
        hasTaskContext: updatedContext.hasTaskContext
      });

      return updatedContext;

    } catch (error) {
      this.logger.warn('Failed to update task context', {
        error: error instanceof Error ? error.message : 'Unknown error',
        projectId
      });
      
      return context;
    }
  }

  /**
   * Extract task-related keywords from prompt
   * Implements intelligent keyword extraction for task analysis
   */
  private extractTaskKeywords(prompt: string): string[] {
    const promptLower = prompt.toLowerCase();
    
    const taskKeywords = [
      'task', 'todo', 'item', 'step', 'phase', 'stage',
      'implement', 'create', 'build', 'develop', 'design',
      'setup', 'configure', 'install', 'deploy', 'test',
      'debug', 'fix', 'update', 'refactor', 'optimize'
    ];
    
    return taskKeywords.filter(keyword => promptLower.includes(keyword));
  }

  /**
   * Validate task breakdown results
   * Implements quality assurance for task breakdown
   */
  validateTaskBreakdown(breakdown: TaskBreakdownResult): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (!breakdown.tasks || breakdown.tasks.length === 0) {
      issues.push('No tasks generated');
    }
    
    if (breakdown.mainTasks === 0) {
      issues.push('No main tasks identified');
    }
    
    if (breakdown.estimatedTotalTime === 'Unknown') {
      issues.push('Time estimation failed');
    }
    
    // Check for reasonable task count
    if (breakdown.mainTasks > 20) {
      issues.push('Too many main tasks generated');
    }
    
    // Check for task quality
    const tasksWithTitles = breakdown.tasks.filter(task => task.title && task.title.trim().length > 0);
    if (tasksWithTitles.length !== breakdown.tasks.length) {
      issues.push('Some tasks missing titles');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
