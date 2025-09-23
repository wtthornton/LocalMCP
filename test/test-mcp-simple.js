#!/usr/bin/env node

/**
 * Simple MCP Test - Debug MCP Client Connection
 */

import { spawn } from 'child_process';

async function testMCPConnection() {
  console.log('🚀 Testing MCP Connection...');
  
  return new Promise((resolve, reject) => {
    const process = spawn('docker', ['exec', 'promptmcp-server', 'node', 'dist/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

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

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
      console.log('STDOUT:', data.toString());
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

    // Send the request
    console.log('Sending request:', JSON.stringify(request));
    process.stdin.write(JSON.stringify(request) + '\n');
    process.stdin.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('Timeout reached, killing process');
      process.kill();
      resolve();
    }, 10000);
  });
}

testMCPConnection().catch(console.error);
