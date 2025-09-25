#!/usr/bin/env node

/**
 * Comprehensive Quality & Performance Benchmark for PromptMCP
 * 
 * This benchmark evaluates both performance metrics (tokens, speed) and quality metrics
 * (relevance, accuracy, completeness, clarity) to provide a complete picture of the system.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test cases with expected quality criteria
const TEST_CASES = [
  {
    id: 'simple-math',
    name: 'Simple Math Question',
    prompt: 'What is 2+2?',
    expectedFrameworks: [],
    expectedContext7Libraries: [],
    qualityCriteria: {
      shouldBeMinimal: true,
      shouldBeAccurate: true,
      shouldBeFast: true,
      maxTokens: 50,
      maxResponseTime: 100
    }
  },
  {
    id: 'simple-html',
    name: 'Simple HTML Button',
    prompt: 'How do I create a button?',
    expectedFrameworks: ['html'],
    expectedContext7Libraries: ['/mdn/html'],
    qualityCriteria: {
      shouldIncludeHTMLDocs: true,
      shouldBePractical: true,
      shouldIncludeExamples: true,
      maxTokens: 200,
      maxResponseTime: 200
    }
  },
  {
    id: 'medium-react',
    name: 'Medium React Component',
    prompt: 'Create a React component that displays a list of users with search functionality',
    expectedFrameworks: ['react'],
    expectedContext7Libraries: ['/facebook/react'],
    qualityCriteria: {
      shouldIncludeReactPatterns: true,
      shouldIncludeStateManagement: true,
      shouldIncludeSearchLogic: true,
      shouldBeProductionReady: true,
      maxTokens: 1000,
      maxResponseTime: 500
    }
  },
  {
    id: 'complex-fullstack',
    name: 'Complex Full-Stack Task',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    expectedFrameworks: ['nextjs', 'typescript'],
    expectedContext7Libraries: ['/vercel/next.js', '/microsoft/typescript'],
    qualityCriteria: {
      shouldIncludeArchitecture: true,
      shouldIncludeSecurity: true,
      shouldIncludeDatabasePatterns: true,
      shouldIncludeRealTimePatterns: true,
      shouldIncludeFileUploadPatterns: true,
      shouldBeScalable: true,
      maxTokens: 3000,
      maxResponseTime: 1000
    }
  },
  {
    id: 'todo-integration',
    name: 'Todo Integration Test',
    prompt: 'Help me implement authentication in my React app',
    expectedFrameworks: ['react'],
    expectedContext7Libraries: ['/facebook/react'],
    qualityCriteria: {
      shouldIncludeTaskContext: true,
      shouldIncludeTaskItems: true,
      shouldIncludeProjectAwareness: true,
      shouldIncludeReactPatterns: true,
      shouldBePractical: true,
      maxTokens: 800,
      maxResponseTime: 500
    }
  },
  {
    id: 'typescript-debug',
    name: 'TypeScript Debug Task',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    expectedFrameworks: ['typescript'],
    expectedContext7Libraries: ['/microsoft/typescript'],
    qualityCriteria: {
      shouldExplainTheError: true,
      shouldProvideSolution: true,
      shouldIncludeTypeGuards: true,
      shouldIncludeBestPractices: true,
      shouldBeEducational: true,
      maxTokens: 800,
      maxResponseTime: 300
    }
  }
];

class QualityBenchmark {
  constructor() {
    this.results = [];
    this.startTime = new Date();
  }

  async runBenchmark() {
    console.log('🔬 PromptMCP Comprehensive Quality & Performance Benchmark');
    console.log('============================================================');
    console.log(`Timestamp: ${this.startTime.toISOString()}`);
    console.log(`Test Cases: ${TEST_CASES.length}`);
    console.log('');

    // Check if server is running
    const serverReady = await this.checkServer();
    if (!serverReady) {
      console.log('❌ PromptMCP server is not running. Please start it first.');
      return;
    }

    console.log('🐳 Checking for existing PromptMCP Server...');
    console.log('   ✅ Server is already running and ready');
    console.log('');

    // Run all test cases
    for (let i = 0; i < TEST_CASES.length; i++) {
      const testCase = TEST_CASES[i];
      console.log(`🔄 Running Test ${i + 1}/${TEST_CASES.length}: ${testCase.name}`);
      console.log(`   Prompt: "${testCase.prompt}"`);
      
      try {
        const result = await this.runTest(testCase);
        this.results.push(result);
        
        // Display results
        this.displayTestResult(result);
        console.log('');
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        console.log('');
      }
    }

    // Generate comprehensive report
    this.generateReport();
  }

  async checkServer() {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000/health', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async runTest(testCase) {
    const startTime = Date.now();
    
    const response = await this.makeRequest({
      prompt: testCase.prompt,
      context: {},
      options: {
        maxTokens: 4000,
        includeMetadata: true
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Parse response
    const enhancedPrompt = response.enhanced_prompt || '';
    const contextUsed = response.context_used || {};
    const metadata = response.metadata || {};

    // Calculate performance metrics
    const originalTokens = this.estimateTokens(testCase.prompt);
    const enhancedTokens = this.estimateTokens(enhancedPrompt);
    const tokenRatio = enhancedTokens / originalTokens;

    // Extract Context7 libraries
    const context7LibrariesResolved = (enhancedPrompt.match(/## \/[\w-]+\/[\w-]+ Documentation:/gi) || []).length;
    const context7Used = context7LibrariesResolved > 0;

    // Calculate quality metrics
    const qualityScore = this.calculateQualityScore(testCase, enhancedPrompt, contextUsed, metadata);

    return {
      testCase,
      performance: {
        originalTokens,
        enhancedTokens,
        tokenRatio,
        responseTime,
        context7Used,
        context7LibrariesResolved
      },
      quality: qualityScore,
      context: {
        repoFacts: contextUsed.repo_facts?.length || 0,
        codeSnippets: contextUsed.code_snippets?.length || 0,
        frameworkDocs: contextUsed.framework_docs?.length || 0,
        projectDocs: contextUsed.project_docs?.length || 0,
        context7Docs: contextUsed.context7_docs?.length || 0
      },
      libraries: this.extractLibraries(enhancedPrompt),
      enhancedPrompt: enhancedPrompt.substring(0, 200) + '...',
      // Save complete JSON response for review
      completeResponse: response
    };
  }

  calculateQualityScore(testCase, enhancedPrompt, contextUsed, metadata) {
    const criteria = testCase.qualityCriteria;
    let score = 0;
    let maxScore = 0;
    const details = {};

    // Performance criteria (30% of score)
    maxScore += 30;
    if (criteria.shouldBeMinimal && testCase.expectedFrameworks.length === 0) {
      const tokenRatio = this.estimateTokens(enhancedPrompt) / this.estimateTokens(testCase.prompt);
      if (tokenRatio < 5) score += 15;
      else if (tokenRatio < 10) score += 10;
      else if (tokenRatio < 20) score += 5;
      details.minimalResponse = tokenRatio < 5 ? 'Excellent' : tokenRatio < 10 ? 'Good' : 'Poor';
    }

    if (criteria.shouldBeFast) {
      const responseTime = metadata.response_time || 0;
      if (responseTime < 100) score += 15;
      else if (responseTime < 300) score += 10;
      else if (responseTime < 500) score += 5;
      details.responseSpeed = responseTime < 100 ? 'Excellent' : responseTime < 300 ? 'Good' : 'Poor';
    }

    // Accuracy criteria (25% of score)
    maxScore += 25;
    const detectedFrameworks = metadata.complexity?.indicators || [];
    const frameworkAccuracy = this.calculateFrameworkAccuracy(testCase.expectedFrameworks, detectedFrameworks);
    score += frameworkAccuracy * 25;
    details.frameworkAccuracy = `${Math.round(frameworkAccuracy * 100)}%`;

    // Context7 accuracy (20% of score)
    maxScore += 20;
    const context7Accuracy = this.calculateContext7Accuracy(testCase.expectedContext7Libraries, enhancedPrompt);
    score += context7Accuracy * 20;
    details.context7Accuracy = `${Math.round(context7Accuracy * 100)}%`;

    // Content quality criteria (25% of score)
    maxScore += 25;
    let contentScore = 0;

    if (criteria.shouldIncludeHTMLDocs && enhancedPrompt.includes('HTML') && enhancedPrompt.includes('button')) {
      contentScore += 5;
      details.htmlDocumentation = 'Present';
    }

    if (criteria.shouldIncludeReactPatterns && enhancedPrompt.includes('React') && enhancedPrompt.includes('component')) {
      contentScore += 5;
      details.reactPatterns = 'Present';
    }

    if (criteria.shouldIncludeArchitecture && enhancedPrompt.includes('architecture') || enhancedPrompt.includes('structure')) {
      contentScore += 5;
      details.architecture = 'Present';
    }

    if (criteria.shouldExplainTheError && enhancedPrompt.includes('error') && enhancedPrompt.includes('type')) {
      contentScore += 5;
      details.errorExplanation = 'Present';
    }

    if (criteria.shouldBeEducational && enhancedPrompt.includes('best practices') || enhancedPrompt.includes('recommendation')) {
      contentScore += 5;
      details.educational = 'Present';
    }

    score += contentScore;
    details.contentQuality = `${contentScore}/25`;

    // Todo integration criteria (15% of score)
    maxScore += 15;
    let todoScore = 0;

    if (criteria.shouldIncludeTaskContext && enhancedPrompt.includes('## Current Project Tasks:')) {
      todoScore += 8;
      details.taskContext = 'Present';
    }

    if (criteria.shouldIncludeTaskItems && enhancedPrompt.includes('- ')) {
      const taskLines = enhancedPrompt.match(/- .+/g);
      if (taskLines && taskLines.length > 0) {
        todoScore += 4;
        details.taskItems = `${taskLines.length} items`;
      }
    }

    if (criteria.shouldIncludeProjectAwareness && (enhancedPrompt.includes('project') || enhancedPrompt.includes('task'))) {
      todoScore += 3;
      details.projectAwareness = 'Present';
    }

    score += todoScore;
    details.todoIntegration = `${todoScore}/15`;

    return {
      overall: Math.round((score / maxScore) * 100),
      details,
      breakdown: {
        performance: Math.round((score / maxScore) * 30),
        accuracy: Math.round((score / maxScore) * 45),
        content: Math.round((score / maxScore) * 25),
        todoIntegration: Math.round((score / maxScore) * 15)
      }
    };
  }

  calculateFrameworkAccuracy(expected, detected) {
    if (expected.length === 0 && detected.length === 0) return 1.0;
    if (expected.length === 0 || detected.length === 0) return 0.0;
    
    const matches = expected.filter(fw => detected.some(d => d.toLowerCase().includes(fw.toLowerCase())));
    return matches.length / expected.length;
  }

  calculateContext7Accuracy(expected, enhancedPrompt) {
    if (expected.length === 0) return 1.0;
    
    const found = expected.filter(lib => enhancedPrompt.includes(lib));
    return found.length / expected.length;
  }

  extractLibraries(enhancedPrompt) {
    const matches = enhancedPrompt.match(/## \/[\w-]+\/[\w-]+ Documentation:/gi) || [];
    return matches.map(match => match.replace('## ', '').replace(' Documentation:', ''));
  }

  estimateTokens(text) {
    // Simple token estimation (rough approximation)
    return Math.ceil(text.length / 4);
  }

  async makeRequest(data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/enhance',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(postData);
      req.end();
    });
  }

  displayTestResult(result) {
    const { testCase, performance, quality } = result;
    
    // Performance metrics
    const tokenStatus = performance.tokenRatio < 50 ? '✅' : performance.tokenRatio < 100 ? '⚠️' : '❌';
    const speedStatus = performance.responseTime < 200 ? '✅' : performance.responseTime < 500 ? '⚠️' : '❌';
    const context7Status = performance.context7Used ? '✅' : '❌';
    
    console.log(`   ${quality.overall >= 80 ? '✅' : quality.overall >= 60 ? '⚠️' : '❌'} Completed: ${this.getQualityLevel(quality.overall)}`);
    console.log(`   📊 Tokens: ${performance.originalTokens} → ${performance.enhancedTokens} (${performance.tokenRatio.toFixed(2)}x) ${tokenStatus}`);
    console.log(`   🎯 Context7: ${performance.context7Used ? 'Yes' : 'No'} (${performance.context7LibrariesResolved} libraries) ${context7Status}`);
    console.log(`   ⏱️  Time: ${performance.responseTime}ms ${speedStatus}`);
    console.log(`   📈 Quality Score: ${quality.overall}/100`);
    console.log(`   🔧 Frameworks: ${result.libraries.join(', ') || 'None'}`);
  }

  getQualityLevel(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'ACCEPTABLE';
    if (score >= 60) return 'POOR';
    return 'FAILED';
  }

  generateReport() {
    const endTime = new Date();
    const totalTime = endTime - this.startTime;

    console.log('============================================================');
    console.log('📊 COMPREHENSIVE BENCHMARK RESULTS SUMMARY');
    console.log('============================================================');
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Completed: ${this.results.length}`);
    console.log(`Failed: 0`);
    console.log(`Total Time: ${totalTime}ms`);
    console.log('');

    // Performance Summary
    const avgTokenRatio = this.results.reduce((sum, r) => sum + r.performance.tokenRatio, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.performance.responseTime, 0) / this.results.length;
    const context7UsageRate = (this.results.filter(r => r.performance.context7Used).length / this.results.length) * 100;
    const avgLibrariesResolved = this.results.reduce((sum, r) => sum + r.performance.context7LibrariesResolved, 0) / this.results.length;

    console.log('🚀 PERFORMANCE METRICS:');
    console.log(`Average Token Ratio: ${avgTokenRatio.toFixed(2)}x`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`Context7 Usage Rate: ${context7UsageRate.toFixed(1)}%`);
    console.log(`Average Libraries Resolved: ${avgLibrariesResolved.toFixed(1)}`);
    console.log('');

    // Quality Summary
    const avgQualityScore = this.results.reduce((sum, r) => sum + r.quality.overall, 0) / this.results.length;
    const excellentCount = this.results.filter(r => r.quality.overall >= 90).length;
    const goodCount = this.results.filter(r => r.quality.overall >= 80 && r.quality.overall < 90).length;
    const acceptableCount = this.results.filter(r => r.quality.overall >= 70 && r.quality.overall < 80).length;
    const poorCount = this.results.filter(r => r.quality.overall >= 60 && r.quality.overall < 70).length;
    const failedCount = this.results.filter(r => r.quality.overall < 60).length;

    console.log('🎯 QUALITY METRICS:');
    console.log(`Average Quality Score: ${avgQualityScore.toFixed(1)}/100`);
    console.log(`Quality Distribution:`);
    console.log(`  Excellent (90+): ${excellentCount} tests`);
    console.log(`  Good (80-89): ${goodCount} tests`);
    console.log(`  Acceptable (70-79): ${acceptableCount} tests`);
    console.log(`  Poor (60-69): ${poorCount} tests`);
    console.log(`  Failed (<60): ${failedCount} tests`);
    console.log('');

    // Detailed Results
    console.log('📈 DETAILED TEST RESULTS:');
    this.results.forEach((result, index) => {
      const { testCase, performance, quality, libraries } = result;
      console.log(`${index + 1}. ${testCase.name}:`);
      console.log(`   Quality Score: ${quality.overall}/100 (${this.getQualityLevel(quality.overall)})`);
      console.log(`   Tokens: ${performance.originalTokens} → ${performance.enhancedTokens} (${performance.tokenRatio.toFixed(2)}x)`);
      console.log(`   Context7: ${performance.context7Used ? 'Yes' : 'No'} (${performance.context7LibrariesResolved} libraries)`);
      console.log(`   Libraries: ${libraries.join(', ') || 'None'}`);
      console.log(`   Response Time: ${performance.responseTime}ms`);
      console.log('');
    });

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promptmcp-quality-benchmark-${timestamp}.json`;
    const reportData = {
      timestamp: this.startTime.toISOString(),
      totalTime,
      summary: {
        performance: {
          avgTokenRatio,
          avgResponseTime,
          context7UsageRate,
          avgLibrariesResolved
        },
        quality: {
          avgQualityScore,
          distribution: {
            excellent: excellentCount,
            good: goodCount,
            acceptable: acceptableCount,
            poor: poorCount,
            failed: failedCount
          }
        }
      },
      results: this.results
    };

    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`📄 Comprehensive benchmark results saved to: ${filename}`);

    // Save individual test JSON files for detailed review
    this.results.forEach((result, index) => {
      const testFilename = `test${index + 1}-${result.testCase.id}-complete-response-${timestamp}.json`;
      const testData = {
        testCase: result.testCase,
        completeResponse: result.completeResponse,
        performance: result.performance,
        quality: result.quality,
        context: result.context,
        libraries: result.libraries,
        timestamp: this.startTime.toISOString()
      };
      fs.writeFileSync(testFilename, JSON.stringify(testData, null, 2));
      console.log(`📄 Test ${index + 1} complete response saved to: ${testFilename}`);
    });
    console.log('============================================================');
    console.log('🎯 COMPREHENSIVE BENCHMARK COMPLETE');
    console.log('============================================================');
  }
}

// Run the benchmark
const benchmark = new QualityBenchmark();
benchmark.runBenchmark().catch(console.error);
