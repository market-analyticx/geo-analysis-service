const { v4: uuidv4 } = require('uuid');
const openaiService = require('./openai.service');
const fileService = require('./file.service');
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
    const fs = require('fs').promises;
    try {
      await fs.access(this.reportsDir);
    } catch (error) {
      await fs.mkdir(this.reportsDir, { recursive: true });
      logger.info(`Created reports directory: ${this.reportsDir}`);
    }
  }

  /**
   * Analyze a brand and save to file only
   * @param {string} brandName - The brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result with file info
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
      
      // Prepare metadata
      const metadata = {
        ...analysisResult.metadata,
        requestId,
        totalProcessingTime: Date.now() - startTime,
        createdAt: new Date().toISOString(),
        options
      };

      // Save analysis directly to text file
      const filePath = await fileService.saveAnalysisToFile(
        brandName, 
        analysisResult.analysis, 
        metadata
      );

      logger.info(`Brand analysis completed and saved to file`, {
        requestId,
        brandName,
        filePath,
        totalProcessingTime: metadata.totalProcessingTime
      });

      return {
        success: true,
        requestId,
        brandName,
        message: `Analysis completed and saved to file`,
        filePath,
        fileName: filePath.split('/').pop(),
        metadata: {
          tokensUsed: metadata.tokensUsed,
          processingTime: metadata.totalProcessingTime,
          createdAt: metadata.createdAt,
          model: metadata.model
        }
      };

    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      
      logger.error(`Brand analysis failed`, {
        requestId,
        brandName,
        error: error.message,
        totalProcessingTime
      });

      throw error;
    }
  }

  /**
   * Get all saved files
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of files
   */
  async getAllReports(filters = {}) {
    try {
      const files = await fileService.getFilesList();
      
      // Apply brand name filter if provided
      let filteredFiles = files;
      if (filters.brandName) {
        const searchTerm = filters.brandName.toLowerCase();
        filteredFiles = files.filter(file => 
          file.fileName.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply date filters if provided
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
   * @param {string} fileName - File name
   * @returns {Promise<Object>} File content and info
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
   * @param {string} fileName - File name
   * @returns {Promise<boolean>} Success status
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
   * @returns {Promise<Object>} Service statistics
   */
  async getStatistics() {
    try {
      const fileStats = await fileService.getStatistics();
      const files = await fileService.getFilesList();
      
      return {
        totalFiles: fileStats.totalFiles,
        totalSize: fileStats.totalSize,
        totalSizeFormatted: this.formatFileSize(fileStats.totalSize),
        averageSize: fileStats.averageSize,
        averageSizeFormatted: this.formatFileSize(fileStats.averageSize),
        latestFile: fileStats.latestFile,
        oldestFile: fileStats.oldestFile,
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
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size
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