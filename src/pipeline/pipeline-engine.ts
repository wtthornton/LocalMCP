import { Logger } from '../services/logger/logger.js';
import { ConfigService } from '../config/config.service.js';
import { Context7Service } from '../services/context7/context7.service.js';
import { VectorDatabaseService } from '../services/vector/vector-db.service.js';
import { PlaywrightService } from '../services/playwright/playwright.service.js';
import { RAGIngestionService } from '../services/rag/rag-ingestion.service.js';
import { AdvancedCacheService } from '../services/cache/advanced-cache.service.js';
import { RetrieveAgentsMDStage } from './stages/retrieve-agents-md.stage.js';
import { DetectRepoFactsStage } from './stages/detect-repo-facts.stage.js';
import { RetrieveContext7Stage } from './stages/retrieve-context7.stage.js';
import { RetrieveRAGStage } from './stages/retrieve-rag.stage.js';
import { ReadSnippetStage } from './stages/read-snippet.stage.js';
import { ReasonPlanStage } from './stages/reason-plan.stage.js';
import { EditStage } from './stages/edit.stage.js';

export interface PipelineContext {
  toolName: string;
  requestId: string;
  startTime: number;
  budget: PipelineBudget;
  scope: PipelineScope;
  data: Record<string, any>;
  metadata: Record<string, any>;
  errors: PipelineError[];
  retryCount: number;
  maxRetries: number;
}

export interface PipelineBudget {
  time: number; // milliseconds
  tokens: number;
  chunks: number;
  files: number;
}

export interface PipelineScope {
  maxFiles: number;
  maxLinesPerFile: number;
  maxHunksPerFile: number;
  allowedFileTypes: string[];
  excludedPaths: string[];
}

export interface PipelineError {
  stage: string;
  error: string;
  timestamp: number;
  retryable: boolean;
}

export interface PipelineResult {
  success: boolean;
  data: any;
  context: PipelineContext;
  executionTime: number;
  stagesExecuted: string[];
  errors: PipelineError[];
  budgetUsed: {
    time: number;
    tokens: number;
    chunks: number;
    files: number;
  };
}

export interface PipelineStage {
  name: string;
  execute(context: PipelineContext): Promise<Partial<PipelineContext>>;
  canRetry(error: PipelineError): boolean;
  getBudgetCost(): Partial<PipelineBudget>;
}

/**
 * Dynamic Pipeline Engine
 * 
 * The invisible engine that powers all 4 LocalMCP tools.
 * Processes requests through a series of stages with budget management,
 * retry logic, and context narrowing.
 */
export class PipelineEngine {
  private stages: Map<string, PipelineStage> = new Map();
  private defaultBudget: PipelineBudget;
  private defaultScope: PipelineScope;

  constructor(
    private logger: Logger,
    private config: ConfigService,
    private context7: Context7Service,
    private vectorDb: VectorDatabaseService,
    private playwright: PlaywrightService,
    private ragIngestion: RAGIngestionService,
    private cache: AdvancedCacheService
  ) {
    this.defaultBudget = {
      time: 120000, // 2 minutes
      tokens: 8000,
      chunks: 10,
      files: 3
    };

    this.defaultScope = {
      maxFiles: 3,
      maxLinesPerFile: 1000,
      maxHunksPerFile: 10,
      allowedFileTypes: ['.ts', '.js', '.tsx', '.jsx', '.html', '.css', '.md'],
      excludedPaths: ['node_modules', '.git', 'dist', 'build']
    };

    this.initializeStages();
  }

  /**
   * Execute a pipeline for a tool call
   */
  async execute(
    toolName: string,
    requestData: any,
    customBudget?: Partial<PipelineBudget>,
    customScope?: Partial<PipelineScope>
  ): Promise<PipelineResult> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const context: PipelineContext = {
      toolName,
      requestId,
      startTime,
      budget: { ...this.defaultBudget, ...customBudget },
      scope: { ...this.defaultScope, ...customScope },
      data: { ...requestData },
      metadata: {},
      errors: [],
      retryCount: 0,
      maxRetries: 2
    };

    this.logger.info(`Pipeline execution started`, {
      toolName,
      requestId,
      budget: context.budget,
      scope: context.scope
    });

