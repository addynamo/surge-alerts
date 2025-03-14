from flask import Blueprint, request, jsonify
from app import db
from models import Handle, SurgeAlertConfig, SurgeAlert
from surge_alert_service import SurgeAlertService
import logging

logger = logging.getLogger(__name__)
surge_alert_bp = Blueprint('surge_alert', __name__)

@surge_alert_bp.route('/surge-alert/throughput/<handle>', methods=['GET'])
def get_throughput(handle):
    """Get throughput metrics for hidden replies."""
    try:
        handle_obj = Handle.query.filter_by(handle=handle).first()
        if not handle_obj:
            return jsonify({'error': 'Handle not found'}), 404

        metrics = SurgeAlertService.get_throughput_metrics(handle_obj.id)
        return jsonify(metrics)
    except Exception as e:
        logger.error(f"Error getting throughput metrics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@surge_alert_bp.route('/surge-alert/<handle>/config', methods=['POST'])
def create_config(handle):
    """Create a new surge alert configuration."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        handle_obj = Handle.query.filter_by(handle=handle).first()
        if not handle_obj:
            return jsonify({'error': 'Handle not found'}), 404

        config = SurgeAlertService.create_config(
            handle_id=handle_obj.id,
            data=data,
            created_by=request.headers.get('X-User-ID', 'system')
        )

        return jsonify({
            'id': config.id,
            'surge_reply_count_per_period': config.surge_reply_count_per_period,
            'surge_reply_period_in_ms': config.surge_reply_period_in_ms,
            'alert_cooldown_period_in_ms': config.alert_cooldown_period_in_ms,
            'emails_to_notify': config.emails_to_notify,
            'enabled': config.enabled,
            'created_at': config.created_at.isoformat()
        }), 201
    except Exception as e:
        logger.error(f"Error creating surge alert config: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@surge_alert_bp.route('/surge-alert/notify', methods=['POST'])
def process_notifications():
    """Process pending surge alerts and send notifications."""
    try:
        alerts = SurgeAlertService.get_pending_alerts()
        processed = []

        for alert in alerts:
            # Here you would integrate with your email service to send notifications
            # For now, we'll just mark them as processed
            SurgeAlertService.mark_alert_sent(alert.id)
            processed.append(alert.id)

        return jsonify({
            'success': True,
            'processed_alerts': processed
        })
    except Exception as e:
        logger.error(f"Error processing surge alerts: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500