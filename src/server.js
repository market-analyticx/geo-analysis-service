const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 LLM Brand Analysis Service started on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`📝 Reports directory: ${config.reportsDir}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});