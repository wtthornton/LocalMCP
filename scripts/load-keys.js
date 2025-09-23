#!/usr/bin/env node

/**
 * Load OpenAI Keys Utility
 * 
 * Loads OpenAI API keys from the centralized configuration file
 * for use in tests and development scripts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keysPath = path.join(__dirname, '..', 'config', 'openai-keys.env');

/**
 * Load OpenAI keys from the centralized configuration file
 */
export function loadOpenAIKeys() {
  try {
    if (fs.existsSync(keysPath)) {
      const keysContent = fs.readFileSync(keysPath, 'utf8');
      
      // Parse the key-value pairs
      const keys = {};
      keysContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, value] = trimmedLine.split('=');
          if (key && value) {
            keys[key.trim()] = value.trim();
          }
        }
      });
      
      // Set environment variables
      Object.entries(keys).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
      
      console.log('✅ OpenAI keys loaded from config/openai-keys.env');
      return true;
    } else {
      console.warn('⚠️  config/openai-keys.env not found. Run "npm run setup:openai" to create it.');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to load OpenAI keys:', error.message);
    return false;
  }
}

/**
 * Check if OpenAI keys are available
 */
export function hasOpenAIKeys() {
  return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_PROJECT_ID);
}

/**
 * Get OpenAI configuration
 */
export function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    projectId: process.env.OPENAI_PROJECT_ID,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000'),
    retries: parseInt(process.env.OPENAI_RETRIES || '3')
  };
}

// Auto-load keys if this module is imported
if (import.meta.url === `file://${process.argv[1]}`) {
  // Running as a script
  loadOpenAIKeys();
  if (hasOpenAIKeys()) {
    console.log('🎉 OpenAI keys are ready!');
    console.log('Configuration:', getOpenAIConfig());
  } else {
    console.log('❌ OpenAI keys not found');
    process.exit(1);
  }
}
