#!/usr/bin/env node

/**
 * Debug Context7 Library IDs
 * Tests library resolution and documentation retrieval to identify ID format issues
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';

async function debugLibraryIds() {
  console.log('🔍 Debugging Context7 Library IDs...\n');
  
  const logger = new Logger('debug');
  const config = new ConfigService();
  const mcpCompliance = new Context7MCPComplianceService(logger, config);

  try {
    // Test library resolution
    console.log('1. Testing library resolution for "react"...');
    const libraries = await mcpCompliance.resolveLibraryId('react');
    console.log(`   Found ${libraries.length} libraries:`);
    
    libraries.slice(0, 3).forEach((lib, index) => {
      console.log(`   ${index + 1}. ID: "${lib.id}"`);
      console.log(`      Name: "${lib.name}"`);
      console.log(`      Description: "${lib.description?.substring(0, 100)}..."`);
      console.log(`      Trust Score: ${lib.trustScore}`);
      console.log('');
    });

    // Test documentation retrieval with first library
    if (libraries.length > 0) {
      const firstLib = libraries[0];
      console.log(`2. Testing documentation retrieval for "${firstLib.id}"...`);
      
      try {
        const docs = await mcpCompliance.getLibraryDocumentation(firstLib.id, 'components', 1000);
        console.log(`   ✅ Success! Retrieved ${docs.content.length} characters of documentation`);
        console.log(`   Content preview: "${docs.content.substring(0, 200)}..."`);
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        
        // Try with different library IDs
        console.log('\n3. Trying alternative library ID formats...');
        const alternativeIds = [
          firstLib.name,
          firstLib.id.replace('/facebook/', '/'),
          firstLib.id.replace('/', ''),
          'react',
          'facebook/react'
        ];
        
        for (const altId of alternativeIds) {
          try {
            console.log(`   Trying ID: "${altId}"`);
            const docs = await mcpCompliance.getLibraryDocumentation(altId, 'components', 1000);
            console.log(`   ✅ Success with "${altId}"! Retrieved ${docs.content.length} characters`);
            break;
          } catch (err) {
            console.log(`   ❌ Failed with "${altId}": ${err.message}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLibraryIds().catch(console.error);
