import { Logger } from '../services/logger/logger.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface PromptMCPConfig {
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
    useHttpOnly: boolean;
    checkCompatibility: boolean;
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
  openai: {
    apiKey?: string | undefined;
    projectId?: string | undefined;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
    retries: number;
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
  admin: {
    enabled: boolean;
    port: number;
    auth?: {
      username: string;
      password: string;
    } | undefined;
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
  frameworkDetection: {
    enabled: boolean;
    confidenceThreshold: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    aiEnabled: boolean;
    patternDetectionEnabled: boolean;
    projectContextEnabled: boolean;
    maxLibrariesPerDetection: number;
    aiTimeoutMs: number;
  };
  promptEnhancement: {
    enabled: boolean;
    defaultStrategy: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware';
    qualityThreshold: number;
    maxTokens: number;
    temperature: number;
    costLimit: number;
    rateLimit: number;
    fallbackEnabled: boolean;
    optimization: {
      tokenOptimization: {
        contextTruncation: boolean;
        smartSummarization: boolean;
        relevanceFiltering: boolean;
        priorityBasedSelection: boolean;
      };
      qualityOptimization: {
        qualityScoring: boolean;
        confidenceThresholds: boolean;
        validationChecks: boolean;
        feedbackLoop: boolean;
      };
      costOptimization: {
        modelSelection: boolean;
        tokenBudgeting: boolean;
        cacheUtilization: boolean;
        batchProcessing: boolean;
      };
      performanceOptimization: {
        parallelProcessing: boolean;
        caching: boolean;
        responseStreaming: boolean;
        loadBalancing: boolean;
      };
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
  private config: PromptMCPConfig;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ConfigService');
    this.loadMCPConfiguration();
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadMCPConfiguration(): void {
    try {
      const mcpConfigPath = process.env.MCP_CONFIG_PATH || join(process.cwd(), 'mcp-config.json');
      this.logger.info('Loading MCP configuration from', { path: mcpConfigPath });
      
      const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
      const promptmcpConfig = mcpConfig.mcpServers.promptmcp;
      
      // DEBUG: Print what we're loading
      console.log('🔑 [ConfigService] Loading MCP configuration:');
      console.log('  MCP Config Path:', mcpConfigPath);
      console.log('  PromptMCP Config:', promptmcpConfig);
      console.log('  Environment variables before loading:', {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT SET',
        OPENAI_PROJECT_ID: process.env.OPENAI_PROJECT_ID || 'NOT SET',
        CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY ? `${process.env.CONTEXT7_API_KEY.substring(0, 20)}...` : 'NOT SET'
      });
      
      if (promptmcpConfig && promptmcpConfig.env) {
        // Load API keys from MCP config into environment variables
        if (promptmcpConfig.env.CONTEXT7_API_KEY) {
          process.env.CONTEXT7_API_KEY = promptmcpConfig.env.CONTEXT7_API_KEY;
          console.log('  ✅ Set CONTEXT7_API_KEY from MCP config');
        }
        if (promptmcpConfig.env.OPENAI_API_KEY) {
          process.env.OPENAI_API_KEY = promptmcpConfig.env.OPENAI_API_KEY;
          console.log('  ✅ Set OPENAI_API_KEY from MCP config');
        }
        if (promptmcpConfig.env.OPENAI_PROJECT_ID) {
          process.env.OPENAI_PROJECT_ID = promptmcpConfig.env.OPENAI_PROJECT_ID;
          console.log('  ✅ Set OPENAI_PROJECT_ID from MCP config');
        }
        if (promptmcpConfig.env.CONTEXT7_ENABLED) {
          process.env.CONTEXT7_ENABLED = promptmcpConfig.env.CONTEXT7_ENABLED;
          console.log('  ✅ Set CONTEXT7_ENABLED from MCP config');
        }
        if (promptmcpConfig.env.CONTEXT7_USE_HTTP_ONLY) {
          process.env.CONTEXT7_USE_HTTP_ONLY = promptmcpConfig.env.CONTEXT7_USE_HTTP_ONLY;
          console.log('  ✅ Set CONTEXT7_USE_HTTP_ONLY from MCP config');
        }
        if (promptmcpConfig.env.CONTEXT7_DEBUG) {
          process.env.CONTEXT7_DEBUG = promptmcpConfig.env.CONTEXT7_DEBUG;
          this.logger.info('CONTEXT7_DEBUG environment variable set', { value: promptmcpConfig.env.CONTEXT7_DEBUG });
          console.log('  ✅ Set CONTEXT7_DEBUG from MCP config');
        }
        
        // DEBUG: Print environment variables after loading
        console.log('  Environment variables after loading:', {
          OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT SET',
          OPENAI_PROJECT_ID: process.env.OPENAI_PROJECT_ID || 'NOT SET',
          CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY ? `${process.env.CONTEXT7_API_KEY.substring(0, 20)}...` : 'NOT SET'
        });
        
        this.logger.info('MCP configuration loaded successfully', {
          hasContext7Key: !!process.env.CONTEXT7_API_KEY,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          hasOpenAIProjectId: !!process.env.OPENAI_PROJECT_ID
        });
      } else {
        this.logger.warn('No promptmcp configuration found in MCP config, falling back to environment variables');
        this.loadEnvironmentVariables();
      }
    } catch (error) {
      this.logger.warn('Failed to load MCP configuration, falling back to environment variables', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.loadEnvironmentVariables();
    }
  }

  private loadEnvironmentVariables(): void {
    // Load Context7 API key from environment or use default
    if (!process.env.CONTEXT7_API_KEY) {
      this.logger.warn('CONTEXT7_API_KEY not found in environment variables');
    }
    
    // Set default Context7 enabled state if not provided
    if (!process.env.CONTEXT7_ENABLED) {
      process.env.CONTEXT7_ENABLED = 'true';
    }
    
    if (!process.env.CONTEXT7_BASE_URL) {
      process.env.CONTEXT7_BASE_URL = 'https://mcp.context7.com/mcp';
    }

    // Set OpenAI environment variables if not provided
    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn('OPENAI_API_KEY not set - breakdown tool will not be available');
    }
    
    if (!process.env.OPENAI_PROJECT_ID) {
      this.logger.warn('OPENAI_PROJECT_ID not set - breakdown tool will not be available');
    }
  }

  getConfig(): PromptMCPConfig {
    return this.config;
  }

  get<K extends keyof PromptMCPConfig>(key: K): PromptMCPConfig[K] {
    return this.config[key];
  }

  getWithDefault<K extends keyof PromptMCPConfig>(key: K, defaultValue: PromptMCPConfig[K]): PromptMCPConfig[K] {
    return this.config[key] ?? defaultValue;
  }

  getEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] ?? defaultValue;
  }

  getNested<K extends keyof PromptMCPConfig, T extends keyof PromptMCPConfig[K]>(
    section: K,
    key: T
  ): PromptMCPConfig[K][T] {
    return this.config[section][key];
  }

  private loadConfig(): PromptMCPConfig {
    const config: PromptMCPConfig = {
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
        useHttpOnly: process.env.CONTEXT7_USE_HTTP_ONLY === 'true',
        checkCompatibility: process.env.CONTEXT7_CHECK_COMPATIBILITY !== 'false',
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
      openai: {
        apiKey: process.env.OPENAI_API_KEY || undefined,
        projectId: process.env.OPENAI_PROJECT_ID || undefined,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000', 10),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000', 10),
        retries: parseInt(process.env.OPENAI_RETRIES || '3', 10)
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
          admin: {
            enabled: process.env.ADMIN_ENABLED === 'true',
            port: parseInt(process.env.ADMIN_PORT || '3001', 10),
            auth: process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD ? {
              username: process.env.ADMIN_USERNAME,
              password: process.env.ADMIN_PASSWORD
            } : undefined
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
      },
      frameworkDetection: {
        enabled: process.env.FRAMEWORK_DETECTION_ENABLED !== 'false',
        confidenceThreshold: parseFloat(process.env.FRAMEWORK_DETECTION_CONFIDENCE_THRESHOLD || '0.3'),
        cacheEnabled: process.env.FRAMEWORK_DETECTION_CACHE_ENABLED !== 'false',
        cacheTTL: parseInt(process.env.FRAMEWORK_DETECTION_CACHE_TTL || '86400', 10), // 24 hours
        aiEnabled: process.env.FRAMEWORK_DETECTION_AI_ENABLED !== 'false',
        patternDetectionEnabled: process.env.FRAMEWORK_DETECTION_PATTERN_ENABLED !== 'false',
        projectContextEnabled: process.env.FRAMEWORK_DETECTION_PROJECT_ENABLED !== 'false',
        maxLibrariesPerDetection: parseInt(process.env.FRAMEWORK_DETECTION_MAX_LIBRARIES || '5', 10),
        aiTimeoutMs: parseInt(process.env.FRAMEWORK_DETECTION_AI_TIMEOUT || '5000', 10)
      },
      promptEnhancement: {
        enabled: process.env.PROMPT_ENHANCEMENT_ENABLED === 'true',
        defaultStrategy: (process.env.PROMPT_ENHANCEMENT_STRATEGY_TYPE as 'general' | 'framework-specific' | 'quality-focused' | 'project-aware') || 'general',
        qualityThreshold: parseFloat(process.env.PROMPT_ENHANCEMENT_QUALITY_THRESHOLD || '0.8'),
        maxTokens: parseInt(process.env.PROMPT_ENHANCEMENT_MAX_TOKENS || '2000', 10),
        temperature: parseFloat(process.env.PROMPT_ENHANCEMENT_TEMPERATURE || '0.3'),
        costLimit: parseFloat(process.env.PROMPT_ENHANCEMENT_COST_LIMIT || '10.0'),
        rateLimit: parseInt(process.env.PROMPT_ENHANCEMENT_RATE_LIMIT || '100', 10),
        fallbackEnabled: process.env.PROMPT_ENHANCEMENT_FALLBACK_ENABLED !== 'false',
        optimization: {
          tokenOptimization: {
            contextTruncation: process.env.PROMPT_ENHANCEMENT_TOKEN_CONTEXT_TRUNCATION !== 'false',
            smartSummarization: process.env.PROMPT_ENHANCEMENT_TOKEN_SMART_SUMMARIZATION !== 'false',
            relevanceFiltering: process.env.PROMPT_ENHANCEMENT_TOKEN_RELEVANCE_FILTERING !== 'false',
            priorityBasedSelection: process.env.PROMPT_ENHANCEMENT_TOKEN_PRIORITY_SELECTION !== 'false'
          },
          qualityOptimization: {
            qualityScoring: process.env.PROMPT_ENHANCEMENT_QUALITY_SCORING !== 'false',
            confidenceThresholds: process.env.PROMPT_ENHANCEMENT_QUALITY_CONFIDENCE_THRESHOLDS !== 'false',
            validationChecks: process.env.PROMPT_ENHANCEMENT_QUALITY_VALIDATION_CHECKS !== 'false',
            feedbackLoop: process.env.PROMPT_ENHANCEMENT_QUALITY_FEEDBACK_LOOP === 'true'
          },
          costOptimization: {
            modelSelection: process.env.PROMPT_ENHANCEMENT_COST_MODEL_SELECTION !== 'false',
            tokenBudgeting: process.env.PROMPT_ENHANCEMENT_COST_TOKEN_BUDGETING !== 'false',
            cacheUtilization: process.env.PROMPT_ENHANCEMENT_COST_CACHE_UTILIZATION !== 'false',
            batchProcessing: process.env.PROMPT_ENHANCEMENT_COST_BATCH_PROCESSING === 'true'
          },
          performanceOptimization: {
            parallelProcessing: process.env.PROMPT_ENHANCEMENT_PERF_PARALLEL_PROCESSING !== 'false',
            caching: process.env.PROMPT_ENHANCEMENT_PERF_CACHING !== 'false',
            responseStreaming: process.env.PROMPT_ENHANCEMENT_PERF_RESPONSE_STREAMING === 'true',
            loadBalancing: process.env.PROMPT_ENHANCEMENT_PERF_LOAD_BALANCING === 'true'
          }
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

    // Validate framework detection config
    if (this.config.frameworkDetection.confidenceThreshold < 0 || this.config.frameworkDetection.confidenceThreshold > 1) {
      errors.push('Framework detection confidence threshold must be between 0 and 1');
    }
    if (this.config.frameworkDetection.cacheTTL < 1) {
      errors.push('Framework detection cache TTL must be at least 1 second');
    }
    if (this.config.frameworkDetection.maxLibrariesPerDetection < 1) {
      errors.push('Framework detection max libraries must be at least 1');
    }
    if (this.config.frameworkDetection.aiTimeoutMs < 1000) {
      errors.push('Framework detection AI timeout must be at least 1000ms');
    }

    // Validate prompt enhancement config
    if (this.config.promptEnhancement.enabled) {
      const validStrategies = ['general', 'framework-specific', 'quality-focused', 'project-aware'];
      if (!validStrategies.includes(this.config.promptEnhancement.defaultStrategy)) {
        errors.push(`Prompt enhancement default strategy must be one of: ${validStrategies.join(', ')}`);
      }
      if (this.config.promptEnhancement.qualityThreshold < 0 || this.config.promptEnhancement.qualityThreshold > 1) {
        errors.push('Prompt enhancement quality threshold must be between 0 and 1');
      }
      if (this.config.promptEnhancement.maxTokens < 100 || this.config.promptEnhancement.maxTokens > 8000) {
        errors.push('Prompt enhancement max tokens must be between 100 and 8000');
      }
      if (this.config.promptEnhancement.temperature < 0 || this.config.promptEnhancement.temperature > 2) {
        errors.push('Prompt enhancement temperature must be between 0 and 2');
      }
      if (this.config.promptEnhancement.costLimit < 0) {
        errors.push('Prompt enhancement cost limit must be non-negative');
      }
      if (this.config.promptEnhancement.rateLimit < 0) {
        errors.push('Prompt enhancement rate limit must be non-negative');
      }
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

  isToolEnabled(tool: keyof PromptMCPConfig['tools']): boolean {
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

  getFrameworkDetectionConfig() {
    return this.config.frameworkDetection;
  }

  getPromptEnhancementConfig() {
    return this.config.promptEnhancement;
  }

  isPromptEnhancementEnabled(): boolean {
    return this.config.promptEnhancement.enabled;
  }
}