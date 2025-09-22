#!/usr/bin/env node

/**
 * Debug Repo Facts Gathering
 * Tests the actual repo facts gathering to identify why it's not working
 */

import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';
import { Context7MCPComplianceService } from './dist/services/context7/context7-mcp-compliance.service.js';
import { Context7RealIntegrationService } from './dist/services/context7/context7-real-integration.service.js';
import { Context7MonitoringService } from './dist/services/context7/context7-monitoring.service.js';
import { Context7AdvancedCacheService } from './dist/services/context7/context7-advanced-cache.service.js';
import { EnhancedContext7EnhanceTool } from './dist/tools/enhanced-context7-enhance.tool.js';

async function debugRepoFacts() {
  console.log('🔍 Debugging Repo Facts Gathering...\n');
  
  const logger = new Logger('debug');
  const config = new ConfigService();
  const mcpCompliance = new Context7MCPComplianceService(logger, config);
  const realContext7 = new Context7RealIntegrationService(logger, config);
  const monitoring = new Context7MonitoringService(logger, config);
  const cache = new Context7AdvancedCacheService(logger, config);
  
  const enhanceTool = new EnhancedContext7EnhanceTool(
    logger,
    config,
    mcpCompliance,
    monitoring,
    cache
  );

  try {
    console.log('1. Testing file system access...');
    const fs = await import('fs/promises');
    
    console.log('   Current working directory:', process.cwd());
    
    // Test reading package.json
    try {
      const packageContent = await fs.readFile('package.json', 'utf8');
      const packageData = JSON.parse(packageContent);
      console.log('   ✅ package.json read successfully');
      console.log('   Project name:', packageData.name);
      console.log('   Dependencies count:', Object.keys(packageData.dependencies || {}).length);
      console.log('   DevDependencies count:', Object.keys(packageData.devDependencies || {}).length);
    } catch (error) {
      console.log('   ❌ Failed to read package.json:', error.message);
    }
    
    // Test reading tsconfig.json
    try {
      const tsConfigContent = await fs.readFile('tsconfig.json', 'utf8');
      const tsConfigData = JSON.parse(tsConfigContent);
      console.log('   ✅ tsconfig.json read successfully');
      console.log('   TypeScript target:', tsConfigData.compilerOptions?.target);
    } catch (error) {
      console.log('   ❌ Failed to read tsconfig.json:', error.message);
    }
    
    console.log('\n2. Testing repo facts gathering...');
    const request = {
      prompt: 'create a new hello page that is fancy, modern and fun',
      context: { framework: 'react', style: 'modern' }
    };
    
    // Use reflection to access private method
    const gatherRepoFacts = enhanceTool.constructor.prototype.gatherRepoFacts.bind(enhanceTool);
    const facts = await gatherRepoFacts(request);
    
    console.log('   Repo facts gathered:', facts.length);
    facts.forEach((fact, index) => {
      console.log(`   ${index + 1}. ${fact}`);
    });
    
    console.log('\n3. Testing selectRelevantRepoFacts...');
    const selectRelevantRepoFacts = enhanceTool.constructor.prototype.selectRelevantRepoFacts.bind(enhanceTool);
    const relevantFacts = await selectRelevantRepoFacts(request, request.prompt);
    
    console.log('   Relevant facts selected:', relevantFacts.length);
    relevantFacts.forEach((fact, index) => {
      console.log(`   ${index + 1}. ${fact}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugRepoFacts().catch(console.error);
