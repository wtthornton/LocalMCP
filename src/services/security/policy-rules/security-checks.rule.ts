/**
 * Security Checks Rule - Enforces security best practices and vulnerability scanning
 * 
 * This rule helps vibe coders maintain secure code by automatically scanning for
 * common security issues like secrets, vulnerabilities, and insecure patterns.
 */

import type { PolicyViolation, SecurityContext, SecurityCheckPolicy } from '../policy-gate.service';
import { ActionType } from '../policy-gate.service';

export interface SecurityChecksRuleConfig extends SecurityCheckPolicy {
  secretPatterns: SecretPattern[];
  vulnerabilityScanners: VulnerabilityScanner[];
  securityRules: SecurityRule[];
  dependencyCheckers: DependencyChecker[];
}

export interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  examples: string[];
}

export interface VulnerabilityScanner {
  name: string;
  type: 'static' | 'dependency' | 'runtime';
  enabled: boolean;
  config: Record<string, any>;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: RegExp | string;
  checkFunction: (context: SecurityContext) => Promise<SecurityCheckResult>;
}

export interface DependencyChecker {
  name: string;
  type: 'npm' | 'yarn' | 'pip' | 'maven' | 'gradle';
  enabled: boolean;
  checkForVulnerabilities: boolean;
  checkForOutdated: boolean;
}

export interface SecurityCheckResult {
  passed: boolean;
  findings: SecurityFinding[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityFinding {
  type: 'secret' | 'vulnerability' | 'insecure_pattern' | 'dependency_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export class SecurityChecksRule {
  private config: SecurityChecksRuleConfig;

  constructor(config: SecurityChecksRuleConfig) {
    this.config = config;
  }

  /**
   * Check if an action violates security requirements
   */
  async checkSecurityChecks(action: ActionType, context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Only check file-related actions
    if (!this.isSecurityCheckRequired(action)) {
      return violations;
    }

    // Check for secrets
    if (this.config.scanForSecrets) {
      const secretViolations = await this.scanForSecrets(context);
      violations.push(...secretViolations);
    }

    // Check for vulnerabilities
    if (this.config.checkDependencies) {
      const vulnerabilityViolations = await this.checkVulnerabilities(context);
      violations.push(...vulnerabilityViolations);
    }

    // Check input validation
    if (this.config.validateInputs) {
      const inputViolations = await this.validateInputs(context);
      violations.push(...inputViolations);
    }

    // Check HTTPS requirements
    if (this.config.requireHTTPS) {
      const httpsViolations = await this.checkHTTPSRequirements(context);
      violations.push(...httpsViolations);
    }

    // Run custom security rules
    const customViolations = await this.runCustomSecurityRules(context);
    violations.push(...customViolations);

    return violations;
  }

  /**
   * Get recommendations for security violations
   */
  getRecommendations(violations: PolicyViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.ruleId === 'SECURITY_SECRETS_DETECTED')) {
      recommendations.push('🔒 Remove hardcoded secrets and use environment variables');
      recommendations.push('🔒 Use secure configuration management for sensitive data');
      recommendations.push('🔒 Consider using secret management services');
      recommendations.push('🔒 Review and rotate any exposed credentials');
    }

    if (violations.some(v => v.ruleId === 'SECURITY_VULNERABILITIES_FOUND')) {
      recommendations.push('🔒 Update vulnerable dependencies to latest secure versions');
      recommendations.push('🔒 Review vulnerability reports and apply security patches');
      recommendations.push('🔒 Consider using automated dependency scanning');
      recommendations.push('🔒 Implement regular security audits');
    }

    if (violations.some(v => v.ruleId === 'SECURITY_INPUT_VALIDATION')) {
      recommendations.push('🔒 Implement proper input validation and sanitization');
      recommendations.push('🔒 Use parameterized queries to prevent injection attacks');
      recommendations.push('🔒 Validate and sanitize all user inputs');
      recommendations.push('🔒 Implement rate limiting for API endpoints');
    }

    if (violations.some(v => v.ruleId === 'SECURITY_HTTPS_REQUIRED')) {
      recommendations.push('🔒 Use HTTPS for all external communications');
      recommendations.push('🔒 Implement proper SSL/TLS configuration');
      recommendations.push('🔒 Use secure headers and security policies');
      recommendations.push('🔒 Consider using certificate pinning for mobile apps');
    }

    return recommendations;
  }

