const express = require('express');
const openaiService = require('../services/openai.service');
const brandService = require('../services/brand.service');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Basic health check
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    status: 'ok',
    service: 'LLM Brand Analysis Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}));

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const checks = {};
  let overallStatus = 'ok';

  // Check OpenAI service
  try {
    const openaiStatus = await openaiService.getStatus();
    checks.openai = openaiStatus;
    if (openaiStatus.status !== 'operational') {
      overallStatus = 'degraded';
    }
  } catch (error) {
    checks.openai = {
      status: 'error',
      error: error.message
    };
    overallStatus = 'error';
  }

  // Check file system (reports directory)
  try {
    const stats = await brandService.getStatistics();
    checks.filesystem = {
      status: 'operational',
      reportsDirectory: 'accessible',
      totalReports: stats.totalReports
    };
  } catch (error) {
    checks.filesystem = {
      status: 'error',
      error: error.message
    };
    overallStatus = 'error';
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  checks.memory = {
    status: 'operational',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
  };

  res.json({
    status: overallStatus,
    service: 'LLM Brand Analysis Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks
  });
}));

module.exports = router;