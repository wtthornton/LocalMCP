/**
 * AI Summarization Types
 * 
 * Defines interfaces for AI-powered context summarization,
 * quality validation, and related services.
 */

export interface SummarizationRequest {
  repoFacts: string[];
  context7Docs: string[];
  codeSnippets: string[];
  frameworks: string[];
  projectType: string;
  maxTokens?: number;
  qualityThreshold?: number;
}

export interface SummarizationResponse {
  summarizedRepoFacts: string[];
  summarizedContext7Docs: string[];
  summarizedCodeSnippets: string[];
  originalTokenCount: number;
  summarizedTokenCount: number;
  qualityScore: number;
  processingTime: number;
  cost: number;
}

export interface SummarizationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  qualityThreshold: number;
  retryAttempts: number;
  timeout: number;
}

export interface QualityScore {
  overall: number;
  informationRetention: number;
  technicalAccuracy: number;
  conciseness: number;
  relevance: number;
  details: {
    missingKeyInfo: string[];
    technicalErrors: string[];
    redundancyIssues: string[];
    relevanceIssues: string[];
  };
}

export interface ABTestResult {
  testId: string;
  originalQuality: number;
  summarizedQuality: number;
  qualityDifference: number;
  responseTimeImprovement: number;
  tokenReduction: number;
  userSatisfaction: number;
  recommendation: 'use_summarized' | 'use_original' | 'needs_improvement';
}

export interface SummarizationPrompt {
  type: 'repoFacts' | 'context7Docs' | 'codeSnippets';
  content: string[];
  context: {
    frameworks: string[];
    projectType: string;
  };
  maxTokens: number;
}

export interface SummarizationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageQualityScore: number;
  averageTokenReduction: number;
  averageProcessingTime: number;
  totalCost: number;
  lastUpdated: Date;
}

export interface SummarizationError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export interface SummarizationValidationResult {
  isValid: boolean;
  qualityScore: number;
  issues: string[];
  recommendations: string[];
}

export interface SummarizationCacheEntry {
  key: string;
  request: SummarizationRequest;
  response: SummarizationResponse;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
}

export interface SummarizationBatchRequest {
  requests: SummarizationRequest[];
  batchId: string;
  priority: 'high' | 'medium' | 'low';
  maxConcurrency: number;
}

export interface SummarizationBatchResponse {
  batchId: string;
  results: SummarizationResponse[];
  errors: SummarizationError[];
  totalProcessingTime: number;
  totalCost: number;
  successRate: number;
}
