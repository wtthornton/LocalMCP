# Dynamic Framework Detection Guide

## Overview

The Dynamic Framework Detection system automatically detects frameworks and libraries from prompts using pattern matching, AI suggestions, and project context analysis. This replaces hardcoded framework mappings with a universal approach that works with any Context7 library.

## Key Features

- **Universal Detection**: Works with any Context7 library, not just hardcoded frameworks
- **Multi-Source Detection**: Uses patterns, AI, and project context for comprehensive detection
- **Intelligent Caching**: Reduces token costs with smart Context7 library caching
- **Project-Aware**: Analyzes actual project dependencies and file structure
- **High Performance**: <10ms detection time with parallel processing

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Prompt Input  │───▶│ Pattern Matching │───▶│ Context7 Resolve│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Project Context │───▶│   AI Suggestion  │───▶│   Cache Check   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Combine & Dedup │───▶│  Return Results │
                       └──────────────────┘    └─────────────────┘
```

## Detection Methods

### 1. Pattern-Based Detection

Detects libraries from natural language patterns in prompts:

```typescript
// Examples of detected patterns
"create a React component" → react
"using Vue framework" → vue
"with Tailwind library" → tailwind
"build Next.js app" → nextjs
```

**Pattern Types:**
- Component patterns: `create a {name} component`
- Framework patterns: `using {name} framework`
- Library patterns: `with {name} library`
- App patterns: `build {name} app`

### 2. AI-Powered Detection

Uses AI to suggest relevant libraries for generic prompts:

```typescript
// AI analysis for generic prompts
"build a modern web application" → [nextjs, react, typescript]
"create a Python API" → [fastapi, django, flask]
"build a mobile app" → [react-native, flutter, ionic]
```

**AI Configuration:**
- Max suggestions: 5
- Confidence threshold: 0.7
- Timeout: 5 seconds

### 3. Project Context Detection

Analyzes project structure and dependencies:

```typescript
// Project context analysis
{
  dependencies: { "react": "^18.0.0", "typescript": "^5.0.0" },
  fileStructure: ["src/components/", "src/pages/"],
  frameworkFiles: ["src/App.tsx", "src/index.tsx"],
  suggestedFrameworks: ["react", "typescript"]
}
```

## Usage

### Basic Usage

```typescript
import { FrameworkDetectorService, Context7CacheService } from './framework-detector';

const cacheService = new Context7CacheService();
const detector = new FrameworkDetectorService(context7Service, cacheService);

// Detect frameworks from prompt
const result = await detector.detectFrameworks('create a React component with hooks');

console.log(result);
// {
//   detectedFrameworks: ['react'],
//   confidence: 0.9,
//   suggestions: ['Detected react (pattern)'],
//   context7Libraries: ['/facebook/react'],
//   detectionMethod: 'pattern'
// }
```

### With Project Context

```typescript
const projectContext = {
  dependencies: { "react": "^18.0.0", "typescript": "^5.0.0" },
  fileStructure: ["src/components/", "src/pages/"],
  frameworkFiles: ["src/App.tsx"],
  suggestedFrameworks: ["react", "typescript"]
};

const result = await detector.detectFrameworks(
  'create a component',
  projectContext
);
```

### Integration with PromptMCP

```typescript
// The enhance tool automatically uses dynamic detection
const enhanced = await enhanceTool.enhance({
  prompt: 'create a fancy React component',
  context: { projectContext: projectAnalysis }
});
```

## Configuration

### Framework Detection Config

```typescript
interface FrameworkDetectionConfig {
  enabled: boolean;
  confidenceThreshold: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  aiEnabled: boolean;
  patternDetectionEnabled: boolean;
  projectContextEnabled: boolean;
  maxLibrariesPerDetection: number;
  aiTimeoutMs: number;
}
```

### Default Configuration

```typescript
const defaultConfig = {
  enabled: true,
  confidenceThreshold: 0.3,
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  aiEnabled: true,
  patternDetectionEnabled: true,
  projectContextEnabled: true,
  maxLibrariesPerDetection: 5,
  aiTimeoutMs: 5000
};
```

## Performance

### Benchmarks

- **Detection Time**: <10ms for simple prompts
- **Cache Hit Rate**: ≥70% for repeated libraries
- **Context7 Utilization**: ≥95% of prompts get relevant docs
- **Token Efficiency**: ≤2 Context7 calls per detection

### Optimization Features

- **Parallel Processing**: Multiple Context7 calls processed simultaneously
- **Intelligent Caching**: TTL-based cache with automatic cleanup
- **Pattern Pre-compilation**: Regex patterns compiled once
- **Memory Management**: Efficient cache storage and cleanup

## Error Handling

### Graceful Degradation

The system handles failures gracefully:

```typescript
// AI service failure
if (!aiService) {
  return []; // Continue without AI suggestions
}

