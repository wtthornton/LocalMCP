# PromptMCP

A focused MCP server for prompt enhancement and AI-powered task breakdown - takes any user prompt and returns enhanced prompts with perfect project context or breaks down complex requests into structured tasks. PromptMCP provides 3 powerful tools: `promptmcp.enhance`, `promptmcp.todo`, and `promptmcp.breakdown` with intelligent context gathering and AI-powered task decomposition.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![Context7](https://img.shields.io/badge/Context7-Enhanced-00D4AA)](https://context7.com)

## 🎯 Core Mission

Create a focused MCP server that provides faster, more contextual AI coding assistance through:
- **3 powerful tools**: 
  - `promptmcp.enhance` - Intelligent prompt enhancement with perfect project context
  - `promptmcp.todo` - Todo management with subtasks and dependencies
  - `promptmcp.breakdown` - AI-powered task breakdown with Context7 integration
- **Context7-Only Architecture** - Single source of truth for all framework documentation and best practices
- **Dynamic Framework Detection** - Universal detection using patterns, AI, and project context
- **Advanced Content Processing** - Intelligent filtering, preprocessing, and quality optimization
- **Smart Caching** - Multi-level caching with SQLite and LRU optimization for Context7 content
- **Performance Optimization** - Parallel processing and response time optimization
- **Circuit breaker patterns** for robust error handling

## 🌟 Vibe Coder Principles

- **Simple setup** (docker run and ready)
- **Smart defaults** (no configuration)
- **Instant feedback**
- **Less Googling, fewer wrong turns**
- **Learning over time**

## 🏗️ Architecture

- **Node.js 22 LTS** + Docker
- **Context7-Only Integration** - Single source of truth for all content
- **SQLite + LRU cache** - Multi-level caching for Context7 content
- **Advanced Content Processing** - Preprocessing, filtering, and quality optimization
- **MCP protocol** (JSON RPC)
- **Performance Optimized** - Parallel processing and intelligent token allocation

## 📁 Project Structure

The project is organized for maximum maintainability and clarity:

```
PromptMCP/
├── config/           # Configuration files
│   ├── env.example   # Environment template
│   ├── nginx.conf    # Nginx configuration
│   └── prometheus.yml # Monitoring configuration
├── data/            # Generated data
│   ├── benchmarks/  # Benchmark results and analysis
│   └── analysis/    # Performance analysis files
├── demo/            # Demo files
│   └── html/        # HTML demonstration files
├── docker/          # Docker configuration
│   ├── docker-compose*.yml # Docker Compose files
│   └── Dockerfile*  # Docker build files
├── docs/            # Documentation
│   └── archive/     # Archived documentation
├── scripts/         # Setup and utility scripts
│   ├── setup-cursor.js # Cursor IDE setup
│   └── add-promptmcp.* # Installation scripts
├── test/            # Test files and utilities
├── src/             # Source code
└── [core files]     # Essential project files
```

### Key Directories

- **`config/`** - All configuration files (environment, nginx, monitoring)
- **`data/`** - Generated data organized by type (benchmarks, analysis)
- **`docker/`** - Complete Docker setup with multiple configurations
- **`scripts/`** - Setup, installation, and utility scripts
- **`test/`** - All test files, debug utilities, and test data
- **`src/`** - Clean source code with no clutter

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
node scripts/setup-cursor.js

# Or Docker installation
node scripts/setup-cursor.js --docker
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

## 🛠️ The Core Tools

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

### `promptmcp.todo`
Comprehensive todo management with subtasks, dependencies, and project organization.

```bash
# Create a todo
promptmcp.todo --action create --title "Implement user authentication" --priority high

# List todos
promptmcp.todo --action list --projectId my-project

# Update todo status
promptmcp.todo --action update --id 1 --status in_progress

# Create subtasks
promptmcp.todo --action create --title "Setup database schema" --parentId 1
```

**Advanced Features:**
- **Hierarchical Tasks**: Subtasks and parent-child relationships
- **Dependency Tracking**: Task dependencies and blocking relationships
- **Project Organization**: Multi-project todo management
- **Status Management**: Pending, in-progress, completed, cancelled states
- **Priority Levels**: Low, medium, high, critical priority classification
- **Category Organization**: Feature, bug, refactor, testing, documentation categories

### `promptmcp.breakdown`
AI-powered task breakdown using OpenAI GPT-4 and Context7 documentation for intelligent project decomposition.

```bash
# Break down a complex request
promptmcp.breakdown --prompt "Build a full-stack e-commerce application with React and Node.js"

# Break down with specific options
promptmcp.breakdown --prompt "Create a blog platform" --maxTasks 5 --includeSubtasks true --includeDependencies true
```

**Advanced Features:**
- **AI-Powered Breakdown**: Uses OpenAI GPT-4 for intelligent task decomposition
- **Context7 Integration**: Leverages framework documentation for accurate breakdowns
- **Framework Detection**: Automatically detects technologies from prompts
- **Structured Output**: Main tasks, subtasks, and dependencies with time estimates
- **Priority Assignment**: Intelligent priority and category assignment
- **Dependency Mapping**: Automatic dependency detection between tasks

## ⚙️ Configuration

Minimal configuration via environment variables:

```bash
# Context7 API key (optional but recommended)
CONTEXT7_API_KEY=your_key_here

# OpenAI Configuration (required for breakdown tool)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_PROJECT_ID=your_openai_project_id_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.3

# Vector database
QDRANT_URL=http://localhost:6333

# Framework Detection
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
cp config/env.example .env

# Edit configuration
nano .env
```

## 🐳 Docker Setup

### Quick Start with Docker

```bash
# Build and run
docker-compose -f vibe/docker-compose.yml up -d

# Check status
docker-compose -f vibe/docker-compose.yml ps

# View logs
docker-compose -f vibe/docker-compose.yml logs -f vibe-server

# Stop services
docker-compose -f vibe/docker-compose.yml down
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

### Docker Configuration Files

The project includes multiple Docker configurations for different use cases:

- `vibe/docker-compose.yml` - Main production configuration
- `vibe/docker-compose.dev.yml` - Development configuration
- `vibe/docker-compose.mcp.yml` - MCP-specific configuration
- `vibe/docker-compose.simple.yml` - Simplified configuration
- `vibe/Dockerfile` - Main production Dockerfile
- `vibe/Dockerfile.mcp` - MCP-specific Dockerfile
- `vibe/Dockerfile.simple` - Simplified Dockerfile

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
- **Core MCP Server**: Three powerful tools with MCP protocol compliance
  - `promptmcp.enhance` - Intelligent prompt enhancement
  - `promptmcp.todo` - Comprehensive todo management
  - `promptmcp.breakdown` - AI-powered task breakdown
- **Dynamic Framework Detection**: Universal detection using patterns, AI, and project context
- **Context7 Integration**: Real-time framework documentation with proper MCP workflow
- **Context Pipeline**: Multi-source context gathering with intelligent prioritization
- **Docker Deployment**: Complete containerization with health checks and monitoring
- **Smart Caching Layer**: SQLite with WAL mode optimization for Context7 responses
- **AI-Powered Task Breakdown**: OpenAI GPT-4 integration for intelligent task decomposition
- **Todo Management System**: Hierarchical tasks with subtasks, dependencies, and project organization
- **Database Schema**: SQLite with migrations for todos, subtasks, dependencies, and task plans
- **Performance Optimization**: Response time improvements and memory management
- **Code Quality**: Clean, maintainable codebase with organized structure
- **Project Organization**: Professional directory structure with logical file grouping

### 🎯 Recent Improvements (v1.1.0)
- **Code Cleanup**: Removed 557+ debug logging instances, standardized logging
- **File Organization**: Organized 100+ files into logical directory structure
- **Documentation Consolidation**: Archived duplicate files, single source of truth
- **Docker Organization**: Consolidated 6 Docker configuration files
- **Benchmark Organization**: Organized 50+ benchmark and analysis files
- **Script Organization**: Moved setup and utility scripts to dedicated directory

### 🚧 In Progress
- **Enhanced Context Intelligence**: Advanced context prioritization and quality assessment
- **Circuit Breaker Implementation**: Robust error handling with graceful degradation

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
- **[Cleanup Summary](docs/CLEANUP_SUMMARY.md)** - Recent project organization and cleanup work
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
docker-compose logs vibe-server
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