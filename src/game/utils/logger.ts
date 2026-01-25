/**
 * @fileoverview Structured logging utility
 * @see docs/SPEC_KIT.md - This file follows the spec-kit contract
 * @see docs/QUALITY_GATES.md - Logging conventions
 */

/**
 * Log levels.
 */
export const enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Current log level (can be changed at runtime).
 */
let currentLevel: LogLevel = LogLevel.INFO;

/**
 * Check if running in development mode.
 */
const isDev = (): boolean => {
  try {
    return import.meta.env?.DEV ?? false;
  } catch {
    return false;
  }
};

/**
 * Format a log message with timestamp and level.
 */
function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString().slice(11, 23);
  return `[${timestamp}] [${level}] ${message}`;
}

/**
 * Logger utility for structured logging.
 */
export const logger = {
  /**
   * Set the minimum log level.
   */
  setLevel(level: LogLevel): void {
    currentLevel = level;
  },

  /**
   * Get the current log level.
   */
  getLevel(): LogLevel {
    return currentLevel;
  },

  /**
   * Log debug message (development only).
   */
  debug(message: string, ...args: unknown[]): void {
    if (currentLevel <= LogLevel.DEBUG && isDev()) {
      // Using console.log for debug as console.debug may be filtered
      // eslint-disable-next-line no-console
      console.log(formatMessage('DEBUG', message), ...args);
    }
  },

  /**
   * Log info message.
   */
  info(message: string, ...args: unknown[]): void {
    if (currentLevel <= LogLevel.INFO) {
      // eslint-disable-next-line no-console
      console.log(formatMessage('INFO', message), ...args);
    }
  },

  /**
   * Log warning message.
   */
  warn(message: string, ...args: unknown[]): void {
    if (currentLevel <= LogLevel.WARN) {
      console.warn(formatMessage('WARN', message), ...args);
    }
  },

  /**
   * Log error message.
   */
  error(message: string, ...args: unknown[]): void {
    if (currentLevel <= LogLevel.ERROR) {
      console.error(formatMessage('ERROR', message), ...args);
    }
  },

  /**
   * Log a group of related messages.
   */
  group(label: string): void {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.group(label);
    }
  },

  /**
   * End a log group.
   */
  groupEnd(): void {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  },

  /**
   * Log with timing.
   */
  time(label: string): void {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.time(label);
    }
  },

  /**
   * End timing log.
   */
  timeEnd(label: string): void {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.timeEnd(label);
    }
  },
};

// Set debug level in development
if (isDev()) {
  currentLevel = LogLevel.DEBUG;
}
