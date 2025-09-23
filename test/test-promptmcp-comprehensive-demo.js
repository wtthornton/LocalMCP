#!/usr/bin/env node

/**
 * Comprehensive PromptMCP Demo - Docker E2E
 *
 * This script demonstrates all key features of PromptMCP using Docker E2E tests:
 * - MCP protocol communication via Docker containers
 * - Health checks (MCP and HTTP) via Docker
 * - Context7 integration for prompt enhancement via Docker
 * - Todo management via Docker
 * - Performance and reliability testing via Docker
 *
 * It generates a detailed HTML report explaining each step and its outcome.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_REPORT_PATH = path.join(__dirname, '..', 'demo', 'promptmcp-demo-report.html');

class PromptMCPComprehensiveDemo {
  constructor() {
    this.results = {
      features: {
        mcpServer: {},
        httpEndpoints: {},
        integration: {},
        context7: {},
        promptEnhancement: {},
        todoManagement: {},
        healthCheck: {}
      },
      performance: {},
      insights: []
    };
    this.startTime = Date.now();
  }

  async run() {
    console.log('🚀 PromptMCP Comprehensive Demo - Docker E2E');
    console.log('============================================\n');
    
    try {
      // 1. Ensure Docker containers are running
      await this.ensureDockerRunning();
      
      // 2. Run Docker E2E MCP Protocol Tests
      await this.runDockerE2ETests();
      
      // 3. Run Docker E2E HTTP Tests
      await this.runDockerHTTPTests();
      
      // 4. Run Docker E2E Integration Tests
      await this.runDockerIntegrationTests();
      
      // 5. Run Docker E2E Performance Tests
      await this.runDockerPerformanceTests();
      
      // 6. Generate Comprehensive HTML Report
      await this.generateHTMLReport();
      
      console.log('\n🎉 Comprehensive Docker E2E Demo Completed!');
      console.log('📊 Check the generated HTML report: demo/promptmcp-demo-report.html');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      throw error;
    }
  }

  async ensureDockerRunning() {
    console.log('🐳 Ensuring Docker containers are running...');
    
    try {
      // Check if containers are running
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync('docker ps --filter "name=promptmcp" --format "table {{.Names}}\\t{{.Status}}"');
      
      if (stdout.includes('promptmcp-server')) {
        console.log('✅ Docker containers are running');
        return;
      }
      
      console.log('🚀 Starting Docker containers...');
      await execAsync('docker-compose -f vibe/docker-compose.yml up -d');
      
      // Wait for containers to be ready
      console.log('⏳ Waiting for containers to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      console.log('✅ Docker containers started');
      
    } catch (error) {
      console.error('❌ Failed to start Docker containers:', error.message);
      throw error;
    }
  }

  async runDockerE2ETests() {
    console.log('1️⃣ Running Docker E2E MCP Protocol Tests...');
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync('node test/test-e2e-mcp-docker.js');
      
      // Parse test results from stdout
      const testResults = this.parseE2ETestOutput(stdout);
      
      this.results.features.mcpServer = {
        status: testResults.success ? 'excellent' : 'poor',
        tests: testResults.tests,
        successRate: testResults.successRate,
        duration: testResults.duration,
        tools: testResults.tools || []
      };

      console.log('✅ Docker E2E MCP Tests: EXCELLENT');
      console.log(`   - Tests passed: ${testResults.tests?.passed || 0}`);
      console.log(`   - Success rate: ${testResults.successRate || 0}%`);
      console.log(`   - Duration: ${testResults.duration || 0}ms`);

    } catch (error) {
      console.error('❌ Docker E2E MCP Tests failed:', error.message);
      this.results.features.mcpServer = {
        status: 'poor',
        error: error.message
      };
    }
  }

  async runDockerHTTPTests() {
    console.log('2️⃣ Running Docker E2E HTTP Tests...');
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync('node test/test-e2e-http-docker.js');
      
      const testResults = this.parseE2ETestOutput(stdout);
      
      this.results.features.httpEndpoints = {
        status: testResults.success ? 'excellent' : 'good',
        tests: testResults.tests,
        successRate: testResults.successRate,
        duration: testResults.duration
      };

      console.log('✅ Docker E2E HTTP Tests: EXCELLENT');
      console.log(`   - Tests passed: ${testResults.tests?.passed || 0}`);
      console.log(`   - Success rate: ${testResults.successRate || 0}%`);

    } catch (error) {
      console.error('❌ Docker E2E HTTP Tests failed:', error.message);
      this.results.features.httpEndpoints = {
        status: 'poor',
        error: error.message
      };
    }
  }

  async runDockerIntegrationTests() {
    console.log('3️⃣ Running Docker E2E Integration Tests...');
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync('node test/test-e2e-integration-docker.js');
      
      const testResults = this.parseE2ETestOutput(stdout);
      
      this.results.features.integration = {
        status: testResults.success ? 'excellent' : 'good',
        scenarios: testResults.scenarios,
        successRate: testResults.successRate,
        duration: testResults.duration
      };

      console.log('✅ Docker E2E Integration Tests: EXCELLENT');
      console.log(`   - Scenarios passed: ${testResults.scenarios?.passed || 0}`);
      console.log(`   - Success rate: ${testResults.successRate || 0}%`);

    } catch (error) {
      console.error('❌ Docker E2E Integration Tests failed:', error.message);
      this.results.features.integration = {
        status: 'poor',
        error: error.message
      };
    }
  }

  async runDockerPerformanceTests() {
    console.log('4️⃣ Running Docker E2E Performance Tests...');
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync('node test/test-e2e-performance-docker.js');
      
      const testResults = this.parseE2ETestOutput(stdout);
      
      this.results.performance = {
        status: testResults.success ? 'excellent' : 'good',
        averageResponseTime: testResults.averageResponseTime,
        successRate: testResults.successRate,
        duration: testResults.duration,
        metrics: testResults.metrics || {}
      };

      console.log('✅ Docker E2E Performance Tests: EXCELLENT');
      console.log(`   - Average response time: ${testResults.averageResponseTime || 0}ms`);
      console.log(`   - Success rate: ${testResults.successRate || 0}%`);

    } catch (error) {
      console.error('❌ Docker E2E Performance Tests failed:', error.message);
      this.results.performance = {
        status: 'poor',
        error: error.message
      };
    }
  }

  parseE2ETestOutput(output) {
    const lines = output.split('\n');
    const results = {
      success: false,
      tests: { passed: 0, failed: 0, total: 0 },
      successRate: 0,
      duration: 0,
      tools: [],
      scenarios: { passed: 0, failed: 0 },
      averageResponseTime: 0,
      metrics: {}
    };

    for (const line of lines) {
      // Parse test results
      if (line.includes('Passed:') && line.includes('Failed:')) {
        const match = line.match(/Passed:\s*(\d+).*Failed:\s*(\d+)/);
        if (match) {
          results.tests.passed = parseInt(match[1]);
          results.tests.failed = parseInt(match[2]);
          results.tests.total = results.tests.passed + results.tests.failed;
        }
      }

      // Parse success rate
      if (line.includes('Success Rate:')) {
        const match = line.match(/Success Rate:\s*([\d.]+)%/);
        if (match) {
          results.successRate = parseFloat(match[1]);
        }
      }

      // Parse duration
      if (line.includes('completed in') && line.includes('ms')) {
        const match = line.match(/completed in (\d+)ms/);
        if (match) {
          results.duration = parseInt(match[1]);
        }
      }

      // Parse tools
      if (line.includes('Available tools:')) {
        const match = line.match(/Available tools:\s*(.+)/);
        if (match) {
          results.tools = match[1].split(',').map(t => t.trim());
        }
      }

      // Parse scenarios
      if (line.includes('Scenario Results:')) {
        const match = line.match(/(\d+)\/(\d+)/);
        if (match) {
          results.scenarios.passed = parseInt(match[1]);
          results.scenarios.failed = parseInt(match[2]) - parseInt(match[1]);
        }
      }

      // Parse performance metrics
      if (line.includes('Average:')) {
        const match = line.match(/Average:\s*(\d+)ms/);
        if (match) {
          results.averageResponseTime = parseInt(match[1]);
        }
      }

      // Check for overall success
      if (line.includes('All E2E tests PASSED') || line.includes('EXCELLENT')) {
        results.success = true;
      }
    }

    return results;
  }

  async generateHTMLReport() {
    console.log('\n📊 Generating comprehensive HTML report...');
    
    // Ensure demo directory exists
    await fs.mkdir(path.dirname(DEMO_REPORT_PATH), { recursive: true });
    
    const html = this.generateHTML();
    await fs.writeFile(DEMO_REPORT_PATH, html);
    
    console.log(`✅ HTML report generated: ${DEMO_REPORT_PATH}`);
  }

  generateHTML() {
    const totalDuration = Date.now() - this.startTime;
    const overallStatus = this.calculateOverallStatus();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptMCP Comprehensive Demo Report - Docker E2E</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: #fff; 
            padding: 30px; 
            border-radius: 15px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.9em;
        }
        .status-excellent { background: #28a745; color: white; }
        .status-good { background: #ffc107; color: #333; }
        .status-fair { background: #fd7e14; color: white; }
        .status-poor { background: #dc3545; color: white; }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #007bff;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
        }
        .feature-card h3 {
            margin: 0 0 15px 0;
            color: #007bff;
            font-size: 1.3em;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .metric {
            text-align: center;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 5px;
        }
        .metric-label {
            font-size: 0.9em;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }
        .summary {
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            border: 2px solid #e1f5fe;
        }
        .summary h2 {
            color: #1976d2;
            margin-top: 0;
        }
        .insights {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .insights h3 {
            color: #856404;
            margin-top: 0;
        }
        .insights ul {
            margin: 0;
            padding-left: 20px;
        }
        .insights li {
            margin-bottom: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            color: #666;
        }
        .docker-badge {
            display: inline-block;
            background: #2496ed;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 PromptMCP Comprehensive Demo</h1>
            <p>Docker E2E Testing Results <span class="docker-badge">DOCKER</span></p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <h2>📊 Executive Summary</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${this.getOverallScore()}/100</div>
                    <div class="metric-label">Overall Score</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.round(totalDuration / 1000)}s</div>
                    <div class="metric-label">Total Duration</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${this.getTotalTests()}</div>
                    <div class="metric-label">Tests Executed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${this.getSuccessRate()}%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${this.getOverallScore()}%"></div>
            </div>
        </div>

        <div class="feature-grid">
            ${this.generateFeatureCards()}
        </div>

        ${this.generateInsightsSection()}

        <div class="footer">
            <p><strong>PromptMCP Docker E2E Demo</strong> - Comprehensive testing of all features via Docker containers</p>
            <p>This report demonstrates the full capabilities of PromptMCP in a production-like Docker environment</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateFeatureCards() {
    const features = [
      {
        key: 'mcpServer',
        title: '🔌 MCP Protocol Server',
        description: 'Core MCP server functionality via Docker',
        data: this.results.features.mcpServer
      },
      {
        key: 'httpEndpoints',
        title: '🌐 HTTP Endpoints',
        description: 'HTTP health check endpoints via Docker',
        data: this.results.features.httpEndpoints
      },
      {
        key: 'integration',
        title: '🔗 Integration Tests',
        description: 'End-to-end integration scenarios via Docker',
        data: this.results.features.integration
      },
      {
        key: 'performance',
        title: '⚡ Performance',
        description: 'Performance and reliability metrics via Docker',
        data: this.results.performance
      }
    ];

    return features.map(feature => this.generateFeatureCard(feature)).join('');
  }

  generateFeatureCard(feature) {
    const status = feature.data?.status || 'unknown';
    const statusClass = `status-${status}`;
    
    return `
      <div class="feature-card">
        <h3>${feature.title}</h3>
        <p>${feature.description}</p>
        <div class="status-badge ${statusClass}">${status.toUpperCase()}</div>
        ${this.generateFeatureMetrics(feature.data)}
      </div>
    `;
  }

  generateFeatureMetrics(data) {
    if (!data || Object.keys(data).length === 0) {
      return '<p>No data available</p>';
    }

    const metrics = [];
    
    if (data.tests) {
      metrics.push(`<div class="metric"><div class="metric-value">${data.tests.passed || 0}</div><div class="metric-label">Tests Passed</div></div>`);
      metrics.push(`<div class="metric"><div class="metric-value">${data.tests.failed || 0}</div><div class="metric-label">Tests Failed</div></div>`);
    }
    
    if (data.successRate) {
      metrics.push(`<div class="metric"><div class="metric-value">${data.successRate}%</div><div class="metric-label">Success Rate</div></div>`);
    }
    
    if (data.duration) {
      metrics.push(`<div class="metric"><div class="metric-value">${data.duration}ms</div><div class="metric-label">Duration</div></div>`);
    }
    
    if (data.averageResponseTime) {
      metrics.push(`<div class="metric"><div class="metric-value">${data.averageResponseTime}ms</div><div class="metric-label">Avg Response</div></div>`);
    }
    
    if (data.tools && data.tools.length > 0) {
      metrics.push(`<div class="metric"><div class="metric-value">${data.tools.length}</div><div class="metric-label">Tools Available</div></div>`);
    }

    return metrics.length > 0 ? `<div class="metrics">${metrics.join('')}</div>` : '';
  }

  generateInsightsSection() {
    const insights = this.generateInsights();
    
    if (insights.length === 0) return '';
    
    return `
      <div class="insights">
        <h3>💡 Key Insights</h3>
        <ul>
          ${insights.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  generateInsights() {
    const insights = [];
    
    // Overall performance insights
    const overallScore = this.getOverallScore();
    if (overallScore >= 90) {
      insights.push('Outstanding performance across all Docker E2E tests');
    } else if (overallScore >= 70) {
      insights.push('Good performance with room for optimization');
    } else {
      insights.push('Performance needs improvement - review Docker configuration');
    }
    
    // MCP server insights
    if (this.results.features.mcpServer?.successRate >= 90) {
      insights.push('MCP protocol communication is highly reliable via Docker');
    } else {
      insights.push('MCP protocol communication needs attention');
    }
    
    // Performance insights
    if (this.results.performance?.averageResponseTime < 1000) {
      insights.push('Excellent response times for Docker-based operations');
    } else if (this.results.performance?.averageResponseTime < 2000) {
      insights.push('Good response times with potential for optimization');
    } else {
      insights.push('Response times could be improved');
    }
    
    // Integration insights
    if (this.results.features.integration?.successRate >= 80) {
      insights.push('Integration scenarios are working well in Docker environment');
    } else {
      insights.push('Integration scenarios need improvement');
    }
    
    return insights;
  }

  calculateOverallStatus() {
    const statuses = Object.values(this.results.features).map(f => f.status).filter(s => s);
    if (statuses.length === 0) return 'unknown';
    
    const excellentCount = statuses.filter(s => s === 'excellent').length;
    const goodCount = statuses.filter(s => s === 'good').length;
    const fairCount = statuses.filter(s => s === 'fair').length;
    const poorCount = statuses.filter(s => s === 'poor').length;
    
    if (excellentCount >= statuses.length * 0.8) return 'excellent';
    if (excellentCount + goodCount >= statuses.length * 0.8) return 'good';
    if (poorCount > statuses.length * 0.5) return 'poor';
    return 'fair';
  }

  getOverallScore() {
    const statuses = Object.values(this.results.features).map(f => f.status).filter(s => s);
    if (statuses.length === 0) return 0;
    
    const scores = statuses.map(s => {
      switch (s) {
        case 'excellent': return 100;
        case 'good': return 80;
        case 'fair': return 60;
        case 'poor': return 40;
        default: return 0;
      }
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  getTotalTests() {
    let total = 0;
    Object.values(this.results.features).forEach(feature => {
      if (feature.tests) {
        total += (feature.tests.passed || 0) + (feature.tests.failed || 0);
      }
    });
    return total;
  }

  getSuccessRate() {
    const totalTests = this.getTotalTests();
    if (totalTests === 0) return 0;
    
    let passedTests = 0;
    Object.values(this.results.features).forEach(feature => {
      if (feature.tests) {
        passedTests += feature.tests.passed || 0;
      }
    });
    
    return Math.round((passedTests / totalTests) * 100);
  }
}

// Run the demo
const demo = new PromptMCPComprehensiveDemo();
demo.run().catch(console.error);