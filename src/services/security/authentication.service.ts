/**
 * Simple Authentication Service - Basic API authentication for LocalMCP
 * 
 * This service provides lightweight authentication and authorization
 * for LocalMCP API endpoints and tool access.
 * 
 * Benefits for vibe coders:
 * - Simple token-based authentication
 * - Lightweight and fast
 * - No complex user management
 * - Easy to configure and use
 */

import * as crypto from 'crypto';

// Simple authentication result
export interface AuthResult {
  authenticated: boolean;
  user?: SimpleUser;
  error?: string;
}

// Basic user interface
export interface SimpleUser {
  id: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
  permissions: string[];
}

// Token information
export interface TokenInfo {
  userId: string;
  role: string;
  permissions: string[];
  issuedAt: number;
  expiresAt: number;
}

// Simple Authentication Service Implementation
export class AuthenticationService {
  private secretKey: string;
  private tokenExpiryHours = 24;
  private users: Map<string, SimpleUser> = new Map();

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.LOCALMCP_SECRET_KEY || this.generateSecretKey();
    this.initializeDefaultUsers();
  }

  /**
   * Authenticate with token
   */
  authenticate(token: string): AuthResult {
    try {
      if (!token) {
        return { authenticated: false, error: 'No token provided' };
      }

      // Verify token
      const tokenInfo = this.verifyToken(token);
      if (!tokenInfo) {
        return { authenticated: false, error: 'Invalid token' };
      }

      // Check if token is expired
      if (Date.now() > tokenInfo.expiresAt) {
        return { authenticated: false, error: 'Token expired' };
      }

      // Get user
      const user = this.users.get(tokenInfo.userId);
      if (!user) {
        return { authenticated: false, error: 'User not found' };
      }

      return { authenticated: true, user };
    } catch (error) {
      return { 
        authenticated: false, 
        error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Generate token for user
   */
  generateToken(userId: string): string {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const tokenInfo: TokenInfo = {
      userId: user.id,
      role: user.role,
      permissions: user.permissions,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (this.tokenExpiryHours * 60 * 60 * 1000)
    };

    const tokenData = JSON.stringify(tokenInfo);
    const signature = this.createSignature(tokenData);
    const encodedToken = Buffer.from(tokenData).toString('base64');
    
    return `${encodedToken}.${signature}`;
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: SimpleUser, permission: string): boolean {
    return user.permissions.includes(permission) || user.role === 'admin';
  }

  /**
   * Check if user can access tool
   */
  canAccessTool(user: SimpleUser, toolName: string): boolean {
    const toolPermissions: Record<string, string[]> = {
      'localmcp.analyze': ['analyze', 'read'],
      'localmcp.create': ['create', 'write'],
      'localmcp.fix': ['fix', 'write'],
      'localmcp.learn': ['learn', 'read']
    };

    const requiredPermissions = toolPermissions[toolName] || ['read'];
    
    return requiredPermissions.some(permission => 
      this.hasPermission(user, permission)
    );
  }

  /**
   * Create user (simple user management)
   */
  createUser(id: string, name: string, role: 'admin' | 'developer' | 'viewer'): SimpleUser {
    const permissions = this.getDefaultPermissions(role);
    
    const user: SimpleUser = {
      id,
      name,
      role,
      permissions
    };

    this.users.set(id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): SimpleUser | undefined {
    return this.users.get(userId);
  }

  /**
   * List all users
   */
  listUsers(): SimpleUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Update user permissions
   */
  updateUserPermissions(userId: string, permissions: string[]): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    user.permissions = permissions;
    this.users.set(userId, user);
    return true;
  }

  /**
   * Remove user
   */
  removeUser(userId: string): boolean {
    return this.users.delete(userId);
  }

  // Private helper methods

  private verifyToken(token: string): TokenInfo | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) {
        return null;
      }

      const [encodedToken, signature] = parts;
      const tokenData = Buffer.from(encodedToken, 'base64').toString('utf8');
      
      // Verify signature
      const expectedSignature = this.createSignature(tokenData);
      if (signature !== expectedSignature) {
        return null;
      }

      return JSON.parse(tokenData) as TokenInfo;
    } catch (error) {
      return null;
    }
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex');
  }

  private generateSecretKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getDefaultPermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      admin: ['read', 'write', 'create', 'delete', 'analyze', 'fix', 'learn', 'admin'],
      developer: ['read', 'write', 'create', 'analyze', 'fix', 'learn'],
      viewer: ['read', 'analyze', 'learn']
    };

    return rolePermissions[role] || ['read'];
  }

  private initializeDefaultUsers(): void {
    // Create default admin user
    this.createUser('admin', 'LocalMCP Admin', 'admin');
    
    // Create default developer user
    this.createUser('developer', 'LocalMCP Developer', 'developer');
    
    // Create default viewer user
    this.createUser('viewer', 'LocalMCP Viewer', 'viewer');
  }

  /**
   * Middleware for Express.js (if needed)
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '') || req.query.token;

      const authResult = this.authenticate(token);
      
      if (!authResult.authenticated) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: authResult.error 
        });
      }

      req.user = authResult.user;
      next();
    };
  }

  /**
   * Simple API key validation (alternative to JWT)
   */
  validateApiKey(apiKey: string): AuthResult {
    // Simple API key validation - in production, use proper API key management
    const validApiKeys = [
      process.env.LOCALMCP_API_KEY,
      'localmcp-dev-key-123',
      'localmcp-admin-key-456'
    ];

    if (!validApiKeys.includes(apiKey)) {
      return { authenticated: false, error: 'Invalid API key' };
    }

    // Return default developer user for valid API keys
    const user = this.getUser('developer');
    return { authenticated: true, user };
  }
}

export default AuthenticationService;
