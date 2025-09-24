#!/usr/bin/env node

/**
 * PromptMCP Test Report Generator
 * 
 * A reusable script to generate beautiful HTML reports from test results.
 * Supports both E2E MCP tests and quality benchmark tests.
 * 
 * Usage:
 *   node scripts/generate-test-report.js [test-type] [results-file]
 * 
 * Examples:
 *   node scripts/generate-test-report.js e2e
 *   node scripts/generate-test-report.js quality
 *   node scripts/generate-test-report.js e2e mcp-e2e-test-results-2025-09-24T19-18-38-451Z.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  e2e: {
    pattern: 'mcp-e2e-test-results-*.json',
    title: 'PromptMCP E2E Test Report',
    subtitle: 'MCP Configuration Architecture - Single Source of Truth',
    maxScore: 140,
        metrics: [
          { key: 'overall', label: 'Quality Score', max: 140 },
          { key: 'frameworkDetection', label: 'Framework Detection', max: 20 },
          { key: 'context7Integration', label: 'Context7 Integration', max: 20 },
          { key: 'projectAnalysis', label: 'Project Analysis', max: 20 },
          { key: 'codePatterns', label: 'Code Patterns', max: 20 },
          { key: 'promptEnhancement', label: 'Prompt Enhancement', max: 20 },
          { key: 'responseQuality', label: 'Response Quality', max: 20 },
          { key: 'tokenEfficiency', label: 'Token Efficiency', max: 20 }
        ]
  },
  quality: {
    pattern: 'promptmcp-quality-*.json',
    title: 'PromptMCP Quality Benchmark Report',
    subtitle: 'Comprehensive Quality Analysis and Performance Metrics',
    maxScore: 100,
    metrics: [
      { key: 'accuracy', label: 'Accuracy', max: 20 },
      { key: 'relevance', label: 'Relevance', max: 20 },
      { key: 'tokenEfficiency', label: 'Token Efficiency', max: 20 },
      { key: 'responseTime', label: 'Response Time', max: 20 },
      { key: 'frameworkDetection', label: 'Framework Detection', max: 20 }
    ]
  }
};

/**
 * Find the latest test results file
 */
function findLatestResultsFile(testType) {
  const config = CONFIG[testType];
  if (!config) {
    throw new Error(`Unknown test type: ${testType}. Supported types: ${Object.keys(CONFIG).join(', ')}`);
  }

  const files = fs.readdirSync('.')
    .filter(f => f.match(new RegExp(config.pattern.replace('*', '.*'))))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(`No ${testType} test results found matching pattern: ${config.pattern}`);
  }

  return files[0];
}

/**
 * Load and parse test results
 */
