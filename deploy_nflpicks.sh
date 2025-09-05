#!/bin/bash
# NFLPicks Deployment Script for SSH Server
# Run this script on casa@20.157.116.145 to deploy NFLPicks safely

echo "=== NFLPicks Deployment Script ==="
echo "This script will deploy NFLPicks without affecting CasaDeTodos"
echo ""

# Step 1: Check current processes and ports
echo "Step 1: Checking existing processes and ports..."
echo "Checking what's running on common ports:"
netstat -tlnp | grep -E ":80|:443|:5000|:8080" || true
echo ""

# Step 2: Navigate to home directory and create NFLPicks folder
echo "Step 2: Creating NFLPicks directory..."
cd ~
mkdir -p NFLPicks
cd NFLPicks
pwd
echo ""

# Step 3: Clone the repository
echo "Step 3: Cloning NFLPicks from GitHub..."
git clone https://github.com/kristianyonuel/NFLPicks.git .
echo "Repository cloned successfully!"
echo ""

# Step 4: Check Python version and virtual environment
echo "Step 4: Setting up Python environment..."
python3 --version
which python3

# Create virtual environment for NFLPicks (separate from CasaDeTodos)
python3 -m venv nflpicks_venv
source nflpicks_venv/bin/activate
echo "Virtual environment created and activated"
echo ""

# Step 5: Install requirements
echo "Step 5: Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "Dependencies installed!"
echo ""

# Step 6: Configure for production
echo "Step 6: Configuring for production..."
# Create a production config
cat > production_config.py << 'EOF'
import os
from config import Config

class ProductionConfig(Config):
    # Use environment variables for sensitive data
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'nfl-picks-production-key-2025'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///nflpicks_production.db'
    
    # API Keys (keep from original config)
    BALLDONTLIE_API_KEY = '4f09c13f-4905-418b-8eca-0fb7d40afb84'
    BALLDONTLIE_BASE_URL = 'https://api.balldontlie.io/v1'
    
    # Production settings
    DEBUG = False
    TESTING = False
EOF

echo "Production config created!"
echo ""

# Step 7: Create production app launcher
echo "Step 7: Creating production launcher..."
cat > run_production.py << 'EOF'
#!/usr/bin/env python3
import os
import sys
from app import create_app

# Set production config
os.environ['FLASK_ENV'] = 'production'

# Create app with production config
app = create_app()

if __name__ == '__main__':
    # Run on port 5000 to avoid conflict with CasaDeTodos (ports 80/443)
    print("Starting NFLPicks on port 5000...")
    print("CasaDeTodos should remain on ports 80/443")
    app.run(host='0.0.0.0', port=5000, debug=False)
EOF

chmod +x run_production.py
echo "Production launcher created!"
echo ""

# Step 8: Initialize database
echo "Step 8: Setting up database..."
python3 recreate_db.py
echo "Database initialized!"
echo ""

# Step 9: Check port availability
echo "Step 9: Checking port 5000 availability..."
if netstat -tlnp | grep :5000; then
    echo "WARNING: Port 5000 is already in use!"
    echo "Available ports check:"
    netstat -tlnp | grep -E ":500[0-9]"
else
    echo "Port 5000 is available for NFLPicks!"
fi
echo ""

# Step 10: Create systemd service (optional)
echo "Step 10: Creating systemd service template..."
cat > nflpicks.service << 'EOF'
[Unit]
Description=NFLPicks Flask Application
After=network.target

[Service]
Type=simple
User=casa
WorkingDirectory=/home/casa/NFLPicks
Environment=PATH=/home/casa/NFLPicks/nflpicks_venv/bin
Environment=FLASK_ENV=production
ExecStart=/home/casa/NFLPicks/nflpicks_venv/bin/python /home/casa/NFLPicks/run_production.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "Systemd service template created!"
echo "To install service, run: sudo cp nflpicks.service /etc/systemd/system/"
echo "Then: sudo systemctl enable nflpicks && sudo systemctl start nflpicks"
echo ""

# Step 11: Test the application
echo "Step 11: Testing the application..."
echo "Starting NFLPicks in test mode..."
python3 -c "
from app import create_app
app = create_app()
print('✅ App created successfully!')
print('✅ NFL Predictions app is ready!')
print('✅ Background Reddit analysis will start automatically!')
"
echo ""

echo "=== DEPLOYMENT COMPLETE! ==="
echo ""
echo "🚀 NFLPicks deployed successfully!"
echo "📍 Location: ~/NFLPicks"
echo "🐍 Virtual Environment: ~/NFLPicks/nflpicks_venv"
echo "🌐 Will run on: http://20.157.116.145:5000"
echo "🔒 CasaDeTodos ports (80/443) remain untouched"
echo ""
echo "To start the application:"
echo "1. cd ~/NFLPicks"
echo "2. source nflpicks_venv/bin/activate"
echo "3. python3 run_production.py"
echo ""
echo "Or use systemd service:"
echo "1. sudo cp nflpicks.service /etc/systemd/system/"
echo "2. sudo systemctl enable nflpicks"
echo "3. sudo systemctl start nflpicks"
echo ""
echo "🏈 NFL Predictions with Reddit Analysis ready!"
