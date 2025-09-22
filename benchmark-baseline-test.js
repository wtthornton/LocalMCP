#!/usr/bin/env node

/**
 * PromptMCP Baseline Benchmark Test
 * 
 * This test establishes the current baseline performance metrics
 * to measure future improvements against.
 * 
 * Based on Context7 research and critical analysis findings.
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { writeFileSync } from 'fs';

// Baseline test cases covering all complexity levels
const BASELINE_TEST_CASES = [
  {
    id: 'simple-math',
    name: 'Simple Math Question',
    prompt: 'What is 2+2?',
    expectedComplexity: 'minimal',
    expectedFrameworks: [],
    expectedMaxTokens: 20,
    shouldBeMinimal: true
  },
  {
    id: 'simple-html',
    name: 'Simple HTML Button',
    prompt: 'How do I create a button?',
    expectedComplexity: 'low',
    expectedFrameworks: ['html', 'css'],
    expectedMaxTokens: 50,
    shouldBeMinimal: true
  },
  {
    id: 'medium-react',
    name: 'Medium React Component',
    prompt: 'Create a React component that displays a list of users with search functionality',
    expectedComplexity: 'medium',
    expectedFrameworks: ['react', 'typescript'],
    expectedMaxTokens: 200,
    shouldBeModerate: true
  },
  {
    id: 'complex-fullstack',
    name: 'Complex Full-Stack Task',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    expectedComplexity: 'high',
    expectedFrameworks: ['nextjs', 'typescript', 'postgresql'],
    expectedMaxTokens: 500,
    shouldBeComprehensive: true
  },
  {
    id: 'debug-typescript',
    name: 'TypeScript Debug Task',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    expectedComplexity: 'medium',
    expectedFrameworks: ['typescript'],
    expectedMaxTokens: 150,
    shouldBeModerate: true
  }
];

class PromptMCPBaselineBenchmark {
  constructor() {
    this.enhanceTool = null;
    this.results = [];
    this.baselineMetrics = {};
  }

  async initialize() {
    console.log('🔧 Initializing PromptMCP Baseline Benchmark...');
    
    const logger = new Logger('Baseline-Benchmark');
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
    
    console.log('✅ Services initialized\n');
  }

  estimateTokens(text) {
    // Consistent token estimation based on Context7 research
    return Math.ceil(text.length / 4);
  }

  calculateTokenEfficiency(original, enhanced) {
    const originalTokens = this.estimateTokens(original);
    const enhancedTokens = this.estimateTokens(enhanced);
    return {
      originalTokens,
      enhancedTokens,
      tokenRatio: enhancedTokens / originalTokens,
      tokenCost: enhancedTokens - originalTokens,
      compressionEfficiency: originalTokens / enhancedTokens
    };
  }

  measureFrameworkDetectionAccuracy(enhancedPrompt, expectedFrameworks) {
    if (!expectedFrameworks || expectedFrameworks.length === 0) {
      // For simple questions, check if no frameworks were detected
      const hasFrameworks = enhancedPrompt.includes('Detected Frameworks') && 
                           enhancedPrompt.includes('Frameworks:') &&
                           !enhancedPrompt.includes('Frameworks: \n- **Frameworks**: \n');
      return hasFrameworks ? 0 : 100; // 100% if no frameworks detected (correct)
    }

    const enhanced = enhancedPrompt.toLowerCase();
    const expectedSet = new Set(expectedFrameworks.map(f => f.toLowerCase()));
    
    // Extract detected frameworks from the prompt
    const frameworkMatch = enhancedPrompt.match(/Frameworks[:\s]*([^\n]+)/i);
    const detectedFrameworks = frameworkMatch ? 
      frameworkMatch[1].split(/[,\s]+/).filter(f => f.trim().length > 0) : [];
    
    const detectedSet = new Set(detectedFrameworks.map(f => f.toLowerCase()));
    const intersection = new Set([...expectedSet].filter(x => detectedSet.has(x)));
    const union = new Set([...expectedSet, ...detectedSet]);
    
    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  }

  measureContentRelevance(enhancedPrompt, originalPrompt, expectedFrameworks) {
    const original = originalPrompt.toLowerCase();
    const enhanced = enhancedPrompt.toLowerCase();
    
    // Extract key terms from original prompt
    const originalTerms = original.split(/\s+/).filter(term => 
      term.length > 3 && !['the', 'and', 'or', 'but', 'for', 'with', 'from', 'this', 'that'].includes(term)
    );

    let relevanceScore = 0;
    let checks = 0;

    // Check if enhanced content relates to original terms
    const relevantTerms = originalTerms.filter(term => 
      enhanced.includes(term) || 
      enhanced.includes(term + 's') || 
      enhanced.includes(term + 'ing')
    );
    
    if (originalTerms.length > 0) {
      relevanceScore += (relevantTerms.length / originalTerms.length) * 100;
      checks++;
    }

    // Check framework relevance
    if (expectedFrameworks && expectedFrameworks.length > 0) {
      const frameworkRelevant = expectedFrameworks.filter(fw => 
        enhanced.includes(fw.toLowerCase())
      );
      relevanceScore += (frameworkRelevant.length / expectedFrameworks.length) * 100;
      checks++;
    } else {
      // For simple questions, check if no unnecessary frameworks were added
      const hasUnnecessaryFrameworks = enhanced.includes('typescript') || 
                                      enhanced.includes('react') || 
                                      enhanced.includes('nextjs');
      if (!hasUnnecessaryFrameworks) {
        relevanceScore += 100;
      }
      checks++;
    }

    return checks > 0 ? relevanceScore / checks : 0;
  }

  measureOverEngineering(enhancedPrompt, testCase) {
    const tokens = this.estimateTokens(enhancedPrompt);
    let overEngineeringScore = 0;

    // Check token over-engineering
    if (testCase.expectedMaxTokens && tokens > testCase.expectedMaxTokens) {
      const excessRatio = (tokens - testCase.expectedMaxTokens) / testCase.expectedMaxTokens;
      overEngineeringScore += Math.min(100, excessRatio * 100);
    }

    // Check for unnecessary complexity in simple tasks
    if (testCase.shouldBeMinimal) {
      const hasFrameworks = enhancedPrompt.includes('Detected Frameworks');
      const hasProjectAnalysis = enhancedPrompt.includes('Project Analysis');
      const hasCodePatterns = enhancedPrompt.includes('Code Patterns');
      const hasFrameworkDocs = enhancedPrompt.includes('Framework Best Practices');
      
      if (hasFrameworks) overEngineeringScore += 25;
      if (hasProjectAnalysis) overEngineeringScore += 25;
      if (hasCodePatterns) overEngineeringScore += 25;
      if (hasFrameworkDocs) overEngineeringScore += 25;
    }

    return Math.min(100, overEngineeringScore);
  }

  measureCostEffectiveness(enhancedPrompt, testCase, contextUsed) {
    const tokens = this.estimateTokens(enhancedPrompt);
    const originalTokens = this.estimateTokens(testCase.prompt);
    const tokenCost = tokens - originalTokens;

    let valueAdded = 0;
    
    // Value from Context7 docs
    if (contextUsed.context7_docs && contextUsed.context7_docs.length > 0) {
      valueAdded += 30;
    }
    
    // Value from project analysis
    if (contextUsed.repo_facts && contextUsed.repo_facts.length > 0) {
      valueAdded += 20;
    }
    
    // Value from code patterns
    if (contextUsed.code_snippets && contextUsed.code_snippets.length > 0) {
      valueAdded += 25;
    }
    
    // Value from framework docs
    if (contextUsed.framework_docs && contextUsed.framework_docs.length > 0) {
      valueAdded += 15;
    }

    // Adjust value based on relevance
    const relevance = this.measureContentRelevance(enhancedPrompt, testCase.prompt, testCase.expectedFrameworks);
    valueAdded = valueAdded * (relevance / 100);

    const costPerValue = tokenCost > 0 ? tokenCost / valueAdded : 0;
    const isCostEffective = costPerValue < 2; // Less than 2 tokens per value point

    return {
      tokenCost,
      valueAdded,
      costPerValue,
      isCostEffective,
      efficiencyScore: isCostEffective ? Math.min(100, valueAdded * 1.2) : Math.max(0, 100 - (costPerValue * 2))
    };
  }

  async runBaselineTest(testCase) {
    console.log(`\n🧪 Running Baseline Test: ${testCase.name}`);
    console.log(`📝 Prompt: "${testCase.prompt}"`);

    const startTime = Date.now();
    const result = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: {},
      options: { maxTokens: 4000, includeMetadata: true }
    });
    const responseTime = Date.now() - startTime;

    // Calculate all metrics
    const tokenEfficiency = this.calculateTokenEfficiency(testCase.prompt, result.enhanced_prompt);
    const frameworkAccuracy = this.measureFrameworkDetectionAccuracy(result.enhanced_prompt, testCase.expectedFrameworks);
    const contentRelevance = this.measureContentRelevance(result.enhanced_prompt, testCase.prompt, testCase.expectedFrameworks);
    const overEngineering = this.measureOverEngineering(result.enhanced_prompt, testCase);
    const costEffectiveness = this.measureCostEffectiveness(result.enhanced_prompt, testCase, result.context_used);

    // Calculate overall effectiveness score
    const effectivenessScore = Math.max(0, 
      (100 - overEngineering) * 0.3 + 
      frameworkAccuracy * 0.25 + 
      contentRelevance * 0.25 + 
      costEffectiveness.efficiencyScore * 0.2
    );

    const testResult = {
      testCase: {
        id: testCase.id,
        name: testCase.name,
        prompt: testCase.prompt,
        expectedComplexity: testCase.expectedComplexity,
        expectedFrameworks: testCase.expectedFrameworks,
        expectedMaxTokens: testCase.expectedMaxTokens
      },
      metrics: {
        responseTime,
        tokenEfficiency,
        frameworkAccuracy,
        contentRelevance,
        overEngineering,
        costEffectiveness,
        effectivenessScore
      },
      rawResult: {
        enhanced_prompt: result.enhanced_prompt,
        context_used: result.context_used
      },
      timestamp: new Date().toISOString()
    };

    // Display results
    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log(`📊 Token Efficiency:`);
    console.log(`   Original: ${tokenEfficiency.originalTokens} tokens`);
    console.log(`   Enhanced: ${tokenEfficiency.enhancedTokens} tokens`);
    console.log(`   Ratio: ${tokenEfficiency.tokenRatio.toFixed(2)}x`);
    console.log(`   Cost: ${tokenEfficiency.tokenCost} tokens`);
    
    console.log(`🎯 Quality Metrics:`);
    console.log(`   Framework Accuracy: ${frameworkAccuracy.toFixed(1)}%`);
    console.log(`   Content Relevance: ${contentRelevance.toFixed(1)}%`);
    console.log(`   Over-Engineering: ${overEngineering.toFixed(1)}/100`);
    console.log(`   Cost Effectiveness: ${costEffectiveness.efficiencyScore.toFixed(1)}/100`);
    console.log(`   Overall Effectiveness: ${effectivenessScore.toFixed(1)}/100`);

    // Assessment
    if (effectivenessScore >= 80) {
      console.log(`✅ EXCELLENT: Highly effective enhancement`);
    } else if (effectivenessScore >= 60) {
      console.log(`⚠️ GOOD: Effective but room for improvement`);
    } else if (effectivenessScore >= 40) {
      console.log(`❌ POOR: Needs significant improvement`);
    } else {
      console.log(`🚨 CRITICAL: Not effective`);
    }

    this.results.push(testResult);
    return testResult;
  }

  calculateBaselineMetrics() {
    const metrics = {
      summary: {
        totalTests: this.results.length,
        averageResponseTime: this.results.reduce((sum, r) => sum + r.metrics.responseTime, 0) / this.results.length,
        averageTokenRatio: this.results.reduce((sum, r) => sum + r.metrics.tokenEfficiency.tokenRatio, 0) / this.results.length,
        averageFrameworkAccuracy: this.results.reduce((sum, r) => sum + r.metrics.frameworkAccuracy, 0) / this.results.length,
        averageContentRelevance: this.results.reduce((sum, r) => sum + r.metrics.contentRelevance, 0) / this.results.length,
        averageOverEngineering: this.results.reduce((sum, r) => sum + r.metrics.overEngineering, 0) / this.results.length,
        averageCostEffectiveness: this.results.reduce((sum, r) => sum + r.metrics.costEffectiveness.efficiencyScore, 0) / this.results.length,
        averageEffectiveness: this.results.reduce((sum, r) => sum + r.metrics.effectivenessScore, 0) / this.results.length
      },
      byComplexity: {
        simple: this.results.filter(r => r.testCase.expectedComplexity === 'minimal' || r.testCase.expectedComplexity === 'low'),
        medium: this.results.filter(r => r.testCase.expectedComplexity === 'medium'),
        complex: this.results.filter(r => r.testCase.expectedComplexity === 'high')
      },
      criticalIssues: this.identifyCriticalIssues(),
      recommendations: this.generateBaselineRecommendations()
    };

    // Calculate complexity-specific metrics
    Object.keys(metrics.byComplexity).forEach(complexity => {
      const tests = metrics.byComplexity[complexity];
      if (tests.length > 0) {
        metrics.byComplexity[complexity] = {
          count: tests.length,
          averageTokenRatio: tests.reduce((sum, r) => sum + r.metrics.tokenEfficiency.tokenRatio, 0) / tests.length,
          averageFrameworkAccuracy: tests.reduce((sum, r) => sum + r.metrics.frameworkAccuracy, 0) / tests.length,
          averageOverEngineering: tests.reduce((sum, r) => sum + r.metrics.overEngineering, 0) / tests.length,
          averageEffectiveness: tests.reduce((sum, r) => sum + r.metrics.effectivenessScore, 0) / tests.length
        };
      }
    });

    this.baselineMetrics = metrics;
    return metrics;
  }

  identifyCriticalIssues() {
    const issues = [];

    // Token efficiency issues
    const avgTokenRatio = this.baselineMetrics.summary.averageTokenRatio;
    if (avgTokenRatio > 5) {
      issues.push({
        category: 'Token Efficiency',
        severity: 'HIGH',
        issue: 'Average token ratio is too high',
        current: avgTokenRatio.toFixed(2) + 'x',
        target: '<3.0x'
      });
    }

    // Framework accuracy issues
    const avgFrameworkAccuracy = this.baselineMetrics.summary.averageFrameworkAccuracy;
    if (avgFrameworkAccuracy < 70) {
      issues.push({
        category: 'Framework Accuracy',
        severity: 'HIGH',
        issue: 'Framework detection accuracy is too low',
        current: avgFrameworkAccuracy.toFixed(1) + '%',
        target: '>80%'
      });
    }

    // Over-engineering issues
    const avgOverEngineering = this.baselineMetrics.summary.averageOverEngineering;
    if (avgOverEngineering > 30) {
      issues.push({
        category: 'Over-Engineering',
        severity: 'MEDIUM',
        issue: 'System is over-engineering responses',
        current: avgOverEngineering.toFixed(1) + '/100',
        target: '<20/100'
      });
    }

    // Simple task issues
    const simpleTests = this.baselineMetrics.byComplexity.simple;
    if (simpleTests && simpleTests.averageTokenRatio && simpleTests.averageTokenRatio > 3) {
      issues.push({
        category: 'Simple Task Handling',
        severity: 'HIGH',
        issue: 'Simple tasks are being over-engineered',
        current: simpleTests.averageTokenRatio.toFixed(2) + 'x',
        target: '<2.0x'
      });
    }

    return issues;
  }

  generateBaselineRecommendations() {
    const recommendations = [];

    if (this.baselineMetrics.summary.averageTokenRatio > 3) {
      recommendations.push('Implement prompt complexity detection');
      recommendations.push('Add minimal enhancement mode for simple questions');
      recommendations.push('Set token budget constraints based on complexity');
    }

    if (this.baselineMetrics.summary.averageFrameworkAccuracy < 70) {
      recommendations.push('Improve framework detection algorithms');
      recommendations.push('Add confidence scoring for framework detection');
      recommendations.push('Implement fallback mechanisms for unclear cases');
    }

    if (this.baselineMetrics.summary.averageOverEngineering > 30) {
      recommendations.push('Add context necessity checks');
      recommendations.push('Implement LLMLingua-style compression');
      recommendations.push('Add over-engineering detection');
    }

    return recommendations;
  }

  generateBaselineReport() {
    const report = {
      metadata: {
        testType: 'Baseline Benchmark',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        description: 'PromptMCP baseline performance metrics for measuring improvements'
      },
      baselineMetrics: this.baselineMetrics,
      testResults: this.results,
      criticalIssues: this.baselineMetrics.criticalIssues,
      recommendations: this.baselineMetrics.recommendations
    };

    return report;
  }

  async runBaselineBenchmark() {
    console.log('🔬 PromptMCP Baseline Benchmark Test');
    console.log('=' .repeat(60));
    console.log('This test establishes baseline metrics for measuring future improvements');
    console.log('=' .repeat(60));

    await this.initialize();

    // Run all baseline tests
    for (const testCase of BASELINE_TEST_CASES) {
      await this.runBaselineTest(testCase);
    }

    // Calculate baseline metrics
    console.log('\n📊 Calculating Baseline Metrics...');
    this.calculateBaselineMetrics();

    // Display summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 BASELINE BENCHMARK SUMMARY');
    console.log('=' .repeat(60));
    
    const summary = this.baselineMetrics.summary;
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(1)}ms`);
    console.log(`Average Token Ratio: ${summary.averageTokenRatio.toFixed(2)}x`);
    console.log(`Average Framework Accuracy: ${summary.averageFrameworkAccuracy.toFixed(1)}%`);
    console.log(`Average Content Relevance: ${summary.averageContentRelevance.toFixed(1)}%`);
    console.log(`Average Over-Engineering: ${summary.averageOverEngineering.toFixed(1)}/100`);
    console.log(`Average Cost Effectiveness: ${summary.averageCostEffectiveness.toFixed(1)}/100`);
    console.log(`Average Overall Effectiveness: ${summary.averageEffectiveness.toFixed(1)}/100`);

    // Display complexity-specific metrics
    console.log('\n📊 Complexity-Specific Metrics:');
    Object.entries(this.baselineMetrics.byComplexity).forEach(([complexity, metrics]) => {
      if (metrics.count > 0) {
        console.log(`\n${complexity.toUpperCase()} (${metrics.count} tests):`);
        console.log(`  Average Token Ratio: ${metrics.averageTokenRatio.toFixed(2)}x`);
        console.log(`  Average Framework Accuracy: ${metrics.averageFrameworkAccuracy.toFixed(1)}%`);
        console.log(`  Average Over-Engineering: ${metrics.averageOverEngineering.toFixed(1)}/100`);
        console.log(`  Average Effectiveness: ${metrics.averageEffectiveness.toFixed(1)}/100`);
      }
    });

    // Display critical issues
    console.log('\n🚨 Critical Issues Identified:');
    this.baselineMetrics.criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity}] ${issue.category}: ${issue.issue}`);
      console.log(`   Current: ${issue.current} | Target: ${issue.target}`);
    });

    // Display recommendations
    console.log('\n💡 Baseline Recommendations:');
    this.baselineMetrics.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Save baseline report
    const report = this.generateBaselineReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promptmcp-baseline-benchmark-${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(report, null, 2));

    console.log(`\n📄 Baseline report saved to: ${filename}`);
    console.log('=' .repeat(60));
    console.log('🎯 Baseline benchmark complete! Use this as your measurement baseline.');
    console.log('=' .repeat(60));

    return report;
  }
}

// Run the baseline benchmark
async function main() {
  const benchmark = new PromptMCPBaselineBenchmark();
  
  try {
    await benchmark.runBaselineBenchmark();
  } catch (error) {
    console.error('❌ Baseline benchmark failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
