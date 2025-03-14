const app = require('./app');
const logger = require('./config/logger');

const PORT = 5000; // Always use port 5000 for Replit

// Log startup attempt
logger.info(`Starting server on port ${PORT}`);

// Create server with proper error handling
const server = app.listen(PORT, '0.0.0.0')
  .on('listening', () => {
    logger.info(`Server is running on port ${PORT}`);
  })
  .on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Please ensure no other server is running.`);
      process.exit(1);
    } else {
      logger.error(`Failed to start server: ${error.message}`);
      process.exit(1);
    }
  });

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});