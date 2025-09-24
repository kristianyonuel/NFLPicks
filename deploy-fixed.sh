#!/bin/bash

# NFL Analytics Dashboard - Fixed Deployment Script
# Handles Nginx configuration conflicts and port conflicts

set -e  # Exit on any error

echo "🚀 Starting NFL Analytics Dashboard Deployment (Fixed Version)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check for port conflicts
print_info "Checking for port conflicts..."
if sudo lsof -i :80 > /dev/null 2>&1; then
    print_warning "Port 80 is already in use"
    sudo lsof -i :80
fi

if sudo lsof -i :443 > /dev/null 2>&1; then
    print_warning "Port 443 is already in use (Python detected)"
    sudo lsof -i :443
fi

# Choose alternative port for our app
APP_PORT=8080
print_info "Using port $APP_PORT for the application to avoid conflicts"

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

# Update .env for production with new port
print_info "Updating .env for production..."
if [ -f ".env" ]; then
    # Backup original .env
    cp .env .env.backup
    
    # Update NODE_ENV to production
    sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
    
    # Set PORT to avoid conflicts
    if ! grep -q "PORT=" .env; then
        echo "PORT=$APP_PORT" >> .env
    else
        sed -i "s/PORT=.*/PORT=$APP_PORT/" .env
    fi
    
    print_status ".env updated for production (PORT=$APP_PORT)"
else
    print_error ".env file not found!"
    exit 1
fi

# Fix Nginx configuration issues
print_info "Fixing Nginx configuration..."

# Stop Nginx if running
sudo systemctl stop nginx 2>/dev/null || true

# Backup original nginx.conf
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Reset Nginx to default configuration
sudo apt remove --purge nginx nginx-common -y
sudo apt install nginx -y

print_status "Nginx reinstalled with clean configuration"

# Create our site configuration (avoid conflicts)
print_info "Creating Nginx site configuration..."
sudo tee /etc/nginx/sites-available/nfl-dashboard > /dev/null <<EOF
server {
    listen 80;
    server_name localhost _;

    # Main application proxy
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
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
        proxy_pass http://127.0.0.1:$APP_PORT/health;
        proxy_set_header Host \$host;
    }
}
EOF

# Remove default site and enable ours
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/nfl-dashboard /etc/nginx/sites-enabled/nfl-dashboard

print_status "Nginx site configuration created"

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    # Show the error
    sudo nginx -t
    exit 1
fi

# Configure firewall
print_info "Configuring firewall..."
sudo ufw allow 80
sudo ufw allow 22  # SSH
sudo ufw allow $APP_PORT  # Our app port
print_status "Firewall configured"

# Stop any existing PM2 processes
print_info "Stopping any existing PM2 processes..."
pm2 delete nfl-dashboard 2>/dev/null || true

# Start the application with PM2
print_info "Starting application with PM2 on port $APP_PORT..."
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
sudo systemctl start nginx
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
sleep 2
if curl -s http://localhost:$APP_PORT > /dev/null; then
    print_status "Application is accessible directly on port $APP_PORT"
else
    print_warning "Application may not be accessible directly"
fi

if curl -s http://localhost > /dev/null; then
    print_status "Application is accessible via Nginx on port 80"
else
    print_warning "Application may not be accessible via Nginx"
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "🎉 Deployment Complete!"
echo "=================================="
print_status "NFL Analytics Dashboard is now running"
echo ""
echo "📋 Access Information:"
echo "   Via Nginx:    http://localhost (port 80)"
echo "   Via Nginx:    http://$SERVER_IP (port 80)"
echo "   Direct App:   http://localhost:$APP_PORT"
echo "   Direct App:   http://$SERVER_IP:$APP_PORT"
echo ""
print_warning "Note: Port 443 is occupied by your Python application"
print_warning "This deployment uses port 80 for HTTP access"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:     pm2 logs nfl-dashboard"
echo "   Restart app:   pm2 restart nfl-dashboard"
echo "   Stop app:      pm2 stop nfl-dashboard"
echo "   App status:    pm2 status"
echo "   Nginx status:  sudo systemctl status nginx"
echo ""
echo "📁 Important Files:"
echo "   App config:    .env (PORT=$APP_PORT)"
echo "   Nginx config:  /etc/nginx/sites-available/nfl-dashboard"
echo "   PM2 config:    ~/.pm2/"
echo ""
echo "🔍 Troubleshooting:"
echo "   Test app:      curl http://localhost:$APP_PORT"
echo "   Test nginx:    curl http://localhost"
echo "   Check ports:   sudo lsof -i :80 && sudo lsof -i :$APP_PORT"
echo ""
print_info "Don't forget to refresh data in the dashboard after first access!"
echo ""