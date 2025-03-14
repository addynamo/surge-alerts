from flask import Blueprint, request, jsonify
from app import db
from models import Handle, SurgeAlertConfig, SurgeAlert
from surge_alert_service import SurgeAlertService
from services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)
surge_alert_bp = Blueprint('surge_alert', __name__)
email_service = EmailService()

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

@surge_alert_bp.route('/surge-alert/<handle>/config/<config_id>', methods=['PUT'])
def update_config(handle, config_id):
    """Update an existing surge alert configuration."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        handle_obj = Handle.query.filter_by(handle=handle).first()
        if not handle_obj:
            return jsonify({'error': 'Handle not found'}), 404

        config = SurgeAlertConfig.query.filter_by(id=config_id, handle_id=handle_obj.id).first()
        if not config:
            return jsonify({'error': 'Configuration not found'}), 404

        updated_config = SurgeAlertService.update_config(
            config_id=config_id,
            data=data,
            updated_by=request.headers.get('X-User-ID', 'system')
        )

        return jsonify({
            'id': updated_config.id,
            'surge_reply_count_per_period': updated_config.surge_reply_count_per_period,
            'surge_reply_period_in_ms': updated_config.surge_reply_period_in_ms,
            'alert_cooldown_period_in_ms': updated_config.alert_cooldown_period_in_ms,
            'emails_to_notify': updated_config.emails_to_notify,
            'enabled': updated_config.enabled,
            'updated_at': updated_config.updated_at.isoformat() if updated_config.updated_at else None
        })
    except Exception as e:
        logger.error(f"Error updating surge alert config: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@surge_alert_bp.route('/surge-alert/<handle>/config', methods=['GET'])
def get_configs(handle):
    """Get all surge alert configurations for a handle."""
    try:
        handle_obj = Handle.query.filter_by(handle=handle).first()
        if not handle_obj:
            return jsonify({'error': 'Handle not found'}), 404

        configs = SurgeAlertService.get_configs(handle_obj.id)
        return jsonify({
            'configurations': [{
                'id': config.id,
                'surge_reply_count_per_period': config.surge_reply_count_per_period,
                'surge_reply_period_in_ms': config.surge_reply_period_in_ms,
                'alert_cooldown_period_in_ms': config.alert_cooldown_period_in_ms,
                'emails_to_notify': config.emails_to_notify,
                'enabled': config.enabled,
                'created_at': config.created_at.isoformat(),
                'updated_at': config.updated_at.isoformat() if config.updated_at else None
            } for config in configs]
        })
    except Exception as e:
        logger.error(f"Error getting surge alert configs: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@surge_alert_bp.route('/surge-alert/notify', methods=['POST'])
def process_notifications():
    """Process pending surge alerts and send notifications."""
    try:
        alerts = SurgeAlertService.get_pending_alerts()
        processed = []
        failed = []

        for alert in alerts:
            # Get the handle for the alert
            handle = Handle.query.join(SurgeAlertConfig)\
                .filter(SurgeAlertConfig.id == alert.config_id)\
                .first()

            if not handle:
                logger.error(f"Handle not found for alert {alert.id}")
                failed.append(alert.id)
                continue

            # Send notification email
            if email_service.send_surge_alert(
                config_snapshot=alert.config_snapshot,
                surge_amount=alert.surge_amount,
                handle=handle.handle
            ):
                # Mark alert as processed only if email was sent successfully
                SurgeAlertService.mark_alert_sent(alert.id)
                processed.append(alert.id)
            else:
                failed.append(alert.id)

        return jsonify({
            'success': True,
            'processed_alerts': processed,
            'failed_alerts': failed
        })
    except Exception as e:
        logger.error(f"Error processing surge alerts: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500