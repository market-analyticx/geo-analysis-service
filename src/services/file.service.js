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

  /**
   * Create file content with form data and analysis
   * @param {string} brandName - Brand name
   * @param {string} analysisText - Analysis content
   * @param {Object} metadata - Request metadata
   * @param {Object} formData - Form data from request
   * @returns {string} File content
   */
  createFileContent(brandName, analysisText, metadata, formData) {
    // Create comprehensive header with all technical details for file storage
    const header = `AI/LLM BRAND VISIBILITY AUDIT REPORT
${'='.repeat(80)}

BRAND: ${brandName}
WEBSITE: ${formData.websiteUrl || 'Not provided'}
CONTACT: ${formData.email || 'Not provided'}
GENERATED: ${new Date(metadata.timestamp).toLocaleString()}
REQUEST ID: ${metadata.requestId}

ANALYSIS PARAMETERS:
- AI Model: ${metadata.model}
- Processing Time: ${metadata.processingTime}ms
- Tokens Used: ${metadata.tokensUsed}
- Input Tokens: ${metadata.inputTokens}
- Output Tokens: ${metadata.outputTokens}
- Response Length: ${metadata.responseLength} characters
- Analysis Quality: ${metadata.responseLength > 5000 ? 'COMPREHENSIVE' : 'STANDARD'}

CLIENT SPECIFICATIONS:
${formData.competitors && formData.competitors.length > 0 ? `- Competitors Analyzed: ${formData.competitors.join(', ')}` : '- Competitors: AI-Generated List'}
${formData.personas ? `- Target Personas: ${formData.personas}` : '- Target Personas: AI-Generated'}
${formData.topics && formData.topics.length > 0 ? `- Key Topics: ${formData.topics.join(', ')}` : '- Key Topics: AI-Generated'}
${formData.prompts && formData.prompts.length > 0 ? `- Custom Prompts: ${formData.prompts.length} provided` : '- Prompts: AI-Generated'}

${'='.repeat(80)}
COMPREHENSIVE ANALYSIS RESULTS
${'='.repeat(80)}

`;

    const footer = `

${'='.repeat(80)}
END OF ANALYSIS
${'='.repeat(80)}

Report generated by Geo Analysis Service
For questions or clarifications, contact: ${formData.email || 'client'}
Analysis Date: ${new Date().toLocaleString()}
Service Version: 1.0.0`;

    return header + analysisText + footer;
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