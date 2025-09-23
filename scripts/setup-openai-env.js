#!/usr/bin/env node

/**
 * OpenAI Environment Setup Script
 * 
 * Helps users configure their OpenAI API key and project ID
 * for PromptMCP integration.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'config', 'env.example');
const keysPath = path.join(process.cwd(), 'config', 'openai-keys.env');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupOpenAI() {
  console.log('🔧 OpenAI Environment Setup for PromptMCP\n');
  
  // Check if .env already exists
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env file');
  } else {
    // Copy from example if .env doesn't exist
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
      console.log('📋 Created .env from config/env.example');
    } else {
      console.log('❌ config/env.example not found. Please ensure it exists.');
      process.exit(1);
    }
  }

  // Get OpenAI API Key
  const apiKey = await question('Enter your OpenAI API Key: ');
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ OpenAI API Key is required');
    process.exit(1);
  }

  // Get OpenAI Project ID
  const projectId = await question('Enter your OpenAI Project ID (optional): ');
  
  // Get model preference
  const model = await question('Enter OpenAI model (default: gpt-4): ') || 'gpt-4';
  
  // Get max tokens
  const maxTokens = await question('Enter max tokens (default: 4000): ') || '4000';
  
  // Get temperature
  const temperature = await question('Enter temperature (default: 0.3): ') || '0.3';

  // Update env content
  const updates = {
    'OPENAI_API_KEY=your_openai_api_key_here': `OPENAI_API_KEY=${apiKey.trim()}`,
    'OPENAI_PROJECT_ID=your_openai_project_id_here': projectId.trim() ? `OPENAI_PROJECT_ID=${projectId.trim()}` : '# OPENAI_PROJECT_ID=your_openai_project_id_here',
    'OPENAI_MODEL=gpt-4': `OPENAI_MODEL=${model.trim()}`,
    'OPENAI_MAX_TOKENS=4000': `OPENAI_MAX_TOKENS=${maxTokens.trim()}`,
    'OPENAI_TEMPERATURE=0.3': `OPENAI_TEMPERATURE=${temperature.trim()}`
  };

  // Apply updates
  let updatedContent = envContent;
  for (const [old, new_] of Object.entries(updates)) {
    updatedContent = updatedContent.replace(old, new_);
  }

  // Write updated .env file
  fs.writeFileSync(envPath, updatedContent);
  
  // Also save to centralized keys file for development
  const keysContent = `# OpenAI Configuration - Centralized Keys
# This file contains the actual API keys for development/testing
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Your OpenAI API Key
OPENAI_API_KEY=${apiKey.trim()}

# Your OpenAI Project ID
OPENAI_PROJECT_ID=${projectId.trim()}

# OpenAI Configuration
OPENAI_MODEL=${model.trim()}
OPENAI_MAX_TOKENS=${maxTokens.trim()}
OPENAI_TEMPERATURE=${temperature.trim()}
OPENAI_TIMEOUT=60000
OPENAI_RETRIES=3`;

  fs.writeFileSync(keysPath, keysContent);
  
  console.log('\n✅ OpenAI configuration saved to:');
  console.log(`   - .env file (for production)`);
  console.log(`   - config/openai-keys.env (for development/testing)`);
  console.log('\n📋 Configuration Summary:');
  console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`   Project ID: ${projectId.trim() || 'Not set'}`);
  console.log(`   Model: ${model}`);
  console.log(`   Max Tokens: ${maxTokens}`);
  console.log(`   Temperature: ${temperature}`);
  
  console.log('\n🚀 You can now start PromptMCP with OpenAI integration!');
  console.log('   Run: npm start or docker-compose up');
  
  rl.close();
}

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 Setup cancelled');
  rl.close();
  process.exit(0);
});

// Run setup
setupOpenAI().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
