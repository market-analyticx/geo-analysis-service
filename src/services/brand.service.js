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
   * Comprehensive brand analysis with form data
   * @param {Object} formData - Complete form data from client
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeComprehensiveBrand(formData, options = {}) {
    const requestId = uuidv4();
    const startTime = Date.now();

    logger.info(`Starting comprehensive brand analysis`, { 
      requestId, 
      brandName: formData.brandName,
      websiteUrl: formData.websiteUrl,
      email: formData.email,
      hasCompetitors: formData.competitors?.length > 0,
      hasTopics: formData.topics?.length > 0,
      hasPrompts: formData.prompts?.length > 0,
      hasPersonas: Boolean(formData.personas?.trim())
    });

    try {
      // Validate required fields
      this.validateFormData(formData);

      // Get comprehensive analysis from Claude
      const analysisResult = await claudeService.analyzeBrandComprehensive(formData, options);
      
      // Prepare metadata
      const metadata = {
        ...analysisResult.metadata,
        requestId,
        totalProcessingTime: Date.now() - startTime,
        createdAt: new Date().toISOString(),
        options,
        clientInfo: {
          email: formData.email,
          brandName: formData.brandName,
          websiteUrl: formData.websiteUrl
        }
      };

      // Save to brand-specific folder
      const filePath = await fileService.saveAnalysisToFile(
        formData.brandName, 
        analysisResult.analysis, 
        metadata,
        formData
      );

      logger.info(`Comprehensive brand analysis completed`, {
        requestId,
        brandName: formData.brandName,
        filePath,
        totalProcessingTime: metadata.totalProcessingTime,
        responseLength: analysisResult.analysis.length,
        email: formData.email
      });

      return {
        success: true,
        requestId,
        brandName: formData.brandName,
        websiteUrl: formData.websiteUrl,
        email: formData.email,
        filePath,
        fileName: filePath.split('/').pop(),
        brandFolder: filePath.split('/').slice(-2, -1)[0],
        analysisText: analysisResult.analysis, // Return full text for UI display
        metadata: {
          tokensUsed: metadata.tokensUsed,
          inputTokens: metadata.inputTokens,
          outputTokens: metadata.outputTokens,
          processingTime: metadata.totalProcessingTime,
          createdAt: metadata.createdAt,
          model: metadata.model,
          responseLength: metadata.responseLength,
          formDataProcessed: metadata.formDataProcessed
        }
      };

    } catch (error) {
      logger.error(`Comprehensive brand analysis failed`, {
        requestId,
        brandName: formData.brandName,
        email: formData.email,
        error: error.message,
        totalProcessingTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Legacy brand analysis (backward compatibility)
   * @param {string} brandName - The brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBrand(brandName, options = {}) {
    const requestId = uuidv4();
    const startTime = Date.now();

    logger.info(`Starting legacy brand analysis`, { requestId, brandName });

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

      // Save to brand-specific folder (legacy format)
      const legacyFormData = {
        brandName,
        websiteUrl: options.websiteUrl || '',
        email: 'legacy@analysis.com',
        competitors: [],
        topics: [],
        prompts: [],
        personas: ''
      };

      const filePath = await fileService.saveAnalysisToFile(
        brandName, 
        analysisResult.analysis, 
        metadata,
        legacyFormData
      );

      logger.info(`Legacy brand analysis completed`, {
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
      logger.error(`Legacy brand analysis failed`, {
        requestId,
        brandName,
        error: error.message,
        totalProcessingTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Validate form data
   * @param {Object} formData - Form data to validate
   */
  validateFormData(formData) {
    const errors = [];

    if (!formData.brandName || formData.brandName.trim() === '') {
      errors.push('Brand name is required');
    }

    if (!formData.websiteUrl || formData.websiteUrl.trim() === '') {
      errors.push('Website URL is required');
    }

    if (!formData.email || formData.email.trim() === '') {
      errors.push('Email address is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Invalid email format');
    }

    // Validate URL format
    try {
      new URL(formData.websiteUrl);
    } catch (error) {
      errors.push('Invalid website URL format');
    }

    // Validate array lengths
    if (formData.competitors && formData.competitors.length > 5) {
      errors.push('Maximum 5 competitors allowed');
    }

    if (formData.topics && formData.topics.length > 4) {
      errors.push('Maximum 4 topics allowed');
    }

    if (formData.prompts && formData.prompts.length > 4) {
      errors.push('Maximum 4 prompts allowed');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get all saved reports with brand organization
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
          file.brandName.toLowerCase().includes(searchTerm) ||
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
        brandName: file.brandName,
        brandFolder: file.brandFolder,
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
   * Get all brands
   * @returns {Promise<Array>} List of brands
   */
  async getAllBrands() {
    try {
      const brands = await fileService.getBrandsList();
      
      return brands.map(brand => ({
        brandName: brand.brandName,
        folderPath: brand.folderPath,
        fileCount: brand.fileCount,
        totalSize: brand.totalSize,
        totalSizeFormatted: this.formatFileSize(brand.totalSize),
        lastModified: new Date(brand.lastModified).toISOString(),
        created: brand.created
      }));
      
    } catch (error) {
      logger.error(`Failed to get brands: ${error.message}`);
      throw new Error('Failed to retrieve brands');
    }
  }

  /**
   * Get specific file content
   */
  async getReport(fileName, brandFolder = null) {
    try {
      const content = await fileService.readFile(fileName, brandFolder);
      const files = await fileService.getFilesList();
      const fileInfo = files.find(f => f.fileName === fileName && 
        (brandFolder ? f.brandFolder === brandFolder : true));
      
      if (!fileInfo) {
        throw new Error(`File not found: ${fileName}`);
      }
      
      return {
        fileName: fileInfo.fileName,
        brandName: fileInfo.brandName,
        brandFolder: fileInfo.brandFolder,
        content,
        size: fileInfo.size,
        sizeFormatted: this.formatFileSize(fileInfo.size),
        created: fileInfo.created,
        modified: fileInfo.modified
      };
      
    } catch (error) {
      logger.error(`Failed to get report: ${error.message}`, { fileName, brandFolder });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteReport(fileName, brandFolder = null) {
    try {
      const success = await fileService.deleteFile(fileName, brandFolder);
      logger.info(`Report deleted: ${fileName}${brandFolder ? ` from brand: ${brandFolder}` : ''}`);
      return success;
    } catch (error) {
      logger.error(`Failed to delete report: ${error.message}`, { fileName, brandFolder });
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
        totalBrands: fileStats.totalBrands,
        totalSize: fileStats.totalSize,
        totalSizeFormatted: this.formatFileSize(fileStats.totalSize),
        averageSize: fileStats.averageSize,
        averageSizeFormatted: this.formatFileSize(fileStats.averageSize),
        latestFile: fileStats.latestFile,
        brandBreakdown: fileStats.brandBreakdown.map(brand => ({
          ...brand,
          totalSizeFormatted: this.formatFileSize(brand.totalSize)
        })),
        recentFiles: files.slice(0, 5).map(file => ({
          fileName: file.fileName,
          brandName: file.brandName,
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