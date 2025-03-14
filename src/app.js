const express = require('express');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { sequelize } = require('./models');

const app = express();

// Security middleware
app.use(helmet());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use(routes);

// Error handling
app.use(errorHandler);

// Database initialization
sequelize.sync()
  .then(() => {
    logger.info('Database connected and synchronized');
  })
  .catch((error) => {
    logger.error('Unable to connect to database:', error);
  });

module.exports = app;