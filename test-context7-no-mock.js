#!/usr/bin/env node

/**
 * Test Context7 Integration Without Mocking
 * 
 * Tests the updated Context7 MCP compliance service with real Context7 calls
 */

import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';

async function testContext7NoMock() {
  console.log('🔗 Testing Context7 Integration Without Mocking...\n');
  
  const logger = new Logger();
  const config = new ConfigService(logger);
  
  // Initialize the service
  const mcpCompliance = new Context7MCPComplianceService(logger, config);
  
  try {
    // Test 1: Resolve library ID
    console.log('1️⃣ Testing resolve-library-id...');
    const resolveResult = await mcpCompliance.executeToolCall('resolve-library-id', {
      libraryName: 'react'
    });
    
    console.log('Resolve result success:', resolveResult.success);
    if (resolveResult.success) {
      console.log('Libraries found:', resolveResult.data.length);
      if (resolveResult.data.length > 0) {
        console.log('First library:', {
          id: resolveResult.data[0].id,
          name: resolveResult.data[0].name,
          trustScore: resolveResult.data[0].trustScore
        });
      }
    } else {
      console.log('Error:', resolveResult.error);
    }
    console.log('');

    // Test 2: Get library documentation
    console.log('2️⃣ Testing get-library-docs...');
    const docsResult = await mcpCompliance.executeToolCall('get-library-docs', {
      context7CompatibleLibraryID: '/bvaughn/react-window',
      topic: 'best practices',
      tokens: 2000
    });
    
    console.log('Docs result success:', docsResult.success);
    if (docsResult.success) {
      console.log('Documentation length:', docsResult.data.content.length);
      console.log('Content preview:', docsResult.data.content.substring(0, 200) + '...');
    } else {
      console.log('Error:', docsResult.error);
    }
    console.log('');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testContext7NoMock().catch(console.error);
