/**
 * Todo Service Implementation
 * 
 * This service provides comprehensive todo management functionality using Better-SQLite3
 * for persistent storage, with project isolation, caching, and performance optimizations.
 * 
 * Benefits for vibe coders:
 * - Fast todo operations with WAL mode and prepared statements
 * - Project-scoped task isolation
 * - Intelligent task parsing from natural language
 * - Comprehensive filtering and sorting
 * - LRU caching for performance
 * - Transaction safety for bulk operations
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { LRUCache } from 'lru-cache';
import type {
  TodoItem,
  TodoList,
  TodoFilters,
  TodoInput,
  TodoUpdate,
  TodoAnalytics,
  TodoTemplate,
  TodoPriority,
  TodoStatus,
  TodoCategory
} from '../../types/todo.js';
import {
  TodoOperationError,
  PRIORITY_ORDER,
  STATUS_ORDER,
  PRIORITY_EMOJIS,
  STATUS_EMOJIS,
  CATEGORY_EMOJIS,
  TodoInputSchema,
  TodoUpdateSchema,
  TodoFiltersSchema
} from '../../types/todo.js';

/**
 * Todo Service Class
 * 
 * Provides CRUD operations for todo management with SQLite persistence,
 * intelligent parsing, caching, and analytics.
 */
export class TodoService {
  private db: Database.Database;
  private cache: LRUCache<string, TodoItem[]>;
  private preparedStatements: Map<string, Database.Statement> = new Map();

  constructor(dbPath: string = 'todos.db') {
    // Initialize database with performance optimizations
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('cache_size = 32000');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('busy_timeout = 30000');
    
    // Initialize LRU cache
    this.cache = new LRUCache<string, TodoItem[]>({ max: 100 });
    
    // Initialize database schema
    this.initializeSchema();
    
    // Prepare statements for performance
    this.prepareStatements();
    
    console.log('✅ TodoService initialized with SQLite and caching');
  }

  /**
   * Initialize database schema
   */
  private initializeSchema(): void {
    const schema = `
      -- Todo items table with project isolation
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
        status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
        category TEXT,
        tags TEXT, -- JSON array of tags
        due_date DATETIME,
        estimated_hours REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        metadata TEXT -- JSON object for additional data
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_todos_project_status ON todos(project_id, status);
      CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
      CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
      CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
      CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
    `;
    
    this.db.exec(schema);
  }

  /**
   * Prepare SQL statements for better performance
   */
  private prepareStatements(): void {
    // Insert statement
    this.preparedStatements.set('insert', this.db.prepare(`
      INSERT INTO todos (project_id, title, description, priority, category, tags, due_date, estimated_hours, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `));

    // Select by ID
    this.preparedStatements.set('selectById', this.db.prepare(`
      SELECT * FROM todos WHERE id = ?
    `));

    // Select by project
    this.preparedStatements.set('selectByProject', this.db.prepare(`
      SELECT * FROM todos WHERE project_id = ? ORDER BY priority DESC, created_at DESC
    `));

    // Update statement
    this.preparedStatements.set('update', this.db.prepare(`
      UPDATE todos 
      SET title = ?, description = ?, priority = ?, status = ?, category = ?, 
          tags = ?, due_date = ?, estimated_hours = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `));

    // Delete statement
    this.preparedStatements.set('delete', this.db.prepare(`
      DELETE FROM todos WHERE id = ?
    `));

    // Count by project
    this.preparedStatements.set('countByProject', this.db.prepare(`
      SELECT COUNT(*) as count FROM todos WHERE project_id = ?
    `));

    // Count by status
    this.preparedStatements.set('countByStatus', this.db.prepare(`
      SELECT status, COUNT(*) as count FROM todos WHERE project_id = ? GROUP BY status
    `));

    // Count by priority
    this.preparedStatements.set('countByPriority', this.db.prepare(`
      SELECT priority, COUNT(*) as count FROM todos WHERE project_id = ? GROUP BY priority
    `));

    // Count by category
    this.preparedStatements.set('countByCategory', this.db.prepare(`
      SELECT category, COUNT(*) as count FROM todos WHERE project_id = ? GROUP BY category
    `));
  }

