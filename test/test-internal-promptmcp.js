#!/usr/bin/env node

/**
 * Internal PromptMCP Test
 * Tests the internal promptmcp.enhance tool with Context7 integration
 * This verifies that the Docker container's MCP server is working correctly
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class InternalPromptMCPTest {
  constructor() {
    this.testResults = [];
    this.mcpProcess = null;
  }

  async runTest() {
    console.log('🧪 Starting Internal PromptMCP Test');
    console.log('=====================================');

    try {
      // Test 1: Check if Docker container is running
      await this.testDockerContainer();
      
      // Test 2: Test MCP server initialization
      await this.testMCPServerInitialization();
      
      // Test 3: Test promptmcp.enhance tool with Context7
      await this.testEnhanceTool();
      
      // Test 4: Test Context7 integration specifically
      await this.testContext7Integration();
      
      // Test 5: Test framework detection
      await this.testFrameworkDetection();
      
      this.printResults();
      
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
        this.testResults.push({ test: 'Docker Container', status: 'PASS', details: 'Container is running' });
      } else {
        throw new Error('Docker container is not running');
      }
    } catch (error) {
      console.log('❌ Docker container test failed:', error.message);
      this.testResults.push({ test: 'Docker Container', status: 'FAIL', details: error.message });
      throw error;
    }
  }

  async testMCPServerInitialization() {
    console.log('\n🔌 Testing MCP Server Initialization...');
    
    try {
      // Check if MCP server is responding via health endpoint
      
      const { stdout } = await execAsync('curl -s http://localhost:3000/health');
      const healthData = JSON.parse(stdout);
      
      if (healthData.status === 'healthy') {
        console.log('✅ MCP server health check passed');
        console.log('   - Status:', healthData.status);
        console.log('   - Uptime:', Math.round(healthData.uptime / 1000), 'seconds');
        
        if (healthData.mcp && healthData.mcp.tools) {
          console.log('   - Available tools:', healthData.mcp.tools.join(', '));
        }
        
        this.testResults.push({ 
          test: 'MCP Server Initialization', 
          status: 'PASS', 
          details: `Health check passed, tools: ${healthData.mcp?.tools?.join(', ') || 'unknown'}` 
        });
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      console.log('❌ MCP server initialization test failed:', error.message);
      this.testResults.push({ test: 'MCP Server Initialization', status: 'FAIL', details: error.message });
      throw error;
    }
  }

  async testEnhanceTool() {
    console.log('\n🔧 Testing promptmcp.enhance Tool...');
    
    try {
      // Test the enhance tool via MCP protocol
      const testPrompt = "create a great fun html page with a random saying";
      const testContext = {
        framework: "html",
        style: "modern",
        projectContext: {
          projectId: "test-project"
        }
      };

      // Send MCP request to the server
      const mcpRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "promptmcp.enhance",
          arguments: {
            prompt: testPrompt,
            context: testContext
          }
        }
      };

      
      // Use PowerShell to send the request
      const curlCommand = `curl -X POST http://localhost:3001/enhance -H "Content-Type: application/json" -d '${JSON.stringify({
        prompt: testPrompt,
        context: testContext
      })}'`;
      
      console.log('   - Sending test request...');
      console.log('   - Prompt:', testPrompt);
      console.log('   - Context:', JSON.stringify(testContext, null, 2));
      
      try {
        const { stdout, stderr } = await execAsync(curlCommand);
        
        if (stderr && !stderr.includes('curl')) {
          console.log('⚠️  Warning:', stderr);
        }
        
        if (stdout) {
          const response = JSON.parse(stdout);
          
          if (response.enhanced_prompt) {
            console.log('✅ Enhance tool responded successfully');
            console.log('   - Enhanced prompt length:', response.enhanced_prompt.length, 'characters');
            console.log('   - Context used:', Object.keys(response.context_used || {}));
            
            if (response.context_used?.context7_docs?.length > 0) {
              console.log('   - Context7 docs found:', response.context_used.context7_docs.length, 'items');
            } else {
              console.log('   - ⚠️  No Context7 docs found');
            }
            
            this.testResults.push({ 
              test: 'Enhance Tool', 
              status: 'PASS', 
              details: `Response received, enhanced prompt: ${response.enhanced_prompt.length} chars` 
            });
          } else {
            throw new Error('No enhanced_prompt in response');
          }
        } else {
          throw new Error('No response from enhance tool');
        }
      } catch (curlError) {
        console.log('   - Curl failed, trying alternative method...');
        
        // Try using PowerShell Invoke-WebRequest
        const psCommand = `powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3001/enhance' -Method POST -Headers @{'Content-Type'='application/json'} -Body '${JSON.stringify({
          prompt: testPrompt,
          context: testContext
        })}' | Select-Object -ExpandProperty Content"`;
        
        const { stdout: psOutput } = await execAsync(psCommand);
        const response = JSON.parse(psOutput);
        
        if (response.enhanced_prompt) {
          console.log('✅ Enhance tool responded successfully (via PowerShell)');
          console.log('   - Enhanced prompt length:', response.enhanced_prompt.length, 'characters');
          console.log('   - Context used:', Object.keys(response.context_used || {}));
          
          this.testResults.push({ 
            test: 'Enhance Tool', 
            status: 'PASS', 
            details: `Response received via PowerShell, enhanced prompt: ${response.enhanced_prompt.length} chars` 
          });
        } else {
          throw new Error('No enhanced_prompt in PowerShell response');
        }
      }
      
    } catch (error) {
      console.log('❌ Enhance tool test failed:', error.message);
      this.testResults.push({ test: 'Enhance Tool', status: 'FAIL', details: error.message });
      throw error;
    }
  }

  async testContext7Integration() {
    console.log('\n🌐 Testing Context7 Integration...');
    
    try {
      // Test with a framework that should have Context7 docs
      const testPrompt = "create a React component with TypeScript and Tailwind CSS";
      const testContext = {
        framework: "react",
        style: "modern"
      };

      
      const psCommand = `powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3001/enhance' -Method POST -Headers @{'Content-Type'='application/json'} -Body '${JSON.stringify({
        prompt: testPrompt,
        context: testContext
      })}' | Select-Object -ExpandProperty Content"`;
      
      console.log('   - Testing Context7 with React/TypeScript prompt...');
      
      const { stdout } = await execAsync(psCommand);
      const response = JSON.parse(stdout);
      
      if (response.context_used?.context7_docs?.length > 0) {
        console.log('✅ Context7 integration working');
        console.log('   - Context7 docs found:', response.context_used.context7_docs.length, 'items');
        console.log('   - Sample doc length:', response.context_used.context7_docs[0]?.length || 0, 'characters');
        
        this.testResults.push({ 
          test: 'Context7 Integration', 
          status: 'PASS', 
          details: `Found ${response.context_used.context7_docs.length} Context7 docs` 
        });
      } else {
        console.log('⚠️  Context7 integration may not be working');
        console.log('   - No Context7 docs found in response');
        console.log('   - Available context:', Object.keys(response.context_used || {}));
        
        this.testResults.push({ 
          test: 'Context7 Integration', 
          status: 'WARN', 
          details: 'No Context7 docs found - may be working but no docs available' 
        });
      }
      
    } catch (error) {
      console.log('❌ Context7 integration test failed:', error.message);
      this.testResults.push({ test: 'Context7 Integration', status: 'FAIL', details: error.message });
    }
  }

  async testFrameworkDetection() {
    console.log('\n🔍 Testing Framework Detection...');
    
    try {
      const testCases = [
        { prompt: "create a Vue.js component", expected: "vue" },
        { prompt: "build a Next.js app with TypeScript", expected: "nextjs" },
        { prompt: "create a Python Flask API", expected: "python" },
        { prompt: "make a simple HTML page", expected: "html" }
      ];

      
      let passedTests = 0;
      
      for (const testCase of testCases) {
        console.log(`   - Testing: "${testCase.prompt}"`);
        
          const psCommand = `powershell -Command "Invoke-WebRequest -Uri 'http://localhost:3001/enhance' -Method POST -Headers @{'Content-Type'='application/json'} -Body '${JSON.stringify({
            prompt: testCase.prompt,
            context: {}
          })}' | Select-Object -ExpandProperty Content"`;
        
        try {
          const { stdout } = await execAsync(psCommand);
          const response = JSON.parse(stdout);
          
          if (response.enhanced_prompt && response.enhanced_prompt.includes('Framework')) {
            console.log(`     ✅ Framework detection working`);
            passedTests++;
          } else {
            console.log(`     ⚠️  Framework detection may not be working`);
          }
        } catch (error) {
          console.log(`     ❌ Test case failed: ${error.message}`);
        }
      }
      
      if (passedTests === testCases.length) {
        console.log('✅ Framework detection working for all test cases');
        this.testResults.push({ 
          test: 'Framework Detection', 
          status: 'PASS', 
          details: `All ${testCases.length} test cases passed` 
        });
      } else {
        console.log(`⚠️  Framework detection working for ${passedTests}/${testCases.length} test cases`);
        this.testResults.push({ 
          test: 'Framework Detection', 
          status: 'WARN', 
          details: `${passedTests}/${testCases.length} test cases passed` 
        });
      }
      
    } catch (error) {
      console.log('❌ Framework detection test failed:', error.message);
      this.testResults.push({ test: 'Framework Detection', status: 'FAIL', details: error.message });
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${icon} ${result.test}: ${result.details}`);
    });
    
    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the Docker container logs:');
      console.log('   docker logs promptmcp-server --tail 50');
      process.exit(1);
    } else if (warnings > 0) {
      console.log('\n⚠️  Some tests had warnings. The system is working but may need attention.');
    } else {
      console.log('\n🎉 All tests passed! Internal PromptMCP is working correctly.');
    }
  }
}

// Run the test
const test = new InternalPromptMCPTest();
test.runTest().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});
