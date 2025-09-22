import { spawn } from 'child_process';

// Test project documentation with a complex prompt
const testPrompt = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'promptmcp.enhance',
    arguments: {
      prompt: 'Create a comprehensive web application with authentication and database integration',
      context: {
        framework: 'react',
        style: 'typescript'
      }
    }
  }
};

console.log('Testing project documentation in Docker container...');
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
      
      // Check if project documentation is present
      if (content.includes('Project Documentation') || content.includes('README.md')) {
        console.log('\n✅ SUCCESS: Project documentation is present!');
      } else {
        console.log('\n❌ FAILURE: Project documentation is missing!');
        console.log('Looking for: Project Documentation or README.md references');
      }
    } else {
      console.log('\n❌ FAILURE: Invalid response format');
    }
  } catch (e) {
    console.log('\n❌ FAILURE: Could not parse response:', e.message);
  }
});
