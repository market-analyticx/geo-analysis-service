const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const openaiService = require('./openai.service');
const config = require('../config/config');
const logger = require('../utils/logger');

class BrandService {
  constructor() {
    this.reportsDir = config.reportsDir;
    this.ensureReportsDirectory();
  }

  /**
   * Ensure reports directory exists
   */
  async ensureReportsDirectory() {
    try {
      await fs.access(this.reportsDir);
    } catch (error) {
      await fs.mkdir(this.reportsDir, { recursive: true });
      logger.info(`Created reports directory: ${this.reportsDir}`);
    }
  }

  /**
   * Analyze a brand and save the report
   * @param {string} brandName - The brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result with report info
   */
  async analyzeBrand(brandName, options = {}) {
    const requestId = uuidv4();
    const startTime = Date.now();

    logger.info(`Starting brand analysis request`, {
      requestId,
      brandName,
      options
    });

    try {
      // Perform OpenAI analysis
      const analysisResult = await openaiService.analyzeBrand(brandName, options);
      
      // Create report object
      const report = {
        requestId,
        brandName,
        analysis: analysisResult.analysis,
        metadata: {
          ...analysisResult.metadata,
          requestId,
          totalProcessingTime: Date.now() - startTime,
          createdAt: new Date().toISOString(),
          options
        }
      };

      // Save report to file
      await this.saveReport(report);

      logger.info(`Brand analysis completed successfully`, {
        requestId,
        brandName,
        totalProcessingTime: report.metadata.totalProcessingTime
      });

      return {
        success: true,
        requestId,
        brandName,
        analysis: report.analysis,
        metadata: report.metadata,
        reportPath: this.getReportPath(requestId)
      };

    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      
      logger.error(`Brand analysis failed`, {
        requestId,
        brandName,
        error: error.message,
        totalProcessingTime
      });

      // Save error report
      const errorReport = {
        requestId,
        brandName,
        success: false,
        error: {
          message: error.message,
          type: error.constructor.name,
          timestamp: new Date().toISOString()
        },
        metadata: {
          requestId,
          totalProcessingTime,
          createdAt: new Date().toISOString(),
          options
        }
      };

      await this.saveReport(errorReport, true);

      throw error;
    }
  }

  /**
   * Save report to file system
   * @param {Object} report - Report data
   * @param {boolean} isError - Whether this is an error report
   */
  async saveReport(report, isError = false) {
    const fileName = this.generateReportFileName(report.requestId, report.brandName, isError);
    const filePath = path.join(this.reportsDir, fileName);

    try {
      await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf8');
      logger.debug(`Report saved: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to save report: ${error.message}`, {
        filePath,
        requestId: report.requestId
      });
      // Don't throw here - we don't want to fail the analysis just because we couldn't save
    }
  }

  /**
   * Generate report file name
   * @param {string} requestId - Request ID
   * @param {string} brandName - Brand name
   * @param {boolean} isError - Whether this is an error report
   * @returns {string} File name
   */
  generateReportFileName(requestId, brandName, isError = false) {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const sanitizedBrandName = brandName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const prefix = isError ? 'ERROR' : 'REPORT';
    
    return `${prefix}_${sanitizedBrandName}_${timestamp}_${requestId.split('-')[0]}.json`;
  }

  /**
   * Get report file path
   * @param {string} requestId - Request ID
   * @returns {string} Report file path
   */
  getReportPath(requestId) {
    return path.join(this.reportsDir, `*${requestId.split('-')[0]}*.json`);
  }

  /**
   * Get all reports
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of reports
   */
  async getAllReports(filters = {}) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reportFiles = files.filter(file => file.endsWith('.json'));
      
      const reports = [];
      
      for (const file of reportFiles) {
        try {
          const filePath = path.join(this.reportsDir, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const report = JSON.parse(fileContent);
          
          // Apply filters
          if (filters.brandName && !report.brandName.toLowerCase().includes(filters.brandName.toLowerCase())) {
            continue;
          }
          
          if (filters.success !== undefined && report.success !== filters.success) {
            continue;
          }
          
          if (filters.fromDate && new Date(report.metadata.createdAt) < new Date(filters.fromDate)) {
            continue;
          }
          
          if (filters.toDate && new Date(report.metadata.createdAt) > new Date(filters.toDate)) {
            continue;
          }
          
          reports.push({
            fileName: file,
            requestId: report.requestId,
            brandName: report.brandName,
            success: report.success !== false,
            createdAt: report.metadata.createdAt,
            processingTime: report.metadata.totalProcessingTime,
            tokensUsed: report.metadata.tokensUsed || 0
          });
        } catch (parseError) {
          logger.warn(`Failed to parse report file: ${file}`, {
            error: parseError.message
          });
        }
      }
      
      // Sort by creation date (newest first)
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return reports;
    } catch (error) {
      logger.error(`Failed to get reports: ${error.message}`);
      throw new Error('Failed to retrieve reports');
    }
  }

  /**
   * Get specific report by request ID
   * @param {string} requestId - Request ID
   * @returns {Promise<Object>} Report data
   */
  async getReport(requestId) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reportFile = files.find(file => file.includes(requestId.split('-')[0]));
      
      if (!reportFile) {
        throw new Error(`Report not found for request ID: ${requestId}`);
      }
      
      const filePath = path.join(this.reportsDir, reportFile);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const report = JSON.parse(fileContent);
      
      return report;
    } catch (error) {
      logger.error(`Failed to get report: ${error.message}`, {
        requestId
      });
      throw error;
    }
  }

  /**
   * Delete report by request ID
   * @param {string} requestId - Request ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteReport(requestId) {
    try {
      const files = await fs.readdir(this.reportsDir);
      const reportFile = files.find(file => file.includes(requestId.split('-')[0]));
      
      if (!reportFile) {
        throw new Error(`Report not found for request ID: ${requestId}`);
      }
      
      const filePath = path.join(this.reportsDir, reportFile);
      await fs.unlink(filePath);
      
      logger.info(`Report deleted: ${reportFile}`, {
        requestId
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete report: ${error.message}`, {
        requestId
      });
      throw error;
    }
  }

  /**
   * Get service statistics
   * @returns {Promise<Object>} Service statistics
   */
  async getStatistics() {
    try {
      const reports = await this.getAllReports();
      
      const stats = {
        totalReports: reports.length,
        successfulReports: reports.filter(r => r.success).length,
        failedReports: reports.filter(r => !r.success).length,
        totalTokensUsed: reports.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
        averageProcessingTime: reports.length > 0 
          ? Math.round(reports.reduce((sum, r) => sum + (r.processingTime || 0), 0) / reports.length)
          : 0,
        uniqueBrands: [...new Set(reports.map(r => r.brandName))].length,
        recentReports: reports.slice(0, 5),
        lastAnalysis: reports.length > 0 ? reports[0].createdAt : null
      };
      
      return stats;
    } catch (error) {
      logger.error(`Failed to get statistics: ${error.message}`);
      throw new Error('Failed to retrieve statistics');
    }
  }
}

module.exports = new BrandService();