@echo off
echo "PromptMCP is running in Docker container"
echo "Use HTTP server for testing: curl -X POST -H 'Content-Type: application/json' http://localhost:3001/enhance"
echo "Never use 'docker exec' - it conflicts with the running container"
pause
