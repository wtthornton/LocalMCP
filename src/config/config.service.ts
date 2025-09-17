/**
 * Configuration Service
 * 
 * Centralized configuration management for the Personal MCP Gateway.
 * Loads configuration from environment variables with sensible defaults.
 * 
 * Designed for vibe coders - smart defaults, no complex setup required.
 */

import { z } from 'zod';
import { GatewayConfig } from '../types/index.js';

// Configuration schema for validation
const ConfigSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535).default(3000),
    host: z.string().default('localhost'),
    corsOrigin: z.string().default('http://localhost:3000'),
  }),
  cache: z.object({
    dir: z.string().default('./cache'),
    ttl: z.number().positive().default(86400), // 24 hours
    swr: z.number().positive().default(604800), // 7 days
    maxAge: z.number().positive().default(2592000), // 30 days
    maxMB: z.number().positive().default(400),
    maxEntriesPerPkg: z.number().positive().default(250),
  }),
  vector: z.object({
    url: z.string().url().default('http://localhost:6333'),
    apiKey: z.string().optional(),
    collectionName: z.string().default('mcp-gateway'),
  }),
  playwright: z.object({
    serverUrl: z.string().url().default('http://localhost:8931'),
    browser: z.enum(['chromium', 'firefox', 'webkit']).default('chromium'),
    headless: z.boolean().default(true),
  }),
  pipeline: z.object({
    maxTokens: z.number().positive().default(8000),
    maxChunks: z.number().positive().default(10),
    timeoutMs: z.number().positive().default(120000),
    maxRetries: z.number().min(0).max(5).default(2),
  }),
  rag: z.object({
    chunkSize: z.number().positive().default(512),
    chunkOverlap: z.number().min(0).default(50),
    maxChunksPerFile: z.number().positive().default(3),
    maxTotalChunks: z.number().positive().default(10),
  }),
  lessons: z.object({
    confidenceDecay: z.number().min(0).max(1).default(0.2),
    decayPeriodDays: z.number().positive().default(30),
    promotionThreshold: z.number().positive().default(5),
    promotionSuccessRate: z.number().min(0).max(1).default(0.7),
  }),
});

/**
 * Configuration Service
 * 
 * Provides centralized configuration management with:
 * - Environment variable loading
 * - Schema validation
 * - Sensible defaults for vibe coders
 * - Type safety
 */
export class ConfigService {
  private config: GatewayConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Get the current configuration
   * Returns a read-only copy to prevent accidental mutations
   */
  getConfig(): Readonly<GatewayConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Get a specific configuration section
   * Type-safe access to configuration values
   */
  get<K extends keyof GatewayConfig>(key: K): GatewayConfig[K] {
    return this.config[key];
  }

  /**
   * Check if we're in development mode
   * Useful for enabling debug features
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check if we're in production mode
   * Useful for enabling production optimizations
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Load and validate configuration from environment variables
   * This is where the magic happens for vibe coders - smart defaults!
   */
  private loadConfig(): GatewayConfig {
    try {
      // Load from environment variables with defaults
      const envConfig = {
        server: {
          port: parseInt(process.env.PORT || '3000', 10),
          host: process.env.HOST || 'localhost',
          corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        },
        cache: {
          dir: process.env.CACHE_DIR || './cache',
          ttl: parseInt(process.env.CACHE_TTL || '86400', 10),
          swr: parseInt(process.env.CACHE_SWR || '604800', 10),
          maxAge: parseInt(process.env.CACHE_MAX_AGE || '2592000', 10),
          maxMB: parseInt(process.env.CACHE_MAX_MB || '400', 10),
          maxEntriesPerPkg: parseInt(process.env.CACHE_MAX_ENTRIES_PER_PKG || '250', 10),
        },
        vector: {
          url: process.env.VECTOR_DB_URL || 'http://localhost:6333',
          apiKey: process.env.VECTOR_DB_API_KEY,
          collectionName: process.env.VECTOR_COLLECTION_NAME || 'mcp-gateway',
        },
        playwright: {
          serverUrl: process.env.PLAYWRIGHT_SERVER_URL || 'http://localhost:8931',
          browser: (process.env.PLAYWRIGHT_BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium',
          headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
        },
        pipeline: {
          maxTokens: parseInt(process.env.PIPELINE_MAX_TOKENS || '8000', 10),
          maxChunks: parseInt(process.env.PIPELINE_MAX_CHUNKS || '10', 10),
          timeoutMs: parseInt(process.env.PIPELINE_TIMEOUT_MS || '120000', 10),
          maxRetries: parseInt(process.env.PIPELINE_MAX_RETRIES || '2', 10),
        },
        rag: {
          chunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '512', 10),
          chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '50', 10),
          maxChunksPerFile: parseInt(process.env.RAG_MAX_CHUNKS_PER_FILE || '3', 10),
          maxTotalChunks: parseInt(process.env.RAG_MAX_TOTAL_CHUNKS || '10', 10),
        },
        lessons: {
          confidenceDecay: parseFloat(process.env.LESSONS_CONFIDENCE_DECAY || '0.2'),
          decayPeriodDays: parseInt(process.env.LESSONS_DECAY_PERIOD_DAYS || '30', 10),
          promotionThreshold: parseInt(process.env.LESSONS_PROMOTION_THRESHOLD || '5', 10),
          promotionSuccessRate: parseFloat(process.env.LESSONS_PROMOTION_SUCCESS_RATE || '0.7'),
        },
      };

      // Validate configuration
      const validatedConfig = ConfigSchema.parse(envConfig);
      
      return validatedConfig as GatewayConfig;
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Configuration validation failed:');
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        throw new Error('Invalid configuration');
      }
      
      throw error;
    }
  }

  /**
   * Reload configuration from environment
   * Useful for development or when config changes
   */
  reload(): void {
    this.config = this.loadConfig();
  }

  /**
   * Get configuration summary for logging
   * Shows what's configured without exposing secrets
   */
  getSummary(): Record<string, unknown> {
    return {
      server: {
        port: this.config.server.port,
        host: this.config.server.host,
        corsOrigin: this.config.server.corsOrigin,
      },
      cache: {
        dir: this.config.cache.dir,
        ttl: this.config.cache.ttl,
        maxMB: this.config.cache.maxMB,
      },
      vector: {
        url: this.config.vector.url,
        collectionName: this.config.vector.collectionName,
        hasApiKey: !!this.config.vector.apiKey,
      },
      playwright: {
        serverUrl: this.config.playwright.serverUrl,
        browser: this.config.playwright.browser,
        headless: this.config.playwright.headless,
      },
      pipeline: {
        maxTokens: this.config.pipeline.maxTokens,
        maxChunks: this.config.pipeline.maxChunks,
        timeoutMs: this.config.pipeline.timeoutMs,
      },
      rag: {
        chunkSize: this.config.rag.chunkSize,
        maxChunksPerFile: this.config.rag.maxChunksPerFile,
        maxTotalChunks: this.config.rag.maxTotalChunks,
      },
      lessons: {
        confidenceDecay: this.config.lessons.confidenceDecay,
        decayPeriodDays: this.config.lessons.decayPeriodDays,
        promotionThreshold: this.config.lessons.promotionThreshold,
      },
    };
  }
}
