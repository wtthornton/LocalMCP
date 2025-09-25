#!/usr/bin/env node

/**
 * Test OpenAI API directly to verify the API key works
 */

const { spawn } = require('child_process');

console.log('🧪 Testing OpenAI API directly...\n');

const testOpenAIDirect = () => {
  return new Promise((resolve) => {
    console.log('📤 Testing OpenAI API with direct call...');
    
    const testScript = `
const OpenAI = require('openai');

async function testOpenAI() {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      project: process.env.OPENAI_PROJECT_ID
    });

    console.log('Testing OpenAI connection...');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    console.log('Project ID:', process.env.OPENAI_PROJECT_ID || 'not set');

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'user', content: 'Hello, this is a test message. Please respond with "API connection successful".' }
      ],
      max_tokens: 50
    });

    console.log('✅ OpenAI API Response:', response.choices[0]?.message?.content);
    console.log('✅ Usage:', response.usage);
    console.log('✅ API connection successful!');
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    console.error('❌ Error details:', {
      status: error.status,
      code: error.code,
      type: error.type
    });
  }
}

testOpenAI();
`;

    const nodeProcess = spawn('docker', [
      'exec', '-i', 'promptmcp-server',
      'sh', '-c', `node -e "${testScript.replace(/"/g, '\\"')}"`
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    nodeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    nodeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    nodeProcess.on('close', (code) => {
      console.log('📥 OpenAI Direct Test Results:');
      console.log(output);
      
      if (errorOutput) {
        console.log('📥 Errors:');
        console.log(errorOutput);
      }
      
      resolve({ output, errorOutput, code });
    });
  });
};

// Run the test
async function runTest() {
  try {
    const result = await testOpenAIDirect();
    
    console.log('\n📊 OPENAI DIRECT TEST RESULTS');
    console.log('=====================================');
    
    const hasSuccess = result.output.includes('API connection successful');
    const hasError = result.output.includes('OpenAI API Error') || result.errorOutput.includes('Error');
    
    if (hasSuccess) {
      console.log('✅ SUCCESS: OpenAI API key is valid and working!');
    } else if (hasError) {
      console.log('❌ FAILED: OpenAI API key has issues');
      
      if (result.output.includes('401')) {
        console.log('🔍 Issue: 401 Unauthorized - API key is invalid or expired');
      } else if (result.output.includes('429')) {
        console.log('🔍 Issue: 429 Rate Limited - API quota exceeded');
      } else if (result.output.includes('403')) {
        console.log('🔍 Issue: 403 Forbidden - API key lacks permissions');
      }
    } else {
      console.log('⚠️  UNKNOWN: Could not determine API status');
    }
    
    console.log('\n🔚 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
