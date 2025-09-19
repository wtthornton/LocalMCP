/**
 * Framework Detector Service Tests
 * 
 * Comprehensive test suite for dynamic framework detection
 * Tests pattern matching, AI suggestions, project context, and Context7 integration
 */

import { FrameworkDetectorService } from './framework-detector.service';
import { Context7CacheService } from './context7-cache.service';
import { ProjectContextAnalyzer } from './project-context-analyzer.service';

// Mock implementations
const mockContext7Service = {
  resolveLibraryId: jest.fn(),
  getLibraryDocs: jest.fn()
};

const mockAIService = {
  analyze: jest.fn()
};

describe('FrameworkDetectorService', () => {
  let detector: FrameworkDetectorService;
  let mockCacheService: jest.Mocked<Context7CacheService>;
  let mockProjectAnalyzer: jest.Mocked<ProjectContextAnalyzer>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock cache service
    mockCacheService = {
      getCachedDocs: jest.fn(),
      cacheDocs: jest.fn(),
      clearCache: jest.fn(),
      getCacheStats: jest.fn().mockReturnValue({ size: 0, hitRate: 0, hitCount: 0, missCount: 0 }),
      getDetectionMetrics: jest.fn().mockReturnValue({ cacheHitRate: 0 })
    } as any;
    
    // Mock project analyzer
    mockProjectAnalyzer = {
      analyzeProjectContext: jest.fn()
    } as any;
    
    // Create detector instance
    detector = new FrameworkDetectorService(mockContext7Service, mockCacheService, mockAIService);
    
    // Replace project analyzer with mock
    (detector as any).projectAnalyzer = mockProjectAnalyzer;
  });

  describe('Pattern-Based Detection', () => {
    it('should detect React from component patterns', async () => {
      const prompt = 'create a React component with hooks';
      mockContext7Service.resolveLibraryId.mockResolvedValue('/facebook/react');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'React docs' });
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectedFrameworks).toContain('react');
      expect(result.detectionMethod).toBe('pattern');
      expect(result.context7Libraries).toContain('/facebook/react');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Vue from framework patterns', async () => {
      const prompt = 'using Vue framework for my app';
      mockContext7Service.resolveLibraryId.mockResolvedValue('/vuejs/vue');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'Vue docs' });
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectedFrameworks).toContain('vue');
      expect(result.detectionMethod).toBe('pattern');
    });

    it('should detect Tailwind from library patterns', async () => {
      const prompt = 'with Tailwind library for styling';
      mockContext7Service.resolveLibraryId.mockResolvedValue('/tailwindlabs/tailwindcss');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'Tailwind docs' });
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectedFrameworks).toContain('tailwind');
      expect(result.detectionMethod).toBe('pattern');
    });

    it('should detect multiple frameworks from complex prompts', async () => {
      const prompt = 'create a React component with Tailwind styling and TypeScript';
      mockContext7Service.resolveLibraryId
        .mockResolvedValueOnce('/facebook/react')
        .mockResolvedValueOnce('/tailwindlabs/tailwindcss')
        .mockResolvedValueOnce('/microsoft/typescript');
      mockContext7Service.getLibraryDocs
        .mockResolvedValueOnce({ description: 'React docs' })
        .mockResolvedValueOnce({ description: 'Tailwind docs' })
        .mockResolvedValueOnce({ description: 'TypeScript docs' });
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectedFrameworks).toContain('react');
      expect(result.detectedFrameworks).toContain('tailwind');
      expect(result.detectedFrameworks).toContain('typescript');
      expect(result.context7Libraries).toHaveLength(3);
    });
  });

  describe('AI-Powered Detection', () => {
    it('should use AI to suggest libraries for generic prompts', async () => {
      const prompt = 'build a modern web application';
      mockAIService.analyze.mockResolvedValue('nextjs\nreact\ntypescript');
      
      mockContext7Service.resolveLibraryId
        .mockResolvedValueOnce('/vercel/next.js')
        .mockResolvedValueOnce('/facebook/react')
        .mockResolvedValueOnce('/microsoft/typescript');
      mockContext7Service.getLibraryDocs
        .mockResolvedValueOnce({ description: 'Next.js docs' })
        .mockResolvedValueOnce({ description: 'React docs' })
        .mockResolvedValueOnce({ description: 'TypeScript docs' });
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectionMethod).toBe('ai');
      expect(result.detectedFrameworks).toContain('nextjs');
      expect(result.detectedFrameworks).toContain('react');
      expect(result.detectedFrameworks).toContain('typescript');
    });

    it('should handle AI service failures gracefully', async () => {
      const prompt = 'build a web app';
      mockAIService.analyze.mockRejectedValue(new Error('AI service down'));
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectionMethod).toBe('fallback');
      expect(result.detectedFrameworks).toEqual([]);
    });
  });

  describe('Project Context Detection', () => {
    it('should detect libraries from project dependencies', async () => {
      const prompt = 'create a component';
      const projectContext = {
        dependencies: {
          'react': '^18.0.0',
          'typescript': '^5.0.0',
          'tailwindcss': '^3.0.0'
        },
        fileStructure: [],
        frameworkFiles: [],
        suggestedFrameworks: []
      };
      
      mockContext7Service.resolveLibraryId
        .mockResolvedValueOnce('/facebook/react')
        .mockResolvedValueOnce('/microsoft/typescript')
        .mockResolvedValueOnce('/tailwindlabs/tailwindcss');
      mockContext7Service.getLibraryDocs
        .mockResolvedValueOnce({ description: 'React docs' })
        .mockResolvedValueOnce({ description: 'TypeScript docs' })
        .mockResolvedValueOnce({ description: 'Tailwind docs' });
      
      const result = await detector.detectFrameworks(prompt, projectContext);
      
      expect(result.detectionMethod).toBe('project');
      expect(result.detectedFrameworks).toContain('react');
      expect(result.detectedFrameworks).toContain('typescript');
      expect(result.detectedFrameworks).toContain('tailwindcss');
    });

    it('should detect libraries from suggested frameworks', async () => {
      const prompt = 'create a component';
      const projectContext = {
        dependencies: {},
        fileStructure: [],
        frameworkFiles: [],
        suggestedFrameworks: ['vue', 'nuxt']
      };
      
      mockContext7Service.resolveLibraryId
        .mockResolvedValueOnce('/vuejs/vue')
        .mockResolvedValueOnce('/nuxt/nuxt');
      mockContext7Service.getLibraryDocs
        .mockResolvedValueOnce({ description: 'Vue docs' })
        .mockResolvedValueOnce({ description: 'Nuxt docs' });
      
      const result = await detector.detectFrameworks(prompt, projectContext);
      
      expect(result.detectionMethod).toBe('project');
      expect(result.detectedFrameworks).toContain('vue');
      expect(result.detectedFrameworks).toContain('nuxt');
    });
  });

  describe('Caching', () => {
    it('should use cached results when available', async () => {
      const prompt = 'create a React component';
      const cachedResult = { libraryId: '/facebook/react', docs: { description: 'React docs' } };
      
      mockCacheService.getCachedDocs.mockResolvedValue(cachedResult);
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(mockCacheService.getCachedDocs).toHaveBeenCalledWith('react');
      expect(mockContext7Service.resolveLibraryId).not.toHaveBeenCalled();
      expect(result.context7Libraries).toContain('/facebook/react');
    });

    it('should cache new results', async () => {
      const prompt = 'create a Vue component';
      mockCacheService.getCachedDocs.mockResolvedValue(null);
      mockContext7Service.resolveLibraryId.mockResolvedValue('/vuejs/vue');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'Vue docs' });
      
      await detector.detectFrameworks(prompt);
      
      expect(mockCacheService.cacheDocs).toHaveBeenCalledWith(
        'vue',
        '/vuejs/vue',
        { description: 'Vue docs' }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle empty prompts gracefully', async () => {
      const result = await detector.detectFrameworks('');
      
      expect(result.detectedFrameworks).toEqual([]);
      expect(result.confidence).toBe(0);
      expect(result.detectionMethod).toBe('fallback');
    });

    it('should handle Context7 resolution failures', async () => {
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockRejectedValue(new Error('Library not found'));
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectedFrameworks).toEqual([]);
      expect(result.detectionMethod).toBe('fallback');
    });

    it('should handle Context7 docs retrieval failures', async () => {
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockResolvedValue('/facebook/react');
      mockContext7Service.getLibraryDocs.mockRejectedValue(new Error('Docs not found'));
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.detectedFrameworks).toEqual([]);
      expect(result.detectionMethod).toBe('fallback');
    });
  });

  describe('Performance', () => {
    it('should complete detection within 10ms for simple prompts', async () => {
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockResolvedValue('/facebook/react');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'React docs' });
      
      const start = performance.now();
      await detector.detectFrameworks(prompt);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10);
    });

    it('should handle multiple concurrent detections', async () => {
      const prompts = [
        'create a React component',
        'build a Vue app',
        'style with Tailwind'
      ];
      
      mockContext7Service.resolveLibraryId
        .mockResolvedValueOnce('/facebook/react')
        .mockResolvedValueOnce('/vuejs/vue')
        .mockResolvedValueOnce('/tailwindlabs/tailwindcss');
      mockContext7Service.getLibraryDocs
        .mockResolvedValueOnce({ description: 'React docs' })
        .mockResolvedValueOnce({ description: 'Vue docs' })
        .mockResolvedValueOnce({ description: 'Tailwind docs' });
      
      const results = await Promise.all(
        prompts.map(prompt => detector.detectFrameworks(prompt))
      );
      
      expect(results).toHaveLength(3);
      expect(results[0].detectedFrameworks).toContain('react');
      expect(results[1].detectedFrameworks).toContain('vue');
      expect(results[2].detectedFrameworks).toContain('tailwind');
    });
  });

  describe('Confidence Scoring', () => {
    it('should calculate confidence based on detection method', async () => {
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockResolvedValue('/facebook/react');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'React docs' });
      
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should have higher confidence for project context', async () => {
      const prompt = 'create a component';
      const projectContext = {
        dependencies: { 'react': '^18.0.0' },
        fileStructure: [],
        frameworkFiles: [],
        suggestedFrameworks: []
      };
      
      mockContext7Service.resolveLibraryId.mockResolvedValue('/facebook/react');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'React docs' });
      
      const result = await detector.detectFrameworks(prompt, projectContext);
      
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Metrics', () => {
    it('should track detection metrics', async () => {
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockResolvedValue('/facebook/react');
      mockContext7Service.getLibraryDocs.mockResolvedValue({ description: 'React docs' });
      
      await detector.detectFrameworks(prompt);
      
      const metrics = detector.getMetrics();
      expect(metrics.totalDetections).toBe(1);
      expect(metrics.successfulDetections).toBe(1);
    });
  });
});
