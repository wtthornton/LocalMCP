/**
 * Simple Learning Integration Service
 * 
 * Tracks pattern success rates in SQLite for simple learning capabilities.
 * Reuses existing SQLite infrastructure and adds basic learning metrics.
 */

import Database from 'better-sqlite3';
import type { LibraryMatch } from './framework-detector.types.js';
import type { AdaptivePattern } from './adaptive-pattern.interface.js';
import { Context7CacheService } from './context7-cache.service.js';

export interface LearningMetrics {
  patternId: string;
  totalUses: number;
  successfulUses: number;
  averageConfidence: number;
  lastUsed: number;
  successRate: number;
  lastUpdated: number;
}

export interface DetectionFeedback {
  patternMatches: LibraryMatch[];
  aiPredictions: LibraryMatch[];
  userAccepted: boolean;
  actualFrameworks?: string[];
  timestamp: number;
}

export class SimpleLearningIntegrationService {
  private db: Database.Database;
  private cacheService: Context7CacheService;

  constructor(cacheService: Context7CacheService, dbPath?: string) {
    this.cacheService = cacheService;
    this.initializeDatabase(dbPath);
  }

  /**
   * Initialize SQLite database for learning metrics
   */
  private initializeDatabase(dbPath?: string): void {
    try {
      this.db = new Database(dbPath || 'prompt-cache.db');
      
      // Create learning metrics table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS pattern_learning_metrics (
          pattern_id TEXT PRIMARY KEY,
          total_uses INTEGER DEFAULT 0,
          successful_uses INTEGER DEFAULT 0,
          average_confidence REAL DEFAULT 0,
          last_used INTEGER DEFAULT 0,
          success_rate REAL DEFAULT 0,
          last_updated INTEGER DEFAULT 0
        )
      `);

      // Create detection feedback table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS detection_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pattern_matches TEXT NOT NULL,
          ai_predictions TEXT NOT NULL,
          user_accepted BOOLEAN NOT NULL,
          actual_frameworks TEXT,
          timestamp INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_pattern_learning_pattern_id ON pattern_learning_metrics(pattern_id);
        CREATE INDEX IF NOT EXISTS idx_detection_feedback_timestamp ON detection_feedback(timestamp);
      `);

      console.log('Learning integration database initialized');
    } catch (error) {
      console.error('Failed to initialize learning database', { error });
      throw error;
    }
  }

  /**
   * Record detection feedback for learning
   */
  async recordFeedback(feedback: DetectionFeedback): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO detection_feedback (pattern_matches, ai_predictions, user_accepted, actual_frameworks, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        JSON.stringify(feedback.patternMatches),
        JSON.stringify(feedback.aiPredictions),
        feedback.userAccepted ? 1 : 0,
        JSON.stringify(feedback.actualFrameworks || []),
        feedback.timestamp
      );

      // Update pattern success rates based on feedback
      await this.updatePatternMetrics(feedback);

      console.log('Detection feedback recorded', { 
        userAccepted: feedback.userAccepted,
        patternCount: feedback.patternMatches.length,
        aiCount: feedback.aiPredictions.length
      });
    } catch (error) {
      console.error('Failed to record detection feedback', { error });
    }
  }

  /**
   * Update pattern metrics based on feedback
   */
  private async updatePatternMetrics(feedback: DetectionFeedback): Promise<void> {
    try {
      // Process pattern matches
      for (const match of feedback.patternMatches) {
        const patternId = this.extractPatternId(match.source);
        if (patternId) {
          await this.updatePatternSuccessRate(patternId, feedback.userAccepted, match.confidence);
        }
      }

      // Process AI predictions
      for (const prediction of feedback.aiPredictions) {
        if (prediction.source.includes('pattern')) {
          const patternId = this.extractPatternId(prediction.source);
          if (patternId) {
            await this.updatePatternSuccessRate(patternId, feedback.userAccepted, prediction.confidence);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update pattern metrics', { error });
    }
  }

  /**
   * Update success rate for a specific pattern
   */
  private async updatePatternSuccessRate(patternId: string, success: boolean, confidence: number): Promise<void> {
    try {
      // Get current metrics
      const current = this.getPatternMetrics(patternId);
      
      // Update metrics
      const newTotalUses = current.totalUses + 1;
      const newSuccessfulUses = current.successfulUses + (success ? 1 : 0);
      const newSuccessRate = newSuccessfulUses / newTotalUses;
      const newAverageConfidence = (current.averageConfidence * current.totalUses + confidence) / newTotalUses;

      // Upsert metrics
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO pattern_learning_metrics 
        (pattern_id, total_uses, successful_uses, average_confidence, last_used, success_rate, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        patternId,
        newTotalUses,
        newSuccessfulUses,
        newAverageConfidence,
        Date.now(),
        newSuccessRate,
        Date.now()
      );

      console.log('Pattern metrics updated', { 
        patternId, 
        successRate: newSuccessRate, 
        totalUses: newTotalUses 
      });
    } catch (error) {
      console.error('Failed to update pattern success rate', { error, patternId });
    }
  }

  /**
   * Get learning metrics for a pattern
   */
  getPatternMetrics(patternId: string): LearningMetrics {
    try {
      const stmt = this.db.prepare('SELECT * FROM pattern_learning_metrics WHERE pattern_id = ?');
      const row = stmt.get(patternId) as any;

      if (row) {
        return {
          patternId: row.pattern_id,
          totalUses: row.total_uses,
          successfulUses: row.successful_uses,
          averageConfidence: row.average_confidence,
          lastUsed: row.last_used,
          successRate: row.success_rate,
          lastUpdated: row.last_updated
        };
      }

      // Return default metrics for new patterns
      return {
        patternId,
        totalUses: 0,
        successfulUses: 0,
        averageConfidence: 0,
        lastUsed: 0,
        successRate: 0.5, // Start with neutral success rate
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Failed to get pattern metrics', { error, patternId });
      return {
        patternId,
        totalUses: 0,
        successfulUses: 0,
        averageConfidence: 0,
        lastUsed: 0,
        successRate: 0.5,
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Get all learning metrics
   */
  getAllMetrics(): LearningMetrics[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM pattern_learning_metrics ORDER BY success_rate DESC');
      const rows = stmt.all() as any[];

      return rows.map(row => ({
        patternId: row.pattern_id,
        totalUses: row.total_uses,
        successfulUses: row.successful_uses,
        averageConfidence: row.average_confidence,
        lastUsed: row.last_used,
        successRate: row.success_rate,
        lastUpdated: row.last_updated
      }));
    } catch (error) {
      console.error('Failed to get all metrics', { error });
      return [];
    }
  }

  /**
   * Extract pattern ID from source string
   */
  private extractPatternId(source: string): string | null {
    // Extract pattern ID from source like "pattern-create-component" or "pattern-enhanced"
    const match = source.match(/pattern-([^,\s]+)/);
    return match ? match[1] : null;
  }

  /**
   * Clean up old feedback data
   */
  cleanupOldData(daysToKeep: number = 30): void {
    try {
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      const stmt = this.db.prepare('DELETE FROM detection_feedback WHERE timestamp < ?');
      const result = stmt.run(cutoffTime);
      
      console.log('Cleaned up old feedback data', { 
        deletedRows: result.changes,
        cutoffDays: daysToKeep 
      });
    } catch (error) {
      console.error('Failed to cleanup old data', { error });
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    try {
      this.db?.close();
      console.log('Learning integration database closed');
    } catch (error) {
      console.error('Failed to close learning database', { error });
    }
  }
}
