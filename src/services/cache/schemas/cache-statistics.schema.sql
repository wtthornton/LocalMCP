-- Cache Statistics Schema
-- Tracks performance metrics for both cache types

CREATE TABLE IF NOT EXISTS cache_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_type TEXT NOT NULL CHECK (cache_type IN ('raw', 'summarized')),
  hit_count INTEGER DEFAULT 0,
  miss_count INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  average_response_time REAL DEFAULT 0,
  token_savings INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_stats_type ON cache_statistics(cache_type);
CREATE INDEX IF NOT EXISTS idx_cache_stats_updated_at ON cache_statistics(updated_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_cache_stats_updated_at
  AFTER UPDATE ON cache_statistics
  FOR EACH ROW
  BEGIN
    UPDATE cache_statistics 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
  END;
