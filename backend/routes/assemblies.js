// File: /home/com2u/src/OrganAIzer/backend/routes/assemblies.js
// Purpose: Assembly management routes for OrganAIzer

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { logger, logHasura, logError } = require('../config/logger');
const { verifyJWT, addHasuraClient } = require('../config/hasura');

// Use centralized Hasura configuration
router.use(addHasuraClient);
router.use(verifyJWT);

/**
 * Get all assemblies for the current user
 * GET /api/assemblies
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info('Fetching assemblies', { userId });

    // In development mode, return all assemblies for easier testing
    const getAssembliesQuery = process.env.NODE_ENV === 'development' 
      ? `
        query GetAssemblies {
          assembly(order_by: {createdat: desc}) {
            id
            name
            description
            owner
            createdat
            updatedat
            sortorder
            isdefault
          }
        }
      `
      : `
        query GetAssemblies($owner: String!) {
          assembly(where: {owner: {_eq: $owner}}, order_by: {createdat: desc}) {
            id
            name
            description
            owner
            createdat
            updatedat
            sortorder
            isdefault
          }
        }
      `;

    const variables = process.env.NODE_ENV === 'development' ? {} : { owner: userId };
    const result = await req.hasura.query(getAssembliesQuery, variables);

    res.json({
      success: true,
      assemblies: result.data.assembly
    });

  } catch (error) {
    logger.error('Error fetching assemblies:', error);
    res.status(500).json({
      error: 'Failed to fetch assemblies',
      details: error.message
    });
  }
});

/**
 * Get a specific assembly with all its configuration
 * GET /api/assemblies/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info('Fetching assembly details', { assemblyId: id, userId });

    // In development mode, return assembly regardless of owner for easier testing
    const getAssemblyQuery = process.env.NODE_ENV === 'development' 
      ? `
        query GetAssemblyDetails($id: uuid!) {
          assembly(where: {id: {_eq: $id}}) {
            id
            name
            description
            owner
            createdat
            updatedat
            sortorder
            isdefault
          }
        }
      `
      : `
        query GetAssemblyDetails($id: uuid!, $owner: String!) {
          assembly(where: {id: {_eq: $id}, owner: {_eq: $owner}}) {
            id
            name
            description
            owner
            createdat
            updatedat
            sortorder
            isdefault
          }
        }
      `;

    const variables = process.env.NODE_ENV === 'development' ? { id } : { id, owner: userId };
    const result = await req.hasura.query(getAssemblyQuery, variables);

    if (!result.data.assembly.length) {
      return res.status(404).json({
        error: 'Assembly not found'
      });
    }

    const assembly = result.data.assembly[0];

    // Get assembly configuration (includes, excludes, filters, columns)
    const getConfigQuery = `
      query GetAssemblyConfig($assemblyId: uuid!) {
        assemblyinclude(where: {assemblyid: {_eq: $assemblyId}}) {
          entrykey
        }
        assemblyexclude(where: {assemblyid: {_eq: $assemblyId}}) {
          entrykey
        }
        assemblyfilter(where: {assemblyid: {_eq: $assemblyId}}) {
          filtertype
          value
          visibleinview
        }
        assemblyconfig(where: {assemblyid: {_eq: $assemblyId}}) {
          columnname
          isvisible
        }
      }
    `;

    const configResult = await req.hasura.query(getConfigQuery, { assemblyId: id });
    
    const includes = configResult.data.assemblyinclude.map(inc => inc.entrykey);
    const excludes = configResult.data.assemblyexclude.map(exc => exc.entrykey);
    
    // Transform filters into the expected format
    const filters = {};
    configResult.data.assemblyfilter.forEach(filter => {
      if (!filters[filter.filtertype]) {
        filters[filter.filtertype] = [];
      }
      filters[filter.filtertype].push({
        value: filter.value,
        visible: filter.visibleinview
      });
    });

    // Transform columns into the expected format
    const columns = {};
    configResult.data.assemblyconfig.forEach(config => {
      columns[config.columnname] = config.isvisible;
    });

    // Transform the data structure for frontend consumption
    const assemblyData = {
      id: assembly.id,
      name: assembly.name,
      description: assembly.description,
      owner: assembly.owner,
      createdAt: assembly.createdat,
      updatedAt: assembly.updatedat,
      sortOrder: assembly.sortorder,
      isDefault: assembly.isdefault,
      includes: includes,
      excludes: excludes,
      filters: filters,
      columns: columns
    };

    res.json({
      success: true,
      assembly: assemblyData
    });

  } catch (error) {
    logger.error('Error fetching assembly details:', error);
    res.status(500).json({
      error: 'Failed to fetch assembly details',
      details: error.message
    });
  }
});

/**
 * Create a new assembly
 * POST /api/assemblies
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, sortOrder, isDefault, includes, excludes, filters, columns } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        error: 'Assembly name is required'
      });
    }

    logger.info('Creating new assembly', { name, userId });

    const assemblyId = uuidv4();

    // Create the main assembly record
    const createAssemblyQuery = `
      mutation CreateAssembly($assembly: assembly_insert_input!) {
        insert_assembly_one(object: $assembly) {
          id
          name
          description
          owner
          createdat
          updatedat
          sortorder
          isdefault
        }
      }
    `;

    const assemblyData = {
      id: assemblyId,
      name,
      description: description || null,
      owner: userId,
      sortorder: sortOrder || 'Rank',
      isdefault: isDefault || false
    };

    const assemblyResult = await req.hasura.query(createAssemblyQuery, {
      assembly: assemblyData
    });

    const createdAssembly = assemblyResult.data.insert_assembly_one;

    // Insert includes if provided
    if (includes && includes.length > 0) {
      const insertIncludesQuery = `
        mutation InsertAssemblyIncludes($includes: [assemblyinclude_insert_input!]!) {
          insert_assemblyinclude(objects: $includes) {
            affected_rows
          }
        }
      `;

      const includeObjects = includes.map(entryKey => ({
        assemblyid: assemblyId,
        entrykey: entryKey
      }));

      await req.hasura.query(insertIncludesQuery, {
        includes: includeObjects
      });
    }

    // Insert excludes if provided
    if (excludes && excludes.length > 0) {
      const insertExcludesQuery = `
        mutation InsertAssemblyExcludes($excludes: [assemblyexclude_insert_input!]!) {
          insert_assemblyexclude(objects: $excludes) {
            affected_rows
          }
        }
      `;

      const excludeObjects = excludes.map(entryKey => ({
        assemblyid: assemblyId,
        entrykey: entryKey
      }));

      await req.hasura.query(insertExcludesQuery, {
        excludes: excludeObjects
      });
    }

    // Insert filters if provided
    if (filters && Object.keys(filters).length > 0) {
      const filterObjects = [];
      Object.entries(filters).forEach(([filterType, filterValues]) => {
        // Ensure filterValues is an array
        const valuesArray = Array.isArray(filterValues) ? filterValues : [filterValues];
        valuesArray.forEach(filterValue => {
          filterObjects.push({
            assemblyid: assemblyId,
            filtertype: filterType,
            value: typeof filterValue === 'object' ? filterValue.value : filterValue,
            visibleinview: typeof filterValue === 'object' ? filterValue.visible : true
          });
        });
      });

      if (filterObjects.length > 0) {
        const insertFiltersQuery = `
          mutation InsertAssemblyFilters($filters: [assemblyfilter_insert_input!]!) {
            insert_assemblyfilter(objects: $filters) {
              affected_rows
            }
          }
        `;

        await req.hasura.query(insertFiltersQuery, {
          filters: filterObjects
        });
      }
    }

    // Insert column configurations if provided
    if (columns && Object.keys(columns).length > 0) {
      const columnObjects = Object.entries(columns).map(([columnName, isVisible]) => ({
        assemblyid: assemblyId,
        columnname: columnName,
        isvisible: isVisible
      }));

      const insertColumnsQuery = `
        mutation InsertAssemblyConfigs($configs: [assemblyconfig_insert_input!]!) {
          insert_assemblyconfig(objects: $configs) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(insertColumnsQuery, {
        configs: columnObjects
      });
    }

    logger.info('Assembly created successfully', {
      assemblyId,
      name,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Assembly created successfully',
      assembly: createdAssembly
    });

  } catch (error) {
    logger.error('Error creating assembly:', error);
    res.status(500).json({
      error: 'Failed to create assembly',
      details: error.message
    });
  }
});

/**
 * Update an existing assembly
 * PUT /api/assemblies/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sortOrder, isDefault, includes, excludes, filters, columns } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        error: 'Assembly name is required'
      });
    }

    logger.info('Updating assembly', { assemblyId: id, userId });

    // First verify the assembly exists and belongs to the user (skip owner check in development)
    const checkAssemblyQuery = process.env.NODE_ENV === 'development'
      ? `
        query CheckAssembly($id: uuid!) {
          assembly(where: {id: {_eq: $id}}) {
            id
          }
        }
      `
      : `
        query CheckAssembly($id: uuid!, $owner: String!) {
          assembly(where: {id: {_eq: $id}, owner: {_eq: $owner}}) {
            id
          }
        }
      `;

    const checkVariables = process.env.NODE_ENV === 'development' ? { id } : { id, owner: userId };
    const checkResult = await req.hasura.query(checkAssemblyQuery, checkVariables);

    if (!checkResult.data.assembly.length) {
      return res.status(404).json({
        error: 'Assembly not found'
      });
    }

    // Update the main assembly record
    const updateAssemblyQuery = `
      mutation UpdateAssembly($id: uuid!, $updates: assembly_set_input!) {
        update_assembly(where: {id: {_eq: $id}}, _set: $updates) {
          affected_rows
          returning {
            id
            name
            description
            owner
            createdat
            updatedat
            sortorder
            isdefault
          }
        }
      }
    `;

    const updates = {
      name,
      description: description || null,
      sortorder: sortOrder || 'Rank',
      isdefault: isDefault || false,
      updatedat: 'now()'
    };

    const updateResult = await req.hasura.query(updateAssemblyQuery, {
      id,
      updates
    });

    // Clear existing includes, excludes, filters, and configs
    const clearDataQueries = [
      `mutation { delete_assemblyinclude(where: {assemblyid: {_eq: "${id}"}}) { affected_rows } }`,
      `mutation { delete_assemblyexclude(where: {assemblyid: {_eq: "${id}"}}) { affected_rows } }`,
      `mutation { delete_assemblyfilter(where: {assemblyid: {_eq: "${id}"}}) { affected_rows } }`,
      `mutation { delete_assemblyconfig(where: {assemblyid: {_eq: "${id}"}}) { affected_rows } }`
    ];

    await Promise.all(clearDataQueries.map(query => req.hasura.query(query)));

    // Re-insert the new data (same logic as create)
    if (includes && includes.length > 0) {
      const insertIncludesQuery = `
        mutation InsertAssemblyIncludes($includes: [assemblyinclude_insert_input!]!) {
          insert_assemblyinclude(objects: $includes) {
            affected_rows
          }
        }
      `;

      const includeObjects = includes.map(entryKey => ({
        assemblyid: id,
        entrykey: entryKey
      }));

      await req.hasura.query(insertIncludesQuery, {
        includes: includeObjects
      });
    }

    if (excludes && excludes.length > 0) {
      const insertExcludesQuery = `
        mutation InsertAssemblyExcludes($excludes: [assemblyexclude_insert_input!]!) {
          insert_assemblyexclude(objects: $excludes) {
            affected_rows
          }
        }
      `;

      const excludeObjects = excludes.map(entryKey => ({
        assemblyid: id,
        entrykey: entryKey
      }));

      await req.hasura.query(insertExcludesQuery, {
        excludes: excludeObjects
      });
    }

    if (filters && Object.keys(filters).length > 0) {
      const filterObjects = [];
      Object.entries(filters).forEach(([filterType, filterValues]) => {
        filterValues.forEach(filterValue => {
          filterObjects.push({
            assemblyid: id,
            filtertype: filterType,
            value: typeof filterValue === 'object' ? filterValue.value : filterValue,
            visibleinview: typeof filterValue === 'object' ? filterValue.visible : true
          });
        });
      });

      if (filterObjects.length > 0) {
        const insertFiltersQuery = `
          mutation InsertAssemblyFilters($filters: [assemblyfilter_insert_input!]!) {
            insert_assemblyfilter(objects: $filters) {
              affected_rows
            }
          }
        `;

        await req.hasura.query(insertFiltersQuery, {
          filters: filterObjects
        });
      }
    }

    if (columns && Object.keys(columns).length > 0) {
      const columnObjects = Object.entries(columns).map(([columnName, isVisible]) => ({
        assemblyid: id,
        columnname: columnName,
        isvisible: isVisible
      }));

      const insertColumnsQuery = `
        mutation InsertAssemblyConfigs($configs: [assemblyconfig_insert_input!]!) {
          insert_assemblyconfig(objects: $configs) {
            affected_rows
          }
        }
      `;

      await req.hasura.query(insertColumnsQuery, {
        configs: columnObjects
      });
    }

    const updatedAssembly = updateResult.data.update_assembly.returning[0];

    logger.info('Assembly updated successfully', {
      assemblyId: id,
      name,
      userId
    });

    res.json({
      success: true,
      message: 'Assembly updated successfully',
      assembly: updatedAssembly
    });

  } catch (error) {
    logger.error('Error updating assembly:', error);
    res.status(500).json({
      error: 'Failed to update assembly',
      details: error.message
    });
  }
});

/**
 * Get entries for a specific assembly with filters applied
 * GET /api/assemblies/:id/entries
 */
