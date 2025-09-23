#!/usr/bin/env node

/**
 * Test Context7 Code Enhancement
 * 
 * Uses Context7 to get better TypeScript patterns and improve our health check code
 */

import { Context7RealIntegrationService } from '../dist/services/context7/context7-real-integration.service.js';
import { Logger } from '../dist/services/logger/logger.js';
import { ConfigService } from '../dist/config/config.service.js';

async function testContext7CodeEnhancement() {
  console.log('🔗 Testing Context7 Code Enhancement...\n');
  
  const logger = new Logger('Context7EnhanceTest');
  const config = new ConfigService();
  
  // Set up environment variables for testing
  process.env.CONTEXT7_API_KEY = 'ctx7sk-b6f0b8b1-c91f-4d1a-9d71-7a67e98c2e49';
  
  const context7Service = new Context7RealIntegrationService(logger, config);

  try {
    // Get TypeScript best practices for error handling
    console.log('1️⃣ Getting TypeScript error handling best practices...');
    const tsLibraries = await context7Service.resolveLibraryId('typescript');
    const officialTS = tsLibraries.find(lib => lib.id.includes('/microsoft/typescript'));
    
    if (officialTS) {
      const tsDocs = await context7Service.getLibraryDocumentation(
        officialTS.id, 
        'error handling types', 
        3000
      );
      
      console.log('TypeScript error handling documentation:');
      console.log('Content length:', tsDocs.content.length);
      console.log('Preview:');
      console.log(tsDocs.content.substring(0, 800) + '...');
      console.log('');
    }

    // Get Node.js best practices for health checks
    console.log('2️⃣ Getting Node.js health check patterns...');
    const nodeLibraries = await context7Service.resolveLibraryId('node');
    const officialNode = nodeLibraries.find(lib => lib.id.includes('/nodejs/node'));
    
    if (officialNode) {
      const nodeDocs = await context7Service.getLibraryDocumentation(
        officialNode.id, 
        'health check monitoring', 
        3000
      );
      
      console.log('Node.js health check documentation:');
      console.log('Content length:', nodeDocs.content.length);
      console.log('Preview:');
      console.log(nodeDocs.content.substring(0, 800) + '...');
      console.log('');
    }

    // Get Express.js patterns for HTTP health endpoints
    console.log('3️⃣ Getting Express.js HTTP patterns...');
    const expressLibraries = await context7Service.resolveLibraryId('express');
    const officialExpress = expressLibraries.find(lib => lib.id.includes('/expressjs/express'));
    
    if (officialExpress) {
      const expressDocs = await context7Service.getLibraryDocumentation(
        officialExpress.id, 
        'middleware health check', 
        2000
      );
      
      console.log('Express.js health check patterns:');
      console.log('Content length:', expressDocs.content.length);
      console.log('Preview:');
      console.log(expressDocs.content.substring(0, 600) + '...');
      console.log('');
    }

    // Extract and show code examples
    console.log('4️⃣ Extracting code examples...');
    if (officialTS) {
      const tsDocs = await context7Service.getLibraryDocumentation(
        officialTS.id, 
        'error handling', 
        2000
      );
      
      const codeExamples = context7Service.extractCodeExamples(tsDocs.content, officialTS.id);
      console.log('TypeScript code examples found:', codeExamples.length);
      codeExamples.slice(0, 3).forEach((example, index) => {
        console.log(`\nExample ${index + 1}:`);
        console.log(example);
      });
      console.log('');
    }

    // Extract best practices
    console.log('5️⃣ Extracting best practices...');
    if (officialNode) {
      const nodeDocs = await context7Service.getLibraryDocumentation(
        officialNode.id, 
        'monitoring', 
        2000
      );
      
      const bestPractices = context7Service.extractBestPractices(nodeDocs.content, 'node');
      console.log('Node.js best practices found:', bestPractices.length);
      bestPractices.slice(0, 5).forEach((practice, index) => {
        console.log(`${index + 1}. ${practice}`);
      });
      console.log('');
    }

    console.log('✅ Context7 code enhancement test completed!');
    console.log('\n💡 Key insights for improving our health check:');
    console.log('- Use proper TypeScript error handling patterns');
    console.log('- Implement proper HTTP status codes');
    console.log('- Add proper logging and monitoring');
    console.log('- Use async/await patterns correctly');
    console.log('- Implement proper cleanup and resource management');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testContext7CodeEnhancement().catch(console.error);
