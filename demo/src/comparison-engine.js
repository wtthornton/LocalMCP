/**
 * Comparison Engine
 * 
 * This module handles comparison between different demo results,
 * providing detailed analysis and insights.
 */

class ComparisonEngine {
  constructor() {
    this.comparisonTypes = {
      SCENARIO: 'scenario',
      TIMELINE: 'timeline',
      PERFORMANCE: 'performance',
      QUALITY: 'quality',
      CONTEXT: 'context'
    };
  }

  /**
   * Compare two demo results
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @param {string} comparisonType - Type of comparison
   * @returns {Object} Comparison results
   */
  compareDemos(demo1, demo2, comparisonType = this.comparisonTypes.SCENARIO) {
    console.log(`🔍 Comparing demos: ${demo1.id} vs ${demo2.id}`);
    
    const comparison = {
      type: comparisonType,
      timestamp: new Date().toISOString(),
      demos: {
        demo1: this.extractDemoSummary(demo1),
        demo2: this.extractDemoSummary(demo2)
      },
      analysis: {},
      insights: [],
      recommendations: []
    };

    try {
      switch (comparisonType) {
        case this.comparisonTypes.SCENARIO:
          comparison.analysis = this.compareScenarioResults(demo1, demo2);
          break;
        case this.comparisonTypes.TIMELINE:
          comparison.analysis = this.compareTimelineResults(demo1, demo2);
          break;
        case this.comparisonTypes.PERFORMANCE:
          comparison.analysis = this.comparePerformanceResults(demo1, demo2);
          break;
        case this.comparisonTypes.QUALITY:
          comparison.analysis = this.compareQualityResults(demo1, demo2);
          break;
        case this.comparisonTypes.CONTEXT:
          comparison.analysis = this.compareContextResults(demo1, demo2);
          break;
        default:
          comparison.analysis = this.compareScenarioResults(demo1, demo2);
      }

      // Generate insights and recommendations
      comparison.insights = this.generateInsights(comparison.analysis, comparisonType);
      comparison.recommendations = this.generateRecommendations(comparison.analysis, comparisonType);

      console.log(`✅ Comparison completed: ${comparisonType}`);
      return comparison;
    } catch (error) {
      console.error('❌ Comparison failed:', error);
      comparison.error = error.message;
      return comparison;
    }
  }

  /**
   * Extract demo summary
   * @param {Object} demo - Demo result
   * @returns {Object} Demo summary
   */
  extractDemoSummary(demo) {
    return {
      id: demo.id,
      scenario: demo.scenario,
      timestamp: demo.timestamp,
      duration: demo.duration,
      status: demo.status,
      metadata: demo.metadata || {}
    };
  }

  /**
   * Compare scenario results
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Scenario comparison analysis
   */
  compareScenarioResults(demo1, demo2) {
    const analysis = {
      basic: {
        sameScenario: demo1.scenario === demo2.scenario,
        timeDifference: Math.abs(new Date(demo1.timestamp) - new Date(demo2.timestamp)),
        durationDifference: demo1.duration - demo2.duration,
        statusComparison: {
          demo1: demo1.status,
          demo2: demo2.status,
          bothCompleted: demo1.status === 'completed' && demo2.status === 'completed'
        }
      },
      codeGeneration: this.compareCodeGeneration(demo1, demo2),
      contextUtilization: this.compareContextUtilization(demo1, demo2),
      pipelineMetrics: this.comparePipelineMetrics(demo1, demo2),
      quality: this.compareQuality(demo1, demo2)
    };

    return analysis;
  }

