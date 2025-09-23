#!/usr/bin/env node

/**
 * Direct MCP Protocol Test
 * 
 * Tests the MCP server directly using stdio communication
 * Simulates how Cursor or other MCP clients would interact
 */

import { spawn } from 'child_process';

console.log('🔌 MCP Direct Protocol Test');
console.log('============================\n');

// Test messages
const testMessages = [
  {
    name: 'Initialize',
    message: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'mcp-test-client',
          version: '1.0.0'
        }
      }
    }
  },
  {
    name: 'List Tools',
    message: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    }
  },
  {
    name: 'Enhance Tool - React',
    message: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'promptmcp.enhance',
        arguments: {
          prompt: 'Create a React button component',
          context: {
            framework: 'react',
            style: 'tailwind'
          }
        }
      }
    }
  },
  {
    name: 'Enhance Tool - Vue',
    message: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'promptmcp.enhance',
        arguments: {
          prompt: 'Create a Vue form with validation',
          context: {
            framework: 'vue',
            style: 'css'
          }
        }
      }
    }
  }
];

function runMcpTest() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting MCP server...');
    
    const mcpProcess = spawn('node', ['dist/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let responses = [];
    let testResults = [];
    
    mcpProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('📤 Server output:', text.trim());
    });
    
    mcpProcess.stderr.on('data', (data) => {
      console.log('⚠️  Server error:', data.toString().trim());
    });
    
    mcpProcess.on('close', (code) => {
      console.log(`\n📊 Server exited with code: ${code}`);
      
      // Parse responses
      const lines = output.split('\n').filter(line => line.trim());
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
      console.log('\n🔍 Validating responses...');
      
      for (const test of testMessages) {
        const response = responses.find(r => r.id === test.message.id);
        
        if (response) {
          if (response.error) {
            testResults.push({
              name: test.name,
              status: 'FAIL',
              details: `Error: ${response.error.message}`
            });
            console.log(`❌ ${test.name}: ${response.error.message}`);
          } else if (response.result) {
            testResults.push({
              name: test.name,
              status: 'PASS',
              details: 'Response received successfully'
            });
            console.log(`✅ ${test.name}: Success`);
            
            // Show enhanced prompt for enhance tool tests
            if (test.message.method === 'tools/call' && response.result.content) {
              const content = response.result.content[0];
              if (content && content.text) {
                try {
                  const result = JSON.parse(content.text);
                  console.log(`   📝 Enhanced prompt: ${result.enhanced_prompt.substring(0, 100)}...`);
                } catch (e) {
                  console.log(`   📝 Response: ${content.text.substring(0, 100)}...`);
                }
              }
            }
          } else {
            testResults.push({
              name: test.name,
              status: 'FAIL',
              details: 'No result in response'
            });
            console.log(`❌ ${test.name}: No result in response`);
          }
        } else {
          testResults.push({
            name: test.name,
            status: 'FAIL',
            details: 'No response received'
          });
          console.log(`❌ ${test.name}: No response received`);
        }
      }
      
      // Summary
      const passed = testResults.filter(t => t.status === 'PASS').length;
      const total = testResults.length;
      
      console.log('\n📊 Test Summary');
      console.log('================');
      console.log(`✅ Passed: ${passed}/${total}`);
      
      if (passed === total) {
        console.log('🎉 All MCP tests PASSED!');
        resolve(testResults);
      } else {
        console.log('❌ Some tests FAILED');
        reject(new Error(`${total - passed} tests failed`));
      }
    });
    
    // Send test messages with delays
    let messageIndex = 0;
    
    function sendNextMessage() {
      if (messageIndex < testMessages.length) {
        const test = testMessages[messageIndex];
        console.log(`\n📤 Sending: ${test.name}`);
        console.log(`   Message: ${JSON.stringify(test.message, null, 2)}`);
        
        mcpProcess.stdin.write(JSON.stringify(test.message) + '\n');
        messageIndex++;
        
        // Send next message after a delay
        setTimeout(sendNextMessage, 1000);
      } else {
        // Close stdin after sending all messages
        setTimeout(() => {
          mcpProcess.stdin.end();
        }, 1000);
      }
    }
    
    // Start sending messages after a short delay
    setTimeout(sendNextMessage, 500);
  });
}

// Run the test
runMcpTest()
  .then(() => {
    console.log('\n🎯 MCP Direct Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ MCP Direct Test failed:', error.message);
    process.exit(1);
  });
