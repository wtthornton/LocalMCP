/**
 * File System Manager
 * 
 * This module handles file system operations for the demo,
 * including directory creation, file management, and cleanup.
 */

import fs from 'fs/promises';
import path from 'path';

class FileSystemManager {
  constructor(options = {}) {
    this.demoRoot = options.demoRoot || path.join(__dirname, '..');
    this.outputDir = path.join(this.demoRoot, 'output');
    this.reportsDir = path.join(this.demoRoot, 'reports');
    this.validationDir = path.join(this.demoRoot, 'validation');
    this.gatesDir = path.join(this.demoRoot, 'gates');
    this.dataDir = path.join(this.demoRoot, 'data');
  }

  /**
   * Initialize demo directory structure
   */
  async initialize() {
    console.log('📁 Initializing demo directory structure...');
    
    const directories = [
      this.outputDir,
      this.reportsDir,
      this.validationDir,
      this.gatesDir,
      this.dataDir,
      path.join(this.outputDir, 'cursor-only'),
      path.join(this.outputDir, 'localmcp'),
      path.join(this.dataDir, 'results'),
      path.join(this.dataDir, 'comparisons')
    ];

    for (const dir of directories) {
      await this.ensureDirectoryExists(dir);
    }

    console.log('✅ Directory structure initialized');
  }

  /**
   * Ensure directory exists, create if it doesn't
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
   * Save demo results to JSON file
   * @param {Object} results - Demo results
   * @param {string} filename - Filename (without extension)
   * @returns {string} Path to saved file
   */
  async saveDemoResults(results, filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.dataDir, 'results', `${filename}-${timestamp}.json`);
    
    await fs.writeFile(filePath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`💾 Saved demo results: ${filePath}`);
    
