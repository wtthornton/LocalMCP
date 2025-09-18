/**
 * Context7 Services Module
 * 
 * This module provides Context7 MCP integration capabilities for LocalMCP,
 * including real API communication, caching, and resilience patterns.
 * 
 * Benefits for vibe coders:
 * - Real-time access to Context7 documentation and best practices
 * - Intelligent caching for offline operation
 * - Resilient communication with fallback strategies
 * - Type-safe API integration with comprehensive error handling
 * - Learning and documentation generation from Context7
 */

export { default as Context7MCPClientService } from './context7-mcp-client.service';

export type {
  Context7Config,
  Context7Library,
  Context7Documentation,
  Context7Error,
  Context7CacheEntry
} from './context7-mcp-client.service';