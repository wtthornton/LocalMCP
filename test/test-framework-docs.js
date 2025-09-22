import { spawn } from 'child_process';

// Test framework documentation with a React prompt
const testPrompt = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'promptmcp.enhance',
    arguments: {
      prompt: 'Create a React component with TypeScript',
      context: {
        framework: 'react'
      }
    }
  }
};

console.log('Testing framework documentation with React prompt...');
console.log('Sending request:', JSON.stringify(testPrompt, null, 2));

const child = spawn('docker', ['exec', '-i', 'promptmcp-server', 'node', 'dist/mcp/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write(JSON.stringify(testPrompt) + '\n');
child.stdin.end();

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

child.on('close', (code) => {
  console.log('\n=== STDOUT ===');
  console.log(output);
  
  if (errorOutput) {
    console.log('\n=== STDERR ===');
    console.log(errorOutput);
  }
  
  console.log(`\nProcess exited with code ${code}`);
  
  // Parse and analyze the response
  try {
    const response = JSON.parse(output);
    if (response.result && response.result.content) {
      const content = response.result.content[0].text;
      console.log('\n=== ENHANCED PROMPT ===');
      console.log(content);
      
      // Check if framework documentation is present
      if (content.includes('Framework Best Practices') || content.includes('React Best Practices')) {
        console.log('\n✅ SUCCESS: Framework documentation is present!');
      } else {
        console.log('\n❌ FAILURE: Framework documentation is missing!');
      }
    } else {
      console.log('\n❌ FAILURE: Invalid response format');
    }
  } catch (e) {
    console.log('\n❌ FAILURE: Could not parse response:', e.message);
  }
});
