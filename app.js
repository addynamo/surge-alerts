const express = require('express');
const path = require('path');
const SurgeDetector = require('./surgeDetector');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Initialize surge detector with 1-hour window and default threshold of 2 standard deviations
const surgeDetector = new SurgeDetector(60, 2.0);

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Record new activity data point
app.post('/api/activity', (req, res) => {
    try {
        const { value } = req.body;
        if (value === undefined) {
            return res.status(400).json({ error: 'Missing value in request' });
        }

        const isSpike = surgeDetector.addDatapoint(parseFloat(value));
        res.json({
            recorded: true,
            is_spike: isSpike,
            current_value: value,
            current_average: surgeDetector.getCurrentAverage()
        });
    } catch (error) {
        console.error('Error processing activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current metrics for dashboard
app.get('/api/metrics', (req, res) => {
    try {
        res.json({
            current_average: surgeDetector.getCurrentAverage(),
            recent_values: surgeDetector.getRecentValues(),
            recent_spikes: surgeDetector.getRecentSpikes(),
            threshold: surgeDetector.getThreshold()
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

// Start server on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
