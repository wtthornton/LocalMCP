/**
 * Agent Configuration Service
 * 
 * Manages agent task lists, quality standards, and configuration
 * for the PromptMCP coding agent. Provides dynamic configuration
 * updates without requiring server restarts.
 * 
 * Benefits for vibe coders:
 * - Centralized agent management
 * - Dynamic configuration updates
 * - Framework-specific customization
 * - Quality standard enforcement
 */

import { Logger } from '../logger/logger.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type {
  AgentTaskList,
  QualityStandard,
  ReviewItem,
  ImprovementTask,
  ProjectContextTask
} from '../../types/quality-keywords.types.js';

export class AgentConfigService {
  private logger: Logger;
  private configPath: string;
  private agentTaskList: AgentTaskList;
  private lastModified: number = 0;

  constructor(logger: Logger, configPath?: string) {
    this.logger = logger;
    this.configPath = configPath || join(process.cwd(), 'config', 'agent-tasks.yaml');
    this.agentTaskList = this.loadAgentTaskList();
  }

  /**
   * Load agent task list from configuration file
   */
  private loadAgentTaskList(): AgentTaskList {
    try {
      if (!existsSync(this.configPath)) {
        this.logger.warn('Agent configuration file not found, using defaults', {
          configPath: this.configPath
        });
        return this.getDefaultAgentTaskList();
      }

      const configContent = readFileSync(this.configPath, 'utf-8');
      const config = this.parseYamlConfig(configContent);
      
      this.lastModified = Date.now();
      
      this.logger.info('Agent configuration loaded successfully', {
        configPath: this.configPath,
        capabilitiesCount: config.capabilities?.length || 0,
        standardsCount: config.qualityStandards?.length || 0
      });

      return config;
    } catch (error) {
      this.logger.error('Failed to load agent configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        configPath: this.configPath
      });
      return this.getDefaultAgentTaskList();
    }
  }

  /**
   * Parse YAML configuration (simplified parser)
   */
  private parseYamlConfig(content: string): AgentTaskList {
    // Simple YAML parser for our specific structure
    // In production, you might want to use a proper YAML library like 'js-yaml'
    
    const lines = content.split('\n');
    const config: any = {};
    let currentSection = '';
    let currentArray: any[] = [];
    let currentObject: any = {};

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;
      
      // Section headers
      if (trimmed.endsWith(':')) {
        const sectionName = trimmed.slice(0, -1);
        currentSection = sectionName;
        
        if (['capabilities', 'qualityStandards', 'reviewChecklist', 'continuousImprovement', 'projectContext'].includes(sectionName)) {
          config[sectionName] = [];
          currentArray = config[sectionName];
        } else {
          config[sectionName] = {};
        }
        continue;
      }
      
      // Array items
      if (trimmed.startsWith('- ')) {
        const item = trimmed.slice(2);
        
        if (currentSection === 'capabilities') {
          currentArray.push(item);
        } else if (['qualityStandards', 'reviewChecklist', 'continuousImprovement', 'projectContext'].includes(currentSection)) {
          // Handle object items
          if (item.includes(':')) {
            const [key, value] = item.split(':').map(s => s.trim());
            currentObject[key] = value;
          } else {
            // Start new object
            if (Object.keys(currentObject).length > 0) {
              currentArray.push({ ...currentObject });
            }
            currentObject = { name: item };
          }
        }
        continue;
      }
      
      // Object properties
      if (trimmed.includes(':') && !trimmed.startsWith('-')) {
        const [key, value] = trimmed.split(':').map(s => s.trim());
        currentObject[key] = value;
        continue;
      }
    }
    
    // Add last object if exists
    if (Object.keys(currentObject).length > 0 && currentArray) {
      currentArray.push(currentObject);
    }

    return this.normalizeConfig(config);
  }

  /**
   * Normalize configuration to ensure proper types
   */
  private normalizeConfig(config: any): AgentTaskList {
    return {
      capabilities: config.capabilities || [],
      qualityStandards: this.normalizeQualityStandards(config.qualityStandards || []),
      reviewChecklist: this.normalizeReviewItems(config.reviewChecklist || []),
      continuousImprovement: this.normalizeImprovementTasks(config.continuousImprovement || []),
      projectContext: this.normalizeProjectContextTasks(config.projectContext || [])
    };
  }

  /**
   * Normalize quality standards
   */
  private normalizeQualityStandards(standards: any[]): QualityStandard[] {
    return standards.map(standard => ({
      name: standard.name || '',
      priority: standard.priority || 'medium',
      enforcement: standard.enforcement || 'required',
      description: standard.description || '',
      frameworkSpecific: standard.frameworkSpecific === 'true' || standard.frameworkSpecific === true,
      targetFrameworks: standard.targetFrameworks || []
    }));
  }

  /**
   * Normalize review items
   */
  private normalizeReviewItems(items: any[]): ReviewItem[] {
    return items.map(item => ({
      name: item.name || '',
      category: item.category || 'quality',
      mandatory: item.mandatory === 'true' || item.mandatory === true,
      description: item.description || ''
    }));
  }

  /**
   * Normalize improvement tasks
   */
  private normalizeImprovementTasks(tasks: any[]): ImprovementTask[] {
    return tasks.map(task => ({
      name: task.name || '',
      category: task.category || 'quality',
      priority: task.priority || 'medium',
      description: task.description || '',
      active: task.active === 'true' || task.active === true
    }));
  }

  /**
   * Normalize project context tasks
   */
  private normalizeProjectContextTasks(tasks: any[]): ProjectContextTask[] {
    return tasks.map(task => ({
      name: task.name || '',
      type: task.type || 'patterns',
      description: task.description || '',
      active: task.active === 'true' || task.active === true
    }));
  }

  /**
   * Get default agent task list
   */
  private getDefaultAgentTaskList(): AgentTaskList {
    return {
      capabilities: [
        "Code generation and enhancement",
        "Security vulnerability detection",
        "Performance optimization analysis",
        "Accessibility compliance checking",
        "Code quality assessment"
      ],
      qualityStandards: [
        {
          name: "OWASP Security Guidelines",
          priority: "critical",
          enforcement: "mandatory",
          description: "Follow OWASP security guidelines for all code generation",
          frameworkSpecific: false
        },
        {
          name: "SOLID Principles",
          priority: "high",
          enforcement: "required",
          description: "Apply SOLID principles for better code design",
          frameworkSpecific: false
        }
      ],
      reviewChecklist: [
        {
          name: "Security vulnerabilities scan",
          category: "security",
          mandatory: true,
          description: "Check for common security vulnerabilities"
        },
        {
          name: "Code quality metrics assessment",
          category: "quality",
          mandatory: true,
          description: "Assess code quality against established standards"
        }
      ],
      continuousImprovement: [
        {
          name: "Analyze user feedback patterns",
          category: "quality",
          priority: "high",
          description: "Monitor and analyze user feedback",
          active: true
        }
      ],
      projectContext: [
        {
          name: "Maintain project architecture knowledge",
          type: "architecture",
          description: "Keep track of project architecture",
          active: true
        }
      ]
    };
  }

  /**
   * Get current agent task list
   */
  getTaskList(): AgentTaskList {
    // Check if config file has been modified
    if (existsSync(this.configPath)) {
      const stats = require('fs').statSync(this.configPath);
      if (stats.mtime.getTime() > this.lastModified) {
        this.logger.info('Configuration file modified, reloading...');
        this.agentTaskList = this.loadAgentTaskList();
      }
    }
    
    return this.agentTaskList;
  }

  /**
   * Update agent task list
   */
  updateTaskList(updates: Partial<AgentTaskList>): void {
    this.agentTaskList = { ...this.agentTaskList, ...updates };
    
    this.logger.info('Agent task list updated', {
      updatedSections: Object.keys(updates)
    });
  }

  /**
   * Get quality standards for specific framework
   */
  getQualityStandardsForFramework(framework: string): QualityStandard[] {
    const standards = this.agentTaskList.qualityStandards;
    
    return standards.filter(standard => 
      !standard.frameworkSpecific || 
      (standard.targetFrameworks && standard.targetFrameworks.includes(framework.toLowerCase()))
    );
  }

  /**
   * Get mandatory review items
   */
  getMandatoryReviewItems(): ReviewItem[] {
    return this.agentTaskList.reviewChecklist.filter(item => item.mandatory);
  }

  /**
   * Get active improvement tasks
   */
  getActiveImprovementTasks(): ImprovementTask[] {
    return this.agentTaskList.continuousImprovement.filter(task => task.active);
  }

  /**
   * Get active project context tasks
   */
  getActiveProjectContextTasks(): ProjectContextTask[] {
    return this.agentTaskList.projectContext.filter(task => task.active);
  }

  /**
   * Save configuration to file
   */
  saveConfiguration(): void {
    try {
      const yamlContent = this.generateYamlConfig(this.agentTaskList);
      writeFileSync(this.configPath, yamlContent, 'utf-8');
      
      this.logger.info('Agent configuration saved successfully', {
        configPath: this.configPath
      });
    } catch (error) {
      this.logger.error('Failed to save agent configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        configPath: this.configPath
      });
    }
  }

  /**
   * Generate YAML configuration from task list
   */
  private generateYamlConfig(taskList: AgentTaskList): string {
    let yaml = '# Agent Task List Configuration\n\n';
    
    // Capabilities
    yaml += 'capabilities:\n';
    taskList.capabilities.forEach(capability => {
      yaml += `  - "${capability}"\n`;
    });
    
    // Quality Standards
    yaml += '\nqualityStandards:\n';
    taskList.qualityStandards.forEach(standard => {
      yaml += `  - name: "${standard.name}"\n`;
      yaml += `    priority: "${standard.priority}"\n`;
      yaml += `    enforcement: "${standard.enforcement}"\n`;
      yaml += `    description: "${standard.description}"\n`;
      if (standard.frameworkSpecific) {
        yaml += `    frameworkSpecific: true\n`;
      }
    });
    
    // Review Checklist
    yaml += '\nreviewChecklist:\n';
    taskList.reviewChecklist.forEach(item => {
      yaml += `  - name: "${item.name}"\n`;
      yaml += `    category: "${item.category}"\n`;
      yaml += `    mandatory: ${item.mandatory}\n`;
      yaml += `    description: "${item.description}"\n`;
    });
    
    return yaml;
  }

  /**
   * Reload configuration from file
   */
  reloadConfiguration(): void {
    this.agentTaskList = this.loadAgentTaskList();
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Check if configuration is valid
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.agentTaskList.capabilities || this.agentTaskList.capabilities.length === 0) {
      errors.push('No capabilities defined');
    }
    
    if (!this.agentTaskList.qualityStandards || this.agentTaskList.qualityStandards.length === 0) {
      errors.push('No quality standards defined');
    }
    
    if (!this.agentTaskList.reviewChecklist || this.agentTaskList.reviewChecklist.length === 0) {
      errors.push('No review checklist defined');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
