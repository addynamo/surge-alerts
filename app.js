const express = require('express');
const { sequelize, Handle, Reply } = require('./models');
const ReplyService = require('./services/replyService');
const SurgeAlertService = require('./services/surgeAlertService');
const surgeAlertRoutes = require('./routes/surgeAlertRoutes');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

const app = express();
app.use(express.json());

// Mount routes
app.use('/', surgeAlertRoutes);

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

        // Find or create handle
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

// Add new denyword
app.post('/api/denywords', async (req, res) => {
    try {
        logger.debug('Received add_denyword request');
        const { handle, word } = req.body;

        if (!handle || !word) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await ReplyService.addDenyword(handle, word);

        res.json({
            added: true,
            newly_hidden_count: result.newlyHidden.length,
            newly_hidden_replies: result.newlyHidden.map(reply => ({
                reply_id: reply.replyId,
                hidden_at: reply.hiddenAt.toISOString()
            }))
        });
    } catch (error) {
        logger.error('Error adding denyword:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get hidden replies for a handle
app.get('/api/hidden-replies/:handle', async (req, res) => {
    try {
        logger.debug(`Fetching hidden replies for handle: ${req.params.handle}`);
        const replies = await ReplyService.getHiddenReplies(req.params.handle);

        res.json({
            hidden_replies: replies.map(reply => ({
                reply_id: reply.replyId,
                content: reply.content,
                hidden_at: reply.hiddenAt.toISOString(),
                hidden_by_word: reply.hiddenByWord
            }))
        });
    } catch (error) {
        logger.error('Error fetching hidden replies:', error);
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

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection established successfully');

        // Sync database schema
        await sequelize.sync();
        logger.info('Database tables created successfully');

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

startServer();

module.exports = app;