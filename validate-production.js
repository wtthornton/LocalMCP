/**
 * Production Validation Script
 * Step-by-step validation for deployment readiness
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting Production Readiness Validation...\n');

// Test 1: TypeScript Compilation
console.log('📋 Task 4.1.1: Testing TypeScript Compilation...');
try {
  execSync('npm run type-check', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation: PASSED\n');
} catch (error) {
  console.log('❌ TypeScript compilation: FAILED');
  console.log(error.message);
  process.exit(1);
}

// Test 2: Unit Tests
console.log('📋 Task 4.1.1: Testing Unit Tests...');
try {
  execSync('npm test -- --run src/tools/enhanced-context7-enhance.tool.test.ts --reporter=basic', { stdio: 'pipe' });
  console.log('✅ Unit tests: PASSED\n');
} catch (error) {
  console.log('❌ Unit tests: FAILED');
  console.log('Error:', error.message);
  process.exit(1);
}

// Test 3: File Structure
console.log('📋 Task 4.1.2: Testing File Structure...');
const requiredFiles = [
  'src/tools/enhanced-context7-enhance.tool.ts',
  'src/tools/enhance/prompt-analyzer.service.ts',
  'src/services/ai/openai.service.ts',
  'src/services/framework-detector/framework-detector.service.ts'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length === 0) {
  console.log('✅ File structure: PASSED\n');
} else {
  console.log('❌ File structure: FAILED - Missing files:', missingFiles.join(', '));
  process.exit(1);
}

// Test 4: Package Dependencies
console.log('📋 Task 4.1.3: Testing Dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['openai', 'vitest', 'typescript'];
  const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
  
  if (missingDeps.length === 0) {
    console.log('✅ Dependencies: PASSED\n');
  } else {
    console.log('❌ Dependencies: FAILED - Missing:', missingDeps.join(', '));
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Dependencies: FAILED - Error reading package.json');
  process.exit(1);
}

// Test 5: Environment Variables (Warning only)
console.log('📋 Task 4.2.1: Testing Environment Variables...');
const requiredEnvVars = ['OPENAI_API_KEY', 'CONTEXT7_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length === 0) {
  console.log('✅ Environment variables: PASSED\n');
} else {
  console.log('⚠️  Environment variables: WARNING - Missing:', missingEnvVars.join(', '));
  console.log('   (This is expected in test environment)\n');
}

// Summary
console.log('🎉 Production Readiness Validation Complete!');
console.log('📊 Summary:');
console.log('   ✅ TypeScript compilation: PASSED');
console.log('   ✅ Unit tests: PASSED');
console.log('   ✅ File structure: PASSED');
console.log('   ✅ Dependencies: PASSED');
console.log('   ⚠️  Environment variables: WARNING (expected)');
console.log('\n🚀 Core functionality is ready for production!');
console.log('📋 Next: Run comprehensive integration tests');
