/**
 * HTML Report Generator
 * 
 * This module generates self-contained HTML reports for demo results,
 * including real code display, validation results, and interactive features.
 */

import fs from 'fs/promises';
import path from 'path';

class HTMLGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(__dirname, '../reports');
    this.assetsDir = options.assetsDir || path.join(__dirname, '../assets');
  }

  /**
   * Generate HTML report for demo results
   * @param {Object} demoResult - Demo result data
   * @param {Object} options - Generation options
   * @returns {string} Generated HTML content
   */
  async generateReport(demoResult, options = {}) {
    console.log(`📄 Generating HTML report for demo: ${demoResult.id}`);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptMCP Demo Report - ${demoResult.scenario}</title>
    <style>
        ${this.getCSS()}
    </style>
</head>
<body>
    <div class="container">
        ${this.generateHeader(demoResult)}
        ${this.generateSummary(demoResult)}
        ${this.generateComparison(demoResult)}
        ${this.generateCodeDisplay(demoResult)}
        ${this.generateValidationResults(demoResult)}
        ${this.generatePipelineMetrics(demoResult)}
        ${this.generateFooter(demoResult)}
    </div>
    <script>
        ${this.getJavaScript()}
    </script>
</body>
</html>`;

    // Save HTML report
    const filename = `demo-report-${demoResult.id}.html`;
    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, html, 'utf8');

    console.log(`✅ HTML report generated: ${filepath}`);
    return filepath;
  }

  /**
   * Generate report header
   */
  generateHeader(demoResult) {
    const timestamp = new Date(demoResult.timestamp).toLocaleString();
    const statusClass = demoResult.status === 'completed' ? 'success' : 'error';
    
    return `
    <div class="header">
        <h1>🚀 PromptMCP Demo Report</h1>
        <div class="header-info">
            <div class="scenario">Scenario: ${demoResult.scenario}</div>
            <div class="timestamp">Generated: ${timestamp}</div>
            <div class="status ${statusClass}">Status: ${demoResult.status}</div>
        </div>
        ${demoResult.status === 'completed' ? `
        <div class="metrics-row">
            <div class="metric">
                <div class="metric-value">${demoResult.comparison?.summary?.overallImprovement || 0}%</div>
                <div class="metric-label">Overall Improvement</div>
            </div>
            <div class="metric">
                <div class="metric-value">${demoResult.metadata?.totalFiles || 0}</div>
                <div class="metric-label">Files Generated</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(demoResult.duration / 1000)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>` : ''}
    </div>`;
  }

  /**
   * Generate summary section
   */
  generateSummary(demoResult) {
    if (demoResult.status !== 'completed') {
      return `
      <div class="error-section">
        <h2>❌ Demo Failed</h2>
        <p>Error: ${demoResult.error}</p>
      </div>`;
    }

    const comparison = demoResult.comparison;
    const cursor = comparison.codeGeneration.cursor;
    const localmcp = comparison.codeGeneration.localmcp;

    return `
    <div class="summary-section">
        <h2>📊 Executive Summary</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>📁 Code Generation</h3>
                <div class="comparison-row">
                    <div class="approach">
                        <div class="approach-name">Cursor Only</div>
                        <div class="approach-metric">${cursor.fileCount} files</div>
                        <div class="approach-time">${cursor.executionTime}ms</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="approach">
                        <div class="approach-name">LocalMCP</div>
                        <div class="approach-metric">${localmcp.fileCount} files</div>
                        <div class="approach-time">${localmcp.executionTime}ms</div>
                    </div>
                </div>
                <div class="improvement">
                    <span class="improvement-label">Improvement:</span>
                    <span class="improvement-value">+${comparison.codeGeneration.improvements.fileCount} files</span>
                </div>
            </div>
            
            <div class="summary-card">
                <h3>🧠 Context Utilization</h3>
                <div class="context-comparison">
                    <div class="context-bar">
                        <div class="context-label">Cursor Only</div>
                        <div class="context-progress">
                            <div class="context-fill cursor" style="width: ${comparison.contextUtilization.cursor}%"></div>
                        </div>
                        <div class="context-value">${comparison.contextUtilization.cursor}%</div>
                    </div>
                    <div class="context-bar">
                        <div class="context-label">LocalMCP</div>
                        <div class="context-progress">
                            <div class="context-fill localmcp" style="width: ${comparison.contextUtilization.localmcp}%"></div>
                        </div>
                        <div class="context-value">${comparison.contextUtilization.localmcp}%</div>
                    </div>
                </div>
                <div class="improvement">
                    <span class="improvement-label">Improvement:</span>
                    <span class="improvement-value">+${comparison.contextUtilization.improvementPercentage}%</span>
                </div>
            </div>
            
            <div class="summary-card">
                <h3>🎯 Key Advantages</h3>
                <ul class="advantages-list">
                    ${comparison.summary.keyAdvantages.map(advantage => `
                        <li class="advantage advantage-${advantage.impact}">
                            <span class="advantage-icon">${this.getAdvantageIcon(advantage.type)}</span>
                            ${advantage.message}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate comparison section
   */
  generateComparison(demoResult) {
    if (demoResult.status !== 'completed') return '';

    const comparison = demoResult.comparison;

    return `
    <div class="comparison-section">
        <h2>🔄 Detailed Comparison</h2>
        <div class="comparison-grid">
            <div class="comparison-card">
                <h3>📊 Code Quality</h3>
                <div class="quality-metrics">
                    <div class="quality-metric">
                        <span class="metric-name">File Count:</span>
                        <span class="metric-value">${comparison.codeGeneration.improvements.fileCount > 0 ? '+' : ''}${comparison.codeGeneration.improvements.fileCount}</span>
                    </div>
                    <div class="quality-metric">
                        <span class="metric-name">Execution Time:</span>
                        <span class="metric-value">${comparison.codeGeneration.improvements.executionTime > 0 ? '+' : ''}${comparison.codeGeneration.improvements.executionTime}ms</span>
                    </div>
                    <div class="quality-metric">
                        <span class="metric-name">Quality Score:</span>
                        <span class="metric-value">${comparison.codeGeneration.improvements.qualityImprovement?.overall || 0}%</span>
                    </div>
                </div>
            </div>
            
            <div class="comparison-card">
                <h3>🔄 Pipeline Coverage</h3>
                ${comparison.pipelineMetrics ? `
                <div class="pipeline-metrics">
                    <div class="pipeline-metric">
                        <span class="metric-name">Coverage:</span>
                        <span class="metric-value">${Math.round(comparison.pipelineMetrics.coverage * 100)}%</span>
                    </div>
                    <div class="pipeline-metric">
                        <span class="metric-name">Efficiency:</span>
                        <span class="metric-value">${Math.round(comparison.pipelineMetrics.efficiency)}%</span>
                    </div>
                    <div class="pipeline-metric">
                        <span class="metric-name">Success Rate:</span>
                        <span class="metric-value">${Math.round(comparison.pipelineMetrics.successRate * 100)}%</span>
                    </div>
                </div>` : '<p>Pipeline metrics not available</p>'}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate code display section
   */
  generateCodeDisplay(demoResult) {
    if (demoResult.status !== 'completed') return '';

    const cursorFiles = demoResult.results?.cursor?.files || [];
    const localmcpFiles = demoResult.results?.localmcp?.files || [];

    return `
    <div class="code-section">
        <h2>💻 Generated Code</h2>
        <div class="code-tabs">
            <button class="tab-button active" onclick="showTab('cursor')">Cursor Only (${cursorFiles.length} files)</button>
            <button class="tab-button" onclick="showTab('localmcp')">LocalMCP (${localmcpFiles.length} files)</button>
        </div>
        
        <div id="cursor-tab" class="tab-content active">
            <div class="file-browser">
                ${cursorFiles.map(file => `
                    <div class="file-item" onclick="showFile('cursor', '${file.name}')">
                        <span class="file-icon">${this.getFileIcon(file.name)}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size || 0)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="code-viewer">
                <div class="code-header">
                    <span class="file-name">Select a file to view</span>
                    <button class="download-btn" onclick="downloadFile('cursor')">Download</button>
                </div>
                <pre class="code-content"><code id="cursor-code">// Select a file from the browser to view its contents</code></pre>
            </div>
        </div>
        
        <div id="localmcp-tab" class="tab-content">
            <div class="file-browser">
                ${localmcpFiles.map(file => `
                    <div class="file-item" onclick="showFile('localmcp', '${file.name}')">
                        <span class="file-icon">${this.getFileIcon(file.name)}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size || 0)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="code-viewer">
                <div class="code-header">
                    <span class="file-name">Select a file to view</span>
                    <button class="download-btn" onclick="downloadFile('localmcp')">Download</button>
                </div>
                <pre class="code-content"><code id="localmcp-code">// Select a file from the browser to view its contents</code></pre>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate validation results section
   */
  generateValidationResults(demoResult) {
    if (demoResult.status !== 'completed') return '';

    const cursorValidation = demoResult.results?.cursor?.contextMetrics;
    const localmcpValidation = demoResult.results?.localmcp?.contextMetrics;

    return `
    <div class="validation-section">
        <h2>✅ Validation Results</h2>
        <div class="validation-grid">
            <div class="validation-card">
                <h3>Cursor Only</h3>
                <div class="validation-metrics">
                    <div class="validation-metric">
                        <span class="metric-name">Context Score:</span>
                        <span class="metric-value">${cursorValidation?.score || 0}%</span>
                    </div>
                    <div class="validation-metric">
                        <span class="metric-name">Patterns Used:</span>
                        <span class="metric-value">${cursorValidation?.patternsUsed || 0}</span>
                    </div>
                    <div class="validation-metric">
                        <span class="metric-name">Conventions:</span>
                        <span class="metric-value">${cursorValidation?.conventionsFollowed || 0}</span>
                    </div>
                </div>
            </div>
            
            <div class="validation-card">
                <h3>LocalMCP</h3>
                <div class="validation-metrics">
                    <div class="validation-metric">
                        <span class="metric-name">Context Score:</span>
                        <span class="metric-value">${localmcpValidation?.score || 0}%</span>
                    </div>
                    <div class="validation-metric">
                        <span class="metric-name">Patterns Used:</span>
                        <span class="metric-value">${localmcpValidation?.patternsUsed || 0}</span>
                    </div>
                    <div class="validation-metric">
                        <span class="metric-name">Conventions:</span>
                        <span class="metric-value">${localmcpValidation?.conventionsFollowed || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate pipeline metrics section
   */
  generatePipelineMetrics(demoResult) {
    if (demoResult.status !== 'completed') return '';

    const pipelineMetrics = demoResult.results?.localmcp?.pipelineMetrics;
    if (!pipelineMetrics) return '';

    return `
    <div class="pipeline-section">
        <h2>🔄 Pipeline Metrics</h2>
        <div class="pipeline-stages">
            ${Object.entries(pipelineMetrics.stageMetrics || {}).map(([stage, metrics]) => `
                <div class="pipeline-stage">
                    <div class="stage-name">${stage}</div>
                    <div class="stage-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${metrics.successRate * 100}%"></div>
                        </div>
                        <div class="stage-metric">${Math.round(metrics.successRate * 100)}%</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="pipeline-summary">
            <div class="summary-metric">
                <span class="metric-name">Overall Coverage:</span>
                <span class="metric-value">${Math.round(pipelineMetrics.overallMetrics?.pipelineCoverage * 100 || 0)}%</span>
            </div>
            <div class="summary-metric">
                <span class="metric-name">Total Execution Time:</span>
                <span class="metric-value">${pipelineMetrics.totalExecutionTime || 0}ms</span>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate footer
   */
  generateFooter(demoResult) {
    return `
    <div class="footer">
        <div class="footer-content">
            <h3>PromptMCP Demo Report</h3>
            <p>Generated on ${new Date(demoResult.timestamp).toLocaleString()}</p>
            <p>Demo ID: ${demoResult.id}</p>
            <p>Scenario: ${demoResult.scenario}</p>
        </div>
        <div class="footer-links">
            <a href="#" onclick="downloadAllFiles()">Download All Files</a>
            <a href="#" onclick="printReport()">Print Report</a>
            <a href="#" onclick="shareReport()">Share Report</a>
        </div>
    </div>`;
  }

  /**
   * Get CSS styles
   */
  getCSS() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333; 
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
        .header-info { display: flex; justify-content: center; gap: 30px; margin-top: 20px; }
        .header-info > div { padding: 10px 20px; background: rgba(255,255,255,0.2); border-radius: 20px; }
        .status.success { background: #28a745; }
        .status.error { background: #dc3545; }
        .metrics-row { display: flex; justify-content: center; gap: 30px; margin-top: 20px; }
        .metric { text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .metric-label { font-size: 0.9em; opacity: 0.9; }
        
        .summary-section, .comparison-section, .code-section, .validation-section, .pipeline-section {
            margin: 40px 0;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 15px;
        }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .summary-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .summary-card h3 { color: #007bff; margin-bottom: 15px; }
        
        .comparison-row { display: flex; align-items: center; gap: 20px; margin: 15px 0; }
        .approach { text-align: center; flex: 1; }
        .approach-name { font-weight: bold; margin-bottom: 5px; }
        .vs { font-weight: bold; color: #666; }
        .improvement { margin-top: 15px; text-align: center; }
        .improvement-value { color: #28a745; font-weight: bold; }
        
        .context-bar { margin: 10px 0; }
        .context-label { font-size: 0.9em; margin-bottom: 5px; }
        .context-progress { height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .context-fill { height: 100%; border-radius: 10px; }
        .context-fill.cursor { background: #ffc107; }
        .context-fill.localmcp { background: #28a745; }
        .context-value { text-align: right; font-size: 0.9em; margin-top: 5px; }
        
        .advantages-list { list-style: none; }
        .advantage { display: flex; align-items: center; margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
        .advantage-high { border-left: 4px solid #28a745; }
        .advantage-medium { border-left: 4px solid #ffc107; }
        .advantage-low { border-left: 4px solid #dc3545; }
        .advantage-icon { margin-right: 10px; font-size: 1.2em; }
        
        .code-tabs { display: flex; margin-bottom: 20px; }
        .tab-button { 
            padding: 10px 20px; 
            border: none; 
            background: #e9ecef; 
            cursor: pointer; 
            border-radius: 5px 5px 0 0; 
            margin-right: 5px; 
        }
        .tab-button.active { background: #007bff; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .file-browser { 
            width: 300px; 
            float: left; 
            background: #f8f9fa; 
            border-radius: 10px; 
            padding: 20px; 
            margin-right: 20px; 
        }
        .file-item { 
            display: flex; 
            align-items: center; 
            padding: 10px; 
            cursor: pointer; 
            border-radius: 5px; 
            margin: 5px 0; 
        }
        .file-item:hover { background: #e9ecef; }
        .file-icon { margin-right: 10px; }
        .file-size { margin-left: auto; font-size: 0.8em; color: #666; }
        
        .code-viewer { 
            overflow: hidden; 
            background: #2d3748; 
            border-radius: 10px; 
            color: white; 
        }
        .code-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 15px 20px; 
            background: #1a202c; 
            border-radius: 10px 10px 0 0; 
        }
        .download-btn { 
            padding: 5px 15px; 
            background: #007bff; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
        }
        .code-content { 
            padding: 20px; 
            overflow-x: auto; 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
        }
        
        .validation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .validation-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .validation-metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; color: #007bff; }
        
        .pipeline-stages { margin: 20px 0; }
        .pipeline-stage { margin: 15px 0; }
        .stage-name { font-weight: bold; margin-bottom: 5px; }
        .stage-progress { display: flex; align-items: center; gap: 10px; }
        .progress-bar { flex: 1; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #28a745; border-radius: 10px; }
        .stage-metric { font-weight: bold; min-width: 50px; text-align: right; }
        
        .footer { 
            margin-top: 40px; 
            padding: 30px; 
            background: #f8f9fa; 
            border-radius: 15px; 
            text-align: center; 
        }
        .footer-content h3 { color: #007bff; margin-bottom: 15px; }
        .footer-links { margin-top: 20px; }
        .footer-links a { 
            margin: 0 15px; 
            color: #007bff; 
            text-decoration: none; 
            padding: 5px 15px; 
            border: 1px solid #007bff; 
            border-radius: 5px; 
        }
        .footer-links a:hover { background: #007bff; color: white; }
        
        @media (max-width: 768px) {
            .container { padding: 20px; }
            .header-info { flex-direction: column; gap: 10px; }
            .metrics-row { flex-direction: column; gap: 15px; }
            .file-browser { width: 100%; float: none; margin-bottom: 20px; }
        }
    `;
  }

  /**
   * Get JavaScript functionality
   */
  getJavaScript() {
    return `
        let currentFiles = {};
        
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            document.querySelector('[onclick="showTab(\\'' + tabName + '\\')"]').classList.add('active');
        }
        
        function showFile(approach, fileName) {
            const codeElement = document.getElementById(approach + '-code');
            const headerElement = document.querySelector('#' + approach + '-tab .file-name');
            
            // In a real implementation, you would load the actual file content
            // For now, we'll show a placeholder
            codeElement.textContent = '// File: ' + fileName + '\\n// Content would be loaded here in a real implementation\\n\\nfunction example() {\\n  console.log("Generated code for " + fileName);\\n}';
            headerElement.textContent = fileName;
        }
        
        function downloadFile(approach) {
            const fileName = document.querySelector('#' + approach + '-tab .file-name').textContent;
            if (fileName === 'Select a file to view') {
                alert('Please select a file first');
                return;
            }
            
            // In a real implementation, you would download the actual file
            alert('Downloading ' + fileName + ' from ' + approach);
        }
        
        function downloadAllFiles() {
            alert('Downloading all generated files as ZIP');
        }
        
        function printReport() {
            window.print();
        }
        
        function shareReport() {
            if (navigator.share) {
                navigator.share({
                    title: 'PromptMCP Demo Report',
                    text: 'Check out this PromptMCP demo report!',
                    url: window.location.href
                });
            } else {
                // Fallback: copy URL to clipboard
                navigator.clipboard.writeText(window.location.href);
                alert('Report URL copied to clipboard');
            }
        }
    `;
  }

  /**
   * Get advantage icon based on type
   */
  getAdvantageIcon(type) {
    const icons = {
      context: '🧠',
      generation: '📝',
      pipeline: '🔄',
      quality: '⭐'
    };
    return icons[type] || '✅';
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      'tsx': '⚛️',
      'ts': '📘',
      'js': '📜',
      'jsx': '⚛️',
      'css': '🎨',
      'html': '🌐',
      'json': '📋',
      'md': '📝',
      'yml': '⚙️',
      'yaml': '⚙️'
    };
    return icons[ext] || '📄';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export { HTMLGenerator };
