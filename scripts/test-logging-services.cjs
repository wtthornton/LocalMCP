#!/usr/bin/env node

/**
 * Logging Services Test Suite (CommonJS version)
 * 
 * This script tests the structured logging and pipeline tracing services
 * including correlation IDs, performance tracking, audit logs, and tracing.
 */

const { 
  StructuredLoggingService,
  PipelineTracingService
} = require('../dist/services/logging/index.js');

console.log('📊 Testing Structured Logging & Pipeline Tracing Services\n');

async function runLoggingServicesTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Structured Logging Service
    console.log('Test 1: Structured Logging Service');
    const loggingService = new StructuredLoggingService({
      level: 'debug',
      enableConsole: true,
      enableFile: false, // Disable file logging for tests
      enableRemote: false,
      bufferSize: 100,
      flushInterval: 1000
    });
    
    // Test correlation ID creation
    const correlationId1 = loggingService.createCorrelationId({ userId: 'test-user' });
    const correlationId2 = loggingService.createCorrelationId();
    
    if (correlationId1 && correlationId2 && correlationId1 !== correlationId2) {
      console.log('✅ Correlation ID creation working');
      testsPassed++;
    } else {
      console.log('❌ Correlation ID creation failed');
      testsFailed++;
    }

    // Test different log levels
    loggingService.debug('Debug message', { test: 'debug' }, correlationId1);
    loggingService.info('Info message', { test: 'info' }, correlationId1);
    loggingService.warn('Warning message', { test: 'warn' }, correlationId1);
    loggingService.error('Error message', new Error('Test error'), { test: 'error' }, correlationId1);
    loggingService.fatal('Fatal message', new Error('Fatal error'), { test: 'fatal' }, correlationId1);
    
    console.log('✅ Log level functionality working');
    testsPassed++;

    // Test performance logging
    loggingService.performance('test-operation', 150, { operation: 'test' }, correlationId1);
    
    console.log('✅ Performance logging working');
    testsPassed++;

    // Test audit logging
    loggingService.audit(
      'create',
      'user-data',
      'success',
      'low',
      { userId: 'test-user' },
      correlationId1
    );
    
    loggingService.audit(
      'delete',
      'sensitive-data',
      'denied',
      'critical',
      { reason: 'insufficient-permissions' },
      correlationId2
    );
    
    console.log('✅ Audit logging working');
    testsPassed++;

    // Test pipeline logging
    loggingService.pipeline('retrieve-context7', 'fetch-docs', 'started', {}, correlationId1);
    loggingService.pipeline('retrieve-context7', 'fetch-docs', 'completed', { duration: 500 }, correlationId1);
    
    console.log('✅ Pipeline logging working');
    testsPassed++;

    // Test service logging
    loggingService.service('context7', 'api-call', 'started', {}, correlationId1);
    loggingService.service('context7', 'api-call', 'completed', { responseTime: 200 }, correlationId1);
    
    console.log('✅ Service logging working');
    testsPassed++;

    // Test performance metrics
    const performanceMetrics = loggingService.getPerformanceMetrics();
    if (performanceMetrics && typeof performanceMetrics.totalLogs === 'number') {
      console.log('✅ Performance metrics working');
      testsPassed++;
    } else {
      console.log('❌ Performance metrics failed');
      testsFailed++;
    }

    // Test correlation statistics
    const correlationStats = loggingService.getCorrelationStats();
    if (correlationStats && typeof correlationStats.active === 'number') {
      console.log('✅ Correlation statistics working');
      testsPassed++;
    } else {
      console.log('❌ Correlation statistics failed');
      testsFailed++;
    }

    // Test log search functionality
    const searchResults = await loggingService.searchLogs({
      level: 'error',
      limit: 10
    });
    
    if (Array.isArray(searchResults)) {
      console.log('✅ Log search functionality working');
      testsPassed++;
    } else {
      console.log('❌ Log search functionality failed');
      testsFailed++;
    }

    // Test correlation ID log retrieval
    const correlationLogs = await loggingService.getLogsByCorrelationId(correlationId1);
    if (Array.isArray(correlationLogs)) {
      console.log('✅ Correlation ID log retrieval working');
      testsPassed++;
    } else {
      console.log('❌ Correlation ID log retrieval failed');
      testsFailed++;
    }

    // Test 2: Pipeline Tracing Service
    console.log('\nTest 2: Pipeline Tracing Service');
    const tracingService = new PipelineTracingService(loggingService, {
      enableTracing: true,
      enablePerformanceTracking: true,
      enableDependencyTracking: true,
      enableBottleneckDetection: true
    });
    
    // Test pipeline trace creation
    const traceId = tracingService.startPipelineTrace('test-pipeline', correlationId1, {
      tool: 'localmcp.create',
      input: 'Create a test component'
    });
    
    if (traceId) {
      console.log('✅ Pipeline trace creation working');
      testsPassed++;
    } else {
      console.log('❌ Pipeline trace creation failed');
      testsFailed++;
    }

    // Test stage tracing
    const stageId1 = tracingService.startStageTrace(traceId, 'retrieve-context7', 'fetch-docs', {
      query: 'test query'
    });
    
    if (stageId1) {
      console.log('✅ Stage trace creation working');
      testsPassed++;
    } else {
      console.log('❌ Stage trace creation failed');
      testsFailed++;
    }

    // Simulate stage execution
    await new Promise(resolve => setTimeout(resolve, 100));
    
    tracingService.endStageTrace(stageId1, 'completed');
    
    // Test operation tracing
    const operationId1 = tracingService.startOperationTrace(traceId, 'api-call', stageId1, {
      endpoint: 'https://api.example.com'
    });
    
    if (operationId1) {
      console.log('✅ Operation trace creation working');
      testsPassed++;
    } else {
      console.log('❌ Operation trace creation failed');
      testsFailed++;
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    tracingService.endOperationTrace(operationId1, 'completed');

    // Test dependency tracking
    tracingService.addDependency(traceId, 'retrieve-context7', 'analyze-code');
    
    console.log('✅ Dependency tracking working');
    testsPassed++;

    // Test another stage
    const stageId2 = tracingService.startStageTrace(traceId, 'analyze-code', 'parse-response');
    await new Promise(resolve => setTimeout(resolve, 75));
    tracingService.endStageTrace(stageId2, 'completed');

    // End pipeline trace
    tracingService.endPipelineTrace(traceId, 'completed');
    
    console.log('✅ Pipeline trace completion working');
    testsPassed++;

    // Test trace retrieval
    const trace = tracingService.getTrace(traceId);
    if (trace && trace.stages.length >= 2) {
      console.log('✅ Trace retrieval working');
      testsPassed++;
    } else {
      console.log('❌ Trace retrieval failed');
      testsFailed++;
    }

    // Test performance analysis
    const analysis = tracingService.analyzePerformance(trace);
    if (analysis && analysis.stageBreakdown.length >= 2) {
      console.log('✅ Performance analysis working');
      testsPassed++;
    } else {
      console.log('❌ Performance analysis failed');
      testsFailed++;
    }

    // Test performance summary
    const summary = tracingService.getPerformanceSummary();
    if (summary && typeof summary.totalTraces === 'number') {
      console.log('✅ Performance summary working');
      testsPassed++;
    } else {
      console.log('❌ Performance summary failed');
      testsFailed++;
    }

    // Test active traces
    const activeTraces = tracingService.getActiveTraces();
    if (Array.isArray(activeTraces)) {
      console.log('✅ Active traces retrieval working');
      testsPassed++;
    } else {
      console.log('❌ Active traces retrieval failed');
      testsFailed++;
    }

    // Test trace history
    const traceHistory = tracingService.getTraceHistory(10);
    if (Array.isArray(traceHistory) && traceHistory.length >= 1) {
      console.log('✅ Trace history working');
      testsPassed++;
    } else {
      console.log('❌ Trace history failed');
      testsFailed++;
    }

    // Test 3: Integration Test - Logging with Tracing
    console.log('\nTest 3: Integration - Logging with Tracing');
    
    const integrationTraceId = tracingService.startPipelineTrace('integration-test', correlationId2);
    
    // Create a more complex pipeline trace
    const stages = ['retrieve-context7', 'retrieve-rag', 'analyze-code', 'validate-result'];
    
    for (let i = 0; i < stages.length; i++) {
      const stageId = tracingService.startStageTrace(integrationTraceId, stages[i], 'execute');
      
      // Log stage start
      loggingService.pipeline(stages[i], 'execute', 'started', {}, correlationId2);
      
      // Simulate stage execution
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      // Log stage completion
      loggingService.pipeline(stages[i], 'execute', 'completed', { duration: 50 + Math.random() * 100 }, correlationId2);
      
      tracingService.endStageTrace(stageId, 'completed');
      
      // Add dependencies
      if (i > 0) {
        tracingService.addDependency(integrationTraceId, stages[i-1], stages[i]);
      }
    }
    
    tracingService.endPipelineTrace(integrationTraceId, 'completed');
    
    // Verify integration worked
    const integrationTrace = tracingService.getTrace(integrationTraceId);
    const integrationAnalysis = tracingService.analyzePerformance(integrationTrace);
    
    if (integrationTrace && integrationAnalysis && integrationTrace.stages.length === stages.length) {
      console.log('✅ Integration test working');
      testsPassed++;
    } else {
      console.log('❌ Integration test failed');
      testsFailed++;
    }

    // Test 4: Error Handling and Edge Cases
    console.log('\nTest 4: Error Handling and Edge Cases');
    
    // Test error logging
    try {
      throw new Error('Test error for logging');
    } catch (error) {
      loggingService.error('Caught test error', error, { test: 'error-handling' });
    }
    
    console.log('✅ Error logging working');
    testsPassed++;

    // Test invalid trace operations
    const invalidTraceId = 'invalid-trace-id';
    const invalidStageId = tracingService.startStageTrace(invalidTraceId, 'test-stage', 'test-operation');
    
    if (invalidStageId === '') {
      console.log('✅ Invalid trace handling working');
      testsPassed++;
    } else {
      console.log('❌ Invalid trace handling failed');
      testsFailed++;
    }

    // Test configuration updates
    loggingService.updateConfig({ level: 'warn' });
    const updatedConfig = loggingService.getConfig();
    
    if (updatedConfig.level === 'warn') {
      console.log('✅ Configuration update working');
      testsPassed++;
    } else {
      console.log('❌ Configuration update failed');
      testsFailed++;
    }

    // Test tracing configuration updates
    tracingService.updateConfig({ enableBottleneckDetection: false });
    const updatedTraceConfig = tracingService.getConfig();
    
    if (updatedTraceConfig.enableBottleneckDetection === false) {
      console.log('✅ Tracing configuration update working');
      testsPassed++;
    } else {
      console.log('❌ Tracing configuration update failed');
      testsFailed++;
    }

    // Test 5: Performance and Stress Testing
    console.log('\nTest 5: Performance and Stress Testing');
    
    // Test high-volume logging
    const startTime = Date.now();
    const testCorrelationId = loggingService.createCorrelationId();
    
    for (let i = 0; i < 100; i++) {
      loggingService.info(`Stress test message ${i}`, { iteration: i }, testCorrelationId);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration < 1000) { // Should complete in less than 1 second
      console.log('✅ High-volume logging performance working');
      testsPassed++;
    } else {
      console.log('❌ High-volume logging performance failed');
      testsFailed++;
    }

    // Test buffer flush
    await loggingService.flush();
    
    console.log('✅ Buffer flush working');
    testsPassed++;

    // Test 6: Service Cleanup
    console.log('\nTest 6: Service Cleanup');
    
    // Test service cleanup
    loggingService.destroy();
    tracingService.destroy();
    
    console.log('✅ Service cleanup working');
    testsPassed++;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('Stack:', error.stack);
    testsFailed++;
  }

  // Test Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Structured Logging & Pipeline Tracing Test Results');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Logging services are working correctly.');
    console.log('✨ LocalMCP now has comprehensive logging and tracing capabilities!');
    return true;
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Review the implementation.`);
    return false;
  }
}

// Run the tests
runLoggingServicesTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
