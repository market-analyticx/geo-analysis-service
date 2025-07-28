require('dotenv').config();
const fs = require('fs');
const path = require('path');

const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 4000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
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
  logsDir: process.env.LOGS_DIR || './logs',
};

// Create necessary directories
const createDirectories = () => {
  const dirs = [config.reportsDir, config.logsDir];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } catch (error) {
        console.error(`❌ Failed to create directory ${dir}:`, error.message);
        process.exit(1);
      }
    }
  });
};

// Validation with better error messages
const validateConfig = () => {
  const errors = [];
  
  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required. Get it from https://platform.openai.com/api-keys');
  }
  
  if (!config.apiKey) {
    errors.push('API_KEY is required. Set a secure API key for your service authentication');
  }
  
  if (config.apiKey && config.apiKey.length < 32) {
    errors.push('API_KEY should be at least 32 characters long for security');
  }
  
  if (config.openai.maxTokens > 8192) {
    errors.push('OPENAI_MAX_TOKENS cannot exceed 8192 tokens');
  }
  
  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    errors.push('OPENAI_TEMPERATURE must be between 0 and 2');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nPlease check your .env file and fix the issues above.');
    process.exit(1);
  }
};

// Initialize
createDirectories();
validateConfig();

console.log('✅ Configuration validated successfully');

module.exports = config;