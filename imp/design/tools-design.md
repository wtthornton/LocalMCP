# PromptMCP Tools Design Specification

## Overview

PromptMCP exposes exactly **1 simple tool** to vibe coders through the MCP protocol. The tool is designed to be intuitive, powerful, and require zero configuration.

## Tool Architecture

### Core Principle
- **Ultra-simple interface** - Only 1 tool to remember
- **Invisible complexity** - Dynamic pipeline powers everything behind the scenes
- **Vibe coder friendly** - Natural language descriptions, no technical jargon
- **Zero configuration** - Works out of the box with smart defaults

## The Tool

### `promptmcp.enhance` - "Make my prompt better"

**Purpose**: Enhances prompts with project context and best practices

**Input Schema**:
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

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "enhanced_prompt": {
      "type": "string",
      "description": "The enhanced prompt with project context"
    },
    "context_used": {
      "type": "object",
      "properties": {
        "repo_facts": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Repository facts used for enhancement"
        },
        "code_snippets": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Code snippets from the project"
        },
        "framework_docs": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Framework documentation used"
        },
        "project_docs": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Project-specific documentation used"
        }
      }
    }
  }
}
```

**Vibe Coder Experience**:
```
User: "Create a login form"
AI: *calls promptmcp.enhance*
PromptMCP: *enhances prompt with React best practices, project patterns, accessibility guidelines*
AI: "Here's your enhanced prompt: 'Create a modern React login form with TypeScript, proper validation, accessibility features, and dark theme support that follows the project's existing component patterns...'"
```

## Implementation Notes

### Dynamic Pipeline Integration
The enhance tool triggers the dynamic pipeline:
1. **Retrieve.AgentsMD** - Get project directives
2. **Detect.RepoFacts** - Analyze project context
3. **Retrieve.Context7** - Get cached documentation (SQLite + LRU cache)
4. **Retrieve.RAG** - Get project-specific context (Qdrant vector DB)
5. **Read.Snippet** - Read relevant code
6. **Reason.Plan** - Plan the enhancement approach
7. **Enhance** - Apply context and best practices
8. **Validate** - Verify the enhanced prompt
9. **Gate** - Quality check
10. **Document** - Record the enhancement
11. **Learn** - Capture lessons for future enhancements

### Error Handling
The tool returns standardized error responses:
```json
{
  "error": {
    "code": "TOOL_ERROR",
    "message": "Human-readable error message",
    "tool": "promptmcp.enhance",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Performance Targets
- **Response time**: <2s for cached responses
- **First-pass success**: ≥70% for all enhancements
- **Retry rate**: ≤2 retries median
- **Cache hit rate**: >80% for Context7 requests

## Vibe Coder Benefits

This design ensures that vibe coders can:
- **Focus on building** rather than learning complex tool interfaces
- **Get instant results** without configuration
- **Leverage project context** automatically
- **Trust the system** to handle complexity behind the scenes

The single-tool approach provides maximum simplicity while delivering powerful prompt enhancement capabilities that improve over time through the learning system.