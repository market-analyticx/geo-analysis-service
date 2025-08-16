const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');
const config = require('../config/config');
const logger = require('../utils/logger');

class FileService {
  constructor() {
    this.reportsDir = config.reportsDir;
  }

  /**
   * Create brand folder if it doesn't exist
   * @param {string} brandName - Brand name
   * @returns {Promise<string>} Brand folder path
   */
  async createBrandFolder(brandName) {
    try {
      const sanitizedBrandName = this.sanitizeBrandName(brandName);
      const brandFolderPath = path.join(this.reportsDir, sanitizedBrandName);
      
      // Check if folder exists, if not create it
      try {
        await fs.access(brandFolderPath);
        logger.info(`Using existing brand folder: ${sanitizedBrandName}`);
      } catch (error) {
        await fs.mkdir(brandFolderPath, { recursive: true });
        logger.info(`Created new brand folder: ${sanitizedBrandName}`);
      }
      
      return brandFolderPath;
    } catch (error) {
      logger.error(`Failed to create brand folder: ${error.message}`, { brandName });
      throw error;
    }
  }

  /**
   * Sanitize brand name for folder creation
   * @param {string} brandName - Brand name
   * @returns {string} Sanitized name
   */
  sanitizeBrandName(brandName) {
    return brandName
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  /**
   * Save analysis to brand-specific folder
   * @param {string} brandName - Brand name
   * @param {string} analysisText - Analysis content
   * @param {Object} metadata - Request metadata
   * @param {Object} formData - Form data from request
   * @returns {Promise<string>} File path
   */
  async saveAnalysisToFile(brandName, analysisText, metadata, formData = {}) {
    try {
      // Create brand folder
      const brandFolderPath = await this.createBrandFolder(brandName);
      
      // Generate file name with timestamp
      const fileName = this.generateFileName(brandName, metadata.requestId);
      const filePath = path.join(brandFolderPath, fileName);
      
      // Create the file content with form data
      const fileContent = this.createFileContent(brandName, analysisText, metadata, formData);
      
      // Save to file
      await fs.writeFile(filePath, fileContent, 'utf8');
      
      logger.info(`Analysis saved to brand folder: ${fileName}`, {
        brandName,
        requestId: metadata.requestId,
        filePath,
        brandFolder: path.basename(brandFolderPath)
      });
      
      return filePath;
      
    } catch (error) {
      logger.error(`Failed to save analysis to file: ${error.message}`, {
        brandName,
        requestId: metadata.requestId
      });
      throw error;
    }
  }

  /**
   * Generate file name with timestamp
   * @param {string} brandName - Brand name
   * @param {string} requestId - Request ID
   * @returns {string} File name
   */
  generateFileName(brandName, requestId) {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const sanitizedBrandName = brandName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const shortId = requestId.split('-')[0];
    
    return `${sanitizedBrandName}_analysis_${timestamp}_${shortId}.txt`;
  }

// Updated file service in src/services/file.service.js
// Replace the createFileContent function with this cleaned version:

/**
 * Create clean file content with simplified header
 * @param {string} brandName - Brand name
 * @param {string} analysisText - Analysis content
 * @param {Object} metadata - Request metadata
 * @param {Object} formData - Form data from request
 * @returns {string} File content
 */
createFileContent(brandName, analysisText, metadata, formData) {
  // Create simple, clean header
  const header = `Brand Visibility Analysis of ${brandName}
${'='.repeat(50)}

Generated: ${new Date(metadata.timestamp).toLocaleString()}
Website: ${formData.websiteUrl || 'Not provided'}
Contact: ${formData.email || 'Not provided'}

Analysis Parameters:
- Processing Time: ${metadata.processingTime}ms
- Analysis Quality: ${metadata.responseLength > 5000 ? 'COMPREHENSIVE' : 'STANDARD'}
- Client Specifications: ${formData.competitors?.length || 0} competitors, ${formData.topics?.length || 0} topics, ${formData.prompts?.length || 0} prompts

${'='.repeat(50)}

`;

  const footer = `

${'='.repeat(50)}
Analysis completed on ${new Date().toLocaleString()}
For questions or clarifications, contact: ${formData.email || 'client'}
${'='.repeat(50)}`;

  // Clean the analysis text by removing excessive formatting
  const cleanedAnalysis = this.cleanAnalysisText(analysisText);

  return header + cleanedAnalysis + footer;
}

/**
 * Clean analysis text by removing excessive formatting
 * @param {string} text - Raw analysis text
 * @returns {string} Cleaned text
 */
cleanAnalysisText(text) {
  if (!text) return '';
  
  return text
    // Remove excessive headers and titles
    .replace(/# ULTRA-COMPREHENSIVE[\s\S]*?---\s*/g, '')
    .replace(/## Premium \$50,000[\s\S]*?---\s*/g, '')
    .replace(/Premium \$50,000 Consulting Deliverable[\s\S]*?\n/g, '')
    
    // Clean up markdown formatting but keep structure
    .replace(/#{4,}/g, '') // Remove 4+ level headers
    .replace(/#{3}/g, '') // Remove ### headers
    .replace(/#{2}/g, '\n') // Convert ## to line breaks
    .replace(/#{1}/g, '\n') // Convert # to line breaks
    
    // Clean up excessive formatting
    .replace(/\*{3,}/g, '') // Remove *** formatting
    .replace(/\*{2}/g, '') // Remove ** formatting
    .replace(/\*{1}/g, '') // Remove * formatting
    .replace(/-{3,}/g, '') // Remove --- dividers
    .replace(/={3,}/g, '') // Remove === dividers
    
    // Clean up excessive line breaks
    .replace(/\n{4,}/g, '\n\n\n') // Max 3 line breaks
    .replace(/\n{3}/g, '\n\n') // Convert triple to double
    
    // Clean up list formatting
    .replace(/^\s*[\*\-\+]\s+/gm, '• ') // Convert various bullets to simple bullet
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
    
    // Remove excessive punctuation
    .replace(/\.{3,}/g, '...') // Max 3 dots
    .replace(/!{2,}/g, '!') // Single exclamation
    .replace(/\?{2,}/g, '?') // Single question mark
    
    // Clean up spacing
    .replace(/[ \t]{2,}/g, ' ') // Multiple spaces to single
    .replace(/^\s+|\s+$/gm, '') // Trim lines
    
    // Ensure clean start and end
    .trim();
}

  /**
   * Get list of saved files with brand folder organization
   * @returns {Promise<Array>} List of files organized by brand
   */
  async getFilesList() {
    try {
      const items = await fs.readdir(this.reportsDir);
      const fileDetails = [];
      
      for (const item of items) {
        const itemPath = path.join(this.reportsDir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // This is a brand folder
          const brandFiles = await this.getBrandFiles(item);
          fileDetails.push(...brandFiles);
        } else if (item.endsWith('.txt')) {
          // Legacy file in root directory
          fileDetails.push({
            fileName: item,
            filePath: itemPath,
            brandName: 'Legacy',
            brandFolder: null,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        }
      }
      
      // Sort by creation date (newest first)
      fileDetails.sort((a, b) => new Date(b.created) - new Date(a.created));
      
      return fileDetails;
      
    } catch (error) {
      logger.error(`Failed to get files list: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get files for a specific brand
   * @param {string} brandFolderName - Brand folder name
   * @returns {Promise<Array>} List of files for the brand
   */
  async getBrandFiles(brandFolderName) {
    try {
      const brandPath = path.join(this.reportsDir, brandFolderName);
      const files = await fs.readdir(brandPath);
      const txtFiles = files.filter(file => file.endsWith('.txt'));
      
      const fileDetails = [];
      
      for (const file of txtFiles) {
        try {
          const filePath = path.join(brandPath, file);
          const stats = await fs.stat(filePath);
          
          fileDetails.push({
            fileName: file,
            filePath,
            brandName: brandFolderName,
            brandFolder: brandFolderName,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        } catch (error) {
          logger.warn(`Failed to get stats for file: ${file} in brand: ${brandFolderName}`);
        }
      }
      
      return fileDetails;
      
    } catch (error) {
      logger.error(`Failed to get brand files for ${brandFolderName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all brands (folders)
   * @returns {Promise<Array>} List of brand folders
   */
  async getBrandsList() {
    try {
      const items = await fs.readdir(this.reportsDir);
      const brands = [];
      
      for (const item of items) {
        const itemPath = path.join(this.reportsDir, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const brandFiles = await this.getBrandFiles(item);
          brands.push({
            brandName: item,
            folderPath: itemPath,
            fileCount: brandFiles.length,
            totalSize: brandFiles.reduce((sum, file) => sum + file.size, 0),
            lastModified: brandFiles.length > 0 ? 
              Math.max(...brandFiles.map(f => new Date(f.modified).getTime())) : 
              stats.mtime.getTime(),
            created: stats.birthtime
          });
        }
      }
      
      // Sort by last modified (most recent first)
      brands.sort((a, b) => b.lastModified - a.lastModified);
      
      return brands;
      
    } catch (error) {
      logger.error(`Failed to get brands list: ${error.message}`);
      throw error;
    }
  }

  /**
   * Read file content
   * @param {string} fileName - File name
   * @param {string} brandFolder - Brand folder name (optional)
   * @returns {Promise<string>} File content
   */
  async readFile(fileName, brandFolder = null) {
    try {
      let filePath;
      
      if (brandFolder) {
        filePath = path.join(this.reportsDir, brandFolder, fileName);
      } else {
        // Try to find the file in any brand folder or root
        const allFiles = await this.getFilesList();
        const fileInfo = allFiles.find(f => f.fileName === fileName);
        
        if (!fileInfo) {
          throw new Error(`File not found: ${fileName}`);
        }
        
        filePath = fileInfo.filePath;
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      logger.error(`Failed to read file ${fileName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete file
   * @param {string} fileName - File name
   * @param {string} brandFolder - Brand folder name (optional)
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileName, brandFolder = null) {
    try {
      let filePath;
      
      if (brandFolder) {
        filePath = path.join(this.reportsDir, brandFolder, fileName);
      } else {
        // Try to find the file in any brand folder or root
        const allFiles = await this.getFilesList();
        const fileInfo = allFiles.find(f => f.fileName === fileName);
        
        if (!fileInfo) {
          throw new Error(`File not found: ${fileName}`);
        }
        
        filePath = fileInfo.filePath;
      }
      
      await fs.unlink(filePath);
      
      logger.info(`File deleted: ${fileName}${brandFolder ? ` from brand: ${brandFolder}` : ''}`);
      return true;
      
    } catch (error) {
      logger.error(`Failed to delete file ${fileName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file statistics
   * @returns {Promise<Object>} File statistics
   */
  async getStatistics() {
    try {
      const files = await this.getFilesList();
      const brands = await this.getBrandsList();
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const averageSize = files.length > 0 ? Math.round(totalSize / files.length) : 0;
      
      return {
        totalFiles: files.length,
        totalBrands: brands.length,
        totalSize: totalSize,
        averageSize: averageSize,
        latestFile: files.length > 0 ? files[0].fileName : null,
        oldestFile: files.length > 0 ? files[files.length - 1].fileName : null,
        brandBreakdown: brands.map(brand => ({
          brandName: brand.brandName,
          fileCount: brand.fileCount,
          totalSize: brand.totalSize
        }))
      };
      
    } catch (error) {
      logger.error(`Failed to get file statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new FileService();