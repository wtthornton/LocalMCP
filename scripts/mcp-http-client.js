#!/usr/bin/env node

/**
 * MCP HTTP Client - Connects to PromptMCP HTTP server
 * This script acts as a bridge between MCP stdio protocol and our HTTP server
 */

const http = require('http');
const readline = require('readline');

const MCP_SERVER_URL = 'http://localhost:3001/mcp';

// Create readline interface for stdio communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Send HTTP request to MCP server
 */
async function sendMCPRequest(mcpRequest) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(mcpRequest);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/mcp',
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
        } catch (err) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`HTTP request failed: ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Handle MCP request from stdin
 */
async function handleMCPRequest(line) {
  try {
    const mcpRequest = JSON.parse(line);
    
    // Send to HTTP server
    const response = await sendMCPRequest(mcpRequest);
    
    // Send response back to stdout
    console.log(JSON.stringify(response));
    
  } catch (err) {
    // Send error response
    const errorResponse = {
      jsonrpc: '2.0',
      id: 'unknown',
      error: {
        code: -32603,
        message: 'Internal error',
        data: err.message
      }
    };
    
    console.log(JSON.stringify(errorResponse));
  }
}

// Handle incoming MCP requests
rl.on('line', handleMCPRequest);

// Handle process termination
process.on('SIGINT', () => {
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  rl.close();
  process.exit(0);
});

console.error('MCP HTTP Client started - connecting to PromptMCP server at http://localhost:3001/mcp');
