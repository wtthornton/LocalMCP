/**
 * Production Configuration for AI Summarization
 */

export interface ProductionConfig {
  summarization: {
    enabled: boolean;
    minTokensToSummarize: number;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
    retryAttempts: number;
  };
  cache: {
    enabled: boolean;
    dbPath: string;
    maxEntries: number;
    ttl: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
    metricsInterval: number;
  };
  openai: {
    apiKey: string;
    projectId?: string;
  };
}

export function loadProductionConfig(): ProductionConfig {
  return {
    summarization: {
      enabled: process.env.ENABLE_SUMMARIZATION !== 'false',
      minTokensToSummarize: parseInt(process.env.SUMMARIZATION_MIN_TOKENS || '500'),
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      maxTokens: parseInt(process.env.SUMMARIZATION_MAX_TOKENS || '300'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.OPENAI_RETRY_ATTEMPTS || '3')
    },
    cache: {
      enabled: process.env.ENABLE_CACHE !== 'false',
      dbPath: process.env.CACHE_DB_PATH || './prompt-cache.db',
      maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '1000'),
      ttl: parseInt(process.env.CACHE_TTL || '3600000') // 1 hour
    },
    monitoring: {
      enabled: process.env.ENABLE_MONITORING !== 'false',
      logLevel: process.env.LOG_LEVEL || 'info',
      metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000') // 1 minute
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      projectId: process.env.OPENAI_PROJECT_ID
    }
  };
}

export function validateConfig(config: ProductionConfig): string[] {
  const errors: string[] = [];

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (config.summarization.minTokensToSummarize < 100) {
    errors.push('SUMMARIZATION_MIN_TOKENS must be at least 100');
  }

  if (config.summarization.maxTokens < 50) {
    errors.push('SUMMARIZATION_MAX_TOKENS must be at least 50');
  }

  if (config.summarization.temperature < 0 || config.summarization.temperature > 2) {
    errors.push('OPENAI_TEMPERATURE must be between 0 and 2');
  }

  if (config.cache.maxEntries < 10) {
    errors.push('CACHE_MAX_ENTRIES must be at least 10');
  }

  return errors;
}
