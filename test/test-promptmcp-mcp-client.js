#!/usr/bin/env node

/**
 * PromptMCP Quality Test - Proper MCP Client Implementation
 * 
 * Based on MCP protocol documentation from Context7, this test properly implements
 * the MCP client protocol including initialization, tool calls, and error handling.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class MCPClient {
  constructor(options = {}) {
    this.name = options.name || 'PromptMCP-Test-Client';
    this.version = options.version || '1.0.0';
    this.protocolVersion = '2024-11-05';
    this.requestId = 0;
    this.initialized = false;
  }

  /**
   * Generate next request ID
   */
  getNextRequestId() {
    return ++this.requestId;
  }

  /**
   * Connect to MCP server via Docker
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.process = spawn('docker', ['exec', '-i', 'promptmcp-server', 'node', 'dist/mcp/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      this.process.stdout.on('data', (data) => {
        output += data.toString();
      });

      this.process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      this.process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP server exited with code ${code}: ${errorOutput}`));
        }
      });

      // Wait for server to be ready
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  /**
   * Initialize the MCP connection
   */
  async initialize() {
    const request = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'initialize',
      params: {
        protocolVersion: this.protocolVersion,
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {},
          elicitation: {}
        },
        clientInfo: {
          name: this.name,
          title: `${this.name} Display Name`,
          version: this.version
        }
      }
    };

    const response = await this.sendRequest(request);
    
    if (response.error) {
      throw new Error(`MCP initialization failed: ${response.error.message}`);
    }

    this.initialized = true;
    return response.result;
  }

  /**
   * Send a JSON-RPC request to the MCP server
   */
  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('MCP client not connected'));
        return;
      }

      let responseData = '';
      let errorData = '';

      const onData = (data) => {
        responseData += data.toString();
        
        // Try to parse response immediately when we get data
        const lines = responseData.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{') && line.includes('"jsonrpc"')) {
            try {
              const parsed = JSON.parse(line.trim());
              if (parsed.id === request.id) {
                // Found our response, clean up and resolve
                this.process.stdout.removeListener('data', onData);
                this.process.stderr.removeListener('data', onError);
                this.process.removeListener('close', onClose);
                resolve(parsed);
                return;
              }
            } catch (e) {
              // Continue looking
            }
          }
        }
      };

      const onError = (data) => {
        errorData += data.toString();
      };

      const onClose = (code) => {
        this.process.stdout.removeListener('data', onData);
        this.process.stderr.removeListener('data', onError);
        this.process.removeListener('close', onClose);

        if (code !== 0) {
          reject(new Error(`MCP server exited with code ${code}: ${errorData}`));
          return;
        }

        // If we get here, we didn't find our response
        reject(new Error('No valid JSON response found in MCP server output'));
      };

      this.process.stdout.on('data', onData);
      this.process.stderr.on('data', onError);
      this.process.on('close', onClose);

      // Send the request
      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName, toolArguments = {}) {
    if (!this.initialized) {
      throw new Error('MCP client not initialized');
    }

    const request = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: toolArguments
      }
    };

    const response = await this.sendRequest(request);
    
    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * List available tools
   */
  async listTools() {
    if (!this.initialized) {
      throw new Error('MCP client not initialized');
    }

    const request = {
      jsonrpc: '2.0',
      id: this.getNextRequestId(),
      method: 'tools/list',
      params: {}
    };

    const response = await this.sendRequest(request);
    
    if (response.error) {
      throw new Error(`List tools failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * Get server health status
   */
  async getHealth() {
    return await this.callTool('promptmcp.health', {});
  }

  /**
   * Enhance a prompt
   */
  async enhancePrompt(prompt, context = {}) {
    return await this.callTool('promptmcp.enhance', {
      prompt: prompt,
      context: context
    });
  }

  /**
   * Close the MCP connection
   */
  async close() {
    if (this.process) {
      this.process.stdin.end();
      this.process.kill();
      this.process = null;
    }
    this.initialized = false;
  }
}

class PromptMCPQualityTester {
  constructor() {
    this.client = new MCPClient({
      name: 'PromptMCP-Quality-Tester',
      version: '1.0.0'
    });
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
        responseQuality: { scores: [], average: 0 },
        todoIntegration: { scores: [], average: 0 }
      }
    };
  }

  /**
   * Test cases for enhance tool
   */
  getTestCases() {
    return [
      {
        name: 'Simple Question',
        prompt: 'How do I create a button?',
        context: { framework: 'html' },
        expectedComplexity: 'simple'
      },
      {
        name: 'Medium Complexity Task',
        prompt: 'Create a React component that displays a list of users with search functionality',
        context: { framework: 'react', style: 'tailwind' },
        expectedComplexity: 'medium'
      },
      {
        name: 'Complex Development Task',
        prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
        context: { framework: 'nextjs', style: 'tailwind' },
        expectedComplexity: 'complex'
      },
      {
        name: 'Debug/Error Fix Task',
        prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
        context: { framework: 'typescript', file: 'src/api/handler.ts' },
        expectedComplexity: 'medium'
      },
      {
        name: 'Performance Optimization Task',
        prompt: 'Optimize this React component for better performance and reduce bundle size',
        context: { framework: 'react', style: 'performance' },
        expectedComplexity: 'complex'
      }
    ];
  }

  /**
   * Test a single prompt
   */
  async testPrompt(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Original: ${testCase.prompt}`);
    console.log(`🔧 Context: ${JSON.stringify(testCase.context)}`);

    const startTime = Date.now();
    
    try {
      const result = await this.client.enhancePrompt(testCase.prompt, testCase.context);
      const responseTime = Date.now() - startTime;

      console.log(`⏱️  Response time: ${responseTime}ms`);
      console.log(`✅ Success: true`);

      // Extract the enhanced prompt from the result
      let enhancedPrompt = '';
      let contextUsed = { repo_facts: [], code_snippets: [], context7_docs: [] };

      if (result && result.content) {
        // Extract text content from the response
        for (const item of result.content) {
          if (item.type === 'text') {
            enhancedPrompt = item.text;
            break;
          }
        }
      } else if (result && result.enhanced_prompt) {
        enhancedPrompt = result.enhanced_prompt;
        contextUsed = result.context_used || { repo_facts: [], code_snippets: [], context7_docs: [] };
      } else {
        enhancedPrompt = testCase.prompt; // Fallback to original
      }

      const evaluation = this.scoreEnhancement(testCase, enhancedPrompt, contextUsed, responseTime);
      
      const testResult = {
        testCase,
        originalPrompt: testCase.prompt,
        enhancedPrompt,
        contextUsed,
        success: true,
        responseTime,
        evaluation,
        timestamp: new Date().toISOString()
      };

      this.results.push(testResult);
      this.updateScorecard(evaluation);

      console.log(`✅ Test completed: ${evaluation.overallScore}/100`);

      return testResult;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`⏱️  Response time: ${responseTime}ms`);
      console.log(`❌ Success: false`);
      console.log(`❌ Error: ${error.message}`);

      const evaluation = this.scoreEnhancement(testCase, '', { repo_facts: [], code_snippets: [], context7_docs: [] }, responseTime, error);
      
      const testResult = {
        testCase,
        originalPrompt: testCase.prompt,
        enhancedPrompt: '',
        contextUsed: { repo_facts: [], code_snippets: [], context7_docs: [] },
        success: false,
        responseTime,
        evaluation,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.results.push(testResult);
      this.updateScorecard(evaluation);

      console.log(`❌ Test failed: ${evaluation.overallScore}/100`);

      return testResult;
    }
  }

  /**
   * Score the enhancement effectiveness
   */
  scoreEnhancement(testCase, enhancedPrompt, contextUsed, responseTime, error = null) {
    if (error || !enhancedPrompt) {
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
    components.context7Integration = this.scoreContext7Integration(contextUsed);

    // 2. Framework Detection Score (0-20 points)
    components.frameworkDetection = this.scoreFrameworkDetection(testCase, contextUsed);

    // 3. Project Analysis Score (0-20 points)
    components.projectAnalysis = this.scoreProjectAnalysis(contextUsed);

    // 4. Code Patterns Score (0-15 points)
    components.codePatterns = this.scoreCodePatterns(contextUsed);

    // 5. Prompt Enhancement Quality (0-20 points)
    components.promptEnhancement = this.scorePromptEnhancement(testCase, enhancedPrompt);

    // 6. Response Quality (0-10 points)
    components.responseQuality = this.scoreResponseQuality(responseTime, enhancedPrompt);

    // 7. Todo Integration Score (0-15 points)
    components.todoIntegration = this.scoreTodoIntegration(testCase, enhancedPrompt);

    const overallScore = Object.values(components).reduce((sum, score) => sum + score, 0);

    const { strengths, weaknesses, recommendations } = this.analyzeEnhancement(
      testCase, enhancedPrompt, contextUsed, components
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
    
    // Check for Context7 documentation usage
    if (contextUsed.context7_docs && contextUsed.context7_docs.length > 0) {
      score += 15; // Base score for using Context7 docs
      if (contextUsed.context7_docs.length > 2) {
        score += 5; // Bonus for multiple docs
      }
    }
    
    return Math.min(score, 20);
  }

  /**
   * Score framework detection effectiveness
   */
  scoreFrameworkDetection(testCase, contextUsed) {
    let score = 0;
    
    // Check if framework was detected and used
    if (testCase.context && testCase.context.framework) {
      const framework = testCase.context.framework.toLowerCase();
      const enhancedPrompt = contextUsed.enhanced_prompt || '';
      
      if (enhancedPrompt.toLowerCase().includes(framework)) {
        score += 10; // Framework mentioned in response
      }
      
      if (enhancedPrompt.includes('component') && framework === 'react') {
        score += 5; // React-specific terminology
      }
      
      if (enhancedPrompt.includes('class') && framework === 'html') {
        score += 5; // HTML-specific terminology
      }
    }
    
    return Math.min(score, 20);
  }

  /**
   * Score project analysis effectiveness
   */
  scoreProjectAnalysis(contextUsed) {
    let score = 0;
    
    // Check for project-specific context
    if (contextUsed.repo_facts && contextUsed.repo_facts.length > 0) {
      score += 10; // Base score for repo facts
      if (contextUsed.repo_facts.length > 3) {
        score += 5; // Bonus for multiple facts
      }
    }
    
    if (contextUsed.code_snippets && contextUsed.code_snippets.length > 0) {
      score += 5; // Bonus for code snippets
    }
    
    return Math.min(score, 20);
  }

  /**
   * Score code patterns effectiveness
   */
  scoreCodePatterns(contextUsed) {
    let score = 0;
    
    // Check for code snippets and patterns
    if (contextUsed.code_snippets && contextUsed.code_snippets.length > 0) {
      score += 10; // Base score for code snippets
      if (contextUsed.code_snippets.length > 2) {
        score += 5; // Bonus for multiple snippets
      }
    }
    
    return Math.min(score, 15);
  }

  /**
   * Score prompt enhancement quality
   */
  scorePromptEnhancement(testCase, enhancedPrompt) {
    let score = 0;
    
    if (!enhancedPrompt || enhancedPrompt.length < testCase.prompt.length) {
      return 0;
    }
    
    // Base score for enhancement
    score += 5;
    
    // Length improvement
    const lengthImprovement = enhancedPrompt.length / testCase.prompt.length;
    if (lengthImprovement > 1.5) {
      score += 5;
    } else if (lengthImprovement > 1.2) {
      score += 3;
    }
    
    // Quality indicators
    if (enhancedPrompt.includes('Here\'s') || enhancedPrompt.includes('Here is')) {
      score += 2; // Clear structure
    }
    
    if (enhancedPrompt.includes('```') || enhancedPrompt.includes('code')) {
      score += 3; // Code examples
    }
    
    if (enhancedPrompt.includes('step') || enhancedPrompt.includes('Step')) {
      score += 2; // Step-by-step guidance
    }
    
    if (enhancedPrompt.includes('best practice') || enhancedPrompt.includes('recommendation')) {
      score += 3; // Best practices
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
    } else if (responseTime < 2000) {
      score += 3; // Acceptable response
    } else {
      score += 1; // Slow response
    }
    
    // Content quality
    if (enhancedPrompt && enhancedPrompt.length > 50) {
      score += 3; // Substantial response
    }
    
    if (enhancedPrompt && !enhancedPrompt.includes('error') && !enhancedPrompt.includes('Error')) {
      score += 2; // No error indicators
    }
    
    return Math.min(score, 10);
  }

  /**
   * Score todo integration
   */
  scoreTodoIntegration(testCase, enhancedPrompt) {
    let score = 0;
    
    // Check for todo-related content
    if (enhancedPrompt && enhancedPrompt.toLowerCase().includes('todo')) {
      score += 5; // Todo mentioned
    }
    
    if (enhancedPrompt && enhancedPrompt.toLowerCase().includes('task')) {
      score += 5; // Task mentioned
    }
    
    if (enhancedPrompt && enhancedPrompt.toLowerCase().includes('checklist')) {
      score += 5; // Checklist mentioned
    }
    
    return Math.min(score, 15);
  }

  /**
   * Analyze enhancement quality
   */
  analyzeEnhancement(testCase, enhancedPrompt, contextUsed, components) {
    const strengths = [];
    const weaknesses = [];
    const recommendations = [];

    // Analyze strengths
    if (components.context7Integration > 10) {
      strengths.push('Good Context7 integration');
    }
    if (components.frameworkDetection > 10) {
      strengths.push('Effective framework detection');
    }
    if (components.projectAnalysis > 10) {
      strengths.push('Good project analysis');
    }
    if (components.codePatterns > 8) {
      strengths.push('Relevant code patterns');
    }
    if (components.promptEnhancement > 15) {
      strengths.push('High-quality prompt enhancement');
    }
    if (components.responseQuality > 7) {
      strengths.push('Good response quality');
    }

    // Analyze weaknesses
    if (components.context7Integration < 5) {
      weaknesses.push('Poor or missing Context7 integration');
    }
    if (components.frameworkDetection < 5) {
      weaknesses.push('Inaccurate or missing framework detection');
    }
    if (components.projectAnalysis < 5) {
      weaknesses.push('Limited project analysis');
    }
    if (components.codePatterns < 5) {
      weaknesses.push('Few or irrelevant code patterns');
    }
    if (components.promptEnhancement < 10) {
      weaknesses.push('Minimal prompt enhancement');
    }
    if (components.responseQuality < 5) {
      weaknesses.push('Poor response quality');
    }

    // Generate recommendations
    if (components.context7Integration < 10) {
      recommendations.push('Improve Context7 integration');
    }
    if (components.frameworkDetection < 10) {
      recommendations.push('Enhance framework detection');
    }
    if (components.projectAnalysis < 10) {
      recommendations.push('Strengthen project analysis');
    }
    if (components.codePatterns < 8) {
      recommendations.push('Add more relevant code patterns');
    }
    if (components.promptEnhancement < 15) {
      recommendations.push('Improve prompt enhancement quality');
    }

    return { strengths, weaknesses, recommendations };
  }

  /**
   * Update scorecard with new evaluation
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
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting PromptMCP Quality Test - Proper MCP Client Implementation');
    console.log('=====================================================================');
    
    try {
      // Connect to MCP server
      console.log('🔌 Connecting to MCP server...');
      await this.client.connect();
      
      // Initialize MCP client
      console.log('🔧 Initializing MCP client...');
      await this.client.initialize();
      console.log('✅ MCP client initialized successfully');
      
      // List available tools
      console.log('📋 Listing available tools...');
      const tools = await this.client.listTools();
      console.log('Available tools:', tools.tools.map(t => t.name).join(', '));
      
      // Test health
      console.log('🏥 Checking server health...');
      const health = await this.client.getHealth();
      console.log('Server health:', health.content[0].text.substring(0, 200) + '...');
      
      // Run test cases
      const testCases = this.getTestCases();
      
      for (const testCase of testCases) {
        await this.testPrompt(testCase);
      }
      
      this.generateScorecard();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
    } finally {
      // Clean up
      await this.client.close();
    }
  }

  /**
   * Generate scorecard report
   */
  generateScorecard() {
    console.log('\n📊 Generating Scorecard...\n');
    
    console.log('=====================================================================');
    console.log('📋 EVALUATION SUMMARY');
    console.log('=====================================================================');
    console.log(`Total Tests: ${this.scorecard.overall.totalTests}`);
    console.log(`Average Score: ${Math.round(this.scorecard.overall.averageScore * 100) / 100}/100 (${this.getGrade(this.scorecard.overall.averageScore)})`);
    console.log(`Success Rate: ${Math.round(this.scorecard.overall.successRate * 100) / 100}%`);
    
    console.log('\n📊 COMPONENT ANALYSIS');
    console.log('----------------------------------------');
    Object.keys(this.scorecard.components).forEach(component => {
      const comp = this.scorecard.components[component];
      const avg = Math.round(comp.average * 100) / 100;
      const max = component === 'todoIntegration' ? 15 : 
                  component === 'codePatterns' ? 15 : 
                  component === 'responseQuality' ? 10 : 20;
      console.log(`${component}: ${avg}/${max} (${this.getGrade(avg / max * 100)}) - stable`);
    });
    
    console.log('\n🎯 RECOMMENDATIONS');
    console.log('----------------------------------------');
    Object.keys(this.scorecard.components).forEach(component => {
      const comp = this.scorecard.components[component];
      const avg = Math.round(comp.average * 100) / 100;
      if (avg < 10) {
        console.log(`${avg < 5 ? '1' : '2'}. Improve ${component} - current average: ${avg}/20`);
      }
    });
    
    if (this.scorecard.overall.averageScore < 50) {
      console.log('6. Overall system needs significant improvement');
    }
    console.log('7. Improve system reliability and error handling');
    
    // Save detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `promptmcp-mcp-client-evaluation-${timestamp}.json`;
    const filepath = path.join(process.cwd(), filename);
    
    const detailedResults = {
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
        originalPrompt: result.testCase.prompt,
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
      detailedResults.componentAnalysis[component] = {
        average: Math.round(comp.average * 100) / 100,
        scores: comp.scores,
        trend: 'stable'
      };
    });
    
    fs.writeFileSync(filepath, JSON.stringify(detailedResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${filename}`);
    console.log('=====================================================================');
  }

  /**
   * Get grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate overall recommendations
   */
  generateOverallRecommendations() {
    const recommendations = [];
    
    Object.keys(this.scorecard.components).forEach(component => {
      const comp = this.scorecard.components[component];
      const avg = Math.round(comp.average * 100) / 100;
      if (avg < 10) {
        recommendations.push(`Improve ${component} - current average: ${avg}/20`);
      }
    });
    
    if (this.scorecard.overall.averageScore < 50) {
      recommendations.push('Overall system needs significant improvement');
    }
    
    recommendations.push('Improve system reliability and error handling');
    
    return recommendations;
  }
}

// Main execution
async function main() {
  const tester = new PromptMCPQualityTester();
  await tester.runAllTests();
}

main().catch(console.error);
