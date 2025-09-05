from app import db
from datetime import datetime

class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    predicted_winner = db.Column(db.String(50), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    predicted_spread = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    factors = db.Column(db.JSON)
    news_sentiment = db.Column(db.Float)  # New: store news sentiment score
    reddit_sentiment = db.Column(db.Float)  # New: store Reddit sentiment score
    
    def to_dict(self):
        return {
            'id': self.id,
            'game_id': self.game_id,
            'predicted_winner': self.predicted_winner,
            'confidence': self.confidence,
            'predicted_spread': self.predicted_spread,
            'factors': self.factors,
            'news_sentiment': self.news_sentiment,
            'reddit_sentiment': self.reddit_sentiment
        }