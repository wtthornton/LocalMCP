import { Logger } from '../services/logger/logger.js';

export interface LocalMCPConfig {
  server: {
    name: string;
    version: string;
    port: number;
  };
  context7: {
    enabled: boolean;
    apiKey?: string | undefined;
    baseUrl: string;
    cacheEnabled: boolean;
    cacheTtl: number;
    mcp: {
      enabled: boolean;
      serverUrl: string;
      timeout: number;
    };
  };
  database: {
    type: 'sqlite' | 'qdrant';
    path?: string | undefined;
    url?: string | undefined;
    apiKey?: string | undefined;
  };
  vector: {
    qdrant: {
      url: string;
      apiKey?: string | undefined;
      collections: {
        documents: string;
        lessons: string;
        patterns: string;
      };
    };
  };
  playwright: {
    mcp: {
      enabled: boolean;
      baseUrl: string;
      timeout: number;
    };
  };
  cache: {
    context7: {
      maxMemoryEntries: number;
      maxMemorySize: number;
      defaultTtl: number;
      maxTtl: number;
      cleanupInterval: number;
      enablePersistence: boolean;
      dbPath: string;
    };
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableFile: boolean;
    filePath?: string;
  };
  tools: {
    analyze: {
      enabled: boolean;
      maxDepth: number;
      includeNodeModules: boolean;
    };
    create: {
      enabled: boolean;
      defaultFramework: string;
      includeTests: boolean;
    };
    fix: {
      enabled: boolean;
      autoApply: boolean;
      backupOriginal: boolean;
    };
    learn: {
      enabled: boolean;
      storagePath: string;
      maxLessons: number;
    };
  };
}

/**
 * ConfigService - Configuration management for LocalMCP
 * 
 * Handles loading and validation of configuration from environment variables
 * and config files. Provides sensible defaults for vibe coders.
 */
