const express = require('express');
const brandService = require('../services/brand.service');
const { validateBrandAnalysis } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/analysis
 * Analyze a brand and save to text file
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

  // Return comprehensive response with quality metrics
  res.json({
    success: true,
    message: `Analysis completed for ${brandName}`,
    result: {
      brandName: result.brandName,
      fileName: result.fileName,
      filePath: result.filePath,
      requestId: result.requestId,
      tokensUsed: result.metadata.tokensUsed,
      inputTokens: result.metadata.inputTokens,
      outputTokens: result.metadata.outputTokens,
      processingTime: result.metadata.processingTime,
      createdAt: result.metadata.createdAt,
      model: result.metadata.model,
      responseQuality: {
        enhanced: result.metadata.enhancedResponse,
        responseLength: result.metadata.responseLength,
        qualityLevel: result.metadata.responseLength > 5000 ? 'COMPREHENSIVE' : 'STANDARD',
        wordCount: Math.round(result.metadata.responseLength / 5) // Approximate word count
      }
    }
  });
}));

/**
 * GET /api/analysis/files
 * Get list of all saved files
 */
router.get('/files', asyncHandler(async (req, res) => {
  const {
    brandName,
    fromDate,
    toDate,
    limit = 50,
    offset = 0
  } = req.query;

  const filters = {};
  if (brandName) filters.brandName = brandName;
  if (fromDate) filters.fromDate = fromDate;
  if (toDate) filters.toDate = toDate;

  const allFiles = await brandService.getAllReports(filters);
  
  // Apply pagination
  const files = allFiles.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({
    success: true,
    message: `Found ${allFiles.length} files`,
    data: files,
    pagination: {
      total: allFiles.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: parseInt(offset) + parseInt(limit) < allFiles.length
    }
  });
}));

/**
 * GET /api/analysis/files/:fileName
 * Get specific file content
 */
router.get('/files/:fileName', asyncHandler(async (req, res) => {
  const { fileName } = req.params;

  const fileData = await brandService.getReport(fileName);

  res.json({
    success: true,
    data: fileData
  });
}));

/**
 * GET /api/analysis/files/:fileName/download
 * Download specific file
 */
router.get('/files/:fileName/download', asyncHandler(async (req, res) => {
  const { fileName } = req.params;

  const fileData = await brandService.getReport(fileName);
  
  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `attachment; filename="${fileName}"`
  });
  
  res.send(fileData.content);
}));

/**
 * DELETE /api/analysis/files/:fileName
 * Delete specific file
 */
router.delete('/files/:fileName', asyncHandler(async (req, res) => {
  const { fileName } = req.params;

  await brandService.deleteReport(fileName);

  res.json({
    success: true,
    message: `File ${fileName} deleted successfully`
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
    message: 'Service statistics',
    data: stats
  });
}));

/**
 * POST /api/analysis/bulk
 * Analyze multiple brands and save each to file
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
      
      results.push({
        brandName: result.brandName,
        fileName: result.fileName,
        requestId: result.requestId,
        status: 'success'
      });
    } catch (error) {
      errors.push({
        brandName,
        error: error.message,
        status: 'failed'
      });
    }
  }

  res.json({
    success: true,
    message: `Bulk analysis completed: ${results.length} successful, ${errors.length} failed`,
    data: {
      successful: results,
      failed: errors,
      summary: {
        total: brands.length,
        successful: results.length,
        failed: errors.length,
        successRate: `${((results.length/brands.length)*100).toFixed(1)}%`
      }
    }
  });
}));

/**
 * GET /api/analysis/help
 * Show API usage help
 */
router.get('/help', (req, res) => {
  res.json({
    service: 'Geo Analysis Service',
    description: 'Analyzes brands using Claude AI and saves results to text files',
    aiProvider: 'Anthropic Claude',
    endpoints: {
      'POST /api/analysis': {
        description: 'Analyze a brand and save to text file',
        body: {
          brandName: 'string (required)',
          priority: 'string (optional): low|normal|high',
          includeHistory: 'boolean (optional)'
        }
      },
      'GET /api/analysis/files': {
        description: 'List all saved analysis files',
        query: {
          brandName: 'string (optional): filter by brand name',
          fromDate: 'date (optional): filter from date',
          toDate: 'date (optional): filter to date',
          limit: 'number (optional): max results (default: 50)',
          offset: 'number (optional): skip results (default: 0)'
        }
      },
      'GET /api/analysis/files/:fileName': {
        description: 'Get content of specific file'
      },
      'GET /api/analysis/files/:fileName/download': {
        description: 'Download specific file'
      },
      'DELETE /api/analysis/files/:fileName': {
        description: 'Delete specific file'
      },
      'GET /api/analysis/statistics': {
        description: 'Get service statistics'
      },
      'POST /api/analysis/bulk': {
        description: 'Analyze multiple brands',
        body: {
          brands: 'array of strings (max 10 brands)'
        }
      }
    },
    authentication: 'Add Authorization header: Bearer YOUR_API_KEY',
    fileLocation: './reports/',
    examples: {
      analyze: 'curl -X POST http://localhost:3000/api/analysis -H "Authorization: Bearer YOUR_KEY" -d \'{"brandName": "Apple"}\'',
      listFiles: 'curl -H "Authorization: Bearer YOUR_KEY" http://localhost:3000/api/analysis/files',
      downloadFile: 'curl -H "Authorization: Bearer YOUR_KEY" http://localhost:3000/api/analysis/files/filename.txt/download -o report.txt'
    }
  });
});

module.exports = router;