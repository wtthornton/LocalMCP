/**
 * Simple Prompt Quality Validation Test
 * 
 * Directly compares original vs enhanced prompts to validate improvements
 */

// Test configuration
const BASE_URL = 'http://localhost:3001';

// Test cases
const testCases = [
  {
    name: 'React Component Creation',
    original: 'Create a React component that displays a list of users with search functionality',
    context: { framework: 'react', style: 'tailwind' }
  },
  {
    name: 'TypeScript Error Fix',
    original: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    context: { framework: 'typescript', file: 'src/api/handler.ts' }
  },
  {
    name: 'Performance Optimization',
    original: 'Optimize this React component for better performance and reduce bundle size',
    context: { framework: 'react', style: 'performance' }
  }
];

class SimplePromptValidator {
  constructor() {
    this.results = [];
  }

  /**
   * Test enhanced prompt
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
    return data;
  }

  /**
   * Analyze prompt quality
   */
  analyzePromptQuality(prompt) {
    const analysis = {
      length: prompt.length,
      wordCount: prompt.split(' ').length,
      technicalTerms: 0,
      actionWords: 0,
      qualityFeatures: 0,
      score: 0
    };

    // Technical terms
    const technicalTerms = [
      'TypeScript', 'React', 'component', 'hook', 'accessibility', 
      'performance', 'testing', 'memoization', 'optimization', 'tailwind'
    ];
    analysis.technicalTerms = technicalTerms.filter(term => 
      prompt.toLowerCase().includes(term.toLowerCase())
    ).length;

    // Action words
    const actionWords = [
      'create', 'implement', 'use', 'include', 'ensure', 'optimize', 
      'add', 'build', 'develop', 'generate'
    ];
    analysis.actionWords = actionWords.filter(word => 
      prompt.toLowerCase().includes(word.toLowerCase())
    ).length;

    // Quality features
    const qualityFeatures = [
      'accessibility', 'performance', 'testing', 'typescript', 'error handling',
      'optimization', 'best practices', 'security', 'scalability'
    ];
    analysis.qualityFeatures = qualityFeatures.filter(feature => 
      prompt.toLowerCase().includes(feature.toLowerCase())
    ).length;

    // Calculate overall score (1-5)
    analysis.score = Math.min(5, 
      (analysis.technicalTerms / technicalTerms.length) * 2 +
      (analysis.actionWords / actionWords.length) * 1 +
      (analysis.qualityFeatures / qualityFeatures.length) * 2
    );

    return analysis;
  }

  /**
   * Compare original vs enhanced
   */
  comparePrompts(original, enhanced) {
    const originalAnalysis = this.analyzePromptQuality(original);
    const enhancedAnalysis = this.analyzePromptQuality(enhanced);
    
    const improvement = {
      lengthIncrease: ((enhancedAnalysis.length - originalAnalysis.length) / originalAnalysis.length) * 100,
      qualityImprovement: ((enhancedAnalysis.score - originalAnalysis.score) / originalAnalysis.score) * 100,
      technicalTermsAdded: enhancedAnalysis.technicalTerms - originalAnalysis.technicalTerms,
      actionWordsAdded: enhancedAnalysis.actionWords - originalAnalysis.actionWords,
      qualityFeaturesAdded: enhancedAnalysis.qualityFeatures - originalAnalysis.qualityFeatures
    };

    return {
      original: originalAnalysis,
      enhanced: enhancedAnalysis,
      improvement: improvement,
      isBetter: enhancedAnalysis.score > originalAnalysis.score
    };
  }

  /**
   * Run test for a single case
   */
  async runTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('=' .repeat(60));
    
