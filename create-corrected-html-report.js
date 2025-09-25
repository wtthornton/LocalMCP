#!/usr/bin/env node

/**
 * Create Corrected HTML Report for Test 1 (Simple Math Question)
 * Reads actual test data from JSON file
 */

import fs from 'fs';

console.log('🚀 Creating Corrected HTML Report for Test 1...\n');

// Read the actual test data from JSON file
const jsonFile = process.argv[2] || 'test1-simple-math-complete-response-2025-09-25T19-04-13-779Z.json';

if (!fs.existsSync(jsonFile)) {
  console.error(`❌ JSON file not found: ${jsonFile}`);
  process.exit(1);
}

const testData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const result = testData.completeResponse;

console.log('📊 Actual Test Data:');
console.log(`   - Original Prompt: "${result.enhanced_prompt.split('\n')[0]}"`);
console.log(`   - Enhanced Length: ${result.enhanced_prompt.length} characters`);
console.log(`   - Token Count: ${testData.performance.enhancedTokens}`);
console.log(`   - Context7 Used: ${testData.performance.context7Used}`);
console.log(`   - Libraries: ${testData.libraries.join(', ') || 'None'}`);

// Generate HTML report with actual data
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptMCP Corrected Test Report</title>
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
            max-width: 1200px; 
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
        .status.warning { background: #ffc107; color: #333; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-top: 15px; }
        
        .metrics-grid { 
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
        
        .section { 
            margin: 30px 0; 
            padding: 25px; 
            background: #f8f9fa; 
            border-radius: 15px; 
        }
        .section h2 { color: #007bff; margin-bottom: 20px; font-size: 1.8em; }
        
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
        .prompt-card.enhanced { border-left: 4px solid #dc3545; }
        .prompt-card h3 { margin-bottom: 15px; color: #333; }
        .prompt-text { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            font-family: monospace; 
            white-space: pre-wrap; 
            word-break: break-word;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .context-section { margin: 20px 0; }
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
        
        .warning-indicator { 
            display: inline-block; 
            background: #ffc107; 
            color: #333; 
            padding: 5px 15px; 
            border-radius: 15px; 
            font-size: 0.9em; 
            margin: 5px 0; 
        }
        
        .error-indicator { 
            display: inline-block; 
            background: #dc3545; 
            color: white; 
            padding: 5px 15px; 
            border-radius: 15px; 
            font-size: 0.9em; 
            margin: 5px 0; 
        }
        
        @media (max-width: 768px) {
            .prompt-comparison { grid-template-columns: 1fr; }
            .metrics-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PromptMCP Corrected Test Report</h1>
            <div class="status warning">⚠️ Data Mismatch Detected</div>
            <div style="margin-top: 20px; font-size: 1.1em;">
                <strong>Test:</strong> Simple Math Question<br>
                <strong>Quality Score:</strong> ${testData.quality.overall}/100 (${testData.quality.overall >= 80 ? 'Good' : testData.quality.overall >= 60 ? 'Poor' : 'Failed'})<br>
                <strong>Timestamp:</strong> ${new Date().toLocaleString()}
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${testData.performance.originalTokens}</div>
                <div class="metric-label">Original Tokens</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${testData.performance.enhancedTokens}</div>
                <div class="metric-label">Enhanced Tokens</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${testData.performance.tokenRatio.toFixed(2)}x</div>
                <div class="metric-label">Token Ratio</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${testData.context.repoFacts}</div>
                <div class="metric-label">Repo Facts</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${testData.context.codeSnippets}</div>
                <div class="metric-label">Code Snippets</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${testData.context.context7Docs}</div>
                <div class="metric-label">Context7 Docs</div>
            </div>
        </div>

        <div class="section">
            <h2>📝 Prompt Comparison</h2>
            <div class="prompt-comparison">
                <div class="prompt-card original">
                    <h3>🔤 Original Prompt</h3>
                    <div class="prompt-text">${testData.testCase.prompt}</div>
                    <div style="margin-top: 10px;">
                        <span class="warning-indicator">${testData.performance.originalTokens} tokens</span>
                    </div>
                </div>
                <div class="prompt-card enhanced">
                    <h3>✨ Enhanced Prompt (ACTUAL)</h3>
                    <div class="prompt-text">${result.enhanced_prompt}</div>
                    <div style="margin-top: 10px;">
                        <span class="error-indicator">${testData.performance.enhancedTokens} tokens</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🧠 Context Enhancement Analysis</h2>
            
            <div class="context-section">
                <h3>📚 Context7 Documentation (${testData.context.context7Docs} docs)</h3>
                ${testData.context.context7Docs > 0 ? `
                    <div class="context-item">
                        <h4>React Documentation (Incorrect for Math Question)</h4>
                        <p>${result.enhanced_prompt.includes('react_dev') ? 'React documentation was incorrectly retrieved for a simple math question' : 'No Context7 documentation found'}</p>
                    </div>
                ` : '<div class="context-item"><p>No Context7 documentation found</p></div>'}
            </div>

            <div class="context-section">
                <h3>💻 Code Snippets (${testData.context.codeSnippets} snippets)</h3>
                ${testData.context.codeSnippets > 0 ? `
                    <div class="context-item">
                        <h4>📄 Repository Code Snippets (Irrelevant)</h4>
                        <div class="code-snippet">// Code snippets from PromptMCP codebase were added to a simple math question</div>
                        <div style="margin-top: 10px;">
                            <span class="error-indicator">Relevance: 0%</span>
                        </div>
                    </div>
                ` : '<div class="context-item"><p>No code snippets found</p></div>'}
            </div>

            <div class="context-section">
                <h3>📋 Repository Facts (${testData.context.repoFacts} facts)</h3>
                <div class="context-item">
                    <p><strong>Issue:</strong> Repository facts about PromptMCP project were added to a simple math question, making the response completely irrelevant.</p>
                    <ul class="context-list">
                        ${result.context_used.repo_facts.slice(0, 5).map(fact => `<li>${fact}</li>`).join('')}
                        ${result.context_used.repo_facts.length > 5 ? '<li>... and more irrelevant facts</li>' : ''}
                    </ul>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Framework Detection Results</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${testData.libraries.length > 0 ? testData.libraries.map(lib => `
                    <span class="error-indicator">${lib} (WRONG)</span>
                `).join('') : '<span class="warning-indicator">None Detected</span>'}
            </div>
            <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <strong>⚠️ Problem:</strong> The system detected React framework for a simple math question "What is 2+2?" which is completely inappropriate.
            </div>
        </div>

        <div class="section">
            <h2>📊 Enhancement Summary</h2>
            <div style="background: white; padding: 20px; border-radius: 10px;">
                <p><strong>❌ Context7 Integration:</strong> Retrieved ${testData.context.context7Docs} documentation snippet(s) - WRONG framework for math question</p>
                <p><strong>❌ Code Analysis:</strong> Found ${testData.context.codeSnippets} irrelevant code snippet(s) from the repository</p>
                <p><strong>❌ Framework Detection:</strong> Detected ${testData.libraries.length} framework(s): ${testData.libraries.join(', ') || 'None'} - COMPLETELY WRONG for math question</p>
                <p><strong>❌ Repository Context:</strong> Analyzed ${testData.context.repoFacts} repository facts - IRRELEVANT for math question</p>
                <p><strong>❌ Prompt Enhancement:</strong> Expanded prompt from ${testData.performance.originalTokens} to ${testData.performance.enhancedTokens} tokens (${testData.performance.tokenRatio.toFixed(2)}x expansion) - SEVERE OVER-ENGINEERING</p>
            </div>
        </div>

        <div class="section">
            <h2>🚨 Critical Issues Identified</h2>
            <div style="background: #f8d7da; padding: 20px; border-radius: 10px; border-left: 4px solid #dc3545;">
                <h3 style="color: #721c24; margin-bottom: 15px;">Major Problems:</h3>
                <ul style="color: #721c24; line-height: 1.8;">
                    <li><strong>Wrong Framework Detection:</strong> Detected React for a simple math question</li>
                    <li><strong>Irrelevant Context:</strong> Added React documentation, code snippets, and project facts to a math question</li>
                    <li><strong>Severe Over-Engineering:</strong> 572x token expansion for "What is 2+2?"</li>
                    <li><strong>Poor Quality Score:</strong> 60/100 indicates fundamental issues</li>
                    <li><strong>Data Mismatch:</strong> HTML report showed wrong enhanced prompt content</li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;

// Save the corrected HTML report
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `corrected-test-report-${timestamp}.html`;
fs.writeFileSync(filename, htmlContent);

console.log('✅ Corrected HTML Report Generated Successfully!');
console.log(`📄 Report saved to: ${filename}`);
console.log(`🌐 Open in browser: file:///${process.cwd().replace(/\\/g, '/')}/${filename}`);
console.log('\n📊 Corrected Report Summary:');
console.log(`   - Test: ${testData.testCase.name}`);
console.log(`   - Original: "${testData.testCase.prompt}"`);
console.log(`   - Enhanced: ${testData.performance.enhancedTokens} tokens (${testData.performance.tokenRatio.toFixed(2)}x)`);
console.log(`   - Quality Score: ${testData.quality.overall}/100`);
console.log(`   - Context7 docs: ${testData.context.context7Docs} (WRONG framework)`);
console.log(`   - Code snippets: ${testData.context.codeSnippets} (IRRELEVANT)`);
console.log(`   - Frameworks: ${testData.libraries.join(', ') || 'None'} (WRONG)`);
console.log(`   - Success: ${testData.quality.overall >= 60 ? 'Partial' : 'Failed'}`);
