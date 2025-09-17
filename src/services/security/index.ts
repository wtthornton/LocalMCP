/**
 * Security Services Index - Simplified security services for LocalMCP
 * 
 * This module provides a clean interface for importing all simplified
 * security services that focus on essential protection without over-engineering.
 */

export { default as InputValidationService } from './input-validation.service';
export { default as AuthenticationService } from './authentication.service';
export { default as SecureConfigService } from './secure-config.service';
export { default as EncryptionService } from './encryption.service';

export type {
  ValidationResult,
  SecurityIssue
} from './input-validation.service';

export type {
  AuthResult,
  SimpleUser,
  TokenInfo
} from './authentication.service';

export type {
  ConfigItem,
  SecureConfigResult
} from './secure-config.service';

export type {
  EncryptionResult
} from './encryption.service';
