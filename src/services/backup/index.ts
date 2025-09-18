/**
 * Backup Services Module
 * 
 * This module provides comprehensive backup and disaster recovery capabilities
 * for LocalMCP, including automated backups, disaster recovery procedures,
 * and business continuity planning.
 * 
 * Benefits for vibe coders:
 * - Automated backup scheduling with configurable retention policies
 * - Multiple backup destinations and compression/encryption options
 * - Disaster recovery procedures with automated failover
 * - Recovery time and point objective management
 * - Multi-site backup synchronization and replication
 * - Disaster recovery testing and validation
 * - Business continuity planning and execution
 */

export { default as BackupService } from './backup-service';
export { default as DisasterRecoveryService } from './disaster-recovery.service';

export type {
  BackupType,
  BackupStatus,
  BackupDestination,
  CompressionType,
  EncryptionType,
  BackupConfig,
  BackupEntry,
  BackupStats,
  RestoreOptions
} from './backup-service';

export type {
  DisasterType,
  RecoveryStatus,
  RecoveryPriority,
  RecoverySiteType,
  RecoveryPlan,
  RecoveryProcedure,
  RecoveryEvent,
  RecoverySite
} from './disaster-recovery.service';