  /**
   * Create a new todo item
   */
  async createTodo(input: TodoInput): Promise<TodoItem> {
    try {
      // Validate input
      const validatedInput = TodoInputSchema.parse(input);
      
      // Parse content if provided
      const parsedContent = this.parseTodoContent(validatedInput.title);
      
      // Prepare data
      const tagsJson = validatedInput.tags ? JSON.stringify(validatedInput.tags) : null;
      const metadataJson = validatedInput.metadata ? JSON.stringify(validatedInput.metadata) : null;
      
      // Insert todo
      const insertStmt = this.preparedStatements.get('insert')!;
      const result = insertStmt.run(
        validatedInput.projectId,
        parsedContent.title,
        validatedInput.description || parsedContent.description,
        validatedInput.priority || parsedContent.priority,
        validatedInput.category || parsedContent.category,
        tagsJson,
        validatedInput.dueDate?.toISOString(),
        validatedInput.estimatedHours,
        metadataJson
      );
      
      // Get created todo
      const todo = await this.getTodoById(result.lastInsertRowid as number);
      
      // Invalidate cache
      this.cache.delete(`${validatedInput.projectId}:*`);
      
      return todo;
      
    } catch (error) {
      if (error instanceof Error) {
        throw new TodoOperationError(`Failed to create todo: ${error.message}`, 'DATABASE_ERROR', { input });
      }
      throw error;
    }
  }

  /**
   * Get todo by ID
   */
  async getTodoById(id: number): Promise<TodoItem> {
    try {
      const stmt = this.preparedStatements.get('selectById')!;
      const row = stmt.get(id) as any;
      
      if (!row) {
        throw new TodoOperationError(`Todo with ID ${id} not found`, 'NOT_FOUND', { id });
      }
      
      return this.mapRowToTodoItem(row);
      
    } catch (error) {
      if (error instanceof TodoOperationError) {
        throw error;
      }
      throw new TodoOperationError(`Failed to get todo: ${(error as Error).message}`, 'DATABASE_ERROR', { id });
    }
  }

  /**
   * List todos with optional filtering
   */
  async listTodos(projectId: string, filters?: TodoFilters): Promise<TodoItem[]> {
    try {
      // Validate filters
      const validatedFilters = filters ? TodoFiltersSchema.parse(filters) : undefined;
      
      // Check cache first
      const cacheKey = `${projectId}:${JSON.stringify(validatedFilters || {})}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Build query
      let query = 'SELECT * FROM todos WHERE project_id = ?';
      const params: any[] = [projectId];
      
      if (validatedFilters?.status) {
        query += ' AND status = ?';
        params.push(validatedFilters.status);
      }
      
      if (validatedFilters?.priority) {
        query += ' AND priority = ?';
        params.push(validatedFilters.priority);
      }
      
      if (validatedFilters?.category) {
        query += ' AND category = ?';
        params.push(validatedFilters.category);
      }
      
      if (validatedFilters?.search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        const searchTerm = `%${validatedFilters.search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      query += ' ORDER BY priority DESC, created_at DESC';
      
      if (validatedFilters?.limit) {
        query += ' LIMIT ?';
        params.push(validatedFilters.limit);
        
        if (validatedFilters.offset) {
          query += ' OFFSET ?';
          params.push(validatedFilters.offset);
        }
      }
      
      // Execute query
      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];
      
      // Map to TodoItem objects
      const todos = rows.map(row => this.mapRowToTodoItem(row));
      
      // Cache the result
      this.cache.set(cacheKey, todos);
      
      return todos;
      
    } catch (error) {
      throw new TodoOperationError(`Failed to list todos: ${(error as Error).message}`, 'DATABASE_ERROR', { projectId, filters });
    }
  }

