# Test Configuration Setup

## Overview
This project uses environment variables for API keys in production, but test files need access to API keys for local testing.

## Setup for Testing

1. **Create `test-config.json`** (not committed to git):
```json
{
  "context7": {
    "apiKey": "your-context7-api-key-here",
    "baseUrl": "https://mcp.context7.com/mcp"
  },
  "openai": {
    "apiKey": "your-openai-api-key-here",
    "projectId": "your-openai-project-id-here"
  }
}
```

2. **For Production Deployment**:
   - Set environment variables `CONTEXT7_API_KEY` and `OPENAI_API_KEY`
   - Docker Compose will use these environment variables
   - No hardcoded keys in the repository

## Files Using Test Config
- `test-quality-mcp.js` - MCP protocol testing
- `test-mcp-client.js` - MCP client testing
- Other test files that need API access

## Security
- `test-config.json` is in `.gitignore` and will not be committed
- Production uses environment variables only
- No sensitive data in the repository
