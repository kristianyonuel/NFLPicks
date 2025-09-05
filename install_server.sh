#!/bin/bash

# NFLPicks Remote Server Installation Script with Error Handling
# This script handles metadata-generation-failed errors and other common installation issues

set -e  # Exit on any error

echo "🔧 NFLPicks Remote Server Installation Script"
echo "=============================================="

# Configuration
VENV_NAME="nflpicks_env"
PYTHON_CMD="python3"
PIP_CMD="pip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to get system info
get_system_info() {
    print_status "Detecting system information..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_NAME=$NAME
        OS_VERSION=$VERSION_ID
    else
        OS_NAME=$(uname -s)
        OS_VERSION=$(uname -r)
    fi
    
    ARCH=$(uname -m)
    
    echo "OS: $OS_NAME $OS_VERSION"
    echo "Architecture: $ARCH"
    echo "Python: $($PYTHON_CMD --version 2>&1)"
}

# Function to install system dependencies
install_system_dependencies() {
    print_status "Installing system dependencies..."
    
    # Detect package manager and install dependencies
    if command_exists apt-get; then
        print_status "Detected Debian/Ubuntu system"
        sudo apt-get update
        sudo apt-get install -y \
            python3-dev \
            python3-pip \
            python3-venv \
            build-essential \
            gcc \
            g++ \
            make \
            libc6-dev \
            libssl-dev \
            libffi-dev \
            libxml2-dev \
            libxslt1-dev \
            zlib1g-dev \
            curl \
            wget
            
    elif command_exists yum; then
        print_status "Detected RHEL/CentOS system"
        sudo yum update -y
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y \
            python3-devel \
            python3-pip \
            gcc \
            gcc-c++ \
            make \
            openssl-devel \
            libffi-devel \
            libxml2-devel \
            libxslt-devel \
            zlib-devel \
            curl \
            wget
            
    elif command_exists dnf; then
        print_status "Detected Fedora system"
        sudo dnf update -y
        sudo dnf groupinstall -y "Development Tools"
        sudo dnf install -y \
            python3-devel \
            python3-pip \
            gcc \
            gcc-c++ \
            make \
            openssl-devel \
            libffi-devel \
            libxml2-devel \
            libxslt-devel \
            zlib-devel \
            curl \
            wget
            
    elif command_exists apk; then
        print_status "Detected Alpine Linux system"
        sudo apk update
        sudo apk add --no-cache \
            python3-dev \
            py3-pip \
            gcc \
            g++ \
            make \
            musl-dev \
            linux-headers \
            openssl-dev \
            libffi-dev \
            libxml2-dev \
            libxslt-dev \
            zlib-dev \
            curl \
            wget
    else
        print_warning "Could not detect package manager. Please install build tools manually:"
        print_warning "- Python 3 development headers"
        print_warning "- GCC/G++ compiler"
        print_warning "- Make"
        print_warning "- OpenSSL development libraries"
        print_warning "- libffi development libraries"
    fi
    
    print_success "System dependencies installed"
}

# Function to create virtual environment
setup_virtual_environment() {
    print_status "Setting up virtual environment..."
    
    # Remove existing venv if it exists
    if [ -d "$VENV_NAME" ]; then
        print_warning "Removing existing virtual environment..."
        rm -rf "$VENV_NAME"
    fi
    
    # Create new virtual environment
    $PYTHON_CMD -m venv "$VENV_NAME"
    
    # Activate virtual environment
    source "$VENV_NAME/bin/activate"
    
    # Upgrade pip, setuptools, and wheel to latest versions
    print_status "Upgrading pip, setuptools, and wheel..."
    pip install --upgrade pip setuptools wheel
    
    print_success "Virtual environment created and activated"
}

