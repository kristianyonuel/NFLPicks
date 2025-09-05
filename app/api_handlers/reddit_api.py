import requests
import re
from datetime import datetime, timedelta
import time
import threading
import schedule
import json
import os

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
        
        # Cache file for storing comprehensive data
        self.cache_file = 'reddit_cache.json'
        self.comprehensive_data = self._load_cache()
        
        # Background processing setup
        self.background_running = False
        self._setup_background_scheduler()
    
    def _load_cache(self):
        """Load cached Reddit data from file"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading cache: {e}")
        return {
            'last_updated': None,
            'comprehensive_analysis': {},
            'total_posts_analyzed': 0,
            'total_comments_analyzed': 0
        }
    
    def _save_cache(self):
        """Save Reddit data to cache file"""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.comprehensive_data, f, indent=2)
        except Exception as e:
            print(f"Error saving cache: {e}")
    
    def _setup_background_scheduler(self):
        """Setup background scheduler to run every hour"""
        def run_scheduler():
            schedule.every().hour.do(self._background_comprehensive_analysis)
            while self.background_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        # Start background thread
        self.background_running = True
        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
        print("Reddit background scheduler started - will run comprehensive analysis every hour")
    
    def get_nfl_sentiment(self, query="NFL predictions"):
        """Get comprehensive sentiment from NFL-related subreddits"""
        try:
            picks_data = {
                'total_mentions': 0,
                'team_picks': {},
                'sentiment_score': 0.0,
                'confidence_level': 'low',
                'posts_analyzed': 0,
                'subreddits_analyzed': [],
                'data_sources': []
            }
            
            # Comprehensive subreddit list for NFL analysis
            nfl_subreddits = [
                'nfl', 'NFLbets', 'sportsbook', 'DynastyFF', 
                'fantasyfootball', 'nflcirclejerk', 'NFLNoobs'
            ]
            
            all_posts = []
            
            # Get comprehensive data from multiple subreddits
            for subreddit in nfl_subreddits:
                try:
                    print(f"Analyzing r/{subreddit} comprehensively...")
                    subreddit_posts = self._get_subreddit_data_comprehensive(subreddit, limit=100)
                    if subreddit_posts:
                        all_posts.extend(subreddit_posts)
                        picks_data['subreddits_analyzed'].append(subreddit)
                        picks_data['data_sources'].append({
                            'subreddit': subreddit,
                            'posts_found': len(subreddit_posts),
                            'total_comments': sum(len(post.get('comments', [])) for post in subreddit_posts)
                        })
                    
                    # Add delay between subreddits to avoid rate limiting
                    time.sleep(2)
                except Exception as e:
                    print(f"Error analyzing r/{subreddit}: {e}")
                    continue
            
            print(f"Total posts collected: {len(all_posts)}")
            
            # Analyze all collected posts
            if all_posts:
                picks_data = self._analyze_posts_for_picks(all_posts, query)
                picks_data['subreddits_analyzed'] = [src['subreddit'] for src in picks_data['data_sources']]
            
            return picks_data
            
        except Exception as e:
            print(f"Error getting comprehensive Reddit sentiment: {e}")
            return {
                'total_mentions': 0,
                'team_picks': {},
                'sentiment_score': 0.0,
                'confidence_level': 'low',
                'error': str(e),
                'posts_analyzed': 0,
                'subreddits_analyzed': [],
                'data_sources': []
            }
    
    def _get_subreddit_data(self, subreddit, limit=100, sort_types=['hot', 'new', 'top']):
        """Get comprehensive posts from a subreddit using multiple sorting methods"""
        all_posts = []
        
        for sort_type in sort_types:
            try:
                # Fetch posts with different sorting
                url = f"{self.base_url}/r/{subreddit}/{sort_type}.json?limit={limit}"
                if sort_type == 'top':
                    url += "&t=week"  # Top posts from this week
                
                response = requests.get(url, headers=self.headers, verify=False)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for post in data['data']['children']:
                        post_data = post['data']
                        
                        # Only add if not already in our list (avoid duplicates)
                        post_id = post_data.get('id', '')
                        if not any(p.get('id') == post_id for p in all_posts):
                            all_posts.append({
                                'id': post_id,
                                'title': post_data.get('title', ''),
                                'text': post_data.get('selftext', ''),
                                'score': post_data.get('score', 0),
                                'num_comments': post_data.get('num_comments', 0),
                                'created_utc': post_data.get('created_utc', 0),
                                'subreddit': subreddit,
                                'sort_type': sort_type,
                                'upvote_ratio': post_data.get('upvote_ratio', 0.5),
                                'author': post_data.get('author', 'unknown'),
                                'url': post_data.get('url', ''),
                                'permalink': post_data.get('permalink', '')
                            })
                
                # Add small delay to be respectful to Reddit's servers
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error fetching r/{subreddit} {sort_type}: {e}")
                continue
        
        print(f"Fetched {len(all_posts)} unique posts from r/{subreddit}")
        return all_posts
    
    def _get_subreddit_data_comprehensive(self, subreddit, limit=100):
        """Get comprehensive data from a subreddit including comments"""
        try:
            all_posts = []
            
            # Get posts from different sort types
            for sort_type in ['hot', 'new', 'top']:
                url = f"{self.base_url}/r/{subreddit}/{sort_type}.json?limit={limit}"
                response = requests.get(url, headers=self.headers, verify=False)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    for post in data['data']['children']:
                        post_data = post['data']
                        
                        # Get post details
                        post_info = {
                            'title': post_data.get('title', ''),
                            'text': post_data.get('selftext', ''),
                            'score': post_data.get('score', 0),
                            'num_comments': post_data.get('num_comments', 0),
                            'created_utc': post_data.get('created_utc', 0),
                            'subreddit': subreddit,
                            'sort_type': sort_type,
                            'post_id': post_data.get('id', ''),
                            'permalink': post_data.get('permalink', ''),
                            'comments': []
                        }
                        
                        # Get comments for posts with NFL content
                        if self._contains_nfl_content(post_info['title'] + ' ' + post_info['text']):
                            comments = self._get_post_comments(post_data.get('permalink', ''), limit=50)
                            post_info['comments'] = comments
                        
                        all_posts.append(post_info)
                        
                        # Add delay to avoid rate limiting
                        time.sleep(0.2)
                else:
                    print(f"Failed to fetch r/{subreddit}/{sort_type}: {response.status_code}")
                
                # Add delay between different sort types
                time.sleep(0.5)
            
            return all_posts
            
        except Exception as e:
            print(f"Error fetching comprehensive data from r/{subreddit}: {e}")
            return []
    
    def _get_post_comments(self, permalink, limit=50):
        """Get comments from a specific post"""
        try:
            url = f"{self.base_url}{permalink}.json?limit={limit}"
            response = requests.get(url, headers=self.headers, verify=False)
            
            if response.status_code == 200:
                data = response.json()
                comments = []
                
                # Parse comments (second element in response contains comments)
                if len(data) > 1 and 'data' in data[1]:
                    for comment in data[1]['data']['children']:
                        if comment['kind'] == 't1':  # Comment type
                            comment_data = comment['data']
                            comments.append({
                                'body': comment_data.get('body', ''),
                                'score': comment_data.get('score', 0),
                                'created_utc': comment_data.get('created_utc', 0),
                                'author': comment_data.get('author', '[deleted]')
                            })
                
                return comments
                
        except Exception as e:
            print(f"Error fetching comments from {permalink}: {e}")
            return []
    
    def _contains_nfl_content(self, text):
        """Check if text contains NFL-related content"""
        text_lower = text.lower()
        nfl_keywords = ['nfl', 'football', 'game', 'pick', 'bet', 'prediction', 'odds', 'spread']
        team_keywords = [team.lower() for team in self.nfl_teams]
        
        return any(keyword in text_lower for keyword in nfl_keywords + team_keywords)

    def _analyze_posts_for_picks(self, posts, query=""):
        """Analyze comprehensive posts to extract team picks and sentiment"""
        team_mentions = {}
        total_score = 0
        total_posts = 0
        confidence_indicators = []
        subreddit_breakdown = {}
        
        # Enhanced keywords for better pick detection
        pick_keywords = [
            'pick', 'picks', 'bet', 'betting', 'prediction', 'predictions',
            'favor', 'favors', 'win', 'wins', 'winning', 'lose', 'losing',
            'upset', 'lock', 'confident', 'sure thing', 'easy money',
            'hammer', 'smash', 'slam', 'take', 'back', 'fade', 'avoid',
            'under', 'over', 'spread', 'moneyline', 'ml', 'parlay',
            'teaser', 'prop', 'props', 'alternative', 'alt', 'line',
            'handicap', 'cover', 'ats', 'against the spread'
        ]
        
        # Enhanced confidence indicators
        confidence_words = {
            'high': ['lock', 'sure thing', 'easy money', 'confident', 'guarantee', 
                    'mortal lock', 'hammer', 'smash', 'slam', 'max bet', 'all in'],
            'medium': ['like', 'favor', 'think', 'believe', 'should', 'expect',
                      'probably', 'likely', 'good bet', 'solid', 'decent'],
            'low': ['maybe', 'might', 'could', 'possibly', 'lean', 'slight',
                   'toss up', 'coin flip', 'unsure', 'risky']
        }
        
        # Weight posts by their quality indicators
        for post in posts:
            text = f"{post['title']} {post['text']}".lower()
            subreddit = post.get('subreddit', 'unknown')
            
            # Track subreddit breakdown
            if subreddit not in subreddit_breakdown:
                subreddit_breakdown[subreddit] = {'posts': 0, 'relevant_posts': 0}
            subreddit_breakdown[subreddit]['posts'] += 1
            
            # Check if post is relevant to NFL picks
            has_pick_keywords = any(keyword in text for keyword in pick_keywords)
            if not has_pick_keywords:
                continue
            
            subreddit_breakdown[subreddit]['relevant_posts'] += 1
            total_posts += 1
            
            # Calculate post weight based on engagement and quality
            base_score = max(post.get('score', 0), 1)
            comment_bonus = post.get('num_comments', 0) * 0.1
            upvote_ratio = post.get('upvote_ratio', 0.5)
            
            # Bonus for high-engagement posts
            post_weight = base_score + comment_bonus
            if upvote_ratio > 0.8:
                post_weight *= 1.5
            
            total_score += post_weight
            
            # Find team mentions with enhanced detection
            for team in self.nfl_teams:
                team_patterns = [
                    team.lower(),
                    team.lower()[:3],  # 3-letter abbreviation
                    team.lower().replace(' ', '')  # Remove spaces
                ]
                
                team_found = False
                for pattern in team_patterns:
                    if pattern in text:
                        team_found = True
                        break
                
                if team_found:
                    if team not in team_mentions:
                        team_mentions[team] = {
                            'mentions': 0,
                            'total_score': 0,
                            'contexts': [],
                            'subreddit_sources': {},
                            'confidence_indicators': [],
                            'weighted_score': 0
                        }
                    
                    team_mentions[team]['mentions'] += 1
                    team_mentions[team]['total_score'] += base_score
                    team_mentions[team]['weighted_score'] += post_weight
                    
                    # Track subreddit sources
                    if subreddit not in team_mentions[team]['subreddit_sources']:
                        team_mentions[team]['subreddit_sources'][subreddit] = 0
                    team_mentions[team]['subreddit_sources'][subreddit] += 1
                    
                    # Extract enhanced context
                    context = self._extract_enhanced_context(text, team.lower(), post)
                    team_mentions[team]['contexts'].append(context)
            
            # Analyze confidence level with enhanced detection
            post_confidence = []
            for level, words in confidence_words.items():
                if any(word in text for word in words):
                    post_confidence.append(level)
                    confidence_indicators.append(level)
            
            # Store confidence for this post
            if post_confidence:
                for team in team_mentions:
                    if any(pattern in text for pattern in [team.lower(), team.lower()[:3]]):
                        team_mentions[team]['confidence_indicators'].extend(post_confidence)
        
        # Calculate enhanced metrics
        avg_score = total_score / total_posts if total_posts > 0 else 0
        sentiment_score = min(avg_score / 200, 1.0)  # Normalize to 0-1
        
        # Determine overall confidence level
        if confidence_indicators:
            high_conf = confidence_indicators.count('high')
            medium_conf = confidence_indicators.count('medium')
            low_conf = confidence_indicators.count('low')
            
            total_conf = high_conf + medium_conf + low_conf
            if total_conf > 0:
                high_ratio = high_conf / total_conf
                if high_ratio > 0.4:
                    confidence_level = 'high'
                elif high_ratio > 0.2 or medium_conf / total_conf > 0.5:
                    confidence_level = 'medium'
                else:
                    confidence_level = 'low'
            else:
                confidence_level = 'low'
        else:
            confidence_level = 'low'
        
        # Calculate enhanced popularity scores
        for team in team_mentions:
            mentions = team_mentions[team]['mentions']
            weighted_score = team_mentions[team]['weighted_score']
            
            # Enhanced popularity calculation
            base_popularity = mentions * (weighted_score / mentions if mentions > 0 else 0)
            
            # Bonus for diverse subreddit coverage
            subreddit_diversity = len(team_mentions[team]['subreddit_sources'])
            diversity_bonus = min(subreddit_diversity * 0.2, 1.0)
            
            # Confidence bonus
            team_confidence = team_mentions[team]['confidence_indicators']
            conf_bonus = team_confidence.count('high') * 0.3 + team_confidence.count('medium') * 0.1
            
            team_mentions[team]['popularity'] = base_popularity * (1 + diversity_bonus + conf_bonus)
        
        return {
            'total_mentions': sum(data['mentions'] for data in team_mentions.values()),
            'team_picks': team_mentions,
            'sentiment_score': sentiment_score,
            'confidence_level': confidence_level,
            'posts_analyzed': total_posts,
            'subreddit_breakdown': subreddit_breakdown,
            'data_sources': [{'subreddit': k, 'posts_found': v['posts'], 'relevant_posts': v['relevant_posts']} 
                           for k, v in subreddit_breakdown.items()],
            'analysis_depth': 'comprehensive'
        }
    
    def _extract_enhanced_context(self, text, team, post):
        """Extract enhanced context around team mention with post metadata"""
        # Find the team in text and get surrounding words
        pattern = rf'\b\w*{re.escape(team)}\w*\b'
        match = re.search(pattern, text)
        
        context_data = {
            'text_snippet': '',
            'post_score': post.get('score', 0),
            'post_comments': post.get('num_comments', 0),
            'subreddit': post.get('subreddit', 'unknown'),
            'upvote_ratio': post.get('upvote_ratio', 0.5)
        }
        
        if match:
            start = max(0, match.start() - 75)
            end = min(len(text), match.end() + 75)
            context_data['text_snippet'] = text[start:end].strip()
        
        return context_data
    
    def _extract_context(self, text, team):
        """Extract context around team mention (legacy method for compatibility)"""
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
    
    def auto_populate_comprehensive_picks(self):
        """Auto-populate comprehensive NFL picks from all available sources"""
        print("🚀 Starting comprehensive Reddit analysis...")
        
        try:
            # Get comprehensive sentiment data
            comprehensive_data = self.get_nfl_sentiment()
            
            # Get current week games for detailed analysis
            from app.models.game import Game
            current_games = Game.query.filter_by(week=1, season=2025).all()
            
            game_specific_picks = []
            
            for game in current_games:
                print(f"📊 Analyzing {game.away_team} @ {game.home_team}...")
                
                # Get specific picks for this matchup
                game_picks = self.get_team_reddit_picks(
                    game.home_team.split()[-1], 
                    game.away_team.split()[-1]
                )
                
                game_specific_picks.append({
                    'game_id': game.id,
                    'home_team': game.home_team,
                    'away_team': game.away_team,
                    'game_date': game.game_date.isoformat(),
                    'picks': game_picks
                })
            
            result = {
                'comprehensive_analysis': comprehensive_data,
                'game_specific_picks': game_specific_picks,
                'auto_populated': True,
                'timestamp': datetime.now().isoformat(),
                'analysis_summary': {
                    'total_posts_analyzed': comprehensive_data.get('posts_analyzed', 0),
                    'subreddits_covered': len(comprehensive_data.get('subreddits_analyzed', [])),
                    'team_mentions_found': comprehensive_data.get('total_mentions', 0),
                    'confidence_level': comprehensive_data.get('confidence_level', 'unknown'),
                    'games_analyzed': len(game_specific_picks)
                }
            }
            
            print(f"✅ Analysis complete! {result['analysis_summary']['total_posts_analyzed']} posts analyzed")
            return result
            
        except Exception as e:
            print(f"❌ Error in auto-populate: {e}")
            return {
                'error': str(e),
                'auto_populated': False,
                'comprehensive_analysis': {},
                'game_specific_picks': []
            }
    
    def _background_comprehensive_analysis(self):
        """Background function to run comprehensive analysis every hour"""
        try:
            print(f"Starting background Reddit analysis at {datetime.now()}")
            
            # Run comprehensive analysis
            comprehensive_data = self.get_comprehensive_nfl_sentiment()
            
            # Update cache
            self.comprehensive_data = {
                'last_updated': datetime.now().isoformat(),
                'comprehensive_analysis': comprehensive_data,
                'total_posts_analyzed': comprehensive_data.get('posts_analyzed', 0),
                'total_comments_analyzed': sum(
                    len(post.get('comments', [])) 
                    for post in comprehensive_data.get('raw_posts', [])
                )
            }
            
            # Save to cache
            self._save_cache()
            
            print(f"Background analysis completed. Posts: {self.comprehensive_data['total_posts_analyzed']}, Comments: {self.comprehensive_data['total_comments_analyzed']}")
            
        except Exception as e:
            print(f"Error in background analysis: {e}")

    def get_cached_comprehensive_data(self):
        """Get the most recent cached comprehensive data"""
        return self.comprehensive_data

    def force_comprehensive_update(self):
        """Force an immediate comprehensive update (not in background)"""
        print("Starting forced comprehensive Reddit update...")
        self._background_comprehensive_analysis()
        return self.comprehensive_data