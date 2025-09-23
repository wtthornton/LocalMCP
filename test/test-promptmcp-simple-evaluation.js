#!/usr/bin/env node

/**
 * Simple PromptMCP Evaluation Test Suite
 * 
 * Tests 5 prompts of varying complexity using the local MCP server
 * Provides detailed scoring and analysis of enhancement effectiveness
 */

import { EnhancedContext7EnhanceTool } from '../dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { Context7IntegrationService } from '../dist/services/context7/context7-integration.service.js';
import { SimpleContext7Client } from '../dist/services/context7/simple-context7-client.js';
import { FrameworkDetectorService } from '../dist/services/framework-detector/framework-detector.service.js';
import { Context7CacheService } from '../dist/services/framework-detector/context7-cache.service.js';
import { PromptCacheService } from '../dist/services/cache/prompt-cache.service.js';
import { ProjectContextAnalyzer } from '../dist/services/framework-detector/project-context-analyzer.service.js';
import { CacheAnalyticsService } from '../dist/services/cache/cache-analytics.service.js';
import { TodoService } from '../dist/services/todo/todo.service.js';
import { writeFileSync } from 'fs';

// Test prompts with varying complexity levels
const TEST_PROMPTS = [
  {
    id: 'simple',
    name: 'Simple Question',
    prompt: 'How do I create a button?',
    expectedComplexity: 'simple',
    expectedFrameworks: ['html', 'css'],
    context: { framework: 'html', style: 'css' }
  },
  {
    id: 'medium',
    name: 'Medium Complexity Task',
    prompt: 'Create a React component that displays a list of users with search functionality',
    expectedComplexity: 'medium',
    expectedFrameworks: ['react', 'typescript'],
    context: { framework: 'react', style: 'tailwind' }
  },
  {
    id: 'complex',
    name: 'Complex Development Task',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    expectedComplexity: 'complex',
    expectedFrameworks: ['nextjs', 'typescript', 'postgresql'],
    context: { framework: 'nextjs', style: 'tailwind' }
  },
  {
    id: 'debug',
    name: 'Debug/Error Fix Task',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    expectedComplexity: 'medium',
    expectedFrameworks: ['typescript'],
    context: { framework: 'typescript', file: 'src/api/handler.ts' }
  },
  {
    id: 'optimization',
    name: 'Performance Optimization Task',
    prompt: 'Optimize this React component for better performance and reduce bundle size',
    expectedComplexity: 'complex',
    expectedFrameworks: ['react', 'typescript'],
    context: { framework: 'react', style: 'performance' }
  }
];

class PromptMCPEvaluator {
  constructor() {
    this.results = [];
    this.scorecard = {
      overall: {
        totalTests: 0,
        averageScore: 0,
        successRate: 0
      },
      components: {
        context7Integration: { scores: [], average: 0 },
        frameworkDetection: { scores: [], average: 0 },
        projectAnalysis: { scores: [], average: 0 },
        codePatterns: { scores: [], average: 0 },
        promptEnhancement: { scores: [], average: 0 },
        responseQuality: { scores: [], average: 0 }
      }
    };
    this.enhanceTool = null;
  }

  /**
   * Initialize the enhance tool with all required services
   */
  async initialize() {
    console.log('🔧 Initializing PromptMCP services...');
    
    const logger = new Logger('PromptMCP-Evaluation');
    const config = new ConfigService();
    const context7Client = new SimpleContext7Client(config);
    const frameworkCache = new Context7CacheService();
    const frameworkDetector = new FrameworkDetectorService(context7Client, frameworkCache);
    const promptCache = new PromptCacheService(logger, config);
    const projectAnalyzer = new ProjectContextAnalyzer(logger);
    const cacheAnalytics = new CacheAnalyticsService(logger, null, promptCache);
    const todoService = new TodoService('test-todos.db');
    
    this.enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      context7Client,
      frameworkDetector,
      promptCache,
      projectAnalyzer,
      cacheAnalytics,
      todoService
    );
    
