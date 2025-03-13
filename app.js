const express = require('express');
const SurgeDetector = require('./surgeDetector');

const app = express();
app.use(express.json());

// Initialize surge detector with 1-hour window and default threshold of 2 standard deviations
const surgeDetector = new SurgeDetector(60, 2.0);

// Record new hidden reply count and check for surge
app.post('/api/hidden-replies', (req, res) => {
    try {
        const { count } = req.body;
        if (count === undefined) {
            return res.status(400).json({ error: 'Missing hidden reply count in request' });
        }

        const isSpike = surgeDetector.addDatapoint(parseFloat(count));
        res.json({
            recorded: true,
            is_surge: isSpike,
            current_count: count,
            hourly_average: surgeDetector.getCurrentAverage(),
            threshold: surgeDetector.getThreshold()
        });
    } catch (error) {
        console.error('Error processing hidden replies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current metrics
app.get('/api/metrics', (req, res) => {
    try {
        res.json({
            hourly_average: surgeDetector.getCurrentAverage(),
            recent_values: surgeDetector.getRecentValues(),
            recent_surges: surgeDetector.getRecentSpikes(),
            current_threshold: surgeDetector.getThreshold()
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update surge detector configuration
app.post('/api/config', (req, res) => {
    try {
        const { threshold_std } = req.body;
        if (threshold_std) {
            surgeDetector.setThreshold(parseFloat(threshold_std));
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Surge detection service running on port ${PORT}`);
});