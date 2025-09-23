/**
 * Framework Detector Service Tests - Simplified
 * 
 * Tests the simplified framework detection service
 * Focuses on happy path scenarios and basic functionality
 * Based on Vitest best practices from Context7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FrameworkDetectorService } from './framework-detector.service.js';

// Mock implementations following Vitest best practices
const mockContext7Service = {
  resolveLibraryId: vi.fn(),
  getLibraryDocs: vi.fn()
};

const mockAIService = {
  analyze: vi.fn()
};

const mockCacheService = {
  getCachedDocs: vi.fn(),
  cacheDocs: vi.fn(),
  clearCache: vi.fn(),
  getCacheStats: vi.fn().mockReturnValue({ size: 0, hitRate: 0, hitCount: 0, missCount: 0 }),
  getDetectionMetrics: vi.fn().mockReturnValue({ cacheHitRate: 0 })
};

describe('FrameworkDetectorService - Happy Path', () => {
  let detector: FrameworkDetectorService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock behaviors
    mockContext7Service.resolveLibraryId.mockResolvedValue([{ id: 'react', libraryId: 'react' }]);
    mockContext7Service.getLibraryDocs.mockResolvedValue({ 
      content: 'React documentation', 
      metadata: { libraryId: 'react' } 
    });
    mockAIService.analyze.mockResolvedValue('');
    
    // Create detector instance
    detector = new FrameworkDetectorService(mockContext7Service, mockCacheService, mockAIService);
  });

  describe('Basic Detection', () => {
    it('should detect React from package.json pattern', async () => {
      const prompt = 'create a React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(result.detectedFrameworks).toContain('react');
      expect(result.detectionMethod).toBe('pattern');
    });

    it('should detect multiple frameworks', async () => {
      const prompt = 'create a React component with TypeScript and Tailwind CSS';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(result.detectedFrameworks.length).toBeGreaterThan(0);
    });

    it('should return empty result for no matches', async () => {
      const prompt = 'create a simple function';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(result.detectedFrameworks).toEqual([]);
    });
  });

  describe('Context7 Integration', () => {
    it('should resolve libraries with Context7', async () => {
      const prompt = 'use React hooks';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(mockContext7Service.resolveLibraryId).toHaveBeenCalled();
    });

    it('should get library documentation', async () => {
      const prompt = 'create React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(mockContext7Service.getLibraryDocs).toHaveBeenCalled();
    });
  });

  describe('Caching', () => {
    it('should use cache when available', async () => {
      mockCacheService.getCachedDocs.mockResolvedValue({
        content: 'Cached React docs',
        metadata: { libraryId: 'react' }
      });

      const prompt = 'create React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(mockCacheService.getCachedDocs).toHaveBeenCalled();
    });

    it('should cache new documentation', async () => {
      const prompt = 'create React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(mockCacheService.cacheDocs).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Context7 resolution failure gracefully', async () => {
      mockContext7Service.resolveLibraryId.mockRejectedValue(new Error('Context7 failed'));
      
      const prompt = 'create React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(result.detectionMethod).toBe('pattern');
    });

    it('should handle Context7 documentation failure gracefully', async () => {
      mockContext7Service.getLibraryDocs.mockRejectedValue(new Error('Documentation failed'));
      
      const prompt = 'create React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
    });

    it('should handle AI service failure gracefully', async () => {
      mockAIService.analyze.mockRejectedValue(new Error('AI failed'));
      
      const prompt = 'create React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Metrics', () => {
    it('should track detection metrics', async () => {
      const prompt = 'create React component';
      const result = await detector.detectFrameworks(prompt);
      
      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.detectionTime).toBeGreaterThan(0);
    });

    it('should return cache statistics', async () => {
      const stats = detector.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });
});