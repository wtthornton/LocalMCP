/**
 * Context7 Service Interface
 * 
 * Defines the standard interface for Context7 integration services
 * to ensure consistency across all implementations
 */

import type { Context7LibraryInfo, Context7Documentation } from './context7-real-integration.service.js';

export interface IContext7Service {
  /**
   * Resolves a library name to Context7 library information
   */
  resolveLibraryId(libraryName: string): Promise<Context7LibraryInfo[]>;

  /**
   * Fetches library documentation from Context7
   */
  getLibraryDocumentation(
    libraryId: string,
    topic?: string,
    tokens?: number
  ): Promise<Context7Documentation>;

  /**
   * Validates that a Context7 library exists and returns meaningful content
   */
  validateContext7Library(libraryId: string): Promise<boolean>;

  /**
   * Selects a validated library from fallback hierarchy
   */
  selectValidatedLibrary(framework: string): Promise<string | null>;

  /**
   * Selects a high-quality library for a framework
   */
  selectHighQualityLibrary(framework: string): Promise<string | null>;
}

export interface Context7ServiceConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
  cacheTtl?: number;
}

export interface Context7Error extends Error {
  code: string;
  libraryId?: string;
  operation?: string;
  retryable?: boolean;
}
