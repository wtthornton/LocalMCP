#!/usr/bin/env node

const http = require('http');

async function testContext7Libraries() {
  console.log('🔍 Testing Context7 Library Detection');
  console.log('=====================================');
  
  const response = await makeRequest({
    prompt: "Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL",
    context: {},
    options: {
      maxTokens: 4000,
      includeMetadata: true
    }
  });

  const enhancedPrompt = response.enhanced_prompt || '';
  
  console.log('📝 Enhanced Prompt Length:', enhancedPrompt.length);
  console.log('📝 First 1000 characters:');
  console.log(enhancedPrompt.substring(0, 1000));
  console.log('\n📝 Last 1000 characters:');
  console.log(enhancedPrompt.substring(enhancedPrompt.length - 1000));
  
  // Test library extraction
  const headerMatches = enhancedPrompt.match(/## \/[\w-]+\/[\w-]+ Documentation:/gi) || [];
  console.log('\n🔍 Found Context7 headers:');
  headerMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match}`);
  });
  
  const libraries = headerMatches.map(match => match.replace('## ', '').replace(' Documentation:', ''));
  console.log('\n📚 Extracted libraries:', libraries);
  
  // Check for specific libraries
  const hasNextJS = enhancedPrompt.includes('## /vercel/next.js Documentation:');
  const hasTypeScript = enhancedPrompt.includes('## /microsoft/typescript Documentation:');
  
  console.log('\n✅ Library Detection:');
  console.log(`Next.js: ${hasNextJS ? '✅' : '❌'}`);
  console.log(`TypeScript: ${hasTypeScript ? '✅' : '❌'}`);
}

async function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/enhance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

testContext7Libraries().catch(console.error);
