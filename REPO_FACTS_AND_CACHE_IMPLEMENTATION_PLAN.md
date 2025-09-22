# Repo Facts Integration & Cache Optimization Implementation Plan

## 🎯 **Current Status Analysis**

### **Repo Facts Integration: 0/100** ❌
- **Issue**: `gatherRepoFacts` method exists but is not being called properly
- **Root Cause**: Project context scanning is not integrated into the enhancement pipeline
- **Impact**: No project-specific context for code generation

### **Cache Optimization: 0% Hit Rate** ❌
- **Issue**: Cache system exists but is not being utilized effectively
- **Root Cause**: Cache keys not being generated consistently, cache not being checked before API calls
- **Impact**: Unnecessary API calls, slower response times

---

## 🔧 **1. Repo Facts Integration Implementation**

### **1.1 Current State Analysis**
The `gatherRepoFacts` method exists in `src/tools/enhanced-context7-enhance.tool.ts` (lines 1717-1817) but has several issues:

```typescript
// Current implementation issues:
- Uses hardcoded file paths (process.cwd())
- No error handling for file system operations
- Limited project analysis capabilities
- Not integrated with project context analyzer service
```

### **1.2 Required Changes**

#### **A. Integrate ProjectContextAnalyzer Service**
```typescript
// In EnhancedContext7EnhanceTool constructor
private projectAnalyzer: ProjectContextAnalyzer;

constructor(...) {
  // ... existing code ...
  this.projectAnalyzer = new ProjectContextAnalyzer(this.logger);
}
```

#### **B. Update gatherRepoFacts Method**
```typescript
private async gatherRepoFacts(request: EnhancedContext7Request): Promise<string[]> {
  try {
    const facts: string[] = [];
    
    // 1. Use ProjectContextAnalyzer for comprehensive analysis
    const projectContext = await this.projectAnalyzer.analyzeProjectContext(process.cwd());
    
    // 2. Extract facts from project context
    if (projectContext.dependencies) {
      const depFacts = this.extractDependencyFacts(projectContext.dependencies);
      facts.push(...depFacts);
    }
    
    if (projectContext.suggestedFrameworks.length > 0) {
      facts.push(`Detected frameworks: ${projectContext.suggestedFrameworks.join(', ')}`);
    }
    
    if (projectContext.projectType !== 'unknown') {
      facts.push(`Project type: ${projectContext.projectType}`);
    }
    
    // 3. Add framework-specific facts
    const frameworkFacts = this.extractFrameworkFacts(projectContext);
    facts.push(...frameworkFacts);
    
    // 4. Add development workflow facts
    const workflowFacts = this.extractWorkflowFacts(projectContext);
    facts.push(...workflowFacts);
    
    this.logger.debug('Repository facts gathered', { 
      factsCount: facts.length,
      facts: facts.slice(0, 5) // Log first 5 facts
    });
    
    return facts;
    
  } catch (error) {
    this.logger.warn('Failed to gather repository facts', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return [];
  }
}
```

#### **C. Add Helper Methods**
```typescript
private extractDependencyFacts(dependencies: Record<string, string>): string[] {
  const facts: string[] = [];
  
  // React ecosystem
  if (dependencies.react) {
    facts.push(`React version: ${dependencies.react}`);
  }
  if (dependencies['@types/react']) {
    facts.push('Uses TypeScript React types');
  }
  
  // Build tools
  if (dependencies.webpack) {
    facts.push('Uses Webpack for bundling');
  }
  if (dependencies.vite) {
    facts.push('Uses Vite for development');
  }
  
  // Testing
  if (dependencies.jest) {
    facts.push('Uses Jest for testing');
  }
  if (dependencies['@testing-library/react']) {
    facts.push('Uses React Testing Library');
  }
  
  return facts;
}

private extractFrameworkFacts(projectContext: ProjectContext): string[] {
  const facts: string[] = [];
  
  if (projectContext.frameworkFiles.length > 0) {
    facts.push(`Framework files detected: ${projectContext.frameworkFiles.length}`);
  }
  
  // Analyze file structure for patterns
  const hasComponents = projectContext.fileStructure.some(f => 
    f.includes('components/') || f.includes('.component.')
  );
  if (hasComponents) {
    facts.push('Uses component-based architecture');
  }
  
  const hasHooks = projectContext.fileStructure.some(f => 
    f.includes('hooks/') || f.includes('use')
  );
  if (hasHooks) {
    facts.push('Uses custom React hooks pattern');
  }
  
  return facts;
}

private extractWorkflowFacts(projectContext: ProjectContext): string[] {
  const facts: string[] = [];
  
  // Package manager detection
  if (projectContext.packageManager !== 'unknown') {
    facts.push(`Package manager: ${projectContext.packageManager}`);
  }
  
  // Development tools
  const hasLinting = projectContext.fileStructure.some(f => 
    f.includes('.eslintrc') || f.includes('eslint.config')
  );
  if (hasLinting) {
    facts.push('Uses ESLint for code quality');
  }
  
  const hasPrettier = projectContext.fileStructure.some(f => 
    f.includes('.prettierrc') || f.includes('prettier.config')
  );
  if (hasPrettier) {
    facts.push('Uses Prettier for code formatting');
  }
  
  return facts;
}
```

