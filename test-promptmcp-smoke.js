#!/usr/bin/env node

/**
 * PromptMCP Smoke Test Suite
 * 
 * Tests both HTTP API and MCP protocol functionality
 * Validates the complete prompt enhancement pipeline
 */

import { spawn } from 'child_process';
import { createWriteStream } from 'fs';
import { readFile } from 'fs/promises';

const TEST_RESULTS = {
  http: { passed: 0, failed: 0, tests: [] },
  mcp: { passed: 0, failed: 0, tests: [] }
};

// Test data
const TEST_CASES = [
  {
    name: "Basic React Component",
    prompt: "Create a button component",
    context: { framework: "react", style: "tailwind" },
    expected: ["React", "component", "button"]
  },
  {
    name: "Vue Form with Validation",
    prompt: "Create a login form with validation",
    context: { framework: "vue", style: "css" },
    expected: ["Vue", "form", "validation"]
  },
  {
    name: "TypeScript Function",
    prompt: "Create a utility function for API calls",
    context: { framework: "typescript" },
    expected: ["TypeScript", "function", "API"]
  }
];

console.log('🧪 PromptMCP Smoke Test Suite');
console.log('================================\n');

// Test HTTP API
async function testHttpApi() {
  console.log('🌐 Testing HTTP API...');
  
  for (const testCase of TEST_CASES) {
    try {
      const response = await fetch('http://localhost:3000/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testCase.prompt,
          context: testCase.context
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Validate response structure
      if (!result.enhanced_prompt || !result.context_used) {
        throw new Error('Invalid response structure');
      }
      
      // Check if enhanced prompt contains expected keywords
      const enhancedPrompt = result.enhanced_prompt.toLowerCase();
      const hasExpectedKeywords = testCase.expected.some(keyword => 
        enhancedPrompt.includes(keyword.toLowerCase())
      );
      
      if (hasExpectedKeywords) {
        TEST_RESULTS.http.passed++;
        TEST_RESULTS.http.tests.push({
          name: testCase.name,
          status: 'PASS',
          details: `Enhanced prompt contains expected keywords`
        });
        console.log(`  ✅ ${testCase.name}`);
      } else {
        throw new Error(`Enhanced prompt missing expected keywords: ${testCase.expected.join(', ')}`);
      }
      
    } catch (error) {
      TEST_RESULTS.http.failed++;
      TEST_RESULTS.http.tests.push({
        name: testCase.name,
        status: 'FAIL',
        details: error.message
      });
      console.log(`  ❌ ${testCase.name}: ${error.message}`);
    }
  }
  
  // Test health endpoint
  try {
    const response = await fetch('http://localhost:3000/health');
    const health = await response.json();
    
    if (health.status === 'healthy' && health.service === 'PromptMCP') {
      TEST_RESULTS.http.passed++;
      TEST_RESULTS.http.tests.push({
        name: 'Health Check',
        status: 'PASS',
        details: 'Health endpoint returns correct status'
      });
      console.log('  ✅ Health Check');
    } else {
      throw new Error('Invalid health response');
    }
  } catch (error) {
    TEST_RESULTS.http.failed++;
    TEST_RESULTS.http.tests.push({
      name: 'Health Check',
      status: 'FAIL',
      details: error.message
    });
    console.log(`  ❌ Health Check: ${error.message}`);
  }
}

// Test MCP Protocol
async function testMcpProtocol() {
  console.log('\n🔌 Testing MCP Protocol...');
  
  return new Promise((resolve) => {
    const mcpProcess = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Test MCP initialization
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'smoke-test',
          version: '1.0.0'
        }
      }
    };
    
    // Test list tools
    const listToolsMessage = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    
    // Test enhance tool
    const enhanceMessage = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'promptmcp.enhance',
        arguments: {
          prompt: 'Create a simple component',
          context: { framework: 'react' }
        }
      }
    };
    
    let messageCount = 0;
    const totalMessages = 3;
    
    function sendNextMessage() {
      if (messageCount === 0) {
        mcpProcess.stdin.write(JSON.stringify(initMessage) + '\n');
      } else if (messageCount === 1) {
        mcpProcess.stdin.write(JSON.stringify(listToolsMessage) + '\n');
      } else if (messageCount === 2) {
        mcpProcess.stdin.write(JSON.stringify(enhanceMessage) + '\n');
        // Close stdin after sending all messages
        setTimeout(() => {
          mcpProcess.stdin.end();
        }, 100);
      }
      messageCount++;
    }
    
    mcpProcess.on('close', (code) => {
      // Parse MCP responses
      const lines = output.split('\n').filter(line => line.trim());
      let responses = [];
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.jsonrpc === '2.0') {
            responses.push(response);
          }
        } catch (e) {
          // Skip non-JSON lines
        }
      }
      
      // Validate responses
      if (responses.length >= 3) {
        // Check initialization response
        const initResponse = responses.find(r => r.id === 1);
        if (initResponse && initResponse.result) {
          TEST_RESULTS.mcp.passed++;
          TEST_RESULTS.mcp.tests.push({
            name: 'MCP Initialize',
            status: 'PASS',
            details: 'MCP server initialized successfully'
          });
          console.log('  ✅ MCP Initialize');
        } else {
          TEST_RESULTS.mcp.failed++;
          TEST_RESULTS.mcp.tests.push({
            name: 'MCP Initialize',
            status: 'FAIL',
            details: 'MCP initialization failed'
          });
          console.log('  ❌ MCP Initialize');
        }
        
        // Check tools list response
        const toolsResponse = responses.find(r => r.id === 2);
        if (toolsResponse && toolsResponse.result && toolsResponse.result.tools) {
          const hasEnhanceTool = toolsResponse.result.tools.some(tool => 
            tool.name === 'promptmcp.enhance'
          );
          if (hasEnhanceTool) {
            TEST_RESULTS.mcp.passed++;
            TEST_RESULTS.mcp.tests.push({
              name: 'MCP Tools List',
              status: 'PASS',
              details: 'promptmcp.enhance tool found in tools list'
            });
            console.log('  ✅ MCP Tools List');
          } else {
            throw new Error('promptmcp.enhance tool not found');
          }
        } else {
          throw new Error('Tools list response invalid');
        }
        
        // Check enhance tool response
        const enhanceResponse = responses.find(r => r.id === 3);
        if (enhanceResponse && enhanceResponse.result && enhanceResponse.result.content) {
          TEST_RESULTS.mcp.passed++;
          TEST_RESULTS.mcp.tests.push({
            name: 'MCP Enhance Tool',
            status: 'PASS',
            details: 'Enhance tool executed successfully'
          });
          console.log('  ✅ MCP Enhance Tool');
        } else {
          TEST_RESULTS.mcp.failed++;
          TEST_RESULTS.mcp.tests.push({
            name: 'MCP Enhance Tool',
            status: 'FAIL',
            details: 'Enhance tool execution failed'
          });
          console.log('  ❌ MCP Enhance Tool');
        }
      } else {
        TEST_RESULTS.mcp.failed++;
        TEST_RESULTS.mcp.tests.push({
          name: 'MCP Protocol',
          status: 'FAIL',
          details: `Expected 3 responses, got ${responses.length}`
        });
        console.log(`  ❌ MCP Protocol: Expected 3 responses, got ${responses.length}`);
      }
      
      resolve();
    });
    
    // Start sending messages
    setTimeout(sendNextMessage, 100);
  });
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const startTime = Date.now();
  const requests = [];
  
  // Send 10 concurrent requests
  for (let i = 0; i < 10; i++) {
    requests.push(
      fetch('http://localhost:3000/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Test prompt ${i}`,
          context: { framework: 'react' }
        })
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / 10;
    
    console.log(`  📊 10 concurrent requests completed in ${totalTime}ms`);
    console.log(`  📊 Average response time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 1000) {
      console.log('  ✅ Performance test PASSED (< 1s average)');
    } else {
      console.log('  ⚠️  Performance test WARNING (> 1s average)');
    }
  } catch (error) {
    console.log(`  ❌ Performance test FAILED: ${error.message}`);
  }
}

// Generate test report
function generateReport() {
  console.log('\n📊 Test Report');
  console.log('===============');
  
  const totalHttp = TEST_RESULTS.http.passed + TEST_RESULTS.http.failed;
  const totalMcp = TEST_RESULTS.mcp.passed + TEST_RESULTS.mcp.failed;
  
  console.log(`\n🌐 HTTP API: ${TEST_RESULTS.http.passed}/${totalHttp} tests passed`);
  TEST_RESULTS.http.tests.forEach(test => {
    console.log(`  ${test.status === 'PASS' ? '✅' : '❌'} ${test.name}: ${test.details}`);
  });
  
  console.log(`\n🔌 MCP Protocol: ${TEST_RESULTS.mcp.passed}/${totalMcp} tests passed`);
  TEST_RESULTS.mcp.tests.forEach(test => {
    console.log(`  ${test.status === 'PASS' ? '✅' : '❌'} ${test.name}: ${test.details}`);
  });
  
  const totalPassed = TEST_RESULTS.http.passed + TEST_RESULTS.mcp.passed;
  const totalTests = totalHttp + totalMcp;
  
  console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests PASSED! PromptMCP is working perfectly!');
    process.exit(0);
  } else {
    console.log('❌ Some tests FAILED. Check the details above.');
    process.exit(1);
  }
}

// Main test runner
async function runSmokeTests() {
  try {
    await testHttpApi();
    await testMcpProtocol();
    await testPerformance();
    generateReport();
  } catch (error) {
    console.error('❌ Smoke test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/health');
    if (response.ok) {
      console.log('✅ Server is running and ready for testing\n');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start PromptMCP first:');
    console.log('   docker run -d --name promptmcp -p 3000:3000 promptmcp');
    console.log('   or');
    console.log('   npm start');
    process.exit(1);
  }
}

// Run the tests
checkServer().then(() => runSmokeTests());
