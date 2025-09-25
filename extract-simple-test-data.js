#!/usr/bin/env node

/**
 * Extract Simple Test Data for HTML Report
 * Extracts the actual JSON response from Test 1 (Simple Question) for HTML report generation
 */

import fs from 'fs';
import { spawn } from 'child_process';

console.log('🔍 Extracting Simple Test Data for HTML Report...\n');

// Run the test and capture output
const testProcess = spawn('node', ['test/test-e2e-http.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let test1Json = null;

testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  // Look for Test 1 (Simple Question) JSON response
  const lines = text.split('\n');
  let foundTest1 = false;
  
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
      try {
        test1Json = JSON.parse(line.trim());
        console.log('✅ Test 1 JSON Response extracted successfully!');
        console.log(`   - Success: ${test1Json.success}`);
        console.log(`   - Frameworks: ${test1Json.frameworks_detected?.join(', ') || 'None'}`);
        console.log(`   - Context7 docs: ${test1Json.context_used?.context7_docs?.length || 0}`);
        console.log(`   - Code snippets: ${test1Json.context_used?.code_snippets?.length || 0}`);
        console.log(`   - Enhanced prompt length: ${test1Json.enhanced_prompt?.length || 0} chars`);
        
        // Save to file for HTML report generation
        const filename = `simple-test-data-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(test1Json, null, 2));
        console.log(`\n💾 Test data saved to: ${filename}`);
        break;
      } catch (e) {
        console.log(`⚠️  Could not parse Test 1 JSON: ${e.message}`);
      }
    }
    
    // Stop looking if we hit the next test
    if (foundTest1 && (line.includes('🧪 Testing:') || line.includes('Testing:')) && !line.includes('Simple Question')) {
      console.log('🛑 Reached next test, stopping search for Test 1');
      break;
    }
  }
});

testProcess.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Test completed successfully');
    
    if (!test1Json) {
      // Try to find JSON in the full output
      console.log('🔍 Searching full output for Test 1 JSON...');
      const lines = output.split('\n');
      let foundTest1 = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for Test 1 marker
        if (line.includes('🧪 Testing: Simple Question') || line.includes('Testing: Simple Question')) {
          foundTest1 = true;
          console.log('🎯 Found Test 1 marker in full output');
          continue;
        }
        
        // If we found Test 1, look for JSON response
        if (foundTest1 && line.trim().startsWith('{') && line.includes('enhanced_prompt')) {
          try {
            test1Json = JSON.parse(line.trim());
            console.log('✅ Test 1 JSON Response found in full output!');
            break;
          } catch (e) {
            console.log(`⚠️  Could not parse JSON line: ${e.message}`);
            console.log(`📝 Problematic line: ${line.substring(0, 100)}...`);
          }
        }
        
        // Stop looking if we hit the next test
        if (foundTest1 && (line.includes('🧪 Testing:') || line.includes('Testing:')) && !line.includes('Simple Question')) {
          break;
        }
      }
    }
    
    if (test1Json) {
      console.log('\n📊 Simple Test Summary:');
      console.log(`   - Success: ${test1Json.success}`);
      console.log(`   - Frameworks: ${test1Json.frameworks_detected?.join(', ') || 'None'}`);
      console.log(`   - Context7 docs count: ${test1Json.context_used?.context7_docs?.length || 0}`);
      console.log(`   - Code snippets count: ${test1Json.context_used?.code_snippets?.length || 0}`);
      console.log(`   - Enhanced prompt length: ${test1Json.enhanced_prompt?.length || 0} chars`);
      
      if (test1Json.context_used?.context7_docs?.length > 0) {
        console.log('\n📚 Context7 Documentation Preview:');
        console.log(test1Json.context_used.context7_docs[0].substring(0, 200) + '...');
      }
      
      // Save to file for HTML report generation
      const filename = `simple-test-data-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(test1Json, null, 2));
      console.log(`\n💾 Test data saved to: ${filename}`);
    } else {
      console.log('⚠️  No Test 1 JSON response found in full output');
      console.log('\n📝 Full output preview:');
      console.log(output.substring(0, 500) + '...');
    }
  } else {
    console.log(`\n❌ Test failed with code ${code}`);
  }
});
