# Roadmap — LocalMCP (Dynamic Pipeline Edition)

## Vision & Purpose
**Goal**: Create a simple, local Docker container that runs an MCP server to give **"vibe coders"** a **faster, more accurate, and more contextual AI coding assistant experience**.

**Target Audience**: "Vibe coders" - developers who:
- Code by intuition and feel rather than deep technical expertise
- Prefer AI assistance for complex technical decisions
- Want to focus on building features rather than learning every framework detail
- Need contextual help that understands their project's patterns
- Value speed and accuracy over having to research solutions themselves

**Why**: Current AI coding assistants like Cursor are powerful but suffer from:
- Slow context retrieval (repeated API calls to external docs)
- Generic responses not grounded in your specific project
- Lack of learning from your project's patterns and past fixes
- No access to your project's documentation and architectural decisions
- **Require expert-level knowledge to ask the right questions**

**Solution**: A local MCP gateway that:
- Caches external documentation locally (Context7) for instant access
- Indexes your project's docs, ADRs, and design decisions
- Learns from your coding patterns and successful fixes
- Provides project-aware context to the AI assistant
- **Works entirely locally (no external API dependencies during coding)**
- **Makes technical decisions easier by surfacing relevant context automatically**

## Vibe Coder Benefits
- **Less Googling**: Context7 cache means instant access to framework docs
- **Fewer Wrong Turns**: Lessons learned prevent repeating past mistakes
- **Faster Iteration**: Project-aware context means fewer back-and-forth with AI
- **Confidence Building**: AI suggestions are grounded in your actual project patterns

## Mission
Deliver **LocalMCP** - a simple, local MCP server for Cursor that:
- Grounds coding in repo facts, AGENTS.md directives, and versioned docs (Context7).
- Runs through a **dynamic pipeline** that adapts stage-by-stage.
- Reduces retries by learning from past errors (Lessons Learned).
- Optimizes speed and cost with a **local Context7 cache** (SQLite + LRU).
- Exposes only **4 simple tools** for maximum vibe coder friendliness.

## LocalMCP Tool Design

### Core Tools (Ultra-Simple for Vibe Coders)
- **`localmcp.analyze`** - "Look at my project" (analyzes project structure, dependencies, context)
- **`localmcp.create`** - "Make me something new" (creates code/components based on description)
- **`localmcp.fix`** - "Fix this problem" (fixes errors using cached docs and project context)
- **`localmcp.learn`** - "Remember this solution" (captures and applies lessons from patterns)

### Dynamic Pipeline Integration
The **dynamic pipeline runs invisibly** behind every tool call, providing:
- **Smart context retrieval** from Context7 cache and project RAG
- **Intelligent processing** with stage-by-stage adaptation
- **Quality validation** and best practices application
- **Pattern learning** and solution capture
- **Zero configuration** - works out of the box for vibe coders

### Vibe Coder Experience
```
User: "Create me a dark theme Hello World"
AI: *calls localmcp.create*
LocalMCP: *pipeline runs automatically*
  - Analyzes project (React/Next.js detected)
  - Gets dark theme best practices from Context7
  - Finds existing color schemes in project
  - Generates modern HTML with dark theme
  - Validates accessibility and contrast
  - Records the pattern for future use
AI: "Created! Here's your dark theme Hello World with proper contrast ratios."
```

---

## Phase 0 — MVP LocalMCP (Week 1)
- Implement **4 core tools**: `localmcp.analyze`, `localmcp.create`, `localmcp.fix`, `localmcp.learn`
- Connect Cursor to LocalMCP (one MCP endpoint)
- Basic Context7 integration for `localmcp.create` and `localmcp.fix`
- Simple project analysis for `localmcp.analyze`
- Basic lesson capture for `localmcp.learn`
- **Debug & Admin**: Basic health check endpoint, simple logging, tool call monitoring
- **Success Criteria**: Vibe coders can say "create me a dark theme Hello World" and get production-ready code

### Phase 0 Status: ✅ COMPLETE with Known Issues
- **Context7 Authentication Issue**: API key format invalid for direct REST access
- **Fallback Mode Active**: Using LocalMCP fallback responses instead of real Context7 data
- **Impact**: LocalMCP fully functional, but without real-time documentation
- **Documentation**: See `imp/design/context7-integration-issues.md` for details

---

## Phase 1 — Sidecars + RAG + Context7 Cache (Week 2–3) ✅ COMPLETED
- ✅ Add sidecars:
  - ✅ **Playwright MCP** (screenshots/UI checks).
  - ✅ **Vector DB** (Qdrant/SQLite+FAISS) for docs + lessons.
- ✅ Implement `docs.rag` ingestion from `/docs`, `/adr`, `/design`.
- ✅ **Context7 Resolution**:
  - ✅ Fix API authentication issue (proper key format or MCP server integration)
  - ✅ Implement MCP server integration as alternative to direct API
  - ✅ Test and validate real Context7 data retrieval
