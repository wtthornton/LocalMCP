/**
 * Pipeline Metrics
 * 
 * This module tracks and analyzes LocalMCP pipeline performance metrics,
 * including timing, efficiency, and stage utilization.
 */

class PipelineMetrics {
  constructor() {
    this.metrics = {
      totalExecutionTime: 0,
      stageTimings: {},
      stageEfficiency: {},
      contextUtilization: 0,
      pipelineCoverage: 0,
      successRate: 0,
      errorRate: 0,
      averageStageTime: 0,
      slowestStage: null,
      fastestStage: null
    };
  }

  /**
   * Track pipeline execution metrics
   * @param {Object} pipelineResults - Pipeline execution results
   * @returns {Object} Pipeline metrics
   */
  trackPipelineMetrics(pipelineResults) {
    console.log('📈 Tracking pipeline metrics...');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      scenario: pipelineResults.scenario,
      totalExecutionTime: pipelineResults.totalTime,
      stageMetrics: {},
      overallMetrics: { ...this.metrics },
      performance: {},
      efficiency: {},
      recommendations: []
    };

    // Analyze stage timings
    this.analyzeStageTimings(pipelineResults.stages, metrics);
    
    // Calculate efficiency metrics
    this.calculateEfficiencyMetrics(metrics);
    
    // Calculate performance metrics
    this.calculatePerformanceMetrics(metrics);
    
    // Generate recommendations
    metrics.recommendations = this.generatePerformanceRecommendations(metrics);
    
    console.log(`✅ Pipeline metrics tracked: ${metrics.overallMetrics.pipelineCoverage * 100}% coverage`);
    
