#!/usr/bin/env node

/**
 * Simple Context7 Test
 * 
 * Tests the Context7 MCP compliance service directly
 */

import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';

async function testSimpleContext7() {
  console.log('🔗 Testing Simple Context7 Integration...\n');
  
  // Create a mock logger and config for testing
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

    console.log('✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSimpleContext7().catch(console.error);
