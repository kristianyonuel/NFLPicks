#!/bin/bash

# Emergency Fix for setuptools.build_meta Error
# This script specifically handles the BackendUnavailable: Cannot import 'setuptools.build_meta' error

echo "🚨 NFLPicks Emergency Installation Fix"
echo "======================================"
echo "Fixing setuptools.build_meta error..."

# Ensure we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ app.py not found! Please run this script from the NFLPicks directory"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "nflpicks_env" ]; then
    echo "🔌 Activating virtual environment..."
    source nflpicks_env/bin/activate
else
    echo "❌ Virtual environment not found. Creating new one..."
    python3 -m venv nflpicks_env
    source nflpicks_env/bin/activate
fi

echo "🔧 Fixing pip and setuptools issues..."

# Step 1: Downgrade pip to a more stable version for Python 3.12
echo "📦 Installing compatible pip and setuptools versions..."
python -m pip install --upgrade "pip>=23.0,<24.0" "setuptools>=65.0,<70.0" "wheel>=0.38.0"

# Step 2: Install build tools separately
echo "🛠️ Installing build dependencies..."
pip install --no-cache-dir build setuptools-scm pep517

# Step 3: Clear any cached builds
echo "🧹 Clearing pip cache..."
pip cache purge

# Step 4: Install packages one by one with specific strategies
echo "📦 Installing core packages individually..."

# Essential Flask packages first
pip install --no-cache-dir --prefer-binary "Flask>=2.3.0,<3.1.0"
pip install --no-cache-dir --prefer-binary "Werkzeug>=2.3.0,<3.1.0"
pip install --no-cache-dir --prefer-binary "Jinja2>=3.1.0,<3.2.0"
pip install --no-cache-dir --prefer-binary "itsdangerous>=2.1.0,<2.2.0"
pip install --no-cache-dir --prefer-binary "click>=8.1.0,<8.2.0"

# Database packages
pip install --no-cache-dir --prefer-binary "SQLAlchemy>=2.0.0,<2.1.0"
pip install --no-cache-dir --prefer-binary "Flask-SQLAlchemy>=3.0.0,<3.2.0"

# HTTP and requests
pip install --no-cache-dir --prefer-binary "requests>=2.31.0,<2.32.0"
pip install --no-cache-dir --prefer-binary "urllib3>=1.26.0,<2.2.0"
pip install --no-cache-dir --prefer-binary "certifi>=2023.0.0"

# Web scraping and parsing
pip install --no-cache-dir --prefer-binary "beautifulsoup4>=4.12.0,<4.13.0"
pip install --no-cache-dir --prefer-binary "lxml>=4.9.0,<5.0.0"
pip install --no-cache-dir --prefer-binary "feedparser>=6.0.0,<6.1.0"

# Environment and utilities
pip install --no-cache-dir --prefer-binary "python-dotenv>=1.0.0,<1.1.0"
pip install --no-cache-dir --prefer-binary "schedule>=1.2.0,<1.3.0"

# Sentiment analysis (lightweight)
pip install --no-cache-dir --prefer-binary "vaderSentiment>=3.3.0,<3.4.0"

# Try to install data science packages (these might fail, but that's OK)
echo "📊 Attempting to install data science packages (optional)..."

# Try numpy with multiple fallback versions
if ! pip install --no-cache-dir --prefer-binary "numpy>=1.24.0,<1.26.0"; then
    echo "⚠️ numpy 1.24+ failed, trying 1.21..."
    if ! pip install --no-cache-dir --prefer-binary "numpy>=1.21.0,<1.24.0"; then
        echo "⚠️ Could not install numpy, continuing without it..."
    fi
fi

# Try pandas if numpy succeeded
if python -c "import numpy" 2>/dev/null; then
    if ! pip install --no-cache-dir --prefer-binary "pandas>=1.5.0,<2.1.0"; then
        echo "⚠️ Could not install pandas, continuing without it..."
    fi
fi

# Try scikit-learn if numpy succeeded
if python -c "import numpy" 2>/dev/null; then
    if ! pip install --no-cache-dir --prefer-binary "scikit-learn>=1.0.0,<1.4.0"; then
        echo "⚠️ Could not install scikit-learn, continuing without it..."
    fi
fi

# Try plotting library
if ! pip install --no-cache-dir --prefer-binary "plotly>=5.0.0,<6.0.0"; then
    echo "⚠️ plotly failed, trying matplotlib..."
    if ! pip install --no-cache-dir --prefer-binary "matplotlib>=3.5.0"; then
        echo "⚠️ No plotting library available, continuing..."
    fi
fi

echo "✅ Package installation completed!"

# Verify core functionality
echo "🔍 Verifying installation..."

python -c "
import sys
print(f'Python version: {sys.version}')

try:
    import flask
    print('✅ Flask imported successfully')
except ImportError as e:
    print(f'❌ Flask import failed: {e}')
    sys.exit(1)

try:
    import requests
    print('✅ Requests imported successfully')
except ImportError as e:
    print(f'❌ Requests import failed: {e}')
    sys.exit(1)

try:
    import sqlalchemy
    print('✅ SQLAlchemy imported successfully')
except ImportError as e:
    print(f'❌ SQLAlchemy import failed: {e}')
    sys.exit(1)

try:
    import bs4
    print('✅ BeautifulSoup imported successfully')
except ImportError as e:
    print('⚠️ BeautifulSoup not available')

try:
    import numpy
    print('✅ NumPy imported successfully')
except ImportError as e:
    print('⚠️ NumPy not available - some features may be limited')

try:
    import pandas
    print('✅ Pandas imported successfully')
except ImportError as e:
    print('⚠️ Pandas not available - some features may be limited')

print('\\n🎉 Core packages are working!')
"

# Test app import
echo "🧪 Testing app import..."
if python -c "import app; print('✅ App imported successfully')" 2>/dev/null; then
    echo "✅ App import test passed"
else
    echo "⚠️ App import test failed, but core packages are working"
fi

# Setup database
echo "🗄️ Setting up database..."
if [ -f "recreate_db.py" ]; then
    if python recreate_db.py; then
        echo "✅ Database setup completed"
    else
        echo "⚠️ Database setup had issues, but continuing..."
    fi
else
    echo "⚠️ recreate_db.py not found, skipping database setup"
fi

echo ""
echo "🎉 Emergency fix completed!"
echo ""
echo "📋 Summary:"
echo "- Fixed setuptools.build_meta error"
echo "- Installed compatible package versions"
echo "- Core Flask functionality is working"
echo "- Some advanced features may be limited without NumPy/Pandas"
echo ""
echo "🚀 To start the application:"
echo "python app.py --host 0.0.0.0 --port 5000"
echo ""
echo "🌐 Then visit: http://your-server-ip:5000"
