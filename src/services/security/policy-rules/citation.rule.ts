/**
 * Citation Rule - Enforces mandatory citations and source attribution
 * 
 * This rule ensures vibe coders properly attribute their sources and maintain
 * good documentation practices, helping them learn and share knowledge effectively.
 */

import type { PolicyViolation, SecurityContext, CitationPolicy } from '../policy-gate.service';
import { ActionType } from '../policy-gate.service';

export interface CitationRuleConfig {
  requireCitations: boolean;
  mandatorySources: string[];
  citationFormat: 'markdown' | 'html' | 'plain';
  autoGenerateCitations: boolean;
  validateCitations: boolean;
  citationTemplates: CitationTemplate[];
}

export interface CitationTemplate {
  type: 'code_snippet' | 'documentation' | 'tutorial' | 'stack_overflow' | 'github' | 'blog';
  format: string;
  required: boolean;
}

export class CitationRule {
  private config: CitationRuleConfig;

  constructor(config: CitationRuleConfig) {
    this.config = config;
  }

  /**
   * Check if an action violates citation requirements
   */
  async checkCitations(action: ActionType, context: SecurityContext): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Only check file creation and editing actions
    if (!this.requiresCitations(action)) {
      return violations;
    }

    // Check if citations are required
    if (this.config.requireCitations) {
      const hasCitations = await this.analyzeFileForCitations(context.resource);
      
      if (!hasCitations.hasValidCitations) {
        violations.push({
          ruleId: 'CITATION_REQUIRED',
          ruleName: 'Mandatory Citations',
          severity: this.config.mandatorySources.length > 0 ? 'high' : 'medium',
          message: 'Citations are required for this action. Help others learn from your sources!',
          context: {
            resource: context.resource.path,
            citationFormat: this.config.citationFormat,
            hasCitations: hasCitations.hasValidCitations,
            detectedSources: hasCitations.detectedSources,
            recommendation: 'Add proper citations to help others learn from your sources'
          },
          timestamp: new Date()
        });
      }

      // Check mandatory sources
      if (this.config.mandatorySources.length > 0) {
        const missingSources = await this.checkMandatorySources(context.resource, hasCitations.detectedSources);
        if (missingSources.length > 0) {
          violations.push({
            ruleId: 'CITATION_MANDATORY_SOURCES',
            ruleName: 'Mandatory Source Citations',
            severity: 'high',
            message: `Missing mandatory sources: ${missingSources.join(', ')}. These sources are required for this project.`,
            context: {
              missingSources,
              requiredSources: this.config.mandatorySources,
              detectedSources: hasCitations.detectedSources,
              recommendation: 'Add citations for all required sources'
            },
            timestamp: new Date()
          });
        }
      }

      // Validate citation format
      if (this.config.validateCitations && hasCitations.hasValidCitations) {
        const formatViolations = await this.validateCitationFormat(context.resource, hasCitations.citations);
        violations.push(...formatViolations);
      }
    }

