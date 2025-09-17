# Architecture Overview

## System Design

The Personal MCP Gateway is designed as a local-first, Docker-based service that enhances AI coding assistants by providing contextual, project-aware assistance to "vibe coders."

## Core Components

### 1. MCP Gateway Server
- **Purpose**: Main orchestrator that exposes MCP tools to AI assistants
- **Technology**: Node.js 22 LTS + TypeScript
- **Port**: 3000 (configurable)

### 2. Context7 Cache Service
- **Purpose**: Local caching of external documentation for instant access
- **Technology**: SQLite + LRU cache
- **Benefits**: Eliminates repeated API calls, provides offline access

### 3. Vector Database (RAG)
- **Purpose**: Stores and retrieves project-specific documentation and lessons learned
- **Technology**: Qdrant (primary) or SQLite + FAISS (fallback)
- **Content**: Project docs, ADRs, design decisions, coding patterns

### 4. Playwright Sidecar
- **Purpose**: UI testing and validation capabilities
- **Technology**: Playwright MCP server
- **Isolation**: Runs in separate Docker container

## Data Flow

```
AI Assistant (Cursor) 
    ↓ (MCP Protocol)
MCP Gateway Server
    ↓ (Tool Calls)
├── Context7 Cache (instant docs)
├── Vector DB (project context)
├── Playwright (UI validation)
└── Pipeline Engine (dynamic processing)
```

## Tool Architecture

### Core Tools
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

## Performance Targets

- **Startup**: <15 minutes on new repository
- **First-pass Fix Rate**: ≥70%
- **Retry Rate**: ≤2 retries median
- **Cache Hit Rate**: >80% for Context7 requests
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
