// File: /home/com2u/src/OrganAIzer/backend/routes/entries.js
// Purpose: Entry management routes including rank reordering

const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { logger, logHasura, logError } = require('../config/logger');

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
  if (process.env.NODE_ENV === 'development') {
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

// Add Hasura middleware to requests
router.use((req, res, next) => {
  req.hasura = {
    query: (query, variables = {}) => executeGraphQL(query, variables, req.user)
  };
  next();
});

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

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Created uploads directory', { path: uploadsDir });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create date-based subdirectory
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const dateDir = path.join(uploadsDir, year.toString(), month, day);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }
    
    cb(null, dateDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and UUID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    const filename = `${timestamp}_${uniqueId}_${name}${ext}`;
    cb(null, filename);
  }
});

// Configure multer with file filtering
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Upload file endpoint
 * POST /api/entries/upload
 * Body: multipart/form-data with 'file' field
 */
router.post('/upload', verifyJWT, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const file = req.file;

    logger.info('File uploaded successfully', {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      userId
    });

    // Generate public URL for the file
    // Remove the uploads directory prefix and create relative path
    const relativePath = path.relative(uploadsDir, file.path);
    const publicUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: publicUrl
      }
    });

  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

/**
 * Update entry rank and reorder other entries as needed
 * POST /api/entries/reorder
 * Body: { entryKey, newRank, assemblyFilter? }
 */
