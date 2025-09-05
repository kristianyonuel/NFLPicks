import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from app.models.game import Game
from app.models.prediction import Prediction
from app import db
from app.api_handlers.espn_api import ESPNAPI
from app.api_handlers.reddit_api import RedditAPI
from app.api_handlers.balldontlie_api import BallDontLieAPI

class NFLPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
        self.features = [
            'home_team_win_pct', 'away_team_win_pct',
            'home_team_points_for', 'away_team_points_for',
            'home_team_points_against', 'away_team_points_against',
            'home_team_last_5', 'away_team_last_5',
            'news_sentiment', 'reddit_sentiment'
        ]
        self.espn_api = ESPNAPI()
        self.reddit_api = RedditAPI()
        self.balldontlie_api = BallDontLieAPI()

    def prepare_game_data(self, game):
        # Calculate team statistics and create feature vector
        home_stats = self._get_team_stats(game.home_team)
        away_stats = self._get_team_stats(game.away_team)
        news_sentiment = ESPNAPI.get_latest_news_sentiment()
        reddit_data = self.reddit_api.get_team_reddit_picks(
            game.home_team, game.away_team
        )
        reddit_sentiment = reddit_data.get('confidence', 0.0)
        
        return pd.DataFrame({
            'home_team_win_pct': [home_stats['win_pct']],
            'away_team_win_pct': [away_stats['win_pct']],
            'home_team_points_for': [home_stats['points_for']],
            'away_team_points_for': [away_stats['points_for']],
            'home_team_points_against': [home_stats['points_against']],
            'away_team_points_against': [away_stats['points_against']],
            'home_team_last_5': [home_stats['last_5_performance']],
            'away_team_last_5': [away_stats['last_5_performance']],
            'news_sentiment': [news_sentiment],
            'reddit_sentiment': [reddit_sentiment]
        })

    def predict_game(self, game):
        try:
            # Check if prediction already exists for this game
            existing_prediction = Prediction.query.filter_by(game_id=game.id).first()
            if existing_prediction:
                print(f"Prediction already exists for game {game.id}, returning existing prediction")
                return existing_prediction
            
            # Check if we have enough historical data to train the model
            historical_games = Game.query.filter_by(status='completed').count()
            
            if historical_games < 5:
                # Use simplified prediction logic when we don't have enough data
                return self._simple_prediction(game)
            
            X = self.prepare_game_data(game)
            
            # Train model if not already trained
            if not hasattr(self.model, 'n_features_in_'):
                self._train_model()
            
            probability = self.model.predict_proba(X)[0]
            confidence = max(probability)
            predicted_winner = game.home_team if probability[1] > 0.5 else game.away_team
            reddit_sentiment = float(X['reddit_sentiment'].iloc[0])
            
            prediction = Prediction(
                game_id=game.id,
                predicted_winner=predicted_winner,
                confidence=float(confidence),
                predicted_spread=self._calculate_spread(probability),
                factors=self._get_prediction_factors(game),
                news_sentiment=float(X['news_sentiment'].iloc[0]),
                reddit_sentiment=reddit_sentiment
            )
            
            db.session.add(prediction)
            db.session.commit()
            return prediction
            
        except Exception as e:
            print(f"Error in prediction: {e}")
            return self._simple_prediction(game)
        
        return prediction

    def _get_team_stats(self, team):
        # Calculate team statistics from historical data
        games = Game.query.filter(
            (Game.home_team == team) | (Game.away_team == team)
        ).filter_by(status='completed').order_by(Game.game_date.desc()).limit(16).all()
        
        # If no historical data, return default stats
        if not games:
            return {
                'win_pct': 0.5,
                'points_for': 24.0,
                'points_against': 24.0,
                'last_5_performance': 0.5
            }
        
        # Calculate basic statistics
        stats = {
            'win_pct': self._calculate_win_percentage(team, games),
            'points_for': self._calculate_points_for(team, games),
            'points_against': self._calculate_points_against(team, games),
            'last_5_performance': self._calculate_last_5_performance(team, games[:5])
        }
        
        return stats

    def _calculate_win_percentage(self, team, games):
        wins = 0
        valid_games = 0
        for game in games:
            # Only count completed games with valid scores
            if game.home_score is not None and game.away_score is not None:
                valid_games += 1
                if (game.home_team == team and game.home_score > game.away_score) or \
                   (game.away_team == team and game.away_score > game.home_score):
                    wins += 1
        return wins / valid_games if valid_games > 0 else 0.5

    def _calculate_points_for(self, team, games):
        total_points = 0
        for game in games:
            if game.home_team == team:
                total_points += game.home_score if game.home_score else 0
            else:
                total_points += game.away_score if game.away_score else 0
        return total_points / len(games) if games else 0
    
    def _calculate_points_against(self, team, games):
        total_points = 0
        for game in games:
            if game.home_team == team:
                total_points += game.away_score if game.away_score else 0
            else:
                total_points += game.home_score if game.home_score else 0
        return total_points / len(games) if games else 0
    
    def _calculate_last_5_performance(self, team, games):
        if not games:
            return 0.5
        wins = 0
        valid_games = 0
        for game in games:
            # Only count completed games with valid scores
            if game.home_score is not None and game.away_score is not None:
                valid_games += 1
                if (game.home_team == team and game.home_score > game.away_score) or \
                   (game.away_team == team and game.away_score > game.home_score):
                    wins += 1
        return wins / valid_games if valid_games > 0 else 0.5
    
    def _calculate_spread(self, probability):
        # Convert probability to approximate point spread
        return (probability[1] - 0.5) * 20

    def _get_prediction_factors(self, game):
        # Return key factors influencing the prediction
        return {
            'historical_matchups': self._analyze_historical_matchups(game),
            'recent_performance': self._analyze_recent_performance(game),
            'home_field_advantage': 3.0  # Standard NFL home field advantage
        }
    
    def _analyze_historical_matchups(self, game):
        # Simplified historical analysis
        return {"head_to_head_record": "Even"}
    
    def _analyze_recent_performance(self, game):
        # Simplified recent performance analysis
        return {"trend": "Stable"}
    
    def _simple_prediction(self, game):
        """Simple prediction logic when insufficient historical data"""
        # Check if prediction already exists for this game
        existing_prediction = Prediction.query.filter_by(game_id=game.id).first()
        if existing_prediction:
            print(f"Simple prediction already exists for game {game.id}, returning existing prediction")
            return existing_prediction
        
        # Use basic heuristics: home field advantage, team name strength
        home_advantage = 0.55  # 55% chance for home team
        confidence = 0.6  # Moderate confidence
        
        predicted_winner = game.home_team
        predicted_spread = 3.0  # Standard home field advantage
        
        prediction = Prediction(
            game_id=game.id,
            predicted_winner=predicted_winner,
            confidence=confidence,
            predicted_spread=predicted_spread,
            factors={
                'method': 'simple_heuristic',
                'home_field_advantage': True,
                'note': 'Insufficient historical data for ML prediction'
            }
        )
        
        db.session.add(prediction)
        db.session.commit()
        return prediction
    
    def _train_model(self):
        """Train the model on available historical data"""
        completed_games = Game.query.filter_by(status='completed').all()
        
        if len(completed_games) < 5:
            return  # Not enough data to train
        
        X = []
        y = []
        
        for game in completed_games:
            try:
                game_features = self.prepare_game_data(game)
                X.append(game_features.iloc[0].values)
                # 1 if home team won, 0 if away team won
                y.append(1 if game.home_score > game.away_score else 0)
            except Exception as e:
                print(f"Error preparing game data for training: {e}")
                continue
        
        if len(X) > 0:
            self.train(X, y)

    def train(self, X, y):
        # Add cross-validation and hyperparameter tuning
        from sklearn.model_selection import GridSearchCV
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [6, 8, 10]
        }
        grid = GridSearchCV(RandomForestClassifier(random_state=42), param_grid, cv=3)
        grid.fit(X, y)
        self.model = grid.best_estimator_