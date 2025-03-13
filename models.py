from datetime import datetime
from app import db

class Handle(db.Model):
    __tablename__ = 'handles'
    id = db.Column(db.Integer, primary_key=True)
    handle = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    replies = db.relationship("Reply", back_populates="handle")
    denywords = db.relationship("DenyWord", back_populates="handle")

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