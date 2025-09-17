#!/usr/bin/env node

/**
 * Simple Security Services Test Suite (CommonJS version)
 * 
 * This script tests the simplified security services implementation
 * using CommonJS imports to work with the compiled TypeScript output.
 */

const { 
  InputValidationService, 
  AuthenticationService, 
  SecureConfigService, 
  EncryptionService 
} = require('../dist/services/security/index.js');

console.log('🔒 Testing Simplified Security Services\n');

async function runSimpleSecurityTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Input Validation Service
    console.log('Test 1: Input Validation Service');
    const inputValidator = new InputValidationService();
    
    // Test tool request validation
    const toolRequest = { toolName: 'localmcp.create', request: { description: 'Create a simple component' } };
    const validationResult = inputValidator.validateToolRequest(toolRequest);
    
    if (validationResult.valid) {
      console.log('✅ Tool request validation working');
      testsPassed++;
    } else {
      console.log('❌ Tool request validation failed:', validationResult.error);
      testsFailed++;
    }

    // Test file path validation
    const filePathResult = inputValidator.validateFilePath('/src/components/Test.tsx');
    if (filePathResult.valid) {
      console.log('✅ File path validation working');
      testsPassed++;
    } else {
      console.log('❌ File path validation failed:', filePathResult.error);
      testsFailed++;
    }

    // Test malicious input detection
    const maliciousResult = inputValidator.validateFilePath('../../../etc/passwd');
    if (!maliciousResult.valid && maliciousResult.error?.includes('traversal')) {
      console.log('✅ Path traversal detection working');
      testsPassed++;
    } else {
      console.log('❌ Path traversal detection failed');
      testsFailed++;
    }

    // Test 2: Authentication Service
    console.log('\nTest 2: Authentication Service');
    const authService = new AuthenticationService();
    
    // Test token generation
    const token = authService.generateToken('developer');
    if (token && typeof token === 'string') {
      console.log('✅ Token generation working');
      testsPassed++;
    } else {
      console.log('❌ Token generation failed');
      testsFailed++;
    }

    // Test token authentication
    const authResult = authService.authenticate(token);
    if (authResult.authenticated && authResult.user) {
      console.log('✅ Token authentication working');
      testsPassed++;
    } else {
      console.log('❌ Token authentication failed:', authResult.error);
      testsFailed++;
    }

    // Test invalid token
    const invalidAuthResult = authService.authenticate('invalid-token');
    if (!invalidAuthResult.authenticated) {
      console.log('✅ Invalid token rejection working');
      testsPassed++;
    } else {
      console.log('❌ Invalid token rejection failed');
      testsFailed++;
    }

    // Test permission checking
    const user = authResult.user;
    if (user && authService.canAccessTool(user, 'localmcp.create')) {
      console.log('✅ Tool access permission working');
      testsPassed++;
    } else {
      console.log('❌ Tool access permission failed');
      testsFailed++;
    }

    // Test 3: Secure Configuration Service
    console.log('\nTest 3: Secure Configuration Service');
    const configService = new SecureConfigService('./test-config');
    
    // Test setting and getting configuration
    const setResult = await configService.set('test_key', 'test_value');
    if (setResult.success) {
      console.log('✅ Configuration setting working');
      testsPassed++;
    } else {
      console.log('❌ Configuration setting failed:', setResult.error);
      testsFailed++;
    }

    const getResult = await configService.get('test_key');
    if (getResult.success && getResult.value === 'test_value') {
      console.log('✅ Configuration getting working');
      testsPassed++;
    } else {
      console.log('❌ Configuration getting failed:', getResult.error);
      testsFailed++;
    }

    // Test encrypted configuration
    const encryptedSetResult = await configService.set('secret_key', 'secret_value', { encrypt: true });
    if (encryptedSetResult.success) {
      console.log('✅ Encrypted configuration setting working');
      testsPassed++;
    } else {
      console.log('❌ Encrypted configuration setting failed:', encryptedSetResult.error);
      testsFailed++;
    }

    const encryptedGetResult = await configService.get('secret_key');
    if (encryptedGetResult.success && encryptedGetResult.value === 'secret_value') {
      console.log('✅ Encrypted configuration getting working');
      testsPassed++;
    } else {
      console.log('❌ Encrypted configuration getting failed:', encryptedGetResult.error);
      testsFailed++;
    }

    // Test 4: Encryption Service
    console.log('\nTest 4: Encryption Service');
    const encryptionService = new EncryptionService();
    
    // Test key generation
    const key = encryptionService.generateKey();
    if (key && key.length === 64) { // 32 bytes = 64 hex chars
      console.log('✅ Encryption key generation working');
      testsPassed++;
    } else {
      console.log('❌ Encryption key generation failed');
      testsFailed++;
    }

    // Test encryption and decryption
    const testData = 'This is sensitive data that needs encryption';
    const encryptResult = encryptionService.encrypt(testData, key);
    
    if (encryptResult.success && encryptResult.data) {
      console.log('✅ Data encryption working');
      testsPassed++;
    } else {
      console.log('❌ Data encryption failed:', encryptResult.error);
      testsFailed++;
    }

    const decryptResult = encryptionService.decrypt(encryptResult.data, key);
    if (decryptResult.success && decryptResult.data === testData) {
      console.log('✅ Data decryption working');
      testsPassed++;
    } else {
      console.log('❌ Data decryption failed:', decryptResult.error);
      testsFailed++;
    }

    // Test hashing
    const hashResult = encryptionService.hash('test data');
    if (hashResult.success && hashResult.data && hashResult.data.length === 64) { // SHA256 = 64 hex chars
      console.log('✅ Data hashing working');
      testsPassed++;
    } else {
      console.log('❌ Data hashing failed:', hashResult.error);
      testsFailed++;
    }

    // Test HMAC
    const hmacResult = encryptionService.createHmac('test data', 'secret key');
    if (hmacResult.success && hmacResult.data && hmacResult.data.length === 64) {
      console.log('✅ HMAC creation working');
      testsPassed++;
    } else {
      console.log('❌ HMAC creation failed:', hmacResult.error);
      testsFailed++;
    }

    const hmacVerify = encryptionService.verifyHmac('test data', 'secret key', hmacResult.data);
    if (hmacVerify) {
      console.log('✅ HMAC verification working');
      testsPassed++;
    } else {
      console.log('❌ HMAC verification failed');
      testsFailed++;
    }

    // Cleanup test configuration
    try {
      await configService.delete('test_key');
      await configService.delete('secret_key');
    } catch (error) {
      // Ignore cleanup errors
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    testsFailed++;
  }

  // Test Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('🔒 Simplified Security Services Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Simplified security services are working correctly.');
    return true;
  } else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Review the implementation.`);
    return false;
  }
}

// Run the tests
runSimpleSecurityTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
