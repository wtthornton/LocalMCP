# LocalMCP

A local MCP server for "vibe coders" - developers who want AI assistance for technical decisions without deep framework expertise.

## 🎯 The 4 LocalMCP Tools

LocalMCP exposes exactly 4 simple tools that cover the most common coding needs:

### `localmcp.analyze` - "Look at my project"
Analyze your project structure, dependencies, and identify patterns without manual inspection.

**Example:**
```bash
# Analyze current project
localmcp.analyze

# Analyze specific directory with query
localmcp.analyze --path ./src --query "What are the main services?"
```

### `localmcp.create` - "Make me something new"
Generate new code, files, or components based on natural language descriptions.

**Example:**
```bash
# Create a dark theme Hello World component
localmcp.create "dark theme Hello World React component"

# Create with specific options
localmcp.create "Vue login form" --framework vue --colorScheme dark
```

### `localmcp.fix` - "Fix this problem"
Diagnose and automatically resolve coding issues, build errors, or runtime problems.

**Example:**
```bash
# Fix TypeScript error
localmcp.fix "TypeScript error: Property 'name' does not exist on type 'User'"

# Fix with file context
localmcp.fix "ReferenceError: user is not defined" --file ./src/user.ts
```

### `localmcp.learn` - "Remember this solution"
Capture successful coding patterns and solutions for future use.

**Example:**
```bash
# Learn from successful fix
localmcp.learn "This solution works perfectly!" --context "function validateUser(user) { return user && user.name; }" --tags "validation,user,typescript"
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/wtthornton/LocalMCP.git
cd LocalMCP
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment:**
```bash
cp env.example .env
# Edit .env with your configuration

# Optional: Set up Context7 for enhanced documentation caching
npm run setup:context7
```

4. **Build the project:**
```bash
npm run build
```

5. **Test LocalMCP:**
```bash
# Run the test suite to see all 4 tools in action
npm run test:localmcp
```

6. **Start the server:**
```bash
npm start
```

### Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 🏗️ Architecture

```
LocalMCP (4 Simple Tools)
├── localmcp.analyze    # Project analysis
├── localmcp.create     # Code generation  
├── localmcp.fix        # Error resolution
└── localmcp.learn      # Pattern learning
```

**Behind the scenes:** Invisible dynamic pipeline processing with SQLite + LRU caching, Context7 integration, and Qdrant vector database for RAG.

## 🎨 Vibe Coder Philosophy

- **Simple setup**: `docker run` and ready
- **Smart defaults**: No configuration needed
- **Instant feedback**: See results immediately
- **Less Googling**: Cached documentation and patterns
- **Learning over time**: Gets smarter with each use

## 📁 Project Structure

```
LocalMCP/
├── src/
│   ├── server.ts           # Main MCP server
│   ├── tools/              # The 4 core tools
│   │   ├── analyze.ts      # Project analysis
│   │   ├── create.ts       # Code generation
│   │   ├── fix.ts          # Error fixing
│   │   └── learn.ts        # Pattern learning
│   ├── services/           # Core services
│   │   └── logger/         # Logging service
│   └── config/             # Configuration
│       └── config.service.ts
├── imp/                    # Implementation details
│   ├── phases/             # Development phases
│   ├── design/             # Design documents
│   └── progress/           # Progress tracking
├── docs/                   # Documentation
├── tests/                  # Test files
└── scripts/                # Utility scripts
```

## 🔧 Configuration

LocalMCP uses environment variables for configuration. See `env.example` for all available options.

### Key Settings

- **Context7 Integration**: Enable/disable external documentation caching
- **Caching**: SQLite + LRU cache for Context7 responses and local data
- **Vector Database**: Qdrant for RAG and semantic search
- **Logging**: Configure log levels and output
- **Tools**: Enable/disable individual tools and configure behavior

## 🧪 Testing

LocalMCP uses Vitest for testing with comprehensive coverage:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test src/tools/analyze.test.ts
```

## 📊 Success Criteria

### Week 1: MVP
- [x] All 4 tools implemented and functional
- [x] Basic Context7 integration working
- [x] Docker container running successfully
- [x] 80%+ test coverage
- [x] Response time <2s for all tools
- [x] Vibe coder can create a simple component

### Week 3: Enhanced
- [ ] 80%+ cache hit rate for Context7
- [ ] RAG system operational
- [ ] Dynamic pipeline processing requests
- [ ] 70%+ first-pass success rate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the "vibe coder" community
- Powered by Context7 for documentation caching
- Uses the Model Context Protocol (MCP) standard
- Inspired by the need for simpler AI coding assistance

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/wtthornton/LocalMCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wtthornton/LocalMCP/discussions)
- **Documentation**: [Project Wiki](https://github.com/wtthornton/LocalMCP/wiki)

---

**Made with ❤️ for vibe coders who just want to build cool stuff!**