from app import db
from datetime import datetime

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    week = db.Column(db.Integer, nullable=False)
    season = db.Column(db.Integer, nullable=False)
    home_team = db.Column(db.String(50), nullable=False)
    away_team = db.Column(db.String(50), nullable=False)
    home_score = db.Column(db.Integer)
    away_score = db.Column(db.Integer)
    game_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in_progress, completed
    espn_game_id = db.Column(db.String(50))
    injuries = db.Column(db.String(255))  # New: store key injury info as a string
    
    # Relationships
    predictions = db.relationship('Prediction', backref='game', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'week': self.week,
            'season': self.season,
            'home_team': self.home_team,
            'away_team': self.away_team,
            'home_score': self.home_score,
            'away_score': self.away_score,
            'game_date': self.game_date.isoformat() if self.game_date else None,
            'status': self.status,
            'injuries': self.injuries
        }
    
    @property
    def winner(self):
        if self.status == 'completed' and self.home_score is not None and self.away_score is not None:
            return self.home_team if self.home_score > self.away_score else self.away_team
        return None