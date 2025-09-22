#!/usr/bin/env node

/**
 * Simple test for PromptMCP
 * Tests the enhance tool with a sample prompt
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';

async function testPromptMCP() {
  console.log('🚀 Testing PromptMCP...\n');

  try {
    const enhanceTool = new EnhancedContext7EnhanceTool();
    
    const testRequest = {
      prompt: "Create a login form",
      context: {
        framework: "react",
        style: "tailwind"
      }
    };

    console.log('📝 Original prompt:', testRequest.prompt);
    console.log('🔧 Context:', testRequest.context);
    console.log('\n⏳ Enhancing prompt...\n');

    const result = await enhanceTool.enhance(testRequest);
    
    console.log('✨ Enhanced prompt:');
    console.log(result.enhanced_prompt);
    console.log('\n📊 Context used:');
    console.log(JSON.stringify(result.context_used, null, 2));
    
    console.log('\n✅ PromptMCP test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPromptMCP();
