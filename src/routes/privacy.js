const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { rightToBeForgottenMiddleware, dataRetentionMiddleware } = require('../middleware/privacyMiddleware');
const { PrivacyService } = require('../services/privacyService');
const { logger } = require('../utils/logger');
const { sanitizeInput } = require('../utils/sanitizer');

const router = express.Router();
const privacyService = new PrivacyService();

// =============================================================================
// GDPR/LOPDGDD COMPLIANCE ROUTES
// =============================================================================

/**
 * POST /api/privacy/consent
 * Manage user consent for data processing
 */
router.post('/consent', [
  authenticateToken,
  body('consents').isArray().withMessage('Consents must be an array'),
  body('consents.*.type').isString().notEmpty().withMessage('Consent type is required'),
  body('consents.*.granted').isBoolean().withMessage('Consent granted must be boolean'),
  body('consents.*.purpose').isString().notEmpty().withMessage('Consent purpose is required'),
  body('consents.*.expiryDate').optional().isISO8601().withMessage('Expiry date must be in ISO format'),
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
    const sanitizedConsents = req.body.consents.map(consent => sanitizeInput(consent));

    // Update user consents
    const result = await privacyService.updateConsents({
      userId: req.user.id,
      consents: sanitizedConsents,
      privacyContext: req.privacyContext
    });

    logger.info('User consents updated', {
      userId: req.user.id,
      consentCount: sanitizedConsents.length,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Consents updated successfully',
      consents: result.consents,
      privacy: {
        dataRetention: process.env.DATA_RETENTION_DAYS + ' days',
        consentValid: req.privacyContext.consentValid
      }
    });

  } catch (error) {
    logger.error('Consent update error:', error);
    res.status(500).json({
      error: 'Failed to update consents',
      code: 'CONSENT_UPDATE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/privacy/consent
 * Get current user consents
 */
router.get('/consent', [
  authenticateToken,
], async (req, res) => {
  try {
    const consents = await privacyService.getUserConsents({
      userId: req.user.id,
      privacyContext: req.privacyContext
    });

    res.json({
      success: true,
      consents: consents.map(consent => ({
        id: consent.id,
        type: consent.type,
        purpose: consent.purpose,
        granted: consent.granted,
        grantedAt: consent.grantedAt,
        revokedAt: consent.revokedAt,
        expiryDate: consent.expiryDate,
        isActive: consent.isActive
      })),
      privacy: {
        dataRetention: process.env.DATA_RETENTION_DAYS + ' days',
        consentValid: req.privacyContext.consentValid
      }
    });

  } catch (error) {
    logger.error('Consent retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve consents',
      code: 'CONSENT_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/privacy/consent/revoke
 * Revoke specific consent
 */
router.post('/consent/revoke', [
  authenticateToken,
  body('consentId').isUUID().withMessage('Invalid consent ID'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
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

    // Revoke consent
    await privacyService.revokeConsent({
      userId: req.user.id,
      consentId: req.body.consentId,
      reason: req.body.reason,
      privacyContext: req.privacyContext
    });

    logger.info('Consent revoked', {
      userId: req.user.id,
      consentId: req.body.consentId,
      reason: req.body.reason,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Consent revoked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Consent revocation error:', error);
    res.status(500).json({
      error: 'Failed to revoke consent',
      code: 'CONSENT_REVOCATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// DATA RIGHTS ROUTES (GDPR Articles 15-22)
// =============================================================================

/**
 * GET /api/privacy/data
 * Right of Access (GDPR Article 15)
 * Get all personal data about the user
 */
router.get('/data', [
  authenticateToken,
  dataRetentionMiddleware,
], async (req, res) => {
  try {
    const userData = await privacyService.getUserData({
      userId: req.user.id,
      privacyContext: req.privacyContext
    });

    logger.info('Data access request', {
      userId: req.user.id,
      dataCategories: Object.keys(userData),
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Personal data retrieved successfully',
      data: userData,
      privacy: {
        dataRetention: process.env.DATA_RETENTION_DAYS + ' days',
        lastUpdated: new Date().toISOString(),
        dataCategories: Object.keys(userData)
      }
    });

  } catch (error) {
    logger.error('Data access error:', error);
    res.status(500).json({
      error: 'Failed to retrieve personal data',
      code: 'DATA_ACCESS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/privacy/data/export
 * Right to Data Portability (GDPR Article 20)
 * Export personal data in machine-readable format
 */
router.post('/data/export', [
  authenticateToken,
  body('format').isIn(['json', 'csv', 'xml']).withMessage('Format must be json, csv, or xml'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
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

    // Export user data
    const exportData = await privacyService.exportUserData({
      userId: req.user.id,
      format: req.body.format,
      categories: req.body.categories,
      privacyContext: req.privacyContext
    });

    logger.info('Data export requested', {
      userId: req.user.id,
      format: req.body.format,
      categories: req.body.categories,
      timestamp: new Date().toISOString()
    });

    // Set appropriate headers for file download
    const filename = `nutribot_data_${req.user.id}_${new Date().toISOString().split('T')[0]}.${req.body.format}`;
    
    res.set({
      'Content-Type': this.getContentType(req.body.format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Data-Export-Date': new Date().toISOString(),
      'X-Data-Format': req.body.format
    });

    res.send(exportData);

  } catch (error) {
    logger.error('Data export error:', error);
    res.status(500).json({
      error: 'Failed to export personal data',
      code: 'DATA_EXPORT_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/privacy/data/rectify
 * Right to Rectification (GDPR Article 16)
 * Correct inaccurate personal data
 */
router.put('/data/rectify', [
  authenticateToken,
  body('field').isString().notEmpty().withMessage('Field name is required'),
  body('value').notEmpty().withMessage('New value is required'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
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
    const sanitizedValue = sanitizeInput(req.body.value);
    const sanitizedReason = req.body.reason ? sanitizeInput(req.body.reason) : null;

    // Rectify data
    const result = await privacyService.rectifyData({
      userId: req.user.id,
      field: req.body.field,
      value: sanitizedValue,
      reason: sanitizedReason,
      privacyContext: req.privacyContext
    });

    logger.info('Data rectification requested', {
      userId: req.user.id,
      field: req.body.field,
      reason: sanitizedReason,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Data rectified successfully',
      field: req.body.field,
      oldValue: result.oldValue,
      newValue: sanitizedValue,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Data rectification error:', error);
    res.status(500).json({
      error: 'Failed to rectify data',
      code: 'DATA_RECTIFICATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/privacy/data/restrict
 * Right to Restriction of Processing (GDPR Article 18)
 * Restrict processing of personal data
 */
router.post('/data/restrict', [
  authenticateToken,
  body('reason').isString().notEmpty().withMessage('Restriction reason is required'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  body('duration').optional().isInt({ min: 1, max: 365 }).withMessage('Duration must be between 1 and 365 days'),
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
    const sanitizedReason = sanitizeInput(req.body.reason);

    // Restrict data processing
    const restriction = await privacyService.restrictDataProcessing({
      userId: req.user.id,
      reason: sanitizedReason,
      categories: req.body.categories || [],
      duration: req.body.duration || 30,
      privacyContext: req.privacyContext
    });

    logger.info('Data processing restricted', {
      userId: req.user.id,
      reason: sanitizedReason,
      categories: req.body.categories,
      duration: req.body.duration,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Data processing restricted successfully',
      restriction: {
        id: restriction.id,
        reason: sanitizedReason,
        categories: req.body.categories,
        startDate: restriction.startDate,
        endDate: restriction.endDate,
        status: restriction.status
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Data restriction error:', error);
    res.status(500).json({
      error: 'Failed to restrict data processing',
      code: 'DATA_RESTRICTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/privacy/data/delete
 * Right to Erasure / Right to be Forgotten (GDPR Article 17)
 * Delete all personal data
 */
router.delete('/data/delete', [
  authenticateToken,
  rightToBeForgottenMiddleware,
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
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
    const sanitizedReason = req.body.reason ? sanitizeInput(req.body.reason) : 'User request';

    // Delete user data
    const deletionResult = await privacyService.deleteUserData({
      userId: req.user.id,
      reason: sanitizedReason,
      categories: req.body.categories || [],
      privacyContext: req.privacyContext
    });

    logger.info('Data deletion requested', {
      userId: req.user.id,
      reason: sanitizedReason,
      categories: req.body.categories,
      deletedRecords: deletionResult.deletedRecords,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Personal data deleted successfully',
      deletion: {
        reason: sanitizedReason,
        categories: req.body.categories || 'all',
        deletedRecords: deletionResult.deletedRecords,
        deletionDate: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Data deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete personal data',
      code: 'DATA_DELETION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/privacy/data/object
 * Right to Object (GDPR Article 21)
 * Object to processing of personal data
 */
router.post('/data/object', [
  authenticateToken,
  body('reason').isString().notEmpty().withMessage('Objection reason is required'),
  body('processingType').isString().notEmpty().withMessage('Processing type is required'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
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
    const sanitizedReason = sanitizeInput(req.body.reason);

    // Process objection
    const objection = await privacyService.objectToProcessing({
      userId: req.user.id,
      reason: sanitizedReason,
      processingType: req.body.processingType,
      categories: req.body.categories || [],
      privacyContext: req.privacyContext
    });

    logger.info('Processing objection submitted', {
      userId: req.user.id,
      reason: sanitizedReason,
      processingType: req.body.processingType,
      categories: req.body.categories,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Objection to processing submitted successfully',
      objection: {
        id: objection.id,
        reason: sanitizedReason,
        processingType: req.body.processingType,
        categories: req.body.categories,
        status: objection.status,
        submittedAt: objection.submittedAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Processing objection error:', error);
    res.status(500).json({
      error: 'Failed to submit objection to processing',
      code: 'PROCESSING_OBJECTION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// PRIVACY POLICY & TRANSPARENCY ROUTES
// =============================================================================

/**
 * GET /api/privacy/policy
 * Get privacy policy information
 */
router.get('/policy', async (req, res) => {
  try {
    const policy = await privacyService.getPrivacyPolicy({
      language: req.query.language || 'es',
      version: req.query.version || 'latest'
    });

    res.json({
      success: true,
      policy: {
        version: policy.version,
        effectiveDate: policy.effectiveDate,
        content: policy.content,
        language: policy.language,
        lastUpdated: policy.lastUpdated
      },
      compliance: {
        gdpr: true,
        lopdgdd: true,
        aepd: true,
        aesia: true
      }
    });

  } catch (error) {
    logger.error('Privacy policy retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve privacy policy',
      code: 'POLICY_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/privacy/transparency
 * Get transparency information about data processing
 */
router.get('/transparency', [
  authenticateToken,
], async (req, res) => {
  try {
    const transparency = await privacyService.getTransparencyInfo({
      userId: req.user.id,
      privacyContext: req.privacyContext
    });

    res.json({
      success: true,
      transparency: {
        dataCategories: transparency.dataCategories,
        processingPurposes: transparency.processingPurposes,
        dataRetention: transparency.dataRetention,
        thirdPartySharing: transparency.thirdPartySharing,
        userRights: transparency.userRights,
        contactInfo: transparency.contactInfo
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Transparency info retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve transparency information',
      code: 'TRANSPARENCY_RETRIEVAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// HELPER METHODS
// =============================================================================

/**
 * Get content type for data export formats
 */
function getContentType(format) {
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml'
  };
  return contentTypes[format] || 'application/json';
}

module.exports = router;