  /**
   * Update todo item
   */
  async updateTodo(id: number, update: TodoUpdate): Promise<TodoItem> {
    try {
      // Validate update
      const validatedUpdate = TodoUpdateSchema.parse(update);
      
      // Get existing todo
      const existingTodo = await this.getTodoById(id);
      
      // Prepare update data
      const tagsJson = validatedUpdate.tags ? JSON.stringify(validatedUpdate.tags) : existingTodo.tags ? JSON.stringify(existingTodo.tags) : null;
      const metadataJson = validatedUpdate.metadata ? JSON.stringify(validatedUpdate.metadata) : existingTodo.metadata ? JSON.stringify(existingTodo.metadata) : null;
      
      // Update todo
      const updateStmt = this.preparedStatements.get('update')!;
      updateStmt.run(
        validatedUpdate.title || existingTodo.title,
        validatedUpdate.description !== undefined ? validatedUpdate.description : existingTodo.description,
        validatedUpdate.priority || existingTodo.priority,
        validatedUpdate.status || existingTodo.status,
        validatedUpdate.category !== undefined ? validatedUpdate.category : existingTodo.category,
        tagsJson,
        validatedUpdate.dueDate?.toISOString() || existingTodo.dueDate?.toISOString(),
        validatedUpdate.estimatedHours !== undefined ? validatedUpdate.estimatedHours : existingTodo.estimatedHours,
        metadataJson,
        id
      );
      
      // Get updated todo
      const updatedTodo = await this.getTodoById(id);
      
      // Invalidate cache
      this.cache.delete(`${existingTodo.projectId}:*`);
      
      return updatedTodo;
      
    } catch (error) {
      if (error instanceof TodoOperationError) {
        throw error;
      }
      throw new TodoOperationError(`Failed to update todo: ${(error as Error).message}`, 'DATABASE_ERROR', { id, update });
    }
  }

  /**
   * Delete todo item
   */
  async deleteTodo(id: number): Promise<boolean> {
    try {
      // Get existing todo for cache invalidation
      const existingTodo = await this.getTodoById(id);
      
      // Delete todo
      const deleteStmt = this.preparedStatements.get('delete')!;
      const result = deleteStmt.run(id);
      
      // Invalidate cache
      this.cache.delete(`${existingTodo.projectId}:*`);
      
      return result.changes > 0;
      
    } catch (error) {
      if (error instanceof TodoOperationError) {
        throw error;
      }
      throw new TodoOperationError(`Failed to delete todo: ${(error as Error).message}`, 'DATABASE_ERROR', { id });
    }
  }

  /**
   * Complete todo item
   */
  async completeTodo(id: number): Promise<TodoItem> {
    try {
      const update: TodoUpdate = {
        status: 'completed',
        metadata: {
          completedAt: new Date().toISOString()
        }
      };
      
      return await this.updateTodo(id, update);
      
    } catch (error) {
      throw new TodoOperationError(`Failed to complete todo: ${(error as Error).message}`, 'DATABASE_ERROR', { id });
    }
  }

  /**
   * Get todo list with statistics
   */
  async getTodoList(projectId: string, filters?: TodoFilters): Promise<TodoList> {
    try {
      const todos = await this.listTodos(projectId, filters);
      
      // Calculate statistics
      const statusCounts = this.calculateStatusCounts(todos);
      const priorityCounts = this.calculatePriorityCounts(todos);
      const categoryCounts = this.calculateCategoryCounts(todos);
      
      return {
        items: todos,
        totalCount: todos.length,
        statusCounts,
        priorityCounts,
        categoryCounts,
        projectId,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      throw new TodoOperationError(`Failed to get todo list: ${(error as Error).message}`, 'DATABASE_ERROR', { projectId, filters });
    }
  }

  /**
   * Parse natural language content to extract todo information
   */
  private parseTodoContent(content: string): {
    title: string;
    description?: string;
    priority: TodoPriority;
    category: TodoCategory;
  } {
    const lowerContent = content.toLowerCase();
    
    // Extract priority
    let priority: TodoPriority = 'medium';
    if (lowerContent.includes('critical') || lowerContent.includes('urgent') || lowerContent.includes('emergency')) {
      priority = 'critical';
    } else if (lowerContent.includes('high') || lowerContent.includes('important') || lowerContent.includes('asap')) {
      priority = 'high';
    } else if (lowerContent.includes('low') || lowerContent.includes('minor') || lowerContent.includes('nice to have')) {
      priority = 'low';
    }
    
    // Extract category
    let category: TodoCategory = 'feature';
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
    
    // Clean title (remove priority/category keywords)
    let title = content.trim();
    const keywordsToRemove = ['critical', 'urgent', 'emergency', 'high', 'important', 'asap', 'low', 'minor', 'bug', 'fix', 'error', 'refactor', 'cleanup', 'optimize', 'test', 'testing', 'doc', 'documentation', 'deploy', 'deployment', 'maintenance', 'maintain'];
    
    for (const keyword of keywordsToRemove) {
      title = title.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '').trim();
    }
    
    return {
      title: title || content,
      priority,
      category
    };
  }

