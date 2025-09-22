@echo off
echo Setting up PromptMCP Docker MCP connection...

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running or not installed
    exit /b 1
)

REM Build the application
echo Building TypeScript application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b 1
)

REM Build Docker image
echo Building Docker image...
docker build -f vibe/Dockerfile.mcp-fixed -t promptmcp:latest .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed
    exit /b 1
)

REM Copy config to current directory
echo Copying MCP configuration...
copy config\cursor-mcp-config-docker-fixed.json cursor-mcp-config.json

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. The cursor-mcp-config.json file has been created in the current directory
echo 2. Copy this file to your Cursor MCP configuration location
echo 3. Restart Cursor
echo 4. Test with: @promptmcp.enhance
echo.
echo Configuration location examples:
echo - Windows: %%APPDATA%%\Cursor\User\globalStorage\cursor.mcp\settings.json
echo - Or add to your workspace settings.json
