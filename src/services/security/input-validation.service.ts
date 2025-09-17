/**
 * Simple Input Validation Service - Essential input validation and sanitization
 * 
 * This service provides basic but effective input validation and sanitization
 * to protect LocalMCP from common injection attacks and XSS vulnerabilities.
 * 
 * Benefits for vibe coders:
 * - Lightweight protection against malicious inputs
 * - Fast validation with minimal overhead
 * - Simple, focused security without complexity
 * - Easy to understand and maintain
 */

// Simple validation result
export interface ValidationResult {
  valid: boolean;
  sanitized?: any;
  error?: string;
}

// Basic security scan result
export interface SecurityIssue {
  type: 'xss' | 'injection' | 'path_traversal';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

// Simple Input Validation Service Implementation
export class InputValidationService {
  private maxStringLength = 50000;
  private maxPathLength = 1000;

  constructor() {
    // Simple constructor - no complex configuration needed
  }

  /**
   * Validate tool request - basic validation for LocalMCP tools
   */
  validateToolRequest(request: any): ValidationResult {
    try {
      // Basic structure validation
      if (!request || typeof request !== 'object') {
        return { valid: false, error: 'Request must be an object' };
      }

      // Validate tool name
      if (!request.toolName || typeof request.toolName !== 'string') {
        return { valid: false, error: 'Tool name is required' };
      }

      if (!/^localmcp\.(analyze|create|fix|learn)$/.test(request.toolName)) {
        return { valid: false, error: 'Invalid tool name' };
      }

      // Sanitize the request
      const sanitized = this.sanitizeObject(request);

      return { valid: true, sanitized };
    } catch (error) {
      return { 
        valid: false, 
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validate file path - prevent path traversal attacks
   */
  validateFilePath(path: string): ValidationResult {
    try {
      if (!path || typeof path !== 'string') {
        return { valid: false, error: 'Path must be a string' };
      }

      // Check length
      if (path.length > this.maxPathLength) {
        return { valid: false, error: 'Path too long' };
      }

      // Check for path traversal
      if (path.includes('../') || path.includes('..\\') || path.includes('..%2f') || path.includes('..%5c')) {
        return { valid: false, error: 'Path traversal detected' };
      }

      // Check for null bytes
      if (path.includes('\x00')) {
        return { valid: false, error: 'Null bytes detected in path' };
      }

      // Sanitize path
      const sanitized = this.sanitizeString(path);

      return { valid: true, sanitized };
    } catch (error) {
      return { 
        valid: false, 
        error: `Path validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validate code input - basic security checks for code
   */
  validateCodeInput(code: string): ValidationResult {
    try {
      if (!code || typeof code !== 'string') {
        return { valid: false, error: 'Code must be a string' };
      }

      // Check length
      if (code.length > this.maxStringLength) {
        return { valid: false, error: 'Code too long' };
      }

      // Basic security scan
      const issues = this.scanForSecurityIssues(code);
      if (issues.length > 0) {
        const highSeverityIssues = issues.filter(i => i.severity === 'high');
        if (highSeverityIssues.length > 0) {
          return { 
            valid: false, 
            error: `Security issues detected: ${highSeverityIssues.map(i => i.message).join(', ')}` 
          };
        }
      }

      // Sanitize code
      const sanitized = this.sanitizeString(code);

      return { valid: true, sanitized };
    } catch (error) {
      return { 
        valid: false, 
        error: `Code validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Validate API request - basic validation for external API calls
   */
  validateApiRequest(request: any): ValidationResult {
    try {
      if (!request || typeof request !== 'object') {
        return { valid: false, error: 'Request must be an object' };
      }

      // Validate method
      if (!request.method || typeof request.method !== 'string') {
        return { valid: false, error: 'HTTP method is required' };
      }

      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      if (!validMethods.includes(request.method.toUpperCase())) {
        return { valid: false, error: 'Invalid HTTP method' };
      }

      // Validate URL
      if (!request.url || typeof request.url !== 'string') {
        return { valid: false, error: 'URL is required' };
      }

      if (!/^https?:\/\//.test(request.url)) {
        return { valid: false, error: 'URL must start with http:// or https://' };
      }

      if (request.url.length > 2000) {
        return { valid: false, error: 'URL too long' };
      }

      // Sanitize request
      const sanitized = this.sanitizeObject(request);

      return { valid: true, sanitized };
    } catch (error) {
      return { 
        valid: false, 
        error: `API request validation error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Sanitize string - remove dangerous patterns
   */
  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Remove path traversal patterns
    sanitized = sanitized.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');

    // Remove basic command injection patterns
    sanitized = sanitized.replace(/;\s*(rm|del|cat|ls|dir|exec|eval)\s+/gi, '');
    sanitized = sanitized.replace(/\|\s*(rm|del|cat|ls|dir|exec|eval)\s+/gi, '');
    sanitized = sanitized.replace(/`[^`]*`/g, '');

    return sanitized;
  }

  /**
   * Sanitize object - recursively sanitize all strings
   */
  sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Scan for security issues - basic pattern matching
   */
  scanForSecurityIssues(input: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    if (typeof input !== 'string') {
      return issues;
    }

    // XSS patterns
    if (/<script|javascript:|on\w+\s*=/i.test(input)) {
      issues.push({
        type: 'xss',
        severity: 'high',
        message: 'Potential XSS vulnerability detected'
      });
    }

    // SQL injection patterns
    if (/(union|select|insert|update|delete|drop|create|alter)\s+.*\s+(from|into|table|database)/i.test(input)) {
      issues.push({
        type: 'injection',
        severity: 'high',
        message: 'Potential SQL injection detected'
      });
    }

    // Command injection patterns
    if (/[;&|`$(){}[\]]/.test(input) && /(rm|del|cat|ls|dir|exec|eval)/i.test(input)) {
      issues.push({
        type: 'injection',
        severity: 'high',
        message: 'Potential command injection detected'
      });
    }

    // Path traversal patterns
    if (/\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i.test(input)) {
      issues.push({
        type: 'path_traversal',
        severity: 'medium',
        message: 'Path traversal pattern detected'
      });
    }

    return issues;
  }

  /**
   * Quick validation for common inputs
   */
  quickValidate(input: any, type: 'string' | 'number' | 'object' | 'array'): boolean {
    switch (type) {
      case 'string':
        return typeof input === 'string' && input.length <= this.maxStringLength;
      case 'number':
        return typeof input === 'number' && !isNaN(input) && isFinite(input);
      case 'object':
        return typeof input === 'object' && input !== null && !Array.isArray(input);
      case 'array':
        return Array.isArray(input);
      default:
        return false;
    }
  }
}

export default InputValidationService;