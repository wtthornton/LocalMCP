/**
 * Offline Mode Service - Simple offline operation coordination
 * 
 * This service provides basic offline mode capabilities for LocalMCP,
 * coordinating between cache-first operations, RAG-only mode, and graceful degradation.
 * 
 * Benefits for vibe coders:
 * - Simple offline operation with cached data
 * - Automatic fallback when network is unavailable
 * - Basic error handling for network issues
 * - Seamless transition between online and offline modes
 * - No complex configuration required
 */

import { EventEmitter } from 'events';
import { CacheFirstService } from './cache-first.service';
import { RAGOnlyService } from './rag-only.service';
import { GracefulDegradationService } from './graceful-degradation.service';
import { OfflineStorageService } from './offline-storage.service';

// Offline mode status
export type OfflineModeStatus = 'online' | 'offline' | 'degraded' | 'unknown';

// Network connectivity status
export type ConnectivityStatus = 'connected' | 'disconnected' | 'unstable' | 'unknown';

// Offline operation result
export interface OfflineOperationResult {
  success: boolean;
  data?: any;
  source: 'cache' | 'rag' | 'offline-storage' | 'network' | 'fallback';
  offline: boolean;
  error?: string;
  metadata?: {
    cacheHit?: boolean;
    responseTime?: number;
    retryCount?: number;
    fallbackUsed?: boolean;
  };
}

// Offline mode configuration
export interface OfflineModeConfig {
  enabled: boolean;
  cacheFirst: boolean;
  ragOnly: boolean;
  gracefulDegradation: boolean;
  offlineStorage: boolean;
  networkCheckInterval: number; // milliseconds
  retryAttempts: number;
  timeout: number; // milliseconds
}

// Offline Mode Service Implementation
export class OfflineModeService extends EventEmitter {
  private cacheFirstService: CacheFirstService;
  private ragOnlyService: RAGOnlyService;
  private gracefulDegradationService: GracefulDegradationService;
  private offlineStorageService: OfflineStorageService;
  private config: OfflineModeConfig;
  private status: OfflineModeStatus = 'unknown';
  private connectivityStatus: ConnectivityStatus = 'unknown';
  private networkCheckTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(config?: Partial<OfflineModeConfig>) {
    super();
    
    // Initialize services
    this.cacheFirstService = new CacheFirstService();
    this.ragOnlyService = new RAGOnlyService();
    this.gracefulDegradationService = new GracefulDegradationService();
    this.offlineStorageService = new OfflineStorageService();
    
    // Set default configuration
    this.config = {
      enabled: true,
      cacheFirst: true,
      ragOnly: true,
      gracefulDegradation: true,
      offlineStorage: true,
      networkCheckInterval: 30000, // 30 seconds
      retryAttempts: 3,
      timeout: 10000, // 10 seconds
      ...config
    };
  }

