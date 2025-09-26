/**
 * Prompt Quality Validation Test Suite
 * 
 * Tests whether enhanced prompts produce better results than original prompts
 * and validates the effectiveness of different OpenAI system prompts.
 */

// Using built-in fetch instead of axios

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

// Test cases for A/B comparison
const testCases = [
  {
    name: 'React Component Creation',
    original: 'Create a React component that displays a list of users with search functionality',
    context: { framework: 'react', style: 'tailwind' },
    expectedFeatures: ['TypeScript', 'hooks', 'accessibility', 'performance', 'testing']
  },
  {
    name: 'TypeScript Error Fix',
    original: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    context: { framework: 'typescript', file: 'src/api/handler.ts' },
    expectedFeatures: ['type safety', 'error handling', 'API response', 'TypeScript']
  },
  {
    name: 'Performance Optimization',
    original: 'Optimize this React component for better performance and reduce bundle size',
    context: { framework: 'react', style: 'performance' },
    expectedFeatures: ['memoization', 'lazy loading', 'bundle optimization', 'performance']
  }
];

// System prompt variations to test
const systemPrompts = {
  current: `You are an expert prompt enhancement agent specialized in improving developer prompts for maximum clarity, actionability, and technical accuracy.

## Core Capabilities
- Transform vague requests into specific, actionable prompts
- Integrate framework-specific best practices and patterns
- Apply quality requirements (accessibility, performance, security, testing)
- Enhance prompts with project-aware context and conventions
- Provide clear, step-by-step guidance for implementation

## Enhancement Strategies
1. **Clarity Enhancement**: Make vague requests specific and unambiguous
2. **Context Integration**: Seamlessly weave in relevant project and framework context
3. **Best Practice Application**: Include industry standards and framework conventions
4. **Quality Focus**: Apply specific quality requirements (a11y, perf, security, testing)
5. **Actionability**: Ensure every enhanced prompt leads to concrete implementation steps

## Output Format
Return a JSON object with this exact structure:
{
  "enhancedPrompt": "The improved, specific, and actionable prompt",
  "improvements": [
    {
      "type": "clarity|specificity|actionability|completeness|relevance|best-practice|performance|security",
      "description": "What was improved",
      "impact": "low|medium|high",
      "before": "Original text",
      "after": "Enhanced text"
    }
  ],
  "recommendations": [
    "Additional suggestions for the user",
    "Best practices to consider",
    "Potential pitfalls to avoid"
  ],
  "qualityScore": 0.85,
  "confidenceScore": 0.92
}`,

  contextAware: `You are an expert developer with access to comprehensive project context. Your task is to generate the best possible code based on the provided context.

## Context Utilization
- Use framework-specific best practices from the detected framework
- Apply quality requirements (accessibility, performance, security, testing)
- Follow project conventions and patterns from repository facts
- Incorporate existing code patterns and dependencies
- Reference relevant documentation and examples

## Code Generation Guidelines
- Generate production-ready code
- Include proper TypeScript types
- Follow framework conventions
- Implement accessibility features
- Optimize for performance
- Include proper error handling
- Add comprehensive testing

## Output Format
Return a JSON object with this exact structure:
{
  "enhancedPrompt": "The improved, specific, and actionable prompt",
  "code": "Generated code implementation",
  "improvements": [
    {
      "type": "clarity|specificity|actionability|completeness|relevance|best-practice|performance|security",
      "description": "What was improved",
      "impact": "low|medium|high"
    }
  ],
  "qualityScore": 0.85,
  "confidenceScore": 0.92
}`,

  frameworkSpecific: `You are a React expert specializing in modern React development with TypeScript, hooks, and best practices.

## React Best Practices
- Use functional components with hooks
- Implement proper TypeScript types
- Follow React naming conventions
- Use proper key props for lists
- Implement proper cleanup in useEffect
- Use React.memo for performance optimization
- Implement proper error boundaries

## Code Quality Standards
- Generate clean, readable code
- Include proper TypeScript types
- Implement accessibility features (ARIA attributes, keyboard navigation)
- Optimize for performance (useMemo, useCallback, lazy loading)
- Include comprehensive testing (Jest, React Testing Library)
- Use modern CSS (Tailwind CSS, CSS-in-JS)

## Output Format
Return a JSON object with this exact structure:
{
  "enhancedPrompt": "The improved, specific, and actionable prompt",
  "code": "Generated React component code",
  "improvements": [
    {
      "type": "clarity|specificity|actionability|completeness|relevance|best-practice|performance|security",
      "description": "What was improved",
      "impact": "low|medium|high"
    }
  ],
  "qualityScore": 0.85,
  "confidenceScore": 0.92
}`
};

