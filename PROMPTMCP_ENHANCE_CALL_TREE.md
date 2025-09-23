# PromptMCP Enhance Tool - Functional Call Tree

## Overview

This document provides a comprehensive functional call tree for the `promptmcp.enhance` tool, showing the complete flow from entry point through all services for the example prompt "How do I create a button?"

## 🌳 **Functional Call Tree: `promptmcp.enhance`**

```
📞 promptmcp.enhance("How do I create a button?")
│
├── 🚪 Entry Point: MCP Server
│   └── src/mcp/server.ts::executeEnhance()
│       ├── Validates input parameters
│       ├── Logs: "🚀🚀🚀 ENHANCE TOOL CALLED 🚀🚀🚀"
│       └── Calls context7Integration.enhancePrompt()
│
├── 🔧 Context7 Integration Service
│   └── src/services/context7/context7-integration.service.ts::enhancePrompt()
│       ├── Validates initialization status (checks enhanceTool exists)
│       ├── Logs: "Enhancing prompt with project context"
│       └── Direct delegation to enhanceTool.enhance()
│
├── 🚀 Enhanced Context7 Enhance Tool
│   └── src/tools/enhanced-context7-enhance.tool.ts::enhance()
│       │
│       ├── 1️⃣ Prompt Analysis
│       │   └── src/tools/enhance/prompt-analyzer.service.ts::analyzePromptComplexity()
│       │       ├── Analyzes: "How do I create a button?" (simple, short prompt)
│       │       ├── Detects: UI component request, basic functionality
│       │       ├── Determines: complexity level = "simple"
│       │       └── Returns: optimized options for simple prompts
│       │
│       ├── 2️⃣ Cache Check
│       │   └── src/tools/enhanced-context7-enhance.tool.ts::checkCache()
│       │       ├── Generates cache key from prompt + context
│       │       ├── Checks: "How do I create a button?" in cache
│       │       └── Returns: cached result if available, null if miss
│       │
│       ├── 3️⃣ Framework Detection
│       │   └── src/tools/enhance/framework-integration.service.ts::detectFrameworks()
│       │       ├── Analyzes prompt: "How do I create a button?"
│       │       ├── Detects: HTML, CSS, JavaScript keywords
│       │       ├── Checks project context for framework files (React, Vue, etc.)
│       │       ├── Returns: detectedFrameworks = ["html", "css"], confidence = 0.8
│       │       └── Generates: suggestions = ["Detected HTML button creation pattern"]
│       │
│       ├── 4️⃣ Quality Requirements Detection
│       │   └── src/tools/enhance/framework-integration.service.ts::detectQualityRequirements()
│       │       ├── Analyzes prompt: "How do I create a button?"
│       │       ├── Detects: Basic accessibility needs, semantic HTML
│       │       ├── Returns: qualityRequirements = ["accessibility", "semantic-html"]
│       │       └── Notes: No performance or security requirements detected
│       │
│       ├── 5️⃣ Context7 Documentation Retrieval
│       │   └── src/tools/enhanced-context7-enhance.tool.ts::getContext7Documentation()
│       │       └── src/tools/enhance/context7-documentation.service.ts::getContext7DocumentationForFrameworks()
│       │           │
│       │           ├── 🔄 Parallel Library Processing
│       │           │   └── For each detected framework (HTML, CSS):
│       │           │       ├── src/services/context7/simple-context7-client.ts::getLibraryDocumentation()
│       │           │       │   ├── Calls Context7 MCP server
│       │           │       │   ├── Requests: HTML button documentation, CSS styling docs
│       │           │       │   ├── Processes JSON/SSE responses
│       │           │       │   └── Returns: documentation content for button creation
│       │           │       │
│       │           │       └── 🎯 **Content Curation** (if OpenAI available)
│       │           │           └── src/services/ai/context7-curation.service.ts::curateForCursor()
│       │           │               ├── assessContentQuality()
│       │           │               │   └── OpenAI GPT-4 quality assessment (1-10 scale)
│       │           │               │       └── Scores: HTML docs (8/10), CSS docs (7/10)
│       │           │               ├── extractKeyComponents()
│       │           │               │   └── OpenAI extraction of patterns, best practices, code examples
│       │           │               │       └── Extracts: button types, accessibility attributes, styling patterns
│       │           │               ├── optimizeTokens()
│       │           │               │   └── OpenAI token reduction (target 70% reduction)
│       │           │               │       └── Reduces: 15,000 tokens → 4,500 tokens (70% reduction)
│       │           │               └── Returns CuratedContent with quality metrics
│       │           │
│       │           └── 📊 Curation Metrics Aggregation
│       │               ├── Calculates total token reduction: 70%
│       │               ├── Calculates average quality score: 7.5/10
│       │               └── Decides: Use curated content (meets quality threshold)
│       │
│       ├── 6️⃣ Project Context Gathering
│       │   └── src/tools/enhanced-context7-enhance.tool.ts::gatherProjectContext()
│       │       ├── src/services/analysis/project-analyzer.service.ts::analyzeProject()
│       │       │   ├── Scans project files for patterns
│       │       │   ├── Detects: HTML files, CSS files, existing button styles
│       │       │   ├── Extracts repository facts: "Web project", "Uses CSS Grid"
│       │       │   └── Identifies code snippets: existing button examples, CSS classes
│       │       ├── Logs: "🔍 [EnhanceTool] About to call gatherProjectContext..."
│       │       └── Returns: project context (repo facts, code snippets)
│       │
│       ├── 7️⃣ Task Breakdown (if OpenAI available)
│       │   └── src/tools/enhanced-context7-enhance.tool.ts::handleTaskBreakdown()
│       │       └── src/services/task-breakdown/task-breakdown.service.ts::breakdownPrompt()
│       │           ├── Detects frameworks from prompt: HTML, CSS
│       │           ├── Gets Context7 documentation: Button creation patterns
│       │           ├── Analyzes: "How do I create a button?" → Simple task
│       │           ├── Returns: breakdown = ["Create HTML button element", "Add CSS styling", "Test accessibility"]
│       │           └── Generates: todos = ["Implement button", "Add hover effects", "Test keyboard navigation"]
│       │
│       ├── 8️⃣ Enhanced Prompt Building
│       │   └── src/tools/enhance/response-builder.service.ts::buildEnhancedPrompt()
│       │       ├── Combines: "How do I create a button?" + context
│       │       ├── Adds: curated HTML/CSS documentation
│       │       ├── Includes: project context and accessibility best practices
│       │       ├── Structures: For optimal AI code generation
│       │       └── Returns: Enhanced prompt with examples, patterns, and requirements
│       │
│       ├── 9️⃣ Result Caching
│       │   └── src/tools/enhanced-context7-enhance.tool.ts::cacheResult()
│       │       └── src/services/cache/prompt-cache.service.ts::cachePrompt()
│       │           ├── Stores: enhanced prompt with metadata
│       │           ├── Includes: curation metrics (70% token reduction, 7.5/10 quality)
│       │           ├── Adds: framework detection, quality requirements
│       │           └── Implements: LRU cache with TTL
│       │
│       └── 🔟 Response Building
│           └── Returns EnhancedContext7Response with:
│               ├── enhanced_prompt: "Create a button with proper HTML semantics and CSS styling..."
│               ├── context_used: repo facts, code snippets, context7 docs
│               ├── framework_detection: ["html", "css"], confidence: 0.8
│               ├── quality_requirements: ["accessibility", "semantic-html"]
│               ├── curation_metrics: { tokenReduction: 0.7, qualityScore: 7.5 }
│               ├── breakdown: ["Create HTML button element", "Add CSS styling", "Test accessibility"]
│               ├── todos: ["Implement button", "Add hover effects", "Test keyboard navigation"]
│               └── success: true
│
└── 📤 Response Flow
    └── MCP Server returns JSON response to client
        ├── enhanced_prompt: Ready for Cursor AI with examples and best practices
        ├── context_used: Transparency about what was used
        ├── breakdown: Step-by-step task breakdown
        ├── todos: Actionable todo items
        └── curation_metrics: Performance metrics (70% token reduction, 7.5/10 quality)
```

