from flask import render_template, jsonify, request
from app.main import bp
from app.models.game import Game
from app.models.prediction import Prediction
from app.api_handlers.espn_api import ESPNAPI
from app.api_handlers.balldontlie_api import BallDontLieAPI
from app.analysis.predictor import NFLPredictor
from app import db
from datetime import datetime, timedelta
import json

@bp.route('/')
def index():
    return render_template('dashboard.html')

@bp.route('/dashboard')
def dashboard():
    # Get current week games (Week 1 2025)
    current_week = 1
    games = Game.query.filter_by(week=current_week, season=2025).order_by(Game.game_date).all()
    
    # Get existing predictions
    predictions = Prediction.query.join(Game).filter(
        Game.week == current_week,
        Game.season == 2025
    ).all()
    
    return render_template('dashboard.html', 
                         games=games, 
                         predictions=predictions)

@bp.route('/weekly_picks')
def weekly_picks():
    current_week = request.args.get('week', type=int)
    if not current_week:
        # Get current NFL week (simplified logic)
        current_week = 1
    
    games = Game.query.filter_by(week=current_week).all()
    predictions = []
    
    predictor = NFLPredictor()
    for game in games:
        try:
            prediction = predictor.predict_game(game)
            predictions.append(prediction)
        except Exception as e:
            print(f"Error predicting game {game.id}: {e}")
    
    return render_template('dashboard.html', 
                         games=games, 
                         predictions=predictions,
                         current_week=current_week)

@bp.route('/analysis')
def analysis():
    # Get prediction accuracy stats
    total_predictions = Prediction.query.count()
    correct_predictions = 0
    
    for prediction in Prediction.query.all():
        game = Game.query.get(prediction.game_id)
        if game and game.winner == prediction.predicted_winner:
            correct_predictions += 1
    
    accuracy = (correct_predictions / total_predictions * 100) if total_predictions > 0 else 0
    
    return jsonify({
        'total_predictions': total_predictions,
        'correct_predictions': correct_predictions,
        'accuracy': round(accuracy, 2)
    })

@bp.route('/api/refresh_scores')
def refresh_scores():
    try:
        espn_api = ESPNAPI()
        scoreboard_data = espn_api.get_scoreboard()
        
        if scoreboard_data and 'events' in scoreboard_data:
            for event in scoreboard_data['events']:
                # Update game scores from ESPN data
                game_id = event.get('id')
                existing_game = Game.query.filter_by(espn_game_id=game_id).first()
                
                if existing_game:
                    competitions = event.get('competitions', [])
                    if competitions:
                        competitors = competitions[0].get('competitors', [])
                        for competitor in competitors:
                            team_name = competitor.get('team', {}).get('displayName', '')
                            score = competitor.get('score', 0)
                            
                            if competitor.get('homeAway') == 'home':
                                existing_game.home_score = int(score)
                            else:
                                existing_game.away_score = int(score)
                        
                        existing_game.status = competitions[0].get('status', {}).get('type', {}).get('name', 'scheduled')
                        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Scores refreshed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@bp.route('/api/games/<int:week>')
def get_games_by_week(week):
    games = Game.query.filter_by(week=week).all()
    return jsonify([game.to_dict() for game in games])

@bp.route('/api/predictions/<int:game_id>')
def get_prediction(game_id):
    prediction = Prediction.query.filter_by(game_id=game_id).first()
    if prediction:
        return jsonify(prediction.to_dict())
    return jsonify({'error': 'Prediction not found'}), 404

