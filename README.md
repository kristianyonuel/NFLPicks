# NFLPicks

A Flask-based web application for NFL game predictions using machine learning, Reddit sentiment analysis, and multiple sports APIs.

## Features

- **NFL Game Predictions**: Uses machine learning algorithms to predict NFL game outcomes
- **Reddit Sentiment Analysis**: Analyzes NFL-related posts from r/nfl and r/NFLbets for crowd wisdom
- **Multiple API Integration**: 
  - ESPN API for game data and scores
  - Reddit API for sentiment analysis
  - BallDontLie API for enhanced sports statistics
- **Interactive Dashboard**: Real-time dashboard showing predictions, Reddit picks, and game analysis
- **Historical Analysis**: Tracks prediction accuracy and performance over time

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/NFLPicks.git
   cd NFLPicks
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   # source .venv/bin/activate  # On macOS/Linux
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up the database:
   ```bash
   python recreate_db.py
   ```

5. Run the application:
   ```bash
   python app.py
   ```

6. Open your browser and navigate to `http://127.0.0.1:5000`

## API Configuration

The application uses several APIs for data collection:

- **ESPN API**: Public API, no key required
- **Reddit API**: Uses public JSON endpoints, no authentication required
- **BallDontLie API**: Requires API key (configured in config.py)

## Project Structure

```
NFLPicks/
├── app/
│   ├── analysis/
│   │   └── predictor.py          # ML prediction logic
│   ├── api_handlers/
│   │   ├── espn_api.py          # ESPN API integration
│   │   ├── reddit_api.py        # Reddit sentiment analysis
│   │   └── balldontlie_api.py   # BallDontLie API integration
│   ├── main/
│   │   ├── __init__.py
│   │   └── routes.py            # Flask routes
│   ├── models/
│   │   ├── game.py              # Game data model
│   │   └── prediction.py       # Prediction data model
│   ├── static/
│   │   ├── css/
│   │   │   └── main.css         # Styling
│   │   └── js/
│   │       └── interactive.js   # Frontend JavaScript
│   ├── templates/
│   │   ├── base.html
│   │   └── dashboard.html       # Main dashboard
│   └── __init__.py
├── config.py                    # Application configuration
├── app.py                       # Flask application entry point
├── requirements.txt             # Python dependencies
├── recreate_db.py              # Database setup script
└── README.md
```

## API Endpoints

- `/` - Main dashboard
- `/api/reddit-picks` - Get Reddit sentiment and picks
- `/api/reddit-analysis/<game_id>` - Get Reddit analysis for specific game
- `/api/refresh_scores` - Update game scores from ESPN
- `/api/balldontlie-test` - Test BallDontLie API connection
- `/weekly_picks` - Get predictions for current week
- `/analysis` - Get prediction accuracy statistics

## Features

### Machine Learning Predictions
- Uses Random Forest algorithm with historical NFL data
- Factors include team statistics, recent performance, and sentiment analysis
- Continuously improves with new game data

### Reddit Sentiment Analysis
- Analyzes posts from r/nfl and r/NFLbets
- Extracts team mentions and confidence indicators
- Provides crowd-sourced predictions and sentiment scores

### Interactive Dashboard
- Real-time game predictions and odds
- Reddit picks and sentiment analysis
- Historical accuracy tracking
- Responsive design for mobile and desktop

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is for educational and entertainment purposes only. Sports betting can be addictive and risky. Please gamble responsibly and within your means.
