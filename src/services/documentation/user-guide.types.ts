/**
 * User Guide Generation Types
 */

export interface UserGuideConfig {
  outputDir: string;
  templateDir: string;
  autoUpdate: boolean;
  includeScreenshots: boolean;
  theme: 'modern-dark' | 'light' | 'custom';
}

export interface UserGuidePage {
  id: string;
  title: string;
  description: string;
  content: string;
  outputPath: string;
  order: number;
  lastUpdated?: Date;
  phase?: string;
}

export interface UserGuideTemplate {
  name: string;
  content: string;
  variables: string[];
}

export interface PhaseData {
  title: string;
  description: string;
  features: string[];
  status: 'completed' | 'in-progress' | 'pending';
  completionDate?: Date;
  screenshots?: string[];
  examples?: CodeExample[];
}

export interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
  output?: string;
}

export interface UserGuideGenerationResult {
  success: boolean;
  pagesGenerated: number;
  outputDir: string;
  errors?: string[];
  screenshots?: string[];
}

export interface Context7Content {
  title: string;
  content: string;
  code?: string;
  examples?: CodeExample[];
  metadata?: Record<string, any>;
}

export interface UserGuideTestingResult {
  success: boolean;
  pagesTested: number;
  screenshots: string[];
  errors: string[];
  accessibilityIssues: string[];
  performanceMetrics: PerformanceMetric[];
}

export interface PerformanceMetric {
  pageId: string;
  loadTime?: number;
  renderTime?: number;
  resourceCount?: number;
  error?: string;
}
