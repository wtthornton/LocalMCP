-- Raw Context Cache Schema
-- Stores original, unprocessed context with short TTL (1-2 hours)

CREATE TABLE IF NOT EXISTS raw_context_cache (
  id TEXT PRIMARY KEY,
  project_signature TEXT NOT NULL,
  frameworks TEXT NOT NULL, -- JSON array of detected frameworks
  repo_facts TEXT NOT NULL, -- JSON array of project facts
  context7_docs TEXT NOT NULL, -- JSON array of Context7 documentation
  code_snippets TEXT NOT NULL, -- JSON array of code snippets
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_raw_context_project_signature ON raw_context_cache(project_signature);
CREATE INDEX IF NOT EXISTS idx_raw_context_frameworks ON raw_context_cache(frameworks);
CREATE INDEX IF NOT EXISTS idx_raw_context_expires_at ON raw_context_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_raw_context_last_accessed ON raw_context_cache(last_accessed);

-- Trigger to update last_accessed on access
CREATE TRIGGER IF NOT EXISTS update_raw_context_last_accessed
  AFTER UPDATE OF access_count ON raw_context_cache
  FOR EACH ROW
  BEGIN
    UPDATE raw_context_cache 
    SET last_accessed = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
  END;
