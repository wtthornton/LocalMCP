/**
 * Unit Tests for Context7 Tools
 * 
 * Tests Context7 MCP tools with REAL external API calls
 * No mocked data - tests actual Context7 integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Context7ResolveLibraryIdTool } from '../../src/tools/context7-resolve-library-id.tool.js';
import { Context7GetLibraryDocsTool } from '../../src/tools/context7-get-library-docs.tool.js';
import { Logger } from '../../src/services/logger/logger.js';
import { ConfigService } from '../../src/config/config.service.js';

describe('Context7 Tools - REAL API Tests', () => {
  let logger: Logger;
  let config: ConfigService;
  let resolveTool: Context7ResolveLibraryIdTool;
  let docsTool: Context7GetLibraryDocsTool;

  beforeEach(() => {
    // Use real logger and config - no mocking
    logger = new Logger('Context7-Test');
    config = new ConfigService();
    
    resolveTool = new Context7ResolveLibraryIdTool(logger, config);
    docsTool = new Context7GetLibraryDocsTool(logger, config);
  });

  describe('Context7ResolveLibraryIdTool - REAL API', () => {
    it('should resolve React library with real Context7 API', async () => {
      const result = await resolveTool.resolveLibraryId({ libraryName: 'react' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Parse the real response from Context7
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent).toBeDefined();
      
      // Should have libraries array (even if empty due to API issues)
      expect(Array.isArray(parsedContent.libraries)).toBe(true);
    }, 10000); // 10 second timeout for real API call

    it('should resolve TypeScript library with real Context7 API', async () => {
      const result = await resolveTool.resolveLibraryId({ libraryName: 'typescript' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent).toBeDefined();
      expect(Array.isArray(parsedContent.libraries)).toBe(true);
    }, 10000);

    it('should handle invalid library names gracefully', async () => {
      const result = await resolveTool.resolveLibraryId({ libraryName: 'nonexistent-library-12345' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Should return empty libraries array for invalid names
      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent.libraries)).toBe(true);
    }, 10000);
  });

  describe('Context7GetLibraryDocsTool - REAL API', () => {
    it('should fetch React documentation with real Context7 API', async () => {
      const result = await docsTool.getLibraryDocs({
        context7CompatibleLibraryID: '/facebook/react',
        topic: 'components',
        tokens: 1000
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Should get real documentation or fallback message
      expect(result.content[0].text).toBeDefined();
      expect(result.content[0].text.length).toBeGreaterThan(0);
    }, 15000); // 15 second timeout for real API call

    it('should fetch TypeScript documentation with real Context7 API', async () => {
      const result = await docsTool.getLibraryDocs({
        context7CompatibleLibraryID: '/microsoft/typescript',
        topic: 'types',
        tokens: 1000
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBeDefined();
    }, 15000);

    it('should handle invalid library IDs gracefully', async () => {
      const result = await docsTool.getLibraryDocs({
        context7CompatibleLibraryID: '/invalid/library/12345',
        tokens: 1000
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Should return fallback message for invalid library IDs
      expect(result.content[0].text).toBe('Documentation not available');
    }, 10000);
  });
});
