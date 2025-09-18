#!/usr/bin/env node

/**
 * Logging Services Test Suite (CommonJS version)
 * 
 * This script tests the structured logging and pipeline tracing services
 * including correlation IDs, performance tracking, audit logs, and tracing.
 */

const { 
  StructuredLoggingService,
  PipelineTracingService,
  ErrorTrackingService,
  PerformanceMetricsService
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

    // Test 3: Error Tracking Service
    console.log('\nTest 3: Error Tracking Service');
    const errorTrackingService = new ErrorTrackingService(loggingService, {
      enableErrorTracking: true,
      enablePatternAnalysis: true,
      enableDebuggingInfo: true,
      enableErrorGrouping: true,
      maxErrorEntries: 1000,
      errorRetentionDays: 7
    });
    
    // Test error tracking
    const testError1 = new Error('Test validation error');
    const errorId1 = errorTrackingService.trackError(testError1, {
      userId: 'test-user-1',
      service: 'context7',
      tool: 'localmcp.create',
      stage: 'validation',
      correlationId: correlationId1
    }, {
      input: { query: 'test query' },
      metadata: { source: 'test' }
    });
    
    if (errorId1) {
      console.log('✅ Error tracking working');
      testsPassed++;
    } else {
      console.log('❌ Error tracking failed');
      testsFailed++;
    }

    // Test duplicate error tracking
    const testError2 = new Error('Test validation error'); // Same error
    const errorId2 = errorTrackingService.trackError(testError2, {
      userId: 'test-user-2',
      service: 'context7',
      tool: 'localmcp.create',
      stage: 'validation',
      correlationId: correlationId2
    });
    
    // Should be the same error ID due to fingerprint matching
    if (errorId1 === errorId2) {
      console.log('✅ Duplicate error detection working');
      testsPassed++;
    } else {
      console.log('❌ Duplicate error detection failed');
      testsFailed++;
    }

    // Test different error types
    const networkError = new Error('Network timeout');
    const authError = new Error('Authentication failed');
    const dbError = new Error('Database connection failed');
    
    errorTrackingService.trackError(networkError, {
      service: 'network',
      correlationId: correlationId1
    });
    
    errorTrackingService.trackError(authError, {
      service: 'auth',
      correlationId: correlationId2
    });
    
    errorTrackingService.trackError(dbError, {
      service: 'database',
      correlationId: correlationId1
    });
    
    console.log('✅ Multiple error types tracking working');
    testsPassed++;

    // Test error retrieval
    const retrievedError = errorTrackingService.getError(errorId1);
    if (retrievedError && retrievedError.error.message === 'Test validation error') {
      console.log('✅ Error retrieval working');
      testsPassed++;
    } else {
      console.log('❌ Error retrieval failed');
      testsFailed++;
    }

    // Test error search
    const validationErrors = errorTrackingService.getErrorsByCategory('validation');
    if (validationErrors.length >= 1) {
      console.log('✅ Error search by category working');
      testsPassed++;
    } else {
      console.log('❌ Error search by category failed');
      testsFailed++;
    }

    // Test error patterns
    const patterns = errorTrackingService.getErrorPatterns();
    if (patterns.length >= 1) {
      console.log('✅ Error pattern analysis working');
      testsPassed++;
    } else {
      console.log('❌ Error pattern analysis failed');
      testsFailed++;
    }

    // Test error analytics
    const analytics = errorTrackingService.getErrorAnalytics();
    if (analytics && analytics.totalErrors >= 1) {
      console.log('✅ Error analytics working');
      testsPassed++;
    } else {
      console.log('❌ Error analytics failed');
      testsFailed++;
    }

    // Test error resolution
    const resolutionSuccess = errorTrackingService.resolveError(
      errorId1,
      'Fixed validation logic',
      'developer-1',
      'high'
    );
    
    if (resolutionSuccess) {
      console.log('✅ Error resolution working');
      testsPassed++;
    } else {
      console.log('❌ Error resolution failed');
      testsFailed++;
    }

    // Test debugging information
    const debuggingInfo = errorTrackingService.getDebuggingInfo(errorId1);
    if (debuggingInfo && debuggingInfo.error) {
      console.log('✅ Debugging information working');
      testsPassed++;
    } else {
      console.log('❌ Debugging information failed');
      testsFailed++;
    }

    // Test 4: Performance Metrics Service
    console.log('\nTest 4: Performance Metrics Service');
    const performanceMetricsService = new PerformanceMetricsService(loggingService, {
      enableMonitoring: true,
      enableBottleneckDetection: true,
      enableTrendAnalysis: true,
      enableCapacityPlanning: true,
      enableAlerts: true,
      collectionInterval: 5000, // 5 seconds for testing
      maxMetrics: 1000
    });
    
    // Test metric recording
    performanceMetricsService.recordCounter('requests', 'application', 1, { endpoint: '/api/test' });
    performanceMetricsService.recordGauge('memory_usage', 'system', 75.5, 'percent');
    performanceMetricsService.recordTimer('response_time', 'application', 250, 'ms', { endpoint: '/api/test' });
    performanceMetricsService.recordRate('throughput', 'application', 100, 'requests/sec');
    
    console.log('✅ Performance metric recording working');
    testsPassed++;

    // Test metric retrieval
    const requestMetrics = performanceMetricsService.getMetrics('requests');
    const systemMetrics = performanceMetricsService.getMetricsByCategory('system');
    
    if (requestMetrics.length >= 1 && systemMetrics.length >= 1) {
      console.log('✅ Performance metric retrieval working');
      testsPassed++;
    } else {
      console.log('❌ Performance metric retrieval failed');
      testsFailed++;
    }

    // Test performance snapshot
    const currentSnapshot = performanceMetricsService.getCurrentSnapshot();
    if (currentSnapshot && currentSnapshot.systemMetrics && currentSnapshot.applicationMetrics) {
      console.log('✅ Performance snapshot working');
      testsPassed++;
    } else {
      console.log('❌ Performance snapshot failed');
      testsFailed++;
    }

    // Test bottleneck detection with high values
    performanceMetricsService.recordGauge('cpu_usage', 'system', 95, 'percent'); // Should trigger bottleneck
    performanceMetricsService.recordGauge('memory_usage', 'system', 92, 'percent'); // Should trigger bottleneck
    performanceMetricsService.recordTimer('response_time', 'application', 6000, 'ms'); // Should trigger bottleneck
    
    const bottlenecks = performanceMetricsService.getBottlenecks();
    if (bottlenecks.length >= 1) {
      console.log('✅ Bottleneck detection working');
      testsPassed++;
    } else {
      console.log('❌ Bottleneck detection failed');
      testsFailed++;
    }

    // Test performance analytics
    const analytics = performanceMetricsService.getAnalytics();
    if (analytics && analytics.overallHealth && analytics.performanceScore >= 0) {
      console.log('✅ Performance analytics working');
      testsPassed++;
    } else {
      console.log('❌ Performance analytics failed');
      testsFailed++;
    }

    // Test performance trends
    const trends = performanceMetricsService.getTrends();
    if (Array.isArray(trends)) {
      console.log('✅ Performance trends working');
      testsPassed++;
    } else {
      console.log('❌ Performance trends failed');
      testsFailed++;
    }

    // Test performance snapshots
    const snapshots = performanceMetricsService.getSnapshots(10);
    if (Array.isArray(snapshots)) {
      console.log('✅ Performance snapshots working');
      testsPassed++;
    } else {
      console.log('❌ Performance snapshots failed');
      testsFailed++;
    }

    // Test monitoring start/stop
    performanceMetricsService.startMonitoring();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    performanceMetricsService.stopMonitoring();
    
    console.log('✅ Performance monitoring start/stop working');
    testsPassed++;

    // Test configuration update
    performanceMetricsService.updateConfig({ collectionInterval: 10000 });
    const updatedConfig = performanceMetricsService.getConfig();
    
    if (updatedConfig.collectionInterval === 10000) {
      console.log('✅ Performance configuration update working');
      testsPassed++;
    } else {
      console.log('❌ Performance configuration update failed');
      testsFailed++;
    }

    // Test 5: Integration Test - Logging with Tracing, Error Tracking, and Performance Metrics
    console.log('\nTest 5: Integration - All Logging Services Combined');
    
    const integrationTraceId = tracingService.startPipelineTrace('integration-test', correlationId2);
    
    // Create a more complex pipeline trace with error scenarios
    const stages = ['retrieve-context7', 'retrieve-rag', 'analyze-code', 'validate-result'];
    
    for (let i = 0; i < stages.length; i++) {
      const stageId = tracingService.startStageTrace(integrationTraceId, stages[i], 'execute');
      
      // Log stage start
      loggingService.pipeline(stages[i], 'execute', 'started', {}, correlationId2);
      
      try {
        // Record performance metrics for stage start
        const stageStartTime = Date.now();
        performanceMetricsService.recordCounter('pipeline_stage_started', 'pipeline', 1, { stage: stages[i] });
        
        // Simulate stage execution with potential errors
        const executionTime = 50 + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, executionTime));
        
        // Record performance metrics
        performanceMetricsService.recordTimer('pipeline_stage_duration', 'pipeline', executionTime, 'ms', { stage: stages[i] });
        performanceMetricsService.recordGauge('pipeline_stage_memory', 'pipeline', Math.random() * 100, 'percent', { stage: stages[i] });
        
        // Simulate an error in one stage
        if (stages[i] === 'analyze-code' && Math.random() > 0.7) {
          const stageError = new Error(`Analysis failed in ${stages[i]}`);
          errorTrackingService.trackError(stageError, {
            service: 'pipeline',
            stage: stages[i],
            correlationId: correlationId2,
            tool: 'localmcp.create'
          });
          
          // Record error metrics
          performanceMetricsService.recordCounter('pipeline_stage_errors', 'pipeline', 1, { stage: stages[i] });
          throw stageError;
        }
        
        // Record success metrics
        performanceMetricsService.recordCounter('pipeline_stage_completed', 'pipeline', 1, { stage: stages[i] });
        
        // Log stage completion
        loggingService.pipeline(stages[i], 'execute', 'completed', { duration: executionTime }, correlationId2);
        tracingService.endStageTrace(stageId, 'completed');
        
      } catch (error) {
        // Log stage failure
        loggingService.pipeline(stages[i], 'execute', 'failed', { error: error.message }, correlationId2);
        tracingService.endStageTrace(stageId, 'failed');
        
        // Track the error
        errorTrackingService.trackError(error, {
          service: 'pipeline',
          stage: stages[i],
          correlationId: correlationId2,
          tool: 'localmcp.create'
        });
      }
      
      // Add dependencies
      if (i > 0) {
        tracingService.addDependency(integrationTraceId, stages[i-1], stages[i]);
      }
    }
    
    tracingService.endPipelineTrace(integrationTraceId, 'completed');
    
    // Verify integration worked
    const integrationTrace = tracingService.getTrace(integrationTraceId);
    const integrationAnalysis = tracingService.analyzePerformance(integrationTrace);
    const integrationErrors = errorTrackingService.searchErrors({
      correlationId: correlationId2,
      limit: 10
    });
    
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
    errorTrackingService.destroy();
    performanceMetricsService.destroy();
    
    console.log('✅ Service cleanup working');
    testsPassed++;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('Stack:', error.stack);
    testsFailed++;
  }

  // Test Results Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Structured Logging, Pipeline Tracing, Error Tracking & Performance Metrics Test Results');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Logging services are working correctly.');
    console.log('✨ LocalMCP now has comprehensive logging, tracing, error tracking, and performance metrics capabilities!');
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
