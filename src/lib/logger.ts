/**
 * Structured logger for AWS CloudWatch compatibility
 * Outputs JSON logs that CloudWatch can parse and index
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    environment: process.env.NODE_ENV,
  };

  // In production, output pure JSON for CloudWatch
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    // In dev, make it readable
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `[${level.toUpperCase()}] ${message}`,
      context || ''
    );
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
  debug: (message: string, context?: LogContext) => log('debug', message, context),
};
