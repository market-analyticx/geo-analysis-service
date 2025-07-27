require('dotenv').config();

const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview', // or gpt-4, gpt-3.5-turbo
    maxTokens: 4000,
    temperature: 0.7,
  },
  
  // API security
  apiKey: process.env.API_KEY,
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 10,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // File storage
  reportsDir: process.env.REPORTS_DIR || './reports',
};

// Validation
if (!config.openai.apiKey) {
  console.error('❌ OPENAI_API_KEY is required');
  process.exit(1);
}

if (!config.apiKey) {
  console.error('❌ API_KEY is required');
  process.exit(1);
}

module.exports = config;