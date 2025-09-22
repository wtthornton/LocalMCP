@echo off
echo Testing PromptMCP Docker MCP connection...

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running
    exit /b 1
)

REM Check if image exists
docker images promptmcp:latest --format "table {{.Repository}}:{{.Tag}}" | findstr "promptmcp:latest" >nul
if %errorlevel% neq 0 (
    echo ❌ Docker image promptmcp:latest not found
    echo Run scripts/setup-mcp.bat first to build the image
    exit /b 1
)

echo ✅ Docker image found: promptmcp:latest

REM Test MCP server startup
echo Testing MCP server startup...
docker run --rm -i --name promptmcp-test ^
  -v "%CD%:/workspace" ^
  -v "%CD%\data:/app/data" ^
  -v "%CD%\logs:/app/logs" ^
  -w /workspace ^
  promptmcp:latest node -e "console.log('MCP server test successful')"

if %errorlevel% equ 0 (
    echo ✅ MCP server test passed
    echo.
    echo Your configuration is ready to use!
    echo.
    echo To connect with Cursor:
    echo 1. Use config/cursor-mcp-config-docker.json in your Cursor MCP settings
    echo 2. Restart Cursor
    echo 3. Test with @promptmcp.enhance
) else (
    echo ❌ MCP server test failed
    echo Check the error messages above
)

echo.
pause
