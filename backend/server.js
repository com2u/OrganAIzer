// File: /home/com2u/src/OrganAIzer/backend/server.js
// Purpose: Main Express server for OrganAIzer Backend API
// Provides REST API with Entra ID authentication and Hasura integration

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Import custom modules
const { logger, logRequest, logError } = require('./config/logger');

// Use development auth in development mode, production auth otherwise
const authModule = process.env.NODE_ENV === 'development' 
  ? require('./routes/auth-dev')
  : require('./routes/auth');
const { router: authRoutes } = authModule;

const hasuraRoutes = require('./routes/hasura');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Disable ETags and caching in development
if (process.env.NODE_ENV === 'development') {
  app.set('etag', false);
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
  });
}

// Configure Express to handle larger headers
app.use(express.json({ 
  limit: '10mb',
  parameterLimit: 50000
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 50000
}));

// Increase header size limits for the server
app.use((req, res, next) => {
  // Set response headers to handle large requests
  res.setHeader('Access-Control-Max-Age', '86400');
  next();
});

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://login.microsoftonline.com", "http://localhost:8081"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Rate limiting - more permissive in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit in development
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }
});

// Apply rate limiting to all requests except health checks
app.use((req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  return limiter(req, res, next);
});

// CORS configuration - more permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://login.microsoftonline.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));


// HTTP request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info('HTTP Request', { message: message.trim() });
    }
  }
}));

// Custom request logging middleware
app.use(logRequest);

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'organaizer.sid'
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'organaizer-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'OrganAIzer Backend API',
    version: '1.0.0',
    description: 'REST API for OrganAIzer with Entra ID authentication and Hasura integration',
    endpoints: {
      authentication: {
        'GET /auth/login': 'Initiate Azure AD login',
        'POST /auth/openid/return': 'Azure AD callback',
        'GET /auth/user': 'Get current user info',
        'POST /auth/logout': 'Logout user',
        'GET /auth/status': 'Check authentication status'
      },
      entries: {
        'GET /api/entries': 'Get all entries with optional filtering',
        'GET /api/entries/:id': 'Get single entry by ID',
        'POST /api/entries': 'Create new entry',
        'PUT /api/entries/:id': 'Update entry',
        'DELETE /api/entries/:id': 'Delete entry'
      },
      metadata: {
        'GET /api/metadata': 'Get types, statuses, and labels',
        'GET /api/health': 'Health check for Hasura connection'
      },
      system: {
        'GET /health': 'System health check',
        'GET /api': 'API documentation'
      }
    },
    authentication: 'Bearer token or session-based',
    documentation: 'https://github.com/com2u/OrganAIzer'
  });
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/api', hasuraRoutes);
app.use('/api/entries', require('./routes/entries')); // Fixed path to match frontend expectations
app.use('/api/assemblies', require('./routes/assemblies'));
app.use('/api/reports', require('./routes/reports'));

// Debug AI route registration
try {
  const aiRoutes = require('./routes/ai');
  logger.info('AI routes loaded successfully', { type: typeof aiRoutes });
  app.use('/api/ai', aiRoutes);
  logger.info('AI routes registered at /api/ai');
} catch (error) {
  logger.error('Failed to load AI routes', { error: error.message, stack: error.stack });
}

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 Not Found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: '/api'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logError(error, {
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: req.user?.id,
    ip: req.ip
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: error.name || 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Configure server options for larger headers
const serverOptions = {
  // Increase header size limits
  maxHeaderSize: 32768, // 32KB instead of default 8KB
  headersTimeout: 60000, // 60 seconds
  requestTimeout: 300000 // 5 minutes
};

// Start server with custom options
const server = require('http').createServer(app);

// Apply server options
server.maxHeadersCount = 0; // No limit on header count
server.timeout = serverOptions.requestTimeout;
server.headersTimeout = serverOptions.headersTimeout;

server.listen(PORT, () => {
  logger.info('OrganAIzer Backend Server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    pid: process.pid,
    maxHeaderSize: serverOptions.maxHeaderSize,
    headersTimeout: serverOptions.headersTimeout,
    requestTimeout: serverOptions.requestTimeout
  });
  
  // Log configuration (without secrets)
  logger.info('Server configuration', {
    hasuraEndpoint: process.env.REACT_APP_HASURA_ENDPOINT,
    azureTenantId: process.env.AZURE_TENANT_ID,
    azureClientId: process.env.AZURE_CLIENT_ID,
    redirectUri: process.env.AZURE_REDIRECT_URI
  });
});

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(error, { context: 'uncaught_exception' });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(new Error(`Unhandled Rejection: ${reason}`), {
    context: 'unhandled_rejection',
    promise: promise.toString()
  });
  process.exit(1);
});

module.exports = app;
