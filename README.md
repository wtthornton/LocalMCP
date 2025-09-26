# PromptMCP

A focused MCP server for prompt enhancement and AI-powered task breakdown - takes any user prompt and returns enhanced prompts with perfect project context or breaks down complex requests into structured tasks. PromptMCP provides 3 powerful tools: `promptmcp.enhance`, `promptmcp.todo`, and `promptmcp.breakdown` with intelligent context gathering and AI-powered task decomposition.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![Context7](https://img.shields.io/badge/Context7-Enhanced-00D4AA)](https://context7.com)
[![Tests](https://img.shields.io/badge/Tests-23%2F23%20Passing-brightgreen)](https://github.com/wtthornton/PromptMCP)
[![Version](https://img.shields.io/badge/Version-1.0.2-blue)](https://github.com/wtthornton/PromptMCP)

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

# E2E tests with Docker
npm run test:e2e

# Generate HTML reports
npm run report:generate

# Run tests and generate reports
npm run test:and:report

# Clean up old test artifacts
npm run test:cleanup

# Smoke test
npm run test:smoke
```

## ⚠️ Important: Never Use `docker exec`

**CRITICAL**: Never use `docker exec` commands in this project. The production deployment uses both HTTP and MCP servers running in the same container. Use the HTTP server (port 3001) for testing and integration.

**❌ Wrong:**
```bash
docker exec -i promptmcp-server node dist/mcp/server.js
```

**✅ Correct:**
```bash
curl -X POST -H "Content-Type: application/json" http://localhost:3001/enhance
```

**Why?** The MCP server runs in stdio mode and can only handle one connection at a time. The HTTP server is designed for multiple connections and testing.

## ⚙️ Configuration

PromptMCP uses a hybrid configuration approach that combines MCP configuration files with environment variables for maximum flexibility:

- **Primary Configuration**: `mcp-config.json` for MCP server setup and API keys
- **Environment Variables**: For runtime configuration and overrides
- **Smart Fallbacks**: Automatic fallback between config sources
- **MCP Protocol Compliance**: Follows standard MCP configuration patterns

### Configuration File Structure

```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "CONTEXT7_API_KEY": "your_context7_api_key_here",
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "OPENAI_PROJECT_ID": "your_openai_project_id_here",
        "CONTEXT7_DEBUG": "false",
        "ENHANCE_DEBUG": "false"
      }
    }
  }
}
```

### Setting Up Your Keys

1. **Copy the configuration template:**
   ```bash
   cp mcp-config.json.example mcp-config.json
   ```

2. **Add your API keys to `mcp-config.json`:**
   - Get your Context7 API key from [context7.com](https://context7.com)
   - Get your OpenAI API key from [platform.openai.com](https://platform.openai.com)
   - Replace the placeholder values in the `env` section

3. **Optional: Set environment variables for overrides:**
   ```bash
   export CONTEXT7_API_KEY="your_key_here"
   export OPENAI_API_KEY="your_key_here"
   export OPENAI_PROJECT_ID="your_project_id_here"
   ```

### Security Notes

- **Never commit `mcp-config.json`** - It's already in `.gitignore`
- **Use the example file** - `mcp-config.json.example` is safe to commit
- **Environment variables take precedence** - Can override config file values
- **Rotate keys regularly** - Update keys in the config file as needed

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

**Usage in Cursor:**
```
@promptmcp.enhance Create a login form with React and dark theme
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
- **AI Enhancement**: Optional AI-powered prompt improvement with quality scoring
- **Task Breakdown Integration**: Automatic task decomposition for complex requests

### `promptmcp.todo`
Comprehensive todo management with subtasks, dependencies, and project organization.

**Usage in Cursor:**
```
@promptmcp.todo create "Implement user authentication" --priority high --projectId my-project
@promptmcp.todo list --projectId my-project
@promptmcp.todo update --id 1 --status in_progress
```

**Advanced Features:**
- **Hierarchical Tasks**: Subtasks and parent-child relationships
- **Dependency Tracking**: Task dependencies and blocking relationships
- **Project Organization**: Multi-project todo management
- **Status Management**: Pending, in-progress, completed, cancelled states
- **Priority Levels**: Low, medium, high, critical priority classification
- **Category Organization**: Feature, bug, refactor, testing, documentation categories
- **Smart Parsing**: Automatic extraction of priority, category, and tags from natural language
- **Analytics**: Comprehensive project analytics and progress tracking

### `promptmcp.health`
System health monitoring and diagnostics for all PromptMCP services.

**Usage in Cursor:**
```
@promptmcp.health
```

**Features:**
- **Service Status**: Monitor all PromptMCP services and dependencies
- **Performance Metrics**: Response times, cache hit rates, and success rates
- **Error Tracking**: Comprehensive error reporting and diagnostics
- **Configuration Validation**: Verify API keys and service configurations
- **System Resources**: Memory usage, database status, and resource monitoring

## 📊 Project Status

### ✅ Completed Features
- **Core MCP Server**: Three powerful tools with MCP protocol compliance
  - `promptmcp.enhance` - Intelligent prompt enhancement with Context7 integration
  - `promptmcp.todo` - Comprehensive todo management with hierarchical tasks
  - `promptmcp.health` - System health monitoring and diagnostics
- **Dynamic Framework Detection**: Universal detection using patterns, AI, and project context
- **Context7 Integration**: Real-time framework documentation with proper MCP workflow
- **Context Pipeline**: Multi-source context gathering with intelligent prioritization
- **Docker Deployment**: Complete containerization with health checks and monitoring
- **Smart Caching Layer**: SQLite with WAL mode optimization for Context7 responses
- **AI-Powered Enhancement**: OpenAI GPT-4o integration for intelligent prompt improvement
- **Todo Management System**: Hierarchical tasks with subtasks, dependencies, and project organization
- **Database Schema**: SQLite with migrations for todos, subtasks, dependencies, and task plans
- **Performance Optimization**: Response time improvements and memory management
- **Code Quality**: Clean, maintainable codebase with organized structure
- **Project Organization**: Professional directory structure with logical file grouping
- **Testing Infrastructure**: Comprehensive test suite with 23/23 passing tests (100% success rate)
- **Context7 Simplification**: Streamlined Context7 integration with SimpleContext7Client
- **Issue Resolution**: Identified and resolved 10+ codebase issues during testing implementation

### 🎯 Recent Improvements (v1.0.2)
- **Testing Infrastructure**: Comprehensive test suite with 23/23 passing tests (100% success rate)
- **Context7 Simplification**: Streamlined Context7 integration with SimpleContext7Client
- **Issue Resolution**: Identified and resolved 10+ codebase issues during testing implementation
- **Code Quality**: Fixed method signature mismatches and error handling inconsistencies
- **Documentation**: Updated all documentation to reflect current codebase state
- **Test Coverage**: Improved from ~15% to estimated 40%+ code coverage
- **Test Artifacts Organization**: Organized test results, reports, and logs in `test-artifacts/` directory
- **Advanced Metrics**: Implemented Phase 2 metrics including content quality, system performance, and reliability
- **Automated Cleanup**: Added retention policies and cleanup scripts for test artifacts
- **Docker Configuration**: Updated Docker compose configuration with proper environment variables
- **Enhanced Error Handling**: Improved error handling in Context7 integration and framework detection
- **AI Enhancement Integration**: Seamless integration of AI-powered prompt enhancement
- **Health Monitoring**: Comprehensive system health monitoring and diagnostics

### 🚧 In Progress
- **Tool Testing**: Adding happy path tests for main tools (EnhancedContext7EnhanceTool, HealthTool)
- **Integration Testing**: MCP Server and Context7 integration tests
- **Test Quality**: Shared test utilities and performance tests
- **Documentation Updates**: Comprehensive documentation review and updates

### 🎯 Success Metrics

- **Response Time**: <2s for cached responses, <5s for uncached
- **Framework Detection**: ≥90% accuracy for clear prompts, <10ms detection time
- **Context Quality**: >90% relevance score for context sources
- **Enhancement Quality**: >85% user satisfaction with enhanced prompts
- **Error Rate**: <1% for enhancement operations
- **Cache Hit Rate**: >80% for Context7 responses, ≥70% for framework detection
- **Test Coverage**: >40% overall (improved from ~15%), 100% for core services

## 📁 Test Artifacts Organization

All testing artifacts are organized in the `test-artifacts/` directory to keep the project clean:

```
test-artifacts/
├── results/           # JSON test result files
│   ├── e2e/          # End-to-end test results
│   ├── unit/         # Unit test results
│   └── integration/  # Integration test results
├── reports/           # HTML test reports
│   ├── e2e/          # E2E test reports
│   ├── quality/      # Quality benchmark reports
│   └── architecture/ # Architecture test reports
├── logs/             # Test execution logs
└── screenshots/      # Playwright screenshots
```

**Features:**
- ✅ **Automatic Organization** - Test results saved to appropriate subdirectories
- ✅ **Retention Policies** - Automatic cleanup of old artifacts
- ✅ **Version Control Friendly** - All artifacts ignored by git
- ✅ **Easy Navigation** - Clear directory structure by test type

## 📚 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get running in 5 minutes
- **[Development Guide](DEVELOPMENT.md)** - Development setup and guidelines
- **[API Documentation](API.md)** - Complete API reference
- **[Testing Happy Path Plan](TESTING_HAPPY_PATH_PLAN_ENHANCED.md)** - Testing implementation roadmap
- **[Codebase Issues](CODEBASE_ISSUES_DISCOVERED.md)** - Issues discovered during testing implementation
- **[Context7 Integration](CONTEXT7_SIMPLIFICATION_TASK_LIST.md)** - Context7 simplification status
- **[Cursor Setup](docs/CURSOR_SETUP.md)** - IDE integration guide

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

## 🙏 Acknowledgments

- Built for the **vibe coder** community
- Powered by **Context7** for enhanced documentation and best practices
- Integrated with **Cursor IDE** for seamless development
- Uses **Model Context Protocol** for AI assistant integration
- Enhanced with **comprehensive analysis** and improvement roadmap

---

**Made with ❤️ for vibe coders who want AI assistance without the complexity!**

*PromptMCP - Your intelligent AI coding assistant that understands your project context, learns from your patterns, and enhances your prompts with perfect context every time.*
