#!/usr/bin/env node

/**
 * MCP Client Quality Test
 * 
 * Simple client that connects to the running MCP server
 * and tests various prompts to verify quality
 */

import { spawn } from 'child_process';

// Test prompts with varying complexity levels
const TEST_PROMPTS = [
  {
    id: 'simple',
    name: 'Simple Question',
    prompt: 'How do I create a button?',
    context: { framework: 'html', style: 'css' }
  },
  {
    id: 'medium',
    name: 'Medium Complexity Task',
    prompt: 'Create a React component that displays a list of users with search functionality',
    context: { framework: 'react', style: 'tailwind' }
  },
  {
    id: 'complex',
    name: 'Complex Development Task',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    context: { framework: 'nextjs', style: 'tailwind' }
  },
  {
    id: 'debug',
    name: 'Debug/Error Fix Task',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    context: { framework: 'typescript', file: 'src/api/handler.ts' }
  },
  {
    id: 'optimization',
    name: 'Performance Optimization Task',
    prompt: 'Optimize this React component for better performance and reduce bundle size',
    context: { framework: 'react', style: 'performance' }
  }
];

async function testPrompt(promptData) {
  console.log(`\n🧪 Testing: ${promptData.name}`);
  console.log(`📝 Original: ${promptData.prompt}`);
  console.log(`🔧 Context: ${JSON.stringify(promptData.context)}`);

  const mcpRequest = {
    jsonrpc: '2.0',
    id: Math.random(),
    method: 'tools/call',
    params: {
      name: 'promptmcp.enhance',
      arguments: {
        prompt: promptData.prompt,
        context: promptData.context,
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

  return new Promise((resolve) => {
    // Connect to the running MCP server as a client
    const mcpProcess = spawn('docker', [
      'exec', '-i', 'promptmcp-server',
      'node', 'dist/mcp/server.js'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let responseData = '';
    let errorData = '';
    let startTime = Date.now();

    mcpProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    mcpProcess.on('close', (code) => {
      const responseTime = Date.now() - startTime;
      
      if (errorData) {
        console.log('❌ Errors:', errorData);
      }
      
      let result = null;
      let success = false;
      
      if (responseData) {
        try {
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              try {
                const response = JSON.parse(line);
                if (response.result && response.result.content) {
                  result = response.result.content[0].text;
                  success = true;
                  break;
                }
              } catch (e) {
                // Skip non-JSON lines
              }
            }
          }
        } catch (e) {
          console.log('📄 Raw response:', responseData);
        }
      }
      
      if (success && result) {
        try {
          const parsedResult = JSON.parse(result);
          console.log(`✅ Success: ${parsedResult.success}`);
          console.log(`📊 Enhanced prompt length: ${parsedResult.enhanced_prompt?.length || 0} chars`);
          console.log(`🔍 Context used: ${JSON.stringify(parsedResult.context_used, null, 2)}`);
          if (parsedResult.breakdown) {
            console.log(`📋 Tasks generated: ${parsedResult.breakdown.tasks?.length || 0}`);
          }
          console.log(`⏱️  Response time: ${responseTime}ms`);
        } catch (e) {
          console.log(`✅ Success: true (raw response)`);
          console.log(`📊 Response length: ${result.length} chars`);
          console.log(`⏱️  Response time: ${responseTime}ms`);
        }
      } else {
        console.log(`❌ Failed: No valid response received`);
        console.log(`⏱️  Response time: ${responseTime}ms`);
      }
      
      resolve({
        success,
        responseTime,
        result,
        error: errorData || null
      });
    });

    // Send the MCP request
    mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
    mcpProcess.stdin.end();
  });
}

async function runQualityTests() {
  console.log('🚀 Starting PromptMCP Quality Tests (MCP Client)');
  console.log('============================================================');

  const results = [];
  
  for (const promptData of TEST_PROMPTS) {
    const result = await testPrompt(promptData);
    results.push({
      ...promptData,
      ...result
    });
  }

  // Generate summary
  console.log('\n📊 QUALITY TEST SUMMARY');
  console.log('============================================================');
  
  const successfulTests = results.filter(r => r.success);
  const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successfulTests.length}`);
  console.log(`Success Rate: ${Math.round((successfulTests.length / results.length) * 100)}%`);
  console.log(`Average Response Time: ${Math.round(averageResponseTime)}ms`);
  
  console.log('\n📋 DETAILED RESULTS');
  console.log('----------------------------------------');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   ${status} Success: ${result.success}`);
    console.log(`   ⏱️  Response Time: ${result.responseTime}ms`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error.substring(0, 100)}...`);
    }
  });

  console.log('\n🏁 Quality tests completed!');
}

// Run the tests
runQualityTests().catch(console.error);
