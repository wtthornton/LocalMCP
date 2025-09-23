/**
 * Test Breakdown Integration with Environment Variables
 * 
 * Sets OpenAI environment variables and tests the complete breakdown integration
 */

// Load OpenAI keys from centralized configuration
import { loadOpenAIKeys } from '../scripts/load-keys.js';
loadOpenAIKeys();

// Now import and run the test
import('./test-breakdown-integration.js').then(() => {
  console.log('✅ Test completed');
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
