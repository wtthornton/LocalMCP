# Docker MCP Setup for PromptMCP

## 🐳 Docker MCP Protocol Setup

Yes! PromptMCP can run as a Docker container with MCP protocol support. Here's how to set it up:

## Quick Setup

### 1. Build the MCP Docker Image

```bash
# Build the MCP-specific Docker image
docker build -f Dockerfile.mcp -t promptmcp-mcp .
```

### 2. Configure Cursor

Copy the Docker MCP configuration to your Cursor MCP settings:

**Windows**: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\mcp_servers.json`
**macOS**: `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/mcp_servers.json`
**Linux**: `~/.config/Cursor/User/globalStorage/cursor.mcp/mcp_servers.json`

```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "promptmcp-mcp"],
      "env": {}
    }
  }
}
```

### 3. Restart Cursor

1. Close Cursor completely
2. Restart Cursor
3. Check MCP status in settings

### 4. Test the Integration

In Cursor, try:
```
@promptmcp.enhance Create a React button component
```

## Automated Setup

Use the setup script with Docker flag:

```bash
# Run automated setup for Docker MCP
node setup-cursor.js --docker
```

## How It Works

### Docker MCP Architecture

```
Cursor IDE
    ↓ (MCP Protocol over stdio)
Docker Container (promptmcp-mcp)
    ↓ (Context Pipeline)
├── Context7 Cache
├── Vector DB (RAG)
├── Repo Facts Detection
└── Code Snippet Reading
```

### Key Features

- **MCP Protocol**: Direct integration with Cursor
- **Docker Isolation**: Clean, reproducible environment
- **Stdio Communication**: No network ports needed
- **Context Enhancement**: Project-aware prompt improvement
- **Lightweight**: ~20MB container size

## Testing the Setup

### Manual Test

```bash
# Test MCP protocol directly
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | docker run --rm -i promptmcp-mcp
```

### Expected Response

```json
{
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "promptmcp",
      "version": "1.0.0"
    }
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

## Usage Examples

### Basic Enhancement

```
@promptmcp.enhance Create a login form
```

### With Framework Context

```
@promptmcp.enhance Create a Vue component
Context: {"framework": "vue", "style": "tailwind"}
```

### With File Context

```
@promptmcp.enhance Fix this TypeScript error
Context: {"file": "./src/components/Button.tsx", "framework": "react"}
```

## Troubleshooting

### Container Not Found

```bash
# Rebuild the image
docker build -f Dockerfile.mcp -t promptmcp-mcp .

# Check if image exists
docker images | grep promptmcp-mcp
```

### MCP Connection Issues

1. **Check Docker is running**
2. **Verify Cursor MCP configuration**
3. **Restart Cursor completely**
4. **Check MCP status in Cursor settings**

### Performance Issues

```bash
# Monitor container resources
docker stats promptmcp-mcp

# Check container logs
docker logs promptmcp-mcp
```

## Advantages of Docker MCP

✅ **Isolation**: Clean environment, no local dependencies
✅ **Reproducible**: Same setup across different machines
✅ **Portable**: Easy to share and deploy
✅ **Lightweight**: Small container size (~20MB)
✅ **MCP Native**: Direct protocol support
✅ **No Ports**: Uses stdio, no network configuration needed

## Container Management

### Start Container (if needed)

```bash
# The container runs on-demand via MCP
# No need to keep it running permanently
```

### Update Container

```bash
# Rebuild with latest changes
docker build -f Dockerfile.mcp -t promptmcp-mcp .

# Restart Cursor to pick up changes
```

### Remove Container

```bash
# Remove the image
docker rmi promptmcp-mcp

# Clean up unused containers
docker system prune
```

## Success Indicators

You'll know it's working when:

✅ **Cursor shows "promptmcp" in MCP tools**
✅ **You can use `@promptmcp.enhance` in conversations**
✅ **Enhanced prompts are more contextual**
✅ **No network ports are needed**
✅ **Container runs on-demand**

## Next Steps

1. **Test with real projects** - Try enhancing prompts for actual code
2. **Customize context** - Add project-specific information
3. **Monitor performance** - Check response times and resource usage
4. **Share with team** - Docker makes it easy to distribute

**Your Docker MCP setup is ready!** 🐳🚀