    return filePath;
  }

  /**
   * Save validation results
   * @param {Object} validationResults - Validation results
   * @param {string} approach - 'cursor-only' or 'localmcp'
   * @returns {string} Path to saved file
   */
  async saveValidationResults(validationResults, approach) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.validationDir, `${approach}-${timestamp}.json`);
    
    await fs.writeFile(filePath, JSON.stringify(validationResults, null, 2), 'utf8');
    console.log(`💾 Saved validation results: ${filePath}`);
    
    return filePath;
  }

  /**
   * Save gate results
   * @param {Object} gateResults - Gate results
   * @param {string} approach - 'cursor-only' or 'localmcp'
   * @returns {string} Path to saved file
   */
  async saveGateResults(gateResults, approach) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.gatesDir, `${approach}-${timestamp}.json`);
    
    await fs.writeFile(filePath, JSON.stringify(gateResults, null, 2), 'utf8');
    console.log(`💾 Saved gate results: ${filePath}`);
    
    return filePath;
  }

  /**
   * Save HTML report
   * @param {string} htmlContent - HTML content
   * @param {string} filename - Filename (without extension)
   * @returns {string} Path to saved file
   */
  async saveHTMLReport(htmlContent, filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.reportsDir, `${filename}-${timestamp}.html`);
    
    await fs.writeFile(filePath, htmlContent, 'utf8');
    console.log(`📄 Saved HTML report: ${filePath}`);
    
    return filePath;
  }

  /**
   * Get list of generated code files
   * @param {string} approach - 'cursor-only' or 'localmcp'
   * @param {string} scenario - Scenario name
   * @returns {Array} List of file objects
   */
  async getGeneratedFiles(approach, scenario) {
    const scenarioDir = path.join(this.outputDir, approach, scenario);
    
    try {
      const files = await this.getFilesRecursively(scenarioDir);
      return files.map(file => ({
        path: file,
        relativePath: path.relative(this.outputDir, file),
        size: this.getFileSize(file)
      }));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get files recursively from directory
   * @param {string} dirPath - Directory path
   * @returns {Array} Array of file paths
   */
  async getFilesRecursively(dirPath) {
    const files = [];
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        const subFiles = await this.getFilesRecursively(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Get file size
   * @param {string} filePath - File path
   * @returns {number} File size in bytes
   */
  getFileSize(filePath) {
    try {
      const stats = require('fs').statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Read file content
   * @param {string} filePath - File path
   * @returns {string} File content
   */
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`❌ Failed to read file: ${filePath}`, error.message);
      return '';
    }
  }

  /**
   * Clean up old files (optional)
   * @param {number} daysOld - Number of days old files to clean
   */
  async cleanupOldFiles(daysOld = 30) {
    console.log(`🧹 Cleaning up files older than ${daysOld} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const directories = [
      path.join(this.dataDir, 'results'),
      this.validationDir,
      this.gatesDir,
      this.reportsDir
    ];
    
    for (const dir of directories) {
      await this.cleanupDirectory(dir, cutoffDate);
    }
    
    console.log('✅ Cleanup completed');
  }

  /**
   * Clean up directory
   * @param {string} dirPath - Directory path
   * @param {Date} cutoffDate - Cutoff date
   */
  async cleanupDirectory(dirPath, cutoffDate) {
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`🗑️  Deleted old file: ${file}`);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`❌ Cleanup failed for ${dirPath}:`, error.message);
      }
    }
  }

  /**
   * Get demo statistics
   * @returns {Object} Demo statistics
   */
  async getDemoStats() {
    const stats = {
      totalDemos: 0,
      totalFiles: 0,
      totalSize: 0,
      lastRun: null,
      scenarios: {}
    };

    try {
      // Count demo results
      const resultsDir = path.join(this.dataDir, 'results');
      const resultFiles = await fs.readdir(resultsDir);
      stats.totalDemos = resultFiles.length;

      // Get last run time
      if (resultFiles.length > 0) {
        const lastFile = resultFiles.sort().pop();
        const lastFilePath = path.join(resultsDir, lastFile);
        const lastStats = await fs.stat(lastFilePath);
        stats.lastRun = lastStats.mtime;
      }

      // Count generated files
      const approaches = ['cursor-only', 'localmcp'];
      for (const approach of approaches) {
        const approachDir = path.join(this.outputDir, approach);
        const files = await this.getFilesRecursively(approachDir);
        stats.totalFiles += files.length;
        
        for (const file of files) {
          stats.totalSize += this.getFileSize(file);
        }
      }

      // Count scenarios
      for (const approach of approaches) {
        const approachDir = path.join(this.outputDir, approach);
        try {
          const scenarios = await fs.readdir(approachDir);
          for (const scenario of scenarios) {
            if (!stats.scenarios[scenario]) {
              stats.scenarios[scenario] = 0;
            }
            stats.scenarios[scenario]++;
          }
        } catch (error) {
          // Directory doesn't exist yet
        }
      }

    } catch (error) {
      console.error('❌ Failed to get demo stats:', error.message);
    }

    return stats;
  }

  /**
   * Create comparison summary
   * @param {Object} cursorResults - Cursor-only results
   * @param {Object} localmcpResults - LocalMCP results
   * @returns {Object} Comparison summary
   */
  createComparisonSummary(cursorResults, localmcpResults) {
    return {
      timestamp: new Date().toISOString(),
      cursor: {
        fileCount: cursorResults.files?.length || 0,
        executionTime: cursorResults.executionTime || 0,
        quality: cursorResults.quality || {},
        contextUsed: cursorResults.contextUsed || 'none'
      },
      localmcp: {
        fileCount: localmcpResults.files?.length || 0,
        executionTime: localmcpResults.executionTime || 0,
        quality: localmcpResults.quality || {},
        contextUsed: localmcpResults.contextUsed || 'full',
        pipelineStages: localmcpResults.pipelineStages?.length || 0,
        contextMetrics: localmcpResults.contextMetrics || {}
      },
      comparison: {
        fileCountDifference: (localmcpResults.files?.length || 0) - (cursorResults.files?.length || 0),
        timeDifference: (localmcpResults.executionTime || 0) - (cursorResults.executionTime || 0),
        qualityImprovement: this.calculateQualityImprovement(cursorResults.quality, localmcpResults.quality)
      }
    };
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
      fileCount: localmcpQuality.fileCount - cursorQuality.fileCount,
      totalLines: localmcpQuality.totalLines - cursorQuality.totalLines,
      hasTests: localmcpQuality.hasTests ? (cursorQuality.hasTests ? 0 : 1) : (cursorQuality.hasTests ? -1 : 0),
      hasTypes: localmcpQuality.hasTypes ? (cursorQuality.hasTypes ? 0 : 1) : (cursorQuality.hasTypes ? -1 : 0),
      hasDocumentation: localmcpQuality.hasDocumentation ? (cursorQuality.hasDocumentation ? 0 : 1) : (cursorQuality.hasDocumentation ? -1 : 0)
    };

    // Calculate overall improvement score
    const positiveImprovements = Object.values(improvements).filter(val => val > 0).length;
    const totalMetrics = Object.keys(improvements).length;
    improvements.overall = Math.round((positiveImprovements / totalMetrics) * 100);

    return improvements;
  }
}

export { FileSystemManager };
