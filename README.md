# LocalMCP

> **For Vibe Coders**: A local MCP server that makes your AI coding assistant smarter, faster, and more contextual with just 4 simple tools.

## What This Does

LocalMCP is designed for **"vibe coders"** - developers who want to focus on building features rather than learning every framework detail. It enhances your AI coding assistant (like Cursor) by providing:

- **4 simple tools** - `analyze`, `create`, `fix`, `learn` - that's it!
- **Instant access** to cached documentation (no more waiting for API calls)
- **Project-aware context** from your docs, ADRs, and design decisions  
- **Learning capabilities** that improve over time based on your coding patterns
- **Local-first approach** - everything runs in a Docker container on your machine

## Quick Start (Vibe Coder Friendly)

```bash
# 1. Clone and run (one command)
git clone https://github.com/wtthornton/LocalMCP.git
cd LocalMCP
docker-compose up -d

# 2. Connect Cursor to localhost:3000
# 3. Start coding - AI now knows your project!
```

## The 4 LocalMCP Tools

### `localmcp.analyze` - "Look at my project"
- Analyzes project structure, dependencies, and context
- Understands your tech stack and coding patterns
- Provides comprehensive project overview

### `localmcp.create` - "Make me something new"
- Creates code, components, or files based on your description
- Applies industry best practices automatically
- Generates production-ready code

### `localmcp.fix` - "Fix this problem"
- Fixes errors using cached docs and project context
- Learns from your project's patterns
- Provides contextual solutions with explanations

### `localmcp.learn` - "Remember this solution"
- Captures successful patterns and solutions
- Applies learned patterns to future problems
- Gets smarter as you code

## Example Queries That Work Better

- **Create**: "Create me a dark theme Hello World" → Gets production-ready HTML with proper contrast
- **Analyze**: "What's in this project?" → Gets comprehensive project overview
- **Fix**: "Fix this TypeScript error" → Gets contextual fix with explanation
- **Learn**: "Remember this solution" → Captures pattern for future use

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cursor AI     │◄──►│    LocalMCP      │◄──►│  Context7 Cache │
│   Assistant     │    │  (4 Simple Tools)│    │  (SQLite + LRU) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Vector DB       │
                       │  (Qdrant)        │
                       └──────────────────┘
```

**Behind the scenes**: Dynamic pipeline runs invisibly, providing smart context retrieval, intelligent processing, and pattern learning.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
LocalMCP/
├── src/                    # Source code
│   ├── tools/             # 4 MCP tools (analyze, create, fix, learn)
│   ├── services/          # Core services (cache, vector, playwright)
│   ├── pipeline/          # Dynamic pipeline processing (invisible)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── docs/                  # Documentation
│   ├── adr/              # Architecture Decision Records
│   ├── design/           # Design documents
│   └── api/              # API documentation
├── examples/             # Usage examples
├── scripts/              # Setup and maintenance scripts
└── docker-compose.yml    # Docker configuration
```

## Success Criteria

- **Week 1**: Vibe coders can say "create me a dark theme Hello World" and get production-ready code
- **Week 3**: Reduces "Google time" by 80% through cached docs  
- **Week 6**: Provides project-specific solutions 90% of the time
- **Week 9**: Learns developer's coding style and suggests accordingly
- **Month 3**: Fast startup (<15 min on new repo), ≥70% first-pass success rate, ≤2 retries median

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/wtthornton/LocalMCP/issues)
- 💬 [Discussions](https://github.com/wtthornton/LocalMCP/discussions)
