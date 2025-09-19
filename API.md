# PromptMCP API Reference

## Overview

PromptMCP provides a single tool through the Model Context Protocol (MCP):

- `promptmcp.enhance` - Enhance prompts with project context and best practices

## MCP Protocol

PromptMCP implements the Model Context Protocol (MCP) using JSON-RPC 2.0 over stdio.

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
    "name": "promptmcp.enhance",
    "arguments": {
      "prompt": "Create a login form",
      "context": {
        "framework": "react",
        "style": "modern"
      }
    }
  },
  "id": 3
}
```

## Tools API

### promptmcp.enhance

Enhance prompts with project context and best practices.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "prompt": {
      "type": "string",
      "description": "The prompt to enhance"
    },
    "context": {
      "type": "object",
      "properties": {
        "file": {
          "type": "string",
          "description": "Optional file path for context"
        },
        "framework": {
          "type": "string",
          "description": "Optional framework for context"
        },
        "style": {
          "type": "string",
          "description": "Optional style preference"
        }
      },
      "description": "Additional context for enhancement"
    }
  },
  "required": ["prompt"]
}
```

#### Example Usage
```json
{
  "name": "promptmcp.enhance",
  "arguments": {
    "prompt": "Create a login form",
    "context": {
      "framework": "react",
      "style": "modern",
      "file": "./src/components"
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
      "text": "{\n  \"enhanced_prompt\": \"Create a modern React login form with TypeScript, proper validation, accessibility features, and dark theme support that follows the project's existing component patterns...\",\n  \"context_used\": {\n    \"repo_facts\": [\"Project uses TypeScript\", \"Tailwind CSS for styling\"],\n    \"code_snippets\": [\"Existing form patterns from UserForm.tsx\"],\n    \"framework_docs\": [\"React form best practices\", \"Accessibility guidelines\"],\n    \"project_docs\": [\"Component structure guidelines\"]\n  }\n}"
    }
  ]
}
```

## Error Handling

All errors follow the standard MCP error format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -1,
    "message": "Human-readable error message",
    "data": {
      "code": "TOOL_ERROR"
    }
  }
}
```

## Benefits for Vibe Coders

- **Simple Interface**: Only one tool to remember
- **Context Awareness**: Automatically uses project context
- **Best Practices**: Integrates industry best practices
- **Zero Configuration**: Works out of the box
- **Fast Responses**: Cached documentation for quick enhancement