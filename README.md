# PromptMCP

A focused MCP server for prompt enhancement - takes any user prompt and returns an enhanced prompt with perfect project context. PromptMCP provides exactly 4 simple tools: analyze, create, fix, learn.

## Core Mission

Create a focused MCP server that provides faster, more contextual AI coding assistance through:
- 4 simple tools: promptmcp.analyze, promptmcp.create, promptmcp.fix, promptmcp.learn
- Context7 caching for instant framework docs
- Project-aware RAG from docs/ADRs
- Learning from coding patterns
- Invisible dynamic pipeline processing

## Vibe Coder Principles

- Simple setup (docker run and ready)
- Smart defaults (no configuration)
- Instant feedback
- Less Googling, fewer wrong turns
- Learning over time

## Architecture

- Node.js 22 LTS + Docker
- SQLite + LRU cache (no Redis dependency)
- Qdrant vector DB for RAG
- Playwright as simple sidecar only
- MCP protocol (JSON RPC)

## Quick Start

### Prerequisites
- Node.js 22+
- Docker (optional but recommended)
- Cursor IDE

### Installation

```bash
# Clone and install
git clone https://github.com/wtthornton/PromptMCP.git
cd PromptMCP
npm install
npm run build
```

### Setup Cursor (Automated)

```bash
# Local installation
node setup-cursor.js

# Or Docker installation
node setup-cursor.js --docker
```

### Test PromptMCP

```bash
# Test all 4 tools
npm run test:mcp
```

### Start Server

```bash
# Local development
npm run dev

# Production
npm start

# Docker
docker-compose up -d
```

## The 4 Tools

### 1. `promptmcp.analyze`
Analyze code, architecture, or project structure with AI assistance.

```bash
# Analyze current project
promptmcp.analyze --target ./src --type architecture

# Analyze specific code
promptmcp.analyze --target "function validateUser(user) { return user && user.name; }" --type code
```

### 2. `promptmcp.create`
Create new code, files, or project components with context awareness.

```bash
# Create a React component
promptmcp.create --type component --name "LoginForm" --template react

# Create with dark theme
promptmcp.create --type component --name "Button" --template "dark theme React button"
```

### 3. `promptmcp.fix`
Fix bugs, issues, or improve existing code automatically.

```bash
# Fix TypeScript errors
promptmcp.fix --target "TypeScript error: Property 'name' does not exist on type 'User'" --issue "type mismatch"

# Fix with file context
promptmcp.fix --target ./src/user.ts --issue "ReferenceError: user is not defined"
```

### 4. `promptmcp.learn`
Learn from code patterns, best practices, or documentation.

```bash
# Learn from successful solution
promptmcp.learn --topic "user validation patterns" --level intermediate

# Learn project-specific patterns
promptmcp.learn --topic "authentication flow" --context "This solution works perfectly!"
```

## Configuration

Minimal configuration via environment variables:

```bash
# Context7 API key (optional but recommended)
CONTEXT7_API_KEY=your_key_here

# Vector database
QDRANT_URL=http://localhost:6333

# Logging
LOG_LEVEL=info
```

## Docker Setup

```bash
# Build and run
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f localmcp
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

## Success Metrics

- Week 1: Vibe coders can say "create me a dark theme Hello World" and get production-ready code
- Week 3: Reduces "Google time" by 80% through cached docs
- Week 6: Provides project-specific solutions 90% of the time
- Week 9: Learns developer's coding style and suggests accordingly
- Month 3: Fast startup (<15 min on new repo), ≥70% first-pass success rate, ≤2 retries median

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for vibe coders who want AI assistance without the complexity!**