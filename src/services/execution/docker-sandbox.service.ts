/**
 * Docker Sandbox Service - Container-based isolated execution environment
 * 
 * This service provides secure, isolated execution environments using Docker containers
 * for running untrusted code, tests, and other operations safely.
 * 
 * Benefits for vibe coders:
 * - Secure execution of untrusted code in isolated containers
 * - Resource limits and timeout controls for safety
 * - Automatic cleanup and container management
 * - Support for multiple programming languages and environments
 * - Easy integration with LocalMCP tools and workflows
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Execution result
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  containerId?: string;
  logs?: string[];
}

// Sandbox configuration
export interface SandboxConfig {
  image: string;
  timeout: number; // Execution timeout in milliseconds
  memoryLimit: string; // Memory limit (e.g., '128m', '1g')
  cpuLimit: string; // CPU limit (e.g., '0.5', '1.0')
  networkMode: 'none' | 'bridge' | 'host';
  readonly: boolean; // Read-only filesystem
  user: string; // User to run as (e.g., 'nobody', '1000:1000')
  env: Record<string, string>; // Environment variables
  volumes?: string[]; // Volume mounts
  workingDir: string; // Working directory in container
  maxOutputSize: number; // Maximum output size in bytes
  allowedCommands?: string[]; // Whitelist of allowed commands
}

// Language-specific configurations
export interface LanguageConfigs {
  nodejs: SandboxConfig;
  python: SandboxConfig;
  bash: SandboxConfig;
  typescript: SandboxConfig;
  javascript: SandboxConfig;
  general: SandboxConfig;
}

// Container statistics
export interface ContainerStats {
  containerId: string;
  status: 'running' | 'stopped' | 'removed';
  startTime: Date;
  endTime?: Date;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  exitCode?: number;
  outputSize: number;
  errorCount: number;
}

// Docker Sandbox Service Implementation
export class DockerSandboxService extends EventEmitter {
  private configs: LanguageConfigs;
  private activeContainers: Map<string, ContainerStats> = new Map();
  private stats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    timeoutExecutions: 0,
    securityViolations: 0,
    averageExecutionTime: 0,
    totalExecutionTime: 0,
    totalMemoryUsed: 0,
    totalCpuUsed: 0
  };

  constructor(configs?: Partial<LanguageConfigs>) {
    super();
    
    this.configs = {
      nodejs: {
        image: 'node:18-alpine',
        timeout: 30000, // 30 seconds
        memoryLimit: '256m',
        cpuLimit: '0.5',
        networkMode: 'none',
        readonly: true,
        user: 'node',
        env: { NODE_ENV: 'production' },
        workingDir: '/app',
        maxOutputSize: 1024 * 1024, // 1MB
        allowedCommands: ['node', 'npm', 'npx']
      },
      python: {
        image: 'python:3.11-alpine',
        timeout: 30000,
        memoryLimit: '256m',
        cpuLimit: '0.5',
        networkMode: 'none',
        readonly: true,
        user: 'python',
        env: { PYTHONUNBUFFERED: '1' },
        workingDir: '/app',
        maxOutputSize: 1024 * 1024,
        allowedCommands: ['python', 'pip']
      },
      bash: {
        image: 'alpine:latest',
        timeout: 15000,
        memoryLimit: '128m',
        cpuLimit: '0.25',
        networkMode: 'none',
        readonly: true,
        user: 'nobody',
        env: {},
        workingDir: '/tmp',
        maxOutputSize: 512 * 1024, // 512KB
        allowedCommands: ['sh', 'bash', 'echo', 'ls', 'cat']
      },
      typescript: {
        image: 'node:18-alpine',
        timeout: 45000,
        memoryLimit: '512m',
        cpuLimit: '1.0',
        networkMode: 'none',
        readonly: true,
        user: 'node',
        env: { NODE_ENV: 'production' },
        workingDir: '/app',
        maxOutputSize: 2 * 1024 * 1024, // 2MB
        allowedCommands: ['node', 'npm', 'npx', 'tsc', 'ts-node']
      },
      javascript: {
        image: 'node:18-alpine',
        timeout: 30000,
        memoryLimit: '256m',
        cpuLimit: '0.5',
        networkMode: 'none',
        readonly: true,
        user: 'node',
        env: { NODE_ENV: 'production' },
        workingDir: '/app',
        maxOutputSize: 1024 * 1024,
        allowedCommands: ['node', 'npm', 'npx']
      },
      general: {
        image: 'alpine:latest',
        timeout: 20000,
        memoryLimit: '128m',
        cpuLimit: '0.25',
        networkMode: 'none',
        readonly: true,
        user: 'nobody',
        env: {},
        workingDir: '/tmp',
        maxOutputSize: 512 * 1024,
        allowedCommands: ['sh']
      },
      ...configs
    };

    this.initializeService();
  }

  /**
   * Execute code in a Docker container
   */
  async executeCode(
    code: string,
    language: keyof LanguageConfigs = 'general',
    customConfig?: Partial<SandboxConfig>
  ): Promise<ExecutionResult> {
    const config = { ...this.configs[language], ...customConfig };
    const containerId = this.generateContainerId();
    const startTime = Date.now();

    this.stats.totalExecutions++;

    try {
      // Validate code for security
      this.validateCode(code, config);

      // Create temporary files
      const { codeFile, outputFile } = await this.createTempFiles(code, language);

      // Run container
      const result = await this.runContainer(
        containerId,
        codeFile,
        outputFile,
        config,
        language
      );

      const executionTime = Date.now() - startTime;
      
      // Record success
      this.stats.successfulExecutions++;
      this.updateExecutionStats(executionTime, result.memoryUsage || 0, result.cpuUsage || 0);

      // Cleanup
      await this.cleanupTempFiles(codeFile, outputFile);
      await this.removeContainer(containerId);

      this.emit('executionSuccess', { 
        language, 
        containerId, 
        executionTime, 
        result 
      });

      return {
        ...result,
        executionTime,
        containerId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record failure
      this.stats.failedExecutions++;
      this.updateExecutionStats(executionTime, 0, 0);

      // Cleanup on failure
      await this.removeContainer(containerId);

      this.emit('executionFailure', { 
        language, 
        containerId, 
        executionTime, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        executionTime,
        containerId
      };
    }
  }

  /**
   * Execute a file in a Docker container
   */
  async executeFile(
    filePath: string,
    language: keyof LanguageConfigs = 'general',
    customConfig?: Partial<SandboxConfig>
  ): Promise<ExecutionResult> {
    const code = await fs.readFile(filePath, 'utf-8');
    return this.executeCode(code, language, customConfig);
  }

  /**
   * Run a command in a Docker container
   */
  async runCommand(
    command: string,
    args: string[] = [],
    language: keyof LanguageConfigs = 'general',
    customConfig?: Partial<SandboxConfig>
  ): Promise<ExecutionResult> {
    const config = { ...this.configs[language], ...customConfig };
    
    // Validate command
    this.validateCommand(command, config);

    const containerId = this.generateContainerId();
    const startTime = Date.now();

    this.stats.totalExecutions++;

    try {
      // Build Docker run command
      const dockerArgs = this.buildDockerRunArgs(containerId, config, [command, ...args]);

      // Execute command
      const result = await this.executeDockerCommand(dockerArgs, config.timeout);

      const executionTime = Date.now() - startTime;
      
      // Record success
      this.stats.successfulExecutions++;
      this.updateExecutionStats(executionTime, 0, 0);

      // Cleanup
      await this.removeContainer(containerId);

      this.emit('commandSuccess', { 
        language, 
        containerId, 
        command, 
        executionTime, 
        result 
      });

      return {
        success: result.exitCode === 0,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        executionTime,
        containerId
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record failure
      this.stats.failedExecutions++;
      this.updateExecutionStats(executionTime, 0, 0);

      // Cleanup on failure
      await this.removeContainer(containerId);

      this.emit('commandFailure', { 
        language, 
        containerId, 
        command, 
        executionTime, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        executionTime,
        containerId
      };
    }
  }

  /**
   * Get container statistics
   */
  getContainerStats(containerId: string): ContainerStats | null {
    return this.activeContainers.get(containerId) || null;
  }

  /**
   * Get all container statistics
   */
  getAllContainerStats(): ContainerStats[] {
    return Array.from(this.activeContainers.values());
  }

  /**
   * Get service statistics
   */
  getStats() {
    const totalExecutions = this.stats.totalExecutions;
    const successRate = totalExecutions > 0 ? (this.stats.successfulExecutions / totalExecutions) * 100 : 0;
    
    return {
      ...this.stats,
      successRate: Math.round(successRate * 100) / 100,
      activeContainers: this.activeContainers.size,
      averageMemoryUsage: this.stats.totalMemoryUsed / Math.max(totalExecutions, 1),
      averageCpuUsage: this.stats.totalCpuUsed / Math.max(totalExecutions, 1)
    };
  }

  /**
   * Update sandbox configuration
   */
  updateConfig(language: keyof LanguageConfigs, config: Partial<SandboxConfig>): void {
    this.configs[language] = { ...this.configs[language], ...config };
    this.emit('configUpdated', { language, config });
  }

  /**
   * Clean up all containers
   */
  async cleanupAllContainers(): Promise<void> {
    const containerIds = Array.from(this.activeContainers.keys());
    
    for (const containerId of containerIds) {
      await this.removeContainer(containerId);
    }
    
    this.emit('allContainersCleaned', { count: containerIds.length });
  }

  // Private helper methods

  private initializeService(): void {
    // Start periodic cleanup of old containers
    setInterval(async () => {
      await this.cleanupOldContainers();
    }, 60000); // Clean up every minute

    this.emit('serviceInitialized', { configs: this.configs });
  }

  private generateContainerId(): string {
    return `localmcp-${crypto.randomBytes(8).toString('hex')}`;
  }

  private validateCode(code: string, config: SandboxConfig): void {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /require\s*\(\s*['"]fs['"]\s*\)/g,
      /require\s*\(\s*['"]child_process['"]\s*\)/g,
      /require\s*\(\s*['"]os['"]\s*\)/g,
      /process\.exit/g,
      /eval\s*\(/g,
      /Function\s*\(/g,
      /setTimeout\s*\(/g,
      /setInterval\s*\(/g
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        this.stats.securityViolations++;
        throw new Error(`Security violation: Dangerous pattern detected in code`);
      }
    }

    // Check output size limit
    if (code.length > config.maxOutputSize) {
      throw new Error(`Code size exceeds limit: ${config.maxOutputSize} bytes`);
    }
  }

  private validateCommand(command: string, config: SandboxConfig): void {
    if (config.allowedCommands && !config.allowedCommands.includes(command)) {
      this.stats.securityViolations++;
      throw new Error(`Command not allowed: ${command}`);
    }
  }

  private async createTempFiles(code: string, language: string): Promise<{ codeFile: string; outputFile: string }> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const codeFile = path.join(tempDir, `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${this.getFileExtension(language)}`);
    const outputFile = path.join(tempDir, `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.txt`);

    await fs.writeFile(codeFile, code);
    await fs.writeFile(outputFile, '');

    return { codeFile, outputFile };
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      nodejs: 'js',
      python: 'py',
      bash: 'sh',
      typescript: 'ts',
      javascript: 'js',
      general: 'txt'
    };
    return extensions[language] || 'txt';
  }

  private async runContainer(
    containerId: string,
    codeFile: string,
    outputFile: string,
    config: SandboxConfig,
    language: string
  ): Promise<ExecutionResult> {
    const containerStats: ContainerStats = {
      containerId,
      status: 'running',
      startTime: new Date(),
      executionTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      outputSize: 0,
      errorCount: 0
    };

    this.activeContainers.set(containerId, containerStats);

    try {
      // Build Docker run command
      const dockerArgs = this.buildDockerRunArgs(containerId, config, this.getExecutionCommand(language, codeFile));

      // Execute in container
      const result = await this.executeDockerCommand(dockerArgs, config.timeout);

      // Update container stats
      containerStats.status = 'stopped';
      containerStats.endTime = new Date();
      containerStats.executionTime = Date.now() - containerStats.startTime.getTime();
      containerStats.exitCode = result.exitCode;
      containerStats.outputSize = result.output.length;

      // Read output file if it exists
      let output = result.output;
      try {
        const fileOutput = await fs.readFile(outputFile, 'utf-8');
        output += fileOutput;
      } catch (error) {
        // Output file might not exist, that's ok
      }

      return {
        success: result.exitCode === 0,
        output,
        error: result.error,
        exitCode: result.exitCode,
        executionTime: containerStats.executionTime,
        containerId
      };

    } catch (error) {
      containerStats.status = 'stopped';
      containerStats.endTime = new Date();
      containerStats.executionTime = Date.now() - containerStats.startTime.getTime();
      containerStats.errorCount++;

      throw error;
    }
  }

  private buildDockerRunArgs(containerId: string, config: SandboxConfig, command: string[]): string[] {
    const args = [
      'run',
      '--rm',
      '--name', containerId,
      '--memory', config.memoryLimit,
      '--cpus', config.cpuLimit,
      '--network', config.networkMode,
      '--user', config.user,
      '--workdir', config.workingDir
    ];

    // Add environment variables
    for (const [key, value] of Object.entries(config.env)) {
      args.push('-e', `${key}=${value}`);
    }

    // Add volume mounts
    if (config.volumes) {
      for (const volume of config.volumes) {
        args.push('-v', volume);
      }
    }

    // Add read-only flag
    if (config.readonly) {
      args.push('--read-only');
    }

    // Add timeout
    args.push('--stop-timeout', '10');

    // Add image and command
    args.push(config.image);
    args.push(...command);

    return args;
  }

  private getExecutionCommand(language: string, codeFile: string): string[] {
    const commands: Record<string, string[]> = {
      nodejs: ['node', '/tmp/code.js'],
      python: ['python', '/tmp/code.py'],
      bash: ['sh', '/tmp/code.sh'],
      typescript: ['ts-node', '/tmp/code.ts'],
      javascript: ['node', '/tmp/code.js'],
      general: ['cat', '/tmp/code.txt']
    };

    return commands[language] || commands.general;
  }

  private async executeDockerCommand(args: string[], timeout: number): Promise<{ output: string; error: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const docker = spawn('docker', args);
      let output = '';
      let error = '';

      docker.stdout.on('data', (data) => {
        output += data.toString();
      });

      docker.stderr.on('data', (data) => {
        error += data.toString();
      });

      docker.on('close', (code) => {
        resolve({
          output: output.trim(),
          error: error.trim(),
          exitCode: code || 0
        });
      });

      docker.on('error', (err) => {
        reject(new Error(`Docker execution failed: ${err.message}`));
      });

      // Set timeout
      setTimeout(() => {
        docker.kill('SIGKILL');
        this.stats.timeoutExecutions++;
        reject(new Error(`Docker execution timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  private async removeContainer(containerId: string): Promise<void> {
    try {
      // Try to stop and remove container
      await new Promise<void>((resolve, reject) => {
        const docker = spawn('docker', ['rm', '-f', containerId]);
        
        docker.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to remove container: ${containerId}`));
          }
        });

        docker.on('error', (err) => {
          reject(err);
        });
      });

      // Remove from active containers
      this.activeContainers.delete(containerId);

    } catch (error) {
      // Container might already be removed, that's ok
      this.activeContainers.delete(containerId);
    }
  }

  private async cleanupTempFiles(codeFile: string, outputFile: string): Promise<void> {
    try {
      await fs.unlink(codeFile);
      await fs.unlink(outputFile);
    } catch (error) {
      // Files might already be removed, that's ok
    }
  }

  private async cleanupOldContainers(): Promise<void> {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [containerId, stats] of Array.from(this.activeContainers.entries())) {
      if (now - stats.startTime.getTime() > maxAge) {
        await this.removeContainer(containerId);
      }
    }
  }

  private updateExecutionStats(executionTime: number, memoryUsage: number, cpuUsage: number): void {
    this.stats.totalExecutionTime += executionTime;
    this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.totalExecutions;
    this.stats.totalMemoryUsed += memoryUsage;
    this.stats.totalCpuUsed += cpuUsage;
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.cleanupAllContainers();
    this.activeContainers.clear();
    this.emit('serviceDestroyed');
  }
}

export default DockerSandboxService;
