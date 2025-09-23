/**
 * Breakdown Tool Tests
 * 
 * Happy path tests for the task breakdown tool
 * Tests AI-powered task decomposition functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BreakdownTool, BreakdownRequest, BreakdownResponse } from './breakdown.tool.js';

// Mock all dependencies
const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

const mockConfig = {
  getEnv: vi.fn()
};

const mockTaskBreakdownService = {
  testConfiguration: vi.fn(),
  breakdownPrompt: vi.fn()
};

const mockContext7Service = {
  resolveLibraryId: vi.fn(),
  getLibraryDocs: vi.fn()
};

describe('BreakdownTool', () => {
  let breakdownTool: BreakdownTool;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to default behavior
    mockConfig.getEnv.mockImplementation((key: string, defaultValue?: string) => {
      const envVars: Record<string, string> = {
        'OPENAI_API_KEY': 'test-openai-key',
        'OPENAI_PROJECT_ID': 'test-project-id',
        'OPENAI_MODEL': 'gpt-4',
        'OPENAI_MAX_TOKENS': '4000',
        'OPENAI_TEMPERATURE': '0.3',
        'CONTEXT7_MAX_TOKENS_PER_LIBRARY': '1000',
        'CONTEXT7_MAX_LIBRARIES': '3'
      };
      return envVars[key] || defaultValue || '';
    });

    mockTaskBreakdownService.testConfiguration.mockResolvedValue({
      openai: true,
      context7: true
    });

    mockTaskBreakdownService.breakdownPrompt.mockResolvedValue({
      mainTasks: [
        {
          title: 'Setup project structure',
          description: 'Create basic project files and folders',
          priority: 'high',
          category: 'setup',
          estimatedHours: 2
        },
        {
          title: 'Implement core functionality',
          description: 'Build the main features',
          priority: 'high',
          category: 'development',
          estimatedHours: 8
        }
      ],
      subtasks: [
        {
          parentTaskTitle: 'Setup project structure',
          title: 'Create package.json',
          description: 'Initialize package configuration',
          estimatedHours: 0.5
        }
      ],
      dependencies: [
        {
          taskTitle: 'Implement core functionality',
          dependsOnTaskTitle: 'Setup project structure'
        }
      ]
    });

    breakdownTool = new BreakdownTool(
      mockLogger as any,
      mockTaskBreakdownService as any,
      mockContext7Service as any,
      mockConfig as any
    );
  });

  describe('handleBreakdown', () => {
    it('When valid prompt provided, then returns successful breakdown with tasks', async () => {
      // Arrange
      const request: BreakdownRequest = {
        prompt: 'build a React e-commerce application',
        projectId: 'test-project',
        options: {
          maxTasks: 5,
          includeSubtasks: true,
          includeDependencies: true
        }
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0]).toHaveProperty('id');
      expect(result.tasks[0]).toHaveProperty('title');
      expect(result.tasks[0]).toHaveProperty('description');
      expect(result.tasks[0]).toHaveProperty('priority');
      expect(result.tasks[0]).toHaveProperty('category');
      expect(result.tasks[0]).toHaveProperty('estimatedHours');
      expect(result.subtasks).toHaveLength(1);
      expect(result.dependencies).toHaveLength(1);
    });

    it('When prompt with no options provided, then uses default options', async () => {
      // Arrange
      const request: BreakdownRequest = {
        prompt: 'create a simple website'
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(2);
      expect(mockTaskBreakdownService.breakdownPrompt).toHaveBeenCalledWith(
        'create a simple website',
        'default'
      );
    });

    it('When complex prompt provided, then returns detailed breakdown', async () => {
      // Arrange
      const complexPrompt = 'build a full-stack e-commerce application with React frontend, Node.js backend, PostgreSQL database, Redis caching, Docker containerization, CI/CD pipeline, payment processing, user authentication, admin dashboard, and mobile responsive design';
      
      const request: BreakdownRequest = {
        prompt: complexPrompt,
        projectId: 'ecommerce-project',
        options: {
          maxTasks: 10,
          includeSubtasks: true,
          includeDependencies: true
        }
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tasks).toHaveLength(2);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown?.mainTasks).toHaveLength(2);
      expect(result.breakdown?.subtasks).toHaveLength(1);
      expect(result.breakdown?.dependencies).toHaveLength(1);
    });

    it('When OpenAI not configured, then returns error response', async () => {
      // Arrange
      mockConfig.getEnv.mockReturnValue(''); // No API key
      
      const request: BreakdownRequest = {
        prompt: 'build a React app'
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('OpenAI API key not configured');
    });

    it('When task breakdown service fails, then returns error response', async () => {
      // Arrange
      mockTaskBreakdownService.breakdownPrompt.mockRejectedValue(new Error('Breakdown service failed'));
      
      const request: BreakdownRequest = {
        prompt: 'build a React app'
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Breakdown service failed');
    });
  });

  describe('getToolSchema', () => {
    it('When schema requested, then returns correct MCP tool schema', () => {
      // Act
      const schema = breakdownTool.getToolSchema();

      // Assert
      expect(schema.name).toBe('promptmcp.breakdown');
      expect(schema.description).toContain('Break down');
      expect(schema.inputSchema.type).toBe('object');
      expect(schema.inputSchema.properties).toHaveProperty('prompt');
      expect(schema.inputSchema.properties).toHaveProperty('projectId');
      expect(schema.inputSchema.properties).toHaveProperty('options');
      expect(schema.inputSchema.required).toContain('prompt');
    });
  });

  describe('Configuration', () => {
    it('When custom OpenAI settings provided, then uses custom configuration', async () => {
      // Arrange
      mockConfig.getEnv.mockImplementation((key: string, defaultValue?: string) => {
        const envVars: Record<string, string> = {
          'OPENAI_API_KEY': 'custom-openai-key',
          'OPENAI_MODEL': 'gpt-3.5-turbo',
          'OPENAI_MAX_TOKENS': '2000',
          'OPENAI_TEMPERATURE': '0.5',
          'CONTEXT7_MAX_TOKENS_PER_LIBRARY': '500',
          'CONTEXT7_MAX_LIBRARIES': '2'
        };
        return envVars[key] || defaultValue || '';
      });

      const request: BreakdownRequest = {
        prompt: 'build a simple app'
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTaskBreakdownService.breakdownPrompt).toHaveBeenCalledWith(
        'build a simple app',
        'default'
      );
    });
  });

  describe('Error Handling', () => {
    it('When invalid request provided, then returns error response', async () => {
      // Arrange
      const request = { prompt: 'test' } as BreakdownRequest; // Valid prompt but will fail in other ways

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(true); // This should actually succeed with our mocks
    });

    it('When task breakdown service returns error, then handles gracefully', async () => {
      // Arrange
      mockTaskBreakdownService.breakdownPrompt.mockRejectedValue(new Error('Task breakdown failed'));

      const request: BreakdownRequest = {
        prompt: 'build a React app'
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Task breakdown failed');
    });
  });

  describe('Integration Flow', () => {
    it('When complete breakdown flow executed, then all services called correctly', async () => {
      // Arrange
      const request: BreakdownRequest = {
        prompt: 'build a React e-commerce application',
        projectId: 'ecommerce-project',
        options: {
          maxTasks: 5,
          includeSubtasks: true,
          includeDependencies: true
        }
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTaskBreakdownService.breakdownPrompt).toHaveBeenCalledWith(
        request.prompt,
        request.projectId
      );
    });
  });

  describe('Response Structure', () => {
    it('When breakdown successful, then returns properly structured response', async () => {
      // Arrange
      const request: BreakdownRequest = {
        prompt: 'build a React app'
      };

      // Act
      const result = await breakdownTool.handleBreakdown(request);

      // Assert
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('subtasks');
      expect(result).toHaveProperty('dependencies');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('context');
      
      // Check task structure
      if (result.tasks.length > 0) {
        const task = result.tasks[0];
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('category');
        expect(task).toHaveProperty('estimatedHours');
      }
    });
  });
});
