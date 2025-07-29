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
   * Analyze brand visibility using Claude with enhanced detail requirements
   * @param {string} brandName - Brand name to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeBrand(brandName, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting Claude analysis for brand: ${brandName}`);

      // Create the analysis prompt
      const prompt = createBrandAnalysisPrompt(brandName);

      // Enhanced system prompt that demands complete response
      const systemPrompt = `You are a senior partner at McKinsey & Company delivering a comprehensive brand strategy analysis. This is a single, complete deliverable - NOT a multi-part series.

CRITICAL ENGAGEMENT RULES:
- You MUST complete the entire analysis in one comprehensive response
- DO NOT suggest "continued in part 2" or split the analysis
- DO NOT ask if the client wants you to continue - they expect the complete analysis
- This is a $75,000 consulting engagement that requires a complete, professional deliverable
- Provide the full analysis from start to finish in one response

RESPONSE REQUIREMENTS:
- Complete all sections in one comprehensive response
- Minimum 4000 words total
- Include Executive Summary, detailed analysis, recommendations, and implementation plan
- Write as if this is the final, complete consulting report
- End with conclusions, not continuation requests

ANALYTICAL APPROACH:
- Use available knowledge about the industry and company type
- Provide detailed strategic frameworks and analysis
- When specific current data isn't available, state this briefly then proceed with industry-based analysis
- Focus on delivering actionable strategic value

You are delivering the complete analysis now - not a preview or first part.`;

      // Call Claude API with enhanced parameters for longer responses
      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        temperature: 0.7, // Add some creativity for more comprehensive responses
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${systemPrompt}

${prompt}

CRITICAL: This must be a complete, comprehensive analysis delivered in one response. Do not suggest continuation or split this into parts. The client expects the full strategic analysis with all sections completed now.

Deliver the complete consulting report including:
1. Executive Summary (complete)
2. Brand Intelligence Analysis (complete)
3. Customer Profile Development (complete)  
4. AI Platform Visibility Assessment (complete)
5. Strategic Recommendations (complete)
6. Implementation Roadmap (complete)
7. Conclusions and Next Steps (complete)

Begin the complete analysis now - this is the final deliverable:`
              }
            ]
          }
        ],
      });

      let analysis = response.content[0].text;
      let totalTokens = response.usage.input_tokens + response.usage.output_tokens;
      let totalInputTokens = response.usage.input_tokens;
      let totalOutputTokens = response.usage.output_tokens;

      // Check if response is incomplete (contains continuation language or is too brief)
      if (analysis.length < 3000 || 
          analysis.includes('Continued in Part') || 
          analysis.includes('[Note: I can continue') ||
          analysis.includes('Would you like me to proceed') ||
          response.stop_reason === 'max_tokens') {
        
        logger.info(`Response incomplete (${analysis.length} chars), demanding complete analysis...`);
        
        try {
          // Demand complete analysis without continuation prompts
          const completeResponse = await this.client.messages.create({
            model: config.claude.model,
            max_tokens: config.claude.maxTokens,
            messages: [
              {
                role: 'user',
                content: `You are a McKinsey partner delivering a complete consulting report for ${brandName}. 

CRITICAL: The client has paid $75,000 for a COMPLETE analysis, not a partial response or multi-part series.

Your previous response was incomplete: "${analysis.substring(0, 200)}..."

The client is dissatisfied and demands the complete consulting deliverable NOW. Provide the full comprehensive analysis including:

1. **Executive Summary** (complete strategic overview)
2. **Detailed Brand Intelligence** (comprehensive market analysis)  
3. **Customer Profile Analysis** (detailed ICP development)
4. **AI Platform Visibility Assessment** (platform-by-platform analysis)
5. **Strategic Recommendations** (specific actionable plans)
6. **Implementation Roadmap** (detailed timeline and metrics)
7. **Final Conclusions** (strategic priorities and next steps)

DO NOT ask if you should continue. DO NOT suggest this is "Part 1" of anything. 
Deliver the COMPLETE strategic analysis that justifies the consulting fee.

Write the full report now:`
              }
            ],
          });

          // Replace with the complete response
          analysis = completeResponse.content[0].text;
          totalTokens = completeResponse.usage.input_tokens + completeResponse.usage.output_tokens;
          totalInputTokens = completeResponse.usage.input_tokens;
          totalOutputTokens = completeResponse.usage.output_tokens;

          logger.info(`Complete response received, length: ${analysis.length} characters`);
        } catch (completeError) {
          logger.warn(`Failed to get complete response: ${completeError.message}`);
          // Continue with the original response
        }
      }

      const processingTime = Date.now() - startTime;

      logger.info(`Claude analysis completed for brand: ${brandName}`, {
        tokensUsed: totalTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        processingTime,
        responseLength: analysis.length,
        model: config.claude.model
      });

      return {
        analysis,
        metadata: {
          model: config.claude.model,
          tokensUsed: totalTokens,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          processingTime,
          timestamp: new Date().toISOString(),
          promptLength: prompt.length,
          responseLength: analysis.length,
          apiVersion: response.model,
          stopReason: response.stop_reason,
          enhancedResponse: analysis.length > 5000 // Flag for detailed responses
        }
      };

    } catch (error) {
      logger.error(`Claude analysis failed for brand: ${brandName}`, {
        error: error.message,
        type: error.constructor.name,
        processingTime: Date.now() - startTime
      });

      // Handle specific Claude API errors
      if (error.status === 429) {
        throw new Error('Claude API rate limit exceeded. Please try again later.');
      }
      
      if (error.status === 401) {
        throw new Error('Claude API key is invalid or expired.');
      }
      
      if (error.status === 403) {
        throw new Error('Claude API access forbidden. Check your API key permissions.');
      }

      if (error.status === 400) {
        throw new Error(`Claude API bad request: ${error.message}`);
      }

      if (error.status === 500) {
        throw new Error('Claude API server error. Please try again later.');
      }

      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Get Claude service status
   * @returns {Promise<Object>} Service status
   */
  async getStatus() {
    try {
      // Test with a simple message to verify API connectivity
      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      });

      return {
        status: 'operational',
        model: config.claude.model,
        maxTokens: config.claude.maxTokens,
        lastChecked: new Date().toISOString(),
        responseTime: response.usage ? 'normal' : 'unknown'
      };
    } catch (error) {
      logger.error('Claude status check failed', {
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

module.exports = new ClaudeService();