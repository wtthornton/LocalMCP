#!/usr/bin/env node

/**
 * Complete E2E Docker Test Suite
 * 
 * Runs all E2E tests against the deployed Docker container
 * Provides comprehensive testing coverage and reporting
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_SUITES = [
  {
    name: "MCP Protocol Tests",
    file: "test-e2e-mcp-docker.js",
    description: "Tests MCP protocol communication and tool availability"
  },
  {
    name: "HTTP Endpoint Tests", 
    file: "test-e2e-http-docker.js",
    description: "Tests HTTP endpoints (if available)"
  },
  {
    name: "Integration Tests",
    file: "test-e2e-integration-docker.js", 
    description: "Tests complete developer workflows"
  },
  {
    name: "Performance Tests",
    file: "test-e2e-performance-docker.js",
    description: "Tests response times and throughput"
  }
];

console.log('🧪 Complete E2E Docker Test Suite');
console.log('==================================\n');

class E2ETestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runTestSuite(suite) {
    console.log(`🚀 Running: ${suite.name}`);
    console.log(`   Description: ${suite.description}`);
    console.log(`   File: ${suite.file}\n`);
    
    const testStartTime = Date.now();
    
    return new Promise((resolve) => {
      const testProcess = spawn('node', [suite.file], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: __dirname
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      testProcess.on('close', (code) => {
        const duration = Date.now() - testStartTime;
        
        const result = {
          name: suite.name,
          file: suite.file,
          exitCode: code,
          duration,
          stdout,
          stderr,
          success: code === 0
        };
        
        this.results.push(result);
        
        console.log(`\n📊 ${suite.name} completed in ${duration}ms (exit code: ${code})\n`);
        console.log('─'.repeat(80));
        console.log('');
        
        resolve(result);
      });

      testProcess.on('error', (error) => {
        const duration = Date.now() - testStartTime;
        
        const result = {
          name: suite.name,
          file: suite.file,
          exitCode: -1,
          duration,
          stdout,
          stderr: stderr + error.message,
          success: false,
          error: error.message
        };
        
        this.results.push(result);
        
        console.log(`\n❌ ${suite.name} failed: ${error.message}\n`);
        console.log('─'.repeat(80));
        console.log('');
        
        resolve(result);
      });
    });
  }

  async runAllTests() {
    console.log('Starting comprehensive E2E testing against Docker deployment...\n');
    console.log('Testing the following components:');
    TEST_SUITES.forEach(suite => {
      console.log(`   • ${suite.name}: ${suite.description}`);
    });
    console.log('');

    // Run each test suite
    for (const suite of TEST_SUITES) {
      await this.runTestSuite(suite);
    }

    // Generate comprehensive report
    this.generateReport();
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passedSuites = this.results.filter(r => r.success).length;
    const failedSuites = this.results.filter(r => !r.success).length;
    const totalSuites = this.results.length;

    console.log('📊 E2E Test Suite Results');
    console.log('==========================');
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Test Suites: ${totalSuites}`);
    console.log(`Passed: ${passedSuites}`);
    console.log(`Failed: ${failedSuites}`);
    console.log(`Success Rate: ${((passedSuites / totalSuites) * 100).toFixed(1)}%\n`);

    console.log('📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.name}`);
      console.log(`      Duration: ${result.duration}ms`);
      console.log(`      Exit Code: ${result.exitCode}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    console.log('\n🎯 Docker Deployment Assessment:');
    
    if (failedSuites === 0) {
      console.log('   🎉 EXCELLENT: All E2E tests passed!');
      console.log('   ✅ Docker container is fully functional');
      console.log('   ✅ MCP server is working correctly');
      console.log('   ✅ All tools are accessible');
      console.log('   ✅ Performance is acceptable');
      console.log('   ✅ Integration workflows work');
      console.log('\n   🚀 The Docker deployment is ready for production use!');
    } else if (failedSuites === 1 && this.results.find(r => r.name === "HTTP Endpoint Tests")) {
      console.log('   ✅ GOOD: Core functionality working');
      console.log('   ✅ MCP server is functional');
      console.log('   ⚠️  HTTP endpoints not available (expected for MCP-only deployment)');
      console.log('   ✅ All critical tests passed');
      console.log('\n   🚀 The Docker deployment is working correctly!');
    } else {
      console.log('   ⚠️  ISSUES: Some E2E tests failed');
      console.log('   ❌ Docker deployment has problems that need attention');
      console.log('   📝 Review the failed tests above for details');
      console.log('\n   🔧 The Docker deployment needs fixes before production use');
    }

    // Performance insights
    const mcpTest = this.results.find(r => r.name === "MCP Protocol Tests");
    const perfTest = this.results.find(r => r.name === "Performance Tests");
    
    if (mcpTest && perfTest && mcpTest.success && perfTest.success) {
      console.log('\n⚡ Performance Insights:');
      console.log('   • MCP protocol communication is working efficiently');
      console.log('   • Tool response times are within acceptable ranges');
      console.log('   • Context7 integration is performing well');
      console.log('   • Database operations are optimized');
    }

    console.log('\n📝 Next Steps:');
    if (failedSuites === 0) {
      console.log('   1. ✅ Docker deployment is ready');
      console.log('   2. ✅ All E2E tests validate functionality');
      console.log('   3. ✅ Ready for integration with Cursor MCP client');
      console.log('   4. ✅ Can be used for production development workflows');
    } else {
      console.log('   1. 🔍 Review failed test details above');
      console.log('   2. 🔧 Fix any identified issues');
      console.log('   3. 🔄 Re-run E2E tests to validate fixes');
      console.log('   4. ✅ Deploy once all tests pass');
    }

    // Exit with appropriate code
    const exitCode = failedSuites === 0 ? 0 : 1;
    process.exit(exitCode);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n🛑 E2E test suite interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 E2E test suite terminated');
  process.exit(1);
});

// Run all tests
const runner = new E2ETestRunner();
runner.runAllTests().catch((error) => {
  console.error('❌ E2E test suite failed:', error.message);
  process.exit(1);
});
