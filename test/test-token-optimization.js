#!/usr/bin/env node

/**
 * Test Token Optimization
 * 
 * Tests the new token optimization features to ensure they're working correctly
 */

import { spawn } from 'child_process';
import fs from 'fs';

const TEST_PROMPTS = [
  {
    name: 'Simple HTML Button',
    prompt: 'Create a simple HTML button with blue background',
    expectedComplexity: 'simple',
    expectedMaxTokens: 400
  },
  {
    name: 'Medium React Component',
    prompt: 'Create a React component that displays a list of users with search functionality and pagination',
    expectedComplexity: 'medium',
    expectedMaxTokens: 1200
  },
  {
    name: 'Complex Next.js App',
    prompt: 'Build a full-stack Next.js application with authentication, database integration, real-time chat, and file upload functionality',
    expectedComplexity: 'complex',
    expectedMaxTokens: 3200
  }
];

async function testTokenOptimization() {
  console.log('🧪 Testing Token Optimization Features...\n');
  
  for (const test of TEST_PROMPTS) {
    console.log(`📝 Testing: ${test.name}`);
    console.log(`   Prompt: "${test.prompt}"`);
    console.log(`   Expected Complexity: ${test.expectedComplexity}`);
    console.log(`   Expected Max Tokens: ${test.expectedMaxTokens}`);
    
    try {
      const result = await callPromptMCP(test.prompt);
      
      if (result.success) {
        const enhancedPrompt = result.data.enhanced_prompt;
        const tokenCount = Math.ceil(enhancedPrompt.length / 4); // Rough token estimation
        
        console.log(`   ✅ Success!`);
        console.log(`   📊 Token Count: ${tokenCount}`);
        console.log(`   📊 Token Efficiency: ${((tokenCount / test.expectedMaxTokens) * 100).toFixed(1)}%`);
        console.log(`   📊 Content Length: ${enhancedPrompt.length} characters`);
        
        // Check if token usage is within expected range
        if (tokenCount <= test.expectedMaxTokens) {
          console.log(`   ✅ Token usage within expected range`);
        } else {
          console.log(`   ⚠️  Token usage exceeds expected range`);
        }
        
        // Check for smart truncation indicators
        if (enhancedPrompt.includes('...') && test.expectedComplexity !== 'simple') {
          console.log(`   ✅ Smart truncation applied`);
        }
        
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🎯 Token Optimization Test Complete!');
}

async function callPromptMCP(prompt) {
  return new Promise((resolve) => {
    const child = spawn('docker', [
      'exec', '-i', 'promptmcp-server',
      'node', 'dist/server.js'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the JSON response
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          
          if (response.result && response.result.enhanced_prompt) {
            resolve({
              success: true,
              data: response.result
            });
          } else {
            resolve({
              success: false,
              error: 'No enhanced prompt in response'
            });
          }
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse response: ${parseError.message}`
          });
        }
      } else {
        resolve({
          success: false,
          error: `Process exited with code ${code}: ${error}`
        });
      }
    });
    
    // Send the MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'promptmcp.enhance',
        arguments: {
          prompt: prompt,
          context: {
            file: 'test-file.ts',
            framework: 'react'
          }
        }
      }
    };
    
    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();
  });
}

// Run the test
testTokenOptimization().catch(console.error);
