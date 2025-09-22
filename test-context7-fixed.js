#!/usr/bin/env node

/**
 * Test Fixed Context7 Integration
 * Tests the Context7 service with the fixed parsing logic
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPClientService } from './dist/services/context7/context7-mcp-client.service.js';

async function testFixedContext7() {
  console.log('🔍 Testing Fixed Context7 Integration...\n');
  
  const logger = new Logger('test');
  const config = new ConfigService();
  const mcpClient = new Context7MCPClientService(logger, config);
  
  try {
    console.log('1. Testing library resolution...');
    const libraries = await mcpClient.resolveLibraryId('react');
    console.log('   ✅ Libraries found:', libraries.length);
    
    if (libraries.length > 0) {
      console.log('   📚 Top library:', {
        id: libraries[0].id,
        name: libraries[0].name,
        trustScore: libraries[0].trustScore,
        codeSnippets: libraries[0].codeSnippets
      });
    }
    
    console.log('\n2. Testing documentation retrieval...');
    if (libraries.length > 0) {
      const libraryId = libraries[0].id;
      const docs = await mcpClient.getLibraryDocumentation(libraryId, 'components', 1000);
      console.log('   ✅ Documentation retrieved:', docs.content.length, 'characters');
      console.log('   📄 Preview:', docs.content.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   🔍 Error details:', error);
  }
  
  console.log('\n🏁 Fixed Context7 Test Complete');
}

// Run the test
testFixedContext7().catch(console.error);
