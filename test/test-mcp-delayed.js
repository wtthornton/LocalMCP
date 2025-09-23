#!/usr/bin/env node

/**
 * Delayed MCP Test - Send request after server starts
 */

import { spawn } from 'child_process';

async function testMCPDelayed() {
  console.log('🚀 Testing MCP Connection with Delayed Request...');
  
  return new Promise((resolve, reject) => {
    const process = spawn('docker', ['exec', 'promptmcp-server', 'node', 'dist/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
      console.log('STDOUT:', data.toString());
      
      // Wait for server to be ready, then send request
      if (data.toString().includes('✅ MCP server started')) {
        console.log('Server is ready, sending request...');
        
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              roots: { listChanged: true },
              sampling: {},
              elicitation: {}
            },
            clientInfo: {
              name: 'TestClient',
              title: 'Test Client',
              version: '1.0.0'
            }
          }
        };

        console.log('Sending request:', JSON.stringify(request));
        process.stdin.write(JSON.stringify(request) + '\n');
        process.stdin.end();
      }
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('STDERR:', data.toString());
    });

    process.on('close', (code) => {
      console.log('Process closed with code:', code);
      console.log('Final output:', output);
      console.log('Final error:', errorOutput);
      resolve();
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      console.log('Timeout reached, killing process');
      process.kill();
      resolve();
    }, 15000);
  });
}

testMCPDelayed().catch(console.error);
