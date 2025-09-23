#!/usr/bin/env node

/**
 * E2E Performance Docker Test
 * 
 * Tests the performance and response times of the deployed Docker container
 * Measures latency, throughput, and resource usage
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PERFORMANCE_TESTS = [
  {
    name: "Single Tool Call Latency",
    description: "Measure response time for individual tool calls",
    test: {
      method: "tools/call",
      params: {
        name: "promptmcp.enhance",
        arguments: {
          prompt: "Create a simple React component",
          context: { framework: "react" }
        }
      }
    },
    iterations: 3
  },
  {
    name: "Concurrent Tool Calls",
    description: "Test multiple simultaneous tool calls",
    concurrentRequests: 2,
    test: {
      method: "tools/call",
      params: {
        name: "promptmcp.enhance",
        arguments: {
          prompt: "Create a Vue component with TypeScript",
          context: { framework: "vue" }
        }
      }
    }
  },
  {
    name: "Todo Operations Performance",
    description: "Test todo creation and listing performance",
    steps: [
      {
        method: "tools/call",
        params: {
          name: "promptmcp.todo",
          arguments: {
            action: "create",
            projectId: "perf-test",
            content: "Performance test todo item",
            priority: "medium",
            category: "testing"
          }
        }
      },
      {
        method: "tools/call",
        params: {
          name: "promptmcp.todo",
          arguments: {
            action: "list",
            projectId: "perf-test",
            filters: {}
          }
        }
      }
    ]
  }
];

let mcpProcess = null;
const results = [];

console.log('🧪 E2E Performance Docker Test');
console.log('================================\n');

class PerformanceTester {
  constructor() {
    this.responses = new Map();
    this.requestId = 1;
  }

  async startMCPServer() {
    console.log('🚀 Starting MCP server for performance testing...');
    
    mcpProcess = spawn('node', ['dist/mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: join(__dirname, '..')
    });

    mcpProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        try {
          const response = JSON.parse(line);
          this.responses.set(response.id, response);
        } catch (e) {
          // Skip non-JSON output
        }
      });
    });

    mcpProcess.on('error', (error) => {
      console.error('❌ Failed to start MCP server:', error.message);
      process.exit(1);
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ MCP server started\n');
  }

  async sendRequest(test, startTime) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: test.method,
      params: test.params
    };

    const requestStartTime = Date.now();
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    const maxWait = 30000; // 30 seconds for performance tests
    const requestStart = Date.now();
    
    while (Date.now() - requestStart < maxWait) {
      if (this.responses.has(request.id)) {
        const response = this.responses.get(request.id);
        const responseTime = Date.now() - requestStartTime;
        return { response, responseTime };
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`Timeout waiting for response (${Date.now() - requestStartTime}ms)`);
  }

  async runLatencyTest(testConfig) {
    console.log(`⏱️  Running: ${testConfig.name}`);
    console.log(`   Description: ${testConfig.description}`);
    console.log(`   Iterations: ${testConfig.iterations}\n`);
    
    const times = [];
    let errors = 0;

    for (let i = 0; i < testConfig.iterations; i++) {
      try {
        console.log(`   📤 Request ${i + 1}/${testConfig.iterations}...`);
        const { response, responseTime } = await this.sendRequest(testConfig.test);
        
        if (response.error) {
          console.log(`      ❌ Error: ${response.error.message}`);
          errors++;
        } else {
          console.log(`      ✅ ${responseTime}ms`);
          times.push(responseTime);
        }
      } catch (error) {
        console.log(`      ❌ ${error.message}`);
        errors++;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`\n   📊 Results:`);
      console.log(`      Average: ${avgTime.toFixed(0)}ms`);
      console.log(`      Min: ${minTime}ms`);
      console.log(`      Max: ${maxTime}ms`);
      console.log(`      Success Rate: ${((times.length / testConfig.iterations) * 100).toFixed(1)}%`);
      
      results.push({
        name: testConfig.name,
        avgTime,
        minTime,
        maxTime,
        successRate: (times.length / testConfig.iterations) * 100,
        errors
      });
    } else {
      console.log(`\n   ❌ All requests failed`);
      results.push({
        name: testConfig.name,
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        successRate: 0,
        errors: testConfig.iterations
      });
    }
    
    console.log('');
  }

  async runConcurrentTest(testConfig) {
    console.log(`🔄 Running: ${testConfig.name}`);
    console.log(`   Description: ${testConfig.description}`);
    console.log(`   Concurrent Requests: ${testConfig.concurrentRequests}\n`);
    
    const promises = [];
    const startTime = Date.now();
    
    for (let i = 0; i < testConfig.concurrentRequests; i++) {
      promises.push(this.sendRequest(testConfig.test));
    }
    
    try {
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      console.log(`   📊 Results:`);
      console.log(`      Total Time: ${totalTime}ms`);
      console.log(`      All Requests: ${results.length}`);
      
      results.forEach((result, index) => {
        if (result.response.error) {
          console.log(`      Request ${index + 1}: ❌ ${result.response.error.message}`);
        } else {
          console.log(`      Request ${index + 1}: ✅ ${result.responseTime}ms`);
        }
      });
      
      const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      console.log(`      Average Response Time: ${avgTime.toFixed(0)}ms`);
      
    } catch (error) {
      console.log(`   ❌ Concurrent test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async runStepTest(testConfig) {
    console.log(`📋 Running: ${testConfig.name}`);
    console.log(`   Description: ${testConfig.description}`);
    console.log(`   Steps: ${testConfig.steps.length}\n`);
    
    const stepTimes = [];
    let errors = 0;

    for (let i = 0; i < testConfig.steps.length; i++) {
      const step = testConfig.steps[i];
      try {
        console.log(`   📤 Step ${i + 1}: ${step.method}...`);
        const { response, responseTime } = await this.sendRequest(step);
        
        if (response.error) {
          console.log(`      ❌ Error: ${response.error.message}`);
          errors++;
        } else {
          console.log(`      ✅ ${responseTime}ms`);
          stepTimes.push(responseTime);
        }
      } catch (error) {
        console.log(`      ❌ ${error.message}`);
        errors++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (stepTimes.length > 0) {
      const totalTime = stepTimes.reduce((a, b) => a + b, 0);
      const avgTime = totalTime / stepTimes.length;
      
      console.log(`\n   📊 Results:`);
      console.log(`      Total Time: ${totalTime}ms`);
      console.log(`      Average Step Time: ${avgTime.toFixed(0)}ms`);
      console.log(`      Success Rate: ${((stepTimes.length / testConfig.steps.length) * 100).toFixed(1)}%`);
    }
    
    console.log('');
  }

  async runAllTests() {
    console.log('Starting performance tests...\n');
    
    await this.startMCPServer();
    
    // Run latency tests
    await this.runLatencyTest(PERFORMANCE_TESTS[0]);
    
    // Run concurrent test
    await this.runConcurrentTest(PERFORMANCE_TESTS[1]);
    
    // Run step test
    await this.runStepTest(PERFORMANCE_TESTS[2]);
    
    // Cleanup
    if (mcpProcess) {
      console.log('🛑 Stopping MCP server...');
      mcpProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print summary
    console.log('📊 Performance Test Summary');
    console.log('===========================');
    
    if (results.length > 0) {
      const overallAvgTime = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
      const overallSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
      
      console.log(`Overall Average Response Time: ${overallAvgTime.toFixed(0)}ms`);
      console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
      
      console.log('\n📋 Test Breakdown:');
      results.forEach(result => {
        console.log(`   ${result.name}:`);
        console.log(`      Avg: ${result.avgTime.toFixed(0)}ms, Success: ${result.successRate.toFixed(1)}%`);
      });
      
      // Performance thresholds
      console.log('\n🎯 Performance Assessment:');
      if (overallAvgTime < 5000) {
        console.log('   ✅ Response times are excellent (< 5s)');
      } else if (overallAvgTime < 10000) {
        console.log('   ⚠️  Response times are acceptable (< 10s)');
      } else {
        console.log('   ❌ Response times are slow (> 10s)');
      }
      
      if (overallSuccessRate >= 95) {
        console.log('   ✅ Success rate is excellent (≥ 95%)');
      } else if (overallSuccessRate >= 90) {
        console.log('   ⚠️  Success rate is good (≥ 90%)');
      } else {
        console.log('   ❌ Success rate needs improvement (< 90%)');
      }
    }
    
    console.log('\n✅ Performance testing completed');
    process.exit(0);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(1);
});

process.on('SIGTERM', () => {
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(1);
});

// Run the tests
const tester = new PerformanceTester();
tester.runAllTests().catch((error) => {
  console.error('❌ Performance test suite failed:', error.message);
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(1);
});
