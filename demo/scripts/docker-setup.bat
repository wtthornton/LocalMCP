@echo off
REM Docker Setup Script for PromptMCP Demo (Windows)
REM This script sets up Docker environment for running demos

echo 🐳 PromptMCP Docker Demo Setup
echo ==============================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install docker-compose and try again.
    exit /b 1
)

echo ✅ Docker is running
echo ✅ docker-compose is available

REM Navigate to project root
cd /d "%~dp0\..\.."

echo 📁 Working directory: %CD%

REM Check if Docker services are already running
docker-compose -f vibe/docker-compose.yml ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ PromptMCP Docker services are already running
    echo 📊 Service status:
    docker-compose -f vibe/docker-compose.yml ps
) else (
    echo 🚀 Starting PromptMCP Docker services...
    docker-compose -f vibe/docker-compose.yml up -d
    
    echo ⏳ Waiting for services to be ready...
    timeout /t 10 /nobreak >nul
    
    echo ✅ Docker services started
    echo 📊 Service status:
    docker-compose -f vibe/docker-compose.yml ps
)

REM Check if MCP server is responding
echo 🔍 Checking MCP server health...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MCP server is responding on port 3000
) else (
    echo ⚠️  MCP server may not be ready yet. Waiting a bit more...
    timeout /t 5 /nobreak >nul
    curl -s http://localhost:3000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ MCP server is now responding
    ) else (
        echo ❌ MCP server is not responding. Check logs with: docker-compose -f vibe/docker-compose.yml logs
        exit /b 1
    )
)

REM Run health check
echo 🏥 Running health check...
curl -s http://localhost:3000/health

echo.
echo 🎉 Docker setup complete!
echo.
echo 📋 Available demo commands:
echo   npm run demo:list              # List available scenarios
echo   npm run demo:react:docker      # Run React component demo
echo   npm run demo:api:docker        # Run API endpoint demo
echo   npm run demo:fullstack:docker  # Run full-stack app demo
echo   npm run demo:all               # Run all demos
echo.
echo 🔧 Docker management commands:
echo   docker-compose -f vibe/docker-compose.yml logs -f    # View logs
echo   docker-compose -f vibe/docker-compose.yml restart    # Restart services
echo   docker-compose -f vibe/docker-compose.yml down       # Stop services
echo.
echo Ready to run demos! 🚀

pause
