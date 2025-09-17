# Tech Stack — Personal MCP Gateway

## Project Vision
This is a **local development tool** that enhances your AI coding assistant (like Cursor) by providing:
- **Instant access** to cached documentation (no more waiting for API calls)
- **Project-aware context** from your docs, ADRs, and design decisions  
- **Learning capabilities** that improve over time based on your coding patterns
- **Local-first approach** - everything runs in a Docker container on your machine
- **"Vibe coder" friendly** - reduces need for deep technical knowledge

**Target**: "Vibe coders" who want their AI assistant to handle the technical complexity while they focus on building features.

**One-liner**: "Make your AI coding assistant smarter so you don't have to be - perfect for vibe coders who want to build fast."

## Vibe Coder Experience
- **Simple Setup**: `docker run` and you're ready
- **Smart Defaults**: Works out of the box with common frameworks
- **Learning Mode**: Gets better as you code, no configuration needed
- **Contextual Help**: AI understands your project without you explaining it
- **Less Googling**: Instant access to framework docs and best practices
- **Fewer Mistakes**: Learns from your project's patterns and past fixes

## Core Gateway
- **Language**: Node.js 22 LTS (gateway service)
- **Container**: Docker 24+ (for sidecars)
- **Package Manager**: npm or pnpm
- **Runtime**: Cursor MCP protocol (JSON RPC over stdio or WebSocket)

## Tools (exposed to Cursor)
- `repo.introspect` — analyze package.json, lockfiles, configs (vibe coders don't need to read configs)
- `repo.read` — fetch file spans (smart file retrieval based on context)
- `env.runlite` — lint, typecheck, build dry-run, tests (instant feedback without setup)
- `context7.bridge` — versioned public docs (React, Next, etc.) (no more Googling)
- `docs.rag` — personal/project docs (ADRs, design notes, specs) (project-specific guidance)
- `pipeline.run` — dynamic planner (AI handles complex decision-making)
- `setup.run` — init, warm-start, verify, cleanup (one-click project setup)
- `learn.record` — capture lessons from validations (gets smarter over time)

## Sidecars
- **Vector DB**:  
  - Primary: Qdrant (production)  
  - Alt: SQLite + FAISS (lightweight/local) (vibe coders get smart defaults)
- **Playwright MCP**: Node.js + Chromium (isolated in container) (UI testing without setup)
- **Optional Runner Sandbox**: Docker-in-Docker or Firecracker for heavy tests (safe execution)

---

## Context7 Cache

### Default Strategy
- **Backend**: SQLite (WAL mode) file in project-local cache directory  
- **Front layer**: In-memory LRU for hot keys  
- **Location**: `~/.mcp/context7_cache.db` (or `.cache/context7/` inside project)  
- **Persistence**: survives restarts; file can be safely nuked if corrupted  

### Keys
- Composite: `pkg@version • doc_id/topic • locale • query_hash • project_id`  
- Ensures correctness across package versions & projects  

### Stored Fields
- `payload` (exact text chunks returned by Context7)  
- `fingerprint` (hash for dedupe)  
- `size_bytes`  
- `fetched_at`, `expires_at`, `swr_until`  
- `last_access` (for LRU eviction)  
- `source_meta` (url, commit, etc.)

### Policies
- **TTL**: 24h fresh  
- **SWR**: 7d serve-stale-while-refresh  
- **Max Age**: 30d hard cutoff  
- **Eviction**: LRU by bytes and per-package caps  

### Caps
- `global_max_mb`: 400 MB  
- `max_entries_per_pkg_version`: 250  
- `max_chunks_per_call`: 8 (cap 3 per source)

### Invalidation
- Triggered when `repo.introspect` detects dependency version bump  
- Purges by `{pkg@version}` group  

### Optional Alternatives
- **Redis sidecar**: for multi-client sharing or CI/CD caching  
- **HTTP proxy cache**: if prefetching large doc sets for a team  
- **Flat files**: not recommended long-term (no eviction, no TTLs)

---

## RAG Ingestion
- Sources: `/docs/**`, `/adr/**`, `/design/**`, AGENTS.md
- Chunk size: 400–700 tokens
- Caps: 2–3 chunks/file, 6–10 chunks total at runtime
- Metadata: `project_id`, `path`, `heading_trail`, `framework`, `pkg@ver`

---

## Lessons Learned
- Store: vector DB + KV index
- Key: `lesson:{project_id}:{err_class}:{code}:{hash(template)}:{framework}:{pkg@version}`
- Confidence decay: −20% per 30 days idle
- Promotion: to stack-shared when ≥5 successes & ≥0.7 success rate

---

## Security
- Default no-network for `env.runlite`
- Sidecars isolated in Docker containers
- No secrets in repo; `.env` + Docker secrets only
- Logs redact identifiers; store spans not full files

---

## Success Criteria (Vibe Coder Focused)
- **Week 1**: Can answer "how do I fix this build error?" without developer needing to research
- **Week 3**: Reduces "Google time" by 80% through cached docs  
- **Week 6**: Provides project-specific solutions 90% of the time
- **Week 9**: Learns developer's coding style and suggests accordingly
- **Month 3**: Fast startup (<15 min on new repo), ≥70% first-pass fix rate, ≤2 retries median

## Vibe Coder Benefits Summary
- **Less Research**: Context7 cache eliminates need to search docs repeatedly
- **Fewer Wrong Turns**: Lessons learned prevent repeating past mistakes  
- **Faster Iteration**: Project-aware context means fewer back-and-forth with AI
- **Confidence Building**: AI suggestions are grounded in your actual project patterns
- **Learning by Doing**: System gets smarter as you code, no manual configuration

## Quick Start Guide (Vibe Coder Friendly)
```bash
# 1. Run the gateway (one command)
docker run -p 3000:3000 -v $(pwd):/workspace mcp-gateway

# 2. Connect Cursor to localhost:3000
# 3. Start coding - AI now knows your project!

# Example queries that work better:
# "How do I add auth to this Next.js app?" (gets project-specific guidance)
# "Fix this build error" (AI reads your config and suggests fixes)
# "What's the best way to handle state here?" (considers your existing patterns)
```

## What Makes This Different for Vibe Coders
- **No Configuration**: Works out of the box with smart defaults
- **Project Awareness**: AI understands your specific codebase, not just generic patterns
- **Learning System**: Gets better as you use it, no manual tuning required
- **Local First**: Everything runs on your machine, no external dependencies during coding
- **Instant Context**: No waiting for API calls or searching documentation