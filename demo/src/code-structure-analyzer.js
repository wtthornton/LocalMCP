/**
 * Code Structure Analyzer
 * 
 * This module analyzes the structure and quality of generated code,
 * providing insights into code organization, patterns, and best practices.
 */

const fs = require('fs').promises;
const path = require('path');

class CodeStructureAnalyzer {
  constructor() {
    this.fileExtensions = {
      typescript: ['.ts', '.tsx'],
      javascript: ['.js', '.jsx'],
      css: ['.css', '.scss', '.sass'],
      html: ['.html', '.htm'],
      json: ['.json'],
      markdown: ['.md', '.mdx']
    };
  }

  /**
   * Analyze code structure for a set of files
   * @param {Array} files - Array of file objects with path and content
   * @param {string} approach - 'cursor-only' or 'localmcp'
   * @returns {Object} Structure analysis results
   */
  async analyzeCodeStructure(files, approach) {
    console.log(`🔍 Analyzing code structure for ${approach} approach...`);
    
    const analysis = {
      approach,
      timestamp: new Date().toISOString(),
      fileAnalysis: [],
      overallMetrics: {
        totalFiles: files.length,
        totalLines: 0,
        totalSize: 0,
        fileTypes: {},
        complexity: 0,
        quality: 0
      },
      patterns: {
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        types: [],
        components: []
      },
      bestPractices: {
        hasTests: false,
        hasTypes: false,
        hasDocumentation: false,
        hasLinting: false,
        hasFormatting: false,
        followsConventions: false
      },
      projectStructure: {
        hasConfigFiles: false,
        hasPackageJson: false,
        hasReadme: false,
        hasGitignore: false,
        hasDockerfile: false,
        hasTests: false,
        hasStories: false
      }
    };

    // Analyze each file
    for (const file of files) {
      const fileAnalysis = await this.analyzeFile(file);
      analysis.fileAnalysis.push(fileAnalysis);
      
      // Update overall metrics
      analysis.overallMetrics.totalLines += fileAnalysis.lines;
      analysis.overallMetrics.totalSize += fileAnalysis.size;
      
      // Update file types
      const extension = path.extname(file.path);
      analysis.overallMetrics.fileTypes[extension] = (analysis.overallMetrics.fileTypes[extension] || 0) + 1;
      
      // Update patterns
      this.mergePatterns(analysis.patterns, fileAnalysis.patterns);
      
      // Update best practices
      this.updateBestPractices(analysis.bestPractices, fileAnalysis);
      
      // Update project structure
      this.updateProjectStructure(analysis.projectStructure, file.path);
    }

    // Calculate overall complexity and quality
    analysis.overallMetrics.complexity = this.calculateComplexity(analysis.fileAnalysis);
    analysis.overallMetrics.quality = this.calculateQuality(analysis);

    console.log(`✅ Code structure analysis completed for ${approach}`);
    
    return analysis;
  }

  /**
   * Analyze individual file
   * @param {Object} file - File object with path and content
   * @returns {Object} File analysis results
   */
  async analyzeFile(file) {
    const extension = path.extname(file.path);
    const fileName = path.basename(file.path);
    const content = file.content || '';
    const lines = content.split('\n');
    
    const analysis = {
      path: file.path,
      fileName,
      extension,
      lines: lines.length,
      size: file.size || Buffer.byteLength(content, 'utf8'),
      patterns: {
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        types: [],
        components: []
      },
      metrics: {
        complexity: 0,
        readability: 0,
        maintainability: 0
      },
      issues: []
    };

    // Analyze based on file type
    if (this.isTypeScriptFile(extension)) {
      this.analyzeTypeScriptFile(content, analysis);
    } else if (this.isJavaScriptFile(extension)) {
      this.analyzeJavaScriptFile(content, analysis);
    } else if (this.isCSSFile(extension)) {
      this.analyzeCSSFile(content, analysis);
    } else if (this.isJSONFile(extension)) {
      this.analyzeJSONFile(content, analysis);
    } else if (this.isHTMLFile(extension)) {
      this.analyzeHTMLFile(content, analysis);
    }

    // Calculate metrics
    analysis.metrics.complexity = this.calculateFileComplexity(content);
    analysis.metrics.readability = this.calculateReadability(content);
    analysis.metrics.maintainability = this.calculateMaintainability(analysis);

    return analysis;
  }

