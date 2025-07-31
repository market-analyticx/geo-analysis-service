const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/config');
const logger = require('../utils/logger');
const { createBrandAnalysisPrompt } = require('../utils/prompt');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.claude.apiKey,
    });
  }

  /**
   * Analyze brand using Claude with maximum detail optimization
   * @param {string} brandName - Brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBrand(brandName, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting comprehensive Claude analysis for brand: ${brandName}`, {
        model: config.claude.model,
        maxTokens: config.claude.maxTokens,
        inputLimit: config.claude.inputLimit
      });

      const prompt = createBrandAnalysisPrompt(brandName, options.websiteUrl);

      // Log prompt length for monitoring
      logger.info(`Prompt length: ${prompt.length} characters`, {
        estimatedTokens: Math.ceil(prompt.length / 4), // Rough estimate
        maxInputTokens: config.claude.inputLimit
      });

      // Primary request with maximum tokens for comprehensive analysis
      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens, // Use full token allocation
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
                           !analysis.includes('## Implementation Roadmap');

      if (wasIncomplete) {
        logger.warn(`Response may be incomplete due to token limit`, {
          stopReason: response.stop_reason,
          outputTokens: totalOutputTokens,
          maxTokens: config.claude.maxTokens,
          responseLength: analysis.length
        });

        // Attempt to get a continuation if we hit the limit
        try {
          logger.info('Requesting ultra-comprehensive analysis...');
          
          const continuationResponse = await this.client.messages.create({
            model: config.claude.model,
            max_tokens: config.claude.maxTokens, // Use full allocation again
            temperature: 0.1,
            messages: [
              {
                role: 'user',
                content: `You are a Master AI/LLM Visibility Research Analyst. Your previous response was insufficient - only ${totalOutputTokens} tokens out of 8,192 available.

The client has paid $50,000 for a COMPREHENSIVE brand visibility audit for ${brandName}${options.websiteUrl ? ` (${options.websiteUrl})` : ''} and expects a detailed professional deliverable.

CRITICAL REQUIREMENTS:
- Use ALL 8,192 output tokens available
- Provide 6,000-8,000 words of detailed analysis
- Include exhaustive detail in every section
- Each major section should be 800-1,200 words minimum

REQUIRED COMPREHENSIVE ANALYSIS:

1. EXTENSIVE Brand Intelligence (1,500+ words)
   - Complete service portfolio analysis
   - Detailed client portfolio assessment
   - Comprehensive market positioning
   - Full competitive landscape mapping

2. DETAILED ICP Development (1,200+ words)
   - Multiple comprehensive customer personas
   - Extensive demographic and firmographic data
   - Detailed pain points and challenges
   - Complete search behavior analysis

3. COMPREHENSIVE AI Visibility Audit (2,000+ words)
   - Platform-by-platform detailed analysis
   - Extensive competitive share of voice
   - Complete content source coverage
   - Geographic and market-specific findings

4. STRATEGIC Recommendations (1,500+ words)
   - Immediate actions with detailed implementation
   - Medium-term strategy with specific tactics
   - Long-term vision with comprehensive roadmap
   - Resource allocation and budget considerations

5. DETAILED Implementation Plan (1,000+ words)
   - Month-by-month breakdown
   - Specific deliverables and milestones
   - Success metrics and KPIs
   - Risk mitigation strategies

Provide the COMPLETE analysis using ALL available tokens. This must be a premium consulting deliverable with maximum depth and value.`
              }
            ],
          });

          // Use the new comprehensive response
          analysis = continuationResponse.content[0].text;
          totalInputTokens = continuationResponse.usage.input_tokens;
          totalOutputTokens = continuationResponse.usage.output_tokens;
          totalTokens = totalInputTokens + totalOutputTokens;

          logger.info(`Comprehensive response obtained`, {
            newLength: analysis.length,
            outputTokens: totalOutputTokens,
            totalTokens: totalTokens
          });

        } catch (continuationError) {
          logger.warn(`Continuation request failed: ${continuationError.message}`);
          // Continue with original response
        }
      }

      logger.info(`Claude analysis completed successfully`, {
        brandName,
        model: config.claude.model,
        tokensUsed: totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        processingTime,
        responseLength: analysis.length,
        stopReason: response.stop_reason,
        tokensUtilization: `${((totalOutputTokens / config.claude.maxTokens) * 100).toFixed(1)}%`
      });

      return {
        analysis,
        metadata: {
          model: config.claude.model,
          modelDescription: config.claude.description,
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
          promptLength: prompt.length
        }
      };

    } catch (error) {
      logger.error(`Claude analysis failed for brand: ${brandName}`, {
        error: error.message,
        type: error.constructor.name,
        status: error.status,
        processingTime: Date.now() - startTime
      });

      // Enhanced error handling for Tier 2 limits
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'] || 60;
        throw new Error(`Claude API rate limit exceeded. Retry after ${retryAfter} seconds. Your Tier 2 limits: ${config.claude.rateLimits.requestsPerMinute} requests/min, ${config.claude.rateLimits.outputTokensPerMinute} output tokens/min.`);
      }
      
      if (error.status === 401) {
        throw new Error('Claude API key is invalid or expired. Please check your API key in the Anthropic Console.');
      }
      
      if (error.status === 400) {
        throw new Error(`Claude API bad request: ${error.message}. Check if your request exceeds input token limits (${config.claude.inputLimit} tokens/min for ${config.claude.model}).`);
      }

      if (error.status === 500) {
        throw new Error('Claude API server error. Please try again later.');
      }

      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Get Claude service status with Tier 2 information
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
        modelDescription: config.claude.description,
        maxTokens: config.claude.maxTokens,
        inputLimit: config.claude.inputLimit,
        tier: 'Tier 2',
        rateLimits: config.claude.rateLimits,
        responseTime: `${responseTime}ms`,
        lastChecked: new Date().toISOString(),
        testResponse: response.content[0].text
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
        description: config.claude.description,
        maxTokens: config.claude.maxTokens,
        inputLimit: config.claude.inputLimit
      },
      available: config.availableModels,
      tier: 'Tier 2',
      rateLimits: config.claude.rateLimits
    };
  }
}

module.exports = new ClaudeService();