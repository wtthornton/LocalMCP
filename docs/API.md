# API Reference

## MCP Tools

The Personal MCP Gateway exposes the following tools to AI assistants:

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
    "playwright": "healthy"
  }
}
```
