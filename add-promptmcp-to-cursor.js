#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const settingsPath = 'C:\\Users\\tappt\\AppData\\Roaming\\Cursor\\User\\settings.json';

try {
  // Read current settings
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  
  // Add promptmcp server
  settings['mcp.servers']['promptmcp'] = {
    command: 'docker',
    args: ['run', '--rm', '-i', 'promptmcp-mcp'],
    env: {},
    stdio: true,
    description: 'PromptMCP - Enhanced prompt generation with project context'
  };
  
  // Write back to file
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  
  console.log('✅ Successfully added promptmcp to Cursor settings');
  console.log('📄 Settings file: ' + settingsPath);
  console.log('🔄 Please restart Cursor to see the new MCP server');
  
} catch (error) {
  console.error('❌ Error updating Cursor settings:', error.message);
  process.exit(1);
}
