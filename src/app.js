const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/config');
const logger = require('./utils/logger');
const { auth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const analysisRoutes = require('./routes/analysis');
const healthRoutes = require('./routes/health');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/analysis', auth, analysisRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'LLM Brand Analysis Service',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      analysis: '/api/analysis (POST)',
      reports: '/api/analysis/reports (GET)'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;