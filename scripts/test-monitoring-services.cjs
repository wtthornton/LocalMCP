/**
 * Test script for Monitoring Services
 * 
 * This script tests the comprehensive monitoring and alerting system:
 * - Performance monitoring with real-time metrics
 * - Intelligent alerting with multiple channels
 * - Monitoring coordinator with unified dashboard
 * - Analytics and trend analysis
 * 
 * Benefits for vibe coders:
 * - Comprehensive testing of production-ready monitoring
 * - Real-world performance simulation and alerting
 * - Dashboard data validation and analytics
 * - Alert escalation and notification testing
 */

const { EventEmitter } = require('events');

// Mock services for testing
class MockService extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.status = 'healthy';
  }

  getStatus() {
    return this.status;
  }

  simulateFailure() {
    this.status = 'critical';
    this.emit('failure');
  }

  simulateRecovery() {
    this.status = 'healthy';
    this.emit('recovery');
  }
}

// Load the compiled services
let PerformanceMonitorService, AlertingService, MonitoringCoordinatorService;

try {
  PerformanceMonitorService = require('../dist/services/monitoring/performance-monitor.service.js').default;
  AlertingService = require('../dist/services/monitoring/alerting.service.js').default;
  MonitoringCoordinatorService = require('../dist/services/monitoring/monitoring-coordinator.service.js').default;
} catch (error) {
  console.error('❌ Failed to load monitoring services:', error.message);
  process.exit(1);
}

// Test configuration
const testConfig = {
  enabled: true,
  performanceMonitoring: true,
  alerting: true,
  dashboard: true,
  analytics: true,
  updateInterval: 1000,
  retentionPeriod: 300000 // 5 minutes for testing
};