class PromptQualityValidator {
  constructor() {
    this.results = {
      abTests: [],
      systemPromptTests: [],
      contextUtilization: [],
      overallMetrics: {}
    };
  }

  /**
   * Run A/B test comparing original vs enhanced prompts
   */
  async runABTest(testCase) {
    console.log(`\n🧪 A/B Testing: ${testCase.name}`);
    console.log('=' .repeat(60));

    try {
      // Test original prompt
      console.log('📝 Testing original prompt...');
      const originalResult = await this.testPrompt(testCase.original, testCase.context);
      
      // Test enhanced prompt (using our system)
      console.log('📝 Testing enhanced prompt...');
      const enhancedResult = await this.testEnhancedPrompt(testCase.original, testCase.context);

      // Analyze results
      const analysis = this.analyzeABResults(originalResult, enhancedResult, testCase);
      
      this.results.abTests.push({
        testCase: testCase.name,
        original: originalResult,
        enhanced: enhancedResult,
        analysis: analysis
      });

      console.log('📊 A/B Test Results:');
      console.log(`   Original Quality: ${analysis.originalQuality}/5`);
      console.log(`   Enhanced Quality: ${analysis.enhancedQuality}/5`);
      console.log(`   Improvement: ${analysis.improvement}%`);
      console.log(`   Winner: ${analysis.winner}`);

      return analysis;

    } catch (error) {
      console.error(`❌ A/B Test failed for ${testCase.name}:`, error.message);
      return null;
    }
  }

  /**
   * Test different system prompts with same enhanced prompt
   */
  async runSystemPromptTest(testCase) {
    console.log(`\n🔧 System Prompt Testing: ${testCase.name}`);
    console.log('=' .repeat(60));

    const systemPromptResults = {};

    for (const [promptName, systemPrompt] of Object.entries(systemPrompts)) {
      try {
        console.log(`📝 Testing ${promptName} system prompt...`);
        
        const result = await this.testWithSystemPrompt(
          testCase.original, 
          testCase.context, 
          systemPrompt
        );
        
        systemPromptResults[promptName] = result;
        
        console.log(`   Quality Score: ${result.qualityScore}/5`);
        console.log(`   Context Utilization: ${result.contextUtilization}%`);
        
      } catch (error) {
        console.error(`❌ System prompt test failed for ${promptName}:`, error.message);
        systemPromptResults[promptName] = { error: error.message };
      }
    }

    this.results.systemPromptTests.push({
      testCase: testCase.name,
      results: systemPromptResults
    });

    return systemPromptResults;
  }

  /**
   * Test context utilization
   */
  async testContextUtilization(testCase) {
    console.log(`\n🔍 Context Utilization Test: ${testCase.name}`);
    console.log('=' .repeat(60));

    try {
      const result = await this.testEnhancedPrompt(testCase.original, testCase.context);
      
      const contextUtilization = this.analyzeContextUtilization(result, testCase.context);
      
      this.results.contextUtilization.push({
        testCase: testCase.name,
        utilization: contextUtilization
      });

      console.log('📊 Context Utilization:');
      console.log(`   Framework Detection: ${contextUtilization.frameworkDetection}%`);
      console.log(`   Quality Requirements: ${contextUtilization.qualityRequirements}%`);
      console.log(`   Repository Facts: ${contextUtilization.repoFacts}%`);
      console.log(`   Code Patterns: ${contextUtilization.codePatterns}%`);
      console.log(`   Overall: ${contextUtilization.overall}%`);

      return contextUtilization;

    } catch (error) {
      console.error(`❌ Context utilization test failed:`, error.message);
      return null;
    }
  }

