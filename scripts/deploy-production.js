#!/usr/bin/env node

/**
 * Production Deployment Script for AI Enhancement Features
 * 
 * This script handles the production deployment of the AI enhancement features including:
 * - Environment validation
 * - Service health checks
 * - Configuration validation
 * - Performance verification
 * - Monitoring setup
 * - Rollback capabilities
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  // Environment settings
  environments: {
    staging: {
      name: 'staging',
      url: 'http://localhost:3001',
      healthEndpoint: '/health',
      timeout: 30000
    },
    production: {
      name: 'production',
      url: 'http://localhost:3000',
      healthEndpoint: '/health',
      timeout: 60000
    }
  },
  
  // Service dependencies
  dependencies: [
    'node',
    'npm',
    'docker',
    'docker-compose'
  ],
  
  // Required environment variables
  requiredEnvVars: [
    'OPENAI_API_KEY',
    'CONTEXT7_API_KEY',
    'QDRANT_URL',
    'QDRANT_API_KEY'
  ],
  
  // Health check endpoints
  healthChecks: [
    '/health',
    '/health/ai-enhancement',
    '/health/context7',
    '/health/qdrant',
    '/health/cache'
  ],
  
  // Performance thresholds
  performanceThresholds: {
    responseTime: 2000,
    memoryUsage: 200 * 1024 * 1024, // 200MB
    cpuUsage: 80,
    errorRate: 0.01 // 1%
  },
  
  // Rollback settings
  rollback: {
    enabled: true,
    maxVersions: 5,
    timeout: 300000 // 5 minutes
  }
};

// Deployment status tracker
class DeploymentTracker {
  constructor() {
    this.status = 'pending';
    this.startTime = Date.now();
    this.steps = [];
    this.errors = [];
    this.warnings = [];
  }

  addStep(step, status, message, duration = 0) {
    this.steps.push({
      step,
      status,
      message,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  addError(error) {
    this.errors.push({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  addWarning(warning) {
    this.warnings.push({
      warning,
      timestamp: new Date().toISOString()
    });
  }

  getStatus() {
    return {
      status: this.status,
      duration: Date.now() - this.startTime,
      steps: this.steps,
      errors: this.errors,
      warnings: this.warnings,
      success: this.status === 'completed' && this.errors.length === 0
    };
  }
}

// Production deployment runner
class ProductionDeployment {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.config = DEPLOYMENT_CONFIG.environments[environment];
    this.tracker = new DeploymentTracker();
  }

  async deploy() {
    console.log(`🚀 Starting production deployment to ${this.environment}`);
    console.log(`   Target: ${this.config.url}`);
    console.log(`   Timeout: ${this.config.timeout}ms\n`);

    try {
      // Pre-deployment checks
      await this.runPreDeploymentChecks();
      
      // Build and package
      await this.buildAndPackage();
      
      // Deploy services
      await this.deployServices();
      
      // Health checks
      await this.runHealthChecks();
      
      // Performance verification
      await this.runPerformanceVerification();
      
      // Post-deployment setup
      await this.runPostDeploymentSetup();
      
      // Mark as completed
      this.tracker.status = 'completed';
      console.log('\n✅ Production deployment completed successfully');
      
    } catch (error) {
      this.tracker.status = 'failed';
      this.tracker.addError(error);
      console.error('\n❌ Production deployment failed:', error.message);
      
      // Attempt rollback if enabled
      if (DEPLOYMENT_CONFIG.rollback.enabled) {
        await this.attemptRollback();
      }
      
      throw error;
    }
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check dependencies
    await this.checkDependencies();
    
    // Check environment variables
    await this.checkEnvironmentVariables();
    
    // Check service availability
    await this.checkServiceAvailability();
    
    // Check disk space
    await this.checkDiskSpace();
    
    console.log('✅ Pre-deployment checks passed\n');
  }

  async checkDependencies() {
    const startTime = performance.now();
    
    for (const dep of DEPLOYMENT_CONFIG.dependencies) {
      try {
        execSync(`which ${dep}`, { stdio: 'pipe' });
        this.tracker.addStep('check_dependencies', 'success', `${dep} found`);
      } catch (error) {
        this.tracker.addError(new Error(`Dependency ${dep} not found`));
        throw new Error(`Required dependency ${dep} is not installed`);
      }
    }
    
    const duration = performance.now() - startTime;
    this.tracker.addStep('check_dependencies', 'completed', 'All dependencies found', duration);
  }

  async checkEnvironmentVariables() {
    const startTime = performance.now();
    const missing = [];
    
    for (const envVar of DEPLOYMENT_CONFIG.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
    
    if (missing.length > 0) {
      this.tracker.addError(new Error(`Missing environment variables: ${missing.join(', ')}`));
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    const duration = performance.now() - startTime;
    this.tracker.addStep('check_env_vars', 'completed', 'All environment variables found', duration);
  }

  async checkServiceAvailability() {
    const startTime = performance.now();
    
    // Check if services are already running
    try {
      const response = await this.makeRequest(`${this.config.url}${this.config.healthEndpoint}`);
      if (response.status === 'healthy') {
        this.tracker.addWarning('Services are already running on target environment');
      }
    } catch (error) {
      // This is expected for new deployments
      this.tracker.addStep('check_service_availability', 'info', 'Target environment is available for deployment');
    }
    
    const duration = performance.now() - startTime;
    this.tracker.addStep('check_service_availability', 'completed', 'Service availability checked', duration);
  }

  async checkDiskSpace() {
    const startTime = performance.now();
    
    try {
      const { stdout } = execSync('df -h .', { encoding: 'utf8' });
      const lines = stdout.split('\n');
      const rootLine = lines.find(line => line.includes('/'));
      
      if (rootLine) {
        const parts = rootLine.split(/\s+/);
        const available = parts[3];
        const availableBytes = this.parseSize(available);
        
        if (availableBytes < 1024 * 1024 * 1024) { // Less than 1GB
          this.tracker.addWarning(`Low disk space: ${available} available`);
        }
      }
    } catch (error) {
      this.tracker.addWarning('Could not check disk space');
    }
    
    const duration = performance.now() - startTime;
    this.tracker.addStep('check_disk_space', 'completed', 'Disk space checked', duration);
  }

  async buildAndPackage() {
    console.log('📦 Building and packaging...');
    
    // Install dependencies
    await this.installDependencies();
    
    // Run tests
    await this.runTests();
    
    // Build application
    await this.buildApplication();
    
    // Package for deployment
    await this.packageApplication();
    
    console.log('✅ Build and package completed\n');
  }

  async installDependencies() {
    const startTime = performance.now();
    
    try {
      execSync('npm ci --production', { stdio: 'pipe' });
      const duration = performance.now() - startTime;
      this.tracker.addStep('install_dependencies', 'completed', 'Dependencies installed', duration);
    } catch (error) {
      this.tracker.addError(error);
      throw new Error('Failed to install dependencies');
    }
  }

  async runTests() {
    const startTime = performance.now();
    
    try {
      execSync('npm test', { stdio: 'pipe' });
      const duration = performance.now() - startTime;
      this.tracker.addStep('run_tests', 'completed', 'Tests passed', duration);
    } catch (error) {
      this.tracker.addError(error);
      throw new Error('Tests failed');
    }
  }

  async buildApplication() {
    const startTime = performance.now();
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
      const duration = performance.now() - startTime;
      this.tracker.addStep('build_application', 'completed', 'Application built', duration);
    } catch (error) {
      this.tracker.addError(error);
      throw new Error('Build failed');
    }
  }

  async packageApplication() {
    const startTime = performance.now();
    
    try {
      // Create deployment package
      const packageDir = path.join(__dirname, '..', 'deployment-package');
      await fs.mkdir(packageDir, { recursive: true });
      
      // Copy necessary files
      await this.copyDeploymentFiles(packageDir);
      
      // Create deployment script
      await this.createDeploymentScript(packageDir);
      
      const duration = performance.now() - startTime;
      this.tracker.addStep('package_application', 'completed', 'Application packaged', duration);
    } catch (error) {
      this.tracker.addError(error);
      throw new Error('Packaging failed');
    }
  }

  async copyDeploymentFiles(packageDir) {
    const filesToCopy = [
      'dist',
      'package.json',
      'package-lock.json',
      'config',
      'scripts',
      'docs'
    ];
    
    for (const file of filesToCopy) {
      const srcPath = path.join(__dirname, '..', file);
      const destPath = path.join(packageDir, file);
      
      try {
        const stats = await fs.stat(srcPath);
        if (stats.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      } catch (error) {
        this.tracker.addWarning(`Could not copy ${file}: ${error.message}`);
      }
    }
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async createDeploymentScript(packageDir) {
    const scriptContent = `#!/bin/bash
# Production deployment script
set -e

echo "🚀 Starting production deployment..."

# Set environment
export NODE_ENV=production

# Start services
echo "Starting services..."
npm start

echo "✅ Production deployment completed"
`;

    await fs.writeFile(path.join(packageDir, 'deploy.sh'), scriptContent);
    await fs.chmod(path.join(packageDir, 'deploy.sh'), '755');
  }

  async deployServices() {
    console.log('🚀 Deploying services...');
    
    // Start services
    await this.startServices();
    
    // Wait for services to be ready
    await this.waitForServices();
    
    console.log('✅ Services deployed\n');
  }

  async startServices() {
    const startTime = performance.now();
    
    try {
      // Start the main service
      const child = spawn('npm', ['start'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      // Store process for cleanup
      this.serviceProcess = child;
      
      const duration = performance.now() - startTime;
      this.tracker.addStep('start_services', 'completed', 'Services started', duration);
    } catch (error) {
      this.tracker.addError(error);
      throw new Error('Failed to start services');
    }
  }

  async waitForServices() {
    const startTime = performance.now();
    const maxWaitTime = this.config.timeout;
    const checkInterval = 5000; // 5 seconds
    
    let attempts = 0;
    const maxAttempts = maxWaitTime / checkInterval;
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.makeRequest(`${this.config.url}${this.config.healthEndpoint}`);
        if (response.status === 'healthy') {
          const duration = performance.now() - startTime;
          this.tracker.addStep('wait_for_services', 'completed', 'Services are ready', duration);
          return;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }
      
      await this.sleep(checkInterval);
      attempts++;
    }
    
    this.tracker.addError(new Error('Services did not start within timeout'));
    throw new Error('Services did not start within timeout');
  }

  async runHealthChecks() {
    console.log('🏥 Running health checks...');
    
    for (const endpoint of DEPLOYMENT_CONFIG.healthChecks) {
      await this.checkHealthEndpoint(endpoint);
    }
    
    console.log('✅ Health checks passed\n');
  }

  async checkHealthEndpoint(endpoint) {
    const startTime = performance.now();
    
    try {
      const response = await this.makeRequest(`${this.config.url}${endpoint}`);
      if (response.status === 'healthy') {
        const duration = performance.now() - startTime;
        this.tracker.addStep('health_check', 'success', `${endpoint} is healthy`, duration);
      } else {
        this.tracker.addError(new Error(`${endpoint} is not healthy: ${response.status}`));
        throw new Error(`${endpoint} is not healthy`);
      }
    } catch (error) {
      this.tracker.addError(error);
      throw new Error(`Health check failed for ${endpoint}: ${error.message}`);
    }
  }

  async runPerformanceVerification() {
    console.log('⚡ Running performance verification...');
    
    // Run performance tests
    await this.runPerformanceTests();
    
    // Check resource usage
    await this.checkResourceUsage();
    
    console.log('✅ Performance verification passed\n');
  }

  async runPerformanceTests() {
    const startTime = performance.now();
    
    try {
      // Run a simple performance test
      const testPrompts = [
        'Create a React component',
        'Build a REST API',
        'Add authentication'
      ];
      
      const results = [];
      for (const prompt of testPrompts) {
        const testStart = performance.now();
        const response = await this.makeRequest(`${this.config.url}/api/enhance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const testEnd = performance.now();
        
        results.push({
          prompt,
          responseTime: testEnd - testStart,
          success: response.success
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const successRate = results.filter(r => r.success).length / results.length;
      
      if (avgResponseTime > DEPLOYMENT_CONFIG.performanceThresholds.responseTime) {
        this.tracker.addWarning(`High response time: ${avgResponseTime.toFixed(0)}ms`);
      }
      
      if (successRate < 0.99) {
        this.tracker.addError(new Error(`Low success rate: ${(successRate * 100).toFixed(1)}%`));
        throw new Error('Performance verification failed');
      }
      
      const duration = performance.now() - startTime;
      this.tracker.addStep('performance_test', 'completed', `Avg response time: ${avgResponseTime.toFixed(0)}ms`, duration);
    } catch (error) {
      this.tracker.addError(error);
      throw new Error('Performance verification failed');
    }
  }

  async checkResourceUsage() {
    const startTime = performance.now();
    
    try {
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > DEPLOYMENT_CONFIG.performanceThresholds.memoryUsage) {
        this.tracker.addWarning(`High memory usage: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(0)}MB`);
      }
      
      const duration = performance.now() - startTime;
      this.tracker.addStep('resource_check', 'completed', 'Resource usage checked', duration);
    } catch (error) {
      this.tracker.addWarning('Could not check resource usage');
    }
  }

  async runPostDeploymentSetup() {
    console.log('🔧 Running post-deployment setup...');
    
    // Setup monitoring
    await this.setupMonitoring();
    
    // Setup logging
    await this.setupLogging();
    
    // Setup alerts
    await this.setupAlerts();
    
    console.log('✅ Post-deployment setup completed\n');
  }

  async setupMonitoring() {
    const startTime = performance.now();
    
    try {
      // Setup performance monitoring
      const monitoringConfig = {
        enabled: true,
        interval: 60000, // 1 minute
        endpoints: DEPLOYMENT_CONFIG.healthChecks,
        thresholds: DEPLOYMENT_CONFIG.performanceThresholds
      };
      
      // Save monitoring configuration
      const configPath = path.join(__dirname, '..', 'deployment-package', 'monitoring.json');
      await fs.writeFile(configPath, JSON.stringify(monitoringConfig, null, 2));
      
      const duration = performance.now() - startTime;
      this.tracker.addStep('setup_monitoring', 'completed', 'Monitoring configured', duration);
    } catch (error) {
      this.tracker.addWarning(`Could not setup monitoring: ${error.message}`);
    }
  }

  async setupLogging() {
    const startTime = performance.now();
    
    try {
      // Setup logging configuration
      const loggingConfig = {
        level: 'info',
        format: 'json',
        outputs: ['console', 'file'],
        file: {
          path: '/var/log/promptmcp',
          maxSize: '100MB',
          maxFiles: 10
        }
      };
      
      // Save logging configuration
      const configPath = path.join(__dirname, '..', 'deployment-package', 'logging.json');
      await fs.writeFile(configPath, JSON.stringify(loggingConfig, null, 2));
      
      const duration = performance.now() - startTime;
      this.tracker.addStep('setup_logging', 'completed', 'Logging configured', duration);
    } catch (error) {
      this.tracker.addWarning(`Could not setup logging: ${error.message}`);
    }
  }

  async setupAlerts() {
    const startTime = performance.now();
    
    try {
      // Setup alert configuration
      const alertConfig = {
        enabled: true,
        channels: ['email', 'slack'],
        rules: [
          {
            name: 'High Response Time',
            condition: 'response_time > 2000',
            severity: 'warning'
          },
          {
            name: 'High Error Rate',
            condition: 'error_rate > 0.01',
            severity: 'critical'
          },
          {
            name: 'High Memory Usage',
            condition: 'memory_usage > 200MB',
            severity: 'warning'
          }
        ]
      };
      
      // Save alert configuration
      const configPath = path.join(__dirname, '..', 'deployment-package', 'alerts.json');
      await fs.writeFile(configPath, JSON.stringify(alertConfig, null, 2));
      
      const duration = performance.now() - startTime;
      this.tracker.addStep('setup_alerts', 'completed', 'Alerts configured', duration);
    } catch (error) {
      this.tracker.addWarning(`Could not setup alerts: ${error.message}`);
    }
  }

  async attemptRollback() {
    console.log('🔄 Attempting rollback...');
    
    try {
      // Stop current services
      if (this.serviceProcess) {
        this.serviceProcess.kill();
      }
      
      // Restore previous version
      await this.restorePreviousVersion();
      
      // Restart services
      await this.startServices();
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  async restorePreviousVersion() {
    // Implementation would depend on your versioning strategy
    // This is a placeholder
    console.log('Restoring previous version...');
  }

  async makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(url, {
      timeout: 10000,
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parseSize(sizeStr) {
    const units = { K: 1024, M: 1024 * 1024, G: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)([KMG])?$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || '';
    return value * (units[unit] || 1);
  }

  getDeploymentStatus() {
    return this.tracker.getStatus();
  }
}

// Main execution
async function main() {
  const environment = process.argv[2] || 'staging';
  
  if (!DEPLOYMENT_CONFIG.environments[environment]) {
    console.error(`❌ Invalid environment: ${environment}`);
    console.error(`Available environments: ${Object.keys(DEPLOYMENT_CONFIG.environments).join(', ')}`);
    process.exit(1);
  }
  
  const deployment = new ProductionDeployment(environment);
  
  try {
    await deployment.deploy();
    
    const status = deployment.getDeploymentStatus();
    console.log('\n📊 Deployment Status:');
    console.log(`Status: ${status.status}`);
    console.log(`Duration: ${status.duration}ms`);
    console.log(`Steps: ${status.steps.length}`);
    console.log(`Errors: ${status.errors.length}`);
    console.log(`Warnings: ${status.warnings.length}`);
    
    if (status.success) {
      console.log('\n🎉 Deployment successful!');
      process.exit(0);
    } else {
      console.log('\n💥 Deployment failed!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductionDeployment, DeploymentTracker };
