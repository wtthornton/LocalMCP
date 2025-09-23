# Todo System Enhancement Plan

## 🎯 **Objective**
Enhance our existing `TodoService` to add the missing features that would make TaskFlow MCP integration unnecessary.

## 📊 **Current State Analysis**

### **What We Have (80% complete):**
- ✅ SQLite persistence with WAL mode
- ✅ Project isolation and scoping
- ✅ LRU caching for performance
- ✅ Comprehensive analytics and monitoring
- ✅ CRUD operations (create, read, update, delete)
- ✅ Filtering and sorting
- ✅ Priority and category parsing
- ✅ Integration with enhance tool
- ✅ Export capabilities

### **What We're Missing (20% to complete):**
- ❌ AI-powered task breakdown from prompts
- ❌ Subtask support
- ❌ Dependency tracking
- ❌ Task plan generation
- ❌ Enhanced prompt-to-todo conversion

## 🚀 **Enhancement Plan**

### **Phase 1: AI-Powered Task Breakdown (3-4 days)**

#### **Task 1.1: Create Task Breakdown Service**
```typescript
// src/services/task-breakdown/task-breakdown.service.ts
export class TaskBreakdownService {
  // Use existing Context7 integration for AI-powered breakdown
  // Parse prompts into structured task plans
  // Generate subtasks automatically
}
```

**Features:**
- [ ] **Prompt Analysis**: Parse natural language prompts to extract task requirements
- [ ] **AI Breakdown**: Use Context7 integration to generate task breakdowns
- [ ] **Subtask Generation**: Automatically create subtasks for complex tasks
- [ ] **Dependency Detection**: Identify task dependencies from context
- [ ] **Priority Assignment**: AI-powered priority and category assignment

#### **Task 1.2: Extend TodoService Schema**
```sql
-- Add subtasks table
CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (parent_task_id) REFERENCES todos(id)
);

-- Add dependencies table
CREATE TABLE task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  depends_on_task_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES todos(id),
  FOREIGN KEY (depends_on_task_id) REFERENCES todos(id)
);

-- Add task plans table
CREATE TABLE task_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  plan_data TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Phase 2: Subtask Support (2-3 days)**

#### **Task 2.1: Extend TodoService for Subtasks**
```typescript
// Add to existing TodoService
export class TodoService {
  // Existing methods...
  
