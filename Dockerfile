# LocalMCP Docker Container
# Production-ready container for LocalMCP with all services
# 
# Benefits for vibe coders:
# - Single command deployment: docker run localmcp
# - All services pre-configured and ready to use
# - Optimized for development and production
# - Built-in health checks and monitoring
# - Easy local testing and validation

# Use Node.js 22 LTS as base image
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install dev dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY imp/ ./imp/

# Build TypeScript
RUN npm run build

# Production stage
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S localmcp && \
    adduser -S localmcp -u 1001

# Copy built application
COPY --from=development /app/dist ./dist
COPY --from=development /app/node_modules ./node_modules
COPY --from=development /app/package*.json ./

# Copy configuration and documentation
COPY imp/ ./imp/
COPY README.md ./
COPY .cursorrules ./

# Create data directories
RUN mkdir -p /app/data/{cache,logs,backups,vector-db} && \
    chown -R localmcp:localmcp /app

# Switch to non-root user
USER localmcp

# Expose ports
EXPOSE 3000 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Default command
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL maintainer="LocalMCP Team"
LABEL version="1.0.0"
LABEL description="LocalMCP - AI coding assistant for vibe coders"
LABEL org.opencontainers.image.source="https://github.com/localmcp/localmcp"
LABEL org.opencontainers.image.licenses="MIT"