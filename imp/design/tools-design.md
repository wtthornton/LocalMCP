# LocalMCP Tools Design Specification

## Overview

LocalMCP exposes exactly **4 simple tools** to vibe coders through the MCP protocol. Each tool is designed to be intuitive, powerful, and require zero configuration.

## Tool Architecture

### Core Principle
- **Ultra-simple interface** - Only 4 tools to remember
- **Invisible complexity** - Dynamic pipeline powers everything behind the scenes
- **Vibe coder friendly** - Natural language descriptions, no technical jargon
- **Zero configuration** - Works out of the box with smart defaults

## The 4 Tools

### 1. `localmcp.analyze` - "Look at my project"

**Purpose**: Analyzes and understands the current project context

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Project path to analyze (optional, defaults to current directory)"
    },
    "depth": {
      "type": "string",
      "enum": ["quick", "deep", "comprehensive"],
      "description": "Analysis depth (default: quick)"
    }
  }
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "projectType": {
      "type": "string",
      "description": "Detected project type (React, Next.js, Vue, etc.)"
    },
    "techStack": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Technologies detected in the project"
    },
    "dependencies": {
      "type": "object",
      "description": "Key dependencies and versions"
    },
    "structure": {
      "type": "object",
      "description": "Project structure analysis"
    },
    "issues": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Potential issues or improvements"
    },
    "recommendations": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Recommendations for the project"
    }
  }
}
```

**Vibe Coder Experience**:
```
User: "What's in this project?"
AI: *calls localmcp.analyze*
LocalMCP: *analyzes project structure, dependencies, patterns*
AI: "This is a Next.js 14 project with TypeScript, using Tailwind CSS and Prisma. I found some potential improvements in your error handling patterns."
```

### 2. `localmcp.create` - "Make me something new"

**Purpose**: Creates new code, components, or files based on natural language descriptions

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "description": {
      "type": "string",
      "description": "What you want to create (e.g., 'dark theme Hello World HTML')"
    },
    "context": {
      "type": "object",
      "properties": {
        "framework": {"type": "string"},
        "language": {"type": "string"},
        "style": {"type": "string"}
      },
      "description": "Additional context for creation"
    },
    "output": {
      "type": "object",
      "properties": {
        "format": {"type": "string", "enum": ["file", "code", "component"]},
        "location": {"type": "string"}
      }
    }
  },
  "required": ["description"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "created": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {"type": "string"},
          "name": {"type": "string"},
          "content": {"type": "string"},
          "path": {"type": "string"}
        }
      }
    },
    "explanation": {
      "type": "string",
      "description": "Explanation of what was created and why"
    },
    "bestPractices": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Best practices applied"
    }
  }
}
```

**Vibe Coder Experience**:
```
User: "Create me a dark theme Hello World"
AI: *calls localmcp.create*
LocalMCP: *gets dark theme best practices, generates modern HTML*
AI: "Created! Here's your dark theme Hello World with proper contrast ratios, responsive design, and accessibility features."
```

### 3. `localmcp.fix` - "Fix this problem"

**Purpose**: Fixes errors and problems using project context and cached documentation

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "problem": {
      "type": "string",
      "description": "Description of the problem to fix"
    },
    "context": {
      "type": "object",
      "properties": {
        "file": {"type": "string"},
        "line": {"type": "number"},
        "error": {"type": "string"}
      }
    },
    "scope": {
      "type": "string",
      "enum": ["file", "function", "component", "project"],
      "description": "Scope of the fix (default: auto-detect)"
    }
  },
  "required": ["problem"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "fixed": {
      "type": "boolean",
      "description": "Whether the problem was successfully fixed"
    },
    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": {"type": "string"},
          "line": {"type": "number"},
          "old": {"type": "string"},
          "new": {"type": "string"},
          "reason": {"type": "string"}
        }
      }
    },
    "explanation": {
      "type": "string",
      "description": "Explanation of what was fixed and how"
    },
    "prevention": {
      "type": "string",
      "description": "How to prevent this issue in the future"
    }
  }
}
```

**Vibe Coder Experience**:
```
User: "Fix this TypeScript error"
AI: *calls localmcp.fix*
LocalMCP: *analyzes error, gets TypeScript best practices, applies fix*
AI: "Fixed! The error was caused by missing type annotation. I've added the proper types and it should work now."
```

### 4. `localmcp.learn` - "Remember this solution"

**Purpose**: Captures and applies lessons from successful patterns and solutions

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["capture", "apply", "search"],
      "description": "What to do with the lesson"
    },
    "pattern": {
      "type": "object",
      "properties": {
        "problem": {"type": "string"},
        "solution": {"type": "string"},
        "context": {"type": "object"}
      },
      "description": "Pattern to capture or search for"
    },
    "feedback": {
      "type": "object",
      "properties": {
        "success": {"type": "boolean"},
        "rating": {"type": "number", "minimum": 1, "maximum": 5},
        "notes": {"type": "string"}
      },
      "description": "Feedback on the solution"
    }
  },
  "required": ["action"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the operation was successful"
    },
    "lesson": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "confidence": {"type": "number"},
        "applications": {"type": "number"}
      }
    },
    "applied": {
      "type": "array",
      "items": {"type": "string"},
      "description": "Lessons that were applied"
    }
  }
}
```

**Vibe Coder Experience**:
```
User: "Remember this solution"
AI: *calls localmcp.learn*
LocalMCP: *captures the pattern, stores it for future use*
AI: "Got it! I'll remember this TypeScript pattern for next time."
```

## Implementation Notes

### Dynamic Pipeline Integration
Each tool call triggers the dynamic pipeline:
1. **Retrieve.AgentsMD** - Get project directives
2. **Detect.RepoFacts** - Analyze project context
3. **Retrieve.Context7** - Get cached documentation (SQLite + LRU cache)
4. **Retrieve.RAG** - Get project-specific context (Qdrant vector DB)
5. **Read.Snippet** - Read relevant code
6. **Reason.Plan** - Plan the approach
7. **Edit** - Execute the action
8. **Validate** - Verify the result
9. **Gate** - Quality check
10. **Document** - Record the action
11. **Learn** - Capture lessons

### Error Handling
All tools return standardized error responses:
```json
{
  "error": {
    "code": "TOOL_ERROR",
    "message": "Human-readable error message",
    "tool": "localmcp.analyze",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Performance Targets
- **Response time**: <2s for cached responses
- **First-pass success**: ≥70% for all tools
- **Retry rate**: ≤2 retries median
- **Cache hit rate**: >80% for Context7 requests

## Vibe Coder Benefits

This design ensures that vibe coders can:
- **Focus on building** rather than learning tool interfaces
- **Get instant results** without configuration
- **Learn patterns** that improve over time
- **Trust the system** to handle complexity behind the scenes

The 4-tool approach strikes the perfect balance between simplicity and power, giving vibe coders everything they need without overwhelming them with options.
