# Development Guide

## Overview

This guide covers development setup, contribution guidelines, and technical details for PromptMCP.

## Prerequisites

- **Node.js**: 22+ (LTS recommended)
- **TypeScript**: 5.0+
- **Docker**: 20.10+ (optional but recommended)
- **Git**: 2.30+

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/wtthornton/PromptMCP.git
cd PromptMCP

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy the template
cp .env.template .env

# Edit with your values
nano .env
```

**Required Environment Variables:**
```bash
# Context7 API Key (optional but recommended)
CONTEXT7_API_KEY=your_context7_api_key_here

# OpenAI API Key (for AI enhancement)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_PROJECT_ID=your_openai_project_id_here

# Database Configuration
TODO_DB_PATH=todos.db
PROMPT_CACHE_DB_PATH=prompt-cache.db

# Debug Settings
CONTEXT7_DEBUG=false
ENHANCE_DEBUG=false
LOG_LEVEL=info
```

### 3. Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Lint and fix code
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

## Project Structure

```
src/
├── mcp/                    # MCP server implementation
│   └── server.ts          # Main MCP server
├── tools/                 # MCP tools
│   ├── enhanced-context7-enhance.tool.ts
│   ├── todo.tool.ts
│   └── health.tool.ts
├── services/              # Core services
│   ├── context7/          # Context7 integration
│   ├── cache/             # Caching services
│   ├── framework-detector/ # Framework detection
│   ├── todo/              # Todo management
│   └── ai/                # AI enhancement services
├── config/                # Configuration management
├── types/                 # TypeScript type definitions
└── health-server.ts       # Health monitoring server
```

## Architecture Overview

### MCP Server (`src/mcp/server.ts`)

The main MCP server that exposes tools to AI assistants:

- **Protocol**: JSON-RPC over stdio
- **Tools**: `promptmcp.enhance`, `promptmcp.todo`, `promptmcp.health`
- **Configuration**: Hybrid approach with `mcp-config.json` and environment variables

### Core Tools

#### 1. Enhanced Context7 Enhance Tool

**File**: `src/tools/enhanced-context7-enhance.tool.ts`

**Purpose**: Main orchestrator for prompt enhancement with Context7 integration

**Key Features**:
- Dynamic framework detection
- Context7 documentation retrieval
- AI-powered prompt enhancement
- Smart caching with SQLite + LRU
- Task breakdown integration

**Architecture**: Uses extracted services pattern for maintainability:
- `PromptAnalyzerService`: AI-powered prompt analysis
- `Context7DocumentationService`: Context7 integration
- `FrameworkIntegrationService`: Framework detection
- `ResponseBuilderService`: Enhanced prompt construction
- `TaskContextService`: Task breakdown integration
- `HealthCheckerService`: System health monitoring

#### 2. Todo Tool

**File**: `src/tools/todo.tool.ts`

**Purpose**: Comprehensive todo management with hierarchical tasks

**Key Features**:
- Smart parsing of natural language descriptions
- Hierarchical tasks with subtasks and dependencies
- Project-scoped organization
- Analytics and progress tracking
- Beautiful markdown formatting

#### 3. Health Tool

**File**: `src/tools/health.tool.ts`

**Purpose**: System health monitoring and diagnostics

**Key Features**:
- Service status monitoring
- Performance metrics
- Error tracking
- Configuration validation
- Resource monitoring

### Services Layer

#### Context7 Integration (`src/services/context7/`)

- **`simple-context7-client.ts`**: Direct API client for Context7 MCP endpoints
- **`context7-integration.service.ts`**: Main integration service
- **`sse-parser.ts`**: Server-sent events parser for streaming responses

#### Framework Detection (`src/services/framework-detector/`)

- **`framework-detector.service.ts`**: Universal framework detection
- **`simple-hybrid-detector.service.ts`**: Hybrid detection strategy
- **`project-context-analyzer.service.ts`**: Project context analysis

#### Caching (`src/services/cache/`)

- **`prompt-cache.service.ts`**: Multi-level caching (SQLite + LRU)
- **`cache-analytics.service.ts`**: Cache performance monitoring
- **`enhanced-prompt-cache.service.ts`**: Enhanced prompt caching

#### Todo Management (`src/services/todo/`)

- **`todo.service.ts`**: Core todo management with SQLite
- **Database migrations**: Automatic schema management

#### AI Enhancement (`src/services/ai/`)

- **`prompt-enhancement-agent.service.ts`**: AI-powered prompt enhancement
- **`openai.service.ts`**: OpenAI API integration
- **`enhancement-config.service.ts`**: Enhancement configuration

## Testing

### Test Structure

```
test/
├── unit/                  # Unit tests
├── integration/           # Integration tests
├── test-e2e-mcp.js       # End-to-end MCP tests
└── test-e2e-http.js      # End-to-end HTTP tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Artifacts

