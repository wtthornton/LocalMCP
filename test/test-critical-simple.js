#!/usr/bin/env node

/**
 * Simple Critical Analysis of PromptMCP
 * Focus on real metrics: token efficiency, accuracy, relevance
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';

// Simple test cases for critical analysis
const CRITICAL_TESTS = [
  {
    name: 'Simple Math Question',
    prompt: 'What is 2+2?',
    expectedMaxTokens: 50,
    shouldBeMinimal: true
  },
  {
    name: 'HTML Button Question',
    prompt: 'How do I create a button?',
    expectedFrameworks: ['html', 'css'],
    expectedMaxTokens: 200
  },
  {
    name: 'React Component Question',
    prompt: 'Create a React component for user list',
    expectedFrameworks: ['react', 'typescript'],
    expectedMaxTokens: 500
  }
];

class SimpleCriticalAnalyzer {
  constructor() {
    this.enhanceTool = null;
  }

  async initialize() {
    console.log('🔧 Initializing for critical analysis...');
    
    const logger = new Logger('Critical-Analysis');
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

  async analyzeTest(testCase) {
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

    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log(`📊 Token Analysis:`);
    console.log(`   Original: ${originalTokens} tokens`);
    console.log(`   Enhanced: ${enhancedTokens} tokens`);
    console.log(`   Ratio: ${tokenRatio.toFixed(2)}x`);

    // Check if over-engineered
    const isOverEngineered = testCase.shouldBeMinimal && tokenRatio > 5;
    const exceedsExpected = testCase.expectedMaxTokens && enhancedTokens > testCase.expectedMaxTokens;

    console.log(`🎯 Analysis:`);
    console.log(`   Over-engineered: ${isOverEngineered ? '⚠️ YES' : '✅ No'}`);
    console.log(`   Exceeds expected: ${exceedsExpected ? '⚠️ YES' : '✅ No'}`);

    // Check framework detection accuracy
    if (testCase.expectedFrameworks) {
      const enhancedLower = result.enhanced_prompt.toLowerCase();
      const detectedFrameworks = testCase.expectedFrameworks.filter(fw => 
        enhancedLower.includes(fw.toLowerCase())
      );
      const accuracy = (detectedFrameworks.length / testCase.expectedFrameworks.length) * 100;
      console.log(`   Framework Detection: ${accuracy.toFixed(1)}% (${detectedFrameworks.join(', ')})`);
    }

    // Check for unnecessary complexity
    const hasUnnecessaryContext = testCase.shouldBeMinimal && result.enhanced_prompt.includes('Detected Frameworks');
    console.log(`   Unnecessary Context: ${hasUnnecessaryContext ? '⚠️ YES' : '✅ No'}`);

    return {
      testCase,
      originalTokens,
      enhancedTokens,
      tokenRatio,
      responseTime,
      isOverEngineered,
      exceedsExpected,
      hasUnnecessaryContext
    };
  }

  async runAnalysis() {
    console.log('🔬 CRITICAL ANALYSIS: PromptMCP Effectiveness');
    console.log('=' .repeat(60));

    await this.initialize();

    const results = [];
    for (const testCase of CRITICAL_TESTS) {
      const result = await this.analyzeTest(testCase);
      results.push(result);
    }

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 CRITICAL ANALYSIS SUMMARY');
    console.log('=' .repeat(60));

    const avgTokenRatio = results.reduce((sum, r) => sum + r.tokenRatio, 0) / results.length;
    const overEngineeredCount = results.filter(r => r.isOverEngineered).length;
    const exceedsExpectedCount = results.filter(r => r.exceedsExpected).length;
    const unnecessaryContextCount = results.filter(r => r.hasUnnecessaryContext).length;

    console.log(`Average Token Ratio: ${avgTokenRatio.toFixed(2)}x`);
    console.log(`Over-engineered Tests: ${overEngineeredCount}/${results.length}`);
    console.log(`Exceeds Expected Tokens: ${exceedsExpectedCount}/${results.length}`);
    console.log(`Unnecessary Context: ${unnecessaryContextCount}/${results.length}`);

    // Critical assessment
    console.log('\n🎯 CRITICAL ASSESSMENT:');
    
    if (avgTokenRatio > 10) {
      console.log('❌ CRITICAL: System is extremely over-engineered');
    } else if (avgTokenRatio > 5) {
      console.log('⚠️ WARNING: System is over-engineered');
    } else if (avgTokenRatio > 2) {
      console.log('✅ ACCEPTABLE: System provides reasonable enhancement');
    } else {
      console.log('✅ EXCELLENT: System is token-efficient');
    }

    if (overEngineeredCount > 0) {
      console.log(`⚠️ WARNING: ${overEngineeredCount} tests were over-engineered`);
    }

    if (unnecessaryContextCount > 0) {
      console.log(`⚠️ WARNING: ${unnecessaryContextCount} tests added unnecessary context`);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (avgTokenRatio > 5) {
      console.log('1. Implement prompt complexity detection');
      console.log('2. Add minimal enhancement mode for simple questions');
      console.log('3. Set token ratio thresholds');
    }
    
    if (unnecessaryContextCount > 0) {
      console.log('4. Improve context relevance scoring');
      console.log('5. Add context necessity checks');
    }

    console.log('\n' + '=' .repeat(60));
    return results;
  }
}

// Run the analysis
async function main() {
  const analyzer = new SimpleCriticalAnalyzer();
  
  try {
    await analyzer.runAnalysis();
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

main();
