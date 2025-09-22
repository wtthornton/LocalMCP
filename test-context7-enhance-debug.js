#!/usr/bin/env node

/**
 * Debug Context7 enhance tool to see why documentation isn't being retrieved
 */

import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';

async function debugContext7Enhance() {
  console.log('🔍 Debugging Context7 enhance tool...\n');

  try {
    // Initialize dependencies
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
      prompt: "Create a slick girly hello world page",
      context: {
        framework: "html/css/javascript",
        style: "modern, girly, pink, cute, animated"
      }
    };

    console.log('🌸 Testing with prompt:', testRequest.prompt);
    console.log('💅 Context:', testRequest.context);
    console.log('');

    // Test the enhance method with detailed logging
    console.log('⏳ Calling enhance method...\n');
    
    const result = await enhanceTool.enhance(testRequest);
    
    console.log('✨ Enhanced prompt:');
    console.log('='.repeat(80));
    console.log(result.enhanced_prompt);
    console.log('='.repeat(80));
    
    console.log('\n📊 Context used:');
    console.log('Repo facts:', result.context_used.repo_facts.length);
    console.log('Code snippets:', result.context_used.code_snippets.length);
    console.log('Context7 docs:', result.context_used.context7_docs.length);
    
    if (result.context_used.context7_docs.length > 0) {
      console.log('\n📚 Context7 docs content:');
      result.context_used.context7_docs.forEach((doc, index) => {
        console.log(`Doc ${index + 1}:`, doc.substring(0, 200) + '...');
      });
    } else {
      console.log('\n❌ No Context7 docs retrieved!');
    }
    
    console.log('\n📈 Metadata:');
    console.log(JSON.stringify(result.context_used.metadata, null, 2));
    
    console.log('\n✅ Success:', result.success);
    
    if (result.error) {
      console.log('❌ Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugContext7Enhance();
