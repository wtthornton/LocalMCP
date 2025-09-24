#!/usr/bin/env node

/**
 * PromptMCP Test and Report Generator
 * 
 * Runs tests and automatically generates HTML reports.
 * 
 * Usage:
 *   node scripts/test-and-report.js [test-type]
 * 
 * Examples:
 *   node scripts/test-and-report.js e2e
 *   node scripts/test-and-report.js quality
 */

import { spawn } from 'child_process';
import { generateHTMLReport, findLatestResultsFile, loadTestResults } from './generate-test-report.js';

const TEST_COMMANDS = {
  e2e: 'node test/test-mcp-e2e-docker.js',
  quality: 'node test/benchmark-quality-comprehensive.js'
};

async function runTest(testType) {
  return new Promise((resolve, reject) => {
    console.log(`🧪 Running ${testType} tests...`);
    
    const command = TEST_COMMANDS[testType];
    if (!command) {
      reject(new Error(`Unknown test type: ${testType}. Supported types: ${Object.keys(TEST_COMMANDS).join(', ')}`));
      return;
    }

    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, { 
      stdio: 'inherit',
      shell: true 
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testType} tests completed successfully`);
        resolve();
      } else {
        reject(new Error(`${testType} tests failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Failed to run ${testType} tests: ${error.message}`));
    });
  });
}

async function generateReport(testType) {
  try {
    console.log(`📊 Generating ${testType} test report...`);
    
    const filePath = findLatestResultsFile(testType);
    console.log(`📄 Using results file: ${filePath}`);
    
    const results = loadTestResults(filePath);
    console.log(`📊 Loaded ${(results.results || results.tests || []).length} test results`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputFile = `promptmcp-${testType}-test-report-${timestamp}.html`;
    
    generateHTMLReport(testType, results, outputFile);
    
    console.log(`✅ HTML report generated: ${outputFile}`);
    console.log(`🌐 Open in browser: file://${path.resolve(outputFile)}`);
    
    return outputFile;
  } catch (error) {
    console.error(`❌ Failed to generate report: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    const testType = process.argv[2] || 'e2e';
    
    console.log(`🚀 Starting ${testType} test and report generation...`);
    console.log('=' .repeat(60));
    
    // Run tests
    await runTest(testType);
    
    console.log('=' .repeat(60));
    
    // Generate report
    const reportFile = await generateReport(testType);
    
    console.log('=' .repeat(60));
    console.log(`🎉 Complete! Test report available at: ${reportFile}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
