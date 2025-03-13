import os
import logging
from flask import Flask, request, jsonify, render_template
from surge_detector import SurgeDetector

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default-secret-key")

# Initialize surge detector with 1-hour window and default threshold of 2 standard deviations
surge_detector = SurgeDetector(window_size=60, threshold_std=2.0)

@app.route('/')
def dashboard():
    """Render the monitoring dashboard."""
    return render_template('dashboard.html')

@app.route('/api/activity', methods=['POST'])
def record_activity():
    """Record new activity data point."""
    try:
        data = request.get_json()
        if not data or 'value' not in data:
            return jsonify({'error': 'Missing value in request'}), 400
        
        value = float(data['value'])
        is_spike = surge_detector.add_datapoint(value)
        
        return jsonify({
            'recorded': True,
            'is_spike': is_spike,
            'current_value': value,
            'current_average': surge_detector.get_current_average()
        })
    except ValueError as e:
        return jsonify({'error': f'Invalid value format: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Error processing activity: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get current metrics for dashboard."""
    try:
        return jsonify({
            'current_average': surge_detector.get_current_average(),
            'recent_values': surge_detector.get_recent_values(),
            'recent_spikes': surge_detector.get_recent_spikes(),
            'threshold': surge_detector.get_threshold()
        })
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/config', methods=['POST'])
def update_config():
    """Update surge detector configuration."""
    try:
        data = request.get_json()
        if 'threshold_std' in data:
            surge_detector.set_threshold(float(data['threshold_std']))
        return jsonify({'success': True})
    except ValueError as e:
        return jsonify({'error': f'Invalid configuration: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Error updating configuration: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
