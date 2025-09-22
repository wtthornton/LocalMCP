#!/usr/bin/env node

/**
 * Comprehensive Quality Check Test
 * Tests the enhancement system with detailed call tree analysis and scoring
 * Uses the enhanced prompt: "create a new hello page that is fancy, modern and fun"
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';

class QualityCheckTest {
  constructor() {
    this.logger = new Logger('QualityCheckTest');
    this.config = new ConfigService();
    this.callTree = [];
    this.scores = {};
    this.startTime = Date.now();
  }

  logCall(method, context = {}) {
    const timestamp = Date.now() - this.startTime;
    const call = {
      timestamp,
      method,
      context,
      level: this.callTree.length
    };
    this.callTree.push(call);
    console.log(`[${timestamp}ms] ${'  '.repeat(this.callTree.length)}→ ${method}`, context);
  }

  logReturn(method, result, context = {}) {
    const timestamp = Date.now() - this.startTime;
    const call = {
      timestamp,
      method: `← ${method}`,
      result,
      context,
      level: this.callTree.length
    };
    this.callTree.push(call);
    console.log(`[${timestamp}ms] ${'  '.repeat(this.callTree.length)}← ${method}`, { result: typeof result, ...context });
  }

  calculateScore(category, value, maxValue, weight = 1) {
    const score = Math.min((value / maxValue) * 100, 100) * weight;
    this.scores[category] = score;
    return score;
  }

  async runComprehensiveTest() {
    console.log('🔍 Starting Comprehensive Quality Check Test\n');
    console.log('📝 Test Prompt: "create a new hello page that is fancy, modern and fun"\n');

    try {
      // Initialize services with call tracking
      this.logCall('initializeServices');
      const services = await this.initializeServices();
      this.logReturn('initializeServices', 'success', { services: Object.keys(services) });

      // Test Context7 integration
      this.logCall('testContext7Integration');
      const context7Results = await this.testContext7Integration(services);
      this.logReturn('testContext7Integration', context7Results);

      // Test enhancement tool
      this.logCall('testEnhancementTool');
      const enhancementResults = await this.testEnhancementTool(services);
      this.logReturn('testEnhancementTool', enhancementResults);

      // Analyze results and calculate scores
      this.logCall('analyzeResults');
      const analysis = this.analyzeResults(context7Results, enhancementResults);
      this.logReturn('analyzeResults', analysis);

      // Generate final report
      this.generateReport(analysis);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('🔍 Error details:', error);
    }
  }

  async initializeServices() {
    const mcpCompliance = new Context7MCPComplianceService(this.logger, this.config);
    const monitoring = new Context7MonitoringService(this.logger, this.config);
    const cache = new Context7AdvancedCacheService(this.logger, this.config);
    
    const enhanceTool = new EnhancedContext7EnhanceTool(
      this.logger,
      this.config,
      mcpCompliance,
      monitoring,
      cache
    );

    return { mcpCompliance, monitoring, cache, enhanceTool };
  }

  async testContext7Integration(services) {
    const results = {
      libraryResolution: { success: false, libraries: [], error: null },
      documentationRetrieval: { success: false, content: '', error: null },
      cachePerformance: { hits: 0, misses: 0, hitRate: 0 }
    };

    try {
      // Test library resolution
      this.logCall('resolveLibraryId', { libraryName: 'react' });
      const libraries = await services.mcpCompliance.resolveLibraryId('react');
      this.logReturn('resolveLibraryId', libraries.length, { count: libraries.length });
      
      results.libraryResolution.success = true;
      results.libraryResolution.libraries = libraries;

      // Test documentation retrieval
      if (libraries.length > 0) {
        const libraryId = libraries[0].id;
        this.logCall('getLibraryDocumentation', { libraryId, topic: 'components' });
        const docs = await services.mcpCompliance.getLibraryDocumentation(libraryId, 'components', 1000);
        this.logReturn('getLibraryDocumentation', docs.content.length, { contentLength: docs.content.length });
        
        results.documentationRetrieval.success = true;
        results.documentationRetrieval.content = docs.content;
      }

      // Test cache performance
      const cacheStats = services.cache.getCacheStats();
      results.cachePerformance = cacheStats;

    } catch (error) {
      console.error('Context7 integration test failed:', error.message);
      results.libraryResolution.error = error.message;
    }

    return results;
  }

  async testEnhancementTool(services) {
    const results = {
      enhancement: { success: false, response: null, error: null },
      contextUsed: { repo_facts: [], code_snippets: [], context7_docs: [] },
      performance: { responseTime: 0, memoryUsage: 0 }
    };

    try {
      const startTime = Date.now();
      
      this.logCall('enhance', { 
        prompt: 'create a new hello page that is fancy, modern and fun',
        context: { framework: 'react', style: 'modern' }
      });

      const response = await services.enhanceTool.enhance({
        prompt: 'create a new hello page that is fancy, modern and fun',
        context: {
          framework: 'react',
          style: 'modern'
        }
      });

      const responseTime = Date.now() - startTime;
      this.logReturn('enhance', response.success, { 
        responseTime, 
        contextLengths: {
          repo_facts: response.context_used.repo_facts.length,
          code_snippets: response.context_used.code_snippets.length,
          context7_docs: response.context_used.context7_docs.length
        }
      });

      results.enhancement.success = response.success;
      results.enhancement.response = response;
      results.contextUsed = response.context_used;
      results.performance.responseTime = responseTime;

    } catch (error) {
      console.error('Enhancement tool test failed:', error.message);
      results.enhancement.error = error.message;
    }

    return results;
  }

  analyzeResults(context7Results, enhancementResults) {
    const analysis = {
      context7Score: 0,
      enhancementScore: 0,
      overallScore: 0,
      issues: [],
      recommendations: []
    };

    // Context7 Analysis
    if (context7Results.libraryResolution.success) {
      analysis.context7Score += 30;
    } else {
      analysis.issues.push('Context7 library resolution failed');
    }

    if (context7Results.documentationRetrieval.success) {
      analysis.context7Score += 30;
    } else {
      analysis.issues.push('Context7 documentation retrieval failed');
    }

    if (context7Results.cachePerformance.hitRate > 0) {
      analysis.context7Score += 20;
    } else {
      analysis.issues.push('Context7 cache not working (0% hit rate)');
    }

    // Enhancement Analysis
    if (enhancementResults.enhancement.success) {
      analysis.enhancementScore += 40;
    } else {
      analysis.issues.push('Enhancement tool failed');
    }

    if (enhancementResults.contextUsed.context7_docs.length > 0) {
      analysis.enhancementScore += 30;
    } else {
      analysis.issues.push('Context7 docs not populated in enhancement');
    }

    if (enhancementResults.contextUsed.repo_facts.length > 0) {
      analysis.enhancementScore += 15;
    } else {
      analysis.issues.push('Repo facts not populated');
    }

    if (enhancementResults.contextUsed.code_snippets.length > 0) {
      analysis.enhancementScore += 15;
    } else {
      analysis.issues.push('Code snippets not populated');
    }

    // Performance Analysis
    if (enhancementResults.performance.responseTime < 1000) {
      analysis.enhancementScore += 10;
    } else {
      analysis.issues.push(`Response time too slow: ${enhancementResults.performance.responseTime}ms`);
    }

    analysis.overallScore = (analysis.context7Score + analysis.enhancementScore) / 2;

    // Generate recommendations
    if (analysis.context7Score < 50) {
      analysis.recommendations.push('Fix Context7 integration - check API connectivity and parsing');
    }
    if (enhancementResults.contextUsed.context7_docs.length === 0) {
      analysis.recommendations.push('Debug enhancement tool - Context7 docs not being called');
    }
    if (enhancementResults.performance.responseTime > 2000) {
      analysis.recommendations.push('Optimize performance - implement caching and parallel processing');
    }

    return analysis;
  }

  generateReport(analysis) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE QUALITY CHECK REPORT');
    console.log('='.repeat(80));

    console.log('\n🎯 SCORES:');
    console.log(`  Context7 Integration: ${analysis.context7Score.toFixed(1)}/100`);
    console.log(`  Enhancement Tool:     ${analysis.enhancementScore.toFixed(1)}/100`);
    console.log(`  Overall Score:        ${analysis.overallScore.toFixed(1)}/100`);

    console.log('\n📋 CALL TREE:');
    this.callTree.forEach(call => {
      const indent = '  '.repeat(call.level);
      const timestamp = call.timestamp.toString().padStart(4);
      console.log(`[${timestamp}ms] ${indent}${call.method}`);
      if (call.context && Object.keys(call.context).length > 0) {
        console.log(`[${timestamp}ms] ${indent}  Context:`, call.context);
      }
    });

    console.log('\n🚨 ISSUES FOUND:');
    if (analysis.issues.length === 0) {
      console.log('  ✅ No issues found!');
    } else {
      analysis.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (analysis.recommendations.length === 0) {
      console.log('  ✅ No recommendations - system is working optimally!');
    } else {
      analysis.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`  Total Test Time: ${Date.now() - this.startTime}ms`);
    console.log(`  Call Tree Depth: ${Math.max(...this.callTree.map(c => c.level)) + 1}`);
    console.log(`  Total Calls: ${this.callTree.length}`);

    console.log('\n' + '='.repeat(80));
    console.log('🏁 QUALITY CHECK COMPLETE');
    console.log('='.repeat(80));
  }
}

// Run the comprehensive test
const test = new QualityCheckTest();
test.runComprehensiveTest().catch(console.error);
