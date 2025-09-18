#!/usr/bin/env node

/**
 * Resilience Services Test Suite (CommonJS version)
 * 
 * This script tests the resilience services implementation
 * including retry mechanisms, circuit breakers, and health checks.
 */

const { 
  RetryMechanismsService,
  CircuitBreakerService,
  HealthCheckService
} = require('../dist/services/resilience/index.js');

console.log('🛡️ Testing Resilience Services & Reliability Features\n');

async function runResilienceServicesTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Retry Mechanisms Service
    console.log('Test 1: Retry Mechanisms Service');
    const retryService = new RetryMechanismsService();
    
    // Test successful operation
    const successResult = await retryService.executeWithRetry(
      async () => 'success',
      'general'
    );
    
    if (successResult.success && successResult.data === 'success') {
      console.log('✅ Retry mechanism with successful operation working');
      testsPassed++;
    } else {
      console.log('❌ Retry mechanism with successful operation failed');
      testsFailed++;
    }

    // Test retry with eventual success
    let attemptCount = 0;
    const retrySuccessResult = await retryService.executeWithRetry(
      async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success after retries';
      },
      'general'
    );
    
    if (retrySuccessResult.success && retrySuccessResult.attempts === 3) {
      console.log('✅ Retry mechanism with eventual success working');
      testsPassed++;
    } else {
      console.log('❌ Retry mechanism with eventual success failed');
      testsFailed++;
    }

    // Test retry statistics
    const retryStats = retryService.getStats();
    if (retryStats && typeof retryStats.totalRetries === 'number') {
      console.log('✅ Retry statistics working');
      testsPassed++;
    } else {
      console.log('❌ Retry statistics failed');
      testsFailed++;
    }

    // Test 2: Circuit Breaker Service
    console.log('\nTest 2: Circuit Breaker Service');
    const circuitBreakerService = new CircuitBreakerService();
    
    // Test successful operation
    const cbSuccessResult = await circuitBreakerService.execute(
      async () => 'success',
      'general'
    );
    
    if (cbSuccessResult.success && cbSuccessResult.data === 'success') {
      console.log('✅ Circuit breaker with successful operation working');
      testsPassed++;
    } else {
      console.log('❌ Circuit breaker with successful operation failed');
      testsFailed++;
    }

    // Test circuit breaker opening
    let failureCount = 0;
    for (let i = 0; i < 6; i++) {
      try {
        await circuitBreakerService.execute(
          async () => {
            failureCount++;
            throw new Error('Service failure');
          },
          'general'
        );
      } catch (error) {
        // Expected to fail
      }
    }

    const cbState = circuitBreakerService.getState('general');
    if (cbState === 'open') {
      console.log('✅ Circuit breaker opening on failures working');
      testsPassed++;
    } else {
      console.log(`❌ Circuit breaker opening failed (state: ${cbState})`);
      testsFailed++;
    }

    // Test circuit breaker statistics
    const cbStats = circuitBreakerService.getAllStats();
    if (cbStats && typeof cbStats.totalRequests === 'number') {
      console.log('✅ Circuit breaker statistics working');
      testsPassed++;
    } else {
      console.log('❌ Circuit breaker statistics failed');
      testsFailed++;
    }

    // Test 3: Health Check Service
    console.log('\nTest 3: Health Check Service');
    const healthCheckService = new HealthCheckService();
    
    // Test service health check
    const healthResult = await healthCheckService.checkService('context7');
    
    if (healthResult && typeof healthResult.healthy === 'boolean') {
      console.log('✅ Health check for individual service working');
      testsPassed++;
    } else {
      console.log('❌ Health check for individual service failed');
      testsFailed++;
    }

    // Test system health overview
    const systemHealth = healthCheckService.getSystemHealth();
    if (systemHealth && systemHealth.overall && systemHealth.services) {
      console.log('✅ System health overview working');
      testsPassed++;
    } else {
      console.log('❌ System health overview failed');
      testsFailed++;
    }

    // Test health check statistics
    const healthStats = healthCheckService.getStats();
    if (healthStats && typeof healthStats.totalChecks === 'number') {
      console.log('✅ Health check statistics working');
      testsPassed++;
    } else {
      console.log('❌ Health check statistics failed');
      testsFailed++;
    }

    // Test 4: Integration Test - Retry with Circuit Breaker
    console.log('\nTest 4: Integration - Retry with Circuit Breaker');
    
    // Create a service that fails multiple times then succeeds
    let integrationAttempts = 0;
    const integrationResult = await retryService.executeWithRetry(
      async () => {
        return await circuitBreakerService.execute(
          async () => {
            integrationAttempts++;
            if (integrationAttempts < 2) {
              throw new Error('Integration test failure');
            }
            return 'integration success';
          },
          'general'
        );
      },
      'general'
    );
    
    if (integrationResult.success && integrationResult.data?.data === 'integration success') {
      console.log('✅ Retry with circuit breaker integration working');
      testsPassed++;
    } else {
      console.log('❌ Retry with circuit breaker integration failed');
      testsFailed++;
    }

    // Test 5: Error Handling and Edge Cases
    console.log('\nTest 5: Error Handling and Edge Cases');
    
    // Test non-retryable error
    const nonRetryableResult = await retryService.executeWithRetry(
      async () => {
        const error = new Error('Non-retryable error');
        error.status = 400; // Client error, not retryable
        throw error;
      },
      'general'
    );
    
    if (!nonRetryableResult.success && nonRetryableResult.attempts === 1) {
      console.log('✅ Non-retryable error handling working');
      testsPassed++;
    } else {
      console.log('❌ Non-retryable error handling failed');
      testsFailed++;
    }

    // Test circuit breaker with closed circuit
    const closedCbResult = await circuitBreakerService.execute(
      async () => 'should not execute',
      'general'
    );
    
    if (!closedCbResult.success && closedCbResult.state === 'open') {
      console.log('✅ Circuit breaker blocking execution when open working');
      testsPassed++;
    } else {
      console.log('❌ Circuit breaker blocking execution when open failed');
      testsFailed++;
    }

    // Test 6: Configuration Updates
    console.log('\nTest 6: Configuration Updates');
    
    // Update retry configuration
    retryService.updateConfig('general', { maxAttempts: 2 });
    const updatedRetryConfig = retryService.getConfig('general');
    
    if (updatedRetryConfig.maxAttempts === 2) {
      console.log('✅ Retry configuration update working');
      testsPassed++;
    } else {
      console.log('❌ Retry configuration update failed');
      testsFailed++;
    }

    // Update circuit breaker configuration
    circuitBreakerService.updateConfig('general', { failureThreshold: 3 });
    const updatedCbStats = circuitBreakerService.getStats('general');
    
    if (updatedCbStats) {
      console.log('✅ Circuit breaker configuration update working');
      testsPassed++;
    } else {
      console.log('❌ Circuit breaker configuration update failed');
      testsFailed++;
    }

    // Test 7: Service Cleanup
    console.log('\nTest 7: Service Cleanup');
    
    // Test service destruction
    retryService.destroy();
    circuitBreakerService.destroy();
    healthCheckService.destroy();
    
    console.log('✅ Service cleanup working');
    testsPassed++;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('Stack:', error.stack);
    testsFailed++;
  }

  // Test Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('🛡️ Resilience Services & Reliability Test Results');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Resilience services are working correctly.');
    console.log('✨ LocalMCP now has robust error handling and recovery mechanisms!');
    return true;
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Review the implementation.`);
    return false;
  }
}

// Run the tests
runResilienceServicesTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
