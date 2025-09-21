# PromptMCP

A focused MCP server for prompt enhancement - takes any user prompt and returns an enhanced prompt with perfect project context. PromptMCP provides exactly 1 powerful tool: `promptmcp.enhance` with intelligent context gathering and advanced prompt optimization.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![Context7](https://img.shields.io/badge/Context7-Enhanced-00D4AA)](https://context7.com)

## 🎯 Core Mission

Create a focused MCP server that provides faster, more contextual AI coding assistance through:
- **1 powerful tool**: `promptmcp.enhance` - Intelligent prompt enhancement with perfect project context
- **Dynamic Framework Detection** - Universal detection using patterns, AI, and project context
- **Context7 integration** for real-time framework documentation and best practices
- **Advanced RAG** from project docs, ADRs, and coding patterns
- **Intelligent context prioritization** and quality assessment
- **Smart caching** with SQLite and LRU optimization
- **Circuit breaker patterns** for robust error handling

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
# Test the enhance tool
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

## 🛠️ The Core Tool

### `promptmcp.enhance`
Intelligent prompt enhancement with perfect project context using advanced Context7 integration, smart RAG, and intelligent context prioritization.

```bash
# Enhance a simple prompt
promptmcp.enhance --prompt "Create a login form"

# Enhance with specific context
promptmcp.enhance --prompt "Create a login form" --context framework=react --context style=modern

# Enhance with file context
promptmcp.enhance --prompt "Fix this component" --context file=./src/components/LoginForm.tsx
```

**Advanced Features:**
- **Dynamic Framework Detection**: Universal detection using patterns, AI, and project context
- **Intelligent Context Gathering**: 4+ context sources with smart prioritization
- **Context7 Integration**: Real-time framework docs with two-step workflow (resolve → get docs)
- **Smart Caching**: SQLite with WAL mode + LRU cache for optimal performance
- **Context Quality Assessment**: Relevance scoring and validation for all context sources
- **Circuit Breaker Pattern**: Robust error handling with graceful degradation
- **Project-Aware RAG**: Semantic search through project docs and coding patterns
- **Framework-Specific Enhancement**: Tailored prompts based on detected tech stack
- **Style Preference Application**: Context-aware styling and formatting

## ⚙️ Configuration

Minimal configuration via environment variables:

```bash
# Context7 API key (optional but recommended)
CONTEXT7_API_KEY=your_key_here

# Vector database
QDRANT_URL=http://localhost:6333

# Framework Detection (new!)
FRAMEWORK_DETECTION_ENABLED=true
FRAMEWORK_DETECTION_CONFIDENCE_THRESHOLD=0.3
FRAMEWORK_DETECTION_CACHE_ENABLED=true

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
- **Core MCP Server**: Single `promptmcp.enhance` tool with MCP protocol compliance
- **Dynamic Framework Detection**: Universal detection using patterns, AI, and project context
- **Context7 Integration**: Real-time framework documentation with proper MCP workflow
- **Context Pipeline**: Multi-source context gathering with intelligent prioritization
- **Docker Deployment**: Complete containerization with health checks and monitoring
- **Comprehensive Analysis**: Detailed enhance tool improvement roadmap with 67 tasks

### 🚧 In Progress
- **Enhanced Context Intelligence**: Advanced context prioritization and quality assessment
- **Smart Caching Layer**: SQLite with WAL mode optimization for Context7 responses
- **Circuit Breaker Implementation**: Robust error handling with graceful degradation
- **Performance Optimization**: Response time improvements and memory management

### 🎯 Success Metrics

- **Response Time**: <2s for cached responses, <5s for uncached
- **Framework Detection**: ≥90% accuracy for clear prompts, <10ms detection time
- **Context Quality**: >90% relevance score for context sources
- **Enhancement Quality**: >85% user satisfaction with enhanced prompts
- **Error Rate**: <1% for enhancement operations
- **Cache Hit Rate**: >80% for Context7 responses, ≥70% for framework detection
- **Test Coverage**: >90% for enhance tool functionality

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get running in 5 minutes
- **[Development Guide](DEVELOPMENT.md)** - Development setup and guidelines
- **[API Documentation](API.md)** - Complete API reference
- **[Framework Detection Guide](docs/framework-detection-guide.md)** - Dynamic framework detection system
- **[Context7 Integration Guide](docs/context7-integration-guide.md)** - Context7 integration patterns
- **[Implementation Tasks](IMPLEMENTATION_TASK_LIST.md)** - Current development roadmap
- **[Cursor Setup](CURSOR_SETUP.md)** - IDE integration guide
- **[Context7 Integration](docs/context7-integration-status.md)** - Context7 MCP integration status
- **[Best Practices Analysis](PROMPTMCP_BEST_PRACTICES_TASK_LIST.md)** - Comprehensive improvement roadmap

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

## 🚀 Recent Improvements

### **Dynamic Framework Detection System (January 2025)**
- **Universal Framework Detection**: Works with any Context7 library using patterns, AI, and project context
- **Zero Hardcoding**: No hardcoded framework mappings - completely dynamic
- **Multi-Source Detection**: Pattern matching, AI suggestions, and project context analysis
- **Intelligent Caching**: Reduces token costs with smart Context7 library caching
- **High Performance**: <10ms detection time with parallel processing

### **Comprehensive Enhance Tool Analysis (January 2025)**
- **67 Detailed Improvement Tasks**: Complete roadmap for enhance tool optimization
- **Context7 Best Practices Integration**: Two-step workflow, SQLite caching, circuit breaker patterns
- **Advanced Context Intelligence**: Smart prioritization, quality assessment, and validation
- **Performance Optimization**: Response time improvements and memory management
- **Robust Error Handling**: Circuit breaker patterns with graceful degradation

### **Key Technical Enhancements**
- **Dynamic Framework Detection**: Universal detection using patterns, AI, and project context
- **Intelligent Context Gathering**: 4+ context sources with smart prioritization
- **Context7 MCP Integration**: Real-time framework docs with proper MCP protocol
- **Smart Caching**: SQLite with WAL mode + LRU cache for optimal performance
- **Quality Assessment**: Relevance scoring and validation for all context sources
- **Error Recovery**: Circuit breaker patterns with fallback strategies

## 🙏 Acknowledgments

- Built for the **vibe coder** community
- Powered by **Context7** for enhanced documentation and best practices
- Integrated with **Cursor IDE** for seamless development
- Uses **Model Context Protocol** for AI assistant integration
- Enhanced with **comprehensive analysis** and improvement roadmap

---

**Made with ❤️ for vibe coders who want AI assistance without the complexity!**

*PromptMCP - Your intelligent AI coding assistant that understands your project context, learns from your patterns, and enhances your prompts with perfect context every time.*