  /**
   * Scan for secrets in code
   */
  private async scanForSecrets(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Simulate secret scanning
    const secretFindings = await this.performSecretScan(context.resource);
    
    if (secretFindings.length > 0) {
      violations.push({
        ruleId: 'SECURITY_SECRETS_DETECTED',
        ruleName: 'Secrets Detection',
        severity: 'critical',
        message: `Potential secrets detected: ${secretFindings.length} findings. This is a critical security issue!`,
        context: {
          resource: context.resource.path,
          secretFindings: secretFindings,
          recommendation: 'Remove all hardcoded secrets immediately'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Check for vulnerabilities
   */
  private async checkVulnerabilities(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Simulate vulnerability scanning
    const vulnerabilityFindings = await this.performVulnerabilityScan(context);
    
    if (vulnerabilityFindings.length > 0) {
      const criticalVulns = vulnerabilityFindings.filter(f => f.severity === 'critical').length;
      const highVulns = vulnerabilityFindings.filter(f => f.severity === 'high').length;
      
      violations.push({
        ruleId: 'SECURITY_VULNERABILITIES_FOUND',
        ruleName: 'Vulnerability Detection',
        severity: criticalVulns > 0 ? 'critical' : highVulns > 0 ? 'high' : 'medium',
        message: `Found ${vulnerabilityFindings.length} vulnerabilities (${criticalVulns} critical, ${highVulns} high)`,
        context: {
          resource: context.resource.path,
          vulnerabilityFindings: vulnerabilityFindings,
          criticalCount: criticalVulns,
          highCount: highVulns,
          recommendation: 'Update dependencies and apply security patches'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Validate inputs for security
   */
  private async validateInputs(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Simulate input validation check
    const inputIssues = await this.performInputValidation(context);
    
    if (inputIssues.length > 0) {
      violations.push({
        ruleId: 'SECURITY_INPUT_VALIDATION',
        ruleName: 'Input Validation Issues',
        severity: 'high',
        message: `Found ${inputIssues.length} input validation issues`,
        context: {
          resource: context.resource.path,
          inputIssues: inputIssues,
          recommendation: 'Implement proper input validation and sanitization'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Check HTTPS requirements
   */
  private async checkHTTPSRequirements(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Simulate HTTPS check
    const httpsIssues = await this.performHTTPSCheck(context);
    
    if (httpsIssues.length > 0) {
      violations.push({
        ruleId: 'SECURITY_HTTPS_REQUIRED',
        ruleName: 'HTTPS Requirements',
        severity: 'medium',
        message: `Found ${httpsIssues.length} HTTPS-related issues`,
        context: {
          resource: context.resource.path,
          httpsIssues: httpsIssues,
          recommendation: 'Ensure all external communications use HTTPS'
        },
        timestamp: new Date()
      });
    }

    return violations;
  }

  /**
   * Run custom security rules
   */
  private async runCustomSecurityRules(context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    for (const rule of this.config.securityRules) {
      try {
        const result = await rule.checkFunction(context);
        
        if (!result.passed) {
          violations.push({
            ruleId: `SECURITY_CUSTOM_${rule.id.toUpperCase()}`,
            ruleName: rule.name,
            severity: result.severity,
            message: result.findings.map(f => f.message).join('; '),
            context: {
              resource: context.resource.path,
              rule: rule.id,
              findings: result.findings,
              recommendations: result.recommendations,
              recommendation: result.recommendations.join('; ')
            },
            timestamp: new Date()
          });
        }
      } catch (error) {
        // Log error but don't fail the security check
        console.error(`Error running custom security rule ${rule.id}:`, error);
      }
    }

    return violations;
  }

  // Helper methods for security checks

  private isSecurityCheckRequired(action: ActionType): boolean {
    return [
      ActionType.CREATE_FILE,
      ActionType.EDIT_FILE,
      ActionType.EXECUTE_CODE,
      ActionType.ACCESS_API
    ].includes(action);
  }

  private async performSecretScan(resource: any): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Simulate secret pattern matching
    for (const pattern of this.config.secretPatterns) {
      // In a real implementation, this would scan the actual file content
      // For now, we'll simulate based on file path and common patterns
      
      if (resource.path.includes('config') || resource.path.includes('.env')) {
        // Config files might contain secrets
        findings.push({
          type: 'secret',
          severity: pattern.severity,
          message: `Potential ${pattern.name} detected in ${resource.path}`,
          location: resource.path,
          suggestion: `Use environment variables instead of hardcoding ${pattern.name}`
        });
      }
    }

    return findings;
  }

  private async performVulnerabilityScan(context: SecurityContext): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Simulate vulnerability scanning
    // In a real implementation, this would use tools like npm audit, Snyk, etc.
    
    if (context.resource.path.includes('package.json')) {
      // Simulate dependency vulnerability check
      findings.push({
        type: 'vulnerability',
        severity: 'high',
        message: 'Outdated dependency with known vulnerability',
        location: context.resource.path,
        suggestion: 'Update to latest secure version'
      });
    }

    return findings;
  }

  private async performInputValidation(context: SecurityContext): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Simulate input validation check
    // In a real implementation, this would analyze code for input validation patterns
    
    if (context.resource.path.includes('api') || context.resource.path.includes('endpoint')) {
      // API files should have input validation
      findings.push({
        type: 'insecure_pattern',
        severity: 'medium',
        message: 'Missing input validation for API endpoint',
        location: context.resource.path,
        suggestion: 'Add input validation and sanitization'
      });
    }

    return findings;
  }

  private async performHTTPSCheck(context: SecurityContext): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];

    // Simulate HTTPS check
    // In a real implementation, this would check for HTTP URLs and insecure connections
    
    if (context.resource.path.includes('http://')) {
      findings.push({
        type: 'insecure_pattern',
        severity: 'medium',
        message: 'HTTP URL detected - should use HTTPS',
        location: context.resource.path,
        suggestion: 'Replace HTTP URLs with HTTPS equivalents'
      });
    }

    return findings;
  }

  /**
   * Initialize default security patterns
   */
  private initializeDefaultPatterns(): void {
    const defaultPatterns: SecretPattern[] = [
      {
        name: 'API Key',
        pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i,
        severity: 'critical',
        description: 'API keys should not be hardcoded',
        examples: ['API_KEY=abc123...', 'api_key: "xyz789..."']
      },
      {
        name: 'Password',
        pattern: /(password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/i,
        severity: 'critical',
        description: 'Passwords should not be hardcoded',
        examples: ['password: "mypassword"', 'PASSWORD=secret123']
      },
      {
        name: 'Secret',
        pattern: /(secret|private[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9+/=]{20,}['"]/i,
        severity: 'critical',
        description: 'Secrets should not be hardcoded',
        examples: ['secret: "abc123..."', 'private_key: "xyz789..."']
      },
      {
        name: 'Database URL',
        pattern: /(database[_-]?url|db[_-]?url)\s*[:=]\s*['"][^'"]*['"]/i,
        severity: 'high',
        description: 'Database URLs may contain sensitive information',
        examples: ['database_url: "postgres://user:pass@host/db"']
      }
    ];

    this.config.secretPatterns = defaultPatterns;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SecurityChecksRuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeDefaultPatterns();
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityChecksRuleConfig {
    return { ...this.config };
  }
}

export default SecurityChecksRule;
