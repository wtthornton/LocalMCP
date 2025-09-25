/**
 * Database Migrations Service
 * 
 * Handles database schema migrations for PromptMCP
 * Manages versioning and updates for todo system enhancements
 */

import { Logger } from '../logger/logger.js';
import Database from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
}

export class DatabaseMigrationsService {
  private logger: Logger;
  private db: Database.Database;

  constructor(logger: Logger, db: Database.Database) {
    this.logger = logger;
    this.db = db;
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      this.logger.info('Starting database migrations');

      // Create migrations table if it doesn't exist
      this.createMigrationsTable();

      // Get current version
      const currentVersion = this.getCurrentVersion();
      this.logger.debug('Current database version', { currentVersion });

      // Get all migrations
      const migrations = this.getMigrations();
      const pendingMigrations = migrations.filter(m => m.version > currentVersion);

      if (pendingMigrations.length === 0) {
        this.logger.info('No pending migrations');
        return;
      }

      this.logger.info('Running pending migrations', { 
        count: pendingMigrations.length,
        versions: pendingMigrations.map(m => m.version)
      });

      // Run migrations in order with error handling for duplicates
      for (const migration of pendingMigrations) {
        try {
          await this.runMigration(migration);
        } catch (error) {
          // Check if it's a UNIQUE constraint error (migration already applied)
          if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            this.logger.warn('Migration already applied, skipping', {
              version: migration.version,
              name: migration.name
            });
            continue;
          }
          throw error;
        }
      }

