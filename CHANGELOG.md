# Changelog

All notable changes to LocalMCP will be documented in this file.

## [Unreleased]

### Added
- Comprehensive documentation cleanup and reorganization
- Automated Cursor setup script with Docker support
- Simplified package.json with essential scripts only
- Clean Docker configuration with health checks
- API documentation with complete tool specifications
- Development guide with best practices

### Changed
- Streamlined project structure focusing on 4 core tools
- Updated Cursor configuration files for optimal development
- Simplified build and deployment process
- Removed unnecessary documentation files and scripts

### Removed
- Outdated documentation files (CONTEXT7_RESTORATION_TASKS.md, PIVOT_COMPLETE.md, etc.)
- Redundant test scripts and configuration files
- Complex pipeline documentation that wasn't implemented

## [1.0.0] - 2024-01-15

### Added
- Initial LocalMCP implementation with 4 core tools
- Context7 integration for framework documentation
- Vector database support for RAG
- MCP protocol implementation
- Docker support
- Basic logging and configuration services

### Tools
- `localmcp.analyze` - Analyze code, architecture, or project structure
- `localmcp.create` - Create new code, files, or project components
- `localmcp.fix` - Fix bugs, issues, or improve existing code
- `localmcp.learn` - Learn from code patterns, best practices, or documentation

### Services
- Context7 service with SQLite caching
- Vector database service for RAG
- Logger service with structured logging
- Configuration service with environment variable support

### Infrastructure
- Node.js 22 LTS support
- Docker containerization
- Health check endpoints
- MCP protocol compliance
