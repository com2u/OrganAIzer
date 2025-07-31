// File: /home/com2u/src/OrganAIzer/backend/routes/ai.js
// Purpose: AI integration routes for prompt processing and content generation

const express = require('express');
const router = express.Router();
const { logger } = require('../config/logger');
const axios = require('axios');

/**
 * GET /api/ai
 * Get AI service information and available endpoints
 */
router.get('/', (req, res) => {
  res.json({
    service: 'OrganAIzer AI Service',
    version: '1.0.0',
    description: 'AI integration for content processing and analysis',
    endpoints: {
      'POST /api/ai/prompt': 'Process AI prompt and return response',
      'POST /api/ai/analyze-entries': 'Analyze entries and provide AI insights',
      'POST /api/ai/generate-content': 'Generate content based on AI suggestions',
      'GET /api/ai/history': 'Get AI interaction history for user'
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/ai/prompt
 * Process AI prompt and return response
 */
router.post('/prompt', async (req, res) => {
  try {
    const { prompt, context, assemblyId, entryIds } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Validate input
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Prompt too long (max 10,000 characters)'
      });
    }

    logger.info('AI prompt received', {
      userId,
      promptLength: prompt.length,
      assemblyId,
      entryCount: entryIds?.length || 0,
      context: context || 'general'
    });

    // Prepare AI request data
    const aiRequest = {
      prompt: prompt.trim(),
      context: context || 'general',
      assemblyId,
      entryIds: entryIds || [],
      userId,
      timestamp: new Date().toISOString()
    };

    // Process AI prompt using OpenAI API
    const aiResponse = await processAIPrompt(aiRequest);

    // Log the interaction
    logger.info('AI prompt processed', {
      userId,
      promptLength: prompt.length,
      responseLength: aiResponse.response.length,
      processingTime: aiResponse.processingTime
    });

    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        suggestions: aiResponse.suggestions || [],
        processingTime: aiResponse.processingTime,
        context: context,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI prompt processing failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to process AI prompt',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ai/analyze-entries
 * Analyze entries and provide AI insights
 */
router.post('/analyze-entries', async (req, res) => {
  try {
    const { entryIds, analysisType } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Entry IDs are required'
      });
    }

    logger.info('AI entry analysis requested', {
      userId,
      entryCount: entryIds.length,
      analysisType: analysisType || 'general'
    });

    // TODO: Fetch entries from database and analyze with AI
    const mockAnalysis = await analyzeEntries(entryIds, analysisType);

    res.json({
      success: true,
      data: {
        analysis: mockAnalysis.analysis,
        insights: mockAnalysis.insights,
        recommendations: mockAnalysis.recommendations,
        entryCount: entryIds.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI entry analysis failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to analyze entries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/ai/generate-content
 * Generate content based on AI suggestions
 */
router.post('/generate-content', async (req, res) => {
  try {
    const { type, parameters, assemblyId } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Content type is required'
      });
    }

    logger.info('AI content generation requested', {
      userId,
      type,
      assemblyId,
      parameters: Object.keys(parameters || {})
    });

    // TODO: Generate content using AI service
    const mockContent = await generateContent(type, parameters, assemblyId);

    res.json({
      success: true,
      data: {
        content: mockContent.content,
        metadata: mockContent.metadata,
        suggestions: mockContent.suggestions,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI content generation failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ai/history
 * Get AI interaction history for user
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const { limit = 50, offset = 0 } = req.query;

    logger.info('AI history requested', {
      userId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // TODO: Fetch from database
    const mockHistory = await getAIHistory(userId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: {
        interactions: mockHistory.interactions,
        total: mockHistory.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    logger.error('AI history fetch failed', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// AI processing functions using OpenAI API

async function processAIPrompt(aiRequest) {
  const startTime = Date.now();
  
  try {
    // Get OpenAI configuration from environment variables
    const openaiUrl = process.env.OPENAI_URL;
    const openaiApiKey = process.env.OPENAI_APIKEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
    const maxTokens = parseInt(process.env.OPENAI_MAXTOKEN) || 4096;

    if (!openaiUrl || !openaiApiKey) {
      logger.error('OpenAI configuration missing', {
        hasUrl: !!openaiUrl,
        hasApiKey: !!openaiApiKey
      });
      throw new Error('OpenAI configuration is not properly set');
    }

    // Prepare the request payload for OpenRouter
    const requestPayload = {
      model: openaiModel,
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping users organize and manage their content in OrganAIzer. Provide helpful, concise, and actionable responses. Focus on productivity, organization, and content management.'
        },
        {
          role: 'user',
          content: aiRequest.prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    };

    logger.info('Sending request to OpenAI API', {
      url: openaiUrl,
      model: openaiModel,
      promptLength: aiRequest.prompt.length,
      maxTokens
    });

    // Make the API call to OpenRouter
    const response = await axios.post(openaiUrl, requestPayload, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'OrganAIzer'
      },
      timeout: 30000 // 30 second timeout
    });

    const processingTime = Date.now() - startTime;

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0].message.content;
      
      logger.info('OpenAI API response received', {
        responseLength: aiResponse.length,
        processingTime,
        tokensUsed: response.data.usage?.total_tokens || 'unknown'
      });

      return {
        response: aiResponse,
        suggestions: [], // Could be enhanced to extract suggestions from the response
        processingTime
      };
    } else {
      throw new Error('Invalid response format from OpenAI API');
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('OpenAI API call failed', {
      error: error.message,
      processingTime,
      status: error.response?.status,
      statusText: error.response?.statusText
    });

    // Fallback to a basic response if API fails
    return {
      response: `I apologize, but I'm currently unable to process your request due to a technical issue. Please try again later. 

In the meantime, here are some general tips for organizing your content:
- Use clear, descriptive titles for your entries
- Categorize content using types and statuses
- Add relevant labels for easy searching
- Regular review and update your entries

Your prompt: "${aiRequest.prompt.substring(0, 100)}${aiRequest.prompt.length > 100 ? '...' : ''}"`,
      suggestions: [],
      processingTime,
      error: error.message
    };
  }
}

async function analyzeEntries(entryIds, analysisType) {
  // Mock analysis
  return {
    analysis: `Analyzed ${entryIds.length} entries for ${analysisType} insights.`,
    insights: [
      'Most entries are related to project planning',
      'High priority items need immediate attention',
      'Several entries could be grouped into related themes'
    ],
    recommendations: [
      'Consider creating sub-assemblies for different project phases',
      'Set deadlines for high-priority items',
      'Review and update entry statuses regularly'
    ]
  };
}

async function generateContent(type, parameters, assemblyId) {
  // Mock content generation
  return {
    content: `Generated ${type} content based on provided parameters.`,
    metadata: {
      type,
      assemblyId,
      generatedAt: new Date().toISOString()
    },
    suggestions: [
      'Review generated content for accuracy',
      'Customize content to match your specific needs'
    ]
  };
}

async function getAIHistory(userId, limit, offset) {
  // Mock history
  return {
    interactions: [
      {
        id: '1',
        prompt: 'Help me organize my meeting agenda',
        response: 'I can help you structure your meeting...',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        context: 'meeting'
      },
      {
        id: '2',
        prompt: 'Analyze my task priorities',
        response: 'Based on your tasks, here are my recommendations...',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        context: 'tasks'
      }
    ],
    total: 2
  };
}

module.exports = router;
