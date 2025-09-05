import requests
import re
from datetime import datetime, timedelta
import time

class RedditAPI:
    def __init__(self):
        # Using Reddit's JSON API (public, no auth required)
        self.base_url = "https://www.reddit.com"
        self.headers = {
            'User-Agent': 'NFL Predictions Bot 1.0'
        }
        # NFL team keywords for matching
        self.nfl_teams = [
            'Chiefs', 'Ravens', 'Bills', 'Dolphins', 'Patriots', 'Jets',
            'Bengals', 'Steelers', 'Browns', 'Titans', 'Colts', 'Texans', 'Jaguars',
            'Broncos', 'Chargers', 'Raiders', 'Cowboys', 'Eagles', 'Giants', 'Commanders',
            'Packers', 'Bears', 'Lions', 'Vikings', 'Saints', 'Falcons', 'Panthers', 'Buccaneers',
            'Cardinals', '49ers', 'Seahawks', 'Rams'
        ]
    
    def get_nfl_sentiment(self, query="NFL predictions"):
        """Get sentiment from NFL-related subreddits"""
        try:
            picks_data = {
                'total_mentions': 0,
                'team_picks': {},
                'sentiment_score': 0.0,
                'confidence_level': 'low'
            }
            
            # Get data from both subreddits
            nfl_data = self._get_subreddit_data('nfl')
            nflbets_data = self._get_subreddit_data('NFLbets')
            
            # Combine and analyze the data
            all_posts = nfl_data + nflbets_data
            picks_data = self._analyze_posts_for_picks(all_posts, query)
            
            return picks_data
            
        except Exception as e:
            print(f"Error getting Reddit sentiment: {e}")
            return {
                'total_mentions': 0,
                'team_picks': {},
                'sentiment_score': 0.0,
                'confidence_level': 'low',
                'error': str(e)
            }
    
    def _get_subreddit_data(self, subreddit, limit=25):
        """Get recent posts from a subreddit"""
        try:
            url = f"{self.base_url}/r/{subreddit}/hot.json?limit={limit}"
            response = requests.get(url, headers=self.headers, verify=False)
            
            if response.status_code == 200:
                data = response.json()
                posts = []
                
                for post in data['data']['children']:
                    post_data = post['data']
                    posts.append({
                        'title': post_data.get('title', ''),
                        'text': post_data.get('selftext', ''),
                        'score': post_data.get('score', 0),
                        'num_comments': post_data.get('num_comments', 0),
                        'created_utc': post_data.get('created_utc', 0),
                        'subreddit': subreddit
                    })
                
                return posts
            else:
                print(f"Failed to fetch r/{subreddit}: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error fetching r/{subreddit}: {e}")
            return []
    
    def _analyze_posts_for_picks(self, posts, query=""):
        """Analyze posts to extract team picks and sentiment"""
        team_mentions = {}
        total_score = 0
        total_posts = 0
        confidence_indicators = []
        
        # Keywords that indicate picks/predictions
        pick_keywords = [
            'pick', 'picks', 'bet', 'betting', 'prediction', 'predictions',
            'favor', 'favors', 'win', 'wins', 'winning', 'lose', 'losing',
            'upset', 'lock', 'confident', 'sure thing', 'easy money'
        ]
        
        # Confidence indicators
        confidence_words = {
            'high': ['lock', 'sure thing', 'easy money', 'confident', 'guarantee'],
            'medium': ['like', 'favor', 'think', 'believe', 'should'],
            'low': ['maybe', 'might', 'could', 'possibly', 'lean']
        }
        
        for post in posts:
            text = f"{post['title']} {post['text']}".lower()
            
            # Check if post is relevant to NFL picks
            has_pick_keywords = any(keyword in text for keyword in pick_keywords)
            if not has_pick_keywords:
                continue
            
            total_posts += 1
            post_score = post['score'] if post['score'] > 0 else 1
            total_score += post_score
            
            # Find team mentions
            for team in self.nfl_teams:
                team_lower = team.lower()
                if team_lower in text:
                    if team not in team_mentions:
                        team_mentions[team] = {
                            'mentions': 0,
                            'total_score': 0,
                            'contexts': []
                        }
                    
                    team_mentions[team]['mentions'] += 1
                    team_mentions[team]['total_score'] += post_score
                    
                    # Extract context around team mention
                    context = self._extract_context(text, team_lower)
                    team_mentions[team]['contexts'].append(context)
            
            # Analyze confidence level
            for level, words in confidence_words.items():
                if any(word in text for word in words):
                    confidence_indicators.append(level)
        
        # Calculate overall sentiment score
        avg_score = total_score / total_posts if total_posts > 0 else 0
        sentiment_score = min(avg_score / 100, 1.0)  # Normalize to 0-1
        
        # Determine confidence level
        if confidence_indicators:
            high_conf = confidence_indicators.count('high')
            medium_conf = confidence_indicators.count('medium')
            low_conf = confidence_indicators.count('low')
            
            if high_conf > medium_conf and high_conf > low_conf:
                confidence_level = 'high'
            elif medium_conf > low_conf:
                confidence_level = 'medium'
            else:
                confidence_level = 'low'
        else:
            confidence_level = 'low'
        
        # Sort teams by popularity (mentions * average score)
        for team in team_mentions:
            mentions = team_mentions[team]['mentions']
            total_team_score = team_mentions[team]['total_score']
            team_mentions[team]['popularity'] = mentions * (total_team_score / mentions if mentions > 0 else 0)
        
        return {
            'total_mentions': sum(data['mentions'] for data in team_mentions.values()),
            'team_picks': team_mentions,
            'sentiment_score': sentiment_score,
            'confidence_level': confidence_level,
            'posts_analyzed': total_posts
        }
    
    def _extract_context(self, text, team):
        """Extract context around team mention"""
        # Find the team in text and get surrounding words
        pattern = rf'\b\w*{re.escape(team)}\w*\b'
        match = re.search(pattern, text)
        
        if match:
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end].strip()
            return context
        
        return ""
    
    def get_team_reddit_picks(self, home_team, away_team):
        """Get specific picks for a matchup"""
        query = f"{home_team} vs {away_team}"
        sentiment_data = self.get_nfl_sentiment(query)
        
        home_data = sentiment_data['team_picks'].get(home_team, {'mentions': 0, 'total_score': 0})
        away_data = sentiment_data['team_picks'].get(away_team, {'mentions': 0, 'total_score': 0})
        
        home_popularity = home_data.get('popularity', 0)
        away_popularity = away_data.get('popularity', 0)
        
        # Determine Reddit favorite
        if home_popularity > away_popularity:
            reddit_favorite = home_team
            confidence = min(home_popularity / (home_popularity + away_popularity) if (home_popularity + away_popularity) > 0 else 0.5, 1.0)
        elif away_popularity > home_popularity:
            reddit_favorite = away_team
            confidence = min(away_popularity / (home_popularity + away_popularity) if (home_popularity + away_popularity) > 0 else 0.5, 1.0)
        else:
            reddit_favorite = "Even"
            confidence = 0.5
        
        return {
            'reddit_favorite': reddit_favorite,
            'confidence': confidence,
            'home_mentions': home_data.get('mentions', 0),
            'away_mentions': away_data.get('mentions', 0),
            'total_mentions': home_data.get('mentions', 0) + away_data.get('mentions', 0),
            'home_popularity': home_popularity,
            'away_popularity': away_popularity
        }