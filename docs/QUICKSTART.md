# PromptMCP Quick Start

Get PromptMCP running in under 5 minutes! 🚀

## Prerequisites

- Node.js 22+
- Docker (recommended)
- Cursor IDE

## 1. Installation

```bash
# Clone and install
git clone https://github.com/wtthornton/PromptMCP.git
cd PromptMCP
npm install
npm run build
```

## 2. Build PromptMCP

```bash
# Build the project
npm run build
```

## 3. Set up Context7 (Optional but Recommended)

Context7 provides enhanced documentation caching and dynamic framework detection for faster AI assistance:

```bash
# Run the Context7 setup script
npm run setup:context7
```

This will:
- Guide you through getting a Context7 API key
- Update your `.env` file with the configuration
- Enable enhanced documentation caching with SQLite + LRU cache
- Configure dynamic framework detection

**Get your Context7 API key:**
1. Visit [context7.io](https://context7.io)
2. Sign up for an account
3. Get your API key from the dashboard

## 4. Test PromptMCP

```bash
# Test all 2 tools
npm run test:mcp
```

This will demonstrate:
- ✨ **promptmcp.enhance**: Enhance any prompt with perfect project context and dynamic framework detection

## 5. Start PromptMCP

```bash
# Development mode
npm run dev

# Production mode
npm start

# Docker (recommended)
docker-compose up -d
```

## 6. Connect to Cursor (Optional)

To use PromptMCP with Cursor:

1. **Quick Setup:** Add to your Cursor MCP configuration:
```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "node",
      "args": ["/absolute/path/to/PromptMCP/dist/server.js"]
    }
  }
}
```

2. **Detailed Setup:** See our comprehensive [Cursor Setup Guide](CURSOR_SETUP.md) for:
   - Multiple configuration methods (Node.js, Docker, Development)
   - Advanced settings and environment variables
   - Troubleshooting common issues
   - Performance optimization tips

3. Restart Cursor and start using the 4 PromptMCP tools!

## Example Usage

Once running, you can use PromptMCP directly in Cursor:

### Enhance Prompts
```
@promptmcp.enhance Create a login form with React and dark theme
```

The system will automatically:
- Detect frameworks from your prompt (React, Tailwind, etc.)
- Gather relevant Context7 documentation
- Analyze your project context
- Provide enhanced prompts with perfect context

## Docker Quick Start

```bash
# Build and run everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f promptmcp

# Stop
docker-compose down
```

## Troubleshooting

### Build Issues
```bash
# Clean and rebuild
npm run clean
npm run build
```

### Context7 Configuration
```bash
# Check your .env file
cat .env

# Test Context7 integration
npm run test:context7
```

### Cursor Integration Issues
```bash
# Re-run Cursor setup
node setup-cursor.js

# Check Cursor MCP settings
# Go to Cursor Settings > MCP Servers
```

### Test Issues
```bash
# Run individual tests
npm test

# Check logs
npm start 2>&1 | tee promptmcp.log
```

## What's Next?

- **Phase 1**: Enhanced Context7 integration with RAG system
- **Phase 2**: Dynamic pipeline with advanced learning
- **Phase 3**: Full AI assistant integration

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/wtthornton/PromptMCP/issues)
- 💬 [Discussions](https://github.com/wtthornton/PromptMCP/discussions)

---

**Ready to enhance your prompts? Let's go! 🎉**