/**
 * Result Storage
 * 
 * This module handles storage and retrieval of demo results,
 * including JSON persistence and basic data management.
 */

const fs = require('fs').promises;
const path = require('path');

class ResultStorage {
  constructor(options = {}) {
    this.demoRoot = options.demoRoot || path.join(__dirname, '..');
    this.dataDir = path.join(this.demoRoot, 'data');
    this.resultsDir = path.join(this.dataDir, 'results');
    this.comparisonsDir = path.join(this.dataDir, 'comparisons');
  }

  /**
   * Initialize storage directories
   */
  async initialize() {
    console.log('📁 Initializing result storage...');
    
    const directories = [
      this.dataDir,
      this.resultsDir,
      this.comparisonsDir
    ];

    for (const dir of directories) {
      await this.ensureDirectoryExists(dir);
    }

    console.log('✅ Result storage initialized');
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dirPath}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Save demo result
   * @param {Object} demoResult - Demo result to save
   * @returns {string} Path to saved file
   */
  async saveDemoResult(demoResult) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `demo-${demoResult.id}-${timestamp}.json`;
    const filePath = path.join(this.resultsDir, filename);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(demoResult, null, 2), 'utf8');
      console.log(`💾 Saved demo result: ${filename}`);
      return filePath;
    } catch (error) {
      console.error('❌ Failed to save demo result:', error);
      throw error;
    }
  }

  /**
   * Load demo result by ID
   * @param {string} demoId - Demo ID
   * @returns {Object} Demo result
   */
  async loadDemoResult(demoId) {
    try {
      const files = await fs.readdir(this.resultsDir);
      const demoFile = files.find(file => file.includes(demoId));
      
      if (!demoFile) {
        throw new Error(`Demo result not found: ${demoId}`);
      }
      
      const filePath = path.join(this.resultsDir, demoFile);
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Failed to load demo result:', error);
      throw error;
    }
  }

  /**
   * Load all demo results
   * @returns {Array} Array of demo results
   */
  async loadAllDemoResults() {
    try {
      const files = await fs.readdir(this.resultsDir);
      const demoFiles = files.filter(file => file.startsWith('demo-') && file.endsWith('.json'));
      
      const results = [];
      for (const file of demoFiles) {
        try {
          const filePath = path.join(this.resultsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const demoResult = JSON.parse(content);
          results.push(demoResult);
        } catch (error) {
          console.error(`❌ Failed to load demo file ${file}:`, error.message);
        }
      }
      
      // Sort by timestamp (newest first)
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return results;
    } catch (error) {
      console.error('❌ Failed to load demo results:', error);
      return [];
    }
  }

  /**
   * Load demo results by scenario
   * @param {string} scenarioName - Scenario name
   * @returns {Array} Array of demo results for scenario
   */
  async loadDemoResultsByScenario(scenarioName) {
    const allResults = await this.loadAllDemoResults();
    return allResults.filter(result => result.scenario === scenarioName);
  }

  /**
   * Save comparison result
   * @param {Object} comparison - Comparison result to save
   * @returns {string} Path to saved file
   */
  async saveComparison(comparison) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `comparison-${timestamp}.json`;
    const filePath = path.join(this.comparisonsDir, filename);
    
    try {
      await fs.writeFile(filePath, JSON.stringify(comparison, null, 2), 'utf8');
      console.log(`💾 Saved comparison: ${filename}`);
      return filePath;
    } catch (error) {
      console.error('❌ Failed to save comparison:', error);
      throw error;
    }
  }

  /**
   * Load all comparisons
   * @returns {Array} Array of comparison results
   */
  async loadAllComparisons() {
    try {
      const files = await fs.readdir(this.comparisonsDir);
      const comparisonFiles = files.filter(file => file.startsWith('comparison-') && file.endsWith('.json'));
      
      const comparisons = [];
      for (const file of comparisonFiles) {
        try {
          const filePath = path.join(this.comparisonsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const comparison = JSON.parse(content);
          comparisons.push(comparison);
        } catch (error) {
          console.error(`❌ Failed to load comparison file ${file}:`, error.message);
        }
      }
      
      // Sort by timestamp (newest first)
      comparisons.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return comparisons;
    } catch (error) {
      console.error('❌ Failed to load comparisons:', error);
      return [];
    }
  }

  /**
   * Get demo statistics
   * @returns {Object} Demo statistics
   */
  async getDemoStats() {
    try {
      const allResults = await this.loadAllDemoResults();
      const completedResults = allResults.filter(result => result.status === 'completed');
      const failedResults = allResults.filter(result => result.status === 'failed');
      
      const scenarios = [...new Set(allResults.map(result => result.scenario))];
      const scenarioStats = {};
      
      for (const scenario of scenarios) {
        const scenarioResults = allResults.filter(result => result.scenario === scenario);
        const completedScenarioResults = scenarioResults.filter(result => result.status === 'completed');
        
        scenarioStats[scenario] = {
          total: scenarioResults.length,
          completed: completedScenarioResults.length,
          failed: scenarioResults.length - completedScenarioResults.length,
          successRate: scenarioResults.length > 0 
            ? Math.round((completedScenarioResults.length / scenarioResults.length) * 100)
            : 0,
          averageDuration: completedScenarioResults.length > 0
            ? Math.round(completedScenarioResults.reduce((sum, result) => sum + result.duration, 0) / completedScenarioResults.length)
            : 0
        };
      }
      
      return {
        total: allResults.length,
        completed: completedResults.length,
        failed: failedResults.length,
        successRate: allResults.length > 0 
          ? Math.round((completedResults.length / allResults.length) * 100)
          : 0,
        scenarios: scenarios,
        scenarioStats: scenarioStats,
        averageDuration: completedResults.length > 0
          ? Math.round(completedResults.reduce((sum, result) => sum + result.duration, 0) / completedResults.length)
          : 0,
        lastRun: allResults.length > 0
          ? Math.max(...allResults.map(result => new Date(result.timestamp).getTime()))
          : null
      };
    } catch (error) {
      console.error('❌ Failed to get demo stats:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        successRate: 0,
        scenarios: [],
        scenarioStats: {},
        averageDuration: 0,
        lastRun: null
      };
    }
  }

  /**
   * Get recent demos
   * @param {number} limit - Number of recent demos to return
   * @returns {Array} Array of recent demo results
   */
  async getRecentDemos(limit = 10) {
    const allResults = await this.loadAllDemoResults();
    return allResults.slice(0, limit);
  }

  /**
   * Search demos by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} Array of matching demo results
   */
  async searchDemos(criteria = {}) {
    const allResults = await this.loadAllDemoResults();
    let filteredResults = allResults;
    
    // Filter by scenario
    if (criteria.scenario) {
      filteredResults = filteredResults.filter(result => result.scenario === criteria.scenario);
    }
    
    // Filter by status
    if (criteria.status) {
      filteredResults = filteredResults.filter(result => result.status === criteria.status);
    }
    
    // Filter by date range
    if (criteria.startDate) {
      const startDate = new Date(criteria.startDate);
      filteredResults = filteredResults.filter(result => new Date(result.timestamp) >= startDate);
    }
    
    if (criteria.endDate) {
      const endDate = new Date(criteria.endDate);
      filteredResults = filteredResults.filter(result => new Date(result.timestamp) <= endDate);
    }
    
    // Filter by duration range
    if (criteria.minDuration) {
      filteredResults = filteredResults.filter(result => result.duration >= criteria.minDuration);
    }
    
    if (criteria.maxDuration) {
      filteredResults = filteredResults.filter(result => result.duration <= criteria.maxDuration);
    }
    
    // Sort results
    const sortBy = criteria.sortBy || 'timestamp';
    const sortOrder = criteria.sortOrder || 'desc';
    
    filteredResults.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
    
    // Apply limit
    if (criteria.limit) {
      filteredResults = filteredResults.slice(0, criteria.limit);
    }
    
    return filteredResults;
  }

  /**
   * Delete demo result
   * @param {string} demoId - Demo ID to delete
   * @returns {boolean} Success status
   */
  async deleteDemoResult(demoId) {
    try {
      const files = await fs.readdir(this.resultsDir);
      const demoFile = files.find(file => file.includes(demoId));
      
      if (!demoFile) {
        console.warn(`Demo result not found: ${demoId}`);
        return false;
      }
      
      const filePath = path.join(this.resultsDir, demoFile);
      await fs.unlink(filePath);
      console.log(`🗑️  Deleted demo result: ${demoId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete demo result:', error);
      return false;
    }
  }

  /**
   * Clean up old results
   * @param {number} daysOld - Number of days old to clean up
   * @returns {number} Number of files cleaned up
   */
  async cleanupOldResults(daysOld = 30) {
    console.log(`🧹 Cleaning up results older than ${daysOld} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let cleanedCount = 0;
    
    try {
      const files = await fs.readdir(this.resultsDir);
      
      for (const file of files) {
        const filePath = path.join(this.resultsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          cleanedCount++;
          console.log(`🗑️  Deleted old file: ${file}`);
        }
      }
      
      console.log(`✅ Cleaned up ${cleanedCount} old files`);
      return cleanedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old results:', error);
      return 0;
    }
  }

  /**
   * Export demo results to CSV
   * @param {Array} results - Demo results to export
   * @returns {string} CSV content
   */
  exportToCSV(results) {
    if (results.length === 0) {
      return '';
    }
    
    const headers = [
      'id',
      'scenario',
      'timestamp',
      'duration',
      'status',
      'fileCount',
      'totalSize',
      'contextImprovement',
      'pipelineCoverage'
    ];
    
    const rows = results.map(result => [
      result.id,
      result.scenario,
      result.timestamp,
      result.duration,
      result.status,
      result.metadata?.totalFiles || 0,
      result.metadata?.totalSize || 0,
      result.metadata?.contextImprovement || 0,
      result.metadata?.pipelineCoverage || 0
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  /**
   * Export demo results to JSON
   * @param {Array} results - Demo results to export
   * @returns {string} JSON content
   */
  exportToJSON(results) {
    return JSON.stringify(results, null, 2);
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  async getStorageStats() {
    try {
      const resultsFiles = await fs.readdir(this.resultsDir);
      const comparisonFiles = await fs.readdir(this.comparisonsDir);
      
      let totalSize = 0;
      
      // Calculate total size of results files
      for (const file of resultsFiles) {
        const filePath = path.join(this.resultsDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      // Calculate total size of comparison files
      for (const file of comparisonFiles) {
        const filePath = path.join(this.comparisonsDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return {
        resultsFiles: resultsFiles.length,
        comparisonFiles: comparisonFiles.length,
        totalFiles: resultsFiles.length + comparisonFiles.length,
        totalSize: totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      console.error('❌ Failed to get storage stats:', error);
      return {
        resultsFiles: 0,
        comparisonFiles: 0,
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: 0
      };
    }
  }
}

module.exports = { ResultStorage };
