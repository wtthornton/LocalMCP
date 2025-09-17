# ADR-001: Project Structure and Organization

## Status
Accepted

## Context
We need to establish a clear, maintainable project structure for the Personal MCP Gateway that supports:
- Easy development for "vibe coders" (developers who prefer intuitive, well-organized code)
- Clear separation of concerns
- Scalable architecture
- Docker-first deployment
- MCP protocol compliance

## Decision
We will organize the project using a hybrid approach that combines:
1. **Feature-based organization** for MCP tools
2. **Layer-based organization** for core services
3. **Domain-driven design** principles for business logic

### Directory Structure
```
personal-mcp-gateway/
├── src/                    # Source code
│   ├── tools/             # MCP tools (feature-based)
│   │   ├── repo/          # Repository introspection tools
│   │   ├── context7/      # Context7 integration tools
│   │   ├── docs/          # Documentation RAG tools
│   │   ├── env/           # Environment validation tools
│   │   ├── pipeline/      # Pipeline execution tools
│   │   ├── setup/         # Project setup tools
│   │   └── learn/         # Lessons learned tools
│   ├── services/          # Core services (layer-based)
│   │   ├── cache/         # Caching service
│   │   ├── vector/        # Vector database service
│   │   ├── playwright/    # Playwright integration
│   │   └── logger/        # Logging service
│   ├── pipeline/          # Dynamic pipeline processing
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── config/            # Configuration management
├── docs/                  # Documentation
│   ├── adr/              # Architecture Decision Records
│   ├── design/           # Design documents
│   └── api/              # API documentation
├── examples/             # Usage examples
├── scripts/              # Setup and maintenance scripts
└── docker-compose.yml    # Docker configuration
```

## Rationale

### Why Feature-based for Tools?
- **MCP tools are self-contained features** that can be developed independently
- **Easier for vibe coders** to understand and contribute to specific tools
- **Clear boundaries** between different tool functionalities
- **Simpler testing** and maintenance

### Why Layer-based for Services?
- **Core services are cross-cutting concerns** used by multiple tools
- **Clear separation** between data access, business logic, and presentation
- **Easier to maintain** and refactor core functionality
- **Better testability** with clear interfaces

### Why Domain-driven Design?
- **Business logic is organized around domains** (caching, vector search, etc.)
- **Clear domain boundaries** prevent tight coupling
- **Easier to understand** for new developers
- **Supports future scaling** and feature additions

## Consequences

### Positive
- **Clear organization** makes it easy for vibe coders to navigate
- **Modular architecture** supports independent development
- **Docker-first approach** ensures consistent deployment
- **MCP compliance** ensures compatibility with AI assistants

### Negative
- **Initial complexity** in setting up the structure
- **Potential over-engineering** for a small project
- **Learning curve** for developers unfamiliar with the structure

### Mitigation
- **Comprehensive documentation** explains the structure
- **Clear examples** show how to add new features
- **Consistent patterns** across all modules
- **Regular refactoring** to keep the structure clean

## Implementation

1. **Create the directory structure** as outlined above
2. **Set up TypeScript configuration** with path mapping
3. **Create base classes and interfaces** for each layer
4. **Implement core services** first (cache, vector, logger)
5. **Build MCP tools** on top of the services
6. **Add comprehensive documentation** and examples

## References

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
