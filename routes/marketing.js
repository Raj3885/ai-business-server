const express = require('express');
const { body, validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const { auth } = require('../middleware/auth');
const marketingAI = require('../services/marketingAIService');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/marketing/campaigns/generate
// @desc    Generate AI-powered email campaign
// @access  Private
router.post('/campaigns/generate', [
  auth,
  body('campaignType').notEmpty().withMessage('Campaign type is required'),
  body('businessInfo.company').notEmpty().withMessage('Company name is required'),
  body('audience').notEmpty().withMessage('Target audience is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const campaignData = req.body;
    const aiContent = await marketingAI.generateEmailCampaign(campaignData);

    // Create campaign in database
    const campaign = new Campaign({
      userId: req.user.id,
      name: `${campaignData.campaignType} Campaign - ${new Date().toLocaleDateString()}`,
      type: 'email',
      subject: aiContent.subject,
      content: {
        html: aiContent.html,
        text: aiContent.text,
        aiGenerated: true,
        prompt: JSON.stringify(campaignData)
      },
      audience: {
        segments: [campaignData.audience],
        totalRecipients: 0
      },
      settings: {
        fromName: campaignData.businessInfo.company,
        fromEmail: req.user.email
      }
    });

    await campaign.save();

    res.json({
      message: 'Campaign generated successfully',
      campaign,
      aiContent,
      suggestions: aiContent.cta || []
    });
  } catch (error) {
    console.error('Error generating campaign:', error);
    res.status(500).json({ message: 'Failed to generate campaign' });
  }
});

// @route   GET /api/marketing/campaigns
// @desc    Get all campaigns for user
// @access  Private
router.get('/campaigns', auth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Campaign.countDocuments(filter);

    res.json({
      campaigns,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

// @route   GET /api/marketing/campaigns/:id
// @desc    Get campaign by ID
// @access  Private
router.get('/campaigns/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({ campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Failed to fetch campaign' });
  }
});

// @route   PUT /api/marketing/campaigns/:id
// @desc    Update campaign
// @access  Private
router.put('/campaigns/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'subject', 'content', 'audience', 'schedule', 'settings'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        campaign[field] = req.body[field];
      }
    });

    await campaign.save();

    res.json({
      message: 'Campaign updated successfully',
      campaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Failed to update campaign' });
  }
});

// @route   POST /api/marketing/newsletter/generate
// @desc    Generate newsletter content using AI
// @access  Private
router.post('/newsletter/generate', auth, [
  body('topics').isArray().withMessage('Topics must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { topics, previousNewsletters = [] } = req.body;
    
    // Get user's business info
    const user = await User.findById(req.user.id);
    const businessInfo = user.businessProfile;

    if (!businessInfo.businessName) {
      return res.status(400).json({ 
        message: 'Please complete your business profile first' 
      });
    }

    // Generate newsletter content using AI
    const newsletterContent = await aiService.generateNewsletter(
      businessInfo, 
      topics, 
      previousNewsletters
    );

    res.json({
      message: 'Newsletter generated successfully',
      newsletterContent
    });
  } catch (error) {
    console.error('Error generating newsletter:', error);
    res.status(500).json({ 
      message: 'Failed to generate newsletter',
      error: error.message 
    });
  }
});

// @route   POST /api/marketing/social/generate
// @desc    Generate social media content using AI
// @access  Private
router.post('/social/generate', auth, [
  body('platform').notEmpty().withMessage('Platform is required'),
  body('contentType').notEmpty().withMessage('Content type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { platform, contentType } = req.body;
    
    // Get user's business info
    const user = await User.findById(req.user.id);
    const businessInfo = user.businessProfile;

    if (!businessInfo.businessName) {
      return res.status(400).json({ 
        message: 'Please complete your business profile first' 
      });
    }

    // Generate social media content using AI
    const socialContent = await aiService.generateSocialMediaContent(
      businessInfo, 
      platform, 
      contentType
    );

    res.json({
      message: 'Social media content generated successfully',
      socialContent
    });
  } catch (error) {
    console.error('Error generating social content:', error);
    res.status(500).json({ 
      message: 'Failed to generate social media content',
      error: error.message 
    });
  }
});

// @route   POST /api/marketing/product/description
// @desc    Generate product description using AI
// @access  Private
router.post('/product/description', auth, [
  body('productInfo.name').notEmpty().withMessage('Product name is required'),
  body('productInfo.category').notEmpty().withMessage('Product category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { productInfo } = req.body;
    
    // Generate product description using AI
    const productDescription = await aiService.generateProductDescription(productInfo);

    res.json({
      message: 'Product description generated successfully',
      productDescription
    });
  } catch (error) {
    console.error('Error generating product description:', error);
    res.status(500).json({ 
      message: 'Failed to generate product description',
      error: error.message 
    });
  }
});

// @route   GET /api/marketing/templates
// @desc    Get marketing email templates
// @access  Private
router.get('/templates', auth, (req, res) => {
  const templates = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      description: 'Welcome new customers or subscribers',
      category: 'onboarding'
    },
    {
      id: 'promotional',
      name: 'Promotional Email',
      description: 'Promote products, services, or special offers',
      category: 'sales'
    },
    {
      id: 'newsletter',
      name: 'Newsletter',
      description: 'Regular updates and valuable content',
      category: 'engagement'
    },
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart',
      description: 'Recover abandoned shopping carts',
      category: 'retention'
    },
    {
      id: 'follow-up',
      name: 'Follow-up Email',
      description: 'Follow up after purchase or interaction',
      category: 'retention'
    },
    {
      id: 'event-invitation',
      name: 'Event Invitation',
      description: 'Invite customers to events or webinars',
      category: 'engagement'
    }
  ];

  res.json({ templates });
});

module.exports = router;
