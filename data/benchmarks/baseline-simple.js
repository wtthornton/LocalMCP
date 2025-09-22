#!/usr/bin/env node

/**
 * Simple Baseline Test - Captures Critical Findings
 * 
 * This establishes the baseline metrics for measuring improvements
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { writeFileSync } from 'fs';

// Test cases
const TEST_CASES = [
  {
    name: 'Simple Math',
    prompt: 'What is 2+2?',
    expectedMaxTokens: 20,
    shouldBeMinimal: true
  },
  {
    name: 'Simple HTML Button',
    prompt: 'How do I create a button?',
    expectedMaxTokens: 50,
    shouldBeMinimal: true
  },
  {
    name: 'React Component',
    prompt: 'Create a React component that displays a list of users with search functionality',
    expectedMaxTokens: 200,
    shouldBeModerate: true
  }
];

class SimpleBaselineTest {
  constructor() {
    this.enhanceTool = null;
    this.results = [];
  }

  async initialize() {
    console.log('🔧 Initializing Simple Baseline Test...');
    
    const logger = new Logger('Simple-Baseline');
    const config = new ConfigService();
    const mcpCompliance = new Context7MCPComplianceService(logger, config);
    const monitoring = new Context7MonitoringService(logger, config);
    const cache = new Context7AdvancedCacheService(logger, config, monitoring);
    
    this.enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      mcpCompliance,
      monitoring,
      cache
    );
    
    console.log('✅ Initialized\n');
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  async runTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Prompt: "${testCase.prompt}"`);

    const startTime = Date.now();
    const result = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: {},
      options: { maxTokens: 4000, includeMetadata: true }
    });
    const responseTime = Date.now() - startTime;

    const originalTokens = this.estimateTokens(testCase.prompt);
    const enhancedTokens = this.estimateTokens(result.enhanced_prompt);
    const tokenRatio = enhancedTokens / originalTokens;
    const tokenCost = enhancedTokens - originalTokens;

    // Check for over-engineering
    const isOverEngineered = testCase.shouldBeMinimal && tokenRatio > 5;
    const exceedsExpected = enhancedTokens > testCase.expectedMaxTokens;

    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log(`📊 Token Analysis:`);
    console.log(`   Original: ${originalTokens} tokens`);
    console.log(`   Enhanced: ${enhancedTokens} tokens`);
    console.log(`   Ratio: ${tokenRatio.toFixed(2)}x`);
    console.log(`   Cost: ${tokenCost} tokens`);
    console.log(`   Expected Max: ${testCase.expectedMaxTokens} tokens`);
    
    console.log(`🎯 Assessment:`);
    console.log(`   Over-engineered: ${isOverEngineered ? '⚠️ YES' : '✅ No'}`);
    console.log(`   Exceeds expected: ${exceedsExpected ? '⚠️ YES' : '✅ No'}`);

    // Check framework detection
    const enhanced = result.enhanced_prompt.toLowerCase();
    const hasFrameworks = enhanced.includes('detected frameworks');
    const hasTypeScript = enhanced.includes('typescript');
    const hasReact = enhanced.includes('react');
    
    console.log(`🔍 Framework Detection:`);
    console.log(`   Has frameworks: ${hasFrameworks ? '✅' : '❌'}`);
    console.log(`   TypeScript detected: ${hasTypeScript ? '✅' : '❌'}`);
    console.log(`   React detected: ${hasReact ? '✅' : '❌'}`);

    const testResult = {
      name: testCase.name,
      prompt: testCase.prompt,
      originalTokens,
      enhancedTokens,
      tokenRatio,
      tokenCost,
      responseTime,
      isOverEngineered,
      exceedsExpected,
      hasFrameworks,
      hasTypeScript,
      hasReact,
      enhancedPrompt: result.enhanced_prompt.substring(0, 200) + '...'
    };

    this.results.push(testResult);
    return testResult;
  }

  generateReport() {
    const avgTokenRatio = this.results.reduce((sum, r) => sum + r.tokenRatio, 0) / this.results.length;
    const overEngineeredCount = this.results.filter(r => r.isOverEngineered).length;
    const exceedsExpectedCount = this.results.filter(r => r.exceedsExpected).length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;

    const report = {
      metadata: {
        testType: 'Simple Baseline Test',
        timestamp: new Date().toISOString(),
        description: 'PromptMCP baseline metrics for measuring improvements'
      },
      summary: {
        totalTests: this.results.length,
        averageTokenRatio: avgTokenRatio,
        averageResponseTime: avgResponseTime,
        overEngineeredCount,
        exceedsExpectedCount,
        overEngineeringRate: (overEngineeredCount / this.results.length) * 100
      },
      results: this.results,
      criticalFindings: this.identifyCriticalFindings(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  identifyCriticalFindings() {
    const findings = [];
    const avgTokenRatio = this.results.reduce((sum, r) => sum + r.tokenRatio, 0) / this.results.length;

    if (avgTokenRatio > 100) {
      findings.push({
        severity: 'CRITICAL',
        issue: 'Extreme token bloat',
        details: `Average token ratio: ${avgTokenRatio.toFixed(2)}x (should be <5x)`
      });
    }

    const overEngineeredCount = this.results.filter(r => r.isOverEngineered).length;
    if (overEngineeredCount > 0) {
      findings.push({
        severity: 'HIGH',
        issue: 'Simple tasks are over-engineered',
        details: `${overEngineeredCount}/${this.results.length} tests were over-engineered`
      });
    }

    const exceedsExpectedCount = this.results.filter(r => r.exceedsExpected).length;
    if (exceedsExpectedCount > 0) {
      findings.push({
        severity: 'HIGH',
        issue: 'Token usage exceeds expected limits',
        details: `${exceedsExpectedCount}/${this.results.length} tests exceeded expected token limits`
      });
    }

    return findings;
  }

  generateRecommendations() {
    const recommendations = [];
    const avgTokenRatio = this.results.reduce((sum, r) => sum + r.tokenRatio, 0) / this.results.length;

    if (avgTokenRatio > 50) {
      recommendations.push('Implement prompt complexity detection');
      recommendations.push('Add minimal enhancement mode for simple questions');
      recommendations.push('Set token budget constraints based on complexity');
    }

    const overEngineeredCount = this.results.filter(r => r.isOverEngineered).length;
    if (overEngineeredCount > 0) {
      recommendations.push('Add context necessity checks for simple tasks');
      recommendations.push('Implement LLMLingua-style compression');
    }

    return recommendations;
  }

  async runBaselineTest() {
    console.log('🔬 PromptMCP Simple Baseline Test');
    console.log('=' .repeat(50));
    console.log('Establishing baseline metrics for measuring improvements');
    console.log('=' .repeat(50));

    await this.initialize();

    // Run all tests
    for (const testCase of TEST_CASES) {
      await this.runTest(testCase);
    }

    // Generate report
    const report = this.generateReport();

    // Display summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 BASELINE SUMMARY');
    console.log('=' .repeat(50));
    
    const summary = report.summary;
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Average Token Ratio: ${summary.averageTokenRatio.toFixed(2)}x`);
    console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(1)}ms`);
    console.log(`Over-engineered Tests: ${summary.overEngineeredCount}/${summary.totalTests}`);
    console.log(`Exceeds Expected: ${summary.exceedsExpectedCount}/${summary.totalTests}`);
    console.log(`Over-Engineering Rate: ${summary.overEngineeringRate.toFixed(1)}%`);

    // Display critical findings
    console.log('\n🚨 CRITICAL FINDINGS:');
    report.criticalFindings.forEach((finding, index) => {
      console.log(`${index + 1}. [${finding.severity}] ${finding.issue}`);
      console.log(`   ${finding.details}`);
    });

    // Display recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promptmcp-baseline-${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(report, null, 2));

    console.log(`\n📄 Baseline report saved to: ${filename}`);
    console.log('=' .repeat(50));
    console.log('🎯 BASELINE ESTABLISHED - Use this to measure improvements!');
    console.log('=' .repeat(50));

    return report;
  }
}

// Run the baseline test
async function main() {
  const test = new SimpleBaselineTest();
  
  try {
    await test.runBaselineTest();
  } catch (error) {
    console.error('❌ Baseline test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
