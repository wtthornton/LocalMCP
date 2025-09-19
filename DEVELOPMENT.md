# PromptMCP Development Guide

## Project Structure

```
src/
├── server.ts                    # Main MCP server entry point
├── index.ts                     # Alternative entry point
├── simple-index.ts              # Simple Docker entry point
├── tools/
│   └── enhance.ts               # Prompt enhancement tool
├── services/
│   ├── context7/                # Context7 integration services
│   ├── logger/                  # Logging service
│   └── vector/                  # Vector database service
├── config/
│   └── config.service.ts        # Configuration management
├── context/
│   └── context-pipeline.ts      # Context gathering pipeline
└── mcp/
    └── server.ts                # MCP protocol implementation
```

## Development Setup

### Prerequisites
- Node.js 22+
- Docker (optional)
- Context7 API key (optional but recommended)

### Installation
```bash
npm install
npm run build
```

### Development Mode
```bash
# Start in development mode with hot reload
npm run dev

# Run tests
npm test

# Run specific tests
npm run test:localmcp
npm run test:context7
```

## Core Components

### 1. MCP Server (`src/server.ts`)
- Implements the Model Context Protocol
- Handles tool registration and execution
- Provides the 4 core tools: analyze, create, fix, learn

### 2. Context Pipeline (`src/context/context-pipeline.ts`)
- Gathers project context from multiple sources
- Integrates Context7 for framework documentation
- Uses RAG for project-specific requirements
- Extracts code patterns and snippets

### 3. Services
- **Context7 Service**: Framework documentation caching
- **Logger Service**: Structured logging with different levels
- **Vector Service**: RAG storage and retrieval
- **Config Service**: Configuration management

### 4. Tools
- **Enhance Tool**: Prompt enhancement with project context
- Future: Analyze, Create, Fix, Learn tools

## Architecture Principles

### Vibe Coder Focus
- Simple setup (docker run and ready)
- Smart defaults (no configuration)
- Instant feedback
- Less Googling, fewer wrong turns
- Learning over time

### Technical Standards
- TypeScript for better DX
- Comprehensive error handling
- Detailed comments explaining vibe coder benefits
- Include Docker configuration
- Validate success metrics (≥70% first-pass, ≤2 retries)

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-tool

# Make changes
# Test locally
npm test

# Build and test
npm run build
npm run test:localmcp
```

### 2. Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:context7
npm run test:localmcp
npm run test:smoke

# Run with coverage
npm run test:coverage
```

### 3. Docker Development
```bash
# Build Docker image
docker build -t localmcp:dev .

# Run in development mode
docker run -it --rm -v $(pwd):/app localmcp:dev npm run dev

# Test Docker deployment
docker-compose up -d
```

## Configuration

### Environment Variables
```bash
# Context7 API key (optional but recommended)
CONTEXT7_API_KEY=your_key_here

# Vector database URL
QDRANT_URL=http://localhost:6333

# Log level
LOG_LEVEL=info

# Server port
PORT=3000
```

### Configuration Service
The `ConfigService` provides centralized configuration management:
- Environment variable loading
- Default value fallbacks
- Nested configuration support
- Type-safe configuration access

## Adding New Tools

### 1. Create Tool Class
```typescript
// src/tools/new-tool.ts
export class NewTool {
  private logger: Logger;
  private config: ConfigService;

  constructor() {
    this.logger = new Logger('NewTool');
    this.config = new ConfigService();
  }

  async execute(request: NewToolRequest): Promise<NewToolResponse> {
    // Implementation
  }
}
```

### 2. Register in MCP Server
```typescript
// src/server.ts
this.tools.set('localmcp.newtool', {
  name: 'localmcp.newtool',
  description: 'Description of what the tool does',
  inputSchema: {
    // JSON schema for input validation
  }
});
```

### 3. Add Tool Handler
```typescript
// src/server.ts
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'localmcp.newtool') {
    const tool = new NewTool();
    const result = await tool.execute(request.params.arguments);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
});
```

## Testing

### Test Structure
```
tests/
├── unit/                        # Unit tests
├── integration/                 # Integration tests
├── e2e/                        # End-to-end tests
└── fixtures/                   # Test data
```

### Writing Tests
```typescript
// tests/unit/tools/enhance.test.ts
import { describe, it, expect } from 'vitest';
import { EnhanceTool } from '../../src/tools/enhance.js';

describe('EnhanceTool', () => {
  it('should enhance prompt with context', async () => {
    const tool = new EnhanceTool();
    const result = await tool.enhance({
      prompt: 'Create a button',
      context: { framework: 'react' }
    });
    
    expect(result.enhanced_prompt).toContain('React');
  });
});
```

## Docker Development

### Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  localmcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CONTEXT7_API_KEY=${CONTEXT7_API_KEY}
    volumes:
      - ./data:/app/data
```

## Performance Optimization

### Caching Strategy
- Context7 responses cached in SQLite
- LRU cache for frequently accessed data
- Vector embeddings cached locally

### Memory Management
- Streaming responses for large data
- Garbage collection optimization
- Memory usage monitoring

### Response Times
- Target: <1s for enhanced prompts
- Context gathering: <500ms
- Tool execution: <300ms

## Debugging

### Logging
```typescript
// Use structured logging
this.logger.info('Tool executed', { 
  tool: 'localmcp.analyze',
  duration: 150,
  success: true 
});
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Run with debugging
node --inspect dist/server.js
```

### Common Issues
1. **Context7 API errors**: Check API key and network
2. **Vector DB issues**: Verify Qdrant connection
3. **MCP protocol errors**: Check JSON-RPC format
4. **Memory leaks**: Monitor memory usage patterns

## Deployment

### Production Build
```bash
npm run build
npm run test:smoke
docker build -t localmcp:latest .
```

### Health Checks
```bash
# Health endpoint
curl http://localhost:3000/health

# MCP server status
node test-mcp-direct.js
```

## Contributing

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Comprehensive error handling
- Detailed comments for vibe coder benefits

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with clear description
5. Ensure all tests pass

### Release Process
1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Build and test Docker image
5. Deploy to production

---

**Happy coding! Remember: Keep it simple for vibe coders! 🚀**
