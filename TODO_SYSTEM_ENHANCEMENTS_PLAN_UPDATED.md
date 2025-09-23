# Todo System Enhancement Plan - UPDATED with OpenAI Integration

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
- ✅ Context7 integration for documentation

### **What We're Missing (20% to complete):**
- ❌ AI-powered task breakdown from prompts
- ❌ Subtask support
- ❌ Dependency tracking
- ❌ Task plan generation
- ❌ Enhanced prompt-to-todo conversion

## 🤖 **AI Approach: Context7 + OpenAI Integration**

### **How It Works:**
```
User in Cursor → MCP Tool → Context7 (get docs) + OpenAI (breakdown) → Parse JSON → Create Todos → Return to Cursor
```

### **Why This Approach:**
- ✅ **Direct AI Integration** - OpenAI API for task breakdown
- ✅ **Context7 for Docs** - Leverage existing documentation integration
- ✅ **MCP Server Based** - All processing happens in our MCP server
- ✅ **No User Interaction** - Fully automated task creation
- ✅ **Cost Effective** - Only pay for OpenAI API calls

## 🚀 **Enhancement Plan**

### **Phase 1: OpenAI Integration & Task Breakdown (3-4 days)**

#### **Task 1.1: Add OpenAI Service**
```typescript
// src/services/ai/openai.service.ts
export class OpenAIService {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async breakdownPrompt(prompt: string, context: string): Promise<TaskBreakdown> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a task breakdown expert. Break down user requests into structured tasks using the provided documentation context.`
        },
        {
          role: 'user',
          content: `Request: ${prompt}\n\nContext: ${context}\n\nReturn JSON with this exact structure:
{
  "mainTasks": [
    {
      "title": "Task title",
      "description": "Detailed description", 
      "priority": "high|medium|low|critical",
      "category": "feature|bug|refactor|testing|documentation|deployment|maintenance",
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
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}
```

#### **Task 1.2: Create Task Breakdown Service**
```typescript
// src/services/task-breakdown/task-breakdown.service.ts
export class TaskBreakdownService {
  constructor(
    private context7Service: Context7RealIntegrationService,
    private openaiService: OpenAIService,
    private logger: Logger
  ) {}
  
  async breakdownPrompt(prompt: string, projectId: string): Promise<TaskBreakdown> {
    // 1. Detect frameworks from prompt
    const frameworks = this.detectFrameworks(prompt);
    
    // 2. Get Context7 docs for frameworks
    const contextDocs = await this.getContext7Documentation(frameworks);
    
    // 3. Call OpenAI for breakdown
    const breakdown = await this.openaiService.breakdownPrompt(prompt, contextDocs);
    
    // 4. Validate and enhance breakdown
    return this.validateBreakdown(breakdown);
  }
  
  private detectFrameworks(prompt: string): string[] {
    const frameworkKeywords = {
      'react': ['react', 'jsx', 'component'],
      'vue': ['vue', 'vuejs'],
      'angular': ['angular', 'typescript'],
      'nextjs': ['next', 'nextjs', 'next.js'],
      'express': ['express', 'node', 'api'],
      'python': ['python', 'django', 'flask'],
      'html': ['html', 'css', 'frontend'],
      'javascript': ['javascript', 'js', 'node']
    };
    
    const detected = [];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const [framework, keywords] of Object.entries(frameworkKeywords)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        detected.push(framework);
      }
    }
    
    return detected.length > 0 ? detected : ['html', 'javascript'];
  }
  
  private async getContext7Documentation(frameworks: string[]): Promise<string> {
    const docs = await Promise.all(
      frameworks.map(async (framework) => {
        try {
          const libraryId = await this.context7Service.selectValidatedLibrary(framework);
          if (libraryId) {
            const doc = await this.context7Service.getLibraryDocumentation(libraryId, undefined, 1000);
            return `## ${framework.toUpperCase()} Documentation:\n${doc.content}`;
          }
        } catch (error) {
          this.logger.warn(`Failed to get docs for ${framework}`, { error });
        }
        return '';
      })
    );
    
    return docs.filter(Boolean).join('\n\n');
  }
}
```

#### **Task 1.3: Update Package Dependencies**
```json
// package.json
{
  "dependencies": {
    "openai": "^4.0.0"
  }
}
```

#### **Task 1.4: Add Environment Configuration**
```bash
# .env file
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