router.post('/reorder', verifyJWT, async (req, res) => {
  try {
    const { entryKey, newRank, assemblyFilter } = req.body;
    
    if (!entryKey || typeof newRank !== 'number') {
      return res.status(400).json({
        error: 'entryKey and newRank are required'
      });
    }

    logger.info('Reordering entry', { 
      entryKey, 
      newRank, 
      assemblyFilter,
      user: req.user?.id 
    });

    // Get current entry
    const getCurrentEntryQuery = `
      query GetCurrentEntry($entryKey: uuid!) {
        entry(where: {key: {_eq: $entryKey}}) {
          key
          rank
          title
        }
      }
    `;

    const currentEntryResult = await req.hasura.query(getCurrentEntryQuery, {
      entryKey
    });

    if (!currentEntryResult.data.entry.length) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    const currentEntry = currentEntryResult.data.entry[0];
    const oldRank = currentEntry.rank;

    // If rank hasn't changed, no need to update
    if (oldRank === newRank) {
      return res.json({
        success: true,
        message: 'No rank change needed',
        entry: currentEntry
      });
    }

    // Build filter conditions for assembly if provided
    let assemblyWhereClause = {};
    if (assemblyFilter) {
      // Apply assembly filters to determine which entries to reorder
      if (assemblyFilter.types && assemblyFilter.types.length > 0) {
        assemblyWhereClause.type = { _in: assemblyFilter.types };
      }
      if (assemblyFilter.statuses && assemblyFilter.statuses.length > 0) {
        assemblyWhereClause.status = { _in: assemblyFilter.statuses };
      }
      if (assemblyFilter.labels && assemblyFilter.labels.length > 0) {
        // This would need a more complex query for label filtering
        // For now, we'll handle it in the frontend
      }
      if (assemblyFilter.dateFrom || assemblyFilter.dateTo) {
        assemblyWhereClause.createdAt = {};
        if (assemblyFilter.dateFrom) {
          assemblyWhereClause.createdAt._gte = assemblyFilter.dateFrom;
        }
        if (assemblyFilter.dateTo) {
          assemblyWhereClause.createdAt._lte = assemblyFilter.dateTo;
        }
      }
    }

    // Determine which entries need rank updates
    let entriesToUpdate = [];
    
    if (newRank > oldRank) {
      // Moving down: decrease rank of entries between old and new position
      const getEntriesQuery = `
        query GetEntriesToReorder($oldRank: float8!, $newRank: float8!) {
          entry(
            where: {
              rank: {_gt: $oldRank, _lte: $newRank}
              ${Object.keys(assemblyWhereClause).length > 0 ? 
                ', ' + Object.keys(assemblyWhereClause).map(key => 
                  `${key}: ${JSON.stringify(assemblyWhereClause[key])}`
                ).join(', ') : ''
              }
            }
            order_by: {rank: asc}
          ) {
            key
            rank
            title
          }
        }
      `;

      const entriesResult = await req.hasura.query(getEntriesQuery, {
        oldRank,
        newRank
      });

      entriesToUpdate = entriesResult.data.entry.map(entry => ({
        key: entry.key,
        newRank: entry.rank - 1
      }));

    } else {
      // Moving up: increase rank of entries between new and old position
      const getEntriesQuery = `
        query GetEntriesToReorder($oldRank: float8!, $newRank: float8!) {
          entry(
            where: {
              rank: {_gte: $newRank, _lt: $oldRank}
              ${Object.keys(assemblyWhereClause).length > 0 ? 
                ', ' + Object.keys(assemblyWhereClause).map(key => 
                  `${key}: ${JSON.stringify(assemblyWhereClause[key])}`
                ).join(', ') : ''
              }
            }
            order_by: {rank: asc}
          ) {
            key
            rank
            title
          }
        }
      `;

      const entriesResult = await req.hasura.query(getEntriesQuery, {
        oldRank,
        newRank
      });

      entriesToUpdate = entriesResult.data.entry.map(entry => ({
        key: entry.key,
        newRank: entry.rank + 1
      }));
    }

    // Update all affected entries in a transaction-like manner
    const updatePromises = [];

    // Update the main entry
    const updateMainEntryQuery = `
      mutation UpdateEntryRank($entryKey: uuid!, $newRank: float8!) {
        update_entry(
          where: {key: {_eq: $entryKey}}
          _set: {rank: $newRank, updatedat: "now()"}
        ) {
          affected_rows
          returning {
            key
            rank
            title
          }
        }
      }
    `;

    updatePromises.push(
      req.hasura.query(updateMainEntryQuery, {
        entryKey,
        newRank
      })
    );

    // Update other affected entries
    for (const entry of entriesToUpdate) {
      const updateEntryQuery = `
        mutation UpdateEntryRank($entryKey: uuid!, $newRank: float8!) {
          update_entry(
            where: {key: {_eq: $entryKey}}
            _set: {rank: $newRank, updatedat: "now()"}
          ) {
            affected_rows
          }
        }
      `;

      updatePromises.push(
        req.hasura.query(updateEntryQuery, {
          entryKey: entry.key,
          newRank: entry.newRank
        })
      );
    }

    // Execute all updates
    const results = await Promise.all(updatePromises);
    
    // Check if all updates were successful
    const totalAffectedRows = results.reduce((sum, result) => {
      return sum + (result.data.update_entry?.affected_rows || 0);
    }, 0);

    logger.info('Rank reorder completed', {
      entryKey,
      oldRank,
      newRank,
      affectedEntries: entriesToUpdate.length + 1,
      totalAffectedRows
    });

    res.json({
      success: true,
      message: 'Entry rank updated successfully',
      entry: results[0].data.update_entry.returning[0],
      affectedEntries: entriesToUpdate.length + 1,
      reorderedEntries: entriesToUpdate
    });

  } catch (error) {
    logger.error('Error reordering entry:', error);
    res.status(500).json({
      error: 'Failed to reorder entry',
      details: error.message
    });
  }
});

/**
 * Vote on an entry
 * POST /api/entries/vote
 * Body: { entryKey, vote } where vote is -1, 0, or 1
 */
