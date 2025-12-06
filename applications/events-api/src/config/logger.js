import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    return `${timestamp} [${level}]: ${message}\n${stack}`;
  }
  return `${timestamp} [${level}]: ${message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }), // Log the full stack trace
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport - always enabled
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }),
  ],
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// Add file transport for production ONLY if writable directory exists
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_FILE_LOGGING === 'true') {
  try {
    logger.add(
      new winston.transports.File({
        filename: '/tmp/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
    
    logger.add(
      new winston.transports.File({
        filename: '/tmp/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    // Silently fail if file logging can't be enabled
    console.error('Could not enable file logging:', error.message);
  }
}

export default logger;
