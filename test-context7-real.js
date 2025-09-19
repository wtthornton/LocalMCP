#!/usr/bin/env node

/**
 * Test Real Context7 Integration
 * 
 * Tests the actual Context7 MCP integration to see real documentation
 */

import { Context7MCPClientReal } from './dist/services/context7/context7-mcp-client-real.js';

async function testRealContext7() {
  console.log('🔗 Testing Real Context7 Integration...\n');
  
  const client = new Context7MCPClientReal({
    apiKey: 'ctx7sk-b6f0b8b1-c91f-4d1a-9d71-7a67e98c2e49',
    mcpUrl: 'https://mcp.context7.com/mcp',
    timeout: 30000
  });

  try {
    // Connect to Context7
    console.log('1️⃣ Connecting to Context7 MCP server...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // List available tools
    console.log('2️⃣ Listing available tools...');
    const tools = await client.listTools();
    console.log('Available tools:', JSON.stringify(tools, null, 2));
    console.log('');

    // Resolve React library ID
    console.log('3️⃣ Resolving React library ID...');
    const libraryId = await client.resolveLibraryId('react');
    console.log('React library ID:', libraryId);
    console.log('');

    if (libraryId) {
      // Get React documentation
      console.log('4️⃣ Getting React documentation...');
      const docs = await client.getLibraryDocs(libraryId, 'best practices', 'latest');
      console.log('React documentation:');
      console.log('Number of docs:', docs.length);
      if (docs.length > 0) {
        console.log('First doc title:', docs[0].title);
        console.log('First doc content preview:', docs[0].content.substring(0, 200) + '...');
      }
    }

    // Disconnect
    await client.disconnect();
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealContext7().catch(console.error);
