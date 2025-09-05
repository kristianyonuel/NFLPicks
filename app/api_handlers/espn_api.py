import requests
from config import Config
from datetime import datetime
# import feedparser  # Temporarily disabled due to Python 3.13 compatibility
# from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

class ESPNAPI:
    @staticmethod
    def get_scoreboard():
        try:
            response = requests.get(Config.NFL_SCORES_URL)
            return response.json()
        except Exception as e:
            print(f"Error fetching scores: {e}")
            return None

    @staticmethod
    def get_team_stats(team_id):
        try:
            url = f"{Config.ESPN_API_BASE}/teams/{team_id}/statistics"
            response = requests.get(url)
            return response.json()
        except Exception as e:
            print(f"Error fetching team stats: {e}")
            return None

    @staticmethod
    def get_weekly_schedule(year, week):
        try:
            url = f"{Config.ESPN_API_BASE}/scoreboard"
            params = {
                'dates': year,
                'seasontype': 2,  # Regular season
                'week': week
            }
            response = requests.get(url, params=params)
            return response.json()
        except Exception as e:
            print(f"Error fetching schedule: {e}")
            return None

    @staticmethod
    def get_latest_news_sentiment():
        try:
            # Temporarily return neutral sentiment
            return 0.0
            # feed = feedparser.parse(Config.NFL_NEWS_RSS)
            # analyzer = SentimentIntensityAnalyzer()
            # sentiments = []
            # for entry in feed.entries[:20]:
            #     headline = entry.title
            #     sentiment = analyzer.polarity_scores(headline)
            #     sentiments.append(sentiment['compound'])
            # if sentiments:
            #     avg_sentiment = sum(sentiments) / len(sentiments)
            # else:
            #     avg_sentiment = 0
            # return avg_sentiment
        except Exception as e:
            print(f"Error fetching news sentiment: {e}")
            return 0