/**
 * SimpleContext7Client - Happy Path Tests
 * 
 * Tests the core Context7 integration functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleContext7Client } from './simple-context7-client';

// Mock fetch globally
global.fetch = vi.fn();

describe('SimpleContext7Client - Happy Path', () => {
  let client: SimpleContext7Client;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SimpleContext7Client({ apiKey: 'test-api-key' });
  });

  describe('resolveLibraryId', () => {
    it('When valid library name provided, then returns library ID', async () => {
      // Arrange
      const mockResponse = {
        result: [
          {
            libraryId: '/facebook/react',
            name: 'React',
            description: 'A JavaScript library for building user interfaces',
            codeSnippets: 150,
            trustScore: 9.5
          }
        ]
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Act
      const result = await client.resolveLibraryId('react');

      // Assert
      expect(result).toEqual([{
        libraryId: '/facebook/react',
        name: 'React',
        description: 'A JavaScript library for building user interfaces',
        codeSnippets: 150,
        trustScore: 9.5
      }]);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mcp.context7.com/mcp',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('resolve-library-id')
        })
      );
    });

    it('When library not found, then returns empty array', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: [] })
      });

      // Act
      const result = await client.resolveLibraryId('nonexistent-library');

      // Assert
      expect(result).toEqual([]);
    });

    it('When API returns error, then returns empty array', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      // Act
      const result = await client.resolveLibraryId('react');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getLibraryDocs', () => {
    it('When valid library ID provided, then returns documentation', async () => {
      // Arrange
      const mockResponse = {
        result: {
          content: 'React is a JavaScript library for building user interfaces\n\nCODE SNIPPETS:\nBasic Component\n```jsx\nfunction MyComponent() {\n  return <div>Hello World</div>;\n}\n```'
        }
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Act
      const result = await client.getLibraryDocs('/facebook/react');

      // Assert
      expect(result).toEqual({
        content: 'React is a JavaScript library for building user interfaces\n\nCODE SNIPPETS:\nBasic Component\n```jsx\nfunction MyComponent() {\n  return <div>Hello World</div>;\n}\n```',
        metadata: {
          libraryId: '/facebook/react',
          topic: undefined,
          tokens: 4000,
          retrievedAt: expect.any(Date),
          source: 'Context7 MCP'
        }
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://mcp.context7.com/mcp',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('get-library-docs')
        })
      );
    });

    it('When library ID not found, then returns empty content', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: { content: '' } })
      });

      // Act
      const result = await client.getLibraryDocs('/invalid/library');

      // Assert
      expect(result.content).toBe('');
      expect(result.metadata.libraryId).toBe('/invalid/library');
    });

    it('When API returns error, then returns empty content', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Act
      const result = await client.getLibraryDocs('/facebook/react');

      // Assert
      expect(result.content).toBe('');
      expect(result.metadata.libraryId).toBe('/facebook/react');
      expect(result.metadata.source).toBe('Context7 MCP (error)');
    });
  });

  describe('Integration Flow', () => {
    it('When resolve and get docs called in sequence, then works correctly', async () => {
      // Arrange
      const mockResolveResponse = {
        result: [
          {
            libraryId: '/facebook/react',
            name: 'React',
            description: 'A JavaScript library for building user interfaces',
            codeSnippets: 150,
            trustScore: 9.5
          }
        ]
      };
      
      const mockDocsResponse = {
        result: {
          content: 'React is a JavaScript library for building user interfaces'
        }
      };
      
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResolveResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDocsResponse)
        });

      // Act
      const libraries = await client.resolveLibraryId('react');
      const library = libraries[0];
      const docs = await client.getLibraryDocs(library.libraryId);

      // Assert
      expect(library.libraryId).toBe('/facebook/react');
      expect(docs.content).toContain('React is a JavaScript library');
      expect(docs.metadata.libraryId).toBe('/facebook/react');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
