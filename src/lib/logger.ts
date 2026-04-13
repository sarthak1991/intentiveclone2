import winston from 'winston'

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Structured log entry interface
 */
export interface LogEntry {
  timestamp: string  // ISO 8601
  level: LogLevel
  message: string
  context?: string  // Module or component name
  userId?: string
  roomId?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel
  context?: string
  userId?: string
  roomId?: string
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

// Create winston logger instance
const winstonLogger = winston.createLogger({
  level: getLogLevel(),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'ISO 8601'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    // Use JSON format in production, pretty print in development
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, userId, roomId, error, ...metadata }) => {
            const contextStr = context ? `[${context}]` : ''
            const userStr = userId ? ` (user: ${userId})` : ''
            const roomStr = roomId ? ` (room: ${roomId})` : ''
            const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : ''
            const errorStr = error ? `\n  Error: ${error.message}${error.stack ? `\n  Stack: ${error.stack}` : ''}` : ''
            return `${timestamp} ${level}: ${contextStr}${message}${userStr}${roomStr}${metaStr}${errorStr}`
          })
        )
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
})

/**
 * Logger class with context management
 */
class Logger {
  private currentContext?: string
  private currentUserId?: string
  private currentRoomId?: string

  /**
   * Set the default context for subsequent log calls
   * @param context - Module or component name
   */
  setContext(context: string): void {
    this.currentContext = context
  }

  /**
   * Set the user ID for subsequent log calls
   * @param userId - User ID
   */
  setUserId(userId: string): void {
    this.currentUserId = userId
  }

  /**
   * Set the room ID for subsequent log calls
   * @param roomId - Room ID
   */
  setRoomId(roomId: string): void {
    this.currentRoomId = roomId
  }

  /**
   * Clear all context (userId, roomId, context)
   */
  clearContext(): void {
    this.currentContext = undefined
    this.currentUserId = undefined
    this.currentRoomId = undefined
  }

  /**
   * Log a debug message
   * @param message - Log message
   * @param metadata - Additional metadata
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata)
  }

  /**
   * Log an info message
   * @param message - Log message
   * @param metadata - Additional metadata
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata)
  }

  /**
   * Log a warning message
   * @param message - Log message
   * @param metadata - Additional metadata
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata)
  }

  /**
   * Log an error message
   * @param message - Log message
   * @param error - Error object
   * @param metadata - Additional metadata
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
    const logData: any = {
      level,
      message,
      ...(this.currentContext && { context: this.currentContext }),
      ...(this.currentUserId && { userId: this.currentUserId }),
      ...(this.currentRoomId && { roomId: this.currentRoomId }),
      ...(metadata && { ...metadata })
    }

    winstonLogger.log(logData)
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
 * @param context - Module or component name
 * @returns Logger instance with context set
 */
export function createLogger(context: string): Logger {
  const childLogger = new Logger()
  childLogger.setContext(context)
  return childLogger
}

/**
 * Get log entries from memory (for admin API)
 * Note: In production, use a log aggregation service instead
 * @param options - Filter options
 * @returns Array of log entries
 */
export function getLogEntries(options: {
  level?: LogLevel
  context?: string
  limit?: number
  offset?: number
}): LogEntry[] {
  // Note: This is a placeholder for now
  // In production, logs should be stored externally (Datadog, LogDNA, etc.)
  // or queried from a log aggregation service
  return []
}

export default logger
