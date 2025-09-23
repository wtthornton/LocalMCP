#!/usr/bin/env node

/**
 * Debug MCP Connection - Step by Step
 */

import { spawn } from 'child_process';

async function debugMCPConnection() {
  console.log('🚀 Debugging MCP Connection...');
  
  return new Promise((resolve, reject) => {
    const process = spawn('docker', ['exec', '-i', 'promptmcp-server', 'node', 'dist/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log('STDOUT:', text);
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log('STDERR:', text);
    });

    process.on('close', (code) => {
      console.log('Process closed with code:', code);
      console.log('Final output length:', output.length);
      console.log('Final error length:', errorOutput.length);
      resolve();
    });

    // Wait for server to be ready
    setTimeout(() => {
      console.log('Sending initialize request...');
      
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

      console.log('Request:', JSON.stringify(request));
      process.stdin.write(JSON.stringify(request) + '\n');
      
      // Wait a bit for response
      setTimeout(() => {
        console.log('Sending tools/list request...');
        
        const toolsRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        };

        console.log('Tools request:', JSON.stringify(toolsRequest));
        process.stdin.write(JSON.stringify(toolsRequest) + '\n');
        
        // Wait for response and then close
        setTimeout(() => {
          console.log('Closing stdin...');
          process.stdin.end();
        }, 2000);
      }, 2000);
    }, 3000);

    // Timeout after 15 seconds
    setTimeout(() => {
      console.log('Timeout reached, killing process');
      process.kill();
      resolve();
    }, 15000);
  });
}

debugMCPConnection().catch(console.error);
