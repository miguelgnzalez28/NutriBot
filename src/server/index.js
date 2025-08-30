const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import middleware and routes
const { errorHandler } = require('../middleware/errorHandler');
const { privacyMiddleware } = require('../middleware/privacyMiddleware');
const { auditLogger } = require('../utils/auditLogger');
const { logger } = require('../utils/logger');

// Import routes
const authRoutes = require('../routes/auth');
const chatbotRoutes = require('../routes/chatbot');
const userRoutes = require('../routes/user');
const nutritionistRoutes = require('../routes/nutritionist');
const privacyRoutes = require('../routes/privacy');
const healthRoutes = require('../routes/health');

// Import database connection
const { sequelize } = require('../database/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// =============================================================================
// PRIVACY & COMPLIANCE MIDDLEWARE
// =============================================================================

// Privacy middleware for GDPR/LOPDGDD compliance
app.use(privacyMiddleware);

// Audit logging for all requests
app.use(auditLogger);

// =============================================================================
// STANDARD MIDDLEWARE
// =============================================================================

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check endpoint
app.use('/api/health', healthRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Chatbot routes (main functionality)
app.use('/api/chatbot', chatbotRoutes);

// User management routes
app.use('/api/user', userRoutes);

// Nutritionist portal routes
app.use('/api/nutritionist', nutritionistRoutes);

// Privacy and data rights routes
app.use('/api/privacy', privacyRoutes);

// =============================================================================
// STATIC FILES (for production)
// =============================================================================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// =============================================================================
// DATABASE CONNECTION & SERVER STARTUP
// =============================================================================

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized.');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 NutriBot server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔒 Privacy compliance: ${process.env.GDPR_COMPLIANCE_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}`);
      logger.info(`🤖 LLM Model: ${process.env.OPENAI_MODEL || 'gpt-4'}`);
      
      // Log privacy compliance status
      if (process.env.GDPR_COMPLIANCE_ENABLED === 'true') {
        logger.info('✅ GDPR/LOPDGDD compliance features active');
        logger.info(`📅 Data retention: ${process.env.DATA_RETENTION_DAYS} days`);
        logger.info(`🔐 Anonymization: ${process.env.ANONYMIZATION_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}`);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

