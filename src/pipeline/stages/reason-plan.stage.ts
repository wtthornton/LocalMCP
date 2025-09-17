import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { PipelineStage, PipelineContext, PipelineError } from '../pipeline-engine.js';

export interface ExecutionPlan {
  steps: Array<{
    id: string;
    name: string;
    description: string;
    type: 'analyze' | 'create' | 'modify' | 'validate' | 'test' | 'document';
    priority: 'high' | 'medium' | 'low';
    estimatedTime: number; // minutes
    dependencies: string[];
    resources: {
      files: string[];
      tools: string[];
      services: string[];
    };
    successCriteria: string[];
  }>;
  totalSteps: number;
  estimatedTotalTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
}

export interface PlanData {
  plan: ExecutionPlan;
  reasoning: string;
  alternatives: string[];
  constraints: string[];
  assumptions: string[];
  planningTime: number;
  error?: string;
}

/**
 * Reason.Plan Stage
 * 
 * Analyzes the request context and creates a detailed execution plan
 * based on available data from previous stages
 */
export class ReasonPlanStage implements PipelineStage {
  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  get name(): string {
    return 'Reason.Plan';
  }

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Reason.Plan stage executing', {
      requestId: context.requestId,
      toolName: context.toolName
    });

    try {
      const planData = await this.createExecutionPlan(context);

      this.logger.debug('Reason.Plan stage completed', {
        requestId: context.requestId,
        stepsPlanned: planData.plan.totalSteps,
        estimatedTime: planData.plan.estimatedTotalTime,
        confidence: planData.plan.confidence
      });

      return {
        data: {
          plan: planData
        },
        metadata: {
          tokensUsed: this.estimateTokens(planData),
          chunksUsed: 1,
          planningTime: planData.planningTime
        }
      };

    } catch (error) {
      this.logger.error('Reason.Plan stage failed', {
        requestId: context.requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return basic plan instead of failing completely
      return {
        data: {
          plan: {
            plan: this.createFallbackPlan(context),
            reasoning: 'Fallback plan due to planning error',
            alternatives: [],
            constraints: [],
            assumptions: [],
            planningTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        metadata: {
          tokensUsed: 100,
          chunksUsed: 1,
          planningTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    // Retry on planning logic errors, but not on data errors
    return error.error.includes('planning') || error.error.includes('reasoning');
  }

  getBudgetCost(): Partial<PipelineContext['budget']> {
    return {
      tokens: 400, // Estimated tokens for planning
      chunks: 1
    };
  }

  private async createExecutionPlan(context: PipelineContext): Promise<PlanData> {
    const startTime = Date.now();
    
    const toolName = context.toolName;
    const requestData = context.data;
    const repoFacts = context.data.repoFacts;
    const agentsMD = context.data.agentsMD;
    const context7 = context.data.context7;
    const rag = context.data.rag;
    const snippets = context.data.snippets;

    this.logger.debug('Creating execution plan', {
      requestId: context.requestId,
      toolName,
      hasRepoFacts: !!repoFacts,
      hasAgentsMD: !!agentsMD,
      hasContext7: !!context7,
      hasRAG: !!rag,
      hasSnippets: !!snippets
    });

    const plan = this.generatePlan(toolName, requestData, {
      repoFacts,
      agentsMD,
      context7,
      rag,
      snippets
    });

    const reasoning = this.generateReasoning(plan, context);
    const alternatives = this.generateAlternatives(plan, context);
    const constraints = this.identifyConstraints(context);
    const assumptions = this.identifyAssumptions(context);

    const planningTime = Date.now() - startTime;

    return {
      plan,
      reasoning,
      alternatives,
      constraints,
      assumptions,
      planningTime
    };
  }

  private generatePlan(
    toolName: string,
    requestData: any,
    context: {
      repoFacts?: any;
      agentsMD?: any;
      context7?: any;
      rag?: any;
      snippets?: any;
    }
  ): ExecutionPlan {
    const steps: ExecutionPlan['steps'] = [];
    let stepId = 1;

    switch (toolName) {
      case 'localmcp.create':
        return this.generateCreatePlan(requestData, context, steps, stepId);
      case 'localmcp.analyze':
        return this.generateAnalyzePlan(requestData, context, steps, stepId);
      case 'localmcp.fix':
        return this.generateFixPlan(requestData, context, steps, stepId);
      case 'localmcp.learn':
        return this.generateLearnPlan(requestData, context, steps, stepId);
      default:
        return this.generateGenericPlan(requestData, context, steps, stepId);
    }
  }

  private generateCreatePlan(
    requestData: any,
    context: any,
    steps: ExecutionPlan['steps'],
    stepId: number
  ): ExecutionPlan {
    const description = requestData.description || '';
    const targetPath = requestData.targetPath || '.';
    const options = requestData.options || {};
    const framework = context.repoFacts?.framework || 'unknown';

    // Step 1: Analyze requirements
    steps.push({
      id: `step_${stepId++}`,
      name: 'Analyze Requirements',
      description: `Analyze the creation request: "${description}"`,
      type: 'analyze',
      priority: 'high',
      estimatedTime: 5,
      dependencies: [],
      resources: {
        files: [],
        tools: ['context7', 'rag'],
        services: ['vector-db']
      },
      successCriteria: ['Requirements clearly understood', 'Technical approach identified']
    });

    // Step 2: Design structure
    steps.push({
      id: `step_${stepId++}`,
      name: 'Design Structure',
      description: `Design the file structure and component architecture for ${framework}`,
      type: 'analyze',
      priority: 'high',
      estimatedTime: 10,
      dependencies: ['step_1'],
      resources: {
        files: [],
        tools: ['context7', 'rag'],
        services: ['vector-db']
      },
      successCriteria: ['File structure planned', 'Component hierarchy defined']
    });

    // Step 3: Generate code
    steps.push({
      id: `step_${stepId++}`,
      name: 'Generate Code',
      description: `Generate the actual code files based on the design`,
      type: 'create',
      priority: 'high',
      estimatedTime: 15,
      dependencies: ['step_2'],
      resources: {
        files: [targetPath],
        tools: ['context7', 'rag'],
        services: ['vector-db']
      },
      successCriteria: ['Code files created', 'Code follows best practices']
    });

    // Step 4: Validate output
    steps.push({
      id: `step_${stepId++}`,
      name: 'Validate Output',
      description: 'Validate the generated code and test functionality',
      type: 'validate',
      priority: 'medium',
      estimatedTime: 8,
      dependencies: ['step_3'],
      resources: {
        files: [targetPath],
        tools: ['playwright'],
        services: ['playwright-mcp']
      },
      successCriteria: ['Code compiles without errors', 'UI renders correctly', 'Tests pass']
    });

    // Step 5: Document
    steps.push({
      id: `step_${stepId++}`,
      name: 'Document',
      description: 'Create documentation and usage examples',
      type: 'document',
      priority: 'low',
      estimatedTime: 5,
      dependencies: ['step_4'],
      resources: {
        files: [targetPath],
        tools: [],
        services: []
      },
      successCriteria: ['README created', 'Usage examples provided']
    });

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const riskLevel = this.assessRiskLevel(steps, context);
    const confidence = this.calculateConfidence(steps, context);

    return {
      steps,
      totalSteps: steps.length,
      estimatedTotalTime: totalTime,
      riskLevel,
      confidence
    };
  }

  private generateAnalyzePlan(
    requestData: any,
    context: any,
    steps: ExecutionPlan['steps'],
    stepId: number
  ): ExecutionPlan {
    const path = requestData.path || '.';
    const query = requestData.query || '';

    // Step 1: Scan project structure
    steps.push({
      id: `step_${stepId++}`,
      name: 'Scan Project Structure',
      description: `Scan the project structure at ${path}`,
      type: 'analyze',
      priority: 'high',
      estimatedTime: 5,
      dependencies: [],
      resources: {
        files: [path],
        tools: [],
        services: []
      },
      successCriteria: ['Project structure mapped', 'Key files identified']
    });

    // Step 2: Analyze code quality
    steps.push({
      id: `step_${stepId++}`,
      name: 'Analyze Code Quality',
      description: `Analyze code quality and identify issues`,
      type: 'analyze',
      priority: 'high',
      estimatedTime: 10,
      dependencies: ['step_1'],
      resources: {
        files: [path],
        tools: ['rag'],
        services: ['vector-db']
      },
      successCriteria: ['Code quality assessed', 'Issues identified']
    });

    // Step 3: Generate report
    steps.push({
      id: `step_${stepId++}`,
      name: 'Generate Report',
      description: `Generate comprehensive analysis report`,
      type: 'document',
      priority: 'medium',
      estimatedTime: 8,
      dependencies: ['step_2'],
      resources: {
        files: [],
        tools: ['context7', 'rag'],
        services: ['vector-db']
      },
      successCriteria: ['Report generated', 'Recommendations provided']
    });

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const riskLevel = this.assessRiskLevel(steps, context);
    const confidence = this.calculateConfidence(steps, context);

    return {
      steps,
      totalSteps: steps.length,
      estimatedTotalTime: totalTime,
      riskLevel,
      confidence
    };
  }

  private generateFixPlan(
    requestData: any,
    context: any,
    steps: ExecutionPlan['steps'],
    stepId: number
  ): ExecutionPlan {
    const errorDetails = requestData.errorDetails || '';
    const filePath = requestData.filePath || '';

    // Step 1: Diagnose error
    steps.push({
      id: `step_${stepId++}`,
      name: 'Diagnose Error',
      description: `Diagnose the error: ${errorDetails}`,
      type: 'analyze',
      priority: 'high',
      estimatedTime: 8,
      dependencies: [],
      resources: {
        files: [filePath],
        tools: ['context7', 'rag'],
        services: ['vector-db']
      },
      successCriteria: ['Error root cause identified', 'Fix approach determined']
    });

    // Step 2: Apply fix
    steps.push({
      id: `step_${stepId++}`,
      name: 'Apply Fix',
      description: `Apply the fix to resolve the error`,
      type: 'modify',
      priority: 'high',
      estimatedTime: 12,
      dependencies: ['step_1'],
      resources: {
        files: [filePath],
        tools: ['context7', 'rag'],
        services: ['vector-db']
      },
      successCriteria: ['Fix applied', 'Code compiles without errors']
    });

    // Step 3: Validate fix
    steps.push({
      id: `step_${stepId++}`,
      name: 'Validate Fix',
      description: 'Validate that the fix resolves the issue',
      type: 'validate',
      priority: 'high',
      estimatedTime: 6,
      dependencies: ['step_2'],
      resources: {
        files: [filePath],
        tools: ['playwright'],
        services: ['playwright-mcp']
      },
      successCriteria: ['Fix validated', 'No regression issues']
    });

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const riskLevel = this.assessRiskLevel(steps, context);
    const confidence = this.calculateConfidence(steps, context);

    return {
      steps,
      totalSteps: steps.length,
      estimatedTotalTime: totalTime,
      riskLevel,
      confidence
    };
  }

  private generateLearnPlan(
    requestData: any,
    context: any,
    steps: ExecutionPlan['steps'],
    stepId: number
  ): ExecutionPlan {
    const feedback = requestData.feedback || '';
    const contextStr = requestData.context || '';
    const tags = requestData.tags || [];

    // Step 1: Extract patterns
    steps.push({
      id: `step_${stepId++}`,
      name: 'Extract Patterns',
      description: `Extract patterns from feedback: ${feedback}`,
      type: 'analyze',
      priority: 'high',
      estimatedTime: 8,
      dependencies: [],
      resources: {
        files: [],
        tools: ['rag'],
        services: ['vector-db']
      },
      successCriteria: ['Patterns extracted', 'Key insights identified']
    });

    // Step 2: Store lesson
    steps.push({
      id: `step_${stepId++}`,
      name: 'Store Lesson',
      description: 'Store the lesson in the vector database',
      type: 'create',
      priority: 'high',
      estimatedTime: 5,
      dependencies: ['step_1'],
      resources: {
        files: [],
        tools: [],
        services: ['vector-db']
      },
      successCriteria: ['Lesson stored', 'Searchable by tags']
    });

    // Step 3: Validate storage
    steps.push({
      id: `step_${stepId++}`,
      name: 'Validate Storage',
      description: 'Validate that the lesson was stored correctly',
      type: 'validate',
      priority: 'medium',
      estimatedTime: 3,
      dependencies: ['step_2'],
      resources: {
        files: [],
        tools: [],
        services: ['vector-db']
      },
      successCriteria: ['Lesson retrievable', 'Metadata correct']
    });

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const riskLevel = this.assessRiskLevel(steps, context);
    const confidence = this.calculateConfidence(steps, context);

    return {
      steps,
      totalSteps: steps.length,
      estimatedTotalTime: totalTime,
      riskLevel,
      confidence
    };
  }

  private generateGenericPlan(
    requestData: any,
    context: any,
    steps: ExecutionPlan['steps'],
    stepId: number
  ): ExecutionPlan {
    // Generic plan for unknown tool types
    steps.push({
      id: `step_${stepId++}`,
      name: 'Process Request',
      description: 'Process the request using available context',
      type: 'analyze',
      priority: 'high',
      estimatedTime: 10,
      dependencies: [],
      resources: {
        files: [],
        tools: ['context7', 'rag'],
        services: ['vector-db']
      },
      successCriteria: ['Request processed', 'Result generated']
    });

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const riskLevel = this.assessRiskLevel(steps, context);
    const confidence = this.calculateConfidence(steps, context);

    return {
      steps,
      totalSteps: steps.length,
      estimatedTotalTime: totalTime,
      riskLevel,
      confidence
    };
  }

  private generateReasoning(plan: ExecutionPlan, context: PipelineContext): string {
    const toolName = context.toolName;
    const stepCount = plan.totalSteps;
    const estimatedTime = plan.estimatedTotalTime;
    const confidence = plan.confidence;

    return `Generated ${stepCount}-step execution plan for ${toolName} with ${estimatedTime} minute estimated duration. Confidence level: ${Math.round(confidence * 100)}%. Plan considers available context from previous stages and follows best practices for the identified framework and project type.`;
  }

  private generateAlternatives(plan: ExecutionPlan, context: PipelineContext): string[] {
    const alternatives: string[] = [];
    
    if (plan.steps.length > 3) {
      alternatives.push('Simplified approach with fewer steps');
    }
    
    if (plan.estimatedTotalTime > 30) {
      alternatives.push('Parallel execution of independent steps');
    }
    
    if (plan.riskLevel === 'high') {
      alternatives.push('More conservative approach with additional validation');
    }
    
    return alternatives;
  }

  private identifyConstraints(context: PipelineContext): string[] {
    const constraints: string[] = [];
    
    if (context.budget.time < 60000) {
      constraints.push('Limited time budget');
    }
    
    if (context.budget.files < 5) {
      constraints.push('Limited file access');
    }
    
    if (context.scope.maxLinesPerFile < 1000) {
      constraints.push('Limited file size analysis');
    }
    
    return constraints;
  }

  private identifyAssumptions(context: PipelineContext): string[] {
    const assumptions: string[] = [];
    
    if (context.data.repoFacts) {
      assumptions.push('Repository facts are accurate');
    }
    
    if (context.data.context7) {
      assumptions.push('Context7 data is relevant and up-to-date');
    }
    
    if (context.data.rag) {
      assumptions.push('RAG data is relevant to the request');
    }
    
    return assumptions;
  }

  private assessRiskLevel(steps: ExecutionPlan['steps'], context: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    // High priority steps increase risk
    riskScore += steps.filter(s => s.priority === 'high').length * 2;
    
    // Long estimated time increases risk
    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    if (totalTime > 30) riskScore += 2;
    
    // Missing context increases risk
    if (!context.repoFacts) riskScore += 1;
    if (!context.context7) riskScore += 1;
    if (!context.rag) riskScore += 1;
    
    if (riskScore <= 2) return 'low';
    if (riskScore <= 5) return 'medium';
    return 'high';
  }

  private calculateConfidence(steps: ExecutionPlan['steps'], context: any): number {
    let confidence = 0.5; // Base confidence
    
    // More context increases confidence
    if (context.repoFacts) confidence += 0.1;
    if (context.context7) confidence += 0.1;
    if (context.rag) confidence += 0.1;
    if (context.snippets) confidence += 0.1;
    
    // Fewer steps increase confidence
    if (steps.length <= 3) confidence += 0.1;
    
    // Lower risk increases confidence
    const riskLevel = this.assessRiskLevel(steps, context);
    if (riskLevel === 'low') confidence += 0.1;
    else if (riskLevel === 'high') confidence -= 0.1;
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  private createFallbackPlan(context: PipelineContext): ExecutionPlan {
    return {
      steps: [{
        id: 'step_1',
        name: 'Execute Request',
        description: 'Execute the request with available context',
        type: 'analyze',
        priority: 'high',
        estimatedTime: 10,
        dependencies: [],
        resources: {
          files: [],
          tools: [],
          services: []
        },
        successCriteria: ['Request completed']
      }],
      totalSteps: 1,
      estimatedTotalTime: 10,
      riskLevel: 'medium',
      confidence: 0.5
    };
  }

  private estimateTokens(planData: PlanData): number {
    const content = JSON.stringify(planData);
    return Math.ceil(content.length / 4); // Rough estimation: 1 token ≈ 4 characters
  }
}
