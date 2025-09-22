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
RUN npm ci && npm cache clean --force

# Rebuild native modules for Alpine Linux
RUN npm rebuild better-sqlite3

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create data and logs directories
RUN mkdir -p /app/data /app/logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S promptmcp -u 1001

# Change ownership of app directory
RUN chown -R promptmcp:nodejs /app
USER promptmcp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the HTTP server (which includes MCP functionality)
CMD ["node", "dist/http-server.js"]