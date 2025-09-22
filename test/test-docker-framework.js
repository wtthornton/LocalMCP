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

console.log('Testing framework documentation in Docker container...');
console.log('Sending request:', JSON.stringify(testPrompt, null, 2));

const child = spawn('docker', ['exec', '-i', 'promptmcp-server', 'node', 'dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write(JSON.stringify(testPrompt) + '\n');
child.stdin.end();

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Received data:', data.toString());
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('Error data:', data.toString());
});

child.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);
  console.log('Final output:', output);
  if (errorOutput) {
    console.log('Final error:', errorOutput);
  }
  
  // Parse and analyze the response
  try {
    const response = JSON.parse(output);
    if (response.result && response.result.content) {
      const content = response.result.content[0].text;
      console.log('\n=== ENHANCED PROMPT ===');
      console.log(content);
      
      // Check if framework documentation is present
      if (content.includes('Framework-Specific Best Practices') || content.includes('React Best Practices')) {
        console.log('\n✅ SUCCESS: Framework documentation is present!');
      } else {
        console.log('\n❌ FAILURE: Framework documentation is missing!');
        console.log('Looking for: Framework-Specific Best Practices or React Best Practices');
      }
    } else {
      console.log('\n❌ FAILURE: Invalid response format');
    }
  } catch (e) {
    console.log('\n❌ FAILURE: Could not parse response:', e.message);
  }
});
