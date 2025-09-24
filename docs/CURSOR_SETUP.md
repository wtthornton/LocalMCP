# Cursor Setup for PromptMCP

## Overview

PromptMCP integrates with Cursor through the MCP (Model Context Protocol) to provide intelligent prompt enhancement with dynamic framework detection.

## Quick Setup (Automated)

The easiest way to set up PromptMCP with Cursor:

```bash
# Local installation
node setup-cursor.js

# Docker installation
node setup-cursor.js --docker
```

This will automatically:
- Detect your Cursor installation
- Configure MCP servers
- Set up the PromptMCP integration with dynamic framework detection
- Test the connection

## Manual Setup

### Step 1: Build PromptMCP

```bash
npm run build
```

### Step 2: Configure Cursor MCP

Create or edit your Cursor MCP configuration file:

**Windows**: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\mcp_servers.json`
**macOS**: `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/mcp_servers.json`
**Linux**: `~/.config/Cursor/User/globalStorage/cursor.mcp/mcp_servers.json`

```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "node",
      "args": ["C:\\cursor\\vibe\\dist\\server.js"],
      "env": {
        "NODE_ENV": "production",
        "CONTEXT7_API_KEY": "your_context7_key_here"
      }
    }
  }
}
```

### Step 3: Docker Configuration (Alternative)

If using Docker, use this configuration:

```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "promptmcp:latest"
      ],
      "env": {
        "CONTEXT7_API_KEY": "your_context7_key_here"
      }
    }
  }
}
```

### Step 4: Restart Cursor

1. Close Cursor completely
2. Restart Cursor
3. Check MCP status in Cursor settings

## Usage in Cursor

Once configured, you can use PromptMCP directly in Cursor conversations:

### Enhance with Dynamic Framework Detection
```
@promptmcp.enhance Create a dark theme button component with React and TypeScript
```

The system will automatically:
- Detect frameworks from your prompt (React, TypeScript, etc.)
- Gather relevant Context7 documentation
- Analyze your project context
- Provide enhanced prompts with perfect context

## Advanced Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```bash
# Context7 API key (optional but recommended)
CONTEXT7_API_KEY=your_key_here

# Framework Detection (new!)
FRAMEWORK_DETECTION_ENABLED=true
FRAMEWORK_DETECTION_CONFIDENCE_THRESHOLD=0.3
FRAMEWORK_DETECTION_CACHE_ENABLED=true

# Vector database URL
QDRANT_URL=http://localhost:6333

# Log level
LOG_LEVEL=info

# Server port
PORT=3000
```

### Custom MCP Configuration

For advanced users, you can customize the MCP server behavior:

```json
{
  "mcpServers": {
    "promptmcp": {
      "command": "node",
      "args": ["C:\\cursor\\vibe\\dist\\server.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "debug",
        "CONTEXT7_API_KEY": "your_key_here",
        "QDRANT_URL": "http://localhost:6333"
      },
      "cwd": "C:\\cursor\\vibe"
    }
  }
}
```

## Testing Your Setup

### Test MCP Integration

1. Open Cursor
2. Check MCP status in settings (Settings > MCP Servers)
3. Look for "promptmcp" in available tools
4. Try using the tools in a conversation

### Test Server Manually

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test MCP server directly
node dist/server.js
```

### Debug Steps

1. **Check MCP Status**:
   - Open Cursor settings
   - Look for MCP section
   - Check if promptmcp is listed and connected

2. **Check Logs**:
   ```bash
   # Local logs
   npm start 2>&1 | tee logs/promptmcp.log
   
   # Docker logs
   docker-compose logs -f promptmcp
   ```

3. **Verify Configuration**:
   - Check the mcp_servers.json file syntax
   - Ensure paths are correct
   - Verify environment variables

## Troubleshooting

### Common Issues

1. **MCP Server Not Found**
   - Check the path in mcp_servers.json
   - Ensure PromptMCP is built (`npm run build`)
   - Restart Cursor after configuration changes

2. **Connection Refused**
   - Ensure PromptMCP server is running
   - Check port 3000 is available
   - Verify firewall settings

3. **Tool Not Available**
   - Check MCP configuration syntax
   - Look for errors in Cursor's MCP logs
   - Try restarting Cursor

4. **Context7 Configuration**
   - Verify API key is correct
   - Check network connectivity
   - Run `npm run test:context7` to verify integration

### Debug Commands

```bash
# Check if server is running
ps aux | grep node

# Test MCP connection
node test-mcp-direct.js

# Check Cursor MCP logs
# Look in Cursor's developer console or logs directory
```

## Success Indicators

You'll know it's working when:

✅ **MCP Integration**:
- Cursor shows "promptmcp" in available tools
- You can use `@promptmcp.enhance` in conversations
- Tools respond with contextual, project-aware assistance
- Dynamic framework detection works automatically

✅ **Server Health**:
- Health endpoint responds correctly
- MCP server starts without errors
- Context7 integration works (if configured)

## Next Steps

1. **Test with real projects** - Try the tools on actual code
2. **Customize context** - Add project-specific configuration
3. **Monitor performance** - Check response times and accuracy
4. **Extend functionality** - Add custom tools or integrations

**Your PromptMCP is now ready to make Cursor smarter!** 🚀