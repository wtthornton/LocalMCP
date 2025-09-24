# PromptMCP Technology Stack Reference

Essential technologies for PromptMCP - MCP server for AI-powered prompt enhancement.

## Core Stack

**Node.js 18+** - Runtime environment (ES2022 target)
**TypeScript 5.0+** - Main language with static types
**Docker** - Containerization and deployment
**SQLite 3** - Primary database (todos, cache, config)
**Qdrant** - Vector database for semantic search

## AI & Integration

**OpenAI API 5.22+** - GPT-4 for task breakdown and enhancement
**Context7** - Framework documentation API
**MCP Protocol 0.5+** - JSON-RPC communication standard

## Testing & Quality

**Vitest 1.0+** - Modern testing framework (Jest-compatible)
**ESLint 8.0+** - Code linting and quality
**Playwright 1.55+** - E2E testing and browser automation
**@testing-library** - React component testing utilities

## Development Dependencies

**@types/node 20+** - Node.js type definitions
**tsx 4.0+** - TypeScript execution for development
**rimraf 5.0+** - Cross-platform file deletion
**@vitest/coverage-v8** - Test coverage reporting

## Key Commands

```bash
npm install && npm run build    # Setup
npm test                        # Run tests
npm run test:coverage          # Test coverage report
npm run lint                    # Code quality check
npm run lint:fix               # Fix linting issues
npm run type-check             # TypeScript validation
npm run health:dev             # Development health check
docker-compose up -d           # Production
docker-compose logs -f         # View logs
curl http://localhost:3000/health  # Health check
```

## Environment Variables

### Required
- `OPENAI_API_KEY` - OpenAI API access key
- `CONTEXT7_API_KEY` - Context7 documentation API key

### Optional Configuration
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (info, debug, error)
- `WORKSPACE_PATH` - Workspace directory path

### OpenAI Configuration
- `OPENAI_PROJECT_ID` - OpenAI project identifier
- `OPENAI_MODEL` - Model to use (default: gpt-4)
- `OPENAI_MAX_TOKENS` - Maximum tokens per request (default: 4000)
- `OPENAI_TEMPERATURE` - Response creativity (default: 0.3)

### Context7 Configuration
- `CONTEXT7_ENABLED` - Enable Context7 integration (default: true)
- `CONTEXT7_USE_HTTP_ONLY` - Use HTTP-only mode (default: true)
- `CONTEXT7_CHECK_COMPATIBILITY` - Check API compatibility (default: false)

### Qdrant Configuration
- `QDRANT_URL` - Qdrant vector database URL
- `QDRANT_API_KEY` - Qdrant API key (optional)
- `QDRANT_COLLECTION_NAME` - Vector collection name (default: promptmcp_vectors)

## Architecture

- **Service-oriented** - Modular design with clear separation
- **Circuit breaker** - Robust error handling
- **Multi-level caching** - SQLite + LRU for performance
- **3 MCP tools** - enhance, todo, breakdown
- **ES2022 target** - Modern JavaScript features
- **Strict TypeScript** - Comprehensive type safety

## Performance Targets

- Response time: <2s cached, <5s uncached
- Cache hit rate: >80% Context7 responses
- Error rate: <1% enhancement operations
- Test coverage: >80% code coverage

## Troubleshooting

- **Port conflicts**: Change PORT in .env or use `--port` flag
- **Docker issues**: `docker-compose down && docker-compose up -d`
- **Cache issues**: Delete `data/*.db` files to reset cache
- **Type errors**: Run `npm run type-check` for detailed diagnostics
- **Test failures**: Use `npm run test:watch` for interactive debugging