    try {
      const result = await this.executePipeline(context);
      
      this.logger.info(`Pipeline execution completed`, {
        toolName,
        requestId,
        success: result.success,
        executionTime: result.executionTime,
        stagesExecuted: result.stagesExecuted.length,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      this.logger.error(`Pipeline execution failed`, {
        toolName,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        data: null,
        context,
        executionTime: Date.now() - startTime,
        stagesExecuted: [],
        errors: [{
          stage: 'pipeline',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
          retryable: false
        }],
        budgetUsed: {
          time: Date.now() - startTime,
          tokens: 0,
          chunks: 0,
          files: 0
        }
      };
    }
  }

  /**
   * Execute the pipeline with retry logic
   */
  private async executePipeline(context: PipelineContext): Promise<PipelineResult> {
    const stagesExecuted: string[] = [];
    const startTime = context.startTime;

    // Define the pipeline stages in order
    const stageNames = [
      'Retrieve.AgentsMD',
      'Detect.RepoFacts',
      'Retrieve.Context7',
      'Retrieve.RAG',
      'Read.Snippet',
      'Reason.Plan',
      'Edit',
      'Validate',
      'Gate',
      'Document',
      'Learn'
    ];

    let currentContext = { ...context };

    for (const stageName of stageNames) {
      const stage = this.stages.get(stageName);
      if (!stage) {
        this.logger.warn(`Stage not found: ${stageName}`);
        continue;
      }

      // Check budget before executing stage
      if (!this.checkBudget(currentContext)) {
        this.logger.warn(`Budget exceeded before stage: ${stageName}`);
        break;
      }

      try {
        this.logger.debug(`Executing stage: ${stageName}`, {
          requestId: currentContext.requestId,
          budgetRemaining: this.getBudgetRemaining(currentContext)
        });

        const stageStartTime = Date.now();
        const stageResult = await stage.execute(currentContext);
        const stageExecutionTime = Date.now() - stageStartTime;

        // Update context with stage results
        currentContext = {
          ...currentContext,
          ...stageResult,
          data: { ...currentContext.data, ...stageResult.data },
          metadata: { ...currentContext.metadata, ...stageResult.metadata }
        };

        stagesExecuted.push(stageName);

        this.logger.debug(`Stage completed: ${stageName}`, {
          requestId: currentContext.requestId,
          executionTime: stageExecutionTime,
          budgetUsed: stage.getBudgetCost()
        });

        // Check if we should stop early (e.g., if stage indicates completion)
        if (stageResult.metadata?.stopPipeline) {
          this.logger.info(`Pipeline stopped early at stage: ${stageName}`);
          break;
        }

      } catch (error) {
        const pipelineError: PipelineError = {
          stage: stageName,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
          retryable: stage.canRetry({
            stage: stageName,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
            retryable: true
          })
        };

        currentContext.errors.push(pipelineError);

        // If retryable and within retry limit, retry the stage
        if (pipelineError.retryable && currentContext.retryCount < currentContext.maxRetries) {
          this.logger.warn(`Retrying stage: ${stageName}`, {
            requestId: currentContext.requestId,
            retryCount: currentContext.retryCount + 1,
            error: pipelineError.error
          });

          currentContext.retryCount++;
          continue; // Retry the same stage
        } else {
          this.logger.error(`Stage failed and not retryable: ${stageName}`, {
            requestId: currentContext.requestId,
            error: pipelineError.error
          });
          break; // Stop pipeline execution
        }
      }
    }

    const executionTime = Date.now() - startTime;
    const budgetUsed = this.calculateBudgetUsed(context, currentContext);

    return {
      success: currentContext.errors.length === 0 || currentContext.errors.every(e => !e.retryable),
      data: currentContext.data,
      context: currentContext,
      executionTime,
      stagesExecuted,
      errors: currentContext.errors,
      budgetUsed
    };
  }

  /**
   * Initialize all pipeline stages
   */
  private initializeStages(): void {
    // Register detailed stage implementations
    this.registerStage(new RetrieveAgentsMDStage(this.logger, this.config));
    this.registerStage(new DetectRepoFactsStage(this.logger, this.config));
    this.registerStage(new RetrieveContext7Stage(this.logger, this.config, this.context7));
    this.registerStage(new RetrieveRAGStage(this.logger, this.config, this.vectorDb, this.ragIngestion));
    this.registerStage(new ReadSnippetStage(this.logger, this.config));
    this.registerStage(new ReasonPlanStage(this.logger, this.config));
    this.registerStage(new EditStage(this.logger, this.config));
    
    // Register placeholder stages for remaining stages
    this.registerStage(new ValidateStage(this.logger, this.config, this.playwright));
    this.registerStage(new GateStage(this.logger, this.config));
    this.registerStage(new DocumentStage(this.logger, this.config));
    this.registerStage(new LearnStage(this.logger, this.config, this.vectorDb));
  }

  /**
   * Register a pipeline stage
   */
  private registerStage(stage: PipelineStage): void {
    this.stages.set(stage.name, stage);
    this.logger.debug(`Registered pipeline stage: ${stage.name}`);
  }

  /**
   * Check if budget allows execution
   */
  private checkBudget(context: PipelineContext): boolean {
    const elapsed = Date.now() - context.startTime;
    return elapsed < context.budget.time;
  }

  /**
   * Get remaining budget
   */
  private getBudgetRemaining(context: PipelineContext): Partial<PipelineBudget> {
    const elapsed = Date.now() - context.startTime;
    return {
      time: Math.max(0, context.budget.time - elapsed),
      tokens: context.budget.tokens - (context.metadata.tokensUsed || 0),
      chunks: context.budget.chunks - (context.metadata.chunksUsed || 0),
      files: context.budget.files - (context.metadata.filesUsed || 0)
    };
  }

  /**
   * Calculate budget used
   */
  private calculateBudgetUsed(originalContext: PipelineContext, currentContext: PipelineContext): PipelineBudget {
    const elapsed = Date.now() - originalContext.startTime;
    return {
      time: elapsed,
      tokens: currentContext.metadata.tokensUsed || 0,
      chunks: currentContext.metadata.chunksUsed || 0,
      files: currentContext.metadata.filesUsed || 0
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pipeline statistics
   */
  getStats(): any {
    return {
      stagesRegistered: this.stages.size,
      stageNames: Array.from(this.stages.keys()),
      defaultBudget: this.defaultBudget,
      defaultScope: this.defaultScope
    };
  }
}

// Placeholder stage implementations (to be implemented in separate files)

class ValidateStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService,
    private playwright: PlaywrightService
  ) {}
  
  get name(): string { return 'Validate'; }
  
  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Validate stage executed');
    return {
      data: { validation: 'Validation completed' },
      metadata: { tokensUsed: 100 }
    };
  }
  
  canRetry(error: PipelineError): boolean { return true; }
  getBudgetCost(): Partial<PipelineBudget> { return { tokens: 100 }; }
}

class GateStage implements PipelineStage {
  constructor(private logger: Logger, private config: ConfigService) {}
  
  get name(): string { return 'Gate'; }
  
  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Gate stage executed');
    return {
      data: { gateResult: 'Gate check passed' },
      metadata: { tokensUsed: 50 }
    };
  }
  
  canRetry(error: PipelineError): boolean { return true; }
  getBudgetCost(): Partial<PipelineBudget> { return { tokens: 50 }; }
}

class DocumentStage implements PipelineStage {
  constructor(private logger: Logger, private config: ConfigService) {}
  
  get name(): string { return 'Document'; }
  
  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Document stage executed');
    return {
      data: { documentation: 'Generated documentation' },
      metadata: { tokensUsed: 100 }
    };
  }
  
  canRetry(error: PipelineError): boolean { return true; }
  getBudgetCost(): Partial<PipelineBudget> { return { tokens: 100 }; }
}

class LearnStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService,
    private vectorDb: VectorDatabaseService
  ) {}
  
  get name(): string { return 'Learn'; }
  
  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Learn stage executed');
    return {
      data: { lessons: 'Captured lessons learned' },
      metadata: { tokensUsed: 50 }
    };
  }
  
  canRetry(error: PipelineError): boolean { return true; }
  getBudgetCost(): Partial<PipelineBudget> { return { tokens: 50 }; }
}
