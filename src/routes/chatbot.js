const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { enhancedPrivacyMiddleware, consentValidationMiddleware } = require('../middleware/privacyMiddleware');
const { ChatbotService } = require('../services/chatbotService');
const { logger } = require('../utils/logger');
const { sanitizeInput } = require('../utils/sanitizer');

const router = express.Router();
const chatbotService = new ChatbotService();

// =============================================================================
// MIDDLEWARE STACK
// =============================================================================

// Apply privacy middleware to all chatbot routes
router.use(enhancedPrivacyMiddleware);
router.use(consentValidationMiddleware);

// =============================================================================
// HEALTH ASSESSMENT ROUTES
// =============================================================================

/**
 * POST /api/chatbot/health-assessment
 * Start a new health assessment with the LLM
 */
router.post('/health-assessment', [
  authenticateToken,
  body('age').isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('weight').isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
  body('height').isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100 and 250 cm'),
  body('gender').isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
  body('activityLevel').isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']).withMessage('Invalid activity level'),
  body('goals').isArray().withMessage('Goals must be an array'),
  body('medicalConditions').optional().isArray().withMessage('Medical conditions must be an array'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('dietaryPreferences').optional().isArray().withMessage('Dietary preferences must be an array'),
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize input data
    const sanitizedData = sanitizeInput(req.body);

    // Start health assessment
    const assessment = await chatbotService.startHealthAssessment({
      userId: req.user.id,
      healthData: sanitizedData,
      privacyContext: req.privacyContext
    });

    logger.info('Health assessment started', {
      userId: req.user.id,
      assessmentId: assessment.id,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Health assessment started successfully',
      assessment: {
        id: assessment.id,
        status: assessment.status,
        nextQuestion: assessment.nextQuestion,
        progress: assessment.progress,
        estimatedCompletion: assessment.estimatedCompletion
      },
      privacy: {
        dataRetention: process.env.DATA_RETENTION_DAYS + ' days',
        anonymization: req.privacyContext.anonymization,
        consentValid: req.privacyContext.consentValid
      }
    });

  } catch (error) {
    logger.error('Health assessment error:', error);
    res.status(500).json({
      error: 'Failed to start health assessment',
      code: 'ASSESSMENT_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/chatbot/answer-question
 * Answer a specific question in the health assessment
 */
router.post('/answer-question', [
  authenticateToken,
  body('assessmentId').isUUID().withMessage('Invalid assessment ID'),
  body('questionId').isString().notEmpty().withMessage('Question ID is required'),
  body('answer').isString().notEmpty().withMessage('Answer is required'),
  body('confidence').optional().isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize input
    const sanitizedAnswer = sanitizeInput(req.body.answer);

    // Process answer
    const result = await chatbotService.processAnswer({
      userId: req.user.id,
      assessmentId: req.body.assessmentId,
      questionId: req.body.questionId,
      answer: sanitizedAnswer,
      confidence: req.body.confidence,
      privacyContext: req.privacyContext
    });

    logger.info('Question answered', {
      userId: req.user.id,
      assessmentId: req.body.assessmentId,
      questionId: req.body.questionId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Answer processed successfully',
      result: {
        nextQuestion: result.nextQuestion,
        progress: result.progress,
        assessmentComplete: result.assessmentComplete,
        recommendations: result.recommendations
      },
      privacy: {
        dataAnonymized: req.privacyContext.anonymization,
        consentValid: req.privacyContext.consentValid
      }
    });

  } catch (error) {
    logger.error('Answer processing error:', error);
    res.status(500).json({
      error: 'Failed to process answer',
      code: 'ANSWER_PROCESSING_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// PERSONALIZED ADVICE ROUTES
// =============================================================================

/**
 * POST /api/chatbot/personalized-advice
 * Get personalized nutrition advice based on user profile
 */
router.post('/personalized-advice', [
  authenticateToken,
  body('query').isString().notEmpty().withMessage('Query is required'),
  body('context').optional().isObject().withMessage('Context must be an object'),
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize input
    const sanitizedQuery = sanitizeInput(req.body.query);
    const sanitizedContext = req.body.context ? sanitizeInput(req.body.context) : {};

    // Get personalized advice
    const advice = await chatbotService.getPersonalizedAdvice({
      userId: req.user.id,
      query: sanitizedQuery,
      context: sanitizedContext,
      privacyContext: req.privacyContext
    });

    logger.info('Personalized advice requested', {
      userId: req.user.id,
      queryLength: sanitizedQuery.length,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Personalized advice generated successfully',
      advice: {
        response: advice.response,
        confidence: advice.confidence,
        sources: advice.sources,
        disclaimers: advice.disclaimers,
        nutritionistReview: advice.nutritionistReview
      },
      privacy: {
        dataAnonymized: req.privacyContext.anonymization,
        consentValid: req.privacyContext.consentValid,
        aiGenerated: true
      }
    });

  } catch (error) {
    logger.error('Personalized advice error:', error);
    res.status(500).json({
      error: 'Failed to generate personalized advice',
      code: 'ADVICE_GENERATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// MEAL PLANNING ROUTES
// =============================================================================

/**
 * POST /api/chatbot/meal-plan
 * Generate a personalized meal plan
 */
router.post('/meal-plan', [
  authenticateToken,
  body('duration').isIn(['1_day', '3_days', '7_days', '14_days', '30_days']).withMessage('Invalid duration'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object'),
  body('restrictions').optional().isArray().withMessage('Restrictions must be an array'),
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize input
    const sanitizedPreferences = req.body.preferences ? sanitizeInput(req.body.preferences) : {};
    const sanitizedRestrictions = req.body.restrictions ? req.body.restrictions.map(r => sanitizeInput(r)) : [];

    // Generate meal plan
    const mealPlan = await chatbotService.generateMealPlan({
      userId: req.user.id,
      duration: req.body.duration,
      preferences: sanitizedPreferences,
      restrictions: sanitizedRestrictions,
      privacyContext: req.privacyContext
    });

    logger.info('Meal plan generated', {
      userId: req.user.id,
      duration: req.body.duration,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Meal plan generated successfully',
      mealPlan: {
        id: mealPlan.id,
        duration: mealPlan.duration,
        meals: mealPlan.meals,
        nutritionalSummary: mealPlan.nutritionalSummary,
        shoppingList: mealPlan.shoppingList,
        nutritionistApproved: mealPlan.nutritionistApproved
      },
      privacy: {
        dataAnonymized: req.privacyContext.anonymization,
        consentValid: req.privacyContext.consentValid,
        aiGenerated: true
      }
    });

  } catch (error) {
    logger.error('Meal plan generation error:', error);
    res.status(500).json({
      error: 'Failed to generate meal plan',
      code: 'MEAL_PLAN_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// PROGRESS TRACKING ROUTES
// =============================================================================

/**
 * POST /api/chatbot/track-progress
 * Track user progress and update recommendations
 */
router.post('/track-progress', [
  authenticateToken,
  body('metrics').isObject().withMessage('Metrics must be an object'),
  body('date').optional().isISO8601().withMessage('Date must be in ISO format'),
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize input
    const sanitizedMetrics = sanitizeInput(req.body.metrics);

    // Track progress
    const progress = await chatbotService.trackProgress({
      userId: req.user.id,
      metrics: sanitizedMetrics,
      date: req.body.date || new Date().toISOString(),
      privacyContext: req.privacyContext
    });

    logger.info('Progress tracked', {
      userId: req.user.id,
      metricsCount: Object.keys(sanitizedMetrics).length,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Progress tracked successfully',
      progress: {
        id: progress.id,
        date: progress.date,
        metrics: progress.metrics,
        insights: progress.insights,
        recommendations: progress.recommendations
      },
      privacy: {
        dataAnonymized: req.privacyContext.anonymization,
        consentValid: req.privacyContext.consentValid
      }
    });

  } catch (error) {
    logger.error('Progress tracking error:', error);
    res.status(500).json({
      error: 'Failed to track progress',
      code: 'PROGRESS_TRACKING_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// ASSESSMENT STATUS ROUTES
// =============================================================================

/**
 * GET /api/chatbot/assessment/:id
 * Get assessment status and progress
 */
router.get('/assessment/:id', [
  authenticateToken,
], async (req, res) => {
  try {
    const assessment = await chatbotService.getAssessment({
      userId: req.user.id,
      assessmentId: req.params.id,
      privacyContext: req.privacyContext
    });

    if (!assessment) {
      return res.status(404).json({
        error: 'Assessment not found',
        code: 'ASSESSMENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      assessment: {
        id: assessment.id,
        status: assessment.status,
        progress: assessment.progress,
        currentQuestion: assessment.currentQuestion,
        completedQuestions: assessment.completedQuestions,
        estimatedCompletion: assessment.estimatedCompletion,
        lastUpdated: assessment.lastUpdated
      },
      privacy: {
        dataRetention: process.env.DATA_RETENTION_DAYS + ' days',
        consentValid: req.privacyContext.consentValid
      }
    });

  } catch (error) {
    logger.error('Assessment retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve assessment',
      code: 'ASSESSMENT_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/chatbot/assessment/:id
 * Delete an assessment (right to be forgotten)
 */
router.delete('/assessment/:id', [
  authenticateToken,
], async (req, res) => {
  try {
    await chatbotService.deleteAssessment({
      userId: req.user.id,
      assessmentId: req.params.id,
      privacyContext: req.privacyContext
    });

    logger.info('Assessment deleted', {
      userId: req.user.id,
      assessmentId: req.params.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Assessment deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Assessment deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete assessment',
      code: 'ASSESSMENT_DELETION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

