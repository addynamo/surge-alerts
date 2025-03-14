from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json
from sqlalchemy import text
from app import db
from models import Handle, Reply, SurgeAlertConfig, SurgeAlert

class SurgeAlertService:
    @staticmethod
    def get_throughput_metrics(handle_id: int) -> Dict:
        """Get hidden reply throughput metrics for the specified time periods."""
        now = datetime.utcnow()
        
        # Calculate timestamps for different periods
        fifteen_min_ago = now - timedelta(minutes=15)
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)
        
        # Query hidden replies for different time periods
        fifteen_min_count = Reply.query.filter(
            Reply.handle_id == handle_id,
            Reply.is_hidden == True,
            Reply.hidden_at >= fifteen_min_ago
        ).count()
        
        hour_count = Reply.query.filter(
            Reply.handle_id == handle_id,
            Reply.is_hidden == True,
            Reply.hidden_at >= hour_ago
        ).count()
        
        day_count = Reply.query.filter(
            Reply.handle_id == handle_id,
            Reply.is_hidden == True,
            Reply.hidden_at >= day_ago
        ).count()
        
        return {
            "hidden_replies_last_15_min": fifteen_min_count,
            "hidden_replies_last_hour": hour_count,
            "hidden_replies_last_24_hours": day_count
        }

    @staticmethod
    def create_config(handle_id: int, data: Dict, created_by: str) -> SurgeAlertConfig:
        """Create a new surge alert configuration."""
        config = SurgeAlertConfig(
            handle_id=handle_id,
            surge_reply_count_per_period=data['surge_reply_count_per_period'],
            surge_reply_period_in_ms=data['surge_reply_period_in_ms'],
            alert_cooldown_period_in_ms=data.get('alert_cooldown_period_in_ms', 900000),  # Default 15 minutes
            emails_to_notify=data['emails_to_notify'],
            enabled=data.get('enabled', True),
            created_by=created_by
        )
        db.session.add(config)
        db.session.commit()
        return config

    @staticmethod
    def update_config(config_id: str, data: Dict, updated_by: str) -> Optional[SurgeAlertConfig]:
        """Update an existing surge alert configuration."""
        config = SurgeAlertConfig.query.get(config_id)
        if not config:
            return None
            
        config.surge_reply_count_per_period = data.get('surge_reply_count_per_period', config.surge_reply_count_per_period)
        config.surge_reply_period_in_ms = data.get('surge_reply_period_in_ms', config.surge_reply_period_in_ms)
        config.alert_cooldown_period_in_ms = data.get('alert_cooldown_period_in_ms', config.alert_cooldown_period_in_ms)
        config.emails_to_notify = data.get('emails_to_notify', config.emails_to_notify)
        config.enabled = data.get('enabled', config.enabled)
        config.updated_by = updated_by
        
        db.session.commit()
        return config

    @staticmethod
    def get_configs(handle_id: int) -> List[SurgeAlertConfig]:
        """Get all surge alert configurations for a handle."""
        return SurgeAlertConfig.query.filter_by(handle_id=handle_id).all()

    @staticmethod
    def evaluate_surges() -> None:
        """
        Evaluate all active configurations for potential surges.
        This is called by the database event every 5 minutes.
        """
        configs = SurgeAlertConfig.query.filter_by(enabled=True).all()
        now = datetime.utcnow()
        
        for config in configs:
            # Convert period from milliseconds to seconds for timedelta
            period_seconds = config.surge_reply_period_in_ms / 1000
            period_start = now - timedelta(seconds=period_seconds)
            
            # Count hidden replies in the period
            hidden_count = Reply.query.filter(
                Reply.handle_id == config.handle_id,
                Reply.is_hidden == True,
                Reply.hidden_at >= period_start
            ).count()
            
            if hidden_count >= config.surge_reply_count_per_period:
                # Check if we're still in cooldown from last alert
                last_alert = SurgeAlert.query.filter_by(config_id=config.id)\
                    .order_by(SurgeAlert.created_at.desc()).first()
                
                cooldown_passed = True
                if last_alert and config.alert_cooldown_period_in_ms:
                    cooldown_seconds = config.alert_cooldown_period_in_ms / 1000
                    cooldown_end = last_alert.created_at + timedelta(seconds=cooldown_seconds)
                    cooldown_passed = now >= cooldown_end
                
                if cooldown_passed:
                    # Create new surge alert
                    alert = SurgeAlert(
                        config_id=config.id,
                        surge_amount=hidden_count,
                        config_snapshot=json.dumps({
                            'surge_reply_count_per_period': config.surge_reply_count_per_period,
                            'surge_reply_period_in_ms': config.surge_reply_period_in_ms,
                            'alert_cooldown_period_in_ms': config.alert_cooldown_period_in_ms,
                            'emails_to_notify': config.emails_to_notify
                        })
                    )
                    db.session.add(alert)
            
            # Update last evaluated timestamp
            config.last_evaluated_at = now
            
        db.session.commit()

    @staticmethod
    def get_pending_alerts() -> List[SurgeAlert]:
        """Get all unprocessed alerts (where alerted_at is NULL)."""
        return SurgeAlert.query.filter_by(alerted_at=None).all()

    @staticmethod
    def mark_alert_sent(alert_id: str) -> None:
        """Mark an alert as sent by updating its alerted_at timestamp."""
        alert = SurgeAlert.query.get(alert_id)
        if alert:
            alert.alerted_at = datetime.utcnow()
            db.session.commit()
