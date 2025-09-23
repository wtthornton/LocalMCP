# PromptMCP Simple Todo Integration

**Goal**: Make `promptmcp.enhance` smarter by knowing about your current tasks  
**Target**: Vibe coders who want AI assistance without complexity  
**Approach**: Simple, practical integration that just works

## 🎯 What We're Building

Instead of complex learning systems, we'll add **one simple feature**: when you enhance a prompt, it automatically includes context about your current project tasks.

### Current State
- `promptmcp.enhance` - enhances prompts with framework docs
- `promptmcp.todo` - manages your project tasks
- **Missing**: They don't talk to each other

### Simple Integration
- When you enhance a prompt, it checks your active tasks
- Adds relevant task context to make prompts smarter
- That's it. No complex learning, no pattern recognition, just better context.

## 🚀 Implementation Plan

### Phase 1: Basic Integration (1-2 days)

**Step 1**: Add todo service to enhance tool
```typescript
// In EnhancedContext7EnhanceTool constructor
constructor(
  // ... existing services
  todoService: TodoService  // Add this
) {
  // ... existing initialization
  this.todoService = todoService;
}
```

**Step 2**: Get active tasks when enhancing
```typescript
// Add method to get relevant tasks
private async getActiveTasks(projectId: string = 'default'): Promise<string[]> {
  try {
    const tasks = await this.todoService.listTodos(projectId, {
      status: ['pending', 'in_progress']
    });
    return tasks.data?.map(task => `- ${task.title}`) || [];
  } catch (error) {
    this.logger.warn('Failed to get active tasks', { error });
    return [];
  }
}
```

**Step 3**: Include task context in enhanced prompts
```typescript
// Modify the enhance method
private async enhanceWithTaskContext(prompt: string, projectId?: string): Promise<string> {
  const activeTasks = await this.getActiveTasks(projectId);
  
  if (activeTasks.length > 0) {
    return `${prompt}\n\n## Current Project Tasks:\n${activeTasks.join('\n')}`;
  }
  
  return prompt;
}
```

### Phase 2: Smart Task Suggestions (1 day)

**Step 4**: Suggest task breakdown for complex prompts
```typescript
// Add simple task suggestion
private async suggestTasksFromPrompt(prompt: string, projectId: string): Promise<string[]> {
  // Simple keyword detection for complex prompts
  const complexKeywords = ['build', 'create', 'implement', 'develop', 'full-stack'];
  const isComplex = complexKeywords.some(keyword => 
    prompt.toLowerCase().includes(keyword)
  );
  
  if (isComplex) {
    return [
      'Break down into smaller tasks',
      'Consider dependencies and priorities',
      'Add specific requirements and constraints'
    ];
  }
  
  return [];
}
```

## 🛠️ Code Changes

### 1. Update MCP Server
```typescript
// In src/mcp/server.ts
constructor(services: Record<string, any>) {
  // ... existing code
  
  // Add todo service to enhance tool
  const todoService = new TodoService(dbPath);
  this.todoTool = new TodoTool(todoService);
  
  // Pass todo service to enhance tool
  this.enhanceTool = new EnhancedContext7EnhanceTool(
    // ... existing services
    todoService  // Add this
  );
}
```

### 2. Update Enhance Tool
```typescript
// In src/tools/enhanced-context7-enhance.tool.ts
export class EnhancedContext7EnhanceTool {
  // ... existing properties
  private todoService: TodoService;  // Add this

  constructor(
    // ... existing parameters
    todoService: TodoService  // Add this
  ) {
    // ... existing initialization
    this.todoService = todoService;
  }

  // Add the new methods from Phase 1
}
```

### 3. Update Tool Registration
```typescript
// Register the enhance tool with todo integration
private registerTools() {
  // ... existing todo tool registration
  
  // Register enhance tool with todo service
  this.tools.set('promptmcp.enhance', {
    name: 'promptmcp.enhance',
    description: 'Enhance prompts with framework docs and project context',
    inputSchema: {
      // ... existing schema
      properties: {
        // ... existing properties
        projectId: {
          type: 'string',
          description: 'Project ID for task context (optional)'
        }
      }
    }
  });
}
```

## 📊 Expected Benefits

### For Vibe Coders
- **Better Context**: "Create a login form" gets enhanced with "based on your current authentication tasks"
- **Task Awareness**: Prompts understand what you're working on
- **Simple Setup**: No configuration needed, just works
- **No Learning Curve**: Same interface, just smarter

### Success Metrics
- **Context Relevance**: >80% of enhanced prompts include relevant task context
- **User Satisfaction**: >4/5 rating for enhanced prompts
- **Setup Time**: <5 minutes to integrate
- **No Breaking Changes**: Existing functionality unchanged

## 🎯 Why This Approach Works

### Simple & Practical
- No complex learning systems
- No pattern recognition algorithms
- No feedback loops to maintain
- Just better context when you need it

### Vibe Coder Friendly
- **Zero Configuration**: Works out of the box
- **No New Concepts**: Same tools, just smarter
- **Fast Implementation**: 2-3 days total
- **Easy to Understand**: Clear, simple code

### Maintainable
- Minimal code changes
- No new dependencies
- Easy to test and debug
- Can be extended later if needed

## 🚀 Getting Started

1. **Add todo service to enhance tool constructor**
2. **Add getActiveTasks method**
3. **Modify enhance method to include task context**
4. **Test with a simple prompt**
5. **Done!**

This integration makes PromptMCP smarter without making it complex. Vibe coders get better AI assistance with zero learning curve.

## 🔄 Future Possibilities (Not Now)

If this works well, we could add:
- Task breakdown suggestions for complex prompts
- Learning from successful enhancements
- Pattern recognition for common requests

But for now, let's keep it simple and focus on making the basic integration work perfectly.
