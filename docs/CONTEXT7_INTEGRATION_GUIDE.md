# Context7 Integration Guide for PromptMCP

## Overview

Context7 is a powerful MCP (Model Context Protocol) server that provides up-to-date code documentation for LLMs and AI code editors. This guide covers how PromptMCP integrates with Context7 to provide enhanced documentation caching and real-time framework information for vibe coders.

## What is Context7?

Context7 is an external service that provides:
- **Real-time Documentation**: Access to live, up-to-date framework and library documentation
- **Library Resolution**: Automatically resolves library names to Context7-compatible IDs
- **Comprehensive Docs**: Fetches detailed documentation with code snippets and best practices
- **MCP Protocol**: Uses the Model Context Protocol for standardized communication

## Context7 Integration Architecture

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
CONTEXT7_CACHE_TTL=3600

# Alternative MCP Server Integration
CONTEXT7_MCP_ENABLED=false
CONTEXT7_MCP_URL=http://localhost:3001
CONTEXT7_MCP_TIMEOUT=30000
```

### Getting Your API Key

1. Visit [Context7 Dashboard](https://context7.com/dashboard)
2. Sign up for an account
3. Generate your API key from the dashboard
4. Add it to your `.env` file

## API Usage Patterns

### 1. Library Resolution

```typescript
// Resolve a library name to Context7-compatible ID
const libraries = await context7Service.resolveLibraryId('react');
// Returns: [{ id: '/facebook/react', name: 'React', trustScore: 9.5, ... }]
```

### 2. Documentation Retrieval

```typescript
// Get documentation for a specific library and topic
const docs = await context7Service.getLibraryDocumentation(
  '/facebook/react',
  'hooks',
  5000 // tokens
);
```

### 3. Comprehensive Documentation

```typescript
// Get docs from multiple libraries for a topic
const comprehensiveDocs = await context7Service.getComprehensiveDocumentation(
  'authentication',
  5, // max libraries
  2000 // tokens per library
);
```

## Best Practices

### 1. Caching Strategy

**Always enable caching** for better performance:
```typescript
const config = {
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxMemoryEntries: 1000
};
```

**Cache key patterns:**
- Library resolution: `resolve:${libraryName}`
- Documentation: `docs:${libraryId}:${topic}:${tokens}`
- Comprehensive: `comprehensive:${topic}:${maxLibraries}`

### 2. Error Handling

**Implement graceful fallbacks:**
```typescript
try {
  const docs = await context7Service.getLibraryDocumentation(libraryId, topic);
  return docs;
} catch (error) {
  // Fallback to cached docs or mock documentation
  return await getCachedDocumentation(libraryId) || getMockDocumentation(libraryId);
}
```

**Use circuit breaker pattern:**
```typescript
if (this.connectionRetries >= this.maxConnectionRetries) {
  this.isConnected = false;
  throw new Error('Context7 service unavailable');
}
```

### 3. Request Optimization

**Batch requests when possible:**
```typescript
// Instead of multiple individual requests
const promises = libraries.map(lib => 
  context7Service.getLibraryDocumentation(lib.id, topic)
);
const docs = await Promise.allSettled(promises);
```

**Use appropriate token limits:**
- General queries: 2000-3000 tokens
- Specific topics: 1000-2000 tokens
- Comprehensive docs: 4000-5000 tokens

### 4. MCP Protocol Usage

**Proper MCP request format:**
```typescript
const mcpRequest = {
  jsonrpc: '2.0',
  id: Date.now(),
  method: 'tools/call',
  params: {
    name: 'resolve-library-id',
    arguments: {
      libraryName: query
    }
  }
};
```

**Handle SSE responses:**
```typescript
const contentType = response.headers.get('content-type');
if (contentType && contentType.includes('text/event-stream')) {
  return await this.parseSSEResponse(response);
}
```

## Context7 Integration Benefits

### Enhanced Documentation Caching
Context7 provides PromptMCP with:
- **Real-time Framework Docs**: Always up-to-date documentation for popular frameworks
- **Intelligent Caching**: Reduces API calls and improves response times
- **Library Resolution**: Automatically finds the right documentation for any library
- **Comprehensive Coverage**: Access to multiple libraries and their best practices

### Context Pipeline Enhancement
```typescript
// Context7 enhances the context gathering process
const context = await this.gatherContext(prompt, framework);
// Context7 provides additional framework-specific documentation
// that gets combined with local RAG and vector database results
```

### MCP Tool Coordination
PromptMCP acts as a coordinator that:
- Uses Context7 MCP for documentation retrieval
- Combines Context7 docs with other MCP tool results
- Provides enhanced context to other MCP servers
- Caches responses for offline operation

## Monitoring and Debugging

### Health Checks

```typescript
// Check Context7 service health
const isHealthy = await context7Service.healthCheck();
console.log('Context7 Status:', isHealthy ? 'Connected' : 'Disconnected');
```

### Cache Statistics

```typescript
// Monitor cache performance
const stats = context7Service.getCacheStats();
console.log(`Cache Hit Rate: ${stats.hitRate}%`);
console.log(`Cache Size: ${stats.size} entries`);
```

### Logging

```typescript
// Enable detailed logging
this.logger.info('Context7 MCP request', { 
  method: 'resolve-library-id',
  libraryName: query.query 
});
```

## Troubleshooting

### Common Issues

1. **API Key Issues**
   ```bash
   # Check if API key is set
   echo $CONTEXT7_API_KEY
   
   # Test API key validity
   npm run test:context7
   ```

2. **Connection Timeouts**
   ```typescript
   // Increase timeout
   const config = {
     timeout: 30000, // 30 seconds
     retryAttempts: 3,
     retryDelay: 1000
   };
   ```

3. **Cache Issues**
   ```typescript
   // Clear cache if needed
   context7Service.clearCache();
   
   // Check cache configuration
   const stats = context7Service.getCacheStats();
   ```

4. **MCP Protocol Errors**
   ```typescript
   // Verify MCP request format
   const mcpRequest = {
     jsonrpc: '2.0',
     id: Date.now(),
     method: 'tools/call',
     params: { /* ... */ }
   };
   ```

### Testing Context7 Integration

```bash
# Test Context7 API key
npm run test:context7-key