### **Phase 2: Database Schema Updates (1-2 days)**

#### **Task 2.1: Add New Tables**
```sql
-- Add subtasks table
CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  estimated_hours REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (parent_task_id) REFERENCES todos(id) ON DELETE CASCADE
);

-- Add dependencies table
CREATE TABLE task_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  depends_on_task_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES todos(id) ON DELETE CASCADE,
  UNIQUE(task_id, depends_on_task_id)
);

-- Add task plans table
CREATE TABLE task_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  breakdown_data TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_subtasks_parent_task ON subtasks(parent_task_id);
CREATE INDEX idx_subtasks_status ON subtasks(status);
CREATE INDEX idx_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX idx_task_plans_project ON task_plans(project_id);
```

#### **Task 2.2: Update Types**
```typescript
// src/types/task-breakdown.ts
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
```

### **Phase 3: Extend TodoService (2-3 days)**

#### **Task 3.1: Add Subtask Methods**
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
  
  // New methods for task breakdown
  async createTasksFromBreakdown(breakdown: TaskBreakdown, projectId: string): Promise<TodoItem[]>
  async addDependency(taskId: number, dependsOnTaskId: number): Promise<boolean>
  async getDependencies(taskId: number): Promise<TodoItem[]>
  async getTaskExecutionOrder(projectId: string): Promise<TodoItem[]>
}
```

#### **Task 3.2: Implement Task Breakdown Integration**
```typescript
async createTasksFromBreakdown(breakdown: TaskBreakdown, projectId: string): Promise<TodoItem[]> {
  const createdTasks: TodoItem[] = [];
  
  // 1. Create main tasks
  for (const mainTask of breakdown.mainTasks) {
    const todo = await this.createTodo({
      projectId,
      title: mainTask.title,
      description: mainTask.description,
      priority: mainTask.priority,
      category: mainTask.category,
      estimatedHours: mainTask.estimatedHours
    });
    createdTasks.push(todo);
  }
  
  // 2. Create subtasks
  for (const subtask of breakdown.subtasks) {
    const parentTask = createdTasks.find(t => t.title === subtask.parentTaskTitle);
    if (parentTask) {
      await this.createSubtask(parentTask.id, {
        title: subtask.title,
        description: subtask.description,
        estimatedHours: subtask.estimatedHours
      });
    }
  }
  
  // 3. Create dependencies
  for (const dep of breakdown.dependencies) {
    const task = createdTasks.find(t => t.title === dep.taskTitle);
    const dependsOn = createdTasks.find(t => t.title === dep.dependsOnTaskTitle);
    if (task && dependsOn) {
      await this.addDependency(task.id, dependsOn.id);
    }
  }
  
  return createdTasks;
}
```

### **Phase 4: Create MCP Tool (1-2 days)**

#### **Task 4.1: Create Breakdown Tool**
```typescript
// src/tools/breakdown.tool.ts
export class BreakdownTool {
  constructor(
    private breakdownService: TaskBreakdownService,
    private todoService: TodoService,
    private logger: Logger
  ) {}
  
