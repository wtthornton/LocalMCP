# Context7 Integration Best Practices for PromptMCP

## Overview

This guide provides comprehensive information about Context7 integration in PromptMCP, including best practices, API usage patterns, and implementation details. Context7 is a powerful MCP (Model Context Protocol) server that provides up-to-date code documentation for LLMs and AI code editors.

## What is Context7?

Context7 is an external service that provides:
- **Real-time Documentation**: Access to live, up-to-date framework and library documentation
- **Library Resolution**: Automatically resolves library names to Context7-compatible IDs
- **Comprehensive Docs**: Fetches detailed documentation with code snippets and best practices
- **MCP Protocol**: Uses the Model Context Protocol for standardized communication

## Context7 API Tools

Context7 MCP provides exactly 2 tools that LLMs can use (note: this is for Context7 integration, not PromptMCP's core tools):

### 1. `resolve-library-id`
Resolves a general library name into a Context7-compatible library ID.

**Parameters:**
- `libraryName` (required): The name of the library to search for

**Example:**
```json
{
  "name": "resolve-library-id",
  "arguments": {
    "libraryName": "react"
  }
}
```

### 2. `get-library-docs`
Fetches documentation for a library using a Context7-compatible library ID.

**Parameters:**
- `context7CompatibleLibraryID` (required): Exact Context7-compatible library ID (e.g., `/mongodb/docs`, `/vercel/next.js`)
- `topic` (optional): Focus the docs on a specific topic (e.g., "routing", "hooks")
- `tokens` (optional, default 5000): Max number of tokens to return. Values less than 1000 are automatically increased to 1000.

**Example:**
```json
{
  "name": "get-library-docs",
  "arguments": {
    "context7CompatibleLibraryID": "/vercel/next.js",
    "topic": "routing",
    "tokens": 4000
  }
}
```

## PromptMCP Context7 Integration Architecture

### Current Implementation

PromptMCP integrates with Context7 through multiple layers:

1. **Context7Service** (`src/services/context7/context7.service.ts`)
   - Direct HTTP integration with Context7 MCP server
   - Handles library resolution and documentation retrieval
   - Implements caching and error handling

2. **Context7MCPClientReal** (`src/services/context7/context7-mcp-client-real.ts`)
   - Real MCP client implementation using HTTP transport
   - Handles Server-Sent Events (SSE) responses
   - Provides type-safe API integration

3. **Context7MCPClientService** (`src/services/context7/context7-mcp-client.service.ts`)
   - Alternative service implementation with advanced caching
   - Event-driven architecture with comprehensive error handling
   - Circuit breaker and retry patterns

4. **ContextPipeline** (`src/context/context-pipeline.ts`)
   - Orchestrates Context7 integration with other services
   - Combines Context7 docs with local RAG and vector database

## Configuration

### Environment Variables

```bash
# Context7 Integration
CONTEXT7_ENABLED=true
CONTEXT7_API_KEY=your_context7_api_key_here
CONTEXT7_BASE_URL=https://mcp.context7.com/mcp
CONTEXT7_CACHE_ENABLED=true
CONTEXT7_CACHE_TTL=86400000  # 24 hours in milliseconds
```

### MCP Client Configuration

For Cursor, add to your MCP configuration:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

For remote server connection:

```json
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Best Practices

### 1. Library Resolution Strategy

**Always resolve library names first:**
```typescript
// Step 1: Resolve library name to Context7 ID
const libraries = await context7Client.resolveLibraryId('react');
const bestLibrary = libraries
  .sort((a, b) => b.trustScore - a.trustScore)
  [0];

// Step 2: Get documentation using the resolved ID
const docs = await context7Client.getLibraryDocs(
  bestLibrary.id,
  'hooks',
  4000
);
```

### 2. Caching Strategy

**Implement intelligent caching:**
```typescript
// Cache library resolutions for 24 hours
const cacheKey = `resolve:${libraryName}`;
const cached = this.getFromCache(cacheKey);
if (cached && !this.isExpired(cached)) {
  return cached.data;
}

// Cache documentation for 6 hours
const docCacheKey = `docs:${libraryId}:${topic}`;
```

### 3. Error Handling

**Implement graceful fallbacks:**
```typescript
try {
  const docs = await context7Client.getLibraryDocs(libraryId, topic);
  return docs;
} catch (error) {
  this.logger.warn('Context7 request failed, using fallback', { error });
  return this.getFallbackDocumentation(topic);
}
```

### 4. Token Management

**Optimize token usage:**
```typescript
// Use appropriate token limits based on context
const tokens = this.isComprehensiveQuery ? 8000 : 4000;
const docs = await context7Client.getLibraryDocs(libraryId, topic, tokens);
```

### 5. Topic-Specific Queries

**Use specific topics for better results:**
```typescript
// Good: Specific topic
const docs = await context7Client.getLibraryDocs(
  '/vercel/next.js',
  'middleware authentication',
  4000
);

// Avoid: Generic topic
const docs = await context7Client.getLibraryDocs(
  '/vercel/next.js',
  'general',
  4000
);
```

## Usage Patterns

### 1. Framework Detection and Documentation

```typescript
async function getFrameworkDocumentation(framework: string): Promise<string> {
  // Step 1: Resolve framework to Context7 ID
  const libraries = await context7Client.resolveLibraryId(framework);
  
  if (libraries.length === 0) {
    throw new Error(`No Context7 documentation found for ${framework}`);
  }
  
  // Step 2: Get the best library (highest trust score)
  const bestLibrary = libraries[0];
  
  // Step 3: Get comprehensive documentation
  const docs = await context7Client.getLibraryDocs(
    bestLibrary.id,
    'best practices',
    6000
  );
  
  return docs.content;
}
```

### 2. Multi-Library Documentation

```typescript
async function getComprehensiveDocumentation(topic: string): Promise<Context7Documentation[]> {
  // Resolve multiple libraries for the topic
  const libraries = await context7Client.resolveLibraryId(topic);
  
  // Get documentation for top 3 libraries
  const topLibraries = libraries
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 3);
  
  const docPromises = topLibraries.map(library =>
    context7Client.getLibraryDocs(library.id, topic, 3000)
  );
  
  const results = await Promise.allSettled(docPromises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<Context7Documentation> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}
```

### 3. Cached Documentation with Fallback

```typescript
async function getCachedDocumentation(framework: string): Promise<string | null> {
  const cacheKey = `docs:${framework}`;
  
  // Check cache first
  const cached = this.getFromCache(cacheKey);
  if (cached) {
    this.logger.info('Using cached Context7 documentation', { framework });
    return cached.data;
  }
  
  try {
    // Fetch fresh documentation
    const docs = await this.getFrameworkDocumentation(framework);
    
    // Cache for 6 hours
    this.setCache(cacheKey, docs, 6 * 60 * 60 * 1000);
    
    return docs;
  } catch (error) {
    this.logger.warn('Context7 fetch failed, using fallback', { error });
    return this.getFallbackDocumentation(framework);
  }
}
```

## Integration with PromptMCP Tools

### 1. Enhanced Analyze Tool

```typescript
async function analyzeWithContext7(code: string, framework?: string): Promise<AnalysisResult> {
  let context7Docs = '';
  
  if (framework) {
    try {
      const docs = await this.getCachedDocumentation(framework);
      if (docs) {
        context7Docs = `\n\nFramework Documentation:\n${docs}`;
      }
    } catch (error) {
      this.logger.warn('Failed to get Context7 docs for analysis', { error });
    }
  }
  
  return this.performAnalysis(code, context7Docs);
}
```

### 2. Enhanced Create Tool

```typescript
async function createWithContext7(description: string, framework?: string): Promise<CreateResult> {
  let bestPractices = '';
  
  if (framework) {
    const docs = await this.getCachedDocumentation(framework);
    if (docs) {
      bestPractices = this.extractBestPractices(docs);
    }
  }
  
  return this.generateCode(description, bestPractices);
}
```

### 3. Enhanced Fix Tool

```typescript
async function fixWithContext7(code: string, error: string, framework?: string): Promise<FixResult> {
  let frameworkGuidance = '';
  
  if (framework) {
    const docs = await this.getCachedDocumentation(framework);
    if (docs) {
      frameworkGuidance = this.extractErrorGuidance(docs, error);
    }
  }
  
  return this.generateFix(code, error, frameworkGuidance);
}
```

## Performance Optimization

### 1. Connection Pooling

```typescript
class Context7ConnectionPool {
  private connections: Context7MCPClientReal[] = [];
  private maxConnections = 5;
  
  async getConnection(): Promise<Context7MCPClientReal> {
    // Return available connection or create new one
    const available = this.connections.find(conn => !conn.isInUse());
    if (available) return available;
    
    if (this.connections.length < this.maxConnections) {
      const newConn = new Context7MCPClientReal(this.config);
      await newConn.connect();
      this.connections.push(newConn);
      return newConn;
    }
    
    // Wait for available connection
    return this.waitForConnection();
  }
}
```

### 2. Batch Processing

```typescript
async function batchResolveLibraries(libraryNames: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  // Process in batches of 5
  const batchSize = 5;
  for (let i = 0; i < libraryNames.length; i += batchSize) {
    const batch = libraryNames.slice(i, i + batchSize);
    const batchPromises = batch.map(async (name) => {
      const libraries = await context7Client.resolveLibraryId(name);
      return { name, libraryId: libraries[0]?.id };
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.libraryId) {
        results.set(batch[index], result.value.libraryId);
      }
    });
  }
  
  return results;
}
```

## Monitoring and Debugging

### 1. Health Checks

```typescript
async function healthCheck(): Promise<HealthStatus> {
  try {
    const isConnected = await context7Client.healthCheck();
    const cacheStats = context7Client.getCacheStats();
    
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      context7: {
        connected: isConnected,
        cacheHitRate: cacheStats.hitRate,
        cacheSize: cacheStats.size
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
```

### 2. Metrics Collection

```typescript
class Context7Metrics {
  private metrics = {
    requests: 0,
    cacheHits: 0,
    errors: 0,
    avgResponseTime: 0
  };
  
  recordRequest(responseTime: number): void {
    this.metrics.requests++;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.requests - 1) + responseTime) / 
      this.metrics.requests;
  }
  
  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }
  
  recordError(): void {
    this.metrics.errors++;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.requests > 0 ? 
        (this.metrics.cacheHits / this.metrics.requests) * 100 : 0
    };
  }
}
```

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "bunx",
         "args": ["-y", "@upstash/context7-mcp"]
       }
     }
   }
   ```

