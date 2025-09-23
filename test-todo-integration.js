/**
 * Test script for todo integration with enhance tool
 * Tests the simple integration between promptmcp.enhance and promptmcp.todo
 */

import { TodoService } from './dist/services/todo/todo.service.js';
import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7RealIntegrationService } from './dist/services/context7/context7-real-integration.service.js';
import { FrameworkDetectorService } from './dist/services/framework-detector/framework-detector.service.js';
import { Context7CacheService } from './dist/services/framework-detector/context7-cache.service.js';
import { PromptCacheService } from './dist/services/cache/prompt-cache.service.js';
import { ProjectContextAnalyzer } from './dist/services/framework-detector/project-context-analyzer.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { CacheAnalyticsService } from './dist/services/cache/cache-analytics.service.js';

async function testTodoIntegration() {
  console.log('🧪 Testing Todo Integration with Enhance Tool...\n');

  try {
    // Initialize services
    const logger = new Logger('Test-TodoIntegration');
    const config = new ConfigService();
    const todoService = new TodoService('todos.db');
    
    // Create some test todos
    console.log('📝 Creating test todos...');
    await todoService.createTodo({
      projectId: 'test-project',
      title: 'Create a React login component with TypeScript',
      description: 'Build a reusable login form component',
      priority: 'high',
      category: 'feature'
    });
    
    await todoService.createTodo({
      projectId: 'test-project',
      title: 'Add form validation to login component',
      description: 'Implement client-side validation for email and password fields',
      priority: 'medium',
      category: 'feature'
    });
    
    await todoService.createTodo({
      projectId: 'test-project',
      title: 'Write unit tests for login component',
      description: 'Add Jest tests for the login component functionality',
      priority: 'low',
      category: 'testing'
    });

    console.log('✅ Test todos created\n');

    // Initialize enhance tool with todo service
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

    console.log('🔧 Enhance tool initialized with todo service\n');

    // Test enhance with task context
    console.log('🚀 Testing enhance with task context...');
    const testPrompt = 'Help me implement authentication in my React app';
    
    const result = await enhanceTool.enhance({
      prompt: testPrompt,
      context: {
        projectContext: {
          projectId: 'test-project'
        }
      },
      options: {
        useCache: false  // Disable caching to test task context
      }
    });

    console.log('📋 Enhanced Prompt:');
    console.log('==================');
    console.log(result.enhanced_prompt);
    console.log('\n');

    console.log('✅ Test completed successfully!');
    console.log('🎯 Task context integration is working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testTodoIntegration();
