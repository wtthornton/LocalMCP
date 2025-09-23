#!/usr/bin/env node

/**
 * Demo Execution Script
 * 
 * This script runs the complete PromptMCP comparison demo, showcasing
 * the difference between Cursor-only and LocalMCP approaches.
 */

import path from 'path';
import { DemoManager } from '../src/demo-manager.js';
import { DemoScenarios } from '../src/scenarios.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DemoExecutor {
  constructor() {
    this.demoManager = new DemoManager({
      demoRoot: path.join(__dirname, '..')
    });
    this.scenarios = new DemoScenarios();
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 PromptMCP Demo Executor');
    console.log('==========================\n');

    try {
      // Parse command line arguments
      const args = this.parseArguments();
      
      // Initialize demo manager
      await this.demoManager.initialize();
      
      if (args.list) {
        await this.listScenarios();
        return;
      }
      
      if (args.scenario) {
        await this.runScenario(args.scenario, args);
      } else {
        await this.runAllScenarios(args);
      }
      
    } catch (error) {
      console.error('❌ Demo execution failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Parse command line arguments
   */
  parseArguments() {
    const args = process.argv.slice(2);
    const options = {
      scenario: null,
      list: false,
      output: 'demo-output',
      verbose: false,
      docker: false
    };

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--scenario':
        case '-s':
          options.scenario = args[++i];
          break;
        case '--list':
        case '-l':
          options.list = true;
          break;
        case '--output':
        case '-o':
          options.output = args[++i];
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--docker':
        case '-d':
          options.docker = true;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return options;
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log(`
🚀 PromptMCP Demo Executor

Usage: node run-demo.js [options]

Options:
  -s, --scenario <name>    Run specific scenario (react-component, api-endpoint, full-stack-app)
  -l, --list              List all available scenarios
  -o, --output <dir>      Output directory for results (default: demo-output)
  -v, --verbose           Enable verbose logging
  -d, --docker            Use Docker MCP server
  -h, --help              Show this help message

Examples:
  node run-demo.js --list
  node run-demo.js --scenario react-component
  node run-demo.js --scenario api-endpoint --docker --verbose
  node run-demo.js --output my-results
    `);
  }

  /**
   * List all available scenarios
   */
  async listScenarios() {
    console.log('📋 Available Demo Scenarios:\n');
    
    const scenarios = this.scenarios.getAllScenarioSummaries();
    
    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.title}`);
      console.log(`   Type: ${scenario.type}`);
      console.log(`   Complexity: ${scenario.complexity}`);
      console.log(`   Estimated Time: ${scenario.estimatedTime}`);
      console.log(`   Expected Files: ${scenario.expectedFiles.cursor} (Cursor) vs ${scenario.expectedFiles.localmcp} (LocalMCP)`);
      console.log(`   Context Requirements: ${scenario.contextRequirements}`);
      console.log(`   Pipeline Stages: ${scenario.pipelineStages}`);
      console.log('');
    });

    const stats = this.scenarios.getScenarioStats();
    console.log('📊 Scenario Statistics:');
    console.log(`   Total Scenarios: ${stats.total}`);
    console.log(`   By Type: ${Object.entries(stats.byType).map(([type, count]) => `${type}(${count})`).join(', ')}`);
    console.log(`   By Complexity: ${Object.entries(stats.byComplexity).map(([complexity, count]) => `${complexity}(${count})`).join(', ')}`);
    console.log(`   Average Files: ${stats.averageFiles.cursor} (Cursor) vs ${stats.averageFiles.localmcp} (LocalMCP)`);
  }

  /**
   * Run a specific scenario
   */
  async runScenario(scenarioName, options) {
    console.log(`🎯 Running scenario: ${scenarioName}\n`);

    // Validate scenario exists
    if (!this.scenarios.hasScenario(scenarioName)) {
      console.error(`❌ Unknown scenario: ${scenarioName}`);
      console.log('Available scenarios:', this.scenarios.getScenarioNames().join(', '));
      return;
    }

    const scenario = this.scenarios.getScenario(scenarioName);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`⏱️  Estimated Time: ${scenario.estimatedTime}`);
    console.log(`🔧 Complexity: ${scenario.complexity}\n`);

    const startTime = Date.now();
    
    try {
      // Run the demo
      const result = await this.demoManager.runDemo(scenarioName, {
        ...options,
        scenario: scenario
      });

      const duration = Date.now() - startTime;
      
      console.log(`\n✅ Demo completed successfully!`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Demo ID: ${result.id}`);
      console.log(`📁 Results saved to: ${options.output}/`);

      // Show quick summary
      this.showDemoSummary(result);

    } catch (error) {
      console.error(`❌ Demo failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run all scenarios
   */
  async runAllScenarios(options) {
    console.log('🎯 Running all demo scenarios\n');

    const scenarioNames = this.scenarios.getScenarioNames();
    const results = [];

    for (const scenarioName of scenarioNames) {
      console.log(`\n📋 Running scenario: ${scenarioName}`);
      console.log('=' .repeat(50));
      
      try {
        const result = await this.demoManager.runDemo(scenarioName, options);
        results.push(result);
        console.log(`✅ ${scenarioName} completed`);
      } catch (error) {
        console.error(`❌ ${scenarioName} failed: ${error.message}`);
        results.push({ scenario: scenarioName, status: 'failed', error: error.message });
      }
    }

    // Show overall summary
    this.showOverallSummary(results);
  }

  /**
   * Show demo summary
   */
  showDemoSummary(result) {
    console.log('\n📊 Demo Summary:');
    console.log('================');
    
    if (result.status === 'completed') {
      const comparison = result.comparison;
      
      console.log(`📁 Files Generated:`);
      console.log(`   Cursor-only: ${comparison.codeGeneration.cursor.fileCount} files`);
      console.log(`   LocalMCP: ${comparison.codeGeneration.localmcp.fileCount} files`);
      console.log(`   Improvement: +${comparison.codeGeneration.improvements.fileCount} files`);
      
      console.log(`\n🧠 Context Utilization:`);
      console.log(`   Cursor-only: ${comparison.contextUtilization.cursor}%`);
      console.log(`   LocalMCP: ${comparison.contextUtilization.localmcp}%`);
      console.log(`   Improvement: +${comparison.contextUtilization.improvementPercentage}%`);
      
      if (comparison.pipelineMetrics) {
        console.log(`\n🔄 Pipeline Coverage:`);
        console.log(`   Coverage: ${Math.round(comparison.pipelineMetrics.coverage * 100)}%`);
        console.log(`   Success Rate: ${Math.round(comparison.pipelineMetrics.successRate * 100)}%`);
      }
      
      console.log(`\n🎯 Overall Improvement: ${comparison.summary.overallImprovement}%`);
      
      if (comparison.summary.keyAdvantages.length > 0) {
        console.log(`\n⭐ Key Advantages:`);
        comparison.summary.keyAdvantages.forEach(advantage => {
          console.log(`   • ${advantage.message}`);
        });
      }
    } else {
      console.log(`❌ Demo failed: ${result.error}`);
    }
  }

  /**
   * Show overall summary for all scenarios
   */
  showOverallSummary(results) {
    console.log('\n🎉 All Demos Complete!');
    console.log('======================');
    
    const completed = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status === 'failed');
    
    console.log(`✅ Completed: ${completed.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📊 Success Rate: ${Math.round((completed.length / results.length) * 100)}%`);
    
    if (completed.length > 0) {
      const avgImprovement = completed.reduce((sum, r) => sum + (r.comparison?.summary?.overallImprovement || 0), 0) / completed.length;
      console.log(`🎯 Average Improvement: ${Math.round(avgImprovement)}%`);
    }
    
    console.log(`\n📁 All results saved to: demo-output/`);
    console.log(`📄 Open demo-output/demo-results.html to view detailed reports`);
  }
}

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const executor = new DemoExecutor();
  executor.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { DemoExecutor };