router.post('/vote', verifyJWT, async (req, res) => {
  try {
    const { entryKey, vote } = req.body;
    const userId = req.user.id;

    if (!entryKey || typeof vote !== 'number' || vote < -1 || vote > 1) {
      return res.status(400).json({
        error: 'entryKey and vote (-1, 0, or 1) are required'
      });
    }

    logger.info('Processing vote', { 
      entryKey, 
      vote, 
      userId 
    });

    // First, check if user has already voted on this entry
    const getUserVoteQuery = `
      query GetUserVote($entryKey: uuid!, $userId: String!) {
        voting(where: {entrykey: {_eq: $entryKey}, User: {_eq: $userId}}) {
          voting
        }
      }
    `;

    const userVoteResult = await req.hasura.query(getUserVoteQuery, {
      entryKey,
      userId
    });

    const existingVote = userVoteResult.data.voting[0]?.voting || 0;

    // Calculate vote difference for updating total
    const voteDifference = vote - existingVote;

    // Update or insert user vote
    if (userVoteResult.data.voting.length > 0) {
      // Update existing vote
      const updateVoteQuery = `
        mutation UpdateUserVote($entryKey: uuid!, $userId: String!, $vote: Int!) {
          update_voting(
            where: {entrykey: {_eq: $entryKey}, User: {_eq: $userId}}
            _set: {voting: $vote}
          ) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(updateVoteQuery, {
        entryKey,
        userId,
        vote
      });
    } else {
      // Insert new vote
      const insertVoteQuery = `
        mutation InsertUserVote($entryKey: uuid!, $userId: String!, $vote: Int!) {
          insert_voting(objects: [{
            entrykey: $entryKey,
            User: $userId,
            voting: $vote
          }]) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(insertVoteQuery, {
        entryKey,
        userId,
        vote
      });
    }

    // Get the new total votes by aggregating all votes for this entry
    const getTotalVotesQuery = `
      query GetTotalVotes($entryKey: uuid!) {
        voting_aggregate(where: {entrykey: {_eq: $entryKey}}) {
          aggregate {
            sum {
              voting
            }
          }
        }
      }
    `;

    const totalVotesResult = await req.hasura.query(getTotalVotesQuery, {
      entryKey
    });

    const totalVotes = totalVotesResult.data.voting_aggregate.aggregate.sum.voting || 0;

    logger.info('Vote processed successfully', {
      entryKey,
      userId,
      vote,
      previousVote: existingVote,
      newTotalVotes: totalVotes
    });

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      userVote: vote,
      totalVotes: totalVotes,
      entryKey
    });

  } catch (error) {
    logger.error('Error processing vote:', error);
    res.status(500).json({
      error: 'Failed to process vote',
      details: error.message
    });
  }
});

/**
 * Rate an entry with stars
 * POST /api/entries/rate
 * Body: { entryKey, rating } where rating is 0-5 in 0.5 increments
 */
