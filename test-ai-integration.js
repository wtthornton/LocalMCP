/**
 * Quick AI Integration Test
 * Tests the new AI-powered methods with real OpenAI (happy path only)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PromptAnalyzerService } from './src/tools/enhance/prompt-analyzer.service.js';
import { Logger } from './src/services/logger/logger.js';
import { OpenAIService } from './src/services/ai/openai.service.js';

describe('AI Integration - Happy Path', () => {
  let promptAnalyzer;
  let openaiService;

  beforeAll(() => {
    const logger = new Logger();
    openaiService = new OpenAIService(logger, {
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-4',
      maxTokens: 1000
    });
    promptAnalyzer = new PromptAnalyzerService(logger, openaiService);
  });

  it('When AI service available, then analyzePromptComplexityWithContext works', async () => {
    const prompt = "Create a React component with TypeScript";
    const projectContext = {
      repoFacts: ["This is a React project", "Uses TypeScript"],
      codeSnippets: ["export default function App() { return <div>Hello</div>; }"],
      frameworks: ["react", "typescript"],
      projectType: "web-application"
    };

    const result = await promptAnalyzer.analyzePromptComplexityWithContext(prompt, projectContext);
    
    expect(result).toBeDefined();
    expect(result.level).toMatch(/simple|medium|complex/);
    expect(result.userExpertiseLevel).toMatch(/beginner|intermediate|advanced/);
    expect(result.responseStrategy).toMatch(/minimal|standard|comprehensive/);
    expect(result.estimatedTokens).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('When AI service unavailable, then falls back to basic analysis', async () => {
    const logger = new Logger();
    const promptAnalyzerFallback = new PromptAnalyzerService(logger); // No OpenAI service
    
    const prompt = "Create a React component";
    const projectContext = {
      repoFacts: ["This is a React project"],
      codeSnippets: [],
      frameworks: ["react"],
      projectType: "web-application"
    };

    const result = await promptAnalyzerFallback.analyzePromptComplexityWithContext(prompt, projectContext);
    
    expect(result).toBeDefined();
    expect(result.level).toMatch(/simple|medium|complex/);
    expect(result.userExpertiseLevel).toMatch(/beginner|intermediate|advanced/);
    expect(result.confidence).toBeLessThan(0.7); // Lower confidence for fallback
  });
});
