#!/usr/bin/env node

/**
 * Direct MCP Test
 * Tests the internal promptmcp.enhance tool directly via MCP protocol
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

class DirectMCPTest {
  constructor() {
    this.mcpProcess = null;
  }

  async runTest() {
    console.log('🧪 Starting Direct MCP Test');
    console.log('============================');

    try {
      // Test 1: Check if Docker container is running
      await this.testDockerContainer();
      
      // Test 2: Test MCP server via stdio
      await this.testMCPServerDirect();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  async testDockerContainer() {
    console.log('\n📦 Testing Docker Container...');
    
    try {
      const { stdout } = await execAsync('docker ps --filter name=promptmcp-server --format "{{.Status}}"');
      
      if (stdout.includes('Up')) {
        console.log('✅ Docker container is running');
      } else {
        throw new Error('Docker container is not running');
      }
    } catch (error) {
      console.log('❌ Docker container test failed:', error.message);
      throw error;
    }
  }

  async testMCPServerDirect() {
    console.log('\n🔌 Testing MCP Server Direct...');
    
    try {
      // Create MCP request
      const mcpRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "promptmcp.enhance",
          arguments: {
            prompt: "create a great fun html page with a random saying",
            context: {
              framework: "html",
              style: "modern",
              projectContext: {
                projectId: "test-project"
              }
            }
          }
        }
      };

      console.log('   - Sending MCP request via stdio...');
      console.log('   - Request:', JSON.stringify(mcpRequest, null, 2));

      // Send request to MCP server via docker exec
      const command = `echo '${JSON.stringify(mcpRequest)}' | docker exec -i promptmcp-server node dist/mcp/server.js`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.log('   - Stderr:', stderr);
      }
      
      if (stdout) {
        console.log('   - Response received:', stdout.length, 'characters');
        
        try {
          const response = JSON.parse(stdout);
          
          if (response.result) {
            console.log('✅ MCP server responded successfully');
            console.log('   - Result type:', typeof response.result);
            console.log('   - Result length:', response.result.length, 'characters');
            
            // Try to parse the result as JSON
            try {
              const resultData = JSON.parse(response.result);
              if (resultData.enhanced_prompt) {
                console.log('   - Enhanced prompt length:', resultData.enhanced_prompt.length, 'characters');
                console.log('   - Context used:', Object.keys(resultData.context_used || {}));
                
                if (resultData.context_used?.context7_docs?.length > 0) {
                  console.log('   - ✅ Context7 docs found:', resultData.context_used.context7_docs.length, 'items');
                } else {
                  console.log('   - ⚠️  No Context7 docs found');
                }
              }
            } catch (parseError) {
              console.log('   - Result is not JSON, showing first 200 chars:');
              console.log('   -', response.result.substring(0, 200) + '...');
            }
          } else if (response.error) {
            console.log('❌ MCP server returned error:', response.error);
          } else {
            console.log('⚠️  Unexpected response format:', response);
          }
        } catch (parseError) {
          console.log('❌ Failed to parse MCP response as JSON:', parseError.message);
          console.log('   - Raw response:', stdout);
        }
      } else {
        console.log('❌ No response from MCP server');
      }
      
    } catch (error) {
      console.log('❌ MCP server test failed:', error.message);
      throw error;
    }
  }
}

// Run the test
const test = new DirectMCPTest();
test.runTest().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});
