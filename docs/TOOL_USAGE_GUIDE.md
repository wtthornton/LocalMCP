# PromptMCP Tool Usage Guide

This guide covers all three PromptMCP tools: `promptmcp.enhance`, `promptmcp.todo`, and `promptmcp.breakdown`.

## 🚀 Quick Start

### 1. Setup
```bash
# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY="your_openai_api_key"
export OPENAI_PROJECT_ID="your_openai_project_id"
export CONTEXT7_API_KEY="your_context7_api_key"

# Build the project
npm run build

# Start the MCP server
npm start
```

### 2. Configure Cursor IDE
Add to your `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key",
        "OPENAI_PROJECT_ID": "your_openai_project_id",
        "CONTEXT7_API_KEY": "your_context7_api_key"
      }
    }
  }
}
```

## 🛠️ Tool Reference

### `promptmcp.enhance`

Enhances user prompts with comprehensive project context using Context7 documentation and intelligent framework detection.

#### Basic Usage
```bash
# Simple enhancement
promptmcp.enhance --prompt "Create a login form"

# With specific context
promptmcp.enhance --prompt "Fix this component" --context file=./src/components/LoginForm.tsx

# With framework specification
promptmcp.enhance --prompt "Add authentication" --context framework=react --context style=modern
```

#### Advanced Features
- **Dynamic Framework Detection**: Automatically detects React, Vue, Angular, etc.
- **Context7 Integration**: Real-time framework documentation
- **Project-Aware RAG**: Semantic search through project docs
- **Smart Caching**: SQLite with WAL mode optimization
- **Quality Assessment**: Relevance scoring for all context sources

#### Example Output
```
Enhanced Prompt:
Create a modern, accessible login form for a React application with the following considerations:

## Current Project Tasks:
- Implement user authentication system
- Setup database schema for users
- Create responsive UI components

## Framework Context (React):
- Use React 18+ with functional components and hooks
- Implement proper form validation with controlled components
- Follow React best practices for accessibility and performance

## Project Context:
- TypeScript project with modern tooling
- Uses Material-UI for component library
- Implements JWT authentication
- Follows atomic design principles

## Quality Requirements:
- WCAG 2.1 AA compliance
- Mobile-first responsive design
- Form validation with error handling
- Loading states and user feedback
```

### `promptmcp.todo`

Comprehensive todo management with hierarchical tasks, dependencies, and project organization.

#### Basic Operations

**Create a Todo**
```bash
promptmcp.todo --action create --title "Implement user authentication" --priority high --category feature
```

**List Todos**
```bash
# List all todos
promptmcp.todo --action list

# List by project
promptmcp.todo --action list --projectId my-project

# List by status
promptmcp.todo --action list --status pending
```

**Update Todo**
```bash
# Update status
promptmcp.todo --action update --id 1 --status in_progress

# Update priority
promptmcp.todo --action update --id 1 --priority critical

# Update description
promptmcp.todo --action update --id 1 --description "Updated description"
```

**Complete Todo**
```bash
promptmcp.todo --action complete --id 1
```

**Delete Todo**
```bash
promptmcp.todo --action delete --id 1
```

#### Advanced Features

**Create Subtasks**
```bash
# Create parent task
promptmcp.todo --action create --title "Build e-commerce platform" --priority high

# Create subtasks
promptmcp.todo --action create --title "Setup database schema" --parentId 1 --priority medium
promptmcp.todo --action create --title "Implement user authentication" --parentId 1 --priority high
promptmcp.todo --action create --title "Create product catalog" --parentId 1 --priority medium
```

**Add Dependencies**
```bash
# Task 2 depends on task 1
promptmcp.todo --action addDependency --taskId 2 --dependsOn 1
```

**List with Filters**
```bash
# List by category
promptmcp.todo --action list --category feature

# List by priority
promptmcp.todo --action list --priority high

# List subtasks
promptmcp.todo --action list --parentId 1
```

