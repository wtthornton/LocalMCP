import { spawn } from 'child_process';

// Test with a simple ping
const pingRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'ping'
};

console.log('Testing server with ping...');

const child = spawn('docker', ['exec', '-i', 'promptmcp-server', 'node', 'dist/mcp/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write(JSON.stringify(pingRequest) + '\n');
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
});
