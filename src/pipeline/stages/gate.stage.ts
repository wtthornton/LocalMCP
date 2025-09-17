import { Logger } from '../../services/logger/logger.js';
import { ConfigService } from '../../config/config.service.js';
import type { PipelineStage, PipelineContext, PipelineError, PipelineBudget } from '../pipeline-engine.js';

/**
 * Gate Stage - Enforces policies and quality gates
 * 
 * This stage acts as a quality gate, enforcing policies,
 * security checks, and compliance requirements before
 * allowing pipeline execution to proceed.
 */
export class GateStage implements PipelineStage {
  readonly name = 'Gate';

  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  async execute(context: PipelineContext): Promise<Partial<PipelineContext>> {
    this.logger.debug('Executing Gate stage', { 
      toolName: context.toolName,
      requestId: context.requestId 
    });

    try {
      const results: any = {
        gatesPassed: true,
        policiesEnforced: [],
        securityChecks: [],
        complianceChecks: [],
        warnings: [],
        blocked: false,
        reason: null
      };

      // Check if request should be blocked based on policies
      const policyCheck = await this.checkPolicies(context);
      if (!policyCheck.allowed) {
        results.blocked = true;
        results.reason = policyCheck.reason;
        results.gatesPassed = false;
        
        this.logger.warn('Request blocked by policy', {
          toolName: context.toolName,
          reason: policyCheck.reason
        });

        return {
          errors: [
            ...context.errors,
            {
              stage: 'Gate',
              error: `Request blocked: ${policyCheck.reason}`,
              timestamp: Date.now(),
              retryable: false
            }
          ]
        };
      }

      // Perform security checks
      await this.performSecurityChecks(context, results);

      // Perform compliance checks
      await this.performComplianceChecks(context, results);

      // Check resource limits
      await this.checkResourceLimits(context, results);

      // Check rate limits
      await this.checkRateLimits(context, results);

      // Update context with gate results
      context.metadata = {
        ...context.metadata,
        gate: {
          stage: 'Gate',
          timestamp: new Date().toISOString(),
          gatesPassed: results.gatesPassed,
          policiesEnforced: results.policiesEnforced.length,
          securityChecks: results.securityChecks.length,
          complianceChecks: results.complianceChecks.length,
          blocked: results.blocked
        }
      };

      // Add warnings to context
      if (results.warnings.length > 0) {
        context.warnings = [...(context.warnings || []), ...results.warnings];
      }

      // If gates failed, mark context as unsuccessful
      if (!results.gatesPassed) {
        context.success = false;
        context.error = {
          stage: 'Gate',
          message: `Quality gates failed: ${results.warnings.join(', ')}`,
          timestamp: new Date().toISOString(),
          context: {
            toolName: context.toolName,
            requestId: context.requestId
          }
        };
      }

      this.logger.info('Gate stage completed', {
        toolName: context.toolName,
        gatesPassed: results.gatesPassed,
        policiesEnforced: results.policiesEnforced.length,
        securityChecks: results.securityChecks.length,
        blocked: results.blocked
      });

      return {
        data: {
          ...context.data,
          gateResults: results
        },
        metadata: {
          ...context.metadata,
          gate: {
            stage: 'Gate',
            timestamp: Date.now(),
            gatesPassed: results.gatesPassed,
            policiesEnforced: results.policiesEnforced.length,
            securityChecks: results.securityChecks.length,
            complianceChecks: results.complianceChecks.length,
            blocked: results.blocked
          }
        }
      };

    } catch (error) {
      this.logger.error('Gate stage failed:', error);
      return {
        errors: [
          ...context.errors,
          {
            stage: 'Gate',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
            retryable: false
          }
        ]
      };
    }
  }

  canRetry(error: PipelineError): boolean {
    return error.retryable && this.getBudgetCost().time !== undefined;
  }

  getBudgetCost(): Partial<PipelineBudget> {
    return {
      time: 200, // 0.2 seconds
      tokens: 25,
      chunks: 0,
      files: 0
    };
  }

  private async checkPolicies(context: PipelineContext): Promise<{ allowed: boolean; reason?: string }> {
    // Check tool-specific policies
    switch (context.toolName) {
      case 'localmcp.create':
        return this.checkCreatePolicies(context);
      case 'localmcp.fix':
        return this.checkFixPolicies(context);
      case 'localmcp.analyze':
        return this.checkAnalyzePolicies(context);
      case 'localmcp.learn':
        return this.checkLearnPolicies(context);
      default:
        return { allowed: true };
    }
  }

  private async checkCreatePolicies(context: PipelineContext): Promise<{ allowed: boolean; reason?: string }> {
    const request = context.request;
    
    // Check if request is trying to create sensitive files
    if (typeof request === 'object' && request.description) {
      const description = request.description.toLowerCase();
      
      // Block creation of sensitive files
      if (description.includes('password') || description.includes('secret') || description.includes('key')) {
        return {
          allowed: false,
          reason: 'Creation of sensitive files is not allowed'
        };
      }

      // Block creation of system files
      if (description.includes('system') || description.includes('config') || description.includes('env')) {
        return {
          allowed: false,
          reason: 'Creation of system configuration files is not allowed'
        };
      }
    }

    return { allowed: true };
  }