#### Data Structure
```typescript
interface Todo {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'feature' | 'bug' | 'refactor' | 'testing' | 'documentation' | 'deployment' | 'maintenance' | 'setup' | 'configuration' | 'infrastructure' | 'design' | 'planning' | 'research';
  projectId: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

### `promptmcp.breakdown`

AI-powered task breakdown using OpenAI GPT-4 and Context7 documentation for intelligent project decomposition.

#### Basic Usage
```bash
# Simple breakdown
promptmcp.breakdown --prompt "Build a full-stack e-commerce application with React and Node.js"

# With options
promptmcp.breakdown --prompt "Create a blog platform" --maxTasks 5 --includeSubtasks true --includeDependencies true
```

#### Advanced Options
```bash
# Customize breakdown
promptmcp.breakdown \
  --prompt "Build a social media platform" \
  --maxTasks 8 \
  --includeSubtasks true \
  --includeDependencies true \
  --maxSubtasksPerTask 3 \
  --includeTimeEstimates true \
  --projectId social-media-app
```

#### Example Output
```json
{
  "success": true,
  "message": "Successfully broke down prompt into 6 structured tasks",
  "tasks": [
    {
      "id": 1,
      "title": "Setup project infrastructure",
      "description": "Initialize React frontend and Node.js backend with proper project structure",
      "priority": "high",
      "category": "setup",
      "estimatedTime": "2-3 hours",
      "dependencies": []
    },
    {
      "id": 2,
      "title": "Implement user authentication",
      "description": "Create user registration, login, and session management",
      "priority": "high",
      "category": "feature",
      "estimatedTime": "4-6 hours",
      "dependencies": [1]
    }
  ],
  "breakdown": {
    "mainTasks": 6,
    "subtasks": 12,
    "dependencies": 8,
    "estimatedTotalTime": "2-3 weeks"
  }
}
```

#### Configuration Options
- `maxTasks`: Maximum number of main tasks (default: 10)
- `includeSubtasks`: Generate subtasks for each main task (default: true)
- `includeDependencies`: Detect and create task dependencies (default: true)
- `maxSubtasksPerTask`: Maximum subtasks per main task (default: 5)
- `includeTimeEstimates`: Include time estimates for tasks (default: true)
- `projectId`: Associate tasks with a specific project (optional)

## 🔧 Integration Examples

### Complete Workflow
```bash
# 1. Break down a complex request
promptmcp.breakdown --prompt "Build a task management app with React and Node.js"

# 2. Create todos from breakdown
promptmcp.todo --action create --title "Setup project infrastructure" --priority high --category setup

# 3. Enhance prompts with context
promptmcp.enhance --prompt "Create a user dashboard component" --context framework=react
```

### Cursor IDE Integration
In Cursor, you can use these tools directly:

1. **@promptmcp.breakdown** - Break down complex requests
2. **@promptmcp.todo** - Manage your development tasks
3. **@promptmcp.enhance** - Enhance prompts with project context

## 🐛 Troubleshooting

### Common Issues

**OpenAI API Errors**
```bash
# Check API key
echo $OPENAI_API_KEY

# Test connection
promptmcp.breakdown --prompt "test" --projectId test
```

**Context7 Integration Issues**
```bash
# Check Context7 API key
echo $CONTEXT7_API_KEY

# Test Context7 connection
promptmcp.enhance --prompt "test"
```

**Database Issues**
```bash
# Check database file
ls -la data/todos.db

# Reset database (WARNING: deletes all data)
rm data/todos.db
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug

# Run with verbose output
node dist/mcp/server.js --verbose
```

## 📊 Performance Tips

1. **Use Caching**: Context7 responses are cached for better performance
2. **Batch Operations**: Create multiple todos in sequence rather than individually
3. **Project Organization**: Use consistent project IDs for better task management
4. **Framework Detection**: Let the system auto-detect frameworks for better context

## 🔒 Security Considerations

1. **API Keys**: Store API keys in environment variables, never in code
2. **Database**: The SQLite database contains sensitive project information
3. **Logging**: Be aware that prompts and context may be logged
4. **Network**: Ensure secure connections when using external APIs

## 📚 Additional Resources

- [Context7 Documentation](https://context7.com)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Cursor IDE Documentation](https://cursor.sh/docs)
