/**
 * Context-Aware Analysis Testing
 * Task 4.1.2: Test project context gathering and AI analysis
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PromptAnalyzerService } from './src/tools/enhance/prompt-analyzer.service.js';
import { Logger } from './src/services/logger/logger.js';

describe('Task 4.1.2: Context-Aware Analysis Testing', () => {
  let promptAnalyzer;
  let logger;

  beforeAll(() => {
    logger = new Logger();
    promptAnalyzer = new PromptAnalyzerService(logger);
  });

  it('Should analyze prompt complexity with basic analysis', () => {
    const prompt = 'Create a React component';
    const complexity = promptAnalyzer.analyzePromptComplexity(prompt);
    
    expect(complexity).toBeDefined();
    expect(complexity.level).toMatch(/simple|medium|complex/);
    expect(complexity.score).toBeGreaterThan(0);
    expect(complexity.indicators).toBeDefined();
    expect(Array.isArray(complexity.indicators)).toBe(true);
    
    console.log('✅ Basic prompt complexity analysis: PASSED');
  });

  it('Should analyze prompt complexity with context', async () => {
    const prompt = 'Create a React component with TypeScript';
    const projectContext = {
      repoFacts: ['This is a React project', 'Uses TypeScript'],
      codeSnippets: ['export default function App() { return <div>Hello</div>; }'],
      frameworks: ['react', 'typescript'],
      projectType: 'web-application'
    };

    const complexity = await promptAnalyzer.analyzePromptComplexityWithContext(prompt, projectContext);
    
    expect(complexity).toBeDefined();
    expect(complexity.level).toMatch(/simple|medium|complex/);
    expect(complexity.userExpertiseLevel).toMatch(/beginner|intermediate|advanced/);
    expect(complexity.responseStrategy).toMatch(/minimal|standard|comprehensive/);
    expect(complexity.estimatedTokens).toBeGreaterThan(0);
    expect(complexity.confidence).toBeGreaterThan(0);
    
    console.log('✅ Context-aware prompt complexity analysis: PASSED');
  });

  it('Should get optimized options based on complexity', () => {
    const prompt = 'Create a simple button';
    const complexity = promptAnalyzer.analyzePromptComplexity(prompt);
    const options = promptAnalyzer.getOptimizedOptions({}, complexity);
    
    expect(options).toBeDefined();
    expect(options.maxTokens).toBeGreaterThan(0);
    expect(typeof options.includeMetadata).toBe('boolean');
    expect(typeof options.useCache).toBe('boolean');
    
    console.log('✅ Optimized options generation: PASSED');
  });

  it('Should determine if prompt should trigger breakdown', () => {
    const simplePrompt = 'Create a button';
    const complexPrompt = 'Build a full-stack e-commerce application with React, Node.js, PostgreSQL, Redis, Docker, CI/CD, authentication, payment processing, inventory management, order tracking, admin dashboard, mobile responsive design, and real-time notifications';
    
    const shouldBreakdownSimple = promptAnalyzer.shouldBreakdown(simplePrompt);
    const shouldBreakdownComplex = promptAnalyzer.shouldBreakdown(complexPrompt);
    
    expect(typeof shouldBreakdownSimple).toBe('boolean');
    expect(typeof shouldBreakdownComplex).toBe('boolean');
    
    // Complex prompts should trigger breakdown more often
    expect(shouldBreakdownComplex).toBe(true);
    
    console.log('✅ Breakdown detection: PASSED');
  });

  it('Should extract keywords from prompt', () => {
    const prompt = 'Create a React component with TypeScript and Tailwind CSS';
    const keywords = promptAnalyzer.extractKeywords(prompt);
    
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords).toContain('react');
    expect(keywords).toContain('typescript');
    expect(keywords).toContain('tailwind');
    
    console.log('✅ Keyword extraction: PASSED');
  });
});
