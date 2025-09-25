/**
 * Summarization Configuration
 * 
 * Simple configuration for AI summarization feature
 */

export interface SummarizationConfig {
  enabled: boolean;
  minTokensToSummarize: number;
  openaiApiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export const DEFAULT_SUMMARIZATION_CONFIG: SummarizationConfig = {
  enabled: process.env.ENABLE_SUMMARIZATION === 'true' || true,
  minTokensToSummarize: 500,
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  maxTokens: 300,
  temperature: 0.3
};

export function getSummarizationConfig(): SummarizationConfig {
  return {
    ...DEFAULT_SUMMARIZATION_CONFIG,
    enabled: process.env.ENABLE_SUMMARIZATION !== 'false',
    openaiApiKey: process.env.OPENAI_API_KEY || DEFAULT_SUMMARIZATION_CONFIG.openaiApiKey
  };
}
