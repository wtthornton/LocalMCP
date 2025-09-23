/**
 * Unit Tests for MCP Server
 * 
 * Tests MCP server functionality with REAL services
 * No mocked data - tests actual behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPServer } from '../../src/mcp/server.js';
import { Logger } from '../../src/services/logger/logger.js';
import { ConfigService } from '../../src/config/config.service.js';

describe('MCPServer - REAL Services', () => {
  let mcpServer: MCPServer;
  let logger: Logger;
  let config: ConfigService;

  beforeEach(() => {
    // Use real logger and config - no mocking
    logger = new Logger('MCP-Test');
    config = new ConfigService();

    mcpServer = new MCPServer({
      logger,
      config
    });
  });

  afterEach(() => {
    // Clean up any resources if needed
    if (mcpServer) {
      mcpServer.destroy();
    }
  });

  describe('Tool Registration', () => {
    it('should register promptmcp.enhance tool', () => {
      const tools = mcpServer.getTools();
      expect(tools.has('promptmcp.enhance')).toBe(true);
      
      const enhanceTool = tools.get('promptmcp.enhance');
      expect(enhanceTool?.name).toBe('promptmcp.enhance');
      expect(enhanceTool?.description).toContain('Enhance prompts');
    });

    it('should register promptmcp.todo tool', () => {
      const tools = mcpServer.getTools();
      expect(tools.has('promptmcp.todo')).toBe(true);
      
      const todoTool = tools.get('promptmcp.todo');
      expect(todoTool?.name).toBe('promptmcp.todo');
      expect(todoTool?.description).toContain('Manage development tasks');
    });

    it('should register Context7 tools when available', () => {
      const tools = mcpServer.getTools();
      expect(tools.has('resolve-library-id')).toBe(true);
      expect(tools.has('get-library-docs')).toBe(true);
    });
  });

  describe('Tool Execution', () => {
    it('should handle promptmcp.enhance tool when Context7 is not available', async () => {
      await expect(
        mcpServer['executeTool']('promptmcp.enhance', {
          prompt: 'Create a React button',
          context: { framework: 'react' }
        })
      ).rejects.toThrow('Context7 integration service not available');
    });

    it('should execute promptmcp.todo tool with proper parameters', async () => {
      const result = await mcpServer['executeTool']('promptmcp.todo', {
        action: 'create',
        content: 'Test task',
        projectId: 'test-project'
      });

      expect(typeof result).toBe('string');
      expect(result).toContain('Created todo');
    });

    it('should throw error for todo tool with missing parameters', async () => {
      await expect(
        mcpServer['executeTool']('promptmcp.todo', {
          action: 'create',
          content: 'Test task'
        })
      ).rejects.toThrow('Content and projectId are required for create action');
    });

    it('should throw error for unknown tool', async () => {
      await expect(
        mcpServer['executeTool']('unknown-tool', {})
      ).rejects.toThrow('Unknown tool: unknown-tool');
    });
  });

  describe('MCP Protocol', () => {
    it('should handle tools/list request', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'tools/list',
        params: {}
      };

      const response = await mcpServer.handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeInstanceOf(Array);
      expect(response.result.tools.length).toBeGreaterThan(0);
    });

    it('should handle tools/call request with error', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 2,
        method: 'tools/call',
        params: {
          name: 'promptmcp.enhance',
          arguments: {
            prompt: 'Test prompt'
          }
        }
      };

      const response = await mcpServer.handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(2);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32603);
    });

    it('should handle invalid request', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 3,
        method: 'invalid-method',
        params: {}
      };

      const response = await mcpServer.handleRequest(request);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(3);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32601);
    });
  });
});
