// Quick test of the simple Context7 client
const { SimpleContext7Client } = require('./dist/simple-context7-client.js');

async function testSimpleClient() {
  console.log('🧪 Testing Simple Context7 Client...');
  
  const client = new SimpleContext7Client({ 
    apiKey: process.env.CONTEXT7_API_KEY || 'test-key' 
  });
  
  try {
    // Test library resolution
    console.log('📚 Testing library resolution...');
    const libraries = await client.resolveLibraryId('react');
    console.log('✅ Resolved libraries:', libraries.length);
    
    if (libraries.length > 0) {
      console.log('📖 First library:', {
        id: libraries[0].libraryId,
        name: libraries[0].name,
        snippets: libraries[0].codeSnippets
      });
      
      // Test documentation retrieval
      console.log('📄 Testing documentation retrieval...');
      const docs = await client.getLibraryDocs(libraries[0].libraryId, 'hooks', 1000);
      console.log('✅ Got documentation:', docs.content.length > 0 ? 'Yes' : 'No');
    }
    
    console.log('🎉 Simple client test completed!');
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testSimpleClient();
