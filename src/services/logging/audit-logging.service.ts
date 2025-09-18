/**
 * Audit Logging Service - Advanced audit logs for compliance and security
 * 
 * This service provides comprehensive audit logging capabilities for compliance
 * requirements, security monitoring, and regulatory adherence.
 * 
 * Benefits for vibe coders:
 * - Comprehensive audit trails for compliance requirements (SOX, GDPR, HIPAA, etc.)
 * - Security monitoring and threat detection
 * - Data access tracking and user activity monitoring
 * - Regulatory compliance reporting and evidence collection
 * - Integration with structured logging for comprehensive audit trails
 */

import { EventEmitter } from 'events';
import { StructuredLoggingService } from './structured-logging.service';
import * as crypto from 'crypto';

// Audit event types
export type AuditEventType = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'configuration_change'
  | 'security_event'
  | 'user_management'
  | 'system_access'
  | 'api_access'
  | 'file_access'
  | 'database_access'
  | 'network_access'
  | 'administrative_action'
  | 'compliance_event'
  | 'privacy_event';

// Audit event severity
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical' | 'security';

// Compliance frameworks
export type ComplianceFramework = 
  | 'SOX'      // Sarbanes-Oxley Act
  | 'GDPR'     // General Data Protection Regulation
  | 'HIPAA'    // Health Insurance Portability and Accountability Act
  | 'PCI-DSS'  // Payment Card Industry Data Security Standard
  | 'SOC2'     // Service Organization Control 2
  | 'ISO27001' // ISO/IEC 27001
  | 'FISMA'    // Federal Information Security Management Act
  | 'CUSTOM';

// Audit event
export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: AuditSeverity;
  subject: {
    userId?: string;
    username?: string;
    email?: string;
    roles: string[];
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    deviceId?: string;
  };
  action: {
    name: string;
    description: string;
    category: string;
    subcategory?: string;
    parameters: Record<string, any>;
  };
  resource: {
    type: string;
    id?: string;
    name?: string;
    path?: string;
    metadata: Record<string, any>;
  };
  result: {
    success: boolean;
    statusCode?: number;
    errorMessage?: string;
    responseTime?: number;
  };
  context: {
    correlationId?: string;
    requestId?: string;
    service: string;
    operation: string;
    environment: string;
    version: string;
    additionalContext?: Record<string, any>;
  };
  compliance: {
    frameworks: ComplianceFramework[];
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionPeriod: number; // days
    legalHold: boolean;
    encryptionRequired: boolean;
    piiInvolved: boolean;
    sensitiveDataInvolved: boolean;
  };
  security: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    securityControls: string[];
    vulnerabilities?: string[];
    anomalies?: string[];
  };
  metadata: {
    tags: string[];
    categories: string[];
    customFields: Record<string, any>;
    evidence: AuditEvidence[];
  };
}

// Audit evidence
export interface AuditEvidence {
  type: 'log' | 'screenshot' | 'file' | 'database_record' | 'network_capture' | 'metadata';
  content: string;
  hash: string;
  timestamp: Date;
  source: string;
  integrity: boolean;
  encryption?: {
    algorithm: string;
    keyId: string;
    encrypted: boolean;
  };
}

// Audit query filters
export interface AuditQueryFilters {
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  userIds?: string[];
  resourceTypes?: string[];
  resourceIds?: string[];
  actions?: string[];
  frameworks?: ComplianceFramework[];
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  riskLevels?: string[];
  threatLevels?: string[];
  tags?: string[];
  categories?: string[];
  limit?: number;
  offset?: number;
}

// Audit analytics
export interface AuditAnalytics {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByUser: Record<string, number>;
  eventsByResource: Record<string, number>;
  eventsByFramework: Record<ComplianceFramework, number>;
  securityEvents: {
    highRisk: number;
    criticalThreats: number;
    anomalies: number;
    failedAuthentications: number;
    unauthorizedAccess: number;
  };
  complianceMetrics: {
    dataAccessEvents: number;
    dataModificationEvents: number;
    piiAccessEvents: number;
    sensitiveDataEvents: number;
    retentionCompliance: number; // percentage
  };
  trends: Array<{
    date: Date;
    eventCount: number;
    securityEvents: number;
    complianceEvents: number;
  }>;
  topUsers: Array<{
    userId: string;
    eventCount: number;
    riskScore: number;
  }>;
  topResources: Array<{
    resourceId: string;
    accessCount: number;
    riskScore: number;
  }>;
}

