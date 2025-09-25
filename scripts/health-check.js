#!/usr/bin/env node

/**
 * Health Check Script for AI Summarization
 */

const { loadProductionConfig, validateConfig } = require('../dist/src/config/production.config.js');

async function runHealthCheck() {
  console.log('🏥 AI Summarization Health Check\n');

  try {
    // Load and validate configuration
    const config = loadProductionConfig();
    const errors = validateConfig(config);

    if (errors.length > 0) {
      console.error('❌ Configuration errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    console.log('✅ Configuration valid');

    // Check environment variables
    const requiredVars = ['OPENAI_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`  - ${varName}`));
      process.exit(1);
    }

    console.log('✅ Environment variables configured');

    // Check if services can be imported
    try {
      const { SimpleSummarizationService } = require('../dist/src/services/ai/simple-summarization.service.js');
      const { EnhancedPromptCacheService } = require('../dist/src/services/cache/enhanced-prompt-cache.service.js');
      const { SimpleSummarizationMonitor } = require('../dist/src/services/monitoring/simple-summarization-monitor.service.js');
      
      console.log('✅ Services can be imported');
    } catch (error) {
      console.error('❌ Service import failed:', error.message);
      process.exit(1);
    }

    console.log('\n🎉 Health check passed! System is ready for deployment.');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runHealthCheck();
}

module.exports = { runHealthCheck };
