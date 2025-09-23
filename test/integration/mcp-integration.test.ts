/**
 * Integration Tests for MCP Server
 * 
 * Tests MCP server with real HTTP endpoints and tool interactions
 * Validates the complete request/response cycle
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { setTimeout } from 'timers/promises';

const sleep = promisify(setTimeout);

describe('MCP Integration Tests', () => {
  let serverProcess: any;
  const SERVER_URL = 'http://localhost:3001';
  const HEALTH_URL = 'http://localhost:3000';

  beforeAll(async () => {
    // Start the server
    serverProcess = spawn('npm', ['run', 'start:http'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    // Wait for server to start with retries
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      try {
        await sleep(2000);
        const healthResponse = await fetch(HEALTH_URL);
        if (healthResponse.ok) {
          break;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }
      retries++;
    }
    
    if (retries >= maxRetries) {
      throw new Error('Server failed to start within timeout');
    }
  }, 60000); // Increased timeout to 60 seconds

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      await sleep(2000);
    }
  });

  describe('Health Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await fetch(HEALTH_URL);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('PromptMCP');
    });

    it('should include MCP tools in health response', async () => {
      const response = await fetch(HEALTH_URL);
      const data = await response.json();

      expect(data.mcp).toBeDefined();
      expect(data.mcp.status).toBe('healthy');
      expect(data.mcp.tools).toBeInstanceOf(Array);
      expect(data.mcp.tools.length).toBeGreaterThan(0);
    });
  });

  describe('MCP Endpoint', () => {
    it('should list available tools', async () => {
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(1);
      expect(data.result).toBeDefined();
      expect(data.result.tools).toBeInstanceOf(Array);
      expect(data.result.tools.length).toBeGreaterThan(0);
    });

    it('should call promptmcp.enhance tool', async () => {
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'promptmcp.enhance',
            arguments: {
              prompt: 'Create a simple React button',
              context: { framework: 'react' }
            }
          }
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(2);
      expect(data.result).toBeDefined();
      expect(typeof data.result).toBe('string');
      expect(data.result.length).toBeGreaterThan(0);
    });

    it('should call promptmcp.todo tool', async () => {
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'promptmcp.todo',
            arguments: {
              action: 'create',
              content: 'Test integration task'
            }
          }
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(3);
      expect(data.result).toBeDefined();
      expect(typeof data.result).toBe('string');
    });

    it('should handle invalid tool calls', async () => {
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'nonexistent-tool',
            arguments: {}
          }
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(4);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Context7 Tools Integration', () => {
    it('should call resolve-library-id tool', async () => {
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'resolve-library-id',
            arguments: {
              libraryName: 'react'
            }
          }
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(5);
      expect(data.result).toBeDefined();
    });

    it('should call get-library-docs tool', async () => {
      const response = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 6,
          method: 'tools/call',
          params: {
            name: 'get-library-docs',
            arguments: {
              context7CompatibleLibraryID: '/facebook/react',
              topic: 'components',
              tokens: 1000
            }
          }
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(6);
      expect(data.result).toBeDefined();
    });
  });
});
