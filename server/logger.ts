/**
 * Simple structured logger for server processes
 * Mirrors the main application logger in src/lib/logger.ts
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  userId?: string
  roomId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

// ANSI color codes for console output
const colors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m'
}

// Determine log level from environment
const getLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase()
  if (envLevel === 'debug' || envLevel === 'info' || envLevel === 'warn' || envLevel === 'error') {
    return envLevel
  }
  // Default: debug in development, info in production
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const LOG_LEVEL = getLogLevel()
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

/**
 * Check if a log level should be printed
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[LOG_LEVEL]
}

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  const color = colors[entry.level]
  const reset = colors.reset
  const contextStr = entry.context ? `[${entry.context}]` : ''
  const userStr = entry.userId ? ` (user: ${entry.userId})` : ''
  const roomStr = entry.roomId ? ` (room: ${entry.roomId})` : ''
  const metaStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : ''
  const errorStr = entry.error ? `\n  Error: ${entry.error.message}${entry.error.stack ? `\n  Stack: ${entry.error.stack}` : ''}` : ''

  return `${color}[${entry.timestamp}] ${entry.level.toUpperCase()}:${reset} ${contextStr}${entry.message}${userStr}${roomStr}${metaStr}${errorStr}`
}

/**
 * Logger class for server processes
 */
class Logger {
  private currentContext?: string
  private currentUserId?: string
  private currentRoomId?: string

  /**
   * Set the default context for subsequent log calls
   */
  setContext(context: string): void {
    this.currentContext = context
  }

  /**
   * Set the user ID for subsequent log calls
   */
  setUserId(userId: string): void {
    this.currentUserId = userId
  }

  /**
   * Set the room ID for subsequent log calls
   */
  setRoomId(roomId: string): void {
    this.currentRoomId = roomId
  }

  /**
   * Clear all context
   */
  clearContext(): void {
    this.currentContext = undefined
    this.currentUserId = undefined
    this.currentRoomId = undefined
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata)
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata)
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: unknown, metadata?: Record<string, any>): void {
    const errorMeta = this.buildErrorMeta(error)
    const combinedMetadata = { ...metadata, ...errorMeta }
    this.log('error', message, combinedMetadata)
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.currentContext && { context: this.currentContext }),
      ...(this.currentUserId && { userId: this.currentUserId }),
      ...(this.currentRoomId && { roomId: this.currentRoomId }),
      ...(metadata && { ...metadata })
    }

    // In production, output JSON; in development, use pretty format
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry))
    } else {
      console.log(formatLogEntry(entry))
    }
  }

  /**
   * Build error metadata from error object
   */
  private buildErrorMeta(error?: unknown): Record<string, any> {
    if (!error) return {}

    if (error instanceof Error) {
      const meta: any = {
        error: {
          name: error.name,
          message: error.message
        }
      }
      if (error.stack) {
        meta.error.stack = error.stack
      }
      return meta
    }

    if (typeof error === 'string') {
      return {
        error: {
          name: 'Error',
          message: error
        }
      }
    }

    if (typeof error === 'object') {
      return {
        error: {
          name: (error as any).name || 'Error',
          message: (error as any).message || String(error),
          ...((error as any).stack && { stack: (error as any).stack })
        }
      }
    }

    return {
      error: {
        name: 'Error',
        message: String(error)
      }
    }
  }
}

// Create singleton logger instance
export const logger = new Logger()

/**
 * Create a child logger with a specific context
 */
export function createLogger(context: string): Logger {
  const childLogger = new Logger()
  childLogger.setContext(context)
  return childLogger
}

export default logger
