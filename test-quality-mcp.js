#!/usr/bin/env node

/**
 * Quality Test for PromptMCP MCP Server
 * 
 * Tests the deployed Docker MCP server with various prompts
 * to verify Context7 integration and prompt enhancement quality
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
    // First, kill any existing MCP server process and start fresh
    const mcpProcess = spawn('docker', [
      'exec', '-i', 'promptmcp-server',
      'sh', '-c', 'pkill -f "node dist/mcp/server.js" 2>/dev/null || true; sleep 1; NODE_ENV=production CONTEXT7_API_KEY=${CONTEXT7_API_KEY:-test-key} CONTEXT7_ENABLED=true CONTEXT7_USE_HTTP_ONLY=true CONTEXT7_CHECK_COMPATIBILITY=false OPENAI_API_KEY=${OPENAI_API_KEY:-test-key} OPENAI_PROJECT_ID=${OPENAI_PROJECT_ID:-test-project} OPENAI_MODEL=gpt-4 OPENAI_MAX_TOKENS=4000 OPENAI_TEMPERATURE=0.3 LOG_LEVEL=info WORKSPACE_PATH=/app QDRANT_URL=http://qdrant:6333 QDRANT_API_KEY= QDRANT_COLLECTION_NAME=promptmcp_vectors node dist/mcp/server.js'
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
  console.log('🚀 Starting PromptMCP Quality Tests');
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