router.get('/:id/entries', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info('Fetching assembly entries', { assemblyId: id, userId });

    // First verify the assembly exists and belongs to the user (skip owner check in development)
    const checkAssemblyQuery = process.env.NODE_ENV === 'development'
      ? `
        query CheckAssembly($id: uuid!) {
          assembly(where: {id: {_eq: $id}}) {
            id
            name
            sortorder
          }
        }
      `
      : `
        query CheckAssembly($id: uuid!, $owner: String!) {
          assembly(where: {id: {_eq: $id}, owner: {_eq: $owner}}) {
            id
            name
            sortorder
          }
        }
      `;

    const checkVariables = process.env.NODE_ENV === 'development' ? { id } : { id, owner: userId };
    const checkResult = await req.hasura.query(checkAssemblyQuery, checkVariables);

    if (!checkResult.data.assembly.length) {
      return res.status(404).json({
        error: 'Assembly not found'
      });
    }

    const assembly = checkResult.data.assembly[0];

    // Get assembly configuration (includes, excludes, filters)
    const getConfigQuery = `
      query GetAssemblyConfig($assemblyId: uuid!) {
        assemblyinclude(where: {assemblyid: {_eq: $assemblyId}}) {
          entrykey
        }
        assemblyexclude(where: {assemblyid: {_eq: $assemblyId}}) {
          entrykey
        }
        assemblyfilter(where: {assemblyid: {_eq: $assemblyId}}) {
          filtertype
          value
          visibleinview
        }
      }
    `;

    const configResult = await req.hasura.query(getConfigQuery, { assemblyId: id });
    
    const includes = configResult.data.assemblyinclude.map(inc => inc.entrykey);
    const excludes = configResult.data.assemblyexclude.map(exc => exc.entrykey);
    const filters = configResult.data.assemblyfilter;

    // Build the entries query with filters
    let whereConditions = [];
    let orderBy = 'rank: asc';

    // Apply sort order
    switch (assembly.sortorder) {
      case 'Voting':
        orderBy = 'voting_aggregate: {sum: {voting: desc}}';
        break;
      case 'Stars':
        orderBy = 'stars: desc';
        break;
      case 'Type':
        orderBy = 'type: asc';
        break;
      case 'Status':
        orderBy = 'status: asc';
        break;
      case 'CreatedAt':
        orderBy = 'createdat: desc';
        break;
      case 'UpdatedAt':
        orderBy = 'updatedat: desc';
        break;
      default:
        orderBy = 'rank: asc';
    }

    // Apply includes (if any, only show these entries)
    if (includes.length > 0) {
      whereConditions.push(`key: {_in: [${includes.map(k => `"${k}"`).join(', ')}]}`);
    }

    // Apply excludes
    if (excludes.length > 0) {
      whereConditions.push(`key: {_nin: [${excludes.map(k => `"${k}"`).join(', ')}]}`);
    }

    // Apply filters
    filters.forEach(filter => {
      switch (filter.filtertype) {
        case 'Date':
          const [from, to] = filter.value.split('|');
          if (from) whereConditions.push(`createdat: {_gte: "${from}"}`);
          if (to) whereConditions.push(`createdat: {_lte: "${to}"}`);
          break;
        case 'Type':
          const types = filter.value.split(',');
          whereConditions.push(`type: {_in: [${types.map(t => `"${t}"`).join(', ')}]}`);
          break;
        case 'Status':
          const statuses = filter.value.split(',');
          whereConditions.push(`status: {_in: [${statuses.map(s => `"${s}"`).join(', ')}]}`);
          break;
        case 'Voting':
          // Skip voting aggregation in WHERE clause for now - this requires a more complex query
          // TODO: Implement voting aggregation filtering with a separate query
          break;
        case 'Stars':
          const minStars = parseFloat(filter.value);
          whereConditions.push(`stars: {_gte: ${minStars}}`);
          break;
      }
    });

    const whereClause = whereConditions.length > 0 ? `where: {${whereConditions.join(', ')}}` : '';

    const getEntriesQuery = `
      query GetAssemblyEntries {
        entry(${whereClause}, order_by: {${orderBy}}) {
          key
          title
          content
          type
          status
          rank
          stars
          createdat
          updatedat
          voting {
            User
            voting
          }
          entrylabels {
            label
          }
        }
      }
    `;

    const entriesResult = await req.hasura.query(getEntriesQuery);

    res.json({
      success: true,
      entries: entriesResult.data.entry || []
    });

  } catch (error) {
    logger.error('Error fetching assembly entries:', error);
    res.status(500).json({
      error: 'Failed to fetch assembly entries',
      details: error.message
    });
  }
});

