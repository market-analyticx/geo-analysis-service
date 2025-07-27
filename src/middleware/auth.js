const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Simple API Key Authentication Middleware
 */
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  let providedKey = null;
  
  // Check Authorization header (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.slice(7);
  }
  // Check x-api-key header
  else if (apiKey) {
    providedKey = apiKey;
  }
  
  if (!providedKey) {
    logger.warn('Authentication failed: No API key provided', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide API key in Authorization header (Bearer token) or x-api-key header'
    });
  }
  
  if (providedKey !== config.apiKey) {
    logger.warn('Authentication failed: Invalid API key', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      providedKey: providedKey.substring(0, 8) + '...' // Log partial key for debugging
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }
  
  // Authentication successful
  logger.debug('Authentication successful', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });
  
  next();
};

module.exports = {
  auth
};