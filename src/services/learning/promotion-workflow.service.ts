/**
 * Promotion Workflow Service
 * 
 * Manages the complete promotion workflow including approval processes,
 * validation steps, and automated promotion pipelines.
 * 
 * Vibe Coder Benefits:
 * - Automated promotion workflows
 * - Quality assurance and validation
 * - Approval and review processes
 * - Promotion pipeline management
 */

import { Logger } from '../logger/logger.js';
import type { LessonCard } from '../lessons/lessons-learned.service.js';
import type { ProjectMetadata } from '../project/project-identifier.service.js';
import type { PromotionCandidate, PromotionResult } from './lesson-promotion.service.js';

const logger = new Logger('PromotionWorkflowService');

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'validation' | 'approval' | 'processing' | 'notification';
  required: boolean;
  automated: boolean;
  config: Record<string, any>;
}

export interface PromotionWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  autoApprove: boolean;
  maxRetries: number;
  timeout: number; // in milliseconds
  active: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  candidateId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: string;
  stepResults: Map<string, any>;
  errors: string[];
  warnings: string[];
  startedAt: Date;
  completedAt?: Date;
  result?: PromotionResult;
}

export interface ApprovalRequest {
  id: string;
  candidate: PromotionCandidate;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewers: string[];
  approvals: string[];
  rejections: string[];
  comments: { reviewer: string; comment: string; timestamp: Date }[];
  expiresAt: Date;
}

export interface WorkflowConfiguration {
  defaultWorkflow: string;
  autoApprovalThreshold: number;
  maxApprovalTime: number; // in hours
  notificationEnabled: boolean;
  approvalRequired: boolean;
}

export class PromotionWorkflowService {
  private workflows = new Map<string, PromotionWorkflow>();
  private executions = new Map<string, WorkflowExecution>();
  private approvalRequests = new Map<string, ApprovalRequest>();
  private config: WorkflowConfiguration;

  constructor(config?: Partial<WorkflowConfiguration>) {
    this.config = {
      defaultWorkflow: 'standard-promotion',
      autoApprovalThreshold: 0.9, // 90%
      maxApprovalTime: 24, // 24 hours
      notificationEnabled: true,
      approvalRequired: true,
      ...config
    };

    this.initializeDefaultWorkflows();
    logger.info('PromotionWorkflowService initialized', { config: this.config });
  }

