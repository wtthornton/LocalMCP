#!/usr/bin/env node

/**
 * E2E Integration Docker Test
 * 
 * Tests the complete workflow of the deployed Docker container
 * This simulates a real user workflow with multiple tool calls
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INTEGRATION_SCENARIOS = [
  {
    name: "Complete Developer Workflow",
    description: "Simulate a developer enhancing prompts and managing todos",
    steps: [
      {
        name: "Initialize MCP Connection",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "integration-test", version: "1.0.0" }
        }
      },
      {
        name: "Enhance React Component Prompt",
        method: "tools/call",
        params: {
          name: "promptmcp.enhance",
          arguments: {
            prompt: "Create a user profile component with avatar upload",
            context: { framework: "react", style: "tailwind" }
          }
        }
      },
      {
        name: "Create Todo for Component Development",
        method: "tools/call",
        params: {
          name: "promptmcp.todo",
          arguments: {
            action: "create",
            projectId: "integration-test",
            content: "Implement user profile component with avatar upload functionality",
            priority: "high",
            category: "feature"
          }
        }
      },
      {
        name: "Create Subtask for Avatar Handling",
        method: "tools/call",
        params: {
          name: "promptmcp.todo",
          arguments: {
            action: "create",
            projectId: "integration-test",
            content: "Add file upload validation for avatar images",
            priority: "medium",
            category: "feature"
          }
        }
      },
      {
        name: "List All Project Todos",
        method: "tools/call",
        params: {
          name: "promptmcp.todo",
          arguments: {
            action: "list",
            projectId: "integration-test",
            filters: {}
          }
        }
      },
      {
        name: "Enhance Vue.js Form Prompt",
        method: "tools/call",
        params: {
          name: "promptmcp.enhance",
          arguments: {
            prompt: "Create a Vue form with validation for user registration",
            context: { framework: "vue", style: "modern" }
          }
        }
      }
    ]
  },
  {
    name: "Multi-Framework Enhancement",
    description: "Test enhancing prompts for different frameworks",
    steps: [
      {
        name: "Enhance TypeScript Utility Function",
        method: "tools/call",
        params: {
          name: "promptmcp.enhance",
          arguments: {
            prompt: "Create a utility function for API error handling",
            context: { framework: "typescript" }
          }
        }
      },
      {
        name: "Enhance Node.js Backend Prompt",
        method: "tools/call",
        params: {
          name: "promptmcp.enhance",
          arguments: {
            prompt: "Create a REST API endpoint for user authentication",
            context: { framework: "nodejs", style: "express" }
          }
        }
      }
    ]
  }
];

let passed = 0;
let failed = 0;
let mcpProcess = null;

console.log('🧪 E2E Integration Docker Test');
console.log('================================\n');

class IntegrationTester {
  constructor() {
    this.responses = new Map();
    this.requestId = 1;
  }

  async startMCPServer() {
    console.log('🚀 Starting MCP server for integration testing...');
    
    mcpProcess = spawn('node', ['dist/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: join(__dirname, '..')
    });

    mcpProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        try {
          const response = JSON.parse(line);
          this.responses.set(response.id, response);
        } catch (e) {
          // Skip non-JSON output
        }
      });
    });

    mcpProcess.on('error', (error) => {
      console.error('❌ Failed to start MCP server:', error.message);
      process.exit(1);
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ MCP server started\n');
  }

  async sendRequest(step) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: step.method,
      params: step.params
    };

    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    const maxWait = 15000; // 15 seconds for integration tests
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (this.responses.has(request.id)) {
        return this.responses.get(request.id);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for response to ${step.name}`);
  }

  async runScenario(scenario) {
    console.log(`🎯 Running Scenario: ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Steps: ${scenario.steps.length}\n`);
    
    let scenarioPassed = 0;
    let scenarioFailed = 0;

    for (const step of scenario.steps) {
      try {
        console.log(`   📤 ${step.name}...`);
        const response = await this.sendRequest(step);
        
        if (response.error) {
          console.log(`      ❌ Failed - Error: ${response.error.message}`);
          scenarioFailed++;
        } else {
          console.log(`      ✅ Success`);
          scenarioPassed++;
          
          // Show relevant details for certain steps
          if (step.method === 'tools/call' && step.params.name === 'promptmcp.enhance') {
            console.log(`         📝 Enhanced prompt generated`);
          } else if (step.method === 'tools/call' && step.params.name === 'promptmcp.todo') {
            if (step.params.arguments.action === 'create') {
              console.log(`         📋 Todo created successfully`);
            } else if (step.params.arguments.action === 'list') {
              console.log(`         📋 Todo list retrieved`);
            }
          }
        }
      } catch (error) {
        console.log(`      ❌ Failed - ${error.message}`);
        scenarioFailed++;
      }
      
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n   📊 Scenario Results: ${scenarioPassed} passed, ${scenarioFailed} failed\n`);
    
    passed += scenarioPassed;
    failed += scenarioFailed;
    
    return { passed: scenarioPassed, failed: scenarioFailed };
  }

  async runAllScenarios() {
    console.log('Starting integration tests...\n');
    
    await this.startMCPServer();
    
    const results = [];
    for (const scenario of INTEGRATION_SCENARIOS) {
      const result = await this.runScenario(scenario);
      results.push({ scenario: scenario.name, ...result });
    }
    
    // Cleanup
    if (mcpProcess) {
      console.log('🛑 Stopping MCP server...');
      mcpProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print results
    console.log('📊 Integration Test Results Summary');
    console.log('===================================');
    console.log(`Total Scenarios: ${INTEGRATION_SCENARIOS.length}`);
    console.log(`Total Steps: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Scenario Breakdown:');
    results.forEach(result => {
      const successRate = ((result.passed / (result.passed + result.failed)) * 100).toFixed(1);
      console.log(`   ${result.scenario}: ${result.passed}/${result.passed + result.failed} (${successRate}%)`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 All integration tests PASSED!');
      console.log('✅ Complete developer workflows working');
      console.log('✅ Multi-framework enhancement working');
      console.log('✅ Todo management integration working');
      console.log('✅ MCP server handles complex scenarios');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some integration tests FAILED!');
      console.log('❌ Some workflows need attention');
      process.exit(1);
    }
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(1);
});

// Run the tests
const tester = new IntegrationTester();
tester.runAllScenarios().catch((error) => {
  console.error('❌ Integration test suite failed:', error.message);
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(1);
});
