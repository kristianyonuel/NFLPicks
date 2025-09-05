import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///nfl_predictions.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Free API endpoints
    ESPN_API_BASE = "http://site.api.espn.com/apis/site/v2/sports/football/nfl"
    NFL_SCORES_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
    NFL_NEWS_RSS = "https://www.nfl.com/rss/rsslanding"
    
    # BallDontLie.io API
    BALLDONTLIE_API_KEY = "4f09c13f-4905-418b-8eca-0fb7d40afb84"
    BALLDONTLIE_BASE_URL = "https://api.balldontlie.io/v1"