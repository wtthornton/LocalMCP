#!/usr/bin/env node

const http = require('http');

async function testFixedRegex() {
  console.log('🔍 Testing Fixed Regex Pattern');
  console.log('===============================');
  
  const response = await makeRequest({
    prompt: "Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL",
    context: {},
    options: {
      maxTokens: 4000,
      includeMetadata: true
    }
  });

  const enhancedPrompt = response.enhanced_prompt || '';
  
  // Test the fixed regex pattern
  const fixedPattern = /## \/[\w.-]+\/[\w.-]+ Documentation:/gi;
  const matches = enhancedPrompt.match(fixedPattern) || [];
  
  console.log('🔍 Fixed regex results:');
  console.log('Found headers:', matches);
  
  const libraries = matches.map(match => match.replace('## ', '').replace(' Documentation:', ''));
  console.log('Extracted libraries:', libraries);
  
  // Check accuracy
  const expectedLibraries = ['/vercel/next.js', '/microsoft/typescript'];
  const foundExpected = expectedLibraries.filter(lib => libraries.includes(lib));
  const accuracy = foundExpected.length / expectedLibraries.length;
  
  console.log('\n✅ Accuracy Test:');
  console.log('Expected:', expectedLibraries);
  console.log('Found:', foundExpected);
  console.log('Accuracy:', `${Math.round(accuracy * 100)}%`);
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

testFixedRegex().catch(console.error);
