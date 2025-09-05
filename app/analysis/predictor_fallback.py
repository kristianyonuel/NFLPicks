"""
Fallback NFLPredictor for when data science packages are not available.
This provides basic prediction functionality without pandas/numpy/sklearn.
"""
import random
from app.models.game import Game
from app.models.prediction import Prediction
from app import db
from datetime import datetime

class NFLPredictorFallback:
    """Lightweight predictor that works without data science packages."""
    
    def __init__(self):
        self.features = [
            'home_team_win_pct', 'away_team_win_pct',
            'home_field_advantage', 'recent_form'
        ]
        # Set random seed for consistent predictions
        random.seed(42)
    
    def predict_game(self, game):
        """Generate a prediction for a game using simple heuristics."""
        try:
            # Basic prediction logic without ML
            home_advantage = 0.55  # Home teams win ~55% of games
            
            # Get simple team stats
            home_stats = self._get_simple_team_stats(game.home_team)
            away_stats = self._get_simple_team_stats(game.away_team)
            
            # Calculate win probability
            home_win_prob = self._calculate_simple_win_probability(
                home_stats, away_stats, home_advantage
            )
            
            # Determine prediction
            predicted_winner = game.home_team if home_win_prob > 0.5 else game.away_team
            confidence = max(home_win_prob, 1 - home_win_prob)
            
            # Generate predicted scores
            predicted_home_score, predicted_away_score = self._predict_scores(
                game.home_team, game.away_team, home_win_prob
            )
            
            # Create prediction object
            prediction = Prediction(
                game_id=game.id,
                predicted_winner=predicted_winner,
                confidence_score=confidence,
                predicted_home_score=predicted_home_score,
                predicted_away_score=predicted_away_score,
                prediction_method='simple_heuristic',
                created_at=datetime.utcnow()
            )
            
            return prediction
            
        except Exception as e:
            print(f"Error in fallback prediction for game {game.id}: {e}")
            return self._create_default_prediction(game)
    
    def _get_simple_team_stats(self, team_name):
        """Get basic team statistics without data science packages."""
        # This is a simplified version that doesn't require complex calculations
        recent_games = Game.query.filter(
            (Game.home_team == team_name) | (Game.away_team == team_name)
        ).order_by(Game.game_date.desc()).limit(5).all()
        
        wins = 0
        total_games = len(recent_games)
        points_for = 0
        points_against = 0
        
        for game in recent_games:
            if game.home_score is not None and game.away_score is not None:
                if team_name == game.home_team:
                    points_for += game.home_score
                    points_against += game.away_score
                    if game.home_score > game.away_score:
                        wins += 1
                else:
                    points_for += game.away_score
                    points_against += game.home_score
                    if game.away_score > game.home_score:
                        wins += 1
        
        win_pct = wins / total_games if total_games > 0 else 0.5
        avg_points_for = points_for / total_games if total_games > 0 else 21
        avg_points_against = points_against / total_games if total_games > 0 else 21
        
        return {
            'win_pct': win_pct,
            'avg_points_for': avg_points_for,
            'avg_points_against': avg_points_against,
            'recent_games': total_games
        }
    
    def _calculate_simple_win_probability(self, home_stats, away_stats, home_advantage):
        """Calculate win probability using simple metrics."""
        # Base probability on recent win percentages
        home_base = home_stats['win_pct']
        away_base = away_stats['win_pct']
        
        # Adjust for scoring efficiency
        home_scoring_diff = home_stats['avg_points_for'] - home_stats['avg_points_against']
        away_scoring_diff = away_stats['avg_points_for'] - away_stats['avg_points_against']
        
        # Normalize scoring differences
        scoring_factor = (home_scoring_diff - away_scoring_diff) / 50.0  # Scale factor
        scoring_factor = max(-0.3, min(0.3, scoring_factor))  # Cap the influence
        
        # Combine factors
        win_prob = home_base * 0.4 + home_advantage * 0.3 + (0.5 + scoring_factor) * 0.3
        
        # Ensure probability is between 0.1 and 0.9
        return max(0.1, min(0.9, win_prob))
    
    def _predict_scores(self, home_team, away_team, home_win_prob):
        """Predict game scores using simple logic."""
        # Base scoring around NFL average (21-24 points)
        base_home_score = 22 + (home_win_prob - 0.5) * 10
        base_away_score = 22 + (0.5 - home_win_prob) * 10
        
        # Add some variability
        home_variance = random.randint(-3, 7)  # Home teams score slightly more on average
        away_variance = random.randint(-5, 5)
        
        predicted_home_score = max(10, int(base_home_score + home_variance))
        predicted_away_score = max(10, int(base_away_score + away_variance))
        
        return predicted_home_score, predicted_away_score
    
    def _create_default_prediction(self, game):
        """Create a default prediction when everything else fails."""
        return Prediction(
            game_id=game.id,
            predicted_winner=game.home_team,  # Default to home team
            confidence_score=0.55,  # Slight home field advantage
            predicted_home_score=21,
            predicted_away_score=17,
            prediction_method='default_fallback',
            created_at=datetime.utcnow()
        )
    
    def get_weekly_predictions(self, week, season=2025):
        """Get predictions for all games in a week."""
        games = Game.query.filter_by(week=week, season=season).all()
        predictions = []
        
        for game in games:
            prediction = self.predict_game(game)
            predictions.append(prediction)
        
        return predictions
    
    def train_model(self, historical_games=None):
        """Fallback training method (does nothing but maintains interface)."""
        print("🔧 Using fallback predictor - no training required")
        return True
    
    def get_feature_importance(self):
        """Return simplified feature importance."""
        return {
            'home_field_advantage': 0.3,
            'recent_win_percentage': 0.4,
            'scoring_differential': 0.3
        }

# Check if advanced packages are available and choose predictor
try:
    import pandas as pd
    import numpy as np
    from sklearn.ensemble import RandomForestClassifier
    # If we get here, advanced packages are available
    from .predictor import NFLPredictor
    print("✅ Using advanced ML predictor")
except ImportError as e:
    print(f"⚠️ Advanced ML packages not available ({e}), using fallback predictor")
    NFLPredictor = NFLPredictorFallback