router.post('/rate', verifyJWT, async (req, res) => {
  try {
    const { entryKey, rating } = req.body;
    const userId = req.user.id;

    if (!entryKey || typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({
        error: 'entryKey and rating (0-5) are required'
      });
    }

    logger.info('Processing rating', { 
      entryKey, 
      rating, 
      userId 
    });

    // Check if user has already rated this entry
    const getUserRatingQuery = `
      query GetUserRating($entryKey: uuid!, $userId: String!) {
        entryrating(where: {entrykey: {_eq: $entryKey}, userid: {_eq: $userId}}) {
          rating
        }
      }
    `;

    const userRatingResult = await req.hasura.query(getUserRatingQuery, {
      entryKey,
      userId
    });

    const existingRating = userRatingResult.data.entryrating[0]?.rating || 0;

    // Update or insert user rating
    if (userRatingResult.data.entryrating.length > 0) {
      // Update existing rating
      const updateRatingQuery = `
        mutation UpdateUserRating($entryKey: uuid!, $userId: String!, $rating: Float!) {
          update_entryrating(
            where: {entrykey: {_eq: $entryKey}, userid: {_eq: $userId}}
            _set: {rating: $rating, updatedat: "now()"}
          ) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(updateRatingQuery, {
        entryKey,
        userId,
        rating
      });
    } else {
      // Insert new rating
      const insertRatingQuery = `
        mutation InsertUserRating($entryKey: uuid!, $userId: String!, $rating: Float!) {
          insert_entryrating(objects: [{
            entrykey: $entryKey,
            userid: $userId,
            rating: $rating,
            createdat: "now()",
            updatedat: "now()"
          }]) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(insertRatingQuery, {
        entryKey,
        userId,
        rating
      });
    }

    // Recalculate average stars for the entry
    const getAverageRatingQuery = `
      query GetAverageRating($entryKey: uuid!) {
        entryrating_aggregate(where: {entrykey: {_eq: $entryKey}}) {
          aggregate {
            avg {
              rating
            }
            count
          }
        }
      }
    `;

    const avgResult = await req.hasura.query(getAverageRatingQuery, {
      entryKey
    });

    const averageRating = avgResult.data.entryrating_aggregate.aggregate.avg.rating || 0;
    const roundedAverage = Math.round(averageRating * 2) / 2; // Round to nearest 0.5

    // Update the entry's stars field
    const updateEntryStarsQuery = `
      mutation UpdateEntryStars($entryKey: uuid!, $stars: Float!) {
        update_entry(
          where: {key: {_eq: $entryKey}}
          _set: {stars: $stars, updatedat: "now()"}
        ) {
          affected_rows
          returning {
            key
            stars
          }
        }
      }
    `;

    const updateResult = await req.hasura.query(updateEntryStarsQuery, {
      entryKey,
      stars: roundedAverage
    });

    if (updateResult.data.update_entry.affected_rows === 0) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    const updatedEntry = updateResult.data.update_entry.returning[0];

    logger.info('Rating processed successfully', {
      entryKey,
      userId,
      rating,
      previousRating: existingRating,
      newAverageStars: updatedEntry.stars
    });

    res.json({
      success: true,
      message: 'Rating recorded successfully',
      userRating: rating,
      averageStars: updatedEntry.stars,
      entryKey
    });

  } catch (error) {
    logger.error('Error processing rating:', error);
    res.status(500).json({
      error: 'Failed to process rating',
      details: error.message
    });
  }
});

/**
 * Search entries by title or content
 * GET /api/entries/search
 * Query: search (string)
 */
router.get('/search', async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim().length === 0) {
      return res.json({
        success: true,
        entries: []
      });
    }

    logger.info('Searching entries', { 
      searchTerm: search,
      userId: req.user?.id 
    });

    // Search in title and content using ILIKE for case-insensitive search
    const searchEntriesQuery = `
      query SearchEntries($searchTerm: String!) {
        entry(
          where: {
            _or: [
              {title: {_ilike: $searchTerm}},
              {content: {_ilike: $searchTerm}}
            ]
          }
          order_by: {rank: asc}
          limit: 50
        ) {
          key
          title
          content
          type
          status
          rank
          stars
          createdAt
          updatedAt
          createdBy
          voting {
            voting
            user
          }
          entrylabels {
            label {
              label
            }
          }
        }
      }
    `;

    const searchTerm = `%${search.trim()}%`;
    const result = await req.hasura.query(searchEntriesQuery, {
      searchTerm
    });

    // Process the results to match expected format
    const processedEntries = result.data.entry.map(entry => ({
      key: entry.key,
      title: entry.title,
      content: entry.content,
      type: entry.type,
      status: entry.status,
      rank: entry.rank,
      stars: entry.stars,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      createdBy: entry.createdBy,
      voting: entry.voting || [],
      entrylabels: entry.entrylabels || []
    }));

    logger.info('Search completed', {
      searchTerm: search,
      resultsCount: processedEntries.length
    });

    res.json({
      success: true,
      entries: processedEntries
    });

  } catch (error) {
    logger.error('Error searching entries:', error);
    res.status(500).json({
      error: 'Failed to search entries',
      details: error.message
    });
  }
});

