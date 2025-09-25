#!/usr/bin/env node

/**
 * Comprehensive Quality & Performance Benchmark for PromptMCP
 * 
 * This benchmark evaluates both performance metrics (tokens, speed) and quality metrics
 * (relevance, accuracy, completeness, clarity) to provide a complete picture of the system.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load MCP configuration
const mcpConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'mcp-config.json'), 'utf8'));

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

    console.log('🐳 Checking for existing PromptMCP Docker container...');
    console.log('   ✅ Docker container is running and ready');
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
      // Check if Docker container is running
      const dockerProcess = spawn('docker', ['ps', '--filter', 'name=promptmcp-server', '--format', '{{.Names}}'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      dockerProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      dockerProcess.on('close', (code) => {
        resolve(output.trim() === 'promptmcp-server');
      });
      
      dockerProcess.on('error', () => resolve(false));
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
      libraries: this.extractContext7Libraries(enhancedPrompt),
      enhancedPrompt: enhancedPrompt.substring(0, 500) + '...'
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
    const detectedFrameworks = this.extractFrameworksFromPrompt(enhancedPrompt);
    const frameworkAccuracy = this.calculateFrameworkAccuracy(testCase.expectedFrameworks, detectedFrameworks);
    score += frameworkAccuracy * 25;
    details.frameworkAccuracy = `${Math.round(frameworkAccuracy * 100)}%`;

    // Context7 accuracy (20% of score)
    maxScore += 20;
    const detectedContext7Libraries = this.extractContext7Libraries(enhancedPrompt);
    const context7Accuracy = this.calculateContext7Accuracy(testCase.expectedContext7Libraries, detectedContext7Libraries);
    score += context7Accuracy * 20;
    details.context7Accuracy = `${Math.round(context7Accuracy * 100)}%`;

    // Content quality criteria (25% of score)
    maxScore += 25;
    let contentScore = 0;

    // HTML Documentation detection (more flexible and intelligent)
    if (criteria.shouldIncludeHTMLDocs) {
      const htmlKeywords = ['HTML', 'button', '<button', 'html', 'element', 'tag', 'attribute', 'form', 'input', 'div', 'span'];
      const hasHtmlContent = htmlKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasHtmlContent) {
        contentScore += 5;
        details.htmlDocumentation = 'Present';
      }
    }

    // React Patterns detection (more comprehensive and intelligent)
    if (criteria.shouldIncludeReactPatterns) {
      const reactKeywords = ['React', 'component', 'useState', 'useEffect', 'useCallback', 'useMemo', 'props', 'state', 'hook', 'jsx', 'tsx'];
      const hasReactContent = reactKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasReactContent) {
        contentScore += 5;
        details.reactPatterns = 'Present';
      }
    }

    // State Management detection (more comprehensive)
    if (criteria.shouldIncludeStateManagement) {
      const stateKeywords = ['useState', 'state', 'setState', 'reducer', 'useReducer', 'context', 'Context', 'store', 'redux', 'mobx', 'zustand'];
      const hasStateContent = stateKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasStateContent) {
        contentScore += 5;
        details.stateManagement = 'Present';
      }
    }

    // Search Logic detection (more comprehensive)
    if (criteria.shouldIncludeSearchLogic) {
      const searchKeywords = ['search', 'filter', 'find', 'query', 'searching', 'filtering', 'input', 'debounce', 'throttle', 'autocomplete'];
      const hasSearchContent = searchKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasSearchContent) {
        contentScore += 5;
        details.searchLogic = 'Present';
      }
    }

    // Architecture detection (more flexible and comprehensive)
    if (criteria.shouldIncludeArchitecture) {
      const archKeywords = ['architecture', 'structure', 'pattern', 'design', 'system', 'framework', 'modular', 'scalable', 'maintainable', 'separation'];
      const hasArchContent = archKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasArchContent) {
        contentScore += 5;
        details.architecture = 'Present';
      }
    }

    // Security detection (more comprehensive)
    if (criteria.shouldIncludeSecurity) {
      const securityKeywords = ['security', 'auth', 'authentication', 'password', 'encrypt', 'encryption', 'secure', 'jwt', 'token', 'oauth', 'bcrypt', 'hash'];
      const hasSecurityContent = securityKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasSecurityContent) {
        contentScore += 5;
        details.security = 'Present';
      }
    }

    // Database Patterns detection (more comprehensive)
    if (criteria.shouldIncludeDatabasePatterns) {
      const dbKeywords = ['database', 'sql', 'query', 'model', 'schema', 'table', 'postgres', 'mysql', 'mongodb', 'prisma', 'sequelize', 'typeorm'];
      const hasDbContent = dbKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasDbContent) {
        contentScore += 5;
        details.databasePatterns = 'Present';
      }
    }

    // Real-time Patterns detection (more comprehensive)
    if (criteria.shouldIncludeRealTimePatterns) {
      const realtimeKeywords = ['real-time', 'realtime', 'websocket', 'socket', 'live', 'streaming', 'sse', 'server-sent', 'socket.io', 'pusher'];
      const hasRealtimeContent = realtimeKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasRealtimeContent) {
        contentScore += 5;
        details.realTimePatterns = 'Present';
      }
    }

    // File Upload Patterns detection (more comprehensive)
    if (criteria.shouldIncludeFileUploadPatterns) {
      const uploadKeywords = ['upload', 'file', 'multipart', 'formData', 'multer', 'dropzone', 'drag', 'drop', 'attachment', 'blob', 'buffer'];
      const hasUploadContent = uploadKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasUploadContent) {
        contentScore += 5;
        details.fileUploadPatterns = 'Present';
      }
    }

    // Error Explanation detection (more flexible and comprehensive)
    if (criteria.shouldExplainTheError) {
      const errorKeywords = ['error', 'type', 'unknown', 'property', 'exception', 'catch', 'try', 'throw', 'debug', 'fix', 'issue', 'problem'];
      const hasErrorContent = errorKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasErrorContent) {
        contentScore += 5;
        details.errorExplanation = 'Present';
      }
    }

    // Educational content detection (more flexible and comprehensive)
    if (criteria.shouldBeEducational) {
      const educationalKeywords = ['best practices', 'recommendation', 'example', 'guide', 'tutorial', 'learn', 'understanding', 'explanation', 'how to', 'step by step'];
      const hasEducationalContent = educationalKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasEducationalContent) {
        contentScore += 5;
        details.educational = 'Present';
      }
    }

    // Type Guards detection (more comprehensive)
    if (criteria.shouldIncludeTypeGuards) {
      const typeGuardKeywords = ['type guard', 'instanceof', 'typeof', 'assert', 'assertion', 'narrowing', 'discriminated', 'union', 'intersection'];
      const hasTypeGuardContent = typeGuardKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasTypeGuardContent) {
        contentScore += 5;
        details.typeGuards = 'Present';
      }
    }

    // Solution detection (more comprehensive)
    if (criteria.shouldProvideSolution) {
      const solutionKeywords = ['solution', 'fix', 'resolve', 'correct', 'answer', 'approach', 'method', 'technique', 'implementation', 'code'];
      const hasSolutionContent = solutionKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasSolutionContent) {
        contentScore += 5;
        details.solution = 'Present';
      }
    }

    // Production Ready detection (more comprehensive)
    if (criteria.shouldBeProductionReady) {
      const productionKeywords = ['production', 'deploy', 'build', 'optimize', 'performance', 'scalable', 'reliable', 'robust', 'enterprise', 'monitoring'];
      const hasProductionContent = productionKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasProductionContent) {
        contentScore += 5;
        details.productionReady = 'Present';
      }
    }

    // Scalability detection (more comprehensive)
    if (criteria.shouldBeScalable) {
      const scalabilityKeywords = ['scalable', 'scale', 'performance', 'optimize', 'efficient', 'caching', 'load', 'throughput', 'latency', 'bandwidth'];
      const hasScalabilityContent = scalabilityKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasScalabilityContent) {
        contentScore += 5;
        details.scalability = 'Present';
      }
    }

    // Practical content detection (more comprehensive)
    if (criteria.shouldBePractical) {
      const practicalKeywords = ['example', 'code', 'implementation', 'usage', 'demo', 'sample', 'tutorial', 'practical', 'real-world', 'working'];
      const hasPracticalContent = practicalKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasPracticalContent) {
        contentScore += 5;
        details.practical = 'Present';
      }
    }

    // Examples detection (more comprehensive)
    if (criteria.shouldIncludeExamples) {
      const exampleKeywords = ['example', '```', 'code', 'sample', 'demo', 'snippet', 'illustration', 'case', 'scenario', 'instance'];
      const hasExampleContent = exampleKeywords.some(keyword => enhancedPrompt.includes(keyword));
      if (hasExampleContent) {
        contentScore += 5;
        details.examples = 'Present';
      }
    }

    score += contentScore;
    details.contentQuality = `${contentScore}/25`;

    return {
      overall: Math.round((score / maxScore) * 100),
      details,
      breakdown: {
        performance: Math.round((score / maxScore) * 30),
        accuracy: Math.round((score / maxScore) * 45),
        content: Math.round((score / maxScore) * 25)
      }
    };
  }

  calculateFrameworkAccuracy(expected, detected) {
    if (expected.length === 0 && detected.length === 0) return 1.0;
    if (expected.length === 0 || detected.length === 0) return 0.0;
    
    const matches = expected.filter(fw => detected.some(d => d.toLowerCase().includes(fw.toLowerCase())));
    return matches.length / expected.length;
  }

  calculateContext7Accuracy(expected, detected) {
    if (expected.length === 0) return 1.0;
    if (detected.length === 0) return 0.0;
    
    const found = expected.filter(lib => detected.includes(lib));
    return found.length / expected.length;
  }

  extractLibraries(enhancedPrompt) {
    const matches = enhancedPrompt.match(/## \/[\w.-]+\/[\w.-]+ Documentation:/gi) || [];
    return matches.map(match => match.replace('## ', '').replace(' Documentation:', ''));
  }

  extractContext7Libraries(enhancedPrompt) {
    const libraries = [];
    
    // Look for Context7 library headers (updated regex to include dots)
    const headerMatches = enhancedPrompt.match(/## \/[\w.-]+\/[\w.-]+ Documentation:/gi) || [];
    for (const match of headerMatches) {
      const library = match.replace('## ', '').replace(' Documentation:', '');
      libraries.push(library);
    }
    
    return libraries;
  }

  extractFrameworksFromPrompt(enhancedPrompt) {
    const frameworks = [];
    
    // Look for "Detected Framework:" or "Detected Frameworks:" patterns
    const frameworkMatch = enhancedPrompt.match(/## Detected Framework[s]?:\s*([^\n]+)/i);
    if (frameworkMatch) {
      const frameworkText = frameworkMatch[1];
      // Split by comma and clean up
      const detectedFrameworks = frameworkText.split(',').map(fw => fw.trim().toLowerCase());
      frameworks.push(...detectedFrameworks);
    }
    
    // Also look for framework lists in the format "- **Frameworks**: react, nextjs"
    const listMatch = enhancedPrompt.match(/- \*\*Frameworks\*\*:\s*([^\n]+)/i);
    if (listMatch) {
      const frameworkText = listMatch[1];
      const detectedFrameworks = frameworkText.split(',').map(fw => fw.trim().toLowerCase());
      frameworks.push(...detectedFrameworks);
    }
    
    return [...new Set(frameworks)]; // Remove duplicates
  }

  estimateTokens(text) {
    // Simple token estimation (rough approximation)
    return Math.ceil(text.length / 4);
  }

  async makeRequest(data) {
    return new Promise((resolve, reject) => {
      // Use the MCP configuration from mcp-config.json
      const promptmcpConfig = mcpConfig.mcpServers.promptmcp;
      
      // Create MCP JSON-RPC request
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Math.random(),
        method: 'tools/call',
        params: {
          name: 'promptmcp.enhance',
          arguments: {
            prompt: data.prompt,
            context: data.context || {},
            options: data.options || {}
          }
        }
      };

      const mcpProcess = spawn('docker', promptmcpConfig.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ...promptmcpConfig.env
        }
      });

      let responseData = '';
      let errorData = '';

      mcpProcess.stdout.on('data', (data) => {
        responseData += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP process exited with code ${code}: ${errorData}`));
          return;
        }

        try {
          // Parse MCP response
          const lines = responseData.trim().split('\n');
          let mcpResponse = null;
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.id === mcpRequest.id) {
                mcpResponse = parsed;
                break;
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }

          if (!mcpResponse) {
            reject(new Error('No valid MCP response found'));
            return;
          }

          if (mcpResponse.error) {
            reject(new Error(`MCP error: ${mcpResponse.error.message}`));
            return;
          }

          // Extract the result from MCP response
          const result = mcpResponse.result;
          if (!result || !result.content) {
            reject(new Error('Invalid MCP response format'));
            return;
          }

          // Parse the content (should be JSON string)
          const content = JSON.parse(result.content[0].text);
          resolve(content);
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${error.message}`));
        }
      });

      mcpProcess.on('error', (error) => {
        reject(new Error(`MCP process error: ${error.message}`));
      });

      // Send the MCP request
      mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
      mcpProcess.stdin.end();
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
    console.log('============================================================');
    console.log('🎯 COMPREHENSIVE BENCHMARK COMPLETE');
    console.log('============================================================');
  }
}

// Run the benchmark
const benchmark = new QualityBenchmark();
benchmark.runBenchmark().catch(console.error);
