#!/usr/bin/env node

/**
 * Focused Critical Analysis of PromptMCP
 * Based on Context7 research on prompt evaluation metrics
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';

// Test cases based on Context7 research findings
const FOCUSED_TESTS = [
  {
    name: 'Simple Question (Should be minimal)',
    prompt: 'What is 2+2?',
    expectedMaxTokens: 30,
    shouldBeMinimal: true,
    expectedAccuracy: 100 // Should be perfect for simple math
  },
  {
    name: 'Basic HTML (Should be moderate)',
    prompt: 'Create a button in HTML',
    expectedFrameworks: ['html', 'css'],
    expectedMaxTokens: 150,
    expectedAccuracy: 80
  },
  {
    name: 'Complex React (Should be comprehensive)',
    prompt: 'Create a React component with TypeScript that fetches user data and displays it in a table with search functionality',
    expectedFrameworks: ['react', 'typescript'],
    expectedMaxTokens: 800,
    expectedAccuracy: 90
  }
];

class FocusedCriticalAnalyzer {
  constructor() {
    this.enhanceTool = null;
    this.results = [];
  }

  async initialize() {
    console.log('🔧 Initializing focused critical analysis...');
    
    const logger = new Logger('Focused-Critical');
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
    // More accurate token estimation based on Context7 research
    // Average: 1 token ≈ 4 characters for English, but varies by content
    const words = text.split(/\s+/).length;
    const chars = text.length;
    return Math.ceil(Math.max(words * 1.3, chars / 3.5));
  }

  calculateCompressionRatio(original, enhanced) {
    const originalTokens = this.estimateTokens(original);
    const enhancedTokens = this.estimateTokens(enhanced);
    return {
      originalTokens,
      enhancedTokens,
      ratio: enhancedTokens / originalTokens,
      compressionEfficiency: originalTokens / enhancedTokens
    };
  }

  measureAccuracy(enhancedPrompt, testCase) {
    const enhanced = enhancedPrompt.toLowerCase();
    let accuracy = 0;
    let checks = 0;

    // Check framework detection accuracy
    if (testCase.expectedFrameworks) {
      const detectedFrameworks = testCase.expectedFrameworks.filter(fw => 
        enhanced.includes(fw.toLowerCase())
      );
      accuracy += (detectedFrameworks.length / testCase.expectedFrameworks.length) * 100;
      checks++;
    }

    // Check for expected content based on prompt complexity
    if (testCase.shouldBeMinimal) {
      // For minimal prompts, check if it's not over-engineered
      const hasUnnecessaryFrameworks = enhanced.includes('detected frameworks');
      const hasExcessiveContext = enhanced.includes('project analysis') || enhanced.includes('code patterns');
      if (!hasUnnecessaryFrameworks && !hasExcessiveContext) {
        accuracy += 100;
      }
      checks++;
    } else {
      // For complex prompts, check for comprehensive enhancement
      const hasFrameworkDocs = enhanced.includes('framework') || enhanced.includes('documentation');
      const hasCodeExamples = enhanced.includes('code') || enhanced.includes('example');
      const hasBestPractices = enhanced.includes('best practice') || enhanced.includes('recommendation');
      
      let contentScore = 0;
      if (hasFrameworkDocs) contentScore += 33;
      if (hasCodeExamples) contentScore += 33;
      if (hasBestPractices) contentScore += 34;
      
      accuracy += contentScore;
      checks++;
    }

    return checks > 0 ? accuracy / checks : 0;
  }

  measureRelevance(enhancedPrompt, originalPrompt, contextUsed) {
    const original = originalPrompt.toLowerCase();
    const enhanced = enhancedPrompt.toLowerCase();
    
    // Extract key terms from original prompt
    const originalTerms = original.split(/\s+/).filter(term => 
      term.length > 3 && !['the', 'and', 'or', 'but', 'for', 'with', 'from'].includes(term)
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

    // Check context relevance
    if (contextUsed.context7_docs && contextUsed.context7_docs.length > 0) {
      const contextContent = contextUsed.context7_docs.join(' ').toLowerCase();
      const contextRelevantTerms = originalTerms.filter(term => 
        contextContent.includes(term)
      );
      
      if (originalTerms.length > 0) {
        relevanceScore += (contextRelevantTerms.length / originalTerms.length) * 100;
        checks++;
      }
    }

    return checks > 0 ? relevanceScore / checks : 0;
  }

  measureOverEngineering(enhancedPrompt, testCase) {
    const tokens = this.estimateTokens(enhancedPrompt);
    let overEngineeringScore = 0;

    // Check token over-engineering
    if (testCase.expectedMaxTokens && tokens > testCase.expectedMaxTokens) {
      overEngineeringScore += 50;
    }

    // Check for unnecessary complexity in simple tasks
    if (testCase.shouldBeMinimal) {
      const hasFrameworks = enhancedPrompt.includes('Detected Frameworks');
      const hasProjectAnalysis = enhancedPrompt.includes('Project Analysis');
      const hasCodePatterns = enhancedPrompt.includes('Code Patterns');
      
      if (hasFrameworks) overEngineeringScore += 20;
      if (hasProjectAnalysis) overEngineeringScore += 20;
      if (hasCodePatterns) overEngineeringScore += 10;
    }

    return Math.min(100, overEngineeringScore);
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

    // Calculate metrics
    const tokenMetrics = this.calculateCompressionRatio(testCase.prompt, result.enhanced_prompt);
    const accuracy = this.measureAccuracy(result.enhanced_prompt, testCase);
    const relevance = this.measureRelevance(result.enhanced_prompt, testCase.prompt, result.context_used);
    const overEngineering = this.measureOverEngineering(result.enhanced_prompt, testCase);

    // Calculate overall effectiveness score
    const effectivenessScore = Math.max(0, 100 - overEngineering) * 0.4 + 
                              accuracy * 0.3 + 
                              relevance * 0.3;

    console.log(`⏱️  Response Time: ${responseTime}ms`);
    console.log(`📊 Token Metrics:`);
    console.log(`   Original: ${tokenMetrics.originalTokens} tokens`);
    console.log(`   Enhanced: ${tokenMetrics.enhancedTokens} tokens`);
    console.log(`   Ratio: ${tokenMetrics.ratio.toFixed(2)}x`);
    console.log(`   Compression Efficiency: ${tokenMetrics.compressionEfficiency.toFixed(2)}x`);

    console.log(`🎯 Quality Metrics:`);
    console.log(`   Accuracy: ${accuracy.toFixed(1)}%`);
    console.log(`   Relevance: ${relevance.toFixed(1)}%`);
    console.log(`   Over-Engineering: ${overEngineering.toFixed(1)}/100`);
    console.log(`   Effectiveness Score: ${effectivenessScore.toFixed(1)}/100`);

    // Critical assessment
    if (effectivenessScore >= 80) {
      console.log(`✅ EXCELLENT: Highly effective enhancement`);
    } else if (effectivenessScore >= 60) {
      console.log(`⚠️ GOOD: Effective but room for improvement`);
    } else if (effectivenessScore >= 40) {
      console.log(`❌ POOR: Needs significant improvement`);
    } else {
      console.log(`🚨 CRITICAL: Not effective`);
    }

    const analysis = {
      testCase,
      tokenMetrics,
      accuracy,
      relevance,
      overEngineering,
      effectivenessScore,
      responseTime,
      contextUsed: result.context_used
    };

    this.results.push(analysis);
    return analysis;
  }

  generateCriticalReport() {
    const avgEffectiveness = this.results.reduce((sum, r) => sum + r.effectivenessScore, 0) / this.results.length;
    const avgAccuracy = this.results.reduce((sum, r) => sum + r.accuracy, 0) / this.results.length;
    const avgRelevance = this.results.reduce((sum, r) => sum + r.relevance, 0) / this.results.length;
    const avgOverEngineering = this.results.reduce((sum, r) => sum + r.overEngineering, 0) / this.results.length;
    const avgTokenRatio = this.results.reduce((sum, r) => sum + r.tokenMetrics.ratio, 0) / this.results.length;

    console.log('\n' + '=' .repeat(60));
    console.log('🔬 CRITICAL ANALYSIS REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Average Effectiveness: ${avgEffectiveness.toFixed(1)}/100`);
    console.log(`Average Accuracy: ${avgAccuracy.toFixed(1)}%`);
    console.log(`Average Relevance: ${avgRelevance.toFixed(1)}%`);
    console.log(`Average Over-Engineering: ${avgOverEngineering.toFixed(1)}/100`);
    console.log(`Average Token Ratio: ${avgTokenRatio.toFixed(2)}x`);

    // Critical findings
    console.log('\n🚨 CRITICAL FINDINGS:');
    
    if (avgEffectiveness < 60) {
      console.log('❌ CRITICAL: Overall effectiveness is below acceptable threshold');
    }
    
    if (avgOverEngineering > 40) {
      console.log('⚠️ WARNING: System is over-engineering responses');
    }
    
    if (avgTokenRatio > 5) {
      console.log('⚠️ WARNING: Token ratio is too high (inefficient)');
    }
    
    if (avgAccuracy < 70) {
      console.log('❌ CRITICAL: Accuracy is below acceptable threshold');
    }

    // Recommendations based on Context7 research
    console.log('\n💡 RECOMMENDATIONS (Based on Context7 Research):');
    
    if (avgTokenRatio > 3) {
      console.log('1. Implement LLMLingua-style prompt compression');
      console.log('2. Add complexity detection to avoid over-engineering simple tasks');
    }
    
    if (avgOverEngineering > 30) {
      console.log('3. Implement minimal enhancement mode for simple questions');
      console.log('4. Add token budget constraints based on prompt complexity');
    }
    
    if (avgAccuracy < 80) {
      console.log('5. Improve framework detection algorithms');
      console.log('6. Enhance context matching accuracy');
    }
    
    if (avgRelevance < 70) {
      console.log('7. Implement semantic matching for better context selection');
      console.log('8. Add relevance scoring for Context7 responses');
    }

    console.log('\n📊 DETAILED RESULTS:');
    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.testCase.name}:`);
      console.log(`   Effectiveness: ${result.effectivenessScore.toFixed(1)}/100`);
      console.log(`   Token Ratio: ${result.tokenMetrics.ratio.toFixed(2)}x`);
      console.log(`   Accuracy: ${result.accuracy.toFixed(1)}%`);
      console.log(`   Over-Engineering: ${result.overEngineering.toFixed(1)}/100`);
    });

    console.log('\n' + '=' .repeat(60));

    return {
      summary: {
        avgEffectiveness,
        avgAccuracy,
        avgRelevance,
        avgOverEngineering,
        avgTokenRatio
      },
      results: this.results
    };
  }

  async runAnalysis() {
    console.log('🔬 FOCUSED CRITICAL ANALYSIS: PromptMCP Effectiveness');
    console.log('Based on Context7 research on prompt evaluation metrics');
    console.log('=' .repeat(60));

    await this.initialize();

    for (const testCase of FOCUSED_TESTS) {
      await this.analyzeTest(testCase);
    }

    return this.generateCriticalReport();
  }
}

// Run the analysis
async function main() {
  const analyzer = new FocusedCriticalAnalyzer();
  
  try {
    await analyzer.runAnalysis();
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
