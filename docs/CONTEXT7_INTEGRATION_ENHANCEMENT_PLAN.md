# Context7 Integration Enhancement Plan for PromptMCP

## Executive Summary

After reviewing the current Context7 integration and codebase, this document outlines a comprehensive enhancement plan to fully integrate Context7 with PromptMCP's core tool (`promptmcp.enhance`). The current implementation has solid foundations but lacks the complete integration needed for the vibe coder experience.

## Current State Analysis

### ✅ What's Working Well

1. **Context7 Service Layer**: Multiple service implementations exist with good architecture
   - `Context7Service` - Direct HTTP integration
   - `Context7MCPClientReal` - Real MCP client with SSE support
   - `Context7MCPClientService` - Advanced caching and event-driven architecture

2. **Context Pipeline**: `ContextPipeline` orchestrates Context7 integration with other services

3. **Configuration**: Comprehensive config system with Context7 settings

4. **MCP Server Foundation**: Basic MCP server structure exists

### ❌ Critical Gaps Identified

1. **Single Core Tool**: Only `promptmcp.enhance` is implemented, which is correct
2. **No Context7 Integration in Tools**: Current tools don't leverage Context7 capabilities
3. **Incomplete MCP Tool Registry**: Missing the 4 core PromptMCP tools
4. **No Dynamic Pipeline**: Missing the invisible dynamic pipeline processing
5. **Limited Error Handling**: No graceful fallbacks for Context7 failures
6. **No Learning Integration**: Context7 docs aren't captured in lessons learned

## Enhancement Plan

### Phase 1: Core Tool Implementation (Week 1)

#### 1.1 Implement Missing Core Tools

**Priority: CRITICAL**

Create the 4 core PromptMCP tools that are currently missing:

```typescript
// src/tools/analyze.ts
export class AnalyzeTool {
  async analyze(request: AnalyzeRequest): Promise<AnalysisResult> {
    // Project structure analysis
    // Dependency analysis
    // Code quality assessment
    // Context7 framework detection and documentation
  }
}

// src/tools/create.ts
export class CreateTool {
  async create(request: CreateRequest): Promise<CreateResult> {
    // Code generation based on description
    // Framework-specific best practices from Context7
    // Project pattern matching
  }
}

// src/tools/fix.ts
export class FixTool {
  async fix(request: FixRequest): Promise<FixResult> {
    // Error analysis and classification
    // Context7 documentation for error resolution
    // Code modification with validation
  }
}

// src/tools/learn.ts
export class LearnTool {
  async learn(request: LearnRequest): Promise<LearnResult> {
    // Pattern capture and storage
    // Context7 documentation integration
    // Lesson retrieval and application
  }
}
```

#### 1.2 Context7 Integration in Core Tools

**Priority: HIGH**

Integrate Context7 into each core tool:

```typescript
// Enhanced Analyze Tool with Context7
export class AnalyzeTool {
  constructor(
    private context7Service: Context7Service,
    private contextPipeline: ContextPipeline
  ) {}

  async analyze(request: AnalyzeRequest): Promise<AnalysisResult> {
    // 1. Detect framework from project structure
    const framework = await this.detectFramework(request.projectPath);
    
    // 2. Get Context7 documentation for framework
    const context7Docs = await this.context7Service.getCachedDocumentation(framework);
    
    // 3. Analyze project with framework context
    const analysis = await this.performAnalysis(request.projectPath, context7Docs);
    
    return analysis;
  }
}
```

#### 1.3 MCP Tool Registry Enhancement

**Priority: HIGH**

Update MCP server to register the core tool:

```typescript
// src/mcp/server.ts
private initializeTools(): void {
  // Add the core tool
  this.tools.set('promptmcp.enhance', {
    name: 'promptmcp.enhance',
    description: 'Enhance prompts with perfect project context and framework detection',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt to enhance' },
        context: { 
          type: 'object', 
          properties: {
            file: { type: 'string', description: 'Optional file path for context' },
            framework: { type: 'string', description: 'Optional framework for context' },
            style: { type: 'string', description: 'Optional style preference' }
          },
          description: 'Additional context for enhancement' 
        }
      },
      required: ['prompt']
    }
  });
}
```

### Phase 2: Dynamic Pipeline Integration (Week 2)

#### 2.1 Invisible Dynamic Pipeline

**Priority: HIGH**

Implement the dynamic pipeline that runs behind every tool call:

