#!/usr/bin/env node

/**
 * Test Simple Context7 Integration
 * 
 * Tests the current Context7 integration to see what information we're getting
 */

import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { Context7RealIntegrationService } from '../dist/services/context7/context7-real-integration.service.js';

async function testContext7Integration() {
  console.log('🔗 Testing Context7 Integration...\n');
  
  const logger = new Logger('Context7Test');
  const config = new ConfigService();
  
  // Set up environment variables for testing
  process.env.CONTEXT7_API_KEY = 'ctx7sk-b6f0b8b1-c91f-4d1a-9d71-7a67e98c2e49';
  
  const context7Service = new Context7RealIntegrationService(logger, config);

  try {
    // Test 1: Resolve React library ID
    console.log('1️⃣ Resolving React library ID...');
    const reactLibraries = await context7Service.resolveLibraryId('react');
    console.log('React libraries found:', reactLibraries.length);
    if (reactLibraries.length > 0) {
      console.log('First library:', JSON.stringify(reactLibraries[0], null, 2));
    }
    console.log('');

    // Test 2: Resolve TypeScript library ID
    console.log('2️⃣ Resolving TypeScript library ID...');
    const tsLibraries = await context7Service.resolveLibraryId('typescript');
    console.log('TypeScript libraries found:', tsLibraries.length);
    if (tsLibraries.length > 0) {
      console.log('First library:', JSON.stringify(tsLibraries[0], null, 2));
    }
    console.log('');

    // Test 3: Get React documentation
    if (reactLibraries.length > 0) {
      console.log('3️⃣ Getting React documentation...');
      const reactDocs = await context7Service.getLibraryDocumentation(
        reactLibraries[0].id, 
        'hooks', 
        1000
      );
      console.log('React docs content length:', reactDocs.content.length);
      console.log('React docs preview:', reactDocs.content.substring(0, 300) + '...');
      console.log('React docs metadata:', JSON.stringify(reactDocs.metadata, null, 2));
      console.log('');
    }

    // Test 4: Get TypeScript documentation
    if (tsLibraries.length > 0) {
      console.log('4️⃣ Getting TypeScript documentation...');
      const tsDocs = await context7Service.getLibraryDocumentation(
        tsLibraries[0].id, 
        'types', 
        1000
      );
      console.log('TypeScript docs content length:', tsDocs.content.length);
      console.log('TypeScript docs preview:', tsDocs.content.substring(0, 300) + '...');
      console.log('TypeScript docs metadata:', JSON.stringify(tsDocs.metadata, null, 2));
      console.log('');
    }

    // Test 5: Test library validation
    console.log('5️⃣ Testing library validation...');
    if (reactLibraries.length > 0) {
      const isValid = await context7Service.validateContext7Library(reactLibraries[0].id);
      console.log('React library valid:', isValid);
    }
    console.log('');

    console.log('✅ Context7 integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testContext7Integration().catch(console.error);