# Test Context7 MCP connection
npm run test:context7-mcp

# Test full integration
npm run test:context7-real
```

## Performance Optimization

### 1. Caching Strategy
- Enable caching for all Context7 requests
- Use appropriate TTL based on documentation update frequency
- Implement cache cleanup for memory management

### 2. Request Batching
- Batch multiple library requests when possible
- Use Promise.allSettled for parallel requests
- Implement request deduplication

### 3. Token Management
- Use appropriate token limits for different use cases
- Implement token usage monitoring
- Cache responses to reduce API calls

### 4. Connection Pooling
- Reuse HTTP connections when possible
- Implement connection health checks
- Use keep-alive for persistent connections

## Security Considerations

### 1. API Key Protection
- Store API keys in environment variables
- Never commit API keys to version control
- Use secure key management in production

### 2. Request Validation
- Validate all input parameters
- Sanitize library names and topics
- Implement rate limiting

### 3. Error Handling
- Don't expose sensitive error details
- Log errors securely
- Implement proper fallback mechanisms

## Future Enhancements

### Planned Features
1. **Advanced Caching**: Redis-based distributed caching
2. **Offline Mode**: Complete offline operation with cached docs
3. **Custom Libraries**: Support for private/internal libraries
4. **Analytics**: Usage tracking and optimization insights
5. **Webhooks**: Real-time documentation updates

### Integration Improvements
1. **Streaming Responses**: Real-time documentation streaming
2. **GraphQL Support**: More efficient data fetching
3. **Custom MCP Tools**: Specialized tools for specific frameworks
4. **AI-Powered Caching**: Intelligent cache invalidation

## Resources

- [Context7 GitHub Repository](https://github.com/upstash/context7)
- [Context7 Documentation](https://context7.com)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [PromptMCP Project Repository](https://github.com/your-org/promptmcp)

## Support

For Context7 integration issues:
1. Check the troubleshooting section above
2. Review Context7 service logs
3. Test with the provided test scripts
4. Check Context7 service status at [status.context7.com](https://status.context7.com)

For PromptMCP-specific issues:
1. Check PromptMCP logs in `./logs/`
2. Review configuration in `.env`
3. Test individual components with provided test scripts
4. Check the admin console at `http://localhost:3001`

---

*This guide is part of the PromptMCP project - a local MCP server for vibe coders who want AI assistance for technical decisions without deep framework expertise.*
