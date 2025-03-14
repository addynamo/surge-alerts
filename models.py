from datetime import datetime
from app import db
import uuid

class Handle(db.Model):
    __tablename__ = 'handles'
    id = db.Column(db.Integer, primary_key=True)
    handle = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    replies = db.relationship("Reply", back_populates="handle")
    denywords = db.relationship("DenyWord", back_populates="handle")
    surge_configs = db.relationship("SurgeAlertConfig", back_populates="handle")

class Reply(db.Model):
    __tablename__ = 'replies'
    id = db.Column(db.Integer, primary_key=True)
    reply_id = db.Column(db.String(255), unique=True, nullable=False)  # X's reply ID
    content = db.Column(db.Text, nullable=False)
    is_hidden = db.Column(db.Boolean, default=False)
    handle_id = db.Column(db.Integer, db.ForeignKey('handles.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    hidden_at = db.Column(db.DateTime, nullable=True)
    hidden_by_word = db.Column(db.String(255), nullable=True)  # Store which word caused the hiding

    # Relationships
    handle = db.relationship("Handle", back_populates="replies")

class DenyWord(db.Model):
    __tablename__ = 'denywords'
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(255), nullable=False)
    handle_id = db.Column(db.Integer, db.ForeignKey('handles.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    handle = db.relationship("Handle", back_populates="denywords")

    __table_args__ = (
        db.UniqueConstraint('word', 'handle_id', name='unique_word_per_handle'),
    )

class SurgeAlertConfig(db.Model):
    """Configuration settings for surge alerts per brand/handle."""
    __tablename__ = 'reply_manager_surge_alert_config'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    handle_id = db.Column(db.Integer, db.ForeignKey('handles.id'), nullable=False)
    surge_reply_count_per_period = db.Column(db.Integer, nullable=False)
    surge_reply_period_in_ms = db.Column(db.Integer, nullable=False)
    alert_cooldown_period_in_ms = db.Column(db.Integer)
    emails_to_notify = db.Column(db.JSON, nullable=False)
    enabled = db.Column(db.Boolean, nullable=False, default=True)
    last_evaluated_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_by = db.Column(db.String(36), nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(36), nullable=True)

    # Relationships
    handle = db.relationship("Handle", back_populates="surge_configs")
    alerts = db.relationship("SurgeAlert", back_populates="config")

class SurgeAlert(db.Model):
    """Records of surge alerts when thresholds are met."""
    __tablename__ = 'reply_manager_surge_alerts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id = db.Column(db.String(36), db.ForeignKey('reply_manager_surge_alert_config.id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    surge_amount = db.Column(db.Integer, nullable=False)
    alerted_at = db.Column(db.DateTime, nullable=True)
    config_snapshot = db.Column(db.JSON, nullable=False)

    # Relationships
    config = db.relationship("SurgeAlertConfig", back_populates="alerts")