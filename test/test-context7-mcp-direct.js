#!/usr/bin/env node

/**
 * Test Context7 MCP Direct
 * 
 * Tests the actual Context7 MCP tools directly to see what's available
 */

import { Context7MCPClientService } from '../dist/services/context7/context7-mcp-client.service.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';

async function testContext7MCPDirect() {
  console.log('🔗 Testing Context7 MCP Direct...\n');
  
  const logger = new Logger('Context7MCPTest');
  const config = new ConfigService();
  
  // Set up environment variables for testing
  process.env.CONTEXT7_API_KEY = 'ctx7sk-b6f0b8b1-c91f-4d1a-9d71-7a67e98c2e49';
  
  const mcpClient = new Context7MCPClientService(logger, config);

  try {
    // Test 1: Resolve React library ID using MCP client
    console.log('1️⃣ Resolving React library ID using MCP client...');
    const reactLibraries = await mcpClient.resolveLibraryId('react');
    console.log('React libraries found:', reactLibraries.length);
    if (reactLibraries.length > 0) {
      console.log('Top 3 React libraries:');
      reactLibraries.slice(0, 3).forEach((lib, index) => {
        console.log(`  ${index + 1}. ${lib.name} (${lib.id})`);
        console.log(`     Trust Score: ${lib.trustScore}, Code Snippets: ${lib.codeSnippets}`);
        console.log(`     Description: ${lib.description.substring(0, 100)}...`);
        console.log('');
      });
    }
    console.log('');

    // Test 2: Resolve TypeScript library ID using MCP client
    console.log('2️⃣ Resolving TypeScript library ID using MCP client...');
    const tsLibraries = await mcpClient.resolveLibraryId('typescript');
    console.log('TypeScript libraries found:', tsLibraries.length);
    if (tsLibraries.length > 0) {
      console.log('Top 3 TypeScript libraries:');
      tsLibraries.slice(0, 3).forEach((lib, index) => {
        console.log(`  ${index + 1}. ${lib.name} (${lib.id})`);
        console.log(`     Trust Score: ${lib.trustScore}, Code Snippets: ${lib.codeSnippets}`);
        console.log(`     Description: ${lib.description.substring(0, 100)}...`);
        console.log('');
      });
    }
    console.log('');

    // Test 3: Get React documentation using MCP client
    if (reactLibraries.length > 0) {
      console.log('3️⃣ Getting React documentation using MCP client...');
      const reactDocs = await mcpClient.getLibraryDocumentation(
        reactLibraries[0].id, 
        'hooks', 
        2000
      );
      console.log('React docs content length:', reactDocs.content.length);
      console.log('React docs preview:');
      console.log(reactDocs.content.substring(0, 500) + '...');
      console.log('');
    }

    // Test 4: Test library validation
    console.log('4️⃣ Testing library validation...');
    if (reactLibraries.length > 0) {
      const isValid = await mcpClient.validateContext7Library(reactLibraries[0].id);
      console.log('React library valid:', isValid);
    }
    console.log('');

    // Test 5: Test high-quality library selection
    console.log('5️⃣ Testing high-quality library selection...');
    const highQualityReact = await mcpClient.selectHighQualityLibrary('react');
    console.log('High-quality React library:', highQualityReact);
    
    const highQualityTS = await mcpClient.selectHighQualityLibrary('typescript');
    console.log('High-quality TypeScript library:', highQualityTS);
    console.log('');

    console.log('✅ Context7 MCP direct test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testContext7MCPDirect().catch(console.error);
