# LocalMCP API Reference

## Overview

LocalMCP provides 4 simple tools through the Model Context Protocol (MCP):

- `localmcp.analyze` - Analyze code, architecture, or project structure
- `localmcp.create` - Create new code, files, or project components  
- `localmcp.fix` - Fix bugs, issues, or improve existing code
- `localmcp.learn` - Learn from code patterns, best practices, or documentation

## MCP Protocol

LocalMCP implements the Model Context Protocol (MCP) using JSON-RPC 2.0 over stdio.

### Connection
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "clientInfo": {
      "name": "cursor",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

### Tool Listing
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "params": {},
  "id": 2
}
```

### Tool Execution
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "localmcp.analyze",
    "arguments": {
      "target": "./src",
      "analysisType": "architecture"
    }
  },
  "id": 3
}
```

## Tools API

### 1. localmcp.analyze

Analyze code, architecture, or project structure with AI assistance.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "target": {
      "type": "string",
      "description": "Code, file path, or project to analyze"
    },
    "analysisType": {
      "type": "string",
      "enum": ["code", "architecture", "performance", "security", "dependencies"],
      "description": "Type of analysis to perform"
    },
    "options": {
      "type": "object",
      "description": "Additional analysis options"
    }
  },
  "required": ["target", "analysisType"]
}
```

#### Example Usage
```json
{
  "name": "localmcp.analyze",
  "arguments": {
    "target": "./src/components",
    "analysisType": "architecture",
    "options": {
      "includeTests": true,
      "depth": 3
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"analysis\": {\n    \"type\": \"architecture\",\n    \"target\": \"./src/components\",\n    \"findings\": [\n      {\n        \"category\": \"structure\",\n        \"severity\": \"info\",\n        \"message\": \"Well-organized component structure with clear separation of concerns\",\n        \"suggestions\": [\n          \"Consider adding a barrel export file for easier imports\"\n        ]\n      }\n    ],\n    \"metrics\": {\n      \"totalComponents\": 12,\n      \"complexity\": \"medium\",\n      \"maintainability\": \"high\"\n    }\n  }\n}"
    }
  ]
}
```

### 2. localmcp.create

Create new code, files, or project components with context awareness.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["file", "component", "service", "test", "documentation"],
      "description": "Type of item to create"
    },
    "name": {
      "type": "string",
      "description": "Name of the item to create"
    },
    "template": {
      "type": "string",
      "description": "Template or framework to use"
    },
    "options": {
      "type": "object",
      "description": "Creation options and configuration"
    }
  },
  "required": ["type", "name"]
}
```

#### Example Usage
```json
{
  "name": "localmcp.create",
  "arguments": {
    "type": "component",
    "name": "LoginForm",
    "template": "react",
    "options": {
      "theme": "dark",
      "validation": true,
      "typescript": true
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"created\": {\n    \"type\": \"component\",\n    \"name\": \"LoginForm\",\n    \"files\": [\n      {\n        \"path\": \"src/components/LoginForm.tsx\",\n        \"content\": \"import React, { useState } from 'react'...\",\n        \"size\": 1024\n      },\n      {\n        \"path\": \"src/components/LoginForm.test.tsx\",\n        \"content\": \"import React from 'react'...\",\n        \"size\": 512\n      }\n    ],\n    \"dependencies\": [\n      \"react\",\n      \"@types/react\"\n    ]\n  }\n}"
    }
  ]
}
```

### 3. localmcp.fix

Fix bugs, issues, or improve existing code automatically.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "target": {
      "type": "string",
      "description": "Code or file to fix"
    },
    "issue": {
      "type": "string",
      "description": "Description of the issue"
    },
    "options": {
      "type": "object",
      "description": "Fix options and preferences"
    }
  },
  "required": ["target", "issue"]
}
```

#### Example Usage
```json
{
  "name": "localmcp.fix",
  "arguments": {
    "target": "TypeScript error: Property 'name' does not exist on type 'User'",
    "issue": "type mismatch",
    "options": {
      "preserveStyle": true,
      "addComments": true
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"fixed\": {\n    \"original\": \"Property 'name' does not exist on type 'User'\",\n    \"solution\": \"Add 'name' property to User interface\",\n    \"code\": {\n      \"before\": \"interface User { id: string; email: string; }\",\n      \"after\": \"interface User { id: string; email: string; name: string; }\"\n    },\n    \"explanation\": \"The User interface was missing the 'name' property that was being accessed in the code.\",\n    \"confidence\": 0.95\n  }\n}"
    }
  ]
}
```

### 4. localmcp.learn

Learn from code patterns, best practices, or documentation.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "topic": {
      "type": "string",
      "description": "Topic to learn about"
    },
    "level": {
      "type": "string",
      "enum": ["beginner", "intermediate", "advanced"],
      "description": "Learning level"
    },
    "context": {
      "type": "string",
      "description": "Additional context or code examples"
    },
    "options": {
      "type": "object",
      "description": "Learning preferences"
    }
  },
  "required": ["topic"]
}
```