      this.logger.info('Database migrations completed successfully');

    } catch (error) {
      this.logger.error('Database migrations failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create migrations table
   */
  private createMigrationsTable(): void {
    const createTable = `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    this.db.exec(createTable);
  }

  /**
   * Get current database version
   */
  private getCurrentVersion(): number {
    try {
      const result = this.db.prepare('SELECT MAX(version) as version FROM migrations').get() as { version: number | null };
      return result.version || 0;
    } catch (error) {
      this.logger.warn('Failed to get current version, assuming 0', { error });
      return 0;
    }
  }

  /**
   * Get all available migrations
   */
  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: 'create_todos_table',
        up: (db) => {
          const createTodos = `
            CREATE TABLE IF NOT EXISTS todos (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              project_id TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
              priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
              category TEXT DEFAULT 'feature' CHECK (category IN ('feature', 'bug', 'refactor', 'testing', 'documentation', 'deployment', 'maintenance')),
              estimated_hours REAL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              completed_at DATETIME
            )
          `;
          db.exec(createTodos);
        },
        down: (db) => {
          db.exec('DROP TABLE IF EXISTS todos');
        }
      },
      {
        version: 2,
        name: 'create_subtasks_table',
        up: (db) => {
          const createSubtasks = `
            CREATE TABLE IF NOT EXISTS subtasks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              parent_task_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
              estimated_hours REAL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              completed_at DATETIME,
              FOREIGN KEY (parent_task_id) REFERENCES todos(id) ON DELETE CASCADE
            )
          `;
          db.exec(createSubtasks);
        },
        down: (db) => {
          db.exec('DROP TABLE IF EXISTS subtasks');
        }
      },
      {
        version: 3,
        name: 'create_task_dependencies_table',
        up: (db) => {
          const createDependencies = `
            CREATE TABLE IF NOT EXISTS task_dependencies (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              task_id INTEGER NOT NULL,
              depends_on_task_id INTEGER NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (task_id) REFERENCES todos(id) ON DELETE CASCADE,
              FOREIGN KEY (depends_on_task_id) REFERENCES todos(id) ON DELETE CASCADE,
              UNIQUE(task_id, depends_on_task_id)
            )
          `;
          db.exec(createDependencies);
        },
        down: (db) => {
          db.exec('DROP TABLE IF EXISTS task_dependencies');
        }
      },
      {
        version: 4,
        name: 'create_task_plans_table',
        up: (db) => {
          const createTaskPlans = `
            CREATE TABLE IF NOT EXISTS task_plans (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              project_id TEXT NOT NULL,
              original_prompt TEXT NOT NULL,
              plan_data TEXT, -- JSON
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `;
          db.exec(createTaskPlans);
        },
        down: (db) => {
          db.exec('DROP TABLE IF EXISTS task_plans');
        }
      },
      {
        version: 5,
        name: 'add_indexes_for_performance',
        up: (db) => {
          // Add indexes for better performance
          db.exec('CREATE INDEX IF NOT EXISTS idx_todos_project_id ON todos(project_id)');
          db.exec('CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status)');
          db.exec('CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)');
          db.exec('CREATE INDEX IF NOT EXISTS idx_subtasks_parent_task_id ON subtasks(parent_task_id)');
          db.exec('CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status)');
          db.exec('CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id)');
          db.exec('CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id)');
          db.exec('CREATE INDEX IF NOT EXISTS idx_task_plans_project_id ON task_plans(project_id)');
        },
        down: (db) => {
          db.exec('DROP INDEX IF EXISTS idx_todos_project_id');
          db.exec('DROP INDEX IF EXISTS idx_todos_status');
          db.exec('DROP INDEX IF EXISTS idx_todos_priority');
          db.exec('DROP INDEX IF EXISTS idx_subtasks_parent_task_id');
          db.exec('DROP INDEX IF EXISTS idx_subtasks_status');
          db.exec('DROP INDEX IF EXISTS idx_task_dependencies_task_id');
          db.exec('DROP INDEX IF EXISTS idx_task_dependencies_depends_on');
          db.exec('DROP INDEX IF EXISTS idx_task_plans_project_id');
        }
      }
    ];
  }

  /**
   * Run a single migration
   */
  private async runMigration(migration: Migration): Promise<void> {
    const transaction = this.db.transaction(() => {
      try {
        this.logger.info('Running migration', { 
          version: migration.version, 
          name: migration.name 
        });
        
        migration.up(this.db);
        
        // Record migration with INSERT OR IGNORE to handle duplicates
        const insertMigration = this.db.prepare(`
          INSERT OR IGNORE INTO migrations (version, name) VALUES (?, ?)
        `);
        const result = insertMigration.run(migration.version, migration.name);
        
        // Check if the insert actually happened
        if (result.changes === 0) {
          this.logger.warn('Migration already exists, skipping record insertion', {
            version: migration.version,
            name: migration.name
          });
        }
        
        this.logger.info('Migration completed', { 
          version: migration.version, 
          name: migration.name 
        });
      } catch (error) {
        this.logger.error('Migration failed', {
          version: migration.version,
          name: migration.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    });
    
    transaction();
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(targetVersion: number): Promise<void> {
    try {
      this.logger.info('Rolling back database', { targetVersion });

      const currentVersion = this.getCurrentVersion();
      const migrations = this.getMigrations();
      const migrationsToRollback = migrations
        .filter(m => m.version > targetVersion && m.version <= currentVersion)
        .sort((a, b) => b.version - a.version); // Rollback in reverse order

      for (const migration of migrationsToRollback) {
        this.logger.info('Rolling back migration', { 
          version: migration.version, 
          name: migration.name 
        });
        
        migration.down(this.db);
        
        // Remove migration record
        const deleteMigration = this.db.prepare('DELETE FROM migrations WHERE version = ?');
        deleteMigration.run(migration.version);
      }

      this.logger.info('Database rollback completed', { targetVersion });

    } catch (error) {
      this.logger.error('Database rollback failed', {
        targetVersion,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): { currentVersion: number; availableMigrations: number; pendingMigrations: number } {
    const currentVersion = this.getCurrentVersion();
    const migrations = this.getMigrations();
    const pendingMigrations = migrations.filter(m => m.version > currentVersion).length;

    return {
      currentVersion,
      availableMigrations: migrations.length,
      pendingMigrations
    };
  }
}
