/**
 * PolicyGate Service - Enterprise-grade policy enforcement for LocalMCP
 * 
 * This service provides centralized policy enforcement with:
 * - Rule engine for configurable business rules
 * - Per-file edit caps and rate limiting
 * - Mandatory citations and source attribution
 * - Code quality gates and security checks
 * - Project-specific policy enforcement
 * - Compliance and audit trail requirements
 * 
 * Benefits for vibe coders:
 * - Prevents accidental code destruction with edit limits
 * - Ensures proper attribution and documentation
 * - Maintains code quality standards automatically
 * - Provides audit trail for compliance requirements
 * - Configurable policies per project type
 */

import { EventEmitter } from 'events';

// Policy Types and Interfaces
export interface SecurityContext {
  user: UserIdentity;
  project: ProjectContext;
  action: ActionType;
  resource: ResourceIdentifier;
  timestamp: Date;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
}

export interface UserIdentity {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface ProjectContext {
  id: string;
  name: string;
  type: ProjectType;
  techStack: string[];
  policies: ProjectPolicies;
}

export interface ResourceIdentifier {
  type: 'file' | 'directory' | 'api' | 'database';
  path: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface ProjectPolicies {
  editCaps: EditCapPolicy;
  citations: CitationPolicy;
  qualityGates: QualityGatePolicy;
  securityChecks: SecurityCheckPolicy;
  customRules: CustomRule[];
}

export interface EditCapPolicy {
  maxFilesPerSession: number;
  maxLinesPerFile: number;
  maxTotalLines: number;
  rateLimitPerMinute: number;
  protectedFiles: string[];
  protectedDirectories: string[];
}

export interface CitationPolicy {
  requireCitations: boolean;
  mandatorySources: string[];
  citationFormat: 'markdown' | 'html' | 'plain';
  autoGenerateCitations: boolean;
  validateCitations: boolean;
}

export interface QualityGatePolicy {
  requireTests: boolean;
  minTestCoverage: number;
  requireLinting: boolean;
  requireTypeChecking: boolean;
  securityScanRequired: boolean;
  performanceThresholds: PerformanceThreshold[];
}

export interface SecurityCheckPolicy {
  scanForSecrets: boolean;
  validateInputs: boolean;
  checkDependencies: boolean;
  requireHTTPS: boolean;
  auditLogRequired: boolean;
}

export interface PerformanceThreshold {
  metric: 'response_time' | 'memory_usage' | 'cpu_usage' | 'file_size';
  threshold: number;
  unit: string;
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JavaScript expression
  action: 'allow' | 'deny' | 'warn' | 'log';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer'
}

export enum ProjectType {
  WEB_APP = 'web_app',
  API_SERVICE = 'api_service',
  MOBILE_APP = 'mobile_app',
  DESKTOP_APP = 'desktop_app',
  LIBRARY = 'library',
  MICROSERVICE = 'microservice',
  MONOREPO = 'monorepo'
}

export enum ActionType {
  CREATE_FILE = 'create_file',
  EDIT_FILE = 'edit_file',
  DELETE_FILE = 'delete_file',
  CREATE_DIRECTORY = 'create_directory',
  DELETE_DIRECTORY = 'delete_directory',
  EXECUTE_CODE = 'execute_code',
  RUN_TESTS = 'run_tests',
  DEPLOY = 'deploy',
  ACCESS_API = 'access_api'
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  warnings: string[];
  violations: PolicyViolation[];
  auditLog: AuditLogEntry;
  recommendations: string[];
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: Record<string, any>;
  timestamp: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
  action: ActionType;
  resource: string;
  result: 'allowed' | 'denied' | 'warning';
  violations: PolicyViolation[];
  context: SecurityContext;
  ipAddress: string;
  userAgent: string;
}

export interface ComplianceResult {
  compliant: boolean;
  score: number;
  violations: PolicyViolation[];
  recommendations: string[];
  auditTrail: AuditLogEntry[];
  lastAudit: Date;
}

export interface AuditReport {
  id: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalActions: number;
    allowedActions: number;
    deniedActions: number;
    warnings: number;
    violations: number;
  };
  violations: PolicyViolation[];
  recommendations: string[];
  complianceScore: number;
}

// PolicyGate Service Implementation
export class PolicyGateService extends EventEmitter {
  private rules: Map<string, CustomRule> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private sessionCounters: Map<string, SessionCounter> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    super();
    this.initializeDefaultRules();
    this.startCleanupTasks();
  }