### **1.3 Integration Points**
1. **Enhancement Tool**: Update `selectRelevantContext` to call `gatherRepoFacts`
2. **Project Context**: Use `ProjectContextAnalyzer` for comprehensive analysis
3. **Error Handling**: Graceful degradation when project analysis fails
4. **Caching**: Cache project analysis results to avoid repeated file system operations

---

## 🚀 **2. Cache Optimization Implementation**

### **2.1 Current State Analysis**
The cache system exists but has several issues:

```typescript
// Current cache issues:
- Context7AdvancedCacheService: 0% hit rate
- PromptCacheService: Not being used effectively
- Cache keys not consistent between services
- No cache warming strategy
- Cache invalidation not optimized
```

### **2.2 Required Changes**

#### **A. Fix Context7 Cache Integration**
```typescript
// In getContext7Documentation method
private async getContext7Documentation(
  framework: string,
  prompt: string,
  maxTokens: number
): Promise<{ docs: string; libraries: string[] }> {
  try {
    // 1. Check cache FIRST before any API calls
    const cacheKey = this.generateContext7CacheKey(framework, prompt, maxTokens);
    const cachedDocs = await this.cache.getCachedDocumentation(
      framework,
      this.extractTopicFromPrompt(prompt),
      maxTokens
    );
    
    if (cachedDocs) {
      this.logger.debug('Context7 docs retrieved from cache', { 
        framework, 
        cacheKey,
        docsLength: cachedDocs.length 
      });
      return { docs: cachedDocs, libraries: [framework] };
    }
    
    // 2. Only make API call if not cached
    const resolveResult = await this.mcpCompliance.executeToolCall('resolve-library-id', {
      libraryName: framework
    });
    
    if (!resolveResult.success || !resolveResult.data || resolveResult.data.length === 0) {
      throw new Error(`Failed to resolve library ID for ${framework}`);
    }

    const libraries = resolveResult.data;
    const bestLibrary = libraries[0];
    
    // 3. Get fresh documentation
    const docsResult = await this.mcpCompliance.executeToolCall('get-library-docs', {
      context7CompatibleLibraryID: bestLibrary.id,
      topic: this.extractTopicFromPrompt(prompt),
      tokens: maxTokens
    });
    
    if (docsResult.success && docsResult.data) {
      const docs = docsResult.data;
      
      // 4. Cache the result
      await this.cache.setCachedDocumentation(
        bestLibrary.id,
        this.extractTopicFromPrompt(prompt),
        maxTokens,
        docs,
        3600000 // 1 hour TTL
      );
      
      this.logger.debug('Context7 docs cached successfully', { 
        framework, 
        libraryId: bestLibrary.id,
        docsLength: docs.length 
      });
      
      return { docs, libraries: libraries.map((lib: any) => lib.id) };
    }
    
    throw new Error('No content returned from Context7');
    
  } catch (error) {
    this.logger.error('Context7 documentation retrieval failed', {
      framework,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

#### **B. Implement Cache Warming Strategy**
```typescript
private async warmCache(): Promise<void> {
  try {
    this.logger.info('Starting cache warming process');
    
    // Warm cache with common frameworks
    const commonFrameworks = ['react', 'html', 'css', 'javascript', 'typescript'];
    const commonTopics = ['components', 'styling', 'routing', 'api'];
    
    for (const framework of commonFrameworks) {
      for (const topic of commonTopics) {
        try {
          await this.getContext7Documentation(framework, topic, 2000);
          this.logger.debug('Cache warmed', { framework, topic });
        } catch (error) {
          // Continue with other combinations
          this.logger.debug('Cache warming failed for combination', { framework, topic, error });
        }
      }
    }
    
    this.logger.info('Cache warming completed');
  } catch (error) {
    this.logger.warn('Cache warming failed', { error });
  }
}
```

#### **C. Optimize Cache Key Generation**
```typescript
private generateContext7CacheKey(framework: string, prompt: string, maxTokens: number): string {
  const topic = this.extractTopicFromPrompt(prompt);
  return `context7:${framework}:${topic}:${maxTokens}`;
}

