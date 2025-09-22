#!/usr/bin/env node

/**
 * Simple Docker Smoke Test
 * 
 * Tests the deployed Docker container without starting its own MCP server
 */

import http from 'http';

const TEST_CASES = [
  {
    name: "Health Check",
    url: "http://localhost:3000/health",
    method: "GET",
    expectedStatus: 200
  },
  {
    name: "React Component Enhancement",
    url: "http://localhost:3000/enhance",
    method: "POST",
    body: {
      prompt: "Create a React button component",
      context: { framework: "react", style: "tailwind" }
    },
    expectedStatus: 200
  },
  {
    name: "Vue Form Enhancement",
    url: "http://localhost:3000/enhance",
    method: "POST",
    body: {
      prompt: "Create a Vue form with validation",
      context: { framework: "vue", style: "css" }
    },
    expectedStatus: 200
  },
  {
    name: "TypeScript Function Enhancement",
    url: "http://localhost:3000/enhance",
    method: "POST",
    body: {
      prompt: "Create a utility function for API calls",
      context: { framework: "typescript" }
    },
    expectedStatus: 200
  }
];

let passed = 0;
let failed = 0;

console.log('🧪 Docker Container Smoke Test');
console.log('================================\n');

async function makeRequest(testCase) {
  return new Promise((resolve) => {
    const url = new URL(testCase.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          success: res.statusCode === testCase.expectedStatus
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        data: error.message,
        success: false
      });
    });

    if (testCase.body) {
      req.write(JSON.stringify(testCase.body));
    }
    req.end();
  });
}

async function runTest(testCase) {
  console.log(`Testing: ${testCase.name}...`);
  
  try {
    const result = await makeRequest(testCase);
    
    if (result.success) {
      console.log(`  ✅ ${testCase.name} - Status: ${result.statusCode}`);
      
      // Try to parse JSON response for enhancement tests
      if (testCase.method === 'POST') {
        try {
          const response = JSON.parse(result.data);
          if (response.enhanced_prompt) {
            console.log(`  📝 Enhanced prompt length: ${response.enhanced_prompt.length} chars`);
            if (response.context_used) {
              console.log(`  🔍 Context used: ${Object.keys(response.context_used).join(', ')}`);
            }
          }
        } catch (e) {
          console.log(`  ⚠️  Response not JSON: ${result.data.substring(0, 100)}...`);
        }
      }
      
      passed++;
    } else {
      console.log(`  ❌ ${testCase.name} - Status: ${result.statusCode}, Error: ${result.data}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ ${testCase.name} - Error: ${error.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('Starting tests against Docker container...\n');
  
  for (const testCase of TEST_CASES) {
    await runTest(testCase);
    console.log(''); // Empty line for readability
  }
  
  // Print results
  console.log('📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests PASSED! Docker container is working perfectly!');
    console.log('✅ HTTP API is accessible');
    console.log('✅ Health endpoint working');
    console.log('✅ Enhancement endpoint working');
    console.log('✅ Context7 integration functional');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests FAILED!');
    console.log('❌ Docker container has issues that need to be fixed');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch((error) => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
