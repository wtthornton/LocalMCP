/**
 * Framework Detector Service - Simple Happy Path Tests
 * 
 * Focus on core functionality with proper mocking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FrameworkDetectorService } from './framework-detector.service';

describe('FrameworkDetectorService - Happy Path', () => {
  let detector: FrameworkDetectorService;
  let mockContext7Service: any;
  let mockCacheService: any;
  let mockAIService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock Context7 service
    mockContext7Service = {
      resolveLibraryId: vi.fn(),
      getLibraryDocumentation: vi.fn()
    };
    
    // Mock cache service
    mockCacheService = {
      getCachedDocs: vi.fn(),
      cacheDocs: vi.fn(),
      clearCache: vi.fn(),
      getCacheStats: vi.fn().mockReturnValue({ size: 0, hitRate: 0, hitCount: 0, missCount: 0 }),
      getDetectionMetrics: vi.fn().mockReturnValue({ cacheHitRate: 0 })
    };
    
    // Mock AI service to return empty array (no AI suggestions)
    mockAIService = {
      analyze: vi.fn().mockResolvedValue('')
    };
    
    // Create detector instance
    detector = new FrameworkDetectorService(mockContext7Service, mockCacheService, mockAIService);
  });

  describe('Basic Detection', () => {
    it('When empty prompt provided, then returns empty result', async () => {
      // Arrange
      const prompt = '';
      
      // Act
      const result = await detector.detectFrameworks(prompt);
      
      // Assert
      expect(result.detectedFrameworks).toEqual([]);
      expect(result.confidence).toBe(0);
      expect(result.detectionMethod).toBe('fallback');
    });

    it('When prompt contains React, then detects React framework', async () => {
      // Arrange
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockResolvedValue([{
        id: '/facebook/react',
        name: 'react',
        description: 'A JavaScript library for building user interfaces'
      }]);
      mockContext7Service.getLibraryDocumentation.mockResolvedValue({
        description: 'React documentation',
        codeSnippets: []
      });
      
      // Act
      const result = await detector.detectFrameworks(prompt);
      
      // Assert
      expect(result.detectedFrameworks).toContain('react');
      expect(result.context7Libraries).toContain('/facebook/react');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('When prompt contains Vue, then detects Vue framework', async () => {
      // Arrange
      const prompt = 'using Vue framework';
      mockContext7Service.resolveLibraryId.mockResolvedValue([{
        id: '/vuejs/vue',
        name: 'vue',
        description: 'A progressive JavaScript framework'
      }]);
      mockContext7Service.getLibraryDocumentation.mockResolvedValue({
        description: 'Vue documentation',
        codeSnippets: []
      });
      
      // Act
      const result = await detector.detectFrameworks(prompt);
      
      // Assert
      expect(result.detectedFrameworks).toContain('vue');
      expect(result.context7Libraries).toContain('/vuejs/vue');
    });
  });

  describe('Caching', () => {
    it('When cached result available, then uses cached data', async () => {
      // Arrange
      const prompt = 'create a React component';
      const cachedResult = {
        libraryId: '/facebook/react',
        docs: { description: 'React docs' }
      };
      
      mockCacheService.getCachedDocs.mockResolvedValue(cachedResult);
      
      // Act
      const result = await detector.detectFrameworks(prompt);
      
      // Assert
      expect(mockCacheService.getCachedDocs).toHaveBeenCalledWith('react');
      expect(mockContext7Service.resolveLibraryId).not.toHaveBeenCalled();
      expect(result.context7Libraries).toContain('/facebook/react');
    });

    it('When no cached result, then calls Context7 and caches result', async () => {
      // Arrange
      const prompt = 'create a Vue component';
      mockCacheService.getCachedDocs.mockResolvedValue(null);
      mockContext7Service.resolveLibraryId.mockResolvedValue([{
        id: '/vuejs/vue',
        name: 'vue',
        description: 'A progressive JavaScript framework'
      }]);
      mockContext7Service.getLibraryDocumentation.mockResolvedValue({
        description: 'Vue documentation',
        codeSnippets: []
      });
      
      // Act
      await detector.detectFrameworks(prompt);
      
      // Assert
      expect(mockContext7Service.resolveLibraryId).toHaveBeenCalledWith('vue');
      expect(mockCacheService.cacheDocs).toHaveBeenCalledWith(
        'vue',
        '/vuejs/vue',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('When Context7 resolution fails, then handles gracefully', async () => {
      // Arrange
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockRejectedValue(new Error('Library not found'));
      
      // Act
      const result = await detector.detectFrameworks(prompt);
      
      // Assert
      expect(result.detectedFrameworks).toEqual([]);
      expect(result.detectionMethod).toBe('pattern');
    });

    it('When Context7 docs retrieval fails, then handles gracefully', async () => {
      // Arrange
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockResolvedValue([{
        id: '/facebook/react',
        name: 'react',
        description: 'A JavaScript library for building user interfaces'
      }]);
      mockContext7Service.getLibraryDocumentation.mockRejectedValue(new Error('Docs not found'));
      
      // Act
      const result = await detector.detectFrameworks(prompt);
      
      // Assert
      expect(result.detectedFrameworks).toEqual([]);
      expect(result.detectionMethod).toBe('pattern');
    });
  });

  describe('Metrics', () => {
    it('When detection runs, then tracks metrics', async () => {
      // Arrange
      const prompt = 'create a React component';
      mockContext7Service.resolveLibraryId.mockResolvedValue([{
        id: '/facebook/react',
        name: 'react',
        description: 'A JavaScript library for building user interfaces'
      }]);
      mockContext7Service.getLibraryDocumentation.mockResolvedValue({
        description: 'React documentation',
        codeSnippets: []
      });
      
      // Act
      await detector.detectFrameworks(prompt);
      const metrics = detector.getMetrics();
      
      // Assert
      expect(metrics.totalDetections).toBe(1);
      expect(metrics.successfulDetections).toBe(1);
    });
  });
});
