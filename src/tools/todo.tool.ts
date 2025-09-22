/**
 * Todo Tool Implementation for PromptMCP
 * 
 * This tool provides comprehensive todo management functionality through the MCP protocol,
 * allowing vibe coders to create, manage, and track development tasks directly from Cursor.
 * 
 * Benefits for vibe coders:
 * - Generate todo lists from natural language descriptions
 * - Smart task parsing with priority and category detection
 * - Project-scoped task management
 * - Beautiful markdown formatting for Cursor display
 * - Comprehensive filtering and analytics
 * - Integration with existing PromptMCP pipeline
 */

import { z } from 'zod';
import { TodoService } from '../services/todo/todo.service.js';
import type {
  TodoRequest,
  TodoResponse,
  TodoInput,
  TodoFilters,
  TodoAnalytics
} from '../types/todo.js';
import {
  TodoOperationError,
  TodoRequestSchema
} from '../types/todo.js';

/**
 * Todo Tool Class
 * 
 * Handles MCP tool calls for todo management operations
 */
export class TodoTool {
  private todoService: TodoService;

  constructor(todoService: TodoService) {
    this.todoService = todoService;
  }

  /**
   * Handle todo tool execution
   */
  async execute(request: TodoRequest): Promise<TodoResponse> {
    try {
      // Validate request
      const validatedRequest = TodoRequestSchema.parse(request);
      
      const startTime = Date.now();
      
      switch (validatedRequest.action) {
        case 'create':
          return await this.handleCreate(validatedRequest);
        case 'list':
          return await this.handleList(validatedRequest);
        case 'update':
          return await this.handleUpdate(validatedRequest);
        case 'delete':
          return await this.handleDelete(validatedRequest);
        case 'complete':
          return await this.handleComplete(validatedRequest);
        default:
          throw new TodoOperationError(`Unknown action: ${validatedRequest.action}`, 'VALIDATION_ERROR');
      }
      
    } catch (error) {
      if (error instanceof TodoOperationError) {
        return {
          success: false,
          error: error.message,
          metadata: {
            processingTime: Date.now() - Date.now(),
            timestamp: new Date()
          }
        };
      }
      
      return {
        success: false,
        error: `Unexpected error: ${(error as Error).message}`,
        metadata: {
          processingTime: Date.now() - Date.now(),
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Handle create action
   */
  private async handleCreate(request: TodoRequest): Promise<TodoResponse> {
    if (!request.content || !request.projectId) {
      throw new TodoOperationError('Content and projectId are required for create action', 'VALIDATION_ERROR');
    }

    try {
      // Parse content to extract todo information
      const todoInput: TodoInput = {
        projectId: request.projectId,
        title: request.content,
        ...this.parseContentForTodo(request.content)
      };

      const todo = await this.todoService.createTodo(todoInput);
      
      return {
        success: true,
        data: todo,
        metadata: {
          count: 1,
          processingTime: Date.now() - Date.now(),
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      throw new TodoOperationError(`Failed to create todo: ${(error as Error).message}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Handle list action
   */
  private async handleList(request: TodoRequest): Promise<TodoResponse> {
    if (!request.projectId) {
      throw new TodoOperationError('ProjectId is required for list action', 'VALIDATION_ERROR');
    }

    try {
      if (request.filters) {
        // Return filtered list
        const todos = await this.todoService.listTodos(request.projectId, request.filters);
        
        return {
          success: true,
          data: todos,
          metadata: {
            count: todos.length,
            processingTime: Date.now() - Date.now(),
            timestamp: new Date()
          }
        };
      } else {
        // Return full todo list with statistics
        const todoList = await this.todoService.getTodoList(request.projectId);
        
        return {
          success: true,
          data: todoList,
          metadata: {
            count: todoList.totalCount,
            processingTime: Date.now() - Date.now(),
            timestamp: new Date()
          }
        };
      }
      
    } catch (error) {
      throw new TodoOperationError(`Failed to list todos: ${(error as Error).message}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Handle update action
   */
  private async handleUpdate(request: TodoRequest): Promise<TodoResponse> {
    if (!request.todoId || !request.update) {
      throw new TodoOperationError('TodoId and update data are required for update action', 'VALIDATION_ERROR');
    }

    try {
      const todoId = parseInt(request.todoId);
      if (isNaN(todoId)) {
        throw new TodoOperationError('Invalid todoId format', 'VALIDATION_ERROR');
      }

      const updatedTodo = await this.todoService.updateTodo(todoId, request.update);
      
      return {
        success: true,
        data: updatedTodo,
        metadata: {
          count: 1,
          processingTime: Date.now() - Date.now(),
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      if (error instanceof TodoOperationError) {
        throw error;
      }
      throw new TodoOperationError(`Failed to update todo: ${(error as Error).message}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Handle delete action
   */
  private async handleDelete(request: TodoRequest): Promise<TodoResponse> {
    if (!request.todoId) {
      throw new TodoOperationError('TodoId is required for delete action', 'VALIDATION_ERROR');
    }

    try {
      const todoId = parseInt(request.todoId);
      if (isNaN(todoId)) {
        throw new TodoOperationError('Invalid todoId format', 'VALIDATION_ERROR');
      }

      const deleted = await this.todoService.deleteTodo(todoId);
      
      return {
        success: true,
        data: { deleted, todoId },
        metadata: {
          count: 1,
          processingTime: Date.now() - Date.now(),
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      if (error instanceof TodoOperationError) {
        throw error;
      }
      throw new TodoOperationError(`Failed to delete todo: ${(error as Error).message}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Handle complete action
   */
  private async handleComplete(request: TodoRequest): Promise<TodoResponse> {
    if (!request.todoId) {
      throw new TodoOperationError('TodoId is required for complete action', 'VALIDATION_ERROR');
    }

    try {
      const todoId = parseInt(request.todoId);
      if (isNaN(todoId)) {
        throw new TodoOperationError('Invalid todoId format', 'VALIDATION_ERROR');
      }

      const completedTodo = await this.todoService.completeTodo(todoId);
      
      return {
        success: true,
        data: completedTodo,
        metadata: {
          count: 1,
          processingTime: Date.now() - Date.now(),
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      if (error instanceof TodoOperationError) {
        throw error;
      }
      throw new TodoOperationError(`Failed to complete todo: ${(error as Error).message}`, 'DATABASE_ERROR');
    }
  }

  /**
   * Parse content to extract todo information
   */
  private parseContentForTodo(content: string): Partial<TodoInput> {
    const lowerContent = content.toLowerCase();
    
    // Extract priority
    let priority: 'low' | 'medium' | 'high' | 'critical' | undefined;
    if (lowerContent.includes('critical') || lowerContent.includes('urgent') || lowerContent.includes('emergency')) {
      priority = 'critical';
    } else if (lowerContent.includes('high') || lowerContent.includes('important') || lowerContent.includes('asap')) {
      priority = 'high';
    } else if (lowerContent.includes('low') || lowerContent.includes('minor') || lowerContent.includes('nice to have')) {
      priority = 'low';
    }
    
    // Extract category
    let category: 'bug' | 'feature' | 'refactor' | 'documentation' | 'testing' | 'deployment' | 'maintenance' | undefined;
    if (lowerContent.includes('bug') || lowerContent.includes('fix') || lowerContent.includes('error')) {
      category = 'bug';
    } else if (lowerContent.includes('refactor') || lowerContent.includes('cleanup') || lowerContent.includes('optimize')) {
      category = 'refactor';
    } else if (lowerContent.includes('test') || lowerContent.includes('testing')) {
      category = 'testing';
    } else if (lowerContent.includes('doc') || lowerContent.includes('documentation')) {
      category = 'documentation';
    } else if (lowerContent.includes('deploy') || lowerContent.includes('deployment')) {
      category = 'deployment';
    } else if (lowerContent.includes('maintenance') || lowerContent.includes('maintain')) {
      category = 'maintenance';
    }
    
    // Extract tags
    const tags: string[] = [];
    const tagMatches = content.match(/#(\w+)/g);
    if (tagMatches) {
      tags.push(...tagMatches.map(tag => tag.substring(1)));
    }
    
    // Extract estimated hours
    let estimatedHours: number | undefined;
    const hourMatch = content.match(/(\d+(?:\.\d+)?)\s*h(?:ours?)?/i);
    if (hourMatch && hourMatch[1]) {
      estimatedHours = parseFloat(hourMatch[1]);
    }
    
    // Extract due date
    let dueDate: Date | undefined;
    const dateMatch = content.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
    if (dateMatch && dateMatch[1]) {
      dueDate = new Date(dateMatch[1]);
    }
    
    const result: Partial<TodoInput> = {};
    
    if (priority !== undefined) {
      result.priority = priority;
    }
    if (category !== undefined) {
      result.category = category;
    }
    if (tags.length > 0) {
      result.tags = tags;
    }
    if (estimatedHours !== undefined) {
      result.estimatedHours = estimatedHours;
    }
    if (dueDate !== undefined) {
      result.dueDate = dueDate;
    }
    
    return result;
  }

  /**
   * Format todos as markdown for display
   */
  async formatTodosAsMarkdown(projectId: string, filters?: TodoFilters): Promise<string> {
    try {
      const todos = await this.todoService.listTodos(projectId, filters);
      return await this.todoService.formatAsMarkdown(todos, projectId);
    } catch (error) {
      return `❌ Error formatting todos: ${(error as Error).message}`;
    }
  }

  /**
   * Get analytics for todos
   */
  async getAnalytics(projectId: string): Promise<TodoAnalytics> {
    return await this.todoService.getAnalytics(projectId);
  }
}

/**
 * MCP Tool Schema for todo management
 */
export const TodoToolSchema = {
  name: 'promptmcp.todo',
  description: 'Manage development tasks and todo lists with smart parsing, filtering, and analytics',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'list', 'update', 'delete', 'complete'],
        description: 'Action to perform on todos'
      },
      content: {
        type: 'string',
        description: 'Content for creating todos (natural language description)'
      },
      projectId: {
        type: 'string',
        description: 'Project identifier for task isolation'
      },
      todoId: {
        type: 'string',
        description: 'Todo identifier for update/delete/complete operations'
      },
      filters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            description: 'Filter by todo status'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Filter by todo priority'
          },
          category: {
            type: 'string',
            enum: ['bug', 'feature', 'refactor', 'documentation', 'testing', 'deployment', 'maintenance'],
            description: 'Filter by todo category'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tags'
          },
          search: {
            type: 'string',
            description: 'Search term for title/description'
          },
          limit: {
            type: 'number',
            description: 'Limit number of results'
          },
          offset: {
            type: 'number',
            description: 'Offset for pagination'
          }
        },
        description: 'Filters for listing todos'
      },
      update: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical']
          },
          status: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled']
          },
          category: {
            type: 'string',
            enum: ['bug', 'feature', 'refactor', 'documentation', 'testing', 'deployment', 'maintenance']
          },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          estimatedHours: { type: 'number' }
        },
        description: 'Update data for todo modification'
      }
    },
    required: ['action']
  }
};

export default TodoTool;
