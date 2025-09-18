/**
 * Offline Services Index - Offline mode and resilience services for LocalMCP
 * 
 * This module provides a clean interface for importing all offline services
 * that enable LocalMCP to work without external connectivity.
 */

export { default as CacheFirstService } from './cache-first.service';
export { default as RAGOnlyService } from './rag-only.service';
export { default as GracefulDegradationService } from './graceful-degradation.service';
export { default as OfflineStorageService } from './offline-storage.service';
export { default as SyncCapabilitiesService } from './sync-capabilities.service';
export { default as OfflineModeService } from './offline-mode.service';

export type {
  OfflineModeStatus,
  ConnectivityStatus,
  OfflineOperationResult,
  OfflineModeConfig
} from './offline-mode.service';

export type {
  CacheEntry,
  CacheResult,
  Context7Config,
  CacheConfig
} from './cache-first.service';

export type {
  RAGResult,
  RAGSource,
  RAGQueryOptions,
  OfflineConfig
} from './rag-only.service';

export type {
  ServiceStatus,
  DegradationStrategy,
  SystemHealth
} from './graceful-degradation.service';

export type {
  StorageEntry,
  StorageStats,
  StorageConfig,
  StorageResult
} from './offline-storage.service';

export type {
  SyncResult,
  SyncOperationResult,
  SyncConflict,
  SyncError,
  SyncStrategy,
  SyncQueueItem
} from './sync-capabilities.service';
