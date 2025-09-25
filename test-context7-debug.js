#!/usr/bin/env node

// Test script to debug Context7 integration
const { spawn } = require('child_process');

console.log('Testing Context7 integration...');

// Test with a simple MCP request
const mcpRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'promptmcp.enhance',
    arguments: {
      prompt: 'How do I create an HTML button element',
      context: {},
      options: {}
    }
  }
};

const mcpProcess = spawn('docker', [
  'exec', '-i', 'promptmcp-server', 'node', 'dist/mcp/server.js'
], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    CONTEXT7_DEBUG: 'true'
  }
});

let responseData = '';
let errorData = '';

mcpProcess.stdout.on('data', (data) => {
  responseData += data.toString();
});

mcpProcess.stderr.on('data', (data) => {
  errorData += data.toString();
});

mcpProcess.on('close', (code) => {
  console.log('MCP Process exited with code:', code);
  console.log('Response data:', responseData);
  if (errorData) {
    console.log('Error data:', errorData);
  }
});

// Send the MCP request
mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
mcpProcess.stdin.end();