  /**
   * Analyze TypeScript file
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  analyzeTypeScriptFile(content, analysis) {
    // Extract imports
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      analysis.patterns.imports.push({
        type: 'import',
        source: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      analysis.patterns.exports.push({
        type: 'export',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract functions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.patterns.functions.push({
        type: 'function',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract classes
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.patterns.classes.push({
        type: 'class',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract interfaces
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      analysis.patterns.interfaces.push({
        type: 'interface',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract types
    const typeRegex = /(?:export\s+)?type\s+(\w+)/g;
    while ((match = typeRegex.exec(content)) !== null) {
      analysis.patterns.types.push({
        type: 'type',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract React components
    const componentRegex = /(?:export\s+)?(?:const|function)\s+(\w+)\s*[:=]\s*(?:React\.)?(?:FC|FunctionComponent)/g;
    while ((match = componentRegex.exec(content)) !== null) {
      analysis.patterns.components.push({
        type: 'component',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Check for TypeScript specific issues
    this.checkTypeScriptIssues(content, analysis);
  }

  /**
   * Analyze JavaScript file
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  analyzeJavaScriptFile(content, analysis) {
    // Extract imports (ES6 modules)
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      analysis.patterns.imports.push({
        type: 'import',
        source: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract exports
    const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      analysis.patterns.exports.push({
        type: 'export',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract functions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.patterns.functions.push({
        type: 'function',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract classes
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.patterns.classes.push({
        type: 'class',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract React components
    const componentRegex = /(?:export\s+)?(?:const|function)\s+(\w+)\s*[:=]\s*(?:React\.)?(?:FC|FunctionComponent)/g;
    while ((match = componentRegex.exec(content)) !== null) {
      analysis.patterns.components.push({
        type: 'component',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Check for JavaScript specific issues
    this.checkJavaScriptIssues(content, analysis);
  }

  /**
   * Analyze CSS file
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  analyzeCSSFile(content, analysis) {
    // Extract CSS classes
    const classRegex = /\.([\w-]+)/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.patterns.classes.push({
        type: 'css-class',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract CSS variables
    const variableRegex = /--([\w-]+)/g;
    while ((match = variableRegex.exec(content)) !== null) {
      analysis.patterns.types.push({
        type: 'css-variable',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Check for CSS best practices
    this.checkCSSIssues(content, analysis);
  }

  /**
   * Analyze JSON file
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  analyzeJSONFile(content, analysis) {
    try {
      const json = JSON.parse(content);
      
      // Analyze package.json
      if (analysis.fileName === 'package.json') {
        analysis.patterns.exports.push({
          type: 'package',
          name: json.name || 'unknown',
          version: json.version || 'unknown'
        });
      }
      
      // Check for JSON validity
      analysis.metrics.complexity = this.calculateJSONComplexity(json);
    } catch (error) {
      analysis.issues.push({
        type: 'syntax',
        message: 'Invalid JSON syntax',
        severity: 'error'
      });
    }
  }

  /**
   * Analyze HTML file
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  analyzeHTMLFile(content, analysis) {
    // Extract HTML elements
    const elementRegex = /<(\w+)/g;
    let match;
    while ((match = elementRegex.exec(content)) !== null) {
      analysis.patterns.components.push({
        type: 'html-element',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Check for HTML best practices
    this.checkHTMLIssues(content, analysis);
  }

  /**
   * Check TypeScript specific issues
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  checkTypeScriptIssues(content, analysis) {
    // Check for any types
    if (!content.includes('interface ') && !content.includes('type ') && !content.includes(': ')) {
      analysis.issues.push({
        type: 'typescript',
        message: 'No TypeScript types found',
        severity: 'warning'
      });
    }

    // Check for strict mode
    if (!content.includes('strict') && content.includes('tsconfig')) {
      analysis.issues.push({
        type: 'typescript',
        message: 'Consider enabling strict mode in TypeScript',
        severity: 'suggestion'
      });
    }
  }

  /**
   * Check JavaScript specific issues
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  checkJavaScriptIssues(content, analysis) {
    // Check for var usage
    if (content.includes('var ')) {
      analysis.issues.push({
        type: 'javascript',
        message: 'Consider using let/const instead of var',
        severity: 'warning'
      });
    }

    // Check for console.log
    if (content.includes('console.log')) {
      analysis.issues.push({
        type: 'javascript',
        message: 'Remove console.log statements in production code',
        severity: 'warning'
      });
    }
  }

  /**
   * Check CSS specific issues
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  checkCSSIssues(content, analysis) {
    // Check for !important usage
    const importantCount = (content.match(/!important/g) || []).length;
    if (importantCount > 3) {
      analysis.issues.push({
        type: 'css',
        message: `Too many !important declarations (${importantCount})`,
        severity: 'warning'
      });
    }

    // Check for magic numbers
    const magicNumbers = content.match(/\d+px/g) || [];
    if (magicNumbers.length > 10) {
      analysis.issues.push({
        type: 'css',
        message: 'Consider using CSS variables for repeated values',
        severity: 'suggestion'
      });
    }
  }

  /**
   * Check HTML specific issues
   * @param {string} content - File content
   * @param {Object} analysis - Analysis object to update
   */
  checkHTMLIssues(content, analysis) {
    // Check for missing alt attributes
    const imgTags = content.match(/<img[^>]*>/g) || [];
    const imgWithoutAlt = imgTags.filter(tag => !tag.includes('alt='));
    if (imgWithoutAlt.length > 0) {
      analysis.issues.push({
        type: 'html',
        message: 'Images should have alt attributes for accessibility',
        severity: 'warning'
      });
    }

    // Check for semantic HTML
    if (!content.includes('<main>') && !content.includes('<article>') && !content.includes('<section>')) {
      analysis.issues.push({
        type: 'html',
        message: 'Consider using semantic HTML elements',
        severity: 'suggestion'
      });
    }
  }

