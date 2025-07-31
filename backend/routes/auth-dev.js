// File: /home/com2u/src/OrganAIzer/backend/routes/auth-dev.js
// Purpose: Development authentication bypass for testing without Azure AD

const express = require('express');
const jwt = require('jsonwebtoken');
const { logger } = require('../config/logger');

const router = express.Router();

// Development user for testing
const DEV_USER = {
  id: 'dev-user-123',
  email: 'dev@organaizer.app',
  name: 'Development User',
  firstName: 'Development',
  lastName: 'User',
  tenantId: 'dev-tenant'
};

// Generate JWT token for development user
const generateJWT = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' });
};

// Development authentication middleware
const requireAuth = (req, res, next) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'Development auth not available in production' 
    });
  }

  // In development, always consider user authenticated
  req.user = DEV_USER;
  req.session = req.session || {};
  req.session.user = DEV_USER;
  
  next();
};

// Routes for development authentication

// GET /auth/login - Development login (auto-login)
router.get('/login', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      error: 'Development auth not available in production' 
    });
  }

  logger.info('Development login initiated');

  // Generate JWT token
  const token = generateJWT(DEV_USER);
  
  // Store user in session
  req.session = req.session || {};
  req.session.user = DEV_USER;
  req.session.token = token;

  // Redirect to frontend
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3001';
  res.redirect(`${frontendUrl}/dashboard`);
});

// GET /auth/user - Get current user info
router.get('/user', requireAuth, (req, res) => {
  logger.debug('Development user info requested');

  res.json({
    id: DEV_USER.id,
    email: DEV_USER.email,
    name: DEV_USER.name,
    firstName: DEV_USER.firstName,
    lastName: DEV_USER.lastName,
    tenantId: DEV_USER.tenantId
  });
});

// POST /auth/logout - Development logout
router.post('/logout', (req, res) => {
  logger.info('Development user logged out');

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
        return res.status(500).json({ 
          error: 'Session cleanup failed' 
        });
      }
      res.json({ message: 'Logged out successfully' });
    });
  } else {
    res.json({ message: 'Logged out successfully' });
  }
});

// GET /auth/status - Check authentication status
router.get('/status', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.json({
      authenticated: false,
      user: null
    });
  }

  logger.debug('Development authentication status check');

  res.json({
    authenticated: true,
    user: {
      id: DEV_USER.id,
      email: DEV_USER.email,
      name: DEV_USER.name
    }
  });
});

module.exports = {
  router,
  requireAuth,
  generateJWT
};
