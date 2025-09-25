#!/usr/bin/env node

/**
 * Direct Context7 API Test
 * Tests the Context7 API directly to see what's happening
 */

const testPrompt = "How do I create a button?";

async function testContext7Direct() {
  console.log('🧪 Testing Context7 API Directly...\n');
  
  try {
    // Test 1: Library Resolution
    console.log('📚 Test 1: Library Resolution');
    const resolveRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'resolve-library-id',
        arguments: { libraryName: 'html' }
      }
    };

    const resolveResponse = await fetch('https://mcp.context7.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'CONTEXT7_API_KEY': 'ctx7sk-b6f0b8b1-c91f-4d1a-9d71-7a67e98c2e49',
        'User-Agent': 'PromptMCP-Test/1.0.0'
      },
      body: JSON.stringify(resolveRequest)
    });

    console.log(`   Status: ${resolveResponse.status} ${resolveResponse.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(resolveResponse.headers.entries()));
    
    const resolveText = await resolveResponse.text();
    console.log(`   Response Length: ${resolveText.length}`);
    console.log(`   Response Preview: ${resolveText.substring(0, 500)}...`);
    
    if (resolveResponse.ok) {
      // Parse the response
      const lines = resolveText.split('\n');
      let data = '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          data += line.substring(6);
        }
      }
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`   Parsed Result:`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`   Parse Error: ${e.message}`);
          console.log(`   Raw Data: ${data}`);
        }
      }
    }

    console.log('\n');

    // Test 2: Documentation Retrieval
    console.log('📖 Test 2: Documentation Retrieval');
    const docsRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'get-library-docs',
        arguments: {
          context7CompatibleLibraryID: '/websites/html_dev',
          topic: 'button',
          tokens: 1000
        }
      }
    };

    const docsResponse = await fetch('https://mcp.context7.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'CONTEXT7_API_KEY': 'ctx7sk-b6f0b8b1-c91f-4d1a-9d71-7a67e98c2e49',
        'User-Agent': 'PromptMCP-Test/1.0.0'
      },
      body: JSON.stringify(docsRequest)
    });

    console.log(`   Status: ${docsResponse.status} ${docsResponse.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(docsResponse.headers.entries()));
    
    const docsText = await docsResponse.text();
    console.log(`   Response Length: ${docsText.length}`);
    console.log(`   Response Preview: ${docsText.substring(0, 500)}...`);
    
    if (docsResponse.ok) {
      // Parse the response
      const lines = docsText.split('\n');
      let data = '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          data += line.substring(6);
        }
      }
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`   Parsed Result:`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`   Parse Error: ${e.message}`);
          console.log(`   Raw Data: ${data}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Context7 API Test Failed:', error);
  } finally {
    console.log('\n🏁 Direct Context7 API Test Completed.');
  }
}

testContext7Direct();
