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

export { Context7IntegrationService } from './context7-integration.service.js';
export { Context7MCPComplianceService } from './context7-mcp-compliance.service.js';
export { Context7AdvancedCacheService } from './context7-advanced-cache.service.js';
export { Context7MonitoringService } from './context7-monitoring.service.js';

export type {
  Context7IntegrationConfig,
  Context7IntegrationStatus
} from './context7-integration.service.js';