#!/usr/bin/env node

/**
 * Quick PromptMCP Test
 * 
 * Fast validation test for CI/CD and development
 * Tests core functionality without extensive scenarios
 */

console.log('⚡ Quick PromptMCP Test');
console.log('========================\n');

// Test 1: HTTP Health Check
async function testHealth() {
  try {
    const response = await fetch('http://localhost:3000/health');
    const health = await response.json();
    
    if (health.status === 'healthy' && health.service === 'PromptMCP') {
      console.log('✅ Health check: PASS');
      return true;
    } else {
      console.log('❌ Health check: FAIL - Invalid response');
      return false;
    }
  } catch (error) {
    console.log(`❌ Health check: FAIL - ${error.message}`);
    return false;
  }
}

// Test 2: Basic Enhancement
async function testEnhancement() {
  try {
    const response = await fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Create a button',
        context: { framework: 'react' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.enhanced_prompt && result.context_used) {
      console.log('✅ Enhancement: PASS');
      console.log(`   📝 Enhanced: ${result.enhanced_prompt.substring(0, 50)}...`);
      return true;
    } else {
      console.log('❌ Enhancement: FAIL - Invalid response structure');
      return false;
    }
  } catch (error) {
    console.log(`❌ Enhancement: FAIL - ${error.message}`);
    return false;
  }
}

// Test 3: Error Handling
async function testErrorHandling() {
  try {
    const response = await fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });
    
    if (response.status === 400) {
      console.log('✅ Error handling: PASS');
      return true;
    } else {
      console.log('❌ Error handling: FAIL - Expected 400 status');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error handling: FAIL - ${error.message}`);
    return false;
  }
}

// Run all tests
async function runQuickTest() {
  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Enhancement', fn: testEnhancement },
    { name: 'Error Handling', fn: testErrorHandling }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    const result = await test.fn();
    if (result) passed++;
  }
  
  console.log('\n📊 Quick Test Results');
  console.log('=====================');
  console.log(`✅ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All quick tests PASSED!');
    process.exit(0);
  } else {
    console.log('❌ Some tests FAILED');
    process.exit(1);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await fetch('http://localhost:3000/health');
    return true;
  } catch (error) {
    console.log('❌ Server not running. Start with:');
    console.log('   docker run -d --name promptmcp -p 3000:3000 promptmcp');
    console.log('   or');
    console.log('   npm start');
    return false;
  }
}

// Run the test
checkServer().then(serverRunning => {
  if (serverRunning) {
    runQuickTest();
  } else {
    process.exit(1);
  }
});
