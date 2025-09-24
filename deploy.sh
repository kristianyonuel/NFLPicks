#!/bin/bash

# NFL Analytics Dashboard - Complete Deployment Script
# Run this after cloning the repository and setting up .env file

set -e  # Exit on any error

echo "🚀 Starting NFL Analytics Dashboard Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

print_info "Found package.json - we're in the right directory"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_info "Please edit .env file with your API keys before continuing"
        read -p "Press Enter after you've configured .env file..."
    else
        print_error ".env.example not found. Please create .env manually"
        exit 1
    fi
else
    print_status ".env file exists"
fi

# Update system packages
print_info "Updating system packages..."
sudo apt update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_info "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install nodejs -y
    print_status "Node.js installed: $(node --version)"
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install npm if not installed
if ! command -v npm &> /dev/null; then
    print_info "Installing npm..."
    sudo apt install npm -y
    print_status "npm installed: $(npm --version)"
else
    print_status "npm already installed: $(npm --version)"
fi

# Install project dependencies
print_info "Installing project dependencies..."
npm install
print_status "Dependencies installed successfully"

# Install global dependencies
print_info "Installing global dependencies..."
sudo npm install -g pm2 typescript tsx
print_status "Global dependencies installed"

# Build the application
print_info "Building the application..."
npm run build
print_status "Application built successfully"

# Install and configure Nginx
print_info "Installing and configuring Nginx..."
sudo apt install nginx -y

# Create Nginx configuration
print_info "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/nfl-dashboard > /dev/null <<EOF
server {
    listen 80;
    server_name localhost _;

    # Main application proxy
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host \$host;
    }
}
EOF

# Remove default Nginx site
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    print_status "Removed default Nginx site"
fi

# Enable our site
sudo rm -f /etc/nginx/sites-enabled/nfl-dashboard
sudo ln -s /etc/nginx/sites-available/nfl-dashboard /etc/nginx/sites-enabled/nfl-dashboard
print_status "Nginx site configuration created and enabled"

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Configure firewall
print_info "Configuring firewall..."
sudo ufw allow 80
sudo ufw allow 22  # SSH
print_status "Firewall configured"

# Update .env for production
print_info "Updating .env for production..."
if [ -f ".env" ]; then
    # Backup original .env
    cp .env .env.backup
    
    # Update NODE_ENV to production
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
    
    # Ensure PORT is set to 5000
    if ! grep -q "PORT=" .env; then
        echo "PORT=5000" >> .env
    else
        sed -i 's/PORT=.*/PORT=5000/' .env
    fi
    
    print_status ".env updated for production"
else
    print_error ".env file not found!"
    exit 1
fi

# Stop any existing PM2 processes
print_info "Stopping any existing PM2 processes..."
pm2 delete nfl-dashboard 2>/dev/null || true

# Start the application with PM2
print_info "Starting application with PM2..."
pm2 start server/index.ts --name "nfl-dashboard" --interpreter tsx
print_status "Application started with PM2"

# Save PM2 configuration
pm2 save
print_status "PM2 configuration saved"

# Set PM2 to start on boot
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
print_status "PM2 configured to start on boot"

# Start Nginx
print_info "Starting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx
print_status "Nginx started and enabled"

# Wait a moment for services to start
sleep 3

# Check if application is running
print_info "Checking application status..."
if pm2 show nfl-dashboard | grep -q "online"; then
    print_status "Application is running successfully"
else
    print_warning "Application may not be running properly"
    pm2 logs nfl-dashboard --lines 10
fi

# Check if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running successfully"
else
    print_error "Nginx is not running"
    sudo systemctl status nginx
fi

# Test the application
print_info "Testing application accessibility..."
if curl -s http://localhost > /dev/null; then
    print_status "Application is accessible via HTTP"
else
    print_warning "Application may not be accessible via HTTP"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "🎉 Deployment Complete!"
echo "=================================="
print_status "NFL Analytics Dashboard is now running"
echo ""
echo "📋 Access Information:"
echo "   Local:    http://localhost"
echo "   External: http://$SERVER_IP"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:     pm2 logs nfl-dashboard"
echo "   Restart app:   pm2 restart nfl-dashboard"
echo "   Stop app:      pm2 stop nfl-dashboard"
echo "   App status:    pm2 status"
echo "   Nginx status:  sudo systemctl status nginx"
echo ""
echo "📁 Important Files:"
echo "   App config:    .env"
echo "   Nginx config:  /etc/nginx/sites-available/nfl-dashboard"
echo "   PM2 config:    ~/.pm2/"
echo ""
print_info "Don't forget to refresh data in the dashboard after first access!"
echo ""