#!/bin/bash

# Personal MCP Gateway Setup Script
# Designed for vibe coders - simple setup, smart defaults

set -e

echo "🚀 Setting up Personal MCP Gateway..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 22+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js version 22+ is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker $(docker --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p cache data logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "✅ Environment file created. You may want to customize it."
else
    echo "✅ Environment file already exists"
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Pull Docker images
echo "🐳 Pulling Docker images..."
docker-compose pull

echo ""
echo "🎉 Setup complete! Here's what you can do next:"
echo ""
echo "1. Start the gateway:"
echo "   docker-compose up -d"
echo ""
echo "2. Connect Cursor to localhost:3000"
echo ""
echo "3. Start coding smarter! 🚀"
echo ""
echo "For more information, see the README.md file."
