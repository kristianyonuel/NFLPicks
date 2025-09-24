#!/bin/bash

# NFL Analytics Dashboard - Clean Install on Port 5000
# Simple deployment directly on port 5000

set -e

echo "🚀 NFL Analytics Dashboard - Clean Install on Port 5000"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if in project directory
if [ ! -f "package.json" ]; then
    print_error "Run this from the NFL dashboard project directory"
    print_info "First run: git clone https://github.com/kristianyonuel/nfltest.git && cd nfltest"
    exit 1
fi

print_status "Found project directory"

# Update system
print_info "Updating system packages..."
sudo apt update

# Install Node.js 20 LTS
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install nodejs -y
fi

NODE_VERSION=$(node --version)
print_status "Node.js ready: $NODE_VERSION"

# Install global tools
print_info "Installing PM2 and TypeScript tools..."
sudo npm install -g pm2 tsx typescript

# Set up environment
if [ ! -f ".env" ]; then
    print_info "Setting up environment file..."
    cp .env.example .env
    print_warning "Please edit .env file with your OpenAI API key"
    print_info "Opening nano editor - add your API key and save..."
    sleep 2
    nano .env
fi

# Configure for production on port 5000
print_info "Configuring for production on port 5000..."
sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
sed -i 's/PORT=.*/PORT=5000/' .env

# Install dependencies
print_info "Installing project dependencies..."
npm install

# Build for production
print_info "Building application for production..."
npm run build

# Stop any existing processes
print_info "Cleaning up any existing processes..."
pm2 delete nfl-dashboard 2>/dev/null || true

# Start the application
print_info "Starting NFL Analytics Dashboard on port 5000..."
pm2 start server/index.ts --name "nfl-dashboard" --interpreter tsx

# Save PM2 configuration
pm2 save

# Configure PM2 to start on boot
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Configure firewall
print_info "Configuring firewall for port 5000..."
sudo ufw allow 5000 2>/dev/null || print_warning "UFW not available, firewall not configured"
sudo ufw allow 22 2>/dev/null || true  # Keep SSH access

# Wait for startup
sleep 3

# Check status
print_info "Checking application status..."
pm2 status

# Test the application
if curl -s http://localhost:5000 > /dev/null; then
    print_status "Application is responding on port 5000"
else
    print_warning "Application may still be starting up..."
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "🎉 NFL Analytics Dashboard Deployed Successfully!"
echo "=================================================="
print_status "Application is running on port 5000"
echo ""
echo "🌐 Access your NFL Analytics Dashboard:"
echo "   Local:    http://localhost:5000"
echo "   External: http://$SERVER_IP:5000"
echo ""
echo "🔧 Management Commands:"
echo "   Status:   pm2 status"
echo "   Logs:     pm2 logs nfl-dashboard"
echo "   Restart:  pm2 restart nfl-dashboard"
echo "   Stop:     pm2 stop nfl-dashboard"
echo ""
echo "📋 Next Steps:"
echo "1. Open http://$SERVER_IP:5000 in your browser"
echo "2. Click 'Refresh Data' to load NFL Week 4 games"
echo "3. Explore the dashboard features and expert analysis"
echo ""
print_info "Your NFL Analytics Dashboard is ready!"
echo ""