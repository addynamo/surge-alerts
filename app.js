const express = require('express');
const { sequelize } = require('./models');
const ReplyService = require('./services/replyService');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
});

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Social media surge detection service is running'
    });
});

// Store new reply
app.post('/api/replies', async (req, res) => {
    try {
        logger.debug('Received store_reply request');
        const { handle, reply_id, content } = req.body;

        if (!handle || !reply_id || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const reply = await ReplyService.storeReply(handle, reply_id, content);

        res.json({
            stored: true,
            is_hidden: reply.isHidden,
            hidden_by_word: reply.hiddenByWord
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

        const { denyword, newlyHidden } = await ReplyService.addDenyword(handle, word);

        res.json({
            added: true,
            newly_hidden_count: newlyHidden.length,
            newly_hidden_replies: newlyHidden.map(reply => ({
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

// Initialize database and start server
const PORT = process.env.PORT || 5001; // Try alternate port if 5000 is in use

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection established successfully');

        // Sync database schema
        await sequelize.sync();
        logger.info('Database tables created successfully');

        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server running on port ${PORT}`);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`Port ${PORT} is already in use. Trying alternate port...`);
                const newPort = PORT + 1;
                server.listen(newPort, '0.0.0.0');
            } else {
                logger.error('Server error:', error);
                process.exit(1);
            }
        });
    } catch (error) {
        logger.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;