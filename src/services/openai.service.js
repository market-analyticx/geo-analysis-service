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

  // OpenAI API errors
  if (err.name === 'OpenAIError' || err.type === 'invalid_request_error') {
    statusCode = 400;
    message = 'OpenAI API error: ' + err.message;
    errorDetails = {
      type: 'openai_error',
      code: err.code,
      param: err.param
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