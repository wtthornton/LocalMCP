FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY dist/ ./dist/

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

# Start the application
CMD ["node", "dist/http-server.js"]