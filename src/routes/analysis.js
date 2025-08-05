const express = require('express');
const brandService = require('../services/brand.service');
const { validateBrandAnalysis, validateComprehensiveBrandAnalysis } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/analysis/comprehensive
 * Comprehensive brand analysis with full form data
 */
router.post('/comprehensive', validateComprehensiveBrandAnalysis, asyncHandler(async (req, res) => {
  const formData = req.body;

  logger.info('Comprehensive brand analysis request received', {
    brandName: formData.brandName,
    websiteUrl: formData.websiteUrl,
    email: formData.email,
    hasCompetitors: formData.competitors?.length > 0,
    hasTopics: formData.topics?.length > 0,
    hasPrompts: formData.prompts?.length > 0,
    hasPersonas: Boolean(formData.personas?.trim()),
    ip: req.ip
  });

  const result = await brandService.analyzeComprehensiveBrand(formData, {
    requestIp: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Return comprehensive response with the full analysis text for UI display
  res.json({
    success: true,
    message: `Comprehensive analysis completed for ${formData.brandName}`,
    result: {
      brandName: result.brandName,
      websiteUrl: result.websiteUrl,
      email: result.email,
      fileName: result.fileName,
      filePath: result.filePath,
      brandFolder: result.brandFolder,
      requestId: result.requestId,
      analysisText: result.analysisText, // Full analysis for UI display
      tokensUsed: result.metadata.tokensUsed,
      inputTokens: result.metadata.inputTokens,
      outputTokens: result.metadata.outputTokens,
      processingTime: result.metadata.processingTime,
      createdAt: result.metadata.createdAt,
      model: result.metadata.model,
      responseQuality: {
        responseLength: result.metadata.responseLength,
        qualityLevel: result.metadata.responseLength > 5000 ? 'COMPREHENSIVE' : 'STANDARD',
        wordCount: Math.round(result.metadata.responseLength / 5),
        formDataProcessed: result.metadata.formDataProcessed
      }
    }
  });
}));

/**
 * POST /api/analysis
 * Legacy brand analysis (backward compatibility)
 */
router.post('/', validateBrandAnalysis, asyncHandler(async (req, res) => {
  const { brandName, includeHistory, priority, metadata } = req.body;

  logger.info('Legacy brand analysis request received', {
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
        responseLength: result.metadata.responseLength,
        qualityLevel: result.metadata.responseLength > 5000 ? 'COMPREHENSIVE' : 'STANDARD',
        wordCount: Math.round(result.metadata.responseLength / 5)
      }
    }
  });
}));

/**
 * GET /api/analysis/brands
 * Get list of all analyzed brands
 */
router.get('/brands', asyncHandler(async (req, res) => {
  const brands = await brandService.getAllBrands();
  
  res.json({
    success: true,
    message: `Found ${brands.length} brands`,
    data: brands
  });
}));

/**
 * GET /api/analysis/files
 * Get list of all saved files with brand organization
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
    message: `Found ${allFiles.length} files across ${new Set(allFiles.map(f => f.brandName)).size} brands`,
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
  const { brandFolder } = req.query;

  const fileData = await brandService.getReport(fileName, brandFolder);

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
  const { brandFolder } = req.query;

  const fileData = await brandService.getReport(fileName, brandFolder);
  
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
  const { brandFolder } = req.query;

  await brandService.deleteReport(fileName, brandFolder);

  res.json({
    success: true,
    message: `File ${fileName} deleted successfully${brandFolder ? ` from brand ${brandFolder}` : ''}`
  });
}));

/**
 * GET /api/analysis/statistics
 * Get service statistics with brand breakdown
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const stats = await brandService.getStatistics();

  res.json({
    success: true,
    message: 'Service statistics with brand organization',
    data: stats
  });
}));

/**
 * POST /api/analysis/bulk
 * Analyze multiple brands (legacy support)
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
    description: 'Comprehensive AI/LLM Brand Visibility Analysis with Claude AI',
    version: '2.0.0',
    aiProvider: 'Anthropic Claude',
    endpoints: {
      'POST /api/analysis/comprehensive': {
        description: 'Comprehensive brand analysis with full form data',
        body: {
          brandName: 'string (required) - Full company brand name',
          websiteUrl: 'string (required) - Company website URL',
          email: 'string (required) - Contact email address',
          competitors: 'array (optional) - List of competitor names/URLs (max 5)',
          topics: 'array (optional) - Key topics to focus on (max 4)', 
          prompts: 'array (optional) - Test prompts for AI platforms (max 4)',
          personas: 'string (optional) - Target customer personas description',
          priority: 'string (optional) - low|normal|high',
          includeHistory: 'boolean (optional)'
        },
        response: 'Includes full analysis text for UI display'
      },
      'POST /api/analysis': {
        description: 'Legacy brand analysis (backward compatibility)',
        body: {
          brandName: 'string (required)',
          websiteUrl: 'string (optional)',
          priority: 'string (optional): low|normal|high',
          includeHistory: 'boolean (optional)'
        }
      },
      'GET /api/analysis/brands': {
        description: 'List all analyzed brands with folder organization'
      },
      'GET /api/analysis/files': {
        description: 'List all analysis files with brand organization',
        query: {
          brandName: 'string (optional): filter by brand name',
          fromDate: 'date (optional): filter from date',
          toDate: 'date (optional): filter to date',
          limit: 'number (optional): max results (default: 50)',
          offset: 'number (optional): skip results (default: 0)'
        }
      },
      'GET /api/analysis/files/:fileName': {
        description: 'Get content of specific file',
        query: {
          brandFolder: 'string (optional): specific brand folder'
        }
      },
      'GET /api/analysis/files/:fileName/download': {
        description: 'Download specific file',
        query: {
          brandFolder: 'string (optional): specific brand folder'
        }
      },
      'DELETE /api/analysis/files/:fileName': {
        description: 'Delete specific file',
        query: {
          brandFolder: 'string (optional): specific brand folder'
        }
      },
      'GET /api/analysis/statistics': {
        description: 'Get service statistics with brand breakdown'
      },
      'POST /api/analysis/bulk': {
        description: 'Analyze multiple brands (legacy)',
        body: {
          brands: 'array of strings (max 10 brands)'
        }
      }
    },
    authentication: 'Add Authorization header: Bearer YOUR_API_KEY',
    fileLocation: './reports/ (organized by brand folders)',
    features: {
      brandFolders: 'Each brand gets its own folder for organized storage',
      comprehensiveAnalysis: '6,000-8,000 word detailed reports',
      formDataIntegration: 'Client-specified competitors, topics, prompts, personas',
      aiGeneration: 'Auto-generation of missing analysis components',
      fullTextResponse: 'Complete analysis text returned for UI display'
    },
    examples: {
      comprehensive: `curl -X POST http://localhost:3000/api/analysis/comprehensive \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brandName": "Oxagile",
    "websiteUrl": "https://www.oxagile.com",
    "email": "contact@oxagile.com",
    "competitors": ["EPAM", "Globant"],
    "topics": ["Software Development", "AI Solutions"],
    "prompts": ["best software development companies for fintech"],
    "personas": "CTOs at mid-size fintech companies"
  }'`,
      listBrands: 'curl -H "Authorization: Bearer YOUR_KEY" http://localhost:3000/api/analysis/brands',
      downloadFile: 'curl -H "Authorization: Bearer YOUR_KEY" "http://localhost:3000/api/analysis/files/filename.txt/download?brandFolder=oxagile" -o report.txt'
    }
  });
});

module.exports = router;