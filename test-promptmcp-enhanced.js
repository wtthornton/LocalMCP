#!/usr/bin/env node

/**
 * Enhanced test for PromptMCP with proper service initialization
 * Tests the enhance tool with all required dependencies
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';

async function testPromptMCPEnhanced() {
  console.log('🚀 Testing Enhanced PromptMCP...\n');

  try {
    // Initialize all required services
    console.log('🔧 Initializing services...');
    const logger = new Logger('PromptMCP-Test');
    const config = new ConfigService();
    const mcpCompliance = new Context7MCPComplianceService(logger, config);
    const monitoring = new Context7MonitoringService(logger, config);
    const cache = new Context7AdvancedCacheService(logger, config, monitoring);
    
    // Initialize the enhanced tool
    const enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      mcpCompliance,
      monitoring,
      cache
    );
    
    console.log('✅ Services initialized successfully\n');

    const testRequest = {
      prompt: "Create a fancy Rick-themed Hello World HTML page with animations and interactive features",
      context: {
        framework: "html",
        style: "css"
      },
      options: {
        maxTokens: 4000,
        includeMetadata: true
      }
    };

    console.log('📝 Original prompt:', testRequest.prompt);
    console.log('🔧 Context:', testRequest.context);
    console.log('\n⏳ Enhancing prompt...\n');

    const result = await enhanceTool.enhance(testRequest);
    
    console.log('✨ Enhanced prompt:');
    console.log('='.repeat(80));
    console.log(result.enhanced_prompt);
    console.log('='.repeat(80));
    
    console.log('\n📊 Context used:');
    console.log(JSON.stringify(result.context_used, null, 2));
    
    console.log('\n🎯 Success:', result.success);
    if (result.error) {
      console.log('❌ Error:', result.error);
    }
    
    console.log('\n✅ Enhanced PromptMCP test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPromptMCPEnhanced();
