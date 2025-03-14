import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from surge_alert_routes import surge_alert_bp

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Configure SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Define Base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Initialize SQLAlchemy
db = SQLAlchemy(model_class=Base)
db.init_app(app)

# Import models here to avoid circular imports
from models import Handle, Reply, DenyWord, SurgeAlertConfig, SurgeAlert  # noqa: E402

# Register blueprints
app.register_blueprint(surge_alert_bp)

# Create database tables
with app.app_context():
    db.create_all()
    logger.info("Database tables created successfully")

    # Create indexes for better query performance
    db.session.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_replies_hidden_at ON replies (hidden_at);
        CREATE INDEX IF NOT EXISTS idx_surge_alerts_alerted_at ON reply_manager_surge_alerts (alerted_at);
        CREATE INDEX IF NOT EXISTS idx_surge_config_enabled ON reply_manager_surge_alert_config (enabled);
    """))
    db.session.commit()
    logger.info("Database indexes created successfully")

from reply_service import ReplyService

@app.route('/')
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'Social media surge detection service is running'}), 200

@app.route('/api/replies', methods=['POST'])
def store_reply():
    """Store a new reply and check if it should be hidden."""
    try:
        logger.debug("Received store_reply request")
        data = request.get_json()
        if not all(k in data for k in ['handle', 'reply_id', 'content']):
            return jsonify({'error': 'Missing required fields'}), 400

        reply = ReplyService.store_reply(
            handle=data['handle'],
            reply_id=data['reply_id'],
            content=data['content']
        )

        return jsonify({
            'stored': True,
            'is_hidden': reply.is_hidden,
            'hidden_by_word': reply.hidden_by_word
        })
    except Exception as e:
        logger.error(f"Error storing reply: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/denywords', methods=['POST'])
def add_denyword():
    """Add a new denyword and process existing replies."""
    try:
        logger.debug("Received add_denyword request")
        data = request.get_json()
        if not all(k in data for k in ['handle', 'word']):
            return jsonify({'error': 'Missing required fields'}), 400

        denyword, newly_hidden = ReplyService.add_denyword(
            handle=data['handle'],
            word=data['word']
        )

        return jsonify({
            'added': True,
            'newly_hidden_count': len(newly_hidden),
            'newly_hidden_replies': [
                {
                    'reply_id': reply.reply_id,
                    'hidden_at': reply.hidden_at.isoformat()
                }
                for reply in newly_hidden
            ]
        })
    except Exception as e:
        logger.error(f"Error adding denyword: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/hidden-replies/<handle>', methods=['GET'])
def get_hidden_replies(handle):
    """Get all hidden replies for a handle."""
    try:
        logger.debug(f"Fetching hidden replies for handle: {handle}")
        replies = ReplyService.get_hidden_replies(handle)
        return jsonify({
            'hidden_replies': [
                {
                    'reply_id': reply.reply_id,
                    'content': reply.content,
                    'hidden_at': reply.hidden_at.isoformat(),
                    'hidden_by_word': reply.hidden_by_word
                }
                for reply in replies
            ]
        })
    except Exception as e:
        logger.error(f"Error fetching hidden replies: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)