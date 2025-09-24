@echo off
REM Context7 Debug Configuration Script for Windows
REM This script helps enable/disable Context7 debug logging

echo 🔧 Context7 Debug Configuration
echo ==================================

REM Check if we're in the right directory
if not exist "vibe\docker-compose.yml" (
    echo ❌ Error: Please run this script from the project root directory
    exit /b 1
)

REM Function to show current status
:show_status
echo.
echo 📊 Current Debug Status:
findstr /C:"CONTEXT7_DEBUG=true" vibe\docker-compose.yml >nul
if %errorlevel%==0 (
    echo   Context7 Debug: ENABLED
) else (
    echo   Context7 Debug: DISABLED
)
goto :eof

REM Function to enable debug mode
:enable_debug
echo.
echo 🔍 Enabling Context7 Debug Mode...

REM Update docker-compose.yml to set CONTEXT7_DEBUG=true
powershell -Command "(Get-Content vibe\docker-compose.yml) -replace 'CONTEXT7_DEBUG=\${CONTEXT7_DEBUG:-false}', 'CONTEXT7_DEBUG=\${CONTEXT7_DEBUG:-true}' | Set-Content vibe\docker-compose.yml"

echo   ✅ Updated docker-compose.yml
echo   ✅ Debug logging will be enabled on next container restart

echo.
echo 🔄 To apply changes, restart the container:
echo   cd vibe && docker-compose down && docker-compose up -d
goto :eof

REM Function to disable debug mode
:disable_debug
echo.
echo 🔇 Disabling Context7 Debug Mode...

REM Update docker-compose.yml to set CONTEXT7_DEBUG=false
powershell -Command "(Get-Content vibe\docker-compose.yml) -replace 'CONTEXT7_DEBUG=\${CONTEXT7_DEBUG:-true}', 'CONTEXT7_DEBUG=\${CONTEXT7_DEBUG:-false}' | Set-Content vibe\docker-compose.yml"

echo   ✅ Updated docker-compose.yml
echo   ✅ Debug logging will be disabled on next container restart

echo.
echo 🔄 To apply changes, restart the container:
echo   cd vibe && docker-compose down && docker-compose up -d
goto :eof

REM Function to restart container with debug enabled
:restart_with_debug
echo.
echo 🚀 Restarting container with Context7 Debug enabled...

REM Enable debug mode
call :enable_debug

REM Restart container
echo.
echo 🔄 Restarting Docker container...
cd vibe
docker-compose down
docker-compose up -d
cd ..

echo.
echo ✅ Container restarted with debug mode enabled
echo.
echo 📋 To view debug logs:
echo   docker logs -f promptmcp-server
goto :eof

REM Function to show debug logs
:show_logs
echo.
echo 📋 Showing Context7 Debug Logs...
echo   Press Ctrl+C to stop viewing logs
echo.

docker logs -f promptmcp-server 2>&1 | findstr /C:"Context7-Debug" /C:"🔍" /C:"📚" /C:"🔧" || echo No debug logs found. Make sure debug mode is enabled.
goto :eof

REM Function to test with debug
:test_with_debug
echo.
echo 🧪 Running quality test with Context7 Debug...

REM Enable debug mode
call :enable_debug

REM Restart container
echo.
echo 🔄 Restarting container...
cd vibe
docker-compose down
docker-compose up -d
cd ..

REM Wait for container to be ready
echo.
echo ⏳ Waiting for container to be ready...
timeout /t 10 /nobreak >nul

REM Run test
echo.
echo 🧪 Running quality test...
node test-quality-mcp.js > quality-test-debug.txt 2>&1

echo.
echo ✅ Test completed. Results saved to quality-test-debug.txt
echo.
echo 📋 To view debug logs:
echo   docker logs promptmcp-server | findstr /C:"Context7-Debug" /C:"🔍" /C:"📚" /C:"🔧"
goto :eof

REM Main menu
if "%1"=="enable" goto :enable_debug
if "%1"=="on" goto :enable_debug
if "%1"=="disable" goto :disable_debug
if "%1"=="off" goto :disable_debug
if "%1"=="restart" goto :restart_with_debug
if "%1"=="logs" goto :show_logs
if "%1"=="test" goto :test_with_debug
if "%1"=="status" goto :show_status

REM Default help
echo Usage: %0 {enable^|disable^|restart^|logs^|test^|status}
echo.
echo Commands:
echo   enable/on    - Enable Context7 debug mode
echo   disable/off  - Disable Context7 debug mode
echo   restart      - Restart container with debug enabled
echo   logs         - Show debug logs
echo   test         - Run quality test with debug enabled
echo   status       - Show current debug status
echo.
call :show_status
