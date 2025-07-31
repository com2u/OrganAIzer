// File: /home/com2u/src/OrganAIzer/backend/config/hasura.js
// Purpose: Centralized Hasura configuration and client management

const axios = require('axios');
const { logger, logHasura, logError } = require('./logger');

// Hasura configuration - single source of truth
const HASURA_CONFIG = {
  endpoint: process.env.REACT_APP_HASURA_ENDPOINT || 'http://hasura:8080/v1/graphql',
  adminSecret: process.env.REACT_APP_HASURA_ADMIN_SECRET || process.env.HASURA_GRAPHQL_ADMIN_SECRET,
  timeout: 30000
};

// Create Hasura client with proper headers
const createHasuraClient = (userToken = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  // In development, always use admin access (no role headers needed)
  if (process.env.NODE_ENV === 'development') {
    headers['X-Hasura-Admin-Secret'] = HASURA_CONFIG.adminSecret;
    return axios.create({
      baseURL: HASURA_CONFIG.endpoint,
      headers,
      timeout: HASURA_CONFIG.timeout
    });
  }

  // In production, use user role with admin secret
  headers['X-Hasura-Admin-Secret'] = HASURA_CONFIG.adminSecret;
  if (userToken) {
    headers['X-Hasura-User-Id'] = userToken.id;
    headers['X-Hasura-User-Email'] = userToken.email;
    headers['X-Hasura-Role'] = 'user';
  }

  return axios.create({
    baseURL: HASURA_CONFIG.endpoint,
    headers,
    timeout: HASURA_CONFIG.timeout
  });
};

// Execute GraphQL query/mutation
const executeGraphQL = async (query, variables = {}, userToken = null) => {
  try {
    const client = createHasuraClient(userToken);
    
    logger.debug('Executing Hasura GraphQL operation', {
      query: query.substring(0, 100) + '...',
      variables,
      userId: userToken?.id
    });

    const response = await client.post('', {
      query,
      variables
    });

    logHasura('graphql_operation', query, variables, response.data);

    if (response.data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data;
  } catch (error) {
    logError(error, {
      context: 'hasura_graphql_execution',
      query: query.substring(0, 100),
      variables,
      userId: userToken?.id
    });
    throw error;
  }
};

// Development authentication bypass
const verifyJWT = (req, res, next) => {
  // In development mode, always authenticate with dev user
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'dev-user-123',
      email: 'dev@organaizer.app',
      name: 'Development User'
    };
    logger.debug('Development auth: User authenticated automatically', { userId: req.user.id });
    return next();
  }
  
  // In production, require proper authentication
  return res.status(401).json({ error: 'Authentication required' });
};

// Middleware to add Hasura client to requests
const addHasuraClient = (req, res, next) => {
  req.hasura = {
    query: (query, variables = {}) => executeGraphQL(query, variables, req.user)
  };
  next();
};

module.exports = {
  HASURA_CONFIG,
  createHasuraClient,
  executeGraphQL,
  verifyJWT,
  addHasuraClient
};