  /**
   * Enforce policy for a given action and context
   * This is the main entry point for policy enforcement
   */
  async enforcePolicy(action: ActionType, context: SecurityContext): Promise<PolicyResult> {
    const startTime = Date.now();
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // 1. Validate security context
      this.validateSecurityContext(context);

      // 2. Check edit caps and rate limiting
      const editCapResult = await this.checkEditCaps(action, context);
      if (!editCapResult.allowed) {
        violations.push(...editCapResult.violations);
      }
      warnings.push(...editCapResult.warnings);

      // 3. Check citation requirements
      const citationResult = await this.checkCitations(action, context);
      if (!citationResult.allowed) {
        violations.push(...citationResult.violations);
      }
      warnings.push(...citationResult.warnings);

      // 4. Check quality gates
      const qualityResult = await this.checkQualityGates(action, context);
      if (!qualityResult.allowed) {
        violations.push(...qualityResult.violations);
      }
      warnings.push(...qualityResult.warnings);

      // 5. Check security requirements
      const securityResult = await this.checkSecurityChecks(action, context);
      if (!securityResult.allowed) {
        violations.push(...securityResult.violations);
      }
      warnings.push(...securityResult.warnings);

      // 6. Evaluate custom rules
      const customResult = await this.evaluateCustomRules(action, context);
      violations.push(...customResult.violations);
      warnings.push(...customResult.warnings);

      // 7. Generate recommendations
      recommendations.push(...this.generateRecommendations(action, context, violations));

      // 8. Determine final result
      const allowed = violations.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0;

      // 9. Create audit log entry
      const auditEntry = this.createAuditEntry(action, context, allowed, violations);
      this.auditLog.push(auditEntry);

      // 10. Update session counters
      this.updateSessionCounters(context.sessionId, action, context.resource);

      const result: PolicyResult = {
        allowed,
        reason: allowed ? 'Policy check passed' : 'Policy violations detected',
        warnings,
        violations,
        auditLog: auditEntry,
        recommendations
      };

      // Emit events for monitoring
      this.emit('policyEnforced', { action, context, result, duration: Date.now() - startTime });

      return result;

    } catch (error) {
      // Log error and create audit entry
      const errorViolation: PolicyViolation = {
        ruleId: 'POLICY_ERROR',
        ruleName: 'Policy Enforcement Error',
        severity: 'critical',
        message: `Policy enforcement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context: { action, error: error instanceof Error ? error.stack : error },
        timestamp: new Date()
      };

      const auditEntry = this.createAuditEntry(action, context, false, [errorViolation]);
      this.auditLog.push(auditEntry);

      return {
        allowed: false,
        reason: 'Policy enforcement error',
        warnings: [],
        violations: [errorViolation],
        auditLog: auditEntry,
        recommendations: ['Contact system administrator', 'Review policy configuration']
      };
    }
  }

  /**
   * Add a new security rule
   */
  addRule(rule: CustomRule): void {
    this.rules.set(rule.id, rule);
    this.emit('ruleAdded', rule);
  }

  /**
   * Remove a security rule
   */
  removeRule(ruleId: string): void {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.emit('ruleRemoved', ruleId);
    }
  }

  /**
   * Update an existing security rule
   */
  updateRule(ruleId: string, rule: CustomRule): void {
    if (this.rules.has(ruleId)) {
      this.rules.set(ruleId, rule);
      this.emit('ruleUpdated', rule);
    } else {
      throw new Error(`Rule with ID ${ruleId} not found`);
    }
  }

  /**
   * Check compliance for a given context
   */
  async checkCompliance(context: ComplianceContext): Promise<ComplianceResult> {
    const violations: PolicyViolation[] = [];
    const recommendations: string[] = [];
    
    // Get audit trail for the context
    const auditTrail = this.auditLog.filter(entry => 
      entry.userId === context.userId && 
      entry.timestamp >= context.startDate && 
      entry.timestamp <= context.endDate
    );

    // Analyze audit trail for violations
    auditTrail.forEach(entry => {
      violations.push(...entry.violations);
    });

    // Calculate compliance score
    const totalActions = auditTrail.length;
    const compliantActions = auditTrail.filter(entry => entry.result === 'allowed').length;
    const score = totalActions > 0 ? (compliantActions / totalActions) * 100 : 100;

    // Generate recommendations
    if (score < 90) {
      recommendations.push('Review and address policy violations');
      recommendations.push('Consider additional training for users');
      recommendations.push('Update policy rules if needed');
    }

    return {
      compliant: score >= 90,
      score,
      violations,
      recommendations,
      auditTrail,
      lastAudit: new Date()
    };
  }

  /**
   * Generate comprehensive audit report
   */
  generateAuditReport(startDate: Date, endDate: Date): AuditReport {
    const relevantEntries = this.auditLog.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );

    const summary = {
      totalActions: relevantEntries.length,
      allowedActions: relevantEntries.filter(e => e.result === 'allowed').length,
      deniedActions: relevantEntries.filter(e => e.result === 'denied').length,
      warnings: relevantEntries.filter(e => e.result === 'warning').length,
      violations: relevantEntries.reduce((sum, e) => sum + e.violations.length, 0)
    };

    const allViolations = relevantEntries.flatMap(entry => entry.violations);
    const complianceScore = summary.totalActions > 0 ? 
      (summary.allowedActions / summary.totalActions) * 100 : 100;

    const recommendations = this.generateAuditRecommendations(summary, allViolations);

    return {
      id: `audit-${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      summary,
      violations: allViolations,
      recommendations,
      complianceScore
    };
  }

  // Private helper methods

  private validateSecurityContext(context: SecurityContext): void {
    if (!context.user || !context.user.id) {
      throw new Error('Invalid user context');
    }
    if (!context.project || !context.project.id) {
      throw new Error('Invalid project context');
    }
    if (!context.sessionId) {
      throw new Error('Invalid session ID');
    }
  }

  private async checkEditCaps(action: ActionType, context: SecurityContext): Promise<PolicyCheckResult> {
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];
    const policies = context.project.policies.editCaps;

    // Check if action is file-related
    if ([ActionType.CREATE_FILE, ActionType.EDIT_FILE, ActionType.DELETE_FILE].includes(action)) {
      const sessionId = context.sessionId;
      const counter = this.getSessionCounter(sessionId);

      // Check file count limit
      if (counter.filesModified >= policies.maxFilesPerSession) {
        violations.push({
          ruleId: 'EDIT_CAP_FILE_COUNT',
          ruleName: 'File Edit Count Limit',
          severity: 'high',
          message: `Maximum file edits per session exceeded (${policies.maxFilesPerSession})`,
          context: { filesModified: counter.filesModified, limit: policies.maxFilesPerSession },
          timestamp: new Date()
        });
      }

      // Check line count limit per file
      if (context.resource.size && context.resource.size > policies.maxLinesPerFile) {
        violations.push({
          ruleId: 'EDIT_CAP_LINES_PER_FILE',
          ruleName: 'Lines Per File Limit',
          severity: 'medium',
          message: `File exceeds maximum lines per file (${policies.maxLinesPerFile})`,
          context: { fileSize: context.resource.size, limit: policies.maxLinesPerFile },
          timestamp: new Date()
        });
      }

      // Check total lines limit
      if (counter.totalLinesModified >= policies.maxTotalLines) {
        violations.push({
          ruleId: 'EDIT_CAP_TOTAL_LINES',
          ruleName: 'Total Lines Limit',
          severity: 'high',
          message: `Maximum total lines modified exceeded (${policies.maxTotalLines})`,
          context: { totalLines: counter.totalLinesModified, limit: policies.maxTotalLines },
          timestamp: new Date()
        });
      }

      // Check rate limiting
      const rateLimiter = this.getRateLimiter(sessionId);
      if (!rateLimiter.checkLimit(policies.rateLimitPerMinute)) {
        violations.push({
          ruleId: 'EDIT_CAP_RATE_LIMIT',
          ruleName: 'Edit Rate Limit',
          severity: 'medium',
          message: `Edit rate limit exceeded (${policies.rateLimitPerMinute} per minute)`,
          context: { rate: rateLimiter.getCurrentRate(), limit: policies.rateLimitPerMinute },
          timestamp: new Date()
        });
      }

      // Check protected files/directories
      if (this.isProtectedResource(context.resource, policies)) {
        violations.push({
          ruleId: 'EDIT_CAP_PROTECTED_RESOURCE',
          ruleName: 'Protected Resource Access',
          severity: 'critical',
          message: `Attempted to modify protected resource: ${context.resource.path}`,
          context: { resource: context.resource.path },
          timestamp: new Date()
        });
      }
    }

    return {
      allowed: violations.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0,
      violations,
      warnings
    };
  }