@bp.route('/api/make_prediction/<int:game_id>', methods=['POST'])
def make_prediction_api(game_id):
    try:
        game = Game.query.get_or_404(game_id)
        
        # Check if prediction already exists
        existing_prediction = Prediction.query.filter_by(game_id=game_id).first()
        if existing_prediction:
            return jsonify({'success': True, 'prediction': existing_prediction.to_dict()})
        
        # Create new prediction
        predictor = NFLPredictor()
        prediction = predictor.predict_game(game)
        
        return jsonify({
            'success': True, 
            'prediction': prediction.to_dict(),
            'message': 'Prediction created successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@bp.route('/api/weekly-predictions')
def weekly_predictions():
    # Example: get predictions for the current week (replace with actual logic)
    from datetime import datetime
    current_week = 1  # Replace with logic to determine current week
    predictions = (
        Prediction.query
        .join(Game, Prediction.game_id == Game.id)
        .filter(Game.week == current_week)
        .all()
    )
    return jsonify({
        "predictions": [p.to_dict() for p in predictions]
    })

@bp.route('/api/prediction-accuracy')
def prediction_accuracy():
    try:
        # Get prediction accuracy data for chart
        total_predictions = Prediction.query.count()
        if total_predictions == 0:
            return jsonify({
                'weeks': [1],
                'accuracy': [0],
                'total_predictions': 0
            })
        
        correct_predictions = 0
        for prediction in Prediction.query.all():
            game = Game.query.get(prediction.game_id)
            if game and game.winner == prediction.predicted_winner:
                correct_predictions += 1
        
        accuracy = (correct_predictions / total_predictions * 100) if total_predictions > 0 else 0
        
        return jsonify({
            'weeks': [1, 2, 3, 4],  # Sample weeks
            'accuracy': [accuracy, accuracy, accuracy, accuracy],
            'total_predictions': total_predictions,
            'correct_predictions': correct_predictions
        })
    except Exception as e:
        return jsonify({
            'weeks': [1],
            'accuracy': [0],
            'error': str(e)
        })

@bp.route('/api/live-scores')
def live_scores():
    try:
        # Get current live scores
        live_games = Game.query.filter_by(status='in_progress').all()
        completed_games = Game.query.filter_by(status='completed').all()
        
        return jsonify({
            'live_games': [game.to_dict() for game in live_games],
            'completed_games': [game.to_dict() for game in completed_games[-5:]],  # Last 5 completed
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@bp.route('/api/reddit-picks')
def reddit_picks():
    try:
        from app.api_handlers.reddit_api import RedditAPI
        reddit_api = RedditAPI()
        
        # Get overall NFL sentiment from Reddit
        sentiment_data = reddit_api.get_nfl_sentiment()
        
        # Get picks for current week games
        current_week = 1
        games = Game.query.filter_by(week=current_week, season=2025).all()
        
        game_picks = []
        for game in games:
            # Extract team names (remove city names for better matching)
            home_team_short = game.home_team.split()[-1]  # e.g., "Kansas City Chiefs" -> "Chiefs"
            away_team_short = game.away_team.split()[-1]
            
            # Get specific picks for this matchup
            picks = reddit_api.get_team_reddit_picks(home_team_short, away_team_short)
            
            game_picks.append({
                'game_id': game.id,
                'home_team': game.home_team,
                'away_team': game.away_team,
                'game_date': game.game_date.isoformat(),
                'reddit_favorite': picks['reddit_favorite'],
                'confidence': picks['confidence'],
                'home_mentions': picks['home_mentions'],
                'away_mentions': picks['away_mentions'],
                'total_mentions': picks['total_mentions']
            })
        
        return jsonify({
            'success': True,
            'overall_sentiment': sentiment_data,
            'game_picks': game_picks,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'game_picks': [],
            'overall_sentiment': {}
        })

@bp.route('/api/reddit-analysis/<int:game_id>')
def reddit_game_analysis(game_id):
    try:
        from app.api_handlers.reddit_api import RedditAPI
        reddit_api = RedditAPI()
        
        game = Game.query.get_or_404(game_id)
        
        # Extract team names for better Reddit matching
        home_team_short = game.home_team.split()[-1]
        away_team_short = game.away_team.split()[-1]
        
        # Get detailed analysis
        picks = reddit_api.get_team_reddit_picks(home_team_short, away_team_short)
        overall_sentiment = reddit_api.get_nfl_sentiment(f"{home_team_short} vs {away_team_short}")
        
        return jsonify({
            'success': True,
            'game': game.to_dict(),
            'reddit_picks': picks,
            'overall_sentiment': overall_sentiment,
            'analysis_time': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@bp.route('/api/balldontlie-test')
def balldontlie_test():
    """Test BallDontLie API connection and data"""
    try:
        balldontlie_api = BallDontLieAPI()
        
        # Test API connection
        connection_test = balldontlie_api.test_api_connection()
        
        if connection_test['success']:
            # Get teams data
            teams_data = balldontlie_api.get_nfl_teams()
            
            # Get games data
            games_data = balldontlie_api.get_games_data()
            
            return jsonify({
                'success': True,
                'connection_test': connection_test,
                'teams_data': teams_data,
                'games_data': games_data,
                'api_status': 'BallDontLie API is working'
            })
        else:
            return jsonify({
                'success': False,
                'connection_test': connection_test,
                'api_status': 'BallDontLie API connection failed'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'api_status': 'Error testing BallDontLie API'
        })

@bp.route('/api/enhanced-analysis')
def enhanced_analysis():
    """Get enhanced analysis combining ESPN, Reddit, and BallDontLie data"""
    try:
        # Get current week games
        current_week = 1
        games = Game.query.filter_by(week=current_week, season=2025).limit(5).all()
        
        enhanced_data = []
        
        # Initialize APIs
        from app.api_handlers.reddit_api import RedditAPI
        from app.api_handlers.balldontlie_api import BallDontLieAPI
        reddit_api = RedditAPI()
        balldontlie_api = BallDontLieAPI()
        
        for game in games:
            # Get Reddit analysis
            home_team_short = game.home_team.split()[-1]
            away_team_short = game.away_team.split()[-1]
            reddit_picks = reddit_api.get_team_reddit_picks(home_team_short, away_team_short)
            
            # Get BallDontLie enhanced data
            home_team_data = balldontlie_api.get_enhanced_team_data(game.home_team)
            away_team_data = balldontlie_api.get_enhanced_team_data(game.away_team)
            
            game_analysis = {
                'game_id': game.id,
                'home_team': game.home_team,
                'away_team': game.away_team,
                'game_date': game.game_date.isoformat(),
                'reddit_analysis': reddit_picks,
                'balldontlie_home': home_team_data,
                'balldontlie_away': away_team_data,
                'status': game.status
            }
            
            enhanced_data.append(game_analysis)
        
        return jsonify({
            'success': True,
            'enhanced_analysis': enhanced_data,
            'apis_used': ['ESPN', 'Reddit', 'BallDontLie'],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'enhanced_analysis': []
        })

@bp.route('/api/auto-populate-reddit')
def auto_populate_reddit():
    """Auto-populate comprehensive Reddit picks analysis"""
    try:
        from app.api_handlers.reddit_api import RedditAPI
        reddit_api = RedditAPI()
        
        # Run comprehensive auto-population
        comprehensive_data = reddit_api.auto_populate_comprehensive_picks()
        
        return jsonify({
            'success': True,
            'message': 'Comprehensive Reddit analysis completed',
            **comprehensive_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to auto-populate Reddit analysis'
        })

@bp.route('/api/reddit-comprehensive')
def reddit_comprehensive():
    """Get comprehensive Reddit analysis with enhanced metrics"""
    try:
        from app.api_handlers.reddit_api import RedditAPI
        reddit_api = RedditAPI()
        
        # Get comprehensive sentiment analysis
        comprehensive_data = reddit_api.get_nfl_sentiment()
        
        # Enhanced response with detailed breakdown
        return jsonify({
            'success': True,
            'comprehensive_analysis': comprehensive_data,
            'enhanced_metrics': {
                'analysis_depth': comprehensive_data.get('analysis_depth', 'standard'),
                'data_quality': 'high' if comprehensive_data.get('posts_analyzed', 0) > 50 else 'medium',
                'coverage_score': len(comprehensive_data.get('subreddits_analyzed', [])) * 20,
                'reliability_score': min(comprehensive_data.get('total_mentions', 0) * 2, 100)
            },
            'recommendations': {
                'most_mentioned_teams': sorted(
                    comprehensive_data.get('team_picks', {}).items(),
                    key=lambda x: x[1].get('mentions', 0),
                    reverse=True
                )[:5],
                'highest_confidence_picks': [
                    team for team, data in comprehensive_data.get('team_picks', {}).items()
                    if 'high' in data.get('confidence_indicators', [])
                ]
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'comprehensive_analysis': {},
            'enhanced_metrics': {},
            'recommendations': {}
        })

@bp.route('/api/reddit-comprehensive-cached')
def reddit_comprehensive_cached():
    """Get cached comprehensive Reddit analysis (updated every hour)"""
    try:
        from app.api_handlers.reddit_api import RedditAPI
        reddit_api = RedditAPI()
        
        cached_data = reddit_api.get_cached_comprehensive_data()
        
        return jsonify({
            'success': True,
            'cached_data': cached_data,
            'data_freshness': cached_data.get('last_updated'),
            'total_posts': cached_data.get('total_posts_analyzed', 0),
            'total_comments': cached_data.get('total_comments_analyzed', 0),
            'auto_updated': True,
            'update_frequency': 'Every hour'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@bp.route('/api/reddit-force-update')
def reddit_force_update():
    """Force immediate comprehensive Reddit update"""
    try:
        from app.api_handlers.reddit_api import RedditAPI
        reddit_api = RedditAPI()
        
        # Force update (this may take a while)
        updated_data = reddit_api.force_comprehensive_update()
        
        return jsonify({
            'success': True,
            'message': 'Comprehensive Reddit data updated successfully',
            'updated_data': updated_data,
            'total_posts': updated_data.get('total_posts_analyzed', 0),
            'total_comments': updated_data.get('total_comments_analyzed', 0),
            'last_updated': updated_data.get('last_updated')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@bp.route('/api/reddit-background-status')
def reddit_background_status():
    """Get status of background Reddit processing"""
    try:
        from app.api_handlers.reddit_api import RedditAPI
        reddit_api = RedditAPI()
        
        cached_data = reddit_api.get_cached_comprehensive_data()
        
        # Check if cache file exists
        import os
        cache_exists = os.path.exists('reddit_cache.json')
        
        return jsonify({
            'success': True,
            'background_running': reddit_api.background_running,
            'cache_exists': cache_exists,
            'last_updated': cached_data.get('last_updated'),
            'total_posts_analyzed': cached_data.get('total_posts_analyzed', 0),
            'total_comments_analyzed': cached_data.get('total_comments_analyzed', 0),
            'next_update': 'Within the next hour',
            'update_frequency': '1 hour',
            'status': 'Active' if reddit_api.background_running else 'Inactive'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })
