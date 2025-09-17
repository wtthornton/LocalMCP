export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  service: string;
}

/**
 * Logger - Centralized logging service for LocalMCP
 * 
 * Provides structured logging with different levels and context support.
 * Designed for vibe coders who need clear, actionable log messages.
 */
export class Logger {
  private logLevel: LogLevel;

  constructor(
    private service: string,
    logLevel: LogLevel = LogLevel.INFO
  ) {
    this.logLevel = logLevel;
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context);
  }

  private log(level: LogLevel, message: string, context?: any): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: this.service
    };

    const logLine = this.formatLogEntry(entry);
    
    // Output to appropriate stream
    if (level >= LogLevel.ERROR) {
      console.error(logLine);
    } else {
      console.log(logLine);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.substring(11, 23); // HH:MM:SS.mmm
    
    let logLine = `[${timestamp}] ${levelName.toUpperCase()} [${entry.service}] ${entry.message}`;
    
    if (entry.context) {
      logLine += ` | Context: ${JSON.stringify(entry.context)}`;
    }
    
    return logLine;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.logLevel;
  }
}