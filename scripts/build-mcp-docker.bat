@echo off
echo Building PromptMCP Docker image for MCP...

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed
    exit /b 1
)

REM Build the application first
echo Building TypeScript application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b 1
)

REM Build Docker image with correct tag
echo Building Docker image...
docker build -f vibe/Dockerfile.mcp -t promptmcp:latest .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed
    exit /b 1
)

echo.
echo ✅ Docker image built successfully!
echo Image: promptmcp:latest
echo.
echo Next steps:
echo 1. Use the updated config/cursor-mcp-config-docker.json in your Cursor MCP settings
echo 2. Restart Cursor
echo 3. Test the connection with @promptmcp.enhance
echo.
echo Configuration is already fixed and ready to use!