/**
 * Get all entries with filtering and pagination
 * GET /api/entries
 * Query: type, status, label, limit, offset, search
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, label, limit = 20, offset = 0, search } = req.query;

    // Build where clause
    let whereClause = {};
    
    if (type) {
      whereClause.type = { _eq: type };
    }
    if (status) {
      whereClause.status = { _eq: status };
    }
    if (search) {
      whereClause._or = [
        { title: { _ilike: `%${search}%` } },
        { content: { _ilike: `%${search}%` } }
      ];
    }

    const getEntriesQuery = `
      query GetEntries($limit: Int!, $offset: Int!) {
        entry(
          ${Object.keys(whereClause).length > 0 ? 
            `where: ${JSON.stringify(whereClause)}` : ''
          }
          order_by: {rank: asc}
          limit: $limit
          offset: $offset
        ) {
          key
          title
          content
          type
          status
          rank
          stars
          createdat
          updatedat
          createdby
          voting {
            voting
            user
          }
          entrylabels {
            label {
              label
              color
            }
          }
        }
        entry_aggregate(
          ${Object.keys(whereClause).length > 0 ? 
            `where: ${JSON.stringify(whereClause)}` : ''
          }
        ) {
          aggregate {
            count
          }
        }
      }
    `;

    const result = await req.hasura.query(getEntriesQuery, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Process entries to include labels properly
    const processedEntries = result.data.entry.map(entry => ({
      ...entry,
      labels: entry.entrylabels?.map(el => el.label?.label) || []
    }));

    res.json({
      success: true,
      entries: processedEntries,
      total: result.data.entry_aggregate.aggregate.count
    });

  } catch (error) {
    logger.error('Error fetching entries:', error);
    res.status(500).json({
      error: 'Failed to fetch entries',
      details: error.message
    });
  }
});

/**
 * Get a single entry by ID
 * GET /api/entries/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    logger.info('Fetching entry', { entryId: id, userId: req.user?.id });

    const getEntryQuery = `
      query GetEntry($entryKey: uuid!) {
        entry(where: {key: {_eq: $entryKey}}) {
          key
          title
          content
          type
          status
          rank
          stars
          createdat
          updatedat
          createdby
          voting {
            voting
            user
          }
          entrylabels {
            label {
              label
              color
            }
          }
          entryrelations {
            relation {
              relation
            }
            targetentry {
              key
              title
            }
          }
        }
      }
    `;

    const result = await req.hasura.query(getEntryQuery, {
      entryKey: id
    });

    if (!result.data.entry.length) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    const entry = result.data.entry[0];

    // Process the entry data
    const processedEntry = {
      ...entry,
      labels: entry.entrylabels?.map(el => el.label?.label) || [],
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
    logger.error('Error fetching entry:', error);
    res.status(500).json({
      error: 'Failed to fetch entry',
      details: error.message
    });
  }
});

/**
 * Create a new entry
 * POST /api/entries
 * Body: { title, content, type, status, labels?, relations? }
 */
