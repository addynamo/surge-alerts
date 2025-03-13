from datetime import datetime
from models import Handle, Reply, DenyWord
from app import db

class ReplyService:
    @staticmethod
    def store_reply(handle: str, reply_id: str, content: str) -> Reply:
        """Store a new reply and check if it should be hidden."""
        # Get or create handle
        handle_obj = Handle.query.filter_by(handle=handle).first()
        if not handle_obj:
            handle_obj = Handle(handle=handle)
            db.session.add(handle_obj)
            db.session.flush()
        
        # Create reply
        reply = Reply(
            reply_id=reply_id,
            content=content,
            handle=handle_obj
        )
        
        # Check against existing denywords
        denywords = DenyWord.query.filter_by(handle_id=handle_obj.id).all()
        for denyword in denywords:
            if denyword.word.lower() in content.lower():
                reply.is_hidden = True
                reply.hidden_at = datetime.utcnow()
                reply.hidden_by_word = denyword.word
                break
        
        db.session.add(reply)
        db.session.commit()
        return reply

    @staticmethod
    def add_denyword(handle: str, word: str) -> tuple[DenyWord, list[Reply]]:
        """Add a new denyword and process existing replies."""
        # Get or create handle
        handle_obj = Handle.query.filter_by(handle=handle).first()
        if not handle_obj:
            handle_obj = Handle(handle=handle)
            db.session.add(handle_obj)
            db.session.flush()
        
        # Create denyword
        denyword = DenyWord(word=word, handle=handle_obj)
        db.session.add(denyword)
        
        # Find and update existing replies that match
        newly_hidden = []
        replies = Reply.query.filter_by(
            handle_id=handle_obj.id,
            is_hidden=False
        ).all()
        
        for reply in replies:
            if word.lower() in reply.content.lower():
                reply.is_hidden = True
                reply.hidden_at = datetime.utcnow()
                reply.hidden_by_word = word
                newly_hidden.append(reply)
        
        db.session.commit()
        return denyword, newly_hidden

    @staticmethod
    def get_hidden_replies(handle: str) -> list[Reply]:
        """Get all hidden replies for a handle."""
        handle_obj = Handle.query.filter_by(handle=handle).first()
        if not handle_obj:
            return []
        return Reply.query.filter_by(
            handle_id=handle_obj.id,
            is_hidden=True
        ).order_by(Reply.hidden_at.desc()).all()