- ✅ **Context7 Cache**:  
  - ✅ SQLite (persistent, WAL mode) + in-memory LRU (no Redis dependency)
  - ✅ TTL = 24h, SWR = 7d, Max Age = 30d  
  - ✅ Eviction: LRU by bytes, per-package caps  
  - ✅ Invalidate on dependency version change
- ✅ **Debug & Admin**: 
  - ✅ Admin web console with real-time monitoring
  - ✅ Service health dashboard (Context7, Qdrant, Playwright)
  - ✅ Cache statistics and performance metrics
  - ✅ Tool call tracing and debugging
- ✅ **Dynamic Pipeline Engine**: 7 detailed stages implemented
- ✅ **Pipeline Integration**: All 4 tools use pipeline engine
- **Success Criteria**: ✅ Cursor fixes errors using cached docs (no redundant pulls) - vibe coders get instant help without waiting.

---

## Phase 2 — Dynamic Pipeline (Week 4–6) ✅ COMPLETED
- ✅ Implement **invisible dynamic pipeline** that powers all 4 tools:
  - ✅ **Retrieve.AgentsMD** → **Detect.RepoFacts** → **Retrieve.Context7 (cached)** → **Retrieve.RAG** → **Read.Snippet** → **Reason.Plan** → **Edit** → **Validate** → **Gate** → **Document** → **Learn**
- ✅ Pipeline runs automatically behind every tool call
- ✅ Add budgets (time=120s, tokens=8k, chunks=10)
- ✅ Add scope locks (max 3 files, LOC/hunk caps)
- ✅ Add retry loop (≤2) with narrowing context
- ✅ **Debug & Admin**:
  - ✅ Pipeline execution visualizer with stage-by-stage tracking
  - ✅ Performance profiling and bottleneck identification
  - ✅ Budget and scope violation alerts
  - ✅ Pipeline configuration management interface
- **Success Criteria**: ✅ ≥50% first-pass success rate on all tool calls (vibe coders get instant, accurate results)

---

## Phase 3 — Lessons Learned (Week 7–9) 🔄 IN PROGRESS
- ✅ Enhance `localmcp.learn` with intelligent pattern capture
- Capture error signatures + successful fixes → store as **Lesson Cards**
- Upsert into RAG (project-scoped by default)
- Inject top 3–5 lessons (~400–700 tokens) before planning
- Decay old lessons; promote to stack-shared on ≥5 successes & ≥0.7 success rate
- **Debug & Admin**:
  - Lesson learning analytics and pattern recognition dashboard
  - Success rate tracking and lesson effectiveness metrics
  - Lesson promotion and decay management interface
  - Pattern matching and similarity analysis tools
- **Success Criteria**: ≥70% first-pass success rate on repeat patterns (vibe coders build muscle memory through AI)

---

## Phase 4 — Project Separation & Promotion (Month 3+) ✅ COMPLETED
- ✅ **Project ID Derivation**: Hash git URL + root path for unique project identification
- ✅ **Project-Scoped Storage**: Separate RAG collections, lessons, and cache per project
- ✅ **Multi-Project Management**: Admin interface for switching between projects
- ✅ **Lesson Promotion**: Promote high-confidence lessons to shared knowledge base
- ✅ **Cross-Project Analytics**: Analyze patterns across multiple projects
- ✅ **Debug & Admin**:
  - ✅ Multi-project management interface
  - ✅ Project-specific lesson and RAG analytics
  - ✅ Lesson promotion workflow and approval system
  - ✅ Cross-project pattern analysis and insights
- **Success Criteria**: ✅ Switching repos only shows project-local lessons; React/Next/TS lessons promoted safely (vibe coders get contextual help per project).

---

## Phase 5 — Hardening & Extras (Month 3+)
**Goal**: Transform LocalMCP from a functional prototype into a reliable, well-tested system that vibe coders can trust for their daily development work.

### P5.1: Policy & Security Hardening (Week 13-14)
- **`gate.policy` Implementation**:
  - Per-file edit caps and rate limiting
  - Mandatory citations and source attribution
  - Code quality gates and security checks
  - Project-specific policy enforcement
  - Activity tracking for debugging and learning
- **Simplified Security Enhancements** (Focused on Essential Protection):
  - ✅ Simple input validation (XSS/injection protection)
  - ✅ Basic API authentication (token validation)
  - ✅ Simple secure configuration management
  - ✅ Basic data encryption using Node.js crypto
  - 🎯 **Approach**: Lightweight security without over-engineering

### P5.2: Offline Mode & Resilience (Week 15)
- **Offline Mode Implementation**:
  - Cache-first operation with Context7 fallback
  - RAG-only mode for disconnected environments
  - Graceful degradation and error handling
  - Offline lesson and pattern storage
  - Sync capabilities when connectivity restored