  /**
   * Compare timeline results
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Timeline comparison analysis
   */
  compareTimelineResults(demo1, demo2) {
    const analysis = {
      timing: {
        demo1: {
          timestamp: demo1.timestamp,
          duration: demo1.duration,
          executionTime: new Date(demo1.timestamp).getTime()
        },
        demo2: {
          timestamp: demo2.timestamp,
          duration: demo2.duration,
          executionTime: new Date(demo2.timestamp).getTime()
        },
        timeDifference: Math.abs(new Date(demo1.timestamp) - new Date(demo2.timestamp)),
        durationDifference: demo1.duration - demo2.duration
      },
      performance: {
        fasterDemo: demo1.duration < demo2.duration ? 'demo1' : 'demo2',
        speedImprovement: Math.abs(demo1.duration - demo2.duration),
        speedImprovementPercentage: this.calculateImprovementPercentage(
          Math.max(demo1.duration, demo2.duration),
          Math.min(demo1.duration, demo2.duration)
        )
      }
    };

    return analysis;
  }

  /**
   * Compare performance results
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Performance comparison analysis
   */
  comparePerformanceResults(demo1, demo2) {
    const analysis = {
      execution: {
        demo1: {
          duration: demo1.duration,
          status: demo1.status,
          efficiency: this.calculateEfficiency(demo1)
        },
        demo2: {
          duration: demo2.duration,
          status: demo2.status,
          efficiency: this.calculateEfficiency(demo2)
        }
      },
      codeGeneration: this.compareCodeGenerationPerformance(demo1, demo2),
      pipeline: this.comparePipelinePerformance(demo1, demo2),
      context: this.compareContextPerformance(demo1, demo2)
    };

    return analysis;
  }

  /**
   * Compare quality results
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Quality comparison analysis
   */
  compareQualityResults(demo1, demo2) {
    const analysis = {
      codeQuality: this.compareCodeQuality(demo1, demo2),
      fileStructure: this.compareFileStructure(demo1, demo2),
      bestPractices: this.compareBestPractices(demo1, demo2),
      testing: this.compareTesting(demo1, demo2),
      documentation: this.compareDocumentation(demo1, demo2)
    };

    return analysis;
  }

  /**
   * Compare context results
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Context comparison analysis
   */
  compareContextResults(demo1, demo2) {
    const analysis = {
      contextUtilization: this.compareContextUtilization(demo1, demo2),
      pipelineCoverage: this.comparePipelineCoverage(demo1, demo2),
      projectAwareness: this.compareProjectAwareness(demo1, demo2),
      patternUsage: this.comparePatternUsage(demo1, demo2)
    };

    return analysis;
  }

  /**
   * Compare code generation between demos
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Code generation comparison
   */
  compareCodeGeneration(demo1, demo2) {
    const cursor1 = demo1.results?.cursor;
    const localmcp1 = demo1.results?.localmcp;
    const cursor2 = demo2.results?.cursor;
    const localmcp2 = demo2.results?.localmcp;

    return {
      fileCount: {
        demo1: {
          cursor: cursor1?.files?.length || 0,
          localmcp: localmcp1?.files?.length || 0,
          total: (cursor1?.files?.length || 0) + (localmcp1?.files?.length || 0)
        },
        demo2: {
          cursor: cursor2?.files?.length || 0,
          localmcp: localmcp2?.files?.length || 0,
          total: (cursor2?.files?.length || 0) + (localmcp2?.files?.length || 0)
        },
        improvement: this.calculateImprovement(
          (cursor1?.files?.length || 0) + (localmcp1?.files?.length || 0),
          (cursor2?.files?.length || 0) + (localmcp2?.files?.length || 0)
        )
      },
      executionTime: {
        demo1: {
          cursor: cursor1?.executionTime || 0,
          localmcp: localmcp1?.executionTime || 0,
          total: (cursor1?.executionTime || 0) + (localmcp1?.executionTime || 0)
        },
        demo2: {
          cursor: cursor2?.executionTime || 0,
          localmcp: localmcp2?.executionTime || 0,
          total: (cursor2?.executionTime || 0) + (localmcp2?.executionTime || 0)
        },
        improvement: this.calculateImprovement(
          (cursor1?.executionTime || 0) + (localmcp1?.executionTime || 0),
          (cursor2?.executionTime || 0) + (localmcp2?.executionTime || 0)
        )
      }
    };
  }

