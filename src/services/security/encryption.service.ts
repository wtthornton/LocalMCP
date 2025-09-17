/**
 * Simple Encryption Service - Basic data encryption using Node.js crypto
 * 
 * This service provides simple but effective encryption for sensitive data
 * in LocalMCP using Node.js built-in crypto module.
 * 
 * Benefits for vibe coders:
 * - Simple encryption/decryption using Node.js crypto
 * - No external dependencies
 * - Fast and reliable
 * - Easy to use and understand
 */

import * as crypto from 'crypto';

// Encryption result
export interface EncryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

// Simple Encryption Service Implementation
export class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits

  constructor() {
    // Simple constructor - uses Node.js crypto defaults
  }

  /**
   * Generate encryption key
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Generate encryption key from password
   */
  generateKeyFromPassword(password: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    return crypto.pbkdf2Sync(password, actualSalt, 100000, this.keyLength, 'sha512').toString('hex');
  }

  /**
   * Encrypt data
   */
  encrypt(data: string, key: string): EncryptionResult {
    try {
      if (!data || typeof data !== 'string') {
        return { success: false, error: 'Data must be a non-empty string' };
      }

      if (!key || typeof key !== 'string') {
        return { success: false, error: 'Key must be a non-empty string' };
      }

      // Convert hex key to buffer
      const keyBuffer = Buffer.from(key, 'hex');
      if (keyBuffer.length !== this.keyLength) {
        return { success: false, error: `Key must be ${this.keyLength * 2} hex characters` };
      }

      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, keyBuffer);
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      const result = iv.toString('hex') + ':' + encrypted;
      
      return { success: true, data: result };
    } catch (error) {
      return { 
        success: false, 
        error: `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: string, key: string): EncryptionResult {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') {
        return { success: false, error: 'Encrypted data must be a non-empty string' };
      }

      if (!key || typeof key !== 'string') {
        return { success: false, error: 'Key must be a non-empty string' };
      }

      // Convert hex key to buffer
      const keyBuffer = Buffer.from(key, 'hex');
      if (keyBuffer.length !== this.keyLength) {
        return { success: false, error: `Key must be ${this.keyLength * 2} hex characters` };
      }

      // Split encrypted data
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        return { success: false, error: 'Invalid encrypted data format' };
      }

      const [ivHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, keyBuffer);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return { success: true, data: decrypted };
    } catch (error) {
      return { 
        success: false, 
        error: `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Hash data (one-way)
   */
  hash(data: string, algorithm: 'sha256' | 'sha512' = 'sha256'): EncryptionResult {
    try {
      if (!data || typeof data !== 'string') {
        return { success: false, error: 'Data must be a non-empty string' };
      }

      const hash = crypto.createHash(algorithm);
      hash.update(data);
      const hashed = hash.digest('hex');
      
      return { success: true, data: hashed };
    } catch (error) {
      return { 
        success: false, 
        error: `Hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Create HMAC (Hash-based Message Authentication Code)
   */
  createHmac(data: string, key: string, algorithm: 'sha256' | 'sha512' = 'sha256'): EncryptionResult {
    try {
      if (!data || typeof data !== 'string') {
        return { success: false, error: 'Data must be a non-empty string' };
      }

      if (!key || typeof key !== 'string') {
        return { success: false, error: 'Key must be a non-empty string' };
      }

      const hmac = crypto.createHmac(algorithm, key);
      hmac.update(data);
      const signature = hmac.digest('hex');
      
      return { success: true, data: signature };
    } catch (error) {
      return { 
        success: false, 
        error: `HMAC creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Verify HMAC
   */
  verifyHmac(data: string, key: string, signature: string, algorithm: 'sha256' | 'sha512' = 'sha256'): boolean {
    const result = this.createHmac(data, key, algorithm);
    if (!result.success || !result.data) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(result.data, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }

  /**
   * Generate random bytes
   */
  randomBytes(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   */
  generateUuid(): string {
    return crypto.randomUUID();
  }

  /**
   * Simple encryption for configuration values
   */
  encryptConfig(value: string, masterKey?: string): EncryptionResult {
    const key = masterKey || process.env.LOCALMCP_ENCRYPTION_KEY || this.generateKey();
    return this.encrypt(value, key);
  }

  /**
   * Simple decryption for configuration values
   */
  decryptConfig(encryptedValue: string, masterKey?: string): EncryptionResult {
    const key = masterKey || process.env.LOCALMCP_ENCRYPTION_KEY || this.generateKey();
    return this.decrypt(encryptedValue, key);
  }

  /**
   * Hash password for storage
   */
  hashPassword(password: string, salt?: string): EncryptionResult {
    const actualSalt = salt || this.randomBytes(16);
    const hashResult = this.hash(password + actualSalt, 'sha256');
    
    if (!hashResult.success) {
      return hashResult;
    }

    // Return salt:hash format
    return { success: true, data: `${actualSalt}:${hashResult.data}` };
  }

  /**
   * Verify password against hash
   */
  verifyPassword(password: string, hashedPassword: string): boolean {
    const parts = hashedPassword.split(':');
    if (parts.length !== 2) {
      return false;
    }

    const [salt, hash] = parts;
    const hashResult = this.hash(password + salt, 'sha256');
    
    if (!hashResult.success || !hashResult.data) {
      return false;
    }

    return hashResult.data === hash;
  }

  /**
   * Secure comparison (timing-safe)
   */
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  }
}

export default EncryptionService;
