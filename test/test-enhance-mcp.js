#!/usr/bin/env node

/**
 * Test PromptMCP enhance tool via MCP protocol
 * This tests the actual MCP server running in Docker
 */

import { spawn } from 'child_process';

async function testEnhanceTool() {
  console.log('🧪 Testing PromptMCP enhance tool via MCP protocol...\n');

  // Test prompt
  const testPrompt = "Create a React component with hooks for managing a todo list";
  
  // MCP request to call the enhance tool
  const mcpRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'promptmcp.enhance',
      arguments: {
        prompt: testPrompt,
        context: {
          file: 'test-component.tsx',
          framework: 'react',
          style: 'modern'
        },
        options: {
          useCache: true,
          maxTokens: 2000,
          includeMetadata: true,
          includeBreakdown: true,
          maxTasks: 5
        }
      }
    }
  };

  console.log('📝 Test prompt:', testPrompt);
  console.log('📤 Sending MCP request...\n');

  // Execute the MCP server and send the request
  const mcpProcess = spawn('docker', [
    'exec', '-i', 'promptmcp-server', 
    'node', 'dist/mcp/server.js'
  ], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  let errorData = '';

  mcpProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  mcpProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  mcpProcess.on('close', (code) => {
    console.log('📥 MCP Response received');
    console.log('Exit code:', code);
    
    if (errorData) {
      console.log('❌ Errors:', errorData);
    }
    
    if (responseData) {
      try {
        const lines = responseData.trim().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              console.log('✅ MCP Response:', JSON.stringify(response, null, 2));
            } catch (e) {
              console.log('📄 Raw output:', line);
            }
          }
        }
      } catch (e) {
        console.log('📄 Raw response:', responseData);
      }
    }
    
    console.log('\n🏁 Test completed');
  });

  // Send the MCP request
  mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
  mcpProcess.stdin.end();
}

// Run the test
testEnhanceTool().catch(console.error);
