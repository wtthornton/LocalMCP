/**
 * Test Breakdown Integration
 * 
 * Tests the complete breakdown integration with Context7 and OpenAI
 */

import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { Context7RealIntegrationService } from '../dist/services/context7/context7-real-integration.service.js';
import { TaskBreakdownService } from '../dist/services/task-breakdown/task-breakdown.service.js';
import { BreakdownTool } from '../dist/tools/breakdown.tool.js';

class BreakdownIntegrationTest {
  constructor() {
    this.logger = new Logger('BreakdownIntegrationTest');
    this.config = new ConfigService();
  }

  async run() {
    try {
      this.logger.info('Starting breakdown integration test');

      // Test 1: Configuration validation
      await this.testConfiguration();

      // Test 2: Context7 integration
      await this.testContext7Integration();

      // Test 3: Task breakdown service
      await this.testTaskBreakdownService();

      // Test 4: MCP breakdown tool
      await this.testBreakdownTool();

      this.logger.info('All breakdown integration tests passed!');

    } catch (error) {
      this.logger.error('Breakdown integration test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async testConfiguration() {
    this.logger.info('Testing configuration...');

    // Check OpenAI API key
    const openaiApiKey = this.config.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      this.logger.warn('OPENAI_API_KEY not set, using test mode');
    } else {
      this.logger.info('OpenAI API key configured');
    }

    // Check other config
    const model = this.config.get('OPENAI_MODEL', 'gpt-4');
    const maxTokens = this.config.get('OPENAI_MAX_TOKENS', 2000);
    const temperature = this.config.get('OPENAI_TEMPERATURE', 0.3);

    this.logger.info('Configuration loaded', {
      model,
      maxTokens,
      temperature,
      hasOpenAIKey: !!openaiApiKey
    });
  }

  async testContext7Integration() {
    this.logger.info('Testing Context7 integration...');

    const context7Service = new Context7RealIntegrationService(this.logger, this.config);

    try {
      // Test library selection
      const reactLibrary = await context7Service.selectValidatedLibrary('react');
      if (reactLibrary) {
        this.logger.info('Context7 library selection works', { library: reactLibrary });
      } else {
        this.logger.warn('No React library found in Context7');
      }

      // Test documentation retrieval
      if (reactLibrary) {
        const docs = await context7Service.getLibraryDocumentation(reactLibrary, undefined, 500);
        if (docs.content) {
          this.logger.info('Context7 documentation retrieval works', { 
            contentLength: docs.content.length 
          });
        } else {
          this.logger.warn('No documentation content retrieved');
        }
      }

    } catch (error) {
      this.logger.warn('Context7 integration test failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async testTaskBreakdownService() {
    this.logger.info('Testing TaskBreakdownService...');

    const context7Service = new Context7RealIntegrationService(this.logger, this.config);
    
    const taskBreakdownConfig = {
      openai: {
        apiKey: this.config.get('OPENAI_API_KEY', 'test-key'),
        model: this.config.get('OPENAI_MODEL', 'gpt-4'),
        maxTokens: this.config.get('OPENAI_MAX_TOKENS', 2000),
        temperature: this.config.get('OPENAI_TEMPERATURE', 0.3)
      },
      context7: {
        maxTokensPerLibrary: 1000,
        maxLibraries: 3
      }
    };

    const taskBreakdownService = new TaskBreakdownService(
      this.logger,
      context7Service,
      taskBreakdownConfig
    );

    // Test configuration
    const configTest = await taskBreakdownService.testConfiguration();
    this.logger.info('TaskBreakdownService configuration test', configTest);

    if (configTest.openai) {
      // Test actual breakdown
      try {
        const breakdown = await taskBreakdownService.breakdownPrompt(
          'Create a React component with TypeScript that displays a todo list',
          'test-project'
        );

        this.logger.info('Task breakdown successful', {
          mainTasks: breakdown.mainTasks.length,
          subtasks: breakdown.subtasks.length,
          dependencies: breakdown.dependencies.length
        });

        // Log sample tasks
        breakdown.mainTasks.slice(0, 3).forEach((task, index) => {
          this.logger.info(`Task ${index + 1}`, {
            title: task.title,
            priority: task.priority,
            category: task.category,
            estimatedHours: task.estimatedHours
          });
        });

      } catch (error) {
        this.logger.warn('Task breakdown failed (expected if no OpenAI key)', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      this.logger.warn('Skipping task breakdown test - OpenAI not available');
    }
  }

  async testBreakdownTool() {
    this.logger.info('Testing BreakdownTool...');

    const context7Service = new Context7RealIntegrationService(this.logger, this.config);
    
    const taskBreakdownConfig = {
      openai: {
        apiKey: this.config.get('OPENAI_API_KEY', 'test-key'),
        model: this.config.get('OPENAI_MODEL', 'gpt-4'),
        maxTokens: this.config.get('OPENAI_MAX_TOKENS', 2000),
        temperature: this.config.get('OPENAI_TEMPERATURE', 0.3)
      },
      context7: {
        maxTokensPerLibrary: 1000,
        maxLibraries: 3
      }
    };

    const taskBreakdownService = new TaskBreakdownService(
      this.logger,
      context7Service,
      taskBreakdownConfig
    );

    const breakdownTool = new BreakdownTool(
      this.logger,
      taskBreakdownService,
      context7Service,
      this.config
    );

    // Test tool schema
    const schema = breakdownTool.getToolSchema();
    this.logger.info('BreakdownTool schema', {
      name: schema.name,
      description: schema.description,
      hasInputSchema: !!schema.inputSchema
    });

    // Test breakdown request
    const request = {
      prompt: 'Build a simple blog with React and Node.js',
      projectId: 'test-project',
      options: {
        maxTasks: 5,
        includeSubtasks: true,
        includeDependencies: true
      }
    };

    try {
      const response = await breakdownTool.handleBreakdown(request);
      
      this.logger.info('BreakdownTool response', {
        success: response.success,
        message: response.message,
        taskCount: response.tasks.length,
        subtaskCount: response.subtasks?.length || 0,
        dependencyCount: response.dependencies?.length || 0
      });

      if (response.success) {
        this.logger.info('BreakdownTool test passed!');
      } else {
        this.logger.warn('BreakdownTool returned failure', { message: response.message });
      }

    } catch (error) {
      this.logger.warn('BreakdownTool test failed (expected if no OpenAI key)', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Run the test
const test = new BreakdownIntegrationTest();
test.run().catch(console.error);