  /**
   * Calculate file complexity
   * @param {string} content - File content
   * @returns {number} Complexity score
   */
  calculateFileComplexity(content) {
    let complexity = 0;
    
    // Count control structures
    complexity += (content.match(/\bif\b/g) || []).length;
    complexity += (content.match(/\bfor\b/g) || []).length;
    complexity += (content.match(/\bwhile\b/g) || []).length;
    complexity += (content.match(/\bswitch\b/g) || []).length;
    complexity += (content.match(/\bcase\b/g) || []).length;
    complexity += (content.match(/\btry\b/g) || []).length;
    complexity += (content.match(/\bcatch\b/g) || []).length;
    complexity += (content.match(/\bthrow\b/g) || []).length;
    
    // Count functions and methods
    complexity += (content.match(/\bfunction\b/g) || []).length;
    complexity += (content.match(/\b=>\s*{/g) || []).length;
    
    // Count classes
    complexity += (content.match(/\bclass\b/g) || []).length;
    
    return complexity;
  }

  /**
   * Calculate readability score
   * @param {string} content - File content
   * @returns {number} Readability score (0-100)
   */
  calculateReadability(content) {
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    if (totalLines === 0) return 0;
    
    let score = 100;
    
    // Penalize long lines
    const longLines = lines.filter(line => line.length > 120).length;
    score -= (longLines / totalLines) * 30;
    
    // Penalize very long functions
    const functionLines = this.countFunctionLines(content);
    const avgFunctionLength = functionLines.total > 0 ? functionLines.sum / functionLines.total : 0;
    if (avgFunctionLength > 50) {
      score -= 20;
    }
    
    // Penalize deep nesting
    const maxNesting = this.calculateMaxNesting(content);
    if (maxNesting > 4) {
      score -= 15;
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate maintainability score
   * @param {Object} analysis - File analysis object
   * @returns {number} Maintainability score (0-100)
   */
  calculateMaintainability(analysis) {
    let score = 100;
    
    // Penalize high complexity
    if (analysis.metrics.complexity > 20) {
      score -= 30;
    } else if (analysis.metrics.complexity > 10) {
      score -= 15;
    }
    
    // Penalize many issues
    const errorCount = analysis.issues.filter(issue => issue.severity === 'error').length;
    const warningCount = analysis.issues.filter(issue => issue.severity === 'warning').length;
    
    score -= errorCount * 20;
    score -= warningCount * 5;
    
    // Reward good practices
    if (analysis.patterns.functions.length > 0) {
      score += 10; // Has functions
    }
    
    if (analysis.patterns.classes.length > 0) {
      score += 5; // Has classes
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate overall complexity
   * @param {Array} fileAnalyses - Array of file analysis objects
   * @returns {number} Overall complexity score
   */
  calculateComplexity(fileAnalyses) {
    const totalComplexity = fileAnalyses.reduce((sum, analysis) => sum + analysis.metrics.complexity, 0);
    const totalFiles = fileAnalyses.length;
    
    return totalFiles > 0 ? Math.round(totalComplexity / totalFiles) : 0;
  }

  /**
   * Calculate overall quality
   * @param {Object} analysis - Overall analysis object
   * @returns {number} Overall quality score (0-100)
   */
  calculateQuality(analysis) {
    let score = 0;
    
    // Base score from file analyses
    const fileScores = analysis.fileAnalysis.map(file => file.metrics.maintainability);
    const avgFileScore = fileScores.length > 0 ? fileScores.reduce((sum, score) => sum + score, 0) / fileScores.length : 0;
    score += avgFileScore * 0.6;
    
    // Bonus for best practices
    const bestPractices = analysis.bestPractices;
    if (bestPractices.hasTests) score += 10;
    if (bestPractices.hasTypes) score += 10;
    if (bestPractices.hasDocumentation) score += 5;
    if (bestPractices.hasLinting) score += 5;
    if (bestPractices.followsConventions) score += 10;
    
    // Bonus for project structure
    const projectStructure = analysis.projectStructure;
    if (projectStructure.hasConfigFiles) score += 5;
    if (projectStructure.hasPackageJson) score += 5;
    if (projectStructure.hasReadme) score += 5;
    
    return Math.min(100, Math.round(score));
  }

  /**
   * Helper methods
   */
  isTypeScriptFile(extension) {
    return this.fileExtensions.typescript.includes(extension);
  }

  isJavaScriptFile(extension) {
    return this.fileExtensions.javascript.includes(extension);
  }

  isCSSFile(extension) {
    return this.fileExtensions.css.includes(extension);
  }

  isJSONFile(extension) {
    return this.fileExtensions.json.includes(extension);
  }

  isHTMLFile(extension) {
    return this.fileExtensions.html.includes(extension);
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  countFunctionLines(content) {
    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{/g;
    let match;
    let total = 0;
    let sum = 0;
    
    while ((match = functionRegex.exec(content)) !== null) {
      total++;
      // This is a simplified calculation
      sum += 10; // Assume average function length
    }
    
    return { total, sum };
  }

  calculateMaxNesting(content) {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  calculateJSONComplexity(json) {
    if (typeof json !== 'object' || json === null) return 0;
    
    let complexity = 0;
    
    if (Array.isArray(json)) {
      complexity += json.length;
      for (const item of json) {
        complexity += this.calculateJSONComplexity(item);
      }
    } else {
      complexity += Object.keys(json).length;
      for (const value of Object.values(json)) {
        complexity += this.calculateJSONComplexity(value);
      }
    }
    
    return complexity;
  }

  mergePatterns(target, source) {
    for (const key in source) {
      if (Array.isArray(source[key])) {
        target[key] = target[key] || [];
        target[key].push(...source[key]);
      }
    }
  }

  updateBestPractices(target, fileAnalysis) {
    if (fileAnalysis.fileName.includes('.test.') || fileAnalysis.fileName.includes('.spec.')) {
      target.hasTests = true;
    }
    
    if (fileAnalysis.extension === '.ts' || fileAnalysis.extension === '.tsx') {
      target.hasTypes = true;
    }
    
    if (fileAnalysis.fileName.includes('README') || fileAnalysis.fileName.includes('.md')) {
      target.hasDocumentation = true;
    }
    
    if (fileAnalysis.fileName.includes('.eslintrc') || fileAnalysis.fileName.includes('.prettierrc')) {
      target.hasLinting = true;
    }
  }

  updateProjectStructure(target, filePath) {
    const fileName = path.basename(filePath);
    
    if (fileName === 'package.json') {
      target.hasPackageJson = true;
    }
    
    if (fileName === 'README.md') {
      target.hasReadme = true;
    }
    
    if (fileName === '.gitignore') {
      target.hasGitignore = true;
    }
    
    if (fileName === 'Dockerfile') {
      target.hasDockerfile = true;
    }
    
    if (fileName.includes('.test.') || fileName.includes('.spec.')) {
      target.hasTests = true;
    }
    
    if (fileName.includes('.stories.')) {
      target.hasStories = true;
    }
    
    if (fileName.includes('config') || fileName.includes('tsconfig') || fileName.includes('webpack')) {
      target.hasConfigFiles = true;
    }
  }
}

export { CodeStructureAnalyzer };
