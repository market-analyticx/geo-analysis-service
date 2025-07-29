require('dotenv').config();
const fs = require('fs');
const path = require('path');

const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // Claude configuration
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS, 10) || 8000,
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
  
  if (!config.claude.apiKey) {
    errors.push('CLAUDE_API_KEY is required. Get it from https://console.anthropic.com/');
  }
  
  if (!config.apiKey) {
    errors.push('API_KEY is required. Set a secure API key for your service authentication');
  }
  
  if (config.apiKey && config.apiKey.length < 32) {
    errors.push('API_KEY should be at least 32 characters long for security');
  }
  
  if (config.claude.maxTokens > 8192) {
    errors.push('CLAUDE_MAX_TOKENS cannot exceed 8192 tokens');
  }
  
  // Validate Claude model
  const validModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ];
  
  if (!validModels.includes(config.claude.model)) {
    errors.push(`CLAUDE_MODEL must be one of: ${validModels.join(', ')}`);
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