#### Example Usage
```json
{
  "name": "localmcp.learn",
  "arguments": {
    "topic": "React authentication patterns",
    "level": "intermediate",
    "context": "Building a SaaS application with user management",
    "options": {
      "includeExamples": true,
      "focusOnSecurity": true
    }
  }
}
```

#### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"learned\": {\n    \"topic\": \"React authentication patterns\",\n    \"level\": \"intermediate\",\n    \"content\": {\n      \"patterns\": [\n        {\n          \"name\": \"JWT Token Management\",\n          \"description\": \"Secure token storage and refresh patterns\",\n          \"example\": \"const useAuth = () => { ... }\",\n          \"bestPractices\": [\n            \"Store tokens in httpOnly cookies\",\n            \"Implement automatic token refresh\",\n            \"Handle token expiration gracefully\"\n          ]\n        }\n      ],\n      \"security\": [\n        \"Always validate tokens on the server\",\n        \"Use HTTPS for all authentication requests\",\n        \"Implement proper logout functionality\"\n      ]\n    },\n    \"resources\": [\n      \"React Authentication Guide\",\n      \"JWT Best Practices\",\n      \"Security Checklist\"\n    ]\n  }\n}"
    }
  ]
}
```

## Error Handling

### Error Response Format
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "tool": "localmcp.analyze",
      "details": "Failed to analyze project structure",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  },
  "id": 3
}
```

### Common Error Codes
- `-32600`: Invalid Request
- `-32601`: Method Not Found
- `-32602`: Invalid Params
- `-32603`: Internal Error
- `-32000`: Tool Execution Error

## Context Integration

LocalMCP automatically gathers context from multiple sources:

### 1. Repository Facts
- Technology stack detection
- Project structure analysis
- Dependency analysis
- Configuration files

### 2. Context7 Integration
- Framework documentation
- Best practices
- API references
- Cached responses

### 3. RAG (Retrieval Augmented Generation)
- Project-specific documentation
- Architecture Decision Records (ADRs)
- Code patterns and examples
- Team knowledge base

### 4. Code Snippets
- Existing patterns
- Similar implementations
- Project conventions
- Style guidelines

## Performance

### Response Times
- **Tool execution**: <300ms average
- **Context gathering**: <500ms average
- **Total response**: <1s target

### Caching
- Context7 responses cached in SQLite
- Vector embeddings cached locally
- LRU cache for frequently accessed data

### Limits
- Maximum context size: 50KB
- Maximum tool execution time: 30s
- Maximum concurrent requests: 10

## Security

### Input Validation
- JSON schema validation for all inputs
- Sanitization of file paths
- Prevention of code injection

### Access Control
- Local execution only
- No external network access (except Context7)
- File system access limited to project directory

### Data Privacy
- No data sent to external services (except Context7)
- Local processing of all code analysis
- Temporary files cleaned up automatically

## Configuration

### Environment Variables
```bash
# Context7 API key (optional but recommended)
CONTEXT7_API_KEY=your_key_here

# Vector database URL
QDRANT_URL=http://localhost:6333

# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Server port
PORT=3000

# Cache configuration
CACHE_TTL=3600
CACHE_SIZE=1000
```

### Configuration File
```json
{
  "context7": {
    "enabled": true,
    "apiKey": "your_key_here",
    "cache": {
      "enabled": true,
      "ttl": 3600,
      "size": 1000
    }
  },
  "vector": {
    "url": "http://localhost:6333",
    "collection": "localmcp"
  },
  "tools": {
    "timeout": 30000,
    "maxRetries": 3
  }
}
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "context7": "connected",
    "vector": "connected",
    "cache": "healthy"
  },
  "metrics": {
    "uptime": 3600,
    "requests": 150,
    "errors": 2
  }
}
```

### Metrics
- Request count and response times
- Error rates and types
- Cache hit rates
- Memory and CPU usage

---

**For more information, see the [Development Guide](DEVELOPMENT.md) and [Cursor Setup](CURSOR_SETUP.md).**
