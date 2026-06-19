/**
 * Log levels for the application
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Context object that can be passed with log messages
 */
export interface LogContext {
  [key: string]: unknown;
  error?: unknown;
  stack?: string;
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  environment?: string;
  nodeEnv?: string;
  isServer?: boolean;
  userAgent?: string;
  [key: `x-${string}`]: unknown;
}

/**
 * Structure of a log entry
 */
export interface LogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  [key: string]: unknown;
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Minimum log level to output */
  level?: LogLevel;
  /** Name of the service */
  serviceName?: string;
  /** Version of the service */
  version?: string;
  /** Whether to enable console logging */
  enableConsole?: boolean;
  /** Whether to enable remote logging */
  enableRemoteLogging?: boolean;
  /** Custom context to include in all logs */
  globalContext?: LogContext;
}

/**
 * Log formatter function type
 */
export type LogFormatter = (entry: LogEntry) => string;

/**
 * Log transport function type
 */
export type LogTransport = (entry: LogEntry) => void | Promise<void>;

/**
 * Log metadata for structured logging
 */
export interface LogMetadata {
  /** Timestamp when the log was created */
  timestamp: Date;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Error object if available */
  error?: Error;
  /** Stack trace if available */
  stack?: string;
  /** Any additional context */
  [key: string]: unknown;
}

/**
 * Log filter function type
 */
export type LogFilter = (entry: LogEntry) => boolean;

/**
 * Log transformer function type
 */
export type LogTransformer = (entry: LogEntry) => LogEntry;

/**
 * Log handler function type
 */
export type LogHandler = (entry: LogEntry) => void;

/**
 * Log batch handler function type for batched logging
 */
export type BatchLogHandler = (entries: LogEntry[]) => Promise<void>;

/**
 * Log batch configuration
 */
export interface BatchConfig {
  /** Maximum number of logs to batch before sending */
  batchSize: number;
  /** Maximum time to wait before sending the batch (in ms) */
  batchTimeout: number;
}
