#!/usr/bin/env node

/**
 * Extract JSON response from test output
 * This script will capture the actual JSON response from the latest test run
 */

import fs from 'fs';
import { spawn } from 'child_process';

console.log('🔍 Extracting JSON response from latest test run...\n');

// Run the test and capture output
const testProcess = spawn('node', ['test/test-e2e-http.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let jsonResponse = null;

testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Look for any JSON-like structure in the output
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('{') && line.includes('enhanced_prompt')) {
      try {
        jsonResponse = JSON.parse(line.trim());
        console.log('✅ Found JSON response!');
        console.log('📊 Response summary:');
        console.log(`   - Success: ${jsonResponse.success}`);
        console.log(`   - Frameworks detected: ${jsonResponse.frameworks_detected?.join(', ') || 'None'}`);
        console.log(`   - Context7 docs count: ${jsonResponse.context_used?.context7_docs?.length || 0}`);
        console.log(`   - Enhanced prompt length: ${jsonResponse.enhanced_prompt?.length || 0} chars`);
        
        // Save to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `test-response-${timestamp}.json`;
        fs.writeFileSync(filename, JSON.stringify(jsonResponse, null, 2));
        console.log(`\n💾 Full JSON response saved to: ${filename}`);
        break;
      } catch (e) {
        console.log(`⚠️  Could not parse JSON: ${e.message}`);
        console.log(`📝 Problematic line: ${line.substring(0, 100)}...`);
      }
    }
  }
});

testProcess.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Test completed successfully');
    if (!jsonResponse) {
      console.log('⚠️  No JSON response found in output');
      console.log('📝 Full raw output:');
      console.log('=====================================');
      console.log(output);
      console.log('=====================================');
      
      // Try to find JSON in the full output - extract only Test 1 (Simple Question)
      const lines = output.split('\n');
      let foundTest1 = false;
      let test1Json = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for Test 1 marker
        if (line.includes('🧪 Testing: Simple Question') || line.includes('Testing: Simple Question')) {
          foundTest1 = true;
          console.log('🎯 Found Test 1 (Simple Question)');
          continue;
        }
        
        // If we found Test 1, look for JSON response
        if (foundTest1 && line.trim().startsWith('{') && line.includes('enhanced_prompt')) {
          test1Json = line.trim();
          console.log('📊 Test 1 JSON Response found!');
          console.log(`   - Length: ${test1Json.length} characters`);
          
          try {
            const parsed = JSON.parse(test1Json);
            console.log(`   - Success: ${parsed.success}`);
            console.log(`   - Frameworks: ${parsed.frameworks_detected?.join(', ') || 'None'}`);
            console.log(`   - Context7 docs: ${parsed.context_used?.context7_docs?.length || 0}`);
            console.log(`   - Enhanced prompt: "${parsed.enhanced_prompt}"`);
            
            // Save to file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `test1-simple-question-${timestamp}.json`;
            fs.writeFileSync(filename, JSON.stringify(parsed, null, 2));
            console.log(`   💾 Saved to: ${filename}`);
          } catch (e) {
            console.log(`   ⚠️  Could not parse Test 1 JSON: ${e.message}`);
            console.log(`   📝 Raw JSON preview: ${test1Json.substring(0, 200)}...`);
          }
          break;
        }
        
        // Stop looking if we hit the next test
        if (foundTest1 && (line.includes('🧪 Testing:') || line.includes('Testing:')) && !line.includes('Simple Question')) {
          console.log('🛑 Reached next test, stopping search for Test 1');
          break;
        }
      }
      
      if (!foundTest1) {
        console.log('⚠️  Test 1 (Simple Question) not found in output');
      }
    }
  } else {
    console.log(`\n❌ Test failed with code ${code}`);
    console.log('📝 Error output:');
    console.log(output);
  }
});
