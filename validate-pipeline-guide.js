/**
 * Pipeline Guide Validation Script
 * 
 * Validates the pipeline guide HTML structure and content
 */

import fs from 'fs';
import path from 'path';

const pipelineGuidePath = 'docs/comprehensive-guide/pipeline-guide.html';
const cssPath = 'docs/comprehensive-guide/styles/interactive.css';

console.log('🔍 Validating Pipeline Guide...\n');

// Check if files exist
if (!fs.existsSync(pipelineGuidePath)) {
  console.error('❌ Pipeline guide HTML file not found:', pipelineGuidePath);
  process.exit(1);
}

if (!fs.existsSync(cssPath)) {
  console.error('❌ CSS file not found:', cssPath);
  process.exit(1);
}

// Read and validate HTML content
const htmlContent = fs.readFileSync(pipelineGuidePath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

console.log('✅ Files found and readable');

// Validate HTML structure
const validations = [
  {
    name: 'HTML Structure',
    test: () => htmlContent.includes('<!DOCTYPE html>') && htmlContent.includes('<html lang="en">'),
    message: 'Valid HTML5 structure'
  },
  {
    name: 'Pipeline Overview Section',
    test: () => htmlContent.includes('Pipeline Overview: The Big Picture'),
    message: 'Pipeline overview section present'
  },
  {
    name: 'LLM Interaction Section',
    test: () => htmlContent.includes('How the Pipeline Interacts with the LLM'),
    message: 'LLM interaction explanation present'
  },
  {
    name: 'Stage Breakdown',
    test: () => {
      const stageCount = (htmlContent.match(/class="stage-card"/g) || []).length;
      return stageCount >= 11;
    },
    message: 'All 11 pipeline stages documented'
  },
  {
    name: 'Data Flow Diagram',
    test: () => htmlContent.includes('Data Flow: How Information Moves Through the Pipeline'),
    message: 'Data flow diagram present'
  },
  {
    name: 'Benefits Section',
    test: () => htmlContent.includes('Pipeline Benefits: Why This Matters'),
    message: 'Benefits section present'
  },
  {
    name: 'Performance Metrics',
    test: () => htmlContent.includes('Pipeline Performance & Optimization'),
    message: 'Performance section present'
  },
  {
    name: 'Troubleshooting Section',
    test: () => htmlContent.includes('Troubleshooting Pipeline Issues'),
    message: 'Troubleshooting section present'
  },
  {
    name: 'CSS Styling',
    test: () => cssContent.includes('.pipeline-overview') && cssContent.includes('.stage-card'),
    message: 'Pipeline-specific CSS styles present'
  },
  {
    name: 'Responsive Design',
    test: () => cssContent.includes('grid-template-columns: repeat(auto-fit, minmax('),
    message: 'Responsive grid layouts present'
  },
  {
    name: 'Interactive Elements',
    test: () => cssContent.includes('transition: all 0.3s ease') && cssContent.includes(':hover'),
    message: 'Interactive hover effects present'
  },
  {
    name: 'Color Coding',
    test: () => cssContent.includes('.stage-input') && cssContent.includes('.stage-context'),
    message: 'Stage color coding present'
  }
];

let passed = 0;
let total = validations.length;

console.log('\n📋 Running Validations:\n');

validations.forEach((validation, index) => {
  const result = validation.test();
  const status = result ? '✅' : '❌';
  const statusText = result ? 'PASS' : 'FAIL';
  
  console.log(`${index + 1}. ${status} ${validation.name}: ${statusText}`);
  if (result) {
    console.log(`   ${validation.message}`);
    passed++;
  }
  console.log('');
});

// Additional content checks
console.log('🔍 Content Quality Checks:\n');

const contentChecks = [
  {
    name: 'Stage 1 - Retrieve.AgentsMD',
    test: () => htmlContent.includes('Retrieve.AgentsMD') && htmlContent.includes('AGENTS.md'),
    message: 'Stage 1 properly documented'
  },
  {
    name: 'Stage 2 - Detect.RepoFacts',
    test: () => htmlContent.includes('Detect.RepoFacts') && htmlContent.includes('projectType'),
    message: 'Stage 2 with project detection documented'
  },
  {
    name: 'Stage 3 - Retrieve.Context7',
    test: () => htmlContent.includes('Retrieve.Context7') && htmlContent.includes('cached'),
    message: 'Stage 3 with caching documented'
  },
  {
    name: 'Stage 4 - Retrieve.RAG',
    test: () => htmlContent.includes('Retrieve.RAG') && htmlContent.includes('vector database'),
    message: 'Stage 4 with RAG documented'
  },
  {
    name: 'Stage 5 - Read.Snippet',
    test: () => htmlContent.includes('Read.Snippet') && htmlContent.includes('code snippets'),
    message: 'Stage 5 with code analysis documented'
  },
  {
    name: 'Stage 6 - Reason.Plan',
    test: () => htmlContent.includes('Reason.Plan') && htmlContent.includes('execution plan'),
    message: 'Stage 6 with planning documented'
  },
  {
    name: 'Stage 7 - Edit',
    test: () => htmlContent.includes('Edit') && htmlContent.includes('code generation'),
    message: 'Stage 7 with code generation documented'
  },
  {
    name: 'Stage 8 - Validate',
    test: () => htmlContent.includes('Validate') && htmlContent.includes('Quality Assurance'),
    message: 'Stage 8 with validation documented'
  },
  {
    name: 'Stage 9 - Gate',
    test: () => htmlContent.includes('Gate') && htmlContent.includes('Policy Enforcement'),
    message: 'Stage 9 with policy enforcement documented'
  },
  {
    name: 'Stage 10 - Document',
    test: () => htmlContent.includes('Document') && htmlContent.includes('documentation'),
    message: 'Stage 10 with documentation documented'
  },
  {
    name: 'Stage 11 - Learn',
    test: () => htmlContent.includes('Learn') && htmlContent.includes('Adaptive Learning'),
    message: 'Stage 11 with learning documented'
  }
];

contentChecks.forEach((check, index) => {
  const result = check.test();
  const status = result ? '✅' : '❌';
  const statusText = result ? 'PASS' : 'FAIL';
  
  console.log(`${index + 1}. ${status} ${check.name}: ${statusText}`);
  if (result) {
    console.log(`   ${check.message}`);
  } else {
    console.log(`   ⚠️  Missing or incomplete content`);
  }
  console.log('');
});

// Summary
console.log('📊 Validation Summary:\n');
console.log(`✅ Passed: ${passed}/${total} validations`);
console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);

if (passed === total) {
  console.log('\n🎉 All validations passed! The pipeline guide is ready for review.');
  console.log('\n🌐 To view the guide:');
  console.log('   1. Start a local server: npx http-server -p 8080');
  console.log('   2. Open: http://localhost:8080/pipeline-guide.html');
} else {
  console.log('\n⚠️  Some validations failed. Please review the issues above.');
}

// File size check
const htmlSize = fs.statSync(pipelineGuidePath).size;
const cssSize = fs.statSync(cssPath).size;

console.log('\n📁 File Information:');
console.log(`   HTML file size: ${(htmlSize / 1024).toFixed(1)} KB`);
console.log(`   CSS file size: ${(cssSize / 1024).toFixed(1)} KB`);
console.log(`   Total content: ${((htmlSize + cssSize) / 1024).toFixed(1)} KB`);

console.log('\n✨ Pipeline guide validation complete!');