// Context7 resolution failure
try {
  const libraryId = await context7Service.resolveLibraryId(name);
} catch (error) {
  console.warn(`Failed to resolve ${name}`, error);
  // Continue with other libraries
}

// Complete failure fallback
return {
  detectedFrameworks: [],
  confidence: 0,
  suggestions: ['No frameworks detected. Try being more specific.'],
  context7Libraries: [],
  detectionMethod: 'fallback'
};
```

### Error Types

- **AI Service Unavailable**: Falls back to pattern detection only
- **Context7 Service Down**: Returns empty results with helpful suggestions
- **Invalid Library Names**: Filtered out during validation
- **Cache Failures**: Continues without caching

## Monitoring

### Metrics Tracked

```typescript
interface DetectionMetrics {
  totalDetections: number;
  successfulDetections: number;
  averageConfidence: number;
  frameworkDistribution: Record<string, number>;
  cacheHitRate: number;
  detectionMethodDistribution: Record<string, number>;
  averageDetectionTime: number;
}
```

### Health Checks

```typescript
const health = await detector.getHealthStatus();
// {
//   status: 'healthy' | 'degraded' | 'unhealthy',
//   components: {
//     context7: boolean,
//     cache: boolean,
//     ai: boolean
//   },
//   metrics: DetectionMetrics
// }
```

## Testing

### Test Coverage

- **Unit Tests**: 90%+ coverage for all detection methods
- **Integration Tests**: Context7 service integration
- **Performance Tests**: Detection time benchmarks
- **Error Handling Tests**: Graceful failure scenarios

### Test Categories

1. **Pattern-Based Detection**: Tests regex pattern matching
2. **AI-Powered Detection**: Tests AI service integration
3. **Project Context Detection**: Tests project analysis
4. **Caching**: Tests cache hit/miss scenarios
5. **Error Handling**: Tests failure scenarios
6. **Performance**: Tests detection speed

## Troubleshooting

### Common Issues

**Low Detection Accuracy**
- Check pattern configuration
- Verify AI service availability
- Review confidence thresholds

**High Token Costs**
- Enable caching
- Reduce max libraries per detection
- Check cache hit rates

**Slow Performance**
- Review detection patterns
- Check Context7 service latency
- Monitor cache performance

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const detector = new FrameworkDetectorService(
  context7Service,
  cacheService,
  aiService,
  { debug: true }
);
```

## Migration from Hardcoded Detection

### Before (Hardcoded)

```typescript
// Only worked with 8 hardcoded frameworks
const frameworks = ['react', 'vue', 'angular', 'tailwind', ...];
```

### After (Dynamic)

```typescript
// Works with any Context7 library
const result = await detector.detectFrameworks(prompt);
// Automatically detects any library mentioned in prompt
```

### Benefits

- **Universal Coverage**: Works with any Context7 library
- **Zero Maintenance**: No need to update hardcoded mappings
- **Better Accuracy**: Multi-source detection improves accuracy
- **Lower Costs**: Intelligent caching reduces token usage
- **Future-Proof**: Automatically supports new libraries

## Best Practices

1. **Use Project Context**: Provide project analysis for better detection
2. **Enable Caching**: Reduce token costs with intelligent caching
3. **Monitor Performance**: Track metrics and optimize as needed
4. **Handle Failures**: Implement graceful degradation
5. **Test Thoroughly**: Cover all detection methods and edge cases

## API Reference

### FrameworkDetectorService

```typescript
class FrameworkDetectorService {
  constructor(
    context7Service: any,
    cacheService: Context7CacheService,
    aiService?: any
  );
  
  async detectFrameworks(
    prompt: string,
    projectContext?: ProjectContext
  ): Promise<FrameworkDetectionResult>;
  
  getMetrics(): DetectionMetrics;
}
```

### Context7CacheService

```typescript
class Context7CacheService {
  constructor(ttl?: number);
  
  async getCachedDocs(libraryName: string): Promise<Context7CacheEntry | null>;
  async cacheDocs(libraryName: string, libraryId: string, docs: any): Promise<void>;
  clearCache(): void;
  getCacheStats(): CacheStats;
}
```

### ProjectContextAnalyzer

```typescript
class ProjectContextAnalyzer {
  async analyzeProjectContext(projectPath: string): Promise<ProjectContext>;
  async getComprehensiveAnalysis(projectPath: string): Promise<ProjectAnalysisResult>;
}
```