  /**
   * Compare context utilization between demos
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Context utilization comparison
   */
  compareContextUtilization(demo1, demo2) {
    const context1 = demo1.results?.localmcp?.contextMetrics;
    const context2 = demo2.results?.localmcp?.contextMetrics;

    return {
      demo1: {
        score: context1?.score || 0,
        metrics: context1?.metrics || {}
      },
      demo2: {
        score: context2?.score || 0,
        metrics: context2?.metrics || {}
      },
      improvement: this.calculateImprovement(
        context1?.score || 0,
        context2?.score || 0
      ),
      metricImprovements: this.compareContextMetrics(
        context1?.metrics || {},
        context2?.metrics || {}
      )
    };
  }

  /**
   * Compare pipeline metrics between demos
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Pipeline metrics comparison
   */
  comparePipelineMetrics(demo1, demo2) {
    const pipeline1 = demo1.results?.localmcp?.pipelineMetrics;
    const pipeline2 = demo2.results?.localmcp?.pipelineMetrics;

    return {
      demo1: {
        coverage: pipeline1?.overallMetrics?.pipelineCoverage || 0,
        efficiency: pipeline1?.efficiency?.average || 0,
        successRate: pipeline1?.stageMetrics?.successRate || 0
      },
      demo2: {
        coverage: pipeline2?.overallMetrics?.pipelineCoverage || 0,
        efficiency: pipeline2?.efficiency?.average || 0,
        successRate: pipeline2?.stageMetrics?.successRate || 0
      },
      improvements: {
        coverage: this.calculateImprovement(
          pipeline1?.overallMetrics?.pipelineCoverage || 0,
          pipeline2?.overallMetrics?.pipelineCoverage || 0
        ),
        efficiency: this.calculateImprovement(
          pipeline1?.efficiency?.average || 0,
          pipeline2?.efficiency?.average || 0
        ),
        successRate: this.calculateImprovement(
          pipeline1?.stageMetrics?.successRate || 0,
          pipeline2?.stageMetrics?.successRate || 0
        )
      }
    };
  }

  /**
   * Compare quality between demos
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Quality comparison
   */
  compareQuality(demo1, demo2) {
    const quality1 = demo1.results?.localmcp?.quality;
    const quality2 = demo2.results?.localmcp?.quality;

    return {
      demo1: quality1 || {},
      demo2: quality2 || {},
      improvements: this.compareQualityMetrics(quality1 || {}, quality2 || {})
    };
  }

  /**
   * Compare code generation performance
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Code generation performance comparison
   */
  compareCodeGenerationPerformance(demo1, demo2) {
    const cursor1 = demo1.results?.cursor;
    const localmcp1 = demo1.results?.localmcp;
    const cursor2 = demo2.results?.cursor;
    const localmcp2 = demo2.results?.localmcp;

    return {
      cursorPerformance: {
        demo1: cursor1?.executionTime || 0,
        demo2: cursor2?.executionTime || 0,
        improvement: this.calculateImprovement(
          cursor1?.executionTime || 0,
          cursor2?.executionTime || 0
        )
      },
      localmcpPerformance: {
        demo1: localmcp1?.executionTime || 0,
        demo2: localmcp2?.executionTime || 0,
        improvement: this.calculateImprovement(
          localmcp1?.executionTime || 0,
          localmcp2?.executionTime || 0
        )
      }
    };
  }

  /**
   * Compare pipeline performance
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Pipeline performance comparison
   */
  comparePipelinePerformance(demo1, demo2) {
    const pipeline1 = demo1.results?.localmcp?.pipelineMetrics;
    const pipeline2 = demo2.results?.localmcp?.pipelineMetrics;

    return {
      executionTime: {
        demo1: pipeline1?.totalExecutionTime || 0,
        demo2: pipeline2?.totalExecutionTime || 0,
        improvement: this.calculateImprovement(
          pipeline1?.totalExecutionTime || 0,
          pipeline2?.totalExecutionTime || 0
        )
      },
      efficiency: {
        demo1: pipeline1?.efficiency?.average || 0,
        demo2: pipeline2?.efficiency?.average || 0,
        improvement: this.calculateImprovement(
          pipeline1?.efficiency?.average || 0,
          pipeline2?.efficiency?.average || 0
        )
      }
    };
  }

