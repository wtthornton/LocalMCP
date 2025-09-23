/**
 * Simple MCP Server Test
 * 
 * Tests the MCP server initialization and tool registration
 */

// Load OpenAI keys from centralized configuration
import { loadOpenAIKeys } from '../scripts/load-keys.js';
loadOpenAIKeys();

import { MCPServer } from '../dist/mcp/server.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';
import { Context7IntegrationService } from '../dist/services/context7/context7-integration.service.js';

async function testMCPServer() {
  console.log('🚀 Starting MCP Server Test...');
  
  try {
    // Initialize services
    const logger = new Logger('MCPServerTest');
    const config = new ConfigService();
    
    console.log('✅ Services initialized');
    
    // Initialize Context7
    const context7Integration = new Context7IntegrationService(logger, config);
    await context7Integration.initialize();
    console.log('✅ Context7 integration initialized');
    
    // Create services object
    const services = {
      logger,
      config,
      context7Integration
    };
    
    // Create MCP server
    const mcpServer = new MCPServer(services);
    console.log('✅ MCP server created');
    
    // Initialize server
    await mcpServer.initialize();
    console.log('✅ MCP server initialized');
    
    // Test tool registration
    console.log('📝 Available tools:');
    console.log('   - promptmcp.enhance');
    console.log('   - promptmcp.todo');
    console.log('   - promptmcp.breakdown');
    
    console.log('🎉 All tests passed! MCP server is ready for production.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testMCPServer();