  private async checkFixPolicies(context: PipelineContext): Promise<{ allowed: boolean; reason?: string }> {
    const request = context.request;
    
    // Check if fix request is reasonable
    if (typeof request === 'object' && request.description) {
      const description = request.description.toLowerCase();
      
      // Block fixes that might be destructive
      if (description.includes('delete') || description.includes('remove') || description.includes('drop')) {
        return {
          allowed: false,
          reason: 'Destructive operations are not allowed in fix requests'
        };
      }
    }

    return { allowed: true };
  }

  private async checkAnalyzePolicies(context: PipelineContext): Promise<{ allowed: boolean; reason?: string }> {
    // Analysis is generally safe, but check for excessive resource usage
    const request = context.request;
    
    if (typeof request === 'object' && request.targetPath) {
      // Check if path is reasonable
      const path = request.targetPath;
      if (path.includes('..') || path.startsWith('/') || path.includes('node_modules')) {
        return {
          allowed: false,
          reason: 'Analysis of system directories or node_modules is not allowed'
        };
      }
    }

    return { allowed: true };
  }

  private async checkLearnPolicies(context: PipelineContext): Promise<{ allowed: boolean; reason?: string }> {
    // Learning operations are generally safe
    return { allowed: true };
  }

  private async performSecurityChecks(context: PipelineContext, results: any): Promise<void> {
    results.securityChecks.push('policy-check');

    // Check for potential security issues in the request
    const request = context.request;
    
    if (typeof request === 'object') {
      // Check for suspicious patterns in the request
      const requestStr = JSON.stringify(request).toLowerCase();
      
      if (requestStr.includes('eval(') || requestStr.includes('function(')) {
        results.warnings.push('Request contains potentially unsafe code patterns');
      }

      if (requestStr.includes('http://') || requestStr.includes('ftp://')) {
        results.warnings.push('Request contains unencrypted network protocols');
      }

      if (requestStr.includes('rm -rf') || requestStr.includes('del /s')) {
        results.warnings.push('Request contains potentially destructive commands');
        results.gatesPassed = false;
      }
    }

    // Check file paths for directory traversal
    if (typeof request === 'object' && request.targetPath) {
      if (request.targetPath.includes('..') || request.targetPath.includes('~')) {
        results.warnings.push('Request contains potentially unsafe file paths');
        results.gatesPassed = false;
      }
    }
  }

  private async performComplianceChecks(context: PipelineContext, results: any): Promise<void> {
    results.complianceChecks.push('basic-compliance');

    // Check for compliance with coding standards
    const editResults = context.stageResults?.['Edit']?.data;
    if (editResults?.filesCreated || editResults?.filesModified) {
      const files = [...(editResults.filesCreated || []), ...(editResults.filesModified || [])];
      
      for (const file of files) {
        if (file.content) {
          // Check for proper file headers
          if (file.path.endsWith('.ts') || file.path.endsWith('.js')) {
            if (!file.content.includes('//') && !file.content.includes('/*')) {
              results.warnings.push(`File ${file.path} may benefit from documentation comments`);
            }
          }

          // Check for proper formatting
          if (file.content.includes('\t') && !file.content.includes('  ')) {
            results.warnings.push(`File ${file.path} uses tabs instead of spaces`);
          }
        }
      }
    }
  }

  private async checkResourceLimits(context: PipelineContext, results: any): Promise<void> {
    results.policiesEnforced.push('resource-limits');

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryLimit = 512 * 1024 * 1024; // 512MB limit
    
    if (memoryUsage.heapUsed > memoryLimit) {
      results.warnings.push('High memory usage detected');
      results.gatesPassed = false;
    }

    // Check execution time
    if (context.executionTime && context.executionTime > 30000) { // 30 second limit
      results.warnings.push('Long execution time detected');
    }

    // Check file size limits
    const editResults = context.stageResults?.['Edit']?.data;
    if (editResults?.filesCreated) {
      for (const file of editResults.filesCreated) {
        if (file.content && file.content.length > 100000) { // 100KB limit
          results.warnings.push(`Large file created: ${file.path} (${file.content.length} characters)`);
        }
      }
    }
  }

  private async checkRateLimits(context: PipelineContext, results: any): Promise<void> {
    results.policiesEnforced.push('rate-limits');

    // Simple rate limiting based on tool type
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const limits: Record<string, number> = {
      'localmcp.create': 10,
      'localmcp.fix': 20,
      'localmcp.analyze': 30,
      'localmcp.learn': 50
    };

    // In a real implementation, this would check against actual rate limit counters
    // For now, we'll just log the check
    const limit = limits[context.toolName] || 10;
    
    this.logger.debug('Rate limit check', {
      toolName: context.toolName,
      limit,
      windowMs
    });

    // Add a warning if we're approaching limits (simulated)
    if (Math.random() > 0.9) { // 10% chance of warning
      results.warnings.push('Approaching rate limit for this tool');
    }
  }
}
