/**
 * Simple Adaptive Pattern Interface
 * 
 * Defines interfaces for patterns that can learn and adapt their weights
 * based on success rates for framework detection.
 */

export interface AdaptivePattern {
  /** Unique identifier for the pattern */
  id: string;
  
  /** Human-readable name for the pattern */
  name: string;
  
  /** Regular expression for pattern matching */
  regex: RegExp;
  
  /** Type of pattern (component, framework, library, etc.) */
  type: 'component' | 'framework' | 'library' | 'app' | 'ui' | 'styling';
  
  /** Current weight/confidence score (0.0 to 1.0) */
  weight: number;
  
  /** Base confidence for matches */
  baseConfidence: number;
  
  /** Success rate (0.0 to 1.0) based on actual Context7 resolution */
  successRate: number;
  
  /** Total number of times this pattern has been used */
  usageCount: number;
  
  /** Number of successful matches (led to valid Context7 library) */
  successCount: number;
  
  /** Last time the pattern was used */
  lastUsed: Date;
  
  /** Last time the pattern was updated */
  lastUpdated: Date;
  
  /** Whether the pattern is currently enabled */
  enabled: boolean;
}

export interface PatternMatch {
  /** Name of the matched framework/library */
  name: string;
  
  /** Library ID from Context7 (empty if not resolved yet) */
  libraryId: string;
  
  /** Confidence score (0.0 to 1.0) */
  confidence: number;
  
  /** Source of the match (pattern, ai, project, etc.) */
  source: 'pattern' | 'ai' | 'project' | 'direct-mention' | 'task-inference' | 'stack-inference' | 'context-inference';
  
  /** Pattern that generated this match */
  patternId?: string;
  
  /** Additional metadata */
  metadata?: {
    matchText?: string;
    position?: number;
    context?: string;
  };
}

export interface PatternExecutionResult {
  /** List of matches found by this pattern */
  matches: PatternMatch[];
  
  /** Total execution time in milliseconds */
  executionTime: number;
  
  /** Whether the pattern execution was successful */
  success: boolean;
  
  /** Error message if execution failed */
  error?: string;
}

export interface PatternLearningData {
  /** Pattern ID */
  patternId: string;
  
  /** Whether the pattern match led to successful Context7 resolution */
  wasSuccessful: boolean;
  
  /** Timestamp of the learning event */
  timestamp: Date;
  
  /** Additional context for learning */
  context?: {
    prompt?: string;
    projectContext?: any;
    resolvedLibraries?: string[];
  };
}

export interface PatternStats {
  /** Pattern ID */
  patternId: string;
  
  /** Total usage count */
  totalUsage: number;
  
  /** Success count */
  successCount: number;
  
  /** Current success rate */
  successRate: number;
  
  /** Average confidence of matches */
  averageConfidence: number;
  
  /** Last used timestamp */
  lastUsed: Date;
  
  /** Whether pattern is trending up/down */
  trend: 'up' | 'down' | 'stable';
}

export interface PatternRegistry {
  /** All registered patterns */
  patterns: Map<string, AdaptivePattern>;
  
  /** Pattern statistics */
  stats: Map<string, PatternStats>;
  
  /** Learning data for pattern improvement */
  learningData: PatternLearningData[];
  
  /** Configuration for pattern learning */
  config: {
    /** Minimum success rate to keep pattern enabled */
    minSuccessRate: number;
    
    /** Learning rate for weight adjustments */
    learningRate: number;
    
    /** Maximum number of learning data points to keep */
    maxLearningData: number;
    
    /** Whether automatic learning is enabled */
    autoLearningEnabled: boolean;
  };
}
