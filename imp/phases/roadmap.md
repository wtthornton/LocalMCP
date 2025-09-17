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
- **Success Criteria**: Vibe coders can say "create me a dark theme Hello World" and get production-ready code

### Phase 0 Status: ✅ COMPLETE with Known Issues
- **Context7 Authentication Issue**: API key format invalid for direct REST access
- **Fallback Mode Active**: Using LocalMCP fallback responses instead of real Context7 data
- **Impact**: LocalMCP fully functional, but without real-time documentation
- **Documentation**: See `imp/design/context7-integration-issues.md` for details

---

## Phase 1 — Sidecars + RAG + Context7 Cache (Week 2–3)
- Add sidecars:
  - **Playwright MCP** (screenshots/UI checks).
  - **Vector DB** (Qdrant/SQLite+FAISS) for docs + lessons.
- Implement `docs.rag` ingestion from `/docs`, `/adr`, `/design`.
- **Context7 Resolution**:
  - Fix API authentication issue (proper key format or MCP server integration)
  - Implement MCP server integration as alternative to direct API
  - Test and validate real Context7 data retrieval
- **Context7 Cache**:  
  - SQLite (persistent, WAL mode) + in-memory LRU  
  - TTL = 24h, SWR = 7d, Max Age = 30d  
  - Eviction: LRU by bytes, per-package caps  
  - Invalidate on dependency version change
- **Success Criteria**: Cursor fixes errors using cached docs (no redundant pulls) - vibe coders get instant help without waiting.

---

## Phase 2 — Dynamic Pipeline (Week 4–6)
- Implement **invisible dynamic pipeline** that powers all 4 tools:
  - **Retrieve.AgentsMD** → **Detect.RepoFacts** → **Retrieve.Context7 (cached)** → **Retrieve.RAG** → **Read.Snippet** → **Reason.Plan** → **Edit** → **Validate** → **Gate** → **Document** → **Learn**
- Pipeline runs automatically behind every tool call
- Add budgets (time=120s, tokens=8k, chunks=10)
- Add scope locks (max 3 files, LOC/hunk caps)
- Add retry loop (≤2) with narrowing context
- **Success Criteria**: ≥50% first-pass success rate on all tool calls (vibe coders get instant, accurate results)

---

## Phase 3 — Lessons Learned (Week 7–9)
- Enhance `localmcp.learn` with intelligent pattern capture
- Capture error signatures + successful fixes → store as **Lesson Cards**
- Upsert into RAG (project-scoped by default)
- Inject top 3–5 lessons (~400–700 tokens) before planning
- Decay old lessons; promote to stack-shared on ≥5 successes & ≥0.7 success rate
- **Success Criteria**: ≥70% first-pass success rate on repeat patterns (vibe coders build muscle memory through AI)

---

## Phase 4 — Project Separation & Promotion (Month 3+)
- Derive `project_id` (git URL + root path).
- Store lessons + RAG per project.
- Promote high-confidence lessons to **stack-shared** (pkg@version).
- **Success Criteria**: Switching repos only shows project-local lessons; React/Next/TS lessons promoted safely (vibe coders get contextual help per project).

---

## Phase 5 — Hardening & Extras (Month 3+)
- Add `gate.policy` (per-file edit caps, mandatory citations).
- Add offline mode (cache + RAG only).
- Add optional runner sandbox (for heavier test runs).
- Add structured logging + traces for pipeline runs.
- **Stretch**: UI verification stage (Playwright diffing).

---

## Timeline Summary
- **Week 1**: MVP Gateway live (vibe coders can start getting contextual help)
- **Week 3**: Sidecars + RAG + **Context7 cache** (no more waiting for docs)  
- **Week 6**: Dynamic pipeline functional (smart error fixing)
- **Week 9**: Lessons Learned adaptive layer (learns your patterns)
- **Month 3+**: Multi-project, stack-shared lessons, hardened policies

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