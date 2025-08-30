const { logger } = require('../utils/logger');
const { anonymizeData } = require('../utils/dataAnonymizer');
const { validateConsent } = require('../utils/consentValidator');

/**
 * Privacy Middleware for GDPR/LOPDGDD Compliance
 * 
 * This middleware ensures that all requests comply with Spanish privacy laws:
 * - GDPR (General Data Protection Regulation)
 * - LOPDGDD (Ley Orgánica de Protección de Datos Personales y garantía de los derechos digitales)
 */
const privacyMiddleware = (req, res, next) => {
  try {
    // Add privacy headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    });

    // Add privacy context to request
    req.privacyContext = {
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      consentValid: false,
      dataMinimization: process.env.DATA_MINIMIZATION_ENABLED === 'true',
      anonymization: process.env.ANONYMIZATION_ENABLED === 'true',
      gdprCompliance: process.env.GDPR_COMPLIANCE_ENABLED === 'true',
      lopdgddCompliance: process.env.LOPDGDD_COMPLIANCE_ENABLED === 'true'
    };

    // Check for consent headers or cookies
    const consentToken = req.headers['x-consent-token'] || req.cookies?.consentToken;
    if (consentToken) {
      req.privacyContext.consentValid = validateConsent(consentToken);
    }

    // Data minimization: Remove unnecessary data from request body
    if (req.privacyContext.dataMinimization && req.body) {
      req.body = minimizeData(req.body, req.path);
    }

    // Anonymization: Anonymize sensitive data before processing
    if (req.privacyContext.anonymization && req.body) {
      req.body = anonymizeData(req.body, req.path);
    }

    // Log privacy compliance
    logger.info('Privacy middleware applied', {
      path: req.path,
      method: req.method,
      consentValid: req.privacyContext.consentValid,
      dataMinimization: req.privacyContext.dataMinimization,
      anonymization: req.privacyContext.anonymization
    });

    next();
  } catch (error) {
    logger.error('Privacy middleware error:', error);
    next(error);
  }
};

/**
 * Data minimization function
 * Removes unnecessary personal data based on the endpoint
 */
const minimizeData = (data, path) => {
  const minimized = { ...data };

  // Remove unnecessary fields based on endpoint
  if (path.includes('/chatbot/')) {
    // For chatbot endpoints, only keep essential health data
    const allowedFields = [
      'message', 'healthData', 'dietaryPreferences', 'allergies',
      'medicalConditions', 'goals', 'age', 'weight', 'height'
    ];
    
    Object.keys(minimized).forEach(key => {
      if (!allowedFields.includes(key)) {
        delete minimized[key];
      }
    });
  }

  // Remove any fields that might contain personal identifiers
  const personalIdentifiers = [
    'email', 'phone', 'address', 'socialSecurityNumber',
    'passportNumber', 'driverLicense', 'creditCard'
  ];

  personalIdentifiers.forEach(identifier => {
    if (minimized[identifier]) {
      delete minimized[identifier];
    }
  });

  return minimized;
};

/**
 * Enhanced privacy middleware for sensitive endpoints
 */
const enhancedPrivacyMiddleware = (req, res, next) => {
  // Apply standard privacy middleware
  privacyMiddleware(req, res, (err) => {
    if (err) return next(err);

    // Additional checks for sensitive endpoints
    if (req.path.includes('/health') || req.path.includes('/medical')) {
      // Require explicit consent for health data
      if (!req.privacyContext.consentValid) {
        return res.status(403).json({
          error: 'Explicit consent required for health data processing',
          code: 'HEALTH_CONSENT_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }

      // Add health data specific headers
      res.set({
        'X-Health-Data-Protected': 'true',
        'X-Data-Category': 'health'
      });
    }

    next();
  });
};

/**
 * Consent validation middleware
 */
const consentValidationMiddleware = (req, res, next) => {
  const requiredConsents = getRequiredConsents(req.path);
  
  if (requiredConsents.length > 0) {
    const userConsents = req.headers['x-user-consents'] || [];
    const missingConsents = requiredConsents.filter(consent => !userConsents.includes(consent));
    
    if (missingConsents.length > 0) {
      return res.status(403).json({
        error: 'Missing required consents',
        code: 'MISSING_CONSENTS',
        missingConsents,
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
};

/**
 * Get required consents for a specific endpoint
 */
const getRequiredConsents = (path) => {
  const consentMap = {
    '/api/chatbot/health-assessment': ['health_data_processing', 'ai_analysis'],
    '/api/chatbot/personalized-advice': ['health_data_processing', 'ai_analysis', 'personalization'],
    '/api/nutritionist/share-data': ['health_data_sharing', 'nutritionist_access'],
    '/api/analytics/health-trends': ['analytics', 'health_data_processing'],
    '/api/user/export-data': ['data_portability']
  };

  return consentMap[path] || [];
};

/**
 * Data retention middleware
 * Automatically handles data retention based on GDPR requirements
 */
const dataRetentionMiddleware = (req, res, next) => {
  // Add retention headers
  const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS) || 730;
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + retentionDays);

  res.set({
    'X-Data-Retention-Date': retentionDate.toISOString(),
    'X-Data-Retention-Days': retentionDays.toString()
  });

  next();
};

/**
 * Right to be forgotten middleware
 * Handles data deletion requests
 */
const rightToBeForgottenMiddleware = (req, res, next) => {
  if (req.path.includes('/privacy/delete') || req.path.includes('/privacy/forget')) {
    // Ensure immediate deletion for right to be forgotten requests
    req.privacyContext.immediateDeletion = true;
    req.privacyContext.deletionReason = 'user_request';
    
    // Add deletion headers
    res.set({
      'X-Data-Deletion-Requested': 'true',
      'X-Deletion-Timestamp': new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  privacyMiddleware,
  enhancedPrivacyMiddleware,
  consentValidationMiddleware,
  dataRetentionMiddleware,
  rightToBeForgottenMiddleware
};