// Audit logging configuration
export interface AuditLoggingConfig {
  enableAuditLogging: boolean;
  enableComplianceTracking: boolean;
  enableSecurityMonitoring: boolean;
  enableDataClassification: boolean;
  enableEncryption: boolean;
  enableIntegrityChecking: boolean;
  enableRetentionManagement: boolean;
  retentionPeriod: number; // days
  maxAuditEvents: number;
  encryptionKey?: string;
  complianceFrameworks: ComplianceFramework[];
  dataClassificationRules: Record<string, 'public' | 'internal' | 'confidential' | 'restricted'>;
  securityThresholds: {
    riskLevel: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    threatLevel: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  alertChannels: string[];
}

// Audit Logging Service Implementation
export class AuditLoggingService extends EventEmitter {
  private config: AuditLoggingConfig;
  private logger: StructuredLoggingService;
  private auditEvents: Map<string, AuditEvent> = new Map();
  private auditIndex: Map<string, string[]> = new Map(); // Index for fast queries
  private encryptionKey?: Buffer;

  constructor(
    logger: StructuredLoggingService,
    config?: Partial<AuditLoggingConfig>
  ) {
    super();
    
    this.logger = logger;
    this.config = {
      enableAuditLogging: true,
      enableComplianceTracking: true,
      enableSecurityMonitoring: true,
      enableDataClassification: true,
      enableEncryption: false,
      enableIntegrityChecking: true,
      enableRetentionManagement: true,
      retentionPeriod: 2555, // 7 years for compliance
      maxAuditEvents: 100000,
      complianceFrameworks: ['SOX', 'GDPR'],
      dataClassificationRules: {},
      securityThresholds: {
        riskLevel: { low: 1, medium: 3, high: 5, critical: 8 },
        threatLevel: { low: 1, medium: 3, high: 5, critical: 8 }
      },
      alertChannels: ['console', 'log'],
      ...config
    };

    // Initialize encryption if enabled
    if (this.config.enableEncryption && this.config.encryptionKey) {
      this.encryptionKey = Buffer.from(this.config.encryptionKey, 'hex');
    }

    this.initializeService();
  }

  /**
   * Log an audit event
   */
  logAuditEvent(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource'],
    subject: AuditEvent['subject'],
    result: AuditEvent['result'],
    context: Partial<AuditEvent['context']> = {},
    metadata: Partial<AuditEvent['metadata']> = {}
  ): string {
    const eventId = crypto.randomUUID();
    const timestamp = new Date();
    
    // Determine severity based on event type and result
    const severity = this.determineEventSeverity(eventType, result, resource);
    
    // Classify data based on resource and context
    const dataClassification = this.classifyData(resource, context);
    
    // Assess security risk and threat levels
    const securityAssessment = this.assessSecurityRisk(eventType, action, resource, result, subject);
    
    // Generate compliance information
    const complianceInfo = this.generateComplianceInfo(eventType, resource, dataClassification);
    
    // Create audit evidence
    const evidence = this.generateAuditEvidence(eventType, action, resource, result);
    
    // Create audit event
    const auditEvent: AuditEvent = {
      id: eventId,
      timestamp,
      eventType,
      severity,
      subject,
      action,
      resource,
      result,
      context: {
        service: 'localmcp',
        operation: action.name,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        ...context
      },
      compliance: complianceInfo,
      security: securityAssessment,
      metadata: {
        tags: this.generateEventTags(eventType, action, resource, severity),
        categories: this.generateEventCategories(eventType, action, resource),
        customFields: metadata.customFields || {},
        evidence
      }
    };

    // Store audit event
    this.storeAuditEvent(auditEvent);
    
    // Index for fast queries
    this.indexAuditEvent(auditEvent);
    
    // Log to structured logging service
    this.logger.audit(
      action.name,
      `${resource.type}:${resource.id || resource.name}`,
      result.success ? 'success' : 'failure',
      this.mapSeverityToRiskLevel(severity),
      {
        auditEventId: eventId,
        eventType,
        severity,
        subject: subject.userId,
        resource: resource.type,
        compliance: complianceInfo.frameworks,
        security: securityAssessment.riskLevel,
        ...metadata
      },
      context.correlationId
    );

    // Emit events for listeners
    this.emit('auditEventLogged', { auditEvent });
    
    // Check for security alerts
    if (this.config.enableSecurityMonitoring) {
      this.checkSecurityAlerts(auditEvent);
    }

    // Cleanup old events
    this.cleanupOldEvents();

    return eventId;
  }

