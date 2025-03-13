from collections import deque
import numpy as np
from datetime import datetime, timedelta
import threading

class SurgeDetector:
    def __init__(self, window_size=60, threshold_std=2.0):
        """
        Initialize the surge detector.
        
        Args:
            window_size (int): Size of the rolling window in minutes
            threshold_std (float): Number of standard deviations for spike detection
        """
        self.window_size = window_size
        self.threshold_std = threshold_std
        self.values = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)
        self.spikes = deque(maxlen=100)  # Keep track of last 100 spikes
        self.lock = threading.Lock()

    def add_datapoint(self, value):
        """
        Add a new datapoint and check for spike.
        
        Args:
            value (float): The value to add
            
        Returns:
            bool: True if spike detected, False otherwise
        """
        with self.lock:
            current_time = datetime.now()
            self.values.append(value)
            self.timestamps.append(current_time)
            
            # Need at least 5 values for meaningful statistics
            if len(self.values) < 5:
                return False
            
            # Calculate statistics
            mean = np.mean(self.values)
            std = np.std(self.values)
            threshold = mean + (self.threshold_std * std)
            
            # Check for spike
            is_spike = value > threshold
            if is_spike:
                self.spikes.append((current_time, value))
            
            return is_spike

    def get_current_average(self):
        """Get the current rolling average."""
        with self.lock:
            if not self.values:
                return 0
            return float(np.mean(self.values))

    def get_recent_values(self):
        """Get recent values and timestamps for plotting."""
        with self.lock:
            return [
                {
                    'timestamp': ts.isoformat(),
                    'value': val
                }
                for ts, val in zip(self.timestamps, self.values)
            ]

    def get_recent_spikes(self):
        """Get recent spike events."""
        with self.lock:
            return [
                {
                    'timestamp': ts.isoformat(),
                    'value': val
                }
                for ts, val in self.spikes
            ]

    def get_threshold(self):
        """Get current threshold value."""
        with self.lock:
            if len(self.values) < 5:
                return None
            mean = np.mean(self.values)
            std = np.std(self.values)
            return float(mean + (self.threshold_std * std))

    def set_threshold(self, threshold_std):
        """Update the threshold multiplier."""
        if threshold_std <= 0:
            raise ValueError("Threshold must be positive")
        with self.lock:
            self.threshold_std = threshold_std
