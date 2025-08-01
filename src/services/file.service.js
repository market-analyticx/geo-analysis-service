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
   * Save OpenAI response directly to text file
   * @param {string} brandName - Brand name
   * @param {string} analysisText - Raw OpenAI response
   * @param {Object} metadata - Request metadata
   * @returns {Promise<string>} File path
   */
  async saveAnalysisToFile(brandName, analysisText, metadata) {
    try {
      const fileName = this.generateFileName(brandName, metadata.requestId);
      const filePath = path.join(this.reportsDir, fileName);
      
      // Create the file content with minimal header
      const fileContent = this.createFileContent(brandName, analysisText, metadata);
      
      // Save to file
      await fs.writeFile(filePath, fileContent, 'utf8');
      
      logger.info(`Analysis saved to file: ${fileName}`, {
        brandName,
        requestId: metadata.requestId,
        filePath
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
   * Generate file name
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
   * Create file content with minimal formatting
   * @param {string} brandName - Brand name
   * @param {string} analysisText - OpenAI response
   * @param {Object} metadata - Request metadata
   * @returns {string} File content
   */
  createFileContent(brandName, analysisText, metadata) {
    const header = `Brand Analysis Report for: ${brandName}
Generated: ${new Date(metadata.timestamp).toLocaleString()}
Request ID: ${metadata.requestId}
AI Model: ${metadata.model}
Processing Time: ${metadata.processingTime}ms
Tokens Used: ${metadata.tokensUsed}

${'='.repeat(80)}
ANALYSIS RESULTS
${'='.repeat(80)}

`;

    const footer = `

${'='.repeat(80)}
End of Analysis - Generated by Geo Analysis Service
${'='.repeat(80)}`;

    return header + analysisText + footer;
  }

  /**
   * Get list of saved files
   * @returns {Promise<Array>} List of files
   */
  async getFilesList() {
    try {
      const files = await fs.readdir(this.reportsDir);
      const txtFiles = files.filter(file => file.endsWith('.txt'));
      
      const fileDetails = [];
      
      for (const file of txtFiles) {
        try {
          const filePath = path.join(this.reportsDir, file);
          const stats = await fs.stat(filePath);
          
          fileDetails.push({
            fileName: file,
            filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        } catch (error) {
          logger.warn(`Failed to get stats for file: ${file}`);
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
   * Read file content
   * @param {string} fileName - File name
   * @returns {Promise<string>} File content
   */
  async readFile(fileName) {
    try {
      const filePath = path.join(this.reportsDir, fileName);
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
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileName) {
    try {
      const filePath = path.join(this.reportsDir, fileName);
      await fs.unlink(filePath);
      
      logger.info(`File deleted: ${fileName}`);
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
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const averageSize = files.length > 0 ? Math.round(totalSize / files.length) : 0;
      
      return {
        totalFiles: files.length,
        totalSize: totalSize,
        averageSize: averageSize,
        latestFile: files.length > 0 ? files[0].fileName : null,
        oldestFile: files.length > 0 ? files[files.length - 1].fileName : null
      };
      
    } catch (error) {
      logger.error(`Failed to get file statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new FileService();