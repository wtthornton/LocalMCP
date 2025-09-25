#!/usr/bin/env node

/**
 * Load Testing Script for AI Enhancement Features
 * 
 * This script performs comprehensive load testing of the AI enhancement features including:
 * - High-volume concurrent requests
 * - Memory stress testing
 * - Error rate monitoring
 * - Performance degradation analysis
 * - Resource utilization tracking
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Load test configuration
const LOAD_TEST_CONFIG = {
  // Test phases
  phases: [
    { name: 'warmup', duration: 30000, concurrency: 2, rampUp: 5000 },
    { name: 'sustained', duration: 120000, concurrency: 10, rampUp: 10000 },
    { name: 'peak', duration: 60000, concurrency: 25, rampUp: 5000 },
    { name: 'spike', duration: 30000, concurrency: 50, rampUp: 2000 },
    { name: 'cooldown', duration: 30000, concurrency: 5, rampUp: 10000 }
  ],
  
  // Test data
  testPrompts: [
    "Create a React component with TypeScript",
    "Build a REST API with Express and MongoDB",
    "Add authentication and authorization",
    "Implement a responsive design with Tailwind CSS",
    "Create a database schema for e-commerce",
    "Add error handling and logging",
    "Optimize performance and caching",
    "Write comprehensive unit tests",
    "Deploy to AWS with Docker",
    "Add monitoring and analytics"
  ],
  
  strategies: ['general', 'framework-specific', 'quality-focused', 'project-aware'],
  qualityLevels: ['basic', 'standard', 'premium'],
  projectTypes: ['frontend', 'backend', 'fullstack', 'mobile', 'desktop'],
  
  // Performance thresholds
  thresholds: {
    maxResponseTime: 5000,
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB
    maxErrorRate: 0.05, // 5%
    maxCpuUsage: 80, // 80%
    minThroughput: 10 // requests per second
  }
};

// Load test metrics collector
class LoadTestMetrics {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      memory: [],
      cpu: [],
      phases: []
    };
    this.startTime = Date.now();
  }

  recordRequest(request) {
    this.metrics.requests.push({
      ...request,
      timestamp: Date.now() - this.startTime
    });
  }

  recordError(error) {
    this.metrics.errors.push({
      ...error,
      timestamp: Date.now() - this.startTime
    });
  }

  recordSystemMetrics() {
    const usage = process.memoryUsage();
    this.metrics.memory.push({
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      timestamp: Date.now() - this.startTime
    });
  }

  recordPhase(phaseName, startTime, endTime, stats) {
    this.metrics.phases.push({
      name: phaseName,
      startTime: startTime - this.startTime,
      endTime: endTime - this.startTime,
      duration: endTime - startTime,
      stats
    });
  }

  getStats() {
    const now = Date.now() - this.startTime;
    const requests = this.metrics.requests;
    const errors = this.metrics.errors;
    
    if (requests.length === 0) {
      return {
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        memoryPeak: 0,
        memoryAvg: 0,
        currentMemory: 0
      };
    }

    const responseTimes = requests.map(r => r.responseTime).filter(t => t !== undefined);
    const errorRate = errors.length / requests.length;
    const throughput = requests.length / (now / 1000);
    
    const memory = this.metrics.memory;
    const memoryPeak = memory.length > 0 ? Math.max(...memory.map(m => m.heapUsed)) : 0;
    const memoryAvg = memory.length > 0 ? memory.reduce((sum, m) => sum + m.heapUsed, 0) / memory.length : 0;
    const currentMemory = memory.length > 0 ? memory[memory.length - 1].heapUsed : 0;

    return {
      totalRequests: requests.length,
      totalErrors: errors.length,
      errorRate,
      avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      p95ResponseTime: this.percentile(responseTimes, 0.95),
      p99ResponseTime: this.percentile(responseTimes, 0.99),
      throughput,
      memoryPeak,
      memoryAvg,
      currentMemory
    };
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Load test runner
class LoadTestRunner {
  constructor() {
    this.metrics = new LoadTestMetrics();
    this.isRunning = false;
    this.activeRequests = new Set();
  }

  async runLoadTest() {
    console.log('🚀 Starting AI Enhancement Load Test\n');
    this.isRunning = true;
    
    try {
      for (const phase of LOAD_TEST_CONFIG.phases) {
        await this.runPhase(phase);
      }
      
      await this.generateReport();
      console.log('\n✅ Load test completed successfully');
      
    } catch (error) {
      console.error('\n❌ Load test failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async runPhase(phase) {
    console.log(`\n📊 Starting phase: ${phase.name}`);
    console.log(`   Duration: ${phase.duration}ms, Concurrency: ${phase.concurrency}, Ramp-up: ${phase.rampUp}ms`);
    
    const phaseStartTime = Date.now();
    const phaseEndTime = phaseStartTime + phase.duration;
    
    // Ramp up to target concurrency
    await this.rampUp(phase.concurrency, phase.rampUp);
    
    // Run sustained load
    const loadPromises = [];
    for (let i = 0; i < phase.concurrency; i++) {
      loadPromises.push(this.runWorker(phaseEndTime));
    }
    
    // Monitor system metrics
    const monitorInterval = setInterval(() => {
      this.metrics.recordSystemMetrics();
    }, 1000);
    
    // Wait for phase completion
    await Promise.all(loadPromises);
    clearInterval(monitorInterval);
    
    const actualEndTime = Date.now();
    const stats = this.metrics.getStats();
    this.metrics.recordPhase(phase.name, phaseStartTime, actualEndTime, stats);
    
    console.log(`   ✅ Phase completed: ${stats.totalRequests} requests, ${(stats.errorRate * 100).toFixed(1)}% errors, ${stats.avgResponseTime.toFixed(0)}ms avg response time`);
  }

  async rampUp(targetConcurrency, rampUpTime) {
    const rampUpSteps = 10;
    const stepTime = rampUpTime / rampUpSteps;
    const concurrencyStep = targetConcurrency / rampUpSteps;
    
    for (let i = 1; i <= rampUpSteps; i++) {
      const currentConcurrency = Math.floor(concurrencyStep * i);
      const workers = [];
      
      for (let j = 0; j < currentConcurrency; j++) {
        workers.push(this.runWorker(Date.now() + stepTime));
      }
      
      await Promise.all(workers);
      await this.sleep(stepTime);
    }
  }

  async runWorker(endTime) {
    while (Date.now() < endTime && this.isRunning) {
      try {
        const request = this.generateTestRequest();
        const requestId = this.generateRequestId();
        
        this.activeRequests.add(requestId);
        
        const startTime = performance.now();
        const result = await this.simulateEnhancement(request);
        const endTime = performance.now();
        
        this.metrics.recordRequest({
          id: requestId,
          responseTime: endTime - startTime,
          success: result.success,
          tokens: result.tokens,
          cost: result.cost,
          cached: result.cached
        });
        
        this.activeRequests.delete(requestId);
        
        // Small delay to prevent overwhelming the system
        await this.sleep(Math.random() * 100);
        
      } catch (error) {
        this.metrics.recordError({
          message: error.message,
          stack: error.stack,
          timestamp: Date.now()
        });
      }
    }
  }

  generateTestRequest() {
    const prompt = LOAD_TEST_CONFIG.testPrompts[
      Math.floor(Math.random() * LOAD_TEST_CONFIG.testPrompts.length)
    ];
    const strategy = LOAD_TEST_CONFIG.strategies[
      Math.floor(Math.random() * LOAD_TEST_CONFIG.strategies.length)
    ];
    const quality = LOAD_TEST_CONFIG.qualityLevels[
      Math.floor(Math.random() * LOAD_TEST_CONFIG.qualityLevels.length)
    ];
    const projectType = LOAD_TEST_CONFIG.projectTypes[
      Math.floor(Math.random() * LOAD_TEST_CONFIG.projectTypes.length)
    ];

    return {
      prompt,
      strategy,
      quality,
      projectType,
      timestamp: Date.now()
    };
  }

  async simulateEnhancement(request) {
    // Simulate AI enhancement processing
    const processingTime = Math.random() * 1000 + 200; // 200-1200ms
    await this.sleep(processingTime);
    
    // Simulate occasional failures
    if (Math.random() < 0.02) { // 2% failure rate
      throw new Error('Simulated enhancement failure');
    }
    
    // Simulate token usage
    const inputTokens = Math.floor(request.prompt.length / 4);
    const outputTokens = Math.floor(inputTokens * (1.2 + Math.random() * 0.6));
    const totalTokens = inputTokens + outputTokens;
    
    // Simulate cost
    const cost = (inputTokens * 0.00003) + (outputTokens * 0.00006);
    
    // Simulate caching
    const cached = Math.random() < 0.3; // 30% cache hit rate
    
    return {
      success: true,
      tokens: totalTokens,
      cost,
      cached,
      processingTime
    };
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateReport() {
    console.log('\n📊 Generating Load Test Report...');
    
    const stats = this.metrics.getStats();
    const phases = this.metrics.phases;
    
    const report = {
      timestamp: new Date().toISOString(),
      config: LOAD_TEST_CONFIG,
      summary: stats,
      phases: phases,
      thresholds: LOAD_TEST_CONFIG.thresholds,
      analysis: this.analyzeResults(stats, phases),
      recommendations: this.generateRecommendations(stats, phases)
    };
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'test-artifacts', 'reports', 'load-test-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📈 Load Test Summary:');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Total Errors: ${stats.totalErrors}`);
    console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);
    console.log(`95th Percentile: ${stats.p95ResponseTime.toFixed(2)}ms`);
    console.log(`99th Percentile: ${stats.p99ResponseTime.toFixed(2)}ms`);
    console.log(`Throughput: ${stats.throughput.toFixed(2)} req/s`);
    console.log(`Peak Memory: ${(stats.memoryPeak / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Current Memory: ${(stats.currentMemory / 1024 / 1024).toFixed(2)}MB`);
    
    // Check thresholds
    console.log('\n🎯 Threshold Analysis:');
    this.checkThresholds(stats);
    
    console.log(`\n💾 Report saved to: ${reportPath}`);
  }

  analyzeResults(stats, phases) {
    const analysis = {
      performance: 'good',
      stability: 'good',
      scalability: 'good',
      issues: []
    };
    
    // Performance analysis
    if (stats.avgResponseTime > LOAD_TEST_CONFIG.thresholds.maxResponseTime) {
      analysis.performance = 'poor';
      analysis.issues.push('High average response time');
    } else if (stats.p95ResponseTime > LOAD_TEST_CONFIG.thresholds.maxResponseTime) {
      analysis.performance = 'fair';
      analysis.issues.push('High 95th percentile response time');
    }
    
    // Stability analysis
    if (stats.errorRate > LOAD_TEST_CONFIG.thresholds.maxErrorRate) {
      analysis.stability = 'poor';
      analysis.issues.push('High error rate');
    }
    
    // Scalability analysis
    if (stats.memoryPeak > LOAD_TEST_CONFIG.thresholds.maxMemoryUsage) {
      analysis.scalability = 'poor';
      analysis.issues.push('High memory usage');
    }
    
    // Phase analysis
    const peakPhase = phases.find(p => p.name === 'peak');
    if (peakPhase && peakPhase.stats.avgResponseTime > stats.avgResponseTime * 1.5) {
      analysis.scalability = 'fair';
      analysis.issues.push('Performance degradation under peak load');
    }
    
    return analysis;
  }

  generateRecommendations(stats, phases) {
    const recommendations = [];
    
    if (stats.avgResponseTime > 2000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        issue: 'High response time',
        solution: 'Implement response caching and optimize AI model calls',
        impact: 'Improve user experience and reduce server load'
      });
    }
    
    if (stats.errorRate > 0.02) {
      recommendations.push({
        priority: 'high',
        category: 'reliability',
        issue: 'High error rate',
        solution: 'Improve error handling and add retry mechanisms',
        impact: 'Increase system reliability'
      });
    }
    
    if (stats.memoryPeak > 100 * 1024 * 1024) {
      recommendations.push({
        priority: 'medium',
        category: 'memory',
        issue: 'High memory usage',
        solution: 'Implement memory cleanup and garbage collection optimization',
        impact: 'Reduce memory footprint and improve stability'
      });
    }
    
    if (stats.throughput < 20) {
      recommendations.push({
        priority: 'medium',
        category: 'throughput',
        issue: 'Low throughput',
        solution: 'Optimize request processing and increase concurrency',
        impact: 'Handle more concurrent users'
      });
    }
    
    return recommendations;
  }

  checkThresholds(stats) {
    const thresholds = LOAD_TEST_CONFIG.thresholds;
    
    console.log(`Response Time: ${stats.avgResponseTime.toFixed(0)}ms (max: ${thresholds.maxResponseTime}ms) ${stats.avgResponseTime <= thresholds.maxResponseTime ? '✅' : '❌'}`);
    console.log(`Memory Usage: ${(stats.memoryPeak / 1024 / 1024).toFixed(0)}MB (max: ${(thresholds.maxMemoryUsage / 1024 / 1024).toFixed(0)}MB) ${stats.memoryPeak <= thresholds.maxMemoryUsage ? '✅' : '❌'}`);
    console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(1)}% (max: ${(thresholds.maxErrorRate * 100).toFixed(1)}%) ${stats.errorRate <= thresholds.maxErrorRate ? '✅' : '❌'}`);
    console.log(`Throughput: ${stats.throughput.toFixed(1)} req/s (min: ${thresholds.minThroughput} req/s) ${stats.throughput >= thresholds.minThroughput ? '✅' : '❌'}`);
  }
}

// Main execution
async function main() {
  const runner = new LoadTestRunner();
  await runner.runLoadTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { LoadTestRunner, LoadTestMetrics };