    try {
      // Get enhanced prompt
      const result = await this.testEnhancedPrompt(testCase.original, testCase.context);
      const enhancedPrompt = result.enhanced_prompt;
      
      // Compare original vs enhanced
      const comparison = this.comparePrompts(testCase.original, enhancedPrompt);
      
      // Display results
      console.log(`📝 Original: "${testCase.original}"`);
      console.log(`📝 Enhanced: "${enhancedPrompt}"`);
      console.log(`\n📊 Analysis:`);
      console.log(`   Original Quality: ${comparison.original.score.toFixed(2)}/5`);
      console.log(`   Enhanced Quality: ${comparison.enhanced.score.toFixed(2)}/5`);
      console.log(`   Quality Improvement: ${comparison.improvement.qualityImprovement.toFixed(1)}%`);
      console.log(`   Length Increase: ${comparison.improvement.lengthIncrease.toFixed(1)}%`);
      console.log(`   Technical Terms Added: ${comparison.improvement.technicalTermsAdded}`);
      console.log(`   Action Words Added: ${comparison.improvement.actionWordsAdded}`);
      console.log(`   Quality Features Added: ${comparison.improvement.qualityFeaturesAdded}`);
      console.log(`   Is Better: ${comparison.isBetter ? '✅ YES' : '❌ NO'}`);
      
      // Token efficiency
      const originalTokens = Math.ceil(testCase.original.length / 4);
      const enhancedTokens = Math.ceil(enhancedPrompt.length / 4);
      const tokenRatio = enhancedTokens / originalTokens;
      
      console.log(`\n🔢 Token Efficiency:`);
      console.log(`   Original Tokens: ${originalTokens}`);
      console.log(`   Enhanced Tokens: ${enhancedTokens}`);
      console.log(`   Token Ratio: ${tokenRatio.toFixed(2)}x`);
      console.log(`   Efficiency: ${tokenRatio <= 10 ? '✅ Good' : tokenRatio <= 20 ? '⚠️ Acceptable' : '❌ Poor'}`);
      
      this.results.push({
        testCase: testCase.name,
        comparison: comparison,
        tokenRatio: tokenRatio,
        success: true
      });
      
      return comparison;
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      this.results.push({
        testCase: testCase.name,
        error: error.message,
        success: false
      });
      return null;
    }
  }

  /**
   * Generate summary report
   */
  generateReport() {
    console.log('\n📊 PROMPT QUALITY VALIDATION SUMMARY');
    console.log('=' .repeat(80));
    
    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);
    
    console.log(`\n📈 Test Results:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Successful: ${successfulTests.length}`);
    console.log(`   Failed: ${failedTests.length}`);
    
    if (successfulTests.length > 0) {
      const betterPrompts = successfulTests.filter(r => r.comparison.isBetter).length;
      const avgQualityImprovement = successfulTests.reduce((sum, r) => 
        sum + r.comparison.improvement.qualityImprovement, 0) / successfulTests.length;
      const avgTokenRatio = successfulTests.reduce((sum, r) => 
        sum + r.tokenRatio, 0) / successfulTests.length;
      
      console.log(`\n🎯 Quality Analysis:`);
      console.log(`   Better Prompts: ${betterPrompts}/${successfulTests.length} (${Math.round(betterPrompts/successfulTests.length*100)}%)`);
      console.log(`   Average Quality Improvement: ${avgQualityImprovement.toFixed(1)}%`);
      console.log(`   Average Token Ratio: ${avgTokenRatio.toFixed(2)}x`);
      
      console.log(`\n💡 Recommendations:`);
      if (betterPrompts === successfulTests.length) {
        console.log('   ✅ Enhanced prompts are consistently better - keep current approach');
      } else if (betterPrompts > successfulTests.length / 2) {
        console.log('   ⚠️  Enhanced prompts are mostly better - consider optimizations');
      } else {
        console.log('   ❌ Enhanced prompts are not better - need to revise approach');
      }
      
      if (avgTokenRatio <= 10) {
        console.log('   ✅ Token efficiency is good - no changes needed');
      } else if (avgTokenRatio <= 20) {
        console.log('   ⚠️  Token efficiency is acceptable - consider optimizations');
      } else {
        console.log('   ❌ Token efficiency is poor - need to reduce token usage');
      }
    }
    
    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`   ${test.testCase}: ${test.error}`);
      });
    }
    
    console.log('\n🏁 Validation complete!');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Simple Prompt Quality Validation');
    console.log('=' .repeat(80));
    
    try {
      for (const testCase of testCases) {
        await this.runTest(testCase);
      }
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      console.error(error.stack);
    }
  }
}

// Run the tests
async function main() {
  console.log('Starting prompt quality validation...');
  
  const validator = new SimplePromptValidator();
  
  try {
    await validator.runAllTests();
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SimplePromptValidator;
