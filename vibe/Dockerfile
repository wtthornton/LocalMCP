FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install system dependencies including build tools for native modules
RUN apk add --no-cache curl python3 make g++ sqlite-dev

# Copy package files and source
COPY package*.json ./
COPY src/ ./src/
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Rebuild native modules for Alpine Linux
RUN npm rebuild better-sqlite3

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production --legacy-peer-deps

# Create data and logs directories
RUN mkdir -p /app/data /app/logs

# Create startup script
COPY vibe/start-services.sh /app/start-services.sh
RUN chmod +x /app/start-services.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S promptmcp -u 1001

# Change ownership of app directory
RUN chown -R promptmcp:nodejs /app
USER promptmcp

# Expose port
EXPOSE 3000

# Health check - Test MCP protocol and service connectivity
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD echo '{"jsonrpc":"2.0","id":"health-check","method":"tools/call","params":{"name":"promptmcp.health","arguments":{}}}' | node dist/mcp/server.js | grep -q '"status":"healthy"' || exit 1

# Start both MCP server and health check server
CMD ["sh", "/app/start-services.sh"]