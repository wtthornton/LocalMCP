#!/usr/bin/env node

/**
 * Test Runner for AI Summarization
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running AI Summarization Tests\n');

try {
  // Run unit tests
  console.log('📋 Running unit tests...');
  execSync('npm test -- test/services/ai/ test/services/cache/', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Run integration tests
  console.log('\n🔗 Running integration tests...');
  execSync('npm test -- test/integration/', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Run performance tests
  console.log('\n⚡ Running performance tests...');
  execSync('npm test -- test/performance/', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
}