router.post('/', verifyJWT, async (req, res) => {
  try {
    const { title, content, type, status, labels = [], relations = [] } = req.body;
    const userId = req.user.id;

    if (!title || !content || !type || !status) {
      return res.status(400).json({
        error: 'title, content, type, and status are required'
      });
    }

    logger.info('Creating entry', { 
      title, 
      type, 
      status, 
      userId,
      labelsCount: labels.length,
      relationsCount: relations.length
    });

    // Get the next rank
    const getMaxRankQuery = `
      query GetMaxRank {
        entry_aggregate {
          aggregate {
            max {
              rank
            }
          }
        }
      }
    `;

    const maxRankResult = await req.hasura.query(getMaxRankQuery);
    const nextRank = (maxRankResult.data.entry_aggregate.aggregate.max.rank || 0) + 1;

    // Create the entry
    const createEntryQuery = `
      mutation CreateEntry($title: String!, $content: String!, $type: String!, $status: String!, $rank: float8!, $userId: String!) {
        insert_entry(objects: [{
          title: $title,
          content: $content,
          type: $type,
          status: $status,
          rank: $rank,
          createdby: $userId,
          createdat: "now()",
          updatedat: "now()"
        }]) {
          affected_rows
          returning {
            key
            title
            content
            type
            status
            rank
            stars
            createdat
            updatedat
            createdby
          }
        }
      }
    `;

    const createResult = await req.hasura.query(createEntryQuery, {
      title,
      content,
      type,
      status,
      rank: nextRank,
      userId
    });

    const newEntry = createResult.data.insert_entry.returning[0];

    // Add labels if provided
    if (labels.length > 0) {
      const labelObjects = labels.map(label => ({
        entrykey: newEntry.key,
        label: label
      }));

      const addLabelsQuery = `
        mutation AddEntryLabels($objects: [entrylabels_insert_input!]!) {
          insert_entrylabels(objects: $objects) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(addLabelsQuery, {
        objects: labelObjects
      });
    }

    // Add relations if provided
    if (relations.length > 0) {
      const relationObjects = relations.map(relation => ({
        entrykey: newEntry.key,
        relation: relation.type,
        targetentrykey: relation.targetKey
      }));

      const addRelationsQuery = `
        mutation AddEntryRelations($objects: [entryrelations_insert_input!]!) {
          insert_entryrelations(objects: $objects) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(addRelationsQuery, {
        objects: relationObjects
      });
    }

    logger.info('Entry created successfully', {
      entryKey: newEntry.key,
      title: newEntry.title,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      entry: {
        ...newEntry,
        labels,
        relations
      }
    });

  } catch (error) {
    logger.error('Error creating entry:', error);
    res.status(500).json({
      error: 'Failed to create entry',
      details: error.message
    });
  }
});

/**
 * Update an entry
 * PUT /api/entries/:id
 * Body: { title?, content?, type?, status?, labels?, relations? }
 */
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, status, labels, relations } = req.body;
    const userId = req.user.id;

    logger.info('Updating entry', { 
      entryId: id, 
      userId,
      hasLabels: !!labels,
      hasRelations: !!relations
    });

    // Build update object
    const updateFields = { updatedat: "now()" };
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (type !== undefined) updateFields.type = type;
    if (status !== undefined) updateFields.status = status;

    // Update the entry
    const updateEntryQuery = `
      mutation UpdateEntry($entryKey: uuid!, $updateFields: entry_set_input!) {
        update_entry(
          where: {key: {_eq: $entryKey}}
          _set: $updateFields
        ) {
          affected_rows
          returning {
            key
            title
            content
            type
            status
            rank
            stars
            createdat
            updatedat
            createdby
          }
        }
      }
    `;

    const updateResult = await req.hasura.query(updateEntryQuery, {
      entryKey: id,
      updateFields
    });

    if (updateResult.data.update_entry.affected_rows === 0) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    const updatedEntry = updateResult.data.update_entry.returning[0];

    // Update labels if provided
    if (labels !== undefined) {
      // Delete existing labels
      const deleteLabelsQuery = `
        mutation DeleteEntryLabels($entryKey: uuid!) {
          delete_entrylabels(where: {entrykey: {_eq: $entryKey}}) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(deleteLabelsQuery, {
        entryKey: id
      });

      // Add new labels
      if (labels.length > 0) {
        const labelObjects = labels.map(label => ({
          entrykey: id,
          label: label
        }));

        const addLabelsQuery = `
          mutation AddEntryLabels($objects: [entrylabels_insert_input!]!) {
            insert_entrylabels(objects: $objects) {
              affected_rows
            }
          }
        `;

        await req.hasura.query(addLabelsQuery, {
          objects: labelObjects
        });
      }
    }

    // Update relations if provided
    if (relations !== undefined) {
      // Delete existing relations
      const deleteRelationsQuery = `
        mutation DeleteEntryRelations($entryKey: uuid!) {
          delete_entryrelations(where: {entrykey: {_eq: $entryKey}}) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(deleteRelationsQuery, {
        entryKey: id
      });

      // Add new relations
      if (relations.length > 0) {
        const relationObjects = relations.map(relation => ({
          entrykey: id,
          relation: relation.type,
          targetentrykey: relation.targetKey
        }));

        const addRelationsQuery = `
          mutation AddEntryRelations($objects: [entryrelations_insert_input!]!) {
            insert_entryrelations(objects: $objects) {
              affected_rows
            }
          }
        `;

        await req.hasura.query(addRelationsQuery, {
          objects: relationObjects
        });
      }
    }

    logger.info('Entry updated successfully', {
      entryKey: updatedEntry.key,
      title: updatedEntry.title,
      userId
    });

    res.json({
      success: true,
      message: 'Entry updated successfully',
      entry: {
        ...updatedEntry,
        labels: labels || [],
        relations: relations || []
      }
    });

  } catch (error) {
    logger.error('Error updating entry:', error);
    res.status(500).json({
      error: 'Failed to update entry',
      details: error.message
    });
  }
});

