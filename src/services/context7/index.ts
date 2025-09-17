/**
 * Context7 Services Index - Real Context7 MCP integration for LocalMCP
 * 
 * This module provides a clean interface for importing all Context7 services
 * that enable LocalMCP to communicate with the real Context7 MCP server.
 */

export { default as Context7MCPClientService } from './context7-mcp-client.service';

export type {
  Context7Request,
  Context7Response,
  LibraryResolutionResult,
  LibraryDocumentationResult
} from './context7-mcp-client.service';
