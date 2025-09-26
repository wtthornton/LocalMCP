/**
 * Direct Prompt Quality Validation Test
 */

const BASE_URL = 'http://localhost:3001';

async function testPromptQuality() {
  console.log('🚀 Starting Prompt Quality Validation');
  console.log('=' .repeat(60));

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
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log('-' .repeat(40));
    
    try {
      // Test enhanced prompt
      const response = await fetch(`${BASE_URL}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: testCase.original,
          context: testCase.context,
          options: {
            useAIEnhancement: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const enhancedPrompt = data.enhanced_prompt;
      
      // Analyze prompts
      const originalAnalysis = analyzePrompt(testCase.original);
      const enhancedAnalysis = analyzePrompt(enhancedPrompt);
      
      // Display results
      console.log(`📝 Original: "${testCase.original}"`);
      console.log(`📝 Enhanced: "${enhancedPrompt}"`);
      console.log(`\n📊 Analysis:`);
      console.log(`   Original Quality: ${originalAnalysis.score.toFixed(2)}/5`);
      console.log(`   Enhanced Quality: ${enhancedAnalysis.score.toFixed(2)}/5`);
      console.log(`   Quality Improvement: ${((enhancedAnalysis.score - originalAnalysis.score) / originalAnalysis.score * 100).toFixed(1)}%`);
      console.log(`   Length: ${testCase.original.length} → ${enhancedPrompt.length} chars`);
      console.log(`   Technical Terms: ${originalAnalysis.technicalTerms} → ${enhancedAnalysis.technicalTerms}`);
      console.log(`   Action Words: ${originalAnalysis.actionWords} → ${enhancedAnalysis.actionWords}`);
      console.log(`   Quality Features: ${originalAnalysis.qualityFeatures} → ${enhancedAnalysis.qualityFeatures}`);
      
      // Token efficiency
      const originalTokens = Math.ceil(testCase.original.length / 4);
      const enhancedTokens = Math.ceil(enhancedPrompt.length / 4);
      const tokenRatio = enhancedTokens / originalTokens;
      
      console.log(`\n🔢 Token Efficiency:`);
      console.log(`   Original Tokens: ${originalTokens}`);
      console.log(`   Enhanced Tokens: ${enhancedTokens}`);
      console.log(`   Token Ratio: ${tokenRatio.toFixed(2)}x`);
      console.log(`   Efficiency: ${tokenRatio <= 10 ? '✅ Good' : tokenRatio <= 20 ? '⚠️ Acceptable' : '❌ Poor'}`);
      
      console.log(`\n🎯 Verdict: ${enhancedAnalysis.score > originalAnalysis.score ? '✅ Enhanced is better' : '❌ Enhanced is not better'}`);
      
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Validation complete!');
}

function analyzePrompt(prompt) {
  const analysis = {
    length: prompt.length,
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

// Run the test
testPromptQuality().catch(console.error);
