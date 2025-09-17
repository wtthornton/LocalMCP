# LocalMCP Quick Start Guide

Get LocalMCP running in under 5 minutes! 🚀

## Prerequisites

- Node.js 18+ 
- npm or yarn

## 1. Installation

```bash
# Clone the repository
git clone https://github.com/wtthornton/LocalMCP.git
cd LocalMCP

# Install dependencies
npm install
```

## 2. Build LocalMCP

```bash
# Build the project
npm run build
```

## 3. Set up Context7 (Optional but Recommended)

Context7 provides enhanced documentation caching for faster AI assistance:

```bash
# Run the Context7 setup script
npm run setup:context7
```

This will:
- Guide you through getting a Context7 API key
- Update your `.env` file with the configuration
- Enable enhanced documentation caching

**Get your Context7 API key:**
1. Visit [context7.io](https://context7.io)
2. Sign up for an account
3. Get your API key from the dashboard

## 4. Test LocalMCP

```bash
# Run the test suite to see all 4 tools in action
npm run test:localmcp
```

This will demonstrate:
- 🔍 **localmcp.analyze**: Project structure analysis
- 🛠️ **localmcp.create**: Code generation with dark themes
- 🔧 **localmcp.fix**: Automatic error resolution
- 🧠 **localmcp.learn**: Pattern learning and capture

## 5. Start LocalMCP Server

```bash
# Start the MCP server
npm start
```

The server will run on stdio and be ready to accept MCP protocol requests.

## 6. Connect to Cursor (Optional)

To use LocalMCP with Cursor:

1. Add to your Cursor MCP configuration:
```json
{
  "mcpServers": {
    "localmcp": {
      "command": "node",
      "args": ["path/to/LocalMCP/dist/server.js"]
    }
  }
}
```

2. Restart Cursor
3. Start using the 4 LocalMCP tools!

## Example Usage

Once running, you can use LocalMCP like this:

### Analyze Your Project
```bash
# Analyze current project
localmcp.analyze

# Analyze with specific query
localmcp.analyze --path ./src --query "What are the main components?"
```

### Create New Code
```bash
# Create a dark theme React component
localmcp.create "dark theme Hello World React component"

# Create with specific options
localmcp.create "Vue login form" --framework vue --colorScheme dark
```

### Fix Problems
```bash
# Fix TypeScript errors
localmcp.fix "TypeScript error: Property 'name' does not exist on type 'User'"

# Fix with file context
localmcp.fix "ReferenceError: user is not defined" --file ./src/user.ts
```

### Learn Patterns
```bash
# Learn from successful solutions
localmcp.learn "This solution works perfectly!" --context "function validateUser(user) { return user && user.name; }" --tags "validation,user,typescript"
```

## Troubleshooting

### Build Issues
```bash
# Clean and rebuild
npm run clean
npm run build
```

### Context7 Issues
```bash
# Check your .env file
cat .env

# Re-run setup
npm run setup:context7
```

### Test Issues
```bash
# Run individual tests
npm test

# Check logs
npm start 2>&1 | tee localmcp.log
```

## What's Next?

- **Phase 1**: Enhanced Context7 integration with RAG system
- **Phase 2**: Dynamic pipeline with advanced learning
- **Phase 3**: Full AI assistant integration

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/wtthornton/LocalMCP/issues)
- 💬 [Discussions](https://github.com/wtthornton/LocalMCP/discussions)

---

**Ready to code like a vibe coder? Let's go! 🎉**
