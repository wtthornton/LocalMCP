/**
 * Prompt Enhancement Types
 * 
 * Defines interfaces and types for AI-powered prompt enhancement
 * Used by the Prompt Enhancement Agent to structure requests and responses
 */

export interface PromptEnhancementRequest {
  originalPrompt: string;
  context: EnhancementContext;
  options: EnhancementOptions;
  goals: EnhancementGoals;
}

export interface EnhancementContext {
  projectContext: ProjectContext;
  frameworkContext: FrameworkContext;
  qualityRequirements: QualityRequirements;
  codeSnippets: CodeSnippet[];
  documentation: DocumentationContext;
  userPreferences: UserPreferences;
}

export interface ProjectContext {
  projectType: 'frontend' | 'backend' | 'fullstack' | 'library' | 'mobile' | 'desktop' | 'cli' | 'other';
  framework: string;
  language: string;
  architecture: string;
  patterns: string[];
  conventions: string[];
  dependencies: string[];
  environment: 'development' | 'production' | 'staging' | 'test';
}

export interface FrameworkContext {
  framework: string;
  version: string;
  bestPractices: string[];
  commonPatterns: string[];
  antiPatterns: string[];
  performanceTips: string[];
  securityConsiderations: string[];
  testingApproaches: string[];
}

export interface QualityRequirements {
  accessibility: boolean;
  performance: boolean;
  security: boolean;
  testing: boolean;
  documentation: boolean;
  maintainability: boolean;
  scalability: boolean;
  userExperience: boolean;
}

export interface CodeSnippet {
  content: string;
  language: string;
  purpose: string;
  relevance: number; // 0-1 score
  location: string;
}

export interface DocumentationContext {
  apiDocs: string[];
  guides: string[];
  examples: string[];
  tutorials: string[];
  troubleshooting: string[];
}

export interface UserPreferences {
  codingStyle: 'functional' | 'object-oriented' | 'procedural' | 'mixed';
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  focus: 'speed' | 'quality' | 'maintainability' | 'performance';
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface EnhancementOptions {
  strategy: EnhancementStrategy;
  qualityThreshold: number; // 0-1 score
  maxTokens: number;
  temperature: number;
  includeExamples: boolean;
  includeBestPractices: boolean;
  includeAntiPatterns: boolean;
  includePerformanceTips: boolean;
  includeSecurityConsiderations: boolean;
  includeTestingApproaches: boolean;
}

export interface EnhancementGoals {
  primary: string;
  secondary: string[];
  constraints: string[];
  successCriteria: string[];
  expectedOutcome: string;
}

export interface EnhancementStrategy {
  type: 'general' | 'framework-specific' | 'quality-focused' | 'project-aware';
  focus: string[];
  approach: string;
  priority: 'speed' | 'quality' | 'completeness' | 'clarity';
}

export interface PromptEnhancementResponse {
  enhancedPrompt: string;
  metadata: EnhancementMetadata;
  quality: QualityMetrics;
  confidence: EnhancementConfidence;
  improvements: EnhancementImprovement[];
  recommendations: string[];
}

export interface EnhancementMetadata {
  originalLength: number;
  enhancedLength: number;
  tokenUsage: TokenUsage;
  processingTime: number;
  strategy: EnhancementStrategy;
  framework: string;
  projectType: string;
  timestamp: Date;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
}

export interface QualityMetrics {
  clarity: number; // 0-1 score
  specificity: number; // 0-1 score
  actionability: number; // 0-1 score
  completeness: number; // 0-1 score
  relevance: number; // 0-1 score
  overall: number; // 0-1 score
}

export interface EnhancementConfidence {
  overall: number; // 0-1 score
  contextRelevance: number; // 0-1 score
  frameworkAccuracy: number; // 0-1 score
  qualityAlignment: number; // 0-1 score
  projectFit: number; // 0-1 score
}

export interface EnhancementImprovement {
  type: 'clarity' | 'specificity' | 'actionability' | 'completeness' | 'relevance' | 'best-practice' | 'performance' | 'security';
  description: string;
  impact: 'low' | 'medium' | 'high';
  before: string;
  after: string;
}

export interface PromptEnhancementConfig {
  enabled: boolean;
  defaultStrategy: EnhancementStrategy;
  qualityThreshold: number;
  maxTokens: number;
  temperature: number;
  includeExamples: boolean;
  includeBestPractices: boolean;
  includeAntiPatterns: boolean;
  includePerformanceTips: boolean;
  includeSecurityConsiderations: boolean;
  includeTestingApproaches: boolean;
  costLimit: number;
  rateLimit: number;
  fallbackEnabled: boolean;
}

export interface EnhancementValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface EnhancementMetrics {
  totalEnhancements: number;
  successfulEnhancements: number;
  failedEnhancements: number;
  averageQualityScore: number;
  averageConfidenceScore: number;
  averageProcessingTime: number;
  totalCost: number;
  averageCostPerEnhancement: number;
  qualityDistribution: Record<string, number>;
  strategyPerformance: Record<string, EnhancementStrategyMetrics>;
}

export interface EnhancementStrategyMetrics {
  usage: number;
  successRate: number;
  averageQuality: number;
  averageConfidence: number;
  averageCost: number;
  averageTime: number;
}

export interface EnhancementOptimization {
  tokenOptimization: TokenOptimization;
  qualityOptimization: QualityOptimization;
  costOptimization: CostOptimization;
  performanceOptimization: PerformanceOptimization;
}

export interface TokenOptimization {
  contextTruncation: boolean;
  smartSummarization: boolean;
  relevanceFiltering: boolean;
  priorityBasedSelection: boolean;
}

export interface QualityOptimization {
  qualityScoring: boolean;
  confidenceThresholds: boolean;
  validationChecks: boolean;
  feedbackLoop: boolean;
}

export interface CostOptimization {
  modelSelection: boolean;
  tokenBudgeting: boolean;
  cacheUtilization: boolean;
  batchProcessing: boolean;
}

export interface PerformanceOptimization {
  parallelProcessing: boolean;
  caching: boolean;
  responseStreaming: boolean;
  loadBalancing: boolean;
}
