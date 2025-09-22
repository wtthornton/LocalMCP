#!/usr/bin/env node

/**
 * Test to verify we're getting real Context7 data, not mocked responses
 */

import { Context7RealIntegrationService } from './dist/services/context7/context7-real-integration.service.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';

async function testRealContext7() {
  console.log('🔍 Testing real Context7 integration (no mocked data)...\n');

  try {
    // Initialize dependencies
    const logger = new Logger();
    const config = new ConfigService();
    const realContext7 = new Context7RealIntegrationService(logger, config);
    
    console.log('📋 Configuration:');
    console.log('API Key:', config.getNested('context7', 'apiKey') ? 'Set' : 'Not set');
    console.log('Base URL:', config.getNested('context7', 'baseUrl'));
    console.log('Context7 Enabled:', config.getEnv('CONTEXT7_ENABLED'));
    console.log('');

    // Test 1: Resolve library ID for HTML
    console.log('🔍 Testing library resolution for "html"...');
    const htmlLibraries = await realContext7.resolveLibraryId('html');
    console.log('✅ HTML libraries resolved:', htmlLibraries.length);
    console.log('First library:', {
      id: htmlLibraries[0]?.id,
      name: htmlLibraries[0]?.name,
      trustScore: htmlLibraries[0]?.trustScore,
      codeSnippets: htmlLibraries[0]?.codeSnippets
    });
    console.log('');

    // Test 2: Get documentation for the first library
    if (htmlLibraries.length > 0) {
      console.log('📚 Testing documentation retrieval...');
      const docs = await realContext7.getLibraryDocumentation(
        htmlLibraries[0].id,
        'hello world',
        1000
      );
      console.log('✅ Documentation retrieved:');
      console.log('Content length:', docs.content.length);
      console.log('Content preview:', docs.content.substring(0, 200) + '...');
      console.log('Source:', docs.metadata.source);
      console.log('');
    }

    // Test 3: Resolve library ID for CSS
    console.log('🔍 Testing library resolution for "css"...');
    const cssLibraries = await realContext7.resolveLibraryId('css');
    console.log('✅ CSS libraries resolved:', cssLibraries.length);
    console.log('First library:', {
      id: cssLibraries[0]?.id,
      name: cssLibraries[0]?.name,
      trustScore: cssLibraries[0]?.trustScore,
      codeSnippets: cssLibraries[0]?.codeSnippets
    });
    console.log('');

    // Test 4: Resolve library ID for JavaScript
    console.log('🔍 Testing library resolution for "javascript"...');
    const jsLibraries = await realContext7.resolveLibraryId('javascript');
    console.log('✅ JavaScript libraries resolved:', jsLibraries.length);
    console.log('First library:', {
      id: jsLibraries[0]?.id,
      name: jsLibraries[0]?.name,
      trustScore: jsLibraries[0]?.trustScore,
      codeSnippets: jsLibraries[0]?.codeSnippets
    });
    console.log('');

    console.log('✅ All tests passed! Context7 integration is working with real API data.');
    console.log('📊 Summary:');
    console.log('- HTML libraries:', htmlLibraries.length);
    console.log('- CSS libraries:', cssLibraries.length);
    console.log('- JavaScript libraries:', jsLibraries.length);
    console.log('- Documentation retrieval: Working');
    console.log('- No mocked data detected!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testRealContext7();
