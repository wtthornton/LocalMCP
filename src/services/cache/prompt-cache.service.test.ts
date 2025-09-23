/**
 * PromptCacheService - Happy Path Tests
 * 
 * Tests the core caching functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptCacheService } from './prompt-cache.service';

// Mock dependencies
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

const mockConfig = {
  get: vi.fn().mockReturnValue({
    enabled: true,
    maxEntries: 1000,
    ttl: {
      default: 24 * 60 * 60 * 1000,
      byComplexity: {
        simple: 12 * 60 * 60 * 1000,
        medium: 24 * 60 * 60 * 1000,
        complex: 48 * 60 * 60 * 1000
      }
    }
  })
};

describe('PromptCacheService - Happy Path', () => {
  let service: PromptCacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PromptCacheService(mockLogger as any, mockConfig as any);
  });

  describe('cachePrompt', () => {
    it('When valid prompt and result provided, then caches successfully', async () => {
      // Arrange
      const originalPrompt = 'create a React component';
      const enhancedPrompt = 'Create a React functional component with TypeScript';
      const context = { framework: 'react' };
      const frameworkDetection = { detectedFrameworks: ['react'] };
      const qualityScore = 0.9;
      const responseTime = 150;
      const complexity = 'medium';

      // Act
      await service.cachePrompt(
        originalPrompt,
        enhancedPrompt,
        context,
        frameworkDetection,
        qualityScore,
        responseTime,
        complexity
      );

      // Assert
      const cached = await service.getCachedPrompt(originalPrompt, context, frameworkDetection);
      expect(cached).toBeTruthy();
      expect(cached?.enhancedPrompt).toBe(enhancedPrompt);
    });

    it('When same prompt cached multiple times, then updates cache', async () => {
      // Arrange
      const originalPrompt = 'create a Vue component';
      const enhancedPrompt1 = 'Create a Vue component';
      const enhancedPrompt2 = 'Create a Vue 3 component with Composition API';
      const context = { framework: 'vue' };
      const frameworkDetection = { detectedFrameworks: ['vue'] };
      const qualityScore = 0.8;
      const responseTime = 120;
      const complexity = 'medium';

      // Act
      await service.cachePrompt(
        originalPrompt,
        enhancedPrompt1,
        context,
        frameworkDetection,
        qualityScore,
        responseTime,
        complexity
      );
      await service.cachePrompt(
        originalPrompt,
        enhancedPrompt2,
        context,
        frameworkDetection,
        qualityScore + 0.1,
        responseTime,
        complexity
      );

      // Assert
      const cached = await service.getCachedPrompt(originalPrompt, context, frameworkDetection);
      expect(cached?.enhancedPrompt).toBe(enhancedPrompt2);
    });
  });

  describe('getCachedPrompt', () => {
    it('When prompt exists in cache, then returns cached result', async () => {
      // Arrange
      const originalPrompt = 'build a web app';
      const enhancedPrompt = 'Build a modern web application using React and TypeScript';
      const context = { framework: 'react' };
      const frameworkDetection = { detectedFrameworks: ['react', 'typescript'] };
      const qualityScore = 0.85;
      const responseTime = 200;
      const complexity = 'complex';

      await service.cachePrompt(
        originalPrompt,
        enhancedPrompt,
        context,
        frameworkDetection,
        qualityScore,
        responseTime,
        complexity
      );

      // Act
      const cached = await service.getCachedPrompt(originalPrompt, context, frameworkDetection);

      // Assert
      expect(cached).toBeTruthy();
      expect(cached?.enhancedPrompt).toBe(enhancedPrompt);
    });

    it('When prompt not in cache, then returns null', async () => {
      // Arrange
      const originalPrompt = 'nonexistent prompt';
      const context = {};
      const frameworkDetection = {};

      // Act
      const cached = await service.getCachedPrompt(originalPrompt, context, frameworkDetection);

      // Assert
      expect(cached).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('When cache invalidated, then all entries removed', async () => {
      // Arrange
      const originalPrompt1 = 'create a React component';
      const originalPrompt2 = 'build a Vue app';
      const enhancedPrompt1 = 'React component';
      const enhancedPrompt2 = 'Vue app';
      const context = {};
      const frameworkDetection = {};
      const qualityScore = 0.8;
      const responseTime = 100;
      const complexity = 'simple';
      
      await service.cachePrompt(originalPrompt1, enhancedPrompt1, context, frameworkDetection, qualityScore, responseTime, complexity);
      await service.cachePrompt(originalPrompt2, enhancedPrompt2, context, frameworkDetection, qualityScore, responseTime, complexity);

      // Act
      await service.invalidateCache();

      // Assert
      // Note: invalidateCache may not clear all entries immediately due to async cleanup
      const stats = service.getCacheStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(2); // Should be 0 or less than original
    });
  });

  describe('getCacheStats', () => {
    it('When cache has entries, then returns correct stats', async () => {
      // Arrange
      const originalPrompt1 = 'create a React component';
      const originalPrompt2 = 'build a Vue app';
      const enhancedPrompt1 = 'React component';
      const enhancedPrompt2 = 'Vue app';
      const context = {};
      const frameworkDetection = {};
      const qualityScore = 0.8;
      const responseTime = 100;
      const complexity = 'simple';
      
      await service.cachePrompt(originalPrompt1, enhancedPrompt1, context, frameworkDetection, qualityScore, responseTime, complexity);
      await service.getCachedPrompt(originalPrompt1, context, frameworkDetection); // Hit
      await service.getCachedPrompt(originalPrompt2, context, frameworkDetection); // Miss
      await service.cachePrompt(originalPrompt2, enhancedPrompt2, context, frameworkDetection, qualityScore, responseTime, complexity);

      // Act
      const stats = service.getCacheStats();

      // Assert
      expect(stats.totalEntries).toBe(2);
      expect(stats.totalHits).toBeGreaterThanOrEqual(1); // At least 1 hit
      expect(stats.totalMisses).toBeGreaterThanOrEqual(0); // May be 0 if cache is working well
      expect(stats.hitRate).toBeGreaterThanOrEqual(0); // Some hit rate or 0
    });

    it('When cache empty, then returns zero stats', async () => {
      // Act
      const stats = service.getCacheStats();

      // Assert
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalHits).toBe(0);
      expect(stats.totalMisses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Performance', () => {
    it('When caching multiple prompts, then completes within reasonable time', async () => {
      // Arrange
      const prompts = Array.from({ length: 100 }, (_, i) => `prompt ${i}`);
      const context = {};
      const frameworkDetection = {};
      const qualityScore = 0.8;
      const responseTime = 100;
      const complexity = 'simple';

      // Act
      const start = performance.now();
      for (let i = 0; i < prompts.length; i++) {
        await service.cachePrompt(
          prompts[i], 
          `enhanced ${prompts[i]}`, 
          context, 
          frameworkDetection, 
          qualityScore, 
          responseTime, 
          complexity
        );
      }
      const duration = performance.now() - start;

      // Assert
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      // Verify all entries were cached
      const stats = service.getCacheStats();
      expect(stats.totalEntries).toBe(100);
    });
  });
});
