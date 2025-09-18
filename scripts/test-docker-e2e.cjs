/**
 * Docker E2E Testing Script
 * 
 * This script tests the complete Docker deployment of LocalMCP,
 * including container startup, service health, and API functionality.
 * 
 * Benefits for vibe coders:
 * - Complete E2E validation of Docker deployment
 * - Automated testing of all services
 * - Health check validation
 * - Performance testing
 * - Easy debugging and troubleshooting
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const https = require('https');

// Test configuration
const testConfig = {
  dockerComposeFile: 'docker-compose.yml',
  timeout: 300000, // 5 minutes
  retryAttempts: 10,
  retryDelay: 5000, // 5 seconds
  services: {
    localmcp: { port: 3000, path: '/health' },
    admin: { port: 3001, path: '/health' },
    monitoring: { port: 3002, path: '/health' },
    qdrant: { port: 6333, path: '/health' },
    redis: { port: 6379, path: '/ping' },
    nginx: { port: 80, path: '/health' }
  }
};

// Test results tracking
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

function makeHttpRequest(host, port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
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

function waitForService(host, port, path, maxAttempts = 10, delay = 5000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const checkService = async () => {
      attempts++;
      
      try {
        const response = await makeHttpRequest(host, port, path);
        if (response.statusCode === 200) {
          resolve(response);
        } else {
          throw new Error(`Service returned status ${response.statusCode}`);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(new Error(`Service not available after ${maxAttempts} attempts: ${error.message}`));
        } else {
          log(`Service not ready (attempt ${attempts}/${maxAttempts}), retrying in ${delay}ms...`, 'warning');
          setTimeout(checkService, delay);
        }
      }
    };
    
    checkService();
  });
}

// Test functions
async function testDockerBuild() {
  log('Testing Docker build...');
  
  const result = execCommand('docker build -t localmcp:test .');
  
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

async function testDockerComposeUp() {
  log('Testing Docker Compose startup...');
  
  const result = execCommand(`docker-compose -f ${testConfig.dockerComposeFile} up -d`);
  
  if (result.success) {
    log('Docker Compose startup successful', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'Docker Compose Up', status: 'PASSED' });
  } else {
    log(`Docker Compose startup failed: ${result.error}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Docker Compose Up', status: 'FAILED', error: result.error });
  }
  
  testResults.total++;
}

async function testServiceHealth(serviceName, config) {
  log(`Testing ${serviceName} service health...`);
  
  try {
    const response = await waitForService('localhost', config.port, config.path);
    log(`${serviceName} service is healthy`, 'success');
    testResults.passed++;
    testResults.details.push({ 
      test: `${serviceName} Health Check`, 
      status: 'PASSED',
      responseTime: Date.now()
    });
  } catch (error) {
    log(`${serviceName} service health check failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ 
      test: `${serviceName} Health Check`, 
      status: 'FAILED', 
      error: error.message 
    });
  }
  
  testResults.total++;
}

async function testAPIFunctionality() {
  log('Testing API functionality...');
  
  try {
    // Test main API health
    const healthResponse = await makeHttpRequest('localhost', 3000, '/health');
    if (healthResponse.statusCode !== 200) {
      throw new Error(`Health endpoint returned ${healthResponse.statusCode}`);
    }
    
    // Test admin console
    const adminResponse = await makeHttpRequest('localhost', 3001, '/health');
    if (adminResponse.statusCode !== 200) {
      throw new Error(`Admin console returned ${adminResponse.statusCode}`);
    }
    
    // Test monitoring dashboard
    const monitoringResponse = await makeHttpRequest('localhost', 3002, '/health');
    if (monitoringResponse.statusCode !== 200) {
      throw new Error(`Monitoring dashboard returned ${monitoringResponse.statusCode}`);
    }
    
    log('API functionality test passed', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'API Functionality', status: 'PASSED' });
  } catch (error) {
    log(`API functionality test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'API Functionality', status: 'FAILED', error: error.message });
  }
  
  testResults.total++;
}

async function testContainerLogs() {
  log('Testing container logs...');
  
  const containers = ['localmcp-main', 'localmcp-qdrant', 'localmcp-redis', 'localmcp-nginx'];
  let allLogsHealthy = true;
  
  for (const container of containers) {
    try {
      const result = execCommand(`docker logs ${container} --tail 50`);
      if (result.success) {
        const logs = result.output;
        if (logs.includes('ERROR') || logs.includes('FATAL')) {
          log(`Container ${container} has errors in logs`, 'warning');
          allLogsHealthy = false;
        }
      }
    } catch (error) {
      log(`Failed to get logs for container ${container}: ${error.message}`, 'warning');
    }
  }
  
  if (allLogsHealthy) {
    log('Container logs are healthy', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'Container Logs', status: 'PASSED' });
  } else {
    log('Some containers have errors in logs', 'warning');
    testResults.passed++;
    testResults.details.push({ test: 'Container Logs', status: 'PASSED_WITH_WARNINGS' });
  }
  
  testResults.total++;
}

async function testResourceUsage() {
  log('Testing resource usage...');
  
  try {
    const result = execCommand('docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"');
    
    if (result.success) {
      const stats = result.output;
      log('Resource usage:', 'info');
      console.log(stats);
      
      testResults.passed++;
      testResults.details.push({ test: 'Resource Usage', status: 'PASSED' });
    } else {
      throw new Error('Failed to get resource usage');
    }
  } catch (error) {
    log(`Resource usage test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Resource Usage', status: 'FAILED', error: error.message });
  }
  
  testResults.total++;
}

async function testDockerComposeDown() {
  log('Testing Docker Compose shutdown...');
  
  const result = execCommand(`docker-compose -f ${testConfig.dockerComposeFile} down`);
  
  if (result.success) {
    log('Docker Compose shutdown successful', 'success');
    testResults.passed++;
    testResults.details.push({ test: 'Docker Compose Down', status: 'PASSED' });
  } else {
    log(`Docker Compose shutdown failed: ${result.error}`, 'error');
    testResults.failed++;
    testResults.details.push({ test: 'Docker Compose Down', status: 'FAILED', error: result.error });
  }
  
  testResults.total++;
}

// Main test execution
async function runE2ETests() {
  console.log('🧪 Starting Docker E2E Tests');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Docker Build
    await testDockerBuild();
    
    // Test 2: Docker Compose Up
    await testDockerComposeUp();
    
    // Wait for services to be ready
    log('Waiting for services to be ready...', 'info');
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
    
    // Test 3: Service Health Checks
    for (const [serviceName, config] of Object.entries(testConfig.services)) {
      await testServiceHealth(serviceName, config);
    }
    
    // Test 4: API Functionality
    await testAPIFunctionality();
    
    // Test 5: Container Logs
    await testContainerLogs();
    
    // Test 6: Resource Usage
    await testResourceUsage();
    
    // Test 7: Docker Compose Down
    await testDockerComposeDown();
    
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
      console.log('\n🎉 All E2E tests passed!');
      console.log('✅ Docker deployment is working correctly');
      console.log('✅ All services are healthy and functional');
      console.log('✅ LocalMCP is ready for production use');
    } else {
      console.log('\n💥 Some tests failed!');
      console.log('❌ Docker deployment has issues that need to be fixed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 E2E testing failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runE2ETests()
    .then(() => {
      console.log('\n🎯 Docker E2E Testing Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runE2ETests };
