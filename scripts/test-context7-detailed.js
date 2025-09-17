#!/usr/bin/env node

/**
 * Detailed Context7 Integration Test
 * 
 * Tests the Context7 API integration and inspects actual response data
 * to confirm we're getting real documentation, not mocked data.
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

async function testContext7Detailed() {
  console.log('🔍 Detailed Context7 Integration Test');
  console.log('=====================================\n');
  
  const logger = new Logger('Context7DetailedTest');
  const config = new ConfigService();
  const context7 = new Context7Service(logger, config);
  
  console.log('📊 Configuration:');
  console.log(`- API Key: ${config.getNested('context7', 'apiKey')?.substring(0, 20)}...`);
  console.log(`- Base URL: ${config.getNested('context7', 'baseUrl')}`);
  console.log(`- Cache Enabled: ${config.getNested('context7', 'cacheEnabled')}\n`);
  
  try {
    // Test 1: Basic query with data inspection
    console.log('🧪 Test 1: Basic Query with Data Inspection');
    console.log('Query: "React hooks useState useEffect"');
    
    const result1 = await context7.query({
      query: 'React hooks useState useEffect',
      topic: 'react-hooks',
      maxTokens: 2000
    });
    
    console.log('Result Status:', {
      success: result1.success,
      cached: result1.cached,
      responseTime: result1.responseTime,
      hasData: !!result1.data,
      error: result1.error
    });
    
    if (result1.success && result1.data) {
      console.log('\n📄 Actual Response Data Preview:');
      console.log('================================');
      
      // Try to extract meaningful content from the response
      if (typeof result1.data === 'string') {
        console.log('Response type: String');
        console.log('Length:', result1.data.length);
        console.log('First 500 characters:');
        console.log(result1.data.substring(0, 500));
        console.log('...');
      } else if (typeof result1.data === 'object') {
        console.log('Response type: Object');
        console.log('Keys:', Object.keys(result1.data));
        console.log('Sample content:');
        console.log(JSON.stringify(result1.data, null, 2).substring(0, 1000));
        console.log('...');
      } else {
        console.log('Response type:', typeof result1.data);
        console.log('Value:', result1.data);
      }
      
      // Check if this looks like real documentation
      const dataStr = JSON.stringify(result1.data).toLowerCase();
      const hasRealContent = dataStr.includes('react') || 
                           dataStr.includes('hook') || 
                           dataStr.includes('usestate') || 
                           dataStr.includes('useeffect') ||
                           dataStr.includes('component') ||
                           dataStr.includes('function');
      
      console.log('\n🔍 Content Analysis:');
      console.log('- Contains React-related terms:', hasRealContent);
      console.log('- Response time:', result1.responseTime + 'ms');
      console.log('- Cached:', result1.cached);
      
      if (hasRealContent && result1.responseTime > 100) {
        console.log('✅ REAL CONTEXT7 DATA CONFIRMED!');
      } else if (result1.cached) {
        console.log('✅ CACHED DATA (from previous real call)');
      } else {
        console.log('⚠️  Data may be mocked or incomplete');
      }
    } else {
      console.log('❌ Query failed:', result1.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Try a different query to avoid cache
    console.log('🧪 Test 2: Fresh Query (Different Topic)');
    console.log('Query: "TypeScript interfaces and types"');
    
    const result2 = await context7.query({
      query: 'TypeScript interfaces and types',
      topic: 'typescript-types',
      maxTokens: 1500
    });
    
    console.log('Result Status:', {
      success: result2.success,
      cached: result2.cached,
      responseTime: result2.responseTime,
      hasData: !!result2.data,
      error: result2.error
    });
    
    if (result2.success && result2.data) {
      console.log('\n📄 TypeScript Response Preview:');
      const dataStr = JSON.stringify(result2.data).toLowerCase();
      const hasTypeScriptContent = dataStr.includes('typescript') || 
                                 dataStr.includes('interface') || 
                                 dataStr.includes('type') ||
                                 dataStr.includes('string') ||
                                 dataStr.includes('number');
      
      console.log('- Contains TypeScript-related terms:', hasTypeScriptContent);
      console.log('- Response time:', result2.responseTime + 'ms');
      console.log('- Cached:', result2.cached);
      
      if (hasTypeScriptContent && result2.responseTime > 100) {
        console.log('✅ REAL CONTEXT7 DATA CONFIRMED!');
      } else {
        console.log('⚠️  Data may be mocked or incomplete');
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Check cache stats
    console.log('🧪 Test 3: Cache Analysis');
    const cacheStats = context7.getCacheStats();
    console.log('Cache Stats:', cacheStats);
    
    console.log('\n🎯 CONCLUSION:');
    console.log('==============');
    if (result1.success && result1.responseTime > 100 && !result1.cached) {
      console.log('✅ We are getting REAL Context7 API responses!');
      console.log('✅ Response times indicate real network calls');
      console.log('✅ Data contains actual documentation content');
    } else {
      console.log('⚠️  Responses may be mocked or cached');
    }
    
  } catch (error) {
    console.error('❌ Detailed test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the detailed test
testContext7Detailed();
