#!/usr/bin/env node

/**
 * Context7 Setup Script
 * 
 * Helps users set up their Context7 API key for LocalMCP.
 * This enables the enhanced documentation caching features.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupContext7() {
  console.log('🔑 Context7 API Key Setup');
  console.log('========================\n');
  
  console.log('Context7 provides enhanced documentation caching for LocalMCP.');
  console.log('This enables faster AI assistance with up-to-date framework docs.\n');
  
  console.log('To get your Context7 API key:');
  console.log('1. Visit: https://context7.io');
  console.log('2. Sign up for an account');
  console.log('3. Get your API key from the dashboard\n');
  
  const apiKey = await question('Enter your Context7 API key (or press Enter to skip): ');
  
  if (!apiKey.trim()) {
    console.log('\n⚠️  Skipping Context7 setup. You can add it later by editing .env file.');
    console.log('LocalMCP will work without Context7, but with limited documentation caching.\n');
    rl.close();
    return;
  }
  
  // Validate API key format (basic check)
  if (apiKey.length < 10) {
    console.log('\n❌ Invalid API key format. Please check your key and try again.');
    rl.close();
    return;
  }
  
  // Update .env file
  const envPath = '.env';
  let envContent = '';
  
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8');
  } else {
    // Create from example
    envContent = readFileSync('env.example', 'utf-8');
  }
  
  // Update or add Context7 configuration
  const lines = envContent.split('\n');
  let updated = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('CONTEXT7_ENABLED=')) {
      lines[i] = 'CONTEXT7_ENABLED=true';
      updated = true;
    } else if (lines[i].startsWith('CONTEXT7_API_KEY=')) {
      lines[i] = `CONTEXT7_API_KEY=${apiKey}`;
      updated = true;
    }
  }
  
  if (!updated) {
    // Add Context7 configuration
    lines.push('');
    lines.push('# Context7 Integration');
    lines.push('CONTEXT7_ENABLED=true');
    lines.push(`CONTEXT7_API_KEY=${apiKey}`);
  }
  
  writeFileSync(envPath, lines.join('\n'));
  
  console.log('\n✅ Context7 API key configured successfully!');
  console.log('📁 Updated .env file with your API key');
  console.log('🚀 LocalMCP will now use Context7 for enhanced documentation caching\n');
  
  console.log('Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npm start');
  console.log('3. Test with: node scripts/test-localmcp.js\n');
  
  rl.close();
}

// Run setup
setupContext7().catch(console.error);