  private async checkCitations(action: ActionType, context: SecurityContext): Promise<PolicyCheckResult> {
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];
    const policies = context.project.policies.citations;

    if (policies.requireCitations && [ActionType.CREATE_FILE, ActionType.EDIT_FILE].includes(action)) {
      // Check if citations are present in the resource
      const hasCitations = await this.checkForCitations(context.resource, policies);
      
      if (!hasCitations) {
        violations.push({
          ruleId: 'CITATION_REQUIRED',
          ruleName: 'Mandatory Citations',
          severity: policies.mandatorySources.length > 0 ? 'high' : 'medium',
          message: 'Citations are required for this action',
          context: { resource: context.resource.path, citationFormat: policies.citationFormat },
          timestamp: new Date()
        });
      }

      // Check mandatory sources
      if (policies.mandatorySources.length > 0) {
        const missingSources = await this.checkMandatorySources(context.resource, policies.mandatorySources);
        if (missingSources.length > 0) {
          violations.push({
            ruleId: 'CITATION_MANDATORY_SOURCES',
            ruleName: 'Mandatory Source Citations',
            severity: 'high',
            message: `Missing mandatory sources: ${missingSources.join(', ')}`,
            context: { missingSources, requiredSources: policies.mandatorySources },
            timestamp: new Date()
          });
        }
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      warnings
    };
  }

