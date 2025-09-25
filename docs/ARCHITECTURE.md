# Architecture Overview

## System Design

PromptMCP is designed as a local-first, Docker-based service that enhances AI coding assistants by providing contextual, project-aware assistance to "vibe coders" through dynamic framework detection and intelligent prompt enhancement.

## Core Components

### 1. MCP Server (`src/mcp/server.ts`)
- **Purpose**: Main MCP protocol server that exposes tools to AI assistants
- **Technology**: Node.js 22 LTS + TypeScript
- **Protocol**: JSON-RPC over stdio
- **Tools**: `promptmcp.enhance`, `promptmcp.todo`, `promptmcp.health`
- **Configuration**: Uses `mcp-config.json` and environment variables

### 2. Enhanced Context7 Enhance Tool (`src/tools/enhanced-context7-enhance.tool.ts`)
- **Purpose**: Main orchestrator for prompt enhancement with Context7 integration
- **Architecture**: Extracted services pattern for maintainability
- **Services**: PromptAnalyzer, Context7Documentation, FrameworkIntegration, ResponseBuilder, TaskContext, HealthChecker
- **Features**: Context-aware analysis, intelligent caching, AI enhancement

### 3. Simple Context7 Client (`src/services/context7/simple-context7-client.ts`)
- **Purpose**: Direct API client for Context7 MCP endpoints
- **Technology**: Direct HTTP calls to Context7 MCP API
- **Features**: Library resolution, documentation retrieval, text parsing
- **Caching**: Integrated with PromptCacheService for performance

### 4. Framework Detection Service (`src/services/framework-detector/framework-detector.service.ts`)
- **Purpose**: Universal framework detection using multiple strategies
- **Methods**: Pattern matching, AI suggestions, project context analysis
- **Benefits**: Works with any Context7 library, zero hardcoding, intelligent caching
- **Performance**: <10ms detection time with parallel processing

### 5. Prompt Cache Service (`src/services/cache/prompt-cache.service.ts`)
- **Purpose**: Multi-level caching for enhanced prompts and Context7 content
- **Technology**: SQLite with WAL mode + LRU memory cache
- **Features**: TTL-based expiration, context-aware keys, performance metrics
- **Benefits**: Eliminates repeated processing, provides offline access

### 6. Todo Management System (`src/services/todo/todo.service.ts`)
- **Purpose**: Comprehensive todo management with hierarchical tasks
- **Features**: Subtasks, dependencies, project organization, analytics
- **Database**: SQLite with migrations for todos, subtasks, dependencies
- **Integration**: Works with task breakdown for seamless workflow

## Data Flow

```
AI Assistant (Cursor) 
    ↓ (MCP Protocol - JSON-RPC over stdio)
MCP Server (src/mcp/server.ts)
    ↓ (promptmcp.enhance)
Enhanced Context7 Enhance Tool
    ↓ (4-Phase Processing)
├── Phase 1: Context Gathering
│   ├── Project Context Analysis (ProjectAnalyzerService)
│   └── Framework Detection (FrameworkDetectorService)
├── Phase 2: Context-Aware Analysis
│   ├── Prompt Complexity Analysis (PromptAnalyzerService)
│   └── Quality Requirements Detection (FrameworkIntegrationService)
├── Phase 3: Context-Informed Processing
│   ├── Cache Check (PromptCacheService)
│   ├── Context7 Documentation (SimpleContext7Client)
│   ├── Task Breakdown (TaskContextService)
│   └── Response Building (ResponseBuilderService)
└── Phase 4: Response Generation
    ├── Result Caching
    └── Response Assembly
```

## Service Architecture

### Core Services Layer
- **ConfigService**: Hybrid configuration management (MCP config + env vars)
- **Logger**: Structured logging with Winston
- **DatabaseMigrationsService**: SQLite schema management

### Enhancement Services Layer
- **PromptAnalyzerService**: AI-powered prompt complexity analysis
- **Context7DocumentationService**: Context7 integration and documentation retrieval
- **FrameworkIntegrationService**: Framework detection and quality requirements
- **ResponseBuilderService**: Enhanced prompt construction
- **TaskContextService**: Task breakdown and todo integration
- **HealthCheckerService**: System health monitoring

