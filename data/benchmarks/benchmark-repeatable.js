#!/usr/bin/env node

/**
 * Repeatable PromptMCP Benchmark Test
 * 
 * This test can be run multiple times to measure improvements
 * against the established baseline. It tests both general performance
 * and Context7 integration effectiveness.
 * 
 * Usage: node benchmark-repeatable.js [--compare-with-baseline]
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test cases for comprehensive benchmarking
const TEST_CASES = [
  {
    id: 'simple-math',
    name: 'Simple Math Question',
    prompt: 'What is 2+2?',
    expectedComplexity: 'minimal',
    expectedFrameworks: [],
    expectedMaxTokens: 20,
    shouldUseContext7: false,
    context7Libraries: []
  },
  {
    id: 'simple-html',
    name: 'Simple HTML Button',
    prompt: 'How do I create a button?',
    expectedComplexity: 'low',
    expectedFrameworks: ['html', 'css'],
    expectedMaxTokens: 50,
    shouldUseContext7: true,
    context7Libraries: ['/mdn/html']
  },
  {
    id: 'medium-react',
    name: 'Medium React Component',
    prompt: 'Create a React component that displays a list of users with search functionality',
    expectedComplexity: 'medium',
    expectedFrameworks: ['react', 'typescript'],
    expectedMaxTokens: 200,
    shouldUseContext7: true,
    context7Libraries: ['/facebook/react']
  },
  {
    id: 'complex-fullstack',
    name: 'Complex Full-Stack Task',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    expectedComplexity: 'complex',
    expectedFrameworks: ['next.js', 'typescript', 'postgresql'],
    expectedMaxTokens: 500,
    shouldUseContext7: true,
    context7Libraries: ['/vercel/next.js', '/microsoft/typescript', '/postgresql/postgresql']
  },
  {
    id: 'typescript-debug',
    name: 'TypeScript Debug Task',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    expectedComplexity: 'medium',
    expectedFrameworks: ['typescript'],
    expectedMaxTokens: 300,
    shouldUseContext7: true,
    context7Libraries: ['/microsoft/typescript']
  }
];

class PromptMCPBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testType: 'Repeatable Benchmark (Docker MCP Server)',
      version: '1.0.0',
      testResults: [],
      summary: {},
      context7Metrics: {},
      improvements: {},
      criticalIssues: []
    };
    this.mcpServerProcess = null;
    this.mcpServerPort = 3000;
  }

  async runBenchmark() {
    console.log('🔬 PromptMCP Repeatable Benchmark Test (Docker MCP Server)');
    console.log('=' .repeat(60));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Test Cases: ${TEST_CASES.length}`);
    console.log('');

    try {
      // Check if MCP server is already running
      console.log('🐳 Checking for existing Docker MCP Server...');
      await this.checkMCPServer();
      
      // Run tests
      for (let i = 0; i < TEST_CASES.length; i++) {
        const testCase = TEST_CASES[i];
        console.log(`\n🔄 Running Test ${i + 1}/${TEST_CASES.length}: ${testCase.name}`);
        console.log(`   Prompt: "${testCase.prompt}"`);
        
        try {
          const result = await this.runTestCase(testCase);
          this.results.testResults.push(result);
          
          if (result.status === 'COMPLETED') {
            console.log(`   ✅ Completed: ${result.assessment}`);
            console.log(`   📊 Tokens: ${result.originalTokens} → ${result.enhancedTokens} (${result.tokenRatio.toFixed(2)}x)`);
            console.log(`   🎯 Context7: ${result.context7Used ? 'Yes' : 'No'} (${result.context7LibrariesResolved} libraries)`);
            console.log(`   ⏱️  Time: ${result.responseTime}ms`);
          } else {
            console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.log(`   ❌ Exception: ${error.message}`);
          
          this.results.testResults.push({
            testCase: testCase.id,
            name: testCase.name,
            prompt: testCase.prompt,
            error: error.message,
            status: 'FAILED'
          });
        }
      }

      this.calculateSummary();
      this.analyzeContext7Metrics();
      this.identifyCriticalIssues();
      this.saveResults();
      this.displayResults();
      
    } finally {
      // No cleanup needed - using existing container
      console.log('✅ Benchmark complete - using existing MCP server');
    }
  }

  async checkMCPServer() {
    const maxAttempts = 10;
    const delay = 1000;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://localhost:${this.mcpServerPort}/health`);
        if (response.ok) {
          console.log('   ✅ MCP Server is already running and ready');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      console.log(`   ⏳ Checking server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error('MCP Server is not running or not accessible');
  }


  async runTestCase(testCase) {
    const startTime = Date.now();
    
    try {
      // Call MCP server via HTTP
      const response = await fetch(`http://localhost:${this.mcpServerPort}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testCase.prompt,
          context: { framework: testCase.expectedFrameworks[0] || 'general' }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const enhancedResult = await response.json();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Calculate metrics
      const originalTokens = testCase.prompt.split(' ').length;
      const enhancedTokens = enhancedResult?.enhanced_prompt?.split(' ').length || 0;
      const tokenRatio = enhancedTokens > 0 ? enhancedTokens / originalTokens : 0;
    
      // Analyze Context7 usage
      const context7LibrariesResolved = (enhancedResult?.enhanced_prompt?.match(/## \/[\w-]+\/[\w-]+ Documentation:/gi) || []).length;
      const context7Used = context7LibrariesResolved > 0;
    
      // Calculate scores
      const tokenEfficiencyScore = this.calculateTokenEfficiencyScore(testCase, tokenRatio);
      const frameworkAccuracyScore = this.calculateFrameworkAccuracyScore(testCase, enhancedResult?.enhanced_prompt || '');
      const context7RelevanceScore = this.calculateContext7RelevanceScore(testCase, enhancedResult?.enhanced_prompt || '');
      const overEngineeringScore = this.calculateOverEngineeringScore(testCase, tokenRatio);
      
      const overallScore = Math.round(
        (tokenEfficiencyScore + frameworkAccuracyScore + context7RelevanceScore + (100 - overEngineeringScore)) / 4
      );
      
      return {
        testCase: testCase.id,
        name: testCase.name,
        prompt: testCase.prompt,
        enhancedPrompt: enhancedResult?.enhanced_prompt || '',
        originalTokens,
        enhancedTokens,
        tokenRatio,
        responseTime,
        context7Used,
        context7LibrariesResolved,
        context7Libraries: this.extractContext7Libraries(enhancedResult?.enhanced_prompt || ''),
        tokenEfficiencyScore,
        frameworkAccuracyScore,
        context7RelevanceScore,
        overEngineeringScore,
        overallScore,
        assessment: this.getAssessment(overallScore),
        status: 'COMPLETED'
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        testCase: testCase.id,
        name: testCase.name,
        prompt: testCase.prompt,
        enhancedPrompt: '',
        originalTokens: testCase.prompt.split(' ').length,
        enhancedTokens: 0,
        tokenRatio: 0,
        responseTime,
        context7Used: false,
        context7LibrariesResolved: 0,
        context7Libraries: [],
        tokenEfficiencyScore: 0,
        frameworkAccuracyScore: 0,
        context7RelevanceScore: 0,
        overEngineeringScore: 0,
        overallScore: 0,
        assessment: 'FAILED',
        status: 'FAILED',
        error: error.message
      };
    }
  }

  calculateTokenEfficiencyScore(testCase, tokenRatio) {
    const expectedMax = testCase.expectedMaxTokens;
    const expectedMin = Math.max(1, expectedMax * 0.1);
    
    if (tokenRatio <= expectedMin) return 100;
    if (tokenRatio <= expectedMax) return 80;
    if (tokenRatio <= expectedMax * 2) return 60;
    if (tokenRatio <= expectedMax * 5) return 40;
    return 20;
  }

  calculateFrameworkAccuracyScore(testCase, enhancedPrompt) {
    if (testCase.expectedFrameworks.length === 0) {
      return enhancedPrompt.includes('Framework Best Practices') ? 20 : 100;
    }
    
    let correctFrameworks = 0;
    testCase.expectedFrameworks.forEach(framework => {
      if (enhancedPrompt.toLowerCase().includes(framework.toLowerCase())) {
        correctFrameworks++;
      }
    });
    
    return Math.round((correctFrameworks / testCase.expectedFrameworks.length) * 100);
  }

  calculateContext7RelevanceScore(testCase, enhancedPrompt) {
    if (!testCase.shouldUseContext7) {
      return enhancedPrompt.includes('Context7') ? 20 : 100;
    }
    
    if (!enhancedPrompt.includes('Context7')) return 0;
    
    // Check if correct libraries were used
    let relevantLibraries = 0;
    testCase.context7Libraries.forEach(library => {
      if (enhancedPrompt.includes(library)) {
        relevantLibraries++;
      }
    });
    
    return Math.round((relevantLibraries / testCase.context7Libraries.length) * 100);
  }

  calculateOverEngineeringScore(testCase, tokenRatio) {
    const expectedMax = testCase.expectedMaxTokens;
    const overEngineeringThreshold = expectedMax * 3;
    
    if (tokenRatio <= expectedMax) return 0;
    if (tokenRatio <= overEngineeringThreshold) return 30;
    if (tokenRatio <= overEngineeringThreshold * 2) return 60;
    return 90;
  }

  extractContext7Libraries(enhancedPrompt) {
    const libraryMatches = enhancedPrompt.match(/## \/[\w-]+\/[\w-]+/g) || [];
    return libraryMatches.map(match => match.replace('## ', ''));
  }

  getAssessment(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'ACCEPTABLE';
    if (score >= 60) return 'NEEDS_IMPROVEMENT';
    return 'POOR';
  }

  calculateSummary() {
    const completedTests = this.results.testResults.filter(r => r.status === 'COMPLETED');
    
    this.results.summary = {
      totalTests: this.results.testResults.length,
      completedTests: completedTests.length,
      failedTests: this.results.testResults.length - completedTests.length,
      averageTokenRatio: completedTests.reduce((sum, r) => sum + r.tokenRatio, 0) / completedTests.length,
      averageResponseTime: completedTests.reduce((sum, r) => sum + r.responseTime, 0) / completedTests.length,
      averageOverallScore: completedTests.reduce((sum, r) => sum + r.overallScore, 0) / completedTests.length,
      overEngineeredTests: completedTests.filter(r => r.overEngineeringScore > 50).length,
      overEngineeringRate: (completedTests.filter(r => r.overEngineeringScore > 50).length / completedTests.length) * 100,
      context7UsageRate: (completedTests.filter(r => r.context7Used).length / completedTests.length) * 100,
      averageContext7Libraries: completedTests.reduce((sum, r) => sum + r.context7LibrariesResolved, 0) / completedTests.length
    };
  }

  analyzeContext7Metrics() {
    const completedTests = this.results.testResults.filter(r => r.status === 'COMPLETED');
    const context7Tests = completedTests.filter(r => r.context7Used);
    
    this.results.context7Metrics = {
      usageRate: (context7Tests.length / completedTests.length) * 100,
      averageLibrariesResolved: context7Tests.reduce((sum, r) => sum + r.context7LibrariesResolved, 0) / context7Tests.length,
      averageRelevanceScore: context7Tests.reduce((sum, r) => sum + r.context7RelevanceScore, 0) / context7Tests.length,
      correctLibrarySelections: context7Tests.filter(r => r.context7RelevanceScore > 80).length,
      correctSelectionRate: context7Tests.length > 0 ? (context7Tests.filter(r => r.context7RelevanceScore > 80).length / context7Tests.length) * 100 : 0
    };
  }

  identifyCriticalIssues() {
    this.results.criticalIssues = [];
    
    // Token efficiency issues
    if (this.results.summary.averageTokenRatio > 10) {
      this.results.criticalIssues.push({
        category: 'Token Efficiency',
        severity: 'CRITICAL',
        issue: 'Average token ratio is too high',
        current: this.results.summary.averageTokenRatio.toFixed(2) + 'x',
        target: '<5.0x'
      });
    }
    
    // Context7 accuracy issues
    if (this.results.context7Metrics.correctSelectionRate < 70) {
      this.results.criticalIssues.push({
        category: 'Context7 Accuracy',
        severity: 'HIGH',
        issue: 'Context7 library selection accuracy is too low',
        current: this.results.context7Metrics.correctSelectionRate.toFixed(1) + '%',
        target: '>90%'
      });
    }
    
    // Over-engineering issues
    if (this.results.summary.overEngineeringRate > 50) {
      this.results.criticalIssues.push({
        category: 'Over-Engineering',
        severity: 'HIGH',
        issue: 'Too many tests are over-engineered',
        current: this.results.summary.overEngineeringRate.toFixed(1) + '%',
        target: '<20%'
      });
    }
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promptmcp-benchmark-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Benchmark results saved to: ${filename}`);
  }

  displayResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 BENCHMARK RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Completed: ${this.results.summary.completedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Average Token Ratio: ${this.results.summary.averageTokenRatio.toFixed(2)}x`);
    console.log(`Average Response Time: ${this.results.summary.averageResponseTime.toFixed(0)}ms`);
    console.log(`Average Overall Score: ${this.results.summary.averageOverallScore.toFixed(1)}/100`);
    console.log(`Over-Engineering Rate: ${this.results.summary.overEngineeringRate.toFixed(1)}%`);
    
    console.log('\n🔬 CONTEXT7 METRICS:');
    console.log(`Usage Rate: ${this.results.context7Metrics.usageRate.toFixed(1)}%`);
    console.log(`Average Libraries Resolved: ${this.results.context7Metrics.averageLibrariesResolved.toFixed(1)}`);
    console.log(`Correct Selection Rate: ${this.results.context7Metrics.correctSelectionRate.toFixed(1)}%`);
    console.log(`Average Relevance Score: ${this.results.context7Metrics.averageRelevanceScore.toFixed(1)}/100`);
    
    if (this.results.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.results.criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.issue}`);
        console.log(`   Current: ${issue.current}`);
        console.log(`   Target: ${issue.target}`);
      });
    }
    
    console.log('\n📈 DETAILED TEST RESULTS:');
    this.results.testResults.forEach((result, index) => {
      if (result.status === 'COMPLETED') {
        console.log(`${index + 1}. ${result.name}:`);
        console.log(`   Score: ${result.overallScore}/100 (${result.assessment})`);
        console.log(`   Tokens: ${result.originalTokens} → ${result.enhancedTokens} (${result.tokenRatio.toFixed(2)}x)`);
        console.log(`   Context7: ${result.context7Used ? 'Yes' : 'No'} (${result.context7LibrariesResolved} libraries)`);
        console.log(`   Libraries: ${result.context7Libraries.join(', ') || 'None'}`);
        console.log('');
      } else {
        console.log(`${index + 1}. ${result.name}: FAILED - ${result.error}`);
        console.log('');
      }
    });
    
    console.log('=' .repeat(60));
    console.log('🎯 BENCHMARK COMPLETE');
    console.log('=' .repeat(60));
  }

  async compareWithBaseline() {
    const baselineFiles = this.findBaselineFiles();
    if (baselineFiles.length === 0) {
      console.log('⚠️ No baseline files found for comparison');
      return;
    }
    
    const latestBaseline = baselineFiles[baselineFiles.length - 1];
    console.log(`📊 Comparing with baseline: ${latestBaseline}`);
    
    try {
      const baselineData = JSON.parse(readFileSync(latestBaseline, 'utf8'));
      this.calculateImprovements(baselineData);
    } catch (error) {
      console.log(`❌ Error reading baseline: ${error.message}`);
    }
  }

  findBaselineFiles() {
    const files = [];
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().replace(/[:.]/g, '-');
      const filename = `promptmcp-baseline-${timestamp}.json`;
      const filepath = path.join(__dirname, filename);
      if (existsSync(filepath)) {
        files.push(filepath);
      }
    }
    return files;
  }

  calculateImprovements(baselineData) {
    this.results.improvements = {
      tokenEfficiency: {
        baseline: baselineData.summary?.averageTokenRatio || 0,
        current: this.results.summary.averageTokenRatio,
        improvement: this.results.summary.averageTokenRatio - (baselineData.summary?.averageTokenRatio || 0),
        percentageChange: ((this.results.summary.averageTokenRatio - (baselineData.summary?.averageTokenRatio || 0)) / (baselineData.summary?.averageTokenRatio || 1)) * 100
      },
      overallScore: {
        baseline: baselineData.summary?.averageOverallScore || 0,
        current: this.results.summary.averageOverallScore,
        improvement: this.results.summary.averageOverallScore - (baselineData.summary?.averageOverallScore || 0),
        percentageChange: ((this.results.summary.averageOverallScore - (baselineData.summary?.averageOverallScore || 0)) / (baselineData.summary?.averageOverallScore || 1)) * 100
      },
      context7Accuracy: {
        baseline: baselineData.context7Metrics?.correctSelectionRate || 0,
        current: this.results.context7Metrics.correctSelectionRate,
        improvement: this.results.context7Metrics.correctSelectionRate - (baselineData.context7Metrics?.correctSelectionRate || 0),
        percentageChange: ((this.results.context7Metrics.correctSelectionRate - (baselineData.context7Metrics?.correctSelectionRate || 0)) / (baselineData.context7Metrics?.correctSelectionRate || 1)) * 100
      }
    };
    
    console.log('\n📈 IMPROVEMENTS SINCE BASELINE:');
    console.log(`Token Efficiency: ${this.results.improvements.tokenEfficiency.baseline.toFixed(2)}x → ${this.results.improvements.tokenEfficiency.current.toFixed(2)}x (${this.results.improvements.tokenEfficiency.percentageChange.toFixed(1)}%)`);
    console.log(`Overall Score: ${this.results.improvements.overallScore.baseline.toFixed(1)} → ${this.results.improvements.overallScore.current.toFixed(1)} (${this.results.improvements.overallScore.percentageChange.toFixed(1)}%)`);
    console.log(`Context7 Accuracy: ${this.results.improvements.context7Accuracy.baseline.toFixed(1)}% → ${this.results.improvements.context7Accuracy.current.toFixed(1)}% (${this.results.improvements.context7Accuracy.percentageChange.toFixed(1)}%)`);
  }
}

// Main execution
async function main() {
  const benchmark = new PromptMCPBenchmark();
  
  // Check for comparison flag
  const args = process.argv.slice(2);
  const shouldCompare = args.includes('--compare-with-baseline');
  
  await benchmark.runBenchmark();
  
  if (shouldCompare) {
    await benchmark.compareWithBaseline();
  }
}

// Run the benchmark
main().catch(console.error);
