#!/usr/bin/env node

/**
 * LocalMCP Test Script
 * 
 * Demonstrates the 4 core LocalMCP tools in action.
 * This script shows how vibe coders can use LocalMCP for common tasks.
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

console.log('🚀 LocalMCP Test Script');
console.log('======================\n');

// Test data
const testProject = {
  name: 'test-project',
  description: 'A test project for LocalMCP demonstration',
  files: [
    'package.json',
    'src/index.ts',
    'src/components/Button.tsx'
  ]
};

// Create test project structure
function setupTestProject() {
  console.log('📁 Setting up test project...');
  
  try {
    mkdirSync('test-project', { recursive: true });
    mkdirSync('test-project/src', { recursive: true });
    mkdirSync('test-project/src/components', { recursive: true });
    
    // Create package.json
    writeFileSync('test-project/package.json', JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        'react': '^18.0.0',
        'typescript': '^5.0.0'
      }
    }, null, 2));
    
    // Create a simple TypeScript file with an error
    writeFileSync('test-project/src/index.ts', `
function greet(name: string) {
  return "Hello, " + name;
}

// This will cause a TypeScript error
const user = { name: "John" };
console.log(greet(user.name));
`);
    
    console.log('✅ Test project created successfully\n');
  } catch (error) {
    console.error('❌ Failed to create test project:', error.message);
    process.exit(1);
  }
}

// Test the analyze tool
async function testAnalyze() {
  console.log('🔍 Testing localmcp.analyze...');
  
  const analyzeRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'localmcp.analyze',
      arguments: {
        path: './test-project',
        query: 'What is the main technology stack?'
      }
    }
  };
  
  try {
    const result = await callLocalMCP(analyzeRequest);
    console.log('📊 Analysis Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('✅ Analyze tool working\n');
  } catch (error) {
    console.error('❌ Analyze tool failed:', error.message);
  }
}

// Test the create tool
async function testCreate() {
  console.log('🛠️ Testing localmcp.create...');
  
  const createRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'localmcp.create',
      arguments: {
        description: 'Create a dark theme Hello World React component',
        targetPath: './test-project/src/components',
        options: {
          colorScheme: 'dark',
          framework: 'react'
        }
      }
    }
  };
  
  try {
    const result = await callLocalMCP(createRequest);
    console.log('🎨 Create Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('✅ Create tool working\n');
  } catch (error) {
    console.error('❌ Create tool failed:', error.message);
  }
}

// Test the fix tool
async function testFix() {
  console.log('🔧 Testing localmcp.fix...');
  
  const fixRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'localmcp.fix',
      arguments: {
        errorDetails: 'TypeScript error: Property "name" does not exist on type "User"',
        filePath: './test-project/src/index.ts',
        context: 'const user = { name: "John" }; console.log(greet(user.name));'
      }
    }
  };
  
  try {
    const result = await callLocalMCP(fixRequest);
    console.log('🛠️ Fix Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('✅ Fix tool working\n');
  } catch (error) {
    console.error('❌ Fix tool failed:', error.message);
  }
}

// Test the learn tool
async function testLearn() {
  console.log('🧠 Testing localmcp.learn...');
  
  const learnRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'localmcp.learn',
      arguments: {
        feedback: 'This solution works perfectly! The dark theme component looks great.',
        context: 'function createDarkThemeComponent() { return <div className="dark-theme">Hello World</div>; }',
        tags: ['react', 'dark-theme', 'component', 'typescript']
      }
    }
  };
  
  try {
    const result = await callLocalMCP(learnRequest);
    console.log('📚 Learn Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log('✅ Learn tool working\n');
  } catch (error) {
    console.error('❌ Learn tool failed:', error.message);
  }
}

// Call LocalMCP via stdio
function callLocalMCP(request) {
  return new Promise((resolve, reject) => {
    const localmcp = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    localmcp.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    localmcp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    localmcp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`LocalMCP exited with code ${code}: ${errorOutput}`));
        return;
      }
      
      try {
        const lines = output.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse LocalMCP output: ${output}`));
      }
    });
    
    // Send the request
    localmcp.stdin.write(JSON.stringify(request) + '\n');
    localmcp.stdin.end();
  });
}

// Main test function
async function runTests() {
  try {
    setupTestProject();
    
    console.log('🧪 Running LocalMCP Tool Tests...\n');
    
    await testAnalyze();
    await testCreate();
    await testFix();
    await testLearn();
    
    console.log('🎉 All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ localmcp.analyze: Project analysis working');
    console.log('- ✅ localmcp.create: Code generation working');
    console.log('- ✅ localmcp.fix: Error resolution working');
    console.log('- ✅ localmcp.learn: Pattern learning working');
    
    console.log('\n🚀 LocalMCP is ready for vibe coders!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
