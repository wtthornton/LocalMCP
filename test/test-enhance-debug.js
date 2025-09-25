#!/usr/bin/env node

/**
 * Test script to verify enhance tool debug statements
 * This will specifically call the enhance tool to see the debug output
 */

const { spawn } = require('child_process');

console.log('🧪 Testing enhance tool debug statements...\n');

// Test the enhance tool directly
const testEnhanceTool = () => {
  return new Promise((resolve) => {
    console.log('📤 Calling promptmcp.enhance tool...');
    
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
      console.log('📥 MCP Server Response:');
      console.log(output);
      
      if (errorOutput) {
        console.log('📥 MCP Server Errors:');
        console.log(errorOutput);
      }
      
      resolve({ output, errorOutput, code });
    });

    // Send the enhance tool request
    setTimeout(() => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'promptmcp.enhance',
          arguments: {
            prompt: 'Create a React button component',
            context: {
              framework: 'react',
              style: 'css'
            }
          }
        }
      };
      
      mcpProcess.stdin.write(JSON.stringify(request) + '\n');
      mcpProcess.stdin.end();
    }, 2000);
  });
};

// Run the test
async function runTest() {
  try {
    const result = await testEnhanceTool();
    
    console.log('\n📊 ENHANCE TOOL DEBUG TEST RESULTS');
    console.log('=====================================');
    
    // Check for debug statements in the output
    const hasEnhanceDebug = result.output.includes('🚀🚀🚀 ENHANCE TOOL CALLED') || 
                           result.output.includes('ENHANCE TOOL CALLED');
    const hasPhaseDebug = result.output.includes('PHASE') || result.output.includes('🔄');
    const hasContext7Debug = result.output.includes('Context7-Client-Debug');
    
    console.log(`✅ Enhance Tool Debug: ${hasEnhanceDebug ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✅ Phase Debug: ${hasPhaseDebug ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`✅ Context7 Debug: ${hasContext7Debug ? 'FOUND' : 'NOT FOUND'}`);
    
    if (hasEnhanceDebug && hasPhaseDebug) {
      console.log('\n🎉 SUCCESS: All debug statements are working!');
    } else {
      console.log('\n⚠️  WARNING: Some debug statements are missing');
    }
    
    console.log('\n🔚 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
