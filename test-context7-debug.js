#!/usr/bin/env node

/**
 * Debug Context7 integration issues
 */

import { Context7MCPClientService } from './dist/services/context7/context7-mcp-client.service.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';

async function debugContext7() {
  console.log('🔍 Debugging Context7 integration...\n');

  try {
    // Initialize dependencies
    const logger = new Logger();
    const config = new ConfigService();
    
    // Create Context7 MCP client
    const context7Client = new Context7MCPClientService(logger, config);
    
    console.log('📋 Configuration:');
    console.log('API Key:', config.getNested('context7', 'apiKey') ? 'Set' : 'Not set');
    console.log('Base URL:', config.getNested('context7', 'baseUrl'));
    console.log('Context7 Enabled:', config.getEnv('CONTEXT7_ENABLED'));
    console.log('');

    // Test library resolution
    console.log('🔍 Testing library resolution for "html"...');
    try {
      const libraries = await context7Client.resolveLibraryId('html');
      console.log('✅ Library resolution successful:');
      console.log(JSON.stringify(libraries, null, 2));
    } catch (error) {
      console.log('❌ Library resolution failed:');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
    }

    console.log('\n🔍 Testing library resolution for "css"...');
    try {
      const libraries = await context7Client.resolveLibraryId('css');
      console.log('✅ Library resolution successful:');
      console.log(JSON.stringify(libraries, null, 2));
    } catch (error) {
      console.log('❌ Library resolution failed:');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
    }

    console.log('\n🔍 Testing library resolution for "javascript"...');
    try {
      const libraries = await context7Client.resolveLibraryId('javascript');
      console.log('✅ Library resolution successful:');
      console.log(JSON.stringify(libraries, null, 2));
    } catch (error) {
      console.log('❌ Library resolution failed:');
      console.log('Error:', error.message);
      console.log('Stack:', error.stack);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugContext7();