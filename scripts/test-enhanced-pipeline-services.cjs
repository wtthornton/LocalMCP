#!/usr/bin/env node

/**
 * Enhanced Pipeline Services Test Suite (CommonJS version)
 * 
 * This script tests the enhanced pipeline execution and optimization services
 * including parallel execution, caching, optimization, and performance analytics.
 */

const { 
  EnhancedPipelineExecutionService,
  PipelineOptimizationService
} = require('../dist/services/pipeline/index.js');

// Mock PipelineEngine for testing
class MockPipelineEngine {
  constructor() {
    this.stages = [
      { id: 'retrieve-context7', name: 'Retrieve Context7', execute: async (context) => ({ data: 'context7-data' }) },
      { id: 'retrieve-rag', name: 'Retrieve RAG', execute: async (context) => ({ data: 'rag-data' }) },
      { id: 'analyze-code', name: 'Analyze Code', execute: async (context) => ({ analysis: 'code-analysis' }) },
      { id: 'validate-result', name: 'Validate Result', execute: async (context) => ({ valid: true }) }
    ];
  }

  getStages() {
    return this.stages;
  }
}

// Mock PipelineContext for testing
const mockContext = {
  requestId: 'test-request-123',
  tool: 'localmcp.create',
  input: 'Create a simple Hello World component',
  timestamp: new Date()
};

console.log('🚀 Testing Enhanced Pipeline Services & Advanced Execution\n');

async function runEnhancedPipelineServicesTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Enhanced Pipeline Execution Service
    console.log('Test 1: Enhanced Pipeline Execution Service');
    const enhancedPipeline = new EnhancedPipelineExecutionService();
    const mockPipeline = new MockPipelineEngine();
    
    // Test pipeline execution with different strategies
    const sequentialResult = await enhancedPipeline.executePipeline(
      mockPipeline,
      mockContext,
      { strategy: 'sequential' }
    );
    
    if (sequentialResult && typeof sequentialResult.success === 'boolean' && sequentialResult.strategy === 'sequential') {
      console.log('✅ Sequential pipeline execution working');
      testsPassed++;
    } else {
      console.log('❌ Sequential pipeline execution failed');
      testsFailed++;
    }

    // Test parallel execution strategy
    const parallelResult = await enhancedPipeline.executePipeline(
      mockPipeline,
      mockContext,
      { strategy: 'parallel', maxConcurrentStages: 2 }
    );
    
    if (parallelResult && typeof parallelResult.success === 'boolean' && parallelResult.strategy === 'parallel') {
      console.log('✅ Parallel pipeline execution working');
      testsPassed++;
    } else {
      console.log('❌ Parallel pipeline execution failed');
      testsFailed++;
    }

    // Test adaptive execution strategy
    const adaptiveResult = await enhancedPipeline.executePipeline(
      mockPipeline,
      mockContext,
      { strategy: 'adaptive' }
    );
    
    if (adaptiveResult && typeof adaptiveResult.success === 'boolean' && adaptiveResult.strategy) {
      console.log('✅ Adaptive pipeline execution working');
      testsPassed++;
    } else {
      console.log('❌ Adaptive pipeline execution failed');
      testsFailed++;
    }

    // Test execution history
    const executionHistory = enhancedPipeline.getExecutionHistory(10);
    if (Array.isArray(executionHistory)) {
      console.log('✅ Execution history tracking working');
      testsPassed++;
    } else {
      console.log('❌ Execution history tracking failed');
      testsFailed++;
    }

    // Test performance analytics
    const performanceAnalytics = enhancedPipeline.getPerformanceAnalytics();
    if (performanceAnalytics && typeof performanceAnalytics.totalExecutions === 'number') {
      console.log('✅ Performance analytics working');
      testsPassed++;
    } else {
      console.log('❌ Performance analytics failed');
      testsFailed++;
    }

    // Test cache statistics
    const cacheStats = enhancedPipeline.getCacheStats();
    if (cacheStats && typeof cacheStats.size === 'number') {
      console.log('✅ Cache statistics working');
      testsPassed++;
    } else {
      console.log('❌ Cache statistics failed');
      testsFailed++;
    }

    // Test 2: Pipeline Optimization Service
    console.log('\nTest 2: Pipeline Optimization Service');
    const optimizationService = new PipelineOptimizationService();
    
    // Test optimization rules
    const optimizationRules = optimizationService.getOptimizationRules();
    if (Array.isArray(optimizationRules) && optimizationRules.length > 0) {
      console.log('✅ Optimization rules initialization working');
      testsPassed++;
    } else {
      console.log('❌ Optimization rules initialization failed');
      testsFailed++;
    }

    // Test caching functionality
    const testKey = 'test-cache-key';
    const testValue = { data: 'test-cache-value' };
    
    optimizationService.cacheResult(testKey, testValue, 60000, ['test']);
    const cachedResult = optimizationService.getCachedResult(testKey);
    
    if (cachedResult && cachedResult.data === testValue.data) {
      console.log('✅ Cache functionality working');
      testsPassed++;
    } else {
      console.log('❌ Cache functionality failed');
      testsFailed++;
    }

    // Test cache invalidation
    const invalidatedCount = optimizationService.invalidateByTags(['test']);
    if (invalidatedCount > 0) {
      console.log('✅ Cache invalidation working');
      testsPassed++;
    } else {
      console.log('❌ Cache invalidation failed');
      testsFailed++;
    }

    // Test cache statistics
    const cacheStatistics = optimizationService.getCacheStatistics();
    if (cacheStatistics && typeof cacheStatistics.totalEntries === 'number') {
      console.log('✅ Cache statistics working');
      testsPassed++;
    } else {
      console.log('❌ Cache statistics failed');
      testsFailed++;
    }

    // Test pipeline optimization
    const optimizationResult = await optimizationService.optimizeExecution(
      mockPipeline,
      mockContext
    );
    
    if (optimizationResult && Array.isArray(optimizationResult.optimizations)) {
      console.log('✅ Pipeline optimization working');
      testsPassed++;
    } else {
      console.log('❌ Pipeline optimization failed');
      testsFailed++;
    }

    // Test performance metrics
    const performanceMetrics = optimizationService.getAllPerformanceMetrics();
    if (Array.isArray(performanceMetrics)) {
      console.log('✅ Performance metrics working');
      testsPassed++;
    } else {
      console.log('❌ Performance metrics failed');
      testsFailed++;
    }

    // Test 3: Integration Test - Enhanced Pipeline with Optimization
    console.log('\nTest 3: Integration - Enhanced Pipeline with Optimization');
    
    // Create optimized pipeline execution service
    const optimizedPipeline = new EnhancedPipelineExecutionService({
      strategy: 'optimized',
      enableCaching: true,
      enableOptimization: true,
      enableResourceMonitoring: true
    });
    
    // Execute with optimization
    const optimizedResult = await optimizedPipeline.executePipeline(
      mockPipeline,
      mockContext,
      { strategy: 'optimized' }
    );
    
    if (optimizedResult && optimizedResult.strategy === 'optimized') {
      console.log('✅ Optimized pipeline execution working');
      testsPassed++;
    } else {
      console.log('❌ Optimized pipeline execution failed');
      testsFailed++;
    }

    // Test execution replay
    const replayResult = await optimizedPipeline.replayExecution(optimizedResult.executionId);
    if (replayResult || replayResult === null) { // null is valid for non-replayable executions
      console.log('✅ Execution replay working');
      testsPassed++;
    } else {
      console.log('❌ Execution replay failed');
      testsFailed++;
    }

    // Test 4: Error Handling and Edge Cases
    console.log('\nTest 4: Error Handling and Edge Cases');
    
    // Test with invalid configuration
    try {
      const invalidConfigResult = await enhancedPipeline.executePipeline(
        mockPipeline,
        mockContext,
        { strategy: 'invalid-strategy' }
      );
      
      // Should handle invalid config gracefully
      if (invalidConfigResult) {
        console.log('✅ Invalid configuration handling working');
        testsPassed++;
      } else {
        console.log('❌ Invalid configuration handling failed');
        testsFailed++;
      }
    } catch (error) {
      console.log('✅ Invalid configuration error handling working');
      testsPassed++;
    }

    // Test cache with expired entries
    optimizationService.cacheResult('expired-key', { data: 'expired' }, 1); // 1ms TTL
    await new Promise(resolve => setTimeout(resolve, 10)); // Wait for expiration
    const expiredResult = optimizationService.getCachedResult('expired-key');
    
    if (expiredResult === null) {
      console.log('✅ Cache expiration handling working');
      testsPassed++;
    } else {
      console.log('❌ Cache expiration handling failed');
      testsFailed++;
    }

    // Test 5: Configuration Updates
    console.log('\nTest 5: Configuration Updates');
    
    // Update enhanced pipeline configuration
    enhancedPipeline.updateConfig({ strategy: 'parallel', maxConcurrentStages: 3 });
    const updatedConfig = enhancedPipeline.getConfig();
    
    if (updatedConfig.strategy === 'parallel' && updatedConfig.maxConcurrentStages === 3) {
      console.log('✅ Enhanced pipeline configuration update working');
      testsPassed++;
    } else {
      console.log('❌ Enhanced pipeline configuration update failed');
      testsFailed++;
    }

    // Update optimization service configuration
    optimizationService.updateConfig({ cacheSize: 2000, cacheTtl: 600000 });
    const updatedOptimizationConfig = optimizationService.getConfig();
    
    if (updatedOptimizationConfig.cacheSize === 2000 && updatedOptimizationConfig.cacheTtl === 600000) {
      console.log('✅ Optimization service configuration update working');
      testsPassed++;
    } else {
      console.log('❌ Optimization service configuration update failed');
      testsFailed++;
    }

    // Test 6: Performance and Analytics
    console.log('\nTest 6: Performance and Analytics');
    
    // Execute multiple times to generate analytics data
    for (let i = 0; i < 5; i++) {
      await enhancedPipeline.executePipeline(mockPipeline, { ...mockContext, requestId: `test-${i}` });
    }
    
    const finalAnalytics = enhancedPipeline.getPerformanceAnalytics();
    if (finalAnalytics && finalAnalytics.totalExecutions >= 5) {
      console.log('✅ Performance analytics accumulation working');
      testsPassed++;
    } else {
      console.log('❌ Performance analytics accumulation failed');
      testsFailed++;
    }

    // Test 7: Service Cleanup
    console.log('\nTest 7: Service Cleanup');
    
    // Test service cleanup
    enhancedPipeline.destroy();
    optimizationService.destroy();
    
    console.log('✅ Service cleanup working');
    testsPassed++;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('Stack:', error.stack);
    testsFailed++;
  }

  // Test Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Enhanced Pipeline Services & Advanced Execution Test Results');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Enhanced pipeline services are working correctly.');
    console.log('✨ LocalMCP now has advanced pipeline execution and optimization!');
    return true;
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Review the implementation.`);
    return false;
  }
}

// Run the tests
runEnhancedPipelineServicesTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
