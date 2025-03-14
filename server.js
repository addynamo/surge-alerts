const app = require('./src/app');
const logger = require('./src/config/logger');

const PORT = 5000; // Always use port 5000 for Replit

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT}`);
});