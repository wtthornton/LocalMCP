#!/usr/bin/env node

/**
 * Test Context7 Direct Integration
 * 
 * Tests the Context7MCPComplianceService directly
 */

import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';

async function testContext7Direct() {
  console.log('🔗 Testing Context7 Direct Integration...\n');
  
  // Create mock logger and config
  const mockLogger = {
    debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || ''),
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    warn: (msg, data) => console.log(`[WARN] ${msg}`, data || ''),
    error: (msg, data) => console.log(`[ERROR] ${msg}`, data || '')
  };
  
  const mockConfig = {
    getNested: (path1, path2) => {
      if (path1 === 'context7' && path2 === 'apiKey') {
        return 'ctx7sk-b6f0b8b1-c91f-4d1a-9d71-7a67e98c2e49';
      }
      return undefined;
    }
  };
  
  const mcpCompliance = new Context7MCPComplianceService(mockLogger, mockConfig);
  
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
    if (resolveResult.success && resolveResult.data.length > 0) {
      console.log('2️⃣ Testing get-library-docs...');
      const docsResult = await mcpCompliance.executeToolCall('get-library-docs', {
        context7CompatibleLibraryID: resolveResult.data[0].id,
        topic: 'hooks',
        tokens: 2000
      });
      
      console.log('Docs result success:', docsResult.success);
      if (docsResult.success) {
        console.log('Documentation length:', docsResult.data.content.length);
        console.log('Content preview:', docsResult.data.content.substring(0, 200) + '...');
      } else {
        console.log('Error:', docsResult.error);
      }
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testContext7Direct().catch(console.error);
