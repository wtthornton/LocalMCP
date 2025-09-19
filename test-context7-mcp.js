#!/usr/bin/env node

/**
 * Context7 MCP Endpoint Test
 * 
 * Tests the Context7 MCP endpoint with correct headers
 */

const API_KEY = 'ctx7sk-45825e15-2f53-459e-8688-8c14b0604d02';

async function testContext7MCP() {
  console.log('🔗 Testing Context7 MCP Endpoint...\n');
  
  // Test 1: Initialize with correct headers
  console.log('1️⃣ Testing MCP initialize with correct headers...');
  try {
    const response = await fetch('https://mcp.context7.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'PromptMCP-Test',
            version: '1.0.0'
          }
        }
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify([...response.headers.entries()], null, 2)}`);
    
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
  
  // Test 2: Try tools/list
  console.log('2️⃣ Testing MCP tools/list...');
  try {
    const response = await fetch('https://mcp.context7.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
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
  
  // Test 3: Try direct tool call
  console.log('3️⃣ Testing direct tool call...');
  try {
    const response = await fetch('https://mcp.context7.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'resolve-library-id',
          arguments: {
            libraryName: 'react'
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
  
  console.log('\n🏁 Context7 MCP test completed!');
}

// Run the test
testContext7MCP().catch(console.error);
