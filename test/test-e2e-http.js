// Using built-in fetch (Node.js 18+)

const testCases = [
  {
    id: 'simple',
    name: 'Simple Question',
    prompt: 'How do I create a button?',
    context: { framework: 'html', style: 'css' }
  },
  {
    id: 'medium',
    name: 'Medium Complexity Task',
    prompt: 'Create a React component that displays a list of users with search functionality',
    context: { framework: 'react', style: 'tailwind' }
  },
  {
    id: 'complex',
    name: 'Complex Development Task',
    prompt: 'Build a full-stack application with user authentication, real-time chat, and file upload using Next.js, TypeScript, and PostgreSQL',
    context: { framework: 'nextjs', style: 'tailwind' }
  },
  {
    id: 'debug',
    name: 'Debug/Error Fix Task',
    prompt: 'Fix this TypeScript error: Property "data" does not exist on type "unknown" in my API response handler',
    context: { framework: 'typescript', file: 'src/api/handler.ts' }
  },
  {
    id: 'optimization',
    name: 'Performance Optimization Task',
    prompt: 'Optimize this React component for better performance and reduce bundle size',
    context: { framework: 'react', style: 'performance' }
  }
];

// Simple token counting function
function countTokens(text) {
  if (!text) return 0;
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Quality scoring functions
function scoreEnhancementQuality(original, enhanced) {
  if (!enhanced || enhanced.length <= original.length) return 1;
  
  const improvement = enhanced.length / original.length;
  if (improvement >= 2.5) return 5; // Excellent enhancement
  if (improvement >= 2.0) return 4; // Good enhancement
  if (improvement >= 1.5) return 3; // Adequate enhancement
  if (improvement >= 1.2) return 2; // Poor enhancement
  return 1; // Failed
}

function scoreContextUsage(contextUsed, contextProvided) {
  if (!contextUsed || Object.keys(contextUsed).length === 0) return 1;
  
  const contextKeys = Object.keys(contextUsed).length;
  const providedKeys = Object.keys(contextProvided).length;
  
  if (contextKeys >= providedKeys) return 5; // Used all context
  if (contextKeys >= providedKeys * 0.8) return 4; // Used most context
  if (contextKeys >= providedKeys * 0.5) return 3; // Used some context
  if (contextKeys >= providedKeys * 0.2) return 2; // Used little context
  return 1; // Failed
}

function scoreFrameworkDetection(frameworksDetected, expectedFrameworks) {
  if (!frameworksDetected || frameworksDetected.length === 0) return 1;
  
  const detected = frameworksDetected.length;
  const expected = expectedFrameworks ? expectedFrameworks.length : 1;
  
  if (detected >= expected) return 5; // Detected all expected
  if (detected >= expected * 0.8) return 4; // Detected most
  if (detected >= expected * 0.5) return 3; // Detected some
  if (detected >= expected * 0.2) return 2; // Detected few
  return 1; // Failed
}

function scoreResponseCompleteness(result) {
  if (!result.success) return 1;
  
  let score = 2; // Base score for success
  
  if (result.enhanced_prompt && result.enhanced_prompt.length > 0) score += 1;
  if (result.context_used && Object.keys(result.context_used).length > 0) score += 1;
  if (result.metrics?.frameworks_detected && result.metrics.frameworks_detected.length > 0) score += 1;
  if (result.breakdown && result.breakdown.tasks && result.breakdown.tasks.length > 0) score += 1;
  
  return Math.min(5, score);
}

function scoreTokenEfficiency(inputTokens, outputTokens) {
  if (outputTokens === 0) return 1;
  
  const ratio = outputTokens / inputTokens;
  
  if (ratio >= 1.5 && ratio <= 3.0) return 5; // Perfect ratio
  if (ratio >= 1.2 && ratio <= 4.0) return 4; // Good ratio
  if (ratio >= 1.0 && ratio <= 5.0) return 3; // Adequate ratio
  if (ratio >= 0.5 && ratio <= 8.0) return 2; // Poor ratio
  return 1; // Failed
}

async function testPrompt(promptData) {
  console.log(`\n🧪 Testing: ${promptData.name}`);
  console.log(`📝 Original: ${promptData.prompt}`);
  console.log(`🔧 Context: ${JSON.stringify(promptData.context)}`);

  const startTime = Date.now();
  const inputTokens = countTokens(promptData.prompt);

  try {
    const response = await fetch('http://localhost:3001/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptData.prompt,
        context: promptData.context,
        options: {
          useCache: true,
          maxTokens: 2000,
          includeMetadata: true,
          includeBreakdown: true,
          maxTasks: 5
        }
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Calculate quality scores
    const outputTokens = countTokens(result.enhanced_prompt);
    const tokenRatio = outputTokens / inputTokens;
    
    const enhancementScore = scoreEnhancementQuality(promptData.prompt, result.enhanced_prompt);
    const contextScore = scoreContextUsage(result.context_used, promptData.context);
    const frameworkScore = scoreFrameworkDetection(result.metrics?.frameworks_detected, [promptData.context.framework]);
    const completenessScore = scoreResponseCompleteness(result);
    const tokenScore = scoreTokenEfficiency(inputTokens, outputTokens);
    
    const overallScore = (enhancementScore + contextScore + frameworkScore + completenessScore + tokenScore) / 5;
    
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Enhanced prompt length: ${result.enhanced_prompt?.length || 0} chars`);
    console.log(`🔢 Token count: ${inputTokens} → ${outputTokens} (ratio: ${tokenRatio.toFixed(2)}x)`);
    console.log(`🔍 Context used: ${JSON.stringify(result.context_used, null, 2)}`);
    
    if (result.breakdown) {
      console.log(`📋 Task breakdown: ${result.breakdown.mainTasks?.length || 0} main tasks, ${result.breakdown.subtasks?.length || 0} subtasks`);
    }
    
    if (result.metrics?.frameworks_detected) {
      console.log(`🎯 Frameworks detected: ${result.metrics.frameworks_detected.join(', ')}`);
    }
    
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📈 Quality Scores:`);
    console.log(`   Enhancement: ${enhancementScore}/5`);
    console.log(`   Context Usage: ${contextScore}/5`);
    console.log(`   Framework Detection: ${frameworkScore}/5`);
    console.log(`   Completeness: ${completenessScore}/5`);
    console.log(`   Token Efficiency: ${tokenScore}/5`);
    console.log(`   Overall: ${overallScore.toFixed(2)}/5`);
    
    return {
      success: true,
      responseTime,
      result,
      scores: {
        enhancement: enhancementScore,
        context: contextScore,
        framework: frameworkScore,
        completeness: completenessScore,
        tokenEfficiency: tokenScore,
        overall: overallScore
      },
      tokens: {
        input: inputTokens,
        output: outputTokens,
        ratio: tokenRatio
      }
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`❌ Error: ${error.message}`);
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    return {
      success: false,
      responseTime,
      error: error.message,
      scores: {
        enhancement: 1,
        context: 1,
        framework: 1,
        completeness: 1,
        tokenEfficiency: 1,
        overall: 1
      },
      tokens: {
        input: inputTokens,
        output: 0,
        ratio: 0
      }
    };
  }
}

async function runQualityTests() {
  console.log('🚀 Starting PromptMCP Quality Tests (HTTP)');
  console.log('============================================================');

  const results = [];
  
  for (const testCase of testCases) {
    const result = await testPrompt(testCase);
    results.push({
      ...testCase,
      ...result
    });
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = Math.round((successful / total) * 100);
  const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / total);
  
  // Quality score averages
  const avgEnhancementScore = results.reduce((sum, r) => sum + r.scores.enhancement, 0) / total;
  const avgContextScore = results.reduce((sum, r) => sum + r.scores.context, 0) / total;
  const avgFrameworkScore = results.reduce((sum, r) => sum + r.scores.framework, 0) / total;
  const avgCompletenessScore = results.reduce((sum, r) => sum + r.scores.completeness, 0) / total;
  const avgTokenScore = results.reduce((sum, r) => sum + r.scores.tokenEfficiency, 0) / total;
  const avgOverallScore = results.reduce((sum, r) => sum + r.scores.overall, 0) / total;
  
  // Token statistics
  const totalInputTokens = results.reduce((sum, r) => sum + r.tokens.input, 0);
  const totalOutputTokens = results.reduce((sum, r) => sum + r.tokens.output, 0);
  const avgTokenRatio = results.reduce((sum, r) => sum + r.tokens.ratio, 0) / total;

  console.log('\n📊 QUALITY TEST SUMMARY');
  console.log('============================================================');
  console.log(`Total Tests: ${total}`);
  console.log(`Successful: ${successful}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Average Response Time: ${avgResponseTime}ms`);
  console.log(`\n📈 QUALITY SCORES:`);
  console.log(`   Enhancement: ${avgEnhancementScore.toFixed(2)}/5`);
  console.log(`   Context Usage: ${avgContextScore.toFixed(2)}/5`);
  console.log(`   Framework Detection: ${avgFrameworkScore.toFixed(2)}/5`);
  console.log(`   Completeness: ${avgCompletenessScore.toFixed(2)}/5`);
  console.log(`   Token Efficiency: ${avgTokenScore.toFixed(2)}/5`);
  console.log(`   Overall Quality: ${avgOverallScore.toFixed(2)}/5`);
  console.log(`\n🔢 TOKEN STATISTICS:`);
  console.log(`   Total Input Tokens: ${totalInputTokens}`);
  console.log(`   Total Output Tokens: ${totalOutputTokens}`);
  console.log(`   Average Token Ratio: ${avgTokenRatio.toFixed(2)}x`);

  console.log('\n📋 DETAILED RESULTS');
  console.log('----------------------------------------');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const qualityGrade = result.scores.overall >= 4.0 ? 'A' : result.scores.overall >= 3.0 ? 'B' : result.scores.overall >= 2.0 ? 'C' : 'D';
    console.log(`${index + 1}. ${result.name}`);
    console.log(`   ${status} Success: ${result.success}`);
    console.log(`   ⏱️  Response Time: ${result.responseTime}ms`);
    console.log(`   📈 Overall Quality: ${result.scores.overall.toFixed(2)}/5 (${qualityGrade})`);
    console.log(`   🔢 Tokens: ${result.tokens.input} → ${result.tokens.output} (${result.tokens.ratio.toFixed(2)}x)`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  });

  console.log('\n🏁 Quality tests completed!');
}

// Wait for container to be ready
console.log('⏳ Waiting for container to be ready...');
setTimeout(() => {
  runQualityTests().catch(console.error);
}, 10000); // Wait 10 seconds
