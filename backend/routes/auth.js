// File: /home/com2u/src/OrganAIzer/backend/routes/auth.js
// Purpose: Entra ID / Azure AD authentication routes for OrganAIzer
// Handles OAuth2 authentication flow with Microsoft Entra ID

const express = require('express');
const passport = require('passport');
const { OIDCStrategy } = require('passport-azure-ad');
const jwt = require('jsonwebtoken');
const { logAuth, logError, logger } = require('../config/logger');

const router = express.Router();

// Passport Azure AD OIDC Strategy Configuration
const azureConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid_configuration`,
  clientID: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  responseType: 'code',
  responseMode: 'form_post',
  redirectUrl: process.env.AZURE_REDIRECT_URI,
  allowHttpForRedirectUrl: process.env.NODE_ENV === 'development',
  validateIssuer: true,
  passReqToCallback: true,
  scope: process.env.AZURE_SCOPE.split(' '),
  loggingLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
  nonceLifetime: 600,
  nonceMaxAmount: 5,
  useCookieInsteadOfSession: false,
  cookieEncryptionKeys: [
    { key: process.env.JWT_SECRET, iv: process.env.JWT_SECRET.substring(0, 12) }
  ]
};

// Initialize Passport Azure AD Strategy
passport.use('azuread-openidconnect', new OIDCStrategy(azureConfig, 
  async (req, iss, sub, profile, accessToken, refreshToken, done) => {
    try {
      logger.info('Azure AD authentication callback received', {
        userId: profile.oid,
        email: profile.preferred_username,
        name: profile.name
      });

      // Create user object from Azure AD profile
      const user = {
        id: profile.oid,
        email: profile.preferred_username || profile.upn,
        name: profile.name || profile.displayName,
        firstName: profile.given_name,
        lastName: profile.family_name,
        tenantId: profile.tid,
        accessToken,
        refreshToken,
        profile: profile._json
      };

      logAuth('login_success', user, {
        provider: 'azure-ad',
        tenantId: profile.tid
      });

      return done(null, user);
    } catch (error) {
      logError(error, { 
        context: 'azure_ad_callback',
        profile: profile._json 
      });
      return done(error, null);
    }
  }
));

// Passport serialization
passport.serializeUser((user, done) => {
  logger.debug('Serializing user', { userId: user.id });
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // In a real application, you would fetch user from database
    // For now, we'll store user data in session
    logger.debug('Deserializing user', { userId: id });
    done(null, { id });
  } catch (error) {
    logError(error, { context: 'user_deserialization', userId: id });
    done(error, null);
  }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  logAuth('unauthorized_access', null, {
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(401).json({ 
    error: 'Unauthorized', 
    message: 'Authentication required' 
  });
};

// Generate JWT token for authenticated user
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

// Routes

// GET /auth/login - Initiate Azure AD login
router.get('/login', (req, res, next) => {
  logger.info('Login attempt initiated', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  logAuth('login_attempt', null, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/auth/error',
    failureFlash: true
  })(req, res, next);
});

// POST /auth/openid/return - Azure AD callback
router.post('/openid/return', 
  passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/auth/error',
    failureFlash: true
  }),
  (req, res) => {
    try {
      logger.info('Authentication successful', {
        userId: req.user.id,
        email: req.user.email
      });

      // Generate JWT token
      const token = generateJWT(req.user);
      
      // Store user in session
      req.session.user = req.user;
      req.session.token = token;

      logAuth('login_complete', req.user, {
        sessionId: req.sessionID
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : 'http://localhost:3000';
      
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      logError(error, { 
        context: 'auth_callback_processing',
        userId: req.user?.id 
      });
      res.redirect('/auth/error');
    }
  }
);

// GET /auth/user - Get current user info
router.get('/user', requireAuth, (req, res) => {
  try {
    const user = req.session.user;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'No user session found' 
      });
    }

    logger.debug('User info requested', { userId: user.id });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId
    });
  } catch (error) {
    logError(error, { 
      context: 'get_user_info',
      userId: req.user?.id 
    });
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// POST /auth/logout - Logout user
router.post('/logout', (req, res) => {
  const userId = req.user?.id || req.session?.user?.id;
  
  logAuth('logout', { id: userId }, {
    sessionId: req.sessionID
  });

  req.logout((err) => {
    if (err) {
      logError(err, { context: 'logout_error', userId });
      return res.status(500).json({ 
        error: 'Logout failed' 
      });
    }

    req.session.destroy((err) => {
      if (err) {
        logError(err, { context: 'session_destroy_error', userId });
        return res.status(500).json({ 
          error: 'Session cleanup failed' 
        });
      }

      logger.info('User logged out successfully', { userId });
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// GET /auth/error - Authentication error page
router.get('/error', (req, res) => {
  logger.warn('Authentication error page accessed', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    flash: req.flash()
  });

  res.status(401).json({
    error: 'Authentication failed',
    message: 'Unable to authenticate with Azure AD',
    details: req.flash('error')
  });
});

// GET /auth/status - Check authentication status
router.get('/status', (req, res) => {
  const isAuthenticated = req.isAuthenticated();
  const user = req.session?.user;

  logger.debug('Authentication status check', {
    isAuthenticated,
    userId: user?.id,
    sessionId: req.sessionID
  });

  res.json({
    authenticated: isAuthenticated,
    user: isAuthenticated && user ? {
      id: user.id,
      email: user.email,
      name: user.name
    } : null
  });
});

// Middleware to verify JWT token
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.query.token || 
                req.session?.token;

  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.debug('JWT verified successfully', { userId: decoded.id });
    next();
  } catch (error) {
    logError(error, { 
      context: 'jwt_verification',
      token: token.substring(0, 20) + '...' 
    });
    res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
};

module.exports = {
  router,
  requireAuth,
  verifyJWT,
  generateJWT
};
