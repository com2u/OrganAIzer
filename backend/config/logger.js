// File: /home/com2u/src/OrganAIzer/backend/config/logger.js
// Purpose: Professional logging configuration for OrganAIzer Backend
// Provides structured logging with rotation and different log levels

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');

// Ensure logs directory exists with proper error handling
let canWriteLogs = true;
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o755 });
  }
  
  // Test write permissions by creating a test file
  const testFile = path.join(logsDir, 'test-write.log');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
} catch (error) {
  console.warn('Warning: Cannot write to logs directory:', error.message);
  console.warn('File logging will be disabled, using console only');
  canWriteLogs = false;
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create transports array conditionally
const transports = [];

// Add file transports only if we can write logs
if (canWriteLogs) {
  transports.push(
    // Error log file
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Combined log file
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),
    
    // Authentication specific log
    new DailyRotateFile({
      filename: path.join(logsDir, 'auth-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.label({ label: 'AUTH' })
      )
    }),
    
    // API requests log
    new DailyRotateFile({
      filename: path.join(logsDir, 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.label({ label: 'API' })
      )
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'organaizer-backend',
    version: '1.0.0'
  },
  transports,
  exitOnError: false, // Don't exit on handled exceptions
  
  // Handle exceptions and rejections only if we can write logs
  exceptionHandlers: canWriteLogs ? [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ] : [
    new winston.transports.Console({
      format: consoleFormat
    })
  ],
  
  rejectionHandlers: canWriteLogs ? [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ] : [
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create specialized loggers for different components
const authLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'AUTH' }),
    winston.format.json()
  ),
  defaultMeta: { component: 'authentication' },
  transports: canWriteLogs ? [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'auth.log'),
      level: 'info'
    })
  ] : [
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info'
    })
  ]
});

const apiLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'API' }),
    winston.format.json()
  ),
  defaultMeta: { component: 'api' },
  transports: canWriteLogs ? [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'api.log'),
      level: 'info'
    })
  ] : [
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info'
    })
  ]
});

const hasuraLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({ label: 'HASURA' }),
    winston.format.json()
  ),
  defaultMeta: { component: 'hasura' },
  transports: canWriteLogs ? [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'hasura.log'),
      level: 'info'
    })
  ] : [
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info'
    })
  ]
});

// Helper functions for structured logging
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? req.user.id : 'anonymous'
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

const logAuth = (action, user, details = {}) => {
  authLogger.info('Authentication Event', {
    action,
    userId: user ? user.id : 'unknown',
    userEmail: user ? user.email : 'unknown',
    timestamp: new Date().toISOString(),
    ...details
  });
};

const logHasura = (operation, query, variables = {}, result = {}) => {
  hasuraLogger.info('Hasura Operation', {
    operation,
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    variables,
    success: !result.errors,
    errors: result.errors || null,
    timestamp: new Date().toISOString()
  });
};

const logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  authLogger,
  apiLogger,
  hasuraLogger,
  logRequest,
  logAuth,
  logHasura,
  logError
};
