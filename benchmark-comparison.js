#!/usr/bin/env node

/**
 * Benchmark Comparison Tool
 * 
 * This tool compares benchmark results over time and generates
 * improvement reports.
 * 
 * Usage: node benchmark-comparison.js [--type=all|general|context7] [--days=7]
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BenchmarkComparison {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      comparisonType: 'Benchmark Comparison Report',
      version: '1.0.0',
      comparisons: [],
      summary: {},
      trends: {},
      recommendations: []
    };
  }

  async runComparison(options = {}) {
    const type = options.type || 'all';
    const days = options.days || 7;
    
    console.log('📊 Benchmark Comparison Tool');
    console.log('=' .repeat(60));
    console.log(`Type: ${type}`);
    console.log(`Days: ${days}`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('');

    if (type === 'all' || type === 'general') {
      await this.compareGeneralBenchmarks(days);
    }
    
    if (type === 'all' || type === 'context7') {
      await this.compareContext7Benchmarks(days);
    }

    this.generateSummary();
    this.identifyTrends();
    this.generateRecommendations();
    this.saveResults();
    this.displayResults();
  }

  async compareGeneralBenchmarks(days) {
    console.log('🔬 Comparing General Benchmarks...');
    
    const benchmarkFiles = this.findBenchmarkFiles('promptmcp-benchmark', days);
    if (benchmarkFiles.length < 2) {
      console.log('⚠️ Not enough general benchmark files found for comparison');
      return;
    }

    const latest = this.loadBenchmarkFile(benchmarkFiles[benchmarkFiles.length - 1]);
    const previous = this.loadBenchmarkFile(benchmarkFiles[benchmarkFiles.length - 2]);

    if (!latest || !previous) {
      console.log('❌ Error loading benchmark files');
      return;
    }

    const comparison = {
      type: 'General Benchmark',
      latest: latest.timestamp,
      previous: previous.timestamp,
      improvements: this.calculateGeneralImprovements(latest, previous),
      criticalIssues: this.compareCriticalIssues(latest, previous)
    };

    this.results.comparisons.push(comparison);
    console.log(`✅ Compared ${latest.timestamp} vs ${previous.timestamp}`);
  }

  async compareContext7Benchmarks(days) {
    console.log('🔬 Comparing Context7 Benchmarks...');
    
    const benchmarkFiles = this.findBenchmarkFiles('context7-benchmark', days);
    if (benchmarkFiles.length < 2) {
      console.log('⚠️ Not enough Context7 benchmark files found for comparison');
      return;
    }

    const latest = this.loadBenchmarkFile(benchmarkFiles[benchmarkFiles.length - 1]);
    const previous = this.loadBenchmarkFile(benchmarkFiles[benchmarkFiles.length - 2]);

    if (!latest || !previous) {
      console.log('❌ Error loading Context7 benchmark files');
      return;
    }

    const comparison = {
      type: 'Context7 Benchmark',
      latest: latest.timestamp,
      previous: previous.timestamp,
      improvements: this.calculateContext7Improvements(latest, previous),
      criticalIssues: this.compareCriticalIssues(latest, previous)
    };

    this.results.comparisons.push(comparison);
    console.log(`✅ Compared ${latest.timestamp} vs ${previous.timestamp}`);
  }

  findBenchmarkFiles(prefix, days) {
    const files = [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    try {
      const dirFiles = readdirSync(__dirname);
      const benchmarkFiles = dirFiles
        .filter(file => file.startsWith(prefix) && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(__dirname, file),
          timestamp: this.extractTimestamp(file)
        }))
        .filter(file => file.timestamp > cutoffDate)
        .sort((a, b) => a.timestamp - b.timestamp);
      
      return benchmarkFiles.map(f => f.path);
    } catch (error) {
      console.log(`❌ Error reading directory: ${error.message}`);
      return [];
    }
  }

  extractTimestamp(filename) {
    const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
    if (match) {
      return new Date(match[1].replace(/-/g, ':').replace('T', 'T').replace('Z', 'Z'));
    }
    return new Date(0);
  }

  loadBenchmarkFile(filepath) {
    try {
      const content = readFileSync(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.log(`❌ Error loading file ${filepath}: ${error.message}`);
      return null;
    }
  }

  calculateGeneralImprovements(latest, previous) {
    return {
      averageTokenRatio: {
        baseline: previous.summary?.averageTokenRatio || 0,
        current: latest.summary?.averageTokenRatio || 0,
        improvement: (latest.summary?.averageTokenRatio || 0) - (previous.summary?.averageTokenRatio || 0),
        percentageChange: this.calculatePercentageChange(
          previous.summary?.averageTokenRatio || 0,
          latest.summary?.averageTokenRatio || 0
        )
      },
      averageOverallScore: {
        baseline: previous.summary?.averageOverallScore || 0,
        current: latest.summary?.averageOverallScore || 0,
        improvement: (latest.summary?.averageOverallScore || 0) - (previous.summary?.averageOverallScore || 0),
        percentageChange: this.calculatePercentageChange(
          previous.summary?.averageOverallScore || 0,
          latest.summary?.averageOverallScore || 0
        )
      },
      overEngineeringRate: {
        baseline: previous.summary?.overEngineeringRate || 0,
        current: latest.summary?.overEngineeringRate || 0,
        improvement: (latest.summary?.overEngineeringRate || 0) - (previous.summary?.overEngineeringRate || 0),
        percentageChange: this.calculatePercentageChange(
          previous.summary?.overEngineeringRate || 0,
          latest.summary?.overEngineeringRate || 0
        )
      },
      context7UsageRate: {
        baseline: previous.context7Metrics?.usageRate || 0,
        current: latest.context7Metrics?.usageRate || 0,
        improvement: (latest.context7Metrics?.usageRate || 0) - (previous.context7Metrics?.usageRate || 0),
        percentageChange: this.calculatePercentageChange(
          previous.context7Metrics?.usageRate || 0,
          latest.context7Metrics?.usageRate || 0
        )
      }
    };
  }

  calculateContext7Improvements(latest, previous) {
    return {
      librarySelectionAccuracy: {
        baseline: previous.context7Metrics?.averageLibrarySelectionAccuracy || 0,
        current: latest.context7Metrics?.averageLibrarySelectionAccuracy || 0,
        improvement: (latest.context7Metrics?.averageLibrarySelectionAccuracy || 0) - (previous.context7Metrics?.averageLibrarySelectionAccuracy || 0),
        percentageChange: this.calculatePercentageChange(
          previous.context7Metrics?.averageLibrarySelectionAccuracy || 0,
          latest.context7Metrics?.averageLibrarySelectionAccuracy || 0
        )
      },
      multiLibraryResolution: {
        baseline: previous.context7Metrics?.averageMultiLibraryResolution || 0,
        current: latest.context7Metrics?.averageMultiLibraryResolution || 0,
        improvement: (latest.context7Metrics?.averageMultiLibraryResolution || 0) - (previous.context7Metrics?.averageMultiLibraryResolution || 0),
        percentageChange: this.calculatePercentageChange(
          previous.context7Metrics?.averageMultiLibraryResolution || 0,
          latest.context7Metrics?.averageMultiLibraryResolution || 0
        )
      },
      context7Relevance: {
        baseline: previous.context7Metrics?.averageContext7RelevanceScore || 0,
        current: latest.context7Metrics?.averageContext7RelevanceScore || 0,
        improvement: (latest.context7Metrics?.averageContext7RelevanceScore || 0) - (previous.context7Metrics?.averageContext7RelevanceScore || 0),
        percentageChange: this.calculatePercentageChange(
          previous.context7Metrics?.averageContext7RelevanceScore || 0,
          latest.context7Metrics?.averageContext7RelevanceScore || 0
        )
      },
      documentationQuality: {
        baseline: previous.context7Metrics?.averageDocumentationQuality || 0,
        current: latest.context7Metrics?.averageDocumentationQuality || 0,
        improvement: (latest.context7Metrics?.averageDocumentationQuality || 0) - (previous.context7Metrics?.averageDocumentationQuality || 0),
        percentageChange: this.calculatePercentageChange(
          previous.context7Metrics?.averageDocumentationQuality || 0,
          latest.context7Metrics?.averageDocumentationQuality || 0
        )
      }
    };
  }

  calculatePercentageChange(baseline, current) {
    if (baseline === 0) return current > 0 ? 100 : 0;
    return ((current - baseline) / baseline) * 100;
  }

  compareCriticalIssues(latest, previous) {
    const latestIssues = latest.criticalIssues || [];
    const previousIssues = previous.criticalIssues || [];
    
    return {
      resolved: previousIssues.filter(prevIssue => 
        !latestIssues.some(latestIssue => latestIssue.issue === prevIssue.issue)
      ),
      new: latestIssues.filter(latestIssue => 
        !previousIssues.some(prevIssue => prevIssue.issue === latestIssue.issue)
      ),
      persistent: latestIssues.filter(latestIssue => 
        previousIssues.some(prevIssue => prevIssue.issue === latestIssue.issue)
      )
    };
  }

  generateSummary() {
    this.results.summary = {
      totalComparisons: this.results.comparisons.length,
      generalComparisons: this.results.comparisons.filter(c => c.type === 'General Benchmark').length,
      context7Comparisons: this.results.comparisons.filter(c => c.type === 'Context7 Benchmark').length,
      overallImprovement: this.calculateOverallImprovement(),
      criticalIssuesResolved: this.results.comparisons.reduce((sum, c) => sum + c.criticalIssues.resolved.length, 0),
      newCriticalIssues: this.results.comparisons.reduce((sum, c) => sum + c.criticalIssues.new.length, 0)
    };
  }

  calculateOverallImprovement() {
    if (this.results.comparisons.length === 0) return 0;
    
    const improvements = this.results.comparisons.flatMap(c => Object.values(c.improvements));
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp.percentageChange, 0) / improvements.length;
    return avgImprovement;
  }

  identifyTrends() {
    this.results.trends = {
      improving: [],
      declining: [],
      stable: []
    };

    this.results.comparisons.forEach(comparison => {
      Object.entries(comparison.improvements).forEach(([metric, data]) => {
        if (data.percentageChange > 5) {
          this.results.trends.improving.push(`${comparison.type}: ${metric} (+${data.percentageChange.toFixed(1)}%)`);
        } else if (data.percentageChange < -5) {
          this.results.trends.declining.push(`${comparison.type}: ${metric} (${data.percentageChange.toFixed(1)}%)`);
        } else {
          this.results.trends.stable.push(`${comparison.type}: ${metric} (${data.percentageChange.toFixed(1)}%)`);
        }
      });
    });
  }

  generateRecommendations() {
    this.results.recommendations = [];

    // Analyze trends and generate recommendations
    if (this.results.trends.declining.length > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'Performance Decline',
        recommendation: 'Address declining metrics immediately',
        details: this.results.trends.declining
      });
    }

    if (this.results.summary.newCriticalIssues > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'New Critical Issues',
        recommendation: 'Investigate and resolve new critical issues',
        details: [`${this.results.summary.newCriticalIssues} new critical issues identified`]
      });
    }

    if (this.results.trends.improving.length > 0) {
      this.results.recommendations.push({
        priority: 'LOW',
        category: 'Positive Trends',
        recommendation: 'Continue current optimization efforts',
        details: this.results.trends.improving
      });
    }

    // Context7 specific recommendations
    const context7Comparison = this.results.comparisons.find(c => c.type === 'Context7 Benchmark');
    if (context7Comparison) {
      const context7Improvements = context7Comparison.improvements;
      
      if (context7Improvements.librarySelectionAccuracy.percentageChange < 0) {
        this.results.recommendations.push({
          priority: 'HIGH',
          category: 'Context7 Library Selection',
          recommendation: 'Improve library selection algorithms',
          details: ['Library selection accuracy is declining']
        });
      }
      
      if (context7Improvements.multiLibraryResolution.percentageChange < 0) {
        this.results.recommendations.push({
          priority: 'MEDIUM',
          category: 'Context7 Multi-Library',
          recommendation: 'Enhance multi-library resolution',
          details: ['Multi-library resolution is declining']
        });
      }
    }
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-comparison-${timestamp}.json`;
    const filepath = path.join(__dirname, filename);
    
    const fs = await import('fs');
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Comparison results saved to: ${filename}`);
  }

  displayResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 BENCHMARK COMPARISON RESULTS');
    console.log('=' .repeat(60));
    
    console.log(`Total Comparisons: ${this.results.summary.totalComparisons}`);
    console.log(`General Benchmarks: ${this.results.summary.generalComparisons}`);
    console.log(`Context7 Benchmarks: ${this.results.summary.context7Comparisons}`);
    console.log(`Overall Improvement: ${this.results.summary.overallImprovement.toFixed(1)}%`);
    console.log(`Critical Issues Resolved: ${this.results.summary.criticalIssuesResolved}`);
    console.log(`New Critical Issues: ${this.results.summary.newCriticalIssues}`);
    
    if (this.results.comparisons.length > 0) {
      console.log('\n📈 DETAILED COMPARISONS:');
      this.results.comparisons.forEach((comparison, index) => {
        console.log(`\n${index + 1}. ${comparison.type}:`);
        console.log(`   Latest: ${comparison.latest}`);
        console.log(`   Previous: ${comparison.previous}`);
        
        console.log('   Improvements:');
        Object.entries(comparison.improvements).forEach(([metric, data]) => {
          const direction = data.percentageChange > 0 ? '📈' : data.percentageChange < 0 ? '📉' : '➡️';
          console.log(`     ${metric}: ${data.baseline.toFixed(2)} → ${data.current.toFixed(2)} (${direction} ${data.percentageChange.toFixed(1)}%)`);
        });
        
        if (comparison.criticalIssues.resolved.length > 0) {
          console.log('   ✅ Resolved Issues:');
          comparison.criticalIssues.resolved.forEach(issue => {
            console.log(`     - ${issue.issue}`);
          });
        }
        
        if (comparison.criticalIssues.new.length > 0) {
          console.log('   ⚠️ New Issues:');
          comparison.criticalIssues.new.forEach(issue => {
            console.log(`     - ${issue.issue}`);
          });
        }
      });
    }
    
    if (this.results.trends.improving.length > 0) {
      console.log('\n📈 IMPROVING TRENDS:');
      this.results.trends.improving.forEach(trend => {
        console.log(`  ✅ ${trend}`);
      });
    }
    
    if (this.results.trends.declining.length > 0) {
      console.log('\n📉 DECLINING TRENDS:');
      this.results.trends.declining.forEach(trend => {
        console.log(`  ⚠️ ${trend}`);
      });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
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
    console.log('🎯 COMPARISON COMPLETE');
    console.log('=' .repeat(60));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1];
    } else if (arg.startsWith('--days=')) {
      options.days = parseInt(arg.split('=')[1]);
    }
  });
  
  const comparison = new BenchmarkComparison();
  await comparison.runComparison(options);
}

// Run the comparison
main().catch(console.error);
