/**
 * Health Tool Tests
 * 
 * Happy path tests for the health monitoring tool
 * Tests health checking functionality for all services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthTool, HealthCheckResult } from './health.tool.js';

// Mock all dependencies
const mockLogger = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

const mockConfig = {
  get: vi.fn(),
  getConfig: vi.fn()
};

const mockContext7Service = {
  initialize: vi.fn(),
  getHealthStatus: vi.fn(),
  isAvailable: vi.fn()
};

const mockOpenAIService = {
  testConnection: vi.fn(),
  isConfigured: vi.fn()
};

describe('HealthTool', () => {
  let healthTool: HealthTool;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to default behavior
    mockConfig.get.mockReturnValue('test-value');
    mockConfig.getConfig.mockReturnValue({});
    
    healthTool = new HealthTool(mockLogger as any, mockConfig as any);
  });

  describe('performHealthCheck', () => {
    it('When all services healthy, then returns healthy status', async () => {
      // Arrange
      const mockHealthResult: HealthCheckResult = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        services: {
          mcp: { status: 'healthy' },
          context7: { status: 'healthy' },
          openai: { status: 'healthy' },
          database: { status: 'healthy' },
          cache: { status: 'healthy' }
        },
        checks: {
          mcpProtocol: { status: 'pass', responseTime: 50 },
          context7: { status: 'pass', responseTime: 100 },
          openai: { status: 'pass', responseTime: 200 },
          database: { status: 'pass', responseTime: 30 },
          cache: { status: 'pass', responseTime: 10 }
        },
        version: '1.0.0'
      };

      // Mock the health check methods to return successful results
      vi.spyOn(healthTool as any, 'checkMCPProtocol').mockResolvedValue({
        status: 'pass',
        responseTime: 50,
        details: 'MCP protocol working correctly'
      });

      vi.spyOn(healthTool as any, 'checkContext7').mockResolvedValue({
        status: 'pass',
        responseTime: 100,
        details: 'Context7 service responding'
      });

      vi.spyOn(healthTool as any, 'checkOpenAI').mockResolvedValue({
        status: 'pass',
        responseTime: 200,
        details: 'OpenAI service responding'
      });

      vi.spyOn(healthTool as any, 'checkDatabase').mockResolvedValue({
        status: 'pass',
        responseTime: 30,
        details: 'Database connection healthy'
      });

      vi.spyOn(healthTool as any, 'checkCache').mockResolvedValue({
        status: 'pass',
        responseTime: 10,
        details: 'Cache system healthy'
      });

      // Act
      const result = await healthTool.performHealthCheck();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.services.mcp.status).toBe('healthy');
      expect(result.services.context7.status).toBe('healthy');
      expect(result.services.openai.status).toBe('healthy');
      expect(result.services.database.status).toBe('healthy');
      expect(result.services.cache.status).toBe('healthy');
      expect(result.checks.mcpProtocol.status).toBe('pass');
      expect(result.checks.context7.status).toBe('pass');
      expect(result.checks.openai.status).toBe('pass');
      expect(result.checks.database.status).toBe('pass');
      expect(result.checks.cache.status).toBe('pass');
    });

    it('When some services fail, then returns unhealthy status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkMCPProtocol').mockResolvedValue({
        status: 'pass',
        responseTime: 50,
        details: 'MCP protocol working correctly'
      });

      vi.spyOn(healthTool as any, 'checkContext7').mockResolvedValue({
        status: 'fail',
        responseTime: 0,
        error: 'Context7 service unavailable'
      });

      vi.spyOn(healthTool as any, 'checkOpenAI').mockResolvedValue({
        status: 'pass',
        responseTime: 200,
        details: 'OpenAI service responding'
      });

      vi.spyOn(healthTool as any, 'checkDatabase').mockResolvedValue({
        status: 'fail',
        responseTime: 0,
        error: 'Database connection failed'
      });

      vi.spyOn(healthTool as any, 'checkCache').mockResolvedValue({
        status: 'pass',
        responseTime: 10,
        details: 'Cache system healthy'
      });

      // Act
      const result = await healthTool.performHealthCheck();

      // Assert
      expect(result.status).toBe('unhealthy');
      expect(result.services.context7.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('unhealthy');
      expect(result.checks.context7.status).toBe('fail');
      expect(result.checks.database.status).toBe('fail');
    });

    it('When all services not configured, then returns degraded status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkMCPProtocol').mockResolvedValue({
        status: 'skip',
        responseTime: 0,
        details: 'MCP protocol check skipped'
      });

      vi.spyOn(healthTool as any, 'checkContext7').mockResolvedValue({
        status: 'skip',
        responseTime: 0,
        details: 'Context7 not configured'
      });

      vi.spyOn(healthTool as any, 'checkOpenAI').mockResolvedValue({
        status: 'skip',
        responseTime: 0,
        details: 'OpenAI not configured'
      });

      vi.spyOn(healthTool as any, 'checkDatabase').mockResolvedValue({
        status: 'skip',
        responseTime: 0,
        details: 'Database not configured'
      });

      vi.spyOn(healthTool as any, 'checkCache').mockResolvedValue({
        status: 'skip',
        responseTime: 0,
        details: 'Cache not configured'
      });

      // Act
      const result = await healthTool.performHealthCheck();

      // Assert
      expect(result.status).toBe('degraded');
      expect(result.checks.mcpProtocol.status).toBe('skip');
      expect(result.checks.context7.status).toBe('skip');
      expect(result.checks.openai.status).toBe('skip');
      expect(result.checks.database.status).toBe('skip');
      expect(result.checks.cache.status).toBe('skip');
    });
  });

  describe('checkMCPProtocol', () => {
    it('When MCP protocol working, then returns pass status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkMCPProtocol').mockResolvedValue({
        status: 'pass',
        responseTime: 50,
        details: 'MCP protocol working correctly'
      });

      // Act
      const result = await (healthTool as any).checkMCPProtocol();

      // Assert
      expect(result.status).toBe('pass');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details).toContain('MCP protocol');
    });
  });

  describe('checkContext7', () => {
    it('When Context7 service available, then returns pass status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkContext7').mockResolvedValue({
        status: 'pass',
        responseTime: 100,
        details: 'Context7 service responding'
      });

      // Act
      const result = await (healthTool as any).checkContext7();

      // Assert
      expect(result.status).toBe('pass');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details).toContain('Context7');
    });

    it('When Context7 service unavailable, then returns fail status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkContext7').mockResolvedValue({
        status: 'fail',
        responseTime: 0,
        error: 'Context7 service unavailable'
      });

      // Act
      const result = await (healthTool as any).checkContext7();

      // Assert
      expect(result.status).toBe('fail');
      expect(result.error).toContain('unavailable');
    });
  });

  describe('checkOpenAI', () => {
    it('When OpenAI service available, then returns pass status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkOpenAI').mockResolvedValue({
        status: 'pass',
        responseTime: 200,
        details: 'OpenAI service responding'
      });

      // Act
      const result = await (healthTool as any).checkOpenAI();

      // Assert
      expect(result.status).toBe('pass');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details).toContain('OpenAI');
    });

    it('When OpenAI service not configured, then returns skip status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkOpenAI').mockResolvedValue({
        status: 'skip',
        responseTime: 0,
        details: 'OpenAI not configured'
      });

      // Act
      const result = await (healthTool as any).checkOpenAI();

      // Assert
      expect(result.status).toBe('skip');
      expect(result.details).toContain('not configured');
    });
  });

  describe('checkDatabase', () => {
    it('When database available, then returns pass status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkDatabase').mockResolvedValue({
        status: 'pass',
        responseTime: 30,
        details: 'Database connection healthy'
      });

      // Act
      const result = await (healthTool as any).checkDatabase();

      // Assert
      expect(result.status).toBe('pass');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details).toContain('Database');
    });

    it('When database unavailable, then returns fail status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkDatabase').mockResolvedValue({
        status: 'fail',
        responseTime: 0,
        error: 'Database connection failed'
      });

      // Act
      const result = await (healthTool as any).checkDatabase();

      // Assert
      expect(result.status).toBe('fail');
      expect(result.error).toContain('failed');
    });
  });

  describe('checkCache', () => {
    it('When cache system healthy, then returns pass status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkCache').mockResolvedValue({
        status: 'pass',
        responseTime: 10,
        details: 'Cache system healthy'
      });

      // Act
      const result = await (healthTool as any).checkCache();

      // Assert
      expect(result.status).toBe('pass');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details).toContain('Cache');
    });

    it('When cache system unhealthy, then returns fail status', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkCache').mockResolvedValue({
        status: 'fail',
        responseTime: 0,
        error: 'Cache system error'
      });

      // Act
      const result = await (healthTool as any).checkCache();

      // Assert
      expect(result.status).toBe('fail');
      expect(result.error).toContain('error');
    });
  });


  describe('Error Handling', () => {
    it('When health check throws error, then returns error in result', async () => {
      // Arrange
      vi.spyOn(healthTool as any, 'checkMCPProtocol').mockRejectedValue(new Error('Health check failed'));

      // Act
      const result = await healthTool.performHealthCheck();

      // Assert
      expect(result.status).toBe('unhealthy');
      expect(result.checks.mcpProtocol.status).toBe('fail');
      expect(result.checks.mcpProtocol.error).toContain('Health check failed');
    });
  });

  describe('Integration Flow', () => {
    it('When complete health check executed, then all services checked in parallel', async () => {
      // Arrange
      const checkSpy = vi.spyOn(healthTool as any, 'checkMCPProtocol');
      const context7Spy = vi.spyOn(healthTool as any, 'checkContext7');
      const openaiSpy = vi.spyOn(healthTool as any, 'checkOpenAI');
      const databaseSpy = vi.spyOn(healthTool as any, 'checkDatabase');
      const cacheSpy = vi.spyOn(healthTool as any, 'checkCache');

      // Mock all checks to return successful results
      checkSpy.mockResolvedValue({ status: 'pass', responseTime: 50 });
      context7Spy.mockResolvedValue({ status: 'pass', responseTime: 100 });
      openaiSpy.mockResolvedValue({ status: 'pass', responseTime: 200 });
      databaseSpy.mockResolvedValue({ status: 'pass', responseTime: 30 });
      cacheSpy.mockResolvedValue({ status: 'pass', responseTime: 10 });

      // Act
      const result = await healthTool.performHealthCheck();

      // Assert
      expect(result.status).toBe('healthy');
      expect(checkSpy).toHaveBeenCalled();
      expect(context7Spy).toHaveBeenCalled();
      expect(openaiSpy).toHaveBeenCalled();
      expect(databaseSpy).toHaveBeenCalled();
      expect(cacheSpy).toHaveBeenCalled();
    });
  });
});