  async createSubtask(parentTaskId: number, subtask: SubtaskInput): Promise<SubtaskItem>
  async getSubtasks(taskId: number): Promise<SubtaskItem[]>
  async updateSubtask(subtaskId: number, updates: SubtaskUpdate): Promise<SubtaskItem>
  async deleteSubtask(subtaskId: number): Promise<boolean>
  async markSubtaskDone(subtaskId: number): Promise<SubtaskItem>
  async getTaskWithSubtasks(taskId: number): Promise<TodoItemWithSubtasks>
}
```

#### **Task 2.2: Update Types and Schemas**
```typescript
export interface SubtaskItem {
  id: number;
  parentTaskId: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

export interface TodoItemWithSubtasks extends TodoItem {
  subtasks: SubtaskItem[];
  subtaskCount: number;
  completedSubtasks: number;
}
```

### **Phase 3: Dependency Tracking (2-3 days)**

#### **Task 3.1: Add Dependency Management**
```typescript
// Add to TodoService
export class TodoService {
  async addDependency(taskId: number, dependsOnTaskId: number): Promise<boolean>
  async removeDependency(taskId: number, dependsOnTaskId: number): Promise<boolean>
  async getDependencies(taskId: number): Promise<TodoItem[]>
  async getDependents(taskId: number): Promise<TodoItem[]>
  async getTaskExecutionOrder(projectId: string): Promise<TodoItem[]>
  async canTaskStart(taskId: number): Promise<boolean>
}
```

#### **Task 3.2: Update Task Status Logic**
- [ ] **Dependency Validation**: Prevent starting tasks with incomplete dependencies
- [ ] **Execution Order**: Calculate optimal task execution order
- [ ] **Status Propagation**: Update dependent tasks when dependencies complete
- [ ] **Circular Dependency Detection**: Prevent circular dependencies

### **Phase 4: Task Plan Generation (2-3 days)**

#### **Task 4.1: Create Task Plan Service**
```typescript
// src/services/task-plan/task-plan.service.ts
export class TaskPlanService {
  async generateTaskPlan(prompt: string, projectId: string): Promise<TaskPlan>
  async saveTaskPlan(plan: TaskPlan): Promise<string>
  async loadTaskPlan(planId: string): Promise<TaskPlan>
  async exportTaskPlan(planId: string, format: 'markdown' | 'json' | 'html'): Promise<string>
}
```

#### **Task 4.2: Integration with Enhance Tool**
```typescript
// Update enhanced-context7-enhance.tool.ts
export class EnhancedContext7EnhanceTool {
  async enhanceWithTaskBreakdown(request: EnhancedContext7Request): Promise<EnhancedContext7Response> {
    // Generate task plan from prompt
    // Add task context to enhanced prompt
    // Return enhanced prompt with task breakdown
  }
}
```

### **Phase 5: New MCP Tools (1-2 days)**

#### **Task 5.1: Create promptmcp.breakdown Tool**
```typescript
// src/tools/breakdown.tool.ts
export class BreakdownTool {
  async breakdownPrompt(prompt: string, projectId?: string): Promise<BreakdownResponse>
  async generateTaskPlan(prompt: string, projectId?: string): Promise<TaskPlan>
  async exportTaskPlan(planId: string, format: string): Promise<string>
}
```

#### **Task 5.2: Update MCP Server**
```typescript
// src/mcp/server.ts
// Register new breakdown tool
// Add tool schemas
// Update service initialization
```

## 📋 **Detailed Implementation Tasks**

### **Week 1: Core Features**

#### **Day 1-2: Database Schema Updates**
- [ ] Create migration scripts for new tables
- [ ] Update existing indexes for performance
- [ ] Add foreign key constraints
- [ ] Test database migrations

#### **Day 3-4: Subtask Support**
- [ ] Implement `SubtaskService` class
- [ ] Add subtask CRUD operations
- [ ] Update `TodoService` with subtask methods
- [ ] Add subtask validation and business logic

#### **Day 5: Dependency Tracking**
- [ ] Implement `DependencyService` class
- [ ] Add dependency management methods
- [ ] Implement circular dependency detection
- [ ] Add task execution order calculation

### **Week 2: AI Integration & Tools**

#### **Day 6-7: Task Breakdown Service**
- [ ] Create `TaskBreakdownService` using Context7
- [ ] Implement AI-powered prompt analysis
- [ ] Add subtask generation logic
- [ ] Integrate with existing todo service

#### **Day 8-9: Task Plan Generation**
- [ ] Create `TaskPlanService` class
- [ ] Implement plan export functionality
- [ ] Add plan persistence and retrieval
- [ ] Create plan visualization

#### **Day 10: MCP Tool Integration**
- [ ] Create `promptmcp.breakdown` tool
- [ ] Update MCP server registration
- [ ] Add tool schemas and validation
- [ ] Test end-to-end functionality

## 🎯 **Success Metrics**

### **Technical Metrics**
- [ ] All new features work with existing todo system
- [ ] No breaking changes to existing functionality
- [ ] Performance maintained (<2s response time)
- [ ] Database queries optimized
- [ ] 100% backward compatibility

### **Feature Metrics**
- [ ] AI breakdown accuracy >80%
- [ ] Subtask generation for complex tasks
- [ ] Dependency tracking works correctly
- [ ] Task plans export in multiple formats
- [ ] Integration with enhance tool seamless

### **User Experience Metrics**
- [ ] Single unified todo system
- [ ] Consistent user interface
- [ ] Fast response times
- [ ] Intuitive task breakdown
- [ ] Clear dependency visualization

## 🔧 **Technical Implementation Details**

### **Database Schema Updates**
```sql
-- Subtasks table
CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (parent_task_id) REFERENCES todos(id) ON DELETE CASCADE
);

-- Dependencies table
CREATE TABLE task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  depends_on_task_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES todos(id) ON DELETE CASCADE,
  UNIQUE(task_id, depends_on_task_id)
);

-- Task plans table
CREATE TABLE task_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  plan_data TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_subtasks_parent_task ON subtasks(parent_task_id);
CREATE INDEX idx_subtasks_status ON subtasks(status);
CREATE INDEX idx_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_task_plans_project ON task_plans(project_id);
```

### **New Service Architecture**
```
src/services/
├── todo/
│   ├── todo.service.ts (enhanced)
│   ├── subtask.service.ts (new)
│   └── dependency.service.ts (new)
├── task-breakdown/
│   ├── task-breakdown.service.ts (new)
│   └── ai-breakdown.service.ts (new)
├── task-plan/
│   ├── task-plan.service.ts (new)
│   └── plan-export.service.ts (new)
└── context7/ (existing)
```

## 🚀 **Implementation Priority**

### **High Priority (Must Have)**
1. **Subtask Support** - Core functionality
2. **AI Task Breakdown** - Main value proposition
3. **Database Schema Updates** - Foundation

### **Medium Priority (Should Have)**
4. **Dependency Tracking** - Advanced feature
5. **Task Plan Generation** - User experience

### **Low Priority (Nice to Have)**
6. **Advanced Visualization** - Polish
7. **Template System** - Future enhancement

## 📝 **Notes**

### **Key Design Principles**
1. **Extend, Don't Replace**: Build on existing `TodoService`
2. **Backward Compatibility**: No breaking changes
3. **Performance First**: Maintain existing speed
4. **Vibe Coder Friendly**: Simple and intuitive
5. **Consistent Patterns**: Follow existing code patterns

### **Risk Mitigation**
1. **Database Migrations**: Test thoroughly before deployment
2. **API Changes**: Maintain backward compatibility
3. **Performance**: Monitor query performance
4. **Integration**: Test with existing enhance tool

---

**Total Estimated Time**: 2 weeks
**Complexity**: Medium (building on existing system)
**Risk Level**: Low (extending existing functionality)
**Value**: High (completes the todo system vision)
