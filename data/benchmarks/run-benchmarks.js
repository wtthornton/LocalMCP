#!/usr/bin/env node

/**
 * Benchmark Runner Script
 * 
 * This script runs all benchmarks and generates comparison reports.
 * It can be run repeatedly to track improvements over time.
 * 
 * Usage: 
 *   node run-benchmarks.js                    # Run all benchmarks
 *   node run-benchmarks.js --quick           # Run quick benchmarks only
 *   node run-benchmarks.js --compare         # Run benchmarks and compare with previous
 *   node run-benchmarks.js --context7-only   # Run Context7 benchmarks only
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BenchmarkRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testType: 'Comprehensive Benchmark Suite',
      version: '1.0.0',
      benchmarks: [],
      summary: {},
      recommendations: []
    };
  }

  async runBenchmarks(options = {}) {
    console.log('🚀 PromptMCP Benchmark Suite');
    console.log('=' .repeat(60));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Options: ${JSON.stringify(options)}`);
    console.log('');

    const startTime = Date.now();

    try {
      // Run general benchmark
      if (!options.context7Only) {
        console.log('🔬 Running General Benchmark...');
        await this.runBenchmark('benchmark-repeatable.js', 'General Benchmark');
      }

      // Run Context7 benchmark
      if (!options.quick) {
        console.log('🔬 Running Context7 Benchmark...');
        await this.runBenchmark('context7-benchmark.js', 'Context7 Benchmark');
      }

      // Run comparison if requested
      if (options.compare) {
        console.log('📊 Running Benchmark Comparison...');
        await this.runBenchmark('benchmark-comparison.js', 'Benchmark Comparison');
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      this.results.summary = {
        totalBenchmarks: this.results.benchmarks.length,
        totalTime: totalTime,
        averageTime: totalTime / this.results.benchmarks.length,
        successRate: (this.results.benchmarks.filter(b => b.status === 'SUCCESS').length / this.results.benchmarks.length) * 100
      };

      this.generateRecommendations();
      this.saveResults();
      this.displayResults();

    } catch (error) {
      console.log(`❌ Benchmark suite failed: ${error.message}`);
      process.exit(1);
    }
  }

  async runBenchmark(scriptName, benchmarkName) {
    return new Promise((resolve, reject) => {
      console.log(`  Running ${scriptName}...`);
      
      const startTime = Date.now();
      const child = spawn('node', [scriptName], {
        cwd: __dirname,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
          name: benchmarkName,
          script: scriptName,
          status: code === 0 ? 'SUCCESS' : 'FAILED',
          duration: duration,
          exitCode: code,
          stdout: stdout,
          stderr: stderr,
          timestamp: new Date().toISOString()
        };

        this.results.benchmarks.push(result);

        if (code === 0) {
          console.log(`  ✅ ${benchmarkName} completed in ${duration}ms`);
        } else {
          console.log(`  ❌ ${benchmarkName} failed with exit code ${code}`);
          console.log(`  Error: ${stderr}`);
        }

        resolve(result);
      });

      child.on('error', (error) => {
        console.log(`  ❌ ${benchmarkName} failed to start: ${error.message}`);
        reject(error);
      });
    });
  }

  generateRecommendations() {
    this.results.recommendations = [];

    // Analyze benchmark results
    const failedBenchmarks = this.results.benchmarks.filter(b => b.status === 'FAILED');
    if (failedBenchmarks.length > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'Benchmark Failures',
        recommendation: 'Fix failed benchmarks immediately',
        details: failedBenchmarks.map(b => `${b.name}: ${b.stderr}`)
      });
    }

    // Check for performance issues
    const slowBenchmarks = this.results.benchmarks.filter(b => b.duration > 30000); // 30 seconds
    if (slowBenchmarks.length > 0) {
      this.results.recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        recommendation: 'Optimize slow benchmarks',
        details: slowBenchmarks.map(b => `${b.name}: ${b.duration}ms`)
      });
    }

    // Check for Context7 specific issues
    const context7Benchmark = this.results.benchmarks.find(b => b.name === 'Context7 Benchmark');
    if (context7Benchmark && context7Benchmark.status === 'SUCCESS') {
      // Parse Context7 results if available
      const context7Results = this.parseContext7Results(context7Benchmark.stdout);
      if (context7Results) {
        if (context7Results.criticalIssues && context7Results.criticalIssues.length > 0) {
          this.results.recommendations.push({
            priority: 'HIGH',
            category: 'Context7 Issues',
            recommendation: 'Address Context7 critical issues',
            details: context7Results.criticalIssues.map(issue => issue.issue)
          });
        }
      }
    }

    // General recommendations
    this.results.recommendations.push({
      priority: 'LOW',
      category: 'Maintenance',
      recommendation: 'Run benchmarks regularly to track improvements',
      details: ['Schedule daily benchmark runs', 'Monitor trends over time', 'Set up alerts for failures']
    });
  }

  parseContext7Results(stdout) {
    try {
      // Try to extract JSON from stdout
      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-suite-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Benchmark suite results saved to: ${filename}`);
  }

  displayResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 BENCHMARK SUITE RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`Total Benchmarks: ${this.results.summary.totalBenchmarks}`);
    console.log(`Total Time: ${this.results.summary.totalTime}ms`);
    console.log(`Average Time: ${this.results.summary.averageTime.toFixed(0)}ms`);
    console.log(`Success Rate: ${this.results.summary.successRate.toFixed(1)}%`);
    
    console.log('\n📈 BENCHMARK DETAILS:');
    this.results.benchmarks.forEach((benchmark, index) => {
      console.log(`${index + 1}. ${benchmark.name}:`);
      console.log(`   Status: ${benchmark.status}`);
      console.log(`   Duration: ${benchmark.duration}ms`);
      console.log(`   Script: ${benchmark.script}`);
      if (benchmark.status === 'FAILED') {
        console.log(`   Error: ${benchmark.stderr}`);
      }
      console.log('');
    });
    
    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.recommendation}`);
        console.log(`   Category: ${rec.category}`);
        rec.details.forEach(detail => {
          console.log(`   - ${detail}`);
        });
        console.log('');
      });
    }
    
    console.log('=' .repeat(60));
    console.log('🎯 BENCHMARK SUITE COMPLETE');
    console.log('=' .repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  args.forEach(arg => {
    if (arg === '--quick') {
      options.quick = true;
    } else if (arg === '--compare') {
      options.compare = true;
    } else if (arg === '--context7-only') {
      options.context7Only = true;
    }
  });
  
  const runner = new BenchmarkRunner();
  await runner.runBenchmarks(options);
}

// Run the benchmark suite
main().catch(console.error);