export class ConfigService {
  private config: LocalMCPConfig;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ConfigService');
    this.config = this.loadConfig();
    this.validateConfig();
  }

  getConfig(): LocalMCPConfig {
    return this.config;
  }

  get<K extends keyof LocalMCPConfig>(key: K): LocalMCPConfig[K] {
    return this.config[key];
  }

  getNested<K extends keyof LocalMCPConfig, T extends keyof LocalMCPConfig[K]>(
    section: K,
    key: T
  ): LocalMCPConfig[K][T] {
    return this.config[section][key];
  }

  private loadConfig(): LocalMCPConfig {
    const config: LocalMCPConfig = {
      server: {
        name: process.env.LOCALMCP_NAME || 'localmcp',
        version: process.env.LOCALMCP_VERSION || '1.0.0',
        port: parseInt(process.env.LOCALMCP_PORT || '3000', 10)
      },
      context7: {
        enabled: process.env.CONTEXT7_ENABLED === 'true',
        apiKey: process.env.CONTEXT7_API_KEY || undefined,
        baseUrl: process.env.CONTEXT7_BASE_URL || 'https://api.context7.io',
        cacheEnabled: process.env.CONTEXT7_CACHE_ENABLED !== 'false',
        cacheTtl: parseInt(process.env.CONTEXT7_CACHE_TTL || '3600', 10),
        mcp: {
          enabled: process.env.CONTEXT7_MCP_ENABLED === 'true',
          serverUrl: process.env.CONTEXT7_MCP_URL || 'http://localhost:3001',
          timeout: parseInt(process.env.CONTEXT7_MCP_TIMEOUT || '30000', 10)
        }
      },
      database: {
        type: (process.env.DATABASE_TYPE as 'sqlite' | 'qdrant') || 'sqlite',
        path: process.env.DATABASE_PATH || './data/localmcp.db',
        url: process.env.QDRANT_URL || undefined,
        apiKey: process.env.QDRANT_API_KEY || undefined
      },
      vector: {
        qdrant: {
          url: process.env.QDRANT_URL || 'http://localhost:6333',
          apiKey: process.env.QDRANT_API_KEY || undefined,
          collections: {
            documents: process.env.QDRANT_COLLECTION_DOCUMENTS || 'localmcp_documents',
            lessons: process.env.QDRANT_COLLECTION_LESSONS || 'localmcp_lessons',
            patterns: process.env.QDRANT_COLLECTION_PATTERNS || 'localmcp_patterns'
          }
        }
      },
      playwright: {
        mcp: {
          enabled: process.env.PLAYWRIGHT_ENABLED === 'true',
          baseUrl: process.env.PLAYWRIGHT_MCP_URL || 'http://localhost:8931',
          timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10)
        }
      },
      cache: {
        context7: {
          maxMemoryEntries: parseInt(process.env.CACHE_MAX_MEMORY_ENTRIES || '1000', 10),
          maxMemorySize: parseInt(process.env.CACHE_MAX_MEMORY_SIZE || '52428800', 10), // 50MB
          defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10), // 1 hour
          maxTtl: parseInt(process.env.CACHE_MAX_TTL || '86400', 10), // 24 hours
          cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '300', 10), // 5 minutes
          enablePersistence: process.env.CACHE_ENABLE_PERSISTENCE !== 'false',
          dbPath: process.env.CACHE_DB_PATH || './data/cache/context7.db'
        }
      },
      logging: {
        level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
        enableConsole: process.env.LOG_CONSOLE !== 'false',
        enableFile: process.env.LOG_FILE === 'true',
        filePath: process.env.LOG_FILE_PATH || './logs/localmcp.log'
      },
      tools: {
        analyze: {
          enabled: process.env.TOOL_ANALYZE_ENABLED !== 'false',
          maxDepth: parseInt(process.env.TOOL_ANALYZE_MAX_DEPTH || '10', 10),
          includeNodeModules: process.env.TOOL_ANALYZE_INCLUDE_NODE_MODULES === 'true'
        },
        create: {
          enabled: process.env.TOOL_CREATE_ENABLED !== 'false',
          defaultFramework: process.env.TOOL_CREATE_DEFAULT_FRAMEWORK || 'react',
          includeTests: process.env.TOOL_CREATE_INCLUDE_TESTS === 'true'
        },
        fix: {
          enabled: process.env.TOOL_FIX_ENABLED !== 'false',
          autoApply: process.env.TOOL_FIX_AUTO_APPLY === 'true',
          backupOriginal: process.env.TOOL_FIX_BACKUP_ORIGINAL !== 'false'
        },
        learn: {
          enabled: process.env.TOOL_LEARN_ENABLED !== 'false',
          storagePath: process.env.TOOL_LEARN_STORAGE_PATH || './data/lessons',
          maxLessons: parseInt(process.env.TOOL_LEARN_MAX_LESSONS || '1000', 10)
        }
      }
    };

    this.logger.info('Configuration loaded', {
      server: config.server.name,
      context7Enabled: config.context7.enabled,
      databaseType: config.database.type,
      logLevel: config.logging.level
    });

    return config;
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate server config
    if (!this.config.server.name) {
      errors.push('Server name is required');
    }
    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push('Server port must be between 1 and 65535');
    }

    // Validate Context7 config
    if (this.config.context7.enabled && !this.config.context7.apiKey) {
      errors.push('Context7 API key is required when Context7 is enabled');
    }

    // Validate database config
    if (this.config.database.type === 'qdrant') {
      if (!this.config.database.url) {
        errors.push('Qdrant URL is required when using Qdrant database');
      }
    }

    // Validate logging config
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(this.config.logging.level)) {
      errors.push(`Log level must be one of: ${validLogLevels.join(', ')}`);
    }

    // Validate tools config
    if (this.config.tools.analyze.maxDepth < 1) {
      errors.push('Analyze max depth must be at least 1');
    }
    if (this.config.tools.learn.maxLessons < 1) {
      errors.push('Learn max lessons must be at least 1');
    }

    if (errors.length > 0) {
      this.logger.error('Configuration validation failed', { errors });
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    this.logger.info('Configuration validation passed');
  }

  // Helper methods for common config access patterns
  isContext7Enabled(): boolean {
    return this.config.context7.enabled;
  }

  isToolEnabled(tool: keyof LocalMCPConfig['tools']): boolean {
    return this.config.tools[tool].enabled;
  }

  getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.config.logging.level;
  }

  getDatabaseConfig() {
    return this.config.database;
  }

  getContext7Config() {
    return this.config.context7;
  }
}