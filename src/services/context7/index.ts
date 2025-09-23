/**
 * Context7 Services Module
 * 
 * Simple Context7 MCP integration for PromptMCP
 * 
 * Benefits for vibe coders:
 * - Simple, clean Context7 integration
 * - Easy to understand and maintain
 * - Follows Context7 best practices
 * - No complex caching or monitoring overhead
 */

export { Context7IntegrationService } from './context7-integration.service.js';
export { SimpleContext7Client } from './simple-context7-client.js';

export type {
  Context7Config,
  Context7LibraryInfo,
  Context7Documentation
} from './simple-context7-client.js';