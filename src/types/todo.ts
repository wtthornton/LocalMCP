/**
 * Todo Types for PromptMCP Todo Management
 * 
 * This module defines TypeScript interfaces and Zod schemas for the todo management
 * system that allows vibe coders to generate, manage, and track development tasks
 * directly from Cursor through MCP protocol integration.
 * 
 * @fileoverview Type definitions for todo management system
 */

import { z } from 'zod';

/**
 * Priority levels for todo items
 */
export type TodoPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Status of todo items
 */
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Categories for todo items
 */
export type TodoCategory = 'bug' | 'feature' | 'refactor' | 'documentation' | 'testing' | 'deployment' | 'maintenance';

/**
 * Todo item interface with comprehensive metadata
 * 
 * @interface TodoItem
 * @example
 * ```typescript
 * const todoItem: TodoItem = {
 *   id: 1,
 *   projectId: 'my-project',
 *   title: 'Fix authentication bug',
 *   description: 'Critical bug in JWT token validation',
 *   priority: 'high',
 *   status: 'pending',
 *   category: 'bug',
 *   tags: ['auth', 'security'],
 *   dueDate: new Date('2024-01-20'),
 *   estimatedHours: 4,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   completedAt: null,
 *   metadata: { files: ['auth.ts'], assignee: 'developer' }
 * };
 * ```
 */
export interface TodoItem {
  /** Unique identifier for the todo item */
  id: number;
  
  /** Project identifier for task isolation */
  projectId: string;
  
  /** Title of the todo item */
  title: string;
  
  /** Detailed description of the task */
  description?: string;
  
  /** Priority level */
  priority: TodoPriority;
  
  /** Current status */
  status: TodoStatus;
  
  /** Category classification */
  category?: TodoCategory;
  
  /** Array of tags for organization */
  tags?: string[];
  
  /** Due date for the task */
  dueDate?: Date | undefined;
  
  /** Estimated hours to complete */
  estimatedHours?: number | undefined;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Completion timestamp (null if not completed) */
  completedAt?: Date | null;
  
  /** Additional metadata as JSON */
  metadata?: Record<string, unknown>;
}

/**
 * Todo list interface with categorization and filtering
 * 
 * @interface TodoList
 */
export interface TodoList {
  /** Array of todo items */
  items: TodoItem[];
  
  /** Total count of items */
  totalCount: number;
  
  /** Count by status */
  statusCounts: Record<TodoStatus, number>;
  
  /** Count by priority */
  priorityCounts: Record<TodoPriority, number>;
  
  /** Count by category */
  categoryCounts: Record<TodoCategory, number>;
  
  /** Project identifier */
  projectId: string;
  
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Filters for todo queries
 * 
 * @interface TodoFilters
 */
export interface TodoFilters {
  /** Filter by status */
  status?: TodoStatus | undefined;
  
  /** Filter by priority */
  priority?: TodoPriority | undefined;
  
  /** Filter by category */
  category?: TodoCategory | undefined;
  
  /** Filter by tags */
  tags?: string[] | undefined;
  
  /** Filter by due date range */
  dueDateRange?: {
    start: Date;
    end: Date;
  } | undefined;
  
  /** Search term for title/description */
  search?: string | undefined;
  
  /** Limit number of results */
  limit?: number | undefined;
  
  /** Offset for pagination */
  offset?: number | undefined;
}

/**
 * Input for creating a new todo
 * 
 * @interface TodoInput
 */
export interface TodoInput {
  /** Project identifier */
  projectId: string;
  
  /** Title of the todo */
  title: string;
  
  /** Description of the todo */
  description?: string;
  
  /** Priority level */
  priority?: TodoPriority;
  
  /** Category classification */
  category?: TodoCategory;
  
  /** Tags for organization */
  tags?: string[];
  
  /** Due date */
  dueDate?: Date;
  
  /** Estimated hours */
  estimatedHours?: number;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Update input for modifying todos
 * 
 * @interface TodoUpdate
 */
export interface TodoUpdate {
  /** Title update */
  title?: string | undefined;
  
  /** Description update */
  description?: string | undefined;
  
  /** Priority update */
  priority?: TodoPriority | undefined;
  
  /** Status update */
  status?: TodoStatus | undefined;
  
  /** Category update */
  category?: TodoCategory | undefined;
  
  /** Tags update */
  tags?: string[] | undefined;
  
  /** Due date update */
  dueDate?: Date | undefined;
  
  /** Estimated hours update */
  estimatedHours?: number | undefined;
  
  /** Metadata update */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * MCP tool request structure
 * 
 * @interface TodoRequest
 */
export interface TodoRequest {
  /** Action to perform */
  action: 'create' | 'list' | 'update' | 'delete' | 'complete';
  
  /** Content for creating todos */
  content?: string | undefined;
  
