#!/usr/bin/env node

/**
 * Direct Response Test
 * Tests the enhance endpoint directly to see the actual response structure
 */

const testPrompt = "How do I create a button?";

async function testDirectResponse() {
  console.log('🧪 Testing Direct Response from Enhance Endpoint...\n');
  
  try {
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
    
    console.log('✅ Direct Response Test Results:');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Enhanced Prompt Length: ${result.enhanced_prompt?.length || 0} characters`);
    console.log(`   - Context7 Docs Count: ${result.context_used?.context7_docs?.length || 0}`);
    console.log(`   - Code Snippets Count: ${result.context_used?.code_snippets?.length || 0}`);
    console.log(`   - Repository Facts Count: ${result.context_used?.repo_facts?.length || 0}`);
    console.log(`   - Frameworks Detected: ${result.frameworks_detected?.join(', ') || 'None'}`);
    
    if (result.context_used?.context7_docs?.length > 0) {
      console.log('\n📚 Context7 Documentation Preview:');
      console.log(result.context_used.context7_docs[0].substring(0, 500) + '...');
    }
    
    if (result.context_used?.code_snippets?.length > 0) {
      console.log('\n💻 Code Snippets Preview:');
      result.context_used.code_snippets.forEach((snippet, index) => {
        console.log(`   Snippet ${index + 1}: ${snippet.file || 'Unknown file'}`);
        console.log(`   Content: ${snippet.content?.substring(0, 100) || 'No content'}...`);
      });
    }
    
    // Save full response to file
    const fs = await import('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `direct-response-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(result, null, 2));
    console.log(`\n💾 Full response saved to: ${filename}`);

  } catch (error) {
    console.error('❌ Direct Response Test Failed:', error);
  } finally {
    console.log('\n🏁 Test Completed.');
  }
}

testDirectResponse();