2. **ESM Resolution Issues**
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "npx",
         "args": ["-y", "--node-options=--experimental-vm-modules", "@upstash/context7-mcp@1.0.6"]
       }
     }
   }
   ```

3. **TLS/Certificate Issues**
   ```json
   {
     "mcpServers": {
       "context7": {
         "command": "npx",
         "args": ["-y", "--node-options=--experimental-fetch", "@upstash/context7-mcp"]
       }
     }
   }
   ```

### Debug Mode

Enable debug logging:
```typescript
const context7Client = new Context7MCPClientReal({
  apiKey: process.env.CONTEXT7_API_KEY,
  mcpUrl: 'https://mcp.context7.com/mcp',
  timeout: 10000,
  debug: true  // Enable debug logging
});
```

## Testing

### Unit Tests

```typescript
describe('Context7Service', () => {
  let context7Service: Context7Service;
  
  beforeEach(() => {
    context7Service = new Context7Service(mockLogger, mockConfig);
  });
  
  it('should resolve library ID correctly', async () => {
    const libraries = await context7Service.resolveLibraryId('react');
    expect(libraries).toBeDefined();
    expect(libraries.length).toBeGreaterThan(0);
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('API Error'));
    
    const result = await context7Service.getCachedDocumentation('react');
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('Context7 Integration', () => {
  it('should work end-to-end', async () => {
    const context7Client = new Context7MCPClientReal({
      apiKey: process.env.CONTEXT7_API_KEY,
      mcpUrl: 'https://mcp.context7.com/mcp',
      timeout: 10000
    });
    
    await context7Client.connect();
    
    const libraries = await context7Client.resolveLibraryId('next.js');
    expect(libraries.length).toBeGreaterThan(0);
    
    const docs = await context7Client.getLibraryDocs(
      libraries[0].id,
      'routing',
      4000
    );
    expect(docs.length).toBeGreaterThan(0);
  });
});
```

## Security Considerations

### 1. API Key Management

```typescript
// Use environment variables for API keys
const apiKey = process.env.CONTEXT7_API_KEY;
if (!apiKey) {
  throw new Error('CONTEXT7_API_KEY environment variable is required');
}

// Rotate API keys regularly
const keyRotation = {
  current: process.env.CONTEXT7_API_KEY,
  backup: process.env.CONTEXT7_API_KEY_BACKUP,
  lastRotated: new Date()
};
```

### 2. Rate Limiting

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 100; // per minute
  private windowMs = 60 * 1000; // 1 minute
  
  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests.push(now);
    return true;
  }
}
```

## Future Enhancements

### 1. Advanced Caching

- Implement Redis for distributed caching
- Add cache invalidation strategies
- Implement cache warming

### 2. Performance Monitoring

- Add APM integration
- Implement request tracing
- Add performance dashboards

### 3. Enhanced Error Handling

- Implement circuit breaker patterns
- Add retry with exponential backoff
- Implement fallback documentation sources

## Conclusion

Context7 integration in PromptMCP provides powerful capabilities for accessing up-to-date documentation and best practices. By following these best practices, you can ensure reliable, performant, and maintainable integration that enhances the developer experience for vibe coders.

For more information, visit:
- [Context7 Official Documentation](https://context7.com)
- [Context7 GitHub Repository](https://github.com/upstash/context7)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
