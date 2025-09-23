#!/bin/sh

# Start Services Script
# Runs HTTP server, MCP server (stdio), and health check server

echo "🚀 Starting PromptMCP services..."

# Start health check server in background
echo "🏥 Starting health check server..."
node dist/health-server.js &
HEALTH_PID=$!

# Start main HTTP server in background
echo "🌐 Starting HTTP server..."
node dist/http-server.js &
HTTP_PID=$!

# Start MCP server in foreground (stdio mode for Cursor)
echo "🔌 Starting MCP server in stdio mode..."
node dist/mcp/server.js &
MCP_PID=$!

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $HEALTH_PID 2>/dev/null
    kill $HTTP_PID 2>/dev/null
    kill $MCP_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Wait for MCP server (main process)
wait $MCP_PID