## 🎯 **Key Integration Points with Context7 Curation**

### **5️⃣ Context7 Documentation Retrieval** (Enhanced with Curation)
- **Before**: Raw Context7 documentation passed through
- **After**: Each library's documentation goes through curation pipeline:
  1. **Quality Assessment**: AI scores content 1-10 based on code examples, best practices, relevance, completeness
  2. **Key Components Extraction**: AI extracts patterns, best practices, code examples
  3. **Token Optimization**: AI reduces content by 60-80% while preserving quality
  4. **Cursor Optimization**: Content structured specifically for Cursor AI code generation

### **9️⃣ Result Caching** (Enhanced with Curation Metrics)
- **Before**: Basic prompt caching
- **After**: Caches include curation metrics:
  - `totalTokenReduction`: Percentage of tokens saved
  - `averageQualityScore`: Average quality score across curated content
  - `curationEnabled`: Whether curation was used

### **🔧 Service Initialization** (Enhanced with Curation Service)
- **Context7IntegrationService** now initializes `Context7CurationService` if OpenAI is available
- **EnhancedContext7EnhanceTool** receives curation service as dependency
- **Context7DocumentationService** uses curation service for content processing

## 🚀 **Benefits of the Enhanced Flow**

1. **Faster Responses**: 60-80% token reduction means faster AI responses
2. **Better Quality**: Curated content focuses on practical, high-quality examples
3. **Transparent Metrics**: Curation metrics show exactly what was optimized
4. **Graceful Fallback**: Works even when OpenAI is unavailable
5. **Learning System**: Adaptive thresholds improve over time
6. **Zero Configuration**: Works automatically with existing setup

