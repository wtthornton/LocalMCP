#!/usr/bin/env node

/**
 * Cursor Setup Script for LocalMCP
 * 
 * Automatically configures Cursor to use LocalMCP with optimal settings.
 * Supports both local and Docker deployments.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  localmcpPath: process.cwd(),
  cursorConfigPaths: {
    windows: join(process.env.APPDATA, 'Cursor', 'User', 'globalStorage', 'cursor.mcp'),
    macos: join(process.env.HOME, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'cursor.mcp'),
    linux: join(process.env.HOME, '.config', 'Cursor', 'User', 'globalStorage', 'cursor.mcp')
  }
};

// Get OS-specific Cursor config path
function getCursorConfigPath() {
  const os = process.platform;
  let basePath;
  
  if (os === 'win32') {
    basePath = CONFIG.cursorConfigPaths.windows;
  } else if (os === 'darwin') {
    basePath = CONFIG.cursorConfigPaths.macos;
  } else {
    basePath = CONFIG.cursorConfigPaths.linux;
  }
  
  return join(basePath, 'mcp_servers.json');
}

// Check if Cursor is installed
function checkCursorInstallation() {
  try {
    const cursorPath = process.platform === 'win32' 
      ? 'cursor.cmd' 
      : 'cursor';
    execSync(`${cursorPath} --version`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Create MCP configuration
function createMCPConfig(useDocker = false) {
  const config = {
    mcpServers: {}
  };

  if (useDocker) {
    config.mcpServers.localmcp = {
      command: 'docker',
      args: [
        'run',
        '--rm',
        '-i',
        'localmcp:latest'
      ],
      env: {
        NODE_ENV: 'production',
        CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || 'your_key_here',
        CONTEXT7_USE_HTTP_ONLY: 'true',
        LOG_LEVEL: 'info'
      },
      stdio: true,
      description: 'LocalMCP Docker - 4 simple tools: analyze, create, fix, learn'
    };
  } else {
    config.mcpServers.localmcp = {
      command: 'node',
      args: [join(CONFIG.localmcpPath, 'dist', 'server.js')],
      env: {
        NODE_ENV: 'production',
        CONTEXT7_API_KEY: process.env.CONTEXT7_API_KEY || 'your_key_here',
        CONTEXT7_USE_HTTP_ONLY: 'true',
        LOG_LEVEL: 'info'
      },
      stdio: true,
      description: 'LocalMCP - 4 simple tools: analyze, create, fix, learn'
    };
  }

  return config;
}

// Write MCP configuration
function writeMCPConfig(config, configPath) {
  try {
    // Ensure directory exists
    mkdirSync(dirname(configPath), { recursive: true });
    
    // Write configuration
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ MCP configuration written to: ${configPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to write MCP configuration: ${error.message}`);
    return false;
  }
}

// Test LocalMCP server
function testLocalMCPServer() {
  try {
    console.log('🧪 Testing LocalMCP server...');
    
    // Check if dist/server.js exists
    const serverPath = join(CONFIG.localmcpPath, 'dist', 'server.js');
    if (!existsSync(serverPath)) {
      console.log('📦 Building LocalMCP...');
      execSync('npm run build', { stdio: 'inherit', cwd: CONFIG.localmcpPath });
    }
    
    console.log('✅ LocalMCP server is ready');
    return true;
  } catch (error) {
    console.error(`❌ LocalMCP server test failed: ${error.message}`);
    return false;
  }
}

// Test Docker setup
function testDockerSetup() {
  try {
    console.log('🐳 Testing Docker setup...');
    
    // Check if Docker is available
    execSync('docker --version', { stdio: 'ignore' });
    
    // Check if LocalMCP image exists
    try {
      execSync('docker image inspect localmcp:latest', { stdio: 'ignore' });
      console.log('✅ LocalMCP Docker image found');
    } catch (error) {
      console.log('📦 Building LocalMCP Docker image...');
      execSync('docker build -t localmcp:latest .', { stdio: 'inherit', cwd: CONFIG.localmcpPath });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Docker setup failed: ${error.message}`);
    return false;
  }
}

// Main setup function
function setupCursor(useDocker = false) {
  console.log('🚀 Setting up Cursor with LocalMCP...');
  console.log(`📁 LocalMCP path: ${CONFIG.localmcpPath}`);
  
  // Check Cursor installation
  if (!checkCursorInstallation()) {
    console.error('❌ Cursor is not installed or not in PATH');
    console.log('📥 Please install Cursor from: https://cursor.sh/');
    process.exit(1);
  }
  
  console.log('✅ Cursor installation found');
  
  // Test LocalMCP setup
  if (useDocker) {
    if (!testDockerSetup()) {
      console.error('❌ Docker setup failed');
      process.exit(1);
    }
  } else {
    if (!testLocalMCPServer()) {
      console.error('❌ LocalMCP server setup failed');
      process.exit(1);
    }
  }
  
  // Create MCP configuration
  const config = createMCPConfig(useDocker);
  const configPath = getCursorConfigPath();
  
  console.log(`📝 Writing MCP configuration to: ${configPath}`);
  
  if (!writeMCPConfig(config, configPath)) {
    console.error('❌ Failed to write MCP configuration');
    process.exit(1);
  }
  
  console.log('\n🎉 Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Restart Cursor completely');
  console.log('2. Check MCP status in Cursor settings (Settings > MCP Servers)');
  console.log('3. Look for "localmcp" in available tools');
  console.log('4. Test with: @localmcp.analyze Analyze my project');
  
  if (useDocker) {
    console.log('\n🐳 Docker commands:');
    console.log('• Start: docker-compose up -d');
    console.log('• Stop: docker-compose down');
    console.log('• Logs: docker-compose logs -f localmcp');
  } else {
    console.log('\n💻 Local development:');
    console.log('• Start: npm run dev');
    console.log('• Build: npm run build');
    console.log('• Test: npm run test:localmcp');
  }
  
  console.log('\n📚 Documentation:');
  console.log('• README: https://github.com/wtthornton/LocalMCP');
  console.log('• API Reference: ./API.md');
  console.log('• Development Guide: ./DEVELOPMENT.md');
}

// Parse command line arguments
const args = process.argv.slice(2);
const useDocker = args.includes('--docker');

// Run setup
setupCursor(useDocker);