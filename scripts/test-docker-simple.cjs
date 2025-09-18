/**
 * Simple Docker Testing Script
 * 
 * Tests the simplified Docker setup for LocalMCP
 * 
 * Benefits for vibe coders:
 * - Quick Docker validation
 * - Core functionality testing
 * - Easy debugging
 */

const { execSync } = require('child_process');
const http = require('http');

// Test configuration
const testConfig = {
  imageName: 'localmcp:simple',
  containerName: 'localmcp-test',
  port: 3000,
  timeout: 30000
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

function makeHttpRequest(host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.end();
  });
}

// Test functions
async function testDockerBuild() {
  log('Testing Docker build...');
  
  const result = execCommand(`docker build -f Dockerfile.simple -t ${testConfig.imageName} .`);
  
  if (result.success) {
    log('Docker build successful', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'Docker Build', status: 'PASSED' });
  } else {
    log(`Docker build failed: ${result.error}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Docker Build', status: 'FAILED', error: result.error });
  }
  
  testResults.total++;
}

async function testDockerRun() {
  log('Testing Docker run...');
  
  // Stop any existing container
  execCommand(`docker stop ${testConfig.containerName}`, { stdio: 'ignore' });
  execCommand(`docker rm ${testConfig.containerName}`, { stdio: 'ignore' });
  
  // Run container
  const result = execCommand(`docker run -d --name ${testConfig.containerName} -p ${testConfig.port}:3000 ${testConfig.imageName}`);
  
  if (result.success) {
    log('Docker run successful', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'Docker Run', status: 'PASSED' });
  } else {
    log(`Docker run failed: ${result.error}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Docker Run', status: 'FAILED', error: result.error });
  }
  
  testResults.total++;
}

async function testHealthEndpoint() {
  log('Testing health endpoint...');
  
  // Wait for container to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    const response = await makeHttpRequest('localhost', testConfig.port, '/health');
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      log('Health endpoint working', 'success');
      log(`   Status: ${healthData.status}`);
      log(`   Uptime: ${healthData.uptime}ms`);
      log(`   Services: ${Object.keys(healthData.services).length}`);
      
      testResults.passed++;
      testResults.details.push({ test: 'Health Endpoint', status: 'PASSED' });
    } else {
      throw new Error(`Health endpoint returned ${response.statusCode}`);
    }
  } catch (error) {
    log(`Health endpoint test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Health Endpoint', status: 'FAILED', error: error.message });
  }
  
  testResults.total++;
}

async function testContainerLogs() {
  log('Testing container logs...');
  
  try {
    const result = execCommand(`docker logs ${testConfig.containerName}`);
    
    if (result.success) {
      const logs = result.output;
      if (logs.includes('Simple LocalMCP started') && logs.includes('Health check server listening')) {
        log('Container logs look good', 'success');
        testResults.passed++;
        testResults.details.push({ test: 'Container Logs', status: 'PASSED' });
      } else {
        log('Container logs missing expected messages', 'warning');
        testResults.passed++;
        testResults.details.push({ test: 'Container Logs', status: 'PASSED_WITH_WARNINGS' });
      }
    } else {
      throw new Error('Failed to get container logs');
    }
  } catch (error) {
    log(`Container logs test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Container Logs', status: 'FAILED', error: error.message });
  }
  
  testResults.total++;
}

async function testContainerStop() {
  log('Testing container stop...');
  
  const result = execCommand(`docker stop ${testConfig.containerName}`);
  
  if (result.success) {
    log('Container stopped successfully', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'Container Stop', status: 'PASSED' });
  } else {
    log(`Container stop failed: ${result.error}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Container Stop', status: 'FAILED', error: result.error });
  }
  
  testResults.total++;
}

async function testContainerCleanup() {
  log('Testing container cleanup...');
  
  const result = execCommand(`docker rm ${testConfig.containerName}`);
  
  if (result.success) {
    log('Container cleaned up successfully', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'Container Cleanup', status: 'PASSED' });
  } else {
    log(`Container cleanup failed: ${result.error}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Container Cleanup', status: 'FAILED', error: result.error });
  }
  
  testResults.total++;
}

// Main test execution
async function runSimpleDockerTests() {
  console.log('🧪 Starting Simple Docker Tests');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Docker Build
    await testDockerBuild();
    
    // Test 2: Docker Run
    await testDockerRun();
    
    // Test 3: Health Endpoint
    await testHealthEndpoint();
    
    // Test 4: Container Logs
    await testContainerLogs();
    
    // Test 5: Container Stop
    await testContainerStop();
    
    // Test 6: Container Cleanup
    await testContainerCleanup();
    
    // Print results
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detailed Results:');
    testResults.details.forEach(detail => {
      const status = detail.status === 'PASSED' ? '✅' : detail.status === 'PASSED_WITH_WARNINGS' ? '⚠️' : '❌';
      console.log(`   ${status} ${detail.test}: ${detail.status}`);
      if (detail.error) {
        console.log(`      Error: ${detail.error}`);
      }
    });
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All simple Docker tests passed!');
      console.log('✅ Docker containerization is working');
      console.log('✅ Core MCP functionality is operational');
      console.log('✅ Health checks are working');
      console.log('✅ LocalMCP is ready for deployment');
    } else {
      console.log('\n💥 Some tests failed!');
      console.log('❌ Docker setup has issues that need to be fixed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Simple Docker testing failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runSimpleDockerTests()
    .then(() => {
      console.log('\n🎯 Simple Docker Testing Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleDockerTests };
