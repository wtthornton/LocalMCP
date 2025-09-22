#!/usr/bin/env node

/**
 * Simple test for PromptMCP with proper dependency injection
 * Tests the enhance tool with a sample prompt
 */

import { EnhancedContext7EnhanceTool } from '../dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { Context7MCPComplianceService } from '../dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from '../dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from '../dist/services/context7/context7-advanced-cache.service.js';

async function testPromptMCP() {
  console.log('🚀 Testing PromptMCP with proper dependencies...\n');

  try {
    // Initialize dependencies
    console.log('📦 Initializing dependencies...');
    const logger = new Logger();
    const config = new ConfigService();
    const mcpCompliance = new Context7MCPComplianceService(logger, config);
    const monitoring = new Context7MonitoringService(logger);
    const cache = new Context7AdvancedCacheService(logger, config);
    
    // Create enhance tool with dependencies
    const enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      mcpCompliance,
      monitoring,
      cache
    );
    
    const testRequest = {
      prompt: "Create a simple HTML hello world page",
      context: {
        framework: "html",
        style: "css"
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
    console.log('\n✅ Success:', result.success);
    
    if (result.error) {
      console.log('❌ Error:', result.error);
    }
    
    console.log('\n✅ PromptMCP test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPromptMCP();
