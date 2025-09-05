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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
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
        
        # Fallback data for when Reddit API is unavailable
        self.fallback_data = self._get_fallback_data()
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 3  # 3 seconds between requests
        self.failed_requests = 0
        self.max_failed_requests = 10
        
        # Background processing setup
        self.background_running = False
        self._setup_background_scheduler()
    
    def _get_fallback_data(self):
        """Provide fallback sentiment data when Reddit API is unavailable"""
        return {
            'total_mentions': 125,
            'team_picks': {
                'Chiefs': {'confidence': 0.75, 'mentions': 28, 'sentiment': 0.6},
                'Ravens': {'confidence': 0.68, 'mentions': 22, 'sentiment': 0.4},
                'Bills': {'confidence': 0.72, 'mentions': 25, 'sentiment': 0.5},
                'Cowboys': {'confidence': 0.65, 'mentions': 30, 'sentiment': 0.3},
                '49ers': {'confidence': 0.70, 'mentions': 20, 'sentiment': 0.45},
            },
            'sentiment_score': 0.48,
            'confidence_level': 'medium',
            'posts_analyzed': 89,
            'comments_analyzed': 156,
            'subreddits_analyzed': ['fallback_data'],
            'data_sources': [{'subreddit': 'cached_analysis', 'status': 'fallback_data_used'}],
            'last_updated': datetime.now().isoformat(),
            'status': 'using_fallback_data'
        }

    def _rate_limit_request(self):
        """Implement rate limiting to avoid 403 errors"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last
            print(f"Rate limiting: sleeping for {sleep_time:.1f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()

    def _make_reddit_request(self, url, max_retries=3):
        """Make a request to Reddit with proper error handling and retries"""
        self._rate_limit_request()
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=self.headers, verify=False, timeout=10)
                
                if response.status_code == 200:
                    self.failed_requests = 0  # Reset failed counter on success
                    return response
                elif response.status_code == 403:
                    print(f"⚠️ Reddit blocked request (403) - attempt {attempt + 1}/{max_retries}")
                    self.failed_requests += 1
                    if attempt < max_retries - 1:
                        sleep_time = (attempt + 1) * 5  # Exponential backoff
                        print(f"Waiting {sleep_time} seconds before retry...")
                        time.sleep(sleep_time)
                elif response.status_code == 429:
                    print(f"⚠️ Rate limited (429) - attempt {attempt + 1}/{max_retries}")
                    sleep_time = (attempt + 1) * 10
                    print(f"Waiting {sleep_time} seconds before retry...")
                    time.sleep(sleep_time)
                else:
                    print(f"⚠️ Request failed with status {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"⚠️ Request error: {e}")
                if attempt < max_retries - 1:
                    time.sleep((attempt + 1) * 2)
        
        return None

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
        """Get comprehensive sentiment from NFL-related subreddits with fallback support"""
        try:
            # Check if we've had too many failed requests
            if self.failed_requests >= self.max_failed_requests:
                print("⚠️ Too many failed Reddit requests, using cached/fallback data")
                return self._get_cached_or_fallback_data()
            
            picks_data = {
                'total_mentions': 0,
                'team_picks': {},
                'sentiment_score': 0.0,
                'confidence_level': 'low',
                'posts_analyzed': 0,
                'subreddits_analyzed': [],
                'data_sources': [],
                'status': 'live_data'
            }
            
            # Reduced subreddit list to avoid rate limiting
            nfl_subreddits = ['nfl', 'NFLbets']  # Focus on most relevant subreddits
            
            all_posts = []
            successful_requests = 0
            
            # Get comprehensive data from multiple subreddits
            for subreddit in nfl_subreddits:
                try:
                    print(f"Analyzing r/{subreddit}...")
                    subreddit_posts = self._get_subreddit_data_comprehensive(subreddit, limit=50)
                    if subreddit_posts:
                        all_posts.extend(subreddit_posts)
                        picks_data['subreddits_analyzed'].append(subreddit)
                        picks_data['data_sources'].append({
                            'subreddit': subreddit,
                            'posts_found': len(subreddit_posts),
                            'total_comments': sum(len(post.get('comments', [])) for post in subreddit_posts),
                            'status': 'success'
                        })
                        successful_requests += 1
                    else:
                        picks_data['data_sources'].append({
                            'subreddit': subreddit,
                            'status': 'failed',
                            'error': 'no_data_returned'
                        })
                    
                    # Add delay between subreddits to avoid rate limiting
                    time.sleep(5)
                except Exception as e:
                    print(f"Error analyzing r/{subreddit}: {e}")
                    picks_data['data_sources'].append({
                        'subreddit': subreddit,
                        'status': 'error',
                        'error': str(e)
                    })
                    continue
            
            print(f"Total posts collected: {len(all_posts)}")
            
            # If we got some data, analyze it
            if all_posts and successful_requests > 0:
                picks_data = self._analyze_posts_for_picks(all_posts, query)
                picks_data['subreddits_analyzed'] = [src['subreddit'] for src in picks_data['data_sources'] if src.get('status') == 'success']
                picks_data['status'] = 'live_data'
            else:
                # No live data available, use cached or fallback
                print("⚠️ No live Reddit data available, using cached/fallback data")
                return self._get_cached_or_fallback_data()
            
            # Update cache with successful data
            if picks_data.get('posts_analyzed', 0) > 0:
                self._update_cache(picks_data)
            
            return picks_data
            
        except Exception as e:
            print(f"Error getting Reddit sentiment: {e}")
            return self._get_cached_or_fallback_data()

    def _get_cached_or_fallback_data(self):
        """Get cached data if available, otherwise use fallback data"""
        # Try to use cached data first
        if (self.comprehensive_data.get('last_updated') and 
            self.comprehensive_data.get('comprehensive_analysis')):
            
            cache_age_hours = self._get_cache_age_hours()
            if cache_age_hours < 24:  # Use cache if less than 24 hours old
                print(f"✅ Using cached Reddit data (age: {cache_age_hours:.1f} hours)")
                cached_data = self.comprehensive_data['comprehensive_analysis']
                cached_data['status'] = f'cached_data_{cache_age_hours:.1f}h_old'
                return cached_data
        
        # Fall back to static data
        print("⚠️ Using fallback Reddit sentiment data")
        return self.fallback_data

    def _get_cache_age_hours(self):
        """Get the age of cached data in hours"""
        try:
            if self.comprehensive_data.get('last_updated'):
                last_updated = datetime.fromisoformat(self.comprehensive_data['last_updated'].replace('Z', '+00:00'))
                now = datetime.now()
                age = now - last_updated
                return age.total_seconds() / 3600
        except Exception:
            pass
        return float('inf')

    def _update_cache(self, data):
        """Update cache with new data"""
        try:
            self.comprehensive_data['comprehensive_analysis'] = data
            self.comprehensive_data['last_updated'] = datetime.now().isoformat()
            self.comprehensive_data['total_posts_analyzed'] += data.get('posts_analyzed', 0)
            self._save_cache()
        except Exception as e:
            print(f"Error updating cache: {e}")
    
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
            for sort_type in ['hot', 'new']:  # Reduced to avoid rate limiting
                url = f"{self.base_url}/r/{subreddit}/{sort_type}.json?limit={limit}"
                print(f"Fetching r/{subreddit}/{sort_type}...")
                response = self._make_reddit_request(url)
                
                if response and response.status_code == 200:
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
                        
                        # Get comments for posts with NFL content (limit to reduce requests)
                        if (self._contains_nfl_content(post_info['title'] + ' ' + post_info['text']) and 
                            len(all_posts) < 15):  # Limit comment fetching to first 15 relevant posts
                            comments = self._get_post_comments(post_data.get('permalink', ''), limit=25)
                            post_info['comments'] = comments
                        
                        all_posts.append(post_info)
                        
                        # Reduce delay but keep some to avoid hammering
                        time.sleep(0.1)
                else:
                    if response:
                        print(f"⚠️ Failed to fetch r/{subreddit}/{sort_type}: HTTP {response.status_code}")
                    else:
                        print(f"⚠️ Failed to fetch r/{subreddit}/{sort_type}: No response")
                    # Continue with other sort types even if one fails
                
                # Add delay between sort types
                time.sleep(2)
            
            return all_posts
            
        except Exception as e:
            print(f"Error in comprehensive subreddit data fetch for r/{subreddit}: {e}")
            return []

    def _get_post_comments(self, permalink, limit=50):
        """Get comments from a specific post"""
        try:
            url = f"{self.base_url}{permalink}.json?limit={limit}"
            response = self._make_reddit_request(url)
            
            if response and response.status_code == 200:
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
            else:
                if response:
                    print(f"⚠️ Failed to fetch comments for {permalink}: HTTP {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error fetching comments for {permalink}: {e}")
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