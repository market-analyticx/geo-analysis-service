const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validation schema for comprehensive brand analysis request
 */
const comprehensiveBrandAnalysisSchema = Joi.object({
  // Required fields
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
    
  websiteUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.uri': 'Website URL must be a valid HTTP or HTTPS URL',
      'any.required': 'Website URL is required'
    }),
    
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email address is required'
    }),

  // Optional arrays - can be empty
  competitors: Joi.array()
    .items(Joi.string().trim().min(1).max(100))
    .max(5)
    .default([])
    .messages({
      'array.max': 'Maximum 5 competitors allowed'
    }),
    
  topics: Joi.array()
    .items(Joi.string().trim().min(1).max(200))
    .max(4)
    .default([])
    .messages({
      'array.max': 'Maximum 4 topics allowed'
    }),
    
  prompts: Joi.array()
    .items(Joi.string().trim().min(10).max(500))
    .max(4)
    .default([])
    .messages({
      'array.max': 'Maximum 4 prompts allowed',
      'string.min': 'Each prompt must be at least 10 characters long',
      'string.max': 'Each prompt cannot exceed 500 characters'
    }),

  // Optional text field
  personas: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .default('')
    .messages({
      'string.max': 'Personas description cannot exceed 1000 characters'
    }),

  // Optional metadata
  priority: Joi.string()
    .valid('low', 'normal', 'high')
    .optional()
    .default('normal'),
    
  includeHistory: Joi.boolean()
    .optional()
    .default(false),
    
  metadata: Joi.object()
    .optional()
    .default({})
});

/**
 * Legacy validation schema for backward compatibility
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
    
  websiteUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .messages({
      'string.uri': 'Website URL must be a valid HTTP or HTTPS URL'
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
      stripUnknown: true,
      abortEarly: false // Return all validation errors
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
 * Validate comprehensive brand analysis request
 */
const validateComprehensiveBrandAnalysis = validate(comprehensiveBrandAnalysisSchema);

/**
 * Validate legacy brand analysis request (backward compatibility)
 */
const validateBrandAnalysis = validate(brandAnalysisSchema);

module.exports = {
  validate,
  validateBrandAnalysis,
  validateComprehensiveBrandAnalysis,
  schemas: {
    brandAnalysisSchema,
    comprehensiveBrandAnalysisSchema
  }
};