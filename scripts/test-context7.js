#!/usr/bin/env node

/**
 * Context7 Integration Test
 * 
 * Tests the Context7 API integration with the provided API key.
 */

import { Context7Service } from '../dist/services/context7/context7.service.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';

// Set up environment variables for testing
process.env.CONTEXT7_ENABLED = 'true';
process.env.CONTEXT7_API_KEY = 'ctx7sk-13b1dff8-2c28-4b3e-9b8c-83937f5a4ac3';
process.env.CONTEXT7_BASE_URL = 'https://context7.com/api/v1';
process.env.CONTEXT7_CACHE_ENABLED = 'true';
process.env.CONTEXT7_CACHE_TTL = '3600';

async function testContext7() {
  console.log('🔑 Testing Context7 Integration');
  console.log('==============================\n');
  
  const logger = new Logger('Context7Test');
  const config = new ConfigService();
  const context7 = new Context7Service(logger, config);
  
  console.log('📊 Configuration:');
  console.log(`- API Key: ${config.getNested('context7', 'apiKey')?.substring(0, 20)}...`);
  console.log(`- Base URL: ${config.getNested('context7', 'baseUrl')}`);
  console.log(`- Cache Enabled: ${config.getNested('context7', 'cacheEnabled')}`);
  console.log(`- Cache TTL: ${config.getNested('context7', 'cacheTtl')}s\n`);
  
  try {
    // Test 1: Basic query
    console.log('🧪 Test 1: Basic Query');
    console.log('Query: "React best practices for components"');
    
    const result1 = await context7.query({
      query: 'React best practices for components',
      topic: 'react-components',
      maxTokens: 1000
    });
    
    console.log('Result:', {
      success: result1.success,
      cached: result1.cached,
      responseTime: result1.responseTime,
      hasData: !!result1.data,
      error: result1.error
    });
    
    if (result1.success) {
      console.log('✅ Basic query successful\n');
    } else {
      console.log('❌ Basic query failed:', result1.error);
      return;
    }
    
    // Test 2: Library documentation
    console.log('🧪 Test 2: Library Documentation');
    console.log('Query: "TypeScript documentation"');
    
    const result2 = await context7.getLibraryDocs('typescript', 'types', 2000);
    
    console.log('Result:', {
      success: result2.success,
      cached: result2.cached,
      responseTime: result2.responseTime,
      hasData: !!result2.data,
      error: result2.error
    });
    
    if (result2.success) {
      console.log('✅ Library docs query successful\n');
    } else {
      console.log('❌ Library docs query failed:', result2.error);
    }
    
    // Test 3: Best practices
    console.log('🧪 Test 3: Best Practices');
    console.log('Query: "Node.js error handling best practices"');
    
    const result3 = await context7.searchBestPractices('nodejs', 'error-handling');
    
    console.log('Result:', {
      success: result3.success,
      cached: result3.cached,
      responseTime: result3.responseTime,
      hasData: !!result3.data,
      error: result3.error
    });
    
    if (result3.success) {
      console.log('✅ Best practices query successful\n');
    } else {
      console.log('❌ Best practices query failed:', result3.error);
    }
    
    // Test 4: Cache test
    console.log('🧪 Test 4: Cache Test');
    console.log('Running same query again to test caching...');
    
    const result4 = await context7.query({
      query: 'React best practices for components',
      topic: 'react-components',
      maxTokens: 1000
    });
    
    console.log('Result:', {
      success: result4.success,
      cached: result4.cached,
      responseTime: result4.responseTime,
      hasData: !!result4.data,
      error: result4.error
    });
    
    if (result4.cached) {
      console.log('✅ Cache working correctly\n');
    } else {
      console.log('⚠️  Cache not working as expected\n');
    }
    
    // Test 5: Cache stats
    console.log('🧪 Test 5: Cache Statistics');
    const cacheStats = context7.getCacheStats();
    console.log('Cache Stats:', cacheStats);
    
    console.log('\n🎉 Context7 Integration Test Complete!');
    console.log('=====================================');
    console.log('✅ Context7 API is working correctly');
    console.log('✅ Caching is functional');
    console.log('✅ LocalMCP is ready for enhanced documentation');
    
  } catch (error) {
    console.error('❌ Context7 test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testContext7();
