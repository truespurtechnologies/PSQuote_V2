import { LogLevel, LogContext, LogEntry } from '../types/logger';

/**
 * Logger utility for consistent logging throughout the application
 */
class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = 'info';
  private isProduction: boolean = process.env.NODE_ENV === 'production';
  private serviceName: string = 'popular-steels-app';
  private version: string = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

  private constructor() {
    // Initialize logger with environment-specific settings
    this.minLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';
  }

  /**
   * Get the singleton instance of the Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a message with the specified log level
   */
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    // Skip if log level is not enabled
    if (levels[level] > levels[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const environmentContext = this.getEnvironmentContext();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      service: this.serviceName,
      version: this.version,
      environment: environmentContext.environment || 'development',
      ...environmentContext,
      ...context
    };

    // In production, we might want to send logs to a logging service
    if (this.isProduction) {
      this.sendToLoggingService(logEntry);
    }

    // Always log to console in development
    this.logToConsole(level, logEntry);
  }

  /**
   * Get environment-specific context for logs
   */
  private getEnvironmentContext(): LogContext {
    return {
      environment: process.env.NODE_ENV || 'development',
      nodeEnv: process.env.NODE_ENV,
      isServer: typeof window === 'undefined',
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  /**
   * Send logs to external logging service in production
   */
  private sendToLoggingService(logEntry: LogEntry): void {
    // In a real app, this would send logs to a service like Sentry, LogRocket, etc.
    // For now, we'll just log to console in production
    if (process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGING === 'true') {
      // Example: Send to a logging endpoint
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      // }).catch(error => {
      //   console.error('Failed to send log to remote service:', error);
      // });
    }
  }

  /**
   * Log to console with appropriate styling
   */
  private logToConsole(level: LogLevel, entry: LogEntry): void {
    const { timestamp, message, ...context } = entry;
    const styles = this.getConsoleStyles(level);
    
    // Format the message with timestamp and level
    const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // Log to console with appropriate method and styling
    if (level === 'error') {
      console.error(`%c${formattedMessage}`, styles, context);
    } else if (level === 'warn') {
      console.warn(`%c${formattedMessage}`, styles, context);
    } else if (level === 'info') {
      console.info(`%c${formattedMessage}`, styles, context);
    } else {
      console.log(`%c${formattedMessage}`, styles, context);
    }
  }

  /**
   * Get console styles based on log level
   */
  private getConsoleStyles(level: LogLevel): string {
    const styles = {
      error: 'color: #ff4d4f; font-weight: bold;',
      warn: 'color: #faad14; font-weight: bold;',
      info: 'color: #1890ff;',
      debug: 'color: #722ed1;',
      trace: 'color: #8c8c8c;',
    };

    return styles[level] || '';
  }

  // Public logging methods
  public error(message: string, context: LogContext = {}): void {
    this.log('error', message, context);
  }

  public warn(message: string, context: LogContext = {}): void {
    this.log('warn', message, context);
  }

  public info(message: string, context: LogContext = {}): void {
    this.log('info', message, context);
  }

  public debug(message: string, context: LogContext = {}): void {
    this.log('debug', message, context);
  }

  public trace(message: string, context: LogContext = {}): void {
    this.log('trace', message, context);
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// Export a simple function for default usage
export const log = {
  error: (message: string, context: LogContext = {}) => logger.error(message, context),
  warn: (message: string, context: LogContext = {}) => logger.warn(message, context),
  info: (message: string, context: LogContext = {}) => logger.info(message, context),
  debug: (message: string, context: LogContext = {}) => logger.debug(message, context),
  trace: (message: string, context: LogContext = {}) => logger.trace(message, context),
};

// Export types
export type { LogLevel, LogContext, LogEntry };
