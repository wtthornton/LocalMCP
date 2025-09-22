#!/usr/bin/env node

/**
 * Quick Critical Analysis - Focus on real metrics
 */

console.log('🔬 Quick Critical Analysis of PromptMCP');
console.log('=' .repeat(50));

// Test the existing enhanced tool directly
async function quickTest() {
  try {
    console.log('📦 Loading modules...');
    
    const { EnhancedContext7EnhanceTool } = await import('./dist/tools/enhanced-context7-enhance.tool.js');
    const { Logger } = await import('./dist/services/logger/logger.js');
    const { ConfigService } = await import('./dist/config/config.service.js');
    const { Context7MCPComplianceService } = await import('./dist/services/context7/context7-mcp-compliance.service.js');
    const { Context7MonitoringService } = await import('./dist/services/context7/context7-monitoring.service.js');
    const { Context7AdvancedCacheService } = await import('./dist/services/context7/context7-advanced-cache.service.js');
    
    console.log('✅ Modules loaded');
    
    // Initialize services
    const logger = new Logger('Quick-Critical');
    const config = new ConfigService();
    const mcpCompliance = new Context7MCPComplianceService(logger, config);
    const monitoring = new Context7MonitoringService(logger, config);
    const cache = new Context7AdvancedCacheService(logger, config, monitoring);
    
    const enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      mcpCompliance,
      monitoring,
      cache
    );
    
    console.log('✅ Services initialized\n');
    
    // Test cases
    const tests = [
      {
        name: 'Simple Math',
        prompt: 'What is 2+2?',
        shouldBeMinimal: true
      },
      {
        name: 'HTML Button',
        prompt: 'Create a button in HTML',
        shouldBeModerate: true
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log(`📝 Prompt: "${test.prompt}"`);
      
      const startTime = Date.now();
      const result = await enhanceTool.enhance({
        prompt: test.prompt,
        context: {},
        options: { maxTokens: 4000, includeMetadata: true }
      });
      const responseTime = Date.now() - startTime;
      
      // Calculate metrics
      const originalTokens = Math.ceil(test.prompt.length / 4);
      const enhancedTokens = Math.ceil(result.enhanced_prompt.length / 4);
      const tokenRatio = enhancedTokens / originalTokens;
      
      console.log(`⏱️  Response Time: ${responseTime}ms`);
      console.log(`📊 Tokens: ${originalTokens} → ${enhancedTokens} (${tokenRatio.toFixed(2)}x)`);
      
      // Check for over-engineering
      const isOverEngineered = test.shouldBeMinimal && tokenRatio > 5;
      const hasUnnecessaryContext = test.shouldBeMinimal && result.enhanced_prompt.includes('Detected Frameworks');
      
      console.log(`🎯 Over-engineered: ${isOverEngineered ? '⚠️ YES' : '✅ No'}`);
      console.log(`🎯 Unnecessary context: ${hasUnnecessaryContext ? '⚠️ YES' : '✅ No'}`);
      
      // Check accuracy for HTML test
      if (test.name === 'HTML Button') {
        const enhanced = result.enhanced_prompt.toLowerCase();
        const hasHTML = enhanced.includes('html') || enhanced.includes('<button');
        const hasCSS = enhanced.includes('css') || enhanced.includes('style');
        console.log(`🎯 HTML detected: ${hasHTML ? '✅' : '❌'}`);
        console.log(`🎯 CSS detected: ${hasCSS ? '✅' : '❌'}`);
      }
      
      results.push({
        name: test.name,
        tokenRatio,
        isOverEngineered,
        hasUnnecessaryContext,
        responseTime
      });
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 CRITICAL ANALYSIS SUMMARY');
    console.log('=' .repeat(50));
    
    const avgTokenRatio = results.reduce((sum, r) => sum + r.tokenRatio, 0) / results.length;
    const overEngineeredCount = results.filter(r => r.isOverEngineered).length;
    const unnecessaryContextCount = results.filter(r => r.hasUnnecessaryContext).length;
    
    console.log(`Average Token Ratio: ${avgTokenRatio.toFixed(2)}x`);
    console.log(`Over-engineered Tests: ${overEngineeredCount}/${results.length}`);
    console.log(`Unnecessary Context: ${unnecessaryContextCount}/${results.length}`);
    
    // Critical assessment
    console.log('\n🎯 CRITICAL ASSESSMENT:');
    
    if (avgTokenRatio > 10) {
      console.log('❌ CRITICAL: System is extremely over-engineered');
    } else if (avgTokenRatio > 5) {
      console.log('⚠️ WARNING: System is over-engineered');
    } else if (avgTokenRatio > 2) {
      console.log('✅ ACCEPTABLE: System provides reasonable enhancement');
    } else {
      console.log('✅ EXCELLENT: System is token-efficient');
    }
    
    if (overEngineeredCount > 0) {
      console.log(`⚠️ WARNING: ${overEngineeredCount} tests were over-engineered`);
    }
    
    if (unnecessaryContextCount > 0) {
      console.log(`⚠️ WARNING: ${unnecessaryContextCount} tests added unnecessary context`);
    }
    
    // Recommendations based on Context7 research
    console.log('\n💡 RECOMMENDATIONS (Based on Context7 Research):');
    
    if (avgTokenRatio > 3) {
      console.log('1. Implement LLMLingua-style prompt compression');
      console.log('2. Add complexity detection to avoid over-engineering simple tasks');
    }
    
    if (unnecessaryContextCount > 0) {
      console.log('3. Implement minimal enhancement mode for simple questions');
      console.log('4. Add context necessity checks');
    }
    
    console.log('\n' + '=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

quickTest();
