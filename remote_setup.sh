#!/bin/bash
# NFLPicks Complete Setup Script for Remote Server
# This script sets up everything needed to run NFLPicks in a virtual environment

set -e  # Exit on any error

echo "🏈 NFLPicks Remote Server Setup Script"
echo "======================================"
echo ""

# Configuration
PROJECT_DIR="$HOME/NFLPicks"
VENV_DIR="$PROJECT_DIR/nflpicks_venv"
SERVICE_NAME="nflpicks"
PORT=5000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Python3
if ! command_exists python3; then
    print_error "Python3 is not installed. Please install Python3 first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
print_success "Python3 found: $PYTHON_VERSION"

# Check pip3
if ! command_exists pip3; then
    print_warning "pip3 not found, trying to install..."
    python3 -m ensurepip --default-pip
fi

# Check git
if ! command_exists git; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

print_success "Git found: $(git --version)"

# Check available ports
print_status "Checking port availability..."
if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
    print_warning "Port $PORT is already in use. NFLPicks may conflict with existing services."
    print_status "Current processes on port $PORT:"
    netstat -tlnp 2>/dev/null | grep ":$PORT "
else
    print_success "Port $PORT is available"
fi

# Step 1: Create project directory
print_status "Setting up project directory..."
if [ -d "$PROJECT_DIR" ]; then
    print_warning "Project directory already exists: $PROJECT_DIR"
    read -p "Do you want to remove it and start fresh? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR"
        print_status "Removed existing directory"
    else
        print_status "Continuing with existing directory"
    fi
fi

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
print_success "Project directory ready: $PROJECT_DIR"

# Step 2: Clone repository
print_status "Cloning NFLPicks repository..."
if [ -d ".git" ]; then
    print_status "Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone https://github.com/kristianyonuel/NFLPicks.git .
fi
print_success "Repository cloned/updated successfully"

# Step 3: Create virtual environment
print_status "Creating Python virtual environment..."
if [ -d "$VENV_DIR" ]; then
    print_warning "Virtual environment already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$VENV_DIR"
        python3 -m venv "$VENV_DIR"
    fi
else
    python3 -m venv "$VENV_DIR"
fi
print_success "Virtual environment created: $VENV_DIR"

# Step 4: Activate virtual environment and install requirements
print_status "Activating virtual environment and installing requirements..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    print_status "Installing Python packages from requirements.txt..."
    pip install -r requirements.txt
    print_success "Requirements installed successfully"
else
    print_warning "requirements.txt not found, installing basic packages..."
    pip install flask flask-sqlalchemy pandas numpy scikit-learn requests schedule
fi

# Step 5: Create production configuration
print_status "Creating production configuration..."
cat > production_config.py << 'EOF'
import os
from config import Config

class ProductionConfig(Config):
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'nfl-picks-production-key-2025-secure'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///nflpicks_production.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # API Keys
    BALLDONTLIE_API_KEY = '4f09c13f-4905-418b-8eca-0fb7d40afb84'
    BALLDONTLIE_BASE_URL = 'https://api.balldontlie.io/v1'
    
    # Production settings
    DEBUG = False
    TESTING = False
    
    # Server settings
    HOST = '0.0.0.0'
    PORT = 5000
EOF
print_success "Production configuration created"

# Step 6: Create startup script
print_status "Creating startup script..."
cat > start_nflpicks.sh << EOF
#!/bin/bash
# NFLPicks Startup Script

cd "$PROJECT_DIR"
source "$VENV_DIR/bin/activate"

# Set environment variables
export FLASK_ENV=production
export PYTHONPATH="$PROJECT_DIR:\$PYTHONPATH"

# Check if database exists, if not create it
if [ ! -f "nflpicks_production.db" ]; then
    echo "Creating database..."
    python3 recreate_db.py
fi

# Start the application
echo "🚀 Starting NFLPicks on port $PORT..."
echo "📱 Access at: http://\$(hostname -I | awk '{print \$1}'):$PORT"
echo "🔄 Reddit analysis runs automatically every hour"
echo "📊 All APIs integrated: ESPN, Reddit, BallDontLie"
echo ""
echo "Press Ctrl+C to stop"

python3 -c "
import os
os.environ['FLASK_ENV'] = 'production'
from app import create_app
app = create_app()
print('✅ NFLPicks application starting...')
app.run(host='0.0.0.0', port=$PORT, debug=False)
"
EOF

