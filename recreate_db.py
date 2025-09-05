from app import create_app, db
from app.models.game import Game
from app.models.prediction import Prediction
from datetime import datetime, timedelta

def recreate_database():
    app = create_app()
    with app.app_context():
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        
        # NFL Week 1 2025 games (September 5-8, 2025)
        current_week_games = [
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Kansas City Chiefs',
                'away_team': 'Baltimore Ravens',
                'game_date': datetime(2025, 9, 5, 20, 30),  # Thursday Night Football
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Philadelphia Eagles',
                'away_team': 'Green Bay Packers',
                'game_date': datetime(2025, 9, 7, 13, 0),  # Sunday 1:00 PM
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Buffalo Bills',
                'away_team': 'Miami Dolphins',
                'game_date': datetime(2025, 9, 7, 13, 0),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Cincinnati Bengals',
                'away_team': 'Pittsburgh Steelers',
                'game_date': datetime(2025, 9, 7, 13, 0),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Houston Texans',
                'away_team': 'Indianapolis Colts',
                'game_date': datetime(2025, 9, 7, 13, 0),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Jacksonville Jaguars',
                'away_team': 'Tennessee Titans',
                'game_date': datetime(2025, 9, 7, 13, 0),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'New England Patriots',
                'away_team': 'New York Jets',
                'game_date': datetime(2025, 9, 7, 13, 0),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Cleveland Browns',
                'away_team': 'Dallas Cowboys',
                'game_date': datetime(2025, 9, 7, 13, 0),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Tampa Bay Buccaneers',
                'away_team': 'Washington Commanders',
                'game_date': datetime(2025, 9, 7, 16, 25),  # Sunday 4:25 PM
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Arizona Cardinals',
                'away_team': 'San Francisco 49ers',
                'game_date': datetime(2025, 9, 7, 16, 25),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Los Angeles Chargers',
                'away_team': 'Las Vegas Raiders',
                'game_date': datetime(2025, 9, 7, 16, 25),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Seattle Seahawks',
                'away_team': 'Denver Broncos',
                'game_date': datetime(2025, 9, 7, 16, 25),
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'Los Angeles Rams',
                'away_team': 'Detroit Lions',
                'game_date': datetime(2025, 9, 7, 20, 20),  # Sunday Night Football
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'New York Giants',
                'away_team': 'Minnesota Vikings',
                'game_date': datetime(2025, 9, 8, 20, 30),  # Monday Night Football
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 1,
                'season': 2025,
                'home_team': 'New Orleans Saints',
                'away_team': 'Carolina Panthers',
                'game_date': datetime(2025, 9, 8, 20, 30),  # Monday Night Football (doubleheader)
                'status': 'scheduled',
                'espn_game_id': None,
                'injuries': None
            }
        ]
        
        # Add historical games for better ML training data
        historical_games = [
            # Week 18 2024 season examples
            {
                'week': 18,
                'season': 2024,
                'home_team': 'Kansas City Chiefs',
                'away_team': 'Denver Broncos',
                'home_score': 31,
                'away_score': 17,
                'game_date': datetime(2024, 12, 29, 13, 0),
                'status': 'completed',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 18,
                'season': 2024,
                'home_team': 'Buffalo Bills',
                'away_team': 'Miami Dolphins',
                'home_score': 28,
                'away_score': 24,
                'game_date': datetime(2024, 12, 29, 13, 0),
                'status': 'completed',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 18,
                'season': 2024,
                'home_team': 'Baltimore Ravens',
                'away_team': 'Pittsburgh Steelers',
                'home_score': 35,
                'away_score': 10,
                'game_date': datetime(2024, 12, 29, 13, 0),
                'status': 'completed',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 17,
                'season': 2024,
                'home_team': 'Philadelphia Eagles',
                'away_team': 'New York Giants',
                'home_score': 27,
                'away_score': 13,
                'game_date': datetime(2024, 12, 22, 13, 0),
                'status': 'completed',
                'espn_game_id': None,
                'injuries': None
            },
            {
                'week': 17,
                'season': 2024,
                'home_team': 'Green Bay Packers',
                'away_team': 'Minnesota Vikings',
                'home_score': 24,
                'away_score': 21,
                'game_date': datetime(2024, 12, 22, 13, 0),
                'status': 'completed',
                'espn_game_id': None,
                'injuries': None
            }
        ]
        
        all_games = current_week_games + historical_games
        
        for game_data in all_games:
            game = Game(**game_data)
            db.session.add(game)
        
        db.session.commit()
        print(f"Database recreated successfully!")
        print(f"Added {len(all_games)} games to the database!")
        print(f"Current week games: {len(current_week_games)}")
        print(f"Historical games for ML training: {len(historical_games)}")

if __name__ == '__main__':
    recreate_database()