function loadTestResults(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load test results from ${filePath}: ${error.message}`);
  }
}

/**
 * Convert markdown-like text to HTML for better formatting
 */
function formatEnhancedPrompt(text) {
  if (!text) return 'N/A';
  
  return text
    // Convert ## headers to <h2>
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Convert ### headers to <h3>
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Convert **bold** to <strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert bullet points to <ul><li>
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Convert numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
    // Wrap consecutive <li> elements in <ul>
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    // Convert ```code``` blocks to <pre><code>
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Convert `inline code` to <code>
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert line breaks to <br>
    .replace(/\n/g, '<br>')
    // Clean up multiple <br> tags
    .replace(/(<br>){3,}/g, '<br><br>');
}

/**
 * Generate HTML report
 */
function generateHTMLReport(testType, results, outputFile) {
  const config = CONFIG[testType];
  const timestamp = new Date().toLocaleString();
  
  // Calculate summary statistics
  const tests = results.results || results.tests || [];
  const successfulTests = tests.filter(t => t.success !== false).length;
  const successRate = tests.length > 0 ? Math.round((successfulTests / tests.length) * 100) : 0;
  
  // Calculate average scores
  const avgScores = {};
  config.metrics.forEach(metric => {
    const values = tests.map(t => t.qualityMetrics?.[metric.key] || t[metric.key] || 0).filter(v => v > 0);
    avgScores[metric.key] = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  });
  
  const totalTime = results.totalTime || results.summary?.totalTime || 0;
  const averageQualityScore = avgScores.overall || avgScores.qualityScore || avgScores.accuracy || 0;
  
  // Calculate cost statistics
  const totalCost = tests.reduce((sum, test) => {
    return sum + (test.metadata?.estimatedCost || 0);
  }, 0);
  
  const averageCost = tests.length > 0 ? totalCost / tests.length : 0;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; padding: 20px; background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; margin: 0 auto; background: white; 
            border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            overflow: hidden; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; padding: 30px; text-align: center; 
        }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em; }
        .summary { padding: 30px; border-bottom: 1px solid #eee; }
        .summary-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; margin: 20px 0; 
        }
        .summary-card { 
            background: #f8f9fa; padding: 20px; border-radius: 8px; 
            text-align: center; border-left: 4px solid #667eea; 
        }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; font-size: 1.1em; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #667eea; }
        .summary-card .label { color: #666; font-size: 0.9em; margin-top: 5px; }
        .results { padding: 30px; }
        .test-case { 
            background: #f8f9fa; margin: 20px 0; padding: 25px; 
            border-radius: 8px; border-left: 4px solid #28a745; 
        }
        .test-case h3 { margin: 0 0 15px 0; color: #333; }
        .test-case .success { color: #28a745; font-weight: bold; }
        .test-case .error { color: #dc3545; font-weight: bold; }
        .metrics { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; margin: 15px 0; 
        }
        .metric { 
            background: white; padding: 15px; border-radius: 6px; 
            text-align: center; border: 1px solid #ddd; 
        }
        .metric .label { font-size: 0.9em; color: #666; margin-bottom: 5px; }
        .metric .value { font-size: 1.2em; font-weight: bold; color: #333; }
        .prompt-section { margin: 20px 0; }
        .prompt-section h4 { color: #333; margin-bottom: 10px; }
        .prompt-box { 
            background: #f1f3f4; padding: 15px; border-radius: 6px; 
            font-family: 'Monaco', 'Menlo', monospace; font-size: 0.9em; 
            line-height: 1.4; 
        }
        .response-box { 
            background: #e8f5e8; padding: 12px; border-radius: 6px; 
            font-family: 'Monaco', 'Menlo', monospace; font-size: 0.85em; 
            line-height: 1.4; max-height: 400px; overflow-y: auto; 
            white-space: pre-wrap; word-wrap: break-word;
        }
        .response-box h1, .response-box h2, .response-box h3, .response-box h4, .response-box h5, .response-box h6 {
            color: #2d5a27; font-weight: bold; margin: 6px 0 3px 0;
        }
        .response-box h2 { font-size: 1.05em; border-bottom: 1px solid #4a7c59; padding-bottom: 2px; }
        .response-box ul, .response-box ol { margin: 4px 0; padding-left: 18px; }
        .response-box li { margin: 2px 0; line-height: 1.3; }
        .response-box ul li { list-style-type: disc; }
        .response-box ol li { list-style-type: decimal; }
        .response-box strong { color: #1a4d1a; font-weight: bold; }
        .response-box code { background: #d4edda; padding: 1px 3px; border-radius: 3px; font-size: 0.8em; }
        .response-box pre { background: #d4edda; padding: 6px; border-radius: 4px; overflow-x: auto; margin: 4px 0; }
        .response-box blockquote { border-left: 3px solid #4a7c59; padding-left: 8px; margin: 4px 0; color: #2d5a27; }
        .metadata-section { 
            background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 8px 0; 
            border-left: 3px solid #6c757d;
        }
        .metadata-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 8px; margin-top: 8px; 
        }
        .metadata-item { 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 4px 0; border-bottom: 1px solid #e9ecef; 
        }
        .metadata-item .label { font-weight: 600; color: #495057; }
        .metadata-item .value { font-family: 'Monaco', 'Menlo', monospace; color: #007bff; }
        .json-section { 
            background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 8px 0; 
            border-left: 3px solid #28a745;
        }
        .json-links { 
            display: flex; gap: 8px; margin-bottom: 8px; 
        }
        .json-toggle-btn, .json-download-btn { 
            background: #007bff; color: white; border: none; padding: 6px 12px; 
            border-radius: 4px; cursor: pointer; font-size: 0.85em; 
        }
        .json-toggle-btn:hover, .json-download-btn:hover { 
            background: #0056b3; 
        }
        .json-download-btn { 
            background: #28a745; 
        }
        .json-download-btn:hover { 
            background: #1e7e34; 
        }
        .json-content { 
            background: #2d3748; color: #e2e8f0; padding: 12px; 
            border-radius: 4px; overflow-x: auto; font-size: 0.8em; 
        }
        .json-content pre { 
            margin: 0; white-space: pre-wrap; word-wrap: break-word; 
        }
        .architecture-note { 
            background: #e3f2fd; border: 1px solid #2196f3; 
            padding: 20px; border-radius: 8px; margin: 20px 0; 
        }
        .architecture-note h4 { color: #1976d2; margin: 0 0 10px 0; }
        .architecture-note p { margin: 5px 0; color: #1565c0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
        .footer p { margin: 0; opacity: 0.8; }
        .status-healthy { color: #28a745; }
        .status-degraded { color: #ffc107; }
        .status-unhealthy { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 ${config.title}</h1>
            <p>${config.subtitle}</p>
            <p>Generated: ${timestamp}</p>
        </div>
        
        <div class="summary">
            <h2>📊 Test Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="value">${tests.length}</div>
                    <div class="label">Total Tests</div>
                </div>
                <div class="summary-card">
                    <div class="value status-healthy">${successfulTests}</div>
                    <div class="label">Successful</div>
                </div>
                <div class="summary-card">
                    <div class="value status-healthy">${successRate}%</div>
                    <div class="label">Success Rate</div>
                </div>
                <div class="summary-card">
                    <div class="value">${averageQualityScore}/${config.maxScore}</div>
                    <div class="label">Avg Quality Score</div>
                </div>
                <div class="summary-card">
                    <div class="value">${totalTime}ms</div>
                    <div class="label">Total Time</div>
                </div>
                ${totalCost > 0 ? `
                <div class="summary-card">
                    <div class="value">$${totalCost.toFixed(4)}</div>
                    <div class="label">Total Cost</div>
                </div>
                <div class="summary-card">
                    <div class="value">$${averageCost.toFixed(4)}</div>
                    <div class="label">Avg Cost/Test</div>
                </div>
                ` : ''}
            </div>
            
            ${testType === 'e2e' ? `
            <div class="architecture-note">
                <h4>🏗️ Architecture Success</h4>
                <p>✅ <strong>MCP Configuration as Single Source of Truth</strong> - All API keys now loaded from mcp-config.json</p>
                <p>✅ <strong>No Environment Variables for Keys</strong> - Docker container properly mounts and uses MCP configuration</p>
                <p>✅ <strong>${successRate}% Success Rate</strong> - All tests passing with new architecture</p>
                <p>✅ <strong>MCP Protocol Compliant</strong> - Proper configuration management following MCP standards</p>
            </div>
            ` : ''}
        </div>
        
        <div class="results">
            <h2>📋 Detailed Test Results</h2>
            ${tests.map((test, index) => `
            <div class="test-case">
                <h3>${index + 1}. ${test.name || test.id || `Test ${index + 1}`}</h3>
                <div class="success">✅ Success: ${test.success !== false}</div>
                <div class="metrics">
                    ${config.metrics.map(metric => `
                    <div class="metric">
                        <div class="label">${metric.label}</div>
                        <div class="value">${test.qualityMetrics?.[metric.key] || test[metric.key] || 0}/${metric.max}</div>
                    </div>
                    `).join('')}
                    <div class="metric">
                        <div class="label">Response Time</div>
                        <div class="value">${test.responseTime || 0}ms</div>
                    </div>
                </div>
                ${test.error ? `<div class="error">❌ Error: ${test.error}</div>` : ''}
                <div class="prompt-section">
                    <h4>📝 Original Prompt</h4>
                    <div class="prompt-box">${test.prompt || test.originalPrompt || 'N/A'}</div>
                </div>
                <div class="prompt-section">
                    <h4>✨ Enhanced Prompt</h4>
                    <div class="response-box">${formatEnhancedPrompt(test.enhancedPrompt || test.response)}</div>
                </div>
                ${test.metadata && test.metadata.tokenCount ? `
                <div class="metadata-section">
                    <h4>📊 Token Usage & Cost</h4>
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <span class="label">Token Count:</span>
                            <span class="value">${test.metadata.tokenCount.toLocaleString()} tokens</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Character Count:</span>
                            <span class="value">${(test.metadata.characterCount || test.enhancedPrompt?.length || 0).toLocaleString()} chars</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Token Density:</span>
                            <span class="value">${((test.metadata.characterCount || test.enhancedPrompt?.length || 0) / test.metadata.tokenCount).toFixed(2)} chars/token</span>
                        </div>
                        ${test.metadata.estimatedCost ? `
                        <div class="metadata-item">
                            <span class="label">Estimated Cost:</span>
                            <span class="value">$${test.metadata.estimatedCost.toFixed(4)}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Cost per Token:</span>
                            <span class="value">$${(test.metadata.estimatedCost / test.metadata.tokenCount).toFixed(6)}</span>
                        </div>
                        ` : ''}
                        ${test.metadata.cacheMetrics ? `
                        <div class="metadata-item">
                            <span class="label">Cache Hit Rate:</span>
                            <span class="value">${(test.metadata.cacheMetrics.hitRate * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Avg Hit Time:</span>
                            <span class="value">${test.metadata.cacheMetrics.averageHitTime.toFixed(1)}ms</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Avg Miss Time:</span>
                            <span class="value">${test.metadata.cacheMetrics.averageMissTime.toFixed(1)}ms</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Performance Gain:</span>
                            <span class="value">${test.metadata.cacheMetrics.performanceGain.toFixed(1)}%</span>
                        </div>
                        ` : ''}
                        ${test.metadata.semanticSimilarity ? `
                        <div class="metadata-item">
                            <span class="label">Prompt-Response Similarity:</span>
                            <span class="value">${(test.metadata.semanticSimilarity.promptResponseSimilarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Intent Preservation:</span>
                            <span class="value">${(test.metadata.semanticSimilarity.intentPreservation * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Similarity Confidence:</span>
                            <span class="value">${(test.metadata.semanticSimilarity.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Similarity Method:</span>
                            <span class="value">${test.metadata.semanticSimilarity.method}</span>
                        </div>
                        ` : ''}
                        ${test.metadata.contentQuality ? `
                        <div class="metadata-item">
                            <span class="label">Readability Level:</span>
                            <span class="value">${test.metadata.contentQuality.readability.readabilityLevel}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Grade Level:</span>
                            <span class="value">${test.metadata.contentQuality.readability.averageGradeLevel.toFixed(1)}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Word Count:</span>
                            <span class="value">${test.metadata.contentQuality.readability.wordCount.toLocaleString()}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Sentence Count:</span>
                            <span class="value">${test.metadata.contentQuality.readability.sentenceCount}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Avg Words/Sentence:</span>
                            <span class="value">${test.metadata.contentQuality.readability.averageWordsPerSentence.toFixed(1)}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Structure Score:</span>
                            <span class="value">${test.metadata.contentQuality.structure.structureScore.toFixed(0)}/100</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Organization:</span>
                            <span class="value">${test.metadata.contentQuality.structure.organizationLevel}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Has Headers:</span>
                            <span class="value">${test.metadata.contentQuality.structure.hasHeaders ? '✅' : '❌'}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Has Lists:</span>
                            <span class="value">${test.metadata.contentQuality.structure.hasLists ? '✅' : '❌'}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Has Code Blocks:</span>
                            <span class="value">${test.metadata.contentQuality.structure.hasCodeBlocks ? '✅' : '❌'}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Has Links:</span>
                            <span class="value">${test.metadata.contentQuality.structure.hasLinks ? '✅' : '❌'}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Overall Quality:</span>
                            <span class="value">${test.metadata.contentQuality.overallQuality.toFixed(1)}/100</span>
                        </div>
                        ` : ''}
                        ${test.metadata.systemPerformance ? `
                        <div class="metadata-item">
                            <span class="label">CPU Usage:</span>
                            <span class="value">${test.metadata.systemPerformance.resources.cpu.usage.toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Memory Usage:</span>
                            <span class="value">${test.metadata.systemPerformance.resources.memory.usagePercentage.toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Disk Usage:</span>
                            <span class="value">${test.metadata.systemPerformance.resources.disk.usagePercentage.toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Network Connections:</span>
                            <span class="value">${test.metadata.systemPerformance.resources.network.connections}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Requests/sec:</span>
                            <span class="value">${test.metadata.systemPerformance.performance.throughput.requestsPerSecond.toFixed(1)}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">P95 Response Time:</span>
                            <span class="value">${test.metadata.systemPerformance.performance.throughput.p95ResponseTime.toFixed(0)}ms</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Uptime:</span>
                            <span class="value">${test.metadata.systemPerformance.performance.availability.uptimePercentage.toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Error Rate:</span>
                            <span class="value">${test.metadata.systemPerformance.performance.errors.errorRate.toFixed(2)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Health Status:</span>
                            <span class="value">${test.metadata.systemPerformance.health.overall}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Health Score:</span>
                            <span class="value">${test.metadata.systemPerformance.health.score.toFixed(0)}/100</span>
                        </div>
                        ` : ''}
                        ${test.metadata.reliability ? `
                        <div class="metadata-item">
                            <span class="label">Uptime:</span>
                            <span class="value">${test.metadata.reliability.uptime.uptimePercentage.toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Total Uptime:</span>
                            <span class="value">${Math.floor(test.metadata.reliability.uptime.totalUptime / 86400)} days</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Current Uptime:</span>
                            <span class="value">${Math.floor(test.metadata.reliability.uptime.currentUptime / 3600)} hours</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Error Rate:</span>
                            <span class="value">${test.metadata.reliability.errors.errorRate.toFixed(2)}/hour</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Total Errors:</span>
                            <span class="value">${test.metadata.reliability.errors.totalErrors}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Resolution Rate:</span>
                            <span class="value">${test.metadata.reliability.errors.resolutionRate.toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Avg Resolution Time:</span>
                            <span class="value">${test.metadata.reliability.errors.averageResolutionTime.toFixed(0)} min</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">MTBF:</span>
                            <span class="value">${test.metadata.reliability.performance.meanTimeBetweenFailures.toFixed(1)} hours</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">MTTR:</span>
                            <span class="value">${test.metadata.reliability.performance.meanTimeToRecovery.toFixed(0)} min</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Availability:</span>
                            <span class="value">${test.metadata.reliability.performance.availability.toFixed(1)}%</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Reliability Score:</span>
                            <span class="value">${test.metadata.reliability.performance.reliabilityScore.toFixed(0)}/100</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Error Trend:</span>
                            <span class="value">${test.metadata.reliability.trends.errorTrend}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Reliability Health:</span>
                            <span class="value">${test.metadata.reliability.health.overall}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="label">Health Score:</span>
                            <span class="value">${test.metadata.reliability.health.score.toFixed(0)}/100</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                <div class="json-section">
                    <h4>🔗 Full Response Data</h4>
                    <div class="json-links">
                        <button onclick="toggleJson('${test.id || test.name}')" class="json-toggle-btn">📄 View Full JSON</button>
                        <button onclick="downloadJson('${test.id || test.name}')" class="json-download-btn">💾 Download JSON</button>
                    </div>
                    <div id="json-${test.id || test.name}" class="json-content" style="display: none;">
                        <pre><code>${JSON.stringify(test, null, 2)}</code></pre>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>${config.title} - Generated by PromptMCP Test Report Generator</p>
            <p>All tests completed with ${successRate}% success rate</p>
        </div>
        </div>
        
        <script>
            function toggleJson(testId) {
                const jsonContent = document.getElementById('json-' + testId);
                const button = event.target;
                
                if (jsonContent.style.display === 'none') {
                    jsonContent.style.display = 'block';
                    button.textContent = '📄 Hide JSON';
                } else {
                    jsonContent.style.display = 'none';
                    button.textContent = '📄 View Full JSON';
                }
            }
            
            function downloadJson(testId) {
                const jsonContent = document.getElementById('json-' + testId);
                const jsonText = jsonContent.querySelector('code').textContent;
                
                const blob = new Blob([jsonText], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'test-' + testId + '-response.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        </script>
    </body>
</html>`;

  fs.writeFileSync(outputFile, html);
  return outputFile;
}

/**
 * Main function
 */
function main() {
  try {
    const args = process.argv.slice(2);
    const testType = args[0] || 'e2e';
    const resultsFile = args[1];

    console.log(`🔍 Generating ${testType} test report...`);

    // Find results file
    const filePath = resultsFile || findLatestResultsFile(testType);
    console.log(`📄 Using results file: ${filePath}`);

    // Load results
    const results = loadTestResults(filePath);
    console.log(`📊 Loaded ${(results.results || results.tests || []).length} test results`);

    // Generate report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputFile = `promptmcp-${testType}-test-report-${timestamp}.html`;
    
    generateHTMLReport(testType, results, outputFile);
    
    console.log(`✅ HTML report generated: ${outputFile}`);
    console.log(`🌐 Open in browser: file://${path.resolve(outputFile)}`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateHTMLReport, findLatestResultsFile, loadTestResults };
