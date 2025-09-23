/**
 * Simple Context7 Client Tests
 * 
 * Basic tests for the simplified Context7 client
 */

import { SimpleContext7Client } from '../src/services/context7/simple-context7-client.js';

describe('SimpleContext7Client', () => {
  let client: SimpleContext7Client;

  beforeEach(() => {
    client = new SimpleContext7Client({ 
      apiKey: process.env.CONTEXT7_API_KEY || 'test-key' 
    });
  });

  it('should initialize without errors', () => {
    expect(client).toBeDefined();
  });

  it('should handle library resolution gracefully', async () => {
    const result = await client.resolveLibraryId('react');
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle documentation retrieval gracefully', async () => {
    const result = await client.getLibraryDocs('/websites/react_dev', 'hooks', 1000);
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.metadata).toBeDefined();
  });

  it('should handle multiple frameworks in parallel', async () => {
    const result = await client.getDocumentation(
      'Create a React component with hooks',
      ['react', 'next.js']
    );
    expect(result).toBeDefined();
    expect(result.docs).toBeDefined();
    expect(Array.isArray(result.libraries)).toBe(true);
  });

  it('should handle empty framework list', async () => {
    const result = await client.getDocumentation('test prompt', []);
    expect(result.docs).toBe('');
    expect(result.libraries).toEqual([]);
  });

  it('should handle undefined framework list', async () => {
    const result = await client.getDocumentation('test prompt', undefined as any);
    expect(result.docs).toBe('');
    expect(result.libraries).toEqual([]);
  });
});
