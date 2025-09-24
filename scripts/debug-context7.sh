#!/bin/bash

# Context7 Debug Configuration Script
# This script helps enable/disable Context7 debug logging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Context7 Debug Configuration${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "vibe/docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to show current status
show_status() {
    echo -e "\n${YELLOW}📊 Current Debug Status:${NC}"
    if grep -q "CONTEXT7_DEBUG=true" vibe/docker-compose.yml; then
        echo -e "  Context7 Debug: ${GREEN}ENABLED${NC}"
    else
        echo -e "  Context7 Debug: ${RED}DISABLED${NC}"
    fi
}

# Function to enable debug mode
enable_debug() {
    echo -e "\n${GREEN}🔍 Enabling Context7 Debug Mode...${NC}"
    
    # Update docker-compose.yml to set CONTEXT7_DEBUG=true
    sed -i.bak 's/CONTEXT7_DEBUG=${CONTEXT7_DEBUG:-false}/CONTEXT7_DEBUG=${CONTEXT7_DEBUG:-true}/' vibe/docker-compose.yml
    
    echo -e "  ✅ Updated docker-compose.yml"
    echo -e "  ✅ Debug logging will be enabled on next container restart"
    
    # Show how to restart
    echo -e "\n${YELLOW}🔄 To apply changes, restart the container:${NC}"
    echo -e "  ${BLUE}cd vibe && docker-compose down && docker-compose up -d${NC}"
}

# Function to disable debug mode
disable_debug() {
    echo -e "\n${RED}🔇 Disabling Context7 Debug Mode...${NC}"
    
    # Update docker-compose.yml to set CONTEXT7_DEBUG=false
    sed -i.bak 's/CONTEXT7_DEBUG=${CONTEXT7_DEBUG:-true}/CONTEXT7_DEBUG=${CONTEXT7_DEBUG:-false}/' vibe/docker-compose.yml
    
    echo -e "  ✅ Updated docker-compose.yml"
    echo -e "  ✅ Debug logging will be disabled on next container restart"
    
    # Show how to restart
    echo -e "\n${YELLOW}🔄 To apply changes, restart the container:${NC}"
    echo -e "  ${BLUE}cd vibe && docker-compose down && docker-compose up -d${NC}"
}

# Function to restart container with debug enabled
restart_with_debug() {
    echo -e "\n${GREEN}🚀 Restarting container with Context7 Debug enabled...${NC}"
    
    # Enable debug mode
    enable_debug
    
    # Restart container
    echo -e "\n${YELLOW}🔄 Restarting Docker container...${NC}"
    cd vibe
    docker-compose down
    docker-compose up -d
    
    echo -e "\n${GREEN}✅ Container restarted with debug mode enabled${NC}"
    echo -e "\n${YELLOW}📋 To view debug logs:${NC}"
    echo -e "  ${BLUE}docker logs -f promptmcp-server${NC}"
}

# Function to show debug logs
show_logs() {
    echo -e "\n${YELLOW}📋 Showing Context7 Debug Logs...${NC}"
    echo -e "  ${BLUE}Press Ctrl+C to stop viewing logs${NC}\n"
    
    docker logs -f promptmcp-server 2>&1 | grep -E "(Context7-Debug|🔍|📚|🔧)" || echo "No debug logs found. Make sure debug mode is enabled."
}

# Function to test with debug
test_with_debug() {
    echo -e "\n${GREEN}🧪 Running quality test with Context7 Debug...${NC}"
    
    # Enable debug mode
    enable_debug
    
    # Restart container
    echo -e "\n${YELLOW}🔄 Restarting container...${NC}"
    cd vibe
    docker-compose down
    docker-compose up -d
    
    # Wait for container to be ready
    echo -e "\n${YELLOW}⏳ Waiting for container to be ready...${NC}"
    sleep 10
    
    # Run test
    echo -e "\n${YELLOW}🧪 Running quality test...${NC}"
    cd ..
    node test-quality-mcp.js > quality-test-debug.txt 2>&1
    
    echo -e "\n${GREEN}✅ Test completed. Results saved to quality-test-debug.txt${NC}"
    echo -e "\n${YELLOW}📋 To view debug logs:${NC}"
    echo -e "  ${BLUE}docker logs promptmcp-server | grep -E '(Context7-Debug|🔍|📚|🔧)'${NC}"
}

# Main menu
case "${1:-}" in
    "enable"|"on")
        enable_debug
        show_status
        ;;
    "disable"|"off")
        disable_debug
        show_status
        ;;
    "restart")
        restart_with_debug
        ;;
    "logs")
        show_logs
        ;;
    "test")
        test_with_debug
        ;;
    "status")
        show_status
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 {enable|disable|restart|logs|test|status}${NC}"
        echo ""
        echo "Commands:"
        echo "  enable/on    - Enable Context7 debug mode"
        echo "  disable/off  - Disable Context7 debug mode"
        echo "  restart      - Restart container with debug enabled"
        echo "  logs         - Show debug logs"
        echo "  test         - Run quality test with debug enabled"
        echo "  status       - Show current debug status"
        echo ""
        show_status
        ;;
esac