/**
 * Delete an assembly
 * DELETE /api/assemblies/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info('Deleting assembly', { assemblyId: id, userId });

    // First verify the assembly exists and belongs to the user
    const checkAssemblyQuery = `
      query CheckAssembly($id: uuid!, $owner: String!) {
        assembly(where: {id: {_eq: $id}, owner: {_eq: $owner}}) {
          id
          name
        }
      }
    `;

    const checkResult = await req.hasura.query(checkAssemblyQuery, {
      id,
      owner: userId
    });

    if (!checkResult.data.assembly.length) {
      return res.status(404).json({
        error: 'Assembly not found'
      });
    }

    const assemblyName = checkResult.data.assembly[0].name;

    // Delete the assembly (cascade should handle related records)
    const deleteAssemblyQuery = `
      mutation DeleteAssembly($id: uuid!) {
        delete_assembly(where: {id: {_eq: $id}}) {
          affected_rows
        }
      }
    `;

    const deleteResult = await req.hasura.query(deleteAssemblyQuery, {
      id
    });

    if (deleteResult.data.delete_assembly.affected_rows === 0) {
      return res.status(404).json({
        error: 'Assembly not found'
      });
    }

    logger.info('Assembly deleted successfully', {
      assemblyId: id,
      assemblyName,
      userId
    });

    res.json({
      success: true,
      message: 'Assembly deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting assembly:', error);
    res.status(500).json({
      error: 'Failed to delete assembly',
      details: error.message
    });
  }
});

module.exports = router;
