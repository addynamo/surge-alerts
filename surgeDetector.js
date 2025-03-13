const moment = require('moment');

class SurgeDetector {
    constructor(windowSize = 60, thresholdStd = 2.0) {
        this.windowSize = windowSize;
        this.thresholdStd = thresholdStd;
        this.values = [];
        this.timestamps = [];
        this.spikes = [];
        this.maxSpikes = 100;
    }

    addDatapoint(value) {
        const currentTime = moment();
        
        // Add new value and timestamp
        this.values.push(value);
        this.timestamps.push(currentTime);

        // Remove old values outside the window
        const cutoffTime = moment().subtract(this.windowSize, 'minutes');
        while (this.timestamps.length > 0 && this.timestamps[0].isBefore(cutoffTime)) {
            this.timestamps.shift();
            this.values.shift();
        }

        // Need at least 5 values for meaningful statistics
        if (this.values.length < 5) {
            return false;
        }

        // Calculate statistics
        const mean = this.calculateMean(this.values);
        const std = this.calculateStd(this.values, mean);
        const threshold = mean + (this.thresholdStd * std);

        // Check for spike
        const isSpike = value > threshold;
        if (isSpike) {
            this.spikes.push({ timestamp: currentTime, value });
            // Keep only the latest spikes
            if (this.spikes.length > this.maxSpikes) {
                this.spikes.shift();
            }
        }

        return isSpike;
    }

    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    calculateStd(values, mean) {
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        const avgSquareDiff = this.calculateMean(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    }

    getCurrentAverage() {
        return this.values.length ? this.calculateMean(this.values) : 0;
    }

    getRecentValues() {
        return this.values.map((value, index) => ({
            timestamp: this.timestamps[index].toISOString(),
            value
        }));
    }

    getRecentSpikes() {
        return this.spikes.map(spike => ({
            timestamp: spike.timestamp.toISOString(),
            value: spike.value
        }));
    }

    getThreshold() {
        if (this.values.length < 5) {
            return null;
        }
        const mean = this.calculateMean(this.values);
        const std = this.calculateStd(this.values, mean);
        return mean + (this.thresholdStd * std);
    }

    setThreshold(thresholdStd) {
        if (thresholdStd <= 0) {
            throw new Error("Threshold must be positive");
        }
        this.thresholdStd = thresholdStd;
    }
}

module.exports = SurgeDetector;