  /**
   * Log authentication event
   */
  logAuthentication(
    userId: string,
    username: string,
    success: boolean,
    method: string,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): string {
    return this.logAuditEvent(
      'authentication',
      {
        name: 'user_authentication',
        description: `User authentication attempt via ${method}`,
        category: 'authentication',
        subcategory: method,
        parameters: { method, timestamp: new Date().toISOString() }
      },
      {
        type: 'user_account',
        id: userId,
        name: username,
        metadata: { authenticationMethod: method }
      },
      {
        userId,
        username,
        roles: [],
        ipAddress,
        userAgent
      },
      {
        success,
        errorMessage,
        responseTime: 0
      },
      {
        service: 'authentication'
      }
    );
  }

  /**
   * Log data access event
   */
  logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    operation: string,
    success: boolean,
    ipAddress?: string,
    sessionId?: string
  ): string {
    return this.logAuditEvent(
      'data_access',
      {
        name: 'data_access',
        description: `Data access: ${operation} on ${resourceType}`,
        category: 'data_access',
        subcategory: operation,
        parameters: { operation, resourceType, resourceId }
      },
      {
        type: resourceType,
        id: resourceId,
        metadata: { accessOperation: operation }
      },
      {
        userId,
        roles: [],
        ipAddress,
        sessionId
      },
      {
        success,
        responseTime: 0
      },
      {
        service: 'data_access'
      }
    );
  }

  /**
   * Log data modification event
   */
  logDataModification(
    userId: string,
    resourceType: string,
    resourceId: string,
    operation: 'create' | 'update' | 'delete',
    changes?: Record<string, any>,
    ipAddress?: string,
    sessionId?: string
  ): string {
    return this.logAuditEvent(
      'data_modification',
      {
        name: 'data_modification',
        description: `Data modification: ${operation} on ${resourceType}`,
        category: 'data_modification',
        subcategory: operation,
        parameters: { operation, resourceType, resourceId, changes }
      },
      {
        type: resourceType,
        id: resourceId,
        metadata: { modificationOperation: operation, changes }
      },
      {
        userId,
        roles: [],
        ipAddress,
        sessionId
      },
      {
        success: true,
        responseTime: 0
      },
      {
        service: 'data_modification'
      }
    );
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    eventType: 'suspicious_activity' | 'failed_access' | 'privilege_escalation' | 'data_breach' | 'malware_detected',
    severity: AuditSeverity,
    description: string,
    userId?: string,
    resourceType?: string,
    resourceId?: string,
    threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    return this.logAuditEvent(
      'security_event',
      {
        name: eventType,
        description,
        category: 'security',
        subcategory: eventType,
        parameters: { threatLevel, timestamp: new Date().toISOString() }
      },
      {
        type: resourceType || 'security_event',
        id: resourceId,
        metadata: { securityEventType: eventType, threatLevel }
      },
      {
        userId,
        roles: []
      },
      {
        success: false, // Security events are typically failures
        errorMessage: description
      },
      {
        service: 'security_monitoring'
      }
    );
  }

  /**
   * Query audit events
   */
  queryAuditEvents(filters: AuditQueryFilters): AuditEvent[] {
    let events = Array.from(this.auditEvents.values());

    // Apply filters
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      events = events.filter(event => filters.eventTypes!.includes(event.eventType));
    }

