require('dotenv').config();
const fs = require('fs');

const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // Claude configuration - CORRECTED TOKEN LIMITS
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: 8192, // CORRECT: Maximum for Claude Sonnet 3.5 is 8192
  },
  
  // API security
  apiKey: process.env.API_KEY,
  
  // Rate limiting - Tier 2 optimized
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 3600000, // 1 hour
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 50, // Increased for Tier 2
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Storage
  reportsDir: process.env.REPORTS_DIR || './reports',
  logsDir: process.env.LOGS_DIR || './logs',
};

// Create directories
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

// Validation
const validateConfig = () => {
  const errors = [];
  
  if (!config.claude.apiKey) {
    errors.push('CLAUDE_API_KEY is required');
  }
  
  if (!config.apiKey) {
    errors.push('API_KEY is required');
  }
  
  if (config.apiKey && config.apiKey.length < 16) {
    errors.push('API_KEY should be at least 16 characters long');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nPlease check your .env file.');
    process.exit(1);
  }
};

// Initialize
createDirectories();
validateConfig();

console.log('✅ Configuration loaded successfully');
console.log(`🤖 Model: ${config.claude.model}`);
console.log(`🎯 Max output tokens: ${config.claude.maxTokens.toLocaleString()}`);
console.log(`⚡ Rate limit: ${config.rateLimitMaxRequests} requests/hour`);

module.exports = config;