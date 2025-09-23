/**
 * Complete Integration Test
 * 
 * Tests all three tools working together in a realistic workflow
 */

// Load OpenAI keys from centralized configuration
import { loadOpenAIKeys } from '../scripts/load-keys.js';
loadOpenAIKeys();

import { MCPServer } from '../dist/mcp/server.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { Context7IntegrationService } from '../dist/services/context7/context7-integration.service.js';

class CompleteIntegrationTest {
  constructor() {
    this.logger = new Logger('CompleteIntegrationTest');
    this.config = new ConfigService();
    this.mcpServer = null;
    this.testResults = {
      enhance: { success: false, error: null },
      todo: { success: false, error: null },
      breakdown: { success: false, error: null },
      integration: { success: false, error: null }
    };
  }

  async run() {
    console.log('🚀 Starting Complete Integration Test...');
    console.log('=====================================');

    try {
      // 1. Initialize MCP Server
      await this.initializeMCPServer();
      
      // 2. Test Individual Tools
      await this.testEnhanceTool();
      await this.testTodoTool();
      await this.testBreakdownTool();
      
      // 3. Test Integration Workflow
      await this.testIntegrationWorkflow();
      
      // 4. Generate Report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
      process.exit(1);
    }
  }

  async initializeMCPServer() {
    console.log('\n📡 Initializing MCP Server...');
    
    try {
      // Initialize Context7
      const context7Integration = new Context7IntegrationService(this.logger, this.config);
      await context7Integration.initialize();
      
      // Create services object
      const services = {
        logger: this.logger,
        config: this.config,
        context7Integration
      };
      
      // Create MCP server
      this.mcpServer = new MCPServer(services);
      await this.mcpServer.initialize();
      
      console.log('✅ MCP Server initialized successfully');
      
    } catch (error) {
      console.error('❌ MCP Server initialization failed:', error.message);
      throw error;
    }
  }

  async testEnhanceTool() {
    console.log('\n🔍 Testing promptmcp.enhance...');
    
    try {
      const result = await this.mcpServer.executeTool('promptmcp.enhance', {
        prompt: 'Create a React component for user authentication',
        context: {
          projectContext: {
            projectId: 'test-project'
          }
        }
      });
      
      if (result && result.includes('React')) {
        console.log('✅ Enhance tool working correctly');
        this.testResults.enhance.success = true;
      } else {
        throw new Error('Enhance tool returned unexpected result');
      }
      
    } catch (error) {
      console.error('❌ Enhance tool test failed:', error.message);
      this.testResults.enhance.error = error.message;
    }
  }

  async testTodoTool() {
    console.log('\n📝 Testing promptmcp.todo...');
    
    try {
      // Create a todo
      const createResult = await this.mcpServer.executeTool('promptmcp.todo', {
        action: 'create',
        title: 'Test todo for integration',
        description: 'This is a test todo for integration testing',
        priority: 'high',
        category: 'testing',
        projectId: 'test-project'
      });
      
      if (createResult && createResult.includes('success')) {
        console.log('✅ Todo creation working correctly');
        
        // List todos
        const listResult = await this.mcpServer.executeTool('promptmcp.todo', {
          action: 'list',
          projectId: 'test-project'
        });
        
        if (listResult && listResult.includes('Test todo for integration')) {
          console.log('✅ Todo listing working correctly');
          this.testResults.todo.success = true;
        } else {
          throw new Error('Todo listing failed');
        }
      } else {
        throw new Error('Todo creation failed');
      }
      
    } catch (error) {
      console.error('❌ Todo tool test failed:', error.message);
      this.testResults.todo.error = error.message;
    }
  }

  async testBreakdownTool() {
    console.log('\n🤖 Testing promptmcp.breakdown...');
    
    try {
      const result = await this.mcpServer.executeTool('promptmcp.breakdown', {
        prompt: 'Build a simple blog application with React and Node.js',
        projectId: 'test-project',
        maxTasks: 3,
        includeSubtasks: true,
        includeDependencies: true
      });
      
      if (result && result.includes('success')) {
        console.log('✅ Breakdown tool working correctly');
        this.testResults.breakdown.success = true;
      } else {
        throw new Error('Breakdown tool returned unexpected result');
      }
      
    } catch (error) {
      console.error('❌ Breakdown tool test failed:', error.message);
      this.testResults.breakdown.error = error.message;
    }
  }

  async testIntegrationWorkflow() {
    console.log('\n🔄 Testing Integration Workflow...');
    
    try {
      // 1. Break down a complex request
      console.log('   Step 1: Breaking down complex request...');
      const breakdownResult = await this.mcpServer.executeTool('promptmcp.breakdown', {
        prompt: 'Create a task management application',
        projectId: 'integration-test',
        maxTasks: 2,
        includeSubtasks: true
      });
      
      if (!breakdownResult || !breakdownResult.includes('success')) {
        throw new Error('Breakdown step failed');
      }
      
      // 2. Create todos from breakdown
      console.log('   Step 2: Creating todos from breakdown...');
      const todoResult = await this.mcpServer.executeTool('promptmcp.todo', {
        action: 'create',
        title: 'Setup project infrastructure',
        description: 'Initialize React frontend and Node.js backend',
        priority: 'high',
        category: 'setup',
        projectId: 'integration-test'
      });
      
      if (!todoResult || !todoResult.includes('success')) {
        throw new Error('Todo creation step failed');
      }
      
      // 3. Enhance prompts with context
      console.log('   Step 3: Enhancing prompts with context...');
      const enhanceResult = await this.mcpServer.executeTool('promptmcp.enhance', {
        prompt: 'Create a user dashboard component',
        context: {
          projectContext: {
            projectId: 'integration-test'
          }
        }
      });
      
      if (!enhanceResult || !enhanceResult.includes('React')) {
        throw new Error('Enhance step failed');
      }
      
      console.log('✅ Integration workflow completed successfully');
      this.testResults.integration.success = true;
      
    } catch (error) {
      console.error('❌ Integration workflow test failed:', error.message);
      this.testResults.integration.error = error.message;
    }
  }

  generateReport() {
    console.log('\n📊 Integration Test Report');
    console.log('==========================');
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result.success).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\nOverall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    
    console.log('\nIndividual Tool Results:');
    console.log('------------------------');
    
    Object.entries(this.testResults).forEach(([tool, result]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${tool.padEnd(12)}: ${status}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    if (successRate === 100) {
      console.log('\n🎉 All tests passed! PromptMCP is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Configure Cursor IDE with the MCP server');
    console.log('2. Test the tools in your development environment');
    console.log('3. Start using PromptMCP for your projects!');
  }
}

// Run the test
const test = new CompleteIntegrationTest();
test.run().catch(console.error);