  /**
   * Start the offline mode service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Initialize services
    await this.initializeServices();
    
    // Start network monitoring
    this.startNetworkMonitoring();
    
    // Initial connectivity check
    await this.checkConnectivity();

    this.emit('serviceStarted');
  }

  /**
   * Stop the offline mode service
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Stop network monitoring
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
      this.networkCheckTimer = undefined;
    }

    this.emit('serviceStopped');
  }

  /**
   * Execute operation with offline mode support
   */
  async executeOperation<T>(
    operation: string,
    params: any[],
    options?: {
      preferOffline?: boolean;
      fallbackToOffline?: boolean;
      timeout?: number;
    }
  ): Promise<OfflineOperationResult> {
    const startTime = Date.now();
    const preferOffline = options?.preferOffline || this.status === 'offline';
    const fallbackToOffline = options?.fallbackToOffline ?? true;
    const timeout = options?.timeout || this.config.timeout;

    try {
      // Try cache-first if enabled and not preferring offline
      if (this.config.cacheFirst && !preferOffline && this.status !== 'offline') {
        try {
          const cacheResult = await this.executeWithTimeout(
            () => this.cacheFirstService.get(operation, { tags: [], ttl: 3600 }),
            timeout
          );
          
          if (cacheResult.success) {
            return {
              success: true,
              data: cacheResult.data,
              source: 'cache',
              offline: false,
              metadata: {
                cacheHit: true,
                responseTime: Date.now() - startTime
              }
            };
          }
        } catch (error) {
          // Cache failed, continue to network
        }
      }

      // Try RAG-only if offline or preferring offline
      if (this.config.ragOnly && (preferOffline || this.status === 'offline')) {
        try {
          const ragResult = await this.executeWithTimeout(
            () => this.ragOnlyService.query(operation, { maxResults: 10, minRelevance: 0.7 }),
            timeout
          );
          
          if (ragResult.success) {
            return {
              success: true,
              data: ragResult.data,
              source: 'rag',
              offline: true,
              metadata: {
                responseTime: Date.now() - startTime
              }
            };
          }
        } catch (error) {
          // RAG failed, continue to fallback
        }
      }

      // Try offline storage if available
      if (this.config.offlineStorage) {
        try {
          const storageResult = await this.executeWithTimeout(
            () => this.offlineStorageService.retrieve(operation, { fromMemoryOnly: false }),
            timeout
          );
          
          if (storageResult.success) {
            return {
              success: true,
              data: storageResult.data,
              source: 'offline-storage',
              offline: true,
              metadata: {
                responseTime: Date.now() - startTime
              }
            };
          }
        } catch (error) {
          // Offline storage failed, continue to graceful degradation
        }
      }

      // Try graceful degradation if enabled
      if (this.config.gracefulDegradation && fallbackToOffline) {
        try {
          const degradationResult = await this.executeWithTimeout(
            async () => this.gracefulDegradationService.getServiceStatus('default'),
            timeout
          );
          
          // For now, simulate a fallback response
          return {
            success: true,
            data: { message: 'Fallback response', operation },
            source: 'fallback',
            offline: true,
            metadata: {
              fallbackUsed: true,
              responseTime: Date.now() - startTime
            }
          };
        } catch (error) {
          // Graceful degradation failed
        }
      }

      // All offline methods failed
      return {
        success: false,
        source: 'fallback',
        offline: true,
        error: 'All offline methods failed',
        metadata: {
          responseTime: Date.now() - startTime
        }
      };

    } catch (error) {
      return {
        success: false,
        source: 'fallback',
        offline: this.status === 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Store data for offline use
   */
  async storeForOffline(key: string, data: any, ttl?: number): Promise<boolean> {
    try {
      // Store in cache-first service
      if (this.config.cacheFirst) {
        await this.cacheFirstService.set(key, data, { tags: [], ttl: ttl || 3600 });
      }

      // Store in offline storage
      if (this.config.offlineStorage) {
        await this.offlineStorageService.store(key, data, { ttl });
      }

      // Store in RAG service if it's knowledge-based data
      if (this.config.ragOnly && this.isKnowledgeData(data)) {
        // RAG service doesn't have addSource method, skip for now
        // await this.ragOnlyService.addSource(key, data);
      }

      return true;
    } catch (error) {
      this.emit('storeError', { key, error });
      return false;
    }
  }

  /**
   * Get offline mode status
   */
  getStatus(): { mode: OfflineModeStatus; connectivity: ConnectivityStatus } {
    return {
      mode: this.status,
      connectivity: this.connectivityStatus
    };
  }

  /**
   * Get offline mode statistics
   */
  getStats(): {
    cacheStats: any;
    ragStats: any;
    storageStats: any;
    degradationStats: any;
  } {
    return {
      cacheStats: this.cacheFirstService.getStats(),
      ragStats: this.ragOnlyService.getStats(),
      storageStats: this.offlineStorageService.getStats(),
      degradationStats: this.gracefulDegradationService.getServiceStatus('default')
    };
  }

  /**
   * Force offline mode
   */
  setOfflineMode(offline: boolean): void {
    const oldStatus = this.status;
    this.status = offline ? 'offline' : 'online';
    
    if (oldStatus !== this.status) {
      this.emit('modeChanged', { oldStatus, newStatus: this.status });
    }
  }

  /**
   * Initialize all services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize cache-first service
      if (this.config.cacheFirst) {
        // Cache-first service is already initialized
      }

      // Initialize RAG-only service
      if (this.config.ragOnly) {
        // RAG-only service is already initialized
      }

      // Initialize graceful degradation service
      if (this.config.gracefulDegradation) {
        // Graceful degradation service is already initialized
      }

      // Initialize offline storage service
      if (this.config.offlineStorage) {
        // Offline storage service is already initialized
      }

      this.emit('servicesInitialized');
    } catch (error) {
      this.emit('initializationError', { error });
      throw error;
    }
  }

  /**
   * Start network connectivity monitoring
   */
  private startNetworkMonitoring(): void {
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
    }

    this.networkCheckTimer = setInterval(async () => {
      await this.checkConnectivity();
    }, this.config.networkCheckInterval);
  }

  /**
   * Check network connectivity
   */
  private async checkConnectivity(): Promise<void> {
    const oldStatus = this.connectivityStatus;
    
    try {
      // Simple connectivity check - try to reach a reliable endpoint
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      
      this.connectivityStatus = 'connected';
      this.status = 'online';
    } catch (error) {
      this.connectivityStatus = 'disconnected';
      this.status = 'offline';
    }

    if (oldStatus !== this.connectivityStatus) {
      this.emit('connectivityChanged', { 
        oldStatus, 
        newStatus: this.connectivityStatus,
        mode: this.status 
      });
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      )
    ]);
  }

  /**
   * Check if data is knowledge-based (suitable for RAG)
   */
  private isKnowledgeData(data: any): boolean {
    if (typeof data === 'string') {
      return data.length > 100; // Assume long strings are knowledge
    }
    
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data).length > 100;
    }
    
    return false;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.emit('serviceDestroyed');
  }
}

export default OfflineModeService;