```typescript
// src/pipeline/dynamic-pipeline.ts
export class DynamicPipeline {
  constructor(
    private context7Service: Context7Service,
    private vectorService: VectorService,
    private lessonService: LessonService
  ) {}

  async processRequest(toolName: string, request: any): Promise<EnhancedRequest> {
    // Stage 1: Context Gathering
    const context = await this.gatherContext(request);
    
    // Stage 2: Framework Detection
    const framework = await this.detectFramework(request, context);
    
    // Stage 3: Context7 Documentation Retrieval
    const context7Docs = await this.getContext7Documentation(framework, toolName);
    
    // Stage 4: Project Pattern Matching
    const patterns = await this.matchProjectPatterns(request, context);
    
    // Stage 5: Lesson Application
    const lessons = await this.applyRelevantLessons(toolName, framework, patterns);
    
    return {
      ...request,
      context,
      framework,
      context7Docs,
      patterns,
      lessons
    };
  }
}
```

#### 2.2 Context7 Caching Enhancement

**Priority: MEDIUM**

Improve Context7 caching for better performance:

```typescript
// src/services/context7/context7-cache.service.ts
export class Context7CacheService {
  private cache: Map<string, Context7CacheEntry> = new Map();
  private sqliteCache: Database;

  async getCachedDocumentation(
    libraryId: string, 
    topic: string, 
    tokens: number
  ): Promise<string | null> {
    const cacheKey = this.generateCacheKey(libraryId, topic, tokens);
    
    // Check memory cache first
    const memoryEntry = this.cache.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }
    
    // Check SQLite cache
    const sqliteEntry = await this.getFromSQLite(cacheKey);
    if (sqliteEntry && !this.isExpired(sqliteEntry)) {
      // Promote to memory cache
      this.cache.set(cacheKey, sqliteEntry);
      return sqliteEntry.data;
    }
    
    return null;
  }

  async setCachedDocumentation(
    libraryId: string, 
    topic: string, 
    tokens: number, 
    data: string
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(libraryId, topic, tokens);
    const entry: Context7CacheEntry = {
      key: cacheKey,
      data,
      timestamp: new Date(),
      ttl: this.calculateTTL(topic),
      hits: 0
    };
    
    // Store in both caches
    this.cache.set(cacheKey, entry);
    await this.storeInSQLite(entry);
  }
}
```

### Phase 3: Advanced Context7 Integration (Week 3)

#### 3.1 Smart Framework Detection

**Priority: MEDIUM**

Implement intelligent framework detection using Context7:

```typescript
// src/services/framework-detector.service.ts
export class FrameworkDetectorService {
  constructor(private context7Service: Context7Service) {}

  async detectFramework(projectPath: string): Promise<FrameworkInfo> {
    // 1. Analyze package.json dependencies
    const dependencies = await this.analyzeDependencies(projectPath);
    
    // 2. Use Context7 to resolve framework names
    const frameworkCandidates = await this.resolveFrameworks(dependencies);
    
    // 3. Analyze project structure
    const structure = await this.analyzeProjectStructure(projectPath);
    
    // 4. Match with Context7 documentation
    const bestMatch = await this.findBestFrameworkMatch(
      frameworkCandidates, 
      structure
    );
    
    return bestMatch;
  }

  private async resolveFrameworks(dependencies: string[]): Promise<FrameworkInfo[]> {
    const results: FrameworkInfo[] = [];
    
    for (const dep of dependencies) {
      try {
        const libraries = await this.context7Service.resolveLibraryId(dep);
        const bestLibrary = libraries
          .sort((a, b) => b.trustScore - a.trustScore)[0];
        
        if (bestLibrary) {
          results.push({
            name: dep,
            context7Id: bestLibrary.id,
            trustScore: bestLibrary.trustScore,
            confidence: this.calculateConfidence(bestLibrary, dep)
          });
        }
      } catch (error) {
        // Continue with other dependencies
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}
```

#### 3.2 Context7-Enhanced Code Generation

**Priority: HIGH**

Integrate Context7 documentation into code generation:

```typescript
// src/services/code-generator.service.ts
export class CodeGeneratorService {
  constructor(
    private context7Service: Context7Service,
    private frameworkDetector: FrameworkDetectorService
  ) {}

  async generateCode(request: CreateRequest): Promise<CreateResult> {
    // 1. Detect framework
    const framework = await this.frameworkDetector.detectFramework(request.projectPath);
    
    // 2. Get Context7 documentation for best practices
    const bestPractices = await this.getBestPractices(framework, request.description);
    
    // 3. Get code examples from Context7
    const examples = await this.getCodeExamples(framework, request.description);
    
    // 4. Generate code with Context7 guidance
    const generatedCode = await this.generateWithContext7(
      request.description,
      bestPractices,
      examples,
      framework
    );
    
    return {
      code: generatedCode,
      framework: framework.name,
      bestPractices: bestPractices.summary,
      examples: examples.slice(0, 3) // Top 3 examples
    };
  }

  private async getBestPractices(
    framework: FrameworkInfo, 
    description: string
  ): Promise<Context7Documentation> {
    const topics = this.extractTopics(description);
    const topic = topics[0] || 'best practices';
    
    return await this.context7Service.getLibraryDocumentation(
      framework.context7Id,
      topic,
      4000
    );
  }
}
```