  /**
   * Compare context performance
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Context performance comparison
   */
  compareContextPerformance(demo1, demo2) {
    const context1 = demo1.results?.localmcp?.contextMetrics;
    const context2 = demo2.results?.localmcp?.contextMetrics;

    return {
      utilization: {
        demo1: context1?.score || 0,
        demo2: context2?.score || 0,
        improvement: this.calculateImprovement(
          context1?.score || 0,
          context2?.score || 0
        )
      }
    };
  }

  /**
   * Compare code quality
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Code quality comparison
   */
  compareCodeQuality(demo1, demo2) {
    const quality1 = demo1.results?.localmcp?.quality;
    const quality2 = demo2.results?.localmcp?.quality;

    return {
      demo1: quality1 || {},
      demo2: quality2 || {},
      improvements: this.compareQualityMetrics(quality1 || {}, quality2 || {})
    };
  }

  /**
   * Compare file structure
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} File structure comparison
   */
  compareFileStructure(demo1, demo2) {
    const files1 = demo1.results?.localmcp?.files || [];
    const files2 = demo2.results?.localmcp?.files || [];

    return {
      demo1: {
        fileCount: files1.length,
        fileTypes: this.analyzeFileTypes(files1),
        structure: this.analyzeFileStructure(files1)
      },
      demo2: {
        fileCount: files2.length,
        fileTypes: this.analyzeFileTypes(files2),
        structure: this.analyzeFileStructure(files2)
      },
      improvements: {
        fileCount: files2.length - files1.length,
        structureComplexity: this.compareStructureComplexity(files1, files2)
      }
    };
  }

  /**
   * Compare best practices
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Best practices comparison
   */
  compareBestPractices(demo1, demo2) {
    const quality1 = demo1.results?.localmcp?.quality;
    const quality2 = demo2.results?.localmcp?.quality;

    return {
      demo1: {
        hasTests: quality1?.hasTests || false,
        hasTypes: quality1?.hasTypes || false,
        hasDocumentation: quality1?.hasDocumentation || false
      },
      demo2: {
        hasTests: quality2?.hasTests || false,
        hasTypes: quality2?.hasTypes || false,
        hasDocumentation: quality2?.hasDocumentation || false
      },
      improvements: {
        tests: (quality2?.hasTests || false) && !(quality1?.hasTests || false),
        types: (quality2?.hasTypes || false) && !(quality1?.hasTypes || false),
        documentation: (quality2?.hasDocumentation || false) && !(quality1?.hasDocumentation || false)
      }
    };
  }

  /**
   * Compare testing
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Testing comparison
   */
  compareTesting(demo1, demo2) {
    const files1 = demo1.results?.localmcp?.files || [];
    const files2 = demo2.results?.localmcp?.files || [];

    return {
      demo1: {
        testFiles: files1.filter(file => file.path.includes('.test.') || file.path.includes('.spec.')).length,
        testCoverage: this.estimateTestCoverage(files1)
      },
      demo2: {
        testFiles: files2.filter(file => file.path.includes('.test.') || file.path.includes('.spec.')).length,
        testCoverage: this.estimateTestCoverage(files2)
      },
      improvements: {
        testFiles: files2.filter(file => file.path.includes('.test.') || file.path.includes('.spec.')).length - 
                  files1.filter(file => file.path.includes('.test.') || file.path.includes('.spec.')).length,
        testCoverage: this.estimateTestCoverage(files2) - this.estimateTestCoverage(files1)
      }
    };
  }

