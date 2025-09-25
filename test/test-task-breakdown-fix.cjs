#!/usr/bin/env node

/**
 * Test script to verify task breakdown functionality is working
 * This will specifically test the breakdown tool to ensure no 401 errors
 */

const { spawn } = require('child_process');

console.log('🧪 Testing Task Breakdown functionality...\n');

const testTaskBreakdown = () => {
  return new Promise((resolve) => {
    console.log('📤 Testing promptmcp.breakdown tool...');
    
    const mcpProcess = spawn('docker', [
      'exec', '-i', 'promptmcp-server',
      'sh', '-c', 'ENHANCE_DEBUG=true CONTEXT7_DEBUG=true NODE_ENV=production node dist/mcp/server.js'
    ], {
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

    mcpProcess.on('close', (code) => {
      resolve({ output, errorOutput, code });
    });

    // Send a breakdown request
    const breakdownRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'promptmcp.breakdown',
        arguments: {
          prompt: 'Create a React component for a todo list with add, edit, and delete functionality',
          projectId: 'test-project'
        }
      }
    };

    setTimeout(() => {
      mcpProcess.stdin.write(JSON.stringify(breakdownRequest) + '\n');
      setTimeout(() => {
        mcpProcess.kill();
      }, 5000);
    }, 1000);
  });
};

// Run the test
async function runTest() {
  try {
    const result = await testTaskBreakdown();
    
    console.log('📥 Task Breakdown Test Results:');
    console.log('=====================================');
    
    const hasSuccess = result.output.includes('"result"') && !result.output.includes('"error"');
    const has401Error = result.output.includes('401') || result.output.includes('API key invalid');
    const hasTaskBreakdown = result.output.includes('mainTasks') || result.output.includes('subtasks');
    
    if (hasSuccess && hasTaskBreakdown && !has401Error) {
      console.log('✅ SUCCESS: Task breakdown is working correctly!');
      console.log('✅ No 401 authentication errors detected');
      console.log('✅ Task breakdown response received');
    } else if (has401Error) {
      console.log('❌ FAILED: Still getting 401 authentication errors');
      console.log('🔍 Issue: OpenAI API key authentication failed');
    } else if (!hasTaskBreakdown) {
      console.log('⚠️  PARTIAL: No task breakdown response detected');
      console.log('🔍 Issue: Task breakdown may not be working properly');
    } else {
      console.log('❌ FAILED: Unexpected response format');
    }
    
    if (result.output.includes('"error"')) {
      console.log('\n📋 Error Details:');
      console.log(result.output);
    }
    
    console.log('\n🔚 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
