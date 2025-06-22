/**
 * Logger utility for Docker Pilot
 * Provides structured logging with different levels and colored output
 */

import { LogLevel, LogEntry } from '../types';

export interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableSource: boolean;
  silent: boolean;
}

export class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableColors: true,
      enableTimestamp: true,
      enableSource: false,
      silent: false,
      ...config
    };
  }

  /**
   * Log levels hierarchy
   */
  private static readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * ANSI color codes for console output
   */
  private static readonly COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
  };

  /**
   * Icons for different log levels
   */
  private static readonly ICONS = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  };

  /**
   * Check if a log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.config.silent) return false;

    const currentLevelNum = Logger.LOG_LEVELS[this.config.level];
    const messageLevelNum = Logger.LOG_LEVELS[level];

    return messageLevelNum >= currentLevelNum;
  }
  /**
   * Format context data for display
   */
  private formatContext(context: any): string {
    if (!context) return '';

    if (typeof context === 'string') {
      return context;
    }

    if (context instanceof Error) {
      return context.message || context.toString();
    }

    // For objects, try to extract meaningful information
    if (typeof context === 'object') {
      // If it's an empty object, don't show it
      if (Object.keys(context).length === 0) {
        return '';
      }

      // If it has a message property, use that
      if (context.message) {
        return typeof context.message === 'string' ? context.message : JSON.stringify(context.message);
      }

      // If it has an error property, format that
      if (context.error) {
        return this.formatContext(context.error);
      }

      // Otherwise stringify with limited depth
      try {
        return JSON.stringify(context, null, 2);
      } catch {
        return '[Circular Object]';
      }
    }

    return String(context);
  }

  /**
   * Format log message with colors and timestamp
   */
  private formatMessage(level: LogLevel, message: string, context?: any, source?: string): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString();
      const timestampStr = this.config.enableColors
        ? `${Logger.COLORS.gray}[${timestamp}]${Logger.COLORS.reset}`
        : `[${timestamp}]`;
      parts.push(timestampStr);
    }

    // Level with icon and color
    const icon = Logger.ICONS[level];
    let levelStr = `${icon} ${level.toUpperCase()}`;

    if (this.config.enableColors) {
      const color = this.getLevelColor(level);
      levelStr = `${color}${levelStr}${Logger.COLORS.reset}`;
    }

    parts.push(levelStr);

    // Source
    if (source && this.config.enableSource) {
      const sourceStr = this.config.enableColors
        ? `${Logger.COLORS.cyan}[${source}]${Logger.COLORS.reset}`
        : `[${source}]`;
      parts.push(sourceStr);
    }

    // Message
    parts.push(message);

    // Context
    if (context !== undefined) {
      const contextStr = this.formatContext(context);

      if (contextStr) {
        if (this.config.enableColors) {
          parts.push(`${Logger.COLORS.dim}${contextStr}${Logger.COLORS.reset}`);
        } else {
          parts.push(contextStr);
        }
      }
    }

    return parts.join(' ');
  }

  /**
   * Get color for log level
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return Logger.COLORS.gray;
      case 'info': return Logger.COLORS.blue;
      case 'warn': return Logger.COLORS.yellow;
      case 'error': return Logger.COLORS.red;
      default: return Logger.COLORS.reset;
    }
  }

  /**
   * Core log method
   */  private log(level: LogLevel, message: string, context?: any, source?: string): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      ...(source && { source })
    };

    // Store log entry
    this.logs.push(logEntry);

    // Format and output
    const formattedMessage = this.formatMessage(level, message, context, source);

    // Output to appropriate stream
    if (level === 'error') {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: any, source?: string): void {
    this.log('debug', message, context, source);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: any, source?: string): void {
    this.log('info', message, context, source);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: any, source?: string): void {
    this.log('warn', message, context, source);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: any, source?: string): void {
    this.log('error', message, context, source);
  }

  /**
   * Success logging (special case of info)
   */
  success(message: string, context?: any, source?: string): void {
    const successMessage = this.config.enableColors
      ? `${Logger.COLORS.green}✅ ${message}${Logger.COLORS.reset}`
      : `✅ ${message}`;
    this.log('info', successMessage, context, source);
  }

  /**
   * Loading/progress logging
   */
  loading(message: string, context?: any, source?: string): void {
    const loadingMessage = this.config.enableColors
      ? `${Logger.COLORS.cyan}🔄 ${message}${Logger.COLORS.reset}`
      : `🔄 ${message}`;
    this.log('info', loadingMessage, context, source);
  }

  /**
   * Command execution logging
   */
  command(command: string, source?: string): void {
    const commandMessage = this.config.enableColors
      ? `${Logger.COLORS.magenta}🚀 Executing: ${Logger.COLORS.bright}${command}${Logger.COLORS.reset}`
      : `🚀 Executing: ${command}`;
    this.log('info', commandMessage, undefined, source);
  }

  /**
   * Service status logging
   */
  service(serviceName: string, status: string, details?: any): void {
    const statusEmoji = status === 'running' ? '🟢' :
                       status === 'stopped' ? '🔴' :
                       status === 'starting' ? '🟡' : '⚫';

    const serviceMessage = `${statusEmoji} Service ${serviceName}: ${status}`;
    this.log('info', serviceMessage, details, 'ServiceManager');
  }

  /**
   * Clear console
   */
  clear(): void {
    if (!this.config.silent) {
      console.clear();
    }
  }

  /**
   * Print separator line
   */
  separator(char: string = '=', length: number = 60): void {
    if (!this.config.silent) {
      const line = char.repeat(length);
      console.log(this.config.enableColors
        ? `${Logger.COLORS.gray}${line}${Logger.COLORS.reset}`
        : line);
    }
  }

  /**
   * Print header
   */
  header(title: string): void {
    if (!this.config.silent) {
      this.separator();
      const headerMessage = this.config.enableColors
        ? `${Logger.COLORS.bright}${Logger.COLORS.cyan}${title}${Logger.COLORS.reset}`
        : title;
      console.log(`\n${headerMessage}\n`);
      this.separator();
    }
  }

  /**
   * Print blank line
   */
  newLine(): void {
    if (!this.config.silent) {
      console.log();
    }
  }

  /**
   * Table logging
   */
  table(data: any[], headers?: string[]): void {
    if (!this.config.silent && data.length > 0) {
      if (headers) {
        console.table(data, headers);
      } else {
        console.table(data);
      }
    }
  }

  /**
   * JSON logging
   */
  json(data: any, label?: string): void {
    if (label) {
      this.info(label);
    }
    if (!this.config.silent) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get all log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear log history
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to string
   */
  exportLogs(): string {
    return this.logs
      .map(log => `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n');
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Enable/disable colors
   */
  setColors(enabled: boolean): void {
    this.config.enableColors = enabled;
  }

  /**
   * Enable/disable silent mode
   */
  setSilent(silent: boolean): void {
    this.config.silent = silent;
  }

  /**
   * Create child logger with context
   */
  child(source: string): Logger {
    const childLogger = new Logger(this.config);

    // Override log method to always include source
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, context?: any, childSource?: string) => {
      originalLog(level, message, context, childSource || source);
    };

    return childLogger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();
