const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🌍 Geo Analysis Service started successfully`);
  logger.info(`📍 Server running on port ${PORT}`);
  logger.info(`🏃 Environment: ${config.nodeEnv}`);
  logger.info(`📂 Reports directory: ${config.reportsDir}`);
  logger.info(`📝 Logs directory: ${config.logsDir}`);
  logger.info(`🔗 Service URL: http://0.0.0.0:${PORT}`);
  logger.info(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
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