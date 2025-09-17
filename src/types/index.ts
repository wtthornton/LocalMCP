/**
 * TypeScript type definitions for Personal MCP Gateway
 * 
 * This file contains all the core types used throughout the application.
 * Designed to be comprehensive yet easy to understand for vibe coders.
 */

// ============================================================================
// Core MCP Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: unknown) => Promise<unknown>;
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  metadata?: {
    duration: number;
    cacheHit?: boolean;
    tokensUsed?: number;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface GatewayConfig {
  server: {
    port: number;
    host: string;
    corsOrigin: string;
  };
  cache: {
    dir: string;
    ttl: number;
    swr: number;
    maxAge: number;
    maxMB: number;
    maxEntriesPerPkg: number;
  };
  vector: {
    url: string;
    apiKey?: string;
    collectionName: string;
  };
  playwright: {
    serverUrl: string;
    browser: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
  };
  pipeline: {
    maxTokens: number;
    maxChunks: number;
    timeoutMs: number;
    maxRetries: number;
  };
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    maxChunksPerFile: number;
    maxTotalChunks: number;
  };
  lessons: {
    confidenceDecay: number;
    decayPeriodDays: number;
    promotionThreshold: number;
    promotionSuccessRate: number;
  };
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry {
  key: string;
  value: unknown;
  expiresAt: Date;
  swrUntil: Date;
  lastAccess: Date;
  sizeBytes: number;
  metadata: {
    source: string;
    package?: string;
    version?: string;
    projectId?: string;
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSizeMB: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

// ============================================================================
// Vector Database Types
// ============================================================================

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    projectId: string;
    path: string;
    headingTrail: string[];
    framework: string;
    packageVersion: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: VectorDocument['metadata'];
}

export interface VectorSearchParams {
  query: string;
  projectId?: string;
  limit?: number;
  threshold?: number;
  filters?: Record<string, unknown>;
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface PipelineRequest {
  request: string;
  context: {
    file?: string;
    error?: string;
    projectPath?: string;
    [key: string]: unknown;
  };
  budget: {
    timeMs: number;
    tokens: number;
    chunks: number;
  };
}

export interface PipelineStage {
  name: string;
  description: string;
  execute: (input: unknown) => Promise<unknown>;
  dependencies: string[];
  timeout: number;
}

export interface PipelineResult {
  success: boolean;
  result?: unknown;
  error?: string;
  stages: {
    [stageName: string]: {
      success: boolean;
      duration: number;
      result?: unknown;
      error?: string;
    };
  };
  metadata: {
    totalDuration: number;
    tokensUsed: number;
    cacheHits: number;
    retries: number;
  };
}

// ============================================================================
// Repository Types
// ============================================================================

export interface ProjectInfo {
  name: string;
  version: string;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  configFiles: string[];
  projectType: 'nextjs' | 'react' | 'vue' | 'angular' | 'node' | 'unknown';
  framework: string;
  language: 'typescript' | 'javascript' | 'python' | 'unknown';
  buildTool: 'webpack' | 'vite' | 'rollup' | 'esbuild' | 'unknown';
}

export interface FileInfo {
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
  lines: number;
  metadata: {
    hasTests: boolean;
    hasTypes: boolean;
    complexity: number;
    dependencies: string[];
  };
}

// ============================================================================
// Context7 Types
// ============================================================================

export interface Context7Request {
  package: string;
  version: string;
  topic: string;
  query: string;
  locale?: string;
}

export interface Context7Response {
  content: string;
  source: string;
  cached: boolean;
  expiresAt: Date;
  metadata: {
    package: string;
    version: string;
    topic: string;
    query: string;
    relevanceScore: number;
  };
}

// ============================================================================
// Lessons Learned Types
// ============================================================================

export interface Lesson {
  id: string;
  projectId: string;
  errorClass: string;
  errorCode: string;
  errorTemplate: string;
  solution: string;
  framework: string;
  packageVersion: string;
  successCount: number;
  failureCount: number;
  confidence: number;
  createdAt: Date;
  lastUsed: Date;
  isPromoted: boolean;
}

export interface LessonSearchParams {
  projectId?: string;
  errorClass?: string;
  framework?: string;
  packageVersion?: string;
  minConfidence?: number;
  limit?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export class GatewayError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'GatewayError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CacheError extends GatewayError {
  constructor(message: string) {
    super(message, 'CACHE_ERROR', 500);
  }
}

export class VectorError extends GatewayError {
  constructor(message: string) {
    super(message, 'VECTOR_ERROR', 500);
  }
}

export class PipelineError extends GatewayError {
  constructor(message: string) {
    super(message, 'PIPELINE_ERROR', 500);
  }
}

export class ToolError extends GatewayError {
  constructor(message: string, public toolName: string) {
    super(message, 'TOOL_ERROR', 500);
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheck {
  status: ServiceStatus;
  timestamp: Date;
  services: {
    [serviceName: string]: ServiceStatus;
  };
  metrics: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// ============================================================================
// Export all types
// ============================================================================

export * from './mcp-tools.js';
export * from './cache.js';
export * from './vector.js';
export * from './pipeline.js';
