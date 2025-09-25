#!/usr/bin/env node

/**
 * Extract Full JSON for Test 1 (Simple Question)
 * Captures the complete JSON response from the test run
 */

import fs from 'fs';
import { spawn } from 'child_process';

console.log('🔍 Extracting Full JSON for Test 1 (Simple Question)...\n');

// Run the test and capture output
const testProcess = spawn('node', ['test/test-e2e-http.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let test1Json = null;
let foundTest1 = false;

testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for Test 1 marker
    if (line.includes('🧪 Testing: Simple Question') || line.includes('Testing: Simple Question')) {
      foundTest1 = true;
      console.log('🎯 Found Test 1 marker');
      continue;
    }
    
    // If we found Test 1, look for JSON response
    if (foundTest1 && line.trim().startsWith('{') && line.includes('enhanced_prompt')) {
      try {
        test1Json = JSON.parse(line.trim());
        console.log('✅ Test 1 JSON Response found and parsed!');
        break;
      } catch (e) {
        console.log(`⚠️  Could not parse JSON line: ${e.message}`);
        console.log(`📝 Problematic line preview: ${line.substring(0, 100)}...`);
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
    
    if (test1Json) {
      console.log('\n📊 Test 1 Full JSON Response:');
      console.log('=====================================');
      console.log(JSON.stringify(test1Json, null, 2));
      
      // Save to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `test1-full-json-${timestamp}.json`;
      fs.writeFileSync(filename, JSON.stringify(test1Json, null, 2));
      console.log(`\n💾 Full JSON saved to: ${filename}`);
      
      // Show summary
      console.log('\n📈 JSON Response Summary:');
      console.log(`   - Success: ${test1Json.success}`);
      console.log(`   - Enhanced prompt length: ${test1Json.enhanced_prompt?.length || 0} characters`);
      console.log(`   - Frameworks detected: ${test1Json.frameworks_detected?.join(', ') || 'None'}`);
      console.log(`   - Context7 docs count: ${test1Json.context_used?.context7_docs?.length || 0}`);
      console.log(`   - Code snippets count: ${test1Json.context_used?.code_snippets?.length || 0}`);
      console.log(`   - Repository facts count: ${test1Json.context_used?.repo_facts?.length || 0}`);
      
      if (test1Json.context_used?.context7_docs?.length > 0) {
        console.log('\n📚 Context7 Documentation:');
        test1Json.context_used.context7_docs.forEach((doc, index) => {
          console.log(`   Doc ${index + 1}: ${doc.substring(0, 200)}...`);
        });
      } else {
        console.log('\n📚 Context7 Documentation: None (expected for simple prompts)');
      }
      
      if (test1Json.context_used?.code_snippets?.length > 0) {
        console.log('\n💻 Code Snippets:');
        test1Json.context_used.code_snippets.forEach((snippet, index) => {
          console.log(`   Snippet ${index + 1}: ${snippet.file || 'Unknown file'}`);
          console.log(`     Content: ${snippet.content?.substring(0, 100)}...`);
          console.log(`     Relevance: ${snippet.relevance || 'Unknown'}`);
        });
      } else {
        console.log('\n💻 Code Snippets: None found');
      }
      
      console.log('\n📋 Repository Facts (first 5):');
      if (test1Json.context_used?.repo_facts?.length > 0) {
        test1Json.context_used.repo_facts.slice(0, 5).forEach((fact, index) => {
          console.log(`   ${index + 1}. ${fact}`);
        });
        if (test1Json.context_used.repo_facts.length > 5) {
          console.log(`   ... and ${test1Json.context_used.repo_facts.length - 5} more facts`);
        }
      } else {
        console.log('   No repository facts found');
      }
      
    } else {
      console.log('⚠️  No Test 1 JSON response found');
      console.log('\n🔍 Searching full output for any JSON...');
      
      // Try to find any JSON in the output
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('enhanced_prompt')) {
          try {
            const jsonData = JSON.parse(line.trim());
            console.log('✅ Found JSON response in full output!');
            console.log('📊 JSON Response:');
            console.log(JSON.stringify(jsonData, null, 2));
            
            // Save to file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `found-json-${timestamp}.json`;
            fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2));
            console.log(`\n💾 JSON saved to: ${filename}`);
            break;
          } catch (e) {
            console.log(`⚠️  Could not parse JSON: ${e.message}`);
          }
        }
      }
    }
  } else {
    console.log(`\n❌ Test failed with code ${code}`);
  }
});