    console.log('✅ Services initialized successfully\n');
  }

  /**
   * Evaluate a single prompt enhancement
   */
  async evaluatePrompt(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Original: ${testCase.prompt}`);
    console.log(`🔧 Context: ${JSON.stringify(testCase.context)}`);

    const startTime = Date.now();
    
    try {
      const request = {
        prompt: testCase.prompt,
        context: testCase.context,
        options: {
          maxTokens: 4000,
          includeMetadata: true
        }
      };

      const result = await this.enhanceTool.enhance(request);
      const responseTime = Date.now() - startTime;

      console.log(`⏱️  Response time: ${responseTime}ms`);
      console.log(`✅ Success: ${result.success}`);

      const evaluation = this.scoreEnhancement(testCase, result, responseTime);
      
      const testResult = {
        testCase,
        originalPrompt: testCase.prompt,
        enhancedPrompt: result.enhanced_prompt,
        contextUsed: result.context_used,
        success: result.success,
        responseTime,
        evaluation,
        timestamp: new Date().toISOString()
      };

      this.results.push(testResult);
      this.updateScorecard(evaluation);

      console.log(`✅ Score: ${evaluation.overallScore}/100`);
      console.log(`📊 Components: Context7(${evaluation.components.context7Integration}), Framework(${evaluation.components.frameworkDetection}), Project(${evaluation.components.projectAnalysis})`);

      return testResult;

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      
      const failedResult = {
        testCase,
        originalPrompt: testCase.prompt,
        enhancedPrompt: '',
        contextUsed: {},
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        evaluation: this.scoreEnhancement(testCase, { enhanced_prompt: '', context_used: {}, success: false }, Date.now() - startTime, error.message),
        timestamp: new Date().toISOString()
      };

      this.results.push(failedResult);
      return failedResult;
    }
  }

  /**
   * Score the enhancement effectiveness
   */
  scoreEnhancement(testCase, result, responseTime, error = null) {
    if (error || !result.success) {
      return {
        overallScore: 0,
        components: {
          context7Integration: 0,
          frameworkDetection: 0,
          projectAnalysis: 0,
          codePatterns: 0,
          promptEnhancement: 0,
          responseQuality: 0,
          todoIntegration: 0
        },
        strengths: [],
        weaknesses: ['Request failed', 'No enhancement provided'],
        recommendations: ['Fix server connectivity', 'Check service initialization']
      };
    }

    const components = {};

    // 1. Context7 Integration Score (0-20 points)
    components.context7Integration = this.scoreContext7Integration(result.context_used);

    // 2. Framework Detection Score (0-20 points)
    components.frameworkDetection = this.scoreFrameworkDetection(testCase, result.context_used);

    // 3. Project Analysis Score (0-15 points)
    components.projectAnalysis = this.scoreProjectAnalysis(result.context_used);

    // 4. Code Patterns Score (0-15 points)
    components.codePatterns = this.scoreCodePatterns(result.context_used);

    // 5. Prompt Enhancement Quality (0-20 points)
    components.promptEnhancement = this.scorePromptEnhancement(testCase, result.enhanced_prompt);

    // 6. Response Quality (0-10 points)
    components.responseQuality = this.scoreResponseQuality(responseTime, result.enhanced_prompt);

    // 7. Todo Integration Score (0-15 points)
    components.todoIntegration = this.scoreTodoIntegration(testCase, result.enhanced_prompt);

    const overallScore = Object.values(components).reduce((sum, score) => sum + score, 0);

    const { strengths, weaknesses, recommendations } = this.analyzeEnhancement(
      testCase, result.enhanced_prompt, result.context_used, components
    );

    return {
      overallScore,
      components,
      strengths,
      weaknesses,
      recommendations
    };
  }

  /**
   * Score Context7 integration effectiveness
   */
  scoreContext7Integration(contextUsed) {
    let score = 0;
    
    if (contextUsed.context7_docs && contextUsed.context7_docs.length > 0) {
      score += 10; // Has Context7 docs
      
      const docsContent = contextUsed.context7_docs.join(' ');
      if (docsContent.includes('Documentation:') || docsContent.includes('Best Practices:')) {
        score += 5; // Well-formatted docs
      }
      
      if (docsContent.length > 500) {
        score += 5; // Substantial content
      }
    }

    return Math.min(score, 20);
  }

  /**
   * Score framework detection effectiveness
   */
  scoreFrameworkDetection(testCase, contextUsed) {
    let score = 0;
    
    if (contextUsed.framework_docs && contextUsed.framework_docs.length > 0) {
      score += 10; // Has framework docs
      
      const frameworkDocs = contextUsed.framework_docs.join(' ');
      const expectedFrameworks = testCase.expectedFrameworks;
      
      let detectedFrameworks = 0;
      expectedFrameworks.forEach(framework => {
        if (frameworkDocs.toLowerCase().includes(framework.toLowerCase())) {
          detectedFrameworks++;
        }
      });
      
      score += (detectedFrameworks / expectedFrameworks.length) * 10; // Proportional to detection accuracy
    }

    return Math.min(score, 20);
  }

  /**
   * Score project analysis effectiveness
   */
  scoreProjectAnalysis(contextUsed) {
    let score = 0;
    
    if (contextUsed.repo_facts && contextUsed.repo_facts.length > 0) {
      score += 5; // Has repo facts
      
      const facts = contextUsed.repo_facts.join(' ');
      if (facts.includes('Project name:') || facts.includes('TypeScript')) {
        score += 5; // Relevant project info
      }
      
      if (contextUsed.repo_facts.length > 5) {
        score += 5; // Comprehensive analysis
      }
    }

    return Math.min(score, 15);
  }

  /**
   * Score code patterns effectiveness
   */
  scoreCodePatterns(contextUsed) {
    let score = 0;
    
    if (contextUsed.code_snippets && contextUsed.code_snippets.length > 0) {
      score += 5; // Has code snippets
      
      const snippets = contextUsed.code_snippets.join(' ');
      if (snippets.includes('function') || snippets.includes('class') || snippets.includes('const')) {
        score += 5; // Actual code patterns
      }
      
      if (contextUsed.code_snippets.length > 3) {
        score += 5; // Multiple patterns
      }
    }

    return Math.min(score, 15);
  }

  /**
   * Score prompt enhancement quality
   */
  scorePromptEnhancement(testCase, enhancedPrompt) {
    if (!enhancedPrompt || enhancedPrompt.length === 0) {
      return 0;
    }

    let score = 0;
    
    // Length improvement (original vs enhanced)
    const lengthImprovement = enhancedPrompt.length / testCase.prompt.length;
    if (lengthImprovement > 2) {
      score += 5; // Substantial enhancement
    } else if (lengthImprovement > 1.5) {
      score += 3; // Good enhancement
    } else {
      score += 1; // Minimal enhancement
    }

    // Content quality indicators
    if (enhancedPrompt.includes('##') || enhancedPrompt.includes('###')) {
      score += 3; // Well-structured
    }
    
    if (enhancedPrompt.includes('Best Practices') || enhancedPrompt.includes('Documentation')) {
      score += 4; // Includes best practices
    }
    
    if (enhancedPrompt.includes('Context:') || enhancedPrompt.includes('Repository:')) {
      score += 4; // Includes context
    }
    
    if (enhancedPrompt.includes('Instructions:') || enhancedPrompt.includes('Make your response')) {
      score += 4; // Includes clear instructions
    }

    return Math.min(score, 20);
  }

  /**
   * Score response quality
   */
  scoreResponseQuality(responseTime, enhancedPrompt) {
    let score = 0;
    
    // Response time scoring
    if (responseTime < 1000) {
      score += 5; // Fast response
    } else if (responseTime < 3000) {
      score += 3; // Acceptable response
    } else {
      score += 1; // Slow response
    }
    
    // Content quality
    if (enhancedPrompt && enhancedPrompt.length > 100) {
      score += 3; // Substantial content
    }
    
    if (enhancedPrompt && !enhancedPrompt.includes('undefined') && !enhancedPrompt.includes('null')) {
      score += 2; // Clean content
    }

    return Math.min(score, 10);
  }

  /**
   * Score todo integration effectiveness
   */
  scoreTodoIntegration(testCase, enhancedPrompt) {
    let score = 0;
    
    // Check if enhanced prompt includes task context
    if (enhancedPrompt && enhancedPrompt.includes('## Current Project Tasks:')) {
      score += 8; // Task context section present
    }
    
    // Check for task-related content
    if (enhancedPrompt && enhancedPrompt.includes('- ')) {
      const taskLines = enhancedPrompt.match(/- .+/g);
      if (taskLines && taskLines.length > 0) {
        score += 4; // Task items present
      }
    }
    
    // Check for project context awareness
    if (enhancedPrompt && (enhancedPrompt.includes('project') || enhancedPrompt.includes('task'))) {
      score += 3; // Project/task awareness
    }
    
    return Math.min(score, 15);
  }

  /**
   * Analyze enhancement strengths and weaknesses
   */
  analyzeEnhancement(testCase, enhancedPrompt, contextUsed, components) {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    // Analyze strengths
    if (components.context7Integration > 15) {
      strengths.push('Excellent Context7 integration with comprehensive documentation');
    } else if (components.context7Integration > 10) {
      strengths.push('Good Context7 integration');
    }

    if (components.frameworkDetection > 15) {
      strengths.push('Accurate framework detection and relevant documentation');
    } else if (components.frameworkDetection > 10) {
      strengths.push('Decent framework detection');
    }

    if (components.projectAnalysis > 10) {
      strengths.push('Comprehensive project analysis');
    }

    if (components.codePatterns > 10) {
      strengths.push('Relevant code patterns extracted');
    }

    if (components.promptEnhancement > 15) {
      strengths.push('High-quality prompt enhancement with clear structure');
    }

    // Analyze weaknesses
    if (components.context7Integration < 5) {
      weaknesses.push('Poor or missing Context7 integration');
      recommendations.push('Improve Context7 library resolution and documentation fetching');
    }

    if (components.frameworkDetection < 5) {
      weaknesses.push('Inaccurate or missing framework detection');
      recommendations.push('Enhance framework detection algorithms');
    }

    if (components.projectAnalysis < 5) {
      weaknesses.push('Limited project analysis');
      recommendations.push('Improve repository scanning and analysis');
    }

    if (components.codePatterns < 5) {
      weaknesses.push('Few or irrelevant code patterns');
      recommendations.push('Enhance code pattern extraction and relevance scoring');
    }

    if (components.promptEnhancement < 10) {
      weaknesses.push('Minimal prompt enhancement');
      recommendations.push('Improve prompt enhancement algorithms and context integration');
    }

    if (components.responseQuality < 5) {
      weaknesses.push('Poor response quality or performance');
      recommendations.push('Optimize response generation and caching');
    }

    return { strengths, weaknesses, recommendations };
  }

  /**
   * Update the overall scorecard
   */
  updateScorecard(evaluation) {
    this.scorecard.overall.totalTests++;
    this.scorecard.overall.averageScore = 
      (this.scorecard.overall.averageScore * (this.scorecard.overall.totalTests - 1) + evaluation.overallScore) / 
      this.scorecard.overall.totalTests;

    // Update component scores
    Object.keys(evaluation.components).forEach(component => {
      this.scorecard.components[component].scores.push(evaluation.components[component]);
      this.scorecard.components[component].average = 
        this.scorecard.components[component].scores.reduce((sum, score) => sum + score, 0) / 
        this.scorecard.components[component].scores.length;
    });

    // Update success rate
    const successfulTests = this.results.filter(r => r.success).length;
    this.scorecard.overall.successRate = (successfulTests / this.scorecard.overall.totalTests) * 100;
  }

  /**
   * Generate detailed scorecard report
   */
  generateScorecard() {
    const scorecard = {
      summary: {
        totalTests: this.scorecard.overall.totalTests,
        averageScore: Math.round(this.scorecard.overall.averageScore * 100) / 100,
        successRate: Math.round(this.scorecard.overall.successRate * 100) / 100,
        grade: this.getGrade(this.scorecard.overall.averageScore)
      },
      componentAnalysis: {},
      testResults: this.results.map(result => ({
        testName: result.testCase.name,
        complexity: result.testCase.expectedComplexity,
        originalPrompt: result.originalPrompt,
        enhancedPrompt: result.enhancedPrompt.substring(0, 300) + (result.enhancedPrompt.length > 300 ? '...' : ''),
        score: result.evaluation.overallScore,
        responseTime: result.responseTime,
        success: result.success,
        strengths: result.evaluation.strengths,
        weaknesses: result.evaluation.weaknesses,
        recommendations: result.evaluation.recommendations,
        componentScores: result.evaluation.components
      })),
      recommendations: this.generateOverallRecommendations()
    };

    // Component analysis
    Object.keys(this.scorecard.components).forEach(component => {
      const comp = this.scorecard.components[component];
      scorecard.componentAnalysis[component] = {
        averageScore: Math.round(comp.average * 100) / 100,
        maxScore: Math.max(...comp.scores),
        minScore: Math.min(...comp.scores),
        grade: this.getGrade(comp.average),
        trend: this.calculateTrend(comp.scores)
      };
    });

    return scorecard;
  }

  /**
   * Get letter grade based on score
   */
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Calculate trend (improving, declining, stable)
   */
  calculateTrend(scores) {
    if (scores.length < 2) return 'stable';
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 2) return 'improving';
    if (secondAvg < firstAvg - 2) return 'declining';
    return 'stable';
  }

  /**
   * Generate overall recommendations
   */
  generateOverallRecommendations() {
    const recommendations = [];
    
    // Component-specific recommendations
    Object.keys(this.scorecard.components).forEach(component => {
      const comp = this.scorecard.components[component];
      if (comp.average < 10) {
        recommendations.push(`Improve ${component} - current average: ${Math.round(comp.average * 100) / 100}/20`);
      }
    });

    // Overall recommendations
    if (this.scorecard.overall.averageScore < 60) {
      recommendations.push('Overall system needs significant improvement');
    } else if (this.scorecard.overall.averageScore < 80) {
      recommendations.push('System is functional but has room for improvement');
    } else {
      recommendations.push('System is performing well');
    }

    if (this.scorecard.overall.successRate < 80) {
      recommendations.push('Improve system reliability and error handling');
    }

    return recommendations;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Comprehensive PromptMCP Evaluation');
    console.log('=' .repeat(60));

    await this.initialize();

    for (const testCase of TEST_PROMPTS) {
      await this.evaluatePrompt(testCase);
    }

    console.log('\n📊 Generating Scorecard...');
    const scorecard = this.generateScorecard();

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promptmcp-evaluation-${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(scorecard, null, 2));

    // Display summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 EVALUATION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${scorecard.summary.totalTests}`);
    console.log(`Average Score: ${scorecard.summary.averageScore}/100 (${scorecard.summary.grade})`);
    console.log(`Success Rate: ${scorecard.summary.successRate}%`);
    
    console.log('\n📊 COMPONENT ANALYSIS');
    console.log('-'.repeat(40));
    Object.keys(scorecard.componentAnalysis).forEach(component => {
      const comp = scorecard.componentAnalysis[component];
      console.log(`${component}: ${comp.averageScore}/20 (${comp.grade}) - ${comp.trend}`);
    });

    console.log('\n🎯 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    scorecard.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n📋 DETAILED TEST RESULTS');
    console.log('-'.repeat(40));
    scorecard.testResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.testName} (${result.complexity})`);
      console.log(`   Score: ${result.score}/100`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      if (result.strengths.length > 0) {
        console.log(`   Strengths: ${result.strengths.join(', ')}`);
      }
      if (result.weaknesses.length > 0) {
        console.log(`   Weaknesses: ${result.weaknesses.join(', ')}`);
      }
    });

    console.log(`\n📄 Detailed results saved to: ${filename}`);
    console.log('=' .repeat(60));

    return scorecard;
  }
}

// Run the evaluation
async function main() {
  const evaluator = new PromptMCPEvaluator();
  
  try {
    await evaluator.runAllTests();
  } catch (error) {
    console.error('❌ Evaluation failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
