/**
 * Demo Manager
 * 
 * This module manages demo execution, tracking, and basic comparison
 * functionality for the LocalMCP comparison demo.
 */

const fs = require('fs').promises;
const path = require('path');
const { RealCodeGenerator } = require('./real-code-generator');
const { FileSystemManager } = require('./file-system-manager');
const { PipelineTrigger } = require('./pipeline-trigger');
const { ContextUtilizationTracker } = require('./context-utilization-tracker');
const { PipelineMetrics } = require('./pipeline-metrics');

class DemoManager {
  constructor(options = {}) {
    this.demoRoot = options.demoRoot || path.join(__dirname, '..');
    this.fileSystemManager = new FileSystemManager({ demoRoot: this.demoRoot });
    this.codeGenerator = new RealCodeGenerator({ outputDir: path.join(this.demoRoot, 'output') });
    this.pipelineTrigger = new PipelineTrigger();
    this.contextTracker = new ContextUtilizationTracker();
    this.pipelineMetrics = new PipelineMetrics();
    this.demos = new Map();
  }

  /**
   * Initialize demo manager
   */
  async initialize() {
    console.log('🚀 Initializing demo manager...');
    
    try {
      await this.fileSystemManager.initialize();
      console.log('✅ Demo manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize demo manager:', error);
      throw error;
    }
  }

  /**
   * Run a complete demo for a scenario
   * @param {string} scenarioName - Name of the scenario to run
   * @param {Object} options - Demo options
   * @returns {Object} Demo results
   */
  async runDemo(scenarioName, options = {}) {
    console.log(`🎯 Running demo for scenario: ${scenarioName}`);
    
    const demoId = this.generateDemoId();
    const startTime = Date.now();
    
    try {
      // Load scenario
      const scenario = await this.loadScenario(scenarioName);
      
      // Run pipeline for LocalMCP approach
      console.log('🔄 Triggering LocalMCP pipeline...');
      const pipelineResults = await this.pipelineTrigger.triggerPipeline(scenario, options);
      
      // Generate code for both approaches
      console.log('📝 Generating code for both approaches...');
      const codeResults = await this.codeGenerator.runComparison(scenario, {
        ...options,
        pipelineResults
      });
      
      // Track context utilization
      console.log('📊 Tracking context utilization...');
      const cursorContextMetrics = this.contextTracker.trackContextUtilization(
        codeResults.cursor, 'cursor-only'
      );
      const localmcpContextMetrics = this.contextTracker.trackContextUtilization(
        codeResults.localmcp, 'localmcp'
      );
      
      // Track pipeline metrics
      console.log('📈 Tracking pipeline metrics...');
      const pipelineMetrics = this.pipelineMetrics.trackPipelineMetrics(pipelineResults);
      
      // Create demo result
      const demoResult = {
        id: demoId,
        scenario: scenarioName,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        status: 'completed',
        results: {
          cursor: {
            ...codeResults.cursor,
            contextMetrics: cursorContextMetrics
          },
          localmcp: {
            ...codeResults.localmcp,
            contextMetrics: localmcpContextMetrics,
            pipelineResults,
            pipelineMetrics
          }
        },
        comparison: this.createComparison(codeResults.cursor, codeResults.localmcp, {
          cursorContextMetrics,
          localmcpContextMetrics,
          pipelineMetrics
        }),
        metadata: {
          totalFiles: (codeResults.cursor.files?.length || 0) + (codeResults.localmcp.files?.length || 0),
          totalSize: this.calculateTotalSize(codeResults),
          pipelineCoverage: pipelineResults.coverage,
          contextImprovement: localmcpContextMetrics.score - cursorContextMetrics.score
        }
      };
      
      // Store demo result
      this.demos.set(demoId, demoResult);
      
      // Save results to file system
      await this.saveDemoResult(demoResult);
      
      console.log(`✅ Demo completed: ${demoId} in ${demoResult.duration}ms`);
      
      return demoResult;
    } catch (error) {
      console.error('❌ Demo failed:', error);
      
      const errorResult = {
        id: demoId,
        scenario: scenarioName,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        status: 'failed',
        error: error.message,
        results: null
      };
      
      this.demos.set(demoId, errorResult);
      await this.saveDemoResult(errorResult);
      
      throw error;
    }
  }

