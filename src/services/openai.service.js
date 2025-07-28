const OpenAI = require('openai');
const config = require('../config/config');
const logger = require('../utils/logger');
const { createBrandAnalysisPrompt } = require('../utils/prompt');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Analyze brand visibility using OpenAI
   * @param {string} brandName - Brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBrand(brandName, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting OpenAI analysis for brand: ${brandName}`);

      // Create the analysis prompt
      const prompt = createBrandAnalysisPrompt(brandName);

      // Call OpenAI API
      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in brand analysis and LLM visibility research. Provide comprehensive, data-driven insights about brand presence across AI platforms. Be specific, actionable, and structure your response with clear headings and evidence-backed recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: config.openai.temperature,
      });

      const analysis = response.choices[0].message.content;
      const tokensUsed = response.usage.total_tokens;
      const processingTime = Date.now() - startTime;

      logger.info(`OpenAI analysis completed for brand: ${brandName}`, {
        tokensUsed,
        processingTime,
        model: config.openai.model
      });

      return {
        analysis,
        metadata: {
          model: config.openai.model,
          tokensUsed,
          processingTime,
          timestamp: new Date().toISOString(),
          promptLength: prompt.length,
          responseLength: analysis.length,
          apiVersion: response.model,
          finishReason: response.choices[0].finish_reason
        }
      };

    } catch (error) {
      logger.error(`OpenAI analysis failed for brand: ${brandName}`, {
        error: error.message,
        type: error.constructor.name,
        processingTime: Date.now() - startTime
      });

      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }
      
      if (error.status === 401) {
        throw new Error('OpenAI API key is invalid or expired.');
      }
      
      if (error.status === 403) {
        throw new Error('OpenAI API access forbidden. Check your API key permissions.');
      }

      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      }

      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  /**
   * Get OpenAI service status
   * @returns {Promise<Object>} Service status
   */
  async getStatus() {
    try {
      // Test with a simple completion to verify API connectivity
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });

      return {
        status: 'operational',
        model: config.openai.model,
        lastChecked: new Date().toISOString(),
        responseTime: response.usage ? 'normal' : 'unknown'
      };
    } catch (error) {
      logger.error('OpenAI status check failed', {
        error: error.message,
        status: error.status
      });

      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Validate API key and configuration
   * @returns {Promise<boolean>} Validation result
   */
  async validateConfiguration() {
    try {
      await this.getStatus();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new OpenAIService();