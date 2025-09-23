#!/usr/bin/env node

/**
 * Test Todo Integration Scoring
 * 
 * This test verifies that the todo integration scoring works correctly
 * by testing the scoring methods with sample enhanced prompts.
 */

import { TodoService } from '../dist/services/todo/todo.service.js';
import { EnhancedContext7EnhanceTool } from '../dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { Context7RealIntegrationService } from '../dist/services/context7/context7-real-integration.service.js';
import { FrameworkDetectorService } from '../dist/services/framework-detector/framework-detector.service.js';
import { Context7CacheService } from '../dist/services/framework-detector/context7-cache.service.js';
import { PromptCacheService } from '../dist/services/cache/prompt-cache.service.js';
import { ProjectContextAnalyzer } from '../dist/services/framework-detector/project-context-analyzer.service.js';
import { Context7MonitoringService } from '../dist/services/context7/context7-monitoring.service.js';
import { CacheAnalyticsService } from '../dist/services/cache/cache-analytics.service.js';

class TodoIntegrationScoringTest {
  constructor() {
    this.logger = new Logger('TodoIntegrationScoringTest');
    this.results = [];
  }

  async run() {
    console.log('🧪 Testing Todo Integration Scoring...\n');

    try {
      // Initialize services
      const config = new ConfigService();
      const todoService = new TodoService('test-scoring-todos.db');
      
      // Create test todos
      await this.setupTestTodos(todoService);
      
      // Initialize enhance tool
      const enhanceTool = await this.initializeEnhanceTool(todoService);
      
      // Test scoring with different scenarios
      await this.testScoringScenarios(enhanceTool);
      
      // Display results
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  async setupTestTodos(todoService) {
    console.log('📝 Setting up test todos...');
    
    // Create test todos for the project
    await todoService.createTodo({
      projectId: 'test-scoring-project',
      title: 'Create a React login component with TypeScript',
      description: 'Build a reusable login form component',
      priority: 'high',
      category: 'feature'
    });
    
    await todoService.createTodo({
      projectId: 'test-scoring-project',
      title: 'Add form validation to login component',
      description: 'Implement client-side validation for email and password fields',
      priority: 'medium',
      category: 'feature'
    });
    
    await todoService.createTodo({
      projectId: 'test-scoring-project',
      title: 'Write unit tests for login component',
      description: 'Add Jest tests for the login component functionality',
      priority: 'low',
      category: 'testing'
    });
    
    console.log('✅ Test todos created\n');
  }

  async initializeEnhanceTool(todoService) {
    console.log('🔧 Initializing enhance tool...');
    
    const logger = new Logger('Test-EnhanceTool');
    const config = new ConfigService();
    const realContext7 = new Context7RealIntegrationService(logger, config);
    const frameworkCache = new Context7CacheService();
    const frameworkDetector = new FrameworkDetectorService(realContext7, frameworkCache);
    const promptCache = new PromptCacheService(logger, config);
    const projectAnalyzer = new ProjectContextAnalyzer(logger);
    const monitoring = new Context7MonitoringService(logger, config);
    const cacheAnalytics = new CacheAnalyticsService(logger, null, promptCache);

    const enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      realContext7,
      frameworkDetector,
      promptCache,
      projectAnalyzer,
      monitoring,
      cacheAnalytics,
      todoService
    );
    
    console.log('✅ Enhance tool initialized\n');
    return enhanceTool;
  }

  async testScoringScenarios(enhanceTool) {
    console.log('🚀 Testing scoring scenarios...\n');

    const testCases = [
      {
        name: 'With Task Context',
        prompt: 'Help me implement authentication in my React app',
        context: {
          projectContext: {
            projectId: 'test-scoring-project'
          }
        },
        options: {
          useCache: false
        }
      },
      {
        name: 'Without Task Context',
        prompt: 'Help me implement authentication in my React app',
        context: {},
        options: {
          useCache: false
        }
      },
      {
        name: 'Different Project',
        prompt: 'Help me implement authentication in my React app',
        context: {
          projectContext: {
            projectId: 'different-project'
          }
        },
        options: {
          useCache: false
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`📋 Testing: ${testCase.name}`);
      
      try {
        const result = await enhanceTool.enhance(testCase);
        
        // Score the todo integration
        const todoScore = this.scoreTodoIntegration(testCase, result.enhanced_prompt);
        
        this.results.push({
          name: testCase.name,
          success: result.success,
          todoScore,
          hasTaskContext: result.enhanced_prompt.includes('## Current Project Tasks:'),
          hasTaskItems: result.enhanced_prompt.includes('- '),
          hasProjectAwareness: result.enhanced_prompt.includes('project') || result.enhanced_prompt.includes('task'),
          promptLength: result.enhanced_prompt.length
        });
        
        console.log(`  ✅ Todo Score: ${todoScore}/15`);
        console.log(`  📊 Has Task Context: ${result.enhanced_prompt.includes('## Current Project Tasks:')}`);
        console.log(`  📝 Has Task Items: ${result.enhanced_prompt.includes('- ')}`);
        console.log('');
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        this.results.push({
          name: testCase.name,
          success: false,
          error: error.message
        });
      }
    }
  }

  scoreTodoIntegration(testCase, enhancedPrompt) {
    let score = 0;
    
    // Check if enhanced prompt includes task context
    if (enhancedPrompt && enhancedPrompt.includes('## Current Project Tasks:')) {
      score += 8; // Task context section present
    }
    
    // Check for task-related content
    if (enhancedPrompt && enhancedPrompt.includes('- ')) {
      const taskLines = enhancedPrompt.match(/- .+/g);
      if (taskLines && taskLines.length > 0) {
        score += 4; // Task items present
      }
    }
    
    // Check for project context awareness
    if (enhancedPrompt && (enhancedPrompt.includes('project') || enhancedPrompt.includes('task'))) {
      score += 3; // Project/task awareness
    }
    
    return Math.min(score, 15);
  }

  displayResults() {
    console.log('📊 Test Results Summary:');
    console.log('========================\n');
    
    let totalScore = 0;
    let testCount = 0;
    
    this.results.forEach(result => {
      console.log(`📋 ${result.name}:`);
      if (result.success) {
        console.log(`  ✅ Todo Score: ${result.todoScore}/15`);
        console.log(`  📊 Has Task Context: ${result.hasTaskContext}`);
        console.log(`  📝 Has Task Items: ${result.hasTaskItems}`);
        console.log(`  🎯 Project Awareness: ${result.hasProjectAwareness}`);
        console.log(`  📏 Prompt Length: ${result.promptLength} chars`);
        totalScore += result.todoScore;
        testCount++;
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
      }
      console.log('');
    });
    
    if (testCount > 0) {
      const averageScore = totalScore / testCount;
      console.log(`🎯 Average Todo Score: ${averageScore.toFixed(1)}/15`);
      console.log(`📈 Success Rate: ${testCount}/${this.results.length} (${Math.round((testCount / this.results.length) * 100)}%)`);
    }
    
    console.log('\n✅ Todo Integration Scoring Test Complete!');
  }
}

// Run the test
const test = new TodoIntegrationScoringTest();
test.run().catch(console.error);
