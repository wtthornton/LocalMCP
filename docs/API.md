# API Reference

## MCP Tools

PromptMCP exposes the following tools to AI assistants:

### Core Tools

#### `promptmcp.enhance`
Intelligent prompt enhancement with perfect project context using dynamic framework detection, Context7 integration, advanced RAG, and AI-powered enhancement.

**Status**: ✅ **ACTIVE** - Fully implemented and tested with AI enhancement
**MCP Tool**: `promptmcp.enhance`

**Input:**
```json
{
  "prompt": "Create a login form with React and dark theme",
  "context": {
    "file": "./src/components/LoginForm.tsx",
    "framework": "react",
    "style": "modern",
    "projectContext": {
      "dependencies": {"react": "^18.0.0", "tailwindcss": "^3.0.0"},
      "fileStructure": ["src/components/", "src/pages/"],
      "frameworkFiles": ["src/App.tsx"],
      "suggestedFrameworks": ["react", "typescript"]
    }
  },
  "options": {
    "useCache": true,
    "maxTokens": 4000,
    "includeMetadata": true,
    "useAIEnhancement": true,
    "enhancementStrategy": "framework-specific",
    "qualityFocus": ["accessibility", "performance"],
    "projectType": "frontend"
  }
}
```

**Output:**
```json
{
  "enhanced_prompt": "Create a React login form component with TypeScript, dark theme support, and accessibility features\n\n## Detected Frameworks/Libraries:\n- **Frameworks**: react, tailwind\n- **Detection Method**: pattern\n- **Confidence**: 95.0%\n- **Suggestions**: Detected react (pattern), Detected tailwind (pattern)\n\n## Framework Best Practices (from Context7):\n## /facebook/react Documentation:\n[Context7 React documentation content]\n\n## /tailwindlabs/tailwindcss Documentation:\n[Context7 Tailwind documentation content]\n\n## Instructions:\nMake your response consistent with the project's existing patterns, best practices, and coding standards. Use the provided context to ensure your solution fits well with the existing codebase.",
  "context_used": {
    "repo_facts": ["Project uses TypeScript for type safety", "Follows modern JavaScript/TypeScript patterns"],
    "code_snippets": ["// Example: Proper error handling pattern", "try {", "  const result = await someAsyncOperation();", "  return result;", "} catch (error) {", "  logger.error(\"Operation failed\", { error });", "  throw error;", "}"],
    "framework_docs": ["Framework-specific best practices and patterns", "Common pitfalls and how to avoid them"],
    "project_docs": ["Project-specific coding standards", "Architecture guidelines"],
    "context7_docs": ["[Context7 React documentation]", "[Context7 Tailwind documentation]"],
    "metadata": {
      "cache_hit": false,
      "response_time": 150,
      "libraries_resolved": ["/facebook/react", "/tailwindlabs/tailwindcss"],
      "monitoring_metrics": {
        "totalDetections": 1,
        "successfulDetections": 1,
        "averageConfidence": 0.95,
        "cacheHitRate": 0.0
      }
    }
  },
  "ai_enhancement": {
    "enabled": true,
    "strategy": "framework-specific",
    "quality_score": 0.87,
    "confidence_score": 0.92,
    "improvements": [
      {
        "type": "clarity",
        "description": "Made the request more specific with TypeScript and accessibility requirements",
        "impact": "high",
        "before": "Create a login form with React and dark theme",
        "after": "Create a React login form component with TypeScript, dark theme support, and accessibility features"
      }
    ],
    "recommendations": [
      "Use React Testing Library for component testing",
      "Implement proper ARIA attributes for accessibility",
      "Consider using React Hook Form for form validation"
    ],
    "processing_time": 1200,
    "cost": 0.05
  },
  "success": true
}
```

### AI Enhancement Features

The `promptmcp.enhance` tool now includes AI-powered prompt enhancement with the following capabilities:

- **Intelligent Prompt Analysis**: Automatically analyzes user prompts to identify areas for improvement
- **Context-Aware Enhancement**: Uses project context, framework information, and code patterns to enhance prompts
- **Quality Scoring**: Provides quality and confidence scores for enhanced prompts
- **Improvement Tracking**: Shows specific improvements made to the original prompt
- **Strategy Selection**: Supports different enhancement strategies (general, framework-specific, quality-focused, project-aware)
- **Cost Optimization**: Tracks token usage and costs for AI enhancement operations
- **Fallback Support**: Gracefully falls back to non-AI enhancement if AI services are unavailable

### Framework Detection Features

The `promptmcp.enhance` tool includes dynamic framework detection with the following capabilities:

#### Pattern-Based Detection
Detects libraries from natural language patterns:
- `"create a React component"` → detects `react`
- `"using Vue framework"` → detects `vue`
- `"with Tailwind library"` → detects `tailwind`
- `"build Next.js app"` → detects `nextjs`

#### AI-Powered Detection
Uses AI to suggest relevant libraries for generic prompts:
- `"build a modern web application"` → suggests `[nextjs, react, typescript]`
- `"create a Python API"` → suggests `[fastapi, django, flask]`
- `"build a mobile app"` → suggests `[react-native, flutter, ionic]`

#### Project Context Analysis
Analyzes project structure and dependencies:
- Reads `package.json` for dependencies
- Scans file structure for framework-specific files
- Detects project type (frontend, backend, fullstack, library)

