#!/usr/bin/env node

/**
 * Test Enhanced Health Check
 * 
 * Tests the enhanced health check functionality
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Enhanced Health Check');
console.log('================================\n');

async function testHealthCheck() {
  console.log('🚀 Starting health check server...');
  
  const healthProcess = spawn('node', ['dist/health-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: '3001',
      CONTEXT7_API_KEY: 'test-key',
      OPENAI_API_KEY: 'test-openai-key'
    }
  });

  let output = '';
  let errorOutput = '';

  healthProcess.stdout.on('data', (data) => {
    output += data.toString();
    console.log('📝 Health server output:', data.toString().trim());
  });

  healthProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.log('⚠️ Health server error:', data.toString().trim());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    console.log('\n🔍 Testing health endpoint...');
    
    const response = await fetch('http://localhost:3001/health');
    const healthData = await response.json();
    
    console.log('\n📊 Health Check Results:');
    console.log('========================');
    console.log(`Status: ${healthData.status}`);
    console.log(`Timestamp: ${healthData.timestamp}`);
    console.log(`Uptime: ${healthData.uptime}ms`);
    
    console.log('\n🔧 Service Status:');
    Object.entries(healthData.services).forEach(([service, status]) => {
      console.log(`  ${service}: ${status.status}`);
      if (status.error) {
        console.log(`    Error: ${status.error}`);
      }
      if (status.responseTime) {
        console.log(`    Response Time: ${status.responseTime}ms`);
      }
    });
    
    console.log('\n🧪 Check Results:');
    Object.entries(healthData.checks).forEach(([check, result]) => {
      console.log(`  ${check}: ${result.status}`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      if (result.responseTime) {
        console.log(`    Response Time: ${result.responseTime}ms`);
      }
    });
    
    if (healthData.status === 'healthy') {
      console.log('\n✅ Health check PASSED!');
    } else {
      console.log('\n❌ Health check FAILED!');
    }
    
  } catch (error) {
    console.log('\n❌ Failed to test health endpoint:', error.message);
  } finally {
    console.log('\n🛑 Stopping health server...');
    healthProcess.kill();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testHealthCheck().catch(console.error);
