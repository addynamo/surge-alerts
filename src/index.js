require('dotenv').config();
const { logger } = require('./config/logger');
const config = require('./config/environment');
const app = require('./app');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
});

// Start the server
const server = app.listen(config.server.port, config.server.host, () => {
    logger.info(`Server running at http://${config.server.host}:${config.server.port}`);
});

// Graceful shutdown
const shutdown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
        logger.info('Server stopped');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
