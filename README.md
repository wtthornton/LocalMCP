# PromptMCP

A focused MCP server for prompt enhancement - takes any user prompt and returns an enhanced prompt with perfect project context. PromptMCP provides exactly 4 simple tools: analyze, create, fix, learn.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)

## 🎯 Core Mission

Create a focused MCP server that provides faster, more contextual AI coding assistance through:
- **4 simple tools**: `promptmcp.analyze`, `promptmcp.create`, `promptmcp.fix`, `promptmcp.learn`
- **Context7 caching** for instant framework docs
- **Project-aware RAG** from docs/ADRs
- **Learning from coding patterns**
- **Invisible dynamic pipeline processing**

## 🌟 Vibe Coder Principles

- **Simple setup** (docker run and ready)
- **Smart defaults** (no configuration)
- **Instant feedback**
- **Less Googling, fewer wrong turns**
- **Learning over time**

## 🏗️ Architecture

- **Node.js 22 LTS** + Docker
- **SQLite + LRU cache** (no Redis dependency)
- **Qdrant vector DB** for RAG
- **Playwright** as simple sidecar only
- **MCP protocol** (JSON RPC)

## 🚀 Quick Start

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

# Test Context7 integration
npm run test:context7

# Smoke test
npm run test:smoke
```

### Start Server

```bash
# Local development
npm run dev

# Production
npm start

# Docker (recommended)
docker-compose up -d

# Check status
docker-compose ps
```

## 🛠️ The 4 Core Tools

### 1. `promptmcp.analyze`
Analyze code, architecture, or project structure with AI assistance.

```bash
# Analyze current project
promptmcp.analyze --target ./src --type architecture

# Analyze specific code
promptmcp.analyze --target "function validateUser(user) { return user && user.name; }" --type code
```

**Features:**
- Project structure analysis
- Dependency mapping
- Code quality assessment
- Architecture recommendations

### 2. `promptmcp.create`
Create new code, files, or project components with context awareness.

```bash
# Create a React component
promptmcp.create --type component --name "LoginForm" --template react

# Create with dark theme
promptmcp.create --type component --name "Button" --template "dark theme React button"
```

**Features:**
- Context-aware code generation
- Framework-specific templates
- Best practices integration
- Accessibility compliance

### 3. `promptmcp.fix`
Fix bugs, issues, or improve existing code automatically.

```bash
# Fix TypeScript errors
promptmcp.fix --target "TypeScript error: Property 'name' does not exist on type 'User'" --issue "type mismatch"

# Fix with file context
promptmcp.fix --target ./src/user.ts --issue "ReferenceError: user is not defined"
```

**Features:**
- Error detection and classification
- Intelligent fix suggestions
- Context-aware solutions
- Validation and testing

### 4. `promptmcp.learn`
Learn from code patterns, best practices, or documentation.

```bash
# Learn from successful solution
promptmcp.learn --topic "user validation patterns" --level intermediate

# Learn project-specific patterns
promptmcp.learn --topic "authentication flow" --context "This solution works perfectly!"
```

**Features:**
- Pattern recognition and capture
- Knowledge base building
- Project-specific learning
- Best practice recommendations

## ⚙️ Configuration

Minimal configuration via environment variables:

```bash
# Context7 API key (optional but recommended)
CONTEXT7_API_KEY=your_key_here

# Vector database
QDRANT_URL=http://localhost:6333

# Logging
LOG_LEVEL=info

# Server configuration
PROMPTMCP_PORT=3000
PROMPTMCP_NAME=promptmcp
```

### Environment Setup

```bash
# Copy environment template
cp env.example .env

# Edit configuration
nano .env
```

## 🐳 Docker Setup

### Quick Start with Docker

```bash
# Build and run
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f promptmcp

# Stop services
docker-compose down
```

### Docker Commands

```bash
# Build image
npm run docker:build

# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs
```

## 🔧 Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Development mode with hot reload
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Available Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:mcp` - Test MCP functionality
- `npm run test:context7` - Test Context7 integration
- `npm run test:smoke` - Run smoke tests
- `npm run lint` - Lint TypeScript files
- `npm run clean` - Clean build directory

## 📊 Project Status

### ✅ Completed Features
- **Phase 0-2**: Core MCP server with 4 tools, Context7 integration, dynamic pipeline
- **Phase 3-4**: Advanced features, monitoring, lessons learned system
- **Production Ready**: Docker deployment, health checks, comprehensive testing

### 🚧 In Progress
- **Phase 5**: Security hardening, offline resilience, advanced execution environments

### 🎯 Success Metrics

- **Week 1**: ✅ Vibe coders can say "create me a dark theme Hello World" and get production-ready code
- **Week 3**: ✅ Reduces "Google time" by 80% through cached docs
- **Week 6**: ✅ Provides project-specific solutions 90% of the time
- **Week 9**: ✅ Learns developer's coding style and suggests accordingly
- **Month 3**: 🚧 Fast startup (<15 min on new repo), ≥70% first-pass success rate, ≤2 retries median

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get running in 5 minutes
- **[Development Guide](DEVELOPMENT.md)** - Development setup and guidelines
- **[API Documentation](API.md)** - Complete API reference
- **[Implementation Tasks](IMPLEMENTATION_TASK_LIST.md)** - Current development roadmap
- **[Cursor Setup](CURSOR_SETUP.md)** - IDE integration guide

## 🤝 Contributing

We welcome contributions! Please see our development guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

### Development Workflow

```bash
# Clone your fork
git clone https://github.com/your-username/PromptMCP.git
cd PromptMCP

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run build
npm test

# Commit and push
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

## 🐛 Troubleshooting

### Common Issues

**Docker container won't start:**
```bash
# Check port availability
netstat -an | grep 3000

# Check Docker logs
docker-compose logs promptmcp
```

**Context7 integration issues:**
```bash
# Test Context7 connection
npm run test:context7

# Check API key
echo $CONTEXT7_API_KEY
```

**MCP connection problems:**
```bash
# Test MCP functionality
npm run test:mcp

# Check server status
curl http://localhost:3000/health
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the **vibe coder** community
- Powered by **Context7** for enhanced documentation
- Integrated with **Cursor IDE** for seamless development
- Uses **Model Context Protocol** for AI assistant integration

---

**Made with ❤️ for vibe coders who want AI assistance without the complexity!**

*PromptMCP - Your AI coding assistant that understands your project context and learns from your patterns.*