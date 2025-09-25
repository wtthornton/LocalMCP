#!/usr/bin/env node

/**
 * Create Comprehensive HTML Report with All Test Data
 * Extracts real test data and creates a detailed HTML report
 */

import fs from 'fs';
import { spawn } from 'child_process';

console.log('🚀 Creating Comprehensive HTML Report with All Test Data...\n');

// Run the test and capture all data
const testProcess = spawn('node', ['test/test-e2e-http.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let allTestsData = [];
let currentTest = null;

testProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for test markers
    if (line.includes('🧪 Testing:')) {
      if (currentTest) {
        allTestsData.push(currentTest);
      }
      currentTest = {
        name: line.replace('🧪 Testing:', '').trim(),
        originalPrompt: '',
        enhancedPrompt: '',
        success: false,
        frameworks_detected: [],
        context_used: {
          repo_facts: [],
          code_snippets: [],
          context7_docs: []
        },
        metrics: {
          originalLength: 0,
          enhancedLength: 0,
          tokenRatio: 0,
          context7DocsCount: 0,
          codeSnippetsCount: 0,
          repoFactsCount: 0
        }
      };
    }
    
    // Extract original prompt
    if (line.includes('📝 Original:')) {
      currentTest.originalPrompt = line.replace('📝 Original:', '').trim();
    }
    
    // Extract success status
    if (line.includes('✅ Success:')) {
      currentTest.success = line.includes('true');
    }
    
    // Extract enhanced prompt length
    if (line.includes('📊 Enhanced prompt length:')) {
      const lengthMatch = line.match(/(\d+) chars/);
      if (lengthMatch) {
        currentTest.metrics.enhancedLength = parseInt(lengthMatch[1]);
      }
    }
    
    // Extract token ratio
    if (line.includes('🔢 Token count:')) {
      const ratioMatch = line.match(/ratio: ([\d.]+)x/);
      if (ratioMatch) {
        currentTest.metrics.tokenRatio = parseFloat(ratioMatch[1]);
      }
      const originalMatch = line.match(/(\d+) →/);
      if (originalMatch) {
        currentTest.metrics.originalLength = parseInt(originalMatch[1]);
      }
    }
    
    // Look for JSON response
    if (line.trim().startsWith('{') && line.includes('enhanced_prompt')) {
      try {
        const jsonData = JSON.parse(line.trim());
        if (currentTest) {
          currentTest.enhancedPrompt = jsonData.enhanced_prompt || '';
          currentTest.frameworks_detected = jsonData.frameworks_detected || [];
          currentTest.context_used = jsonData.context_used || {
            repo_facts: [],
            code_snippets: [],
            context7_docs: []
          };
          currentTest.metrics.context7DocsCount = currentTest.context_used.context7_docs?.length || 0;
          currentTest.metrics.codeSnippetsCount = currentTest.context_used.code_snippets?.length || 0;
          currentTest.metrics.repoFactsCount = currentTest.context_used.repo_facts?.length || 0;
        }
      } catch (e) {
        console.log(`⚠️  Could not parse JSON: ${e.message}`);
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
    
    // Add the last test
    if (currentTest) {
      allTestsData.push(currentTest);
    }
    
    console.log(`📊 Found ${allTestsData.length} test(s) with data`);
    
    // Generate comprehensive HTML report
    generateComprehensiveHTMLReport(allTestsData);
  } else {
    console.log(`\n❌ Test failed with code ${code}`);
  }
});

function generateComprehensiveHTMLReport(testsData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `comprehensive-test-report-${timestamp}.html`;
  
  // Calculate overall metrics
  const overallMetrics = {
    totalTests: testsData.length,
    successfulTests: testsData.filter(t => t.success).length,
    totalOriginalTokens: testsData.reduce((sum, t) => sum + t.metrics.originalLength, 0),
    totalEnhancedTokens: testsData.reduce((sum, t) => sum + t.metrics.enhancedLength, 0),
    averageTokenRatio: testsData.reduce((sum, t) => sum + t.metrics.tokenRatio, 0) / testsData.length,
    totalContext7Docs: testsData.reduce((sum, t) => sum + t.metrics.context7DocsCount, 0),
    totalCodeSnippets: testsData.reduce((sum, t) => sum + t.metrics.codeSnippetsCount, 0),
    totalRepoFacts: testsData.reduce((sum, t) => sum + t.metrics.repoFactsCount, 0)
  };

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptMCP Comprehensive Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333; 
            min-height: 100vh;
        }
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            background: #fff; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
        }
        .header h1 { margin: 0; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header-info { display: flex; justify-content: center; gap: 30px; margin-top: 20px; flex-wrap: wrap; }
        .header-info > div { padding: 10px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; }
        .status.success { background: #28a745; }
        .status.partial { background: #ffc107; color: #333; }
        
        .overall-metrics { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 30px 0; 
        }
        .metric-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 0.9em; color: #666; margin-top: 5px; }
        
        .test-section { 
            margin: 40px 0; 
            padding: 30px; 
            background: #f8f9fa; 
            border-radius: 15px; 
            border-left: 5px solid #007bff;
        }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #dee2e6;
        }
        .test-title { font-size: 1.5em; color: #007bff; font-weight: bold; }
        .test-status { 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-weight: bold;
            background: #28a745; 
            color: white; 
        }
        
        .test-metrics { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .test-metric { 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .test-metric-value { font-size: 1.5em; font-weight: bold; color: #007bff; }
        .test-metric-label { font-size: 0.8em; color: #666; }
        
        .prompt-comparison { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 20px 0; 
        }
        .prompt-card { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
        }
        .prompt-card.original { border-left: 4px solid #ffc107; }
        .prompt-card.enhanced { border-left: 4px solid #28a745; }
        .prompt-card h3 { margin-bottom: 15px; color: #333; }
        .prompt-text { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            font-family: monospace; 
            white-space: pre-wrap; 
            word-break: break-word;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .context-section { margin: 25px 0; }
        .context-item { 
            background: white; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
        }
        .context-item h4 { color: #007bff; margin-bottom: 10px; }
        .context-list { list-style: none; padding: 0; }
        .context-list li { 
            padding: 8px 0; 
            border-bottom: 1px solid #eee; 
        }
        .context-list li:last-child { border-bottom: none; }
        
        .code-snippet { 
            background: #2d3748; 
            color: #e2e8f0; 
            padding: 15px; 
            border-radius: 8px; 
            font-family: 'Courier New', monospace; 
            margin: 10px 0; 
            overflow-x: auto;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .framework-badge { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 5px 15px; 
            border-radius: 15px; 
            font-size: 0.9em; 
            margin: 5px 5px 5px 0; 
        }
        
        .expandable {
            max-height: 200px;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        .expandable.expanded {
            max-height: none;
        }
        .expand-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 15px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 0.9em;
        }
        .expand-btn:hover {
            background: #0056b3;
        }
        
        @media (max-width: 768px) {
            .prompt-comparison { grid-template-columns: 1fr; }
            .overall-metrics { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
            .test-metrics { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PromptMCP Comprehensive Test Report</h1>
            <div class="header-info">
                <div>Total Tests: ${overallMetrics.totalTests}</div>
                <div>Successful: ${overallMetrics.successfulTests}</div>
                <div>Success Rate: ${Math.round((overallMetrics.successfulTests / overallMetrics.totalTests) * 100)}%</div>
                <div>Generated: ${new Date().toLocaleString()}</div>
            </div>
        </div>

        <div class="overall-metrics">
            <div class="metric-card">
                <div class="metric-value">${overallMetrics.totalOriginalTokens}</div>
                <div class="metric-label">Total Original Tokens</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overallMetrics.totalEnhancedTokens}</div>
                <div class="metric-label">Total Enhanced Tokens</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(overallMetrics.averageTokenRatio)}x</div>
                <div class="metric-label">Average Token Ratio</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overallMetrics.totalContext7Docs}</div>
                <div class="metric-label">Total Context7 Docs</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overallMetrics.totalCodeSnippets}</div>
                <div class="metric-label">Total Code Snippets</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${overallMetrics.totalRepoFacts}</div>
                <div class="metric-label">Total Repo Facts</div>
            </div>
        </div>

        ${testsData.map((test, index) => `
        <div class="test-section">
            <div class="test-header">
                <div class="test-title">Test ${index + 1}: ${test.name}</div>
                <div class="test-status">${test.success ? '✅ Success' : '❌ Failed'}</div>
            </div>

            <div class="test-metrics">
                <div class="test-metric">
                    <div class="test-metric-value">${test.metrics.originalLength}</div>
                    <div class="test-metric-label">Original Tokens</div>
                </div>
                <div class="test-metric">
                    <div class="test-metric-value">${test.metrics.enhancedLength}</div>
                    <div class="test-metric-label">Enhanced Tokens</div>
                </div>
                <div class="test-metric">
                    <div class="test-metric-value">${Math.round(test.metrics.tokenRatio)}x</div>
                    <div class="test-metric-label">Token Ratio</div>
                </div>
                <div class="test-metric">
                    <div class="test-metric-value">${test.metrics.context7DocsCount}</div>
                    <div class="test-metric-label">Context7 Docs</div>
                </div>
                <div class="test-metric">
                    <div class="test-metric-value">${test.metrics.codeSnippetsCount}</div>
                    <div class="test-metric-label">Code Snippets</div>
                </div>
                <div class="test-metric">
                    <div class="test-metric-value">${test.metrics.repoFactsCount}</div>
                    <div class="test-metric-label">Repo Facts</div>
                </div>
            </div>

            <div class="prompt-comparison">
                <div class="prompt-card original">
                    <h3>🔤 Original Prompt</h3>
                    <div class="prompt-text">${test.originalPrompt || 'N/A'}</div>
                </div>
                <div class="prompt-card enhanced">
                    <h3>✨ Enhanced Prompt</h3>
                    <div class="prompt-text expandable" id="enhanced-${index}">${test.enhancedPrompt || 'N/A'}</div>
                    <button class="expand-btn" onclick="toggleExpand('enhanced-${index}')">Show Full</button>
                </div>
            </div>

            <div class="context-section">
                <h3>🎯 Frameworks Detected</h3>
                <div>
                    ${test.frameworks_detected.map(framework => `<span class="framework-badge">${framework.toUpperCase()}</span>`).join('')}
                    ${test.frameworks_detected.length === 0 ? '<span class="framework-badge">NONE</span>' : ''}
                </div>
            </div>

            <div class="context-section">
                <h3>📚 Context7 Documentation (${test.context_used.context7_docs.length} docs)</h3>
                ${test.context_used.context7_docs.length > 0 ? test.context_used.context7_docs.map((doc, docIndex) => `
                    <div class="context-item">
                        <h4>Documentation ${docIndex + 1}</h4>
                        <div class="code-snippet">${doc.substring(0, 500)}${doc.length > 500 ? '...' : ''}</div>
                    </div>
                `).join('') : '<div class="context-item"><p>No Context7 documentation found</p></div>'}
            </div>

            <div class="context-section">
                <h3>💻 Code Snippets (${test.context_used.code_snippets.length} snippets)</h3>
                ${test.context_used.code_snippets.length > 0 ? test.context_used.code_snippets.map((snippet, snippetIndex) => `
                    <div class="context-item">
                        <h4>📄 ${snippet.file || `Snippet ${snippetIndex + 1}`}</h4>
                        <div class="code-snippet">${snippet.content ? snippet.content.substring(0, 300) + (snippet.content.length > 300 ? '...' : '') : 'No content'}</div>
                        ${snippet.relevance ? `<div style="margin-top: 10px;"><span class="framework-badge">Relevance: ${Math.round(snippet.relevance * 100)}%</span></div>` : ''}
                    </div>
                `).join('') : '<div class="context-item"><p>No code snippets found</p></div>'}
            </div>

            <div class="context-section">
                <h3>📋 Repository Facts (${test.context_used.repo_facts.length} facts)</h3>
                <div class="context-item">
                    <div class="expandable" id="facts-${index}">
                        <ul class="context-list">
                            ${test.context_used.repo_facts.map(fact => `<li>${fact}</li>`).join('')}
                        </ul>
                    </div>
                    <button class="expand-btn" onclick="toggleExpand('facts-${index}')">Show All Facts</button>
                </div>
            </div>
        </div>
        `).join('')}
    </div>

    <script>
        function toggleExpand(elementId) {
            const element = document.getElementById(elementId);
            const button = element.nextElementSibling;
            
            if (element.classList.contains('expanded')) {
                element.classList.remove('expanded');
                button.textContent = button.textContent.replace('Hide', 'Show');
            } else {
                element.classList.add('expanded');
                button.textContent = button.textContent.replace('Show', 'Hide');
            }
        }
    </script>
</body>
</html>`;

  // Save the HTML report
  fs.writeFileSync(filename, htmlContent);

  console.log('✅ Comprehensive HTML Report Generated Successfully!');
  console.log(`📄 Report saved to: ${filename}`);
  console.log(`🌐 Open in browser: file:///${process.cwd().replace(/\\/g, '/')}/${filename}`);
  console.log('\n📊 Comprehensive Report Summary:');
  console.log(`   - Total Tests: ${overallMetrics.totalTests}`);
  console.log(`   - Successful Tests: ${overallMetrics.successfulTests}`);
  console.log(`   - Success Rate: ${Math.round((overallMetrics.successfulTests / overallMetrics.totalTests) * 100)}%`);
  console.log(`   - Total Original Tokens: ${overallMetrics.totalOriginalTokens}`);
  console.log(`   - Total Enhanced Tokens: ${overallMetrics.totalEnhancedTokens}`);
  console.log(`   - Average Token Ratio: ${Math.round(overallMetrics.averageTokenRatio)}x`);
  console.log(`   - Total Context7 Docs: ${overallMetrics.totalContext7Docs}`);
  console.log(`   - Total Code Snippets: ${overallMetrics.totalCodeSnippets}`);
  console.log(`   - Total Repo Facts: ${overallMetrics.totalRepoFacts}`);
  
  // Show individual test summaries
  testsData.forEach((test, index) => {
    console.log(`\n   Test ${index + 1}: ${test.name}`);
    console.log(`     - Success: ${test.success}`);
    console.log(`     - Token Ratio: ${Math.round(test.metrics.tokenRatio)}x`);
    console.log(`     - Context7 Docs: ${test.metrics.context7DocsCount}`);
    console.log(`     - Code Snippets: ${test.metrics.codeSnippetsCount}`);
    console.log(`     - Frameworks: ${test.frameworks_detected.join(', ') || 'None'}`);
  });
}