  async breakdownPrompt(prompt: string, projectId?: string): Promise<BreakdownResponse> {
    try {
      // 1. Generate task breakdown using OpenAI + Context7
      const breakdown = await this.breakdownService.breakdownPrompt(
        prompt, 
        projectId || 'default'
      );
      
      // 2. Create todos from breakdown
      const todos = await this.todoService.createTasksFromBreakdown(breakdown, projectId || 'default');
      
      // 3. Return response
      return {
        success: true,
        message: `Created ${todos.length} tasks for your project`,
        tasks: todos,
        breakdown: breakdown,
        projectId: projectId || 'default'
      };
    } catch (error) {
      this.logger.error('Task breakdown failed', { error, prompt, projectId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create task breakdown'
      };
    }
  }
}
```

#### **Task 4.2: Update MCP Server**
```typescript
// src/mcp/server.ts
import { BreakdownTool } from '../tools/breakdown.tool.js';
import { TaskBreakdownService } from '../services/task-breakdown/task-breakdown.service.js';
import { OpenAIService } from '../services/ai/openai.service.js';

// Add to server initialization
const openaiService = new OpenAIService(process.env.OPENAI_API_KEY!);
const breakdownService = new TaskBreakdownService(context7Service, openaiService, logger);
const breakdownTool = new BreakdownTool(breakdownService, todoService, logger);

// Register tool
server.addTool(breakdownTool);
```

## 📋 **Detailed Implementation Tasks**

### **Week 1: Core AI Integration**

#### **Day 1: OpenAI Setup**
- [ ] Add OpenAI dependency to package.json
- [ ] Create OpenAIService class
- [ ] Add environment configuration
- [ ] Test OpenAI API connection

#### **Day 2-3: Task Breakdown Service**
- [ ] Implement TaskBreakdownService
- [ ] Add framework detection logic
- [ ] Integrate with Context7 for docs
- [ ] Add JSON parsing and validation

#### **Day 4-5: Database Schema**
- [ ] Create migration scripts for new tables
- [ ] Update TodoService with subtask methods
- [ ] Add dependency tracking methods
- [ ] Test database operations

### **Week 2: Integration & Testing**

#### **Day 6-7: MCP Tool Integration**
- [ ] Create BreakdownTool class
- [ ] Update MCP server registration
- [ ] Add tool schemas and validation
- [ ] Test end-to-end functionality

#### **Day 8-9: Testing & Validation**
- [ ] Unit tests for all new services
- [ ] Integration tests with existing tools
- [ ] End-to-end testing with Cursor
- [ ] Performance testing and optimization

#### **Day 10: Documentation & Deployment**
- [ ] Update API documentation
- [ ] Create user guides
- [ ] Test deployment process
- [ ] Final validation

## 🎯 **Success Metrics**

### **Technical Metrics**
- [ ] OpenAI API integration working
- [ ] Task breakdown accuracy >80%
- [ ] Subtask generation for complex tasks
- [ ] Dependency tracking works correctly
- [ ] Performance maintained (<3s response time)

### **User Experience Metrics**
- [ ] Single command creates multiple tasks
- [ ] Tasks are properly structured and prioritized
- [ ] Subtasks are logically organized
- [ ] Dependencies are correctly identified
- [ ] Integration with existing todo system seamless

## 🔧 **Configuration Requirements**

### **Environment Variables**
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3
```

### **Dependencies**
```json
{
  "dependencies": {
    "openai": "^4.0.0"
  }
}
```

## 📝 **Key Design Principles**

### **AI Integration**
1. **OpenAI for Reasoning** - Task breakdown and analysis
2. **Context7 for Documentation** - Framework-specific context
3. **Structured Output** - JSON parsing for reliability
4. **Error Handling** - Graceful fallbacks for AI failures

### **Vibe Coder Principles**
1. **Simple API** - One command creates all tasks
2. **Fast Response** - <3 seconds for task creation
3. **Reliable Output** - Structured JSON with validation
4. **Easy Setup** - Just add OpenAI API key

---

**Total Estimated Time**: 2 weeks
**Complexity**: Medium (adding AI integration)
**Risk Level**: Low (extending existing functionality)
**Value**: High (automated task creation from prompts)
**Setup Required**: OpenAI API key