  /**
   * Load scenario configuration
   * @param {string} scenarioName - Name of the scenario
   * @returns {Object} Scenario configuration
   */
  async loadScenario(scenarioName) {
    const scenarios = {
      'react-component': {
        name: 'react-component',
        description: 'Generate a React component with TypeScript and Tailwind CSS',
        type: 'component',
        complexity: 'medium',
        expectedFiles: ['Button.tsx', 'Button.css', 'index.ts'],
        contextRequirements: [
          'Project styling patterns',
          'Component structure conventions',
          'TypeScript interfaces',
          'Testing patterns'
        ]
      },
      'api-endpoint': {
        name: 'api-endpoint',
        description: 'Generate an API endpoint with validation and authentication',
        type: 'api',
        complexity: 'high',
        expectedFiles: ['user-registration.ts', 'types.ts', 'validation.ts'],
        contextRequirements: [
          'Project architecture patterns',
          'Validation schemas',
          'Error handling conventions',
          'Security patterns'
        ]
      },
      'full-stack-app': {
        name: 'full-stack-app',
        description: 'Generate a full-stack application with React frontend and Node.js backend',
        type: 'application',
        complexity: 'high',
        expectedFiles: ['package.json', 'server.js', 'client/'],
        contextRequirements: [
          'Full project structure',
          'Database patterns',
          'API design conventions',
          'Frontend-backend integration'
        ]
      }
    };
    
    const scenario = scenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }
    