  /**
   * Compare documentation
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Documentation comparison
   */
  compareDocumentation(demo1, demo2) {
    const files1 = demo1.results?.localmcp?.files || [];
    const files2 = demo2.results?.localmcp?.files || [];

    return {
      demo1: {
        docFiles: files1.filter(file => file.path.includes('.md') || file.path.includes('.stories.')).length,
        documentation: this.analyzeDocumentation(files1)
      },
      demo2: {
        docFiles: files2.filter(file => file.path.includes('.md') || file.path.includes('.stories.')).length,
        documentation: this.analyzeDocumentation(files2)
      },
      improvements: {
        docFiles: files2.filter(file => file.path.includes('.md') || file.path.includes('.stories.')).length - 
                  files1.filter(file => file.path.includes('.md') || file.path.includes('.stories.')).length,
        documentation: this.analyzeDocumentation(files2) - this.analyzeDocumentation(files1)
      }
    };
  }

  /**
   * Compare pipeline coverage
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Pipeline coverage comparison
   */
  comparePipelineCoverage(demo1, demo2) {
    const pipeline1 = demo1.results?.localmcp?.pipelineMetrics;
    const pipeline2 = demo2.results?.localmcp?.pipelineMetrics;

    return {
      demo1: pipeline1?.overallMetrics?.pipelineCoverage || 0,
      demo2: pipeline2?.overallMetrics?.pipelineCoverage || 0,
      improvement: this.calculateImprovement(
        pipeline1?.overallMetrics?.pipelineCoverage || 0,
        pipeline2?.overallMetrics?.pipelineCoverage || 0
      )
    };
  }

  /**
   * Compare project awareness
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Project awareness comparison
   */
  compareProjectAwareness(demo1, demo2) {
    const context1 = demo1.results?.localmcp?.contextMetrics;
    const context2 = demo2.results?.localmcp?.contextMetrics;

    return {
      demo1: context1?.score || 0,
      demo2: context2?.score || 0,
      improvement: this.calculateImprovement(
        context1?.score || 0,
        context2?.score || 0
      )
    };
  }

  /**
   * Compare pattern usage
   * @param {Object} demo1 - First demo result
   * @param {Object} demo2 - Second demo result
   * @returns {Object} Pattern usage comparison
   */
  comparePatternUsage(demo1, demo2) {
    const context1 = demo1.results?.localmcp?.contextMetrics;
    const context2 = demo2.results?.localmcp?.contextMetrics;

    return {
      demo1: context1?.metrics || {},
      demo2: context2?.metrics || {},
      improvements: this.compareContextMetrics(
        context1?.metrics || {},
        context2?.metrics || {}
      )
    };
  }

  /**
   * Generate insights from comparison analysis
   * @param {Object} analysis - Comparison analysis
   * @param {string} comparisonType - Type of comparison
   * @returns {Array} Array of insights
   */
  generateInsights(analysis, comparisonType) {
    const insights = [];

    // Basic insights
    if (analysis.basic) {
      if (analysis.basic.sameScenario) {
        insights.push({
          type: 'scenario',
          message: 'Both demos use the same scenario, enabling direct comparison',
          priority: 'info'
        });
      }

      if (analysis.basic.durationDifference > 1000) {
        insights.push({
          type: 'performance',
          message: `Significant execution time difference: ${Math.abs(analysis.basic.durationDifference)}ms`,
          priority: 'medium'
        });
      }
    }

    // Code generation insights
    if (analysis.codeGeneration) {
      const fileImprovement = analysis.codeGeneration.fileCount.improvement;
      if (fileImprovement > 0) {
        insights.push({
          type: 'generation',
          message: `Demo 2 generated ${fileImprovement} more files than Demo 1`,
          priority: 'high'
        });
      }
    }

    // Context utilization insights
    if (analysis.contextUtilization) {
      const contextImprovement = analysis.contextUtilization.improvement;
      if (contextImprovement > 20) {
        insights.push({
          type: 'context',
          message: `Significant context utilization improvement: +${contextImprovement}%`,
          priority: 'high'
        });
      }
    }

    // Pipeline insights
    if (analysis.pipelineMetrics) {
      const coverageImprovement = analysis.pipelineMetrics.improvements.coverage;
      if (coverageImprovement > 0.1) {
        insights.push({
          type: 'pipeline',
          message: `Pipeline coverage improved by ${Math.round(coverageImprovement * 100)}%`,
          priority: 'medium'
        });
      }
    }

    return insights;
  }

