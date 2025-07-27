const express = require('express');
const brandService = require('../services/brand.service');
const { validateBrandAnalysis } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/analysis
 * Analyze a brand's LLM visibility
 */
router.post('/', validateBrandAnalysis, asyncHandler(async (req, res) => {
  const { brandName, includeHistory, priority, metadata } = req.body;

  logger.info('Brand analysis request received', {
    brandName,
    includeHistory,
    priority,
    ip: req.ip
  });

  const result = await brandService.analyzeBrand(brandName, {
    includeHistory,
    priority,
    metadata,
    requestIp: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json(result);
}));

/**
 * GET /api/analysis/reports
 * Get list of all reports with optional filtering
 */
router.get('/reports', asyncHandler(async (req, res) => {
  const {
    brandName,
    success,
    fromDate,
    toDate,
    limit = 50,
    offset = 0
  } = req.query;

  const filters = {};
  if (brandName) filters.brandName = brandName;
  if (success !== undefined) filters.success = success === 'true';
  if (fromDate) filters.fromDate = fromDate;
  if (toDate) filters.toDate = toDate;

  const allReports = await brandService.getAllReports(filters);
  
  // Apply pagination
  const reports = allReports.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    data: reports,
    pagination: {
      total: allReports.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < allReports.length
    }
  });
}));

/**
 * GET /api/analysis/reports/:requestId
 * Get specific report by request ID
 */
router.get('/reports/:requestId', asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const report = await brandService.getReport(requestId);

  res.json({
    success: true,
    data: report
  });
}));

/**
 * DELETE /api/analysis/reports/:requestId
 * Delete specific report by request ID
 */
router.delete('/reports/:requestId', asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  await brandService.deleteReport(requestId);

  res.json({
    success: true,
    message: 'Report deleted successfully',
    requestId
  });
}));

/**
 * GET /api/analysis/statistics
 * Get service statistics
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const stats = await brandService.getStatistics();

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * POST /api/analysis/bulk
 * Analyze multiple brands (for future enhancement)
 */
router.post('/bulk', asyncHandler(async (req, res) => {
  const { brands } = req.body;

  if (!Array.isArray(brands) || brands.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Brands array is required and must not be empty'
    });
  }

  if (brands.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 10 brands allowed per bulk request'
    });
  }

  const results = [];
  const errors = [];

  for (const brandName of brands) {
    try {
      const result = await brandService.analyzeBrand(brandName, {
        requestIp: req.ip,
        userAgent: req.get('User-Agent'),
        bulkRequest: true
      });
      results.push(result);
    } catch (error) {
      errors.push({
        brandName,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    data: {
      successful: results,
      failed: errors,
      summary: {
        total: brands.length,
        successful: results.length,
        failed: errors.length
      }
    }
  });
}));

module.exports = router;