    return scenario;
  }

  /**
   * Create comparison between approaches
   * @param {Object} cursorResult - Cursor-only result
   * @param {Object} localmcpResult - LocalMCP result
   * @param {Object} metrics - Additional metrics
   * @returns {Object} Comparison results
   */
  createComparison(cursorResult, localmcpResult, metrics) {
    const comparison = {
      timestamp: new Date().toISOString(),
      codeGeneration: {
        cursor: {
          fileCount: cursorResult.files?.length || 0,
          executionTime: cursorResult.executionTime || 0,
          quality: cursorResult.quality || {},
          contextUsed: cursorResult.contextUsed || 'none'
        },
        localmcp: {
          fileCount: localmcpResult.files?.length || 0,
          executionTime: localmcpResult.executionTime || 0,
          quality: localmcpResult.quality || {},
          contextUsed: localmcpResult.contextUsed || 'full',
          pipelineStages: localmcpResult.pipelineStages?.length || 0
        },
        improvements: {
          fileCount: (localmcpResult.files?.length || 0) - (cursorResult.files?.length || 0),
          executionTime: (localmcpResult.executionTime || 0) - (cursorResult.executionTime || 0),
          qualityImprovement: this.calculateQualityImprovement(
            cursorResult.quality, localmcpResult.quality
          )
        }
      },
      contextUtilization: {
        cursor: metrics.cursorContextMetrics?.score || 0,
        localmcp: metrics.localmcpContextMetrics?.score || 0,
        improvement: (metrics.localmcpContextMetrics?.score || 0) - (metrics.cursorContextMetrics?.score || 0),
        improvementPercentage: this.calculateImprovementPercentage(
          metrics.cursorContextMetrics?.score || 0,
          metrics.localmcpContextMetrics?.score || 0
        )
      },
      pipelineMetrics: metrics.pipelineMetrics ? {
        coverage: metrics.pipelineMetrics.overallMetrics?.pipelineCoverage || 0,
        efficiency: metrics.pipelineMetrics.efficiency?.average || 0,
        successRate: metrics.pipelineMetrics.stageMetrics?.successRate || 0,
        executionTime: metrics.pipelineMetrics.totalExecutionTime || 0
      } : null,
      summary: {
        overallImprovement: this.calculateOverallImprovement(cursorResult, localmcpResult, metrics),
        keyAdvantages: this.identifyKeyAdvantages(cursorResult, localmcpResult, metrics),
        recommendations: this.generateRecommendations(cursorResult, localmcpResult, metrics)
      }
    };
    
    return comparison;
  }

  /**
   * Calculate quality improvement
   * @param {Object} cursorQuality - Cursor quality metrics
   * @param {Object} localmcpQuality - LocalMCP quality metrics
   * @returns {Object} Quality improvement metrics
   */
  calculateQualityImprovement(cursorQuality, localmcpQuality) {
    if (!cursorQuality || !localmcpQuality) {
      return { overall: 0 };
    }
    
    const improvements = {
      fileCount: (localmcpQuality.fileCount || 0) - (cursorQuality.fileCount || 0),
      totalLines: (localmcpQuality.totalLines || 0) - (cursorQuality.totalLines || 0),
      hasTests: localmcpQuality.hasTests ? (cursorQuality.hasTests ? 0 : 1) : (cursorQuality.hasTests ? -1 : 0),
      hasTypes: localmcpQuality.hasTypes ? (cursorQuality.hasTypes ? 0 : 1) : (cursorQuality.hasTypes ? -1 : 0),
      hasDocumentation: localmcpQuality.hasDocumentation ? (cursorQuality.hasDocumentation ? 0 : 1) : (cursorQuality.hasDocumentation ? -1 : 0)
    };
    
    // Calculate overall improvement
    const positiveImprovements = Object.values(improvements).filter(val => val > 0).length;
    const totalMetrics = Object.keys(improvements).length;
    improvements.overall = Math.round((positiveImprovements / totalMetrics) * 100);
    
    return improvements;
  }

  /**
   * Calculate improvement percentage
   * @param {number} original - Original value
   * @param {number} improved - Improved value
   * @returns {number} Improvement percentage
   */
  calculateImprovementPercentage(original, improved) {
    if (original === 0) return 0;
    return Math.round(((improved - original) / original) * 100);
  }

  /**
   * Calculate overall improvement
   * @param {Object} cursorResult - Cursor result
   * @param {Object} localmcpResult - LocalMCP result
   * @param {Object} metrics - Additional metrics
   * @returns {number} Overall improvement score
   */
  calculateOverallImprovement(cursorResult, localmcpResult, metrics) {
    let score = 0;
    
    // File count improvement (20% weight)
    const fileImprovement = (localmcpResult.files?.length || 0) - (cursorResult.files?.length || 0);
    score += Math.min(50, fileImprovement * 5) * 0.2;
    
    // Context utilization improvement (40% weight)
    const contextImprovement = (metrics.localmcpContextMetrics?.score || 0) - (metrics.cursorContextMetrics?.score || 0);
    score += Math.min(50, contextImprovement * 0.5) * 0.4;
    
    // Quality improvement (30% weight)
    const qualityImprovement = this.calculateQualityImprovement(cursorResult.quality, localmcpResult.quality);
    score += Math.min(50, qualityImprovement.overall * 0.5) * 0.3;
    
    // Pipeline coverage bonus (10% weight)
    const pipelineCoverage = metrics.pipelineMetrics?.overallMetrics?.pipelineCoverage || 0;
    score += Math.min(10, pipelineCoverage * 10) * 0.1;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Identify key advantages of LocalMCP
   * @param {Object} cursorResult - Cursor result
   * @param {Object} localmcpResult - LocalMCP result
   * @param {Object} metrics - Additional metrics
   * @returns {Array} Key advantages
   */
  identifyKeyAdvantages(cursorResult, localmcpResult, metrics) {
    const advantages = [];
    
    // Context utilization advantage
    const contextImprovement = (metrics.localmcpContextMetrics?.score || 0) - (metrics.cursorContextMetrics?.score || 0);
    if (contextImprovement > 30) {
      advantages.push({
        type: 'context',
        message: `Significantly better context utilization (+${contextImprovement}%)`,
        impact: 'high'
      });
    }
    
    // File generation advantage
    const fileImprovement = (localmcpResult.files?.length || 0) - (cursorResult.files?.length || 0);
    if (fileImprovement > 0) {
      advantages.push({
        type: 'generation',
        message: `Generated ${fileImprovement} more files with better structure`,
        impact: 'medium'
      });
    }
    
    // Pipeline coverage advantage
    const pipelineCoverage = metrics.pipelineMetrics?.overallMetrics?.pipelineCoverage || 0;
    if (pipelineCoverage > 0.6) {
      advantages.push({
        type: 'pipeline',
        message: `Achieved ${Math.round(pipelineCoverage * 100)}% pipeline coverage`,
        impact: 'high'
      });
    }
    
    // Quality advantage
    const qualityImprovement = this.calculateQualityImprovement(cursorResult.quality, localmcpResult.quality);
    if (qualityImprovement.overall > 20) {
      advantages.push({
        type: 'quality',
        message: `Improved code quality by ${qualityImprovement.overall}%`,
        impact: 'medium'
      });
    }
    
    return advantages;
  }

  /**
   * Generate recommendations
   * @param {Object} cursorResult - Cursor result
   * @param {Object} localmcpResult - LocalMCP result
   * @param {Object} metrics - Additional metrics
   * @returns {Array} Recommendations
   */
  generateRecommendations(cursorResult, localmcpResult, metrics) {
    const recommendations = [];
    
    // Context utilization recommendations
    const contextScore = metrics.localmcpContextMetrics?.score || 0;
    if (contextScore > 80) {
      recommendations.push({
        type: 'success',
        message: 'LocalMCP shows excellent context utilization',
        priority: 'high'
      });
    } else if (contextScore > 60) {
      recommendations.push({
        type: 'good',
        message: 'LocalMCP shows good context utilization',
        priority: 'medium'
      });
    } else {
      recommendations.push({
        type: 'improvement',
        message: 'LocalMCP context utilization could be improved',
        priority: 'high'
      });
    }
    
    // Pipeline recommendations
    const pipelineCoverage = metrics.pipelineMetrics?.overallMetrics?.pipelineCoverage || 0;
    if (pipelineCoverage < 0.6) {
      recommendations.push({
        type: 'pipeline',
        message: 'Pipeline coverage is below 60%. Consider optimizing pipeline stages.',
        priority: 'medium'
      });
    }
    
    // Quality recommendations
    const qualityImprovement = this.calculateQualityImprovement(cursorResult.quality, localmcpResult.quality);
    if (qualityImprovement.overall < 20) {
      recommendations.push({
        type: 'quality',
        message: 'Code quality improvement is minimal. Review quality metrics.',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate total size of generated files
   * @param {Object} codeResults - Code generation results
   * @returns {number} Total size in bytes
   */
  calculateTotalSize(codeResults) {
    const cursorSize = codeResults.cursor?.files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
    const localmcpSize = codeResults.localmcp?.files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
    return cursorSize + localmcpSize;
  }

  /**
   * Save demo result to file system
   * @param {Object} demoResult - Demo result to save
   */
  async saveDemoResult(demoResult) {
    try {
      await this.fileSystemManager.saveDemoResults(demoResult, `demo-${demoResult.id}`);
      
      // Save individual metrics
      if (demoResult.results?.cursor?.contextMetrics) {
        await this.fileSystemManager.saveValidationResults(
          demoResult.results.cursor.contextMetrics, 'cursor-only'
        );
      }
      
      if (demoResult.results?.localmcp?.contextMetrics) {
        await this.fileSystemManager.saveValidationResults(
          demoResult.results.localmcp.contextMetrics, 'localmcp'
        );
      }
      
      if (demoResult.results?.localmcp?.pipelineMetrics) {
        await this.fileSystemManager.saveGateResults(
          demoResult.results.localmcp.pipelineMetrics, 'localmcp'
        );
      }
    } catch (error) {
      console.error('❌ Failed to save demo result:', error);
    }
  }

  /**
   * Get demo by ID
   * @param {string} demoId - Demo ID
   * @returns {Object} Demo result
   */
  getDemo(demoId) {
    return this.demos.get(demoId);
  }

  /**
   * Get all demos
   * @returns {Array} Array of demo results
   */
  getAllDemos() {
    return Array.from(this.demos.values());
  }

  /**
   * Get demos by scenario
   * @param {string} scenarioName - Scenario name
   * @returns {Array} Array of demo results for scenario
   */
  getDemosByScenario(scenarioName) {
    return this.getAllDemos().filter(demo => demo.scenario === scenarioName);
  }

  /**
   * Compare two demos
   * @param {string} demoId1 - First demo ID
   * @param {string} demoId2 - Second demo ID
   * @returns {Object} Comparison results
   */
  compareDemos(demoId1, demoId2) {
    const demo1 = this.getDemo(demoId1);
    const demo2 = this.getDemo(demoId2);
    
    if (!demo1 || !demo2) {
      throw new Error('One or both demos not found');
    }
    
    return {
      demo1: {
        id: demo1.id,
        scenario: demo1.scenario,
        timestamp: demo1.timestamp,
        duration: demo1.duration,
        status: demo1.status
      },
      demo2: {
        id: demo2.id,
        scenario: demo2.scenario,
        timestamp: demo2.timestamp,
        duration: demo2.duration,
        status: demo2.status
      },
      comparison: this.createComparison(
        demo1.results?.cursor,
        demo1.results?.localmcp,
        {
          cursorContextMetrics: demo1.results?.cursor?.contextMetrics,
          localmcpContextMetrics: demo1.results?.localmcp?.contextMetrics,
          pipelineMetrics: demo1.results?.localmcp?.pipelineMetrics
        }
      ),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate unique demo ID
   * @returns {string} Demo ID
   */
  generateDemoId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `demo-${timestamp}-${random}`;
  }

  /**
   * Get demo statistics
   * @returns {Object} Demo statistics
   */
  async getDemoStats() {
    const demos = this.getAllDemos();
    const completedDemos = demos.filter(demo => demo.status === 'completed');
    
    return {
      totalDemos: demos.length,
      completedDemos: completedDemos.length,
      failedDemos: demos.length - completedDemos.length,
      scenarios: [...new Set(demos.map(demo => demo.scenario))],
      averageDuration: completedDemos.length > 0 
        ? Math.round(completedDemos.reduce((sum, demo) => sum + demo.duration, 0) / completedDemos.length)
        : 0,
      lastRun: demos.length > 0 
        ? Math.max(...demos.map(demo => new Date(demo.timestamp).getTime()))
        : null,
      successRate: demos.length > 0 ? Math.round((completedDemos.length / demos.length) * 100) : 0
    };
  }
}

module.exports = { DemoManager };
