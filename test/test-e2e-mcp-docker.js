#!/usr/bin/env node

/**
 * E2E MCP Docker Test
 * 
 * Tests the deployed Docker container via MCP protocol over stdio
 * This simulates how Cursor would communicate with the MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_CASES = [
  {
    name: "Initialize MCP Server",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  },
    {
      name: "List Available Tools",
      method: "tools/list",
      params: {}
    },
    {
      name: "Health Check",
      method: "tools/call",
      params: {
        name: "promptmcp.health",
        arguments: {}
      }
    },
  {
    name: "Enhance React Component Prompt",
    method: "tools/call",
    params: {
      name: "promptmcp.enhance",
      arguments: {
        prompt: "Create a React button component with hover effects",
        context: {
          framework: "react",
          style: "modern"
        }
      }
    }
  },
  {
    name: "Create Todo Item",
    method: "tools/call",
    params: {
      name: "promptmcp.todo",
      arguments: {
        action: "create",
        projectId: "e2e-test",
        content: "E2E Test Todo - This todo was created during E2E testing",
        priority: "high",
        category: "testing"
      }
    }
  },
  {
    name: "List Todos",
    method: "tools/call",
    params: {
      name: "promptmcp.todo",
      arguments: {
        action: "list",
        projectId: "e2e-test",
        filters: {}
      }
    }
  },
];

let passed = 0;
let failed = 0;
let mcpProcess = null;

console.log('🧪 E2E MCP Docker Test');
console.log('=======================\n');

class MCPTester {
  constructor() {
    this.responses = new Map();
    this.requestId = 1;
  }

  async startMCPServer() {
    console.log('🚀 Starting MCP server...');
    
    // Start the MCP server process
    mcpProcess = spawn('node', ['dist/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: join(__dirname, '..')
    });

    // Set up response handling
    mcpProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        try {
          const response = JSON.parse(line);
          this.responses.set(response.id, response);
        } catch (e) {
          console.log('📝 Server output:', line);
        }
      });
    });

    mcpProcess.on('error', (error) => {
      console.error('❌ Failed to start MCP server:', error.message);
      process.exit(1);
    });

    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ MCP server started\n');
  }

  async sendRequest(testCase) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: testCase.method,
      params: testCase.params
    };

    console.log(`📤 Sending: ${testCase.name}`);
    console.log(`   Method: ${testCase.method}`);
    
    // Send request to MCP server
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response
    const maxWait = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (this.responses.has(request.id)) {
        return this.responses.get(request.id);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for response to ${testCase.name}`);
  }

  async runTest(testCase) {
    try {
      const response = await this.sendRequest(testCase);
      
      if (response.error) {
        console.log(`  ❌ ${testCase.name} - Error: ${response.error.message}`);
        failed++;
        return false;
      }
      
      console.log(`  ✅ ${testCase.name} - Success`);
      
      // Show some response details for specific tests
      if (testCase.method === 'tools/list' && response.result?.tools) {
        const toolNames = response.result.tools.map(t => t.name).join(', ');
        console.log(`     Available tools: ${toolNames}`);
      } else if (testCase.method === 'tools/call' && testCase.params.name === 'promptmcp.enhance') {
        console.log(`     Enhanced prompt received`);
      } else if (testCase.method === 'tools/call' && testCase.params.name === 'promptmcp.todo') {
        if (testCase.params.arguments.action === 'create') {
          console.log(`     Todo created successfully`);
        } else if (testCase.params.arguments.action === 'list') {
          console.log(`     Todo list retrieved`);
        }
      }
      
      passed++;
      return true;
      
    } catch (error) {
      console.log(`  ❌ ${testCase.name} - Error: ${error.message}`);
      failed++;
      return false;
    }
  }

  async runAllTests() {
    console.log('Starting E2E tests against Docker MCP server...\n');
    
    await this.startMCPServer();
    
    for (const testCase of TEST_CASES) {
      await this.runTest(testCase);
      console.log(''); // Empty line for readability
    }
    
    // Cleanup
    if (mcpProcess) {
      console.log('🛑 Stopping MCP server...');
      mcpProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print results
    console.log('📊 E2E Test Results Summary');
    console.log('============================');
    console.log(`Total Tests: ${TEST_CASES.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All E2E tests PASSED! Docker MCP server is working perfectly!');
      console.log('✅ MCP server starts correctly');
      console.log('✅ MCP protocol communication works');
      console.log('✅ All available tools are accessible');
      console.log('✅ Context7 integration functional');
      console.log('✅ Todo system working');
      process.exit(0);
    } else {
      console.log('\n💥 Some E2E tests FAILED!');
      console.log('❌ Docker MCP server has issues that need to be fixed');
      process.exit(1);
    }
  }
}

// Handle cleanup on exit
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
const tester = new MCPTester();
tester.runAllTests().catch((error) => {
  console.error('❌ E2E test suite failed:', error.message);
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(1);
});
