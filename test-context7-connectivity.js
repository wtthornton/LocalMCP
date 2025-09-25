#!/usr/bin/env node

/**
 * Context7 API Connectivity Test
 * Tests the Context7 API with the fixes applied
 */

const testPrompt = "Optimize this React component for better performance and reduce bundle size";

async function testContext7Connectivity() {
  console.log('🧪 Testing Context7 API Connectivity...\n');
  
  try {
    // Test the enhance endpoint
    const response = await fetch('http://localhost:3001/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: testPrompt,
        options: {
          useCache: false,
          maxTokens: 4000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Context7 API Test Results:');
    console.log(`📝 Original Prompt: ${testPrompt}`);
    console.log(`📝 Enhanced Prompt Length: ${result.enhanced_prompt?.length || 0} characters`);
    console.log(`🔍 Context7 Docs Count: ${result.context_used?.context7_docs?.length || 0}`);
    console.log(`🏗️ Frameworks Detected: ${result.frameworks_detected?.join(', ') || 'None'}`);
    console.log(`✅ Success: ${result.success}`);
    
    if (result.context_used?.context7_docs?.length > 0) {
      console.log('\n🎉 SUCCESS: Context7 docs are now populated!');
      console.log(`📚 Context7 Docs Preview: ${result.context_used.context7_docs[0].substring(0, 200)}...`);
    } else {
      console.log('\n⚠️  WARNING: Context7 docs are still empty');
      console.log('🔍 This suggests the API calls are still failing');
    }
    
    if (result.frameworks_detected?.length > 0) {
      console.log('\n✅ Framework detection is working correctly');
    } else {
      console.log('\n⚠️  Framework detection may need attention');
    }
    
    console.log('\n📊 Full Response Summary:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Context7 API Test Failed:');
    console.error(error.message);
    console.error('\n🔍 Check if the Docker container is running:');
    console.error('docker ps | grep promptmcp-server');
  }
}

// Run the test
testContext7Connectivity();