### Cache and Storage Layer
- **PromptCacheService**: Multi-level caching (SQLite + LRU)
- **TodoService**: Hierarchical task management
- **CacheAnalyticsService**: Cache performance monitoring

### External Integration Layer
- **SimpleContext7Client**: Direct Context7 MCP API integration
- **OpenAIService**: AI enhancement capabilities
- **TaskBreakdownService**: AI-powered task decomposition

## Tool Architecture

### Current Tools (MCP Protocol)
- **`promptmcp.enhance`**: Main enhancement tool with Context7 integration
- **`promptmcp.todo`**: Comprehensive todo management with hierarchical tasks
- **`promptmcp.health`**: System health monitoring and diagnostics

### Enhanced Context7 Enhance Tool Components
- **PromptAnalyzerService**: AI-powered prompt complexity analysis and optimization
- **Context7DocumentationService**: Context7 integration with intelligent caching
- **FrameworkIntegrationService**: Universal framework detection and quality requirements
- **ResponseBuilderService**: Enhanced prompt construction with context integration
- **TaskContextService**: Task breakdown integration with todo management
- **HealthCheckerService**: Comprehensive system health monitoring

### Framework Detection Components
- **Pattern Matching**: Detects libraries from natural language patterns using regex
- **AI Suggestions**: Uses AI to suggest relevant libraries for generic prompts
- **Project Context Analysis**: Analyzes project structure and dependencies
- **Context7 Integration**: Resolves and retrieves documentation for any Context7 library
- **Dynamic Detection**: Works with any framework/library without hardcoding

### Processing Phases
1. **Context Gathering**: Project analysis and framework detection
2. **Context-Aware Analysis**: Prompt complexity and quality requirements
3. **Context-Informed Processing**: Caching, documentation, and task breakdown
4. **Response Generation**: Result caching and response assembly

## Caching Strategy

### Prompt Cache Service
- **Storage**: SQLite with WAL mode for persistence
- **Memory**: LRU cache for hot keys and fast access
- **TTL**: Configurable by complexity (simple: 0.5x, medium: 1x, complex: 2x default)
- **Keys**: Context-aware hashing with project context, frameworks, and prompt characteristics
- **Eviction**: LRU by hits and timestamp, automatic cleanup of expired entries
- **Metrics**: Hit rate, response time, performance gain tracking

### Context7 Integration Caching
- **Library Resolution**: Cached Context7 library ID mappings
- **Documentation**: Cached framework documentation with TTL
- **Performance**: Reduces API calls and improves response times
- **Invalidation**: Smart invalidation based on project context changes

## Security Model

- **Configuration**: Hybrid approach with `mcp-config.json` and environment variables
- **API Keys**: Stored in MCP config file, never committed to version control
- **Data**: Local SQLite databases, no external dependencies
- **Logging**: Structured logging with redacted sensitive information
- **Caching**: Local SQLite + LRU cache (no external cache dependencies)
- **Network**: Direct HTTP calls to Context7 API, no intermediate services

## Performance Targets

- **Framework Detection**: ≥90% accuracy for clear prompts, <10ms detection time
- **Cache Hit Rate**: >80% for Context7 requests, ≥70% for framework detection
- **Response Time**: <2s for cached responses, <5s for uncached
- **Context Quality**: >90% relevance score for context sources
- **Enhancement Quality**: >85% user satisfaction with enhanced prompts
- **Error Rate**: <1% for enhancement operations

## Scalability Considerations

- **Single User**: Designed for local development use
- **Project Separation**: Cache and todos scoped per project
- **Resource Limits**: Configurable memory and CPU limits
- **Cleanup**: Automatic cleanup of old cache entries and expired data

## Monitoring & Observability

- **Logging**: Structured logging with Winston logger
- **Metrics**: Cache performance, response times, and success rates
- **Health Checks**: Comprehensive health monitoring via `promptmcp.health` tool
- **Debugging**: Environment variable controls (`CONTEXT7_DEBUG`, `ENHANCE_DEBUG`)
- **Analytics**: Cache analytics service for performance monitoring
