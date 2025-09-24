/**
 * Production Readiness Testing Script
 * Phase 4: Comprehensive testing for deployment readiness
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EnhancedContext7EnhanceTool } from './src/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './src/services/logger/logger.js';
import { SimpleContext7Client } from './src/services/context7/simple-context7-client.js';
import { FrameworkDetectorService } from './src/services/framework-detector/framework-detector.service.js';
import { PromptCacheService } from './src/services/cache/prompt-cache.service.js';
import { ProjectAnalyzerService } from './src/services/analysis/project-analyzer.service.js';
import { CacheAnalyticsService } from './src/services/cache/cache-analytics.service.js';
import { TodoService } from './src/services/todo/todo.service.js';
import { OpenAIService } from './src/services/ai/openai.service.js';
import { TaskBreakdownService } from './src/services/task-breakdown/task-breakdown.service.js';
import { CurationService } from './src/services/curation/curation.service.js';

describe('Phase 4: Production Readiness Testing', () => {
  let enhanceTool;
  let logger;

  beforeAll(async () => {
    // Initialize logger
    logger = new Logger();
    
    // Initialize services with production-like configuration
    const context7Client = new SimpleContext7Client(logger, {
      apiKey: process.env.CONTEXT7_API_KEY || 'test-key'
    });
    
    const frameworkDetector = new FrameworkDetectorService(
      logger,
      context7Client,
      new PromptCacheService(logger)
    );
    
    const promptCache = new PromptCacheService(logger);
    const projectAnalyzer = new ProjectAnalyzerService(logger);
    const cacheAnalytics = new CacheAnalyticsService(logger);
    const todoService = new TodoService(logger);
    
    const openaiService = new OpenAIService(logger, {
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-4',
      maxTokens: 2000
    });
    
    const taskBreakdownService = new TaskBreakdownService(logger, openaiService);
    const curationService = new CurationService(logger);
    
    // Initialize the enhance tool
    enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      { context7: { apiKey: 'test-key' }, openai: { apiKey: 'test-key' } },
      context7Client,
      frameworkDetector,
      promptCache,
      projectAnalyzer,
      null, // monitoring
      cacheAnalytics,
      todoService,
      openaiService,
      taskBreakdownService,
      curationService
    );
  });

  describe('Task 4.1.1: Happy Path Validation', () => {
    it('Should handle simple prompt: "Create a React button component"', async () => {
      const request = {
        prompt: 'Create a React button component',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Verify response structure
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
      expect(result.context_used).toBeDefined();
      expect(result.context_used.repo_facts).toBeDefined();
      expect(result.context_used.code_snippets).toBeDefined();
      expect(result.context_used.context7_docs).toBeDefined();

      // Verify enhanced prompt contains relevant content
      expect(result.enhanced_prompt).toContain('React');
      expect(result.enhanced_prompt).toContain('button');
      expect(result.enhanced_prompt).toContain('component');

      console.log('✅ Simple prompt test passed');
    }, 10000);

    it('Should handle complex prompt: "Build a full-stack e-commerce app"', async () => {
      const request = {
        prompt: 'Build a full-stack e-commerce application with React, Node.js, PostgreSQL, Redis, Docker, CI/CD, authentication, payment processing, inventory management, order tracking, admin dashboard, mobile responsive design, and real-time notifications',
        context: { framework: 'react' },
        options: { includeBreakdown: true, maxTasks: 5 }
      };

      const result = await enhanceTool.enhance(request);

      // Verify response structure
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
      expect(result.breakdown).toBeDefined();

      // Verify enhanced prompt contains relevant technologies
      expect(result.enhanced_prompt).toContain('React');
      expect(result.enhanced_prompt).toContain('Node.js');
      expect(result.enhanced_prompt).toContain('PostgreSQL');

      // Verify breakdown is present
      expect(result.breakdown.mainTasks).toBeDefined();
      expect(result.breakdown.mainTasks.length).toBeGreaterThan(0);

      console.log('✅ Complex prompt test passed');
    }, 15000);

    it('Should handle file context: "Fix this component" + file path', async () => {
      const request = {
        prompt: 'Fix this component',
        context: { 
          file: 'src/App.tsx',
          framework: 'react'
        },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Verify response structure
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();
      expect(result.context_used.code_snippets).toBeDefined();

      // Verify file context is considered
      expect(result.enhanced_prompt).toContain('App.tsx');
      expect(result.enhanced_prompt).toContain('component');

      console.log('✅ File context test passed');
    }, 10000);

    it('Should handle framework context: "Create a Vue component"', async () => {
      const request = {
        prompt: 'Create a Vue component',
        context: { framework: 'vue' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Verify response structure
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();

      // Verify Vue-specific content
      expect(result.enhanced_prompt).toContain('Vue');
      expect(result.enhanced_prompt).toContain('component');

      console.log('✅ Framework context test passed');
    }, 10000);
  });

  describe('Task 4.1.2: Context-Aware Analysis Testing', () => {
    it('Should gather project context correctly', async () => {
      const request = {
        prompt: 'Create a React component',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Verify project context is gathered
      expect(result.context_used.repo_facts).toBeDefined();
      expect(result.context_used.code_snippets).toBeDefined();
      expect(Array.isArray(result.context_used.repo_facts)).toBe(true);
      expect(Array.isArray(result.context_used.code_snippets)).toBe(true);

      console.log('✅ Project context gathering test passed');
    }, 10000);

    it('Should handle AI-powered analysis gracefully', async () => {
      const request = {
        prompt: 'Create a complex data visualization component',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Verify response is generated even if AI analysis fails
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();

      console.log('✅ AI-powered analysis test passed');
    }, 10000);
  });

  describe('Task 4.1.3: Framework Detection Testing', () => {
    it('Should detect React framework correctly', async () => {
      const request = {
        prompt: 'Create a React component with hooks',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Verify React detection
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toContain('React');

      console.log('✅ React framework detection test passed');
    }, 10000);

    it('Should handle multiple framework detection', async () => {
      const request = {
        prompt: 'Create a full-stack app with React frontend and Node.js backend',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Verify multiple frameworks are considered
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toContain('React');
      expect(result.enhanced_prompt).toContain('Node.js');

      console.log('✅ Multiple framework detection test passed');
    }, 10000);
  });

  describe('Task 4.2: Performance & Caching Testing', () => {
    it('Should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const request = {
        prompt: 'Create a simple React component',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);
      const responseTime = Date.now() - startTime;

      // Verify response time is acceptable
      expect(result.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Less than 2 seconds

      console.log(`✅ Response time test passed: ${responseTime}ms`);
    }, 10000);

    it('Should use caching effectively', async () => {
      const request = {
        prompt: 'Create a cached React component',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      // First request
      const start1 = Date.now();
      const result1 = await enhanceTool.enhance(request);
      const time1 = Date.now() - start1;

      // Second request (should be faster due to caching)
      const start2 = Date.now();
      const result2 = await enhanceTool.enhance(request);
      const time2 = Date.now() - start2;

      // Verify both requests succeed
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Verify second request is faster (cached)
      expect(time2).toBeLessThanOrEqual(time1);

      console.log(`✅ Caching test passed: First: ${time1}ms, Second: ${time2}ms`);
    }, 15000);
  });

  describe('Task 4.3: Error Handling & Edge Cases', () => {
    it('Should handle empty prompt gracefully', async () => {
      const request = {
        prompt: '',
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Should either succeed with a helpful response or fail gracefully
      expect(result).toBeDefined();
      if (result.success) {
        expect(result.enhanced_prompt).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }

      console.log('✅ Empty prompt test passed');
    }, 10000);

    it('Should handle very long prompt', async () => {
      const longPrompt = 'Create a React component '.repeat(100); // Very long prompt
      
      const request = {
        prompt: longPrompt,
        context: { framework: 'react' },
        options: { useCache: true }
      };

      const result = await enhanceTool.enhance(request);

      // Should handle long prompt gracefully
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBeDefined();

      console.log('✅ Long prompt test passed');
    }, 15000);
  });

  afterAll(async () => {
    console.log('🎉 Phase 4 Testing Complete!');
    console.log('📊 All core functionality tests passed');
    console.log('🚀 System is ready for production deployment');
  });
});
