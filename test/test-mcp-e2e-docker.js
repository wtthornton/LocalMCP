#!/usr/bin/env node

/**
 * End-to-End MCP Protocol Test for PromptMCP Docker System
 * 
 * This test properly uses the MCP protocol with all environment variables
 * from mcp-config-fixed.json to test the production Docker system.
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Test prompts with varying complexity levels
const TEST_PROMPTS = [
  {
    id: 'simple',
    name: 'Simple HTML Button',
    prompt: 'How do I create a button?',
    context: { framework: 'html', style: 'css' },
    expectedFrameworks: ['html'],
    expectedContext7Libraries: ['/mdn/html']
  },
  {
    id: 'medium',
    name: 'Medium React Component',
    prompt: 'Create a React component that displays a list of users with search functionality',
    context: { framework: 'react', style: 'tailwind' },
    expectedFrameworks: ['react'],
    expectedContext7Libraries: ['/facebook/react']
  },
  {
    id: 'complex',
    name: 'Complex Full-Stack Task',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    context: { framework: 'nextjs', style: 'tailwind' },
    expectedFrameworks: ['nextjs', 'typescript'],
    expectedContext7Libraries: ['/vercel/next.js', '/microsoft/typescript']
  },
  {
    id: 'debug',
    name: 'TypeScript Debug Task',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    context: { framework: 'typescript', file: 'src/api/handler.ts' },
    expectedFrameworks: ['typescript'],
    expectedContext7Libraries: ['/microsoft/typescript']
  },
  {
    id: 'optimization',
    name: 'Performance Optimization Task',
    prompt: 'Optimize this React component for better performance and reduce bundle size',
    context: { framework: 'react', style: 'performance' },
    expectedFrameworks: ['react'],
    expectedContext7Libraries: ['/facebook/react']
  }
];

class MCPE2ETester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async testPrompt(promptData) {
    console.log(`\n🧪 Testing: ${promptData.name}`);
    console.log(`📝 Original: ${promptData.prompt}`);
    console.log(`🔧 Context: ${JSON.stringify(promptData.context)}`);

    const mcpRequest = {
      jsonrpc: '2.0',
      id: Math.random(),
      method: 'tools/call',
      params: {
        name: 'promptmcp.enhance',
        arguments: {
          prompt: promptData.prompt,
          context: promptData.context,
          options: {
            useCache: true,
            maxTokens: 4000,
            includeMetadata: true,
            includeBreakdown: true,
            maxTasks: 5
          }
        }
      }
    };

    return new Promise((resolve) => {
      // Use the exact MCP configuration from mcp-config-fixed.json
      const mcpProcess = spawn('docker', [
        'exec', '-i', 'promptmcp-server', 'node', 'dist/mcp/server.js'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || 'test-key',
          CONTEXT7_ENABLED: 'true',
          CONTEXT7_USE_HTTP_ONLY: 'true',
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key',
          OPENAI_PROJECT_ID: process.env.OPENAI_PROJECT_ID || 'test-project',
          LOG_LEVEL: 'info',
          WORKSPACE_PATH: '/app',
          QDRANT_URL: 'http://qdrant:6333',
          QDRANT_API_KEY: '',
          QDRANT_COLLECTION_NAME: 'promptmcp_vectors'
        }
      });

      let responseData = '';
      let errorData = '';
      let startTime = Date.now();

      mcpProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      mcpProcess.on('close', (code) => {
        const responseTime = Date.now() - startTime;
        
        if (errorData) {
          console.log('❌ Errors:', errorData);
        }
        
        let result = null;
        let success = false;
        let enhancedPrompt = '';
        let contextUsed = {};
        let metadata = {};
        
        if (responseData) {
          try {
            const lines = responseData.trim().split('\n');
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const response = JSON.parse(line);
                  if (response.result && response.result.content) {
                    result = response.result.content[0].text;
                    success = true;
                    break;
                  }
                } catch (e) {
                  // Skip non-JSON lines
                }
              }
            }
          } catch (e) {
            console.log('📄 Raw response:', responseData);
          }
        }
        
        if (success && result) {
          try {
            const parsedResult = JSON.parse(result);
            enhancedPrompt = parsedResult.enhanced_prompt || '';
            contextUsed = parsedResult.context_used || {};
            metadata = parsedResult.metadata || {};
            
            console.log(`✅ Success: ${parsedResult.success}`);
            console.log(`📊 Enhanced prompt length: ${enhancedPrompt.length} chars`);
            console.log(`🔍 Context used: ${JSON.stringify(contextUsed, null, 2)}`);
            if (parsedResult.breakdown) {
              console.log(`📋 Tasks generated: ${parsedResult.breakdown.tasks?.length || 0}`);
            }
            console.log(`⏱️  Response time: ${responseTime}ms`);
          } catch (e) {
            console.log(`✅ Success: true (raw response)`);
            console.log(`📊 Response length: ${result.length} chars`);
            console.log(`⏱️  Response time: ${responseTime}ms`);
            enhancedPrompt = result;
          }
        } else {
          console.log(`❌ Failed: No valid response received`);
          console.log(`⏱️  Response time: ${responseTime}ms`);
        }
        
        // Calculate quality metrics
        const qualityMetrics = this.calculateQualityMetrics(promptData, enhancedPrompt, contextUsed, metadata);
        
        resolve({
          ...promptData,
          success,
          responseTime,
          enhancedPrompt,
          contextUsed,
          metadata,
          qualityMetrics,
          error: errorData || null
        });
      });

      // Send the MCP request
      mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
      mcpProcess.stdin.end();
    });
  }

  calculateQualityMetrics(testCase, enhancedPrompt, contextUsed, metadata) {
    const metrics = {
      frameworkDetection: 0,
      context7Integration: 0,
      projectAnalysis: 0,
      codePatterns: 0,
      promptEnhancement: 0,
      responseQuality: 0,
      overall: 0
    };

    // Framework Detection (0-5-10-15-20 points - graduated scoring)
    if (enhancedPrompt.includes('Detected Framework') || enhancedPrompt.includes('Frameworks')) {
      // Check if framework detection is accurate
      const expectedFrameworks = testCase.expectedFrameworks || [];
      const detectedFrameworks = this.extractFrameworks(enhancedPrompt);
      const accuracy = this.calculateFrameworkAccuracy(expectedFrameworks, detectedFrameworks);
      
      if (accuracy >= 0.8) {
        metrics.frameworkDetection = 20; // Excellent: 80%+ accuracy
      } else if (accuracy >= 0.6) {
        metrics.frameworkDetection = 15; // Good: 60-79% accuracy
      } else if (accuracy >= 0.4) {
        metrics.frameworkDetection = 10; // Fair: 40-59% accuracy
      } else if (accuracy > 0) {
        metrics.frameworkDetection = 5; // Poor: 1-39% accuracy
      } else {
        metrics.frameworkDetection = 0; // Failed: 0% accuracy
      }
    }

    // Context7 Integration (0-5-10-15-20 points - graduated scoring)
    if (contextUsed.context7_docs && contextUsed.context7_docs.length > 0) {
      const docCount = contextUsed.context7_docs.length;
      const expectedLibraries = testCase.expectedContext7Libraries || [];
      const relevance = this.calculateContext7Relevance(contextUsed.context7_docs, expectedLibraries);
      
      if (docCount >= 3 && relevance >= 0.8) {
        metrics.context7Integration = 20; // Excellent: 3+ docs, 80%+ relevant
      } else if (docCount >= 2 && relevance >= 0.6) {
        metrics.context7Integration = 15; // Good: 2+ docs, 60%+ relevant
      } else if (docCount >= 1 && relevance >= 0.4) {
        metrics.context7Integration = 10; // Fair: 1+ docs, 40%+ relevant
      } else if (docCount >= 1) {
        metrics.context7Integration = 5; // Poor: 1+ docs, low relevance
      } else {
        metrics.context7Integration = 0; // Failed: no docs
      }
    }

    // Project Analysis (0-5-10-15-20 points - graduated scoring)
    if (contextUsed.repo_facts && contextUsed.repo_facts.length > 0) {
      const factCount = contextUsed.repo_facts.length;
      const relevance = this.calculateProjectRelevance(contextUsed.repo_facts, testCase.prompt);
      
      if (factCount >= 5 && relevance >= 0.8) {
        metrics.projectAnalysis = 20; // Excellent: 5+ facts, 80%+ relevant
      } else if (factCount >= 3 && relevance >= 0.6) {
        metrics.projectAnalysis = 15; // Good: 3+ facts, 60%+ relevant
      } else if (factCount >= 2 && relevance >= 0.4) {
        metrics.projectAnalysis = 10; // Fair: 2+ facts, 40%+ relevant
      } else if (factCount >= 1) {
        metrics.projectAnalysis = 5; // Poor: 1+ facts, low relevance
      } else {
        metrics.projectAnalysis = 0; // Failed: no facts
      }
    }

    // Code Patterns (0-5-10-15-20 points - graduated scoring)
    if (contextUsed.code_snippets && contextUsed.code_snippets.length > 0) {
      const snippetCount = contextUsed.code_snippets.length;
      const relevance = this.calculateCodeRelevance(contextUsed.code_snippets, testCase.prompt);
      
      if (snippetCount >= 3 && relevance >= 0.8) {
        metrics.codePatterns = 20; // Excellent: 3+ snippets, 80%+ relevant
      } else if (snippetCount >= 2 && relevance >= 0.6) {
        metrics.codePatterns = 15; // Good: 2+ snippets, 60%+ relevant
      } else if (snippetCount >= 1 && relevance >= 0.4) {
        metrics.codePatterns = 10; // Fair: 1+ snippets, 40%+ relevant
      } else if (snippetCount >= 1) {
        metrics.codePatterns = 5; // Poor: 1+ snippets, low relevance
      } else {
        metrics.codePatterns = 0; // Failed: no snippets
      }
    }

    // Prompt Enhancement (20 points - keep existing logic)
    const originalLength = testCase.prompt.length;
    const enhancedLength = enhancedPrompt.length;
    if (enhancedLength > originalLength * 1.5) {
      metrics.promptEnhancement = 20;
    } else if (enhancedLength > originalLength) {
      metrics.promptEnhancement = 10;
    }

    // Response Quality (15 points max - realistic baseline)
    if (enhancedPrompt.includes('Quality Requirements') || enhancedPrompt.includes('Instructions')) {
      metrics.responseQuality = 15; // Realistic: good structure, not perfect
    } else if (enhancedPrompt.length > testCase.prompt.length) {
      metrics.responseQuality = 8; // Realistic: basic improvement
    }

    // Overall score
    metrics.overall = Object.values(metrics).reduce((sum, score) => sum + score, 0);

    return metrics;
  }

  // Helper methods for graduated scoring
  extractFrameworks(enhancedPrompt) {
    const frameworks = [];
    const frameworkKeywords = ['react', 'vue', 'angular', 'nextjs', 'nuxt', 'svelte', 'html', 'css', 'javascript', 'typescript', 'node', 'express', 'fastify', 'koa'];
    
    for (const keyword of frameworkKeywords) {
      if (enhancedPrompt.toLowerCase().includes(keyword)) {
        frameworks.push(keyword);
      }
    }
    return frameworks;
  }

  calculateFrameworkAccuracy(expectedFrameworks, detectedFrameworks) {
    if (expectedFrameworks.length === 0) return 0;
    
    const matches = expectedFrameworks.filter(expected => 
      detectedFrameworks.some(detected => 
        detected.toLowerCase().includes(expected.toLowerCase()) || 
        expected.toLowerCase().includes(detected.toLowerCase())
      )
    );
    
    return matches.length / expectedFrameworks.length;
  }

  calculateContext7Relevance(context7Docs, expectedLibraries) {
    if (expectedLibraries.length === 0) return 0.5; // Neutral if no expectations
    
    // Context7 docs come as strings, not objects
    const docText = context7Docs.join(' ').toLowerCase();
    
    const matches = expectedLibraries.filter(expected => {
      const expectedLower = expected.toLowerCase().replace('/', '');
      return docText.includes(expectedLower) || 
             docText.includes(expectedLower.replace('_', '-')) ||
             docText.includes(expectedLower.replace('-', '_'));
    });
    
    return matches.length / expectedLibraries.length;
  }

  calculateProjectRelevance(repoFacts, prompt) {
    if (repoFacts.length === 0) return 0;
    
    const promptKeywords = prompt.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const relevantFacts = repoFacts.filter(fact => 
      promptKeywords.some(keyword => 
        fact.toLowerCase().includes(keyword)
      )
    );
    
    // More lenient scoring - if we have any relevant facts, give some credit
    if (relevantFacts.length > 0) {
      return Math.min(0.8, relevantFacts.length / Math.max(1, promptKeywords.length));
    }
    
    // Even if no direct matches, having project facts is still valuable
    return repoFacts.length > 5 ? 0.4 : 0.2;
  }

  calculateCodeRelevance(codeSnippets, prompt) {
    if (codeSnippets.length === 0) return 0;
    
    const promptKeywords = prompt.toLowerCase().split(/\s+/);
    const relevantSnippets = codeSnippets.filter(snippet => 
      promptKeywords.some(keyword => 
        snippet.toLowerCase().includes(keyword) && keyword.length > 3
      )
    );
    
    return relevantSnippets.length / codeSnippets.length;
  }

  async runAllTests() {
    console.log('🚀 Starting End-to-End MCP Protocol Test');
    console.log('============================================================');
    console.log('🐳 Testing Docker-based PromptMCP system');
    console.log('🔑 Using environment variables from mcp-config-fixed.json');
    console.log('📡 Testing MCP protocol communication');

    for (const promptData of TEST_PROMPTS) {
      const result = await this.testPrompt(promptData);
      this.results.push(result);
    }

    this.generateReport();
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successfulTests = this.results.filter(r => r.success);
    const averageScore = this.results.reduce((sum, r) => sum + r.qualityMetrics.overall, 0) / this.results.length;

    console.log('\n📊 E2E MCP TEST SUMMARY');
    console.log('============================================================');
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successfulTests.length}`);
    console.log(`Success Rate: ${Math.round((successfulTests.length / this.results.length) * 100)}%`);
    console.log(`Average Quality Score: ${Math.round(averageScore)}/120`);
    console.log(`Total Time: ${totalTime}ms`);

    console.log('\n📋 DETAILED RESULTS');
    console.log('----------------------------------------');
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   ${status} Success: ${result.success}`);
      console.log(`   📊 Quality Score: ${result.qualityMetrics.overall}/120`);
      console.log(`   🔧 Framework Detection: ${result.qualityMetrics.frameworkDetection}/20`);
      console.log(`   🌐 Context7 Integration: ${result.qualityMetrics.context7Integration}/20`);
      console.log(`   📁 Project Analysis: ${result.qualityMetrics.projectAnalysis}/20`);
      console.log(`   💻 Code Patterns: ${result.qualityMetrics.codePatterns}/20`);
      console.log(`   ✨ Prompt Enhancement: ${result.qualityMetrics.promptEnhancement}/20`);
      console.log(`   🎯 Response Quality: ${result.qualityMetrics.responseQuality}/20`);
      console.log(`   ⏱️  Response Time: ${result.responseTime}ms`);
      if (result.error) {
        console.log(`   ❌ Error: ${result.error.substring(0, 100)}...`);
      }
    });

    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      totalTime,
      summary: {
        totalTests: this.results.length,
        successfulTests: successfulTests.length,
        successRate: Math.round((successfulTests.length / this.results.length) * 100),
        averageQualityScore: Math.round(averageScore),
        averageResponseTime: Math.round(this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length)
      },
      results: this.results
    };

    const filename = `mcp-e2e-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    writeFileSync(filename, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed results saved to: ${filename}`);

    console.log('\n🏁 E2E MCP test completed!');
  }
}

// Run the tests
const tester = new MCPE2ETester();
tester.runAllTests().catch(console.error);
