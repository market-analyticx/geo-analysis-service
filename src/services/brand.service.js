const { v4: uuidv4 } = require('uuid');
const claudeService = require('./claude.service');
const fileService = require('./file.service');
const config = require('../config/config');
const logger = require('../utils/logger');

class BrandService {
  constructor() {
    this.reportsDir = config.reportsDir;
  }

  /**
   * Analyze a brand and save to file
   * @param {string} brandName - The brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBrand(brandName, options = {}) {
    const requestId = uuidv4();
    const startTime = Date.now();

    logger.info(`Starting brand analysis`, { requestId, brandName });

    try {
      // Get analysis from Claude
      const analysisResult = await claudeService.analyzeBrand(brandName, {
        ...options,
        websiteUrl: options.websiteUrl
      });
      
      // Prepare metadata
      const metadata = {
        ...analysisResult.metadata,
        requestId,
        totalProcessingTime: Date.now() - startTime,
        createdAt: new Date().toISOString(),
        options
      };

      // Save to file
      const filePath = await fileService.saveAnalysisToFile(
        brandName, 
        analysisResult.analysis, 
        metadata
      );

      logger.info(`Brand analysis completed`, {
        requestId,
        brandName,
        filePath,
        totalProcessingTime: metadata.totalProcessingTime,
        responseLength: analysisResult.analysis.length
      });

      return {
        success: true,
        requestId,
        brandName,
        filePath,
        fileName: filePath.split('/').pop(),
        metadata: {
          tokensUsed: metadata.tokensUsed,
          inputTokens: metadata.inputTokens,
          outputTokens: metadata.outputTokens,
          processingTime: metadata.totalProcessingTime,
          createdAt: metadata.createdAt,
          model: metadata.model,
          responseLength: metadata.responseLength
        }
      };

    } catch (error) {
      logger.error(`Brand analysis failed`, {
        requestId,
        brandName,
        error: error.message,
        totalProcessingTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Get all saved reports
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of files
   */
  async getAllReports(filters = {}) {
    try {
      const files = await fileService.getFilesList();
      
      let filteredFiles = files;
      
      if (filters.brandName) {
        const searchTerm = filters.brandName.toLowerCase();
        filteredFiles = files.filter(file => 
          file.fileName.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        filteredFiles = filteredFiles.filter(file => 
          new Date(file.created) >= fromDate
        );
      }
      
      if (filters.toDate) {
        const toDate = new Date(filters.toDate);
        filteredFiles = filteredFiles.filter(file => 
          new Date(file.created) <= toDate
        );
      }
      
      return filteredFiles.map(file => ({
        fileName: file.fileName,
        filePath: file.filePath,
        size: file.size,
        sizeFormatted: this.formatFileSize(file.size),
        created: file.created,
        modified: file.modified
      }));
      
    } catch (error) {
      logger.error(`Failed to get reports: ${error.message}`);
      throw new Error('Failed to retrieve reports');
    }
  }

  /**
   * Get specific file content
   */
  async getReport(fileName) {
    try {
      const content = await fileService.readFile(fileName);
      const files = await fileService.getFilesList();
      const fileInfo = files.find(f => f.fileName === fileName);
      
      if (!fileInfo) {
        throw new Error(`File not found: ${fileName}`);
      }
      
      return {
        fileName: fileInfo.fileName,
        content,
        size: fileInfo.size,
        sizeFormatted: this.formatFileSize(fileInfo.size),
        created: fileInfo.created,
        modified: fileInfo.modified
      };
      
    } catch (error) {
      logger.error(`Failed to get report: ${error.message}`, { fileName });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteReport(fileName) {
    try {
      const success = await fileService.deleteFile(fileName);
      logger.info(`Report deleted: ${fileName}`);
      return success;
    } catch (error) {
      logger.error(`Failed to delete report: ${error.message}`, { fileName });
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  async getStatistics() {
    try {
      const fileStats = await fileService.getStatistics();
      const files = await fileService.getFilesList();
      
      return {
        totalReports: fileStats.totalFiles,
        totalSize: fileStats.totalSize,
        totalSizeFormatted: this.formatFileSize(fileStats.totalSize),
        averageSize: fileStats.averageSize,
        averageSizeFormatted: this.formatFileSize(fileStats.averageSize),
        latestFile: fileStats.latestFile,
        recentFiles: files.slice(0, 5).map(file => ({
          fileName: file.fileName,
          size: this.formatFileSize(file.size),
          created: file.created
        }))
      };
      
    } catch (error) {
      logger.error(`Failed to get statistics: ${error.message}`);
      throw new Error('Failed to retrieve statistics');
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new BrandService();