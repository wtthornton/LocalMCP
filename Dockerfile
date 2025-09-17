# Multi-stage Dockerfile for Personal MCP Gateway
# Optimized for vibe coders - simple setup, fast builds

# Build stage
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    build-base \
    gcc \
    g++ \
    make \
    python3 \
    py3-pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpuser -u 1001

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create necessary directories
RUN mkdir -p /app/cache /app/logs /app/data && \
    chown -R mcpuser:nodejs /app

# Switch to non-root user
USER mcpuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]