private generatePromptCacheKey(originalPrompt: string, context: any, frameworkDetection: any): string {
  const contextStr = JSON.stringify(context || {});
  const frameworkStr = JSON.stringify(frameworkDetection || {});
  const promptHash = this.hashString(originalPrompt);
  return `prompt:${promptHash}:${this.hashString(contextStr)}:${this.hashString(frameworkStr)}`;
}

private hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
```

#### **D. Implement Cache Analytics**
```typescript
private async logCacheAnalytics(): Promise<void> {
  try {
    const context7Stats = this.cache.getCacheStats();
    const promptStats = this.promptCache.getCacheStats();
    
    this.logger.info('Cache Analytics', {
      context7: {
        hitRate: context7Stats.hitRate,
        totalHits: context7Stats.hits,
        totalMisses: context7Stats.misses,
        memoryHits: context7Stats.memoryHits,
        sqliteHits: context7Stats.sqliteHits
      },
      prompt: {
        hitRate: promptStats.hitRate,
        totalHits: promptStats.hits,
        totalMisses: promptStats.misses,
        totalEntries: promptStats.totalEntries
      }
    });
  } catch (error) {
    this.logger.warn('Failed to log cache analytics', { error });
  }
}
```

---

## 📋 **3. Implementation Steps**

### **Phase 1: Repo Facts Integration (Priority: HIGH)**
1. **Update Enhancement Tool Constructor**
   - Add `ProjectContextAnalyzer` service
   - Initialize project analysis capabilities

2. **Refactor gatherRepoFacts Method**
   - Integrate with `ProjectContextAnalyzer`
   - Add comprehensive error handling
   - Implement fact extraction helpers

3. **Add Project Analysis Caching**
   - Cache project analysis results
   - Implement cache invalidation strategy
   - Add performance monitoring

4. **Test Integration**
   - Verify repo_facts are populated
   - Test with different project types
   - Validate error handling

### **Phase 2: Cache Optimization (Priority: HIGH)**
1. **Fix Context7 Cache Integration**
   - Update `getContext7Documentation` method
   - Implement proper cache checking
   - Add cache key generation

2. **Implement Cache Warming**
   - Add cache warming strategy
   - Warm common framework combinations
   - Monitor cache effectiveness

3. **Optimize Cache Keys**
   - Implement consistent key generation
   - Add hash functions for complex keys
   - Test key collision handling

4. **Add Cache Analytics**
   - Implement comprehensive logging
   - Add performance metrics
   - Create cache monitoring dashboard

### **Phase 3: Testing & Validation (Priority: MEDIUM)**
1. **Create Test Suite**
   - Unit tests for repo facts gathering
   - Integration tests for cache system
   - Performance benchmarks

2. **Load Testing**
   - Test cache performance under load
   - Validate memory usage
   - Test cache eviction policies

3. **Quality Validation**
   - Verify 100% quality score maintained
   - Test with various project types
   - Validate error handling

---

## 🎯 **Expected Results**

### **Repo Facts Integration**
- **Target Score**: 100/100 (currently 0/100)
- **Expected Facts**: 5-15 project-specific facts per request
- **Performance Impact**: < 100ms additional processing time

### **Cache Optimization**
- **Target Hit Rate**: 70-80% (currently 0%)
- **Performance Improvement**: 50-70% faster response times
- **Memory Usage**: Optimized with proper eviction policies

### **Overall System Impact**
- **Quality Score**: Maintain 100/100
- **Response Time**: Improve by 30-50%
- **API Calls**: Reduce by 70-80%
- **User Experience**: Significantly enhanced with project-specific context

---

## 🚨 **Risk Mitigation**

### **Repo Facts Risks**
- **File System Access**: Implement proper error handling
- **Performance Impact**: Cache project analysis results
- **Security**: Validate file paths and permissions

### **Cache Risks**
- **Memory Usage**: Implement proper eviction policies
- **Cache Invalidation**: Use TTL and version-based invalidation
- **Data Consistency**: Implement cache warming and validation

---

## 📊 **Success Metrics**

### **Repo Facts Integration**
- [ ] `repo_facts` array populated with 5+ items
- [ ] Project-specific context included in enhanced prompts
- [ ] Error handling prevents system failures
- [ ] Performance impact < 100ms

### **Cache Optimization**
- [ ] Cache hit rate > 70%
- [ ] Response time improvement > 30%
- [ ] API call reduction > 70%
- [ ] Memory usage optimized

### **Overall System**
- [ ] Quality score maintained at 100/100
- [ ] All existing functionality preserved
- [ ] Performance improvements validated
- [ ] Comprehensive test coverage

This implementation plan provides a clear roadmap for achieving both repo facts integration and cache optimization while maintaining the current 100/100 quality score.
