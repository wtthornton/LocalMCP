#!/usr/bin/env node

/**
 * Simple Demo Script
 * 
 * This is a simplified version of the demo script that works without
 * complex dependencies, focusing on the core demo functionality.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleDemoExecutor {
  constructor() {
    this.scenarios = {
      'react-component': {
        name: 'react-component',
        title: 'React Component Generation',
        description: 'Generate a reusable Button component with TypeScript, Tailwind CSS, tests, and Storybook stories',
        type: 'component',
        complexity: 'medium',
        estimatedTime: '2-3 minutes',
        expectedFiles: {
          cursor: ['Button.tsx', 'Button.css', 'index.ts'],
          localmcp: ['Button.tsx', 'button-variants.ts', 'Button.stories.tsx', 'Button.test.tsx', 'index.ts']
        }
      },
      'api-endpoint': {
        name: 'api-endpoint',
        title: 'API Endpoint Generation',
        description: 'Generate a user registration API endpoint with validation, authentication, error handling, and comprehensive testing',
        type: 'api',
        complexity: 'high',
        estimatedTime: '3-4 minutes',
        expectedFiles: {
          cursor: ['user-registration.ts', 'types.ts'],
          localmcp: ['user-registration.controller.ts', 'user-registration.routes.ts', 'user-registration.types.ts', 'user-registration.test.ts', 'validation.schemas.ts']
        }
      },
      'full-stack-app': {
        name: 'full-stack-app',
        title: 'Full Stack Application Generation',
        description: 'Generate a complete todo application with React frontend, Node.js backend, database integration, and full project structure',
        type: 'application',
        complexity: 'high',
        estimatedTime: '4-5 minutes',
        expectedFiles: {
          cursor: ['package.json', 'server.js', 'client/index.html', 'client/app.js'],
          localmcp: ['package.json', 'src/server/index.ts', 'src/server/routes/todos.ts', 'client/src/App.tsx', 'client/src/components/TodoList.tsx', 'docker-compose.yml', 'README.md']
        }
      }
    };
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 PromptMCP Simple Demo Executor');
    console.log('==================================\n');

    try {
      // Parse command line arguments
      const args = this.parseArguments();
      
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
🚀 PromptMCP Simple Demo Executor

Usage: node simple-demo.js [options]

Options:
  -s, --scenario <name>    Run specific scenario (react-component, api-endpoint, full-stack-app)
  -l, --list              List all available scenarios
  -o, --output <dir>      Output directory for results (default: demo-output)
  -v, --verbose           Enable verbose logging
  -d, --docker            Use Docker MCP server
  -h, --help              Show this help message

Examples:
  node simple-demo.js --list
  node simple-demo.js --scenario react-component
  node simple-demo.js --scenario api-endpoint --docker --verbose
    `);
  }

  /**
   * List all available scenarios
   */
  async listScenarios() {
    console.log('📋 Available Demo Scenarios:\n');
    
    const scenarios = Object.values(this.scenarios);
    
    scenarios.forEach((scenario, index) => {
      console.log(`${index + 1}. ${scenario.title}`);
      console.log(`   Type: ${scenario.type}`);
      console.log(`   Complexity: ${scenario.complexity}`);
      console.log(`   Estimated Time: ${scenario.estimatedTime}`);
      console.log(`   Expected Files: ${scenario.expectedFiles.cursor.length} (Cursor) vs ${scenario.expectedFiles.localmcp.length} (LocalMCP)`);
      console.log(`   Description: ${scenario.description}`);
      console.log('');
    });

    console.log('📊 Scenario Statistics:');
    console.log(`   Total Scenarios: ${scenarios.length}`);
    console.log(`   By Type: ${this.groupBy(scenarios, 'type').map(([type, items]) => `${type}(${items.length})`).join(', ')}`);
    console.log(`   By Complexity: ${this.groupBy(scenarios, 'complexity').map(([complexity, items]) => `${complexity}(${items.length})`).join(', ')}`);
    
    const avgCursorFiles = Math.round(scenarios.reduce((sum, s) => sum + s.expectedFiles.cursor.length, 0) / scenarios.length);
    const avgLocalmcpFiles = Math.round(scenarios.reduce((sum, s) => sum + s.expectedFiles.localmcp.length, 0) / scenarios.length);
    console.log(`   Average Files: ${avgCursorFiles} (Cursor) vs ${avgLocalmcpFiles} (LocalMCP)`);
  }

  /**
   * Run a specific scenario
   */
  async runScenario(scenarioName, options) {
    console.log(`🎯 Running scenario: ${scenarioName}\n`);

    const scenario = this.scenarios[scenarioName];
    if (!scenario) {
      console.error(`❌ Unknown scenario: ${scenarioName}`);
      console.log('Available scenarios:', Object.keys(this.scenarios).join(', '));
      return;
    }

    console.log(`📝 Description: ${scenario.description}`);
    console.log(`⏱️  Estimated Time: ${scenario.estimatedTime}`);
    console.log(`🔧 Complexity: ${scenario.complexity}\n`);

    const startTime = Date.now();
    
    try {
      // Simulate demo execution
      console.log('🔄 Simulating Cursor-only approach...');
      await this.sleep(1000);
      
      console.log('🔄 Simulating LocalMCP approach...');
      await this.sleep(1500);
      
      const duration = Date.now() - startTime;
      
      // Generate mock results
      const result = this.generateMockResult(scenario, duration, options);
      
      console.log(`\n✅ Demo completed successfully!`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 Demo ID: ${result.id}`);
      console.log(`📁 Results would be saved to: ${options.output}/`);

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

    const scenarioNames = Object.keys(this.scenarios);
    const results = [];

    for (const scenarioName of scenarioNames) {
      console.log(`\n📋 Running scenario: ${scenarioName}`);
      console.log('=' .repeat(50));
      
      try {
        const scenario = this.scenarios[scenarioName];
        console.log(`📝 Description: ${scenario.description}`);
        console.log(`⏱️  Estimated Time: ${scenario.estimatedTime}`);
        
        const startTime = Date.now();
        await this.sleep(2000); // Simulate execution time
        const duration = Date.now() - startTime;
        
        const result = this.generateMockResult(scenario, duration, options);
        results.push(result);
        console.log(`✅ ${scenarioName} completed in ${duration}ms`);
      } catch (error) {
        console.error(`❌ ${scenarioName} failed: ${error.message}`);
        results.push({ scenario: scenarioName, status: 'failed', error: error.message });
      }
    }

    // Show overall summary
    this.showOverallSummary(results);
  }

  /**
   * Generate mock demo result
   */
  generateMockResult(scenario, duration, options) {
    const cursorFiles = scenario.expectedFiles.cursor;
    const localmcpFiles = scenario.expectedFiles.localmcp;
    
    return {
      id: `demo-${Date.now()}`,
      scenario: scenario.name,
      timestamp: new Date().toISOString(),
      duration: duration,
      status: 'completed',
      results: {
        cursor: {
          files: cursorFiles.map(name => ({ name, size: Math.floor(Math.random() * 5000) + 500 })),
          executionTime: Math.floor(duration * 0.4),
          quality: { fileCount: cursorFiles.length, hasTests: false, hasTypes: true }
        },
        localmcp: {
          files: localmcpFiles.map(name => ({ name, size: Math.floor(Math.random() * 8000) + 1000 })),
          executionTime: Math.floor(duration * 0.6),
          quality: { fileCount: localmcpFiles.length, hasTests: true, hasTypes: true }
        }
      },
      comparison: {
        codeGeneration: {
          cursor: { fileCount: cursorFiles.length, executionTime: Math.floor(duration * 0.4) },
          localmcp: { fileCount: localmcpFiles.length, executionTime: Math.floor(duration * 0.6) },
          improvements: { 
            fileCount: localmcpFiles.length - cursorFiles.length,
            executionTime: Math.floor(duration * 0.2)
          }
        },
        contextUtilization: {
          cursor: 25 + Math.floor(Math.random() * 15),
          localmcp: 75 + Math.floor(Math.random() * 20),
          improvementPercentage: 50 + Math.floor(Math.random() * 30)
        },
        summary: {
          overallImprovement: 60 + Math.floor(Math.random() * 25),
          keyAdvantages: [
            { type: 'context', message: 'Significantly better context utilization (+65%)', impact: 'high' },
            { type: 'generation', message: `Generated ${localmcpFiles.length - cursorFiles.length} more files with better structure`, impact: 'medium' },
            { type: 'quality', message: 'Improved code quality with tests and proper typing', impact: 'high' }
          ]
        }
      }
    };
  }

  /**
   * Show demo summary
   */
  showDemoSummary(result) {
    console.log('\n📊 Demo Summary:');
    console.log('================');
    
    const comparison = result.comparison;
    const cursor = comparison.codeGeneration.cursor;
    const localmcp = comparison.codeGeneration.localmcp;

    console.log(`📁 Files Generated:`);
    console.log(`   Cursor-only: ${cursor.fileCount} files`);
    console.log(`   LocalMCP: ${localmcp.fileCount} files`);
    console.log(`   Improvement: +${comparison.codeGeneration.improvements.fileCount} files`);
    
    console.log(`\n🧠 Context Utilization:`);
    console.log(`   Cursor-only: ${comparison.contextUtilization.cursor}%`);
    console.log(`   LocalMCP: ${comparison.contextUtilization.localmcp}%`);
    console.log(`   Improvement: +${comparison.contextUtilization.improvementPercentage}%`);
    
    console.log(`\n🎯 Overall Improvement: ${comparison.summary.overallImprovement}%`);
    
    if (comparison.summary.keyAdvantages.length > 0) {
      console.log(`\n⭐ Key Advantages:`);
      comparison.summary.keyAdvantages.forEach(advantage => {
        console.log(`   • ${advantage.message}`);
      });
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
    
    console.log(`\n📁 All results would be saved to: demo-output/`);
    console.log(`📄 HTML reports would be generated for each demo`);
  }

  /**
   * Utility function to group array by property
   */
  groupBy(array, property) {
    const groups = {};
    array.forEach(item => {
      const key = item[property];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the demo if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const executor = new SimpleDemoExecutor();
  executor.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { SimpleDemoExecutor };
