#!/usr/bin/env node

/**
 * Test Fixed Enhancement Tool
 * Tests the full enhancement tool to see if context7_docs are populated
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';

async function testFixedEnhancement() {
  console.log('🔍 Testing Fixed Enhancement Tool...\n');
  
  const logger = new Logger('test');
  const config = new ConfigService();
  
  try {
    const mcpCompliance = new Context7MCPComplianceService(logger, config);
    const monitoring = new Context7MonitoringService(logger, config);
    const cache = new Context7AdvancedCacheService(logger, config);
    
    const enhanceTool = new EnhancedContext7EnhanceTool(
      logger,
      config,
      mcpCompliance,
      monitoring,
      cache
    );
    
    console.log('Testing enhancement with "create a hello world page"...');
    const result = await enhanceTool.enhance({
      prompt: 'create a hello world page',
      context: {
        framework: 'react',
        style: 'modern'
      }
    });
    
    console.log('\n📊 Enhancement Results:');
    console.log('  Success:', result.success);
    console.log('  Enhanced prompt length:', result.enhanced_prompt.length);
    console.log('  Context7 docs count:', result.context_used.context7_docs.length);
    console.log('  Repo facts count:', result.context_used.repo_facts.length);
    console.log('  Code snippets count:', result.context_used.code_snippets.length);
    
    if (result.context_used.context7_docs.length > 0) {
      console.log('\n📚 Context7 Docs Preview:');
      result.context_used.context7_docs.forEach((doc, index) => {
        console.log(`  Doc ${index + 1}:`, doc.substring(0, 100) + '...');
      });
    } else {
      console.log('\n⚠️  Context7 docs are still empty!');
    }
    
    if (result.context_used.repo_facts.length > 0) {
      console.log('\n🏗️ Repo Facts:');
      result.context_used.repo_facts.forEach((fact, index) => {
        console.log(`  Fact ${index + 1}:`, fact);
      });
    } else {
      console.log('\n⚠️  Repo facts are still empty!');
    }
    
    if (result.context_used.code_snippets.length > 0) {
      console.log('\n💻 Code Snippets:');
      result.context_used.code_snippets.forEach((snippet, index) => {
        console.log(`  Snippet ${index + 1}:`, snippet.substring(0, 100) + '...');
      });
    } else {
      console.log('\n⚠️  Code snippets are still empty!');
    }
    
  } catch (error) {
    console.log('❌ Enhancement Error:', error.message);
    console.log('🔍 Error details:', error);
  }
  
  console.log('\n🏁 Fixed Enhancement Test Complete');
}

// Run the test
testFixedEnhancement().catch(console.error);