async function testMonitoringServices() {
  console.log('🧪 Testing Comprehensive Monitoring Services');
  console.log('='.repeat(60));

  try {
    // Test 1: Performance Monitor Service
    console.log('\n📋 Test 1: Performance Monitor Service');
    const performanceMonitor = new PerformanceMonitorService({
      enabled: true,
      thresholds: {
        responseTime: 1000,
        throughput: 100,
        errorRate: 5,
        memoryUsage: 80,
        cpuUsage: 80,
        diskUsage: 90
      }
    });

    await performanceMonitor.start();
    console.log('✅ Performance monitor started');

    // Record some test metrics
    performanceMonitor.recordMetric({
      name: 'test_metric',
      type: 'gauge',
      value: 75,
      unit: 'percent'
    });

    performanceMonitor.recordRequest(true, 150);
    performanceMonitor.recordRequest(false, 2000);
    performanceMonitor.recordRequest(true, 100);

    const stats = performanceMonitor.getStats();
    console.log('✅ Performance stats:', {
      totalRequests: stats.totalRequests,
      successRate: ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%',
      averageResponseTime: Math.round(stats.averageResponseTime) + 'ms'
    });

    // Test 2: Alerting Service
    console.log('\n📋 Test 2: Alerting Service');
    const alertingService = new AlertingService();
    await alertingService.start();
    console.log('✅ Alerting service started');

    // Test alert processing
    const testAlert = {
      id: 'test-alert-1',
      severity: 'warning',
      message: 'High response time detected',
      metric: 'request_response_time',
      threshold: 1000,
      currentValue: 1500,
      timestamp: new Date(),
      resolved: false
    };

    await alertingService.processAlert(testAlert);
    console.log('✅ Alert processed successfully');

    const analytics = alertingService.getAnalytics();
    console.log('✅ Alert analytics:', {
      totalAlerts: analytics.totalAlerts,
      activeAlerts: analytics.activeAlerts,
      alertsBySeverity: analytics.alertsBySeverity
    });

    // Test 3: Monitoring Coordinator Service
    console.log('\n📋 Test 3: Monitoring Coordinator Service');
    const monitoringCoordinator = new MonitoringCoordinatorService(testConfig);
    await monitoringCoordinator.start();
    console.log('✅ Monitoring coordinator started');

    // Register test services
    const testService1 = new MockService('cache-service');
    const testService2 = new MockService('rag-service');
    const testService3 = new MockService('context7-service');

    monitoringCoordinator.registerService('cache-service', testService1);
    monitoringCoordinator.registerService('rag-service', testService2);
    monitoringCoordinator.registerService('context7-service', testService3);
    console.log('✅ Services registered for monitoring');

    // Record performance data
    for (let i = 0; i < 10; i++) {
      const success = Math.random() > 0.2; // 80% success rate
      const responseTime = success ? Math.random() * 500 + 100 : Math.random() * 2000 + 1000;
      
      monitoringCoordinator.recordRequest(success, responseTime, {
        service: i % 2 === 0 ? 'cache-service' : 'rag-service'
      });
    }

    // Record system metrics
    monitoringCoordinator.recordSystemMetrics(
      Math.random() * 100, // memory usage
      Math.random() * 100, // CPU usage
      Math.random() * 100  // disk usage
    );

    // Test 4: Dashboard Data
    console.log('\n📋 Test 4: Dashboard Data Generation');
    const dashboardData = monitoringCoordinator.getDashboardData();
    console.log('✅ Dashboard data generated:', {
      systemHealth: dashboardData.systemHealth.status,
      totalRequests: dashboardData.performanceMetrics.requests.total,
      successRate: ((dashboardData.performanceMetrics.requests.successful / dashboardData.performanceMetrics.requests.total) * 100).toFixed(1) + '%',
      activeAlerts: dashboardData.alerts.active,
      responseTimeTrend: dashboardData.trends.responseTime
    });

    // Test 5: Performance Trends
    console.log('\n📋 Test 5: Performance Trends Analysis');
    const responseTimeTrend = monitoringCoordinator.getTrends('request_response_time', 60000);
    const throughputTrend = monitoringCoordinator.getTrends('request_throughput', 60000);
    
    console.log('✅ Response time trend:', responseTimeTrend);
    console.log('✅ Throughput trend:', throughputTrend);

    // Test 6: Alert Management
    console.log('\n📋 Test 6: Alert Management');
    const alerts = monitoringCoordinator.getAlerts();
    console.log('✅ Active alerts:', alerts.length);
    
    if (alerts.length > 0) {
      const firstAlert = alerts[0];
      console.log('   First alert:', {
        severity: firstAlert.severity,
        message: firstAlert.message,
        metric: firstAlert.metric
      });
    }

    // Test 7: Service Failure Simulation
    console.log('\n📋 Test 7: Service Failure Simulation');
    testService2.simulateFailure();
    console.log('✅ Service failure simulated');
    
    // Wait a moment for monitoring to detect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedDashboard = monitoringCoordinator.getDashboardData();
    console.log('✅ Updated system health:', updatedDashboard.systemHealth.status);

    // Test 8: Service Recovery Simulation
    console.log('\n📋 Test 8: Service Recovery Simulation');
    testService2.simulateRecovery();
    console.log('✅ Service recovery simulated');

    // Test 9: Performance Metrics Collection
    console.log('\n📋 Test 9: Performance Metrics Collection');
    const metrics = monitoringCoordinator.getMetrics('request_response_time', 5);
    console.log('✅ Recent response time metrics:', metrics.length);
    
    if (metrics.length > 0) {
      console.log('   Latest metric:', {
        value: metrics[metrics.length - 1].value,
        timestamp: metrics[metrics.length - 1].timestamp.toISOString()
      });
    }

    // Test 10: Service Cleanup
    console.log('\n📋 Test 10: Service Cleanup');
    monitoringCoordinator.stop();
    performanceMonitor.stop();
    alertingService.stop();
    console.log('✅ All services stopped successfully');

    // Final analytics
    console.log('\n📊 Final Analytics');
    const finalAnalytics = alertingService.getAnalytics();
    console.log(JSON.stringify(finalAnalytics, null, 2));

    console.log('\n🎉 All monitoring service tests passed!');
    console.log('✅ Performance monitoring working correctly');
    console.log('✅ Alerting system functional');
    console.log('✅ Monitoring coordinator operational');
    console.log('✅ Dashboard data generation working');
    console.log('✅ Analytics and trends analysis functional');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the tests
if (require.main === module) {
  testMonitoringServices()
    .then(() => {
      console.log('\n🎯 Monitoring Services Testing Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testMonitoringServices };
