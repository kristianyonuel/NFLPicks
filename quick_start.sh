#!/bin/bash
# One-line fix for the ModuleNotFoundError

echo "🔧 Quick Fix: Activating virtual environment and running app..."

# Check if virtual environment exists
if [ -d "nflpicks_env" ]; then
    echo "✅ Found virtual environment, activating..."
    source nflpicks_env/bin/activate
    echo "🚀 Starting app..."
    python app.py --host 0.0.0.0 --port 5000
else
    echo "❌ Virtual environment not found!"
    echo "📦 Creating new environment and installing packages..."
    python3 -m venv nflpicks_env
    source nflpicks_env/bin/activate
    pip install --upgrade pip
    pip install Flask Flask-SQLAlchemy requests beautifulsoup4 python-dotenv vaderSentiment schedule
    echo "🗄️ Setting up database..."
    python recreate_db.py
    echo "🚀 Starting app..."
    python app.py --host 0.0.0.0 --port 5000
fi
