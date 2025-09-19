#!/usr/bin/env node

/**
 * Test Enhanced Context7 Integration
 * 
 * Tests the updated Context7IntegrationService with real Context7 calls
 */

import { Context7IntegrationService } from './dist/services/context7/context7-integration.service.js';
import { Logger } from './dist/services/logger/logger.js';
import { ConfigService } from './dist/config/config.service.js';

async function testEnhancedContext7() {
  console.log('🔗 Testing Enhanced Context7 Integration...\n');
  
  const logger = new Logger('TestContext7');
  const config = new ConfigService();
  const context7Integration = new Context7IntegrationService(logger, config);
  
  try {
    // Initialize Context7 integration
    console.log('1️⃣ Initializing Context7 integration...');
    await context7Integration.initialize();
    console.log('✅ Context7 integration initialized successfully\n');

    // Test prompt enhancement
    console.log('2️⃣ Testing prompt enhancement...');
    const result = await context7Integration.enhancePrompt(
      'create a React component with hooks',
      {
        framework: 'react',
        file: 'src/components/MyComponent.tsx'
      },
      {
        maxTokens: 2000
      }
    );
    
    console.log('Enhancement result:');
    console.log('- Success:', result.success);
    console.log('- Enhanced prompt length:', result.enhancedPrompt?.length || 0);
    console.log('- Context used:', Object.keys(result.contextUsed || {}));
    console.log('- Libraries resolved:', result.librariesResolved?.length || 0);
    console.log('');

    // Test with different framework
    console.log('3️⃣ Testing with Vue framework...');
    const vueResult = await context7Integration.enhancePrompt(
      'create a Vue component with composition API',
      {
        framework: 'vue',
        style: 'tailwind'
      },
      {
        maxTokens: 1500
      }
    );
    
    console.log('Vue enhancement result:');
    console.log('- Success:', vueResult.success);
    console.log('- Enhanced prompt length:', vueResult.enhancedPrompt?.length || 0);
    console.log('- Libraries resolved:', vueResult.librariesResolved?.length || 0);
    console.log('');

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testEnhancedContext7().catch(console.error);