## 📁 **File Structure Reference**

### Core Files
- `src/mcp/server.ts` - MCP server entry point
- `src/services/context7/context7-integration.service.ts` - Main orchestration service
- `src/tools/enhanced-context7-enhance.tool.ts` - Main enhance tool implementation

### Service Files
- `src/tools/enhance/prompt-analyzer.service.ts` - Prompt complexity analysis
- `src/tools/enhance/framework-integration.service.ts` - Framework detection
- `src/tools/enhance/context7-documentation.service.ts` - Context7 documentation retrieval
- `src/tools/enhance/response-builder.service.ts` - Enhanced prompt building
- `src/services/ai/context7-curation.service.ts` - **NEW**: Content curation service
- `src/services/cache/prompt-cache.service.ts` - Caching with curation metrics

### Integration Files
- `src/services/context7/context7-real-integration.service.ts` - Context7 MCP integration
- `src/services/ai/openai.service.ts` - OpenAI integration
- `src/services/task-breakdown/task-breakdown.service.ts` - Task breakdown service

## 🔄 **Data Flow Summary**

1. **Input**: User prompt + optional context
2. **Analysis**: Prompt complexity and framework detection
3. **Retrieval**: Context7 documentation with intelligent curation
4. **Context**: Project analysis and code snippets
5. **Enhancement**: AI-powered task breakdown (if available)
6. **Building**: Enhanced prompt construction
7. **Caching**: Result storage with metrics
8. **Output**: Enhanced prompt ready for Cursor AI

## 🎛️ **Configuration Options**

### Curation Service Configuration
```typescript
{
  enabled: true,
  targetTokenReduction: 0.7, // 70% reduction
  minQualityScore: 6.0,
  maxProcessingTime: 5000,
  learningEnabled: true,
  adaptiveThresholds: true
}
```

### Quality Assessment Criteria
- **Code Examples (30%)**: Presence of practical, runnable code snippets
- **Best Practices (25%)**: Clear patterns, conventions, and guidelines
- **Relevance (25%)**: How well it matches the user's coding intent
- **Completeness (20%)**: Essential information coverage

## 📊 **Performance Metrics**

The enhanced flow tracks and reports:
- Token reduction percentage
- Quality scores for curated content
- Processing time for curation
- Cache hit rates
- Success/failure rates for curation

## 🔧 **Error Handling**

- Graceful fallback to original content if curation fails
- Quality threshold checks before using curated content
- Comprehensive error logging and monitoring
- Service availability checks before processing

---

*This call tree represents the complete functional flow of the PromptMCP enhance tool with the new Context7 content curation enhancement integrated seamlessly into the existing architecture.*
