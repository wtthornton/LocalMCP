#!/usr/bin/env node

/**
 * Context7 Integration Benchmark Test
 * 
 * This test specifically measures Context7 integration effectiveness
 * and can be run repeatedly to track improvements.
 * 
 * Usage: node context7-benchmark.js [--compare-with-baseline]
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Context7-specific test cases
const CONTEXT7_TEST_CASES = [
  {
    id: 'html-button',
    name: 'HTML Button Creation',
    prompt: 'How do I create a button?',
    expectedLibraries: ['/websites/html', '/websites/css'],
    expectedUsage: true,
    complexity: 'simple',
    maxTokens: 50
  },
  {
    id: 'react-component',
    name: 'React Component',
    prompt: 'Create a React component that displays a list of users with search functionality',
    expectedLibraries: ['/websites/react_dev', '/microsoft/typescript'],
    expectedUsage: true,
    complexity: 'medium',
    maxTokens: 200
  },
  {
    id: 'fullstack-app',
    name: 'Full-Stack Application',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    expectedLibraries: ['/vercel/next.js', '/microsoft/typescript', '/postgresql/postgresql'],
    expectedUsage: true,
    complexity: 'complex',
    maxTokens: 500
  },
  {
    id: 'typescript-error',
    name: 'TypeScript Error Fix',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    expectedLibraries: ['/microsoft/typescript'],
    expectedUsage: true,
    complexity: 'medium',
    maxTokens: 300
  },
  {
    id: 'simple-math',
    name: 'Simple Math Question',
    prompt: 'What is 2+2?',
    expectedLibraries: [],
    expectedUsage: false,
    complexity: 'minimal',
    maxTokens: 20
  },
  {
    id: 'vue-component',
    name: 'Vue Component',
    prompt: 'Create a Vue component with TypeScript for a todo list',
    expectedLibraries: ['/vuejs/vue', '/microsoft/typescript'],
    expectedUsage: true,
    complexity: 'medium',
    maxTokens: 250
  },
  {
    id: 'angular-service',
    name: 'Angular Service',
    prompt: 'Create an Angular service for API communication with error handling',
    expectedLibraries: ['/angular/angular', '/microsoft/typescript'],
    expectedUsage: true,
    complexity: 'medium',
    maxTokens: 300
  },
  {
    id: 'nodejs-api',
    name: 'Node.js API',
    prompt: 'Build a REST API with Express.js and MongoDB using TypeScript',
    expectedLibraries: ['/expressjs/express', '/mongodb/docs', '/microsoft/typescript'],
    expectedUsage: true,
    complexity: 'complex',
    maxTokens: 400
  }
];

class Context7Benchmark {
  constructor() {
    this.logger = new Logger();
    this.config = new ConfigService();
    this.context7Compliance = new Context7MCPComplianceService(this.logger);
    this.context7Monitoring = new Context7MonitoringService(this.logger);
    this.context7Cache = new Context7AdvancedCacheService(this.logger);
    
    this.enhanceTool = new EnhancedContext7EnhanceTool(
      this.logger,
      this.config,
      this.context7Compliance,
      this.context7Monitoring,
      this.context7Cache
    );
    
    this.results = {
      timestamp: new Date().toISOString(),
      testType: 'Context7 Integration Benchmark',
      version: '1.0.0',
      testResults: [],
      summary: {},
      context7Metrics: {},
      improvements: {},
      criticalIssues: []
    };
  }

  async runBenchmark() {
    console.log('🔬 Context7 Integration Benchmark Test');
    console.log('=' .repeat(60));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Test Cases: ${CONTEXT7_TEST_CASES.length}`);
    console.log('');

    for (let i = 0; i < CONTEXT7_TEST_CASES.length; i++) {
      const testCase = CONTEXT7_TEST_CASES[i];
      console.log(`Running Test ${i + 1}/${CONTEXT7_TEST_CASES.length}: ${testCase.name}`);
      
      try {
        const result = await this.runTestCase(testCase);
        this.results.testResults.push(result);
        console.log(`  ✅ Completed: ${result.assessment}`);
        console.log(`  📚 Context7: ${result.context7Used ? 'Yes' : 'No'} (${result.librariesResolved} libraries)`);
        console.log(`  🎯 Accuracy: ${result.librarySelectionAccuracy.toFixed(1)}%`);
        console.log(`  📊 Relevance: ${result.context7RelevanceScore.toFixed(1)}/100`);
        console.log('');
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
        console.log('');
        
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
  }

  async runTestCase(testCase) {
    const startTime = Date.now();
    
    // Run the enhancement
    const enhancedResult = await this.enhanceTool.enhance({
      prompt: testCase.prompt,
      context: { framework: testCase.expectedLibraries[0]?.split('/')[2] || 'general' }
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Analyze Context7 usage
    const context7Used = enhancedResult.enhancedPrompt.includes('## Framework Best Practices (from Context7)');
    const librariesResolved = this.extractContext7Libraries(enhancedResult.enhancedPrompt);
    const librarySelectionAccuracy = this.calculateLibrarySelectionAccuracy(testCase, librariesResolved);
    const context7RelevanceScore = this.calculateContext7RelevanceScore(testCase, enhancedResult.enhancedPrompt);
    const multiLibraryResolution = this.calculateMultiLibraryResolution(testCase, librariesResolved);
    const documentationQuality = this.calculateDocumentationQuality(enhancedResult.enhancedPrompt);
    
    // Calculate overall Context7 score
    const overallScore = Math.round(
      (librarySelectionAccuracy + context7RelevanceScore + multiLibraryResolution + documentationQuality) / 4
    );
    
    return {
      testCase: testCase.id,
      name: testCase.name,
      prompt: testCase.prompt,
      enhancedPrompt: enhancedResult.enhancedPrompt,
      responseTime,
      context7Used,
      librariesResolved: librariesResolved.length,
      libraryNames: librariesResolved,
      librarySelectionAccuracy,
      context7RelevanceScore,
      multiLibraryResolution,
      documentationQuality,
      overallScore,
      assessment: this.getAssessment(overallScore),
      status: 'COMPLETED'
    };
  }

  extractContext7Libraries(enhancedPrompt) {
    const libraryMatches = enhancedPrompt.match(/## \/[\w-]+\/[\w-]+/g) || [];
    return libraryMatches.map(match => match.replace('## ', ''));
  }

  calculateLibrarySelectionAccuracy(testCase, resolvedLibraries) {
    if (!testCase.expectedUsage) {
      return resolvedLibraries.length === 0 ? 100 : 0;
    }
    
    if (resolvedLibraries.length === 0) return 0;
    
    let correctLibraries = 0;
    testCase.expectedLibraries.forEach(expectedLib => {
      if (resolvedLibraries.includes(expectedLib)) {
        correctLibraries++;
      }
    });
    
    return Math.round((correctLibraries / testCase.expectedLibraries.length) * 100);
  }

  calculateContext7RelevanceScore(testCase, enhancedPrompt) {
    if (!testCase.expectedUsage) {
      return enhancedPrompt.includes('Context7') ? 20 : 100;
    }
    
    if (!enhancedPrompt.includes('Context7')) return 0;
    
    // Check if the documentation is relevant to the prompt
    const promptKeywords = testCase.prompt.toLowerCase().split(' ');
    const docKeywords = enhancedPrompt.toLowerCase().split(' ');
    
    let relevantKeywords = 0;
    promptKeywords.forEach(keyword => {
      if (docKeywords.includes(keyword) && keyword.length > 3) {
        relevantKeywords++;
      }
    });
    
    return Math.min(100, Math.round((relevantKeywords / promptKeywords.length) * 100));
  }

  calculateMultiLibraryResolution(testCase, resolvedLibraries) {
    if (!testCase.expectedUsage) return 100;
    
    const expectedCount = testCase.expectedLibraries.length;
    const actualCount = resolvedLibraries.length;
    
    if (expectedCount === 0) return actualCount === 0 ? 100 : 0;
    
    const resolutionRate = Math.min(100, (actualCount / expectedCount) * 100);
    return Math.round(resolutionRate);
  }

  calculateDocumentationQuality(enhancedPrompt) {
    const context7Section = enhancedPrompt.match(/## Framework Best Practices \(from Context7\)[\s\S]*?(?=##|$)/);
    if (!context7Section) return 0;
    
    const docLength = context7Section[0].length;
    const hasCodeExamples = context7Section[0].includes('```') || context7Section[0].includes('code');
    const hasBestPractices = context7Section[0].includes('best practice') || context7Section[0].includes('recommendation');
    const hasStructure = context7Section[0].includes('##') && context7Section[0].split('##').length > 2;
    
    let qualityScore = 0;
    if (docLength > 500) qualityScore += 30;
    if (docLength > 1000) qualityScore += 20;
    if (hasCodeExamples) qualityScore += 25;
    if (hasBestPractices) qualityScore += 15;
    if (hasStructure) qualityScore += 10;
    
    return Math.min(100, qualityScore);
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
      averageResponseTime: completedTests.reduce((sum, r) => sum + r.responseTime, 0) / completedTests.length,
      averageOverallScore: completedTests.reduce((sum, r) => sum + r.overallScore, 0) / completedTests.length
    };
  }

  analyzeContext7Metrics() {
    const completedTests = this.results.testResults.filter(r => r.status === 'COMPLETED');
    const context7Tests = completedTests.filter(r => r.context7Used);
    
    this.results.context7Metrics = {
      usageRate: (context7Tests.length / completedTests.length) * 100,
      averageLibrariesResolved: context7Tests.reduce((sum, r) => sum + r.librariesResolved, 0) / context7Tests.length,
      averageLibrarySelectionAccuracy: completedTests.reduce((sum, r) => sum + r.librarySelectionAccuracy, 0) / completedTests.length,
      averageContext7RelevanceScore: completedTests.reduce((sum, r) => sum + r.context7RelevanceScore, 0) / completedTests.length,
      averageMultiLibraryResolution: completedTests.reduce((sum, r) => sum + r.multiLibraryResolution, 0) / completedTests.length,
      averageDocumentationQuality: completedTests.reduce((sum, r) => sum + r.documentationQuality, 0) / completedTests.length,
      correctLibrarySelections: completedTests.filter(r => r.librarySelectionAccuracy > 80).length,
      correctSelectionRate: completedTests.length > 0 ? (completedTests.filter(r => r.librarySelectionAccuracy > 80).length / completedTests.length) * 100 : 0,
      multiLibraryTests: completedTests.filter(r => r.librariesResolved > 1).length,
      multiLibraryRate: completedTests.length > 0 ? (completedTests.filter(r => r.librariesResolved > 1).length / completedTests.length) * 100 : 0
    };
  }

  identifyCriticalIssues() {
    this.results.criticalIssues = [];
    
    // Library selection accuracy issues
    if (this.results.context7Metrics.correctSelectionRate < 70) {
      this.results.criticalIssues.push({
        category: 'Library Selection Accuracy',
        severity: 'CRITICAL',
        issue: 'Context7 library selection accuracy is too low',
        current: this.results.context7Metrics.correctSelectionRate.toFixed(1) + '%',
        target: '>90%'
      });
    }
    
    // Multi-library resolution issues
    if (this.results.context7Metrics.multiLibraryRate < 30) {
      this.results.criticalIssues.push({
        category: 'Multi-Library Resolution',
        severity: 'HIGH',
        issue: 'Multi-library resolution rate is too low',
        current: this.results.context7Metrics.multiLibraryRate.toFixed(1) + '%',
        target: '>50%'
      });
    }
    
    // Context7 relevance issues
    if (this.results.context7Metrics.averageContext7RelevanceScore < 70) {
      this.results.criticalIssues.push({
        category: 'Context7 Relevance',
        severity: 'HIGH',
        issue: 'Context7 documentation relevance is too low',
        current: this.results.context7Metrics.averageContext7RelevanceScore.toFixed(1) + '/100',
        target: '>85/100'
      });
    }
    
    // Documentation quality issues
    if (this.results.context7Metrics.averageDocumentationQuality < 60) {
      this.results.criticalIssues.push({
        category: 'Documentation Quality',
        severity: 'MEDIUM',
        issue: 'Context7 documentation quality is too low',
        current: this.results.context7Metrics.averageDocumentationQuality.toFixed(1) + '/100',
        target: '>80/100'
      });
    }
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `context7-benchmark-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Context7 benchmark results saved to: ${filename}`);
  }

  displayResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 CONTEXT7 BENCHMARK RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Completed: ${this.results.summary.completedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Average Response Time: ${this.results.summary.averageResponseTime.toFixed(0)}ms`);
    console.log(`Average Overall Score: ${this.results.summary.averageOverallScore.toFixed(1)}/100`);
    
    console.log('\n🔬 CONTEXT7 METRICS:');
    console.log(`Usage Rate: ${this.results.context7Metrics.usageRate.toFixed(1)}%`);
    console.log(`Average Libraries Resolved: ${this.results.context7Metrics.averageLibrariesResolved.toFixed(1)}`);
    console.log(`Library Selection Accuracy: ${this.results.context7Metrics.averageLibrarySelectionAccuracy.toFixed(1)}%`);
    console.log(`Context7 Relevance Score: ${this.results.context7Metrics.averageContext7RelevanceScore.toFixed(1)}/100`);
    console.log(`Multi-Library Resolution: ${this.results.context7Metrics.averageMultiLibraryResolution.toFixed(1)}/100`);
    console.log(`Documentation Quality: ${this.results.context7Metrics.averageDocumentationQuality.toFixed(1)}/100`);
    console.log(`Correct Selection Rate: ${this.results.context7Metrics.correctSelectionRate.toFixed(1)}%`);
    console.log(`Multi-Library Rate: ${this.results.context7Metrics.multiLibraryRate.toFixed(1)}%`);
    
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
        console.log(`   Context7: ${result.context7Used ? 'Yes' : 'No'} (${result.librariesResolved} libraries)`);
        console.log(`   Libraries: ${result.libraryNames.join(', ') || 'None'}`);
        console.log(`   Accuracy: ${result.librarySelectionAccuracy.toFixed(1)}%`);
        console.log(`   Relevance: ${result.context7RelevanceScore.toFixed(1)}/100`);
        console.log(`   Multi-Library: ${result.multiLibraryResolution.toFixed(1)}/100`);
        console.log(`   Doc Quality: ${result.documentationQuality.toFixed(1)}/100`);
        console.log('');
      } else {
        console.log(`${index + 1}. ${result.name}: FAILED - ${result.error}`);
        console.log('');
      }
    });
    
    console.log('=' .repeat(60));
    console.log('🎯 CONTEXT7 BENCHMARK COMPLETE');
    console.log('=' .repeat(60));
  }

  async compareWithBaseline() {
    const baselineFiles = this.findBaselineFiles();
    if (baselineFiles.length === 0) {
      console.log('⚠️ No Context7 baseline files found for comparison');
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
      const filename = `context7-baseline-${timestamp}.json`;
      const filepath = path.join(__dirname, filename);
      if (existsSync(filepath)) {
        files.push(filepath);
      }
    }
    return files;
  }

  calculateImprovements(baselineData) {
    this.results.improvements = {
      librarySelectionAccuracy: {
        baseline: baselineData.context7Metrics?.averageLibrarySelectionAccuracy || 0,
        current: this.results.context7Metrics.averageLibrarySelectionAccuracy,
        improvement: this.results.context7Metrics.averageLibrarySelectionAccuracy - (baselineData.context7Metrics?.averageLibrarySelectionAccuracy || 0),
        percentageChange: ((this.results.context7Metrics.averageLibrarySelectionAccuracy - (baselineData.context7Metrics?.averageLibrarySelectionAccuracy || 0)) / (baselineData.context7Metrics?.averageLibrarySelectionAccuracy || 1)) * 100
      },
      multiLibraryResolution: {
        baseline: baselineData.context7Metrics?.averageMultiLibraryResolution || 0,
        current: this.results.context7Metrics.averageMultiLibraryResolution,
        improvement: this.results.context7Metrics.averageMultiLibraryResolution - (baselineData.context7Metrics?.averageMultiLibraryResolution || 0),
        percentageChange: ((this.results.context7Metrics.averageMultiLibraryResolution - (baselineData.context7Metrics?.averageMultiLibraryResolution || 0)) / (baselineData.context7Metrics?.averageMultiLibraryResolution || 1)) * 100
      },
      context7Relevance: {
        baseline: baselineData.context7Metrics?.averageContext7RelevanceScore || 0,
        current: this.results.context7Metrics.averageContext7RelevanceScore,
        improvement: this.results.context7Metrics.averageContext7RelevanceScore - (baselineData.context7Metrics?.averageContext7RelevanceScore || 0),
        percentageChange: ((this.results.context7Metrics.averageContext7RelevanceScore - (baselineData.context7Metrics?.averageContext7RelevanceScore || 0)) / (baselineData.context7Metrics?.averageContext7RelevanceScore || 1)) * 100
      },
      overallScore: {
        baseline: baselineData.summary?.averageOverallScore || 0,
        current: this.results.summary.averageOverallScore,
        improvement: this.results.summary.averageOverallScore - (baselineData.summary?.averageOverallScore || 0),
        percentageChange: ((this.results.summary.averageOverallScore - (baselineData.summary?.averageOverallScore || 0)) / (baselineData.summary?.averageOverallScore || 1)) * 100
      }
    };
    
    console.log('\n📈 IMPROVEMENTS SINCE BASELINE:');
    console.log(`Library Selection Accuracy: ${this.results.improvements.librarySelectionAccuracy.baseline.toFixed(1)}% → ${this.results.improvements.librarySelectionAccuracy.current.toFixed(1)}% (${this.results.improvements.librarySelectionAccuracy.percentageChange.toFixed(1)}%)`);
    console.log(`Multi-Library Resolution: ${this.results.improvements.multiLibraryResolution.baseline.toFixed(1)}/100 → ${this.results.improvements.multiLibraryResolution.current.toFixed(1)}/100 (${this.results.improvements.multiLibraryResolution.percentageChange.toFixed(1)}%)`);
    console.log(`Context7 Relevance: ${this.results.improvements.context7Relevance.baseline.toFixed(1)}/100 → ${this.results.improvements.context7Relevance.current.toFixed(1)}/100 (${this.results.improvements.context7Relevance.percentageChange.toFixed(1)}%)`);
    console.log(`Overall Score: ${this.results.improvements.overallScore.baseline.toFixed(1)} → ${this.results.improvements.overallScore.current.toFixed(1)} (${this.results.improvements.overallScore.percentageChange.toFixed(1)}%)`);
  }
}

// Main execution
async function main() {
  const benchmark = new Context7Benchmark();
  
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
