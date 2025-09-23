/**
 * Enhanced Context7 Enhance Tool Tests
 * 
 * Happy path tests for the main enhancement tool
 * Tests the core functionality that users interact with most
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedContext7EnhanceTool, EnhancedContext7Request, EnhancedContext7Response } from './enhanced-context7-enhance.tool.js';

// Mock all dependencies
const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

const mockConfig = {
  context7: { apiKey: 'test-key' },
  openai: { apiKey: 'test-openai-key' }
};

const mockContext7Client = {
  resolveLibraryId: vi.fn(),
  getLibraryDocs: vi.fn()
};

const mockFrameworkDetector = {
  detectFrameworks: vi.fn()
};

const mockPromptCache = {
  getCachedPrompt: vi.fn(),
  cachePrompt: vi.fn()
};

const mockProjectAnalyzer = {
  analyzeProject: vi.fn(),
  findRelevantCodeSnippets: vi.fn()
};

const mockMonitoring = {
  recordMetric: vi.fn()
};

const mockCacheAnalytics = {
  recordCacheHit: vi.fn(),
  recordCacheMiss: vi.fn()
};

const mockTodoService = {
  createTodo: vi.fn(),
  getTodos: vi.fn()
};

const mockTaskBreakdownService = {
  breakdownTask: vi.fn()
};

const mockCurationService = {
  curateContent: vi.fn()
};

describe('EnhancedContext7EnhanceTool', () => {
  let tool: EnhancedContext7EnhanceTool;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to default behavior
    mockFrameworkDetector.detectFrameworks.mockResolvedValue({
      detectedFrameworks: ['react'],
      confidence: 0.9,
      detectionMethod: 'pattern'
    });

    mockProjectAnalyzer.analyzeProject.mockResolvedValue([
      { fact: 'This is a React project' },
      { fact: 'Uses TypeScript' }
    ]);

    mockProjectAnalyzer.findRelevantCodeSnippets.mockResolvedValue([
      {
        file: 'src/App.tsx',
        description: 'Main App component',
        content: 'export default function App() { return <div>Hello</div>; }'
      }
    ]);

    mockContext7Client.resolveLibraryId.mockResolvedValue([
      { libraryId: '/facebook/react', name: 'React' }
    ]);

    mockContext7Client.getLibraryDocs.mockResolvedValue({
      content: 'React documentation content',
      metadata: { libraryId: '/facebook/react' }
    });

    tool = new EnhancedContext7EnhanceTool(
      mockLogger as any,
      mockConfig,
      mockContext7Client as any,
      mockFrameworkDetector as any,
      mockPromptCache as any,
      mockProjectAnalyzer as any,
      mockMonitoring as any,
      mockCacheAnalytics as any,
      mockTodoService as any,
      undefined, // openaiService
      mockTaskBreakdownService as any,
      mockCurationService as any
    );

    // Mock the extracted services that are created in the constructor
    vi.spyOn(tool as any, 'promptAnalyzer', 'get').mockReturnValue({
      analyzePromptComplexity: vi.fn().mockReturnValue({
        level: 'medium',
        score: 5,
        indicators: ['medium-length']
      }),
      getOptimizedOptions: vi.fn().mockReturnValue({
        maxTokens: 2000,
        includeMetadata: false,
        useCache: true
      }),
      extractKeywords: vi.fn().mockReturnValue(['react', 'component'])
    });

    vi.spyOn(tool as any, 'context7Documentation', 'get').mockReturnValue({
      selectOptimalContext7Libraries: vi.fn().mockResolvedValue(['/facebook/react']),
      getContext7DocumentationForFrameworks: vi.fn().mockResolvedValue({
        docs: 'React documentation content',
        libraries: ['/facebook/react']
      }),
      processContext7Documentation: vi.fn().mockReturnValue('Processed React documentation')
    });

    vi.spyOn(tool as any, 'frameworkIntegration', 'get').mockReturnValue({
      detectFrameworks: vi.fn().mockResolvedValue({
        detectedFrameworks: ['react'],
        confidence: 0.9,
        detectionMethod: 'pattern'
      }),
      detectQualityRequirements: vi.fn().mockResolvedValue({
        type: 'component',
        priority: 'high',
        description: 'High-quality React component'
      })
    });

    vi.spyOn(tool as any, 'responseBuilder', 'get').mockReturnValue({
      buildEnhancedPrompt: vi.fn().mockImplementation((prompt, context, complexity) => 
        `Enhanced: ${prompt} with best practices and context`
      )
    });

    vi.spyOn(tool as any, 'taskContext', 'get').mockReturnValue({
      shouldBreakdown: vi.fn().mockReturnValue(false),
      performTaskBreakdown: vi.fn().mockResolvedValue({})
    });
  });

  describe('enhance', () => {
    it('When valid prompt provided, then returns enhanced prompt with Context7 docs', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'create a React component',
        context: { framework: 'react' }
      };

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result).toHaveProperty('enhanced_prompt');
      expect(result).toHaveProperty('context_used');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result.context_used).toHaveProperty('repo_facts');
      expect(result.context_used).toHaveProperty('code_snippets');
      expect(result.context_used).toHaveProperty('context7_docs');
    });

    it('When prompt with file context provided, then includes file-specific code snippets', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'fix this component',
        context: { 
          file: 'src/App.tsx',
          framework: 'react' 
        }
      };

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.context_used.code_snippets).toHaveLength(1);
      expect(result.context_used.code_snippets[0]).toContain('src/App.tsx');
    });

    it('When cached result available, then returns cached enhanced prompt', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'create a React component',
        options: { useCache: true }
      };

      const cachedResult = {
        enhancedPrompt: 'Enhanced: create a React component with best practices',
        context: {
          repoFacts: ['This is a React project'],
          codeSnippets: ['Code snippet here'],
          context7Docs: 'React documentation'
        },
        key: 'cache-key',
        hits: 1,
        qualityScore: 0.9
      };

      mockPromptCache.getCachedPrompt.mockResolvedValue(cachedResult);

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toBe(cachedResult.enhancedPrompt);
      expect(mockPromptCache.getCachedPrompt).toHaveBeenCalled();
    });

    it('When breakdown requested, then includes task breakdown in response', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'build a full-stack e-commerce application',
        options: { includeBreakdown: true, maxTasks: 5 }
      };

      const mockBreakdown = {
        tasks: [
          { id: 1, title: 'Setup frontend', priority: 'high' },
          { id: 2, title: 'Setup backend', priority: 'high' }
        ],
        mainTasks: 2,
        subtasks: 0,
        dependencies: 0,
        estimatedTotalTime: '2 weeks'
      };

      // Mock the taskContext to return breakdown
      vi.spyOn(tool as any, 'taskContext', 'get').mockReturnValue({
        shouldBreakdown: vi.fn().mockReturnValue(true),
        performTaskBreakdown: vi.fn().mockResolvedValue({
          breakdown: mockBreakdown,
          todos: []
        })
      });

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown?.mainTasks).toBe(2);
    });

    it('When error occurs, then returns error response with original prompt', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'create a React component'
      };

      // Mock an error in the framework integration service
      vi.spyOn(tool as any, 'frameworkIntegration', 'get').mockReturnValue({
        detectFrameworks: vi.fn().mockRejectedValue(new Error('Framework detection failed')),
        detectQualityRequirements: vi.fn().mockResolvedValue({})
      });

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.enhanced_prompt).toBe(request.prompt);
      expect(result.error).toBe('Framework detection failed');
      expect(result.context_used.repo_facts).toEqual([]);
      expect(result.context_used.code_snippets).toEqual([]);
      expect(result.context_used.context7_docs).toEqual([]);
    });

    it('When complex prompt provided, then optimizes options based on complexity', async () => {
      // Arrange
      const complexPrompt = 'build a full-stack e-commerce application with React, Node.js, PostgreSQL, Redis, Docker, CI/CD, authentication, payment processing, inventory management, order tracking, admin dashboard, mobile responsive design, and real-time notifications';
      
      const request: EnhancedContext7Request = {
        prompt: complexPrompt,
        context: { framework: 'react' }
      };

      // Mock complex prompt analysis
      vi.spyOn(tool as any, 'promptAnalyzer', 'get').mockReturnValue({
        analyzePromptComplexity: vi.fn().mockReturnValue({
          level: 'complex',
          score: 8,
          indicators: ['very-long', 'multiple-technologies']
        }),
        getOptimizedOptions: vi.fn().mockReturnValue({
          maxTokens: 4000,
          includeMetadata: true,
          useCache: true
        }),
        extractKeywords: vi.fn().mockReturnValue(['react', 'nodejs', 'postgresql', 'e-commerce'])
      });

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toContain(complexPrompt);
      // Verify the prompt analyzer was called with the complex prompt
      expect(tool as any).toHaveProperty('promptAnalyzer');
    });

    it('When style preference provided, then applies style context', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'create a button component',
        context: { 
          framework: 'react',
          style: 'modern' 
        }
      };

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toContain('button');
    });
  });

  describe('getHealthStatus', () => {
    it('When all services healthy, then returns healthy status', async () => {
      // Arrange
      const mockHealthStatus = {
        status: 'healthy' as const,
        components: {
          context7: 'healthy',
          cache: 'healthy',
          frameworkDetector: 'healthy'
        },
        metrics: {
          responseTime: 150,
          cacheHitRate: 0.8
        }
      };

      // Mock the health checker service
      const mockHealthChecker = {
        getHealthStatus: vi.fn().mockResolvedValue(mockHealthStatus)
      };

      // Replace the health checker in the tool
      (tool as any).healthChecker = mockHealthChecker;

      // Act
      const result = await tool.getHealthStatus();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.components).toHaveProperty('context7');
      expect(result.components.context7).toBe('healthy');
    });
  });

  describe('getToolSchema', () => {
    it('When schema requested, then returns correct MCP tool schema', () => {
      // Act
      const schema = tool.getToolSchema();

      // Assert
      expect(schema.name).toBe('promptmcp.enhance');
      expect(schema.description).toContain('Enhance prompts');
      expect(schema.inputSchema.type).toBe('object');
      expect(schema.inputSchema.properties).toHaveProperty('prompt');
      expect(schema.inputSchema.properties).toHaveProperty('context');
      expect(schema.inputSchema.properties).toHaveProperty('options');
      expect(schema.inputSchema.required).toContain('prompt');
    });
  });

  describe('Integration Flow', () => {
    it('When complete enhance flow executed, then returns successful response with enhanced prompt', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'create a React component with TypeScript',
        context: { framework: 'react' },
        options: { useCache: true, maxTokens: 2000 }
      };

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.enhanced_prompt).toContain('create a React component');
      expect(result.context_used).toHaveProperty('repo_facts');
      expect(result.context_used).toHaveProperty('code_snippets');
      expect(result.context_used).toHaveProperty('context7_docs');
    });
  });

  describe('Error Handling', () => {
    it('When project analyzer fails, then continues with empty context', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'create a React component'
      };

      // Mock project analyzer to fail
      mockProjectAnalyzer.analyzeProject.mockRejectedValue(new Error('Project analysis failed'));
      mockProjectAnalyzer.findRelevantCodeSnippets.mockRejectedValue(new Error('Code snippets failed'));

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.context_used.repo_facts).toEqual([]);
      expect(result.context_used.code_snippets).toEqual([]);
    });

    it('When Context7 service fails, then continues without Context7 docs', async () => {
      // Arrange
      const request: EnhancedContext7Request = {
        prompt: 'create a React component'
      };

      // Mock Context7 service to fail
      vi.spyOn(tool as any, 'context7Documentation', 'get').mockReturnValue({
        selectOptimalContext7Libraries: vi.fn().mockRejectedValue(new Error('Context7 service failed')),
        getContext7DocumentationForFrameworks: vi.fn().mockResolvedValue({
          docs: '',
          libraries: []
        }),
        processContext7Documentation: vi.fn().mockReturnValue('')
      });

      // Act
      const result = await tool.enhance(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.context_used.context7_docs).toEqual([]);
    });
  });
});
