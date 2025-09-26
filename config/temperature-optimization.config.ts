/**
 * Temperature Optimization Configuration
 * 
 * Centralized configuration for OpenAI temperature settings
 * Optimized for different operation types and use cases
 * 
 * Benefits for vibe coders:
 * - Easy to adjust temperature settings
 * - Consistent configuration across the app
 * - Environment-based configuration
 * - Clear documentation of temperature choices
 */

export const TEMPERATURE_CONFIG = {
  // Task breakdown - balanced creativity for structuring
  taskBreakdown: 0.4,
  
  // Complexity analysis - maximum consistency for scoring
  complexityAnalysis: 0.1,
  
  // Prompt enhancement - creative improvements
  promptEnhancement: 0.6,
  
  // Summarization - factual accuracy
  summarization: 0.3,
  
  // Connection test - minimal variation
  connectionTest: 0.1
} as const;

export const MODEL_CONFIG = {
  // Primary model for most operations
  primary: 'gpt-4o',
  
  // Fallback model for cost-sensitive operations
  fallback: 'gpt-4o-mini',
  
  // Complex reasoning tasks
  complex: 'gpt-4o',
  
  // Simple operations
  simple: 'gpt-4o-mini',
  
  // Connection tests
  test: 'gpt-4o-mini'
} as const;

export const COST_LIMITS = {
  // Daily cost limit in USD
  dailyLimit: 5.0,
  
  // Monthly cost limit in USD
  monthlyLimit: 50.0,
  
  // Per-request cost limit in USD
  perRequestLimit: 1.0
} as const;

export const PROMPT_TEMPLATE_CONFIG = {
  // Enable few-shot examples
  enableExamples: true,
  
  // Maximum examples per operation
  maxExamples: 3,
  
  // Enable role-based prompts
  enableRoleBasedPrompts: true,
  
  // Enable context-aware prompts
  enableContextAwarePrompts: true
} as const;

export const DEBUG_CONFIG = {
  // Enable temperature debugging
  enableTemperatureDebug: process.env.DEBUG_TEMPERATURE === 'true',
  
  // Enable prompt debugging
  enablePromptDebug: process.env.DEBUG_PROMPTS === 'true',
  
  // Enable cost debugging
  enableCostDebug: process.env.DEBUG_COSTS === 'true',
  
  // Enable model selection debugging
  enableModelDebug: process.env.DEBUG_MODELS === 'true'
} as const;

/**
 * Get temperature configuration with environment overrides
 */
export function getTemperatureConfig() {
  return {
    taskBreakdown: parseFloat(process.env.OPENAI_TEMPERATURE_TASK_BREAKDOWN || TEMPERATURE_CONFIG.taskBreakdown.toString()),
    complexityAnalysis: parseFloat(process.env.OPENAI_TEMPERATURE_COMPLEXITY_ANALYSIS || TEMPERATURE_CONFIG.complexityAnalysis.toString()),
    promptEnhancement: parseFloat(process.env.OPENAI_TEMPERATURE_PROMPT_ENHANCEMENT || TEMPERATURE_CONFIG.promptEnhancement.toString()),
    summarization: parseFloat(process.env.OPENAI_TEMPERATURE_SUMMARIZATION || TEMPERATURE_CONFIG.summarization.toString()),
    connectionTest: parseFloat(process.env.OPENAI_TEMPERATURE_CONNECTION_TEST || TEMPERATURE_CONFIG.connectionTest.toString())
  };
}

/**
 * Get model configuration with environment overrides
 */
export function getModelConfig() {
  return {
    primary: process.env.OPENAI_MODEL_PRIMARY || MODEL_CONFIG.primary,
    fallback: process.env.OPENAI_MODEL_FALLBACK || MODEL_CONFIG.fallback,
    complex: process.env.OPENAI_MODEL_COMPLEX || MODEL_CONFIG.complex,
    simple: process.env.OPENAI_MODEL_SIMPLE || MODEL_CONFIG.simple,
    test: process.env.OPENAI_MODEL_TEST || MODEL_CONFIG.test
  };
}

/**
 * Get cost limits with environment overrides
 */
export function getCostLimits() {
  return {
    dailyLimit: parseFloat(process.env.OPENAI_DAILY_COST_LIMIT || COST_LIMITS.dailyLimit.toString()),
    monthlyLimit: parseFloat(process.env.OPENAI_MONTHLY_COST_LIMIT || COST_LIMITS.monthlyLimit.toString()),
    perRequestLimit: parseFloat(process.env.OPENAI_PER_REQUEST_COST_LIMIT || COST_LIMITS.perRequestLimit.toString())
  };
}

/**
 * Validate temperature values
 */
export function validateTemperatureConfig(config: Record<string, number>): boolean {
  for (const [key, value] of Object.entries(config)) {
    if (value < 0 || value > 2) {
      console.error(`Invalid temperature for ${key}: ${value}. Must be between 0 and 2.`);
      return false;
    }
  }
  return true;
}

/**
 * Get debug configuration
 */
export function getDebugConfig() {
  return DEBUG_CONFIG;
}

/**
 * Log configuration for debugging
 */
export function logConfiguration() {
  if (DEBUG_CONFIG.enableTemperatureDebug) {
    console.log('🌡️ Temperature Configuration:', getTemperatureConfig());
  }
  
  if (DEBUG_CONFIG.enableModelDebug) {
    console.log('🤖 Model Configuration:', getModelConfig());
  }
  
  if (DEBUG_CONFIG.enableCostDebug) {
    console.log('💰 Cost Limits:', getCostLimits());
  }
}