  /**
   * Execute promotion workflow for a candidate
   */
  async executePromotionWorkflow(
    candidate: PromotionCandidate,
    workflowId?: string
  ): Promise<WorkflowExecution> {
    const workflow = workflowId ? 
      this.workflows.get(workflowId) : 
      this.workflows.get(this.config.defaultWorkflow);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId || this.config.defaultWorkflow}`);
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      candidateId: candidate.lesson.id,
      status: 'pending',
      currentStep: workflow.steps[0]?.id || '',
      stepResults: new Map(),
      errors: [],
      warnings: [],
      startedAt: new Date()
    };

    this.executions.set(executionId, execution);

    logger.info(`Starting promotion workflow: ${workflow.name}`, {
      executionId,
      candidateId: candidate.lesson.id,
      projectId: candidate.projectContext.id
    });

    try {
      execution.status = 'running';

      // Execute workflow steps
      for (const step of workflow.steps) {
        execution.currentStep = step.id;
        
        logger.debug(`Executing workflow step: ${step.name}`, { executionId, stepId: step.id });

        try {
          const stepResult = await this.executeWorkflowStep(step, candidate, execution);
          execution.stepResults.set(step.id, stepResult);

          // Check if step failed and is required
          if (!stepResult.success && step.required) {
            execution.status = 'failed';
            execution.errors.push(`Required step failed: ${step.name}`);
            break;
          }

          // Check for approval requirements
          if (step.type === 'approval' && !stepResult.approved) {
            if (this.config.approvalRequired) {
              execution.status = 'pending';
              await this.createApprovalRequest(candidate, execution);
              return execution; // Wait for approval
            } else {
              execution.warnings.push(`Step ${step.name} not approved but continuing`);
            }
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          execution.errors.push(`Step ${step.name} failed: ${errorMessage}`);
          
          if (step.required) {
            execution.status = 'failed';
            break;
          } else {
            execution.warnings.push(`Non-required step ${step.name} failed: ${errorMessage}`);
          }
        }
      }

      // Complete workflow
      if (execution.status === 'running') {
        execution.status = 'completed';
        execution.completedAt = new Date();
        
        // Generate final result
        execution.result = this.generatePromotionResult(execution, candidate);
        
        logger.info(`Promotion workflow completed successfully`, {
          executionId,
          duration: execution.completedAt.getTime() - execution.startedAt.getTime()
        });
      }

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push(`Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error(`Promotion workflow failed:`, error);
    }

    return execution;
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    candidate: PromotionCandidate,
    execution: WorkflowExecution
  ): Promise<any> {
    switch (step.type) {
      case 'validation':
        return await this.executeValidationStep(step, candidate, execution);
      
      case 'approval':
        return await this.executeApprovalStep(step, candidate, execution);
      
      case 'processing':
        return await this.executeProcessingStep(step, candidate, execution);
      
      case 'notification':
        return await this.executeNotificationStep(step, candidate, execution);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(
    step: WorkflowStep,
    candidate: PromotionCandidate,
    execution: WorkflowExecution
  ): Promise<any> {
    const validations = step.config.validations || [];
    const results = [];

    for (const validation of validations) {
      switch (validation.type) {
        case 'quality-check':
          results.push(await this.validateQuality(candidate, validation));
          break;
        
        case 'duplicate-check':
          results.push(await this.validateDuplicates(candidate, validation));
          break;
        
        case 'completeness-check':
          results.push(await this.validateCompleteness(candidate, validation));
          break;
        
        default:
          results.push({ success: false, error: `Unknown validation type: ${validation.type}` });
      }
    }

    const allPassed = results.every(r => r.success);
    return {
      success: allPassed,
      results,
      passed: results.filter(r => r.success).length,
      total: results.length
    };
  }

  /**
   * Execute approval step
   */
  private async executeApprovalStep(
    step: WorkflowStep,
    candidate: PromotionCandidate,
    execution: WorkflowExecution
  ): Promise<any> {
    // Check if auto-approval is possible
    if (candidate.score.overallScore >= this.config.autoApprovalThreshold * 100) {
      return {
        success: true,
        approved: true,
        method: 'auto-approval',
        reason: `Score ${candidate.score.overallScore} exceeds threshold ${this.config.autoApprovalThreshold * 100}`
      };
    }

    // Check for existing approval
    const existingApproval = Array.from(this.approvalRequests.values())
      .find(req => req.candidate.lesson.id === candidate.lesson.id && req.status === 'approved');

    if (existingApproval) {
      return {
        success: true,
        approved: true,
        method: 'existing-approval',
        approvalId: existingApproval.id
      };
    }

    return {
      success: true,
      approved: false,
      method: 'manual-approval-required',
      reason: 'Manual approval required'
    };
  }

  /**
   * Execute processing step
   */
  private async executeProcessingStep(
    step: WorkflowStep,
    candidate: PromotionCandidate,
    execution: WorkflowExecution
  ): Promise<any> {
    const processingType = step.config.processingType || 'promotion';

    switch (processingType) {
      case 'promotion':
        return await this.processPromotion(candidate, execution);
      
      case 'notification':
        return await this.processNotification(candidate, execution);
      
      case 'cleanup':
        return await this.processCleanup(candidate, execution);
      
      default:
        throw new Error(`Unknown processing type: ${processingType}`);
    }
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(
    step: WorkflowStep,
    candidate: PromotionCandidate,
    execution: WorkflowExecution
  ): Promise<any> {
    if (!this.config.notificationEnabled) {
      return { success: true, skipped: true, reason: 'Notifications disabled' };
    }

    const notificationType = step.config.notificationType || 'promotion-complete';
    const recipients = step.config.recipients || [];

    // Simulate notification sending
    logger.info(`Sending notification: ${notificationType}`, {
      recipients,
      candidateId: candidate.lesson.id
    });

    return {
      success: true,
      notificationType,
      recipients,
      sent: true
    };
  }

  /**
   * Create approval request
   */
  private async createApprovalRequest(
    candidate: PromotionCandidate,
    execution: WorkflowExecution
  ): Promise<void> {
    const approvalId = this.generateApprovalId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.config.maxApprovalTime);

    const approvalRequest: ApprovalRequest = {
      id: approvalId,
      candidate,
      requestedBy: 'system',
      requestedAt: new Date(),
      status: 'pending',
      reviewers: this.config.approvalRequired ? ['admin', 'reviewer'] : [],
      approvals: [],
      rejections: [],
      comments: [],
      expiresAt
    };

    this.approvalRequests.set(approvalId, approvalRequest);

    logger.info(`Created approval request: ${approvalId}`, {
      candidateId: candidate.lesson.id,
      expiresAt: expiresAt.toISOString()
    });
  }

  /**
   * Process approval request
   */
  async processApproval(
    approvalId: string,
    reviewer: string,
    decision: 'approve' | 'reject',
    comment?: string
  ): Promise<boolean> {
    const approval = this.approvalRequests.get(approvalId);
    if (!approval) {
      throw new Error(`Approval request not found: ${approvalId}`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval request already processed: ${approvalId}`);
    }

    if (approval.expiresAt < new Date()) {
      approval.status = 'expired';
      return false;
    }

    // Add comment if provided
    if (comment) {
      approval.comments.push({
        reviewer,
        comment,
        timestamp: new Date()
      });
    }

    // Process decision
    if (decision === 'approve') {
      approval.approvals.push(reviewer);
    } else {
      approval.rejections.push(reviewer);
    }

    // Check if approval is complete
    const requiredApprovals = approval.reviewers.length;
    const receivedApprovals = approval.approvals.length;
    const receivedRejections = approval.rejections.length;

    if (receivedApprovals >= requiredApprovals) {
      approval.status = 'approved';
      logger.info(`Approval request approved: ${approvalId}`, { reviewer, approvals: receivedApprovals });
      return true;
    } else if (receivedRejections > 0) {
      approval.status = 'rejected';
      logger.info(`Approval request rejected: ${approvalId}`, { reviewer, rejections: receivedRejections });
      return false;
    }

    return false; // Still pending
  }

  /**
   * Validate quality
   */
  private async validateQuality(candidate: PromotionCandidate, validation: any): Promise<any> {
    const minScore = validation.minScore || 70;
    const score = candidate.score.overallScore;

    return {
      success: score >= minScore,
      score,
      minScore,
      message: score >= minScore ? 'Quality check passed' : 'Quality score too low'
    };
  }

  /**
   * Validate duplicates
   */
  private async validateDuplicates(candidate: PromotionCandidate, validation: any): Promise<any> {
    // Simplified duplicate check - in real implementation, check against existing lessons
    const isDuplicate = false; // Placeholder logic

    return {
      success: !isDuplicate,
      isDuplicate,
      message: isDuplicate ? 'Duplicate lesson found' : 'No duplicates found'
    };
  }

  /**
   * Validate completeness
   */
  private async validateCompleteness(candidate: PromotionCandidate, validation: any): Promise<any> {
    const requiredFields = validation.requiredFields || ['title', 'content', 'category'];
    const missingFields = requiredFields.filter(field => !candidate.lesson[field as keyof LessonCard]);

    return {
      success: missingFields.length === 0,
      missingFields,
      message: missingFields.length === 0 ? 'All required fields present' : `Missing fields: ${missingFields.join(', ')}`
    };
  }

  /**
   * Process promotion
   */
  private async processPromotion(candidate: PromotionCandidate, execution: WorkflowExecution): Promise<any> {
    // Simulate promotion processing
    logger.info(`Processing promotion for lesson: ${candidate.lesson.content.summary}`);

    return {
      success: true,
      processed: true,
      promotedLessonId: `promoted_${candidate.lesson.id}`
    };
  }

  /**
   * Process notification
   */
  private async processNotification(candidate: PromotionCandidate, execution: WorkflowExecution): Promise<any> {
    return {
      success: true,
      notificationSent: true,
      message: `Lesson ${candidate.lesson.content.summary} promoted successfully`
    };
  }

  /**
   * Process cleanup
   */
  private async processCleanup(candidate: PromotionCandidate, execution: WorkflowExecution): Promise<any> {
    return {
      success: true,
      cleaned: true,
      message: 'Cleanup completed'
    };
  }

  /**
   * Generate promotion result
   */
  private generatePromotionResult(execution: WorkflowExecution, candidate: PromotionCandidate): PromotionResult {
    const success = execution.status === 'completed' && execution.errors.length === 0;

    return {
      success,
      originalLessonId: candidate.lesson.id,
      promotionScore: candidate.score.overallScore,
      errors: execution.errors,
      warnings: execution.warnings
    };
  }

  /**
   * Initialize default workflows
   */
  private initializeDefaultWorkflows(): void {
    const standardWorkflow: PromotionWorkflow = {
      id: 'standard-promotion',
      name: 'Standard Promotion Workflow',
      description: 'Standard workflow for promoting lessons to shared knowledge base',
      steps: [
        {
          id: 'quality-validation',
          name: 'Quality Validation',
          type: 'validation',
          required: true,
          automated: true,
          config: {
            validations: [
              { type: 'quality-check', minScore: 70 },
              { type: 'completeness-check', requiredFields: ['title', 'content', 'category'] }
            ]
          }
        },
        {
          id: 'approval',
          name: 'Approval',
          type: 'approval',
          required: true,
          automated: false,
          config: {
            autoApproveThreshold: 90
          }
        },
        {
          id: 'promotion-processing',
          name: 'Promotion Processing',
          type: 'processing',
          required: true,
          automated: true,
          config: {
            processingType: 'promotion'
          }
        },
        {
          id: 'notification',
          name: 'Notification',
          type: 'notification',
          required: false,
          automated: true,
          config: {
            notificationType: 'promotion-complete',
            recipients: ['admin', 'reviewer']
          }
        }
      ],
      autoApprove: false,
      maxRetries: 3,
      timeout: 3600000, // 1 hour
      active: true
    };

    this.workflows.set(standardWorkflow.id, standardWorkflow);
  }

  /**
   * Generate execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate approval ID
   */
  private generateApprovalId(): string {
    return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get workflow executions
   */
  getWorkflowExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get approval requests
   */
  getApprovalRequests(): ApprovalRequest[] {
    return Array.from(this.approvalRequests.values());
  }

  /**
   * Get workflows
   */
  getWorkflows(): PromotionWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Update workflow configuration
   */
  updateConfiguration(config: Partial<WorkflowConfiguration>): void {
    Object.assign(this.config, config);
    logger.info('Updated workflow configuration', { config });
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.executions.clear();
    this.approvalRequests.clear();
    logger.info('Cleared all workflow data');
  }
}