  /**
   * Map database row to TodoItem
   */
  private mapRowToTodoItem(row: any): TodoItem {
    const todo: any = {
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      priority: row.priority as TodoPriority,
      status: row.status as TodoStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null
    };
    
    // Add optional properties only if they exist
    if (row.description) {
      todo.description = row.description;
    }
    if (row.category) {
      todo.category = row.category as TodoCategory;
    }
    if (row.tags) {
      todo.tags = JSON.parse(row.tags);
    }
    if (row.due_date) {
      todo.dueDate = new Date(row.due_date);
    }
    if (row.estimated_hours) {
      todo.estimatedHours = row.estimated_hours;
    }
    if (row.metadata) {
      todo.metadata = JSON.parse(row.metadata);
    }
    
    return todo as TodoItem;
  }

  /**
   * Calculate status counts
   */
  private calculateStatusCounts(todos: TodoItem[]): Record<TodoStatus, number> {
    const counts: Record<TodoStatus, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };
    
    todos.forEach(todo => {
      counts[todo.status]++;
    });
    
    return counts;
  }

  /**
   * Calculate priority counts
   */
  private calculatePriorityCounts(todos: TodoItem[]): Record<TodoPriority, number> {
    const counts: Record<TodoPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    todos.forEach(todo => {
      counts[todo.priority]++;
    });
    
    return counts;
  }

  /**
   * Calculate category counts
   */
  private calculateCategoryCounts(todos: TodoItem[]): Record<TodoCategory, number> {
    const counts: Record<TodoCategory, number> = {
      bug: 0,
      feature: 0,
      refactor: 0,
      documentation: 0,
      testing: 0,
      deployment: 0,
      maintenance: 0,
      setup: 0,
      configuration: 0,
      infrastructure: 0,
      design: 0,
      planning: 0,
      research: 0,
      style: 0,
      ui: 0,
      ux: 0,
      frontend: 0,
      backend: 0
    };
    
    todos.forEach(todo => {
      if (todo.category) {
        counts[todo.category]++;
      }
    });
    
    return counts;
  }

  /**
   * Format todos as markdown
   */
  async formatAsMarkdown(todos: TodoItem[], projectId: string): Promise<string> {
    if (todos.length === 0) {
      return `# 📝 Todo List - ${projectId}\n\nNo todos found. Create your first todo!`;
    }
    
    // Group by priority
    const groupedTodos = this.groupTodosByPriority(todos);
    
    let markdown = `# 📝 Todo List - ${projectId}\n\n`;
    
    // Add summary
    const totalCount = todos.length;
    const completedCount = todos.filter(t => t.status === 'completed').length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);
    
    markdown += `**Progress**: ${completedCount}/${totalCount} completed (${progressPercentage}%)\n\n`;
    
    // Add todos by priority
    for (const [priority, priorityTodos] of Object.entries(groupedTodos)) {
      if (priorityTodos.length > 0) {
        const emoji = PRIORITY_EMOJIS[priority as TodoPriority];
        markdown += `## ${emoji} ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n\n`;
        
        priorityTodos.forEach(todo => {
          const statusEmoji = STATUS_EMOJIS[todo.status];
          const categoryEmoji = todo.category ? CATEGORY_EMOJIS[todo.category] : '';
          const checkbox = todo.status === 'completed' ? '[x]' : '[ ]';
          
          markdown += `${checkbox} ${statusEmoji} ${categoryEmoji} **${todo.title}**\n`;
          
          if (todo.description) {
            markdown += `   ${todo.description}\n`;
          }
          
          if (todo.tags && todo.tags.length > 0) {
            markdown += `   Tags: ${todo.tags.map(tag => `\`${tag}\``).join(', ')}\n`;
          }
          
          if (todo.dueDate) {
            markdown += `   Due: ${todo.dueDate.toLocaleDateString()}\n`;
          }
          
          if (todo.estimatedHours) {
            markdown += `   Est: ${todo.estimatedHours}h\n`;
          }
          
          markdown += '\n';
        });
      }
    }
    
    markdown += `---\n*Generated on: ${new Date().toLocaleString()}*\n`;
    
    return markdown;
  }

  /**
   * Group todos by priority
   */
  private groupTodosByPriority(todos: TodoItem[]): Record<TodoPriority, TodoItem[]> {
    const grouped: Record<TodoPriority, TodoItem[]> = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    todos.forEach(todo => {
      grouped[todo.priority].push(todo);
    });
    
    // Sort within each priority group by status and creation date
    Object.keys(grouped).forEach(priority => {
      grouped[priority as TodoPriority].sort((a, b) => {
        // First by status
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        // Then by creation date (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    });
    
    return grouped;
  }

  /**
   * Get analytics for todos
   */
  async getAnalytics(projectId: string): Promise<TodoAnalytics> {
    try {
      const todos = await this.listTodos(projectId);
      
      // Calculate completion rate
      const completedCount = todos.filter(t => t.status === 'completed').length;
      const completionRate = todos.length > 0 ? completedCount / todos.length : 0;
      
      // Calculate average completion time by priority
      const avgCompletionTime: Record<TodoPriority, number> = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };
      
      Object.keys(avgCompletionTime).forEach(priority => {
        const priorityTodos = todos.filter(t => t.priority === priority && t.status === 'completed' && t.completedAt);
        if (priorityTodos.length > 0) {
          const totalTime = priorityTodos.reduce((sum, todo) => {
            if (todo.completedAt) {
              return sum + (todo.completedAt.getTime() - todo.createdAt.getTime());
            }
            return sum;
          }, 0);
          avgCompletionTime[priority as TodoPriority] = totalTime / priorityTodos.length / (1000 * 60 * 60); // Convert to hours
        }
      });
      
      // Get top categories
      const categoryCounts = this.calculateCategoryCounts(todos);
      const topCategories = Object.entries(categoryCounts)
        .filter(([_, count]) => count > 0)
        .sort(([_, a], [__, b]) => b - a)
        .map(([category, count]) => ({ category: category as TodoCategory, count }));
      
      // Calculate productivity trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const productivityTrends = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const created = todos.filter(t => t.createdAt >= date && t.createdAt < nextDate).length;
        const completed = todos.filter(t => t.completedAt && t.completedAt >= date && t.completedAt < nextDate).length;
        
        productivityTrends.push({ date, created, completed });
      }
      
      // Calculate estimation accuracy
      const estimatedTodos = todos.filter(t => t.estimatedHours && t.status === 'completed' && t.completedAt);
      let overestimated = 0;
      let underestimated = 0;
      let accurate = 0;
      
      estimatedTodos.forEach(todo => {
        if (todo.estimatedHours && todo.completedAt) {
          const actualHours = (todo.completedAt.getTime() - todo.createdAt.getTime()) / (1000 * 60 * 60);
          const diff = Math.abs(actualHours - todo.estimatedHours);
          
          if (diff <= 1) { // Within 1 hour is considered accurate
            accurate++;
          } else if (actualHours > todo.estimatedHours) {
            underestimated++;
          } else {
            overestimated++;
          }
        }
      });
      
      return {
        completionRate,
        avgCompletionTime,
        topCategories,
        productivityTrends,
        estimationAccuracy: {
          overestimated,
          underestimated,
          accurate
        }
      };
      
    } catch (error) {
      throw new TodoOperationError(`Failed to get analytics: ${(error as Error).message}`, 'DATABASE_ERROR', { projectId });
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    this.cache.clear();
    console.log('🔌 TodoService closed');
  }
}