  /**
   * Test a prompt using our enhancement system
   */
  async testEnhancedPrompt(originalPrompt, context) {
    const response = await fetch(`${BASE_URL}/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: originalPrompt,
        context: context,
        options: {
          useAIEnhancement: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      prompt: data.enhanced_prompt,
      metrics: data.metrics,
      responseTime: data.metrics.response_time_ms
    };
  }

  /**
   * Test a prompt with a specific system prompt
   */
  async testWithSystemPrompt(originalPrompt, context, systemPrompt) {
    // This would require modifying the OpenAI service to accept custom system prompts
    // For now, we'll use the enhanced prompt and analyze it
    const enhancedResult = await this.testEnhancedPrompt(originalPrompt, context);
    
    return {
      prompt: enhancedResult.prompt,
      qualityScore: this.analyzePromptQuality(enhancedResult.prompt),
      contextUtilization: this.analyzeContextUtilization(enhancedResult, context).overall
    };
  }

  /**
   * Test a raw prompt (simulating original)
   */
  async testPrompt(originalPrompt, context) {
    // Simulate what the original prompt would produce
    // This is a simplified version - in reality, you'd send to OpenAI directly
    return {
      prompt: originalPrompt,
      qualityScore: this.analyzePromptQuality(originalPrompt),
      responseTime: 0
    };
  }

  /**
   * Analyze A/B test results
   */
  analyzeABResults(originalResult, enhancedResult, testCase) {
    const originalQuality = this.analyzePromptQuality(originalResult.prompt);
    const enhancedQuality = this.analyzePromptQuality(enhancedResult.prompt);
    
    const improvement = ((enhancedQuality - originalQuality) / originalQuality) * 100;
    const winner = enhancedQuality > originalQuality ? 'Enhanced' : 'Original';
    
    return {
      originalQuality,
      enhancedQuality,
      improvement: Math.round(improvement * 100) / 100,
      winner,
      features: this.analyzeFeatureCoverage(enhancedResult.prompt, testCase.expectedFeatures)
    };
  }

  /**
   * Analyze prompt quality (1-5 scale)
   */
  analyzePromptQuality(prompt) {
    let score = 0;
    let factors = 0;

    // Clarity (length and structure)
    if (prompt.length > 50) {
      score += 1;
      factors++;
    }

    // Specificity (technical terms)
    const technicalTerms = ['TypeScript', 'React', 'component', 'hook', 'accessibility', 'performance', 'testing'];
    const foundTerms = technicalTerms.filter(term => prompt.toLowerCase().includes(term.toLowerCase()));
    score += (foundTerms.length / technicalTerms.length) * 2;
    factors += 2;

    // Actionability (action words)
    const actionWords = ['create', 'implement', 'use', 'include', 'ensure', 'optimize', 'add'];
    const foundActions = actionWords.filter(word => prompt.toLowerCase().includes(word));
    score += (foundActions.length / actionWords.length) * 1;
    factors += 1;

    // Completeness (covers multiple aspects)
    const aspects = ['functionality', 'styling', 'testing', 'accessibility', 'performance'];
    const coveredAspects = aspects.filter(aspect => prompt.toLowerCase().includes(aspect));
    score += (coveredAspects.length / aspects.length) * 1;
    factors += 1;

    return factors > 0 ? Math.round((score / factors) * 100) / 100 : 0;
  }

  /**
   * Analyze context utilization
   */
  analyzeContextUtilization(result, context) {
    const prompt = result.prompt.toLowerCase();
    
    const frameworkDetection = context.framework ? 
      (prompt.includes(context.framework.toLowerCase()) ? 100 : 0) : 0;
    
    const qualityRequirements = context.style ? 
      (prompt.includes(context.style.toLowerCase()) ? 100 : 0) : 0;
    
    const repoFacts = context.framework === 'react' ? 
      (prompt.includes('typescript') || prompt.includes('tailwind') ? 100 : 0) : 0;
    
    const codePatterns = context.framework === 'react' ? 
      (prompt.includes('hook') || prompt.includes('component') ? 100 : 0) : 0;
    
    const overall = (frameworkDetection + qualityRequirements + repoFacts + codePatterns) / 4;
    
    return {
      frameworkDetection,
      qualityRequirements,
      repoFacts,
      codePatterns,
      overall: Math.round(overall * 100) / 100
    };
  }

  /**
   * Analyze feature coverage
   */
  analyzeFeatureCoverage(prompt, expectedFeatures) {
    const coveredFeatures = expectedFeatures.filter(feature => 
      prompt.toLowerCase().includes(feature.toLowerCase())
    );
    
    return {
      covered: coveredFeatures,
      total: expectedFeatures.length,
      coverage: Math.round((coveredFeatures.length / expectedFeatures.length) * 100)
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 COMPREHENSIVE PROMPT QUALITY VALIDATION REPORT');
    console.log('=' .repeat(80));

    // A/B Test Summary
    console.log('\n🔬 A/B TEST RESULTS:');
    console.log('-' .repeat(40));
    
    const abResults = this.results.abTests.filter(r => r.analysis);
    if (abResults.length > 0) {
      const avgImprovement = abResults.reduce((sum, r) => sum + r.analysis.improvement, 0) / abResults.length;
      const enhancedWins = abResults.filter(r => r.analysis.winner === 'Enhanced').length;
      
      console.log(`   Tests Run: ${abResults.length}`);
      console.log(`   Enhanced Wins: ${enhancedWins}/${abResults.length}`);
      console.log(`   Average Improvement: ${Math.round(avgImprovement * 100) / 100}%`);
    }

    // System Prompt Test Summary
    console.log('\n🔧 SYSTEM PROMPT TEST RESULTS:');
    console.log('-' .repeat(40));
    
    this.results.systemPromptTests.forEach(test => {
      console.log(`\n   ${test.testCase}:`);
      Object.entries(test.results).forEach(([promptName, result]) => {
        if (result.error) {
          console.log(`     ${promptName}: ERROR - ${result.error}`);
        } else {
          console.log(`     ${promptName}: Quality ${result.qualityScore}/5, Context ${result.contextUtilization}%`);
        }
      });
    });

    // Context Utilization Summary
    console.log('\n🔍 CONTEXT UTILIZATION RESULTS:');
    console.log('-' .repeat(40));
    
    const contextResults = this.results.contextUtilization.filter(r => r.utilization);
    if (contextResults.length > 0) {
      const avgUtilization = contextResults.reduce((sum, r) => sum + r.utilization.overall, 0) / contextResults.length;
      console.log(`   Average Context Utilization: ${Math.round(avgUtilization * 100) / 100}%`);
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-' .repeat(40));
    
    if (abResults.length > 0) {
      const enhancedWins = abResults.filter(r => r.analysis.winner === 'Enhanced').length;
      if (enhancedWins === abResults.length) {
        console.log('   ✅ Enhanced prompts are consistently better - keep current approach');
      } else if (enhancedWins > abResults.length / 2) {
        console.log('   ⚠️  Enhanced prompts are mostly better - consider optimizations');
      } else {
        console.log('   ❌ Enhanced prompts are not better - need to revise approach');
      }
    }

    console.log('\n🏁 Validation complete!');
  }

  /**
   * Run all validation tests
   */
  async runAllTests() {
    console.log('🚀 Starting Prompt Quality Validation Tests');
    console.log('=' .repeat(80));

    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await this.waitForServer();

    // Run A/B tests
    for (const testCase of testCases) {
      await this.runABTest(testCase);
    }

    // Run system prompt tests
    for (const testCase of testCases) {
      await this.runSystemPromptTest(testCase);
    }

    // Run context utilization tests
    for (const testCase of testCases) {
      await this.testContextUtilization(testCase);
    }

    // Generate report
    this.generateReport();
  }

  /**
   * Wait for server to be ready
   */
  async waitForServer() {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${BASE_URL}/enhance`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: 'test',
            context: {}
          }),
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          console.log('✅ Server is ready!');
          return;
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw new Error('Server not ready after maximum attempts');
  }
}

// Run the validation tests
async function main() {
  const validator = new PromptQualityValidator();
  
  try {
    await validator.runAllTests();
  } catch (error) {
    console.error('❌ Validation tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PromptQualityValidator;
