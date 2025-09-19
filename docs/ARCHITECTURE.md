# Architecture Overview

## System Design

PromptMCP is designed as a local-first, Docker-based service that enhances AI coding assistants by providing contextual, project-aware assistance to "vibe coders" through dynamic framework detection and intelligent prompt enhancement.

## Core Components

### 1. MCP Gateway Server
- **Purpose**: Main orchestrator that exposes MCP tools to AI assistants
- **Technology**: Node.js 22 LTS + TypeScript
- **Port**: 3000 (configurable)
- **Core Tool**: `promptmcp.enhance` with dynamic framework detection

### 2. Dynamic Framework Detection System
- **Purpose**: Universal framework detection using patterns, AI, and project context
- **Technology**: Pattern matching, AI suggestions, project analysis
- **Benefits**: Works with any Context7 library, zero hardcoding, intelligent caching

### 3. Context7 Cache Service
- **Purpose**: Local caching of external documentation for instant access
- **Technology**: SQLite + LRU cache (no Redis dependency)
- **Benefits**: Eliminates repeated API calls, provides offline access, simple local-first approach

### 4. Vector Database (RAG)
- **Purpose**: Stores and retrieves project-specific documentation and lessons learned
- **Technology**: Qdrant (primary) or SQLite + FAISS (fallback)
- **Content**: Project docs, ADRs, design decisions, coding patterns

### 5. Playwright Sidecar
- **Purpose**: UI testing and validation capabilities
- **Technology**: Playwright MCP server
- **Isolation**: Runs in separate Docker container

## Data Flow

```
AI Assistant (Cursor) 
    ↓ (MCP Protocol)
MCP Gateway Server
    ↓ (promptmcp.enhance)
├── Dynamic Framework Detection
│   ├── Pattern Matching
│   ├── AI Suggestions
│   └── Project Context Analysis
├── Context7 Integration
│   ├── Library Resolution
│   ├── Documentation Retrieval
│   └── Intelligent Caching
├── Vector DB (project context)
├── Playwright (UI validation)
└── Pipeline Engine (dynamic processing)
```

## Tool Architecture

### Core Tool
- `promptmcp.enhance` - Intelligent prompt enhancement with dynamic framework detection

### Framework Detection Components
- **Pattern Matching**: Detects libraries from natural language patterns
- **AI Suggestions**: Uses AI to suggest relevant libraries for generic prompts
- **Project Context Analysis**: Analyzes project structure and dependencies
- **Context7 Integration**: Resolves and retrieves documentation for any Context7 library

### Legacy Tools (Deprecated)
- `repo.introspect` - Analyze project structure and dependencies
- `repo.read` - Smart file reading with context
- `context7.bridge` - Cached external documentation access
- `docs.rag` - Project-specific documentation retrieval
- `pipeline.run` - Dynamic processing pipeline
- `env.runlite` - Environment validation and testing

### Pipeline Stages
1. **Retrieve.AgentsMD** - Get project directives
2. **Detect.RepoFacts** - Analyze project structure
3. **Retrieve.Context7** - Get cached documentation
4. **Retrieve.RAG** - Get project-specific context
5. **Read.Snippet** - Read relevant code snippets
6. **Reason.Plan** - Generate solution plan
7. **Edit** - Apply changes
8. **Validate** - Verify changes
9. **Gate** - Quality checks
10. **Document** - Record changes
11. **Learn** - Update lessons learned

## Caching Strategy

### Context7 Cache
- **Storage**: SQLite with WAL mode
- **Memory**: LRU cache for hot keys
- **TTL**: 24h fresh, 7d stale-while-refresh, 30d max age
- **Eviction**: LRU by bytes, per-package caps
- **Invalidation**: On dependency version changes

### RAG Storage
- **Chunking**: 400-700 tokens per chunk
- **Metadata**: Project ID, path, heading trail, framework, package version
- **Indexing**: Vector similarity search
- **Scope**: Project-local by default, stack-shared for promoted lessons

## Security Model

- **Isolation**: Each service runs in separate Docker container
- **Network**: Internal Docker network for service communication
- **Data**: No secrets in code, environment-based configuration
- **Logging**: Redacted identifiers, spans not full files
- **Caching**: Local SQLite + LRU cache (no external cache dependencies)

## Performance Targets

- **Startup**: <15 minutes on new repository
- **Framework Detection**: ≥90% accuracy for clear prompts, <10ms detection time
- **First-pass Fix Rate**: ≥70%
- **Retry Rate**: ≤2 retries median
- **Cache Hit Rate**: >80% for Context7 requests, ≥70% for framework detection
- **Response Time**: <2s for cached responses

## Scalability Considerations

- **Single User**: Designed for local development use
- **Project Separation**: Lessons and RAG scoped per project
- **Resource Limits**: Configurable memory and CPU limits
- **Cleanup**: Automatic cleanup of old cache entries and lessons

## Monitoring & Observability

- **Logging**: Structured logging with Winston
- **Metrics**: Performance and success rate tracking
- **Health Checks**: Docker health checks for all services
- **Debugging**: MCP Inspector support for development
