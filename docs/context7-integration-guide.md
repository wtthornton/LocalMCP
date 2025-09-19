# Context7 Integration Guide

## Overview

This guide explains how the Dynamic Framework Detection system integrates with Context7 to provide universal library documentation support. The integration replaces hardcoded framework mappings with dynamic Context7 library resolution.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Prompt Input  │───▶│  Library Names   │───▶│ Context7 Resolve│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Pattern/AI/Proj │───▶│  Library Matches │───▶│ Context7 Docs   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Cache Results   │───▶│  Return Docs    │
                       └──────────────────┘    └─────────────────┘
```

## Context7 Integration Flow

### 1. Library Name Extraction

The system extracts potential library names from three sources:

**Pattern Matching:**
```typescript
// Regex patterns extract library names
"create a React component" → "react"
"using Vue framework" → "vue"
"with Tailwind library" → "tailwind"
```

**AI Suggestions:**
```typescript
// AI analyzes prompt and suggests libraries
"build a web app" → ["nextjs", "react", "typescript"]
"create a Python API" → ["fastapi", "django", "flask"]
```

**Project Context:**
```typescript
// Project dependencies and file analysis
{
  dependencies: { "react": "^18.0.0" },
  suggestedFrameworks: ["react", "typescript"]
}
```

### 2. Context7 Library Resolution

Each library name is resolved with Context7:

```typescript
// Resolve library ID
const libraryId = await context7Service.resolveLibraryId('react');
// Returns: '/facebook/react'

// Get library documentation
const docs = await context7Service.getLibraryDocs('/facebook/react', {
  topic: 'components',
  tokens: 2000
});
```

### 3. Intelligent Caching

Results are cached to reduce token costs:

```typescript
// Check cache first
const cached = await cacheService.getCachedDocs('react');
if (cached) {
  return cached; // Use cached result
}

// Get fresh docs and cache
const docs = await context7Service.getLibraryDocs(libraryId, options);
await cacheService.cacheDocs('react', libraryId, docs);
```

## Context7 Service Integration

### MCP Compliance

The system uses MCP (Model Context Protocol) for Context7 integration:

```typescript
// Resolve library ID
const resolveResult = await mcpCompliance.executeToolCall('resolve-library-id', {
  libraryName: 'react'
});

// Get library documentation
const docsResult = await mcpCompliance.executeToolCall('get-library-docs', {
  context7CompatibleLibraryID: '/facebook/react',
  topic: 'components',
  tokens: 2000
});
```

### Error Handling

```typescript
try {
  const libraryId = await context7Service.resolveLibraryId(name);
  const docs = await context7Service.getLibraryDocs(libraryId, options);
  return { libraryId, docs };
} catch (error) {
  console.warn(`Failed to resolve ${name}`, error);
  return null; // Graceful degradation
}
```

## Library Detection Patterns

### Supported Patterns

The system detects libraries from various patterns:

**Component Patterns:**
- `create a {name} component`
- `build a {name} component`
- `{name} component`

**Framework Patterns:**
- `using {name} framework`
- `with {name} framework`
- `{name} framework`

**Library Patterns:**
- `with {name} library`
- `using {name} library`
- `{name} library`

**App Patterns:**
- `build {name} app`
- `create {name} app`
- `{name} app`

### Pattern Weights

Different patterns have different confidence weights:

```typescript
const patternWeights = {
  component: 0.9,  // High confidence
  framework: 0.8,  // High confidence
  library: 0.7,    // Medium confidence
  app: 0.6         // Medium confidence
};
```

## AI-Powered Suggestions

### AI Analysis Prompt

```typescript
const analysisPrompt = `
Analyze this development prompt and suggest 3-5 most relevant library/framework names:

Prompt: "${prompt}"

Requirements:
- Return only library names, one per line
- Focus on frameworks, UI libraries, and development tools
- Be specific (e.g., "react" not "javascript framework")
- Consider the context and technology stack
- Prioritize popular, well-documented libraries
`;
```

### AI Response Parsing

```typescript
// Parse AI response
const suggestions = response.split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(line => line.replace(/^[-*]\s*/, '').toLowerCase())
  .filter(name => isValidLibraryName(name));
```

## Project Context Analysis

### Dependency Analysis

```typescript
// Extract from package.json
const dependencies = {
  ...packageJson.dependencies || {},
  ...packageJson.devDependencies || {},
  ...packageJson.peerDependencies || {}
};

// Map dependencies to frameworks
const frameworkMap = {
  'react': 'react',
  'vue': 'vue',
  'angular': 'angular',
  'next': 'nextjs',
  'nuxt': 'nuxt'
};
```

### File Structure Analysis

```typescript
// Detect framework-specific files
const frameworkPatterns = {
  'react': ['src/**/*.jsx', 'src/**/*.tsx'],
  'vue': ['src/**/*.vue'],
  'angular': ['src/**/*.component.ts'],
  'nextjs': ['pages/**/*.js', 'app/**/*.js']
};
```

## Caching Strategy

### Cache Structure

```typescript
interface Context7CacheEntry {
  libraryId: string;
  docs: any;
  timestamp: number;
}
```

### Cache Operations

```typescript
// Get cached docs
async getCachedDocs(libraryName: string): Promise<Context7CacheEntry | null> {
  const cached = this.cache.get(libraryName);
  if (cached && this.isCacheValid(cached)) {
    return cached;
  }
  return null;
}

