@echo off
echo Setting up PromptMCP Docker MCP connection...

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

REM Build the application
echo Building TypeScript application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    echo Please check your TypeScript compilation errors
    pause
    exit /b 1
)

REM Build Docker image
echo Building Docker image...
docker build -f vibe/Dockerfile.mcp -t promptmcp:latest .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed
    echo Please check Docker logs above
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo Your MCP configuration is ready:
echo - File: config/cursor-mcp-config-docker.json
echo - Docker image: promptmcp:latest
echo.
echo Next steps:
echo 1. Copy config/cursor-mcp-config-docker.json to your Cursor MCP settings
echo 2. Restart Cursor
echo 3. Test with: @promptmcp.enhance
echo.
echo Configuration location examples:
echo - Windows: %%APPDATA%%\Cursor\User\globalStorage\cursor.mcp\settings.json
echo - Or add to your workspace settings.json
echo.
pause
