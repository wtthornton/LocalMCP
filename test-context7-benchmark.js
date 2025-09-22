#!/usr/bin/env node

/**
 * Context7-Only Benchmark Test
 * Tests the Context7-only enhancement system with comprehensive metrics
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';

// Test cases for different complexity levels
const testCases = [
  {
    name: 'Simple HTML',
    prompt: 'Create a simple HTML hello world page',
    context: { framework: 'html', style: 'css' },
    expectedComplexity: 'simple',
    expectedFrameworks: ['html']
  },
  {
    name: 'Medium React',
    prompt: 'Build a React component with state management and props',
    context: { framework: 'react', style: 'tailwind' },
    expectedComplexity: 'medium',
    expectedFrameworks: ['react', 'javascript']
  },
  {
    name: 'Complex Next.js',
    prompt: 'Create a full-stack Next.js application with API routes, database integration, and authentication',
    context: { framework: 'nextjs', style: 'tailwind' },
    expectedComplexity: 'complex',
    expectedFrameworks: ['nextjs', 'react', 'typescript']
  },
  {
    name: 'TypeScript Interface',
    prompt: 'Define TypeScript interfaces for a user management system',
    context: { framework: 'typescript', style: 'css' },
    expectedComplexity: 'medium',
    expectedFrameworks: ['typescript']
  },
  {
    name: 'Vue Component',
    prompt: 'Create a Vue 3 component with composition API and reactive data',
    context: { framework: 'vue', style: 'css' },
    expectedComplexity: 'medium',
    expectedFrameworks: ['vue', 'javascript']
  }
];

// Metrics collection
const metrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  totalTime: 0,
  context7OnlyMetrics: {
    libraryResolutionTime: 0,
    contentExtractionTime: 0,
    preprocessingTime: 0,
    filteringTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  },
  qualityMetrics: {
    averageTokenEfficiency: 0,
    averageQualityScore: 0,
    averageRelevanceScore: 0
  }
};

async function runBenchmark() {
  console.log('🚀 Starting Context7-Only Benchmark Test\n');
  console.log('=' .repeat(60));

  try {
    // Initialize dependencies
    console.log('📦 Initializing dependencies...');
    const logger = new Logger();
    const config = new ConfigService();
    const mcpCompliance = new Context7MCPComplianceService(logger, config);
    const monitoring = new Context7MonitoringService(logger);
    const cache = new Context7AdvancedCacheService(logger, config);
    
    // Create enhance tool with dependencies
    const enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      mcpCompliance,
      monitoring,
      cache
    );

    console.log('✅ Dependencies initialized\n');

    // Run test cases
    for (const testCase of testCases) {
      console.log(`\n🧪 Running test: ${testCase.name}`);
      console.log(`📝 Prompt: ${testCase.prompt}`);
      console.log(`🔧 Context: ${JSON.stringify(testCase.context)}`);
      
      const testStart = Date.now();
      metrics.totalTests++;

      try {
        const result = await enhanceTool.enhance({
          prompt: testCase.prompt,
          context: testCase.context
        });

        const testTime = Date.now() - testStart;
        metrics.totalTime += testTime;

        // Analyze results
        const analysis = analyzeTestResult(testCase, result, testTime);
        
        if (analysis.passed) {
          metrics.passedTests++;
          console.log(`✅ PASSED (${testTime}ms)`);
        } else {
          metrics.failedTests++;
          console.log(`❌ FAILED (${testTime}ms)`);
          console.log(`   Reason: ${analysis.reason}`);
        }

        // Update metrics
        updateMetrics(analysis, result);

        // Log detailed results
        logTestDetails(analysis, result);

      } catch (error) {
        metrics.failedTests++;
        const testTime = Date.now() - testStart;
        metrics.totalTime += testTime;
        
        console.log(`❌ ERROR (${testTime}ms): ${error.message}`);
      }
    }

    // Generate final report
    generateFinalReport();

  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

function analyzeTestResult(testCase, result, testTime) {
  const analysis = {
    passed: true,
    reason: '',
    tokenEfficiency: 0,
    qualityScore: 0,
    relevanceScore: 0,
    context7Metrics: {
      libraryResolutionTime: 0,
      contentExtractionTime: 0,
      preprocessingTime: 0,
      filteringTime: 0,
      cacheHit: false
    }
  };

  // Check if enhancement was successful
  if (!result.success) {
    analysis.passed = false;
    analysis.reason = `Enhancement failed: ${result.error}`;
    return analysis;
  }

  // Check if enhanced prompt is longer than original
  const originalLength = testCase.prompt.length;
  const enhancedLength = result.enhanced_prompt.length;
  
  if (enhancedLength <= originalLength) {
    analysis.passed = false;
    analysis.reason = 'Enhanced prompt is not longer than original';
    return analysis;
  }

  // Calculate token efficiency (simplified)
  analysis.tokenEfficiency = enhancedLength / originalLength;

  // Check if Context7 docs were included
  if (!result.context_used.context7_docs || result.context_used.context7_docs.length === 0) {
    analysis.passed = false;
    analysis.reason = 'No Context7 documentation included';
    return analysis;
  }

  // Check if code snippets were included
  if (!result.context_used.code_snippets || result.context_used.code_snippets.length === 0) {
    analysis.passed = false;
    analysis.reason = 'No code snippets included';
    return analysis;
  }

  // Calculate quality score based on content
  analysis.qualityScore = calculateQualityScore(result);
  analysis.relevanceScore = calculateRelevanceScore(testCase, result);

  // Extract Context7 metrics from metadata
  if (result.context_used.metadata) {
    analysis.context7Metrics = {
      libraryResolutionTime: result.context_used.metadata.response_time || 0,
      contentExtractionTime: 0, // Not directly available
      preprocessingTime: 0, // Not directly available
      filteringTime: 0, // Not directly available
      cacheHit: result.context_used.metadata.cache_hit || false
    };
  }

  return analysis;
}

function calculateQualityScore(result) {
  let score = 0;
  const maxScore = 100;

  // Length score (optimal length gets higher score)
  const length = result.enhanced_prompt.length;
  if (length > 200 && length < 2000) {
    score += 20;
  } else if (length > 2000) {
    score += 10;
  }

  // Code examples score
  const codeBlocks = (result.enhanced_prompt.match(/```/g) || []).length / 2;
  score += Math.min(codeBlocks * 10, 30);

  // Structure score
  const headers = (result.enhanced_prompt.match(/^#+\s+/gm) || []).length;
  score += Math.min(headers * 2, 20);

  // Context7 docs score
  if (result.context_used.context7_docs && result.context_used.context7_docs.length > 0) {
    score += 20;
  }

  // Code snippets score
  if (result.context_used.code_snippets && result.context_used.code_snippets.length > 0) {
    score += 10;
  }

  return Math.min(score, maxScore);
}

function calculateRelevanceScore(testCase, result) {
  let score = 0;
  const maxScore = 100;

  // Check for framework-specific keywords
  const frameworkKeywords = getFrameworkKeywords(testCase.context.framework);
  const content = result.enhanced_prompt.toLowerCase();
  
  for (const keyword of frameworkKeywords) {
    if (content.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }

  // Check for prompt-specific keywords
  const promptWords = testCase.prompt.toLowerCase().split(/\s+/);
  for (const word of promptWords) {
    if (word.length > 3 && content.includes(word)) {
      score += 5;
    }
  }

  return Math.min(score, maxScore);
}

function getFrameworkKeywords(framework) {
  const keywords = {
    'html': ['html', 'element', 'tag', 'attribute', 'semantic'],
    'react': ['react', 'component', 'hook', 'jsx', 'state', 'props'],
    'nextjs': ['next', 'nextjs', 'server', 'client', 'api', 'route'],
    'typescript': ['typescript', 'type', 'interface', 'generic', 'enum'],
    'vue': ['vue', 'component', 'directive', 'composable', 'ref']
  };
  
  return keywords[framework] || [];
}

function updateMetrics(analysis, result) {
  // Update Context7 metrics
  metrics.context7OnlyMetrics.libraryResolutionTime += analysis.context7Metrics.libraryResolutionTime;
  metrics.context7OnlyMetrics.contentExtractionTime += analysis.context7Metrics.contentExtractionTime;
  metrics.context7OnlyMetrics.preprocessingTime += analysis.context7Metrics.preprocessingTime;
  metrics.context7OnlyMetrics.filteringTime += analysis.context7Metrics.filteringTime;
  
  if (analysis.context7Metrics.cacheHit) {
    metrics.context7OnlyMetrics.cacheHits++;
  } else {
    metrics.context7OnlyMetrics.cacheMisses++;
  }

  // Update quality metrics
  metrics.qualityMetrics.averageTokenEfficiency += analysis.tokenEfficiency;
  metrics.qualityMetrics.averageQualityScore += analysis.qualityScore;
  metrics.qualityMetrics.averageRelevanceScore += analysis.relevanceScore;
}

function logTestDetails(analysis, result) {
  console.log(`   📊 Token Efficiency: ${analysis.tokenEfficiency.toFixed(2)}x`);
  console.log(`   🎯 Quality Score: ${analysis.qualityScore}/100`);
  console.log(`   🔗 Relevance Score: ${analysis.relevanceScore}/100`);
  console.log(`   📚 Context7 Docs: ${result.context_used.context7_docs?.length || 0} sections`);
  console.log(`   💻 Code Snippets: ${result.context_used.code_snippets?.length || 0} examples`);
  console.log(`   ⚡ Cache Hit: ${analysis.context7Metrics.cacheHit ? 'Yes' : 'No'}`);
  
  if (result.context_used.metadata) {
    console.log(`   ⏱️  Response Time: ${result.context_used.metadata.response_time || 0}ms`);
    console.log(`   📚 Libraries Resolved: ${result.context_used.metadata.libraries_resolved?.length || 0}`);
  }
}

function generateFinalReport() {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 CONTEXT7-ONLY BENCHMARK RESULTS');
  console.log('=' .repeat(60));

  // Overall results
  console.log(`\n🎯 Overall Results:`);
  console.log(`   Total Tests: ${metrics.totalTests}`);
  console.log(`   Passed: ${metrics.passedTests} (${((metrics.passedTests / metrics.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   Failed: ${metrics.failedTests} (${((metrics.failedTests / metrics.totalTests) * 100).toFixed(1)}%)`);
  console.log(`   Total Time: ${metrics.totalTime}ms`);
  console.log(`   Average Time: ${(metrics.totalTime / metrics.totalTests).toFixed(0)}ms per test`);

  // Context7-specific metrics
  console.log(`\n🔧 Context7-Only Metrics:`);
  console.log(`   Library Resolution Time: ${metrics.context7OnlyMetrics.libraryResolutionTime}ms`);
  console.log(`   Content Extraction Time: ${metrics.context7OnlyMetrics.contentExtractionTime}ms`);
  console.log(`   Preprocessing Time: ${metrics.context7OnlyMetrics.preprocessingTime}ms`);
  console.log(`   Filtering Time: ${metrics.context7OnlyMetrics.filteringTime}ms`);
  console.log(`   Cache Hits: ${metrics.context7OnlyMetrics.cacheHits}`);
  console.log(`   Cache Misses: ${metrics.context7OnlyMetrics.cacheMisses}`);
  console.log(`   Cache Hit Rate: ${((metrics.context7OnlyMetrics.cacheHits / (metrics.context7OnlyMetrics.cacheHits + metrics.context7OnlyMetrics.cacheMisses)) * 100).toFixed(1)}%`);

  // Quality metrics
  console.log(`\n📈 Quality Metrics:`);
  console.log(`   Average Token Efficiency: ${(metrics.qualityMetrics.averageTokenEfficiency / metrics.totalTests).toFixed(2)}x`);
  console.log(`   Average Quality Score: ${(metrics.qualityMetrics.averageQualityScore / metrics.totalTests).toFixed(1)}/100`);
  console.log(`   Average Relevance Score: ${(metrics.qualityMetrics.averageRelevanceScore / metrics.totalTests).toFixed(1)}/100`);

  // Performance assessment
  console.log(`\n⚡ Performance Assessment:`);
  const avgTime = metrics.totalTime / metrics.totalTests;
  if (avgTime < 1000) {
    console.log(`   ✅ Excellent performance (${avgTime.toFixed(0)}ms average)`);
  } else if (avgTime < 2000) {
    console.log(`   ⚠️  Good performance (${avgTime.toFixed(0)}ms average)`);
  } else {
    console.log(`   ❌ Poor performance (${avgTime.toFixed(0)}ms average)`);
  }

  // Quality assessment
  const avgQuality = metrics.qualityMetrics.averageQualityScore / metrics.totalTests;
  if (avgQuality >= 80) {
    console.log(`   ✅ Excellent quality (${avgQuality.toFixed(1)}/100 average)`);
  } else if (avgQuality >= 60) {
    console.log(`   ⚠️  Good quality (${avgQuality.toFixed(1)}/100 average)`);
  } else {
    console.log(`   ❌ Poor quality (${avgQuality.toFixed(1)}/100 average)`);
  }

  // Success criteria
  console.log(`\n🎯 Success Criteria:`);
  const passRate = (metrics.passedTests / metrics.totalTests) * 100;
  const qualityThreshold = avgQuality >= 70;
  const performanceThreshold = avgTime < 1500;
  
  console.log(`   Pass Rate: ${passRate.toFixed(1)}% ${passRate >= 80 ? '✅' : '❌'}`);
  console.log(`   Quality Threshold (≥70): ${qualityThreshold ? '✅' : '❌'}`);
  console.log(`   Performance Threshold (<1500ms): ${performanceThreshold ? '✅' : '❌'}`);
  
  const overallSuccess = passRate >= 80 && qualityThreshold && performanceThreshold;
  console.log(`\n🏆 Overall Success: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);

  console.log('\n✅ Context7-Only Benchmark completed!');
}

// Run the benchmark
runBenchmark();
