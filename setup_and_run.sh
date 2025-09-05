#!/bin/bash

# NFLPicks Remote Server Setup and Run Script
# This script sets up the complete environment and runs the application
# Usage: ./setup_and_run.sh [port] [host]
# Example: ./setup_and_run.sh 5000 0.0.0.0

set -e  # Exit on any error

# Configuration
DEFAULT_PORT=5000
DEFAULT_HOST="0.0.0.0"
APP_NAME="NFLPicks"
VENV_NAME="nflpicks_env"
PYTHON_VERSION="python3"

# Parse command line arguments
PORT=${1:-$DEFAULT_PORT}
HOST=${2:-$DEFAULT_HOST}

echo "=========================================="
echo "🏈 NFLPicks Remote Server Setup & Run"
echo "=========================================="
echo "Port: $PORT"
echo "Host: $HOST"
echo "Python: $PYTHON_VERSION"
echo "Virtual Environment: $VENV_NAME"
echo "=========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    if command_exists netstat; then
        if netstat -tuln | grep -q ":$1 "; then
            echo "❌ Port $1 is already in use!"
            echo "Please choose a different port or stop the service using that port."
            exit 1
        fi
    elif command_exists ss; then
        if ss -tuln | grep -q ":$1 "; then
            echo "❌ Port $1 is already in use!"
            echo "Please choose a different port or stop the service using that port."
            exit 1
        fi
    else
        echo "⚠️  Cannot check if port is in use (netstat/ss not found)"
    fi
}

# Function to install system dependencies
install_system_deps() {
    echo "📦 Checking system dependencies..."
    
    # Check for Python
    if ! command_exists $PYTHON_VERSION; then
        echo "❌ $PYTHON_VERSION not found!"
        echo "Please install Python 3.8+ first:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install python3 python3-pip python3-venv"
        echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
        echo "  Or download from: https://www.python.org/downloads/"
        exit 1
    fi
    
    # Check Python version
    PYTHON_VER=$($PYTHON_VERSION --version 2>&1 | cut -d' ' -f2)
    echo "✅ Found Python $PYTHON_VER"
    
    # Check for pip
    if ! command_exists pip3; then
        echo "❌ pip3 not found!"
        echo "Please install pip3 first"
        exit 1
    fi
    
    # Check for venv module
    if ! $PYTHON_VERSION -m venv --help >/dev/null 2>&1; then
        echo "❌ Python venv module not found!"
        echo "Please install python3-venv package"
        exit 1
    fi
    
    echo "✅ All system dependencies satisfied"
}

# Function to setup virtual environment
setup_venv() {
    echo "🔧 Setting up virtual environment..."
    
    # Remove existing venv if it exists
    if [ -d "$VENV_NAME" ]; then
        echo "🗑️  Removing existing virtual environment..."
        rm -rf "$VENV_NAME"
    fi
    
    # Create new virtual environment
    echo "🏗️  Creating virtual environment: $VENV_NAME"
    $PYTHON_VERSION -m venv "$VENV_NAME"
    
    # Activate virtual environment
    echo "🔌 Activating virtual environment..."
    source "$VENV_NAME/bin/activate"
    
    # Upgrade pip
    echo "⬆️  Upgrading pip..."
    pip install --upgrade pip
    
    echo "✅ Virtual environment ready"
}

# Function to install Python packages
install_packages() {
    echo "📦 Installing Python packages..."
    
    # Try server-optimized requirements first
    if [ -f "requirements_server.txt" ]; then
        echo "📥 Trying server-optimized requirements..."
        if pip install -r requirements_server.txt --prefer-binary --no-cache-dir; then
            echo "✅ Server-optimized packages installed"
            return 0
        else
            echo "⚠️ Server-optimized requirements failed, trying standard requirements..."
        fi
    fi
    
    # Fall back to standard requirements
    if [ -f "requirements.txt" ]; then
        echo "📥 Installing packages from requirements.txt..."
        if pip install -r requirements.txt --prefer-binary --no-cache-dir; then
            echo "✅ Standard packages installed"
            return 0
        else
            echo "❌ Failed to install packages!"
            echo "💡 Try running the robust installer: ./install_server.sh"
            return 1
        fi
    else
        echo "❌ No requirements file found!"
        echo "Please ensure you're in the correct directory with requirements.txt"
        return 1
    fi
}

# Function to setup database
setup_database() {
    echo "🗄️  Setting up database..."
    
    # Check if recreate_db.py exists
    if [ -f "recreate_db.py" ]; then
        echo "🔄 Running database recreation script..."
        python recreate_db.py
    else
        echo "⚠️  recreate_db.py not found, skipping database setup"
        echo "You may need to manually initialize the database"
    fi
    
    echo "✅ Database setup complete"
}

# Function to validate environment
validate_environment() {
    echo "🔍 Validating environment..."
    
    # Check if main app file exists
    if [ ! -f "app.py" ]; then
        echo "❌ app.py not found!"
        echo "Please ensure you're in the correct directory"
        exit 1
    fi
    
    # Test import of main modules
    echo "🧪 Testing Python imports..."
    python -c "import flask; print('✅ Flask import successful')" || {
        echo "❌ Flask import failed"
        exit 1
    }
    
    python -c "import app; print('✅ App import successful')" || {
        echo "❌ App import failed - check your code for syntax errors"
        exit 1
    }
    
    echo "✅ Environment validation complete"
}

# Function to start the application
start_application() {
    echo "🚀 Starting NFLPicks application..."
    echo "📍 URL: http://$HOST:$PORT"
    echo "🛑 Press Ctrl+C to stop the application"
    echo "=========================================="
    
    # Set environment variables
    export FLASK_APP=app.py
    export FLASK_ENV=production
    export FLASK_DEBUG=false
    
    # Start the application
    python app.py --host="$HOST" --port="$PORT"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [port] [host]"
    echo "Examples:"
    echo "  $0                    # Run on default port 5000, host 0.0.0.0"
    echo "  $0 8080               # Run on port 8080, host 0.0.0.0"
    echo "  $0 5000 127.0.0.1     # Run on port 5000, host 127.0.0.1"
    echo ""
    echo "Environment will be created in: $VENV_NAME/"
    echo "Make sure requirements.txt exists in current directory"
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    if [ -n "$VIRTUAL_ENV" ]; then
        deactivate 2>/dev/null || true
    fi
    echo "👋 Goodbye!"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Main execution
main() {
    # Check for help flag
    if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_usage
        exit 0
    fi
    
    # Check port availability
    check_port "$PORT"
    
    # Install system dependencies
    install_system_deps
    
    # Setup virtual environment
    setup_venv
    
    # Install packages
    install_packages
    
    # Setup database
    setup_database
    
    # Validate environment
    validate_environment
    
    # Start application
    start_application
}

# Run main function
main "$@"