### Phase 4: Learning and Pattern Integration (Week 4)

#### 4.1 Context7-Enhanced Learning System

**Priority: MEDIUM**

Integrate Context7 documentation into the learning system:

```typescript
// src/services/lesson-learner.service.ts
export class LessonLearnerService {
  constructor(
    private context7Service: Context7Service,
    private vectorService: VectorService
  ) {}

  async capturePattern(
    pattern: string, 
    solution: string, 
    context: any
  ): Promise<Lesson> {
    // 1. Extract framework from context
    const framework = await this.extractFrameworkFromContext(context);
    
    // 2. Get relevant Context7 documentation
    const context7Docs = framework ? 
      await this.context7Service.getCachedDocumentation(framework) : null;
    
    // 3. Create enhanced lesson with Context7 context
    const lesson: Lesson = {
      id: this.generateId(),
      pattern,
      solution,
      framework,
      context7Context: context7Docs,
      confidence: this.calculateConfidence(pattern, solution),
      timestamp: new Date(),
      usageCount: 0
    };
    
    // 4. Store in vector database for semantic search
    await this.vectorService.storeLesson(lesson);
    
    return lesson;
  }

  async findRelevantLessons(
    query: string, 
    framework?: string
  ): Promise<Lesson[]> {
    // 1. Search vector database for similar patterns
    const vectorResults = await this.vectorService.searchLessons(query);
    
    // 2. Filter by framework if specified
    const filteredResults = framework ? 
      vectorResults.filter(lesson => lesson.framework === framework) :
      vectorResults;
    
    // 3. Get Context7 documentation for top results
    const enhancedResults = await Promise.all(
      filteredResults.slice(0, 5).map(async (lesson) => {
        if (lesson.framework && !lesson.context7Context) {
          const context7Docs = await this.context7Service.getCachedDocumentation(
            lesson.framework
          );
          return { ...lesson, context7Context: context7Docs };
        }
        return lesson;
      })
    );
    
    return enhancedResults;
  }
}
```

#### 4.2 Error Fixing with Context7

**Priority: HIGH**

Enhance error fixing with Context7 documentation:

```typescript
// src/services/error-fixer.service.ts
export class ErrorFixerService {
  constructor(
    private context7Service: Context7Service,
    private lessonLearner: LessonLearnerService
  ) {}

  async fixError(request: FixRequest): Promise<FixResult> {
    // 1. Analyze error type and context
    const errorAnalysis = await this.analyzeError(request.code, request.error);
    
    // 2. Detect framework
    const framework = await this.detectFrameworkFromCode(request.code);
    
    // 3. Get Context7 documentation for error resolution
    const errorDocs = framework ? 
      await this.getErrorDocumentation(framework, errorAnalysis.type) : null;
    
    // 4. Find similar patterns in lessons learned
    const similarLessons = await this.lessonLearner.findRelevantLessons(
      errorAnalysis.description,
      framework
    );
    
    // 5. Generate fix with Context7 guidance
    const fix = await this.generateFix(
      request.code,
      errorAnalysis,
      errorDocs,
      similarLessons
    );
    
    return {
      fixedCode: fix.code,
      explanation: fix.explanation,
      confidence: fix.confidence,
      framework: framework?.name,
      context7Guidance: errorDocs?.summary,
      appliedLessons: similarLessons.slice(0, 3).map(l => l.id)
    };
  }

  private async getErrorDocumentation(
    framework: FrameworkInfo, 
    errorType: string
  ): Promise<Context7Documentation> {
    const topics = [
      `error handling ${errorType}`,
      `troubleshooting ${errorType}`,
      `common errors ${framework.name}`
    ];
    
    for (const topic of topics) {
      try {
        const docs = await this.context7Service.getLibraryDocumentation(
          framework.context7Id,
          topic,
          3000
        );
        if (docs.content) return docs;
      } catch (error) {
        // Try next topic
      }
    }
    
    return null;
  }
}
```

### Phase 5: Performance and Reliability (Week 5)

#### 5.1 Circuit Breaker Pattern

**Priority: MEDIUM**

Implement circuit breaker for Context7 requests:

```typescript
// src/services/circuit-breaker.service.ts
export class CircuitBreakerService {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

#### 5.2 Metrics and Monitoring

**Priority: LOW**

Add comprehensive metrics for Context7 integration:

```typescript
// src/services/metrics.service.ts
export class MetricsService {
  private metrics = {
    context7: {
      requests: 0,
      cacheHits: 0,
      errors: 0,
      avgResponseTime: 0,
      successRate: 0
    },
    tools: {
      analyze: { calls: 0, avgTime: 0, successRate: 0 },
      create: { calls: 0, avgTime: 0, successRate: 0 },
      fix: { calls: 0, avgTime: 0, successRate: 0 },
      learn: { calls: 0, avgTime: 0, successRate: 0 }
    }
  };

  recordContext7Request(responseTime: number, success: boolean): void {
    this.metrics.context7.requests++;
    this.updateAvgResponseTime(responseTime);
    
    if (success) {
      this.metrics.context7.successRate = 
        (this.metrics.context7.successRate * (this.metrics.context7.requests - 1) + 1) / 
        this.metrics.context7.requests;
    } else {
      this.metrics.context7.errors++;
    }
  }

  recordToolCall(toolName: string, responseTime: number, success: boolean): void {
    const tool = this.metrics.tools[toolName];
    if (tool) {
      tool.calls++;
      tool.avgTime = (tool.avgTime * (tool.calls - 1) + responseTime) / tool.calls;
      
      if (success) {
        tool.successRate = (tool.successRate * (tool.calls - 1) + 1) / tool.calls;
      }
    }
  }
}
```

## Implementation Timeline

### Week 1: Core Foundation
- [ ] Implement 4 core PromptMCP tools
- [ ] Add Context7 integration to each tool
- [ ] Update MCP server tool registry
- [ ] Basic error handling and fallbacks

### Week 2: Dynamic Pipeline
- [ ] Implement invisible dynamic pipeline
- [ ] Enhance Context7 caching system
- [ ] Add framework detection service
- [ ] Integrate with existing ContextPipeline

### Week 3: Advanced Integration
- [ ] Smart framework detection with Context7
- [ ] Context7-enhanced code generation
- [ ] Error fixing with Context7 documentation
- [ ] Learning system with Context7 context

### Week 4: Learning and Patterns
- [ ] Context7-enhanced learning system
- [ ] Pattern capture with Context7 context
- [ ] Lesson retrieval with framework awareness
- [ ] Vector database integration

### Week 5: Performance and Reliability
- [ ] Circuit breaker implementation
- [ ] Metrics and monitoring
- [ ] Performance optimization
- [ ] Comprehensive testing

## Success Criteria

### Phase 1 Success Criteria
- [ ] The enhance tool responds within 2 seconds
- [ ] Context7 integration works for all tools
- [ ] Basic error handling prevents crashes
- [ ] MCP server properly registers all tools

### Phase 2 Success Criteria
- [ ] Dynamic pipeline processes requests invisibly
- [ ] Context7 cache hit rate > 70%
- [ ] Framework detection accuracy > 85%
- [ ] Pipeline adds < 500ms overhead

### Phase 3 Success Criteria
- [ ] Code generation uses Context7 best practices
- [ ] Error fixing leverages Context7 documentation
- [ ] Framework detection works for 10+ frameworks
- [ ] Generated code follows framework conventions

### Phase 4 Success Criteria
- [ ] Learning system captures Context7 context
- [ ] Pattern matching accuracy > 80%
- [ ] Lesson retrieval returns relevant results
- [ ] Vector search performance < 200ms

### Phase 5 Success Criteria
- [ ] Circuit breaker prevents cascade failures
- [ ] Metrics provide actionable insights
- [ ] Overall system reliability > 99%
- [ ] Response times remain under 2 seconds

## Risk Mitigation

### Technical Risks
1. **Context7 API Rate Limits**: Implement caching and circuit breaker
2. **Performance Degradation**: Use async processing and connection pooling
3. **Memory Leaks**: Implement proper cleanup and monitoring
4. **Integration Complexity**: Start simple, iterate incrementally

### Business Risks
1. **Scope Creep**: Stick to 1 core tool, resist feature expansion
2. **Timeline Delays**: Prioritize critical features, defer nice-to-haves
3. **User Experience**: Maintain vibe coder simplicity throughout

## Conclusion

This enhancement plan provides a comprehensive roadmap for fully integrating Context7 with PromptMCP's core tool. The phased approach ensures steady progress while maintaining system stability and the vibe coder experience. By following this plan, PromptMCP will achieve its goal of providing faster, more contextual AI coding assistance through intelligent Context7 integration.

The key to success is maintaining focus on the core mission: making AI coding assistance faster and more contextual for vibe coders, without adding complexity or breaking the simple single-tool interface.
