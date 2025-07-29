const express = require('express');
const claudeService = require('../services/claude.service');
const brandService = require('../services/brand.service');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Basic health check
 */
router.get('/', asyncHandler(async (req, res) => {
  res.json({
    status: 'ok',
    service: 'Geo Analysis Service',
    version: '1.0.0',
    description: 'Geographic Brand Visibility Analysis using Claude AI',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
}));

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const checks = {};
  let overallStatus = 'ok';

  // Check Claude service
  try {
    const claudeStatus = await claudeService.getStatus();
    checks.claude = claudeStatus;
    if (claudeStatus.status !== 'operational') {
      overallStatus = 'degraded';
    }
  } catch (error) {
    checks.claude = {
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
      logsDirectory: 'accessible',
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
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
  };

  // System information
  checks.system = {
    status: 'operational',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid
  };

  res.json({
    status: overallStatus,
    service: 'Geo Analysis Service',
    version: '1.0.0',
    description: 'Geographic Brand Visibility Analysis using Claude AI',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks
  });
}));

module.exports = router;