    return metrics;
  }

  /**
   * Analyze stage timings
   * @param {Object} stages - Pipeline stages
   * @param {Object} metrics - Metrics object to update
   */
  analyzeStageTimings(stages, metrics) {
    const stageTimings = {};
    const stageEfficiency = {};
    let totalStageTime = 0;
    let successfulStages = 0;
    let failedStages = 0;

    for (const [stageName, stageResult] of Object.entries(stages)) {
      stageTimings[stageName] = {
        duration: stageResult.duration,
        status: stageResult.status,
        timestamp: stageResult.timestamp
      };

      totalStageTime += stageResult.duration;

      if (stageResult.status === 'completed') {
        successfulStages++;
        stageEfficiency[stageName] = this.calculateStageEfficiency(stageResult);
      } else {
        failedStages++;
        stageEfficiency[stageName] = 0;
      }
    }

    metrics.stageMetrics = {
      timings: stageTimings,
      efficiency: stageEfficiency,
      totalStageTime,
      successfulStages,
      failedStages,
      successRate: successfulStages / Object.keys(stages).length,
      errorRate: failedStages / Object.keys(stages).length
    };

    // Update overall metrics
    metrics.overallMetrics.totalExecutionTime = totalStageTime;
    metrics.overallMetrics.stageTimings = stageTimings;
    metrics.overallMetrics.stageEfficiency = stageEfficiency;
    metrics.overallMetrics.successRate = metrics.stageMetrics.successRate;
    metrics.overallMetrics.errorRate = metrics.stageMetrics.errorRate;
    metrics.overallMetrics.averageStageTime = totalStageTime / Object.keys(stages).length;
  }

  /**
   * Calculate stage efficiency
   * @param {Object} stageResult - Stage execution result
   * @returns {number} Efficiency score (0-100)
   */
  calculateStageEfficiency(stageResult) {
    let efficiency = 100; // Start with perfect efficiency
    
    // Penalize long execution times
    const expectedDuration = this.getExpectedStageDuration(stageResult.name);
    if (stageResult.duration > expectedDuration * 1.5) {
      efficiency -= 20; // 20% penalty for slow execution
    } else if (stageResult.duration > expectedDuration) {
      efficiency -= 10; // 10% penalty for slightly slow execution
    }

    // Reward fast execution
    if (stageResult.duration < expectedDuration * 0.5) {
      efficiency += 10; // 10% bonus for very fast execution
    }

    // Check for errors in result
    if (stageResult.error) {
      efficiency -= 50; // 50% penalty for errors
    }

    return Math.max(0, Math.min(100, Math.round(efficiency)));
  }

  /**
   * Get expected duration for a stage
   * @param {string} stageName - Name of the stage
   * @returns {number} Expected duration in ms
   */
  getExpectedStageDuration(stageName) {
    const expectedDurations = {
      'Retrieve.AgentsMD': 100,
      'Detect.RepoFacts': 150,
      'Retrieve.Context7': 300,
      'Retrieve.RAG': 200,
      'Read.Snippet': 150,
      'Reason.Plan': 400,
      'Edit': 500,
      'Validate': 100,
      'Gate': 100,
      'Document': 200,
      'Learn': 100
    };
    
    return expectedDurations[stageName] || 200;
  }

  /**
   * Calculate efficiency metrics
   * @param {Object} metrics - Metrics object to update
   */
  calculateEfficiencyMetrics(metrics) {
    const stageEfficiency = metrics.stageMetrics.efficiency;
    const efficiencyValues = Object.values(stageEfficiency);
    
    if (efficiencyValues.length > 0) {
      const avgEfficiency = efficiencyValues.reduce((sum, eff) => sum + eff, 0) / efficiencyValues.length;
      const minEfficiency = Math.min(...efficiencyValues);
      const maxEfficiency = Math.max(...efficiencyValues);
      
      metrics.efficiency = {
        average: Math.round(avgEfficiency),
        minimum: minEfficiency,
        maximum: maxEfficiency,
        distribution: this.calculateEfficiencyDistribution(efficiencyValues)
      };
    }
  }

  /**
   * Calculate performance metrics
   * @param {Object} metrics - Metrics object to update
   */
  calculatePerformanceMetrics(metrics) {
    const stageTimings = metrics.stageMetrics.timings;
    const timingValues = Object.values(stageTimings).map(s => s.duration);
    
    if (timingValues.length > 0) {
      const avgTime = timingValues.reduce((sum, time) => sum + time, 0) / timingValues.length;
      const minTime = Math.min(...timingValues);
      const maxTime = Math.max(...timingValues);
      
      // Find slowest and fastest stages
      const slowestStage = Object.entries(stageTimings)
        .reduce((max, [name, stage]) => stage.duration > max.duration ? { name, ...stage } : max, { duration: 0 });
      
      const fastestStage = Object.entries(stageTimings)
        .reduce((min, [name, stage]) => stage.duration < min.duration ? { name, ...stage } : min, { duration: Infinity });
      
      metrics.performance = {
        averageStageTime: Math.round(avgTime),
        fastestStageTime: minTime,
        slowestStageTime: maxTime,
        slowestStage: slowestStage.name,
        fastestStage: fastestStage.name,
        totalExecutionTime: metrics.totalExecutionTime,
        throughput: this.calculateThroughput(metrics)
      };
    }
  }

  /**
   * Calculate efficiency distribution
   * @param {Array} efficiencyValues - Array of efficiency values
   * @returns {Object} Efficiency distribution
   */
  calculateEfficiencyDistribution(efficiencyValues) {
    const distribution = {
      excellent: 0, // 90-100
      good: 0,      // 70-89
      average: 0,   // 50-69
      poor: 0       // 0-49
    };
    
    for (const efficiency of efficiencyValues) {
      if (efficiency >= 90) {
        distribution.excellent++;
      } else if (efficiency >= 70) {
        distribution.good++;
      } else if (efficiency >= 50) {
        distribution.average++;
      } else {
        distribution.poor++;
      }
    }
    
    return distribution;
  }

  /**
   * Calculate pipeline throughput
   * @param {Object} metrics - Metrics object
   * @returns {number} Throughput (stages per minute)
   */
  calculateThroughput(metrics) {
    const totalTimeMinutes = metrics.totalExecutionTime / 60000; // Convert to minutes
    const totalStages = Object.keys(metrics.stageMetrics.timings).length;
    
    return totalTimeMinutes > 0 ? Math.round(totalStages / totalTimeMinutes) : 0;
  }

  /**
   * Generate performance recommendations
   * @param {Object} metrics - Pipeline metrics
   * @returns {Array} Array of recommendations
   */
  generatePerformanceRecommendations(metrics) {
    const recommendations = [];
    
    // Check overall performance
    if (metrics.totalExecutionTime > 5000) { // 5 seconds
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Pipeline execution time is high. Consider optimizing slow stages.',
        details: `Total time: ${metrics.totalExecutionTime}ms`
      });
    }
    
    // Check stage efficiency
    if (metrics.efficiency.average < 70) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        message: 'Average stage efficiency is low. Review stage implementations.',
        details: `Average efficiency: ${metrics.efficiency.average}%`
      });
    }
    
    // Check for slow stages
    if (metrics.performance.slowestStageTime > 1000) { // 1 second
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `Stage '${metrics.performance.slowestStage}' is taking too long.`,
        details: `Duration: ${metrics.performance.slowestStageTime}ms`
      });
    }
    
    // Check success rate
    if (metrics.stageMetrics.successRate < 0.9) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Pipeline success rate is low. Investigate failing stages.',
        details: `Success rate: ${Math.round(metrics.stageMetrics.successRate * 100)}%`
      });
    }
    
    // Check efficiency distribution
    if (metrics.efficiency.distribution.poor > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: 'Some stages have poor efficiency. Review and optimize.',
        details: `${metrics.efficiency.distribution.poor} stages with poor efficiency`
      });
    }
    
    return recommendations;
  }

  /**
   * Compare pipeline metrics between approaches
   * @param {Object} cursorMetrics - Cursor-only metrics
   * @param {Object} localmcpMetrics - LocalMCP metrics
   * @returns {Object} Comparison results
   */
  comparePipelineMetrics(cursorMetrics, localmcpMetrics) {
    const comparison = {
      executionTime: {
        cursor: cursorMetrics.totalExecutionTime || 0,
        localmcp: localmcpMetrics.totalExecutionTime || 0,
        difference: (localmcpMetrics.totalExecutionTime || 0) - (cursorMetrics.totalExecutionTime || 0),
        improvement: this.calculateImprovementPercentage(
          cursorMetrics.totalExecutionTime || 0,
          localmcpMetrics.totalExecutionTime || 0,
          'lower'
        )
      },
      efficiency: {
        cursor: cursorMetrics.efficiency?.average || 0,
        localmcp: localmcpMetrics.efficiency?.average || 0,
        difference: (localmcpMetrics.efficiency?.average || 0) - (cursorMetrics.efficiency?.average || 0),
        improvement: this.calculateImprovementPercentage(
          cursorMetrics.efficiency?.average || 0,
          localmcpMetrics.efficiency?.average || 0,
          'higher'
        )
      },
      successRate: {
        cursor: cursorMetrics.stageMetrics?.successRate || 0,
        localmcp: localmcpMetrics.stageMetrics?.successRate || 0,
        difference: (localmcpMetrics.stageMetrics?.successRate || 0) - (cursorMetrics.stageMetrics?.successRate || 0),
        improvement: this.calculateImprovementPercentage(
          cursorMetrics.stageMetrics?.successRate || 0,
          localmcpMetrics.stageMetrics?.successRate || 0,
          'higher'
        )
      },
      throughput: {
        cursor: cursorMetrics.performance?.throughput || 0,
        localmcp: localmcpMetrics.performance?.throughput || 0,
        difference: (localmcpMetrics.performance?.throughput || 0) - (cursorMetrics.performance?.throughput || 0),
        improvement: this.calculateImprovementPercentage(
          cursorMetrics.performance?.throughput || 0,
          localmcpMetrics.performance?.throughput || 0,
          'higher'
        )
      }
    };

    return comparison;
  }

  /**
   * Calculate improvement percentage
   * @param {number} original - Original value
   * @param {number} improved - Improved value
   * @param {string} direction - 'higher' or 'lower' (better)
   * @returns {number} Improvement percentage
   */
  calculateImprovementPercentage(original, improved, direction) {
    if (original === 0) return 0;
    
    const difference = improved - original;
    const percentage = Math.abs(difference / original) * 100;
    
    if (direction === 'higher') {
      return difference > 0 ? Math.round(percentage) : -Math.round(percentage);
    } else {
      return difference < 0 ? Math.round(percentage) : -Math.round(percentage);
    }
  }

  /**
   * Generate pipeline performance report
   * @param {Object} metrics - Pipeline metrics
   * @returns {Object} Performance report
   */
  generatePerformanceReport(metrics) {
    return {
      summary: {
        totalExecutionTime: metrics.totalExecutionTime,
        averageEfficiency: metrics.efficiency?.average || 0,
        successRate: metrics.stageMetrics?.successRate || 0,
        throughput: metrics.performance?.throughput || 0,
        overallScore: this.calculateOverallScore(metrics)
      },
      stageAnalysis: this.analyzeStagePerformance(metrics),
      recommendations: metrics.recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate overall pipeline score
   * @param {Object} metrics - Pipeline metrics
   * @returns {number} Overall score (0-100)
   */
  calculateOverallScore(metrics) {
    let score = 0;
    
    // Execution time score (30% weight)
    const timeScore = Math.max(0, 100 - (metrics.totalExecutionTime / 100));
    score += timeScore * 0.3;
    
    // Efficiency score (40% weight)
    const efficiencyScore = metrics.efficiency?.average || 0;
    score += efficiencyScore * 0.4;
    
    // Success rate score (30% weight)
    const successScore = (metrics.stageMetrics?.successRate || 0) * 100;
    score += successScore * 0.3;
    
    return Math.round(score);
  }

  /**
   * Analyze individual stage performance
   * @param {Object} metrics - Pipeline metrics
   * @returns {Object} Stage performance analysis
   */
  analyzeStagePerformance(metrics) {
    const analysis = {};
    
    for (const [stageName, stageData] of Object.entries(metrics.stageMetrics.timings)) {
      const efficiency = metrics.stageMetrics.efficiency[stageName] || 0;
      const expectedDuration = this.getExpectedStageDuration(stageName);
      
      analysis[stageName] = {
        duration: stageData.duration,
        efficiency,
        status: stageData.status,
        performance: this.categorizeStagePerformance(stageData.duration, expectedDuration, efficiency)
      };
    }
    
    return analysis;
  }

  /**
   * Categorize stage performance
   * @param {number} duration - Actual duration
   * @param {number} expected - Expected duration
   * @param {number} efficiency - Stage efficiency
   * @returns {string} Performance category
   */
  categorizeStagePerformance(duration, expected, efficiency) {
    if (efficiency >= 90) return 'excellent';
    if (efficiency >= 70) return 'good';
    if (efficiency >= 50) return 'average';
    return 'poor';
  }
}

export { PipelineMetrics };
