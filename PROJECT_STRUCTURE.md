# Project Structure Overview

This document provides a comprehensive overview of the Personal MCP Gateway project structure, designed for "vibe coders" who want to understand and contribute to the project quickly.

## 🏗️ Architecture Overview

The project follows a **hybrid architecture** combining:
- **Feature-based organization** for MCP tools
- **Layer-based organization** for core services  
- **Domain-driven design** principles for business logic

## 📁 Directory Structure

```
personal-mcp-gateway/
├── 📁 src/                          # Source code
│   ├── 📁 tools/                    # MCP tools (feature-based)
│   │   ├── 📁 repo/                 # Repository introspection
│   │   ├── 📁 context7/             # Context7 integration
│   │   ├── 📁 docs/                 # Documentation RAG
│   │   ├── 📁 env/                  # Environment validation
│   │   ├── 📁 pipeline/             # Pipeline execution
│   │   ├── 📁 setup/                # Project setup
│   │   └── 📁 learn/                # Lessons learned
│   ├── 📁 services/                 # Core services (layer-based)
│   │   ├── 📁 cache/                # Caching service
│   │   ├── 📁 vector/               # Vector database
│   │   ├── 📁 playwright/           # Playwright integration
│   │   └── 📁 logger/               # Logging service
│   ├── 📁 pipeline/                 # Dynamic pipeline processing
│   ├── 📁 types/                    # TypeScript definitions
│   ├── 📁 utils/                    # Utility functions
│   ├── 📁 config/                   # Configuration management
│   └── 📄 index.ts                  # Main entry point
├── 📁 docs/                         # Documentation
│   ├── 📁 adr/                      # Architecture Decision Records
│   ├── 📁 design/                   # Design documents
│   └── 📁 api/                      # API documentation
├── 📁 examples/                     # Usage examples
│   ├── 📁 basic/                    # Basic examples
│   └── 📁 advanced/                 # Advanced examples
├── 📁 scripts/                      # Setup and maintenance
│   ├── 📁 setup/                    # Installation scripts
│   ├── 📁 deploy/                   # Deployment scripts
│   └── 📁 maintenance/              # Maintenance scripts
├── 📁 .github/                      # GitHub configuration
│   ├── 📁 workflows/                # CI/CD workflows
│   └── 📁 ISSUE_TEMPLATE/           # Issue templates
├── 📄 package.json                  # Node.js dependencies
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 jest.config.js                # Jest testing configuration
├── 📄 .eslintrc.js                  # ESLint configuration
├── 📄 Dockerfile                    # Docker build configuration
├── 📄 docker-compose.yml            # Docker services (Qdrant + Nginx + Monitoring)
├── 📄 .gitignore                    # Git ignore rules
├── 📄 env.example                   # Environment variables template
├── 📄 README.md                     # Project overview
├── 📄 CONTRIBUTING.md               # Contribution guidelines
└── 📄 LICENSE                       # MIT License
```

## 🎯 Key Design Principles

### 1. Vibe Coder Friendly
- **Clear naming**: Directories and files have intuitive names
- **Smart defaults**: Configuration works out of the box
- **Helpful comments**: Code explains the "why" not just the "what"
- **Progressive complexity**: Simple to start, powerful when needed

### 2. MCP Protocol Compliance
- **Standard tool structure**: All tools follow MCP conventions
- **Type safety**: Full TypeScript support for all interfaces
- **Error handling**: Comprehensive error handling and reporting
- **Documentation**: Clear API documentation for all tools

### 3. Docker-First Deployment
- **Multi-stage builds**: Optimized for production
- **Service isolation**: Each component runs in its own container
- **Health checks**: Built-in monitoring and recovery
- **Volume management**: Persistent data and cache storage

## 🔧 Core Components

### MCP Tools (`src/tools/`)
Each tool is a self-contained feature that implements specific MCP functionality:

- **`repo/`**: Repository introspection and file reading
- **`context7/`**: External documentation caching and retrieval
- **`docs/`**: Project-specific documentation RAG
- **`env/`**: Environment validation and testing
- **`pipeline/`**: Dynamic processing pipeline execution
- **`setup/`**: Project initialization and configuration
- **`learn/`**: Lessons learned capture and retrieval

### Core Services (`src/services/`)
Cross-cutting services used by multiple tools:

- **`cache/`**: SQLite + LRU caching for Context7 data
- **`vector/`**: Qdrant integration for RAG functionality
- **`playwright/`**: Browser automation for UI testing
- **`logger/`**: Structured logging with vibe coder friendly messages

### Pipeline Processing (`src/pipeline/`)
Dynamic processing pipeline that adapts based on context:

- **Stage-based processing**: Modular pipeline stages
- **Budget management**: Time, token, and chunk limits
- **Retry logic**: Intelligent retry with context narrowing
- **Learning integration**: Captures and applies lessons learned

## 📚 Documentation Structure

### Architecture Decision Records (`docs/adr/`)
- **ADR-001**: Project structure and organization
- **ADR-002**: Caching strategy and implementation
- **ADR-003**: Vector database selection and configuration
- **ADR-004**: Pipeline design and execution model

### Design Documents (`docs/design/`)
- **System architecture**: High-level system design
- **Data flow**: Request/response flow diagrams
- **Security model**: Authentication and authorization
- **Performance targets**: Response time and throughput goals

### API Documentation (`docs/api/`)
- **Tool reference**: Complete MCP tool documentation
- **Configuration**: Environment variables and settings
- **Examples**: Usage examples and best practices
- **Troubleshooting**: Common issues and solutions

## 🚀 Getting Started

### For Developers
1. **Clone the repository**: `git clone <repo-url>`
2. **Run setup script**: `./scripts/setup/install.sh`
3. **Start development**: `npm run dev`
4. **Run tests**: `npm test`

### For Users
1. **Quick start**: Follow `examples/basic/quick-start.md`
2. **Docker setup**: `docker-compose up -d`
3. **Connect Cursor**: Configure MCP server settings
4. **Start coding**: Ask AI questions about your project

## 🔍 Key Files to Know

### Essential Configuration
- **`package.json`**: Dependencies and scripts
- **`tsconfig.json`**: TypeScript configuration with path mapping
- **`docker-compose.yml`**: Service orchestration
- **`env.example`**: Environment variables template

### Core Implementation
- **`src/index.ts`**: Main application entry point
- **`src/config/config.service.ts`**: Configuration management
- **`src/types/index.ts`**: TypeScript type definitions
- **`src/services/logger/logger.ts`**: Logging service

### Documentation
- **`README.md`**: Project overview and quick start
- **`docs/ARCHITECTURE.md`**: Detailed architecture documentation
- **`docs/API.md`**: Complete API reference
- **`CONTRIBUTING.md`**: Contribution guidelines

## 🎨 Vibe Coder Benefits

This structure is designed to help vibe coders:

- **Find things quickly**: Intuitive directory names and organization
- **Understand easily**: Clear separation of concerns and responsibilities
- **Contribute confidently**: Well-documented patterns and examples
- **Scale naturally**: Architecture supports growth and complexity
- **Deploy simply**: Docker-first approach with smart defaults

## 🔄 Maintenance

### Regular Tasks
- **Update dependencies**: `npm update`
- **Run tests**: `npm test`
- **Check linting**: `npm run lint`
- **Build application**: `npm run build`

### Docker Maintenance
- **Update images**: `docker-compose pull`
- **Clean up**: `docker system prune`
- **View logs**: `docker-compose logs`

This structure provides a solid foundation for the Personal MCP Gateway while remaining accessible and maintainable for vibe coders of all skill levels.