/**
 * Delete an entry
 * DELETE /api/entries/:id
 */
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info('Deleting entry', { entryId: id, userId });

    // Delete the entry (cascading deletes should handle related data)
    const deleteEntryQuery = `
      mutation DeleteEntry($entryKey: uuid!) {
        delete_entry(where: {key: {_eq: $entryKey}}) {
          affected_rows
          returning {
            key
            title
          }
        }
      }
    `;

    const deleteResult = await req.hasura.query(deleteEntryQuery, {
      entryKey: id
    });

    if (deleteResult.data.delete_entry.affected_rows === 0) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    const deletedEntry = deleteResult.data.delete_entry.returning[0];

    logger.info('Entry deleted successfully', {
      entryKey: deletedEntry.key,
      title: deletedEntry.title,
      userId
    });

    res.json({
      success: true,
      message: 'Entry deleted successfully',
      entry: deletedEntry
    });

  } catch (error) {
    logger.error('Error deleting entry:', error);
    res.status(500).json({
      error: 'Failed to delete entry',
      details: error.message
    });
  }
});

/**
 * Get entries with proper rank ordering for assembly
 * GET /api/entries/ordered
 * Query: assemblyFilter (JSON string)
 */
router.get('/ordered', async (req, res) => {
  try {
    const assemblyFilter = req.query.assemblyFilter ? 
      JSON.parse(req.query.assemblyFilter) : {};

    // Build where clause based on assembly filter
    let whereClause = {};
    
    if (assemblyFilter.types && assemblyFilter.types.length > 0) {
      whereClause.type = { _in: assemblyFilter.types };
    }
    if (assemblyFilter.statuses && assemblyFilter.statuses.length > 0) {
      whereClause.status = { _in: assemblyFilter.statuses };
    }
    if (assemblyFilter.dateFrom || assemblyFilter.dateTo) {
      whereClause.createdAt = {};
      if (assemblyFilter.dateFrom) {
        whereClause.createdAt._gte = assemblyFilter.dateFrom;
      }
      if (assemblyFilter.dateTo) {
        whereClause.createdAt._lte = assemblyFilter.dateTo;
      }
    }

    const getEntriesQuery = `
      query GetOrderedEntries {
        entry(
          ${Object.keys(whereClause).length > 0 ? 
            `where: ${JSON.stringify(whereClause)}` : ''
          }
          order_by: {rank: asc}
        ) {
          key
          title
          content
          type
          status
          rank
          stars
          createdat
          updatedat
          createdby
        }
      }
    `;

    const result = await req.hasura.query(getEntriesQuery);

    res.json({
      success: true,
      entries: result.data.entry
    });

  } catch (error) {
    logger.error('Error fetching ordered entries:', error);
    res.status(500).json({
      error: 'Failed to fetch ordered entries',
      details: error.message
    });
  }
});

module.exports = router;
