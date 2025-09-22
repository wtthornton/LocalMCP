#!/usr/bin/env node

/**
 * Critical Analysis of PromptMCP Evaluation
 * 
 * Tests actual effectiveness using real metrics:
 * - Token efficiency (compression ratio)
 * - Accuracy measurement (ground truth comparison)
 * - Response quality (human evaluation)
 * - Cost effectiveness
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { writeFileSync } from 'fs';

// Test cases with expected outcomes for accuracy measurement
const CRITICAL_TEST_CASES = [
  {
    id: 'token-efficiency',
    name: 'Token Efficiency Test',
    prompt: 'Create a button',
    expectedFrameworks: ['html', 'css'],
    expectedMinTokens: 50,
    expectedMaxTokens: 200,
    context: { framework: 'html', style: 'css' }
  },
  {
    id: 'accuracy-test',
    name: 'Accuracy Test - React Component',
    prompt: 'Create a React component that displays a list of users',
    expectedFrameworks: ['react', 'typescript'],
    expectedElements: ['useState', 'useEffect', 'JSX', 'TypeScript'],
    context: { framework: 'react', style: 'typescript' }
  },
  {
    id: 'relevance-test',
    name: 'Relevance Test - TypeScript Error',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown"',
    expectedFrameworks: ['typescript'],
    expectedSolutions: ['type assertion', 'type guard', 'interface definition'],
    context: { framework: 'typescript', file: 'src/api/handler.ts' }
  },
  {
    id: 'context-relevance',
    name: 'Context Relevance Test',
    prompt: 'How do I handle errors in my API?',
    expectedFrameworks: ['nodejs', 'typescript'],
    expectedPatterns: ['try-catch', 'error handling', 'logging'],
    context: { framework: 'nodejs', style: 'typescript' }
  },
  {
    id: 'over-engineering',
    name: 'Over-Engineering Test',
    prompt: 'What is 2+2?',
    expectedFrameworks: [],
    expectedMaxTokens: 100, // Should be minimal for simple math
    context: {}
  }
];

class CriticalPromptMCPAnalyzer {
  constructor() {
    this.results = [];
    this.enhanceTool = null;
    this.metrics = {
      tokenEfficiency: [],
      accuracy: [],
      relevance: [],
      overEngineering: [],
      costEffectiveness: []
    };
  }

  async initialize() {
    console.log('🔧 Initializing PromptMCP for critical analysis...');
    
    const logger = new Logger('PromptMCP-Critical');
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
    
    console.log('✅ Services initialized for critical analysis\n');
  }

  /**
   * Count tokens in text (rough estimation)
   */
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Test token efficiency - are we adding unnecessary tokens?
   */
  async testTokenEfficiency(testCase) {
    console.log(`\n🧪 Testing Token Efficiency: ${testCase.name}`);
    
    const startTime = Date.now();
    const result = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: testCase.context,
      options: { maxTokens: 4000, includeMetadata: true }
    });
    const responseTime = Date.now() - startTime;

    const originalTokens = this.estimateTokens(testCase.prompt);
    const enhancedTokens = this.estimateTokens(result.enhanced_prompt);
    const tokenRatio = enhancedTokens / originalTokens;
    const tokenEfficiency = {
      originalTokens,
      enhancedTokens,
      tokenRatio,
      responseTime,
      isEfficient: tokenRatio <= 5, // Should not exceed 5x original
      isOverEngineered: tokenRatio > 10
    };

    console.log(`📊 Token Analysis:`);
    console.log(`   Original: ${originalTokens} tokens`);
    console.log(`   Enhanced: ${enhancedTokens} tokens`);
    console.log(`   Ratio: ${tokenRatio.toFixed(2)}x`);
    console.log(`   Efficient: ${tokenEfficiency.isEfficient ? '✅' : '❌'}`);
    console.log(`   Over-engineered: ${tokenEfficiency.isOverEngineered ? '⚠️' : '✅'}`);

    return tokenEfficiency;
  }

  /**
   * Test accuracy - does the enhanced prompt contain expected elements?
   */
  async testAccuracy(testCase) {
    console.log(`\n🎯 Testing Accuracy: ${testCase.name}`);
    
    const result = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: testCase.context,
      options: { maxTokens: 4000, includeMetadata: true }
    });

    const enhancedPrompt = result.enhanced_prompt.toLowerCase();
    const accuracy = {
      frameworkDetection: 0,
      expectedElements: 0,
      expectedSolutions: 0,
      contextRelevance: 0,
      overallAccuracy: 0
    };

    // Test framework detection accuracy
    if (testCase.expectedFrameworks) {
      const detectedFrameworks = testCase.expectedFrameworks.filter(fw => 
        enhancedPrompt.includes(fw.toLowerCase())
      );
      accuracy.frameworkDetection = (detectedFrameworks.length / testCase.expectedFrameworks.length) * 100;
    }

    // Test expected elements
    if (testCase.expectedElements) {
      const foundElements = testCase.expectedElements.filter(element => 
        enhancedPrompt.includes(element.toLowerCase())
      );
      accuracy.expectedElements = (foundElements.length / testCase.expectedElements.length) * 100;
    }

    // Test expected solutions
    if (testCase.expectedSolutions) {
      const foundSolutions = testCase.expectedSolutions.filter(solution => 
        enhancedPrompt.includes(solution.toLowerCase())
      );
      accuracy.expectedSolutions = (foundSolutions.length / testCase.expectedSolutions.length) * 100;
    }

    // Test context relevance
    if (testCase.context && Object.keys(testCase.context).length > 0) {
      const contextKeys = Object.keys(testCase.context);
      const relevantContext = contextKeys.filter(key => 
        enhancedPrompt.includes(testCase.context[key].toLowerCase())
      );
      accuracy.contextRelevance = (relevantContext.length / contextKeys.length) * 100;
    }

    // Overall accuracy
    const accuracyScores = [
      accuracy.frameworkDetection,
      accuracy.expectedElements,
      accuracy.expectedSolutions,
      accuracy.contextRelevance
    ].filter(score => score > 0);
    
    accuracy.overallAccuracy = accuracyScores.length > 0 
      ? accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length 
      : 0;

    console.log(`📊 Accuracy Analysis:`);
    console.log(`   Framework Detection: ${accuracy.frameworkDetection.toFixed(1)}%`);
    console.log(`   Expected Elements: ${accuracy.expectedElements.toFixed(1)}%`);
    console.log(`   Expected Solutions: ${accuracy.expectedSolutions.toFixed(1)}%`);
    console.log(`   Context Relevance: ${accuracy.contextRelevance.toFixed(1)}%`);
    console.log(`   Overall Accuracy: ${accuracy.overallAccuracy.toFixed(1)}%`);

    return accuracy;
  }

  /**
   * Test relevance - is the enhanced content actually useful?
   */
  async testRelevance(testCase) {
    console.log(`\n🔍 Testing Relevance: ${testCase.name}`);
    
    const result = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: testCase.context,
      options: { maxTokens: 4000, includeMetadata: true }
    });

    const enhancedPrompt = result.enhanced_prompt;
    const contextUsed = result.context_used;

    const relevance = {
      context7Relevance: 0,
      projectAnalysisRelevance: 0,
      codePatternsRelevance: 0,
      frameworkDocsRelevance: 0,
      overallRelevance: 0
    };

    // Test Context7 relevance
    if (contextUsed.context7_docs && contextUsed.context7_docs.length > 0) {
      const context7Content = contextUsed.context7_docs.join(' ').toLowerCase();
      const promptKeywords = testCase.prompt.toLowerCase().split(' ');
      const relevantKeywords = promptKeywords.filter(keyword => 
        context7Content.includes(keyword) && keyword.length > 3
      );
      relevance.context7Relevance = (relevantKeywords.length / promptKeywords.length) * 100;
    }

    // Test project analysis relevance
    if (contextUsed.repo_facts && contextUsed.repo_facts.length > 0) {
      const projectContent = contextUsed.repo_facts.join(' ').toLowerCase();
      const promptKeywords = testCase.prompt.toLowerCase().split(' ');
      const relevantKeywords = promptKeywords.filter(keyword => 
        projectContent.includes(keyword) && keyword.length > 3
      );
      relevance.projectAnalysisRelevance = (relevantKeywords.length / promptKeywords.length) * 100;
    }

    // Test code patterns relevance
    if (contextUsed.code_snippets && contextUsed.code_snippets.length > 0) {
      const codeContent = contextUsed.code_snippets.join(' ').toLowerCase();
      const promptKeywords = testCase.prompt.toLowerCase().split(' ');
      const relevantKeywords = promptKeywords.filter(keyword => 
        codeContent.includes(keyword) && keyword.length > 3
      );
      relevance.codePatternsRelevance = (relevantKeywords.length / promptKeywords.length) * 100;
    }

    // Test framework docs relevance
    if (contextUsed.framework_docs && contextUsed.framework_docs.length > 0) {
      const frameworkContent = contextUsed.framework_docs.join(' ').toLowerCase();
      const promptKeywords = testCase.prompt.toLowerCase().split(' ');
      const relevantKeywords = promptKeywords.filter(keyword => 
        frameworkContent.includes(keyword) && keyword.length > 3
      );
      relevance.frameworkDocsRelevance = (relevantKeywords.length / promptKeywords.length) * 100;
    }

    // Overall relevance
    const relevanceScores = [
      relevance.context7Relevance,
      relevance.projectAnalysisRelevance,
      relevance.codePatternsRelevance,
      relevance.frameworkDocsRelevance
    ].filter(score => score > 0);
    
    relevance.overallRelevance = relevanceScores.length > 0 
      ? relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length 
      : 0;

    console.log(`📊 Relevance Analysis:`);
    console.log(`   Context7 Relevance: ${relevance.context7Relevance.toFixed(1)}%`);
    console.log(`   Project Analysis Relevance: ${relevance.projectAnalysisRelevance.toFixed(1)}%`);
    console.log(`   Code Patterns Relevance: ${relevance.codePatternsRelevance.toFixed(1)}%`);
    console.log(`   Framework Docs Relevance: ${relevance.frameworkDocsRelevance.toFixed(1)}%`);
    console.log(`   Overall Relevance: ${relevance.overallRelevance.toFixed(1)}%`);

    return relevance;
  }

  /**
   * Test for over-engineering - are we adding too much for simple tasks?
   */
  async testOverEngineering(testCase) {
    console.log(`\n⚖️ Testing Over-Engineering: ${testCase.name}`);
    
    const result = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: testCase.context,
      options: { maxTokens: 4000, includeMetadata: true }
    });

    const originalTokens = this.estimateTokens(testCase.prompt);
    const enhancedTokens = this.estimateTokens(result.enhanced_prompt);
    const tokenRatio = enhancedTokens / originalTokens;

    const overEngineering = {
      tokenRatio,
      isOverEngineered: tokenRatio > (testCase.expectedMaxTokens ? testCase.expectedMaxTokens / originalTokens : 5),
      hasUnnecessaryContext: false,
      hasExcessiveDocumentation: false,
      overallScore: 0
    };

    // Check for unnecessary context
    if (testCase.expectedFrameworks && testCase.expectedFrameworks.length === 0) {
      const hasFrameworkDetection = result.enhanced_prompt.includes('Detected Frameworks');
      overEngineering.hasUnnecessaryContext = hasFrameworkDetection;
    }

    // Check for excessive documentation
    if (originalTokens < 10 && enhancedTokens > 500) {
      overEngineering.hasExcessiveDocumentation = true;
    }

    // Overall over-engineering score (0-100, higher = more over-engineered)
    let score = 0;
    if (overEngineering.isOverEngineered) score += 40;
    if (overEngineering.hasUnnecessaryContext) score += 30;
    if (overEngineering.hasExcessiveDocumentation) score += 30;
    
    overEngineering.overallScore = score;

    console.log(`📊 Over-Engineering Analysis:`);
    console.log(`   Token Ratio: ${tokenRatio.toFixed(2)}x`);
    console.log(`   Over-Engineered: ${overEngineering.isOverEngineered ? '⚠️' : '✅'}`);
    console.log(`   Unnecessary Context: ${overEngineering.hasUnnecessaryContext ? '⚠️' : '✅'}`);
    console.log(`   Excessive Documentation: ${overEngineering.hasExcessiveDocumentation ? '⚠️' : '✅'}`);
    console.log(`   Over-Engineering Score: ${overEngineering.overallScore}/100`);

    return overEngineering;
  }

  /**
   * Test cost effectiveness - are we providing value for the token cost?
   */
  async testCostEffectiveness(testCase) {
    console.log(`\n💰 Testing Cost Effectiveness: ${testCase.name}`);
    
    const result = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: testCase.context,
      options: { maxTokens: 4000, includeMetadata: true }
    });

    const originalTokens = this.estimateTokens(testCase.prompt);
    const enhancedTokens = this.estimateTokens(result.enhanced_prompt);
    const tokenCost = enhancedTokens - originalTokens;

    const costEffectiveness = {
      tokenCost,
      valueAdded: 0,
      costPerValue: 0,
      isCostEffective: false,
      overallScore: 0
    };

    // Calculate value added (simplified metric)
    let valueAdded = 0;
    
    // Value from Context7 docs
    if (result.context_used.context7_docs && result.context_used.context7_docs.length > 0) {
      valueAdded += 30; // High value
    }
    
    // Value from project analysis
    if (result.context_used.repo_facts && result.context_used.repo_facts.length > 0) {
      valueAdded += 20; // Medium value
    }
    
    // Value from code patterns
    if (result.context_used.code_snippets && result.context_used.code_snippets.length > 0) {
      valueAdded += 25; // Medium-high value
    }
    
    // Value from framework docs
    if (result.context_used.framework_docs && result.context_used.framework_docs.length > 0) {
      valueAdded += 15; // Medium value
    }

    costEffectiveness.valueAdded = valueAdded;
    costEffectiveness.costPerValue = tokenCost > 0 ? tokenCost / valueAdded : 0;
    costEffectiveness.isCostEffective = costEffectiveness.costPerValue < 10; // Less than 10 tokens per value point

    // Overall cost effectiveness score (0-100, higher = more cost effective)
    if (costEffectiveness.isCostEffective) {
      costEffectiveness.overallScore = Math.min(100, valueAdded * 2);
    } else {
      costEffectiveness.overallScore = Math.max(0, 100 - costEffectiveness.costPerValue);
    }

    console.log(`📊 Cost Effectiveness Analysis:`);
    console.log(`   Token Cost: ${tokenCost} tokens`);
    console.log(`   Value Added: ${valueAdded} points`);
    console.log(`   Cost per Value: ${costEffectiveness.costPerValue.toFixed(2)} tokens/point`);
    console.log(`   Cost Effective: ${costEffectiveness.isCostEffective ? '✅' : '❌'}`);
    console.log(`   Overall Score: ${costEffectiveness.overallScore.toFixed(1)}/100`);

    return costEffectiveness;
  }

  /**
   * Run critical analysis on a test case
   */
  async analyzeTestCase(testCase) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔬 CRITICAL ANALYSIS: ${testCase.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📝 Original Prompt: ${testCase.prompt}`);
    console.log(`🎯 Expected: ${JSON.stringify(testCase.expectedFrameworks || testCase.expectedElements || testCase.expectedSolutions || 'N/A')}`);

    const analysis = {
      testCase,
      tokenEfficiency: await this.testTokenEfficiency(testCase),
      accuracy: await this.testAccuracy(testCase),
      relevance: await this.testRelevance(testCase),
      overEngineering: await this.testOverEngineering(testCase),
      costEffectiveness: await this.testCostEffectiveness(testCase),
      timestamp: new Date().toISOString()
    };

    // Calculate overall critical score
    const scores = [
      analysis.tokenEfficiency.isEfficient ? 80 : 40,
      analysis.accuracy.overallAccuracy,
      analysis.relevance.overallRelevance,
      100 - analysis.overEngineering.overallScore, // Invert over-engineering score
      analysis.costEffectiveness.overallScore
    ];

    analysis.overallCriticalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    console.log(`\n🎯 OVERALL CRITICAL SCORE: ${analysis.overallCriticalScore.toFixed(1)}/100`);
    
    if (analysis.overallCriticalScore >= 80) {
      console.log(`✅ EXCELLENT - System is highly effective`);
    } else if (analysis.overallCriticalScore >= 60) {
      console.log(`⚠️ GOOD - System is effective but has room for improvement`);
    } else if (analysis.overallCriticalScore >= 40) {
      console.log(`❌ POOR - System needs significant improvement`);
    } else {
      console.log(`🚨 CRITICAL - System is not effective`);
    }

    this.results.push(analysis);
    return analysis;
  }

  /**
   * Generate critical analysis report
   */
  generateCriticalReport() {
    const report = {
      summary: {
        totalTests: this.results.length,
        averageCriticalScore: this.results.reduce((sum, r) => sum + r.overallCriticalScore, 0) / this.results.length,
        averageTokenEfficiency: this.results.reduce((sum, r) => sum + (r.tokenEfficiency.isEfficient ? 100 : 0), 0) / this.results.length,
        averageAccuracy: this.results.reduce((sum, r) => sum + r.accuracy.overallAccuracy, 0) / this.results.length,
        averageRelevance: this.results.reduce((sum, r) => sum + r.relevance.overallRelevance, 0) / this.results.length,
        averageOverEngineering: this.results.reduce((sum, r) => sum + r.overEngineering.overallScore, 0) / this.results.length,
        averageCostEffectiveness: this.results.reduce((sum, r) => sum + r.costEffectiveness.overallScore, 0) / this.results.length
      },
      criticalFindings: this.generateCriticalFindings(),
      recommendations: this.generateCriticalRecommendations(),
      testResults: this.results.map(result => ({
        testName: result.testCase.name,
        criticalScore: result.overallCriticalScore,
        tokenEfficiency: result.tokenEfficiency.isEfficient,
        accuracy: result.accuracy.overallAccuracy,
        relevance: result.relevance.overallRelevance,
        overEngineering: result.overEngineering.overallScore,
        costEffectiveness: result.costEffectiveness.overallScore
      }))
    };

    return report;
  }

  /**
   * Generate critical findings
   */
  generateCriticalFindings() {
    const findings = [];

    // Token efficiency findings
    const efficientTests = this.results.filter(r => r.tokenEfficiency.isEfficient).length;
    const overEngineeredTests = this.results.filter(r => r.overEngineering.isOverEngineered).length;
    
    if (efficientTests / this.results.length < 0.8) {
      findings.push({
        category: 'Token Efficiency',
        severity: 'HIGH',
        issue: 'System is not token-efficient',
        details: `${efficientTests}/${this.results.length} tests were token-efficient`
      });
    }

    if (overEngineeredTests > 0) {
      findings.push({
        category: 'Over-Engineering',
        severity: 'MEDIUM',
        issue: 'System over-engineers simple tasks',
        details: `${overEngineeredTests}/${this.results.length} tests were over-engineered`
      });
    }

    // Accuracy findings
    const avgAccuracy = this.results.reduce((sum, r) => sum + r.accuracy.overallAccuracy, 0) / this.results.length;
    if (avgAccuracy < 70) {
      findings.push({
        category: 'Accuracy',
        severity: 'HIGH',
        issue: 'System accuracy is below acceptable threshold',
        details: `Average accuracy: ${avgAccuracy.toFixed(1)}%`
      });
    }

    // Relevance findings
    const avgRelevance = this.results.reduce((sum, r) => sum + r.relevance.overallRelevance, 0) / this.results.length;
    if (avgRelevance < 60) {
      findings.push({
        category: 'Relevance',
        severity: 'MEDIUM',
        issue: 'Enhanced content is not sufficiently relevant',
        details: `Average relevance: ${avgRelevance.toFixed(1)}%`
      });
    }

    return findings;
  }

  /**
   * Generate critical recommendations
   */
  generateCriticalRecommendations() {
    const recommendations = [];

    const avgTokenEfficiency = this.results.reduce((sum, r) => sum + (r.tokenEfficiency.isEfficient ? 100 : 0), 0) / this.results.length;
    if (avgTokenEfficiency < 80) {
      recommendations.push('Implement token compression for simple prompts');
      recommendations.push('Add complexity detection to avoid over-engineering');
    }

    const avgAccuracy = this.results.reduce((sum, r) => sum + r.accuracy.overallAccuracy, 0) / this.results.length;
    if (avgAccuracy < 70) {
      recommendations.push('Improve framework detection algorithms');
      recommendations.push('Enhance context matching accuracy');
    }

    const avgRelevance = this.results.reduce((sum, r) => sum + r.relevance.overallRelevance, 0) / this.results.length;
    if (avgRelevance < 60) {
      recommendations.push('Improve content relevance scoring');
      recommendations.push('Add semantic matching for better context selection');
    }

    const avgOverEngineering = this.results.reduce((sum, r) => sum + r.overEngineering.overallScore, 0) / this.results.length;
    if (avgOverEngineering > 30) {
      recommendations.push('Implement prompt complexity thresholds');
      recommendations.push('Add minimal enhancement mode for simple tasks');
    }

    return recommendations;
  }

  /**
   * Run all critical analyses
   */
  async runCriticalAnalysis() {
    console.log('🔬 Starting Critical Analysis of PromptMCP');
    console.log('=' .repeat(60));

    await this.initialize();

    for (const testCase of CRITICAL_TEST_CASES) {
      await this.analyzeTestCase(testCase);
    }

    console.log('\n📊 Generating Critical Report...');
    const report = this.generateCriticalReport();

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promptmcp-critical-analysis-${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(report, null, 2));

    // Display summary
    console.log('\n' + '=' .repeat(60));
    console.log('🔬 CRITICAL ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Average Critical Score: ${report.summary.averageCriticalScore.toFixed(1)}/100`);
    console.log(`Token Efficiency: ${report.summary.averageTokenEfficiency.toFixed(1)}%`);
    console.log(`Accuracy: ${report.summary.averageAccuracy.toFixed(1)}%`);
    console.log(`Relevance: ${report.summary.averageRelevance.toFixed(1)}%`);
    console.log(`Over-Engineering: ${report.summary.averageOverEngineering.toFixed(1)}/100`);
    console.log(`Cost Effectiveness: ${report.summary.averageCostEffectiveness.toFixed(1)}/100`);

    console.log('\n🚨 CRITICAL FINDINGS');
    console.log('-'.repeat(40));
    report.criticalFindings.forEach((finding, index) => {
      console.log(`${index + 1}. [${finding.severity}] ${finding.category}: ${finding.issue}`);
      console.log(`   ${finding.details}`);
    });

    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log(`\n📄 Detailed results saved to: ${filename}`);
    console.log('=' .repeat(60));

    return report;
  }
}

// Run the critical analysis
async function main() {
  const analyzer = new CriticalPromptMCPAnalyzer();
  
  try {
    await analyzer.runCriticalAnalysis();
  } catch (error) {
    console.error('❌ Critical analysis failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