    return violations;
  }

  /**
   * Auto-generate citations for detected sources
   */
  async generateCitations(resource: any, detectedSources: DetectedSource[]): Promise<GeneratedCitation[]> {
    const citations: GeneratedCitation[] = [];

    for (const source of detectedSources) {
      const template = this.getCitationTemplate(source.type);
      if (template) {
        const citation = this.formatCitation(source, template);
        citations.push({
          source,
          formattedCitation: citation,
          template: template,
          generatedAt: new Date()
        });
      }
    }

    return citations;
  }

  /**
   * Get recommendations for citation violations
   */
  getRecommendations(violations: PolicyViolation[]): string[] {
    const recommendations: string[] = [];

    if (violations.some(v => v.ruleId === 'CITATION_REQUIRED')) {
      recommendations.push('📚 Add citations to help others learn from your sources');
      recommendations.push('📚 Include links to documentation, tutorials, or examples you referenced');
      recommendations.push('📚 Use the configured citation format for consistency');
      recommendations.push('📚 Consider adding a "Sources" or "References" section to your files');
    }

    if (violations.some(v => v.ruleId === 'CITATION_MANDATORY_SOURCES')) {
      recommendations.push('📚 Add citations for all required sources listed in project policy');
      recommendations.push('📚 Check project documentation for required citation sources');
      recommendations.push('📚 Contact project maintainer if you need clarification on required sources');
    }

    if (violations.some(v => v.ruleId === 'CITATION_FORMAT_INVALID')) {
      recommendations.push('📚 Use the correct citation format as specified in project policy');
      recommendations.push('📚 Check existing citations in the project for format examples');
      recommendations.push('📚 Use citation templates provided by the system');
    }

    return recommendations;
  }

  /**
   * Analyze file content for citations
   */
  private async analyzeFileForCitations(resource: any): Promise<CitationAnalysis> {
    // In a real implementation, this would analyze the actual file content
    // For now, we'll simulate the analysis
    
    const detectedSources: DetectedSource[] = [];
    const citations: string[] = [];
    
    // Simulate detection based on file path and metadata
    if (resource.path.includes('test') || resource.path.includes('spec')) {
      // Test files might reference testing frameworks
      detectedSources.push({
        type: 'documentation',
        url: 'https://example.com/testing-guide',
        title: 'Testing Best Practices',
        confidence: 0.8
      });
    }

    if (resource.path.includes('component') || resource.path.includes('ui')) {
      // UI components might reference design systems
      detectedSources.push({
        type: 'github',
        url: 'https://github.com/example/design-system',
        title: 'Design System Components',
        confidence: 0.7
      });
    }

    // Simulate citation detection
    const hasValidCitations = citations.length > 0 || detectedSources.length > 0;

    return {
      hasValidCitations,
      detectedSources,
      citations,
      analysisConfidence: 0.8
    };
  }

  /**
   * Check for mandatory sources
   */
  private async checkMandatorySources(
    resource: any, 
    detectedSources: DetectedSource[]
  ): Promise<string[]> {
    const detectedUrls = detectedSources.map(s => s.url);
    return this.config.mandatorySources.filter(required => 
      !detectedUrls.some(url => url.includes(required) || required.includes(url))
    );
  }

  /**
   * Validate citation format
   */
  private async validateCitationFormat(
    resource: any, 
    citations: string[]
  ): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    // Simplified format validation
    for (const citation of citations) {
      const isValid = this.isValidCitationFormat(citation);
      if (!isValid) {
        violations.push({
          ruleId: 'CITATION_FORMAT_INVALID',
          ruleName: 'Invalid Citation Format',
          severity: 'low',
          message: `Citation format is invalid: ${citation.substring(0, 50)}...`,
          context: {
            citation,
            expectedFormat: this.config.citationFormat,
            recommendation: 'Use the correct citation format'
          },
          timestamp: new Date()
        });
      }
    }

    return violations;
  }

  /**
   * Check if action requires citations
   */
  private requiresCitations(action: ActionType): boolean {
    return [
      ActionType.CREATE_FILE,
      ActionType.EDIT_FILE
    ].includes(action);
  }

  /**
   * Get citation template for source type
   */
  private getCitationTemplate(sourceType: string): CitationTemplate | null {
    return this.config.citationTemplates.find(t => t.type === sourceType) || null;
  }

  /**
   * Format citation according to template
   */
  private formatCitation(source: DetectedSource, template: CitationTemplate): string {
    let formatted = template.format;
    
    // Replace placeholders
    formatted = formatted.replace('{title}', source.title);
    formatted = formatted.replace('{url}', source.url);
    formatted = formatted.replace('{type}', source.type);
    
    return formatted;
  }

  /**
   * Validate citation format
   */
  private isValidCitationFormat(citation: string): boolean {
    // Simplified validation - in production, this would be more sophisticated
    switch (this.config.citationFormat) {
      case 'markdown':
        return citation.includes('[') && citation.includes('](') && citation.includes(')');
      case 'html':
        return citation.includes('<a href=') && citation.includes('</a>');
      case 'plain':
        return citation.includes('http') || citation.includes('www.');
      default:
        return true;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CitationRuleConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CitationRuleConfig {
    return { ...this.config };
  }
}

export interface CitationAnalysis {
  hasValidCitations: boolean;
  detectedSources: DetectedSource[];
  citations: string[];
  analysisConfidence: number;
}

export interface DetectedSource {
  type: string;
  url: string;
  title: string;
  confidence: number;
}

export interface GeneratedCitation {
  source: DetectedSource;
  formattedCitation: string;
  template: CitationTemplate;
  generatedAt: Date;
}

export default CitationRule;