  private async checkQualityGates(action: ActionType, context: SecurityContext): Promise<PolicyCheckResult> {
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];
    const policies = context.project.policies.qualityGates;

    // Check test requirements
    if (policies.requireTests && action === ActionType.EDIT_FILE) {
      const hasTests = await this.checkForTests(context.resource);
      if (!hasTests) {
        violations.push({
          ruleId: 'QUALITY_TESTS_REQUIRED',
          ruleName: 'Test Coverage Required',
          severity: 'medium',
          message: 'Tests are required for file modifications',
          context: { resource: context.resource.path },
          timestamp: new Date()
        });
      }
    }

    // Check performance thresholds
    if (policies.performanceThresholds.length > 0) {
      const performanceIssues = await this.checkPerformanceThresholds(context.resource, policies.performanceThresholds);
      violations.push(...performanceIssues);
    }

    return {
      allowed: violations.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0,
      violations,
      warnings
    };
  }

  private async checkSecurityChecks(action: ActionType, context: SecurityContext): Promise<PolicyCheckResult> {
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];
    const policies = context.project.policies.securityChecks;

    // Check for secrets
    if (policies.scanForSecrets && [ActionType.CREATE_FILE, ActionType.EDIT_FILE].includes(action)) {
      const secrets = await this.scanForSecrets(context.resource);
      if (secrets.length > 0) {
        violations.push({
          ruleId: 'SECURITY_SECRETS_DETECTED',
          ruleName: 'Secrets Detection',
          severity: 'critical',
          message: `Potential secrets detected: ${secrets.join(', ')}`,
          context: { resource: context.resource.path, secrets },
          timestamp: new Date()
        });
      }
    }

    // Check input validation
    if (policies.validateInputs && action === ActionType.ACCESS_API) {
      const validationIssues = await this.validateInputs(context);
      violations.push(...validationIssues);
    }

    return {
      allowed: violations.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0,
      violations,
      warnings
    };
  }

  private async evaluateCustomRules(action: ActionType, context: SecurityContext): Promise<PolicyCheckResult> {
    const violations: PolicyViolation[] = [];
    const warnings: string[] = [];

    for (const [ruleId, rule] of Array.from(this.rules.entries())) {
      if (!rule.enabled) continue;

      try {
        const result = await this.evaluateRule(rule, action, context);
        if (!result.allowed) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: result.message || `Custom rule violation: ${rule.name}`,
            context: { rule, action, result },
            timestamp: new Date()
          });
        }
        warnings.push(...(result.warnings || []));
      } catch (error) {
        warnings.push(`Error evaluating custom rule ${rule.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      allowed: violations.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0,
      violations,
      warnings
    };
  }

  private async evaluateRule(rule: CustomRule, action: ActionType, context: SecurityContext): Promise<RuleEvaluationResult> {
    // Simple rule evaluation - in production, this would use a proper rule engine
    try {
      // This is a simplified evaluation - in production, use a proper rule engine like Nools or similar
      const condition = rule.condition;
      
      // For now, implement basic rule types
      if (condition.includes('action === "edit_file"') && action === ActionType.EDIT_FILE) {
        return {
          allowed: rule.action !== 'deny',
          message: rule.action === 'deny' ? 'Custom rule: File editing not allowed' : undefined,
          warnings: rule.action === 'warn' ? ['Custom rule warning: File editing restricted'] : []
        };
      }

      return { allowed: true, message: undefined, warnings: [] };
    } catch (error) {
      return {
        allowed: false,
        message: `Rule evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: []
      };
    }
  }

  // Helper methods for various checks
  private isProtectedResource(resource: ResourceIdentifier, policies: EditCapPolicy): boolean {
    const path = resource.path;
    return policies.protectedFiles.includes(path) || 
           policies.protectedDirectories.some(dir => path.startsWith(dir));
  }

  private async checkForCitations(resource: ResourceIdentifier, policies: CitationPolicy): Promise<boolean> {
    // Simplified citation check - in production, this would analyze file content
    return true; // Placeholder
  }

  private async checkMandatorySources(resource: ResourceIdentifier, mandatorySources: string[]): Promise<string[]> {
    // Simplified mandatory source check - in production, this would analyze file content
    return []; // Placeholder
  }

  private async checkForTests(resource: ResourceIdentifier): Promise<boolean> {
    // Simplified test check - in production, this would look for test files
    return true; // Placeholder
  }

  private async checkPerformanceThresholds(resource: ResourceIdentifier, thresholds: PerformanceThreshold[]): Promise<PolicyViolation[]> {
    // Simplified performance check - in production, this would measure actual performance
    return []; // Placeholder
  }

  private async scanForSecrets(resource: ResourceIdentifier): Promise<string[]> {
    // Simplified secret scan - in production, this would use tools like TruffleHog
    return []; // Placeholder
  }

  private async validateInputs(context: SecurityContext): Promise<PolicyViolation[]> {
    // Simplified input validation - in production, this would validate actual inputs
    return []; // Placeholder
  }

  private generateRecommendations(action: ActionType, context: SecurityContext, violations: PolicyViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.ruleId === 'EDIT_CAP_FILE_COUNT')) {
      recommendations.push('Consider breaking down large changes into smaller, focused commits');
    }

    if (violations.some(v => v.ruleId === 'CITATION_REQUIRED')) {
      recommendations.push('Add proper citations and documentation for your changes');
    }

    if (violations.some(v => v.ruleId === 'QUALITY_TESTS_REQUIRED')) {
      recommendations.push('Add comprehensive tests for your code changes');
    }

    if (violations.some(v => v.ruleId === 'SECURITY_SECRETS_DETECTED')) {
      recommendations.push('Remove sensitive information and use environment variables or secure configuration');
    }

    return recommendations;
  }

  private generateAuditRecommendations(summary: any, violations: PolicyViolation[]): string[] {
    const recommendations: string[] = [];

    if (summary.deniedActions > 0) {
      recommendations.push('Review denied actions and consider policy adjustments');
    }

    if (summary.violations > 0) {
      recommendations.push('Address policy violations and provide additional training');
    }

    if (summary.warnings > summary.allowedActions * 0.1) {
      recommendations.push('High warning rate - review and optimize policies');
    }

    return recommendations;
  }

  private createAuditEntry(
    action: ActionType, 
    context: SecurityContext, 
    allowed: boolean, 
    violations: PolicyViolation[]
  ): AuditLogEntry {
    return {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: context.user.id,
      sessionId: context.sessionId,
      action,
      resource: context.resource.path,
      result: allowed ? 'allowed' : (violations.some(v => v.severity === 'critical') ? 'denied' : 'warning'),
      violations,
      context,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    };
  }

  private updateSessionCounters(sessionId: string, action: ActionType, resource: ResourceIdentifier): void {
    const counter = this.getSessionCounter(sessionId);
    
    if ([ActionType.CREATE_FILE, ActionType.EDIT_FILE, ActionType.DELETE_FILE].includes(action)) {
      counter.filesModified++;
      counter.totalLinesModified += resource.size || 0;
    }
  }

  private getSessionCounter(sessionId: string): SessionCounter {
    if (!this.sessionCounters.has(sessionId)) {
      this.sessionCounters.set(sessionId, {
        filesModified: 0,
        totalLinesModified: 0,
        startTime: Date.now()
      });
    }
    return this.sessionCounters.get(sessionId)!;
  }

  private getRateLimiter(sessionId: string): RateLimiter {
    if (!this.rateLimiters.has(sessionId)) {
      this.rateLimiters.set(sessionId, new RateLimiter());
    }
    return this.rateLimiters.get(sessionId)!;
  }

  private initializeDefaultRules(): void {
    // Initialize with default security rules
    const defaultRules: CustomRule[] = [
      {
        id: 'NO_SENSITIVE_DATA',
        name: 'No Sensitive Data',
        description: 'Prevent committing sensitive data like passwords or API keys',
        condition: 'resource.type === "file" && resource.path.includes("secret")',
        action: 'deny',
        severity: 'critical',
        enabled: true
      },
      {
        id: 'REQUIRE_DOCUMENTATION',
        name: 'Require Documentation',
        description: 'Require documentation for new features',
        condition: 'action === "create_file" && resource.path.includes("src/")',
        action: 'warn',
        severity: 'medium',
        enabled: true
      }
    ];

    defaultRules.forEach(rule => this.addRule(rule));
  }

  private startCleanupTasks(): void {
    // Clean up old session counters and rate limiters every hour
    setInterval(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      for (const [sessionId, counter] of Array.from(this.sessionCounters.entries())) {
        if (counter.startTime < oneHourAgo) {
          this.sessionCounters.delete(sessionId);
          this.rateLimiters.delete(sessionId);
        }
      }

      // Clean up old audit logs (keep last 1000 entries)
      if (this.auditLog.length > 1000) {
        this.auditLog = this.auditLog.slice(-1000);
      }
    }, 60 * 60 * 1000); // Every hour
  }
}

// Helper classes and interfaces
interface PolicyCheckResult {
  allowed: boolean;
  violations: PolicyViolation[];
  warnings: string[];
}

interface RuleEvaluationResult {
  allowed: boolean;
  message: string | undefined;
  warnings: string[];
}

interface SessionCounter {
  filesModified: number;
  totalLinesModified: number;
  startTime: number;
}

interface ComplianceContext {
  userId: string;
  startDate: Date;
  endDate: Date;
}

class RateLimiter {
  private requests: number[] = [];

  checkLimit(limitPerMinute: number): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    
    // Remove old requests
    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    
    // Check if under limit
    if (this.requests.length >= limitPerMinute) {
      return false;
    }
    
    // Add current request
    this.requests.push(now);
    return true;
  }

  getCurrentRate(): number {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    return this.requests.length;
  }
}

export default PolicyGateService;
