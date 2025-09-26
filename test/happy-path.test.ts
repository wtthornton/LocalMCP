/**
 * Happy Path Tests
 * 
 * Simple tests to verify basic functionality works
 * Focus on core features without complex edge cases
 * 
 * Benefits for vibe coders:
 * - Quick verification that everything works
 * - Easy to run and understand
 * - Catches major issues early
 * - No complex setup required
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Logger } from '../src/services/logger/logger.js';
import { TemperatureConfigService } from '../src/services/ai/temperature-config.service.js';
import { PromptTemplateService } from '../src/services/ai/prompt-templates.service.js';
import { FewShotExamplesService } from '../src/services/ai/few-shot-examples.service.js';
import { ModelSelectionService } from '../src/services/ai/model-selection.service.js';
import { CostMonitoringService } from '../src/services/ai/cost-monitoring.service.js';

describe('Happy Path Tests', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestLogger');
  });

  describe('Temperature Configuration Service', () => {
    test('should return correct temperature for task breakdown', () => {
      const config = new TemperatureConfigService();
      
      expect(typeof config.getTemperature('taskBreakdown')).toBe('number');
      expect(config.getTemperature('taskBreakdown')).toBe(0.4);
    });

    test('should return correct temperature for all operations', () => {
      const config = new TemperatureConfigService();
      
      expect(config.getTemperature('complexityAnalysis')).toBe(0.1);
      expect(config.getTemperature('promptEnhancement')).toBe(0.6);
      expect(config.getTemperature('summarization')).toBe(0.3);
      expect(config.getTemperature('connectionTest')).toBe(0.1);
    });

    test('should update temperature values', () => {
      const config = new TemperatureConfigService();
      
      config.updateTemperature('taskBreakdown', 0.5);
      expect(config.getTemperature('taskBreakdown')).toBe(0.5);
    });

    test('should validate temperature range', () => {
      const config = new TemperatureConfigService();
      
      expect(() => config.updateTemperature('taskBreakdown', -1)).toThrow();
      expect(() => config.updateTemperature('taskBreakdown', 3)).toThrow();
    });
  });

  describe('Prompt Template Service', () => {
    test('should return template for task breakdown', () => {
      const service = new PromptTemplateService(logger);
      const template = service.getTemplate('taskBreakdown');
      
      expect(template).toBeDefined();
      expect(template.role).toBeDefined();
      expect(template.expertise).toBeDefined();
      expect(template.guidelines).toBeDefined();
      expect(Array.isArray(template.guidelines)).toBe(true);
    });

    test('should return default template for unknown operation', () => {
      const service = new PromptTemplateService(logger);
      const template = service.getTemplate('unknownOperation');
      
      expect(template).toBeDefined();
      expect(template.role).toBe('AI Assistant');
    });

    test('should generate system prompt', () => {
      const service = new PromptTemplateService(logger);
      const prompt = service.generateSystemPrompt('taskBreakdown');
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain('Senior Technical Project Manager');
    });

    test('should list available operations', () => {
      const service = new PromptTemplateService(logger);
      const operations = service.getAvailableOperations();
      
      expect(Array.isArray(operations)).toBe(true);
      expect(operations).toContain('taskBreakdown');
      expect(operations).toContain('promptEnhancement');
    });
  });

  describe('Few-Shot Examples Service', () => {
    test('should return examples for task breakdown', () => {
      const service = new FewShotExamplesService();
      const examples = service.getExamples('taskBreakdown');
      
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toHaveProperty('input');
      expect(examples[0]).toHaveProperty('output');
    });

    test('should return empty array for unknown operation', () => {
      const service = new FewShotExamplesService();
      const examples = service.getExamples('unknownOperation');
      
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBe(0);
    });

    test('should list available operations', () => {
      const service = new FewShotExamplesService();
      const operations = service.getAvailableOperations();
      
      expect(Array.isArray(operations)).toBe(true);
      expect(operations).toContain('taskBreakdown');
    });
  });

  describe('Model Selection Service', () => {
    test('should select model for task breakdown', () => {
      const service = new ModelSelectionService();
      const model = service.selectModel({
        operation: 'taskBreakdown',
        complexity: 'medium'
      });
      
      expect(typeof model).toBe('string');
      expect(model).toBeDefined();
    });

    test('should select simple model for simple operations', () => {
      const service = new ModelSelectionService();
      const model = service.selectModel({
        operation: 'connectionTest',
        complexity: 'simple'
      });
      
      expect(model).toBe('gpt-4o-mini');
    });

    test('should estimate cost correctly', () => {
      const service = new ModelSelectionService();
      const cost = service.estimateCost('gpt-4o', 1000, 500);
      
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThan(0);
    });

    test('should get model info', () => {
      const service = new ModelSelectionService();
      const info = service.getModelInfo('gpt-4o');
      
      expect(info).toBeDefined();
      expect(info.name).toBe('gpt-4o');
      expect(info.costPer1K).toBeDefined();
      expect(info.maxTokens).toBeGreaterThan(0);
    });
  });

  describe('Cost Monitoring Service', () => {
    test('should allow request within budget', () => {
      const service = new CostMonitoringService({ dailyLimit: 10.0 }, logger);
      
      expect(service.canMakeRequest(1.0, 'test')).toBe(true);
    });

    test('should reject request over budget', () => {
      const service = new CostMonitoringService({ dailyLimit: 1.0 }, logger);
      
      expect(service.canMakeRequest(2.0, 'test')).toBe(false);
    });

    test('should track cost correctly', () => {
      const service = new CostMonitoringService({ dailyLimit: 10.0 }, logger);
      
      service.trackCost({
        operation: 'test',
        model: 'gpt-4o',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 1.0,
        success: true
      });
      
      expect(service.getDailyCost()).toBe(1.0);
    });

    test('should calculate remaining budget', () => {
      const service = new CostMonitoringService({ dailyLimit: 10.0 }, logger);
      
      service.trackCost({
        operation: 'test',
        model: 'gpt-4o',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 3.0,
        success: true
      });
      
      expect(service.getRemainingDailyBudget()).toBe(7.0);
    });

    test('should provide cost summary', () => {
      const service = new CostMonitoringService({ dailyLimit: 10.0 }, logger);
      
      const summary = service.getCostSummary();
      
      expect(summary).toBeDefined();
      expect(summary.totalCost).toBe(0);
      expect(summary.requestCount).toBe(0);
      expect(summary.remainingDailyBudget).toBe(10.0);
    });
  });

  describe('Integration Tests', () => {
    test('temperature config should work with prompt templates', () => {
      const tempConfig = new TemperatureConfigService();
      const promptService = new PromptTemplateService(logger);
      
      const temperature = tempConfig.getTemperature('taskBreakdown');
      const template = promptService.getTemplate('taskBreakdown');
      
      expect(typeof temperature).toBe('number');
      expect(template).toBeDefined();
      expect(template.role).toBeDefined();
    });

    test('model selection should work with cost monitoring', () => {
      const modelService = new ModelSelectionService();
      const costService = new CostMonitoringService({ dailyLimit: 10.0 }, logger);
      
      const model = modelService.selectModel({ operation: 'taskBreakdown' });
      const cost = modelService.estimateCost(model, 1000, 500);
      const canMakeRequest = costService.canMakeRequest(cost, 'taskBreakdown');
      
      expect(typeof model).toBe('string');
      expect(typeof cost).toBe('number');
      expect(typeof canMakeRequest).toBe('boolean');
    });

    test('all services should initialize without errors', () => {
      expect(() => new TemperatureConfigService()).not.toThrow();
      expect(() => new PromptTemplateService(logger)).not.toThrow();
      expect(() => new FewShotExamplesService()).not.toThrow();
      expect(() => new ModelSelectionService()).not.toThrow();
      expect(() => new CostMonitoringService(undefined, logger)).not.toThrow();
    });
  });
});
