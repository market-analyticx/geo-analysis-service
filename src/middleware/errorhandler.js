const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;
  let errorDetails = {};

  // Claude API errors
  if (err.message && err.message.includes('Claude API')) {
    statusCode = 400;
    message = err.message;
    errorDetails = {
      type: 'claude_error',
      provider: 'anthropic'
    };
  }
  
  // Rate limit errors
  if (err.message && err.message.includes('rate limit')) {
    statusCode = 429;
    message = 'Rate limit exceeded. Please try again later.';
    errorDetails = {
      type: 'rate_limit_error'
    };
  }
  
  // Network/timeout errors
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
    statusCode = 503;
    message = 'Service temporarily unavailable. Please try again later.';
    errorDetails = {
      type: 'network_error',
      code: err.code
    };
  }

  // Authentication errors
  if (err.status === 401 || err.message.includes('API key')) {
    statusCode = 401;
    if (err.message.includes('Claude')) {
      message = 'Claude API authentication failed. Please check your API key.';
    }
    errorDetails = {
      type: 'auth_error'
    };
  }

  // Log error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    statusCode,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });

  // Response format
  const errorResponse = {
    success: false,
    error: message,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };

  // Add error details in development
  if (config.nodeEnv === 'development') {
    errorResponse.details = errorDetails;
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler
};