# Function to install packages with fallback strategies
install_packages_robust() {
    print_status "Installing Python packages with robust error handling..."
    
    # Strategy 1: Try server-optimized requirements first
    if [ -f "requirements_server.txt" ]; then
        print_status "Attempting installation with server-optimized requirements..."
        if pip install -r requirements_server.txt --prefer-binary --no-cache-dir; then
            print_success "Server-optimized requirements installed successfully"
            return 0
        else
            print_warning "Server-optimized requirements failed, trying fallback strategies..."
        fi
    fi
    
    # Strategy 2: Try original requirements with wheel preferences
    if [ -f "requirements.txt" ]; then
        print_status "Attempting installation with wheel preference..."
        if pip install -r requirements.txt --prefer-binary --no-cache-dir --force-reinstall; then
            print_success "Original requirements installed successfully"
            return 0
        else
            print_warning "Wheel preference failed, trying individual package installation..."
        fi
    fi
    
    # Strategy 3: Install packages individually with specific handling
    print_status "Installing packages individually..."
    
    # Core packages that rarely fail
    CORE_PACKAGES=(
        "Flask==3.0.0"
        "requests==2.31.0"
        "python-dotenv==1.0.0"
        "SQLAlchemy==2.0.25"
        "Flask-SQLAlchemy==3.1.1"
        "beautifulsoup4==4.12.2"
        "feedparser==6.0.10"
        "vaderSentiment==3.3.2"
        "schedule==1.2.0"
    )
    
    for package in "${CORE_PACKAGES[@]}"; do
        print_status "Installing $package..."
        if ! pip install "$package" --prefer-binary --no-cache-dir; then
            print_error "Failed to install $package"
            return 1
        fi
    done
    
    # Data science packages with special handling
    print_status "Installing data science packages..."
    
    # Try to install numpy first (many packages depend on it)
    if ! pip install "numpy==1.24.4" --prefer-binary --no-cache-dir; then
        print_warning "Failed to install numpy with wheels, trying different version..."
        pip install "numpy>=1.21.0,<1.25.0" --prefer-binary --no-cache-dir || {
            print_error "Failed to install numpy"
            return 1
        }
    fi
    
    # Install pandas
    if ! pip install "pandas==2.0.3" --prefer-binary --no-cache-dir; then
        print_warning "Failed to install pandas 2.0.3, trying alternative..."
        pip install "pandas>=1.5.0,<2.1.0" --prefer-binary --no-cache-dir || {
            print_warning "Could not install pandas, skipping..."
        }
    fi
    
    # Install scikit-learn
    if ! pip install "scikit-learn==1.3.2" --prefer-binary --no-cache-dir; then
        print_warning "Failed to install scikit-learn 1.3.2, trying alternative..."
        pip install "scikit-learn>=1.0.0,<1.4.0" --prefer-binary --no-cache-dir || {
            print_warning "Could not install scikit-learn, skipping..."
        }
    fi
    
    # Install plotting library
    if ! pip install "plotly==5.17.0" --prefer-binary --no-cache-dir; then
        print_warning "Failed to install plotly, trying alternative..."
        pip install "matplotlib>=3.5.0" --prefer-binary --no-cache-dir || {
            print_warning "Could not install plotting library, skipping..."
        }
    fi
    
    print_success "Package installation completed with available packages"
}

# Function to create minimal requirements if full installation fails
create_minimal_setup() {
    print_warning "Creating minimal setup with essential packages only..."
    
    MINIMAL_PACKAGES=(
        "Flask"
        "requests"
        "SQLAlchemy"
        "Flask-SQLAlchemy"
        "beautifulsoup4"
        "python-dotenv"
        "vaderSentiment"
    )
    
    for package in "${MINIMAL_PACKAGES[@]}"; do
        pip install "$package" --prefer-binary --no-cache-dir
    done
    
    print_success "Minimal setup completed"
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Test core imports
    $PYTHON_CMD -c "
import flask
import requests
import sqlalchemy
print('✅ Core packages imported successfully')
"
    
    # Test app import
    if [ -f "app.py" ]; then
        $PYTHON_CMD -c "
try:
    import app
    print('✅ App module imported successfully')
except Exception as e:
    print(f'⚠️ App import warning: {e}')
"
    fi
    
    print_success "Installation verification completed"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ -f "recreate_db.py" ]; then
        if $PYTHON_CMD recreate_db.py; then
            print_success "Database setup completed"
        else
            print_warning "Database setup had issues, but continuing..."
        fi
    else
        print_warning "recreate_db.py not found, skipping database setup"
    fi
}

# Main installation function
main() {
    echo "Starting NFLPicks installation..."
    
    # Get system information
    get_system_info
    
    # Install system dependencies
    if ! install_system_dependencies; then
        print_error "Failed to install system dependencies"
        exit 1
    fi
    
    # Setup virtual environment
    if ! setup_virtual_environment; then
        print_error "Failed to setup virtual environment"
        exit 1
    fi
    
    # Install packages with robust error handling
    if ! install_packages_robust; then
        print_warning "Robust installation failed, trying minimal setup..."
        create_minimal_setup
    fi
    
    # Verify installation
    verify_installation
    
    # Setup database
    setup_database
    
    echo
    print_success "🎉 NFLPicks installation completed!"
    echo
    print_status "To start the application:"
    print_status "1. Activate virtual environment: source $VENV_NAME/bin/activate"
    print_status "2. Run the app: python app.py --host 0.0.0.0 --port 5000"
    echo
    print_status "Or use the automated script: ./setup_and_run.sh"
}

# Run main function
main "$@"
