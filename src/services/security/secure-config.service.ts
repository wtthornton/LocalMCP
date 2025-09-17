/**
 * Simple Secure Configuration Service - Basic secure configuration management
 * 
 * This service provides secure configuration management for LocalMCP,
 * handling sensitive configuration data with basic encryption.
 * 
 * Benefits for vibe coders:
 * - Secure storage of sensitive configuration
 * - Simple encryption for secrets
 * - Environment variable integration
 * - No complex key management overhead
 */

import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

// Configuration item
export interface ConfigItem {
  key: string;
  value: string;
  encrypted: boolean;
  description?: string;
  lastUpdated: Date;
}

// Secure configuration result
export interface SecureConfigResult {
  success: boolean;
  value?: string;
  error?: string;
}

// Simple Secure Configuration Service Implementation
export class SecureConfigService {
  private encryptionKey: string;
  private configFile: string;
  private config: Map<string, ConfigItem> = new Map();

  constructor(configDir?: string) {
    this.encryptionKey = process.env.LOCALMCP_ENCRYPTION_KEY || this.generateEncryptionKey();
    this.configFile = path.join(configDir || 'config', 'secure-config.json');
    this.loadConfig();
  }

  /**
   * Get configuration value
   */
  async get(key: string): Promise<SecureConfigResult> {
    try {
      // First check environment variables
      const envValue = process.env[key];
      if (envValue) {
        return { success: true, value: envValue };
      }

      // Check loaded config
      const configItem = this.config.get(key);
      if (!configItem) {
        return { success: false, error: `Configuration key '${key}' not found` };
      }

      let value = configItem.value;
      
      // Decrypt if needed
      if (configItem.encrypted) {
        try {
          value = this.decrypt(value);
        } catch (error) {
          return { 
            success: false, 
            error: `Failed to decrypt value for key '${key}': ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }

      return { success: true, value };
    } catch (error) {
      return { 
        success: false, 
        error: `Error getting configuration: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Set configuration value
   */
  async set(key: string, value: string, options?: { encrypt?: boolean; description?: string }): Promise<SecureConfigResult> {
    try {
      let finalValue = value;
      let encrypted = false;

      // Encrypt if requested or if key suggests it's sensitive
      if (options?.encrypt || this.isSensitiveKey(key)) {
        finalValue = this.encrypt(value);
        encrypted = true;
      }

      const configItem: ConfigItem = {
        key,
        value: finalValue,
        encrypted,
        description: options?.description,
        lastUpdated: new Date()
      };

      this.config.set(key, configItem);
      await this.saveConfig();

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Error setting configuration: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Delete configuration value
   */
  async delete(key: string): Promise<SecureConfigResult> {
    try {
      if (!this.config.has(key)) {
        return { success: false, error: `Configuration key '${key}' not found` };
      }

      this.config.delete(key);
      await this.saveConfig();

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Error deleting configuration: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * List all configuration keys
   */
  listKeys(): string[] {
    return Array.from(this.config.keys());
  }

  /**
   * Get configuration metadata
   */
  getMetadata(key: string): ConfigItem | undefined {
    return this.config.get(key);
  }

  /**
   * Export configuration (without sensitive values)
   */
  exportConfig(includeValues: boolean = false): Record<string, any> {
    const exportData: Record<string, any> = {};

    for (const [key, item] of Array.from(this.config.entries())) {
      exportData[key] = {
        encrypted: item.encrypted,
        description: item.description,
        lastUpdated: item.lastUpdated
      };

      if (includeValues && !item.encrypted) {
        exportData[key].value = item.value;
      }
    }

    return exportData;
  }

  /**
   * Import configuration
   */
  async importConfig(configData: Record<string, any>): Promise<SecureConfigResult> {
    try {
      for (const [key, data] of Object.entries(configData)) {
        if (typeof data === 'object' && data.value !== undefined) {
          await this.set(key, data.value, { 
            encrypt: data.encrypted || false,
            description: data.description 
          });
        } else if (typeof data === 'string') {
          await this.set(key, data);
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: `Error importing configuration: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Private helper methods

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /auth/i,
      /credential/i,
      /api[_-]?key/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  private async loadConfig(): Promise<void> {
    try {
      await fs.access(this.configFile);
      const data = await fs.readFile(this.configFile, 'utf8');
      const configData = JSON.parse(data);
      
      // Convert dates back from strings
      for (const [key, item] of Object.entries(configData)) {
        if (item && typeof item === 'object' && 'lastUpdated' in item) {
          (item as any).lastUpdated = new Date((item as any).lastUpdated);
        }
      }
      
      this.config = new Map(Object.entries(configData));
    } catch (error) {
      // Config file doesn't exist or is invalid, start with empty config
      this.config = new Map();
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configFile);
      await fs.mkdir(configDir, { recursive: true });
      
      // Convert Map to object
      const configData = Object.fromEntries(this.config);
      
      // Save to file
      await fs.writeFile(this.configFile, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize with default secure configurations
   */
  async initializeDefaults(): Promise<void> {
    const defaults = [
      { key: 'LOCALMCP_SECRET_KEY', value: crypto.randomBytes(32).toString('hex'), description: 'Secret key for token signing' },
      { key: 'LOCALMCP_ENCRYPTION_KEY', value: crypto.randomBytes(32).toString('hex'), description: 'Encryption key for sensitive data' },
      { key: 'LOCALMCP_API_KEY', value: crypto.randomBytes(16).toString('hex'), description: 'API key for external access' }
    ];

    for (const defaultConfig of defaults) {
      if (!this.config.has(defaultConfig.key)) {
        await this.set(defaultConfig.key, defaultConfig.value, { 
          encrypt: true,
          description: defaultConfig.description 
        });
      }
    }
  }
}

export default SecureConfigService;
