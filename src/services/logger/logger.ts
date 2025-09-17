/**
 * Logger Service
 * 
 * Centralized logging for the Personal MCP Gateway.
 * Provides structured logging with different levels and formats.
 * 
 * Designed for vibe coders - clear, helpful log messages.
 */

import winston from 'winston';
import { LogLevel } from '../../types/index.js';

// Custom log format for vibe coders
const vibeCoderFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const serviceTag = service ? `[${service}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${serviceTag} ${message}${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: vibeCoderFormat,
  defaultMeta: { service: 'mcp-gateway' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        vibeCoderFormat
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: process.env.LOG_FILE || './logs/mcp-gateway.log',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }));
}

/**
 * Create a logger for a specific service
 * This helps vibe coders understand where logs are coming from
 */
export function createLogger(service: string): winston.Logger {
  return logger.child({ service });
}

/**
 * Log a vibe coder friendly message
 * These messages are designed to be helpful and encouraging
 */
export function logVibeCoderMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const vibeMessages: Record<string, string> = {
    '🚀': 'Starting up...',
    '✅': 'Success!',
    '🎯': 'Ready to help!',
    '💡': 'Pro tip:',
    '🔧': 'Fixing things...',
    '📚': 'Learning...',
    '⚡': 'Fast response!',
    '🛡️': 'Security check...',
    '🔍': 'Searching...',
    '📝': 'Documenting...',
    '🎉': 'Great job!',
    '❌': 'Oops, something went wrong:',
    '⚠️': 'Heads up:',
    '🔄': 'Retrying...',
    '⏱️': 'Taking a moment...',
    '🎨': 'Making it beautiful...',
    '🧠': 'Thinking...',
    '💪': 'Powering through...',
    '🌟': 'Excellent!',
    '🔗': 'Connecting...',
    '📡': 'Listening...',
    '🛑': 'Stopping...',
    '💥': 'Fatal error:',
  };

  // Extract emoji and message
  const emoji = message.match(/^[^\s]+/)?.[0] || '';
  const cleanMessage = message.replace(/^[^\s]+\s*/, '');
  
  // Add vibe coder context
  const vibeContext = vibeMessages[emoji] ? ` ${vibeMessages[emoji]}` : '';
  const fullMessage = `${emoji}${vibeContext} ${cleanMessage}`;
  
  logger.log(level, fullMessage, meta);
}

/**
 * Log performance metrics
 * Helps vibe coders understand how fast things are
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const level = duration > 5000 ? 'warn' : 'info';
  const emoji = duration > 5000 ? '⏱️' : '⚡';
  
  logger.log(level, `${emoji} ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
}

/**
 * Log cache operations
 * Helps vibe coders understand cache behavior
 */
export function logCacheOperation(
  operation: 'hit' | 'miss' | 'set' | 'evict',
  key: string,
  metadata?: Record<string, unknown>
): void {
  const emojis = {
    hit: '⚡',
    miss: '🔍',
    set: '💾',
    evict: '🗑️',
  };
  
  logger.log('debug', `${emojis[operation]} Cache ${operation}: ${key}`, {
    operation,
    key,
    ...metadata,
  });
}

/**
 * Log tool execution
 * Helps vibe coders understand what tools are doing
 */
export function logToolExecution(
  toolName: string,
  success: boolean,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const emoji = success ? '✅' : '❌';
  const level = success ? 'info' : 'error';
  
  logger.log(level, `${emoji} Tool ${toolName} ${success ? 'succeeded' : 'failed'} in ${duration}ms`, {
    tool: toolName,
    success,
    duration,
    ...metadata,
  });
}

/**
 * Log pipeline stages
 * Helps vibe coders understand the processing pipeline
 */
export function logPipelineStage(
  stage: string,
  success: boolean,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const emoji = success ? '✅' : '❌';
  const level = success ? 'debug' : 'warn';
  
  logger.log(level, `${emoji} Pipeline stage '${stage}' ${success ? 'completed' : 'failed'} in ${duration}ms`, {
    stage,
    success,
    duration,
    ...metadata,
  });
}

// Export the main logger instance
export { logger };
export default logger;
