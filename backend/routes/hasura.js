// File: /home/com2u/src/OrganAIzer/backend/routes/hasura.js
// Purpose: Hasura GraphQL integration routes for OrganAIzer
// Provides REST API endpoints that interact with Hasura GraphQL

const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { logHasura, logError, logger } = require('../config/logger');
// Import auth middleware, but create development bypass
let originalVerifyJWT;
try {
  const authModule = require('./auth');
  originalVerifyJWT = authModule.verifyJWT;
} catch (error) {
  // Auth module not available, use fallback
  originalVerifyJWT = (req, res, next) => {
    return res.status(401).json({ error: 'Authentication required' });
  };
}

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
  
  // Fall back to original JWT verification
  return originalVerifyJWT(req, res, next);
};

const router = express.Router();

// Hasura configuration
const HASURA_ENDPOINT = process.env.REACT_APP_HASURA_ENDPOINT || 'http://hasura:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// Create Hasura client with proper headers
const createHasuraClient = (userToken = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Hasura-Admin-Secret': HASURA_ADMIN_SECRET
  };

  // In development, always use admin access
  // TODO: Implement proper role-based access control
  if (process.env.NODE_ENV === 'development') {
    // Use admin access in development
    return axios.create({
      baseURL: HASURA_ENDPOINT,
      headers,
      timeout: 30000
    });
  }

  // Add user context if token provided
  if (userToken) {
    headers['X-Hasura-User-Id'] = userToken.id;
    headers['X-Hasura-User-Email'] = userToken.email;
    headers['X-Hasura-Role'] = 'user';
  }

  return axios.create({
    baseURL: HASURA_ENDPOINT,
    headers,
    timeout: 30000
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

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Request validation failed', {
      errors: errors.array(),
      body: req.body,
      userId: req.user?.id
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Routes

// GET /api/entries - Get all entries with optional filtering
router.get('/entries', verifyJWT, async (req, res) => {
  try {
    const { status, type, label, limit = 50, offset = 0 } = req.query;
    
    const variables = { limit: parseInt(limit), offset: parseInt(offset) };

    // Build dynamic where clause
    const conditions = [];
    if (status) {
      conditions.push('status: {_eq: $status}');
      variables.status = status;
    }
    if (type) {
      conditions.push('type: {_eq: $type}');
      variables.type = type;
    }
    // TODO: Implement label filtering when entrylabels table is created
    // if (label) {
    //   conditions.push('entrylabels: {label: {_eq: $label}}');
    //   variables.label = label;
    // }

    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = `where: {${conditions.join(', ')}}, `;
    }

    const query = `
      query GetEntries($limit: Int!, $offset: Int!${status ? ', $status: String!' : ''}${type ? ', $type: String!' : ''}${label ? ', $label: String!' : ''}) {
        entry(${whereClause}limit: $limit, offset: $offset, order_by: {rank: desc, createdat: desc}) {
          key
          title
          content
          type
          status
          stars
          rank
          createdat
          updatedat
          createdby
          updatedby
          datetime
          entrylabels {
            label
          }
          voting {
            User
            voting
          }
        }
        entry_aggregate${conditions.length > 0 ? `(where: {${conditions.join(', ')}})` : ''} {
          aggregate {
            count
          }
        }
      }
    `;

    const result = await executeGraphQL(query, variables, req.user);

    res.json({
      entries: result.data.entry,
      total: result.data.entry_aggregate.aggregate.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logError(error, {
      context: 'get_entries',
      userId: req.user?.id,
      query: req.query
    });
    res.status(500).json({
      error: 'Failed to fetch entries',
      message: error.message
    });
  }
});

// GET /api/entries/:id - Get single entry by ID
router.get('/entries/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      query GetEntry($id: uuid!) {
        entry_by_pk(key: $id) {
          key
          title
          content
          type
          status
          stars
          rank
          datetime
          createdat
          updatedat
          createdby
          updatedby
          entrylabels {
            label
          }
          voting {
            voting
            User
          }
        }
      }
    `;

    const result = await executeGraphQL(query, { id }, req.user);

    if (!result.data.entry_by_pk) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    // Process the entry data to include labels properly
    const entry = result.data.entry_by_pk;
    const processedEntry = {
      ...entry,
      labels: entry.entrylabels?.map(el => el.label) || [],
      relations: entry.entryrelations?.map(er => ({
        type: er.relation?.relation,
        targetKey: er.targetentry?.key,
        targetTitle: er.targetentry?.title
      })) || []
    };

    res.json({
      success: true,
      entry: processedEntry
    });

  } catch (error) {
    logError(error, {
      context: 'get_entry_by_id',
      userId: req.user?.id,
      entryId: req.params.id
    });
    res.status(500).json({
      error: 'Failed to fetch entry',
      message: error.message
    });
  }
});

// POST /api/entries - Create new entry
router.post('/entries', 
  verifyJWT,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('type').isIn(['Info', 'ToDo', 'Note', 'Option']).withMessage('Invalid type'),
    body('status').isIn(['Open', 'Done', 'Active', 'Suspend']).withMessage('Invalid status')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { title, content, type, status, labels = [], relations = [] } = req.body;
      const { v4: uuidv4 } = require('uuid');
      const entryId = uuidv4();

      // Create the entry first
      const mutation = `
        mutation CreateEntry($entry: entry_insert_input!) {
          insert_entry_one(object: $entry) {
            key
            title
            content
            type
            status
            stars
            rank
            createdat
            createdby
          }
        }
      `;

      const entryData = {
        key: entryId,
        title,
        content,
        type,
        status,
        datetime: new Date().toISOString(),
        createdby: req.user.email,
        updatedby: req.user.email
      };

      const result = await executeGraphQL(mutation, { entry: entryData }, req.user);

      // Handle labels if provided
      if (labels && labels.length > 0) {
        const insertLabelsQuery = `
          mutation InsertEntryLabels($objects: [entrylabels_insert_input!]!) {
            insert_entrylabels(objects: $objects) {
              affected_rows
            }
          }
        `;

        const labelObjects = labels.map(label => ({
          entrykey: entryId,
          label: label
        }));

        await executeGraphQL(insertLabelsQuery, { objects: labelObjects }, req.user);
      }

      // TODO: Handle relations when EntryRelations table is properly configured in Hasura

      logger.info('Entry created successfully', {
        entryId,
        title,
        labelsCount: labels.length,
        userId: req.user.id,
        userEmail: req.user.email
      });

      res.status(201).json(result.data.insert_entry_one);

    } catch (error) {
      logError(error, {
        context: 'create_entry',
        userId: req.user?.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to create entry',
        message: error.message
      });
    }
  }
);

// PUT /api/entries/:id - Update entry
router.put('/entries/:id',
  verifyJWT,
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('type').optional().isIn(['Info', 'ToDo', 'Note', 'Option']).withMessage('Invalid type'),
    body('status').optional().isIn(['Open', 'Done', 'Active', 'Suspend']).withMessage('Invalid status')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { labels, relations, ...entryUpdates } = req.body;
      
      // Prepare entry updates (exclude labels and relations from direct update)
      delete entryUpdates.key; // Prevent key updates
      entryUpdates.updatedby = req.user.email;
      entryUpdates.updatedat = new Date().toISOString();

      // Update the entry first
      const updateEntryMutation = `
        mutation UpdateEntry($id: uuid!, $updates: entry_set_input!) {
          update_entry_by_pk(pk_columns: {key: $id}, _set: $updates) {
            key
            title
            content
            type
            status
            stars
            rank
            updatedat
            updatedby
          }
        }
      `;

      const entryResult = await executeGraphQL(updateEntryMutation, { id, updates: entryUpdates }, req.user);

      if (!entryResult.data.update_entry_by_pk) {
        return res.status(404).json({
          error: 'Entry not found'
        });
      }

      // Handle labels if provided
      if (labels !== undefined) {
        // First, delete existing labels for this entry
        const deleteLabelsQuery = `
          mutation DeleteEntryLabels($entryKey: uuid!) {
            delete_entrylabels(where: {entrykey: {_eq: $entryKey}}) {
              affected_rows
            }
          }
        `;

        await executeGraphQL(deleteLabelsQuery, { entryKey: id }, req.user);

        // Then, insert new labels if any
        if (labels && labels.length > 0) {
          const insertLabelsQuery = `
            mutation InsertEntryLabels($objects: [entrylabels_insert_input!]!) {
              insert_entrylabels(objects: $objects) {
                affected_rows
              }
            }
          `;

          const labelObjects = labels.map(label => ({
            entrykey: id,
            label: label
          }));

          await executeGraphQL(insertLabelsQuery, { objects: labelObjects }, req.user);
        }
      }

      // TODO: Handle relations when EntryRelations table is properly configured in Hasura

      logger.info('Entry updated successfully', {
        entryId: id,
        updates: entryUpdates,
        labelsCount: labels?.length || 0,
        userId: req.user.id
      });

      res.json(entryResult.data.update_entry_by_pk);

    } catch (error) {
      logError(error, {
        context: 'update_entry',
        userId: req.user?.id,
        entryId: req.params.id,
        body: req.body
      });
      res.status(500).json({
        error: 'Failed to update entry',
        message: error.message
      });
    }
  }
);

// DELETE /api/entries/:id - Delete entry
router.delete('/entries/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    // First, check if the entry exists
    const checkQuery = `
      query CheckEntry($id: uuid!) {
        entry_by_pk(key: $id) {
          key
          title
        }
      }
    `;

    const checkResult = await executeGraphQL(checkQuery, { id }, req.user);

    if (!checkResult.data.entry_by_pk) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    // Delete related records first to avoid foreign key constraint violations
    // Delete each related table separately to handle any missing tables gracefully
    try {
      // Delete entry labels
      const deleteLabelsQuery = `
        mutation DeleteEntryLabels($id: uuid!) {
          delete_entrylabels(where: {entrykey: {_eq: $id}}) {
            affected_rows
          }
        }
      `;
      await executeGraphQL(deleteLabelsQuery, { id }, req.user);
    } catch (error) {
      logger.warn('Failed to delete entry labels', { entryId: id, error: error.message });
    }

    try {
      // Delete voting records
      const deleteVotingQuery = `
        mutation DeleteVoting($id: uuid!) {
          delete_voting(where: {entrykey: {_eq: $id}}) {
            affected_rows
          }
        }
      `;
      await executeGraphQL(deleteVotingQuery, { id }, req.user);
    } catch (error) {
      logger.warn('Failed to delete voting records', { entryId: id, error: error.message });
    }

    try {
      // Delete entry relations
      const deleteRelationsQuery = `
        mutation DeleteEntryRelations($id: uuid!) {
          delete_entryrelations(where: {_or: [{entrykey: {_eq: $id}}, {targetentrykey: {_eq: $id}}]}) {
            affected_rows
          }
        }
      `;
      await executeGraphQL(deleteRelationsQuery, { id }, req.user);
    } catch (error) {
      logger.warn('Failed to delete entry relations', { entryId: id, error: error.message });
    }

    try {
      // Delete entry permissions
      const deletePermissionsQuery = `
        mutation DeleteEntryPermissions($id: uuid!) {
          delete_entrypermissions(where: {entrykey: {_eq: $id}}) {
            affected_rows
          }
        }
      `;
      await executeGraphQL(deletePermissionsQuery, { id }, req.user);
    } catch (error) {
      logger.warn('Failed to delete entry permissions', { entryId: id, error: error.message });
    }

    try {
      // Delete entry user relations
      const deleteUserRelationsQuery = `
        mutation DeleteEntryUserRelations($id: uuid!) {
          delete_entryuserrelation(where: {entrykey: {_eq: $id}}) {
            affected_rows
          }
        }
      `;
      await executeGraphQL(deleteUserRelationsQuery, { id }, req.user);
    } catch (error) {
      logger.warn('Failed to delete entry user relations', { entryId: id, error: error.message });
    }

    // Now delete the main entry
    const deleteEntryMutation = `
      mutation DeleteEntry($id: uuid!) {
        delete_entry_by_pk(key: $id) {
          key
          title
        }
      }
    `;

    const result = await executeGraphQL(deleteEntryMutation, { id }, req.user);

    logger.info('Entry and related records deleted successfully', {
      entryId: id,
      entryTitle: checkResult.data.entry_by_pk.title,
      userId: req.user.id
    });

    res.json({
      message: 'Entry deleted successfully',
      entry: result.data.delete_entry_by_pk
    });

  } catch (error) {
    logError(error, {
      context: 'delete_entry',
      userId: req.user?.id,
      entryId: req.params.id
    });
    res.status(500).json({
      error: 'Failed to delete entry',
      message: error.message
    });
  }
});

// GET /api/metadata - Get metadata (types, statuses, labels)
router.get('/metadata', verifyJWT, async (req, res) => {
  try {
    const query = `
      query GetMetadata {
        type {
          type
          description
          icon
        }
        status {
          status
          description
          color
          icon
        }
        labels {
          label
          description
          color
          icon
        }
      }
    `;

    const result = await executeGraphQL(query, {}, req.user);

    res.json({
      types: result.data.type,
      statuses: result.data.status,
      labels: result.data.labels
    });

  } catch (error) {
    logError(error, {
      context: 'get_metadata',
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to fetch metadata',
      message: error.message
    });
  }
});


// GET /api/types - Get all types
router.get('/types', verifyJWT, async (req, res) => {
  try {
    const query = `
      query GetTypes {
        type {
          type
          description
          icon
        }
      }
    `;

    const result = await executeGraphQL(query, {}, req.user);

    res.json({
      types: result.data.type || []
    });

  } catch (error) {
    logError(error, {
      context: 'get_types',
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to fetch types',
      message: error.message
    });
  }
});

// GET /api/statuses - Get all statuses
router.get('/statuses', verifyJWT, async (req, res) => {
  try {
    const query = `
      query GetStatuses {
        status {
          status
          description
          color
          icon
        }
      }
    `;

    const result = await executeGraphQL(query, {}, req.user);

    res.json({
      statuses: result.data.status || []
    });

  } catch (error) {
    logError(error, {
      context: 'get_statuses',
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to fetch statuses',
      message: error.message
    });
  }
});

// GET /api/labels - Get all labels
router.get('/labels', verifyJWT, async (req, res) => {
  try {
    const query = `
      query GetLabels {
        labels {
          label
          description
          color
          icon
        }
      }
    `;

    const result = await executeGraphQL(query, {}, req.user);

    res.json({
      labels: result.data.labels || []
    });

  } catch (error) {
    logError(error, {
      context: 'get_labels',
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to fetch labels',
      message: error.message
    });
  }
});

// GET /api/relations - Get all relations
router.get('/relations', verifyJWT, async (req, res) => {
  try {
    // TODO: Implement proper relation table in database schema
    // For now, return empty array to prevent frontend errors
    logger.info('Relations endpoint called - returning empty array (table not implemented)', {
      userId: req.user?.id
    });

    res.json({
      relations: []
    });

  } catch (error) {
    logError(error, {
      context: 'get_relations',
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Failed to fetch relations',
      message: error.message
    });
  }
});

// PUT /api/statuses/:id - Update status
router.put('/statuses/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, color, icon } = req.body;

    const mutation = `
      mutation UpdateStatus($status: String!, $updates: status_set_input!) {
        update_status_by_pk(pk_columns: {status: $status}, _set: $updates) {
          status
          description
          color
          icon
        }
      }
    `;

    const updates = {};
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (icon !== undefined) updates.icon = icon;

    const result = await executeGraphQL(mutation, { status: id, updates }, req.user);

    if (!result.data.update_status_by_pk) {
      return res.status(404).json({
        error: 'Status not found'
      });
    }

    logger.info('Status updated successfully', {
      statusId: id,
      updates,
      userId: req.user.id
    });

    res.json(result.data.update_status_by_pk);

  } catch (error) {
    logError(error, {
      context: 'update_status',
      userId: req.user?.id,
      statusId: req.params.id,
      body: req.body
    });
    res.status(500).json({
      error: 'Failed to update status',
      message: error.message
    });
  }
});

// GET /api/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const query = `
      query HealthCheck {
        __schema {
          queryType {
            name
          }
        }
      }
    `;

    await executeGraphQL(query);

    res.json({
      status: 'healthy',
      hasura: 'connected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError(error, { context: 'health_check' });
    res.status(503).json({
      status: 'unhealthy',
      hasura: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
