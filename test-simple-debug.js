#!/usr/bin/env node

console.log('🔬 Starting simple debug test...');

try {
  console.log('✅ Node.js is working');
  
  // Test basic import
  console.log('📦 Testing imports...');
  const { EnhancedContext7EnhanceTool } = await import('./dist/tools/enhanced-context7-enhance.tool.js');
  console.log('✅ EnhancedContext7EnhanceTool imported');
  
  const { Logger } = await import('./dist/services/logger/logger.js');
  console.log('✅ Logger imported');
  
  const { ConfigService } = await import('./dist/config/config.service.js');
  console.log('✅ ConfigService imported');
  
  console.log('🎉 All imports successful!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
