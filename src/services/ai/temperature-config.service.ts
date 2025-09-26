/**
 * Temperature Configuration Service
 * 
 * Manages temperature settings for different OpenAI operations
 * Provides optimized temperature values based on operation type
 * 
 * Benefits for vibe coders:
 * - Consistent temperature settings across operations
 * - Easy to adjust temperatures for different use cases
 * - Centralized configuration management
 */

export interface TemperatureConfig {
  taskBreakdown: number;      // 0.4 - Balanced creativity for task structuring
  complexityAnalysis: number; // 0.1 - Maximum consistency for scoring
  promptEnhancement: number;  // 0.6 - Creative improvements
  summarization: number;      // 0.3 - Factual accuracy
  connectionTest: number;     // 0.1 - Minimal variation
}

export class TemperatureConfigService {
  private config: TemperatureConfig = {
    taskBreakdown: 0.4,
    complexityAnalysis: 0.1,
    promptEnhancement: 0.6,
    summarization: 0.3,
    connectionTest: 0.1
  };

  /**
   * Get temperature for a specific operation
   */
  getTemperature(operation: keyof TemperatureConfig): number {
    return this.config[operation];
  }

  /**
   * Update temperature for a specific operation
   */
  updateTemperature(operation: keyof TemperatureConfig, value: number): void {
    if (value < 0 || value > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    this.config[operation] = value;
  }

  /**
   * Get all temperature configurations
   */
  getAllTemperatures(): TemperatureConfig {
    return { ...this.config };
  }

  /**
   * Reset to default temperatures
   */
  resetToDefaults(): void {
    this.config = {
      taskBreakdown: 0.4,
      complexityAnalysis: 0.1,
      promptEnhancement: 0.6,
      summarization: 0.3,
      connectionTest: 0.1
    };
  }
}