  /**
   * Generate recommendations from comparison analysis
   * @param {Object} analysis - Comparison analysis
   * @param {string} comparisonType - Type of comparison
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(analysis, comparisonType) {
    const recommendations = [];

    // Performance recommendations
    if (analysis.basic && analysis.basic.durationDifference > 2000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Consider optimizing slower demo execution',
        details: `Time difference: ${analysis.basic.durationDifference}ms`
      });
    }

    // Context utilization recommendations
    if (analysis.contextUtilization && analysis.contextUtilization.improvement < 10) {
      recommendations.push({
        type: 'context',
        priority: 'medium',
        message: 'Context utilization improvement is minimal',
        details: `Improvement: ${analysis.contextUtilization.improvement}%`
      });
    }

    // Pipeline recommendations
    if (analysis.pipelineMetrics && analysis.pipelineMetrics.improvements.coverage < 0.05) {
      recommendations.push({
        type: 'pipeline',
        priority: 'medium',
        message: 'Pipeline coverage improvement is minimal',
        details: `Coverage improvement: ${Math.round(analysis.pipelineMetrics.improvements.coverage * 100)}%`
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  calculateImprovement(oldValue, newValue) {
    if (oldValue === 0) return newValue;
    return newValue - oldValue;
  }

  calculateImprovementPercentage(oldValue, newValue) {
    if (oldValue === 0) return 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  }

  calculateEfficiency(demo) {
    if (demo.status !== 'completed') return 0;
    // Simple efficiency calculation based on duration and file count
    const fileCount = (demo.results?.cursor?.files?.length || 0) + (demo.results?.localmcp?.files?.length || 0);
    const duration = demo.duration;
    return fileCount > 0 && duration > 0 ? Math.round((fileCount / duration) * 1000) : 0;
  }

  compareContextMetrics(metrics1, metrics2) {
    const improvements = {};
    for (const [key, value1] of Object.entries(metrics1)) {
      const value2 = metrics2[key] || 0;
      improvements[key] = value2 - value1;
    }
    return improvements;
  }

  compareQualityMetrics(quality1, quality2) {
    const improvements = {};
    for (const [key, value1] of Object.entries(quality1)) {
      const value2 = quality2[key] || 0;
      improvements[key] = value2 - value1;
    }
    return improvements;
  }

  analyzeFileTypes(files) {
    const types = {};
    for (const file of files) {
      const ext = file.path.split('.').pop();
      types[ext] = (types[ext] || 0) + 1;
    }
    return types;
  }

  analyzeFileStructure(files) {
    const structure = {
      depth: 0,
      folders: 0,
      files: files.length
    };
    
    for (const file of files) {
      const pathParts = file.path.split('/');
      structure.depth = Math.max(structure.depth, pathParts.length - 1);
      structure.folders += pathParts.length - 1;
    }
    
    return structure;
  }

  compareStructureComplexity(files1, files2) {
    const structure1 = this.analyzeFileStructure(files1);
    const structure2 = this.analyzeFileStructure(files2);
    
    return {
      depth: structure2.depth - structure1.depth,
      folders: structure2.folders - structure1.folders,
      files: structure2.files - structure1.files
    };
  }

  estimateTestCoverage(files) {
    const testFiles = files.filter(file => file.path.includes('.test.') || file.path.includes('.spec.'));
    const totalFiles = files.length;
    return totalFiles > 0 ? Math.round((testFiles.length / totalFiles) * 100) : 0;
  }

  analyzeDocumentation(files) {
    const docFiles = files.filter(file => file.path.includes('.md') || file.path.includes('.stories.'));
    const totalFiles = files.length;
    return totalFiles > 0 ? Math.round((docFiles.length / totalFiles) * 100) : 0;
  }
}

module.exports = { ComparisonEngine };
