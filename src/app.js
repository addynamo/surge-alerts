const express = require('express');
const { Handle } = require('./models');
const ReplyService = require('./services/replyService');
const SurgeAlertService = require('./services/surgeAlertService');
const surgeAlertRoutes = require('./routes/surgeAlertRoutes');
const { logger } = require('./config/logger');

// Initialize Express app
const app = express();
app.use(express.json());

// Mount routes
app.use('/api', surgeAlertRoutes); // Mount under /api prefix

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Social media surge detection service is running'
    });
});

// Create handle endpoint
app.post('/api/handles', async (req, res) => {
    try {
        const { handle } = req.body;
        if (!handle) {
            return res.status(400).json({ error: 'Handle is required' });
        }

        const [handleObj, created] = await Handle.findOrCreate({
            where: { handle }
        });

        res.status(created ? 201 : 200).json({
            id: handleObj.id,
            handle: handleObj.handle,
            created: created
        });
    } catch (error) {
        logger.error('Error creating handle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Store reply endpoint
app.post('/api/replies', async (req, res) => {
    try {
        const { handle, replyId, content, isHidden, hiddenAt } = req.body;

        // Find handle
        const handleObj = await Handle.findOne({ where: { handle } });
        if (!handleObj) {
            return res.status(404).json({ error: 'Handle not found' });
        }

        // Create reply
        const reply = await Reply.create({
            replyId,
            content,
            isHidden: isHidden || false,
            hiddenAt: hiddenAt || null,
            HandleId: handleObj.id
        });

        res.json({
            id: reply.id,
            replyId: reply.replyId,
            isHidden: reply.isHidden,
            hiddenAt: reply.hiddenAt
        });
    } catch (error) {
        logger.error('Error storing reply:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Schedule surge evaluation every 5 minutes
async function evaluateSurges() {
    try {
        logger.info('Starting surge evaluation...');
        const newAlerts = await SurgeAlertService.evaluateSurges();
        logger.info(`Surge evaluation complete. Created ${newAlerts.length} new alerts.`);
    } catch (error) {
        logger.error('Error during surge evaluation:', error);
    }
}

// Start the server
async function startServer() {
    try {
        const server = app.listen(5000, '0.0.0.0', () => {
            logger.info('Server running on port 5000');

            // Start surge evaluation schedule
            setInterval(evaluateSurges, 5 * 60 * 1000); // Run every 5 minutes
            // Run initial evaluation
            evaluateSurges();
        });

        server.on('error', (error) => {
            logger.error('Server error:', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Error starting server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;