# Quick Start Guide

This guide will get you up and running with the Personal MCP Gateway in under 5 minutes.

## Prerequisites

- Node.js 22+ installed
- Docker installed
- Cursor (or another MCP-compatible AI assistant)

## Step 1: Setup

```bash
# Clone the repository
git clone https://github.com/your-org/personal-mcp-gateway.git
cd personal-mcp-gateway

# Run the setup script
chmod +x scripts/setup/install.sh
./scripts/setup/install.sh
```

## Step 2: Start the Gateway

```bash
# Start all services
docker-compose up -d

# Check if everything is running
docker-compose ps
```

## Step 3: Connect Cursor

1. Open Cursor
2. Go to Settings → MCP Servers
3. Add a new server with these settings:
   - **Name**: `personal-mcp-gateway`
   - **Command**: `docker`
   - **Args**: `["exec", "-i", "personal-mcp-gateway", "node", "dist/index.js"]`

## Step 4: Test It Out

Try asking Cursor these questions:

- "How do I add authentication to this Next.js app?"
- "Fix this TypeScript error"
- "What's the best way to handle state management here?"

## What You Should See

- **Faster responses**: Cached documentation means instant access
- **Project-aware suggestions**: AI understands your specific codebase
- **Better error fixes**: Context-aware solutions based on your project patterns

## Troubleshooting

### Gateway not starting?
```bash
# Check logs
docker-compose logs mcp-gateway

# Restart services
docker-compose restart
```

### Cursor not connecting?
- Make sure the gateway is running: `docker-compose ps`
- Check the connection settings in Cursor
- Verify port 3000 is available

### Need help?
- Check the [documentation](docs/)
- [Report an issue](https://github.com/your-org/personal-mcp-gateway/issues)
- [Join discussions](https://github.com/your-org/personal-mcp-gateway/discussions)

## Next Steps

- Explore the [advanced examples](examples/advanced/)
- Read the [architecture documentation](docs/ARCHITECTURE.md)
- Learn about [customizing the configuration](docs/CONFIGURATION.md)

Happy coding! 🚀
