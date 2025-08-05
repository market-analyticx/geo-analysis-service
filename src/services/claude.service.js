const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/config');
const logger = require('../utils/logger');
const { createComprehensiveBrandAnalysisPrompt, createBrandAnalysisPrompt } = require('../utils/prompt');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.claude.apiKey,
    });
  }

  /**
   * Analyze brand using Claude with comprehensive form data integration
   * @param {Object} formData - Complete form data from client
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBrandComprehensive(formData, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting comprehensive Claude analysis for brand: ${formData.brandName}`, {
        model: config.claude.model,
        maxTokens: config.claude.maxTokens,
        hasCompetitors: formData.competitors?.length > 0,
        hasTopics: formData.topics?.length > 0,
        hasPrompts: formData.prompts?.length > 0,
        hasPersonas: Boolean(formData.personas?.trim())
      });

      const prompt = createComprehensiveBrandAnalysisPrompt(formData);

      // Log prompt details for monitoring
      logger.info(`Comprehensive prompt generated`, {
        promptLength: prompt.length,
        estimatedTokens: Math.ceil(prompt.length / 4),
        maxInputTokens: config.claude.inputLimit,
        brandName: formData.brandName,
        websiteUrl: formData.websiteUrl
      });

      // Primary request with maximum tokens for comprehensive analysis
      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        temperature: 0.05, // Very low for maximum consistency and detail
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      let analysis = response.content[0].text;
      let totalInputTokens = response.usage.input_tokens;
      let totalOutputTokens = response.usage.output_tokens;
      let totalTokens = totalInputTokens + totalOutputTokens;
      
      const processingTime = Date.now() - startTime;

      // Check if we hit the token limit and response was truncated
      const wasIncomplete = response.stop_reason === 'max_tokens' && 
                           analysis.length > 0 && 
                           !analysis.includes('EXECUTIVE CONCLUSION');

      if (wasIncomplete) {
        logger.warn(`Response may be incomplete due to token limit`, {
          stopReason: response.stop_reason,
          outputTokens: totalOutputTokens,
          maxTokens: config.claude.maxTokens,
          responseLength: analysis.length
        });

        // Attempt to get a continuation focusing on the specific brand
        try {
          logger.info('Requesting completion of analysis...');
          
          const continuationResponse = await this.client.messages.create({
            model: config.claude.model,
            max_tokens: config.claude.maxTokens,
            temperature: 0.1,
            messages: [
              {
                role: 'user',
                content: `Complete the comprehensive brand visibility audit for ${formData.brandName} (${formData.websiteUrl}). 

Your previous response was cut off at ${totalOutputTokens} tokens. The client ${formData.email} has paid for a complete analysis.

COMPLETE THE ANALYSIS with the remaining sections:
- Finish any incomplete sections from the previous response
- Provide the Executive Conclusion & Strategic Next Steps
- Include specific ROI projections and success metrics
- Add implementation timeline with detailed monthly breakdown
- Provide resource allocation and budget recommendations

Focus specifically on ${formData.brandName} and their competitive landscape. Use the remaining ${config.claude.maxTokens} tokens to provide maximum value and detail.

This must be a complete, professional deliverable worthy of a $50,000 consulting engagement.`
              }
            ],
          });

          // Append the continuation to the original response
          analysis = analysis + '\n\n' + continuationResponse.content[0].text;
          totalInputTokens += continuationResponse.usage.input_tokens;
          totalOutputTokens += continuationResponse.usage.output_tokens;
          totalTokens = totalInputTokens + totalOutputTokens;

          logger.info(`Comprehensive response completed`, {
            finalLength: analysis.length,
            totalOutputTokens: totalOutputTokens,
            totalTokens: totalTokens
          });

        } catch (continuationError) {
          logger.warn(`Continuation request failed: ${continuationError.message}`);
          // Continue with original response
        }
      }

      logger.info(`Claude comprehensive analysis completed successfully`, {
        brandName: formData.brandName,
        model: config.claude.model,
        tokensUsed: totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        processingTime,
        responseLength: analysis.length,
        stopReason: response.stop_reason,
        tokensUtilization: `${((totalOutputTokens / config.claude.maxTokens) * 100).toFixed(1)}%`,
        formDataIncluded: {
          competitors: formData.competitors?.length || 0,
          topics: formData.topics?.length || 0,
          prompts: formData.prompts?.length || 0,
          hasPersonas: Boolean(formData.personas?.trim())
        }
      });

      return {
        analysis,
        metadata: {
          model: config.claude.model,
          tokensUsed: totalTokens,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          maxTokensAvailable: config.claude.maxTokens,
          tokensUtilization: ((totalOutputTokens / config.claude.maxTokens) * 100).toFixed(1) + '%',
          processingTime,
          timestamp: new Date().toISOString(),
          responseLength: analysis.length,
          stopReason: response.stop_reason,
          wasOptimizedForMaxDetail: true,
          promptLength: prompt.length,
          formDataProcessed: {
            brandName: formData.brandName,
            websiteUrl: formData.websiteUrl,
            email: formData.email,
            competitorsProvided: formData.competitors?.length || 0,
            topicsProvided: formData.topics?.length || 0,
            promptsProvided: formData.prompts?.length || 0,
            personasProvided: Boolean(formData.personas?.trim())
          }
        }
      };

    } catch (error) {
      logger.error(`Claude comprehensive analysis failed for brand: ${formData.brandName}`, {
        error: error.message,
        type: error.constructor.name,
        status: error.status,
        processingTime: Date.now() - startTime,
        formData: {
          brandName: formData.brandName,
          websiteUrl: formData.websiteUrl,
          email: formData.email
        }
      });

      // Enhanced error handling
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'] || 60;
        throw new Error(`Claude API rate limit exceeded. Retry after ${retryAfter} seconds.`);
      }
      
      if (error.status === 401) {
        throw new Error('Claude API key is invalid or expired. Please check your API key.');
      }
      
      if (error.status === 400) {
        throw new Error(`Claude API bad request: ${error.message}. Check if your request exceeds input token limits.`);
      }

      if (error.status === 500) {
        throw new Error('Claude API server error. Please try again later.');
      }

      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Legacy analyze brand method for backward compatibility
   * @param {string} brandName - Brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBrand(brandName, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting legacy Claude analysis for brand: ${brandName}`, {
        model: config.claude.model,
        maxTokens: config.claude.maxTokens
      });

      const prompt = createBrandAnalysisPrompt(brandName, options.websiteUrl);

      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        temperature: 0.05,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      let analysis = response.content[0].text;
      let totalInputTokens = response.usage.input_tokens;
      let totalOutputTokens = response.usage.output_tokens;
      let totalTokens = totalInputTokens + totalOutputTokens;
      
      const processingTime = Date.now() - startTime;

      logger.info(`Claude legacy analysis completed successfully`, {
        brandName,
        model: config.claude.model,
        tokensUsed: totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        processingTime,
        responseLength: analysis.length
      });

      return {
        analysis,
        metadata: {
          model: config.claude.model,
          tokensUsed: totalTokens,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          maxTokensAvailable: config.claude.maxTokens,
          tokensUtilization: ((totalOutputTokens / config.claude.maxTokens) * 100).toFixed(1) + '%',
          processingTime,
          timestamp: new Date().toISOString(),
          responseLength: analysis.length,
          stopReason: response.stop_reason,
          promptLength: prompt.length
        }
      };

    } catch (error) {
      logger.error(`Claude legacy analysis failed for brand: ${brandName}`, {
        error: error.message,
        type: error.constructor.name,
        status: error.status,
        processingTime: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Get Claude service status
   */
  async getStatus() {
    try {
      const testStart = Date.now();
      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Service status check - respond with "operational"'
          }
        ]
      });

      const responseTime = Date.now() - testStart;

      return {
        status: 'operational',
        model: config.claude.model,
        maxTokens: config.claude.maxTokens,
        responseTime: `${responseTime}ms`,
        lastChecked: new Date().toISOString(),
        testResponse: response.content[0].text,
        capabilities: {
          comprehensiveAnalysis: true,
          formDataProcessing: true,
          competitorGeneration: true,
          topicIdentification: true,
          promptDevelopment: true,
          personaCreation: true
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        model: config.claude.model,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Get detailed model information
   */
  getModelInfo() {
    return {
      current: {
        model: config.claude.model,
        maxTokens: config.claude.maxTokens
      },
      features: {
        comprehensiveAnalysis: 'Full 6,000-8,000 word detailed reports',
        formDataIntegration: 'Client-specified competitors, topics, prompts, and personas',
        aiGeneration: 'Auto-generation of missing analysis components',
        brandFolderOrganization: 'Organized file storage by brand',
        competitorAnalysis: 'Up to 5 competitors with detailed comparison',
        topicAnalysis: 'Up to 4 key topics with market analysis',
        promptTesting: 'Up to 4 realistic test prompts',
        personaDevelopment: 'Detailed ICP creation and analysis'
      }
    };
  }
}

module.exports = new ClaudeService();