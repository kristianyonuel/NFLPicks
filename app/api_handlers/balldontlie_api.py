import requests
from config import Config
from datetime import datetime, timedelta
import json
import urllib3

# Disable SSL warnings for development
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class BallDontLieAPI:
    def __init__(self):
        self.api_key = Config.BALLDONTLIE_API_KEY
        self.base_url = Config.BALLDONTLIE_BASE_URL
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        # NFL team mapping for BallDontLie (they might use different naming)
        self.nfl_teams_mapping = {
            'Kansas City Chiefs': 'KC',
            'Baltimore Ravens': 'BAL',
            'Buffalo Bills': 'BUF',
            'Miami Dolphins': 'MIA',
            'New England Patriots': 'NE',
            'New York Jets': 'NYJ',
            'Cincinnati Bengals': 'CIN',
            'Pittsburgh Steelers': 'PIT',
            'Cleveland Browns': 'CLE',
            'Tennessee Titans': 'TEN',
            'Indianapolis Colts': 'IND',
            'Houston Texans': 'HOU',
            'Jacksonville Jaguars': 'JAX',
            'Denver Broncos': 'DEN',
            'Los Angeles Chargers': 'LAC',
            'Las Vegas Raiders': 'LV',
            'Dallas Cowboys': 'DAL',
            'Philadelphia Eagles': 'PHI',
            'New York Giants': 'NYG',
            'Washington Commanders': 'WAS',
            'Green Bay Packers': 'GB',
            'Chicago Bears': 'CHI',
            'Detroit Lions': 'DET',
            'Minnesota Vikings': 'MIN',
            'New Orleans Saints': 'NO',
            'Atlanta Falcons': 'ATL',
            'Carolina Panthers': 'CAR',
            'Tampa Bay Buccaneers': 'TB',
            'Arizona Cardinals': 'ARI',
            'San Francisco 49ers': 'SF',
            'Seattle Seahawks': 'SEA',
            'Los Angeles Rams': 'LAR'
        }
    
    def get_nfl_teams(self):
        """Get all NFL teams from BallDontLie API"""
        try:
            # Note: BallDontLie primarily focuses on NBA, but we'll try their teams endpoint
            url = f"{self.base_url}/teams"
            response = requests.get(url, headers=self.headers, verify=False)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"BallDontLie teams API returned {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error fetching teams from BallDontLie: {e}")
            return None
    
    def get_team_stats(self, team_abbreviation, season=2025):
        """Get team statistics from BallDontLie API"""
        try:
            # This endpoint might not exist for NFL, but we'll structure it properly
            url = f"{self.base_url}/stats/teams/{team_abbreviation}"
            params = {
                'season': season,
                'league': 'nfl'  # Assuming they support league parameter
            }
            
            response = requests.get(url, headers=self.headers, params=params, verify=False)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"BallDontLie team stats API returned {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error fetching team stats from BallDontLie: {e}")
            return None
    
    def get_games_data(self, date=None):
        """Get games data from BallDontLie API"""
        try:
            url = f"{self.base_url}/games"
            params = {}
            
            if date:
                # Format date for API (YYYY-MM-DD)
                if isinstance(date, datetime):
                    params['date'] = date.strftime('%Y-%m-%d')
                else:
                    params['date'] = date
            
            response = requests.get(url, headers=self.headers, params=params, verify=False)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"BallDontLie games API returned {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error fetching games from BallDontLie: {e}")
            return None
    
    def get_player_stats(self, player_name):
        """Get player statistics from BallDontLie API"""
        try:
            # Search for player first
            url = f"{self.base_url}/players"
            params = {
                'search': player_name
            }
            
            response = requests.get(url, headers=self.headers, params=params, verify=False)
            
            if response.status_code == 200:
                players_data = response.json()
                
                if players_data.get('data') and len(players_data['data']) > 0:
                    player_id = players_data['data'][0]['id']
                    
                    # Get player stats
                    stats_url = f"{self.base_url}/season_averages"
                    stats_params = {
                        'player_ids[]': player_id,
                        'season': 2025
                    }
                    
                    stats_response = requests.get(stats_url, headers=self.headers, params=stats_params, verify=False)
                    
                    if stats_response.status_code == 200:
                        return stats_response.json()
                    
            return None
                
        except Exception as e:
            print(f"Error fetching player stats from BallDontLie: {e}")
            return None
    
    def get_enhanced_team_data(self, team_name):
        """Get enhanced team data using BallDontLie API"""
        try:
            team_abbr = self.nfl_teams_mapping.get(team_name)
            if not team_abbr:
                return None
            
            # Get basic team stats
            team_stats = self.get_team_stats(team_abbr)
            
            # Get recent games
            recent_games = self.get_games_data()
            
            # Process and return enhanced data
            enhanced_data = {
                'team_name': team_name,
                'abbreviation': team_abbr,
                'stats': team_stats,
                'recent_games': recent_games,
                'api_source': 'balldontlie',
                'last_updated': datetime.now().isoformat()
            }
            
            return enhanced_data
            
        except Exception as e:
            print(f"Error getting enhanced team data: {e}")
            return None
    
    def test_api_connection(self):
        """Test if the BallDontLie API is working with our key"""
        try:
            url = f"{self.base_url}/teams"
            response = requests.get(url, headers=self.headers, verify=False)
            
            return {
                'status_code': response.status_code,
                'success': response.status_code == 200,
                'response_size': len(response.text) if response.text else 0,
                'api_key_valid': response.status_code != 401,
                'error': None if response.status_code == 200 else f"HTTP {response.status_code}"
            }
            
        except Exception as e:
            return {
                'status_code': None,
                'success': False,
                'response_size': 0,
                'api_key_valid': False,
                'error': str(e)
            }
