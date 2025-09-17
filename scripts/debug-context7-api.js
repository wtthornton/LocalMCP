#!/usr/bin/env node

/**
 * Debug Context7 API calls
 * 
 * Makes direct API calls to understand the exact request/response format
 */

// Using Node.js built-in fetch (Node 18+)

const API_KEY = 'ctx7sk-13b1dff8-2c28-4b3e-9b8c-83937f5a4ac3';
const BASE_URL = 'https://context7.com/api/v1';

async function debugContext7API() {
  console.log('🔍 Debugging Context7 API Calls');
  console.log('================================\n');
  
  console.log('📊 Configuration:');
  console.log(`- API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`- Base URL: ${BASE_URL}\n`);
  
  try {
    // Test 1: Try the search endpoint
    console.log('🧪 Test 1: Search Endpoint');
    console.log('URL: GET /search?q=react');
    
    const searchUrl = `${BASE_URL}/search?q=react`;
    console.log('Full URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'LocalMCP/1.0.0'
      }
    });
    
    console.log('Response Status:', searchResponse.status, searchResponse.statusText);
    console.log('Response Headers:', Object.fromEntries(searchResponse.headers.entries()));
    
    const searchData = await searchResponse.text();
    console.log('Response Body (first 500 chars):');
    console.log(searchData.substring(0, 500));
    console.log('...\n');
    
    // Test 2: Try a different search query
    console.log('🧪 Test 2: Different Search Query');
    console.log('URL: GET /search?q=typescript');
    
    const searchUrl2 = `${BASE_URL}/search?q=typescript`;
    const searchResponse2 = await fetch(searchUrl2, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'LocalMCP/1.0.0'
      }
    });
    
    console.log('Response Status:', searchResponse2.status, searchResponse2.statusText);
    const searchData2 = await searchResponse2.text();
    console.log('Response Body (first 500 chars):');
    console.log(searchData2.substring(0, 500));
    console.log('...\n');
    
    // Test 3: Try a specific library endpoint
    console.log('🧪 Test 3: Library Endpoint');
    console.log('URL: GET /v1/react');
    
    const libUrl = `${BASE_URL}/v1/react`;
    const libResponse = await fetch(libUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'LocalMCP/1.0.0'
      }
    });
    
    console.log('Response Status:', libResponse.status, libResponse.statusText);
    const libData = await libResponse.text();
    console.log('Response Body (first 500 chars):');
    console.log(libData.substring(0, 500));
    console.log('...\n');
    
    // Test 4: Try with different headers
    console.log('🧪 Test 4: Different Headers');
    console.log('URL: GET /search?q=nodejs');
    
    const searchUrl3 = `${BASE_URL}/search?q=nodejs`;
    const searchResponse3 = await fetch(searchUrl3, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'LocalMCP/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response Status:', searchResponse3.status, searchResponse3.statusText);
    const searchData3 = await searchResponse3.text();
    console.log('Response Body (first 500 chars):');
    console.log(searchData3.substring(0, 500));
    console.log('...\n');
    
    console.log('🎯 API Debug Complete');
    console.log('====================');
    console.log('Check the responses above to understand the API format');
    
  } catch (error) {
    console.error('❌ API debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugContext7API();
