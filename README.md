# PromptMCP

A focused MCP server for prompt enhancement and AI-powered task breakdown - takes any user prompt and returns enhanced prompts with perfect project context or breaks down complex requests into structured tasks. PromptMCP provides 3 powerful tools: `promptmcp.enhance`, `promptmcp.todo`, and `promptmcp.breakdown` with intelligent context gathering and AI-powered task decomposition.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![Context7](https://img.shields.io/badge/Context7-Enhanced-00D4AA)](https://context7.com)
[![Tests](https://img.shields.io/badge/Tests-23%2F23%20Passing-brightgreen)](https://github.com/wtthornton/PromptMCP)

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

## ⚙️ Configuration

PromptMCP uses a single configuration file (`mcp-config.json`) as the source of truth for all API keys and settings. This approach provides:

- **Single source of truth** - All configuration in one place
- **No environment variables needed** - Keys are stored directly in the config
- **Easy key management** - Developers can provide their own keys
- **MCP protocol compliance** - Follows standard MCP configuration patterns

### Configuration File Structure

```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "docker",
      "args": ["exec", "-i", "promptmcp-server", "node", "dist/mcp/server.js"],
      "env": {
        "CONTEXT7_API_KEY": "your_context7_api_key_here",
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "OPENAI_PROJECT_ID": "your_openai_project_id_here"
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

3. **The system will automatically use these keys** - no environment variables needed!

### Security Notes

- **Never commit `mcp-config.json`** - It's already in `.gitignore`
- **Use the example file** - `mcp-config.json.example` is safe to commit
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
- **Testing Infrastructure**: Comprehensive test suite with 23/23 passing tests (100% success rate)
- **Context7 Simplification**: Streamlined Context7 integration with SimpleContext7Client
- **Issue Resolution**: Identified and resolved 10+ codebase issues during testing implementation

### 🎯 Recent Improvements (v1.2.0)
- **Testing Infrastructure**: Comprehensive test suite with 23/23 passing tests (100% success rate)
- **Context7 Simplification**: Streamlined Context7 integration with SimpleContext7Client
- **Issue Resolution**: Identified and resolved 10+ codebase issues during testing implementation
- **Code Quality**: Fixed method signature mismatches and error handling inconsistencies
- **Documentation**: Updated all documentation to reflect current codebase state
- **Test Coverage**: Improved from ~15% to estimated 40%+ code coverage
- **Test Artifacts Organization**: Organized test results, reports, and logs in `test-artifacts/` directory
- **Advanced Metrics**: Implemented Phase 2 metrics including content quality, system performance, and reliability
- **Automated Cleanup**: Added retention policies and cleanup scripts for test artifacts

### 🚧 In Progress
- **Tool Testing**: Adding happy path tests for main tools (EnhancedContext7EnhanceTool, HealthTool)
- **Integration Testing**: MCP Server and Context7 integration tests
- **Test Quality**: Shared test utilities and performance tests

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
