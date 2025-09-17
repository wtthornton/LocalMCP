# Personal MCP Gateway

> **For Vibe Coders**: A local Docker container that makes your AI coding assistant smarter, faster, and more contextual.

## What This Does

The Personal MCP Gateway is designed for **"vibe coders"** - developers who want to focus on building features rather than learning every framework detail. It enhances your AI coding assistant (like Cursor) by providing:

- **Instant access** to cached documentation (no more waiting for API calls)
- **Project-aware context** from your docs, ADRs, and design decisions  
- **Learning capabilities** that improve over time based on your coding patterns
- **Local-first approach** - everything runs in a Docker container on your machine

## Quick Start (Vibe Coder Friendly)

```bash
# 1. Clone and run (one command)
git clone https://github.com/your-org/personal-mcp-gateway.git
cd personal-mcp-gateway
docker-compose up -d

# 2. Connect Cursor to localhost:3000
# 3. Start coding - AI now knows your project!
```

## What Makes This Different

- **No Configuration**: Works out of the box with smart defaults
- **Project Awareness**: AI understands your specific codebase, not just generic patterns
- **Learning System**: Gets better as you use it, no manual tuning required
- **Local First**: Everything runs on your machine, no external dependencies during coding
- **Instant Context**: No waiting for API calls or searching documentation

## Example Queries That Work Better

- "How do I add auth to this Next.js app?" (gets project-specific guidance)
- "Fix this build error" (AI reads your config and suggests fixes)
- "What's the best way to handle state here?" (considers your existing patterns)

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cursor AI     │◄──►│  MCP Gateway     │◄──►│  Context7 Cache │
│   Assistant     │    │  (This Project)  │    │  (SQLite + LRU) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Vector DB       │
                       │  (Qdrant)        │
                       └──────────────────┘
```

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
personal-mcp-gateway/
├── src/                    # Source code
│   ├── tools/             # MCP tools (repo, context7, docs, etc.)
│   ├── services/          # Core services (cache, vector, playwright)
│   ├── pipeline/          # Dynamic pipeline processing
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

- **Week 1**: Can answer "how do I fix this build error?" without developer needing to research
- **Week 3**: Reduces "Google time" by 80% through cached docs  
- **Week 6**: Provides project-specific solutions 90% of the time
- **Week 9**: Learns developer's coding style and suggests accordingly
- **Month 3**: Fast startup (<15 min on new repo), ≥70% first-pass fix rate, ≤2 retries median

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/your-org/personal-mcp-gateway/issues)
- 💬 [Discussions](https://github.com/your-org/personal-mcp-gateway/discussions)
