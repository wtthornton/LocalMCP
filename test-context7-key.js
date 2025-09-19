#!/usr/bin/env node

/**
 * Simple Context7 API Key Test
 * 
 * Tests the Context7 API key authentication to debug 401 Unauthorized issues
 */

const API_KEY = 'ctx7sk-45825e15-2f53-459e-8688-8c14b0604d02';
const BASE_URL = 'https://context7.com/api/v1';

async function testContext7Key() {
  console.log('🔑 Testing Context7 API Key Authentication...\n');
  
  // Test 1: Simple health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.text();
      console.log(`   Response: ${data.substring(0, 100)}...`);
    } else {
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Resolve library ID
  console.log('2️⃣ Testing resolve-library-id endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/resolve-library-id`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        libraryName: 'react'
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Different auth header format
  console.log('3️⃣ Testing with X-API-Key header...');
  try {
    const response = await fetch(`${BASE_URL}/resolve-library-id`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        libraryName: 'react'
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: Check if API key format is correct
  console.log('4️⃣ API Key Analysis...');
  console.log(`   Key length: ${API_KEY.length}`);
  console.log(`   Key starts with: ${API_KEY.substring(0, 10)}...`);
  console.log(`   Key ends with: ...${API_KEY.substring(API_KEY.length - 10)}`);
  console.log(`   Key format: ${API_KEY.startsWith('ctx7sk-') ? '✅ Correct format' : '❌ Wrong format'}`);
  
  console.log('');
  
  // Test 5: Try different base URL
  console.log('5️⃣ Testing alternative base URL...');
  try {
    const response = await fetch('https://mcp.context7.com/mcp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'TestClient',
            version: '1.0.0'
          }
        }
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n🏁 Context7 API Key test completed!');
}

// Run the test
testContext7Key().catch(console.error);