    if (filters.severities && filters.severities.length > 0) {
      events = events.filter(event => filters.severities!.includes(event.severity));
    }

    if (filters.userIds && filters.userIds.length > 0) {
      events = events.filter(event => 
        event.subject.userId && filters.userIds!.includes(event.subject.userId)
      );
    }

    if (filters.resourceTypes && filters.resourceTypes.length > 0) {
      events = events.filter(event => filters.resourceTypes!.includes(event.resource.type));
    }

    if (filters.resourceIds && filters.resourceIds.length > 0) {
      events = events.filter(event => 
        event.resource.id && filters.resourceIds!.includes(event.resource.id)
      );
    }

    if (filters.startDate) {
      events = events.filter(event => event.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      events = events.filter(event => event.timestamp <= filters.endDate!);
    }

    if (filters.success !== undefined) {
      events = events.filter(event => event.result.success === filters.success);
    }

    if (filters.riskLevels && filters.riskLevels.length > 0) {
      events = events.filter(event => filters.riskLevels!.includes(event.security.riskLevel));
    }

    if (filters.threatLevels && filters.threatLevels.length > 0) {
      events = events.filter(event => filters.threatLevels!.includes(event.security.threatLevel));
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    
    return events.slice(offset, offset + limit);
  }

  /**
   * Get audit analytics
   */
  getAuditAnalytics(filters?: AuditQueryFilters): AuditAnalytics {
    const events = filters ? this.queryAuditEvents(filters) : Array.from(this.auditEvents.values());
    
    const analytics: AuditAnalytics = {
      totalEvents: events.length,
      eventsByType: {} as Record<AuditEventType, number>,
      eventsBySeverity: {} as Record<AuditSeverity, number>,
      eventsByUser: {},
      eventsByResource: {},
      eventsByFramework: {} as Record<ComplianceFramework, number>,
      securityEvents: {
        highRisk: 0,
        criticalThreats: 0,
        anomalies: 0,
        failedAuthentications: 0,
        unauthorizedAccess: 0
      },
      complianceMetrics: {
        dataAccessEvents: 0,
        dataModificationEvents: 0,
        piiAccessEvents: 0,
        sensitiveDataEvents: 0,
        retentionCompliance: 100 // Default to 100% compliance
      },
      trends: [],
      topUsers: [],
      topResources: []
    };

    // Calculate metrics
    for (const event of events) {
      // Count by type
      analytics.eventsByType[event.eventType] = (analytics.eventsByType[event.eventType] || 0) + 1;
      
      // Count by severity
      analytics.eventsBySeverity[event.severity] = (analytics.eventsBySeverity[event.severity] || 0) + 1;
      
      // Count by user
      if (event.subject.userId) {
        analytics.eventsByUser[event.subject.userId] = (analytics.eventsByUser[event.subject.userId] || 0) + 1;
      }
      
      // Count by resource
      const resourceKey = `${event.resource.type}:${event.resource.id || event.resource.name}`;
      analytics.eventsByResource[resourceKey] = (analytics.eventsByResource[resourceKey] || 0) + 1;
      
      // Count by compliance framework
      for (const framework of event.compliance.frameworks) {
        analytics.eventsByFramework[framework] = (analytics.eventsByFramework[framework] || 0) + 1;
      }
      
      // Security events
      if (event.security.riskLevel === 'high' || event.security.riskLevel === 'critical') {
        analytics.securityEvents.highRisk++;
      }
      
      if (event.security.threatLevel === 'critical') {
        analytics.securityEvents.criticalThreats++;
      }
      
      if (event.eventType === 'authentication' && !event.result.success) {
        analytics.securityEvents.failedAuthentications++;
      }
      
      // Compliance metrics
      if (event.eventType === 'data_access') {
        analytics.complianceMetrics.dataAccessEvents++;
      }
      
      if (event.eventType === 'data_modification') {
        analytics.complianceMetrics.dataModificationEvents++;
      }
      
      if (event.compliance.piiInvolved) {
        analytics.complianceMetrics.piiAccessEvents++;
      }
      
      if (event.compliance.sensitiveDataInvolved) {
        analytics.complianceMetrics.sensitiveDataEvents++;
      }
    }

    // Calculate top users and resources
    analytics.topUsers = Object.entries(analytics.eventsByUser)
      .map(([userId, eventCount]) => ({
        userId,
        eventCount,
        riskScore: this.calculateUserRiskScore(userId, events)
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    analytics.topResources = Object.entries(analytics.eventsByResource)
      .map(([resourceKey, accessCount]) => ({
        resourceId: resourceKey,
        accessCount,
        riskScore: this.calculateResourceRiskScore(resourceKey, events)
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return analytics;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(
    framework: ComplianceFramework,
    startDate: Date,
    endDate: Date
  ): any {
    const events = this.queryAuditEvents({
      frameworks: [framework],
      startDate,
      endDate
    });

    return {
      framework,
      period: { startDate, endDate },
      totalEvents: events.length,
      complianceScore: this.calculateComplianceScore(events, framework),
      violations: this.identifyComplianceViolations(events, framework),
      recommendations: this.generateComplianceRecommendations(events, framework),
      evidence: events.map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        type: event.eventType,
        description: event.action.description,
        compliance: event.compliance
      }))
    };
  }

  /**
   * Update audit logging configuration
   */
  updateConfig(newConfig: Partial<AuditLoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update encryption key if provided
    if (newConfig.encryptionKey) {
      this.encryptionKey = Buffer.from(newConfig.encryptionKey, 'hex');
    }
    
    this.emit('configUpdated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): AuditLoggingConfig {
    return { ...this.config };
  }

  // Private helper methods

  private initializeService(): void {
    this.emit('serviceInitialized', { config: this.config });
  }

  private determineEventSeverity(
    eventType: AuditEventType,
    result: AuditEvent['result'],
    resource: AuditEvent['resource']
  ): AuditSeverity {
    // Security events are always at least warning level
    if (eventType === 'security_event') return 'security';
    
    // Failed operations are error level
    if (!result.success) return 'error';
    
    // Data modification events are warning level
    if (eventType === 'data_modification' || eventType === 'data_deletion') return 'warning';
    
    // Administrative actions are warning level
    if (eventType === 'administrative_action') return 'warning';
    
    // Default to info level
    return 'info';
  }

  private classifyData(
    resource: AuditEvent['resource'],
    context: Partial<AuditEvent['context']>
  ): 'public' | 'internal' | 'confidential' | 'restricted' {
    // Check data classification rules
    const resourceType = resource.type;
    if (this.config.dataClassificationRules[resourceType]) {
      return this.config.dataClassificationRules[resourceType];
    }
    
    // Default classification based on resource type
    if (resourceType.includes('user') || resourceType.includes('personal')) {
      return 'confidential';
    }
    
    if (resourceType.includes('config') || resourceType.includes('secret')) {
      return 'restricted';
    }
    
    if (resourceType.includes('public') || resourceType.includes('readonly')) {
      return 'public';
    }
    
    return 'internal';
  }

  private assessSecurityRisk(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource'],
    result: AuditEvent['result'],
    subject: AuditEvent['subject']
  ): AuditEvent['security'] {
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
    
    // High risk events
    if (eventType === 'security_event') {
      riskLevel = 'critical';
      threatLevel = 'critical';
    }
    
    if (!result.success && eventType === 'authentication') {
      riskLevel = 'high';
      threatLevel = 'medium';
    }
    
    if (eventType === 'data_deletion') {
      riskLevel = 'high';
      threatLevel = 'low';
    }
    
    // Medium risk events
    if (eventType === 'data_modification' || eventType === 'configuration_change') {
      riskLevel = 'medium';
      threatLevel = 'low';
    }
    
    return {
      riskLevel,
      threatLevel,
      securityControls: this.identifySecurityControls(eventType, action, resource),
      vulnerabilities: this.identifyVulnerabilities(eventType, action, resource, result),
      anomalies: this.identifyAnomalies(eventType, action, resource, subject)
    };
  }

  private generateComplianceInfo(
    eventType: AuditEventType,
    resource: AuditEvent['resource'],
    dataClassification: string
  ): AuditEvent['compliance'] {
    const frameworks: ComplianceFramework[] = [];
    
    // Determine applicable frameworks based on event type and data
    if (dataClassification === 'confidential' || dataClassification === 'restricted') {
      frameworks.push('GDPR');
    }
    
    if (eventType === 'data_access' || eventType === 'data_modification') {
      frameworks.push('SOX');
    }
    
    if (eventType === 'authentication' || eventType === 'authorization') {
      frameworks.push('SOC2');
    }
    
    // Add configured frameworks
    frameworks.push(...this.config.complianceFrameworks);
    
    return {
      frameworks: Array.from(new Set(frameworks)), // Remove duplicates
      dataClassification: dataClassification as any,
      retentionPeriod: this.config.retentionPeriod,
      legalHold: false,
      encryptionRequired: dataClassification === 'restricted',
      piiInvolved: dataClassification === 'confidential',
      sensitiveDataInvolved: dataClassification === 'restricted'
    };
  }

  private generateAuditEvidence(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource'],
    result: AuditEvent['result']
  ): AuditEvidence[] {
    const evidence: AuditEvidence[] = [];
    
    // Generate log evidence
    const logContent = JSON.stringify({
      eventType,
      action: action.name,
      resource: resource.type,
      result: result.success,
      timestamp: new Date().toISOString()
    });
    
    evidence.push({
      type: 'log',
      content: logContent,
      hash: crypto.createHash('sha256').update(logContent).digest('hex'),
      timestamp: new Date(),
      source: 'audit_logging_service',
      integrity: true
    });
    
    return evidence;
  }

  private generateEventTags(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource'],
    severity: AuditSeverity
  ): string[] {
    const tags = [eventType, action.category, resource.type, severity];
    
    if (action.subcategory) {
      tags.push(action.subcategory);
    }
    
    return tags;
  }

  private generateEventCategories(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource']
  ): string[] {
    return [eventType, action.category, resource.type];
  }

  private storeAuditEvent(auditEvent: AuditEvent): void {
    this.auditEvents.set(auditEvent.id, auditEvent);
    
    // Maintain event limit
    if (this.auditEvents.size > this.config.maxAuditEvents) {
      const oldestEvent = Array.from(this.auditEvents.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      
      if (oldestEvent) {
        this.auditEvents.delete(oldestEvent[0]);
      }
    }
  }

  private indexAuditEvent(auditEvent: AuditEvent): void {
    // Index by event type
    const eventTypeKey = `eventType:${auditEvent.eventType}`;
    if (!this.auditIndex.has(eventTypeKey)) {
      this.auditIndex.set(eventTypeKey, []);
    }
    this.auditIndex.get(eventTypeKey)!.push(auditEvent.id);
    
    // Index by user
    if (auditEvent.subject.userId) {
      const userKey = `user:${auditEvent.subject.userId}`;
      if (!this.auditIndex.has(userKey)) {
        this.auditIndex.set(userKey, []);
      }
      this.auditIndex.get(userKey)!.push(auditEvent.id);
    }
    
    // Index by resource
    const resourceKey = `resource:${auditEvent.resource.type}:${auditEvent.resource.id || auditEvent.resource.name}`;
    if (!this.auditIndex.has(resourceKey)) {
      this.auditIndex.set(resourceKey, []);
    }
    this.auditIndex.get(resourceKey)!.push(auditEvent.id);
  }

  private checkSecurityAlerts(auditEvent: AuditEvent): void {
    // Check for security alerts based on risk and threat levels
    if (auditEvent.security.riskLevel === 'critical' || auditEvent.security.threatLevel === 'critical') {
      this.emit('securityAlert', {
        auditEvent,
        severity: 'critical',
        message: `Critical security event detected: ${auditEvent.action.description}`,
        timestamp: new Date()
      });
    }
  }

  private cleanupOldEvents(): void {
    if (!this.config.enableRetentionManagement) return;
    
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    
    for (const [eventId, auditEvent] of Array.from(this.auditEvents.entries())) {
      if (auditEvent.timestamp < cutoffDate && !auditEvent.compliance.legalHold) {
        this.auditEvents.delete(eventId);
        
        // Clean up indexes
        for (const [key, eventIds] of Array.from(this.auditIndex.entries())) {
          const index = eventIds.indexOf(eventId);
          if (index > -1) {
            eventIds.splice(index, 1);
          }
        }
      }
    }
  }

  private mapSeverityToRiskLevel(severity: AuditSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'security': return 'critical';
      case 'critical': return 'critical';
      case 'error': return 'high';
      case 'warning': return 'medium';
      case 'info': return 'low';
      default: return 'low';
    }
  }

  private identifySecurityControls(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource']
  ): string[] {
    const controls: string[] = [];
    
    // Add relevant security controls based on event type
    if (eventType === 'authentication') {
      controls.push('authentication_control');
    }
    
    if (eventType === 'authorization') {
      controls.push('authorization_control');
    }
    
    if (eventType === 'data_access') {
      controls.push('access_control');
    }
    
    return controls;
  }

  private identifyVulnerabilities(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource'],
    result: AuditEvent['result']
  ): string[] {
    const vulnerabilities: string[] = [];
    
    if (!result.success && eventType === 'authentication') {
      vulnerabilities.push('authentication_failure');
    }
    
    return vulnerabilities;
  }

  private identifyAnomalies(
    eventType: AuditEventType,
    action: AuditEvent['action'],
    resource: AuditEvent['resource'],
    subject: AuditEvent['subject']
  ): string[] {
    const anomalies: string[] = [];
    
    // Simple anomaly detection - in a real implementation, this would be more sophisticated
    return anomalies;
  }

  private calculateUserRiskScore(userId: string, events: AuditEvent[]): number {
    const userEvents = events.filter(event => event.subject.userId === userId);
    let riskScore = 0;
    
    for (const event of userEvents) {
      if (event.security.riskLevel === 'critical') riskScore += 10;
      else if (event.security.riskLevel === 'high') riskScore += 5;
      else if (event.security.riskLevel === 'medium') riskScore += 2;
      else riskScore += 1;
    }
    
    return riskScore;
  }

  private calculateResourceRiskScore(resourceKey: string, events: AuditEvent[]): number {
    const resourceEvents = events.filter(event => 
      `${event.resource.type}:${event.resource.id || event.resource.name}` === resourceKey
    );
    
    let riskScore = 0;
    
    for (const event of resourceEvents) {
      if (event.compliance.dataClassification === 'restricted') riskScore += 10;
      else if (event.compliance.dataClassification === 'confidential') riskScore += 5;
      else if (event.compliance.dataClassification === 'internal') riskScore += 2;
      else riskScore += 1;
    }
    
    return riskScore;
  }

  private calculateComplianceScore(events: AuditEvent[], framework: ComplianceFramework): number {
    // Simple compliance score calculation
    const totalEvents = events.length;
    const violationEvents = events.filter(event => !event.result.success).length;
    
    return totalEvents > 0 ? ((totalEvents - violationEvents) / totalEvents) * 100 : 100;
  }

  private identifyComplianceViolations(events: AuditEvent[], framework: ComplianceFramework): any[] {
    return events
      .filter(event => !event.result.success)
      .map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        type: event.eventType,
        description: event.action.description,
        severity: event.severity
      }));
  }

  private generateComplianceRecommendations(events: AuditEvent[], framework: ComplianceFramework): string[] {
    const recommendations: string[] = [];
    
    // Generate recommendations based on event patterns
    const failedAuthEvents = events.filter(event => 
      event.eventType === 'authentication' && !event.result.success
    );
    
    if (failedAuthEvents.length > 0) {
      recommendations.push('Implement stronger authentication controls');
    }
    
    return recommendations;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.auditEvents.clear();
    this.auditIndex.clear();
    this.encryptionKey = undefined;
    this.emit('serviceDestroyed');
  }
}

export default AuditLoggingService;
