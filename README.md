# NFLPicks 🏈

A comprehensive Flask-based web application for NFL game predictions using machine learning, Reddit sentiment analysis, and multiple sports APIs.

## 🚀 Quick Start

**Choose your preferred setup method:**

### Option 1: Universal Launcher (Recommended)
```bash
git clone https://github.com/kristianyonuel/NFLPicks.git
cd NFLPicks
python launch.py
```

### Option 2: Cross-Platform Python Script
```bash
python setup_and_run.py --port 5000 --host 0.0.0.0
```

### Option 3: Platform-Specific Scripts
```bash
# Linux/macOS
./setup_and_run.sh

# Windows
setup_and_run.bat
```

**📖 For detailed setup instructions, see: [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)**

## ✨ Features

- **🤖 NFL Game Predictions**: Machine learning algorithms predict game outcomes
- **📱 Reddit Sentiment Analysis**: Analyzes 100+ posts/comments per hour from r/nfl and r/NFLbets
- **🔌 Multiple API Integration**: 
  - ESPN API for live game data and scores
  - Reddit API for sentiment analysis (public endpoints)
  - BallDontLie API for enhanced sports statistics
- **📊 Interactive Dashboard**: Real-time dashboard with predictions and analysis
- **📈 Historical Tracking**: Prediction accuracy and performance analytics
- **⚡ Background Processing**: Automated data collection and analysis
- **🛡️ Production Ready**: Virtual environment isolation and robust error handling

## 🛠️ Manual Installation (If Automated Scripts Fail)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kristianyonuel/NFLPicks.git
   cd NFLPicks
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv nflpicks_env
   
   # Activate (Windows)
   nflpicks_env\Scripts\activate
   
   # Activate (Linux/macOS)
   source nflpicks_env/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Initialize database:**
   ```bash
   python recreate_db.py
   ```

5. **Run application:**
   ```bash
   python app.py --host 0.0.0.0 --port 5000
   ```

6. **Access the application:**
   Open `http://localhost:5000` in your browser

## 🔧 Configuration

### API Keys
Edit `config.py` to add your API keys:
```python
BALLDONTLIE_API_KEY = 'your_api_key_here'
```

### Command Line Options
```bash
python app.py --help
```

Available options:
- `--port PORT`: Port number (default: 5000)
- `--host HOST`: Host address (default: 0.0.0.0)  
- `--debug`: Enable debug mode

## 📁 Project Structure

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
│   │   └── routes.py            # Flask routes and endpoints
│   ├── models/
│   │   ├── game.py              # Game data model
│   │   └── prediction.py       # Prediction data model
│   ├── static/
│   │   ├── css/main.css         # Modern responsive styling
│   │   └── js/interactive.js    # Interactive dashboard features
│   ├── templates/
│   │   ├── base.html            # Base template
│   │   └── dashboard.html       # Main dashboard interface
│   └── __init__.py              # Flask app factory
├── setup_and_run.py             # Cross-platform setup script
├── setup_and_run.sh             # Linux/macOS setup script  
├── setup_and_run.bat            # Windows setup script
├── launch.py                    # Universal launcher
├── config.py                    # Application configuration
├── app.py                       # Flask application entry point
├── requirements.txt             # Python dependencies
├── recreate_db.py              # Database initialization
├── COMPLETE_SETUP_GUIDE.md     # Comprehensive setup guide
└── README.md                   # This file
```

## 🌐 API Endpoints

Once running, access these endpoints:

- **Main Dashboard**: `http://localhost:5000/`
- **API Status**: `http://localhost:5000/api/status`
- **Reddit Analysis**: `http://localhost:5000/api/reddit/analysis`
- **Reddit Picks**: `http://localhost:5000/api/reddit-picks`
- **Game Predictions**: `http://localhost:5000/api/predictions`
- **Refresh Scores**: `http://localhost:5000/api/refresh_scores`
- **Weekly Picks**: `http://localhost:5000/weekly_picks`
- **Analysis Stats**: `http://localhost:5000/analysis`

## 🚀 Deployment

### Production Deployment
See [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) for:
- Remote server setup
- Security configuration  
- Process management
- Monitoring and logging

### Development Mode
```bash
python app.py --debug --host 127.0.0.1 --port 5000
```

## 🔍 Troubleshooting

**Common Issues:**

1. **Port in use**: Use `--port 8080` or kill existing process
2. **Module not found**: Ensure virtual environment is activated
3. **Database errors**: Run `python recreate_db.py`
4. **Permission denied**: Make scripts executable with `chmod +x`

**For detailed troubleshooting, see: [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)**

## 📊 Background Processing

The application runs several background processes for data collection and analysis:

### 🤖 Machine Learning Predictions
- Uses Random Forest algorithm with historical NFL data
- Factors include team statistics, recent performance, and sentiment analysis
- Continuously improves accuracy with new game data
- Provides confidence scores for each prediction

### 📱 Reddit Sentiment Analysis
- Analyzes 100+ posts/comments per hour from r/nfl and r/NFLbets
- Extracts team mentions and confidence indicators
- Provides crowd-sourced predictions and sentiment scores
- Caches results for improved performance

### 📊 Data Processing
- Automatic ESPN API updates for live scores
- Background Reddit sentiment processing
- Database optimization and cleanup
- Performance monitoring and analytics

## 🏆 Interactive Dashboard Features

- **Real-time Predictions**: Live ML predictions with confidence scores
- **Reddit Community Picks**: Crowd-sourced predictions from Reddit
- **Sentiment Analysis**: Team sentiment tracking from social media
- **Historical Accuracy**: Track prediction performance over time
- **Responsive Design**: Optimized for mobile and desktop

## 🔄 Updates and Maintenance

To update the application:
```bash
cd NFLPicks
git pull origin main
source nflpicks_env/bin/activate  # or nflpicks_env\Scripts\activate on Windows
pip install -r requirements.txt
python recreate_db.py  # Only if database schema changed
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This application is for educational and entertainment purposes only. Sports betting involves risk and should be done responsibly. This tool does not guarantee prediction accuracy and should not be used as the sole basis for any financial decisions.

## 🙏 Acknowledgments

- ESPN API for comprehensive NFL data
- Reddit community for sentiment data
- BallDontLie API for additional statistics
- Flask and Python ecosystem for robust web framework

---

**🚀 Ready to start? Run `python launch.py` and visit http://localhost:5000**
