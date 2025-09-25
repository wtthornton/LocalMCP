#!/usr/bin/env node

/**
 * Performance Testing Script for AI Enhancement Features
 * 
 * This script tests the performance of the AI enhancement features including:
 * - Response times for different enhancement strategies
 * - Token usage and cost optimization
 * - Cache effectiveness
 * - Error handling and fallback performance
 * - Memory usage and resource consumption
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  iterations: 10,
  concurrent: 5,
  testPrompts: [
    "Create a React component",
    "Build a REST API with Express",
    "Add authentication to my app",
    "Implement a database schema",
    "Create a responsive layout",
    "Add error handling",
    "Optimize performance",
    "Write unit tests",
    "Deploy to production",
    "Add logging"
  ],
  strategies: ['general', 'framework-specific', 'quality-focused', 'project-aware'],
  qualityLevels: ['basic', 'standard', 'premium'],
  projectTypes: ['frontend', 'backend', 'fullstack', 'mobile', 'desktop']
};

// Performance metrics collection
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      responseTimes: [],
      tokenUsage: [],
      costs: [],
      cacheHits: [],
      errors: [],
      memoryUsage: [],
      cpuUsage: []
    };
  }

  recordResponseTime(startTime, endTime) {
    const duration = endTime - startTime;
    this.metrics.responseTimes.push(duration);
    return duration;
  }

  recordTokenUsage(tokens) {
    this.metrics.tokenUsage.push(tokens);
  }

  recordCost(cost) {
    this.metrics.costs.push(cost);
  }

  recordCacheHit(hit) {
    this.metrics.cacheHits.push(hit);
  }

  recordError(error) {
    this.metrics.errors.push({
      message: error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  }

  recordMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      timestamp: Date.now()
    });
  }

  getStats() {
    const stats = {};
    
    // Response time statistics
    if (this.metrics.responseTimes.length > 0) {
      const times = this.metrics.responseTimes;
      stats.responseTime = {
        min: Math.min(...times),
        max: Math.max(...times),
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        p50: this.percentile(times, 0.5),
        p95: this.percentile(times, 0.95),
        p99: this.percentile(times, 0.99)
      };
    }

    // Token usage statistics
    if (this.metrics.tokenUsage.length > 0) {
      const tokens = this.metrics.tokenUsage;
      stats.tokenUsage = {
        min: Math.min(...tokens),
        max: Math.max(...tokens),
        avg: tokens.reduce((a, b) => a + b, 0) / tokens.length,
        total: tokens.reduce((a, b) => a + b, 0)
      };
    }

    // Cost statistics
    if (this.metrics.costs.length > 0) {
      const costs = this.metrics.costs;
      stats.cost = {
        min: Math.min(...costs),
        max: Math.max(...costs),
        avg: costs.reduce((a, b) => a + b, 0) / costs.length,
        total: costs.reduce((a, b) => a + b, 0)
      };
    }

    // Cache hit rate
    if (this.metrics.cacheHits.length > 0) {
      const hits = this.metrics.cacheHits.filter(h => h).length;
      stats.cacheHitRate = hits / this.metrics.cacheHits.length;
    }

    // Error rate
    stats.errorRate = this.metrics.errors.length / (this.metrics.responseTimes.length + this.metrics.errors.length);

    // Memory usage
    if (this.metrics.memoryUsage.length > 0) {
      const memory = this.metrics.memoryUsage;
      stats.memory = {
        peakRSS: Math.max(...memory.map(m => m.rss)),
        peakHeap: Math.max(...memory.map(m => m.heapUsed)),
        avgRSS: memory.reduce((a, b) => a + b.rss, 0) / memory.length,
        avgHeap: memory.reduce((a, b) => a + b.heapUsed, 0) / memory.length
      };
    }

    return stats;
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// Test runner class
class PerformanceTestRunner {
  constructor() {
    this.metrics = new PerformanceMetrics();
    this.results = [];
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    const startTime = performance.now();
    
    try {
      const result = await testFunction();
      const endTime = performance.now();
      const duration = this.metrics.recordResponseTime(startTime, endTime);
      
      console.log(`✅ ${testName} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.metrics.recordResponseTime(startTime, endTime);
      this.metrics.recordError(error);
      console.error(`❌ ${testName} failed:`, error.message);
      throw error;
    }
  }

  async runConcurrentTest(testName, testFunction, concurrency = 5) {
    console.log(`\n🚀 Running concurrent test: ${testName} (concurrency: ${concurrency})`);
    const startTime = performance.now();
    
    const promises = Array(concurrency).fill().map(async (_, index) => {
      try {
        return await testFunction(index);
      } catch (error) {
        this.metrics.recordError(error);
        throw error;
      }
    });

    try {
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = this.metrics.recordResponseTime(startTime, endTime);
      
      console.log(`✅ ${testName} completed in ${duration.toFixed(2)}ms`);
      return results;
    } catch (error) {
      const endTime = performance.now();
      this.metrics.recordResponseTime(startTime, endTime);
      this.metrics.recordError(error);
      console.error(`❌ ${testName} failed:`, error.message);
      throw error;
    }
  }

  async runLoadTest(testName, testFunction, iterations = 100) {
    console.log(`\n⚡ Running load test: ${testName} (iterations: ${iterations})`);
    const startTime = performance.now();
    
    const results = [];
    for (let i = 0; i < iterations; i++) {
      try {
        const result = await testFunction(i);
        results.push(result);
        
        // Record memory usage every 10 iterations
        if (i % 10 === 0) {
          this.metrics.recordMemoryUsage();
        }
      } catch (error) {
        this.metrics.recordError(error);
        console.error(`❌ Iteration ${i} failed:`, error.message);
      }
    }

    const endTime = performance.now();
    const duration = this.metrics.recordResponseTime(startTime, endTime);
    
    console.log(`✅ ${testName} completed in ${duration.toFixed(2)}ms`);
    return results;
  }
}

// Mock AI enhancement service for testing
class MockAIEnhancementService {
  constructor() {
    this.cache = new Map();
    this.callCount = 0;
  }

  async enhancePrompt(prompt, options = {}) {
    this.callCount++;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Simulate cache hit
    const cacheKey = `${prompt}-${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return { ...this.cache.get(cacheKey), cached: true };
    }

    // Simulate enhancement
    const enhanced = this.simulateEnhancement(prompt, options);
    this.cache.set(cacheKey, enhanced);
    
    return enhanced;
  }

  simulateEnhancement(prompt, options) {
    const startTime = performance.now();
    
    // Simulate token usage
    const inputTokens = prompt.length / 4; // Rough estimate
    const outputTokens = inputTokens * 1.5; // Enhanced prompt is typically longer
    const totalTokens = inputTokens + outputTokens;
    
    // Simulate cost (using GPT-4 pricing)
    const cost = (inputTokens * 0.00003) + (outputTokens * 0.00006);
    
    // Simulate enhancement
    const enhanced = `Enhanced: ${prompt}\n\n## AI Enhancement Details:\n- Strategy: ${options.strategy || 'general'}\n- Quality: ${options.quality || 'standard'}\n- Project Type: ${options.projectType || 'fullstack'}\n- Tokens Used: ${totalTokens}\n- Cost: $${cost.toFixed(6)}`;
    
    const endTime = performance.now();
    const processingTime = endTime - startTime;
    
    return {
      original: prompt,
      enhanced,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens
      },
      cost,
      processingTime,
      quality: Math.random() * 0.3 + 0.7, // 0.7-1.0
      confidence: Math.random() * 0.2 + 0.8, // 0.8-1.0
      cached: false
    };
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: this.callCount > 0 ? (this.callCount - this.cache.size) / this.callCount : 0
    };
  }
}

// Performance tests
class AIEnhancementPerformanceTests {
  constructor() {
    this.runner = new PerformanceTestRunner();
    this.mockService = new MockAIEnhancementService();
  }

  async runAllTests() {
    console.log('🚀 Starting AI Enhancement Performance Tests\n');
    
    try {
      // Test 1: Basic enhancement performance
      await this.testBasicEnhancement();
      
      // Test 2: Strategy performance comparison
      await this.testStrategyPerformance();
      
      // Test 3: Quality level performance
      await this.testQualityPerformance();
      
      // Test 4: Cache performance
      await this.testCachePerformance();
      
      // Test 5: Concurrent enhancement
      await this.testConcurrentEnhancement();
      
      // Test 6: Load testing
      await this.testLoadPerformance();
      
      // Test 7: Memory usage
      await this.testMemoryUsage();
      
      // Test 8: Error handling
      await this.testErrorHandling();
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Performance tests failed:', error);
      process.exit(1);
    }
  }

  async testBasicEnhancement() {
    await this.runner.runTest('Basic Enhancement', async () => {
      const prompt = "Create a React component";
      const result = await this.mockService.enhancePrompt(prompt);
      
      this.runner.metrics.recordTokenUsage(result.tokens.total);
      this.runner.metrics.recordCost(result.cost);
      this.runner.metrics.recordCacheHit(result.cached);
      
      return result;
    });
  }

  async testStrategyPerformance() {
    const strategies = ['general', 'framework-specific', 'quality-focused', 'project-aware'];
    
    for (const strategy of strategies) {
      await this.runner.runTest(`Strategy: ${strategy}`, async () => {
        const prompt = "Build a REST API";
        const result = await this.mockService.enhancePrompt(prompt, { strategy });
        
        this.runner.metrics.recordTokenUsage(result.tokens.total);
        this.runner.metrics.recordCost(result.cost);
        this.runner.metrics.recordCacheHit(result.cached);
        
        return result;
      });
    }
  }

  async testQualityPerformance() {
    const qualities = ['basic', 'standard', 'premium'];
    
    for (const quality of qualities) {
      await this.runner.runTest(`Quality: ${quality}`, async () => {
        const prompt = "Add authentication";
        const result = await this.mockService.enhancePrompt(prompt, { quality });
        
        this.runner.metrics.recordTokenUsage(result.tokens.total);
        this.runner.metrics.recordCost(result.cost);
        this.runner.metrics.recordCacheHit(result.cached);
        
        return result;
      });
    }
  }

  async testCachePerformance() {
    const prompt = "Create a login form";
    
    // First call (cache miss)
    await this.runner.runTest('Cache Miss', async () => {
      const result = await this.mockService.enhancePrompt(prompt);
      this.runner.metrics.recordCacheHit(result.cached);
      return result;
    });
    
    // Second call (cache hit)
    await this.runner.runTest('Cache Hit', async () => {
      const result = await this.mockService.enhancePrompt(prompt);
      this.runner.metrics.recordCacheHit(result.cached);
      return result;
    });
  }

  async testConcurrentEnhancement() {
    await this.runner.runConcurrentTest('Concurrent Enhancement', async (index) => {
      const prompt = TEST_CONFIG.testPrompts[index % TEST_CONFIG.testPrompts.length];
      const result = await this.mockService.enhancePrompt(prompt);
      
      this.runner.metrics.recordTokenUsage(result.tokens.total);
      this.runner.metrics.recordCost(result.cost);
      this.runner.metrics.recordCacheHit(result.cached);
      
      return result;
    }, TEST_CONFIG.concurrent);
  }

  async testLoadPerformance() {
    await this.runner.runLoadTest('Load Test', async (index) => {
      const prompt = TEST_CONFIG.testPrompts[index % TEST_CONFIG.testPrompts.length];
      const options = {
        strategy: TEST_CONFIG.strategies[index % TEST_CONFIG.strategies.length],
        quality: TEST_CONFIG.qualityLevels[index % TEST_CONFIG.qualityLevels.length],
        projectType: TEST_CONFIG.projectTypes[index % TEST_CONFIG.projectTypes.length]
      };
      
      const result = await this.mockService.enhancePrompt(prompt, options);
      
      this.runner.metrics.recordTokenUsage(result.tokens.total);
      this.runner.metrics.recordCost(result.cost);
      this.runner.metrics.recordCacheHit(result.cached);
      
      return result;
    }, 50);
  }

  async testMemoryUsage() {
    await this.runner.runTest('Memory Usage', async () => {
      // Record initial memory
      this.runner.metrics.recordMemoryUsage();
      
      // Perform memory-intensive operations
      const results = [];
      for (let i = 0; i < 100; i++) {
        const prompt = `Test prompt ${i}`;
        const result = await this.mockService.enhancePrompt(prompt);
        results.push(result);
        
        if (i % 20 === 0) {
          this.runner.metrics.recordMemoryUsage();
        }
      }
      
      // Record final memory
      this.runner.metrics.recordMemoryUsage();
      
      return results;
    });
  }

  async testErrorHandling() {
    await this.runner.runTest('Error Handling', async () => {
      // Test with invalid input
      try {
        await this.mockService.enhancePrompt(null);
      } catch (error) {
        this.runner.metrics.recordError(error);
      }
      
      // Test with empty string
      try {
        await this.mockService.enhancePrompt('');
      } catch (error) {
        this.runner.metrics.recordError(error);
      }
      
      return { errorHandling: 'tested' };
    });
  }

  async generateReport() {
    console.log('\n📊 Generating Performance Report...');
    
    const stats = this.runner.metrics.getStats();
    const cacheStats = this.mockService.getCacheStats();
    
    const report = {
      timestamp: new Date().toISOString(),
      testConfig: TEST_CONFIG,
      performance: stats,
      cache: cacheStats,
      recommendations: this.generateRecommendations(stats)
    };
    
    // Save report
    const reportPath = path.join(__dirname, '..', 'test-artifacts', 'reports', 'ai-enhancement-performance.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📈 Performance Summary:');
    console.log(`Response Time: ${stats.responseTime?.avg?.toFixed(2)}ms (avg), ${stats.responseTime?.p95?.toFixed(2)}ms (95th percentile)`);
    console.log(`Token Usage: ${stats.tokenUsage?.avg?.toFixed(0)} tokens (avg), ${stats.tokenUsage?.total} total`);
    console.log(`Cost: $${stats.cost?.total?.toFixed(6)} total, $${stats.cost?.avg?.toFixed(6)} per request`);
    console.log(`Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(1)}%`);
    console.log(`Memory Peak: ${(stats.memory?.peakRSS / 1024 / 1024).toFixed(2)}MB RSS, ${(stats.memory?.peakHeap / 1024 / 1024).toFixed(2)}MB Heap`);
    
    console.log(`\n💾 Report saved to: ${reportPath}`);
  }

  generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.responseTime?.avg > 1000) {
      recommendations.push({
        type: 'performance',
        issue: 'High response time',
        suggestion: 'Consider implementing response caching or optimizing AI model calls'
      });
    }
    
    if (stats.cacheHitRate < 0.5) {
      recommendations.push({
        type: 'caching',
        issue: 'Low cache hit rate',
        suggestion: 'Review cache key strategy and consider longer cache TTL'
      });
    }
    
    if (stats.errorRate > 0.05) {
      recommendations.push({
        type: 'reliability',
        issue: 'High error rate',
        suggestion: 'Improve error handling and add retry mechanisms'
      });
    }
    
    if (stats.memory?.peakRSS > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        type: 'memory',
        issue: 'High memory usage',
        suggestion: 'Consider implementing memory cleanup and garbage collection optimization'
      });
    }
    
    return recommendations;
  }
}

// Main execution
async function main() {
  const tests = new AIEnhancementPerformanceTests();
  await tests.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AIEnhancementPerformanceTests, PerformanceTestRunner, PerformanceMetrics };