#### Context7 Integration
- Resolves library names to Context7 library IDs
- Retrieves relevant documentation
- Caches results for token efficiency
- Supports any Context7 library (not just hardcoded frameworks)

#### `promptmcp.todo`
Comprehensive todo management with subtasks, dependencies, and project organization.

**Status**: ✅ **ACTIVE** - Fully implemented and tested
**MCP Tool**: `promptmcp.todo`

**Input:**
```json
{
  "action": "create",
  "content": "Implement user authentication with JWT",
  "projectId": "my-project"
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Implement user authentication with JWT",
    "description": null,
    "status": "pending",
    "priority": "medium",
    "category": "feature",
    "projectId": "my-project",
    "parentId": null,
    "dependencies": [],
    "tags": [],
    "estimatedHours": null,
    "dueDate": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "metadata": {
    "count": 1,
    "processingTime": 45,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

**Available Actions:**
- `create` - Create a new todo with smart parsing
- `list` - List todos with filtering and analytics
- `update` - Update existing todo
- `delete` - Delete todo
- `complete` - Mark todo as completed

#### `promptmcp.health`
System health monitoring and diagnostics for all PromptMCP services.

**Status**: ✅ **ACTIVE** - Fully implemented and tested
**MCP Tool**: `promptmcp.health`

**Input:**
```json
{}
```

**Output:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "mcpServer": {
      "status": "healthy",
      "uptime": 3600,
      "toolsAvailable": 3
    },
    "context7Integration": {
      "status": "healthy",
      "apiKeyConfigured": true,
      "lastCheck": "2024-01-01T00:00:00Z"
    },
    "cacheService": {
      "status": "healthy",
      "hitRate": 0.85,
      "totalEntries": 150
    },
    "todoService": {
      "status": "healthy",
      "databaseConnected": true,
      "totalTodos": 25
    }
  },
  "metrics": {
    "responseTime": 45,
    "memoryUsage": "128MB",
    "cpuUsage": "5%"
  }
}
```

## Legacy Tools (Deprecated)

The following tools are deprecated in favor of the unified `promptmcp.enhance` tool:

### Repository Tools

#### `repo.introspect`
Analyzes project structure, dependencies, and configuration.

**Input:**
```json
{
  "path": "/path/to/project"
}
```

**Output:**
```json
{
  "packageManager": "npm",
  "dependencies": {...},
  "scripts": {...},
  "configFiles": [...],
  "projectType": "nextjs"
}
```

#### `repo.read`
Reads files with smart context and caching.

**Input:**
```json
{
  "path": "/path/to/file",
  "startLine": 1,
  "endLine": 50,
  "context": "error-fix"
}
```

**Output:**
```json
{
  "content": "file content",
  "metadata": {
    "language": "typescript",
    "size": 1024,
    "lastModified": "2024-01-01T00:00:00Z"
  }
}
```

### Context7 Tools

#### `context7.bridge`
Retrieves cached external documentation.

**Input:**
```json
{
  "package": "react",
  "version": "18.2.0",
  "topic": "hooks",
  "query": "useState best practices"
}
```

**Output:**
```json
{
  "content": "cached documentation content",
  "source": "https://react.dev/docs/hooks-state",
  "cached": true,
  "expiresAt": "2024-01-02T00:00:00Z"
}
```

### Documentation Tools

#### `docs.rag`
Retrieves project-specific documentation and context.

**Input:**
```json
{
  "query": "authentication implementation",
  "projectId": "project-123",
  "maxChunks": 5
}
```

**Output:**
```json
{
  "chunks": [
    {
      "content": "documentation content",
      "source": "docs/auth.md",
      "relevanceScore": 0.95
    }
  ],
  "totalChunks": 5
}
```

### Pipeline Tools

#### `pipeline.run`
Executes the dynamic processing pipeline.

**Input:**
```json
{
  "request": "Fix this TypeScript error",
  "context": {
    "file": "src/components/Button.tsx",
    "error": "Property 'onClick' is missing"
  },
  "budget": {
    "timeMs": 120000,
    "tokens": 8000,
    "chunks": 10
  }
}
```

**Output:**
```json
{
  "result": "success",
  "changes": [...],
  "confidence": 0.85,
  "timeUsed": 45000,
  "tokensUsed": 3200
}
```

### Environment Tools

#### `env.runlite`
Runs lightweight environment validation and testing.

**Input:**
```json
{
  "command": "typecheck",
  "projectPath": "/path/to/project"
}
```

**Output:**
```json
{
  "success": true,
  "output": "Type checking completed successfully",
  "duration": 1500,
  "errors": []
}
```

## Error Responses

All tools return standardized error responses:

```json
{
  "error": {
    "code": "TOOL_ERROR",
    "message": "Human-readable error message",
    "details": {
      "tool": "repo.introspect",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per window
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Authentication

Currently uses API key authentication:

```json
{
  "headers": {
    "Authorization": "Bearer your-api-key"
  }
}
```

## WebSocket Support

For real-time communication, the gateway supports WebSocket connections:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle MCP tool responses
};
```

## Health Check

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "cache": "healthy",
    "vectorDb": "healthy",
    "playwright": "healthy",
    "context7": "healthy"
  }
}
```
