# PromptMCP Todo Usage Examples

This document provides comprehensive examples of how to use the `promptmcp.todo` tool in Cursor for managing development tasks.

## 🚀 Quick Start

The `promptmcp.todo` tool provides comprehensive todo management functionality through the MCP protocol. It automatically parses natural language descriptions to extract priority, category, and other task details.

## 📋 Basic Operations

### Create a Todo

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Fix critical authentication bug urgently",
    "projectId": "my-project"
  }
}
```

**Response**: Creates a todo with:
- Title: "authentication bug"
- Priority: "critical" (detected from "critical" and "urgently")
- Category: "bug" (detected from "bug" and "fix")
- Status: "pending"

### List All Todos

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "list",
    "projectId": "my-project"
  }
}
```

**Response**: Returns a formatted markdown list of all todos with:
- Priority grouping (🚨 Critical, 🚀 High, 📝 Medium, 🔧 Low)
- Status indicators (⏳ Pending, 🔄 In Progress, ✅ Completed, ❌ Cancelled)
- Category emojis (🐛 Bug, ✨ Feature, ♻️ Refactor, etc.)
- Progress statistics

### Filter Todos

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "list",
    "projectId": "my-project",
    "filters": {
      "priority": "high",
      "status": "pending"
    }
  }
}
```

**Response**: Returns filtered todos matching the criteria.

## 🎯 Smart Parsing Examples

The todo tool intelligently parses natural language to extract task information:

### Priority Detection

| Input | Detected Priority |
|-------|------------------|
| "Fix critical authentication bug urgently" | critical |
| "Add user registration feature with high priority" | high |
| "Minor UI improvement" | low |
| "Update documentation" | medium (default) |

### Category Detection

| Input | Detected Category |
|-------|------------------|
| "Fix authentication bug" | bug |
| "Add new feature" | feature |
| "Refactor user service" | refactor |
| "Write API documentation" | documentation |
| "Add unit tests" | testing |
| "Deploy to production" | deployment |
| "Maintain database" | maintenance |

### Tag Extraction

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Fix #auth #security bug with #jwt validation",
    "projectId": "my-project"
  }
}
```

**Response**: Creates todo with tags: ["auth", "security", "jwt"]

### Time Estimation

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Implement user dashboard - 8 hours",
    "projectId": "my-project"
  }
}
```

**Response**: Creates todo with estimatedHours: 8

### Due Date Parsing

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Complete API documentation by 2024-01-20",
    "projectId": "my-project"
  }
}
```

**Response**: Creates todo with dueDate: 2024-01-20

## 🔄 Todo Management

### Update Todo

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "update",
    "todoId": "1",
    "update": {
      "status": "in_progress",
      "priority": "high"
    }
  }
}
```

### Complete Todo

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "complete",
    "todoId": "1"
  }
}
```

### Delete Todo

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "delete",
    "todoId": "1"
  }
}
```

## 📊 Advanced Filtering

### Filter by Multiple Criteria

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "list",
    "projectId": "my-project",
    "filters": {
      "priority": "high",
      "status": "pending",
      "category": "bug",
      "tags": ["auth", "security"],
      "search": "authentication"
    }
  }
}
```

### Pagination

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "list",
    "projectId": "my-project",
    "filters": {
      "limit": 10,
      "offset": 20
    }
  }
}
```

## 🎨 Real-World Examples

### Feature Development Workflow

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Implement user authentication with JWT tokens - critical priority",
    "projectId": "auth-service"
  }
}
```

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Add password reset functionality - 4 hours",
    "projectId": "auth-service"
  }
}
```

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Write unit tests for auth service #testing #coverage",
    "projectId": "auth-service"
  }
}
```

### Bug Fix Workflow

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Fix critical memory leak in user service - urgent",
    "projectId": "user-service"
  }
}
```

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Investigate authentication timeout issue #bug #auth",
    "projectId": "user-service"
  }
}
```

### Maintenance Tasks

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Update dependencies to latest versions - maintenance",
    "projectId": "main-project"
  }
}
```

```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Clean up unused code and optimize performance",
    "projectId": "main-project"
  }
}
```

## 📈 Analytics and Insights

The todo system provides comprehensive analytics:

### Completion Rate
- Tracks overall completion percentage
- Shows trends over time

### Priority Analysis
- Average completion time by priority
- Priority distribution across projects

### Category Insights
- Most common task types
- Category-based productivity metrics

### Time Estimation Accuracy
- Tracks over/under estimation
- Improves future estimates

## 🔧 Integration with PromptMCP

The todo tool integrates seamlessly with other PromptMCP features:

### Context7 Integration
- Framework-specific todo templates
- Technology-aware task suggestions

### Pipeline Integration
- Automatic todo generation from prompts
- Task tracking in development workflows

### Project Analysis
- Smart todo suggestions based on project structure
- Missing implementation detection

## 🎯 Best Practices

### 1. Use Descriptive Content
```json
{
  "content": "Fix critical authentication bug in JWT token validation that causes 500 errors"
}
```
Instead of:
```json
{
  "content": "Fix bug"
}
```

### 2. Include Relevant Tags
```json
{
  "content": "Add user registration feature #auth #frontend #validation"
}
```

### 3. Provide Time Estimates
```json
{
  "content": "Implement dark mode toggle - 6 hours"
}
```

### 4. Set Appropriate Priorities
- Use "critical" sparingly for production issues
- Use "high" for important features
- Use "medium" for standard tasks
- Use "low" for nice-to-have items

### 5. Regular Updates
- Update status as work progresses
- Mark todos complete when done
- Add notes in metadata for context

## 🚀 Advanced Features

### Bulk Operations
```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Complete API documentation for user endpoints\n- GET /users\n- POST /users\n- PUT /users/:id\n- DELETE /users/:id",
    "projectId": "api-docs"
  }
}
```

### Project Templates
```json
{
  "name": "promptmcp.todo",
  "arguments": {
    "action": "create",
    "content": "Set up new React component with TypeScript and testing",
    "projectId": "component-library"
  }
}
```

## 🎉 Conclusion

The `promptmcp.todo` tool provides a powerful, intelligent todo management system that understands natural language and automatically extracts relevant task information. It integrates seamlessly with Cursor and the PromptMCP ecosystem, making task management effortless for vibe coders.

Key benefits:
- ✅ Smart parsing of natural language descriptions
- ✅ Automatic priority and category detection
- ✅ Beautiful markdown formatting for Cursor display
- ✅ Comprehensive filtering and search capabilities
- ✅ Project-scoped task isolation
- ✅ Analytics and productivity insights
- ✅ Integration with existing PromptMCP tools
