const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const chatbotService = require('../services/chatbotService');
const User = require('../models/User');

const router = express.Router();

// Store for chat sessions and history
const chatSessions = new Map();

// @route   POST /api/chatbot/message
// @desc    Send message to chatbot and get response
// @access  Private
router.post('/message', auth, [
  body('message').notEmpty().withMessage('Message is required'),
  body('sessionId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { message, sessionId = `session_${req.user.id}_${Date.now()}` } = req.body;
    
    // Get user's business info
    const user = await User.findById(req.user.id);
    const businessInfo = user.businessProfile;

    if (!businessInfo.businessName) {
      return res.status(400).json({ 
        message: 'Please complete your business profile first to use the chatbot' 
      });
    }

    // Process message through chatbot service
    const response = await chatbotService.processMessage(
      sessionId, 
      message, 
      businessInfo
    );

    // Store interaction in session history
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, []);
    }
    
    const sessionHistory = chatSessions.get(sessionId);
    sessionHistory.push({
      userMessage: message,
      botResponse: response.response,
      timestamp: response.timestamp,
      userId: req.user.id
    });

    res.json({
      message: 'Message processed successfully',
      response: response.response,
      sessionId: response.sessionId,
      timestamp: response.timestamp,
      error: response.error || false
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({ 
      message: 'Failed to process chatbot message',
      error: error.message 
    });
  }
});

// @route   GET /api/chatbot/history/:sessionId
// @desc    Get chat history for a session
// @access  Private
router.get('/history/:sessionId', auth, (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = chatSessions.get(sessionId) || [];
    
    // Filter history for the current user
    const userHistory = history.filter(interaction => 
      interaction.userId === req.user.id
    );

    res.json({
      sessionId,
      history: userHistory,
      messageCount: userHistory.length
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// @route   DELETE /api/chatbot/history/:sessionId
// @desc    Clear chat history for a session
// @access  Private
router.delete('/history/:sessionId', auth, (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Clear from chatbot service
    chatbotService.clearConversationHistory(sessionId);
    
    // Clear from local storage
    chatSessions.delete(sessionId);

    res.json({ 
      message: 'Chat history cleared successfully',
      sessionId 
    });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ message: 'Failed to clear chat history' });
  }
});

// @route   POST /api/chatbot/faq/generate
// @desc    Generate FAQ using AI based on business info
// @access  Private
router.post('/faq/generate', auth, async (req, res) => {
  try {
    // Get user's business info
    const user = await User.findById(req.user.id);
    const businessInfo = user.businessProfile;

    if (!businessInfo.businessName) {
      return res.status(400).json({ 
        message: 'Please complete your business profile first' 
      });
    }

    // Generate FAQ using chatbot service
    const faq = await chatbotService.generateFAQ(businessInfo);

    res.json({
      message: 'FAQ generated successfully',
      faq,
      count: faq.length
    });
  } catch (error) {
    console.error('Error generating FAQ:', error);
    res.status(500).json({ 
      message: 'Failed to generate FAQ',
      error: error.message 
    });
  }
});

// @route   POST /api/chatbot/training/generate
// @desc    Generate training data for chatbot
// @access  Private
router.post('/training/generate', auth, async (req, res) => {
  try {
    const { existingFAQ = [] } = req.body;
    
    // Get user's business info
    const user = await User.findById(req.user.id);
    const businessInfo = user.businessProfile;

    if (!businessInfo.businessName) {
      return res.status(400).json({ 
        message: 'Please complete your business profile first' 
      });
    }

    // Generate training data using chatbot service
    const trainingData = await chatbotService.generateTrainingData(
      businessInfo, 
      existingFAQ
    );

    res.json({
      message: 'Training data generated successfully',
      trainingData,
      count: trainingData.length
    });
  } catch (error) {
    console.error('Error generating training data:', error);
    res.status(500).json({ 
      message: 'Failed to generate training data',
      error: error.message 
    });
  }
});

// @route   POST /api/chatbot/analyze
// @desc    Analyze chat interactions for insights
// @access  Private
router.post('/analyze', auth, async (req, res) => {
  try {
    const { sessionIds = [] } = req.body;
    
    // Collect interactions from specified sessions
    let allInteractions = [];
    
    if (sessionIds.length > 0) {
      sessionIds.forEach(sessionId => {
        const sessionHistory = chatSessions.get(sessionId) || [];
        const userInteractions = sessionHistory.filter(interaction => 
          interaction.userId === req.user.id
        );
        allInteractions = allInteractions.concat(userInteractions);
      });
    } else {
      // Analyze all user's interactions
      chatSessions.forEach((sessionHistory) => {
        const userInteractions = sessionHistory.filter(interaction => 
          interaction.userId === req.user.id
        );
        allInteractions = allInteractions.concat(userInteractions);
      });
    }

    if (allInteractions.length === 0) {
      return res.status(400).json({ 
        message: 'No chat interactions found to analyze' 
      });
    }

    // Analyze interactions using chatbot service
    const analysis = await chatbotService.analyzeChatInteractions(allInteractions);

    res.json({
      message: 'Chat interactions analyzed successfully',
      analysis,
      interactionCount: allInteractions.length
    });
  } catch (error) {
    console.error('Error analyzing chat interactions:', error);
    res.status(500).json({ 
      message: 'Failed to analyze chat interactions',
      error: error.message 
    });
  }
});

// @route   GET /api/chatbot/sessions
// @desc    Get all chat sessions for the user
// @access  Private
router.get('/sessions', auth, (req, res) => {
  try {
    const userSessions = [];
    
    chatSessions.forEach((sessionHistory, sessionId) => {
      const userInteractions = sessionHistory.filter(interaction => 
        interaction.userId === req.user.id
      );
      
      if (userInteractions.length > 0) {
        const lastInteraction = userInteractions[userInteractions.length - 1];
        userSessions.push({
          sessionId,
          messageCount: userInteractions.length,
          lastActivity: lastInteraction.timestamp,
          preview: userInteractions[0].userMessage.substring(0, 50) + '...'
        });
      }
    });

    // Sort by last activity
    userSessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.json({
      sessions: userSessions,
      totalSessions: userSessions.length
    });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ message: 'Failed to fetch chat sessions' });
  }
});

module.exports = router;
