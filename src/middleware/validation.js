const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validation schema for brand analysis request
 */
const brandAnalysisSchema = Joi.object({
  brandName: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Brand name cannot be empty',
      'string.min': 'Brand name must be at least 1 character long',
      'string.max': 'Brand name cannot exceed 100 characters',
      'any.required': 'Brand name is required'
    }),
    
  includeHistory: Joi.boolean()
    .optional()
    .default(false),
    
  priority: Joi.string()
    .valid('low', 'normal', 'high')
    .optional()
    .default('normal'),
    
  metadata: Joi.object()
    .optional()
    .default({})
});

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      allowUnknown: false,
      stripUnknown: true
    });
    
    if (error) {
      logger.warn('Validation failed', {
        error: error.details,
        body: req.body,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context.value
        }))
      });
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validate brand analysis request
 */
const validateBrandAnalysis = validate(brandAnalysisSchema);

module.exports = {
  validate,
  validateBrandAnalysis,
  schemas: {
    brandAnalysisSchema
  }
};