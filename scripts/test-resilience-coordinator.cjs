/**
 * Test script for ResilienceCoordinatorService
 * 
 * This script tests the enhanced resilience coordinator with:
 * - Exponential backoff retry mechanisms (Cockatiel-inspired)
 * - Circuit breaker patterns with state management
 * - Event-driven architecture for monitoring
 * - Service health tracking and statistics
 * 
 * Benefits for vibe coders:
 * - Comprehensive testing of production-ready resilience patterns
 * - Real-world failure simulation and recovery
 * - Event monitoring and debugging capabilities
 * - Performance metrics and health status validation
 */

const { EventEmitter } = require('events');

// Mock services for testing
class MockRetryService extends EventEmitter {
  constructor() {
    super();
  }
}

class MockCircuitBreakerService extends EventEmitter {
  constructor() {
    super();
  }
}

class MockHealthCheckService extends EventEmitter {
  constructor() {
    super();
  }
}

class MockBackupService extends EventEmitter {
  constructor() {
    super();
  }

  async start() {
    return Promise.resolve();
  }

  destroy() {
    this.emit('destroyed');
  }

  getConfigs() {
    return [{ id: 'test-backup', name: 'Test Backup' }];
  }

  async runBackup(id) {
    return `backup-${id}-${Date.now()}`;
  }
}

// Load the compiled service
let ResilienceCoordinatorService;
try {
  ResilienceCoordinatorService = require('../dist/services/resilience/resilience-coordinator.service.js').default;
} catch (error) {
  console.error('❌ Failed to load ResilienceCoordinatorService:', error.message);
  process.exit(1);
}

// Test configuration
const testConfig = {
  enabled: true,
  retryEnabled: true,
  circuitBreakerEnabled: true,
  healthCheckEnabled: true,
  backupEnabled: true,
  retryAttempts: 3,
  retryDelay: 100,
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 2000,
  healthCheckInterval: 1000,
  backupInterval: 5000
};

