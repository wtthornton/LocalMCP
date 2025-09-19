# API Reference

## MCP Tools

PromptMCP exposes the following tools to AI assistants:

### Core Tool

#### `promptmcp.enhance`
Intelligent prompt enhancement with perfect project context using dynamic framework detection, Context7 integration, and advanced RAG.

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
    "includeMetadata": true
  }
}
```

**Output:**
```json
{
  "enhanced_prompt": "Create a login form with React and dark theme\n\n## Detected Frameworks/Libraries:\n- **Frameworks**: react, tailwind\n- **Detection Method**: pattern\n- **Confidence**: 95.0%\n- **Suggestions**: Detected react (pattern), Detected tailwind (pattern)\n\n## Framework Best Practices (from Context7):\n## /facebook/react Documentation:\n[Context7 React documentation content]\n\n## /tailwindlabs/tailwindcss Documentation:\n[Context7 Tailwind documentation content]\n\n## Instructions:\nMake your response consistent with the project's existing patterns, best practices, and coding standards. Use the provided context to ensure your solution fits well with the existing codebase.",
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
  "success": true
}
```

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
