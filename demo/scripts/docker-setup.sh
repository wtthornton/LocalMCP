#!/bin/bash

# Docker Setup Script for PromptMCP Demo
# This script sets up Docker environment for running demos

set -e

echo "🐳 PromptMCP Docker Demo Setup"
echo "=============================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "✅ Docker is running"
echo "✅ docker-compose is available"

# Navigate to project root
cd "$(dirname "$0")/../.."

echo "📁 Working directory: $(pwd)"

# Check if Docker services are already running
if docker-compose -f vibe/docker-compose.yml ps | grep -q "Up"; then
    echo "✅ PromptMCP Docker services are already running"
    echo "📊 Service status:"
    docker-compose -f vibe/docker-compose.yml ps
else
    echo "🚀 Starting PromptMCP Docker services..."
    docker-compose -f vibe/docker-compose.yml up -d
    
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    echo "✅ Docker services started"
    echo "📊 Service status:"
    docker-compose -f vibe/docker-compose.yml ps
fi

# Check if MCP server is responding
echo "🔍 Checking MCP server health..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ MCP server is responding on port 3000"
else
    echo "⚠️  MCP server may not be ready yet. Waiting a bit more..."
    sleep 5
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ MCP server is now responding"
    else
        echo "❌ MCP server is not responding. Check logs with: docker-compose -f vibe/docker-compose.yml logs"
        exit 1
    fi
fi

# Run health check
echo "🏥 Running health check..."
curl -s http://localhost:3000/health | jq '.' || echo "Health check response received (jq not available for formatting)"

echo ""
echo "🎉 Docker setup complete!"
echo ""
echo "📋 Available demo commands:"
echo "  npm run demo:list              # List available scenarios"
echo "  npm run demo:react:docker      # Run React component demo"
echo "  npm run demo:api:docker        # Run API endpoint demo"
echo "  npm run demo:fullstack:docker  # Run full-stack app demo"
echo "  npm run demo:all               # Run all demos"
echo ""
echo "🔧 Docker management commands:"
echo "  docker-compose -f vibe/docker-compose.yml logs -f    # View logs"
echo "  docker-compose -f vibe/docker-compose.yml restart    # Restart services"
echo "  docker-compose -f vibe/docker-compose.yml down       # Stop services"
echo ""
echo "Ready to run demos! 🚀"