- **Resilience Features**:
  - Automatic retry mechanisms with exponential backoff
  - Circuit breaker patterns for external services
  - Health check endpoints and self-healing
  - Backup and disaster recovery procedures
  - Performance monitoring and alerting

### P5.3: Advanced Execution Environment (Week 16)
- **Optional Runner Sandbox**:
  - Isolated execution environment for test runs
  - Resource limits and timeout controls
  - Security sandboxing for untrusted code
  - Docker container integration
  - Performance profiling and optimization
- **Enhanced Pipeline Execution**:
  - Parallel stage execution where possible
  - Pipeline optimization and caching
  - Resource usage monitoring and limits
  - Execution history and replay capabilities
  - Performance metrics and analytics

### P5.4: Structured Logging & Observability (Week 17) ✅ **COMPLETED**
- **Comprehensive Logging System**:
  - ✅ Structured logging with correlation IDs
  - ✅ Pipeline execution traces and timing
  - ✅ Error tracking and debugging information
  - ✅ Performance metrics and bottlenecks
  - ✅ Activity logs for debugging and troubleshooting
- **Observability Features**:
  - ✅ Real-time monitoring dashboards
  - ✅ Alerting and notification systems
  - ✅ Performance profiling and optimization
  - ✅ System health monitoring and reporting
  - ✅ Capacity planning and resource optimization

### P5.5: Advanced Debug & Admin Tools (Week 18)
- **Advanced Debugging Tools**:
  - Interactive debugging interface
  - Pipeline step-by-step execution viewer
  - Context inspection and validation tools
  - Performance profiling and bottleneck analysis
  - Memory and resource usage monitoring
- **System Administration**:
  - Advanced configuration management
  - System health monitoring and alerting
  - Backup and recovery management
  - Security monitoring and issue reporting
  - Performance optimization recommendations
- **Stretch Goal**: UI verification stage with Playwright diffing

### P5.6: Phase 5 Integration & Validation (Week 19)
- **System Integration**:
  - End-to-end testing of all Phase 5 features
  - Performance benchmarking and optimization
  - Security testing and vulnerability scanning
  - Reliability testing and performance validation
  - Documentation and user guide updates
- **Success Criteria**: 
  - Reliable operation for daily development work
  - Fast response times for cached operations (< 1 second)
  - No critical security issues
  - Complete offline functionality when needed
  - Comprehensive monitoring and alerting for vibe coders

---

## Phase 6 — Comprehensive User Guide System (Month 4+) ✅ COMPLETED
- ✅ **Multi-Page HTML User Guide**:
  - ✅ Auto-generated comprehensive documentation
  - ✅ Context7-powered dynamic content (simplified)
  - ✅ Playwright-validated screenshots and functionality
  - ✅ Responsive design with modern dark theme
  - ✅ Real-time updates after each phase completion
- ✅ **Advanced Documentation Features**:
  - ✅ Interactive code examples with live previews
  - ✅ Search functionality with Context7 integration
  - ✅ Multi-language support (TypeScript, Python, Go, etc.)
  - ✅ Export capabilities (PDF, EPUB, ZIP)
- ✅ **User Experience Enhancements**:
  - ✅ Progressive web app (PWA) capabilities
  - ✅ Offline documentation access
  - ✅ User feedback and rating system
  - ✅ Community-contributed examples and tutorials
  - ✅ Integration with popular IDEs and editors
- ✅ **Debug & Admin**:
  - ✅ Documentation analytics and usage tracking
  - ✅ Content performance monitoring
  - ✅ User engagement metrics
  - ✅ A/B testing for documentation improvements
  - ✅ Automated content quality checks
- ✅ **Success Criteria**: Vibe coders have access to comprehensive, always-updated documentation that adapts to their specific project context and learning preferences.

---

## Timeline Summary
- **Week 1**: MVP Gateway live (vibe coders can start getting contextual help)
- **Week 3**: Sidecars + RAG + **Context7 cache** (no more waiting for docs)  
- **Week 6**: Dynamic pipeline functional (smart error fixing)
- **Week 9**: Lessons Learned adaptive layer (learns your patterns)
- **Month 3+**: Multi-project, stack-shared lessons, reliable policies

## Getting Started (Vibe Coder Quick Start)
1. **Clone & Run**: `docker run -p 3000:3000 localmcp`
2. **Connect Cursor**: Point to localhost:3000 MCP endpoint
3. **Start Coding**: AI now has access to your project context + cached docs
4. **Watch It Learn**: System improves as you code and fix errors

**Examples**:
- **Create**: "Create me a dark theme Hello World" → Gets production-ready HTML with proper contrast
- **Analyze**: "What's in this project?" → Gets comprehensive project overview
- **Fix**: "Fix this TypeScript error" → Gets contextual fix with explanation
- **Learn**: "Remember this solution" → Captures pattern for future use