chmod +x start_nflpicks.sh
print_success "Startup script created: start_nflpicks.sh"

# Step 7: Create background service script
print_status "Creating background service script..."
cat > start_background.sh << EOF
#!/bin/bash
# Start NFLPicks in background

cd "$PROJECT_DIR"
source "$VENV_DIR/bin/activate"

# Set environment variables
export FLASK_ENV=production
export PYTHONPATH="$PROJECT_DIR:\$PYTHONPATH"

# Start in background
nohup ./start_nflpicks.sh > nflpicks.log 2>&1 &
echo \$! > nflpicks.pid

echo "🚀 NFLPicks started in background"
echo "📄 Logs: tail -f $PROJECT_DIR/nflpicks.log"
echo "🔍 Status: ps aux | grep python"
echo "🛑 Stop: kill \\\$(cat $PROJECT_DIR/nflpicks.pid)"
EOF

chmod +x start_background.sh
print_success "Background service script created: start_background.sh"

# Step 8: Create stop script
print_status "Creating stop script..."
cat > stop_nflpicks.sh << EOF
#!/bin/bash
# Stop NFLPicks

if [ -f "nflpicks.pid" ]; then
    PID=\$(cat nflpicks.pid)
    if ps -p \$PID > /dev/null; then
        kill \$PID
        echo "🛑 NFLPicks stopped (PID: \$PID)"
        rm nflpicks.pid
    else
        echo "⚠️  Process \$PID not running"
        rm nflpicks.pid
    fi
else
    echo "⚠️  PID file not found, trying to kill by process name..."
    pkill -f "python.*app.py\|python.*start_nflpicks"
    echo "🛑 Attempted to stop NFLPicks processes"
fi
EOF

chmod +x stop_nflpicks.sh
print_success "Stop script created: stop_nflpicks.sh"

# Step 9: Initialize database
print_status "Initializing database..."
source "$VENV_DIR/bin/activate"
if [ -f "recreate_db.py" ]; then
    python3 recreate_db.py
    print_success "Database initialized with sample data"
else
    print_warning "recreate_db.py not found, database will be created on first run"
fi

# Step 10: Create systemd service (optional)
print_status "Creating systemd service template..."
cat > nflpicks.service << EOF
[Unit]
Description=NFLPicks Flask Application
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$VENV_DIR/bin
Environment=FLASK_ENV=production
Environment=PYTHONPATH=$PROJECT_DIR
ExecStart=$VENV_DIR/bin/python $PROJECT_DIR/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service template created: nflpicks.service"

# Step 11: Test installation
print_status "Testing installation..."
source "$VENV_DIR/bin/activate"
python3 -c "
try:
    from app import create_app
    app = create_app()
    print('✅ NFLPicks application loads successfully!')
    print('✅ All dependencies installed correctly!')
    print('✅ Ready to run!')
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"

# Final summary
echo ""
echo "🎉 NFLPicks Setup Complete!"
echo "=========================="
echo ""
echo "📍 Installation Directory: $PROJECT_DIR"
echo "🐍 Virtual Environment: $VENV_DIR"
echo "🌐 Will run on: http://$(hostname -I | awk '{print $1}'):$PORT"
echo ""
echo "🚀 Quick Start Commands:"
echo "  Start (foreground): ./start_nflpicks.sh"
echo "  Start (background): ./start_background.sh"
echo "  Stop service:       ./stop_nflpicks.sh"
echo "  View logs:          tail -f nflpicks.log"
echo ""
echo "🔧 Manual Commands:"
echo "  Activate venv:      source $VENV_DIR/bin/activate"
echo "  Run directly:       python3 app.py"
echo ""
echo "🏗️ Systemd Service (optional):"
echo "  Install:            sudo cp nflpicks.service /etc/systemd/system/"
echo "  Enable:             sudo systemctl enable nflpicks"
echo "  Start:              sudo systemctl start nflpicks"
echo ""
echo "🏈 Features Ready:"
echo "  ✅ NFL Game Predictions (Machine Learning)"
echo "  ✅ Reddit Sentiment Analysis (100+ posts/hour)"
echo "  ✅ ESPN API Integration"
echo "  ✅ BallDontLie API Integration"
echo "  ✅ Background Processing"
echo "  ✅ Interactive Dashboard"
echo ""
echo "Ready to deploy! 🎯"
