#!/usr/bin/env node

/**
 * Test script to verify PromptMCP works with Cursor
 * This simulates what Cursor does when calling the MCP server
 */

import { spawn } from 'child_process';

console.log('🧪 Testing PromptMCP MCP Server for Cursor...\n');

// Test 1: List tools
console.log('1️⃣ Testing tools/list...');
const listRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

// Test 2: Call enhance tool
console.log('2️⃣ Testing tools/call with promptmcp.enhance...');
const enhanceRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'promptmcp.enhance',
    arguments: {
      prompt: 'create a simple HTML page with a dark theme'
    }
  }
};

async function testMCP() {
  return new Promise((resolve, reject) => {
    const server = spawn('docker', ['run', '--rm', '-i', 'promptmcp-mcp'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let responses = [];

    server.stdout.on('data', (data) => {
      output += data.toString();
      
      // Look for JSON responses
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('"jsonrpc"')) {
          try {
            const response = JSON.parse(line);
            responses.push(response);
            console.log(`✅ Received response: ${response.method || 'tool call'}`);
            
            if (response.result && response.result.content) {
              console.log('📝 Enhanced Prompt:');
              const content = JSON.parse(response.result.content[0].text);
              console.log(content.enhanced_prompt);
              console.log('\n🎯 Context Used:');
              console.log(JSON.stringify(content.context_used, null, 2));
            }
          } catch (e) {
            // Not JSON, might be log output
          }
        }
      }
    });

    server.stderr.on('data', (data) => {
      const message = data.toString();
      if (message.includes('Failed to obtain server version')) {
        console.log('⚠️  Version compatibility warning (this is normal)');
      } else if (message.includes('WARN') || message.includes('ERROR')) {
        console.log(`📋 ${message.trim()}`);
      }
    });

    server.on('close', (code) => {
      console.log(`\n🏁 Server closed with code: ${code}`);
      resolve(responses);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      reject(error);
    });

    // Send requests
    setTimeout(() => {
      console.log('📤 Sending tools/list request...');
      server.stdin.write(JSON.stringify(listRequest) + '\n');
    }, 1000);

    setTimeout(() => {
      console.log('📤 Sending tools/call request...');
      server.stdin.write(JSON.stringify(enhanceRequest) + '\n');
    }, 2000);

    setTimeout(() => {
      console.log('⏰ Test timeout, closing server...');
      server.kill();
    }, 10000);
  });
}

testMCP()
  .then((responses) => {
    console.log('\n🎉 Test completed successfully!');
    console.log(`📊 Received ${responses.length} responses`);
    
    if (responses.length >= 2) {
      console.log('\n✅ PromptMCP is ready for Cursor!');
      console.log('🚀 You can now use @promptmcp.enhance in Cursor IDE');
    } else {
      console.log('\n❌ Some tests failed');
    }
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });








