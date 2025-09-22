#!/usr/bin/env node

/**
 * Debug Context7 Integration
 * Tests the actual Context7 service to identify why context7_docs is empty
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7RealIntegrationService } from './dist/services/context7/context7-real-integration.service.js';
import { Context7MCPClientService } from './dist/services/context7/context7-mcp-client.service.js';

async function testContext7Integration() {
  console.log('🔍 Testing Context7 Integration...\n');
  
  // Initialize services
  const logger = new Logger('debug');
  const config = new ConfigService();
  
  console.log('1. Testing Context7 MCP Client Service...');
  const mcpClient = new Context7MCPClientService(logger, config);
  
  try {
    // Test library resolution
    console.log('   Testing library resolution for "react"...');
    const reactLibraries = await mcpClient.resolveLibraryId('react');
    console.log('   ✅ React libraries found:', reactLibraries.length);
    if (reactLibraries.length > 0) {
      console.log('   📚 First library:', reactLibraries[0]);
    }
    
    // Test documentation retrieval
    if (reactLibraries.length > 0) {
      const libraryId = reactLibraries[0].id;
      console.log(`   Testing documentation retrieval for ${libraryId}...`);
      
      const docs = await mcpClient.getLibraryDocumentation(libraryId, 'components', 1000);
      console.log('   ✅ Documentation retrieved:', docs.content.length, 'characters');
      console.log('   📄 Preview:', docs.content.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('   ❌ MCP Client Error:', error.message);
    console.log('   🔍 Error details:', error);
  }
  
  console.log('\n2. Testing Context7 Real Integration Service...');
  const realContext7 = new Context7RealIntegrationService(logger, config);
  
  try {
    // Test library resolution
    console.log('   Testing library resolution for "typescript"...');
    const tsLibraries = await realContext7.resolveLibraryId('typescript');
    console.log('   ✅ TypeScript libraries found:', tsLibraries.length);
    if (tsLibraries.length > 0) {
      console.log('   📚 First library:', tsLibraries[0]);
    }
    
    // Test documentation retrieval
    if (tsLibraries.length > 0) {
      const libraryId = tsLibraries[0].id;
      console.log(`   Testing documentation retrieval for ${libraryId}...`);
      
      const docs = await realContext7.getLibraryDocumentation(libraryId, 'types', 1000);
      console.log('   ✅ Documentation retrieved:', docs.content.length, 'characters');
      console.log('   📄 Preview:', docs.content.substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.log('   ❌ Real Integration Error:', error.message);
    console.log('   🔍 Error details:', error);
  }
  
  console.log('\n3. Testing Enhancement Tool...');
  try {
    const { EnhancedContext7EnhanceTool } = await import('./dist/tools/enhanced-context7-enhance.tool.js');
    const { Context7MCPComplianceService } = await import('./dist/services/context7/context7-mcp-compliance.service.js');
    const { Context7MonitoringService } = await import('./dist/services/context7/context7-monitoring.service.js');
    const { Context7AdvancedCacheService } = await import('./dist/services/context7/context7-advanced-cache.service.js');
    
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
    
    console.log('   Testing enhancement with "create a hello world page"...');
    const result = await enhanceTool.enhance({
      prompt: 'create a hello world page',
      context: {
        framework: 'react',
        style: 'modern'
      }
    });
    
    console.log('   ✅ Enhancement completed');
    console.log('   📊 Result success:', result.success);
    console.log('   📝 Enhanced prompt length:', result.enhanced_prompt.length);
    console.log('   📚 Context7 docs length:', result.context_used.context7_docs.length);
    console.log('   🏗️ Repo facts length:', result.context_used.repo_facts.length);
    console.log('   💻 Code snippets length:', result.context_used.code_snippets.length);
    
    if (result.context_used.context7_docs.length > 0) {
      console.log('   📄 Context7 docs preview:', result.context_used.context7_docs[0].substring(0, 200) + '...');
    } else {
      console.log('   ⚠️  Context7 docs are empty!');
    }
    
  } catch (error) {
    console.log('   ❌ Enhancement Tool Error:', error.message);
    console.log('   🔍 Error details:', error);
  }
  
  console.log('\n🏁 Context7 Integration Test Complete');
}

// Run the test
testContext7Integration().catch(console.error);
