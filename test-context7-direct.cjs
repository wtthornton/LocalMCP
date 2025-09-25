#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load MCP configuration
const mcpConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'mcp-config.json'), 'utf8'));

async function testContext7Direct() {
  console.log('🧪 Testing Context7 tools directly...\n');

  const promptmcpConfig = mcpConfig.mcpServers.promptmcp;
  
  // Test 1: Resolve library ID for "react"
  console.log('📤 Test 1: Resolving library ID for "react"...');
  
  const resolveRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'resolve-library-id',
      arguments: {
        libraryName: 'react'
      }
    }
  };

  const resolveResult = await callMCPTool(promptmcpConfig, resolveRequest);
  
  if (resolveResult.success) {
    console.log('✅ Library ID resolution successful!');
    console.log('📊 Results:');
    if (resolveResult.result && Array.isArray(resolveResult.result)) {
      console.log(`   - Found ${resolveResult.result.length} libraries`);
      resolveResult.result.slice(0, 3).forEach((lib, i) => {
        console.log(`   ${i + 1}. ${lib.name} (ID: ${lib.libraryId})`);
        console.log(`      - Code Snippets: ${lib.codeSnippets}`);
        console.log(`      - Trust Score: ${lib.trustScore}`);
      });
    } else {
      console.log('   - Result format:', typeof resolveResult.result);
      console.log('   - Result content:', JSON.stringify(resolveResult.result).substring(0, 200) + '...');
    }
  } else {
    console.log('❌ Library ID resolution failed:', resolveResult.error);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Get library docs if we got a library ID
  if (resolveResult.success && resolveResult.result && resolveResult.result.length > 0) {
    const firstLibrary = resolveResult.result[0];
    console.log(`📤 Test 2: Getting docs for "${firstLibrary.libraryId}"...`);
    
    const docsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get-library-docs',
        arguments: {
          libraryId: firstLibrary.libraryId,
          topic: 'components',
          tokens: 1000
        }
      }
    };

    const docsResult = await callMCPTool(promptmcpConfig, docsRequest);
    
    if (docsResult.success) {
      console.log('✅ Library docs retrieval successful!');
      console.log('📊 Results:');
      if (docsResult.result && docsResult.result.content) {
        console.log(`   - Content length: ${docsResult.result.content.length} characters`);
        console.log(`   - Content preview: ${docsResult.result.content.substring(0, 200)}...`);
      } else {
        console.log('   - Result format:', typeof docsResult.result);
        console.log('   - Result content:', JSON.stringify(docsResult.result).substring(0, 200) + '...');
      }
    } else {
      console.log('❌ Library docs retrieval failed:', docsResult.error);
    }
  }

  console.log('\n🎉 Context7 direct testing completed!');
}

function callMCPTool(promptmcpConfig, mcpRequest) {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('docker', promptmcpConfig.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...promptmcpConfig.env
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
      if (code !== 0) {
        console.error('❌ MCP process exited with error:', code);
        console.error('Error output:', errorData);
        resolve({ success: false, error: `MCP process exited with code ${code}` });
        return;
      }

      try {
        // Parse MCP response
        const lines = responseData.trim().split('\n');
        let mcpResponse = null;
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.id === mcpRequest.id) {
              mcpResponse = parsed;
              break;
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }

        if (!mcpResponse) {
          console.error('❌ No valid MCP response found');
          console.log('Raw response:', responseData);
          resolve({ success: false, error: 'No valid MCP response found' });
          return;
        }

        if (mcpResponse.error) {
          console.error('❌ MCP error:', mcpResponse.error.message);
          resolve({ success: false, error: `MCP error: ${mcpResponse.error.message}` });
          return;
        }

        // Extract the result from MCP response
        const result = mcpResponse.result;
        if (!result) {
          console.error('❌ Invalid MCP response format');
          console.log('Response:', mcpResponse);
          resolve({ success: false, error: 'Invalid MCP response format' });
          return;
        }

        // The result should be the parsed content
        resolve({ success: true, result: result });
      } catch (error) {
        console.error('❌ Failed to parse MCP response:', error.message);
        console.log('Raw response:', responseData);
        resolve({ success: false, error: error.message });
      }
    });

    mcpProcess.on('error', (error) => {
      console.error('❌ MCP process error:', error);
      resolve({ success: false, error: error.message });
    });

    // Send the MCP request
    mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
    mcpProcess.stdin.end();
  });
}

// Run the test
testContext7Direct()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Context7 direct test failed:', error.message);
    process.exit(1);
  });
