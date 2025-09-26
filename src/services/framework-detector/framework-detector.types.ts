/**
 * Framework Detection Types
 * 
 * Dynamic framework detection that works with any Context7 library
 * instead of hardcoded framework mappings.
 */

export interface FrameworkDetectionResult {
  detectedFrameworks: string[];
  confidence: number;
  suggestions: string[];
  context7Libraries: string[];
  detectionMethod: 'pattern' | 'ai' | 'project' | 'fallback';
}

export interface LibraryMatch {
  name: string;
  libraryId: string;
  confidence: number;
  source: string;
}

export interface ProjectContext {
  dependencies: Record<string, string>;
  fileStructure: string[];
  frameworkFiles: string[];
  suggestedFrameworks: string[];
  projectType?: string;
}

export interface DetectionPattern {
  regex: RegExp;
  type: 'component' | 'framework' | 'library' | 'app';
  weight: number;
}

export interface FrameworkDetectionConfig {
  enabled: boolean;
  confidenceThreshold: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  aiEnabled: boolean;
  patternDetectionEnabled: boolean;
  projectContextEnabled: boolean;
  maxLibrariesPerDetection: number;
  aiTimeoutMs: number;
}

export interface Context7CacheEntry {
  libraryId: string;
  docs: any;
  timestamp: number;
}

export interface DetectionMetrics {
  totalDetections: number;
  successfulDetections: number;
  averageConfidence: number;
  frameworkDistribution: Record<string, number>;
  cacheHitRate: number;
  detectionMethodDistribution: Record<string, number>;
  averageDetectionTime: number;
}
