-- Summarized Context Cache Schema
-- Stores AI-summarized context with long TTL (24-48 hours)

CREATE TABLE IF NOT EXISTS summarized_context_cache (
  id TEXT PRIMARY KEY,
  project_signature TEXT NOT NULL,
  frameworks TEXT NOT NULL, -- JSON array of detected frameworks
  summarization_version TEXT NOT NULL, -- Version for cache invalidation
  summarized_repo_facts TEXT NOT NULL, -- JSON array of summarized project facts
  summarized_context7_docs TEXT NOT NULL, -- JSON array of summarized Context7 docs
  summarized_code_snippets TEXT NOT NULL, -- JSON array of summarized code snippets
  original_token_count INTEGER NOT NULL,
  summarized_token_count INTEGER NOT NULL,
  quality_score REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_summarized_project_signature ON summarized_context_cache(project_signature);
CREATE INDEX IF NOT EXISTS idx_summarized_frameworks ON summarized_context_cache(frameworks);
CREATE INDEX IF NOT EXISTS idx_summarized_version ON summarized_context_cache(summarization_version);
CREATE INDEX IF NOT EXISTS idx_summarized_expires_at ON summarized_context_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_summarized_last_accessed ON summarized_context_cache(last_accessed);
CREATE INDEX IF NOT EXISTS idx_summarized_quality_score ON summarized_context_cache(quality_score);

-- Trigger to update last_accessed on access
CREATE TRIGGER IF NOT EXISTS update_summarized_context_last_accessed
  AFTER UPDATE OF access_count ON summarized_context_cache
  FOR EACH ROW
  BEGIN
    UPDATE summarized_context_cache 
    SET last_accessed = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
  END;