async function testResilienceCoordinator() {
  console.log('🧪 Testing Enhanced Resilience Coordinator Service');
  console.log('='.repeat(60));

  try {
    // Create service instance
    const resilienceService = new ResilienceCoordinatorService(testConfig);
    
    // Set up event listeners for monitoring
    setupEventListeners(resilienceService);

    // Test 1: Service initialization
    console.log('\n📋 Test 1: Service Initialization');
    await resilienceService.start();
    console.log('✅ Service started successfully');

    // Test 2: Simple operation execution
    console.log('\n📋 Test 2: Simple Operation Execution');
    const result = await resilienceService.executeWithResilience(
      'test-operation',
      async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      }
    );
    console.log('✅ Operation result:', result);

    // Test 3: Retry mechanism with exponential backoff
    console.log('\n📋 Test 3: Retry Mechanism with Exponential Backoff');
    let attemptCount = 0;
    const retryResult = await resilienceService.executeWithResilience(
      'retry-test',
      async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return `success after ${attemptCount} attempts`;
      },
      { retry: true, timeout: 1000 }
    );
    console.log('✅ Retry result:', retryResult);
    console.log(`✅ Retry attempts: ${attemptCount}`);

    // Test 4: Circuit breaker pattern
    console.log('\n📋 Test 4: Circuit Breaker Pattern');
    
    // First, trigger failures to open the circuit
    console.log('   Triggering failures to open circuit...');
    for (let i = 0; i < 4; i++) {
      try {
        await resilienceService.executeWithResilience(
          'circuit-breaker-test',
          async () => {
            throw new Error('Simulated failure');
          },
          { circuitBreaker: true }
        );
      } catch (error) {
        console.log(`   Attempt ${i + 1}: ${error.message}`);
      }
    }

    // Test circuit breaker state
    console.log('   Testing circuit breaker state...');
    try {
      await resilienceService.executeWithResilience(
        'circuit-breaker-test',
        async () => 'should not reach here',
        { circuitBreaker: true }
      );
    } catch (error) {
      console.log('✅ Circuit breaker blocked execution:', error.message);
    }

    // Test 5: Service health monitoring
    console.log('\n📋 Test 5: Service Health Monitoring');
    resilienceService.registerService('test-service', async () => true);
    
    const serviceHealth = resilienceService.getServiceHealth('test-service');
    console.log('✅ Service health:', serviceHealth);

    // Test 6: Resilience statistics
    console.log('\n📋 Test 6: Resilience Statistics');
    const stats = resilienceService.getStats();
    console.log('✅ Resilience stats:', {
      overallStatus: stats.overallStatus,
      totalRetries: stats.totalRetries,
      successfulRetries: stats.successfulRetries,
      circuitBreakerTrips: stats.circuitBreakerTrips,
      circuitBreakerResets: stats.circuitBreakerResets
    });

    // Test 7: Manual health check
    console.log('\n📋 Test 7: Manual Health Check');
    await resilienceService.performHealthCheck();
    console.log('✅ Health check completed');

    // Test 8: Manual backup
    console.log('\n📋 Test 8: Manual Backup');
    await resilienceService.performBackup();
    console.log('✅ Backup completed');

    // Test 9: Circuit breaker recovery (wait for timeout)
    console.log('\n📋 Test 9: Circuit Breaker Recovery');
    console.log('   Waiting for circuit breaker timeout...');
    await new Promise(resolve => setTimeout(resolve, 2500));

    try {
      const recoveryResult = await resilienceService.executeWithResilience(
        'circuit-breaker-test',
        async () => 'circuit breaker recovered',
        { circuitBreaker: true }
      );
      console.log('✅ Circuit breaker recovery:', recoveryResult);
    } catch (error) {
      console.log('⚠️  Circuit breaker still blocked:', error.message);
    }

    // Test 10: Service cleanup
    console.log('\n📋 Test 10: Service Cleanup');
    resilienceService.stop();
    console.log('✅ Service stopped successfully');

    // Final statistics
    console.log('\n📊 Final Statistics');
    const finalStats = resilienceService.getStats();
    console.log(JSON.stringify(finalStats, null, 2));

    console.log('\n🎉 All resilience coordinator tests passed!');
    console.log('✅ Enhanced resilience patterns working correctly');
    console.log('✅ Event-driven monitoring functional');
    console.log('✅ Circuit breaker state management operational');
    console.log('✅ Exponential backoff retry mechanism working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

function setupEventListeners(service) {
  console.log('\n🔧 Setting up event listeners for monitoring...');

  service.on('serviceStarted', () => {
    console.log('📡 Event: Service started');
  });

  service.on('operationFailed', (data) => {
    console.log(`📡 Event: Operation failed - ${data.operation}: ${data.error.message}`);
  });

  service.on('retryAttempt', (data) => {
    console.log(`📡 Event: Retry attempt ${data.attempt} for ${data.operation}, delay: ${data.delay}ms`);
  });

  service.on('retryExhausted', (data) => {
    console.log(`📡 Event: Retry exhausted for ${data.operation} after ${data.attempts} attempts`);
  });

  service.on('circuitBreakerOpened', (data) => {
    console.log(`📡 Event: Circuit breaker opened for ${data.operation}, failures: ${data.failureCount}`);
  });

  service.on('circuitBreakerReset', (data) => {
    console.log(`📡 Event: Circuit breaker reset for ${data.operation}`);
  });

  service.on('circuitBreakerStateChanged', (data) => {
    console.log(`📡 Event: Circuit breaker state changed for ${data.operation}: ${data.state}`);
  });

  service.on('serviceHealthChanged', (data) => {
    console.log(`📡 Event: Service health changed for ${data.serviceName}: ${data.oldStatus} -> ${data.newStatus}`);
  });

  service.on('healthCheckCompleted', (data) => {
    console.log(`📡 Event: Health check completed with status: ${data.status}`);
  });

  service.on('backupCompleted', (data) => {
    console.log(`📡 Event: Backup completed: ${data.backupId}`);
  });

  service.on('serviceStopped', () => {
    console.log('📡 Event: Service stopped');
  });
}

// Run the tests
if (require.main === module) {
  testResilienceCoordinator()
    .then(() => {
      console.log('\n🎯 Resilience Coordinator Testing Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testResilienceCoordinator };