  /** Project identifier */
  projectId?: string | undefined;
  
  /** Todo identifier for updates */
  todoId?: string | undefined;
  
  /** Filters for listing */
  filters?: TodoFilters | undefined;
  
  /** Update data */
  update?: TodoUpdate | undefined;
}

/**
 * MCP tool response structure
 * 
 * @interface TodoResponse
 */
export interface TodoResponse {
  /** Success status */
  success: boolean;
  
  /** Response data */
  data?: TodoItem | TodoItem[] | TodoList | { deleted: boolean; todoId: number };
  
  /** Error message if failed */
  error?: string;
  
  /** Response metadata */
  metadata?: {
    count?: number;
    processingTime?: number;
    timestamp?: Date;
  };
}

/**
 * Todo analytics data
 * 
 * @interface TodoAnalytics
 */
export interface TodoAnalytics {
  /** Completion rate over time */
  completionRate: number;
  
  /** Average completion time by priority */
  avgCompletionTime: Record<TodoPriority, number>;
  
  /** Most common categories */
  topCategories: Array<{ category: TodoCategory; count: number }>;
  
  /** Productivity trends */
  productivityTrends: Array<{
    date: Date;
    completed: number;
    created: number;
  }>;
  
  /** Time estimation accuracy */
  estimationAccuracy: {
    overestimated: number;
    underestimated: number;
    accurate: number;
  };
}

/**
 * Todo template structure
 * 
 * @interface TodoTemplate
 */
export interface TodoTemplate {
  /** Template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Template category */
  category: TodoCategory;
  
  /** Template tags */
  tags: string[];
  
  /** Template items */
  items: Omit<TodoInput, 'projectId'>[];
  
  /** Framework-specific templates */
  frameworks?: string[];
}

/**
 * Zod schemas for runtime validation
 */

// Todo priority schema
export const TodoPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

// Todo status schema
export const TodoStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

// Todo category schema
export const TodoCategorySchema = z.enum(['bug', 'feature', 'refactor', 'documentation', 'testing', 'deployment', 'maintenance']);

// Todo item schema
export const TodoItemSchema = z.object({
  id: z.number(),
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: TodoPrioritySchema,
  status: TodoStatusSchema,
  category: TodoCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Todo input schema
export const TodoInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: TodoPrioritySchema.default('medium'),
  category: TodoCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Todo update schema
export const TodoUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: TodoPrioritySchema.optional(),
  status: TodoStatusSchema.optional(),
  category: TodoCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// Todo filters schema
export const TodoFiltersSchema = z.object({
  status: TodoStatusSchema.optional(),
  priority: TodoPrioritySchema.optional(),
  category: TodoCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  dueDateRange: z.object({
    start: z.date(),
    end: z.date()
  }).optional(),
  search: z.string().optional(),
  limit: z.number().positive().optional(),
  offset: z.number().nonnegative().optional()
});

// Todo request schema
export const TodoRequestSchema = z.object({
  action: z.enum(['create', 'list', 'update', 'delete', 'complete']),
  content: z.string().optional(),
  projectId: z.string().optional(),
  todoId: z.string().optional(),
  filters: TodoFiltersSchema.optional(),
  update: TodoUpdateSchema.optional()
});

// Todo response schema
export const TodoResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  metadata: z.object({
    count: z.number().optional(),
    processingTime: z.number().optional(),
    timestamp: z.date().optional()
  }).optional()
});

/**
 * Default values and constants
 */

// Default priority order for sorting
export const PRIORITY_ORDER: Record<TodoPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

// Default status order for sorting
export const STATUS_ORDER: Record<TodoStatus, number> = {
  pending: 1,
  in_progress: 2,
  completed: 3,
  cancelled: 4
};

// Priority emoji mapping
export const PRIORITY_EMOJIS: Record<TodoPriority, string> = {
  critical: '🚨',
  high: '🚀',
  medium: '📝',
  low: '🔧'
};

// Status emoji mapping
export const STATUS_EMOJIS: Record<TodoStatus, string> = {
  pending: '⏳',
  in_progress: '🔄',
  completed: '✅',
  cancelled: '❌'
};

// Category emoji mapping
export const CATEGORY_EMOJIS: Record<TodoCategory, string> = {
  bug: '🐛',
  feature: '✨',
  refactor: '♻️',
  documentation: '📚',
  testing: '🧪',
  deployment: '🚀',
  maintenance: '🔧'
};

/**
 * Error types for todo operations
 */
export interface TodoError {
  message: string;
  code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DATABASE_ERROR' | 'PERMISSION_ERROR';
  context?: Record<string, unknown>;
}

/**
 * Custom error class for todo operations
 */
export class TodoOperationError extends Error {
  constructor(
    message: string,
    public code: TodoError['code'],
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TodoOperationError';
  }
}
