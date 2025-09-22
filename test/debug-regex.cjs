#!/usr/bin/env node

const http = require('http');

async function testRegex() {
  console.log('🔍 Testing Regex Pattern');
  console.log('========================');
  
  const response = await makeRequest({
    prompt: "Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL",
    context: {},
    options: {
      maxTokens: 4000,
      includeMetadata: true
    }
  });

  const enhancedPrompt = response.enhanced_prompt || '';
  
  // Test different regex patterns
  console.log('🔍 Testing different regex patterns:');
  
  const pattern1 = /## \/[\w-]+\/[\w-]+ Documentation:/gi;
  const matches1 = enhancedPrompt.match(pattern1) || [];
  console.log('Pattern 1 (current):', matches1);
  
  const pattern2 = /## \/vercel\/next\.js Documentation:/gi;
  const matches2 = enhancedPrompt.match(pattern2) || [];
  console.log('Pattern 2 (Next.js specific):', matches2);
  
  const pattern3 = /## \/microsoft\/typescript Documentation:/gi;
  const matches3 = enhancedPrompt.match(pattern3) || [];
  console.log('Pattern 3 (TypeScript specific):', matches3);
  
  // Search for the exact text
  const nextjsIndex = enhancedPrompt.indexOf('## /vercel/next.js Documentation:');
  const typescriptIndex = enhancedPrompt.indexOf('## /microsoft/typescript Documentation:');
  
  console.log('\n🔍 String search results:');
  console.log('Next.js index:', nextjsIndex);
  console.log('TypeScript index:', typescriptIndex);
  
  if (nextjsIndex !== -1) {
    console.log('Next.js context:', enhancedPrompt.substring(nextjsIndex - 50, nextjsIndex + 100));
  }
  
  if (typescriptIndex !== -1) {
    console.log('TypeScript context:', enhancedPrompt.substring(typescriptIndex - 50, typescriptIndex + 100));
  }
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

testRegex().catch(console.error);
