#!/usr/bin/env node

/**
 * Simple Context7 Test
 * Tests the Context7 API directly to identify the issue
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';

async function testContext7API() {
  console.log('🔍 Testing Context7 API...\n');
  
  const logger = new Logger('test');
  const config = new ConfigService();
  
  console.log('Configuration:');
  console.log('  Context7 Enabled:', config.getNested('context7', 'enabled'));
  console.log('  Context7 API Key:', config.getNested('context7', 'apiKey') ? 'Set' : 'Not set');
  console.log('  Context7 Base URL:', config.getNested('context7', 'baseUrl'));
  console.log('  Context7 MCP Enabled:', config.getNested('context7', 'mcp').enabled);
  console.log('  Context7 MCP URL:', config.getNested('context7', 'mcp').serverUrl);
  
  console.log('\nTesting Context7 API call...');
  
  try {
    const mcpRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'resolve-library-id',
        arguments: {
          libraryName: 'react'
        }
      }
    };

    console.log('Request:', JSON.stringify(mcpRequest, null, 2));

    const response = await fetch('https://mcp.context7.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
        'Authorization': `Bearer ${config.getNested('context7', 'apiKey')}`,
        'User-Agent': 'PromptMCP-Context7Client/1.0.0'
      },
      body: JSON.stringify(mcpRequest)
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
      throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('Content Type:', contentType);

    let mcpResponse;
    if (contentType.includes('application/json')) {
      mcpResponse = await response.json();
    } else if (contentType.includes('text/event-stream')) {
      const text = await response.text();
      console.log('SSE Response:', text);
      const lines = text.split('\n').filter(line => line.trim());
      const dataLines = lines.filter(line => line.startsWith('data: '));
      
      if (dataLines.length > 0) {
        const lastDataLine = dataLines[dataLines.length - 1];
        if (lastDataLine) {
          mcpResponse = JSON.parse(lastDataLine.substring(6));
        }
      }
    } else {
      const text = await response.text();
      console.log('Unknown Response:', text);
    }

    console.log('MCP Response:', JSON.stringify(mcpResponse, null, 2));

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Error details:', error);
  }
  
  console.log('\n🏁 Context7 API Test Complete');
}

// Run the test
testContext7API().catch(console.error);