// Cache docs
async cacheDocs(libraryName: string, libraryId: string, docs: any): Promise<void> {
  this.cache.set(libraryName, {
    libraryId,
    docs,
    timestamp: Date.now()
  });
}
```

### Cache Invalidation

```typescript
// TTL-based invalidation
private isCacheValid(entry: Context7CacheEntry): boolean {
  return Date.now() - entry.timestamp < this.TTL;
}

// Manual cache clearing
clearCache(): void {
  this.cache.clear();
}
```

## Performance Optimization

### Parallel Processing

```typescript
// Process multiple libraries in parallel
const docPromises = libraries.map(async (library) => {
  try {
    const libraryId = await context7Service.resolveLibraryId(library);
    const docs = await context7Service.getLibraryDocs(libraryId, options);
    return { library, libraryId, docs };
  } catch (error) {
    return null;
  }
});

const results = await Promise.all(docPromises);
```

### Token Distribution

```typescript
// Distribute tokens evenly across libraries
const tokensPerLibrary = Math.floor(maxTokens / libraries.length);

for (const library of libraries) {
  const docs = await context7Service.getLibraryDocs(libraryId, {
    tokens: tokensPerLibrary
  });
}
```

## Error Handling

### Graceful Degradation

```typescript
// Handle Context7 service failures
try {
  const result = await context7Service.resolveLibraryId(name);
  return result;
} catch (error) {
  console.warn(`Context7 resolution failed for ${name}`, error);
  return null; // Continue with other libraries
}
```

### Fallback Strategies

```typescript
// Multiple fallback strategies
1. Try Context7 resolution
2. Check cache for similar libraries
3. Use AI suggestions as fallback
4. Return empty result with helpful message
```

## Monitoring and Metrics

### Key Metrics

```typescript
interface Context7Metrics {
  totalResolutions: number;
  successfulResolutions: number;
  cacheHitRate: number;
  averageResolutionTime: number;
  errorRate: number;
  tokenUsage: number;
}
```

### Health Checks

```typescript
// Context7 service health
const health = await context7Service.healthCheck();
if (health.status !== 'healthy') {
  // Fall back to cached results or AI suggestions
}
```

## Configuration

### Context7 Configuration

```typescript
interface Context7Config {
  enabled: boolean;
  timeoutMs: number;
  maxTokens: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  retryAttempts: number;
  retryDelayMs: number;
}
```

### Default Settings

```typescript
const defaultConfig = {
  enabled: true,
  timeoutMs: 10000,
  maxTokens: 2000,
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  retryAttempts: 3,
  retryDelayMs: 1000
};
```

## Testing

### Unit Tests

```typescript
describe('Context7 Integration', () => {
  it('should resolve library IDs', async () => {
    mockContext7Service.resolveLibraryId.mockResolvedValue('/facebook/react');
    const result = await detector.detectFrameworks('create a React component');
    expect(result.context7Libraries).toContain('/facebook/react');
  });
});
```

### Integration Tests

```typescript
describe('Context7 Integration', () => {
  it('should get library documentation', async () => {
    const docs = await context7Service.getLibraryDocs('/facebook/react', {
      topic: 'components',
      tokens: 2000
    });
    expect(docs).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

**Context7 Service Unavailable**
- Check service health
- Verify API credentials
- Check network connectivity

**High Token Usage**
- Enable caching
- Reduce max tokens per request
- Optimize library selection

**Slow Performance**
- Check Context7 service latency
- Review cache hit rates
- Optimize parallel processing

### Debug Mode

```typescript
// Enable debug logging
const detector = new FrameworkDetectorService(
  context7Service,
  cacheService,
  aiService,
  { debug: true }
);
```

## Best Practices

1. **Enable Caching**: Always enable caching to reduce token costs
2. **Handle Failures**: Implement graceful degradation for service failures
3. **Monitor Performance**: Track metrics and optimize as needed
4. **Use Parallel Processing**: Process multiple libraries simultaneously
5. **Validate Results**: Check Context7 responses before caching
6. **Optimize Token Usage**: Distribute tokens efficiently across libraries

## Migration Guide

### From Hardcoded to Dynamic

**Before:**
```typescript
// Hardcoded framework mappings
const frameworks = {
  'react': '/facebook/react',
  'vue': '/vuejs/vue',
  'angular': '/angular/angular'
};
```

**After:**
```typescript
// Dynamic Context7 resolution
const libraryId = await context7Service.resolveLibraryId('any-library-name');
```

### Benefits

- **Universal Support**: Works with any Context7 library
- **Zero Maintenance**: No need to update hardcoded mappings
- **Better Accuracy**: Multi-source detection improves results
- **Lower Costs**: Intelligent caching reduces token usage
- **Future-Proof**: Automatically supports new libraries