Test results are organized in `test-artifacts/`:

```
test-artifacts/
├── results/              # JSON test result files
├── reports/              # HTML test reports
├── logs/                 # Test execution logs
└── screenshots/          # Playwright screenshots
```

## Code Quality

### Linting

```bash
# Check for linting issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Type Checking

```bash
# Run TypeScript type checking
npm run type-check
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Code formatting (configured via ESLint)
- **Naming**: camelCase for variables, PascalCase for classes

## Docker Development

### Using Docker

```bash
# Build the Docker image
npm run vibe:build

# Start with Docker Compose
npm run vibe:up

# View logs
npm run vibe:logs

# Stop services
npm run vibe:down
```

### Docker Configuration

**Dockerfile**: `vibe/Dockerfile`
**Docker Compose**: `vibe/docker-compose.yml`

## Debugging

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variables
export CONTEXT7_DEBUG=true
export ENHANCE_DEBUG=true
export LOG_LEVEL=debug

# Run in debug mode
npm run dev
```

### Common Debug Scenarios

1. **MCP Server Issues**:
   ```bash
   # Test MCP server directly
   node dist/mcp/server.js
   ```

2. **Context7 Integration**:
   ```bash
   # Test Context7 connectivity
   npm run test:context7
   ```

3. **Database Issues**:
   ```bash
   # Check database files
   ls -la *.db
   ```

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests**:
   ```bash
   npm test
   ```
5. **Commit your changes**:
   ```bash
   git commit -m "feat: add your feature"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a pull request**

### Commit Message Format

Use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

### Pull Request Guidelines

1. **Clear description** of what the PR does
2. **Reference issues** if applicable
3. **Include tests** for new features
4. **Update documentation** if needed
5. **Ensure all tests pass**

## Performance Considerations

### Caching Strategy

- **SQLite**: Persistent storage with WAL mode
- **LRU Cache**: In-memory hot key caching
- **TTL**: Time-to-live based on complexity
- **Context-aware keys**: Better cache hit rates

### Memory Management

- **Service cleanup**: Proper service destruction
- **Cache eviction**: LRU-based eviction policy
- **Resource limits**: Configurable memory limits

### Response Time Optimization

- **Parallel processing**: Concurrent service calls
- **Cache-first**: Check cache before processing
- **Circuit breakers**: Graceful degradation
- **Token optimization**: Efficient Context7 usage

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

2. **Test Failures**:
   ```bash
   # Run specific test
   npm test -- --grep "test name"
   ```

3. **MCP Connection Issues**:
   - Check Cursor MCP configuration
   - Verify server is running
   - Check logs for errors

4. **Context7 Issues**:
   - Verify API key configuration
   - Check network connectivity
   - Run Context7 test script

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/wtthornton/PromptMCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wtthornton/PromptMCP/discussions)
- **Documentation**: Check the `docs/` directory

## License

MIT License - see [LICENSE](LICENSE) file for details.
