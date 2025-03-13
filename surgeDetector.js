const moment = require('moment');

class SurgeDetector {
    constructor(windowSize = 60, thresholdStd = 2.0) {
        this.windowSize = windowSize;
        this.thresholdStd = thresholdStd;
        this.handleData = new Map(); // Store data per handle
        this.maxSpikes = 100;
    }

    initializeHandleData(handle) {
        if (!this.handleData.has(handle)) {
            this.handleData.set(handle, {
                values: [],
                timestamps: [],
                spikes: []
            });
        }
        return this.handleData.get(handle);
    }

    addDatapoint(handle, value) {
        const currentTime = moment();
        const data = this.initializeHandleData(handle);

        // Add new value and timestamp
        data.values.push(value);
        data.timestamps.push(currentTime);

        // Remove old values outside the window
        const cutoffTime = moment().subtract(this.windowSize, 'minutes');
        while (data.timestamps.length > 0 && data.timestamps[0].isBefore(cutoffTime)) {
            data.timestamps.shift();
            data.values.shift();
        }

        // Need at least 5 values for meaningful statistics
        if (data.values.length < 5) {
            return false;
        }

        // Calculate statistics
        const mean = this.calculateMean(data.values);
        const std = this.calculateStd(data.values, mean);
        const threshold = mean + (this.thresholdStd * std);

        // Check for spike
        const isSpike = value > threshold;
        if (isSpike) {
            data.spikes.push({ timestamp: currentTime, value });
            // Keep only the latest spikes
            if (data.spikes.length > this.maxSpikes) {
                data.spikes.shift();
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

    getCurrentAverage(handle) {
        const data = this.handleData.get(handle);
        return data && data.values.length ? this.calculateMean(data.values) : 0;
    }

    getRecentValues(handle) {
        const data = this.handleData.get(handle);
        if (!data) return [];
        return data.values.map((value, index) => ({
            timestamp: data.timestamps[index].toISOString(),
            value
        }));
    }

    getRecentSpikes(handle) {
        const data = this.handleData.get(handle);
        if (!data) return [];
        return data.spikes.map(spike => ({
            timestamp: spike.timestamp.toISOString(),
            value: spike.value
        }));
    }

    getThreshold(handle) {
        const data = this.handleData.get(handle);
        if (!data || data.values.length < 5) {
            return null;
        }
        const mean = this.calculateMean(data.values);
        const std = this.calculateStd(data.values, mean);
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